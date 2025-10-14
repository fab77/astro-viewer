// hips.js
import { setStatus } from './ui.js';
import { state } from './state.js';

export async function loadHiPS(baseUrl) {
  const hipsUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
  const resp = await fetch(hipsUrl + 'properties');
  if (!resp.ok) throw new Error(`HTTP ${resp.status} fetching properties`);
  const propsText = await resp.text();
  const desc = new astrocore.HiPSDescriptor(propsText, new URL(hipsUrl));
  state.AstroAPI.activateHiPS(desc, false);
  setStatus("✅ HiPS loaded.");
}
