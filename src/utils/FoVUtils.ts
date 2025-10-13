'use strict';
/**
 * @author Fabrizio Giordano (Fab)
 */

import Point from '../model/Point.js';
import RayPickingUtils from './RayPickingUtils.js';
import CoordsType from './CoordsType.js';
import { mat4, ReadonlyMat4 } from 'gl-matrix';
import computePerspectiveMatrixSingleton from './ComputePerspectiveMatrix.js';
import Camera from '../Camera.js';
import HiPS from '../model/hips/HiPS.js';
import AbstractSkyEntity from '../model/AbstractSkyEntity.js';

class FoVUtils {
  /**
   * Return the minimum FoV value between `_fovY_deg` and `_fovX_deg`.
   * (Kept here for parity; this class doesn’t maintain those fields.)
   */
  getMinFoV(this: { _fovY_deg: number; _fovX_deg: number }): number {
    return this._fovY_deg <= this._fovX_deg ? this._fovY_deg : this._fovX_deg;
  }

  /**
   * Compute the FoV polygon as a list of Points (clockwise).
   * Uses ray picking + frustum planes against a unit sphere.
   */
  static getFoVPolygon(
    // _pMatrix: ReadonlyMat4 | null,
    camera: Camera,
    canvas: HTMLCanvasElement,
    model: AbstractSkyEntity
  ): Point[] {
    // const pMatrix = (computePerspectiveMatrixSingleton.pMatrix ??
    //   _pMatrix) as ReadonlyMat4;
    const pMatrix = computePerspectiveMatrixSingleton.pMatrix as ReadonlyMat4 
    const vMatrix = camera.getCameraMatrix();
    const mMatrix = model.getModelMatrix();
    const canvasWidth = canvas.clientWidth;
    const canvasHeight = canvas.clientHeight;

    let points: Point[] = [];

    // First check: does the sphere cover the whole screen?
    const intersectionWithModel = RayPickingUtils.getIntersectionPointWithSingleModel(0, 0);

    if (intersectionWithModel.length > 0) {
      // Fully covered → grab corners + midpoints (CASE C)
      const cornersPoints = FoVUtils.getScreenCornersIntersection(
        pMatrix,
        camera,
        canvas
      );
      points = cornersPoints;
    } else {
      // Partial coverage: build frustum planes
      let M = mat4.create();
      M = mat4.multiply(M, vMatrix, mMatrix);
      M = mat4.multiply(M, pMatrix, M);

      const topPlane = [M[3] - M[1], M[7] - M[5], M[11] - M[9], M[15] - M[13]];    // m41-m21, ...
      const bottomPlane = [M[3] + M[1], M[7] + M[5], M[11] + M[9], M[15] + M[13]];
      const rightPlane = [M[3] - M[0], M[7] - M[4], M[11] - M[8], M[15] - M[12]];
      const leftPlane = [M[3] + M[0], M[7] + M[4], M[11] + M[8], M[15] + M[12]];

      const intersectionTopMiddle = RayPickingUtils.getIntersectionPointWithSingleModel(canvasWidth / 2, 0);
      const intersectionRightMiddle = RayPickingUtils.getIntersectionPointWithSingleModel(canvasWidth, canvasHeight / 2);

      // CASE A: zoomed out, hemisphere fully visible
      if (
        intersectionTopMiddle.length === 0 &&
        intersectionRightMiddle.length === 0
      ) {
        const topPoints = FoVUtils.getNearestSpherePoint(topPlane);
        const bottomPoints = FoVUtils.getNearestSpherePoint(bottomPlane);
        const leftPoints = FoVUtils.getNearestSpherePoint(leftPlane);
        const rightPoints = FoVUtils.getNearestSpherePoint(rightPlane);

        const middleLeftTop = FoVUtils.computeMiddlePoint(leftPoints[0], topPoints[0])[0];
        const middleTopRight = FoVUtils.computeMiddlePoint(topPoints[0], rightPoints[0])[0];
        const middleRightBottom = FoVUtils.computeMiddlePoint(rightPoints[0], bottomPoints[0])[0];
        const middleBottomLeft = FoVUtils.computeMiddlePoint(bottomPoints[0], leftPoints[0])[0];

        points.push(
          topPoints[0],
          middleTopRight,
          rightPoints[0],
          middleRightBottom,
          bottomPoints[0],
          middleBottomLeft,
          leftPoints[0],
          middleLeftTop
        );
      }
      // CASE E: no intersection on top/bottom planes
      else if (intersectionTopMiddle.length === 0) {
        const topPoints = FoVUtils.getNearestSpherePoint(topPlane);
        const bottomPoints = FoVUtils.getNearestSpherePoint(bottomPlane);
        const leftPoints = FoVUtils.getFrustumIntersectionWithSphere(
          M,
          leftPlane,
          bottomPlane,
          topPlane
        );
        const rightPoints = FoVUtils.getFrustumIntersectionWithSphere(
          M,
          rightPlane,
          topPlane,
          bottomPlane
        );

        const middleLeftTop = FoVUtils.computeMiddlePoint(leftPoints[1], topPoints[0])[0];
        const middleTopRight = FoVUtils.computeMiddlePoint(topPoints[0], rightPoints[0])[0];
        const middleRightBottom = FoVUtils.computeMiddlePoint(rightPoints[1], bottomPoints[0])[0];
        const middleBottomLeft = FoVUtils.computeMiddlePoint(bottomPoints[0], leftPoints[0])[0];

        points.push(
          topPoints[0],
          middleTopRight,
          rightPoints[0],
          rightPoints[1],
          middleRightBottom,
          bottomPoints[0],
          middleBottomLeft,
          leftPoints[0],
          leftPoints[1],
          middleLeftTop
        );
      }
      // CASE D: no intersection on right/left planes
      else if (intersectionRightMiddle.length === 0) {
        const topPoints = FoVUtils.getFrustumIntersectionWithSphere(
          M,
          topPlane,
          leftPlane,
          rightPlane
        );
        const bottomPoints = FoVUtils.getFrustumIntersectionWithSphere(
          M,
          bottomPlane,
          rightPlane,
          leftPlane
        );
        const leftPoints = FoVUtils.getNearestSpherePoint(leftPlane);
        const rightPoints = FoVUtils.getNearestSpherePoint(rightPlane);

        const middleLeftTop = FoVUtils.computeMiddlePoint(leftPoints[0], topPoints[0])[0];
        const middleTopRight = FoVUtils.computeMiddlePoint(topPoints[1], rightPoints[0])[0];
        const middleRightBottom = FoVUtils.computeMiddlePoint(rightPoints[0], bottomPoints[0])[0];
        const middleBottomLeft = FoVUtils.computeMiddlePoint(bottomPoints[1], leftPoints[0])[0];

        points.push(
          topPoints[0],
          topPoints[1],
          middleTopRight,
          rightPoints[0],
          middleRightBottom,
          bottomPoints[0],
          bottomPoints[1],
          middleBottomLeft,
          leftPoints[0],
          middleLeftTop
        );
      }
      // CASE B: all frustum planes intersect
      else {
        const topPoints = FoVUtils.getFrustumIntersectionWithSphere(
          M,
          topPlane,
          leftPlane,
          rightPlane
        );
        const bottomPoints = FoVUtils.getFrustumIntersectionWithSphere(
          M,
          bottomPlane,
          rightPlane,
          leftPlane
        );
        const leftPoints = FoVUtils.getFrustumIntersectionWithSphere(
          M,
          leftPlane,
          bottomPlane,
          topPlane
        );
        const rightPoints = FoVUtils.getFrustumIntersectionWithSphere(
          M,
          rightPlane,
          topPlane,
          bottomPlane
        );

        points.push(
          topPoints[0],
          topPoints[1],
          rightPoints[0],
          rightPoints[1],
          bottomPoints[0],
          bottomPoints[1],
          leftPoints[0],
          leftPoints[1]
        );
      }
    }

    return points;
  }

  /**
   * Ray pick against 8 key screen positions (corners + midpoints).
   * Returns Points in clockwise order starting from top-left.
   */
  static getScreenCornersIntersection(
    pMatrix: ReadonlyMat4,
    camera: Camera,
    canvas: HTMLCanvasElement
  ): Point[] {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    const topLeft = RayPickingUtils.getIntersectionPointWithSingleModel(0, 0);
    const middleTop = RayPickingUtils.getIntersectionPointWithSingleModel(w / 2, 0);
    const topRight = RayPickingUtils.getIntersectionPointWithSingleModel(w, 0);

    const middleRight = RayPickingUtils.getIntersectionPointWithSingleModel(w, h / 2);

    const bottomRight = RayPickingUtils.getIntersectionPointWithSingleModel(w, h);
    const middleBottom = RayPickingUtils.getIntersectionPointWithSingleModel(w / 2, h);
    const bottomLeft = RayPickingUtils.getIntersectionPointWithSingleModel(0, h);

    const middleLeft = RayPickingUtils.getIntersectionPointWithSingleModel(0, h / 2);

    const out: Point[] = [];
    const pushIf = (ip: number[]) => {
      if (ip.length > 0) {
        out.push(new Point({ x: ip[0], y: ip[1], z: ip[2] }, CoordsType.CARTESIAN));
      }
    };

    pushIf(topLeft);
    pushIf(middleTop);
    pushIf(topRight);
    pushIf(middleRight);
    pushIf(bottomRight);
    pushIf(middleBottom);
    pushIf(bottomLeft);
    pushIf(middleLeft);

    return out;
  }

  /** Returns the center point (in J2000) of the current view as a `Point`. */
  static getCenterJ2000(
    canvas: HTMLCanvasElement,
    pMatrix: ReadonlyMat4
  ): Point {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    const center = RayPickingUtils.getIntersectionPointWithSingleModel(w / 2, h / 2);
    return new Point(
      { x: center[0], y: center[1], z: center[2] },
      CoordsType.CARTESIAN
    );
  }

  /** Middle point on the unit sphere along the arc between two 3D points. */
  static computeMiddlePoint(p1: Point, p2: Point): Point[] {
    // midpoint of segment
    const xm = (p1.x + p2.x) / 2;
    const ym = (p1.y + p2.y) / 2;
    const zm = (p1.z + p2.z) / 2;

    // project the midpoint back to unit sphere
    const len = Math.hypot(xm, ym, zm) || 1;
    const x = xm / len;
    const y = ym / len;
    const z = zm / len;

    return [new Point({ x, y, z }, CoordsType.CARTESIAN)];
  }

  /**
   * Nearest intersection point between a frustum plane and the unit sphere,
   * using the plane normal.
   */
  static getNearestSpherePoint(plane: number[]): Point[] {
    const [A, B, C, D] = plane;

    const R = 1;
    const invLen = 1 / Math.sqrt(A * A + B * B + C * C);
    const t1 = R * invLen;
    const t2 = -R * invLen;

    const P1: [number, number, number] = [A * t1, B * t1, C * t1];
    const P2: [number, number, number] = [A * t2, B * t2, C * t2];

    const den = Math.sqrt(A * A + B * B + C * C) || 1;
    const dist1 = Math.abs(A * P1[0] + B * P1[1] + C * P1[2] + D) / den;
    const dist2 = Math.abs(A * P2[0] + B * P2[1] + C * P2[2] + D) / den;

    const P = dist1 <= dist2 ? P1 : P2;
    return [new Point({ x: P[0], y: P[1], z: P[2] }, CoordsType.CARTESIAN)];
  }

  /**
   * Intersections between a frustum plane and the unit sphere,
   * computed via two perpendicular planes.
   * Returns two points (first from `plane4Circle_1`, second from `plane4Circle_2`).
   */
  static getFrustumIntersectionWithSphere(
    _M: ReadonlyMat4,
    plane4Sphere: number[],
    plane4Circle_1: number[],
    plane4Circle_2: number[]
  ): Point[] {
    const [A0, B0, C0, D0] = plane4Sphere;

    // center of the circle (projection of sphere center onto plane)
    const denom0 = (A0 * A0 + B0 * B0 + C0 * C0) || 1;
    const x_c = -(A0 * D0) / denom0;
    const y_c = -(B0 * D0) / denom0;
    const z_c = -(C0 * D0) / denom0;

    const d = Math.abs(D0) / Math.sqrt(denom0); // distance from sphere center (0,0,0)
    const R = 1;

    const out: Point[] = [];

    if (R > d) {
      const r = Math.sqrt(R * R - d * d);

      const pick = (plane: number[]): [number, number, number] => {
        const [A, B, C, D] = plane;
        const invLen = 1 / Math.sqrt(A * A + B * B + C * C);
        const t1 = r * invLen;
        const t2 = -r * invLen;

        const P1: [number, number, number] = [x_c + A * t1, y_c + B * t1, z_c + C * t1];
        const P2: [number, number, number] = [x_c + A * t2, y_c + B * t2, z_c + C * t2];

        const den = Math.sqrt(A * A + B * B + C * C) || 1;
        const dist1 = Math.abs(A * P1[0] + B * P1[1] + C * P1[2] + D) / den;
        const dist2 = Math.abs(A * P2[0] + B * P2[1] + C * P2[2] + D) / den;

        return dist1 <= dist2 ? P1 : P2;
      };

      const P_intersection_1 = pick(plane4Circle_1);
      const P_intersection_2 = pick(plane4Circle_2);

      out.push(
        new Point({ x: P_intersection_1[0], y: P_intersection_1[1], z: P_intersection_1[2] }, CoordsType.CARTESIAN),
        new Point({ x: P_intersection_2[0], y: P_intersection_2[1], z: P_intersection_2[2] }, CoordsType.CARTESIAN)
      );
    } else if (R === d) {
      // Tangent: both intersections collapse to the circle center on the plane
      out.push(
        new Point({ x: x_c, y: y_c, z: z_c }, CoordsType.CARTESIAN),
        new Point({ x: x_c, y: y_c, z: z_c }, CoordsType.CARTESIAN)
      );
    } else {
      // No intersection; return empty to avoid pushing undefined values
      // console.log('Frustum plane not intersecting the sphere');
    }

    return out;
  }

  /** Build ADQL string from an array of Points (ra,dec pairs). */
  static getAstroFoVPolygon(points: Point[]): string {
    return points.map(p => p.toADQL()).join(',');
  }
}

export default FoVUtils;