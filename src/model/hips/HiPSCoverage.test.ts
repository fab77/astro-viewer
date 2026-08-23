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

import { describe, expect, test } from "@jest/globals";
import { HiPSCoverage } from "./HiPSCoverage.js";

describe("HiPSCoverage", () => {
  test("loads the SPIRE500 MOC", async () => {
    const coverage = new HiPSCoverage();

    await coverage.loadMoc("test/fixtures/hips/spire500-moc.fits");

    expect(coverage.loaded).toBe(true);
    expect(coverage.maxOrder).toBe(10);
    expect(coverage.intervalCount).toBeGreaterThan(0);
  });

  test("recognises a tile explicitly present in the MOC", async () => {
    const coverage = new HiPSCoverage();

    await coverage.loadMoc("test/fixtures/hips/spire500-moc.fits");

    // UNIQ 335 -> order 3, pixel 79
    expect(coverage.intersectsTile(3, 79)).toBe(true);
  });

  test("recognises descendants of a covered MOC cell", async () => {
    const coverage = new HiPSCoverage();

    await coverage.loadMoc("test/fixtures/hips/spire500-moc.fits");

    // order-3 pixel 79 -> order-4 children 316..319
    expect(coverage.intersectsTile(4, 316)).toBe(true);
    expect(coverage.intersectsTile(4, 317)).toBe(true);
    expect(coverage.intersectsTile(4, 318)).toBe(true);
    expect(coverage.intersectsTile(4, 319)).toBe(true);
  });

  test("rejects invalid tile coordinates", async () => {
    const coverage = new HiPSCoverage();

    await coverage.loadMoc("test/fixtures/hips/spire500-moc.fits");

    expect(coverage.intersectsTile(-1, 0)).toBe(false);
    expect(coverage.intersectsTile(3, -1)).toBe(false);
  });
});
