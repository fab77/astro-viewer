'use strict'
/**
 * FoV singleton (TypeScript)
 * - Uses computePerspectiveMatrixSingleton.pMatrix
 * - Guards acos domain (numeric safety)
 * - Uses vec3.transformMat4 instead of custom mat4*vec3
 * - Keeps original “insideSphere ? 360 - angle : angle” behavior
 */

import { vec3, mat4 } from 'gl-matrix'
import global from '../Global.js'
import RayPickingUtils from '../utils/RayPickingUtils.js'
import { radToDeg } from '../utils/Utils.js'
import computePerspectiveMatrixSingleton from '../utils/ComputePerspectiveMatrix.js'
import healpixGridSingleton from './grid/HealpixGridSingleton.js'


class FoV {
  private static _instance: FoV | null = null

  
  public fovXDeg = 180
  public fovYDeg = 180
  private _minFoV = 180
  public prevMinFoV = 180

  private constructor() {
    
  }

  static get instance() {
    if (!FoV._instance) FoV._instance = new FoV()
    return FoV._instance
  }


  /** Recomputes FoV for current camera + projection */
  getFoV(insideSphere?: boolean) {
    const gl = global.gl
    this.prevMinFoV = this._minFoV

    if (!gl || !gl.canvas) {
      // Handle the error or assign default values
      this.fovXDeg = 180
      this.fovYDeg = 180
      this._minFoV = this.minFoV
      return this
    }

    // horizontal FoV: ray through (centerY)
    this.fovXDeg = this.computeAngle(0, gl.canvas.height / 2, insideSphere)

    // vertical FoV: ray through (centerX)
    this.fovYDeg = this.computeAngle(gl.canvas.width / 2, 0, insideSphere)

    this._minFoV = this.minFoV
    return this
  }

  /** FoV half-screen chord angle doubled (deg) along a given canvas axis */
  private computeAngle(canvasX: number, canvasY: number, insideSphere?: boolean): number {
    const camera = global.camera
    const pMatrix = computePerspectiveMatrixSingleton.pMatrix
    if (!pMatrix) {
      // Handle the error or assign a default value
      console.warn('FoV: projection matrix is null')
      return 180
    }
    if (!camera) {
      // Handle the error or assign a default value
      console.warn('FoV: camera is null')
      return 180
    }
    const rayWorld = RayPickingUtils.getRayFromMouse(canvasX, canvasY, pMatrix)

    const intersectionDistance = RayPickingUtils.raySphere(
      camera.getCameraPosition(),
      rayWorld
    )

    let angleDeg: number
    if (intersectionDistance > 0) {
      // world-space intersection point on the sphere
      const hit = vec3.create()
      vec3.scale(hit, rayWorld, intersectionDistance)
      vec3.add(hit, camera.getCameraPosition(), hit)

      const center = healpixGridSingleton.center

      // vectors from sphere center
      const vHit = vec3.create()
      vec3.subtract(vHit, hit, center)

      // reference vector: rotate world +Z into current camera orientation, then from center
      const refWorldZ = vec3.fromValues(center[0], center[1], center[2] + healpixGridSingleton.radius)

      const vInv = mat4.create()
      mat4.invert(vInv, camera.getCameraMatrix())
      const refCamZ = vec3.create()
      vec3.transformMat4(refCamZ, refWorldZ, vInv)

      const vRef = vec3.create()
      vec3.subtract(vRef, refCamZ, center)

      // angle between vHit and vRef, doubled
      const dot = vec3.dot(vHit, vRef)
      const n1 = vec3.length(vHit)
      const n2 = vec3.length(vRef)
      // numeric safety for acos
      const c = Math.min(1, Math.max(-1, dot / (n1 * n2)))
      const angleRad = Math.acos(c)
      angleDeg = 2 * radToDeg(angleRad)
    } else {
      angleDeg = 180
    }

    const inside = insideSphere ?? global.insideSphere
    return inside ? 360 - angleDeg : angleDeg
  }

  get minFoV() {
    this._minFoV = this.fovYDeg <= this.fovXDeg ? this.fovYDeg : this.fovXDeg
    return this._minFoV
  }
}

export default FoV