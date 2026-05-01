import Camera from '../../Camera.js'
import global from '../../Global.js'
import type { XYZLayerConfig, XYZTileCoord } from './types.js'

const MAX_MERCATOR_LAT = 85.0511287798066

type XYZTileSelection = {
  key: string
  tiles: XYZTileCoord[]
}

type ViewCenterSpherical = {
  phi: number
  theta: number
}

export class XYZTileProvider {
  private _config: XYZLayerConfig

  constructor(config: XYZLayerConfig) {
    this._config = config
  }

  get config(): XYZLayerConfig {
    return this._config
  }

  getInitialTiles(): XYZTileCoord[] {
    return this.getTilesForCamera(180, null, null).tiles
  }

  getTilesForCamera(
    fovDeg: number,
    camera: Camera | null,
    centerSphericalDeg: ViewCenterSpherical | null,
  ): XYZTileSelection {
    const z = this.resolveZoom(fovDeg)
    const dim = 2 ** z
    const { lonDeg, latDeg } = this.resolveViewCenter(camera, centerSphericalDeg)
    const centerX = this.wrapTileX(Math.floor(((lonDeg + 180) / 360) * dim), dim)
    const centerY = this.clampTileY(Math.floor(this.latToTileY(latDeg, z)), dim)
    const tileAngularWidth = 360 / dim
    const halfSpan = Math.max(0, Math.min(dim, Math.ceil(fovDeg / tileAngularWidth / 2) + 1))
    const tiles: XYZTileCoord[] = []

    for (let dx = -halfSpan; dx <= halfSpan; dx++) {
      for (let dy = -halfSpan; dy <= halfSpan; dy++) {
        const x = this.wrapTileX(centerX + dx, dim)
        const y = this.clampTileY(centerY + dy, dim)
        tiles.push({ z, x, y })
      }
    }

    return {
      key: `${z}:${centerX}:${centerY}:${halfSpan}`,
      tiles: this.deduplicateTiles(tiles),
    }
  }

  getTileUrl(tile: XYZTileCoord): string {
    return this._config.urlTemplate
      .replace(/\{z\}/g, String(tile.z))
      .replace(/\{x\}/g, String(tile.x))
      .replace(/\{y\}/g, String(tile.y))
  }

  private resolveZoom(fovDeg: number): number {
    const safeFov = Math.max(0.01, Math.min(180, fovDeg))
    const targetTileWidthDeg = Math.max(0.01, safeFov / 2)
    const rawZoom = Math.ceil(Math.log2(360 / targetTileWidthDeg))
    return this.clampZoom(rawZoom)
  }

  private clampZoom(zoom: number): number {
    const minZoom = Math.max(0, Math.floor(this._config.minZoom ?? 0))
    const maxZoom = Math.max(minZoom, Math.floor(this._config.maxZoom ?? 6))
    return Math.max(minZoom, Math.min(maxZoom, zoom))
  }

  private resolveViewCenter(
    camera: Camera | null,
    centerSphericalDeg: ViewCenterSpherical | null,
  ): { lonDeg: number; latDeg: number } {
    if (centerSphericalDeg) {
      return {
        lonDeg: centerSphericalDeg.phi > 180 ? centerSphericalDeg.phi - 360 : centerSphericalDeg.phi,
        latDeg: 90 - centerSphericalDeg.theta,
      }
    }

    if (!camera) {
      return { lonDeg: 0, latDeg: 0 }
    }

    const [x, y, z] = camera.getCameraPosition()
    const len = Math.hypot(x, y, z)
    if (!Number.isFinite(len) || len === 0) {
      return { lonDeg: 0, latDeg: 0 }
    }

    const scale = global.insideSphere ? 1 / len : -1 / len
    const vx = x * scale
    const vy = y * scale
    const vz = z * scale

    const lonDeg = (Math.atan2(vy, vx) * 180) / Math.PI
    const latDeg = (Math.asin(Math.max(-1, Math.min(1, vz))) * 180) / Math.PI

    return { lonDeg, latDeg }
  }

  private latToTileY(latDeg: number, z: number): number {
    const lat = Math.max(-MAX_MERCATOR_LAT, Math.min(MAX_MERCATOR_LAT, latDeg))
    const latRad = (lat * Math.PI) / 180
    const n = 2 ** z
    return ((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n
  }

  private wrapTileX(x: number, dim: number): number {
    return ((x % dim) + dim) % dim
  }

  private clampTileY(y: number, dim: number): number {
    return Math.max(0, Math.min(dim - 1, y))
  }

  private deduplicateTiles(tiles: XYZTileCoord[]): XYZTileCoord[] {
    const unique = new Map<string, XYZTileCoord>()
    for (const tile of tiles) {
      unique.set(`${tile.z}/${tile.x}/${tile.y}`, tile)
    }
    return Array.from(unique.values())
  }
}
