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

  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} fetching properties`);
  }

  const propsText = await resp.text();
  const desc = new astroviewer.HiPSDescriptor(propsText, new URL(hipsUrl));

  state.AstroAPI.activateHiPS(desc, false);

  refreshHiPSUI();

  // if user prefers inside view, toggle now
  const inside = el("insideSphereChk")?.checked;
  if (inside && state.AstroAPI?.toggleInsideSphere) {
    state.AstroAPI.toggleInsideSphere();
  }

  setStatus("✅ HiPS loaded.");
}

export async function addHiPS(baseUrl) {
  const hips = await state.AstroAPI.addHiPSFromUrl(baseUrl);

  refreshHiPSUI();

  setStatus(`✅ HiPS layer added: ${hips.name ?? hips.baseURL}`);
  return hips;
}

export async function loadHiPS2(baseUrl) {
  const hipsUrl = baseUrl.endsWith("/") ? baseUrl : baseUrl + "/";
  const resp = await fetch(hipsUrl + "properties");

  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} fetching properties`);
  }

  const propsText = await resp.text();
  const desc = new astroviewer.HiPSDescriptor(propsText, new URL(hipsUrl));

  state.AstroAPI2.activateHiPS(desc, false);

  const inside = el("insideSphereChk")?.checked;
  if (inside && state.AstroAPI2?.toggleInsideSphere) {
    state.AstroAPI2.toggleInsideSphere();
  }

  setStatus("✅ HiPS loaded.");
}

export function wireHiPSControls() {
  wireHiPSFormatSelector();

  el("btnAddHiPS")?.addEventListener("click", async () => {
    const url = el("hipsUrl")?.value.trim();

    if (!url) {
      setStatus("Insert a HiPS URL.");
      return;
    }

    try {
      await addHiPS(url);
    } catch (error) {
      console.error(error);
      setStatus(`❌ Unable to add HiPS: ${error.message}`);
    }
  });

  el("btnRemoveAllHiPS")?.addEventListener("click", () => {
    state.AstroAPI.removeAllHiPS();
    refreshHiPSUI();
    setStatus("✅ All HiPS layers removed.");
  });

  refreshHiPSUI();
}

export function wireHiPSFormatSelector() {
  const select = el("hipsFormat");

  if (!select) {
    return;
  }

  select.addEventListener("change", () => {
    const format = select.value;

    if (!format) {
      return;
    }

    try {
      state.AstroAPI.changeHiPSFormat(format);

      refreshHiPSUI();

      setStatus(`✅ HiPS format changed to ${format}.`);
    } catch (error) {
      console.error(error);
      setStatus(`❌ Unable to change HiPS format: ${error.message}`);
    }
  });
}

export function refreshHiPSUI() {
  populateHiPSFormats();
  renderHiPSLayers();
}

function populateHiPSFormats() {
  const select = el("hipsFormat");

  if (!select) {
    return;
  }

  const formats = state.AstroAPI?.getActiveHiPSFormats?.() ?? [];

  const activeFormat = state.AstroAPI?.getActiveHiPS?.()?.format;

  select.replaceChildren();

  if (formats.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "—";
    select.appendChild(option);
    select.disabled = true;
    return;
  }

  for (const format of formats) {
    const option = document.createElement("option");

    option.value = format;
    option.textContent = format.toUpperCase();
    option.selected = format === activeFormat;

    select.appendChild(option);
  }

  select.disabled = formats.length <= 1;
}

function renderHiPSLayers() {
  const container = el("hipsLayers");

  if (!container) {
    return;
  }

  const layers = state.AstroAPI?.getActiveHiPSLayers?.() ?? [];

  const active = state.AstroAPI?.getActiveHiPS?.() ?? null;

  container.replaceChildren();

  if (layers.length === 0) {
    const empty = document.createElement("div");
    empty.className = "hint";
    empty.textContent = "No HiPS layers loaded.";
    container.appendChild(empty);
    return;
  }

  layers.forEach((hips, index) => {
    const row = document.createElement("div");
    row.className = "row";

    const selectButton = document.createElement("button");
    selectButton.type = "button";

    const isActive = hips === active;

    selectButton.textContent = `${isActive ? "● " : ""}${index + 1}. ${getHiPSLabel(hips)}`;

    selectButton.title = hips.baseURL;

    selectButton.addEventListener("click", () => {
      state.AstroAPI.setActiveHiPS(hips);
      refreshHiPSUI();

      setStatus(`✅ Active HiPS: ${getHiPSLabel(hips)}`);
    });

    const info = document.createElement("span");
    info.className = "hint";
    info.textContent = `${hips.format.toUpperCase()} · ${hips.isGalacticHips ? "Galactic" : "Equatorial"}`;

    const opacity = document.createElement("input");
    opacity.type = "range";
    opacity.min = "0";
    opacity.max = "1";
    opacity.step = "0.05";
    opacity.value = String(hips.opacity);
    opacity.title = `Opacity ${Math.round(hips.opacity * 100)}%`;

    const opacityValue = document.createElement("span");
    opacityValue.className = "mono";
    opacityValue.textContent = `${Math.round(hips.opacity * 100)}%`;

    opacity.addEventListener("input", () => {
      const value = Number(opacity.value);

      state.AstroAPI.setHiPSOpacity(hips, value);

      opacityValue.textContent = `${Math.round(value * 100)}%`;
      opacity.title = `Opacity ${Math.round(value * 100)}%`;
    });

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.textContent = "Remove";

    removeButton.addEventListener("click", () => {
      state.AstroAPI.removeHiPS(hips);
      refreshHiPSUI();

      setStatus(`✅ HiPS removed: ${getHiPSLabel(hips)}`);
    });

    row.append(selectButton, info, opacity, opacityValue, removeButton);

    container.appendChild(row);
  });
}

function getHiPSLabel(hips) {
  return hips.name || hips.baseURL;
}
