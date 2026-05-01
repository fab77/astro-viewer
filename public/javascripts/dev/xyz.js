import { setStatus } from './ui.js';
import { state } from './state.js';

export function loadXYZ(urlTemplate, options = {}) {
  if (!state.AstroAPI?.activateXYZ) {
    throw new Error('AstroAPI.activateXYZ unavailable')
  }

  state.AstroAPI.activateXYZ({
    urlTemplate,
    minZoom: options.minZoom,
    maxZoom: options.maxZoom,
    segmentsPerSide: options.segmentsPerSide,
  })

  setStatus(`🌍 XYZ loaded (auto zoom ${options.minZoom ?? 0}-${options.maxZoom ?? 6}).`)
}
