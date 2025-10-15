'use strict';

import AbstractSkyEntity from '../AbstractSkyEntity.js';
import global from '../../Global.js';

import { mat4, vec4, ReadonlyMat4 } from 'gl-matrix';
import { Healpix } from 'healpixjs';

import { fovHelper } from '../hips/FoVHelper.js';
import FoVUtils from '../../utils/FoVUtils.js';
import {FoV} from '../FoV.js';

import CoordsType from '../../utils/CoordsType.js';
import Point from '../Point.js';

import GridShaderManager from '../../shader/GridShaderManager.js';
import GeomUtils from '../../utils/GeomUtils.js';
import { gridTextHelper } from './GridTextHelper.js';
import { visibleTilesManager } from '../hips/VisibleTilesManager.js';
import computePerspectiveMatrixSingleton from '../../utils/ComputePerspectiveMatrix.js';
import { bootSetup } from '../../Config.js';

type GL = WebGLRenderingContext | WebGL2RenderingContext;

interface BoundVec {
  x: number;
  y: number;
  z: number;
}


class HealpixGridSingleton extends AbstractSkyEntity {
  
  static ELEM_SIZE = 3;
  static BYTES_X_ELEM = new Float32Array().BYTES_PER_ELEMENT;

  private _visibleorder = 0;
  private showGrid: boolean = true
  private _shaderProgram!: WebGLProgram;
  private fragmentShader!: WebGLShader;
  private vertexShader!: WebGLShader;

  private _attribLocations: { position: number; selected: number; pointSize: number; color: [number, number, number, number] } = {
    position: 0,
    selected: 1,
    pointSize: 2,
    color: [0, 1, 0, 1],
  };

  private _nPrimitiveFlags = 0;

  private _vertexCataloguePositionBuffer!: WebGLBuffer;
  private _indexBuffer!: WebGLBuffer;

  private _vertexCataloguePosition: Float32Array = new Float32Array(0);
  private _indexes: Uint32Array = new Uint32Array(0);

  private fovObj!: FoV;

  static INITIAL_FOV = 180;
  static RADIUS = 1;
  static INITIAL_POSITION: [number, number, number] = [0.0, 0.0, 0.0];
  static INITIAL_PhiRad = 0;
  static INITIAL_ThetaRad = 0;



  constructor() {
    super(HealpixGridSingleton.RADIUS, HealpixGridSingleton.INITIAL_POSITION, HealpixGridSingleton.INITIAL_PhiRad, HealpixGridSingleton.INITIAL_ThetaRad, 'healpix-grid');
    // this.initGL(global.gl as GL);
  }

  init(): void {
    console.log('HealpixGridSingleton.init()');
    this.initGL(global.gl as GL);

    this._shaderProgram = (global.gl as GL).createProgram() as WebGLProgram;
    this.initShaders();

    const order = fovHelper.getHiPSNorder(HealpixGridSingleton.INITIAL_FOV);
    this._visibleorder = order;

    this._nPrimitiveFlags = 0;

    this._vertexCataloguePositionBuffer = (global.gl as GL).createBuffer()!;
    this._indexBuffer = (global.gl as GL).createBuffer()!;

    this._vertexCataloguePosition = new Float32Array(0);

    this.fovObj = new FoV();
  }

  get RADIUS(): number {
    return HealpixGridSingleton.RADIUS
  }

  refreshFoV() {
    return this.fovObj.getFoV(global.insideSphere);
  }

  getFoV(): FoV {
    return this.fovObj
  }

  getMinFoV() {
    return this.fovObj.minFoV;
  }

  private initShaders(): void {
    const gl = global.gl as GL;

    const fragmentShaderStr = GridShaderManager.healpixGridFS();
    this.fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(this.fragmentShader, fragmentShaderStr);
    gl.compileShader(this.fragmentShader);
    if (!gl.getShaderParameter(this.fragmentShader, gl.COMPILE_STATUS)) {
      alert(gl.getShaderInfoLog(this.fragmentShader) || 'Fragment shader compile error');
      return;
    }

    const vertexShaderStr = GridShaderManager.healpixGridVS();
    this.vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(this.vertexShader, vertexShaderStr);
    gl.compileShader(this.vertexShader);
    if (!gl.getShaderParameter(this.vertexShader, gl.COMPILE_STATUS)) {
      alert(gl.getShaderInfoLog(this.vertexShader) || 'Vertex shader compile error');
      return;
    }

    gl.attachShader(this._shaderProgram, this.vertexShader);
    gl.attachShader(this._shaderProgram, this.fragmentShader);
    gl.linkProgram(this._shaderProgram);

    if (!gl.getProgramParameter(this._shaderProgram, gl.LINK_STATUS)) {
      alert('Could not initialise shaders');
    }
    gl.useProgram(this._shaderProgram);
  }

  initBuffers(pixels: number[], order: number): void {

    this._nPrimitiveFlags = 0;

    const healpix: Healpix = global.getHealpix(order);
    const subhpx: Healpix = global.getHealpix(order + 1);
    const subsubhpx: Healpix = global.getHealpix(order + 2);

    let positionIndex = 0;
    let vIdx = 0;
    const R = 1.0;

    const MAX_UINT = 0xffffffff;

    this._indexes = new Uint32Array(17 * pixels.length);
    this._vertexCataloguePosition = new Float32Array(3 * 16 * pixels.length);

    for (let p = 0; p < pixels.length; p++) {
      const vecs = healpix.getBoundaries(pixels[p]) as BoundVec[];

      const cpix0 = pixels[p] << 2;
      const cpix1 = cpix0 + 1;
      const cpix2 = cpix0 + 2;
      const cpix3 = cpix0 + 3;

      const cp0vecs = subhpx.getBoundaries(cpix0) as BoundVec[];
      const cp3vecs = subhpx.getBoundaries(cpix3) as BoundVec[];

      // helper to push a vertex
      const pushV = (v: BoundVec) => {
        this._vertexCataloguePosition[positionIndex] = R * v.x;
        this._vertexCataloguePosition[positionIndex + 1] = R * v.y;
        this._vertexCataloguePosition[positionIndex + 2] = R * v.z;
        this._indexes[vIdx] = Math.floor(positionIndex / 3);
        vIdx += 1;
        positionIndex += 3;
      };

      // v0(3/0)
      pushV(vecs[0]);

      // v1(15/2)
      let subcpix3 = cpix3 << 2;
      let subcpix3_3 = subcpix3 + 3;
      let tmp = subsubhpx.getBoundaries(subcpix3_3) as BoundVec[];
      pushV(tmp[1]);

      // v1(3/1)
      pushV(cp3vecs[1]);

      // v0(2/2)
      let subcpix2 = cpix2 << 2;
      let subcpix2_2 = subcpix2 + 2;
      tmp = subsubhpx.getBoundaries(subcpix2_2) as BoundVec[];
      pushV(tmp[0]);

      // v1(0/0)
      pushV(vecs[1]);

      // v2(2/2)
      pushV(tmp[2]);

      // v1(0/1)
      pushV(cp0vecs[1]);

      // v1(0/2)
      let subcpix0 = cpix0 << 2;
      let subcpix0_2 = subcpix0;
      tmp = subsubhpx.getBoundaries(subcpix0_2) as BoundVec[];
      pushV(tmp[1]);

      // v2(0/0)
      pushV(vecs[2]);

      // v3(0/2)
      pushV(tmp[3]);

      // v3(0/1)
      pushV(cp0vecs[3]);

      // v2(5/2)
      let subcpix1 = cpix1 << 2;
      let subcpix1_1 = subcpix1 + 1;
      tmp = subsubhpx.getBoundaries(subcpix1_1) as BoundVec[];
      pushV(tmp[2]);

      // v3(0/0)
      pushV(vecs[3]);

      // v0(5/2)
      pushV(tmp[0]);

      // v3(3/1)
      pushV(cp3vecs[3]);

      tmp = subsubhpx.getBoundaries(subcpix3_3) as BoundVec[];
      pushV(tmp[3]);

      // primitive restart
      this._indexes[vIdx] = MAX_UINT;
      this._nPrimitiveFlags += 1;
      vIdx += 1;
    }

  }

  // updateTiles(pixels: number[], order: number) {
  //   return (this as any)._tileBuffer.updateTiles(pixels, order);
  // }

  
  private refresh(): void {

    this.refreshFoV();
    const fov = this.getMinFoV();
    // expose to global (legacy)
    // (global as any).hipsFoV = fov;
    // global.order = fovHelper.getHiPSNorder(fov);
    // this._visibleorder = global.order;
    this._visibleorder = fovHelper.getHiPSNorder(fov);
  }

  private enableShader(in_mMatrix: ReadonlyMat4, pMatrix: ReadonlyMat4): void {
    const gl = global.gl as GL;

    gl.useProgram(this._shaderProgram);

    const uMV = gl.getUniformLocation(this._shaderProgram, 'uMVMatrix');
    const uP = gl.getUniformLocation(this._shaderProgram, 'uPMatrix');
    this._attribLocations.position = gl.getAttribLocation(this._shaderProgram, 'aCatPosition');

    let mvMatrix = mat4.create();
    mvMatrix = mat4.multiply(mvMatrix, (global.camera as any).getCameraMatrix(), in_mMatrix);

    if (uMV) gl.uniformMatrix4fv(uMV, false, mvMatrix as Float32Array);
    if (uP) gl.uniformMatrix4fv(uP, false, pMatrix as Float32Array);
  }

  
  toggleShowGrid() {
    this.showGrid = !this.showGrid
  }

  draw(): void {
    const gl = global.gl as GL;

    const mMatrix = this.getModelMatrix();
    this.refresh();

    if (!this.showGrid) return;

    const visibleTiles = visibleTilesManager.visibleTilesByOrder
    const pixels = visibleTiles.pixels;
    const order = visibleTiles.order;

    this.initBuffers(pixels, order);

    const pMatrix = computePerspectiveMatrixSingleton.pMatrix as ReadonlyMat4;
    this.enableShader(mMatrix, pMatrix);

    // Upload positions
    gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexCataloguePositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this._vertexCataloguePosition, gl.STATIC_DRAW);

    gl.vertexAttribPointer(
      this._attribLocations.position,
      HealpixGridSingleton.ELEM_SIZE,
      gl.FLOAT,
      false,
      HealpixGridSingleton.BYTES_X_ELEM * HealpixGridSingleton.ELEM_SIZE,
      0
    );
    gl.enableVertexAttribArray(this._attribLocations.position);

    // Index buffer
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this._indexes, gl.STATIC_DRAW);

    gl.drawElements(
      gl.LINE_LOOP,
      this._vertexCataloguePosition.length / 3 + this._nPrimitiveFlags,
      gl.UNSIGNED_INT,
      0
    );

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    // Project and label pixel centers that are inside current FoV
    let mvMatrix = mat4.create();
    mvMatrix = mat4.multiply(mvMatrix, (global.camera as any).getCameraMatrix(), mMatrix);

    let mvpMatrix = mat4.create();
    mvpMatrix = mat4.multiply(mvpMatrix, pMatrix, mvMatrix);

    // FIX: pass model & pMatrix to match FoVUtils TS signature
    const center = FoVUtils.getCenterJ2000(gl.canvas as HTMLCanvasElement);

    const fovMin = (this.getMinFoV() * Math.PI) / 180 / 2;

    for (let p = 0; p < pixels.length; p++) {
      const pixCenter = (global.getHealpix(this._visibleorder).pix2vec(pixels[p]) as BoundVec);
      // const pixCenter = (global.getHealpix(global.order).pix2vec(pixels[p]) as BoundVec);

      const point = new Point(
        { x: pixCenter.x, y: pixCenter.y, z: pixCenter.z },
        CoordsType.CARTESIAN
      );

      const distance = GeomUtils.orthodromicDistance(center, point);
      if (distance < fovMin) {
        const vertex: [number, number, number, number] = [pixCenter.x, pixCenter.y, pixCenter.z, 1];
        const clipspace = vec4.create();
        vec4.transformMat4(clipspace, vertex, mvpMatrix);

        // NDC divide
        clipspace[0] /= clipspace[3];
        clipspace[1] /= clipspace[3];

        // clip → pixels
        const pixelX = (clipspace[0] * 0.5 + 0.5) * gl.canvas.width;
        const pixelY = (clipspace[1] * -0.5 + 0.5) * gl.canvas.height;

        gridTextHelper.addHPXDivSet(this._visibleorder + '/' + pixels[p], pixelX, pixelY);
      }
    }

    gridTextHelper.resetDivSets();
  }

  get visibleorder(): number {
    return this._visibleorder;
  }
}

const healpixGridSingleton = new HealpixGridSingleton();
export default healpixGridSingleton;