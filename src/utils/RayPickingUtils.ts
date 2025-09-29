/**
 * @author Fabrizio Giordano (Fab)
 */
"use strict";

import { vec3, mat4, ReadonlyVec3, ReadonlyMat4 } from "gl-matrix";
import global from "../Global";
import computePerspectiveMatrixSingleton from "./ComputePerspectiveMatrix";
// import healpixGridSingleton, { HealpixGridSingleton } from "../model/grid/HealpixGridSingleton";
import healpixGridSingleton from "../model/grid/HealpixGridSingleton";
type GL = WebGLRenderingContext | WebGL2RenderingContext;


class RayPickingUtils {
  private static lastNearestVisibleObjectIdx = -1;

  /** Get index of the last object found under the mouse (if any). */
  static getNearestVisibleObjectIdx(): number {
    return this.lastNearestVisibleObjectIdx;
  }

  /**
   * Builds a world-space ray from mouse coords.
   * @param mouseX ClientX (page pixels)
   * @param mouseY ClientY (page pixels)
   * @param pMatrix Projection matrix
   * @returns World-space direction (normalized) as a vec3
   */
  static getRayFromMouse(
    mouseX: number,
    mouseY: number,
    pMatrix: ReadonlyMat4
  ): vec3 {
    if (!global.camera) {
      throw new Error("Camera is not initialized.");
    }
    const vMatrix = global.camera.getCameraMatrix() as ReadonlyMat4;
    const gl = global.gl as GL;
    const rect = (gl.canvas as HTMLCanvasElement).getBoundingClientRect();

    const canvasMX = mouseX - rect.left;
    const canvasMY = mouseY - rect.top;

    // viewport → NDC
    const x = (2.0 * canvasMX) / (gl.canvas as HTMLCanvasElement).clientWidth - 1.0;
    const y = 1.0 - (2.0 * canvasMY) / (gl.canvas as HTMLCanvasElement).clientHeight;
    const z = -1.0;

    // NDC → clip
    const rayClip: [number, number, number, number] = [x, y, z, 1.0];

    // clip → eye
    const pInv = mat4.create();
    mat4.invert(pInv, pMatrix);
    const rayEye4: [number, number, number, number] = [0, 0, 0, 0];
    RayPickingUtils.mat4MultiplyVec4(pInv, rayClip, rayEye4);

    // direction in eye space (z = -1, w = 0)
    const rayEye: [number, number, number, number] = [rayEye4[0], rayEye4[1], -1.0, 0.0];

    // eye → world
    const vInv = mat4.create();
    mat4.invert(vInv, vMatrix);
    const rayWorld4: [number, number, number, number] = [0, 0, 0, 0];
    RayPickingUtils.mat4MultiplyVec4(vInv, rayEye, rayWorld4);

    const rayWorld = vec3.fromValues(rayWorld4[0], rayWorld4[1], rayWorld4[2]);
    vec3.normalize(rayWorld, rayWorld);
    return rayWorld;
  }

  /** a*b (4x4 * vec4) → vec4 (in `out`) */
  private static mat4MultiplyVec4(
    a: ReadonlyMat4,
    b: Readonly<[number, number, number, number]>,
    out: [number, number, number, number]
  ): [number, number, number, number] {
    const d = b[0], e = b[1], g = b[2], w = b[3];
    out[0] = a[0] * d + a[4] * e + a[8] * g + a[12] * w;
    out[1] = a[1] * d + a[5] * e + a[9] * g + a[13] * w;
    out[2] = a[2] * d + a[6] * e + a[10] * g + a[14] * w;
    out[3] = a[3] * d + a[7] * e + a[11] * g + a[15] * w;
    return out;
  }

  /**
   * Ray–sphere intersection (world space).
   * @returns distance `t` along the ray to the first hit, or `-1` if no hit.
   */
  static raySphere(
    rayOrigWorld: ReadonlyVec3,
    rayDirectionWorld: ReadonlyVec3
  ): number {
    let intersectionDistance = -1;

    const L = vec3.create();
    vec3.subtract(L, rayOrigWorld, healpixGridSingleton.center);

    const b = vec3.dot(rayDirectionWorld, L);
    const c = vec3.dot(L, L) - healpixGridSingleton.radius * healpixGridSingleton.radius;

    const disc = b * b - c;

    if (disc > 0.0) {
      const s = Math.sqrt(disc);
      const ta = -b + s;
      const tb = -b - s;

      if (ta < 0.0 && tb < 0.0) {
        // behind camera
      } else if (tb < 0.0) {
        intersectionDistance = ta;
      } else {
        intersectionDistance = Math.min(ta, tb);
      }
    } else if (disc === 0.0) {
      const t = -b; // tangent
      if (t >= 0.0) {
        intersectionDistance = t;
      }
    }

    return intersectionDistance;
  }

  /**
   * Compute intersection with a single model (defaults to the Healpix grid).
   * @returns model-space intersection point (vec3) if hit, otherwise empty array; and the picked model.
   */
  static getIntersectionPointWithSingleModel(
    mouseX: number,
    mouseY: number
  ): number[] {
    const pMatrix = computePerspectiveMatrixSingleton.pMatrix as ReadonlyMat4;
    const camera = global.camera;

    if (!camera) {
      throw new Error("Camera is not initialized.");
    }

    const rayWorld = RayPickingUtils.getRayFromMouse(mouseX, mouseY, pMatrix);

    const t = RayPickingUtils.raySphere(
      camera.getCameraPosition() as ReadonlyVec3,
      rayWorld
    );

    let intersectionModelPoint: number[] = [];
    if (t >= 0) {
      // world intersection
      const worldHit = vec3.create();
      vec3.scale(worldHit, rayWorld, t);
      vec3.add(worldHit, camera.getCameraPosition() as ReadonlyVec3, worldHit);

      // world → model
      const worldHit4: [number, number, number, number] = [worldHit[0], worldHit[1], worldHit[2], 1.0];
      const modelHit4: [number, number, number, number] = [0, 0, 0, 0];
      RayPickingUtils.mat4MultiplyVec4(healpixGridSingleton.getModelMatrixInverse(), worldHit4, modelHit4);

      intersectionModelPoint = [modelHit4[0], modelHit4[1], modelHit4[2]];
    }

    return intersectionModelPoint
  }

  // /**
  //  * Cast a ray and find the nearest intersected model among `models`.
  //  * Returns both the picked object and the intersection point (model space).
  //  */
  // static getIntersectionPointWithModel(
  //   mouseX: number,
  //   mouseY: number,
  //   models: HealpixGridSingleton[]
  // ): { intersectionPoint: number[]; pickedObject: HealpixGridSingleton | undefined } {
  //   const pMatrix = computePerspectiveMatrixSingleton.pMatrix as ReadonlyMat4;

  //   const distance = RayPickingUtils.getDistanceFromHealpixGrid(mouseX, mouseY, pMatrix);
  //   let intersectionPoint = []
  //   if (distance && distance >= 0) {
  //     // If the ray hits the Healpix grid, we can skip checking other objects.
  //     intersectionPoint = RayPickingUtils.getIntersectionPointWithSingleModel( mouseX, mouseY );
  //   }
    
  //   return { intersectionPoint: [], pickedObject: undefined };
  // }


  // static getDistanceFromHealpixGrid(
  //   mouseX: number,
  //   mouseY: number,
  //   pMatrix: ReadonlyMat4
  // ): number {
  //   const camera = global.camera;

  //   if (!camera) {
  //     throw new Error("Camera is not initialized.");
  //   }
  //   const rayWorld = RayPickingUtils.getRayFromMouse(mouseX, mouseY, pMatrix);


  //   const distance = RayPickingUtils.raySphere(
  //     camera.getCameraPosition() as ReadonlyVec3,
  //     rayWorld
  //   );

  //   return distance;
  // }
}

export default RayPickingUtils;