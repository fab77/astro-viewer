import global from "../Global.js";
import { mat4 } from "gl-matrix";
class ComputePerspectiveMatrixSingleton {
    _pMatrix = null;
    _aspectRatio = 1;
    get pMatrix() {
        return this._pMatrix;
    }
    computePerspectiveMatrix(canvas, camera, fovDeg, nearPlane = 0.1) {
        this._aspectRatio = canvas.width / canvas.height;
        const p = mat4.create();
        let farPlane;
        if (global.insideSphere) {
            // Inside the sphere: cap slightly beyond radius
            farPlane = 1.1;
        }
        else {
            const camMat = camera.getCameraMatrix();
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
const computePerspectiveMatrixSingleton = new ComputePerspectiveMatrixSingleton();
export default computePerspectiveMatrixSingleton;
//# sourceMappingURL=ComputePerspectiveMatrix.js.map