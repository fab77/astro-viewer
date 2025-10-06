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
    constructor(in_position: vec3, in_sphere: boolean);
    private init;
    goTo(raDeg: number, decDeg: number): void;
    private goToPhiTheta;
    setInsideSphere(inside: boolean): void;
    zoom(inertia: number): void;
    rotateZ(sign: number): void;
    rotateY(sign: number): void;
    rotateXRadian(radian: number): void;
    rotateYRadian(radian: number): void;
    rotateZRadian(radian: number): void;
    rotateX(sign: number): void;
    rotate(phi: number, theta: number): void;
    private refreshViewMatrix;
    refreshFoV(currentFoV: number): void;
    getCameraMatrix(): mat4;
    getCameraPosition(): Vec3Tuple;
    getCameraAngle(): SphericalCoords;
}
export default Camera;
//# sourceMappingURL=Camera.d.ts.map