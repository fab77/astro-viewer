import { AbstractSkyEntity, SkyEntityDrawInput } from '../AbstractSkyEntity.js'
import { XYZShaderProgram } from '../../shader/XYZShaderProgram.js'
import { XYZMeshBuilder } from './XYZMeshBuilder.js'
import { XYZTile } from './XYZTile.js'
import { XYZTileProvider } from './XYZTileProvider.js'
import type { XYZLayerConfig } from './types.js'

export class XYZLayer extends AbstractSkyEntity {
  private _config: XYZLayerConfig
  private _provider: XYZTileProvider
  private _meshBuilder: XYZMeshBuilder
  private _xyzShaderProgram: XYZShaderProgram
  private _tiles: XYZTile[] = []
  private _tileSelectionKey: string | null = null

  constructor(config: XYZLayerConfig, webgl: WebGL2RenderingContext) {
    super(1, [0, 0, 0], 0, 0, 'XYZ Earth Layer', webgl, false)
    this._config = config
    this._provider = new XYZTileProvider(config)
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
  ): void {
    const selection = camera
      ? this._provider.getTilesForCamera(fovDeg, camera, centerSphericalDeg ?? null)
      : { key: 'initial', tiles: this._provider.getInitialTiles() }

    if (selection.key === this._tileSelectionKey) {
      return
    }

    this.disposeTiles()
    this._tileSelectionKey = selection.key
    const segments = this._config.segmentsPerSide ?? 16

    this._tiles = selection.tiles.map((tileCoord) => {
      const mesh = this._meshBuilder.buildTileMesh(tileCoord, segments)
      const url = this._provider.getTileUrl(tileCoord)
      return new XYZTile(tileCoord, url, mesh, this._webgl, this._xyzShaderProgram)
    })
  }

  draw(input: SkyEntityDrawInput): void {
    const vMatrix = input.camera.getCameraMatrix() as Float32Array
    if (!vMatrix) return

    this.bootstrapTiles(input.fovDeg ?? 180, input.camera, input.centerSphericalDeg ?? null)

    const pMatrix = input.pMatrix as Float32Array
    const mMatrix = this.getModelMatrix() as Float32Array

    for (const tile of this._tiles) {
      tile.draw(pMatrix, vMatrix, mMatrix)
    }
  }

  private disposeTiles(): void {
    for (const tile of this._tiles) {
      tile.dispose()
    }
    this._tiles = []
  }
}
