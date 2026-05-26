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
import { mat4, vec3 } from 'gl-matrix';
import { radToDeg } from '../utils/Utils.js';
export class SphereFoV {
    static MIN_FOV_DEG = 1e-6;
    fovXDeg = 180;
    fovYDeg = 180;
    ratio = 0;
    _minFoV = 180;
    _webgl;
    _lastModel = null;
    _lastCamera = null;
    constructor(webgl) {
        this._webgl = webgl;
    }
    getFoV(insideSphere, model, camera, pMatrix) {
        this._lastModel = model;
        this._lastCamera = camera;
        const canvas = this._webgl.canvas;
        if (!canvas) {
            this.fovXDeg = 180;
            this.fovYDeg = 180;
            this._minFoV = this.minFoV;
            return this;
        }
        const rect = canvas.getBoundingClientRect();
        const canvasWidth = rect.width;
        const canvasHeight = rect.height;
        this.fovXDeg = this.computeAngle(0, canvasHeight / 2, insideSphere, model, camera, pMatrix).angleDeg;
        this.fovYDeg = this.computeAngle(canvasWidth / 2, 0, insideSphere, model, camera, pMatrix).angleDeg;
        this._minFoV = this.minFoV;
        this.ratio = this.computeRatio(camera);
        return this;
    }
    computeRatio(camera) {
        const pos = camera.getCameraPosition();
        const distanceFromCenter = Math.sqrt(pos[0] * pos[0] + pos[1] * pos[1] + pos[2] * pos[2]);
        return distanceFromCenter / this.fovYDeg;
    }
    get minFoV() {
        const minFov = this.fovYDeg <= this.fovXDeg ? this.fovYDeg : this.fovXDeg;
        this._minFoV = Math.max(minFov, SphereFoV.MIN_FOV_DEG);
        return this._minFoV;
    }
    get xFoV() {
        return this.fovXDeg;
    }
    get yFoV() {
        return this.fovYDeg;
    }
    computeDistanceFromAngle(angleDeg) {
        return angleDeg * this.ratio;
    }
    changeMinFov(deg) {
        if (this.fovYDeg <= this.fovXDeg) {
            this.fovYDeg = deg;
        }
        else {
            this.fovXDeg = deg;
        }
        this.minFoV;
    }
    computeCameraPositionForMinFoV(targetMinFoVDeg) {
        return this.computeCameraPositionForFoV(targetMinFoVDeg);
    }
    computeCameraPositionForFoV(targetFoVDeg) {
        return this.computeCameraPositionForAngularDiameter(targetFoVDeg);
    }
    computeCameraPositionForAngularDiameter(targetAngularDiameterDeg) {
        if (!this._lastModel || !this._lastCamera) {
            return [0, 0, 0];
        }
        const eps = 1e-6;
        const clamped = Math.max(eps, Math.min(180 - eps, targetAngularDiameterDeg));
        const halfRad = (clamped * Math.PI) / 360.0;
        const sinHalf = Math.sin(halfRad);
        if (sinHalf <= 0) {
            return [0, 0, 0];
        }
        const model = this._lastModel;
        const camera = this._lastCamera;
        const targetDistance = Math.max(model.radius / sinHalf, model.radius + 1e-4);
        const camPos = camera.getCameraPosition();
        const direction = vec3.fromValues(camPos[0] - model.center[0], camPos[1] - model.center[1], camPos[2] - model.center[2]);
        if (vec3.length(direction) < eps) {
            vec3.set(direction, 0, 0, 1);
        }
        else {
            vec3.normalize(direction, direction);
        }
        return [
            model.center[0] + direction[0] * targetDistance,
            model.center[1] + direction[1] * targetDistance,
            model.center[2] + direction[2] * targetDistance,
        ];
    }
    computeAngle(canvasX, canvasY, insideSphere, model, camera, pMatrix) {
        const canvas = this._webgl.canvas;
        const rect = canvas.getBoundingClientRect();
        const centerHit = this.getIntersectionPointWithModel(rect.width / 2, rect.height / 2, model, camera, pMatrix);
        const edgeHit = this.getIntersectionPointWithModel(canvasX, canvasY, model, camera, pMatrix);
        if (!centerHit || !edgeHit) {
            return { angleDeg: 180, distance: -1 };
        }
        const angleDeg = 2 * this.computeAngularDistanceDeg(centerHit.point, edgeHit.point);
        return {
            angleDeg,
            distance: edgeHit.distance,
        };
    }
    computeAngularDistanceDeg(a, b) {
        const aNorm = vec3.normalize(vec3.create(), a);
        const bNorm = vec3.normalize(vec3.create(), b);
        const dot = vec3.dot(aNorm, bNorm);
        const cross = vec3.cross(vec3.create(), aNorm, bNorm);
        const angleRad = Math.atan2(vec3.length(cross), Math.min(1, Math.max(-1, dot)));
        return radToDeg(angleRad);
    }
    getIntersectionPointWithModel(mouseX, mouseY, model, camera, pMatrix) {
        const rayWorld = this.getRayFromMouse(mouseX, mouseY, pMatrix, camera.getCameraMatrix());
        const distance = this.raySphere(camera.getCameraPosition(), rayWorld, model);
        if (distance < 0) {
            return null;
        }
        const worldHit = vec3.create();
        vec3.scale(worldHit, rayWorld, distance);
        vec3.add(worldHit, camera.getCameraPosition(), worldHit);
        const worldHit4 = [worldHit[0], worldHit[1], worldHit[2], 1.0];
        const modelHit4 = [0, 0, 0, 0];
        this.mat4MultiplyVec4(model.getModelMatrixInverse(), worldHit4, modelHit4);
        return {
            point: vec3.fromValues(modelHit4[0], modelHit4[1], modelHit4[2]),
            distance,
        };
    }
    getRayFromMouse(mouseX, mouseY, pMatrix, vMatrix) {
        const gl = this._webgl;
        const canvas = gl.canvas;
        const rect = canvas.getBoundingClientRect();
        const x = (2.0 * mouseX) / rect.width - 1.0;
        const y = 1.0 - (2.0 * mouseY) / rect.height;
        const rayClip = [x, y, -1.0, 1.0];
        const pInv = mat4.create();
        mat4.invert(pInv, pMatrix);
        const rayEye4 = [0, 0, 0, 0];
        this.mat4MultiplyVec4(pInv, rayClip, rayEye4);
        const rayEye = [rayEye4[0], rayEye4[1], -1.0, 0.0];
        const vInv = mat4.create();
        mat4.invert(vInv, vMatrix);
        const rayWorld4 = [0, 0, 0, 0];
        this.mat4MultiplyVec4(vInv, rayEye, rayWorld4);
        const rayWorld = vec3.fromValues(rayWorld4[0], rayWorld4[1], rayWorld4[2]);
        vec3.normalize(rayWorld, rayWorld);
        return rayWorld;
    }
    raySphere(rayOrigWorld, rayDirectionWorld, sphere) {
        let intersectionDistance = -1;
        const L = vec3.create();
        vec3.subtract(L, rayOrigWorld, sphere.center);
        const b = vec3.dot(rayDirectionWorld, L);
        const c = vec3.dot(L, L) - sphere.radius * sphere.radius;
        const disc = b * b - c;
        if (disc > 0.0) {
            const s = Math.sqrt(disc);
            const ta = -b + s;
            const tb = -b - s;
            if (ta >= 0.0 || tb >= 0.0) {
                intersectionDistance = tb < 0.0 ? ta : Math.min(ta, tb);
            }
        }
        else if (disc === 0.0) {
            const t = -b;
            if (t >= 0.0) {
                intersectionDistance = t;
            }
        }
        return intersectionDistance;
    }
    mat4MultiplyVec4(m, v, out) {
        out[0] = m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12] * v[3];
        out[1] = m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13] * v[3];
        out[2] = m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14] * v[3];
        out[3] = m[3] * v[0] + m[7] * v[1] + m[11] * v[2] + m[15] * v[3];
    }
}
