import { mat4, ReadonlyMat4, ReadonlyVec3, vec3 } from 'gl-matrix';

import Camera from '../Camera.js';
import { AbstractSkyEntity } from './AbstractSkyEntity.js';
import { radToDeg } from '../utils/Utils.js';

type FoVComputed = {
  angleDeg: number;
  distance: number;
}

type GL = WebGLRenderingContext | WebGL2RenderingContext;

export class SphereFoV {
  private static readonly MIN_FOV_DEG = 1e-6;

  private fovXDeg = 180;
  private fovYDeg = 180;
  private ratio = 0;
  private _minFoV = 180;
  private _webgl: WebGL2RenderingContext;
  private _lastModel: AbstractSkyEntity | null = null;
  private _lastCamera: Camera | null = null;

  constructor(webgl: WebGL2RenderingContext) {
    this._webgl = webgl;
  }

  public getFoV(
    insideSphere: boolean,
    model: AbstractSkyEntity,
    camera: Camera,
    pMatrix: ReadonlyMat4,
  ): SphereFoV {
    this._lastModel = model;
    this._lastCamera = camera;

    const canvas = this._webgl.canvas as HTMLCanvasElement | undefined;
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

  private computeRatio(camera: Camera): number {
    const pos = camera.getCameraPosition();
    const distanceFromCenter = Math.sqrt(pos[0] * pos[0] + pos[1] * pos[1] + pos[2] * pos[2]);
    return distanceFromCenter / this.fovYDeg;
  }

  get minFoV(): number {
    const minFov = this.fovYDeg <= this.fovXDeg ? this.fovYDeg : this.fovXDeg;
    this._minFoV = Math.max(minFov, SphereFoV.MIN_FOV_DEG);
    return this._minFoV;
  }

  get xFoV(): number {
    return this.fovXDeg;
  }

  get yFoV(): number {
    return this.fovYDeg;
  }

  public computeDistanceFromAngle(angleDeg: number): number {
    return angleDeg * this.ratio;
  }

  public changeMinFov(deg: number): void {
    if (this.fovYDeg <= this.fovXDeg) {
      this.fovYDeg = deg;
    } else {
      this.fovXDeg = deg;
    }
    this.minFoV;
  }

  public computeCameraPositionForMinFoV(targetMinFoVDeg: number): [number, number, number] {
    return this.computeCameraPositionForFoV(targetMinFoVDeg);
  }

  public computeCameraPositionForFoV(targetFoVDeg: number): [number, number, number] {
    return this.computeCameraPositionForAngularDiameter(targetFoVDeg);
  }

  public computeCameraPositionForAngularDiameter(targetAngularDiameterDeg: number): [number, number, number] {
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
    const direction = vec3.fromValues(
      camPos[0] - model.center[0],
      camPos[1] - model.center[1],
      camPos[2] - model.center[2],
    );

    if (vec3.length(direction) < eps) {
      vec3.set(direction, 0, 0, 1);
    } else {
      vec3.normalize(direction, direction);
    }

    return [
      model.center[0] + direction[0] * targetDistance,
      model.center[1] + direction[1] * targetDistance,
      model.center[2] + direction[2] * targetDistance,
    ];
  }

  private computeAngle(
    canvasX: number,
    canvasY: number,
    insideSphere: boolean,
    model: AbstractSkyEntity,
    camera: Camera,
    pMatrix: ReadonlyMat4,
  ): FoVComputed {
    const canvas = this._webgl.canvas as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const centerHit = this.getIntersectionPointWithModel(rect.width / 2, rect.height / 2, model, camera, pMatrix);
    const edgeHit = this.getIntersectionPointWithModel(canvasX, canvasY, model, camera, pMatrix);

    if (!centerHit || !edgeHit) {
      return { angleDeg: 180, distance: -1 };
    }

    const angleDeg = 2 * this.computeAngularDistanceDeg(centerHit.point, edgeHit.point);
    return {
      angleDeg: insideSphere ? 360 - angleDeg : angleDeg,
      distance: edgeHit.distance,
    };
  }

  private computeAngularDistanceDeg(a: ReadonlyVec3, b: ReadonlyVec3): number {
    const aNorm = vec3.normalize(vec3.create(), a);
    const bNorm = vec3.normalize(vec3.create(), b);
    const dot = vec3.dot(aNorm, bNorm);
    const clamped = Math.min(1, Math.max(-1, dot));
    return radToDeg(Math.acos(clamped));
  }

  private getIntersectionPointWithModel(
    mouseX: number,
    mouseY: number,
    model: AbstractSkyEntity,
    camera: Camera,
    pMatrix: ReadonlyMat4,
  ): { point: vec3; distance: number } | null {
    const rayWorld = this.getRayFromMouse(mouseX, mouseY, pMatrix, camera.getCameraMatrix());
    const distance = this.raySphere(camera.getCameraPosition(), rayWorld, model);

    if (distance < 0) {
      return null;
    }

    const worldHit = vec3.create();
    vec3.scale(worldHit, rayWorld, distance);
    vec3.add(worldHit, camera.getCameraPosition(), worldHit);

    const worldHit4: [number, number, number, number] = [worldHit[0], worldHit[1], worldHit[2], 1.0];
    const modelHit4: [number, number, number, number] = [0, 0, 0, 0];
    this.mat4MultiplyVec4(model.getModelMatrixInverse(), worldHit4, modelHit4);

    return {
      point: vec3.fromValues(modelHit4[0], modelHit4[1], modelHit4[2]),
      distance,
    };
  }

  private getRayFromMouse(
    mouseX: number,
    mouseY: number,
    pMatrix: ReadonlyMat4,
    vMatrix: ReadonlyMat4,
  ): vec3 {
    const gl = this._webgl as GL;
    const canvas = gl.canvas as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();

    const x = (2.0 * mouseX) / rect.width - 1.0;
    const y = 1.0 - (2.0 * mouseY) / rect.height;
    const rayClip: [number, number, number, number] = [x, y, -1.0, 1.0];

    const pInv = mat4.create();
    mat4.invert(pInv, pMatrix);
    const rayEye4: [number, number, number, number] = [0, 0, 0, 0];
    this.mat4MultiplyVec4(pInv, rayClip, rayEye4);

    const rayEye: [number, number, number, number] = [rayEye4[0], rayEye4[1], -1.0, 0.0];
    const vInv = mat4.create();
    mat4.invert(vInv, vMatrix);
    const rayWorld4: [number, number, number, number] = [0, 0, 0, 0];
    this.mat4MultiplyVec4(vInv, rayEye, rayWorld4);

    const rayWorld = vec3.fromValues(rayWorld4[0], rayWorld4[1], rayWorld4[2]);
    vec3.normalize(rayWorld, rayWorld);
    return rayWorld;
  }

  private raySphere(
    rayOrigWorld: ReadonlyVec3,
    rayDirectionWorld: ReadonlyVec3,
    sphere: Pick<AbstractSkyEntity, 'center' | 'radius'>,
  ): number {
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
    } else if (disc === 0.0) {
      const t = -b;
      if (t >= 0.0) {
        intersectionDistance = t;
      }
    }

    return intersectionDistance;
  }

  private mat4MultiplyVec4(
    m: ReadonlyMat4,
    v: [number, number, number, number],
    out: [number, number, number, number],
  ): void {
    out[0] = m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12] * v[3];
    out[1] = m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13] * v[3];
    out[2] = m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14] * v[3];
    out[3] = m[3] * v[0] + m[7] * v[1] + m[11] * v[2] + m[15] * v[3];
  }
}
