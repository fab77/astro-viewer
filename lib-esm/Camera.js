/**
 * @author Fabrizio Giordano (Fab)
 */
import { vec3, mat4 } from "gl-matrix";
import { astroDegToSpherical, cartesianToSpherical, sphericalToCartesian, } from "./utils/Utils.js";
import global from './Global.js';
class Camera {
    insideSphere = false;
    cam_pos = vec3.create(); // camera position
    cam_speed = 1.0;
    vMatrix = mat4.create(); // view matrix
    T = mat4.create(); // translation matrix
    R = mat4.create(); // rotation matrix
    // Optional state used in rotate helpers
    FoV = 180.0;
    previousFoV = 180.0;
    move = vec3.create();
    phi = 0; // accumulated yaw (radians)
    theta = 0; // accumulated pitch (radians)
    rotationSensitivity = 1.0;
    // lock rotation around world axes
    lockRotX = false;
    lockRotY = false;
    lockRotZ = false;
    constructor(in_position, in_sphere) {
        this.init(in_position, in_sphere);
    }
    init(in_position, in_sphere) {
        this.insideSphere = in_sphere;
        this.cam_pos = vec3.clone(in_position);
        this.vMatrix = mat4.create();
        this.T = mat4.create();
        this.R = mat4.create();
        mat4.translate(this.T, this.T, [this.cam_pos[0], this.cam_pos[1], this.cam_pos[2]]);
        // reset helpers
        this.FoV = this.previousFoV = 180.0;
        this.move = vec3.clone([0, 0, 0]);
        const raDeg = 0;
        const decDeg = 0;
        this.goTo(raDeg, decDeg);
    }
    goTo(raDeg, decDeg) {
        this.goToPhiTheta(astroDegToSpherical(raDeg, decDeg));
    }
    goToPhiTheta(ptDeg) {
        const xyz = sphericalToCartesian(ptDeg.phi, ptDeg.theta, this.cam_pos[2]);
        let cameraMatrix = mat4.create();
        cameraMatrix = mat4.translate(cameraMatrix, cameraMatrix, vec3.fromValues(xyz[0], xyz[1], xyz[2]));
        const focusPoint = [0.0, 0.0, 0.0];
        const cameraUp = vec3.clone([0.0, 1.0, 0.0]);
        const cameraPos = [cameraMatrix[12], cameraMatrix[13], cameraMatrix[14]];
        cameraMatrix = mat4.targetTo(cameraMatrix, cameraPos, focusPoint, cameraUp);
        this.R = mat4.clone(cameraMatrix);
        this.R[12] = 0;
        this.R[13] = 0;
        this.R[14] = 0;
        const viewMatrix = mat4.create();
        if (this.cam_pos[2] !== 0) {
            mat4.invert(viewMatrix, cameraMatrix);
        }
        this.vMatrix = viewMatrix;
    }
    toggleInsideSphere() {
        // if (inside !== global.insideSphere) {
        //   global.insideSphere = inside;
        if (global.insideSphere) {
            if (this.cam_pos[2] <= 2) {
                this.cam_pos[2] = -2 + this.cam_pos[2];
            }
            else {
                this.cam_pos[2] = -0.005;
            }
        }
        else {
            this.cam_pos[2] = 2.0 + this.cam_pos[2];
        }
        mat4.translate(this.T, mat4.create(), this.cam_pos);
        this.refreshViewMatrix();
        // }
    }
    zoom(inertia) {
        this.move = vec3.clone([0, 0, 0]);
        this.move[2] += this.cam_speed * inertia;
        if (global.insideSphere) {
            if (this.cam_pos[2] + this.move[2] >= -0.005 && inertia > 0) {
                this.cam_pos[2] = -0.005;
                inertia = 0;
            }
            else if (this.cam_pos[2] + this.move[2] <= -0.9885 && inertia < 0) {
                this.cam_pos[2] = -0.9885;
                inertia = 0;
            }
            else {
                this.cam_pos[2] += this.move[2];
            }
        }
        else {
            // Keep zoom responsive near the sphere surface without the abrupt
            // threshold jumps that made the 0.2 -> 0.05 deg range feel sticky.
            const distanceFromSurface = Math.max(this.cam_pos[2] - 1, 1e-6);
            const normalizedDistance = Math.min(1, distanceFromSurface / 0.3);
            const zoomScale = 0.015 + 0.985 * Math.pow(normalizedDistance, 1.2);
            this.move[2] *= zoomScale;
            if (this.cam_pos[2] + this.move[2] <= 1.000001 && inertia < 0) {
                this.cam_pos[2] = 1.000001;
            }
            else {
                this.cam_pos[2] += this.move[2];
            }
        }
        const identity = mat4.create();
        mat4.translate(this.T, identity, this.cam_pos);
        this.refreshViewMatrix();
    }
    /**
     * Move the camera forward/backward along its current viewing direction.
     * Positive distance moves *forward* (toward where the camera is looking),
     * negative distance moves *backward*.
     *
     * This does not enforce inside/outside-sphere bounds; if you want clamping,
     * handle it before calling or we can extend this to mimic `zoom()` bounds.
     */
    moveAlongView(distance) {
        // World-space forward vector: transform camera-space -Z by inverse rotation
        const R_inverse = mat4.create();
        mat4.invert(R_inverse, this.R);
        const forwardCam = vec3.fromValues(0, 0, -1); // camera looks along -Z in its local space
        const fwdWorld = vec3.create();
        vec3.transformMat4(fwdWorld, forwardCam, R_inverse);
        // Normalise to get direction only
        const len = Math.hypot(fwdWorld[0], fwdWorld[1], fwdWorld[2]);
        if (len > 0) {
            fwdWorld[0] /= len;
            fwdWorld[1] /= len;
            fwdWorld[2] /= len;
        }
        // Update camera position
        this.cam_pos[0] += fwdWorld[0] * distance;
        this.cam_pos[1] += fwdWorld[1] * distance;
        this.cam_pos[2] += fwdWorld[2] * distance;
        // Rebuild translation matrix and view matrix
        const identity = mat4.create();
        mat4.translate(this.T, identity, this.cam_pos);
        this.refreshViewMatrix();
    }
    translate(distance) {
        this.cam_pos[2] = distance + 1;
        const identity = mat4.create();
        mat4.translate(this.T, identity, this.cam_pos);
        this.refreshViewMatrix();
    }
    rotateX(sign) {
        if (this.lockRotX)
            return;
        const factorRad = sign * 0.01;
        this.theta += factorRad;
        mat4.rotate(this.R, this.R, factorRad, [1, 0, 0]);
        this.refreshViewMatrix();
    }
    rotateY(sign) {
        if (this.lockRotY)
            return;
        const factorRad = sign * 0.01;
        this.phi += factorRad;
        mat4.rotate(this.R, this.R, factorRad, [0, 1, 0]);
        this.refreshViewMatrix();
    }
    rotateZ(sign) {
        if (this.lockRotZ)
            return;
        const factorRad = sign * 0.01;
        // this.phi += factorRad;
        mat4.rotate(this.R, this.R, factorRad, [0, 0, 1]);
        this.refreshViewMatrix();
    }
    rotateXRadian(radian) {
        if (this.lockRotX)
            return;
        mat4.rotate(this.R, this.R, radian, [1, 0, 0]);
        this.refreshViewMatrix();
    }
    rotateYRadian(radian) {
        if (this.lockRotY)
            return;
        this.phi += radian;
        mat4.rotate(this.R, this.R, radian, [0, 1, 0]);
        this.refreshViewMatrix();
    }
    rotateZRadian(radian) {
        if (this.lockRotZ)
            return;
        mat4.rotate(this.R, this.R, radian, [0, 0, 1]);
        this.refreshViewMatrix();
    }
    rotate(phi, theta) {
        // If Z is locked, completely disable orbit rotation
        if (this.lockRotZ) {
            return;
        }
        const totRot = Math.sqrt(phi * phi + theta * theta);
        if (totRot === 0)
            return;
        // If both X and Y rotations are locked, nothing to do
        if (this.lockRotX && this.lockRotY) {
            return;
        }
        const pos = this.getCameraPosition();
        const dist2Center = Math.sqrt(pos[0] * pos[0] + pos[1] * pos[1] + pos[2] * pos[2]);
        const distanceFromSurface = Math.max(dist2Center - 1, 1e-6);
        const normalizedDistance = Math.min(1, distanceFromSurface / 0.45);
        const distanceFactor = 0.02 + 0.98 * Math.pow(normalizedDistance, 1.55);
        // Keep tiny FoV more stable and predictable while preserving responsiveness
        // at medium and wide fields of view.
        const normalizedFoV = Math.min(1, this.FoV / 18);
        const fovFactor = 0.06 + 1.55 * Math.pow(normalizedFoV, 0.52);
        const usedRot = ((totRot * distanceFactor * fovFactor) / 1.9) * this.rotationSensitivity;
        // Build an axis from phi/theta, but zero components that are locked
        let axisX = this.lockRotX ? 0 : theta;
        let axisY = this.lockRotY ? 0 : phi;
        const axisLen = Math.sqrt(axisX * axisX + axisY * axisY);
        // If after locking we have no axis left, do nothing
        if (axisLen === 0) {
            return;
        }
        axisX /= axisLen;
        axisY /= axisLen;
        mat4.rotate(this.R, this.R, -usedRot, [axisX, axisY, 0]);
        this.refreshViewMatrix();
    }
    setRotationSensitivity(value) {
        this.rotationSensitivity = Math.min(3, Math.max(0.2, value));
    }
    getRotationSensitivity() {
        return this.rotationSensitivity;
    }
    // rotate(phi: number, theta: number): void {
    //   // totRot is the magnitude of the requested rotation
    //   const totRot = Math.sqrt(phi * phi + theta * theta);
    //   if (totRot === 0) return;
    //   // If both X and Y rotations are locked, nothing to do
    //   if (this.lockRotX && this.lockRotY) {
    //     return;
    //   }
    //   const pos = this.getCameraPosition();
    //   const dist2Center = Math.sqrt(pos[0] * pos[0] + pos[1] * pos[1] + pos[2] * pos[2]);
    //   const usedRot = (totRot * (dist2Center - 1)) / 3.0;
    //   // Build an axis from phi/theta, but zero components that are locked
    //   let axisX = this.lockRotX ? 0 : theta;
    //   let axisY = this.lockRotY ? 0 : phi;
    //   const axisLen = Math.sqrt(axisX * axisX + axisY * axisY);
    //   // If after locking we have no axis left, do nothing
    //   if (axisLen === 0) {
    //     return;
    //   }
    //   axisX /= axisLen;
    //   axisY /= axisLen;
    //   mat4.rotate(this.R, this.R, -usedRot, [axisX, axisY, 0]);
    //   this.refreshViewMatrix();
    // }
    // rotate(phi: number, theta: number): void {
    //   const totRot = Math.sqrt(phi * phi + theta * theta);
    //   if (totRot === 0) return;
    //   const pos = this.getCameraPosition();
    //   const dist2Center = Math.sqrt(pos[0] * pos[0] + pos[1] * pos[1] + pos[2] * pos[2]);
    //   const usedRot = (totRot * (dist2Center - 1)) / 3.0;
    //   mat4.rotate(this.R, this.R, -usedRot, [theta / totRot, phi / totRot, 0]);
    //   this.refreshViewMatrix();
    // }
    refreshViewMatrix() {
        const T_inverse = mat4.create();
        const R_inverse = mat4.create();
        mat4.invert(T_inverse, this.T);
        mat4.invert(R_inverse, this.R);
        mat4.multiply(this.vMatrix, T_inverse, R_inverse);
    }
    refreshFoV(currentFoV) {
        this.previousFoV = this.FoV;
        this.FoV = currentFoV;
    }
    getCameraMatrix() {
        return this.vMatrix;
    }
    getCameraPosition() {
        const inv = mat4.create();
        if (!mat4.invert(inv, this.vMatrix)) {
            // fallback — we already maintain cam_pos
            return [this.cam_pos[0], this.cam_pos[1], this.cam_pos[2]];
        }
        return [inv[12], inv[13], inv[14]];
    }
    setCameraMatrix(viewMatrix) {
        this.vMatrix = viewMatrix;
    }
    setCameraPosition(position) {
        // Update authoritative position
        this.cam_pos = vec3.fromValues(position[0], position[1], position[2]);
        // Rebuild translation matrix from cam_pos
        mat4.translate(this.T, mat4.create(), this.cam_pos);
        // Do NOT touch this.R here (keep orientation)
        // Recompute view: vMatrix = inv(T) * inv(R)
        this.refreshViewMatrix();
    }
    getCameraAngle() {
        const [x, y, z] = this.getCameraPosition();
        const posVec = vec3.fromValues(x, y, z);
        const ptDeg = cartesianToSpherical(posVec);
        // eslint-disable-next-line no-console
        console.log("[Camera::getCameraAngle]", ptDeg);
        return ptDeg;
    }
    /**
     * Lock/unlock rotation around world axes X, Y, Z.
     * Passing `undefined` leaves that axis as-is.
     */
    setRotationLock(options) {
        if (options.x !== undefined)
            this.lockRotX = options.x;
        if (options.y !== undefined)
            this.lockRotY = options.y;
        if (options.z !== undefined)
            this.lockRotZ = options.z;
    }
    /** Convenience helpers */
    clearRotationLock() {
        this.lockRotX = this.lockRotY = this.lockRotZ = false;
    }
    isRotationLockedX() { return this.lockRotX; }
    isRotationLockedY() { return this.lockRotY; }
    isRotationLockedZ() { return this.lockRotZ; }
}
export default Camera;
