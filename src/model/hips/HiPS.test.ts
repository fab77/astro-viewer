/*
 * AstroViewer
 * Copyright (C) Fabrizio Giordano
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-AstroViewer-Commercial
 */

import { describe, expect, test } from "@jest/globals";
import { normalizeHiPSBaseURL } from "./HiPS.js";

describe("HiPS base URL normalization", () => {
  test.each([
    ["https://example.org/hips", "https://example.org/hips"],
    ["https://example.org/hips/", "https://example.org/hips"],
    ["https://example.org/hips///", "https://example.org/hips"],
  ])("normalizes %s", (input, expected) => {
    expect(normalizeHiPSBaseURL(input)).toBe(expected);
  });

  test("produces a valid HiPS tile URL", () => {
    const base = normalizeHiPSBaseURL(
      "https://stpubdata.s3.us-east-1.amazonaws.com/mast/skybackgrounds/GALEXColor/",
    );

    const tileURL = `${base}/Norder8/Dir170000/Npix176528.png`;

    expect(tileURL).toBe(
      "https://stpubdata.s3.us-east-1.amazonaws.com/mast/skybackgrounds/GALEXColor/Norder8/Dir170000/Npix176528.png",
    );
  });
});
