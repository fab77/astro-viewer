import { AbstractSkyEntity, SkyEntityDrawInput } from '../AbstractSkyEntity.js'
import { XYZShaderProgram } from '../../shader/XYZShaderProgram.js'
import { XYZMeshBuilder } from './XYZMeshBuilder.js'
import { XYZTile } from './XYZTile.js'
import { XYZTileProvider } from './XYZTileProvider.js'
import { XYZVisibleTilesManager } from './XYZVisibleTilesManager.js'
import type { XYZLayerConfig } from './types.js'

export class XYZLayer extends AbstractSkyEntity {
  private _config: XYZLayerConfig
  private _provider: XYZTileProvider
  private _visibleTilesManager: XYZVisibleTilesManager
  private _meshBuilder: XYZMeshBuilder
  private _xyzShaderProgram: XYZShaderProgram
  private _tileCache: Map<string, XYZTile> = new Map()
  private _visibleTileKeys: string[] = []
  private _tileSelectionKey: string | null = null

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
        }

    if (selection.key === this._tileSelectionKey) {
      return
    }

    this._tileSelectionKey = selection.key
    const segments = this._config.segmentsPerSide ?? 16
    const requestedTiles = [...selection.currentTiles, ...selection.fallbackTiles]
    this._visibleTileKeys = requestedTiles
      .sort((a, b) => a.z - b.z)
      .map((tileCoord) => this.getTileKey(tileCoord))

    for (const tileCoord of requestedTiles) {
      const tileKey = this.getTileKey(tileCoord)
      if (this._tileCache.has(tileKey)) {
        continue
      }
      const mesh = this._meshBuilder.buildTileMesh(tileCoord, segments)
      const url = this._provider.getTileUrl(tileCoord)
      this._tileCache.set(tileKey, new XYZTile(tileCoord, url, mesh, this._webgl, this._xyzShaderProgram))
    }
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
      tile.draw(pMatrix, vMatrix, mMatrix)
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
