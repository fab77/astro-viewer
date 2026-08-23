/*
 * AstroViewer
 * Copyright (C) Fabrizio Giordano
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-AstroViewer-Commercial
 *
 * AstroViewer is dual-licensed under the GNU Affero General Public License
 * version 3 and a separate commercial license.
 *
 * See LICENSE.md, LICENSE-AGPL.md, and LICENSE-COMMERCIAL.md for details.
 */

"use strict";

import { HiPSShaderProgram } from "../../shader/HiPSShaderProgram.js";
import global from "../../Global.js";
import { TileBuffer } from "./TileBuffer.js";
import { HiPS } from "./HiPS.js";
import { loadFitsTile, type FitsTileData } from "./FitsTileLoader.js";

export default class AllSky {
  private _ready = false;
  private _hips: HiPS;

  private _format: string;
  private _baseurl: string;
  private _isGalacticHips: boolean;

  private _order = 3;
  public opacity = 1.0;

  private _hipsShaderIndex = 0;
  private _texture: WebGLTexture | null = null;
  private _image!: HTMLImageElement;
  private _texurl!: string;

  private _fitsTile?: FitsTileData;
  private _textureLoaded = false;

  private _maxTiles = 0;
  private _numFacesXTile = 0;
  private _numFaces = 0;

  private vertexPosition!: Float32Array;
  private vertexPositionBuffer!: WebGLBuffer;
  private vertexIndexBuffer!: WebGLBuffer;
  private vidx = 0;
  private _webgl: WebGL2RenderingContext;
  private _tileBuffer: TileBuffer;
  private _hipsShaderProgram;

  constructor(
    hips: HiPS,
    webgl: WebGL2RenderingContext,
    tileBuffer: TileBuffer,
    hipsShaderProgram: HiPSShaderProgram,
  ) {
    this._tileBuffer = tileBuffer;
    this._hips = hips;
    this._webgl = webgl;
    this._format = hips.format;
    this._baseurl = hips.baseURL;
    this._isGalacticHips = hips.isGalacticHips;
    this._hipsShaderProgram = hipsShaderProgram;

    this.initImage();
  }

  private initImage(): void {
    this._texurl = `${this._baseurl}/Norder3/Allsky.${this._format}`;

    if (this._format === "fits") {
      void this.loadFits();
      return;
    }

    this.loadImage();
  }

  private loadImage(): void {
    this._image = new Image();

    this._image.onload = () => this.imageLoaded();

    this._image.onerror = () => {
      console.error("File not found? %s", this._texurl);
    };

    this._image.setAttribute("crossorigin", "anonymous");
    this._image.src = this._texurl;
  }

  private async loadFits(): Promise<void> {
    try {
      this._fitsTile = await loadFitsTile(this._texurl);

      this.textureLoaded();
      this.initModelBuffer();

      this._textureLoaded = true;
      this._ready = true;
    } catch (error) {
      console.error(
        `[AllSky] Unable to load FITS atlas ${this._texurl}`,
        error,
      );
    }
  }

  private imageLoaded(): void {
    this.textureLoaded();
    this.initModelBuffer();

    this._textureLoaded = true;
    this._ready = true;
  }

  private textureLoaded(): void {
    this._hipsShaderProgram.enableProgram();

    const gl = this._webgl;

    this._texture = gl.createTexture();

    gl.activeTexture(gl.TEXTURE0 + this._hipsShaderIndex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, this._format !== "fits");
    gl.bindTexture(gl.TEXTURE_2D, this._texture);

    if (this._format === "fits") {
      const fits = this._fitsTile;

      if (!fits) {
        throw new Error(`FITS AllSky data not loaded: ${this._texurl}`);
      }

      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.R32F,
        fits.width,
        fits.height,
        0,
        gl.RED,
        gl.FLOAT,
        fits.pixels,
      );

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    } else {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        this._image,
      );

      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MIN_FILTER,
        gl.LINEAR_MIPMAP_LINEAR,
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      gl.generateMipmap(gl.TEXTURE_2D);
    }

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    if (!gl.isTexture(this._texture)) {
      console.log("error in texture");
    }
  }

  private getFitsDataRange(): { min: number; max: number } | null {
    const hipsRange = this._hips.dataRange;

    if (
      hipsRange.min !== undefined &&
      hipsRange.max !== undefined &&
      Number.isFinite(hipsRange.min) &&
      Number.isFinite(hipsRange.max) &&
      hipsRange.max > hipsRange.min
    ) {
      return {
        min: hipsRange.min,
        max: hipsRange.max,
      };
    }

    const fits = this._fitsTile;

    if (
      fits &&
      fits.dataMin !== null &&
      fits.dataMax !== null &&
      Number.isFinite(fits.dataMin) &&
      Number.isFinite(fits.dataMax) &&
      fits.dataMax > fits.dataMin
    ) {
      return {
        min: fits.dataMin,
        max: fits.dataMax,
      };
    }

    return null;
  }

  private initModelBuffer(): void {
    const gl = this._webgl;

    const orderjump = 1;
    const tgtHpxOrder = this._order + orderjump;
    const healpix = global.getHealpix(this._order);
    this._maxTiles = healpix.getNPix();
    const tgtHealpix = global.getHealpix(tgtHpxOrder);

    this._numFacesXTile = 4 ** orderjump; // used in gl.draw
    this._numFaces = this._numFacesXTile * this._maxTiles;
    this.vertexPosition = new Float32Array(20 * this._numFaces);

    let sindex = 0;
    let tindex = 0;
    this.vidx = 0;

    for (let t = 0; t < this._maxTiles; t++) {
      const xyf = healpix.nest2xyf(t);
      const dxmin = xyf.ix << orderjump;
      const dxmax = (xyf.ix << orderjump) + (1 << orderjump);
      const dymin = xyf.iy << orderjump;
      const dymax = (xyf.iy << orderjump) + (1 << orderjump);

      this.setupPositionAndTexture4Quadrant(
        sindex,
        tindex,
        dxmin,
        dxmin + (dxmax - dxmin) / 2,
        dymin,
        dymin + (dymax - dymin) / 2,
        tgtHealpix,
        xyf,
        0,
        0,
      );
      this.setupPositionAndTexture4Quadrant(
        sindex,
        tindex,
        dxmin + (dxmax - dxmin) / 2,
        dxmax,
        dymin,
        dymin + (dymax - dymin) / 2,
        tgtHealpix,
        xyf,
        0,
        1,
      );
      this.setupPositionAndTexture4Quadrant(
        sindex,
        tindex,
        dxmin,
        dxmin + (dxmax - dxmin) / 2,
        dymin + (dymax - dymin) / 2,
        dymax,
        tgtHealpix,
        xyf,
        1,
        0,
      );
      this.setupPositionAndTexture4Quadrant(
        sindex,
        tindex,
        dxmin + (dxmax - dxmin) / 2,
        dxmax,
        dymin + (dymax - dymin) / 2,
        dymax,
        tgtHealpix,
        xyf,
        1,
        1,
      );

      sindex++;
      if (sindex === 27) {
        tindex++;
        sindex = 0;
      }
    }

    const vertexIndices = new Uint16Array(6 * this._numFaces);
    let baseFaceIndex = 0;
    for (let i = 0; i < this._numFaces; i++) {
      vertexIndices[6 * i] = baseFaceIndex;
      vertexIndices[6 * i + 1] = baseFaceIndex + 1;
      vertexIndices[6 * i + 2] = baseFaceIndex + 3;

      vertexIndices[6 * i + 3] = baseFaceIndex + 1;
      vertexIndices[6 * i + 4] = baseFaceIndex + 2;
      vertexIndices[6 * i + 5] = baseFaceIndex + 3;

      baseFaceIndex += 4;
    }

    this.vertexPositionBuffer = gl.createBuffer() as WebGLBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertexPosition, gl.STATIC_DRAW);

    this.vertexIndexBuffer = gl.createBuffer() as WebGLBuffer;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, vertexIndices, gl.STATIC_DRAW);
  }

  private setupPositionAndTexture4Quadrant(
    sindex: number,
    tindex: number,
    dxmin: number,
    dxmax: number,
    dymin: number,
    dymax: number,
    tgthealpix: any,
    xyf: any,
    qx: number,
    qy: number,
  ): void {
    let facesVec3Array: Array<{ x: number; y: number; z: number }> = [];

    const factor = 2 ** (tgthealpix.order - 3);
    const s_step = 1 / (27 * factor); // 0.037037037...
    const t_step = 1 / (29 * factor); // 0.034482759...

    const s_pixel_size = s_step / 64;
    const t_pixel_size = t_step / 64;

    const base_s = factor * s_step * sindex + s_step * qx;
    const base_t = factor * t_step * tindex + t_step * qy;

    for (let dx = dxmin; dx < dxmax; dx++) {
      for (let dy = dymin; dy < dymax; dy++) {
        facesVec3Array = tgthealpix.getPointsForXyfNoStep(dx, dy, xyf.face);

        // bottom right
        this.vertexPosition[20 * this.vidx] = facesVec3Array[0].x;
        this.vertexPosition[20 * this.vidx + 1] = facesVec3Array[0].y;
        this.vertexPosition[20 * this.vidx + 2] = facesVec3Array[0].z;
        this.vertexPosition[20 * this.vidx + 3] =
          s_step + base_s - s_pixel_size;
        this.vertexPosition[20 * this.vidx + 4] =
          1 - (t_step + base_t) + t_pixel_size;

        // top right
        this.vertexPosition[20 * this.vidx + 5] = facesVec3Array[1].x;
        this.vertexPosition[20 * this.vidx + 6] = facesVec3Array[1].y;
        this.vertexPosition[20 * this.vidx + 7] = facesVec3Array[1].z;
        this.vertexPosition[20 * this.vidx + 8] =
          s_step + base_s - s_pixel_size;
        this.vertexPosition[20 * this.vidx + 9] = 1 - base_t - t_pixel_size;

        // top left
        this.vertexPosition[20 * this.vidx + 10] = facesVec3Array[2].x;
        this.vertexPosition[20 * this.vidx + 11] = facesVec3Array[2].y;
        this.vertexPosition[20 * this.vidx + 12] = facesVec3Array[2].z;
        this.vertexPosition[20 * this.vidx + 13] = base_s + s_pixel_size;
        this.vertexPosition[20 * this.vidx + 14] = 1 - base_t - t_pixel_size;

        // bottom left
        this.vertexPosition[20 * this.vidx + 15] = facesVec3Array[3].x;
        this.vertexPosition[20 * this.vidx + 16] = facesVec3Array[3].y;
        this.vertexPosition[20 * this.vidx + 17] = facesVec3Array[3].z;
        this.vertexPosition[20 * this.vidx + 18] = base_s + s_pixel_size;
        this.vertexPosition[20 * this.vidx + 19] =
          1 - (t_step + base_t) + t_pixel_size;

        this.vidx++;
      }
    }
  }

  /**
   * Renders the all-sky layer and, when available, delegates to higher-resolution child tiles.
   * Returns `true` if it attempted to draw (ready), `false` if still not ready.
   */
  public draw(
    visibleOrder: number,
    visibleTilesMap: Map<number, number[]>,
    pMatrix: Float32Array,
    vMatrix: Float32Array,
    mMatrix: Float32Array,
    colorMapIdx: number,
  ): boolean {
    if (!this._ready) return false;

    let allSkyTiles2Skip: number[] = [];
    if (visibleOrder >= this._order) {
      const skipped = this.drawChildren(
        visibleOrder,
        visibleTilesMap,
        pMatrix,
        vMatrix,
        mMatrix,
        colorMapIdx,
      );
      if (skipped) allSkyTiles2Skip = skipped;
    }

    const gl = this._webgl as WebGL2RenderingContext;

    this._hipsShaderProgram.enableShaders(
      pMatrix,
      vMatrix,
      mMatrix,
      colorMapIdx,
    );

    if (this._format === "fits") {
      const range = this.getFitsDataRange();

      if (!range) {
        console.error(
          `[AllSky] No display range available for FITS atlas ${this._texurl}`,
        );
        return false;
      }

      this._hipsShaderProgram.setTextureDataMode(
        this._hipsShaderIndex,
        true,
        range.min,
        range.max,
      );
    } else {
      this._hipsShaderProgram.setTextureDataMode(this._hipsShaderIndex, false);
    }

    gl.enableVertexAttribArray(
      this._hipsShaderProgram.locations.vertexPositionAttribute,
    );
    gl.enableVertexAttribArray(
      this._hipsShaderProgram.locations.textureCoordAttribute,
    );
    // hipsShaderProgram.enableShaders(pMatrix, vMatrix, mMatrix, colorMapIdx)
    // gl.enableVertexAttribArray((hipsShaderProgram as any).locations.vertexPositionAttribute)
    // gl.enableVertexAttribArray((hipsShaderProgram as any).locations.textureCoordAttribute)

    gl.activeTexture(gl.TEXTURE0 + this._hipsShaderIndex);
    gl.bindTexture(gl.TEXTURE_2D, this._texture);

    const factorLocation =
      this._hipsShaderProgram.locations.textureAlpha[this._hipsShaderIndex];
    if (factorLocation) {
      gl.uniform1f(factorLocation, this.opacity);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);

    gl.vertexAttribPointer(
      // hipsShaderProgram.locations.vertexPositionAttribute,
      this._hipsShaderProgram.locations.vertexPositionAttribute,
      3,
      gl.FLOAT,
      false,
      5 * 4,
      0,
    );
    gl.vertexAttribPointer(
      // hipsShaderProgram.locations.textureCoordAttribute,
      this._hipsShaderProgram.locations.textureCoordAttribute,
      2,
      gl.FLOAT,
      false,
      5 * 4,
      3 * 4,
    );

    for (let t = 0; t < this._maxTiles; t++) {
      if (!allSkyTiles2Skip.includes(t)) {
        gl.drawElements(
          gl.TRIANGLES,
          6 * this._numFacesXTile,
          gl.UNSIGNED_SHORT,
          12 * t * this._numFacesXTile,
        );
      }
    }

    gl.disableVertexAttribArray(
      this._hipsShaderProgram.locations.vertexPositionAttribute,
    );
    gl.disableVertexAttribArray(
      this._hipsShaderProgram.locations.textureCoordAttribute,
    );
    // gl.disableVertexAttribArray(hipsShaderProgram.locations.vertexPositionAttribute)
    // gl.disableVertexAttribArray(hipsShaderProgram.locations.textureCoordAttribute)

    return true;
  }

  private drawChildren(
    visibleOrder: number,
    visibleTilesMap: Map<number, number[]>,
    pMatrix: Float32Array,
    vMatrix: Float32Array,
    mMatrix: Float32Array,
    colorMapIdx: number,
  ): number[] | undefined {
    const childrenOrder = this._order;
    if (!visibleTilesMap.has(childrenOrder)) return;

    const visibleTiles = visibleTilesMap.get(childrenOrder) as number[];
    const allSkyTiles2Skip: number[] = [];

    for (let i = 0; i < visibleTiles.length; i++) {
      const tileno = visibleTiles[i];

      if (!this._hips.intersectsCoverage(childrenOrder, tileno)) {
        allSkyTiles2Skip.push(tileno);
        continue;
      }

      const childTile = this._isGalacticHips
        ? this._tileBuffer.getGalTile(tileno, childrenOrder, this._hips)
        : this._tileBuffer.getTile(tileno, childrenOrder, this._hips);
        
      childTile.draw(
        visibleOrder,
        visibleTilesMap,
        pMatrix,
        vMatrix,
        mMatrix,
        colorMapIdx,
        this._hipsShaderProgram,
      );

      if (childTile.getReadyState()) {
        allSkyTiles2Skip.push(tileno);
      }
    }
    return allSkyTiles2Skip;
  }
}
