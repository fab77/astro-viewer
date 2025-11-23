/**
 * @author Fabrizio Giordano (Fab)
 */

import { vec3, mat4, ReadonlyVec3, ReadonlyMat4 } from "gl-matrix";
import global from "../Global.js";

import { HiPSShaderProgram } from '../shader/HiPSShaderProgram.js'
// import { VisibleTilesManager } from "./hips/VisibleTilesManager.js";
// import { TileBuffer } from "./hips/TileBuffer.js";
import Camera from "../Camera.js";

type GL = WebGLRenderingContext | WebGL2RenderingContext;

export interface SkyEntityDrawInput {
  fovDeg?: number
  // cameraMatrix?: Float32Array
  camera: Camera
  pMatrix: ReadonlyMat4
}

export abstract class AbstractSkyEntity {
  // Public-ish properties used elsewhere in the app
  public refreshMe = false;
  public fovX_deg = 180;
  public fovY_deg = 180;
  public xRad: number;
  public yRad: number;
  public prevFoV = this.fovX_deg;
  public name: string;
  // public insideSphere: boolean = bootSetup.insideSphere

  // Picking/sphere
  public center: vec3;
  public radius: number;
  public isGalacticHips: boolean;

  // GL resources
  protected vertexTextureCoordBuffer: WebGLBuffer | null = null;
  protected vertexPositionBuffer: WebGLBuffer | null = null;
  protected vertexIndexBuffer: WebGLBuffer | null = null;
  protected shaderProgram: WebGLProgram | null = null;

  // Matrices
  protected T: mat4 = mat4.create();
  protected R: mat4 = mat4.create();
  protected modelMatrix: mat4 = mat4.create();
  protected inverseModelMatrix: mat4 = mat4.create();

  // Precomputed transform from galactic to equatorial (already inverted)
  protected galacticMatrixInverted: mat4 = mat4.create();

  protected _webgl: WebGL2RenderingContext
  protected _hipsShaderProgram: HiPSShaderProgram;
  // protected _visibleTilesManager: VisibleTilesManager
  // protected _tileBuffer: TileBuffer

  constructor(
    in_radius: number,
    in_position: ReadonlyVec3,
    in_xRad: number,
    in_yRad: number,
    in_name: string,
    webgl: WebGL2RenderingContext,
    isGalacticHips?: boolean,
  ) {
    this._webgl = webgl
    this.xRad = in_xRad;
    this.yRad = in_yRad;
    this.name = in_name;
    this.center = vec3.clone(in_position);
    this.radius = in_radius;
    // this.insideSphere = global.insideSphere
    this.isGalacticHips = !!isGalacticHips;

    // Fill the matrix via Float32Array.set (safer than mat4.set with 16 scalars)
    mat4.set(
      this.galacticMatrixInverted,
      -0.054875582456588745, -0.8734370470046997,  -0.48383501172065735, 0,
       0.49410945177078247,  -0.4448296129703522,   0.7469822764396667,  0,
      -0.8676661849021912,  -0.19807636737823486,  0.4559837877750397,  0,
       0,                    0,                     0,                   1,
    )
    // this._tileBuffer = new TileBuffer(1, this._webgl)
    // this._visibleTilesManager = new VisibleTilesManager(this._tileBuffer)
    
    // this._visibleTilesManager = new VisibleTilesManager()
    this._hipsShaderProgram = new HiPSShaderProgram(this._webgl)
  }

  get hipsShaderProgram() {
    return this._hipsShaderProgram
  }
  // get tileBuffer() {
  //   return this._tileBuffer
  // }
  get webgl() {
    return this._webgl
  }
  /** GL setup and initial model transform */
  initGL(gl: GL): void {
    // GL resources
    this.vertexTextureCoordBuffer = gl.createBuffer();
    this.vertexPositionBuffer = gl.createBuffer();
    this.vertexIndexBuffer = gl.createBuffer();
    this.shaderProgram = gl.createProgram();

    // Reset object transforms
    this.T = mat4.create();
    this.R = mat4.create();
    this.modelMatrix = mat4.create();
    this.inverseModelMatrix = mat4.create();

    // Initial pose
    this.translate(this.center);
    this.rotate(this.xRad, this.yRad);
  }

  translate(translation: ReadonlyVec3): void {
    mat4.translate(this.T, this.T, translation);
    this.refreshModelMatrix();
  }

  rotate(rad1: number, rad2: number): void {
    mat4.rotate(this.R, this.R, rad2, [0, 0, 1]);
    mat4.rotate(this.R, this.R, rad1, [1, 0, 0]);
    this.refreshModelMatrix();
  }

  rotateFromZero(rad1: number, rad2: number): void {
    mat4.identity(this.R);
    mat4.rotate(this.R, this.R, rad1, [1, 0, 0]);
    mat4.rotate(this.R, this.R, rad2, [0, 0, 1]);
    this.refreshModelMatrix();
  }

  protected refreshModelMatrix(): void {
    const R_inverse = mat4.create();
    mat4.invert(R_inverse, this.R);
    mat4.multiply(this.modelMatrix, this.T, R_inverse);

    // Flip Y if we're outside the sphere
    if (!global.insideSphere) {
      this.modelMatrix[1]  = -this.modelMatrix[1];
      this.modelMatrix[5]  = -this.modelMatrix[5];
      this.modelMatrix[9]  = -this.modelMatrix[9];
      this.modelMatrix[13] = -this.modelMatrix[13];
    }

    // Apply galactic frame transform if needed
    if (this.isGalacticHips) {
      mat4.multiply(this.modelMatrix, this.modelMatrix, this.galacticMatrixInverted);
    }
  }

  getModelMatrixInverse(): ReadonlyMat4 {
    mat4.identity(this.inverseModelMatrix);
    mat4.invert(this.inverseModelMatrix, this.modelMatrix);
    return this.inverseModelMatrix;
  }

  getModelMatrix(): ReadonlyMat4 {
    return this.modelMatrix;
  }

  /** Children with hierarchical geometry (e.g., HiPS) can override this. */
  setGeometryNeedsToBeRefreshed(): void {
    (this as any).refreshGeometryOnFoVChanged = false;
  }

  // Helpers operating on raw mat4 buffers (kept from your JS)
  rotateX(m: mat4, angle: number): mat4 {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const mv1 = m[1], mv5 = m[5], mv9 = m[9];

    m[1]  = m[1]  * c - m[2]  * s;
    m[5]  = m[5]  * c - m[6]  * s;
    m[9]  = m[9]  * c - m[10] * s;

    m[2]  = m[2]  * c + mv1 * s;
    m[6]  = m[6]  * c + mv5 * s;
    m[10] = m[10] * c + mv9 * s;

    return m;
  }

  rotateY(m: mat4, angle: number): mat4 {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const mv0 = m[0], mv4 = m[4], mv8 = m[8];

    m[0]  = c * m[0]  + s * m[2];
    m[4]  = c * m[4]  + s * m[6];
    m[8]  = c * m[8]  + s * m[10];

    m[2]  = c * m[2]  - s * mv0;
    m[6]  = c * m[6]  - s * mv4;
    m[10] = c * m[10] - s * mv8;

    return m;
  }

  // ---------- Abstract hooks ----------
  
  abstract draw(input: SkyEntityDrawInput): void;

}