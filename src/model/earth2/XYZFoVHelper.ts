// FoVHelper.ts
'use strict'

class XYZFoVHelper {
  
  getZoom(fov: number): number {
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
  getLonLatSteps(fov: number): { lonStep: number; latStep: number } {
    let lonStep: number
    let latStep: number

    if (fov >= 179)      { lonStep = 10;  latStep = 10 }
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
