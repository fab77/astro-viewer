import { AbstractSkyEntity, SkyEntityDrawInput } from '../AbstractSkyEntity.js'
import { XYZShaderProgram } from '../../shader/XYZShaderProgram.js'
import { XYZMeshBuilder } from './XYZMeshBuilder.js'
import { XYZTile } from './XYZTile.js'
import { XYZTileProvider } from './XYZTileProvider.js'
import { XYZVisibleTilesManager } from './XYZVisibleTilesManager.js'
import type { XYZLayerConfig, XYZLayerDebugStats } from './types.js'

export class XYZLayer extends AbstractSkyEntity {
  private static readonly DEFAULT_MAX_CACHED_TILES = 384

  private _config: XYZLayerConfig
  private _provider: XYZTileProvider
  private _visibleTilesManager: XYZVisibleTilesManager
  private _meshBuilder: XYZMeshBuilder
  private _xyzShaderProgram: XYZShaderProgram
  private _tileCache: Map<string, XYZTile> = new Map()
  private _visibleTileKeys: string[] = []
  private _tilePriorities: Map<string, number> = new Map()
  private _tileSelectionKey: string | null = null
  private _currentTileCount = 0
  private _fallbackTileCount = 0

  constructor(config: XYZLayerConfig, webgl: WebGL2RenderingContext) {
    super(1, [0, 0, 0], 0, 0, 'XYZ Earth Layer', webgl, false)
    this._config = config
    this._provider = new XYZTileProvider(config)
    this._visibleTilesManager = new XYZVisibleTilesManager(this._provider)
    this._meshBuilder = new XYZMeshBuilder()
    this._xyzShaderProgram = new XYZShaderProgram(webgl)
    this.initGL(webgl)
    this.bootstrapTiles(180, null, null)
  }

  get config(): XYZLayerConfig {
    return this._config
  }

  getDebugStats(): XYZLayerDebugStats {
    let readyTileCount = 0
    let loadingTileCount = 0
    let coolingDownTileCount = 0
    const now = Date.now()

    for (const tile of this._tileCache.values()) {
      if (tile.ready) {
        readyTileCount += 1
      }
      if (tile.loading) {
        loadingTileCount += 1
      }
      if (tile.failedUntil > now) {
        coolingDownTileCount += 1
      }
    }

    const currentZoom = this._visibleTileKeys.reduce<number | null>((maxZoom, tileKey) => {
      const zoom = Number.parseInt(tileKey.split('/')[0] ?? '', 10)
      if (!Number.isFinite(zoom)) {
        return maxZoom
      }
      return maxZoom == null ? zoom : Math.max(maxZoom, zoom)
    }, null)

    return {
      cacheSize: this._tileCache.size,
      visibleTileCount: this._visibleTileKeys.length,
      currentTileCount: this._currentTileCount,
      fallbackTileCount: this._fallbackTileCount,
      readyTileCount,
      loadingTileCount,
      coolingDownTileCount,
      currentZoom,
      tileSelectionKey: this._tileSelectionKey,
      isSettling: false,
      coarseTileCount: 0,
      hasPendingSelection: false,
      pendingSelectionKey: null,
    }
  }

  private bootstrapTiles(
    fovDeg: number,
    camera: SkyEntityDrawInput['camera'] | null,
    centerSphericalDeg: SkyEntityDrawInput['centerSphericalDeg'] | null,
    fovPolygon: SkyEntityDrawInput['fovPolygon'] | null = null,
    viewportSphericalSamples: SkyEntityDrawInput['viewportSphericalSamples'] | null = null,
  ): void {
    const selection = camera
      ? this._visibleTilesManager.selectTiles({
          fovDeg,
          camera,
          pMatrix: new Float32Array(),
          centerSphericalDeg: centerSphericalDeg ?? undefined,
          fovPolygon: fovPolygon ?? undefined,
          viewportSphericalSamples: viewportSphericalSamples ?? undefined,
        } as SkyEntityDrawInput)
      : {
          key: 'initial',
          currentTiles: this._provider.getInitialTiles(),
          fallbackTiles: [],
          currentZoom: 1,
        }

    if (selection.key === this._tileSelectionKey) {
      return
    }

    this._tileSelectionKey = selection.key
    this._currentTileCount = selection.currentTiles.length
    this._fallbackTileCount = selection.fallbackTiles.length
    const segments = this._config.segmentsPerSide ?? 16
    const prioritizedCurrentTiles = selection.currentTiles.map((tileCoord, index) => ({
      tileCoord,
      priority: 10000 + (selection.currentTiles.length - index),
    }))
    const prioritizedFallbackTiles = selection.fallbackTiles.map((tileCoord, index) => ({
      tileCoord,
      priority: 1000 + (selection.fallbackTiles.length - index),
    }))
    const requestedTiles = [...prioritizedCurrentTiles, ...prioritizedFallbackTiles]
    this._tilePriorities.clear()
    this._visibleTileKeys = requestedTiles
      .sort((a, b) => a.tileCoord.z - b.tileCoord.z)
      .map(({ tileCoord, priority }) => {
        const tileKey = this.getTileKey(tileCoord)
        this._tilePriorities.set(tileKey, priority)
        return tileKey
      })

    for (const { tileCoord, priority } of requestedTiles) {
      const tileKey = this.getTileKey(tileCoord)
      const existingTile = this._tileCache.get(tileKey)
      if (existingTile) {
        existingTile.touch()
        existingTile.primeLoad(priority)
        continue
      }
      const mesh = this._meshBuilder.buildTileMesh(tileCoord, segments)
      const url = this._provider.getTileUrl(tileCoord)
      const tile = new XYZTile(tileCoord, url, mesh, this._webgl, this._xyzShaderProgram)
      tile.touch()
      tile.primeLoad(priority)
      this._tileCache.set(tileKey, tile)
    }

    this.evictCache()
  }

  draw(input: SkyEntityDrawInput): void {
    const vMatrix = input.camera.getCameraMatrix() as Float32Array
    if (!vMatrix) return

    this.bootstrapTiles(
      input.fovDeg ?? 180,
      input.camera,
      input.centerSphericalDeg ?? null,
      input.fovPolygon ?? null,
      input.viewportSphericalSamples ?? null,
    )

    const pMatrix = input.pMatrix as Float32Array
    const mMatrix = this.getModelMatrix() as Float32Array

    for (const tileKey of this._visibleTileKeys) {
      const tile = this._tileCache.get(tileKey)
      if (!tile) continue
      tile.draw(pMatrix, vMatrix, mMatrix, this._tilePriorities.get(tileKey) ?? 0)
    }
  }

  private evictCache(): void {
    const maxCachedTiles = this._config.maxCachedTiles ?? XYZLayer.DEFAULT_MAX_CACHED_TILES
    if (this._tileCache.size <= maxCachedTiles) {
      return
    }

    const visibleKeySet = new Set(this._visibleTileKeys)
    const candidates = Array.from(this._tileCache.entries())
      .filter(([tileKey]) => !visibleKeySet.has(tileKey))
      .sort((a, b) => {
        const scoreA = Math.min(a[1].lastUsedAt || a[1].createdAt, a[1].createdAt)
        const scoreB = Math.min(b[1].lastUsedAt || b[1].createdAt, b[1].createdAt)
        return scoreA - scoreB
      })

    for (const [tileKey, tile] of candidates) {
      if (this._tileCache.size <= maxCachedTiles) {
        break
      }
      if (tile.loading) {
        continue
      }
      tile.dispose()
      this._tileCache.delete(tileKey)
    }
  }

  private disposeTiles(): void {
    for (const tile of this._tileCache.values()) {
      tile.dispose()
    }
    this._tileCache.clear()
    this._visibleTileKeys = []
  }

  private getTileKey(tileCoord: { z: number; x: number; y: number }): string {
    return `${tileCoord.z}/${tileCoord.x}/${tileCoord.y}`
  }
}
