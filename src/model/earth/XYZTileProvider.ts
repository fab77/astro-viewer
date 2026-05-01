import type { XYZLayerConfig, XYZTileCoord } from './types.js'

export class XYZTileProvider {
  private _config: XYZLayerConfig

  constructor(config: XYZLayerConfig) {
    this._config = config
  }

  get config(): XYZLayerConfig {
    return this._config
  }

  getInitialTiles(): XYZTileCoord[] {
    const z = Math.max(0, Math.floor(this._config.fixedZoom ?? 1))
    const dim = 2 ** z
    const tiles: XYZTileCoord[] = []

    for (let x = 0; x < dim; x++) {
      for (let y = 0; y < dim; y++) {
        tiles.push({ z, x, y })
      }
    }

    return tiles
  }

  getTileUrl(tile: XYZTileCoord): string {
    return this._config.urlTemplate
      .replace(/\{z\}/g, String(tile.z))
      .replace(/\{x\}/g, String(tile.x))
      .replace(/\{y\}/g, String(tile.y))
  }
}
