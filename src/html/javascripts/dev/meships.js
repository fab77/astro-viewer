/*
 * AstroViewer
 * Copyright (C) Fabrizio Giordano
 * SPDX-License-Identifier: LicenseRef-AstroViewer-Dual-License
 */

import { setStatus } from './ui.js'
import { state } from './state.js'

export async function loadMeshHiPS(baseUrl, options = {}) {
  if (!state.AstroAPI?.loadMeshHiPS) {
    throw new Error('AstroAPI.loadMeshHiPS unavailable')
  }

  const name = await state.AstroAPI.loadMeshHiPS(baseUrl, {
    name: options.name || undefined,
    order: Number.isFinite(options.order) ? options.order : undefined,
    maxCachedTiles: Number.isFinite(options.maxCachedTiles) ? options.maxCachedTiles : undefined,
    wireframe: !!options.wireframe,
    color: options.color,
  })

  setStatus(`MeshHiPS loaded: ${name}`)
}
