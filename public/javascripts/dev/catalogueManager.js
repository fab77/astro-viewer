// catalogueManager.js
import { el, setStatus } from './ui.js';
import { state, catalogueKey, persistBasic } from './state.js';

const HEX6 = /^#?[0-9a-fA-F]{6}$/;
function sanitizeHex(v) {
  if (!v) return '';
  const s = String(v).trim();
  if (HEX6.test(s)) return s.startsWith('#') ? s : '#' + s;
  return '';
}

export function extractTapMetadataColumnNames(catalogue) {
  // Try common shapes; adjust if your TapMetadataList differs.
  const tml = catalogue?.catalogueProps?.tapMetadataList;
  const names = new Set();

  const add = (x) => { if (x && typeof x === 'string') names.add(x); };

  if (!tml) return [];

  // 1) Array of strings/objects
  if (Array.isArray(tml)) {
    tml.forEach(item => {
      if (typeof item === 'string') add(item);
      else if (item) add(item.name || item.columnName || item.id || item.col || item.label);
    });
  }

  // 2) Common nested arrays
  const arrays = [tml.columns, tml.items, tml.list, tml.metadata, tml.fields, tml.metadataList];
  arrays.forEach(arr => {
    if (Array.isArray(arr)) {
      arr.forEach(item => {
        if (typeof item === 'string') add(item);
        else if (item) add(item.name || item.columnName || item.id || item.col || item.label || item._name);
      });
    }
  });

  return [...names].sort((a, b) => a.localeCompare(b));
}

export function renderCatalogueManager() {
  const table = el('catTable');
  if (!table) return;
  const filterInput = el('catFilter');
  const filter = (filterInput?.value || '').trim().toLowerCase();
  table.innerHTML = "";

  const thead = document.createElement('thead');
  thead.innerHTML = `
      <tr>
        <th style="width:32%;">Name</th>
        <th style="width:18%;">Size by</th>
        <th style="width:18%;">Hue by</th>
        <th style="width:10%;">Visible</th>
        <th style="width:10%;">Status</th>
        <th>Actions</th>
      </tr>`;
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  const rows = state.CAT_LIST
    .map((c, idx) => ({ c, idx, key: catalogueKey(c) }))
    .filter(({ c }) => !filter || (c.name?.toLowerCase().includes(filter) || c.table?.toLowerCase().includes(filter)));

  rows.forEach(({ c, idx, key }) => {
    const vis = state.CAT_VIS.has(key) ? state.CAT_VIS.get(key) : true;
    const columns = extractTapMetadataColumnNames(c);
    const chosen = state.CAT_SIZEBY.get(key) || "";
    const chosenHue = state.CAT_HUEBY.get(key) || "";

    const tr = document.createElement('tr');
    tr.dataset.idx = String(idx);
    tr.innerHTML = `
      <td>
        <div>${c.name || c.table || c.id || "(unnamed)"}${c.rowCount ? ` <span class="hint">(${c.rowCount})</span>` : ""}</div>
        <div class="hint mono">${key}</div>
      </td>

      <td>
        <select class="size-by sel-compact" ${columns.length ? "" : "disabled"}>
          <option value="STANDARD_SIZE">— choose —</option>
          ${columns.map(col => `<option value="${col}" ${col === chosen ? "selected" : ""}>${col}</option>`).join('')}
        </select>
        ${!columns.length ? `<div class="hint">No TAP metadata</div>` : ""}
      </td>

      <td>
        <select class="hue-by sel-compact" ${columns.length ? "" : "disabled"}>
          <option value="STANDARD_SIZE">— choose —</option>
          ${columns.map(col => `<option value="${col}" ${col === chosenHue ? "selected" : ""}>${col}</option>`).join('')}
        </select>
        ${!columns.length ? `<div class="hint">No TAP metadata</div>` : ""}
      </td>

      <td style="text-align:center;">
        <input type="checkbox" class="cat-vis" ${vis ? "checked" : ""} />
      </td>

      <td><span class="tag">${vis ? "visible" : "hidden"}</span></td>
     
      <td>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          <button class="row-show">Load/Show</button>
          <button class="row-del secondary" title="Remove from engine (keep in list)">Delete</button>
          <input type="color" class="row-color" title="Change colour"
               value="${sanitizeHex(state.CAT_COLOR.get(key)) || '#00ffff'}" />
        </div>
      </td>`;
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
}

let wired = false;
export function wireCatalogueManagerControls() {
  if (wired) return; wired = true;

  el('catFilter')?.addEventListener('input', renderCatalogueManager);
  el('btnShowAll')?.addEventListener('click', () => batchSetVisibility(true));
  el('btnHideAll')?.addEventListener('click', () => batchSetVisibility(false));

  el('catTable')?.addEventListener('click', (ev) => {
    const tr = ev.target.closest('tr'); if (!tr) return;
    const idx = Number(tr.dataset.idx);
    const cat = state.CAT_LIST[idx]; if (!cat) return;
    const key = catalogueKey(cat);

    if (ev.target.classList.contains('row-show')) {
      try {
        state.AstroAPI?.showCatalogue?.(cat);
        state.CAT_VIS.set(key, true);

        // re-apply remembered size-by
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
          state.AstroAPI.changeCatalogueColor(cat, sanitizeHex(rememberedColor));
        }

        renderCatalogueManager();
        persistBasic();
        setStatus(`📡 Catalogue loaded: ${cat.name || cat.id || cat.table}`);
      } catch (e) { setStatus("Show error: " + (e.message || e)); }
    }

    if (ev.target.classList.contains('row-del')) {
      try {
        state.AstroAPI?.deleteCatalogue?.(cat);
        state.CAT_VIS.set(key, false);
        renderCatalogueManager();
        persistBasic();
        setStatus(`🗑️ Catalogue removed from engine: ${cat.name || cat.id || cat.table}`);
      } catch (e) { setStatus("Delete error: " + (e.message || e)); }
    }
  });

  el('catTable')?.addEventListener('change', (ev) => {
    const tr = ev.target.closest('tr'); if (!tr) return;
    const idx = Number(tr.dataset.idx);
    const cat = state.CAT_LIST[idx]; if (!cat) return;
    const key = catalogueKey(cat);

    if (ev.target.classList.contains('cat-vis')) {
      const isVisible = !!ev.target.checked;
      try {
        state.AstroAPI?.hideCatalogue?.(cat, isVisible);
        state.CAT_VIS.set(key, isVisible);
        tr.querySelector('.tag').textContent = isVisible ? "visible" : "hidden";
        persistBasic();
        setStatus(`${isVisible ? "👁️ Visible" : "🙈 Hidden"} → ${cat.name || cat.id || cat.table}`);
      } catch (e) { setStatus("Visibility error: " + (e.message || e)); }
      return;
    }

    if (ev.target.classList.contains('size-by')) {
      const column = String(ev.target.value || "");
      if (!column) {
        state.CAT_SIZEBY.delete(key);
        persistBasic();
        setStatus(`Size by cleared for ${cat.name || cat.id || cat.table}`);
        return;
      }
      state.CAT_SIZEBY.set(key, column);
      persistBasic();

      // apply only if visible; otherwise it will apply on next Show
      const isVisible = !!(tr.querySelector('.cat-vis')?.checked);
      if (!isVisible) {
        setStatus(`Saved "Size by: ${column}" (applies when visible).`);
        return;
      }
      if (!state.AstroAPI?.setCatalogueShapeSize) {
        setStatus("setCatalogueShapeSize not available on AstroAPI.");
        return;
      }
      try {
        state.AstroAPI.setCatalogueShapeSize(cat, column);
        setStatus(`🎛️ Size by → ${column} for ${cat.name || cat.id || cat.table}`);
      } catch (e) { setStatus("Size-by error: " + (e.message || e)); }
    }

    if (ev.target.classList.contains('hue-by')) {
      const column = String(ev.target.value || "");
      if (!column) {
        state.CAT_HUEBY.delete(key);
        persistBasic();
        setStatus(`Hue by cleared for ${cat.name || cat.id || cat.table}`);
        return;
      }
      state.CAT_HUEBY.set(key, column);
      persistBasic();

      // apply only if visible; otherwise apply on next Show
      const isVisible = !!(tr.querySelector('.cat-vis')?.checked);
      if (!isVisible) {
        setStatus(`Saved "Hue by: ${column}" (applies when visible).`);
        return;
      }
      if (!state.AstroAPI?.setCatalogueShapeHue) {
        setStatus("setCatalogueShapeHue not available on AstroAPI.");
        return;
      }
      try {
        state.AstroAPI.setCatalogueShapeHue(cat, column);
        setStatus(`🎨 Hue by → ${column} for ${cat.name || cat.id || cat.table}`);
      } catch (e) { setStatus("Hue-by error: " + (e.message || e)); }
    }

    if (ev.target.classList.contains('row-color')) {
      const hex = sanitizeHex(ev.target.value);
      if (!hex) {
        setStatus("Invalid hex colour. Use #RRGGBB.");
        return;
      }
      state.CAT_COLOR.set(key, hex);
      persistBasic();

      // Only apply immediately if visible; otherwise it will apply on next Show
      const isVisible = !!(tr.querySelector('.cat-vis')?.checked);
      if (!isVisible) {
        setStatus(`Saved colour ${hex} (will apply when visible).`);
        return;
      }
      if (!state.AstroAPI?.changeCatalogueColor) {
        setStatus("changeCatalogueColor not available on AstroAPI.");
        return;
      }
      try {
        state.AstroAPI.changeCatalogueColor(cat, hex);
        setStatus(`🎨 Colour → ${hex} for ${cat.name || cat.id || cat.table}`);
      } catch (e) { setStatus("Colour change error: " + (e.message || e)); }
    }
  });
}

function batchSetVisibility(newState) {
  const filterInput = el('catFilter');
  const filter = (filterInput?.value || '').trim().toLowerCase();
  const affected = state.CAT_LIST.filter(c =>
    !filter || (c.name?.toLowerCase().includes(filter) || c.table?.toLowerCase().includes(filter))
  );
  let ok = 0;
  for (const c of affected) {
    const key = catalogueKey(c);
    try {
      state.AstroAPI?.hideCatalogue?.(c, newState);
      state.CAT_VIS.set(key, newState);
      ok++;
    } catch { }
  }
  renderCatalogueManager();
  persistBasic();
  setStatus(`${newState ? "👁️ Shown" : "🙈 Hidden"} ${ok} catalogue(s)${filter ? " (filtered)" : ""}.`);
}
