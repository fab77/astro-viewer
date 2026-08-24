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
  physicalMin: number | null;
  physicalMax: number | null;
  robustMin: number | null;
  robustMax: number | null;
}

const ROBUST_SAMPLE_COUNT = 8192;
const ROBUST_LOW_PERCENTILE = 0.005;
const ROBUST_HIGH_PERCENTILE = 0.995;

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
  let physicalMin: number | null = null;
  let physicalMax: number | null = null;
  const robustSamples: number[] = [];
  const sampleStep = Math.max(1, Math.floor(data.length / ROBUST_SAMPLE_COUNT));

  for (let i = 0; i < data.length; i++) {
    const rawValue = data[i];

    if (!Number.isFinite(rawValue) || (blank !== null && rawValue === blank)) {
      pixels[i] = Number.NaN;
      continue;
    }

    const physicalValue = rawValue * bscale + bzero;
    pixels[i] = physicalValue;

    if (Number.isFinite(physicalValue)) {
      physicalMin =
        physicalMin === null ? physicalValue : Math.min(physicalMin, physicalValue);
      physicalMax =
        physicalMax === null ? physicalValue : Math.max(physicalMax, physicalValue);

      if (i % sampleStep === 0) {
        robustSamples.push(physicalValue);
      }
    }
  }

  const robustRange = computeRobustRange(robustSamples);

  return {
    width,
    height,
    pixels,
    dataMin,
    dataMax,
    physicalMin,
    physicalMax,
    robustMin: robustRange?.min ?? null,
    robustMax: robustRange?.max ?? null,
  };
}

function computeRobustRange(samples: number[]): { min: number; max: number } | null {
  if (samples.length === 0) {
    return null;
  }

  samples.sort((a, b) => a - b);

  const min = percentile(samples, ROBUST_LOW_PERCENTILE);
  const max = percentile(samples, ROBUST_HIGH_PERCENTILE);

  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
    return null;
  }

  return { min, max };
}

function percentile(sortedValues: number[], p: number): number {
  const index = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.round((sortedValues.length - 1) * p)),
  );

  return sortedValues[index];
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
