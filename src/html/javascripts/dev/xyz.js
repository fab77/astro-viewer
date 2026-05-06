import { setStatus } from './ui.js';
import { state } from './state.js';

export function loadXYZ(urlTemplate, options = {}) {
  if (!state.AstroAPI?.activateXYZ) {
    throw new Error('AstroAPI.activateXYZ unavailable')
  }

  if (Number.isFinite(options.maxConcurrentRequests) && state.AstroAPI?.setXYZMaxConcurrentRequests) {
    state.AstroAPI.setXYZMaxConcurrentRequests(options.maxConcurrentRequests)
  }

  state.AstroAPI.activateXYZ({
    urlTemplate,
    minZoom: options.minZoom,
    maxZoom: options.maxZoom,
    segmentsPerSide: options.segmentsPerSide,
    maxCachedTiles: options.maxCachedTiles,
  })

  setStatus(
    `🌍 XYZ loaded (zoom ${options.minZoom ?? 0}-${options.maxZoom ?? 6}, cache ${options.maxCachedTiles ?? 384}, concurrent ${options.maxConcurrentRequests ?? 4}).`
  )
}

export function loadWMTS(config = {}) {
  if (!state.AstroAPI?.activateWMTS) {
    throw new Error('AstroAPI.activateWMTS unavailable')
  }

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
