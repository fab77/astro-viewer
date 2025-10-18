// tap.js
import { el, setStatus } from './ui.js';
import { state, catalogueKey, persistBasic } from './state.js';
import { renderCatalogueManager, wireCatalogueManagerControls } from './catalogueManager.js';
import { renderFootprintManager, wireFootprintManagerControls } from './footprintManager.js';
import { footprintKey } from './footprintManager.js';

export async function loadTapRepo(url) {
  setStatus("Loading TAP…");
  state.TAP = await astroviewer.addTAPRepo(url);

  state.CAT_LIST = state.TAP.catalogueList || state.TAP.cataloguesList || [];
  state.FP_LIST = state.TAP.observationList || state.TAP.observationsList || [];

  // defaults & UI select
  const catSel = el('catalogues');
  if (catSel) {
    catSel.innerHTML = "";
    state.CAT_LIST.forEach((c, i) => {
      const opt = document.createElement('option');
      opt.value = c.name || c.id || c.table || `#${i}`;
      opt.textContent = c.name || c.id || c.table || `Item ${i + 1}`;
      catSel.appendChild(opt);
      const key = catalogueKey(c);
      if (!state.CAT_VIS.has(key)) state.CAT_VIS.set(key, true);
    });
  }

  const fpSel = el('footprints');
  if (fpSel) {
    fpSel.innerHTML = "";
    state.FP_LIST.forEach((f, i) => {
      const opt = document.createElement('option');
      opt.value = f.name || f.id || f.table || `#${i}`;
      opt.textContent = f.name || f.mission || f.survey || f.id || `Footprint ${i + 1}`;
      fpSel.appendChild(opt);
      const k = footprintKey(f);
      if (!state.FP_VIS.has(k)) state.FP_VIS.set(k, true);
    });
  }

  const panel = el('datasetsPanel');
  if (panel) panel.style.display = (state.CAT_LIST.length || state.FP_LIST.length) ? '' : 'none';

  renderCatalogueManager();
  wireCatalogueManagerControls();
  renderFootprintManager();
  wireFootprintManagerControls();
  persistBasic();

  setStatus(`✅ TAP loaded (${state.CAT_LIST.length} catalogues, ${state.FP_LIST.length} footprints).`);
}

export function showFootprint(selVal) {
  const item = state.FP_LIST.find(c => (c.name === selVal) || (String(c.id) === selVal) || (c.table === selVal));
  if (!item) return setStatus("Footprint not found.");
  state.AstroAPI?.showFootprints?.(item);
  setStatus(`Footprint shown: ${item.name || item.id || item.table}`);
}

export function hideFootprints() {
  state.AstroAPI?.hideFootprints?.();
  setStatus("Footprints hidden.");
}
