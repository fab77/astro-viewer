import { AbstractSkyEntity, SkyEntityDrawInput } from "../AbstractSkyEntity.js";
import { XYZMapDescriptor } from "./XYZMapDescriptor.js";
import { XYZVisibleTilesManager } from "./XYZVisibleTilesManager.js";
import { xyzFovHelper } from "./XYZFoVHelper.js";
import { ColorMap, ColorMaps } from "../ColorMaps.js";
import { LatLonGrid } from "../grid/LonLatGrid.js";
import { XYZShaderProgram } from "../../shader/XYZShaderProgram.js";
import { XYZTileBuffer } from "./XYZTileBuffer.js";
import { XYZAnchestorTile } from "./XYZAnchestorTile.js";
import { XYZMeshBuilder } from "./XYZMeshBuilder.js";
import { SphereFoV } from "../SphereFoV.js";
import type { XYZLayerDebugStats } from "./XYZConfig.js";
import type { XYZTileCoord } from "./XYZTypes.js";

export class XYZMap extends AbstractSkyEntity {

  private _xyzShaderProgram: XYZShaderProgram
  private _descriptor: XYZMapDescriptor;
  private _visibleTilesManager: XYZVisibleTilesManager
  private _tileBuffer: XYZTileBuffer<XYZAnchestorTile>
  private _meshBuilder: XYZMeshBuilder
  private _baseurl: string
  private _zoom
  private _latLonGrid: LatLonGrid
  private _colorMapIdx = 0
  private _colorMap = ColorMaps['native']


  constructor(
    radius: number,
    position: [number, number, number],
    xrad: number,
    yrad: number,
    descriptor: XYZMapDescriptor,
    webgl: WebGL2RenderingContext,

  ) {
    super(radius, position, xrad, yrad, descriptor.name, webgl, false)
    this._descriptor = descriptor
    this._xyzShaderProgram = new XYZShaderProgram(webgl)
    this._meshBuilder = new XYZMeshBuilder()
    this._tileBuffer = new XYZTileBuffer<XYZAnchestorTile>(1)

    this.initGL(webgl as WebGL2RenderingContext)

    this._latLonGrid = new LatLonGrid(radius, position, xrad, yrad, 'LatLonGrid', this._webgl)

    this._visibleTilesManager = new XYZVisibleTilesManager()
    this._baseurl = descriptor.url

    this.initShaders()
    const fov = 180
    this._zoom = xyzFovHelper.getZoom(fov)

  }

  changeColorMap(colorMap: ColorMap): void {
    this._colorMap = colorMap
    switch (colorMap.name) {
      case 'grayscale':
        this._colorMapIdx = 1
        this._colorMap = ColorMaps['grayscale']
        break
      case 'planck':
        this._colorMapIdx = 2
        this._colorMap = ColorMaps['planck']
        break
      case 'cmb':
        this._colorMapIdx = 3
        this._colorMap = ColorMaps['cmb']
        break
      case 'rainbow':
        this._colorMapIdx = 4
        this._colorMap = ColorMaps['rainbow']
        break
      case 'eosb':
        this._colorMapIdx = 5
        this._colorMap = ColorMaps['eosb']
        break
      case 'cubehelix':
        this._colorMapIdx = 6
        this._colorMap = ColorMaps['cubehelix']
        break
      case 'hot':
        this._colorMapIdx = 7
        this._colorMap = ColorMaps['hot']
        break
      case 'gray':
        this._colorMapIdx = 8
        this._colorMap = ColorMaps['gray']
        break
      case 'native':
        this._colorMapIdx = 0
        this._colorMap = ColorMaps['native']
        break
      default:
        this._colorMapIdx = 9
        this._colorMap = colorMap
    }
  }

  private initShaders(): void {
    this._xyzShaderProgram.enableProgram()
  }

  isLonLatGridVisible(): boolean {
    return this._latLonGrid.isVisible()
  }

  toggleLonLatGrid(): boolean {
    return this._latLonGrid.toggleShowGrid()
  }

  getFoV(): SphereFoV {
    return this._latLonGrid.getFoV()
  }

  private refresh(input: SkyEntityDrawInput): void {
    const fov = this._latLonGrid.refreshFoV(input)
    // this._zoom = this.resolveVisibleZoom(fov)
    this._zoom = xyzFovHelper.getZoom(fov)
  }



  draw(input: SkyEntityDrawInput): void {
    const vMatrix = input.camera.getCameraMatrix() as Float32Array
    if (!vMatrix) return

    const pMatrix = input.pMatrix
    if (!pMatrix) return

    this.refresh(input)

    const mMatrix = this.getModelMatrix() as Float32Array
    this._xyzShaderProgram.setRuntimeColorMap(this._colorMap)
    const tileSelection = this._visibleTilesManager.computeVisibleTiles(
      this._zoom,
      this,
      this._webgl,
      input.camera,
      input.pMatrix,
    )

    const visibleTiles = tileSelection.visibleTiles
    const ancestorsMap = tileSelection.ancestorsMap
    const tileKeys = this._tileBuffer.ensureTiles(
      this.getTilesToEnsure(visibleTiles, ancestorsMap),
      (coord) => this.createTile(coord),
    )
    this._tileBuffer.evictCached(this._descriptor.maxCachedTiles)

    for (const tileKey of tileKeys) {
      const tile = this._tileBuffer.getActiveTile(tileKey)
      if (!tile || tile.coord.z !== tileSelection.currentZoom) {
        continue
      }

      const drawn = tile.draw(pMatrix as Float32Array, vMatrix, mMatrix, this._colorMapIdx)
      if (drawn) {
        continue
      }

      const ancestorTile = this.findBestAvailableAncestor(tile.coord)
      ancestorTile?.draw(
        tileSelection.currentZoom,
        [tile.coord],
        ancestorsMap,
        pMatrix as Float32Array,
        vMatrix,
        mMatrix,
        this._colorMapIdx
      )
    }

    this._latLonGrid.draw(input)

  }

  private createTile(coord: XYZTileCoord): XYZAnchestorTile {
    return new XYZAnchestorTile(
      coord,
      this.resolveTileUrl(coord),
      this._webgl,
      this._xyzShaderProgram,
      this._meshBuilder,
      this._descriptor.segmentsPerSide,
    )
  }

  private getTilesToEnsure(
    visibleTiles: XYZTileCoord[],
    ancestorsMap: Map<string, XYZTileCoord>,
  ): XYZTileCoord[] {
    const tilesByKey = new Map<string, XYZTileCoord>()

    for (const tile of visibleTiles) {
      tilesByKey.set(this.tileKey(tile), tile)
    }
    for (const ancestor of ancestorsMap.values()) {
      tilesByKey.set(this.tileKey(ancestor), ancestor)
    }

    return Array.from(tilesByKey.values())
  }

  private findBestAvailableAncestor(targetTile: XYZTileCoord): XYZAnchestorTile | null {
    for (let z = targetTile.z - 1; z >= 0; z--) {
      const dz = targetTile.z - z
      const ancestorCoord = {
        z,
        x: targetTile.x >> dz,
        y: targetTile.y >> dz,
      }
      const ancestorTile = this._tileBuffer.getAnyTile(this.tileKey(ancestorCoord))
      if (ancestorTile?.ready) {
        return ancestorTile
      }
    }

    return null
  }

  private resolveTileUrl(tile: XYZTileCoord): string {
    const urlResolver = this._descriptor.urlResolver
    if (urlResolver) {
      return urlResolver(tile)
    }

    const dim = 2 ** tile.z
    const y = this._descriptor.flipY ? dim - 1 - tile.y : tile.y
    const subdomains = this._descriptor.subdomains
    const subdomain = subdomains.length > 0
      ? subdomains[Math.abs(tile.x + tile.y + tile.z) % subdomains.length]
      : ''

    return this._baseurl
      .replace(/\{z\}/g, String(tile.z))
      .replace(/\{x\}/g, String(tile.x))
      .replace(/\{y\}/g, String(y))
      .replace(/\{s\}/g, subdomain ?? '')
  }

  getDebugStats(): XYZLayerDebugStats {
    const activeTiles = Array.from(this._tileBuffer.activeTiles.values(), (entry) => entry.tile)
    const cachedTiles = Array.from(this._tileBuffer.cachedTiles.values(), (entry) => entry.tile)
    const allTiles = [...activeTiles, ...cachedTiles]
    const selection = this._visibleTilesManager.selection

    return {
      cacheSize: this._tileBuffer.size,
      visibleTileCount: selection.visibleTiles.length,
      currentTileCount: activeTiles.filter((tile) => tile.coord.z === selection.currentZoom).length,
      fallbackTileCount: selection.ancestorsMap.size,
      coreTileCount: selection.visibleTiles.length,
      coverageTileCount: selection.visibleTiles.length,
      readyTileCount: allTiles.filter((tile) => tile.ready).length,
      loadingTileCount: allTiles.filter((tile) => tile.loading).length,
      coolingDownTileCount: 0,
      currentZoom: selection.currentZoom,
      tileSelectionKey: selection.key,
      isSettling: false,
      coarseTileCount: selection.ancestorsMap.size,
      hasPendingSelection: false,
      pendingSelectionKey: null,
    }
  }

  private tileKey(tile: XYZTileCoord): string {
    return `${tile.z}/${tile.x}/${tile.y}`
  }

  // private resolveVisibleZoom(fovDeg: number): number {
  //   const rawZoom = xyzFovHelper.getZoom(fovDeg)
  //   const minUsefulZoom = 2
  //   const minZoom = Math.max(this._descriptor.minZoom, minUsefulZoom)
  //   const maxZoom = Math.max(minZoom, this._descriptor.maxZoom)

  //   return Math.max(minZoom, Math.min(maxZoom, rawZoom))
  // }

}
