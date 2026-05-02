import { AbstractSkyEntity, SkyEntityDrawInput } from '../AbstractSkyEntity.js'
import { XYZShaderProgram } from '../../shader/XYZShaderProgram.js'
import { XYZAncestorMeshCache } from './XYZAncestorMeshCache.js'
import { XYZMeshBuilder } from './XYZMeshBuilder.js'
import { XYZTileBuffer, XYZTileRequest } from './XYZTileBuffer.js'
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
  private _tileBuffer: XYZTileBuffer
  private _ancestorMeshCache: XYZAncestorMeshCache
  private _visibleTileKeys: string[] = []
  private _fallbackVisibleTileKeys: string[] = []
  private _baseVisibleTileKeys: string[] = []
  private _tilePriorities: Map<string, number> = new Map()
  private _tileSelectionKey: string | null = null
  private _currentTileCount = 0
  private _fallbackTileCount = 0
  private _coreTileCount = 0
  private _coverageTileCount = 0

  constructor(config: XYZLayerConfig, webgl: WebGL2RenderingContext) {
    super(1, [0, 0, 0], 0, 0, 'XYZ Earth Layer', webgl, false)
    this._config = config
    this._provider = new XYZTileProvider(config)
    this._visibleTilesManager = new XYZVisibleTilesManager(this._provider)
    this._meshBuilder = new XYZMeshBuilder()
    this._xyzShaderProgram = new XYZShaderProgram(webgl)
    this._tileBuffer = new XYZTileBuffer(1, webgl, this._meshBuilder, this._xyzShaderProgram)
    this._ancestorMeshCache = new XYZAncestorMeshCache(webgl, this._meshBuilder)
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

    const allTiles = [
      ...Array.from(this._tileBuffer.activeTiles.values(), (entry) => entry.tile),
      ...Array.from(this._tileBuffer.cachedTiles.values(), (entry) => entry.tile),
    ]

    for (const tile of allTiles) {
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
      cacheSize: this._tileBuffer.size,
      visibleTileCount: this._visibleTileKeys.length,
      currentTileCount: this._currentTileCount,
      fallbackTileCount: this._fallbackTileCount,
      coreTileCount: this._coreTileCount,
      coverageTileCount: this._coverageTileCount,
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
          coreTileCount: this._provider.getInitialTiles().length,
          coverageTileCount: 0,
        }

    if (selection.key === this._tileSelectionKey) {
      return
    }

    this._tileSelectionKey = selection.key
    this._currentTileCount = selection.currentTiles.length
    this._fallbackTileCount = selection.fallbackTiles.length
    this._coreTileCount = selection.coreTileCount
    this._coverageTileCount = selection.coverageTileCount
    const segments = this._config.segmentsPerSide ?? 16
    const baseTiles = this._provider.getInitialTiles()
    const coreTileKeys = new Set(
      selection.currentTiles
        .slice(0, selection.coreTileCount)
        .map((tileCoord) => this.getTileKey(tileCoord)),
    )
    const baseTileKeys = new Set(baseTiles.map((tileCoord) => this.getTileKey(tileCoord)))
    const prioritizedBaseTiles = baseTiles.map((tileCoord, index) => ({
      tileCoord,
      priority: 5000 + (baseTiles.length - index),
      role: 'base' as const,
    }))
    const prioritizedCurrentTiles = selection.currentTiles.map((tileCoord, index) => ({
      tileCoord,
      priority: 10000 + (selection.currentTiles.length - index),
      role: coreTileKeys.has(this.getTileKey(tileCoord)) ? 'current' as const : 'coverage' as const,
    }))
    const prioritizedFallbackTiles = selection.fallbackTiles.map((tileCoord, index) => ({
      tileCoord,
      priority: 1000 + (selection.fallbackTiles.length - index),
      role: 'fallback' as const,
    }))
    const requestedTiles = [...prioritizedBaseTiles, ...prioritizedCurrentTiles, ...prioritizedFallbackTiles]
    this._tilePriorities.clear()
    this._fallbackVisibleTileKeys = []
    this._baseVisibleTileKeys = []
    const orderedRequests: XYZTileRequest[] = requestedTiles
      .sort((a, b) => a.tileCoord.z - b.tileCoord.z)
      .map(({ tileCoord, priority, role }) => {
        const tileKey = this.getTileKey(tileCoord)
        this._tilePriorities.set(tileKey, priority)
        return {
          tileCoord,
          priority,
          url: this._provider.getTileUrl(tileCoord),
          role,
        }
      })
    const ensuredKeys = this._tileBuffer.ensureTiles(orderedRequests, segments)
    const fallbackKeySet = new Set(selection.fallbackTiles.map((tileCoord) => this.getTileKey(tileCoord)))
    this._baseVisibleTileKeys = ensuredKeys.filter((tileKey) => baseTileKeys.has(tileKey))
    this._fallbackVisibleTileKeys = ensuredKeys.filter(
      (tileKey) => fallbackKeySet.has(tileKey) && !baseTileKeys.has(tileKey),
    )
    this._visibleTileKeys = ensuredKeys.filter(
      (tileKey) => !fallbackKeySet.has(tileKey) && !baseTileKeys.has(tileKey),
    )
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

    for (const tileKey of this._baseVisibleTileKeys) {
      const tile = this._tileBuffer.getActiveTile(tileKey)
      if (!tile) continue
      tile.draw(pMatrix, vMatrix, mMatrix, this._tilePriorities.get(tileKey) ?? 0)
    }

    for (const tileKey of this._fallbackVisibleTileKeys) {
      const tile = this._tileBuffer.getActiveTile(tileKey)
      if (!tile) continue
      tile.draw(pMatrix, vMatrix, mMatrix, this._tilePriorities.get(tileKey) ?? 0, false)
    }

    for (const tileKey of this._visibleTileKeys) {
      const tile = this._tileBuffer.getActiveTile(tileKey)
      if (tile?.ready) {
        tile.draw(pMatrix, vMatrix, mMatrix, this._tilePriorities.get(tileKey) ?? 0)
        continue
      }

      const targetCoord = this.parseTileKey(tileKey)
      if (targetCoord) {
        const ancestorTile = this.findBestAvailableAncestor(targetCoord)
        if (ancestorTile) {
          const ancestorMesh = this._ancestorMeshCache.getMesh(
            targetCoord,
            ancestorTile.coord,
            this._config.segmentsPerSide ?? 16,
          )
          ancestorTile.drawRemapped(ancestorMesh, pMatrix, vMatrix, mMatrix)
        }
      }

      tile?.draw(pMatrix, vMatrix, mMatrix, this._tilePriorities.get(tileKey) ?? 0)
    }
  }

  private evictCache(): void {
    const maxCachedTiles = this._config.maxCachedTiles ?? XYZLayer.DEFAULT_MAX_CACHED_TILES
    this._tileBuffer.evictCached(maxCachedTiles)
  }

  private disposeTiles(): void {
    this._tileBuffer.dispose()
    this._ancestorMeshCache.dispose()
    this._visibleTileKeys = []
    this._fallbackVisibleTileKeys = []
    this._baseVisibleTileKeys = []
  }

  private getTileKey(tileCoord: { z: number; x: number; y: number }): string {
    return `${tileCoord.z}/${tileCoord.x}/${tileCoord.y}`
  }

  private parseTileKey(tileKey: string): { z: number; x: number; y: number } | null {
    const [zRaw, xRaw, yRaw] = tileKey.split('/')
    const z = Number.parseInt(zRaw ?? '', 10)
    const x = Number.parseInt(xRaw ?? '', 10)
    const y = Number.parseInt(yRaw ?? '', 10)

    if (!Number.isFinite(z) || !Number.isFinite(x) || !Number.isFinite(y)) {
      return null
    }

    return { z, x, y }
  }

  private findBestAvailableAncestor(targetCoord: { z: number; x: number; y: number }) {
    for (let z = targetCoord.z - 1; z >= this._provider.minZoom; z--) {
      const dz = targetCoord.z - z
      const ancestorCoord = {
        z,
        x: targetCoord.x >> dz,
        y: targetCoord.y >> dz,
      }
      const ancestor = this._tileBuffer.getAnyTile(this.getTileKey(ancestorCoord))
      if (ancestor?.ready) {
        return ancestor
      }
    }

    return null
  }
}
