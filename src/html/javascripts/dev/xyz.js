import { setStatus } from './ui.js';
import { state } from './state.js';

export function loadXYZ(urlTemplate, options = {}) {
  if (!state.AstroAPI?.activateXYZ) {
    throw new Error('AstroAPI.activateXYZ unavailable')
  }

  state.AstroAPI.activateXYZ({
    urlTemplate,
    fixedZoom: options.fixedZoom,
    segmentsPerSide: options.segmentsPerSide,
  })

  setStatus(`🌍 XYZ loaded (z=${options.fixedZoom ?? 1}).`)
}
