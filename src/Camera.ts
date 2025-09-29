/**
 * @author Fabrizio Giordano (Fab)
 */
import { vec3, mat4 } from "gl-matrix";
import global from "./Global"; // keep your Global.ts exporting a default object
import {
  astroDegToSpherical,
  cartesianToSpherical,
  sphericalToCartesian,
  type SphericalCoords,
} from "./utils/Utils";

type Vec3Tuple = [number, number, number];

interface CameraLike {
  getCameraMatrix(): mat4;
}

class Camera implements CameraLike {
  private insideSphere = false;

  private cam_pos: vec3 = vec3.create();  // camera position
  private cam_speed = 1.0;

  private vMatrix: mat4 = mat4.create();  // view matrix
  private T: mat4 = mat4.create();        // translation matrix
  private R: mat4 = mat4.create();        // rotation matrix

  // Optional state used in rotate helpers
  private FoV = 180.0;
  private previousFoV = 180.0;
  private move: vec3 = vec3.create();
  private phi = 0;     // accumulated yaw (radians)
  private theta = 0;   // accumulated pitch (radians)

  constructor(in_position: vec3, in_sphere: boolean) {
    this.init(in_position, in_sphere);
  }

  private init(in_position: vec3, in_sphere: boolean): void {
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

  goTo(raDeg: number, decDeg: number): void {
    // eslint-disable-next-line no-console
    console.log(`global.insideSphere: ${global.insideSphere}`);
    // mirror RA
    const mirroredRA = 360 - raDeg;
    this.goToPhiTheta(astroDegToSpherical(mirroredRA, decDeg));
  }

  private goToPhiTheta(ptDeg: SphericalCoords): void {
    const xyz = sphericalToCartesian(ptDeg.phi, ptDeg.theta, this.cam_pos[2]);

    let cameraMatrix = mat4.create();
    cameraMatrix = mat4.translate(cameraMatrix, cameraMatrix, vec3.fromValues(xyz[0], xyz[1], xyz[2]));

    const focusPoint: Vec3Tuple = [0.0, 0.0, 0.0];
    const cameraUp: vec3 = vec3.clone([0.0, 1.0, 0.0]);
    const cameraPos: Vec3Tuple = [cameraMatrix[12], cameraMatrix[13], cameraMatrix[14]];

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

  setInsideSphere(inside: boolean): void {
    if (inside !== this.insideSphere) {
      this.insideSphere = inside;

      if (this.insideSphere) {
        if (this.cam_pos[2] <= 2) {
          this.cam_pos[2] = -2 + this.cam_pos[2];
        } else {
          this.cam_pos[2] = -0.005;
        }
      } else {
        this.cam_pos[2] = 2.0 + this.cam_pos[2];
      }

      mat4.translate(this.T, mat4.create(), this.cam_pos);
      this.refreshViewMatrix();
    }
  }

  zoom(inertia: number): void {
    this.move = vec3.clone([0, 0, 0]);
    this.move[2] += this.cam_speed * inertia;

    if (this.insideSphere) {
      if (this.cam_pos[2] + this.move[2] >= -0.005 && inertia > 0) {
        this.cam_pos[2] = -0.005;
        inertia = 0;
      } else if (this.cam_pos[2] + this.move[2] <= -0.9885 && inertia < 0) {
        this.cam_pos[2] = -0.9885;
        inertia = 0;
      } else {
        this.cam_pos[2] += this.move[2];
      }
    } else {
      if (this.cam_pos[2] < 1.005) {
        this.move[2] *= this.cam_pos[2] / 100;
      } else if (this.cam_pos[2] < 1.05) {
        this.move[2] *= this.cam_pos[2] / 20;
      } else if (this.cam_pos[2] < 1.3) {
        this.move[2] *= this.cam_pos[2] / 3;
      }
      if (this.cam_pos[2] + this.move[2] <= 1.000001 && inertia < 0) {
        this.cam_pos[2] = 1.000001;
      } else {
        this.cam_pos[2] += this.move[2];
      }

      // NOTE: your original code adds move[2] twice; if that's unintended, remove this next line.
      this.cam_pos[2] += this.move[2];
    }

    const identity = mat4.create();
    mat4.translate(this.T, identity, this.cam_pos);

    this.refreshViewMatrix();
  }

  rotateZ(sign: number): void {
    const factorRad = sign * 0.01;
    this.phi += factorRad;
    mat4.rotate(this.R, this.R, factorRad, [0, 0, 1]);
    this.refreshViewMatrix();
  }

  rotateY(sign: number): void {
    const factorRad = sign * 0.01;
    this.phi += factorRad;
    mat4.rotate(this.R, this.R, factorRad, [0, 1, 0]);
    this.refreshViewMatrix();
  }

  rotateXRadian(radian: number): void {
    mat4.rotate(this.R, this.R, radian, [1, 0, 0]);
    this.refreshViewMatrix();
  }

  rotateYRadian(radian: number): void {
    this.phi += radian;
    mat4.rotate(this.R, this.R, radian, [0, 1, 0]);
    this.refreshViewMatrix();
  }

  rotateZRadian(radian: number): void {
    mat4.rotate(this.R, this.R, radian, [0, 0, 1]);
    this.refreshViewMatrix();
  }

  rotateX(sign: number): void {
    const factorRad = sign * 0.01;
    this.theta += factorRad;
    mat4.rotate(this.R, this.R, factorRad, [1, 0, 0]);
    this.refreshViewMatrix();
  }

  rotate(phi: number, theta: number): void {
    const totRot = Math.sqrt(phi * phi + theta * theta);
    if (totRot === 0) return;

    const pos = this.getCameraPosition();
    const dist2Center = Math.sqrt(pos[0] * pos[0] + pos[1] * pos[1] + pos[2] * pos[2]);
    const usedRot = (totRot * (dist2Center - 1)) / 3.0;

    mat4.rotate(this.R, this.R, -usedRot, [theta / totRot, phi / totRot, 0]);
    this.refreshViewMatrix();
  }

  private refreshViewMatrix(): void {
    const T_inverse = mat4.create();
    const R_inverse = mat4.create();

    mat4.invert(T_inverse, this.T);
    mat4.invert(R_inverse, this.R);

    mat4.multiply(this.vMatrix, T_inverse, R_inverse);
  }

  refreshFoV(currentFoV: number): void {
    this.previousFoV = this.FoV;
    this.FoV = currentFoV;
  }

  getCameraMatrix(): mat4 {
    return this.vMatrix;
  }

  getCameraPosition(): Vec3Tuple {
    const vMatrix_inverse = mat4.create();
    mat4.invert(vMatrix_inverse, this.vMatrix);
    return [vMatrix_inverse[12], vMatrix_inverse[13], vMatrix_inverse[14]];
  }

  getCameraAngle(): SphericalCoords {
    const [x, y, z] = this.getCameraPosition();
    const posVec = vec3.fromValues(x, y, z);
    const ptDeg = cartesianToSpherical(posVec);
    // eslint-disable-next-line no-console
    console.log("[Camera::getCameraAngle]", ptDeg);
    return ptDeg;
  }
}

export default Camera;