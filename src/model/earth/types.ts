export type XYZLayerConfig = {
  urlTemplate: string
  minZoom?: number
  maxZoom?: number
  segmentsPerSide?: number
  tileSize?: number
  maxCachedTiles?: number
  interactionDebounceMs?: number
  subdomains?: string[]
  attribution?: string
  flipY?: boolean
  urlResolver?: (tile: XYZTileCoord) => string
}

export type XYZLayerDebugStats = {
  cacheSize: number
  visibleTileCount: number
  currentTileCount: number
  fallbackTileCount: number
  readyTileCount: number
  loadingTileCount: number
  coolingDownTileCount: number
  currentZoom: number | null
  tileSelectionKey: string | null
  isSettling: boolean
  coarseTileCount: number
  hasPendingSelection: boolean
  pendingSelectionKey: string | null
}

export type XYZRequestBackoffDebugEntry = {
  host: string
  cooldownMs: number
  consecutiveFailures: number
}

export type XYZRequestSchedulerDebugStats = {
  activeRequests: number
  queuedRequests: number
  inflightRequests: number
  maxConcurrentRequests: number
  highestQueuedPriority: number | null
  hostsInBackoff: XYZRequestBackoffDebugEntry[]
}

export type XYZDebugStats = {
  activeBaseLayer: 'hips' | 'xyz' | null
  layer: XYZLayerDebugStats | null
  requests: XYZRequestSchedulerDebugStats
}

export type XYZTileCoord = {
  z: number
  x: number
  y: number
}

export type XYZTileMesh = {
  positions: Float32Array
  uvs: Float32Array
  indices: Uint16Array | Uint32Array
}

export type WMTSRequestEncoding = 'kvp' | 'rest'

export type WMTSLayerConfig = {
  baseUrl: string
  layer: string
  tileMatrixSet: string
  style?: string
  time?: string
  format?: string
  requestEncoding?: WMTSRequestEncoding
  version?: string
  dimensions?: Record<string, string>
  matrixLabels?: string[]
  urlTemplate?: string
  minZoom?: number
  maxZoom?: number
  segmentsPerSide?: number
  tileSize?: number
  maxCachedTiles?: number
  subdomains?: string[]
  attribution?: string
  flipY?: boolean
}
