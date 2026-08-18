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

// FoVHelper.ts
'use strict'

class XYZFoVHelper {

  private static readonly LEVEL_HYSTERESIS = 0.12

  private static readonly ZOOM_MIN_FOV: Record<number, number> = {
    2: 179,
    3: 90,
    4: 30,
    5: 20,
    6: 6,
    7: 3.2,
    8: 1.6,
    9: 0.85,
    10: 0.42,
    11: 0.21,
    12: 0.12,
    13: 0.06,
    14: 0.015,
    15: 0,
  }

  getZoom(fov: number, currentZoom?: number): number {
    const rawZoom = this.getRawZoom(fov)
    if (currentZoom === undefined || currentZoom === rawZoom) return rawZoom

    if (rawZoom > currentZoom) {
      const boundary = XYZFoVHelper.ZOOM_MIN_FOV[currentZoom]
      if (boundary > 0 && fov > boundary * (1 - XYZFoVHelper.LEVEL_HYSTERESIS)) return currentZoom
    } else {
      const boundary = XYZFoVHelper.ZOOM_MIN_FOV[rawZoom]
      if (boundary > 0 && fov < boundary * (1 + XYZFoVHelper.LEVEL_HYSTERESIS)) return currentZoom
    }

    return rawZoom
  }

  private getRawZoom(fov: number): number {
    if (fov >= 179) return 2
    if (fov >= 90)  return 3
    if (fov >= 30)  return 4
    if (fov >= 20)  return 5
    if (fov >= 6)   return 6
    if (fov >= 3.2) return 7
    if (fov >= 1.6) return 8
    if (fov >= 0.85) return 9
    if (fov >= 0.42) return 10
    if (fov >= 0.21) return 11
    if (fov >= 0.12) return 12
    if (fov >= 0.06) return 13
    if (fov >= 0.015) return 14
    return 15
  }

  // used in grid drawing
  getLonLatSteps(fov: number, coarse = false): { lonStep: number; latStep: number } {
    let lonStep: number
    let latStep: number

    if (coarse && fov < 0.21) { lonStep = 10; latStep = 10 }
    else if (fov >= 179) { lonStep = 10;  latStep = 10 }
    else if (fov >= 25)  { lonStep = 9;   latStep = 9 }
    else if (fov >= 12.5){ lonStep = 8;   latStep = 8 }
    else if (fov >= 6)   { lonStep = 6;   latStep = 6 }
    else if (fov >= 3.2) { lonStep = 5;   latStep = 5 }
    else if (fov >= 1.6) { lonStep = 4;   latStep = 4 }
    else if (fov >= 0.85){ lonStep = 3;   latStep = 3 }
    else if (fov >= 0.42){ lonStep = 2;   latStep = 2 }
    else if (fov >= 0.21){ lonStep = 1;   latStep = 1 }
    else if (fov >= 0.12){ lonStep = 0.5; latStep = 0.5 }
    else if (fov >= 0.06){ lonStep = 0.25; latStep = 0.25 }
    else                 { lonStep = 10;  latStep = 10 }

    return { lonStep, latStep }
  }

}

export const xyzFovHelper = new XYZFoVHelper()
export default XYZFoVHelper
