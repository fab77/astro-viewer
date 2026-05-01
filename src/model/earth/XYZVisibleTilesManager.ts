import type { XYZTileCoord } from './types.js'
import { XYZTileProvider } from './XYZTileProvider.js'
import type { SkyEntityDrawInput } from '../AbstractSkyEntity.js'

export type XYZTileSelection = {
  key: string
  currentTiles: XYZTileCoord[]
  fallbackTiles: XYZTileCoord[]
  currentZoom: number
}

export class XYZVisibleTilesManager {
  private _provider: XYZTileProvider

  constructor(provider: XYZTileProvider) {
    this._provider = provider
  }

  selectTiles(input: SkyEntityDrawInput): XYZTileSelection {
    const currentZoom = this._provider.resolveZoom(input.fovDeg ?? 180)
    const currentTiles = this.orderTilesByScreenRelevance(
      this._provider.getVisibleTilesAtZoom(
        currentZoom,
        input.centerSphericalDeg ?? null,
        input.fovPolygon ?? [],
        input.viewportSphericalSamples ?? [],
        1,
      ),
      currentZoom,
      input.centerSphericalDeg ?? null,
    )
    const fallbackTiles = this.orderFallbackTiles(
      Array.from(this.buildFallbackMap(currentTiles, currentZoom).values()),
      currentZoom,
      input.centerSphericalDeg ?? null,
    )

    const key = `${currentZoom}:${currentTiles.map((tile) => `${tile.x}/${tile.y}`).join('|')}`
    return {
      key,
      currentTiles,
      fallbackTiles,
      currentZoom,
    }
  }

  private buildFallbackMap(currentTiles: XYZTileCoord[], currentZoom: number): Map<string, XYZTileCoord> {
    const fallbackMap = new Map<string, XYZTileCoord>()
    const minFallbackZoom = Math.max(this._provider.minZoom, currentZoom - 2)
    for (let z = currentZoom - 1; z >= minFallbackZoom; z--) {
      const dz = currentZoom - z
      for (const tile of currentTiles) {
        const fallback = {
          z,
          x: tile.x >> dz,
          y: tile.y >> dz,
        }
        fallbackMap.set(`${fallback.z}/${fallback.x}/${fallback.y}`, fallback)
      }
    }

    return fallbackMap
  }

  private orderTilesByScreenRelevance(
    tiles: XYZTileCoord[],
    zoom: number,
    centerSphericalDeg: SkyEntityDrawInput['centerSphericalDeg'] | null,
  ): XYZTileCoord[] {
    const centerTile = this.getCenterTileCoord(zoom, centerSphericalDeg)
    if (!centerTile) {
      return tiles
    }

    return [...tiles].sort((a, b) => {
      const distanceA = Math.abs(a.x - centerTile.x) + Math.abs(a.y - centerTile.y)
      const distanceB = Math.abs(b.x - centerTile.x) + Math.abs(b.y - centerTile.y)
      return distanceA - distanceB
    })
  }

  private orderFallbackTiles(
    tiles: XYZTileCoord[],
    currentZoom: number,
    centerSphericalDeg: SkyEntityDrawInput['centerSphericalDeg'] | null,
  ): XYZTileCoord[] {
    return [...tiles].sort((a, b) => {
      if (b.z !== a.z) {
        return b.z - a.z
      }

      const centerTileA = this.getCenterTileCoord(a.z, centerSphericalDeg)
      const centerTileB = this.getCenterTileCoord(b.z, centerSphericalDeg)
      if (!centerTileA || !centerTileB) {
        return 0
      }

      const distanceA = Math.abs(a.x - centerTileA.x) + Math.abs(a.y - centerTileA.y)
      const distanceB = Math.abs(b.x - centerTileB.x) + Math.abs(b.y - centerTileB.y)
      return distanceA - distanceB || currentZoom - a.z - (currentZoom - b.z)
    })
  }

  private getCenterTileCoord(
    zoom: number,
    centerSphericalDeg: SkyEntityDrawInput['centerSphericalDeg'] | null,
  ): XYZTileCoord | null {
    if (!centerSphericalDeg) {
      return null
    }

    const lonDeg = centerSphericalDeg.phi > 180 ? centerSphericalDeg.phi - 360 : centerSphericalDeg.phi
    const latDeg = 90 - centerSphericalDeg.theta
    const dim = 2 ** zoom
    const x = Math.floor(((lonDeg + 180) / 360) * dim)
    const latRad = (Math.max(-85.0511287798066, Math.min(85.0511287798066, latDeg)) * Math.PI) / 180
    const y = Math.floor(((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * dim)

    return {
      z: zoom,
      x: ((x % dim) + dim) % dim,
      y: Math.max(0, Math.min(dim - 1, y)),
    }
  }
}
