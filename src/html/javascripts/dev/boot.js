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

import { wireHoveredMetadata } from "./hoveredMetadata.js";
import { wireAstronomyOverlayDemos } from "./astronomyOverlays.js";
import {
  el,
  setStatus,
  minimisePanel,
  restorePanel,
  wireDevTabs,
} from "./ui.js";
import { state, loadPersisted, persistBasic } from "./state.js";
import { loadHiPS, wireHiPSControls } from "./hips.js";
import { loadMeshHiPS } from "./meships.js";
import { addWMTSRasterOverlay, addXYZRasterOverlay, loadWMTS, loadXYZ } from "./xyz.js";
import { loadTapRepo, showFootprint, hideFootprints } from "./tap.js";
import {
  renderCatalogueManager,
  wireCatalogueManagerControls,
} from "./catalogueManager.js";
import {
  renderFootprintManager,
  wireFootprintManagerControls,
} from "./footprintManager.js";
import { wireGoto } from "./goto.js";
import { wireCoords } from "./coords.js";
import { wireXYZDiagnostics, wireHiPSDiagnostics, wireMeshHiPSDiagnostics } from "./diagnostics.js";
import {
  applyWMTSPreset,
  loadWMTSCapabilities,
  WMTS_PRESETS,
} from "./wmtsCapabilities.js";
import { wireImporterControls } from "./importer.js";
import { wireSatelliteFootprintDemo } from "./satelliteFootprintDemo.js";
import {
  renderEarthGeoJSONManager,
  wireEarthGeoJSONManagerControls,
} from "./earthGeoJSONManager.js";

(function applyFixedProxy() {
  const FIXED_PROXY_BASE = ""; // set if needed
  try {
    if (FIXED_PROXY_BASE) {
      if (astroviewer?.Global)
        astroviewer.Global.corsProxyUrl = FIXED_PROXY_BASE;
      if (astroviewer?.global)
        astroviewer.global.corsProxyUrl = FIXED_PROXY_BASE;
      window.corsProxyUrl = FIXED_PROXY_BASE;
    }
  } catch {}
})();

window.addEventListener("load", bootstrap);

const DEFAULT_ASTRONOMY_HIPS = "https://alasky.cds.unistra.fr/DSS/DSSColor/";

const DEFAULT_EARTH_PRESET = "esriWorldImagery";

const XYZ_PRESETS = {
  osm: {
    label: "OpenStreetMap",
    type: "xyz",
    urlTemplate: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    minZoom: 0,
    maxZoom: 19,
  },
  openTopoMap: {
    label: "OpenTopoMap",
    type: "xyz",
    urlTemplate: "https://a.tile.opentopomap.org/{z}/{x}/{y}.png",
    minZoom: 0,
    maxZoom: 17,
  },
};


const DEFAULT_MESH_HIPS = "/meships-local/mhips-moon/";

const domainInitializationState = {
  astronomy: false,
  earth: false,
  mesh: false,
};

function setLonLatGridVisible(visible) {
  const isVisible = !!state.AstroAPI?.isLonLatGridVisible?.();

  if (isVisible !== visible && state.AstroAPI?.toggleLonLatGrid) {
    state.AstroAPI.toggleLonLatGrid();
  }

  const checkbox = el("lonLatGridChk");

  if (checkbox) {
    checkbox.checked = visible;
  }
}

async function activateDemoDomain(domain) {
  try {
    if (domain === "astronomy") {
      state.AstroAPI?.setActiveDomain?.("astronomy");
      if (
        state.AstroAPI?.isLonLatGridVisible?.() &&
        state.AstroAPI?.toggleLonLatGrid
      ) {
        state.AstroAPI.toggleLonLatGrid();
      }

      const lonLatChk = el("lonLatGridChk");
      if (lonLatChk) {
        lonLatChk.checked = false;
      }

      setStatus("Astronomy ready. Load a layer or add surveys to the stack.");
      return;
    }

    if (domain === "earth") {
      state.AstroAPI?.setActiveDomain?.("earth");

      if (!domainInitializationState.earth) {
        applyWMTSPreset(DEFAULT_EARTH_PRESET);

        const preset = WMTS_PRESETS[DEFAULT_EARTH_PRESET];

        loadWMTS({
          baseUrl: preset.baseUrl,
          urlTemplate: preset.urlTemplate || undefined,
          layer: preset.preferredLayer,
          tileMatrixSet: preset.tileMatrixSet,
          style: preset.style,
          format: preset.format,
          requestEncoding: preset.requestEncoding,
          dimensions: {},
          minZoom: Number(el("xyzMinZoom")?.value ?? 0),
          maxZoom: Number(el("xyzMaxZoom")?.value ?? 8),
          segmentsPerSide: Number(el("xyzSegments")?.value ?? 48),
          maxCachedTiles: Number(el("xyzMaxCachedTiles")?.value ?? 384),
          maxConcurrentRequests: Number(
            el("xyzMaxConcurrentRequests")?.value ?? 4,
          ),
        });

        // Earth demo starts with all grids disabled.
        if (
          state.AstroAPI?.isHealpixGridVisible?.() &&
          state.AstroAPI?.toggleHealpixGrid
        ) {
          state.AstroAPI.toggleHealpixGrid();
        }

        if (
          state.AstroAPI?.isEquatorialGridVisible?.() &&
          state.AstroAPI?.toggleEquatorialGrid
        ) {
          state.AstroAPI.toggleEquatorialGrid();
        }

        setLonLatGridVisible(false);

        const healpixChk = el("healpixGridChk");
        if (healpixChk) {
          healpixChk.checked = false;
        }

        const equatorialChk = el("equatorialGridChk");
        if (equatorialChk) {
          equatorialChk.checked = false;
        }

        domainInitializationState.earth = true;
        setStatus("Earth Observation: Esri World Imagery loaded.");
        return;
      }

      setStatus("Earth Observation ready.");
      return;
    }

    if (domain === "mesh") {
      state.AstroAPI?.setActiveDomain?.("mesh");

      if (!domainInitializationState.mesh) {
        const meshUrl = el("meshHipsUrl");

        if (meshUrl) {
          meshUrl.value = DEFAULT_MESH_HIPS;
        }

        const orderRaw = el("meshHipsOrder")?.value.trim() ?? "";

        await loadMeshHiPS(DEFAULT_MESH_HIPS, {
          order: orderRaw === "" ? undefined : Number(orderRaw),

          maxCachedTiles: Number(el("meshHipsMaxCachedTiles")?.value ?? 384),

          color: parseHexColor(el("meshHipsColor")?.value ?? "#b8dbff"),

          wireframe: !!el("meshHipsWireframe")?.checked,
        });

        domainInitializationState.mesh = true;
        setStatus("3D / Mesh: Moon MeshHiPS loaded.");
        return;
      }

      setStatus("3D / Mesh ready.");
    }
  } catch (error) {
    console.error(error);

    setStatus(`Unable to activate ${domain}: ${error.message || error}`);
  }
}

async function bootstrap() {
  try {
    loadPersisted();

    const canvasEl = document.getElementById("astrocanvas");
    const AC = new astroviewer.AstroViewer(canvasEl);
    window.AstroAPI = state.AstroAPI = AC;
    window.TAP = state.TAP;

    // Initialize grid toggle checkboxes from API
    try {
      const healpixChk = el("healpixGridChk");
      const equatChk = el("equatorialGridChk");
      const lonLatChk = el("lonLatGridChk");

      const lockEastWestChk = el("lockEastWestRotationChk");
      const lockNorthSouthChk = el("lockNorthSouthRotationChk");
      const keepNorthUpChk = el("keepCameraNorthUpChk");
      const viewfinderChk = el("viewfinderChk");
      const xyzConcurrentInput = el("xyzMaxConcurrentRequests");
      if (healpixChk && typeof AC.isHealpixGridVisible === "function") {
        healpixChk.checked = !!AC.isHealpixGridVisible();
      }
      if (equatChk && typeof AC.isEquatorialGridVisible === "function") {
        equatChk.checked = !!AC.isEquatorialGridVisible();
      }
      if (lonLatChk && typeof AC.isLonLatGridVisible === "function") {
        lonLatChk.checked = !!AC.isLonLatGridVisible();
      }
      if (
        lockEastWestChk &&
        typeof AC.isEastWestRotationLocked === "function"
      ) {
        lockEastWestChk.checked = !!AC.isEastWestRotationLocked();
      }
      if (
        lockNorthSouthChk &&
        typeof AC.isNorthSouthRotationLocked === "function"
      ) {
        lockNorthSouthChk.checked = !!AC.isNorthSouthRotationLocked();
      }
      if (keepNorthUpChk && typeof AC.isKeepCameraNorthUp === "function") {
        keepNorthUpChk.checked = !!AC.isKeepCameraNorthUp();
      }
      if (viewfinderChk && typeof AC.isViewfinderVisible === "function") {
        viewfinderChk.checked = !!AC.isViewfinderVisible();
      }
      if (
        xyzConcurrentInput &&
        typeof AC.getXYZMaxConcurrentRequests === "function"
      ) {
        xyzConcurrentInput.value = String(AC.getXYZMaxConcurrentRequests());
      }
    } catch {}

    // Try to get the default HiPS URL from the AstroViewer API
    // Determine the default HiPS URL (try AstroViewer, else fallback)
    let defaultHiPS = "";
    try {
      if (typeof AC.getDefaultHiPSURL === "function") {
        defaultHiPS = AC.getDefaultHiPSURL() || "";
      }
    } catch {
      // ignore, fallback handled below
    }
    // Fallback if AstroViewer didn’t return a valid URL
    if (!defaultHiPS) {
      defaultHiPS = DEFAULT_ASTRONOMY_HIPS;
    }
    const hipsInput = el("hipsUrl");
    if (hipsInput) {
      hipsInput.value = defaultHiPS;
    }
    const wmtsBaseUrl = el("wmtsBaseUrl");
    const wmtsLayer = el("wmtsLayer");
    const wmtsTileMatrixSet = el("wmtsTileMatrixSet");
    const wmtsStyle = el("wmtsStyle");
    const wmtsTime = el("wmtsTime");
    const wmtsFormat = el("wmtsFormat");
    const wmtsDimensions = el("wmtsDimensions");
    const wmtsEncoding = el("wmtsEncoding");
    const wmtsUrlTemplate = el("wmtsUrlTemplate");
    if (wmtsBaseUrl) {
      wmtsBaseUrl.value = "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/";
    }
    const wmtsCapabilitiesUrl = el("wmtsCapabilitiesUrl");
    if (wmtsCapabilitiesUrl) {
      wmtsCapabilitiesUrl.value = WMTS_PRESETS.gibsBlueMarble.capabilitiesUrl;
    }
    if (wmtsLayer) {
      wmtsLayer.value = "BlueMarble_ShadedRelief_Bathymetry";
    }
    if (wmtsTileMatrixSet) {
      wmtsTileMatrixSet.value = "GoogleMapsCompatible_Level8";
    }
    if (wmtsStyle) {
      wmtsStyle.value = "default";
    }
    if (wmtsTime) {
      wmtsTime.value = "";
    }
    if (wmtsFormat) {
      wmtsFormat.value = "image/jpeg";
    }
    if (wmtsDimensions) {
      wmtsDimensions.value = "{}";
    }
    if (wmtsEncoding) {
      wmtsEncoding.value = "rest";
    }
    if (wmtsUrlTemplate) {
      wmtsUrlTemplate.value =
        "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/{Layer}/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.{TileFormatExtension}";
    }
    const xyzMaxZoomInput = el("xyzMaxZoom");
    if (xyzMaxZoomInput) {
      xyzMaxZoomInput.value = "8";
    }
    
    // Load the default Astronomy HiPS as the initial base layer.
    await loadHiPS(defaultHiPS.trim());
    domainInitializationState.astronomy = true;
    AC.run();

    wireDevTabs(activateDemoDomain);
    wireUI();

    renderCatalogueManager();
    wireCatalogueManagerControls();

    renderFootprintManager();
    wireFootprintManagerControls();

    renderEarthGeoJSONManager();
    wireEarthGeoJSONManagerControls();

    wireImporterControls();
    wireSatelliteFootprintDemo();

    wireGoto();
    wireCoords();

    wireAstronomyOverlayDemos();
    wireHoveredMetadata();

    wireXYZDiagnostics();
    wireHiPSDiagnostics();
    wireMeshHiPSDiagnostics();

    setStatus("App Ready - Panel loaded ✅");
  } catch (e) {
    console.error(e);
    setStatus("Init error: " + (e.message || e));
  }
}

function getEarthMapPreset(presetKey) {
  const xyzPreset = XYZ_PRESETS[presetKey];
  if (xyzPreset) {
    return xyzPreset;
  }

  const wmtsPreset = WMTS_PRESETS[presetKey];
  if (!wmtsPreset) {
    return null;
  }

  return {
    ...wmtsPreset,
    type: "wmts",
  };
}

function loadEarthMapPreset(presetKey) {
  const preset = getEarthMapPreset(presetKey);
  if (!preset) {
    throw new Error(`Unknown Earth map preset: ${presetKey}`);
  }

  const commonOptions = {
    minZoom: preset.minZoom ?? Number(el("xyzMinZoom")?.value ?? 0),
    maxZoom: preset.maxZoom ?? Number(el("xyzMaxZoom")?.value ?? 8),
    segmentsPerSide: Number(el("xyzSegments")?.value ?? 48),
    maxCachedTiles: Number(el("xyzMaxCachedTiles")?.value ?? 384),
    maxConcurrentRequests: Number(el("xyzMaxConcurrentRequests")?.value ?? 4),
  };

  if (preset.type === "xyz") {
    loadXYZ(preset.urlTemplate, commonOptions);
    return;
  }

  applyWMTSPreset(presetKey);
  loadWMTS({
    baseUrl: preset.baseUrl,
    urlTemplate: preset.urlTemplate || undefined,
    layer: preset.preferredLayer,
    tileMatrixSet: preset.tileMatrixSet,
    style: preset.style,
    format: preset.format,
    requestEncoding: preset.requestEncoding,
    dimensions: {},
    ...commonOptions,
  });
}

function addEarthRasterOverlayPreset(presetKey) {
  const preset = getEarthMapPreset(presetKey);
  if (!preset) {
    throw new Error(`Unknown Earth raster overlay preset: ${presetKey}`);
  }

  const commonOptions = {
    minZoom: preset.minZoom ?? Number(el("xyzMinZoom")?.value ?? 0),
    maxZoom: preset.maxZoom ?? Number(el("xyzMaxZoom")?.value ?? 8),
    segmentsPerSide: Number(el("xyzSegments")?.value ?? 48),
    maxCachedTiles: Number(el("xyzMaxCachedTiles")?.value ?? 384),
  };

  if (preset.type === "xyz") {
    addXYZRasterOverlay(preset.urlTemplate, {
      name: preset.label,
      ...commonOptions,
    });
  } else {
    addWMTSRasterOverlay({
      baseUrl: preset.baseUrl,
      urlTemplate: preset.urlTemplate || undefined,
      layer: preset.preferredLayer,
      tileMatrixSet: preset.tileMatrixSet,
      style: preset.style,
      format: preset.format,
      requestEncoding: preset.requestEncoding,
      dimensions: {},
      ...commonOptions,
    });
  }

  renderEarthRasterOverlays();
}

function renderEarthRasterOverlays() {
  const container = el("earthRasterOverlays");
  if (!container) return;

  const overlays = state.AstroAPI?.getEarthRasterOverlays?.() ?? [];
  container.replaceChildren();

  const removeAllButton = el("btnRemoveAllEarthRasterOverlays");
  if (removeAllButton) removeAllButton.disabled = overlays.length === 0;

  if (overlays.length === 0) {
    const empty = document.createElement("div");
    empty.className = "hint";
    empty.textContent = "No raster overlays.";
    container.appendChild(empty);
    return;
  }

  for (const overlay of overlays) {
    const card = document.createElement("div");
    card.className = "earth-raster-card";

    const header = document.createElement("div");
    header.className = "earth-raster-header";

    const visible = document.createElement("input");
    visible.type = "checkbox";
    visible.checked = overlay.visible;
    visible.title = "Visible";
    visible.addEventListener("change", () => {
      state.AstroAPI.setEarthRasterOverlayVisible(overlay.id, visible.checked);
    });

    const name = document.createElement("strong");
    name.className = "earth-raster-name";
    name.textContent = overlay.name;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "secondary";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => {
      state.AstroAPI.removeEarthRasterOverlay(overlay.id);
      renderEarthRasterOverlays();
    });

    header.append(visible, name, remove);

    const meta = document.createElement("div");
    meta.className = "earth-raster-meta";
    meta.textContent = overlay.sourceType.toUpperCase();

    const opacityRow = document.createElement("div");
    opacityRow.className = "earth-raster-opacity";

    const opacity = document.createElement("input");
    opacity.type = "range";
    opacity.min = "0";
    opacity.max = "1";
    opacity.step = "0.05";
    opacity.value = String(overlay.opacity);

    const opacityValue = document.createElement("span");
    opacityValue.className = "earth-raster-opacity-value mono";
    opacityValue.textContent = `${Math.round(overlay.opacity * 100)}%`;

    opacity.addEventListener("input", () => {
      const value = Number(opacity.value);
      state.AstroAPI.setEarthRasterOverlayOpacity(overlay.id, value);
      opacityValue.textContent = `${Math.round(value * 100)}%`;
    });

    opacityRow.append(opacity, opacityValue);
    card.append(header, meta, opacityRow);
    container.appendChild(card);
  }
}

function showEarthMapMetadata(presetKey) {
  const preset = getEarthMapPreset(presetKey);
  if (!preset) {
    return;
  }

  const title = el("earthMapMetadataTitle");
  const body = el("earthMapMetadataBody");
  const dialog = el("earthMapMetadataDialog");
  if (!title || !body || !dialog) {
    return;
  }

  title.textContent = preset.label;

  const rows = preset.type === "xyz"
    ? [
        ["Protocol", "XYZ"],
        ["URL template", preset.urlTemplate],
        ["Zoom", `${preset.minZoom}-${preset.maxZoom}`],
      ]
    : [
        ["Protocol", "WMTS"],
        ["Layer", preset.preferredLayer],
        ["TileMatrixSet", preset.tileMatrixSet],
        ["Style", preset.style],
        ["Format", preset.format],
        ["Encoding", preset.requestEncoding.toUpperCase()],
        ["Zoom", `${preset.minZoom}-${preset.maxZoom}`],
        ["Capabilities", preset.capabilitiesUrl],
      ];

  body.replaceChildren();
  for (const [label, value] of rows) {
    const labelEl = document.createElement("div");
    labelEl.className = "metadata-label";
    labelEl.textContent = label;

    const valueEl = document.createElement("div");
    valueEl.className = "metadata-value mono";
    valueEl.textContent = value || "—";

    body.append(labelEl, valueEl);
  }

  dialog.showModal();
}

function wireUI() {
  wireHiPSControls();

  el("btnLoadEarthMap")?.addEventListener("click", () => {
    const presetKey = el("earthMapPreset")?.value;
    if (!presetKey) return;

    const lonLatGridWanted = !!el("lonLatGridChk")?.checked;
    try {
      loadEarthMapPreset(presetKey);
      setLonLatGridVisible(lonLatGridWanted);
    } catch (e) {
      setStatus("Earth map load error: " + (e.message || e));
    }
  });

  el("btnEarthMapMetadata")?.addEventListener("click", () => {
    const presetKey = el("earthMapPreset")?.value;
    if (presetKey) showEarthMapMetadata(presetKey);
  });

  el("btnAddEarthRasterOverlay")?.addEventListener("click", () => {
    const presetKey = el("earthRasterOverlayPreset")?.value;
    if (!presetKey) return;

    try {
      addEarthRasterOverlayPreset(presetKey);
      setStatus("Earth raster overlay added.");
    } catch (e) {
      setStatus("Earth raster overlay error: " + (e.message || e));
    }
  });

  el("btnRemoveAllEarthRasterOverlays")?.addEventListener("click", () => {
    state.AstroAPI?.removeAllEarthRasterOverlays?.();
    renderEarthRasterOverlays();
    setStatus("Earth raster overlays removed.");
  });

  renderEarthRasterOverlays();

  el("btnCloseEarthMapMetadata")?.addEventListener("click", () => {
    el("earthMapMetadataDialog")?.close();
  });

  el("btnLoadHiPS")?.addEventListener("click", async () => {
    const url = el("hipsUrl").value.trim();
    if (!url) return setStatus("Insert a HiPS URL.");

    try {
      await loadHiPS(url);
      persistBasic();
    } catch (e) {
      setStatus("HiPS load error: " + (e.message || e));
    }
  });

  el("btnLoadMeshHiPS")?.addEventListener("click", async () => {
    const url = el("meshHipsUrl").value.trim();
    const orderRaw = el("meshHipsOrder").value.trim();
    const maxCachedTiles = Number(el("meshHipsMaxCachedTiles").value);
    const color = parseHexColor(el("meshHipsColor").value);
    const wireframe = !!el("meshHipsWireframe").checked;
    const order = orderRaw === "" ? undefined : Number(orderRaw);

    if (!url) return setStatus("Insert a MeshHiPS URL.");
    if (order !== undefined && (!Number.isInteger(order) || order < 0))
      return setStatus("Insert a valid MeshHiPS order.");
    if (!Number.isFinite(maxCachedTiles) || maxCachedTiles < 12)
      return setStatus("Insert a valid MeshHiPS cache size.");

    try {
      await loadMeshHiPS(url, { order, maxCachedTiles, color, wireframe });
    } catch (e) {
      setStatus("MeshHiPS load error: " + (e.message || e));
    }
  });

  el("btnLoadXYZ")?.addEventListener("click", () => {
    const urlTemplate = el("xyzUrlTemplate").value.trim();
    const minZoom = Number(el("xyzMinZoom").value);
    const maxZoom = Number(el("xyzMaxZoom").value);
    const segmentsPerSide = Number(el("xyzSegments").value);
    const maxCachedTiles = Number(el("xyzMaxCachedTiles").value);
    const maxConcurrentRequests = Number(el("xyzMaxConcurrentRequests").value);

    if (!urlTemplate) return setStatus("Insert an XYZ URL template.");
    if (!Number.isFinite(minZoom) || minZoom < 0)
      return setStatus("Insert a valid XYZ min zoom.");
    if (!Number.isFinite(maxZoom) || maxZoom < 0)
      return setStatus("Insert a valid XYZ max zoom.");
    if (maxZoom < minZoom)
      return setStatus(
        "XYZ max zoom must be greater than or equal to min zoom.",
      );
    if (!Number.isFinite(segmentsPerSide) || segmentsPerSide < 2)
      return setStatus("Insert a valid segment count.");
    if (!Number.isFinite(maxCachedTiles) || maxCachedTiles < 32)
      return setStatus("Insert a valid XYZ max cached tiles value.");
    if (!Number.isFinite(maxConcurrentRequests) || maxConcurrentRequests < 1)
      return setStatus("Insert a valid XYZ max concurrent requests value.");

    const lonLatGridWanted = !!el("lonLatGridChk")?.checked;

    try {
      loadXYZ(urlTemplate, {
        minZoom,
        maxZoom,
        segmentsPerSide,
        maxCachedTiles,
        maxConcurrentRequests,
      });

      setLonLatGridVisible(lonLatGridWanted);
    } catch (e) {
      setStatus("XYZ load error: " + (e.message || e));
    }
  });

  el("btnLoadWMTS")?.addEventListener("click", () => {
    const baseUrl = el("wmtsBaseUrl").value.trim();
    const urlTemplate = el("wmtsUrlTemplate").value.trim();
    const layer = el("wmtsLayer").value.trim();
    const tileMatrixSet = el("wmtsTileMatrixSet").value.trim();
    const style = el("wmtsStyle").value.trim();
    const time = el("wmtsTime").value.trim();
    const format = el("wmtsFormat").value.trim();
    const requestEncoding = el("wmtsEncoding").value;
    const dimensionsRaw = el("wmtsDimensions").value.trim();
    const minZoom = Number(el("xyzMinZoom").value);
    const maxZoom = Number(el("xyzMaxZoom").value);
    const segmentsPerSide = Number(el("xyzSegments").value);
    const maxCachedTiles = Number(el("xyzMaxCachedTiles").value);
    const maxConcurrentRequests = Number(el("xyzMaxConcurrentRequests").value);

    if (!baseUrl) return setStatus("Insert a WMTS base URL.");
    if (!layer) return setStatus("Insert a WMTS layer.");
    if (!tileMatrixSet) return setStatus("Insert a WMTS tile matrix set.");
    if (requestEncoding === "rest" && !urlTemplate)
      return setStatus("Insert a WMTS REST URL template.");

    let dimensions = {};
    if (dimensionsRaw) {
      try {
        dimensions = JSON.parse(dimensionsRaw);
      } catch {
        return setStatus("WMTS dimensions must be valid JSON.");
      }
    }

    const lonLatGridWanted = !!el("lonLatGridChk")?.checked;

    try {
      loadWMTS({
        baseUrl,
        urlTemplate: urlTemplate || undefined,
        layer,
        tileMatrixSet,
        style: style || undefined,
        time,
        format: format || undefined,
        requestEncoding,
        dimensions,
        matrixLabels: state.WMTS_CAPABILITIES?.matrixLabels,
        minZoom,
        maxZoom,
        segmentsPerSide,
        maxCachedTiles,
        maxConcurrentRequests,
      });

      setLonLatGridVisible(lonLatGridWanted);
    } catch (e) {
      setStatus("WMTS load error: " + (e.message || e));
    }
  });

  el("wmtsPreset")?.addEventListener("change", () => {
    applyWMTSPreset(el("wmtsPreset").value);
  });

  el("btnLoadWMTSCapabilities")?.addEventListener("click", async () => {
    const capabilitiesUrl = el("wmtsCapabilitiesUrl").value.trim();
    const preferredLayer = el("wmtsLayer").value.trim();
    if (!capabilitiesUrl) return setStatus("Insert a WMTS capabilities URL.");

    try {
      await loadWMTSCapabilities(capabilitiesUrl, preferredLayer);
    } catch (e) {
      setStatus("WMTS capabilities error: " + (e.message || e));
    }
  });

  el("btnLoadTap")?.addEventListener("click", async () => {
    const tapUrl = el("tapUrl").value.trim();
    if (!tapUrl) return setStatus("Insert a TAP URL.");
    el("btnLoadTap").disabled = true;
    try {
      await loadTapRepo(tapUrl);
      persistBasic();
    } catch (e) {
      setStatus("TAP load error: " + (e.message || e));
    } finally {
      el("btnLoadTap").disabled = false;
    }
  });

  // single-select quick controls
  el("btnShowCat")?.addEventListener("click", () => {
    const selVal = el("catalogues").value;
    const cat = state.CAT_LIST.find(
      (c) => c.name === selVal || String(c.id) === selVal || c.table === selVal,
    );
    if (!cat) return setStatus("Select a catalogue.");
    try {
      state.AstroAPI?.showCatalogue?.(cat);
      const key = ((c) =>
        c?.name || String(c?.id) || c?.table || JSON.stringify(c))(cat);
      state.CAT_VIS.set(key, true);

      const remembered = state.CAT_SIZEBY.get(key);
      if (remembered && state.AstroAPI?.setCatalogueShapeSize) {
        state.AstroAPI.setCatalogueShapeSize(cat, remembered);
      }

      const rememberedHue = state.CAT_HUEBY.get(key);
      if (rememberedHue && state.AstroAPI?.setCatalogueShapeHue) {
        state.AstroAPI.setCatalogueShapeHue(cat, rememberedHue);
      }

      const rememberedColor = state.CAT_COLOR.get(key);
      if (rememberedColor && state.AstroAPI?.changeCatalogueColor) {
        state.AstroAPI.changeCatalogueColor(cat, rememberedColor);
      }

      renderCatalogueManager();
      persistBasic();
      setStatus(`📡 Catalogue loaded: ${cat.name || cat.id || cat.table}`);
    } catch (e) {
      setStatus("Show error: " + (e.message || e));
    }
  });

  el("catVisible")?.addEventListener("change", () => {
    const selVal = el("catalogues").value;
    const cat = state.CAT_LIST.find(
      (c) => c.name === selVal || String(c.id) === selVal || c.table === selVal,
    );
    if (!cat) return setStatus("Select a catalogue.");
    const key = ((c) =>
      c?.name || String(c?.id) || c?.table || JSON.stringify(c))(cat);
    const isVisible = el("catVisible").checked;
    try {
      state.AstroAPI?.hideCatalogue?.(cat, isVisible);
      state.CAT_VIS.set(key, isVisible);
      renderCatalogueManager();
      persistBasic();
      setStatus(
        `${isVisible ? "👁️ Visible" : "🙈 Hidden"} → ${cat.name || cat.id || cat.table}`,
      );
    } catch (e) {
      setStatus("Visibility error: " + (e.message || e));
    }
  });

  // camera + minimise
  el("btnCamInfo")?.addEventListener("click", () => {
    const p = state.AstroAPI?.camera?.getCameraPosition?.();
    if (!p) return setStatus("Camera API unavailable.");
    setStatus(`Camera @ [${p.map((n) => n.toFixed(3)).join(", ")}]`);
  });
  el("btnTogglePanel")?.addEventListener("click", minimisePanel);
  el("restoreBtn")?.addEventListener("click", restorePanel);

  // inside sphere toggle
  el("insideSphereChk")?.addEventListener("change", () => {
    try {
      state.AstroAPI?.toggleInsideSphere?.();
    } finally {
      // store preference regardless of API success
      persistBasic();
    }
  });

  el("viewfinderChk")?.addEventListener("change", (ev) => {
    try {
      state.AstroAPI?.setViewfinderVisible?.(!!ev.target.checked);
      ev.target.checked = !!state.AstroAPI?.isViewfinderVisible?.();
    } catch (e) {
      ev.target.checked = !ev.target.checked;
    }
  });

  el("lockEastWestRotationChk")?.addEventListener("change", (ev) => {
    try {
      state.AstroAPI?.setEastWestRotationLocked?.(!!ev.target.checked);
      ev.target.checked = !!state.AstroAPI?.isEastWestRotationLocked?.();
    } catch (e) {
      ev.target.checked = !ev.target.checked;
    }
  });

  el("lockNorthSouthRotationChk")?.addEventListener("change", (ev) => {
    try {
      state.AstroAPI?.setNorthSouthRotationLocked?.(!!ev.target.checked);
      ev.target.checked = !!state.AstroAPI?.isNorthSouthRotationLocked?.();
    } catch (e) {
      ev.target.checked = !ev.target.checked;
    }
  });

  el("btnResetAxesOrientation")?.addEventListener("click", () => {
    state.AstroAPI?.resetAxesOrientation?.();
  });

  el("keepCameraNorthUpChk")?.addEventListener("change", (ev) => {
    try {
      state.AstroAPI?.setKeepCameraNorthUp?.(!!ev.target.checked);
      ev.target.checked = !!state.AstroAPI?.isKeepCameraNorthUp?.();
    } catch (e) {
      ev.target.checked = !ev.target.checked;
    }
  });

  // grid toggles
  el("healpixGridChk")?.addEventListener("change", (ev) => {
    try {
      state.AstroAPI?.toggleHealpixGrid?.();
      // (optional) if your API exposes getters that reflect current state immediately,
      // you could re-sync the checkbox, e.g.:
      // ev.target.checked = !!state.AstroAPI?.isHealpixGridVisible?.();
    } catch (e) {
      // revert UI on error
      ev.target.checked = !ev.target.checked;
    }
  });

  el("equatorialGridChk")?.addEventListener("change", (ev) => {
    try {
      state.AstroAPI?.toggleEquatorialGrid?.();
      // (optional) re-sync from getter if needed:
      // ev.target.checked = !!state.AstroAPI?.isEquatorialGridVisible?.();
    } catch (e) {
      ev.target.checked = !ev.target.checked;
    }
  });

  el("lonLatGridChk")?.addEventListener("change", (ev) => {
    try {
      state.AstroAPI?.toggleLonLatGrid?.();
      ev.target.checked = !!state.AstroAPI?.isLonLatGridVisible?.();
    } catch (e) {
      ev.target.checked = !ev.target.checked;
    }
  });
}

function parseHexColor(hex) {
  const normalized = String(hex || "#b8dbff")
    .trim()
    .replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return [0.72, 0.86, 1.0, 1.0];
  const value = Number.parseInt(normalized, 16);
  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
    1.0,
  ];
}
