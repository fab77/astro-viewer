import { describe, expect, test } from "@jest/globals";
import path from "node:path";

import { loadFitsTile } from "./FitsTileLoader.js";

describe("FitsTileLoader", () => {
  test("loads physical FITS values using BSCALE/BZERO and handles BLANK", async () => {
    const fixturePath = path.resolve(
      "test/fixtures/hips/fits-tile-physical-values.fits",
    );

    const tile = await loadFitsTile(fixturePath);

    expect(tile.width).toBe(4);
    expect(tile.height).toBe(1);

    expect(tile.pixels).toBeInstanceOf(Float32Array);
    expect(tile.pixels).toHaveLength(4);

    expect(Number.isNaN(tile.pixels[0])).toBe(true);
    expect(tile.pixels[1]).toBe(12);
    expect(tile.pixels[2]).toBe(14);
    expect(tile.pixels[3]).toBe(16);

    expect(tile.dataMin).toBe(12);
    expect(tile.dataMax).toBe(16);
  });
});
