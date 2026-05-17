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

import { wireHoveredFootprints } from './hoveredFootprints.js';
import { el, setStatus, minimisePanel, restorePanel } from './ui.js';
import { state, loadPersisted, persistBasic } from './state.js';
import { loadHiPS, loadHiPS2 } from './hips.js';
import { loadTapRepo, showFootprint, hideFootprints } from './tap.js';
import { renderCatalogueManager, wireCatalogueManagerControls } from './catalogueManager.js';
import { wireGoto } from './goto.js';
import { wireCoords } from './coords.js';

(function applyFixedProxy() {
  const FIXED_PROXY_BASE = ""; // set if needed
  try {
    if (FIXED_PROXY_BASE) {
      if (astroviewer?.Global) astroviewer.Global.corsProxyUrl = FIXED_PROXY_BASE;
      if (astroviewer?.global) astroviewer.global.corsProxyUrl = FIXED_PROXY_BASE;
      window.corsProxyUrl = FIXED_PROXY_BASE;
    }
  } catch { }
})();

window.addEventListener('load', bootstrap);

async function bootstrap() {
  try {
    loadPersisted();
    
    const canvasEl = document.getElementById("astrocanvas");
    const AC = new astroviewer.AstroViewer(canvasEl);
    window.AstroAPI = state.AstroAPI = AC;

    
    window.TAP = state.TAP;

    // Initialize grid toggle checkboxes from API
    try {
      const healpixChk = el('healpixGridChk');
      const equatChk = el('equatorialGridChk');
      if (healpixChk && typeof AC.isHealpixGridVisible === "function") {
        healpixChk.checked = !!AC.isHealpixGridVisible();
      }
      if (equatChk && typeof AC.isEquatorialGridVisible === "function") {
        equatChk.checked = !!AC.isEquatorialGridVisible();
      }
    } catch { }

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
      defaultHiPS = "https://alasky.cds.unistra.fr/DSS/DSSColor/";
    }
    const hipsInput = el('hipsUrl');
    if (hipsInput) {
      hipsInput.value = defaultHiPS;
    }
    // Load HiPS using resolved URL
    await loadHiPS(defaultHiPS.trim());
    AC.run();


    const canvasEl2 = document.getElementById("astrocanvas2");
    const AC2 = new astroviewer.AstroViewer(canvasEl2);
    window.AstroAPI2 = state.AstroAPI2 = AC2;
    await loadHiPS2(defaultHiPS.trim());
    AC2.run();

    setStatus("Ready ✅ Load a TAP to begin.");
  } catch (e) {
    console.error(e);
    setStatus("Init error: " + (e.message || e));
  }
}
