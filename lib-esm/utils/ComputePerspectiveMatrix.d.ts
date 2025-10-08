import { mat4 } from "gl-matrix";
import Camera from "../Camera.js";
declare class ComputePerspectiveMatrixSingleton {
    private _pMatrix;
    private _aspectRatio;
    get pMatrix(): mat4 | null;
    computePerspectiveMatrix(canvas: HTMLCanvasElement, camera: Camera, fovDeg: number, nearPlane: number | undefined, insideSphere: boolean): mat4;
}
declare const computePerspectiveMatrixSingleton: ComputePerspectiveMatrixSingleton;
export default computePerspectiveMatrixSingleton;
//# sourceMappingURL=ComputePerspectiveMatrix.d.ts.map