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
export async function loadHiPS2(baseUrl) {
  const hipsUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
  const resp = await fetch(hipsUrl + 'properties');
  if (!resp.ok) throw new Error(`HTTP ${resp.status} fetching properties`);
  const propsText = await resp.text();
  const desc = new astroviewer.HiPSDescriptor(propsText, new URL(hipsUrl));
  state.AstroAPI2.activateHiPS(desc, false);
  // if user prefers inside view, toggle now
  const inside = el('insideSphereChk')?.checked;
  if (inside && state.AstroAPI2?.toggleInsideSphere) {
    state.AstroAPI2.toggleInsideSphere();
  }
  setStatus("✅ HiPS loaded.");
}
