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
