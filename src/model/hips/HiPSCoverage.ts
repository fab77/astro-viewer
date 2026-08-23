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

import { BinaryTableHDU, FITSParser } from "jsfitsio";

interface CoverageInterval {
  first: number;
  last: number;
}

export class HiPSCoverage {
  private _maxOrder = 0;
  private _intervals: CoverageInterval[] = [];
  private _loaded = false;

  get loaded(): boolean {
    return this._loaded;
  }

  get maxOrder(): number {
    return this._maxOrder;
  }

  get intervalCount(): number {
    return this._intervals.length;
  }

  clear(): void {
    this._maxOrder = 0;
    this._intervals = [];
    this._loaded = false;
  }

  async load(baseUrl: string): Promise<void> {
    this.clear();

    const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;

    const fits = await FITSParser.loadFITSFile(`${normalizedBaseUrl}Moc.fits`);

    if (!fits) {
      throw new Error("Unable to load HiPS Moc.fits");
    }

    const mocHDU = fits.hdus.find((hdu) => hdu instanceof BinaryTableHDU);

    if (!(mocHDU instanceof BinaryTableHDU)) {
      throw new Error("HiPS Moc.fits does not contain a BINTABLE HDU.");
    }

    const mocOrderItem = mocHDU.header.findById("MOCORDER");

    if (!mocOrderItem) {
      throw new Error("HiPS Moc.fits does not define MOCORDER.");
    }

    const maxOrder = Number(mocOrderItem.value);

    if (!Number.isInteger(maxOrder) || maxOrder < 0) {
      throw new Error(`Invalid MOCORDER value: ${mocOrderItem.value}`);
    }

    this._maxOrder = maxOrder;

    const intervals: CoverageInterval[] = [];

    for (let row = 0; row < mocHDU.rowCount; row++) {
      const rawUniq = mocHDU.getCell(row, "UNIQ");

      if (
        typeof rawUniq !== "number" ||
        !Number.isInteger(rawUniq) ||
        rawUniq < 4
      ) {
        throw new Error(
          `Invalid MOC UNIQ value at row ${row}: ${String(rawUniq)}`,
        );
      }

      const { order, pixel } = HiPSCoverage.decodeUniq(rawUniq);

      if (order > this._maxOrder) {
        throw new Error(
          `MOC cell order ${order} exceeds MOCORDER ${this._maxOrder}.`,
        );
      }

      const scale = 4 ** (this._maxOrder - order);

      intervals.push({
        first: pixel * scale,
        last: (pixel + 1) * scale - 1,
      });
    }

    this._intervals = HiPSCoverage.mergeIntervals(intervals);

    this._loaded = true;
  }

  intersectsTile(order: number, pixel: number): boolean {
    if (!this._loaded) {
      return true;
    }

    if (
      !Number.isInteger(order) ||
      order < 0 ||
      !Number.isInteger(pixel) ||
      pixel < 0
    ) {
      return false;
    }

    let first: number;
    let last: number;

    if (order <= this._maxOrder) {
      const scale = 4 ** (this._maxOrder - order);

      first = pixel * scale;
      last = (pixel + 1) * scale - 1;
    } else {
      /*
       * At orders finer than the MOC resolution, reduce the tile
       * to its ancestor at MOCORDER.
       */
      const shift = 2 * (order - this._maxOrder);
      const ancestor = Math.floor(pixel / 2 ** shift);

      first = ancestor;
      last = ancestor;
    }

    return this.intersectsInterval(first, last);
  }

  private intersectsInterval(first: number, last: number): boolean {
    let low = 0;
    let high = this._intervals.length - 1;

    while (low <= high) {
      const middle = Math.floor((low + high) / 2);
      const interval = this._intervals[middle];

      if (interval.last < first) {
        low = middle + 1;
        continue;
      }

      if (interval.first > last) {
        high = middle - 1;
        continue;
      }

      return true;
    }

    return false;
  }

  private static decodeUniq(uniq: number): {
    order: number;
    pixel: number;
  } {
    let order = 0;

    while (4 ** (order + 2) <= uniq) {
      order++;
    }

    const base = 4 ** (order + 1);

    return {
      order,
      pixel: uniq - base,
    };
  }

  private static mergeIntervals(
    intervals: CoverageInterval[],
  ): CoverageInterval[] {
    if (intervals.length === 0) {
      return [];
    }

    intervals.sort((a, b) => a.first - b.first);

    const merged: CoverageInterval[] = [{ ...intervals[0] }];

    for (let i = 1; i < intervals.length; i++) {
      const current = intervals[i];
      const previous = merged[merged.length - 1];

      if (current.first <= previous.last + 1) {
        previous.last = Math.max(previous.last, current.last);
      } else {
        merged.push({ ...current });
      }
    }

    return merged;
  }
}
