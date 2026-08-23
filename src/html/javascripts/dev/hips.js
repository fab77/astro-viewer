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

// hips.js
import { setStatus, el } from "./ui.js";
import { state } from "./state.js";

export async function loadHiPS(baseUrl) {
  const hipsUrl = baseUrl.endsWith("/") ? baseUrl : baseUrl + "/";
  const resp = await fetch(hipsUrl + "properties");
  if (!resp.ok) throw new Error(`HTTP ${resp.status} fetching properties`);
  const propsText = await resp.text();
  const desc = new astroviewer.HiPSDescriptor(propsText, new URL(hipsUrl));
  state.AstroAPI.activateHiPS(desc, false);
  populateHiPSFormats();
  // if user prefers inside view, toggle now
  const inside = el("insideSphereChk")?.checked;
  if (inside && state.AstroAPI?.toggleInsideSphere) {
    state.AstroAPI.toggleInsideSphere();
  }
  setStatus("✅ HiPS loaded.");
}
export async function loadHiPS2(baseUrl) {
  const hipsUrl = baseUrl.endsWith("/") ? baseUrl : baseUrl + "/";
  const resp = await fetch(hipsUrl + "properties");
  if (!resp.ok) throw new Error(`HTTP ${resp.status} fetching properties`);
  const propsText = await resp.text();
  const desc = new astroviewer.HiPSDescriptor(propsText, new URL(hipsUrl));
  state.AstroAPI2.activateHiPS(desc, false);
  // if user prefers inside view, toggle now
  const inside = el("insideSphereChk")?.checked;
  if (inside && state.AstroAPI2?.toggleInsideSphere) {
    state.AstroAPI2.toggleInsideSphere();
  }
  setStatus("✅ HiPS loaded.");
}

export function wireHiPSFormatSelector() {
  const select = el("hipsFormat");
  if (!select) return;

  select.addEventListener("change", () => {
    const format = select.value;
    if (!format) {
      return;
    }
    try {
      state.AstroAPI.changeHiPSFormat(format);
      setStatus(`✅ HiPS format changed to ${format}.`);
    } catch (error) {
      console.error(error);
      setStatus(`❌ Unable to change HiPS format: ${error.message}`);
    }
  });
}

function populateHiPSFormats() {
  const select = el("hipsFormat");
  if (!select) return;

  const formats = state.AstroAPI?.getActiveHiPSFormats?.() ?? [];
  const activeFormat = state.AstroAPI?.getActiveHiPS?.()?.format;

  select.replaceChildren();

  for (const format of formats) {
    const option = document.createElement("option");
    option.value = format;
    option.textContent = format.toUpperCase();
    option.selected = format === activeFormat;
    select.appendChild(option);
  }

  select.disabled = formats.length <= 1;
}
