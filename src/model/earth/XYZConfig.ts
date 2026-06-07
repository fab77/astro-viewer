/*
 * AstroViewer
 * Copyright (C) Fabrizio Giordano
 * SPDX-License-Identifier: LicenseRef-AstroViewer-Dual-License
 *
 * This file is part of AstroViewer.
 * AstroViewer is distributed under a dual-license model.
 * Commercial use requires a separate commercial license.
 * Non-commercial use is governed by LICENSE-NONCOMMERCIAL.md.
 *
 * See LICENSE.md, LICENSE-COMMERCIAL.md, and LICENSE-NONCOMMERCIAL.md for details.
 */

import type { XYZTileCoord } from './XYZTypes.js'

export type XYZLayerConfig = {
  urlTemplate: string
  name?: string
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
  coreTileCount: number
  coverageTileCount: number
  readyTileCount: number
  loadingTileCount: number
  coolingDownTileCount: number
  currentZoom: number | null
  tileSelectionKey: string | null
  isSettling: boolean
  coarseTileCount: number
  hasPendingSelection: boolean
  pendingSelectionKey: string | null
  hipsName?: string
  hipsUrl?: string
  isGalactic?: boolean
  currentOrder?: number | null
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
  activeBaseLayer: 'hips' | 'xyz' | 'meships' | null
  layer: XYZLayerDebugStats | null
  requests: XYZRequestSchedulerDebugStats
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
