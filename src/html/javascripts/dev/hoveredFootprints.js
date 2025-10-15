// hoveredFootprints.js
import { el } from './ui.js';
import { state } from './state.js';

let rafId = 0;
let pending = false;
let lastSignature = '';

export function wireHoveredFootprints() {
  const canvas = document.getElementById('astrocanvas');
  if (!canvas) return;

  const onMove = () => {
    if (pending) return;
    pending = true;
    rafId = requestAnimationFrame(tick);
  };

  canvas.addEventListener('mousemove', onMove);
  canvas.addEventListener('mouseenter', onMove);
  canvas.addEventListener('mouseleave', () => renderHovered(null));

  // also refresh when tab regains focus (selection may change)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) onMove();
  });

  // cleanup
  window.addEventListener('beforeunload', () => {
    if (rafId) cancelAnimationFrame(rafId);
    canvas.removeEventListener('mousemove', onMove);
  });
}

function tick() {
  pending = false;
  try {
    if (!state.AstroAPI?.getHoveredFootprints) return;
    const result = state.AstroAPI.getHoveredFootprints();
    // Some implementations return a single object, others an array — normalize
    const details = Array.isArray(result) ? result : (result ? [result] : []);
    renderHovered(details);
  } catch {
    // ignore errors to avoid console spam while moving
  }
}

function renderHovered(details) {
  const emptyEl = el('hoverEmpty');
  const listEl  = el('hoverList');
  if (!listEl || !emptyEl) return;

  const len = Array.isArray(details) ? details.length : 0;

  // Minimal change detection to avoid excessive DOM churn
  const sig = signature(details);
  if (sig === lastSignature) return;
  lastSignature = sig;

  if (!len) {
    emptyEl.style.display = '';
    listEl.innerHTML = '';
    return;
  }
  emptyEl.style.display = 'none';

  listEl.innerHTML = details.map(renderCardHTML).join('');
}

function renderCardHTML(d) {
  const provider   = safe(d?.provider);
  const tableName  = safe(d?.tableName);
  const desc       = safe(d?.description);
  const nFootprints = (d?.footprints && Array.isArray(d.footprints)) ? d.footprints.length : 0;
  const cols = extractColumnNames(d?.metadata);

  return `
    <div class="hover-card">
      <h4>${provider ? provider + ' · ' : ''}${tableName || '(unknown set)'}
        <span class="hint">(${nFootprints} footprint${nFootprints===1?'':'s'})</span>
      </h4>
      ${desc ? `<div class="hover-meta">${desc}</div>` : ''}
      ${cols.length ? `
        <div class="hover-meta">Columns: ${cols.slice(0, 10).join(', ')}${cols.length>10?'…':''}</div>` : ''
      }
    </div>
  `;
}

function extractColumnNames(tapMetadataList) {
  if (!tapMetadataList) return [];
  const out = new Set();

  // common shapes we’ve seen
  const tryArray = (arr) => Array.isArray(arr) && arr.forEach(it => {
    if (typeof it === 'string') out.add(it);
    else if (it) out.add(it.name || it.columnName || it._name || it.id || it.col || it.label);
  });

  tryArray(tapMetadataList);
  tryArray(tapMetadataList.columns);
  tryArray(tapMetadataList.items);
  tryArray(tapMetadataList.list);
  tryArray(tapMetadataList.metadata);
  tryArray(tapMetadataList.fields);
  tryArray(tapMetadataList.metadataList);

  return [...out].filter(Boolean).sort((a,b)=>a.localeCompare(b));
}

function safe(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function signature(details) {
  if (!details || !details.length) return 'empty';
  // Build a small identity: provider|tableName|count + a few names to reflect changes
  const parts = [];
  for (const d of details.slice(0, 5)) {
    const n = Array.isArray(d?.footprints) ? d.footprints.length : 0;
    const cols = extractColumnNames(d?.metadata).slice(0, 6).join('|');
    parts.push(`${d?.provider}|${d?.tableName}|${n}|${cols}`);
  }
  return parts.join('||');
}