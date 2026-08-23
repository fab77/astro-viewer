/*
 * AstroViewer
 * Copyright (C) Fabrizio Giordano
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-AstroViewer-Commercial
 *
 * AstroViewer is dual-licensed under the GNU Affero General Public License
 * version 3 and a separate commercial license.
 *
 * See LICENSE.md, LICENSE-AGPL.md, and LICENSE-COMMERCIAL.md for details.
 */

import { FITSHeaderManager, FITSParser } from "jsfitsio";

export interface FitsTileData {
  width: number;
  height: number;
  pixels: Float32Array;
  dataMin: number | null;
  dataMax: number | null;
}

export async function loadFitsTile(url: string): Promise<FitsTileData> {
  const fitsFile = await FITSParser.loadFITSFile(url);

  if (!fitsFile?.primaryHDU) {
    throw new Error(`Unable to load FITS tile: ${url}`);
  }

  const image = fitsFile.primaryHDU;

  if (image.naxis !== 2) {
    throw new Error(
      `Expected a 2D FITS tile, got NAXIS=${image.naxis}: ${url}`,
    );
  }

  const [width, height] = image.shape;

  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width <= 0 ||
    height <= 0
  ) {
    throw new Error(`Invalid FITS tile dimensions: ${url}`);
  }

  const data = image.typedData;

  if (!data || data.length !== width * height) {
    throw new Error(`Invalid FITS tile payload: ${url}`);
  }

  if (data instanceof BigInt64Array) {
    throw new Error(
      `BITPIX=64 FITS tiles are not supported for HiPS rendering: ${url}`,
    );
  }

  const bscale =
    getNumericHeaderValue(image.header, FITSHeaderManager.BSCALE) ?? 1;

  const bzero =
    getNumericHeaderValue(image.header, FITSHeaderManager.BZERO) ?? 0;

  const blank = getNumericHeaderValue(image.header, FITSHeaderManager.BLANK);

  const dataMin = getNumericHeaderValue(
    image.header,
    FITSHeaderManager.DATAMIN,
  );

  const dataMax = getNumericHeaderValue(
    image.header,
    FITSHeaderManager.DATAMAX,
  );

  const pixels = new Float32Array(data.length);

  for (let i = 0; i < data.length; i++) {
    const rawValue = data[i];

    if (!Number.isFinite(rawValue) || (blank !== null && rawValue === blank)) {
      pixels[i] = Number.NaN;
      continue;
    }

    pixels[i] = rawValue * bscale + bzero;
  }

  return {
    width,
    height,
    pixels,
    dataMin,
    dataMax,
  };
}

function getNumericHeaderValue(
  header: FITSHeaderManager,
  key: string,
): number | null {
  const item = header.findById(key);

  if (!item) {
    return null;
  }

  const value = Number(item.value);

  return Number.isFinite(value) ? value : null;
}
