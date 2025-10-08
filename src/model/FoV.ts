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
import { bootSetup } from '../Config.js'


export class FoV {

  public fovXDeg = 180
  private fovYDeg = 180
  private _minFoV = 180

  constructor() { }

  /** Recomputes FoV for current camera + projection */
  public getFoV(insideSphere: boolean) {
    const gl = global.gl

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

  public changeMinFov(deg: number) {
    console.log("inside changeMinFov")
    if (this.fovYDeg <= this.fovXDeg) {
      this.fovYDeg = deg
    } else {
      this.fovXDeg = deg
    }
    console.log("changeMinFov: ping")
    this.minFoV
    // this.fovYDeg <= this.fovXDeg ? this.fovYDeg = deg : this.fovXDeg = deg
  }




  /** FoV half-screen chord angle doubled (deg) along a given canvas axis */
  private computeAngle(canvasX: number, canvasY: number, insideSphere: boolean): number {
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

    return insideSphere ? 360 - angleDeg : angleDeg
  }

  /**
 * Computes the camera position (x,y,z) along the current view direction that would
 * yield the requested minFoV (in degrees), assuming the camera is OUTSIDE the sphere.
 * This method does NOT mutate the camera; it only returns the suggested position.
 *
 * Geometry: for a sphere of radius R observed from distance d (from center),
 * the apparent angular diameter is 2*arcsin(R/d). Our minFoV is that angular diameter
 * along the tighter axis; we solve for d and place the camera on the current
 * center→camera direction with that distance.
 *
 * @param targetMinFoVDeg Desired min FoV in degrees, 0 < targetMinFoVDeg < 180
 * @returns Tuple [x, y, z] for the recommended camera position in world coordinates.
 */
  public computeCameraPositionForMinFoV(targetMinFoVDeg: number): [number, number, number] {
    const camera = global.camera
    const center = healpixGridSingleton.center
    const R = healpixGridSingleton.radius

    if (!camera) {
      console.warn('FoV.computeCameraPositionForMinFoV: camera not available; returning a sensible default.')
      return [center[0], center[1], center[2] + 2 * R]
    }

    // Clamp and validate input
    const eps = 1e-6
    const clamped = Math.max(eps, Math.min(180 - eps, targetMinFoVDeg))
    const halfRad = (clamped * Math.PI / 180) * 0.5

    // Distance from center needed to achieve the angular diameter
    // minFoV = 2 * arcsin(R / d)  =>  d = R / sin(minFoV/2)
    const sinHalf = Math.sin(halfRad)
    if (sinHalf <= 0) {
      console.warn('FoV.computeCameraPositionForMinFoV: invalid targetMinFoVDeg, using fallback.')
      return [center[0], center[1], center[2] + 2 * R]
    }
    let d = R / sinHalf

    // Ensure we remain strictly outside the sphere
    d = Math.max(d, R + 1e-4)

    // Use the current center→camera direction to keep orientation
    const camPos = camera.getCameraPosition()
    let dirX = camPos[0] - center[0]
    let dirY = camPos[1] - center[1]
    let dirZ = camPos[2] - center[2]
    const len = Math.hypot(dirX, dirY, dirZ)
    if (len < eps) {
      // If somehow at the center, use +Z as a default direction
      dirX = 0; dirY = 0; dirZ = 1;
    } else {
      dirX /= len
      dirY /= len
      dirZ /= len
    }

    const newX = center[0] + dirX * d
    const newY = center[1] + dirY * d
    const newZ = center[2] + dirZ * d

    return [newX, newY, newZ]

  }


  get minFoV() {
    this._minFoV = this.fovYDeg <= this.fovXDeg ? this.fovYDeg : this.fovXDeg
    return this._minFoV
  }


}