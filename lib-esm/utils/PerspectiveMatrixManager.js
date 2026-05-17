/*
 * AstroViewer
 * Copyright (C) Fabrizio Giordano
 * SPDX-License-Identifier: LicenseRef-AstroViewer-Dual-License
 *
 * This file is part of AstroViewer.
 * AstroViewer is distributed under a dual-license model.
 * Commercial use requires a separate commercial license.
 * Non-commercial use is governed by LICENSE-NONCOMMERCIAL.md.
 *
 * See LICENSE.md, LICENSE-COMMERCIAL.md, and LICENSE-NONCOMMERCIAL.md for details.
 */
import { mat4 } from "gl-matrix";
export class PerspectiveMatrixManager {
    _pMatrix;
    _aspectRatio = 1;
    constructor(canvas, camera, fovDeg, nearPlane = 0.1, insideSphere) {
        this._pMatrix = this.computePerspectiveMatrix(canvas, camera, fovDeg, nearPlane, insideSphere);
    }
    get pMatrix() {
        return this._pMatrix;
    }
    set pMatrix(pMatrix) {
        this._pMatrix = pMatrix;
    }
    computePerspectiveMatrix(canvas, camera, fovDeg, nearPlane = 0.1, insideSphere) {
        this._aspectRatio = canvas.width / canvas.height;
        const p = mat4.create();
        let farPlane;
        if (insideSphere) {
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
