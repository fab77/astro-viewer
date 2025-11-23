import { mat4, ReadonlyMat4 } from "gl-matrix";
import Camera from "../Camera.js";

export class PerspectiveMatrixManager {
  private _pMatrix: ReadonlyMat4
  private _aspectRatio = 1;

  constructor (canvas: HTMLCanvasElement,
    camera: Camera,
    fovDeg: number,
    nearPlane: number = 0.1,
    insideSphere: boolean){
      this._pMatrix = this.computePerspectiveMatrix(canvas, camera, fovDeg, nearPlane, insideSphere)
    }

  get pMatrix(): ReadonlyMat4 {
    return this._pMatrix;
  }

  computePerspectiveMatrix(
    canvas: HTMLCanvasElement,
    camera: Camera,
    fovDeg: number,
    nearPlane: number = 0.1,
    insideSphere: boolean
  ): mat4 {
    this._aspectRatio = canvas.width / canvas.height;

    const p = mat4.create();
    let farPlane: number;

    if (insideSphere) {
      // Inside the sphere: cap slightly beyond radius
      farPlane = 1.1;
    } else {
      const camMat = camera.getCameraMatrix() as any;
      const distCamera = -Number(camMat[14]); // camera z translation
      const r = 1; // HiPS sphere radius (inject real value if available)

      // Guard against negative due to rounding/logic
      const c2 = Math.sqrt(Math.max(distCamera ** 2 - r ** 2, 0));
      const beta = Math.atan2(c2, r);
      const cf = c2 * Math.sin(beta);
      farPlane = cf > 0 ? cf : r;
    }

    mat4.perspective(p, (fovDeg * Math.PI) / 180, this._aspectRatio, nearPlane, farPlane);
    this._pMatrix = p;
    return p;
  }
}

// const computePerspectiveMatrixSingleton = new ComputePerspectiveMatrixSingleton();
// export default computePerspectiveMatrixSingleton;