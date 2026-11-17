/*
 * AstroViewer
 * Copyright (C) Fabrizio Giordano
 * SPDX-License-Identifier: LicenseRef-AstroViewer-Dual-License
 */

import FoVHelper from './FoVHelper.js'

describe('FoVHelper order hysteresis', () => {
  const helper = new FoVHelper()

  test('returns from order 1 to order 0 at the maximum FoV boundary', () => {
    expect(helper.getHiPSNorder(178, 1)).toBe(1)
    expect(helper.getHiPSNorder(179, 1)).toBe(0)
    expect(helper.getHiPSNorder(180, 1)).toBe(0)
  })

  test('keeps hysteresis when moving from order 2 to order 1', () => {
    expect(helper.getHiPSNorder(100, 2)).toBe(2)
    expect(helper.getHiPSNorder(101, 2)).toBe(1)
  })
})
