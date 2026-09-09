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
  const metadataManager = catalogue?.metadataManager;
  const names = new Set();

  const add = (x) => { if (x && typeof x === 'string') names.add(x); };

  const addItems = (items) => {
    if (Array.isArray(items)) {
      items.forEach(item => {
      if (typeof item === 'string') add(item);
      else if (item) add(item.name || item.columnName || item.id || item.col || item.label);
      });
    }
  };

  addItems(metadataManager?.columns);
  addItems(metadataManager?.shapeColumnList);
  addItems(metadataManager?.hueColumnList);
  addItems(tml);

  // 2) Common nested arrays
  const arrays = [
    tml?.columns,
    tml?.items,
    tml?.list,
    tml?.metadata,
    tml?.fields,
    tml?.metadataList,
  ];
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

function extractNumericMetadataColumnNames(catalogue) {
  const metadataManager = catalogue?.metadataManager;
  const names = new Set();

  const addItems = (items) => {
    if (!Array.isArray(items)) return;
    items.forEach((item) => {
      if (typeof item === 'string') names.add(item);
      else if (item?.name) names.add(item.name);
    });
  };

  addItems(metadataManager?.shapeColumnList);
  addItems(metadataManager?.hueColumnList);

  return [...names].sort((a, b) => a.localeCompare(b));
}

export function renderCatalogueManager() {
  const container = el('catTable');
  if (!container) return;
  const filterInput = el('catFilter');
  const filter = (filterInput?.value || '').trim().toLowerCase();
  container.innerHTML = "";

  const rows = state.CAT_LIST
    .map((c, idx) => ({ c, idx, key: catalogueKey(c) }))
    .filter(({ c }) => !filter || (c.name?.toLowerCase().includes(filter) || c.table?.toLowerCase().includes(filter)));

  if (!rows.length) {
    container.innerHTML = `<div class="catalogue-empty hint">No catalogues${filter ? " match the current filter" : " loaded"}.</div>`;
    return;
  }

  rows.forEach(({ c, idx, key }) => {
    const vis = state.CAT_VIS.has(key) ? state.CAT_VIS.get(key) : true;
    const columns = extractTapMetadataColumnNames(c);
    const numericColumns = extractNumericMetadataColumnNames(c);
    const chosenName = c?.metadataManager?.selectedNameColumn?.name || "";
    const chosen = state.CAT_SIZEBY.get(key) || "";
    const chosenHue = state.CAT_HUEBY.get(key) || "";

    const card = document.createElement('article');
    card.className = `catalogue-card${vis ? "" : " is-hidden"}`;
    card.dataset.idx = String(idx);
    card.innerHTML = `
      <div class="catalogue-card-header">
        <div class="catalogue-card-heading">
          <div class="catalogue-card-title">
            ${c.name || c.table || c.id || "(unnamed)"}
            ${c.rowCount ? `<span class="catalogue-row-count">${c.rowCount}</span>` : ""}
          </div>
          <div class="catalogue-card-key mono" title="${key}">${key}</div>
        </div>
        <label class="catalogue-visibility">
          <input type="checkbox" class="cat-vis" ${vis ? "checked" : ""} />
          <span class="catalogue-visibility-text">${vis ? "Visible" : "Hidden"}</span>
        </label>
      </div>

      <div class="catalogue-style-grid">
        <label class="catalogue-field">
          <span>Name</span>
          <select class="name-by sel-compact" ${columns.length ? "" : "disabled"}>
            <option value="" ${!chosenName ? "selected" : ""}>— none —</option>
            ${columns.map(col => `<option value="${col}" ${col === chosenName ? "selected" : ""}>${col}</option>`).join('')}
          </select>
        </label>
        <label class="catalogue-field">
          <span>Size by</span>
          <select class="size-by sel-compact" ${numericColumns.length ? "" : "disabled"}>
            <option value="STANDARD_SIZE" ${!chosen ? "selected" : ""}>— default —</option>
            ${numericColumns.map(col => `<option value="${col}" ${col === chosen ? "selected" : ""}>${col}</option>`).join('')}
          </select>
        </label>
        <label class="catalogue-field">
          <span>Hue by</span>
          <select class="hue-by sel-compact" ${numericColumns.length ? "" : "disabled"}>
            <option value="STANDARD_HUE" ${!chosenHue ? "selected" : ""}>— default —</option>
            ${numericColumns.map(col => `<option value="${col}" ${col === chosenHue ? "selected" : ""}>${col}</option>`).join('')}
          </select>
        </label>
      </div>

      ${!columns.length ? `<div class="hint">No metadata available for catalogue configuration.</div>` : ""}

      <div class="catalogue-card-footer">
        <label class="catalogue-colour">
          <span>Colour</span>
          <input type="color" class="row-color" title="Change colour"
                 value="${sanitizeHex(c.shapeColor) || sanitizeHex(state.CAT_COLOR.get(key)) || '#8F00FF'}" />
        </label>
        <div class="catalogue-card-actions">
          <button class="row-del secondary" title="Remove from engine and catalogue manager">Delete</button>
        </div>
      </div>`;
    container.appendChild(card);
  });
}

let wired = false;
export function wireCatalogueManagerControls() {
  if (wired) return; wired = true;

  el('catFilter')?.addEventListener('input', renderCatalogueManager);
  el('btnShowAll')?.addEventListener('click', () => batchSetVisibility(true));
  el('btnHideAll')?.addEventListener('click', () => batchSetVisibility(false));

  el('catTable')?.addEventListener('click', (ev) => {
    const tr = ev.target.closest('.catalogue-card'); if (!tr) return;
    const idx = Number(tr.dataset.idx);
    const cat = state.CAT_LIST[idx]; if (!cat) return;
    const key = catalogueKey(cat);

    if (ev.target.classList.contains('row-del')) {
      try {
        state.AstroAPI?.deleteCatalogue?.(cat);
        state.CAT_LIST.splice(idx, 1);
        state.CAT_VIS.delete(key);
        state.CAT_SIZEBY.delete(key);
        state.CAT_HUEBY.delete(key);
        state.CAT_COLOR.delete(key);
        renderCatalogueManager();
        persistBasic();
        setStatus(`🗑️ Catalogue deleted: ${cat.name || cat.id || cat.table}`);
      } catch (e) { setStatus("Delete error: " + (e.message || e)); }
    }
  });

  el('catTable')?.addEventListener('change', (ev) => {
    const tr = ev.target.closest('.catalogue-card'); if (!tr) return;
    const idx = Number(tr.dataset.idx);
    const cat = state.CAT_LIST[idx]; if (!cat) return;
    const key = catalogueKey(cat);

    if (ev.target.classList.contains('cat-vis')) {
      const isVisible = !!ev.target.checked;
      try {
        state.AstroAPI?.hideCatalogue?.(cat, isVisible);
        state.CAT_VIS.set(key, isVisible);
        tr.classList.toggle('is-hidden', !isVisible);
        const visibilityText = tr.querySelector('.catalogue-visibility-text');
        if (visibilityText) visibilityText.textContent = isVisible ? "Visible" : "Hidden";
        persistBasic();
        setStatus(`${isVisible ? "👁️ Visible" : "🙈 Hidden"} → ${cat.name || cat.id || cat.table}`);
      } catch (e) { setStatus("Visibility error: " + (e.message || e)); }
      return;
    }

    if (ev.target.classList.contains('name-by')) {
      const column = String(ev.target.value || "");
      const metadataManager = cat?.metadataManager;
      if (!metadataManager) {
        setStatus("Metadata manager not available for this catalogue.");
        return;
      }
      try {
        metadataManager.selectedNameColumn = column;
        persistBasic();
        setStatus(column
          ? `Name → ${column} for ${cat.name || cat.id || cat.table}`
          : `Name reset for ${cat.name || cat.id || cat.table}.`);
      } catch (e) { setStatus("Name-column error: " + (e.message || e)); }
      return;
    }

    if (ev.target.classList.contains('size-by')) {
      const column = String(ev.target.value || "");
      const isDefault = column === "STANDARD_SIZE";
      if (isDefault) state.CAT_SIZEBY.delete(key);
      else state.CAT_SIZEBY.set(key, column);
      persistBasic();

      // apply only if visible; otherwise it will apply on next Show
      const isVisible = !!(tr.querySelector('.cat-vis')?.checked);
      if (!isVisible) {
        setStatus(isDefault
          ? `Size by reset to default for ${cat.name || cat.id || cat.table}.`
          : `Saved "Size by: ${column}" (applies when visible).`);
        return;
      }
      if (!state.AstroAPI?.setCatalogueShapeSize) {
        setStatus("setCatalogueShapeSize not available on AstroAPI.");
        return;
      }
      try {
        state.AstroAPI.setCatalogueShapeSize(cat, column);
        setStatus(isDefault
          ? `Size by reset to default for ${cat.name || cat.id || cat.table}.`
          : `🎛️ Size by → ${column} for ${cat.name || cat.id || cat.table}`);
      } catch (e) { setStatus("Size-by error: " + (e.message || e)); }
    }

    if (ev.target.classList.contains('hue-by')) {
      const column = String(ev.target.value || "");
      const isDefault = column === "STANDARD_HUE";
      if (isDefault) state.CAT_HUEBY.delete(key);
      else state.CAT_HUEBY.set(key, column);
      persistBasic();

      // apply only if visible; otherwise apply on next Show
      const isVisible = !!(tr.querySelector('.cat-vis')?.checked);
      if (!isVisible) {
        setStatus(isDefault
          ? `Hue by reset to default for ${cat.name || cat.id || cat.table}.`
          : `Saved "Hue by: ${column}" (applies when visible).`);
        return;
      }
      if (!state.AstroAPI?.setCatalogueShapeHue) {
        setStatus("setCatalogueShapeHue not available on AstroAPI.");
        return;
      }
      try {
        state.AstroAPI.setCatalogueShapeHue(cat, column);
        setStatus(isDefault
          ? `Hue by reset to default for ${cat.name || cat.id || cat.table}.`
          : `🎨 Hue by → ${column} for ${cat.name || cat.id || cat.table}`);
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
