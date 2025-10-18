import { wireHoveredFootprints } from './hoveredFootprints.js';
import { el, setStatus, minimisePanel, restorePanel } from './ui.js';
import { state, loadPersisted, persistBasic } from './state.js';
import { loadHiPS } from './hips.js';
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

    const AC = new astroviewer.AstroViewer();
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

    wireUI();
    renderCatalogueManager();
    wireCatalogueManagerControls();
    wireGoto();
    wireCoords();
    wireHoveredFootprints();

    setStatus("Ready ✅ Load a TAP to begin.");
  } catch (e) {
    console.error(e);
    setStatus("Init error: " + (e.message || e));
  }
}

function wireUI() {
  el('btnLoadHiPS')?.addEventListener('click', async () => {
    const url = el('hipsUrl').value.trim();
    if (!url) return setStatus("Insert a HiPS URL.");
    try { await loadHiPS(url); persistBasic(); }
    catch (e) { setStatus("HiPS load error: " + (e.message || e)); }
  });

  el('btnLoadTap')?.addEventListener('click', async () => {
    const tapUrl = el('tapUrl').value.trim();
    if (!tapUrl) return setStatus("Insert a TAP URL.");
    el('btnLoadTap').disabled = true;
    try { await loadTapRepo(tapUrl); persistBasic(); }
    catch (e) { setStatus("TAP load error: " + (e.message || e)); }
    finally { el('btnLoadTap').disabled = false; }
  });

  // single-select quick controls
  el('btnShowCat')?.addEventListener('click', () => {
    const selVal = el('catalogues').value;
    const cat = state.CAT_LIST.find(c => (c.name === selVal) || (String(c.id) === selVal) || (c.table === selVal));
    if (!cat) return setStatus("Select a catalogue.");
    try {
      state.AstroAPI?.showCatalogue?.(cat);
      const key = (c => c?.name || String(c?.id) || c?.table || JSON.stringify(c))(cat);
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
    } catch (e) { setStatus("Show error: " + (e.message || e)); }
  });

  el('catVisible')?.addEventListener('change', () => {
    const selVal = el('catalogues').value;
    const cat = state.CAT_LIST.find(c => (c.name === selVal) || (String(c.id) === selVal) || (c.table === selVal));
    if (!cat) return setStatus("Select a catalogue.");
    const key = (c => c?.name || String(c?.id) || c?.table || JSON.stringify(c))(cat);
    const isVisible = el('catVisible').checked;
    try {
      state.AstroAPI?.hideCatalogue?.(cat, isVisible);
      state.CAT_VIS.set(key, isVisible);
      renderCatalogueManager();
      persistBasic();
      setStatus(`${isVisible ? "👁️ Visible" : "🙈 Hidden"} → ${cat.name || cat.id || cat.table}`);
    } catch (e) { setStatus("Visibility error: " + (e.message || e)); }
  });

  el('btnDeleteCat')?.addEventListener('click', () => {
    const selVal = el('catalogues').value;
    const cat = state.CAT_LIST.find(c => (c.name === selVal) || (String(c.id) === selVal) || (c.table === selVal));
    if (!cat) return setStatus("Select a catalogue.");
    const key = (c => c?.name || String(c?.id) || c?.table || JSON.stringify(c))(cat);
    try {
      state.AstroAPI?.deleteCatalogue?.(cat);
      state.CAT_VIS.set(key, false);
      renderCatalogueManager();
      persistBasic();
      setStatus(`🗑️ Catalogue removed from engine: ${cat.name || cat.id || cat.table}`);
    } catch (e) { setStatus("Delete error: " + (e.message || e)); }
  });

  // footprints
  el('btnShowFp')?.addEventListener('click', () => showFootprint(el('footprints').value));
  el('btnHideFp')?.addEventListener('click', hideFootprints);

  // camera + minimise
  el('btnCamInfo')?.addEventListener('click', () => {
    const p = state.AstroAPI?.camera?.getCameraPosition?.();
    if (!p) return setStatus("Camera API unavailable.");
    setStatus(`Camera @ [${p.map(n => n.toFixed(3)).join(", ")}]`);
  });
  el('btnTogglePanel')?.addEventListener('click', minimisePanel);
  el('restoreBtn')?.addEventListener('click', restorePanel);

  // inside sphere toggle
  el('insideSphereChk')?.addEventListener('change', () => {
    try {
      state.AstroAPI?.toggleInsideSphere?.();
    } finally {
      // store preference regardless of API success
      persistBasic();
    }
  });

  // grid toggles
  el('healpixGridChk')?.addEventListener('change', (ev) => {
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

  el('equatorialGridChk')?.addEventListener('change', (ev) => {
    try {
      state.AstroAPI?.toggleEquatorialGrid?.();
      // (optional) re-sync from getter if needed:
      // ev.target.checked = !!state.AstroAPI?.isEquatorialGridVisible?.();
    } catch (e) {
      ev.target.checked = !ev.target.checked;
    }
  });
}
