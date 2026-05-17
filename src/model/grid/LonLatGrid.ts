/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { mat4, ReadonlyMat4 } from 'gl-matrix';

import { AbstractSkyEntity, SkyEntityDrawInput } from '../AbstractSkyEntity.js';
import { xyzFovHelper } from '../earth2/XYZFoVHelper.js';
import GridShaderManager from '../../shader/GridShaderManager.js';
import { colorHex2RGB, degToRad } from '../../utils/Utils.js';
import { FoV } from '../FoV.js';
import global from '../../Global.js';

type GL = WebGLRenderingContext | WebGL2RenderingContext;

export class LatLonGrid extends AbstractSkyEntity {
  static ELEM_SIZE = 3;
  static BYTES_X_ELEM = new Float32Array().BYTES_PER_ELEMENT;

  private _shaderProgram!: WebGLProgram;
  private _vertexShader!: WebGLShader;
  private _fragmentShader!: WebGLShader;
  private _attribLocations = {
    position: 0,
  };

  private _lonVertexPositionBuffer!: WebGLBuffer;
  private _latVertexPositionBuffer!: WebGLBuffer;

  private _lonStep = 10;
  private _latStep = 10;
  private _segmentStep = 1;
  private _fovObj: FoV;
  private _fovDeg = 180;
  private _showGrid = true;
  private _lonArray: Float32Array[] = [];
  private _latArray: Float32Array[] = [];
  private defaultColor = '#41d4d4';

  constructor(
    radius: number,
    position: [number, number, number],
    xrad: number,
    yrad: number,
    name: string,
    webgl: WebGL2RenderingContext,
  ) {
    super(radius, position, xrad, yrad, name, webgl);

    this._fovObj = new FoV(webgl);
    this.init();
  }

  init(): void {
    this.initGL(super.webgl as GL);

    const gl = super.webgl as GL;
    this._shaderProgram = gl.createProgram() as WebGLProgram;
    this.initShaders();

    this._lonVertexPositionBuffer = gl.createBuffer()!;
    this._latVertexPositionBuffer = gl.createBuffer()!;

    this.initBuffers(this._fovDeg);
  }

  private initShaders(): void {
    const gl = super.webgl as GL;

    const fsSource = GridShaderManager.healpixGridFS();
    this._fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(this._fragmentShader, fsSource);
    gl.compileShader(this._fragmentShader);
    if (!gl.getShaderParameter(this._fragmentShader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(this._fragmentShader) || 'Unknown fragment shader error';
      console.error(log);
      alert(log);
      return;
    }

    const vsSource = GridShaderManager.healpixGridVS();
    this._vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(this._vertexShader, vsSource);
    gl.compileShader(this._vertexShader);
    if (!gl.getShaderParameter(this._vertexShader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(this._vertexShader) || 'Unknown vertex shader error';
      console.error(log);
      alert(log);
      return;
    }

    gl.attachShader(this._shaderProgram, this._vertexShader);
    gl.attachShader(this._shaderProgram, this._fragmentShader);
    gl.linkProgram(this._shaderProgram);

    if (!gl.getProgramParameter(this._shaderProgram, gl.LINK_STATUS)) {
      alert('Could not initialise shaders');
    }

    gl.useProgram(this._shaderProgram);
  }

  private initBuffers(fovDeg: number): void {
    const steps = xyzFovHelper.getLonLatSteps(fovDeg);
    this._lonStep = steps.lonStep;
    this._latStep = steps.latStep;
    this._segmentStep = Math.max(Math.min(this._lonStep, this._latStep), 0.25);
    this._lonArray = [];
    this._latArray = [];

    for (let lon = -180; lon < 180; lon += this._lonStep) {
      const vertices: number[] = [];
      for (let lat = -90; lat <= 90; lat += this._segmentStep) {
        vertices.push(...this.lonLatToCartesian(lon, Math.min(lat, 90)));
      }
      this._lonArray.push(new Float32Array(vertices));
    }

    for (let lat = -90 + this._latStep; lat < 90; lat += this._latStep) {
      const vertices: number[] = [];
      for (let lon = -180; lon <= 180; lon += this._segmentStep) {
        vertices.push(...this.lonLatToCartesian(Math.min(lon, 180), lat));
      }
      this._latArray.push(new Float32Array(vertices));
    }
  }

  private lonLatToCartesian(lonDeg: number, latDeg: number): [number, number, number] {
    const lonRad = degToRad(lonDeg);
    const latRad = degToRad(latDeg);
    const cosLat = Math.cos(latRad);

    return [
      cosLat * Math.cos(lonRad),
      cosLat * Math.sin(lonRad),
      Math.sin(latRad),
    ];
  }

  private refresh(fovDeg: number): void {
    if (Math.abs(this._fovDeg - fovDeg) > 1e-6) {
      this._fovDeg = fovDeg;
      this.initBuffers(this._fovDeg);
    }
  }

  refreshFoV(input: SkyEntityDrawInput): number {
    if (!input.camera || !input.pMatrix) return this._fovDeg;

    this._fovObj.getFoV(global.insideSphere, this as any, input.camera, input.pMatrix);
    this.refresh(this._fovObj.minFoV);
    return this._fovObj.minFoV;
  }

  getMinFoVDeg(): number {
    return this._fovObj.minFoV;
  }

  isVisible(): boolean {
    return this._showGrid;
  }

  toggleShowGrid(): boolean {
    this._showGrid = !this._showGrid;
    return this._showGrid;
  }

  setShowGrid(showGrid: boolean): void {
    this._showGrid = showGrid;
  }

  private enableShader(mMatrix: ReadonlyMat4, pMatrix: ReadonlyMat4, vMatrix: ReadonlyMat4): void {
    const gl = super.webgl as GL;
    gl.useProgram(this._shaderProgram);

    const mvMatrix = mat4.create();
    mat4.multiply(mvMatrix, vMatrix as mat4, mMatrix);

    const uMVMatrixLoc = gl.getUniformLocation(this._shaderProgram, 'uMVMatrix');
    const uPMatrixLoc = gl.getUniformLocation(this._shaderProgram, 'uPMatrix');
    const uColor = gl.getUniformLocation(this._shaderProgram, 'u_fragcolor');

    this._attribLocations.position = gl.getAttribLocation(this._shaderProgram, 'aCatPosition');

    if (uMVMatrixLoc) gl.uniformMatrix4fv(uMVMatrixLoc, false, mvMatrix as Float32Array);
    if (uPMatrixLoc) gl.uniformMatrix4fv(uPMatrixLoc, false, pMatrix as Float32Array);
    if (uColor) {
      const rgb = colorHex2RGB(this.defaultColor);
      gl.uniform4f(uColor, rgb[0], rgb[1], rgb[2], 1.0);
    }
  }

  draw(input: SkyEntityDrawInput): void {
    if (!this._showGrid) return;

    const gl = super.webgl as GL;
    const camera = input.camera;
    if (!camera) return;

    const pMatrix = input.pMatrix;
    if (!pMatrix) return;

    this.refreshFoV(input);

    const vMatrix = camera.getCameraMatrix();
    if (!vMatrix) return;

    const mMatrix = this.getModelMatrix();
    this.enableShader(mMatrix, pMatrix, vMatrix);

    for (const lonLine of this._lonArray) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this._lonVertexPositionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, lonLine, gl.STATIC_DRAW);
      gl.vertexAttribPointer(this._attribLocations.position, LatLonGrid.ELEM_SIZE, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(this._attribLocations.position);
      gl.drawArrays(gl.LINE_STRIP, 0, lonLine.length / LatLonGrid.ELEM_SIZE);
    }

    for (const latLine of this._latArray) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this._latVertexPositionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, latLine, gl.STATIC_DRAW);
      gl.vertexAttribPointer(this._attribLocations.position, LatLonGrid.ELEM_SIZE, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(this._attribLocations.position);
      gl.drawArrays(gl.LINE_LOOP, 0, latLine.length / LatLonGrid.ELEM_SIZE);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  }
}
