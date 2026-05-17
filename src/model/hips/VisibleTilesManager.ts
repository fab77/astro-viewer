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

import global from '../../Global.js';
import { Pointing, Vec3, Healpix } from 'healpixjs';
import RayPickingUtils from '../../utils/RayPickingUtils.js';
// import { newTileBuffer } from './TileBuffer.js';
import { TileBuffer } from './TileBuffer.js';
import { vec4, mat4, ReadonlyMat4 } from 'gl-matrix';
// import healpixGridSingleton from '../grid/HealpixGridSingleton.js';
// import {HealpixGridSingleton} from '../grid/HealpixGridSingleton.js';
import { bootSetup } from '../../Config.js';
import { HealpixGrid } from '../grid/HealpixGrid.js';
import { HiPSShaderProgram } from '../../shader/HiPSShaderProgram.js';
import Camera from '../../Camera.js';
type GL = WebGLRenderingContext | WebGL2RenderingContext;

interface VisibleTiles {
  pixels: number[];
  order: number;
}


export class VisibleTilesManager {
  private _visibleTilesByOrder: VisibleTiles;
  private _ancestorsMap: Map<number, number[]>;

  private initialised: boolean;

  private _galVisibleTilesByOrder: VisibleTiles;
  private _galAncestorsMap: Map<number, number[]>;
  private _galacticMatrixInverted: mat4;
  private _galacticMatrix: mat4;
  private insideSphere: boolean = bootSetup.insideSphere
  private _tileBuffer: TileBuffer
  private _healpixGrid: HealpixGrid;
  private _webgl: WebGL2RenderingContext;

  constructor(webgl: WebGL2RenderingContext, hipsShaderProgram: HiPSShaderProgram, healpixGrid: HealpixGrid) {
    
    this._webgl = webgl
    this._healpixGrid = healpixGrid
    this._visibleTilesByOrder = { pixels: [], order: 0 };
    this._ancestorsMap = new Map();
    this.initialised = false;

    this._galVisibleTilesByOrder = { pixels: [], order: 0 };
    this._galAncestorsMap = new Map();

    // Matrices for galactic <-> equatorial
    this._galacticMatrixInverted = mat4.create();
    this._galacticMatrix = mat4.create();

    // From https://observablehq.com/@fil/galactic-rotations (single-precision friendly)
    // This matrix is (galactic -> equatorial); we store its inverse too.
    mat4.set(
      this._galacticMatrixInverted,
      -0.054876, -0.873437, -0.483835, 0, 
      0.494109, -0.44483, 0.746982, -0, 
      -0.867666, -0.198076, 0.455984, 0, 
      0, 0, 0, 1
    )
    mat4.invert(this._galacticMatrix, this._galacticMatrixInverted);
    this._tileBuffer = new TileBuffer(1, webgl, hipsShaderProgram, this)
  }

  get healpixGrid() {
    return this._healpixGrid
  }

  get tileBuffer() { 
    return this._tileBuffer
  }

  init(insideSphere: boolean): void {
    this.initialised = true;
    this.insideSphere = insideSphere
    // this.computeVisiblePixels();
    // setInterval(() => this.computeVisiblePixels(), 500);
  }

  getVisibleOrder(): number {
    // return healpixGridSingleton.visibleorder;
    return this._healpixGrid.visibleorder;
  }


  // computeVisiblePixels(): void {
  computeVisiblePixels(order: number, webgl: WebGL2RenderingContext, camera: Camera, pMatrix: ReadonlyMat4): void {
    if (!this.initialised) return;

    // let order = healpixGridSingleton.visibleorder;
    if (global.insideSphere && order < 3) {
      order = 3;
    }

    this._ancestorsMap.set(order, []);
    this._galAncestorsMap.set(order, []);

    let pixels: number[] = [];
    let galTiles: number[] = [];

    if (order === 0) {
      const geomhealpix: Healpix = global.getHealpix(0);
      const npix = geomhealpix.getNPix();
      for (let i = 0; i < npix; i++) {
        pixels.push(i);
        this._ancestorsMap.get(order)!.push(i);
        galTiles.push(i);
        this._galAncestorsMap.get(order)!.push(i);
      }
    } else {
      const geomhealpix: Healpix = global.getHealpix(order);
      // const maxX = (global.gl as GL).canvas.width;
      // const maxY = (global.gl as GL).canvas.height;
      const maxX = (webgl as GL).canvas.width;
      const maxY = (webgl as GL).canvas.height;

      // Sample a grid of screen points, project to the sphere, then to galactic
      for (let i = 0; i <= maxX; i += maxX / 30) {
        for (let j = 0; j <= maxY; j += maxY / 30) {
          const hit = RayPickingUtils.getIntersectionPointWithSingleModel(
            i,
            j, this._healpixGrid, this._webgl, camera, pMatrix
          );

          if (hit.length > 0) {
            // Equatorial -> Galactic (use _galacticMatrix)
            const galVec = vec4.create();
            vec4.transformMat4(galVec, [hit[0], hit[1], hit[2], 1], this._galacticMatrix);

            // Index in galactic HEALPix
            const galPoint = new Pointing(new Vec3(galVec[0], galVec[1], galVec[2]));
            const galTileNo = geomhealpix.ang2pix(galPoint);

            // Index in equatorial HEALPix
            const curPoint = new Pointing(new Vec3(hit[0], hit[1], hit[2]));
            const currPixNo = geomhealpix.ang2pix(curPoint);

            if (!pixels.includes(currPixNo)) {
              pixels.push(currPixNo);
              this._ancestorsMap.get(order)!.push(currPixNo);
              // newTileBuffer.addTile(order, currPixNo);
              this._tileBuffer.addTile(order, currPixNo);
            }

            if (!galTiles.includes(galTileNo)) {
              galTiles.push(galTileNo);
              this._galAncestorsMap.get(order)!.push(galTileNo);
              // newTileBuffer.addGalTile(order, galTileNo);
              this._tileBuffer.addGalTile(order, galTileNo);
            }
          }
        }
      }
    }

    this._visibleTilesByOrder = { pixels: pixels, order: order };
    this._galVisibleTilesByOrder = { pixels: galTiles, order: order };

    // Build ancestor pyramids down to order 0
    for (let o = 1; o < order; o++) {
      const tgtOrder = order - o;
      const list = this._ancestorsMap.get(tgtOrder) ?? [];
      this._ancestorsMap.set(tgtOrder, list);

      for (let p = 0; p < pixels.length; p++) {
        const parent = pixels[p] >> (2 * o);
        if (!list.includes(parent)) {
          list.push(parent);
          // newTileBuffer.addTile(tgtOrder, parent);
          this._tileBuffer.addTile(tgtOrder, parent);
        }
      }
    }

    for (let o = 1; o < order; o++) {
      const tgtOrder = order - o;
      const list = this._galAncestorsMap.get(tgtOrder) ?? [];
      this._galAncestorsMap.set(tgtOrder, list);

      for (let p = 0; p < galTiles.length; p++) {
        const parent = galTiles[p] >> (2 * o);
        if (!list.includes(parent)) {
          list.push(parent);
          // newTileBuffer.addGalTile(tgtOrder, parent);
          this._tileBuffer.addGalTile(tgtOrder, parent);
        }
      }
    }
  }

  get visibleTilesByOrder(): VisibleTiles {
    return this._visibleTilesByOrder;
  }

  get ancestorsMap(): Map<number, number[]> {
    return this._ancestorsMap;
  }

  get galVisibleTilesByOrder(): VisibleTiles {
    return this._galVisibleTilesByOrder;
  }

  get galAncestorsMap(): Map<number, number[]> {
    return this._galAncestorsMap;
  }

  get visibleOrder(): number {
    return this._visibleTilesByOrder.order;
  }
}

// export const visibleTilesManager = new VisibleTilesManager();