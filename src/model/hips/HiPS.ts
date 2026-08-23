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
/**
 * @author Fabrizio Giordano (Fab77)
 */

import { AbstractSkyEntity, SkyEntityDrawInput } from "../AbstractSkyEntity.js";
import { fovHelper } from "./FoVHelper.js";
import ColorMaps, { ColorMap } from "../ColorMaps.js";
import AncestorTile from "./AncestorTile.js";
import AllSky from "./AllSky.js";
import { HiPSDescriptor } from "./HiPSDescriptor.js";
import type { HiPSDebugStats } from "./HiPSConfig.js";
import { HealpixGrid } from "../grid/HealpixGrid.js";

export class HiPS extends AbstractSkyEntity {
  private _ancestorTiles: AncestorTile[];
  private _allSkyTile: AllSky | null;
  private _descriptor: HiPSDescriptor;

  private _format: string;
  private _baseurl: string;
  private _maxorder: number;
  private _minorder: number;

  private _visibleorder = 3;
  private _allSky = true;

  public samplerIdx = 0;
  public colorMapIdx = 0;
  public colorMap = ColorMaps["native"];
  private _healpixGrid: HealpixGrid;

  // exposed read-only helpers
  get maxOrder(): number {
    return this._maxorder;
  }
  get minOrder(): number {
    return this._minorder;
  }
  get baseURL(): string {
    return this._baseurl;
  }
  get format(): string {
    return this._format;
  }
  get propertiesRawText(): string {
    return this._descriptor.propertiesRawText;
  }
  get properties(): ReadonlyMap<string, string> {
    return this._descriptor.properties;
  }

  constructor(
    radius: number,
    position: [number, number, number],
    xrad: number,
    yrad: number,
    descriptor: HiPSDescriptor,
    webgl: WebGL2RenderingContext,
    healpixGrid: HealpixGrid,
  ) {
    super(
      radius,
      position,
      xrad,
      yrad,
      descriptor.surveyName,
      webgl,
      descriptor.isGalactic,
    );
    this._descriptor = descriptor;
    this.initGL(webgl);
    this._healpixGrid = healpixGrid;

    this._format = this.selectDefaultFormat(descriptor.imgFormats);
    this._baseurl = descriptor.url;
    this._maxorder = descriptor.maxOrder;
    this._minorder = descriptor.minOrder;

    if (this.isGalacticHips) {
      this._healpixGrid.visibleTilesManager.tileBuffer.addGalHiPS(this);
    } else {
      this._healpixGrid.visibleTilesManager.tileBuffer.addHiPS(this);
    }

    // DEBUG logs kept from JS (optional)
    // eslint-disable-next-line no-console
    console.log("HiPS frame " + descriptor.hipsFrame);
    // eslint-disable-next-line no-console
    console.log("HiPS minOrder " + descriptor.minOrder);

    this.initShaders();

    // pick initial order from a starting FoV
    const fov = 180;
    let order = fovHelper.getHiPSNorder(fov);
    this._visibleorder = Math.min(order, this._maxorder);

    this._ancestorTiles = [];
    this._allSkyTile = null;

    // auto-detect all-sky: original code forces true
    this._allSky = true;
    this.initBaseTiles();
  }

  private initBaseTiles(): void {
    this._ancestorTiles = [];
    this._allSkyTile = null;

    if (this._allSky) {
      this._allSkyTile = new AllSky(
        this,
        this._webgl,
        this._healpixGrid.visibleTilesManager.tileBuffer,
        super.hipsShaderProgram,
      );

      return;
    }

    for (let t = 0; t < 12; t++) {
      this._ancestorTiles.push(
        new AncestorTile(
          t,
          0,
          this,
          this._healpixGrid.visibleTilesManager.tileBuffer,
          super.hipsShaderProgram,
          this._webgl,
        ),
      );
    }
  }

  getProperty(key: string): string | undefined {
    return this._descriptor.getProperty(key);
  }

  changeFormat(format: string): void {
    const normalizedFormat = format.toLowerCase();

    if (!this._descriptor.imgFormats.includes(normalizedFormat)) {
      throw new Error(
        `HiPS format "${format}" is not supported. ` +
          `Available formats: ${this._descriptor.imgFormats.join(", ")}`,
      );
    }
    if (normalizedFormat === this._format.toLowerCase()) {
      return;
    }
    const tileBuffer = this._healpixGrid.visibleTilesManager.tileBuffer;
    /*
     * Remove Tile instances created using the previous format.
     *
     * TileBuffer invalidates by HiPS identity/base URL rather than by the
     * current format, so both active and cached resources are discarded.
     */
    tileBuffer.invalidateHiPS(this);
    /*
     * Change format before recreating AllSky/AncestorTile because their
     * constructors read hips.format.
     */
    this._format = normalizedFormat;
    /*
     * AllSky and AncestorTile also keep the format they were constructed
     * with, so they must be recreated.
     */
    this.initBaseTiles();
  }

  get availableFormats(): readonly string[] {
    return this._descriptor.imgFormats;
  }

  /**
   * Shader colormap switcher
   * 0 -> native
   * 1 -> grayscale
   * 2 -> planck
   * 3 -> cmb
   * 4 -> rainbow
   * 5 -> eosb
   * 6 -> cubehelix
   */
  changeColorMap(colorMap: ColorMap): void {
    console.log(
      "HiPS.changeColorMap -> shaderProgram",
      super.hipsShaderProgram.shaderProgram,
    );

    this.colorMap = colorMap;
    switch (colorMap.name) {
      case "grayscale":
        this.colorMapIdx = 1;
        // hipsShaderProgram.setGrayscaleShader()
        this.colorMap = ColorMaps["grayscale"];
        super.hipsShaderProgram.setGrayscaleShader();
        break;
      case "planck":
        this.colorMapIdx = 2;
        this.colorMap = ColorMaps["planck"];
        // hipsShaderProgram.setColorMapShader()
        super.hipsShaderProgram.setColorMapShader();
        break;
      case "cmb":
        this.colorMapIdx = 3;
        this.colorMap = ColorMaps["cmb"];
        // hipsShaderProgram.setColorMapShader()
        super.hipsShaderProgram.setColorMapShader();
        break;
      case "rainbow":
        this.colorMapIdx = 4;
        this.colorMap = ColorMaps["rainbow"];
        // hipsShaderProgram.setColorMapShader()
        super.hipsShaderProgram.setColorMapShader();
        break;
      case "eosb":
        this.colorMapIdx = 5;
        this.colorMap = ColorMaps["eosb"];
        super.hipsShaderProgram.setColorMapShader();
        // hipsShaderProgram.setColorMapShader()
        break;
      case "cubehelix":
        this.colorMapIdx = 6;
        this.colorMap = ColorMaps["cubehelix"];
        super.hipsShaderProgram.setColorMapShader();
        // hipsShaderProgram.setColorMapShader()
        break;
      case "hot":
        this.colorMapIdx = 7;
        this.colorMap = ColorMaps["hot"];
        super.hipsShaderProgram.setColorMapShader();
        // hipsShaderProgram.setColorMapShader()
        break;
      case "gray":
        this.colorMapIdx = 8;
        this.colorMap = ColorMaps["gray"];
        super.hipsShaderProgram.setColorMapShader();
        // hipsShaderProgram.setColorMapShader()
        break;
      case "native":
        this.colorMapIdx = 0;
        this.colorMap = ColorMaps["native"];
        super.hipsShaderProgram.setNativeShader();
        break;
      default:
        this.colorMapIdx = 9;
        this.colorMap = colorMap;
        super.hipsShaderProgram.setColorMapShader();
    }
  }

  private initShaders(): void {
    super.hipsShaderProgram.enableProgram();
    // hipsShaderProgram.enableProgram()
    // this.shaderProgram = super.hipsShaderProgram.shaderProgram
    // this.shaderProgram = hipsShaderProgram.shaderProgram
  }

  //   private selectDefaultFormat(formats: string[]): string {
  //   if (formats.includes("fits")) return "fits";
  //   if (formats.includes("png")) return "png";
  //   if (formats.includes("jpg")) return "jpg";

  //   if (formats.length > 0) {
  //     return formats[0];
  //   }

  //   throw new Error("HiPS descriptor does not define a tile format");
  // }

  private selectDefaultFormat(formats: string[]): string {
    if (formats.includes("png")) return "png";
    if (formats.includes("jpg")) return "jpg";
    if (formats.includes("fits")) return "fits";

    if (formats.length > 0) {
      return formats[0];
    }
    throw new Error("HiPS descriptor does not define a tile format");
  }

  get dataRange() {
    return this._descriptor.dataRange;
  }

  getCurrentHealpixOrder(): number {
    return this._visibleorder;
  }

  getDebugStats(): HiPSDebugStats {
    const tileBuffer = this._healpixGrid.visibleTilesManager.tileBuffer;
    const visibleTiles = this.isGalacticHips
      ? this._healpixGrid.visibleTilesManager.galVisibleTilesByOrder
      : this._healpixGrid.visibleTilesManager.visibleTilesByOrder;

    return {
      activeBaseLayer: "hips",
      hipsName: this._descriptor.surveyName,
      hipsUrl: this._baseurl,
      isGalactic: this.isGalacticHips,
      currentOrder: visibleTiles.order,
      visibleTileCount: visibleTiles.pixels.length,
      activeTileCount: tileBuffer.activeTileCount,
      cachedTileCount: tileBuffer.cachedTileCount,
      cacheSize: tileBuffer.size,
      readyTileCount: tileBuffer.readyTileCount,
      loadingTileCount: tileBuffer.loadingTileCount,
    };
  }

  private refresh(input: SkyEntityDrawInput): void {
    // const fov = this._healpixGrid.getMinFoV()
    // this._visibleorder = Math.min(fovHelper.getHiPSNorder(fov), this._maxorder)
    const rawFov = input.fovDeg ?? this._healpixGrid.getMinFoV();
    const fov = Number.isFinite(rawFov) && rawFov > 0 ? rawFov : 1e-6;
    this._visibleorder = Math.min(
      fovHelper.getHiPSNorder(fov, this._visibleorder),
      this._maxorder,
    );
  }

  draw(input: SkyEntityDrawInput): void {
    const vMatrix = input.camera.getCameraMatrix() as Float32Array;
    if (!vMatrix) return;

    const pMatrix = input.pMatrix;
    if (!pMatrix) return;

    this.refresh(input);

    const mMatrix = this.getModelMatrix() as Float32Array;
    super.hipsShaderProgram.setRuntimeColorMap(this.colorMap);

    if (this._allSky && this._allSkyTile) {
      if (this.isGalacticHips) {
        this._allSkyTile.draw(
          this._healpixGrid.visibleTilesManager.galVisibleTilesByOrder.order,
          this._healpixGrid.visibleTilesManager.galAncestorsMap,
          pMatrix as Float32Array,
          vMatrix,
          mMatrix,
          this.colorMapIdx,
        );
      } else {
        this._allSkyTile.draw(
          this._healpixGrid.visibleTilesManager.visibleTilesByOrder.order,
          this._healpixGrid.visibleTilesManager.ancestorsMap,
          pMatrix as Float32Array,
          vMatrix,
          mMatrix,
          this.colorMapIdx,
        );
      }
      return;
    }

    // Non all-sky path
    const order = this.isGalacticHips
      ? this._healpixGrid.visibleTilesManager.galVisibleTilesByOrder.order
      : this._healpixGrid.visibleTilesManager.visibleTilesByOrder.order;

    const map = this.isGalacticHips
      ? this._healpixGrid.visibleTilesManager.galAncestorsMap
      : this._healpixGrid.visibleTilesManager.ancestorsMap;

    this._ancestorTiles.forEach((ancestor) => {
      ancestor.draw(
        order,
        map,
        pMatrix as Float32Array,
        vMatrix,
        mMatrix,
        this.colorMapIdx,
      );
    });
  }
}
