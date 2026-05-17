/*
 * AstroViewer
 * Copyright (C) Fabrizio Giordano
 * SPDX-License-Identifier: LicenseRef-AstroViewer-Dual-License
 *
 * This file is part of AstroViewer.
 * AstroViewer is distributed under a dual-license model.
 * Commercial use requires a separate commercial license.
 * Non-commercial use is governed by LICENSE-NONCOMMERCIAL.md.
 *
 * See LICENSE.md, LICENSE-COMMERCIAL.md, and LICENSE-NONCOMMERCIAL.md for details.
 */

// FoVHelper.ts
'use strict'

class FoVHelper {
  getHiPSNorder(fov: number): number {
    if (fov >= 179) return 0
    if (fov >= 90)  return 1
    if (fov >= 30)  return 2
    if (fov >= 20)  return 3
    if (fov >= 6)   return 4
    if (fov >= 3.2) return 5
    if (fov >= 1.6) return 6
    if (fov >= 0.85) return 7
    if (fov >= 0.42) return 8
    if (fov >= 0.21) return 9
    if (fov >= 0.12) return 10
    if (fov >= 0.06) return 11
    if (fov >= 0.015) return 12
    return 13
  }

  getRADegSteps(fov: number): { raStep: number; decStep: number } {
    let raStep: number
    let decStep: number

    if (fov >= 179)      { raStep = 10;  decStep = 10 }
    else if (fov >= 25)  { raStep = 9;   decStep = 9 }
    else if (fov >= 12.5){ raStep = 8;   decStep = 8 }
    else if (fov >= 6)   { raStep = 6;   decStep = 6 }
    else if (fov >= 3.2) { raStep = 5;   decStep = 5 }
    else if (fov >= 1.6) { raStep = 4;   decStep = 4 }
    else if (fov >= 0.85){ raStep = 3;   decStep = 3 }
    else if (fov >= 0.42){ raStep = 2;   decStep = 2 }
    else if (fov >= 0.21){ raStep = 1;   decStep = 1 }
    else if (fov >= 0.12){ raStep = 0.5; decStep = 0.5 }
    else if (fov >= 0.06){ raStep = 0.25; decStep = 0.25 }
    else                 { raStep = 10;  decStep = 10 }

    return { raStep, decStep }
  }

  getRefOrder(order: number): number {
    switch (order) {
      case 0:
      case 1:
      case 2:
      case 3:
        return order + 6
      case 4:
      case 5:
      case 6:
      case 7:
        return order + 5
      case 8:
        return order + 4
      default:
        return order + 3
    }
  }
}

export const fovHelper = new FoVHelper()
export default FoVHelper
