import { mat4, ReadonlyMat4 } from "gl-matrix";
import Camera from "../Camera.js";
export declare class PerspectiveMatrixManager {
    private _pMatrix;
    private _aspectRatio;
    constructor(canvas: HTMLCanvasElement, camera: Camera, fovDeg: number, nearPlane: number | undefined, insideSphere: boolean);
    get pMatrix(): ReadonlyMat4;
    set pMatrix(pMatrix: Float32Array);
    computePerspectiveMatrix(canvas: HTMLCanvasElement, camera: Camera, fovDeg: number, nearPlane: number | undefined, insideSphere: boolean): mat4;
}
