/*
 * AstroViewer
 * Copyright (C) Fabrizio Giordano
 * SPDX-License-Identifier: LicenseRef-AstroViewer-Dual-License
 */

export type MeshHiPSTileCoord = {
  order: number
  ipix: number
}

export type MeshHiPSConfig = {
  baseUrl: string
  name?: string
  meshRadius?: number
  order?: number
  minOrder?: number
  maxOrder?: number
  maxCachedTiles?: number
  color?: [number, number, number, number]
  wireframe?: boolean
}

export type MeshHiPSDebugStats = {
  activeBaseLayer: 'meships'
  meshHiPSName: string
  meshHiPSUrl: string
  currentOrder: number
  visibleTileCount: number
  coverageTileCount: number
  cacheSize: number
  readyTileCount: number
  loadingTileCount: number
  failedTileCount: number
}

export type MeshHiPSMesh = {
  positions: Float32Array
  normals: Float32Array
  indices: Uint32Array
}

export type MeshHiPSGpuMesh = {
  positionBuffer: WebGLBuffer | null
  normalBuffer: WebGLBuffer | null
  indexBuffer: WebGLBuffer | null
  lineIndexBuffer: WebGLBuffer | null
  indexCount: number
  lineIndexCount: number
  indexType: number
}
