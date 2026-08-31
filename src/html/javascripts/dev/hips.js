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
import { setStatus, el, showLoading, hideLoading } from "./ui.js";
import { state } from "./state.js";
import { markHiPSInitialising } from "./diagnostics.js";

export async function loadHiPS(baseUrl) {
  markHiPSInitialising();
  showLoading("Initialising HiPS…");

  try {
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
  } catch (error) {
    hideLoading();
    throw error;
  }
}

export async function addHiPS(baseUrl) {
  const existingLayers = state.AstroAPI?.getActiveHiPSLayers?.() ?? [];
  const hips = await state.AstroAPI.addHiPSFromUrl(baseUrl);

  // "Add HiPS" means overlay in the demo. Keep the first layer opaque,
  // but make subsequent layers immediately visible as a composition.
  if (existingLayers.length > 0) {
    state.AstroAPI.setHiPSOpacity(hips, 0.65);
  }

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
  wireHiPSColorMapSelector();
  wireHiPSPresetSelector();
  wireHiPSPresetControls();
  wireHiPSScaleControls();
  wireHiPSRangeControls();

  el("btnAddHiPS")?.addEventListener("click", async () => {
    const url = el("hipsUrl")?.value.trim();

    if (!url) {
      setStatus("Insert a custom HiPS URL.");
      return;
    }

    try {
      await addHiPS(url);
    } catch (error) {
      console.error(error);
      setStatus(`❌ Unable to add custom HiPS: ${error.message}`);
    }
  });

  el("btnRemoveAllHiPS")?.addEventListener("click", () => {
    state.AstroAPI.removeAllHiPS();
    refreshHiPSUI();
    setStatus("✅ All HiPS layers removed.");
  });

  refreshHiPSUI();
}

const DEMO_HIPS = {
  dss2: {
    url: "https://alasky.cds.unistra.fr/DSS/DSSColor/",
  },

  galexFuv: {
    url: "https://alasky.cds.unistra.fr/GALEX/GALEXGR6_7_FUV/",
  },

  sdssR: {
    url: "https://alasky.cds.unistra.fr/SDSS/DR9/band-r/",
  },

  panstarrsR: {
    url: "https://alasky.cds.unistra.fr/Pan-STARRS/DR1/r/",
  },

  "2massH": {
    url: "https://alasky.cds.unistra.fr/2MASS/H/",
  },

  xmmRgb: {
    url: "https://alasky.cds.unistra.fr/SSC/xcatdb_P_XMM_PN_color/",
  },

  xmmEb2: {
    url: "https://alasky.cds.unistra.fr/SSC/xcatdb_P_XMM_PN_eb2/",
  },

  herschelSpire250: {
    url: "https://skies.esac.esa.int/Herschel/SPIRE250/",
  },

  planck143: {
    url: "https://alasky.cds.unistra.fr/ESAC/ESAVO_P_PLANCK_HFI-143/",
  },

  fermi1To3: {
    url: "https://alasky.cds.unistra.fr/Fermi/1-3GeV/",
  },
};

const FITS_PRESETS = {
  default: {
    rangeMode: "robust",
    scaleFunction: "linear",
    scaleParam: 1,
  },
  faint: {
    rangeMode: "robust",
    scaleFunction: "asinh",
    scaleParam: 10,
  },
  contrast: {
    rangeMode: "robust",
    scaleFunction: "log",
    scaleParam: 100,
  },
  gamma: {
    rangeMode: "robust",
    scaleFunction: "gamma",
    scaleParam: 0.5,
  },
};

export function wireHiPSPresetControls() {
  const select = el("hipsFitsPreset");

  if (!select) {
    return;
  }

  select.addEventListener("change", () => {
    const presetName = select.value;

    if (presetName === "custom") {
      return;
    }

    const preset = FITS_PRESETS[presetName];

    if (!preset) {
      return;
    }

    try {
      state.AstroAPI.setHiPSFITSRangeMode(preset.rangeMode);
      state.AstroAPI.setHiPSFITSScaleFunction(
        preset.scaleFunction,
        preset.scaleParam,
      );

      refreshHiPSUI();

      setStatus(
        `✅ FITS display preset changed to ${getFITSPresetLabel(presetName)}.`,
      );
    } catch (error) {
      console.error(error);
      setStatus(`❌ Unable to change FITS display preset: ${error.message}`);
    }
  });
}

export function wireHiPSRangeControls() {
  const select = el("hipsRangeMode");

  if (!select) {
    return;
  }

  select.addEventListener("change", () => {
    const rangeMode = select.value;

    if (!rangeMode) {
      return;
    }

    try {
      state.AstroAPI.setHiPSFITSRangeMode(rangeMode);
      refreshHiPSUI();
      setStatus(`✅ FITS range changed to ${getRangeModeLabel(rangeMode)}.`);
    } catch (error) {
      console.error(error);
      setStatus(`❌ Unable to change FITS range: ${error.message}`);
    }
  });
}

export function wireHiPSScaleControls() {
  const select = el("hipsScaleFunction");
  const paramInput = el("hipsScaleParam");

  if (!select) {
    return;
  }

  const applyScale = () => {
    const scaleFunction = select.value;
    const requestedParam = Number(paramInput?.value ?? "1");
    const scaleParam =
      Number.isFinite(requestedParam) && requestedParam > 0
        ? requestedParam
        : getDefaultScaleParam(scaleFunction);

    if (!scaleFunction) {
      return;
    }

    try {
      state.AstroAPI.setHiPSFITSScaleFunction(scaleFunction, scaleParam);
      refreshHiPSUI();
      setStatus(`✅ FITS scale changed to ${scaleFunction}.`);
    } catch (error) {
      console.error(error);
      setStatus(`❌ Unable to change FITS scale: ${error.message}`);
    }
  };

  select.addEventListener("change", () => {
    if (paramInput) {
      paramInput.value = String(getDefaultScaleParam(select.value));
    }

    applyScale();
  });

  paramInput?.addEventListener("change", applyScale);
}

export function wireHiPSColorMapSelector() {
  const select = el("hipsColorMap");

  if (!select) {
    return;
  }

  select.addEventListener("change", () => {
    const colorMapName = select.value;

    if (!colorMapName) {
      return;
    }

    try {
      state.AstroAPI.changeColorMap(colorMapName);
      refreshHiPSUI();
      setStatus(`✅ HiPS colormap changed to ${colorMapName}.`);
    } catch (error) {
      console.error(error);
      setStatus(`❌ Unable to change HiPS colormap: ${error.message}`);
    }
  });
}

export function wireHiPSPresetSelector() {
  const select = el("hipsPreset");
  const loadButton = el("btnLoadHiPSPreset");
  const addButton = el("btnAddHiPSPreset");

  if (!select || !loadButton || !addButton) {
    return;
  }

  const getSelectedPreset = () => DEMO_HIPS[select.value];

  loadButton.addEventListener("click", async () => {
    const preset = getSelectedPreset();

    if (!preset) {
      return;
    }

    try {
      await loadHiPS(preset.url);
    } catch (error) {
      console.error(error);
      setStatus(`❌ Unable to load survey: ${error.message}`);
    }
  });

  addButton.addEventListener("click", async () => {
    const preset = getSelectedPreset();

    if (!preset) {
      return;
    }

    try {
      await addHiPS(preset.url);
    } catch (error) {
      console.error(error);
      setStatus(`❌ Unable to add survey: ${error.message}`);
    }
  });
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
  populateHiPSColorMap();
  populateHiPSScaleControls();
  populateHiPSRangeControls();
  populateHiPSPresetControls();
  updateHiPSDisplayVisibility();
  updateHiPSDisplayLayerLabel();
  renderHiPSLayers();
}

function updateHiPSDisplayLayerLabel() {
  const label = el("hipsDisplayLayer");

  if (!label) {
    return;
  }

  const active = state.AstroAPI?.getActiveHiPS?.() ?? null;
  label.textContent = active ? `Editing: ${getHiPSLabel(active)}` : "No layer selected";
}

function updateHiPSDisplayVisibility() {
  const fitsControls = el("hipsFitsControls");

  if (!fitsControls) {
    return;
  }

  const activeFormat = state.AstroAPI?.getActiveHiPS?.()?.format;
  fitsControls.hidden = activeFormat !== "fits";
}

function populateHiPSPresetControls() {
  const select = el("hipsFitsPreset");

  if (!select) {
    return;
  }

  const activeHiPS = state.AstroAPI?.getActiveHiPS?.() ?? null;
  const activeFormat = activeHiPS?.format;
  const stretch = state.AstroAPI?.getActiveHiPSFITSStretch?.() ?? null;
  const isFits = activeFormat === "fits";

  select.disabled = !activeHiPS || !isFits;

  if (!stretch || !isFits) {
    select.value = "default";
    return;
  }

  select.value = findMatchingFITSPreset(stretch);
}

function populateHiPSRangeControls() {
  const select = el("hipsRangeMode");

  if (!select) {
    return;
  }

  const activeHiPS = state.AstroAPI?.getActiveHiPS?.() ?? null;
  const activeFormat = activeHiPS?.format;
  const stretch = state.AstroAPI?.getActiveHiPSFITSStretch?.() ?? null;
  const isFits = activeFormat === "fits";

  select.disabled = !activeHiPS || !isFits;
  select.value = stretch?.rangeMode ?? "robust";
}

function populateHiPSScaleControls() {
  const select = el("hipsScaleFunction");
  const paramInput = el("hipsScaleParam");

  if (!select) {
    return;
  }

  const activeHiPS = state.AstroAPI?.getActiveHiPS?.() ?? null;
  const activeFormat = activeHiPS?.format;
  const stretch = state.AstroAPI?.getActiveHiPSFITSStretch?.() ?? null;
  const isFits = activeFormat === "fits";

  select.disabled = !activeHiPS || !isFits;
  select.value = stretch?.scaleFunction ?? "linear";

  if (paramInput) {
    paramInput.disabled =
      !activeHiPS ||
      !isFits ||
      select.value === "linear" ||
      select.value === "sqrt";
    const scaleParam =
      stretch?.scaleParam ?? getDefaultScaleParam(select.value);
    paramInput.value = String(scaleParam);
  }
}

function findMatchingFITSPreset(stretch) {
  for (const [name, preset] of Object.entries(FITS_PRESETS)) {
    if (
      stretch.rangeMode === preset.rangeMode &&
      stretch.scaleFunction === preset.scaleFunction &&
      Number(stretch.scaleParam) === preset.scaleParam
    ) {
      return name;
    }
  }

  return "custom";
}

function getFITSPresetLabel(presetName) {
  switch (presetName) {
    case "faint":
      return "Faint structures";
    case "contrast":
      return "High contrast";
    case "gamma":
      return "Gamma";
    default:
      return "Default";
  }
}

function getDefaultScaleParam(scaleFunction) {
  switch (scaleFunction) {
    case "log":
      return 100;
    case "asinh":
      return 10;
    case "gamma":
      return 0.5;
    default:
      return 1;
  }
}

function getRangeModeLabel(rangeMode) {
  if (rangeMode === "tile") {
    return "tile min/max";
  }

  if (rangeMode === "hips") {
    return "HiPS data min/max";
  }

  return "robust percentile";
}

function populateHiPSColorMap() {
  const select = el("hipsColorMap");

  if (!select) {
    return;
  }

  const activeColorMap =
    state.AstroAPI?.getActiveHiPS?.()?.colorMap?.name ?? "native";
  const hasActiveHiPS = !!state.AstroAPI?.getActiveHiPS?.();

  select.value = activeColorMap;
  select.disabled = !hasActiveHiPS;
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

  layers.forEach((hips) => {
    const card = document.createElement("div");
    card.className = "hips-layer-card";

    const isActive = hips === active;
    if (isActive) {
      card.classList.add("active");
    }

    const header = document.createElement("div");
    header.className = "hips-layer-header";

    const selectButton = document.createElement("button");
    selectButton.type = "button";
    selectButton.className = "hips-layer-select";
    selectButton.textContent = `${isActive ? "● " : ""}${getHiPSLabel(hips)}`;
    selectButton.title = hips.baseURL;
    selectButton.addEventListener("click", () => {
      state.AstroAPI.setActiveHiPS(hips);
      refreshHiPSUI();
      setStatus(`✅ Active HiPS: ${getHiPSLabel(hips)}`);
    });

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "secondary hips-layer-remove";
    removeButton.textContent = "Remove";
    removeButton.addEventListener("click", () => {
      state.AstroAPI.removeHiPS(hips);
      refreshHiPSUI();
      setStatus(`✅ HiPS removed: ${getHiPSLabel(hips)}`);
    });

    header.append(selectButton, removeButton);

    const meta = document.createElement("div");
    meta.className = "hips-layer-meta";
    meta.textContent = `${hips.format.toUpperCase()} · ${hips.isGalacticHips ? "Galactic" : "Equatorial"}`;
    meta.title = hips.baseURL;

    const opacityRow = document.createElement("div");
    opacityRow.className = "hips-layer-opacity";

    const opacity = document.createElement("input");
    opacity.type = "range";
    opacity.min = "0";
    opacity.max = "1";
    opacity.step = "0.05";
    opacity.value = String(hips.opacity);
    opacity.title = `Opacity ${Math.round(hips.opacity * 100)}%`;

    const opacityValue = document.createElement("span");
    opacityValue.className = "mono hips-layer-opacity-value";
    opacityValue.textContent = `${Math.round(hips.opacity * 100)}%`;

    opacity.addEventListener("input", () => {
      const value = Number(opacity.value);
      state.AstroAPI.setHiPSOpacity(hips, value);
      opacityValue.textContent = `${Math.round(value * 100)}%`;
      opacity.title = `Opacity ${Math.round(value * 100)}%`;
    });

    opacityRow.append(opacity, opacityValue);
    card.append(header, meta, opacityRow);
    container.appendChild(card);
  });
}

function getHiPSLabel(hips) {
  return hips.name || hips.baseURL;
}
