/*
 * AstroViewer
 * Copyright (C) Fabrizio Giordano
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-AstroViewer-Commercial
 *
 * AstroViewer is dual-licensed under the GNU Affero General Public License
 * version 3 and a separate commercial license.
 *
 * See LICENSE.md, LICENSE-AGPL.md, and LICENSE-COMMERCIAL.md for details.
 */

import { setStatus } from './ui.js';
import { state } from './state.js';
import { markEarthInitialising } from './diagnostics.js';

export function loadXYZ(urlTemplate, options = {}) {
  if (!state.AstroAPI?.activateXYZ2) {
    throw new Error('AstroAPI.activateXYZ2 unavailable')
  }

  markEarthInitialising();

  if (Number.isFinite(options.maxConcurrentRequests) && state.AstroAPI?.setXYZMaxConcurrentRequests) {
    state.AstroAPI.setXYZMaxConcurrentRequests(options.maxConcurrentRequests)
  }

  state.AstroAPI.activateXYZ2({
    name: 'XYZ Earth2 Test Layer',
    urlTemplate,
    minZoom: options.minZoom,
    maxZoom: options.maxZoom,
    segmentsPerSide: options.segmentsPerSide,
    maxCachedTiles: options.maxCachedTiles,
  })

  const lonLatChk = document.getElementById('lonLatGridChk')
  if (lonLatChk && typeof state.AstroAPI?.isLonLatGridVisible === 'function') {
    lonLatChk.checked = !!state.AstroAPI.isLonLatGridVisible()
  }

  setStatus(
    `🌍 XYZ loaded (zoom ${options.minZoom ?? 0}-${options.maxZoom ?? 6}, cache ${options.maxCachedTiles ?? 384}, concurrent ${options.maxConcurrentRequests ?? 4}).`
  )
}

export function loadWMTS(config = {}) {
  if (!state.AstroAPI?.activateWMTS) {
    throw new Error('AstroAPI.activateWMTS unavailable')
  }

  markEarthInitialising();

  if (Number.isFinite(config.maxConcurrentRequests) && state.AstroAPI?.setXYZMaxConcurrentRequests) {
    state.AstroAPI.setXYZMaxConcurrentRequests(config.maxConcurrentRequests)
  }

  state.AstroAPI.activateWMTS({
    baseUrl: config.baseUrl,
    urlTemplate: config.urlTemplate,
    layer: config.layer,
    tileMatrixSet: config.tileMatrixSet,
    style: config.style,
    time: config.time,
    format: config.format,
    requestEncoding: config.requestEncoding,
    version: config.version,
    dimensions: config.dimensions,
    matrixLabels: config.matrixLabels,
    minZoom: config.minZoom,
    maxZoom: config.maxZoom,
    segmentsPerSide: config.segmentsPerSide,
    maxCachedTiles: config.maxCachedTiles,
    flipY: config.flipY,
  })

  setStatus(
    `🗺️ WMTS loaded (${config.requestEncoding ?? 'kvp'} ${config.layer}/${config.tileMatrixSet}, time ${config.time ?? '∅'}, zoom ${config.minZoom ?? 0}-${config.maxZoom ?? 6}).`
  )
}
