import { el, setStatus } from './ui.js';
import { state, persistBasic } from './state.js';

const HEX6 = /^#?[0-9a-fA-F]{6}$/;
const sanitizeHex = (v) => {
  if (!v) return '';
  const s = String(v).trim();
  if (HEX6.test(s)) return s.startsWith('#') ? s : '#'+s;
  return '';
};

// A stable key for footprint sets (prefer name/id/table; else JSON)
export function footprintKey(fp) {
  return fp?.name || String(fp?.id) || fp?.table || JSON.stringify(fp);
}

export function renderFootprintManager() {
  const table = el('fpTable');
  if (!table) return;
  const filter = (el('fpFilter')?.value || '').trim().toLowerCase();
  table.innerHTML = "";

  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th style="width:42%;">Name</th>
      <th style="width:12%;">Visible</th>
      <th style="width:12%;">Status</th>
      <th>Actions</th>
    </tr>`;
  table.appendChild(thead);

  const tbody = document.createElement('tbody');

  const rows = state.FP_LIST
    .map((f, idx) => ({ f, idx, key: footprintKey(f) }))
    .filter(({ f }) => !filter || (f.name?.toLowerCase().includes(filter) || f.table?.toLowerCase().includes(filter)));

  rows.forEach(({ f, idx, key }) => {
    const vis = state.FP_VIS.has(key) ? state.FP_VIS.get(key) : true;
    const currentColor = sanitizeHex(state.FP_COLOR.get(key)) || '#ffaa00';

    const tr = document.createElement('tr');
    tr.dataset.idx = String(idx);
    tr.innerHTML = `
      <td>
        <div>${f.name || f.table || f.id || "(unnamed)"}</div>
        <div class="hint mono">${key}</div>
      </td>
      <td style="text-align:center;">
        <input type="checkbox" class="fp-vis" ${vis ? "checked" : ""} />
      </td>
      <td><span class="tag">${vis ? "visible" : "hidden"}</span></td>
      <td>
        <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
          <button class="row-fp-show">Load/Show</button>
          <button class="row-fp-del secondary" title="Remove from engine (keep in list)">Delete</button>
          <input type="color" class="row-fp-color" title="Change colour" value="${currentColor}" />
        </div>
      </td>`;
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
}

let wired = false;
export function wireFootprintManagerControls() {
  if (wired) return; wired = true;

  el('fpFilter')?.addEventListener('input', renderFootprintManager);
  el('btnShowAllFp')?.addEventListener('click', () => batchSetVisibility(true));
  el('btnHideAllFp')?.addEventListener('click', () => batchSetVisibility(false));

  el('fpTable')?.addEventListener('click', (ev) => {
    const tr = ev.target.closest('tr'); if (!tr) return;
    const idx = Number(tr.dataset.idx);
    const fp = state.FP_LIST[idx]; if (!fp) return;
    const key = footprintKey(fp);

    if (ev.target.classList.contains('row-fp-show')) {
      try {
        state.AstroAPI?.showFootprintSet?.(fp);
        state.FP_VIS.set(key, true);

        // re-apply remembered color
        const rememberedColor = state.FP_COLOR.get(key);
        if (rememberedColor && state.AstroAPI?.changeFootprintSetColor) {
          state.AstroAPI.changeFootprintSetColor(fp, sanitizeHex(rememberedColor));
        }

        renderFootprintManager();
        persistBasic();
        setStatus(`📡 Footprint set loaded: ${fp.name || fp.id || fp.table}`);
      } catch (e) { setStatus("Show error: " + (e.message || e)); }
    }

    if (ev.target.classList.contains('row-fp-del')) {
      try {
        state.AstroAPI?.deleteFootprintSet?.(fp);
        state.FP_VIS.set(key, false);
        renderFootprintManager();
        persistBasic();
        setStatus(`🗑️ Footprint set removed from engine: ${fp.name || fp.id || fp.table}`);
      } catch (e) { setStatus("Delete error: " + (e.message || e)); }
    }
  });

  el('fpTable')?.addEventListener('change', (ev) => {
    const tr = ev.target.closest('tr'); if (!tr) return;
    const idx = Number(tr.dataset.idx);
    const fp = state.FP_LIST[idx]; if (!fp) return;
    const key = footprintKey(fp);

    if (ev.target.classList.contains('fp-vis')) {
      const isVisible = !!ev.target.checked;
      try {
        state.AstroAPI?.hideFootprintSet?.(fp, isVisible);
        state.FP_VIS.set(key, isVisible);
        tr.querySelector('.tag').textContent = isVisible ? "visible" : "hidden";
        persistBasic();
        setStatus(`${isVisible ? "👁️ Visible" : "🙈 Hidden"} → ${fp.name || fp.id || fp.table}`);
      } catch (e) { setStatus("Visibility error: " + (e.message || e)); }
      return;
    }

    if (ev.target.classList.contains('row-fp-color')) {
      const hex = sanitizeHex(ev.target.value);
      if (!hex) {
        setStatus("Invalid hex colour. Use #RRGGBB.");
        return;
      }
      state.FP_COLOR.set(key, hex);
      persistBasic();

      // apply only if visible; otherwise apply on next Show
      const isVisible = !!(tr.querySelector('.fp-vis')?.checked);
      if (!isVisible) {
        setStatus(`Saved colour ${hex} (will apply when visible).`);
        return;
      }
      if (!state.AstroAPI?.changeFootprintSetColor) {
        setStatus("changeFootprintSetColor not available on AstroAPI.");
        return;
      }
      try {
        state.AstroAPI.changeFootprintSetColor(fp, hex);
        setStatus(`🎨 Colour → ${hex} for ${fp.name || fp.id || fp.table}`);
      } catch (e) { setStatus("Colour change error: " + (e.message || e)); }
    }
  });
}

function batchSetVisibility(newState) {
  const filter = (el('fpFilter')?.value || '').trim().toLowerCase();
  const affected = state.FP_LIST.filter(f =>
    !filter || (f.name?.toLowerCase().includes(filter) || f.table?.toLowerCase().includes(filter))
  );
  let ok = 0;
  for (const f of affected) {
    try {
      state.AstroAPI?.hideFootprintSet?.(f, newState);
      state.FP_VIS.set(footprintKey(f), newState);
      ok++;
    } catch {}
  }
  renderFootprintManager();
  persistBasic();
  setStatus(`${newState ? "👁️ Shown" : "🙈 Hidden"} ${ok} footprint set(s)${filter ? " (filtered)" : ""}.`);
}