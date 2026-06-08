export type HiPSDebugStats = {
  activeBaseLayer: 'hips' | 'xyz' | 'meships' | null
  hipsName: string | null
  hipsUrl: string | null
  isGalactic: boolean | null
  currentOrder: number | null
  visibleTileCount: number
  activeTileCount: number
  cachedTileCount: number
  cacheSize: number
  readyTileCount: number
  loadingTileCount: number
}
