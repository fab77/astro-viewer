/*
 * AstroViewer
 * Copyright (C) Fabrizio Giordano
 * SPDX-License-Identifier: LicenseRef-AstroViewer-Dual-License
 */

import { AbstractSkyEntity, SkyEntityDrawInput } from "../AbstractSkyEntity.js";
import { HealpixGrid } from "../grid/HealpixGrid.js";
import { fovHelper } from "../hips/FoVHelper.js";
import { MeshHiPSShaderProgram } from "../../shader/MeshHiPSShaderProgram.js";
import { MeshHiPSDescriptor } from "./MeshHiPSDescriptor.js";
import { MeshHiPSTile } from "./MeshHiPSTile.js";
import type { MeshHiPSDebugStats, MeshHiPSTileCoord } from "./MeshHiPSTypes.js";
import type { HealpixVisibilityState } from "../hips/VisibleTilesManager.js";

export class MeshHiPS extends AbstractSkyEntity {
  private _shaderProgram: MeshHiPSShaderProgram;
  private _tiles = new Map<string, MeshHiPSTile>();
  private _currentOrder: number;
  private _visibleTiles: MeshHiPSTileCoord[] = [];
  private _requestedTiles: MeshHiPSTileCoord[] = [];
  private _coverageTiles: MeshHiPSTileCoord[] = [];
  private _color: [number, number, number, number];
  private _wireframe: boolean;

  constructor(
    radius: number,
    position: [number, number, number],
    xrad: number,
    yrad: number,
    private _descriptor: MeshHiPSDescriptor,
    webgl: WebGL2RenderingContext,
    private _healpixGrid: HealpixGrid,
  ) {
    super(radius, position, xrad, yrad, _descriptor.name, webgl, false);
    this.initGL(webgl);
    this._shaderProgram = new MeshHiPSShaderProgram(webgl);
    this._shaderProgram.enableProgram();
    this._currentOrder = _descriptor.selectedOrder;
    this._color = [..._descriptor.color];
    this._wireframe = _descriptor.wireframe;
  }

  get currentOrder(): number {
    return this._currentOrder;
  }

  get maxOrder(): number {
    return this._descriptor.maxOrder;
  }

  get minOrder(): number {
    return this._descriptor.minOrder;
  }

  get baseURL(): string {
    return this._descriptor.baseUrl;
  }

  get propertiesRawText(): string {
    return this._descriptor.propertiesRawText;
  }

  get properties(): ReadonlyMap<string, string> {
    return this._descriptor.properties;
  }

  getProperty(key: string): string | undefined {
    return this._descriptor.getProperty(key);
  }

  setColor(color: [number, number, number, number]): void {
    this._color = [...color];
  }

  setWireframe(wireframe: boolean): void {
    this._wireframe = wireframe;
  }

  refreshOrder(fovDeg: number | undefined): number {
    if (this._descriptor.fixedOrder) {
      this._currentOrder = this._descriptor.selectedOrder;
      return this._currentOrder;
    }

    const fov =
      Number.isFinite(fovDeg) && (fovDeg as number) > 0
        ? (fovDeg as number)
        : this._healpixGrid.getMinFoV();
    const safeFov = Number.isFinite(fov) && fov > 0 ? fov : 1e-6;
    const order = fovHelper.getHiPSNorder(safeFov, this._currentOrder);
    this._currentOrder = Math.max(
      this._descriptor.minOrder,
      Math.min(this._descriptor.maxOrder, order),
    );
    return this._currentOrder;
  }

  draw(input: SkyEntityDrawInput): void {
    const vMatrix = input.camera.getCameraMatrix() as Float32Array;
    if (!vMatrix || !input.pMatrix) return;

    this._currentOrder = Math.max(
      this._descriptor.minOrder,
      Math.min(
        this._descriptor.maxOrder,
        this._healpixGrid.visibleTilesManager.visibleTilesByOrder.order,
      ),
    );
    this._visibleTiles = this.resolveVisibleTiles();
    const hierarchy = this.resolveHierarchyTiles();
    this._requestedTiles = Array.from(hierarchy.entries()).flatMap(([order, ipixes]) =>
      ipixes.map((ipix) => ({ order, ipix })),
    );
    this.ensureTiles(this._requestedTiles);
    this._coverageTiles = [];
    this.evictCached();

    const gl = this._webgl;
    const pMatrix = input.pMatrix as Float32Array;
    const mMatrix = this.getModelMatrix() as Float32Array;
    const wasCullFace = gl.isEnabled(gl.CULL_FACE);
    const wasDepthTest = gl.isEnabled(gl.DEPTH_TEST);
    const wasDepthMask = gl.getParameter(gl.DEPTH_WRITEMASK) as boolean;
    const previousDepthFunc = gl.getParameter(gl.DEPTH_FUNC) as number;
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.depthFunc(gl.LEQUAL);
    gl.disable(gl.CULL_FACE);

    for (const ipix of hierarchy.get(this._descriptor.minOrder) ?? []) {
      this.drawHierarchy(
        { order: this._descriptor.minOrder, ipix },
        hierarchy,
        pMatrix,
        vMatrix,
        mMatrix,
      );
    }

    if (wasCullFace) gl.enable(gl.CULL_FACE);
    if (!wasDepthTest) gl.disable(gl.DEPTH_TEST);
    gl.depthFunc(previousDepthFunc);
    gl.depthMask(wasDepthMask);
  }

  getDebugStats(): MeshHiPSDebugStats {
    const tiles = Array.from(this._tiles.values());
    return {
      activeBaseLayer: "meships",
      meshHiPSName: this._descriptor.name,
      meshHiPSUrl: this._descriptor.baseUrl,
      currentOrder: this._currentOrder,
      visibleTileCount: this._visibleTiles.length,
      coverageTileCount: this._coverageTiles.length,
      cacheSize: this._tiles.size,
      readyTileCount: tiles.filter((tile) => tile.ready).length,
      loadingTileCount: tiles.filter((tile) => tile.loading).length,
      failedTileCount: tiles.filter((tile) => tile.failed).length,
    };
  }

  private resolveVisibleTiles(): MeshHiPSTileCoord[] {
    const manager: HealpixVisibilityState | undefined =
      this._healpixGrid.visibleTilesManager;

    const byOrder = manager?.visibleTilesByOrder;
    const pixels =
      byOrder?.order === this._currentOrder && Array.isArray(byOrder.pixels)
        ? byOrder.pixels
        : [];

    if (pixels.length > 0) {
      return pixels.map((ipix: number) => ({
        order: this._currentOrder,
        ipix,
      }));
    }

    return [];
  }

  private resolveHierarchyTiles(): Map<number, number[]> {
    const hierarchy = new Map<number, number[]>();
    for (const [order, ipixes] of this._healpixGrid.visibleTilesManager.ancestorsMap) {
      if (order >= this._descriptor.minOrder && order <= this._currentOrder) {
        hierarchy.set(order, ipixes);
      }
    }
    return hierarchy;
  }

  private drawHierarchy(
    coord: MeshHiPSTileCoord,
    hierarchy: Map<number, number[]>,
    pMatrix: Float32Array,
    vMatrix: Float32Array,
    mMatrix: Float32Array,
  ): boolean {
    const tile = this._tiles.get(this.tileKey(coord));
    if (!tile?.ready) return false;

    const quadrants = new Set([0, 1, 2, 3]);
    const childOrder = coord.order + 1;
    const visibleChildren = hierarchy.get(childOrder);

    if (visibleChildren && childOrder <= this._currentOrder) {
      for (let quadrant = 0; quadrant < 4; quadrant++) {
        const child = { order: childOrder, ipix: coord.ipix * 4 + quadrant };
        if (
          visibleChildren.includes(child.ipix)
          && this.drawHierarchy(child, hierarchy, pMatrix, vMatrix, mMatrix)
        ) {
          quadrants.delete(quadrant);
        }
      }
    }

    if (quadrants.size > 0) {
      tile.draw(
        pMatrix,
        vMatrix,
        mMatrix,
        this._color,
        this._wireframe,
        quadrants,
      );
      this._coverageTiles.push(coord);
    }
    return true;
  }

  private ensureTiles(coords: MeshHiPSTileCoord[]): void {
    for (const coord of coords) {
      const key = this.tileKey(coord);
      if (this._tiles.has(key)) continue;
      this._tiles.set(
        key,
        new MeshHiPSTile(
          coord,
          this._descriptor.getTileUrl(coord.order, coord.ipix),
          this._webgl,
          this._shaderProgram,
        ),
      );
    }
  }

  private evictCached(): void {
    const maxCached = this._descriptor.maxCachedTiles;
    if (this._tiles.size <= maxCached) return;

    const visibleKeys = new Set(
      this._requestedTiles.map((coord) => this.tileKey(coord)),
    );
    const evictable = Array.from(this._tiles.entries())
      .filter(([key]) => !visibleKeys.has(key))
      .sort((a, b) => a[1].lastUsedAt - b[1].lastUsedAt);

    while (this._tiles.size > maxCached && evictable.length > 0) {
      const [key, tile] = evictable.shift() as [string, MeshHiPSTile];
      tile.dispose();
      this._tiles.delete(key);
    }
  }

  private tileKey(coord: MeshHiPSTileCoord): string {
    return `${coord.order}/${coord.ipix}`;
  }
}
