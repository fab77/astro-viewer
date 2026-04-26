/**
 * @author Fabrizio Giordano (Fab)
 */
import { vec3, mat4 } from "gl-matrix";
import { type SphericalCoords } from "./utils/Utils.js";
type Vec3Tuple = [number, number, number];
interface CameraLike {
    getCameraMatrix(): mat4;
}
declare class Camera implements CameraLike {
    private insideSphere;
    private cam_pos;
    private cam_speed;
    private vMatrix;
    private T;
    private R;
    private FoV;
    private previousFoV;
    private move;
    private phi;
    private theta;
    private rotationSensitivity;
    private lockRotX;
    private lockRotY;
    private lockRotZ;
    constructor(in_position: vec3, in_sphere: boolean);
    private init;
    goTo(raDeg: number, decDeg: number): void;
    private goToPhiTheta;
    toggleInsideSphere(): void;
    zoom(inertia: number): void;
    /**
     * Move the camera forward/backward along its current viewing direction.
     * Positive distance moves *forward* (toward where the camera is looking),
     * negative distance moves *backward*.
     *
     * This does not enforce inside/outside-sphere bounds; if you want clamping,
     * handle it before calling or we can extend this to mimic `zoom()` bounds.
     */
    moveAlongView(distance: number): void;
    translate(distance: number): void;
    rotateX(sign: number): void;
    rotateY(sign: number): void;
    rotateZ(sign: number): void;
    rotateXRadian(radian: number): void;
    rotateYRadian(radian: number): void;
    rotateZRadian(radian: number): void;
    rotate(phi: number, theta: number): void;
    setRotationSensitivity(value: number): void;
    getRotationSensitivity(): number;
    private refreshViewMatrix;
    refreshFoV(currentFoV: number): void;
    getCameraMatrix(): mat4;
    getCameraPosition(): Vec3Tuple;
    setCameraMatrix(viewMatrix: Float32Array<ArrayBufferLike>): void;
    setCameraPosition(position: [number, number, number]): void;
    getCameraAngle(): SphericalCoords;
    /**
     * Lock/unlock rotation around world axes X, Y, Z.
     * Passing `undefined` leaves that axis as-is.
     */
    setRotationLock(options: {
        x?: boolean;
        y?: boolean;
        z?: boolean;
    }): void;
    /** Convenience helpers */
    clearRotationLock(): void;
    isRotationLockedX(): boolean;
    isRotationLockedY(): boolean;
    isRotationLockedZ(): boolean;
}
export default Camera;
