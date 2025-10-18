// hips.js
import { setStatus, el } from './ui.js';
import { state } from './state.js';

export async function loadHiPS(baseUrl) {
  const hipsUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
  const resp = await fetch(hipsUrl + 'properties');
  if (!resp.ok) throw new Error(`HTTP ${resp.status} fetching properties`);
  const propsText = await resp.text();
  const desc = new astroviewer.HiPSDescriptor(propsText, new URL(hipsUrl));
  state.AstroAPI.activateHiPS(desc, false);
  // if user prefers inside view, toggle now
  const inside = el('insideSphereChk')?.checked;
  if (inside && state.AstroAPI?.toggleInsideSphere) {
    state.AstroAPI.toggleInsideSphere();
  }
  setStatus("✅ HiPS loaded.");
}
