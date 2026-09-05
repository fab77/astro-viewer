/*
 * AstroViewer
 * Copyright (C) Fabrizio Giordano
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-AstroViewer-Commercial
 */

import { el } from './ui.js';
import { state } from './state.js';

let rafId = 0;
let pending = false;
let lastSignature = '';
let hoveredSourceDetail = null;

export function wireHoveredMetadata() {
  const canvas = document.getElementById('astrocanvas');
  if (!canvas) return;

  const scheduleFootprintRefresh = () => {
    if (pending) return;
    pending = true;
    rafId = requestAnimationFrame(refreshFootprints);
  };

  const onSourceHovered = (event) => {
    hoveredSourceDetail = event?.detail || null;
    renderCombined();
  };

  canvas.addEventListener('mousemove', scheduleFootprintRefresh);
  canvas.addEventListener('mouseenter', scheduleFootprintRefresh);
  canvas.addEventListener('mouseleave', () => {
    hoveredSourceDetail = null;
    renderCombined([]);
  });
  canvas.addEventListener('source-hovered', onSourceHovered);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) scheduleFootprintRefresh();
  });

  window.addEventListener('beforeunload', () => {
    if (rafId) cancelAnimationFrame(rafId);
    canvas.removeEventListener('mousemove', scheduleFootprintRefresh);
    canvas.removeEventListener('source-hovered', onSourceHovered);
  });
}

function refreshFootprints() {
  pending = false;
  try {
    const result = state.AstroAPI?.getHoveredFootprints?.();
    renderCombined(Array.isArray(result) ? result : (result ? [result] : []));
  } catch {
    // Keep hover UI non-intrusive while the camera is moving.
  }
}

function renderCombined(footprintSets = currentFootprintSets()) {
  const inspectorEl = el('hoverInspector');
  const emptyEl = el('hoverEmpty');
  const listEl = el('hoverList');
  if (!inspectorEl || !listEl || !emptyEl) return;

  const sourceCard = renderSourceCard(hoveredSourceDetail);
  const footprintCards = renderFootprintCards(footprintSets);
  const html = [sourceCard, ...footprintCards].filter(Boolean).join('');
  const sig = signature(hoveredSourceDetail, footprintSets);
  if (sig === lastSignature) return;
  lastSignature = sig;

  listEl.innerHTML = html;
  emptyEl.hidden = true;
  inspectorEl.hidden = !html;
}

function currentFootprintSets() {
  try {
    const result = state.AstroAPI?.getHoveredFootprints?.();
    return Array.isArray(result) ? result : (result ? [result] : []);
  } catch {
    return [];
  }
}

function renderSourceCard(detail) {
  const source = detail?.source;
  const catalogue = detail?.catalogue;
  if (!source || !catalogue) return '';

  const columns = catalogue.metadataManager?.columns || [];
  const values = Array.isArray(source.details) ? source.details : [];
  const rows = columns
    .map((column, index) => metadataRow(column?.name, values[index], column?.unit))
    .filter(Boolean)
    .join('');

  return `
    <div class="hover-card">
      <h4>Catalogue source · ${safe(catalogue.name || 'unknown')}</h4>
      ${rows ? `<div class="hover-metadata-table">${rows}</div>` : '<div class="hover-meta">No metadata</div>'}
    </div>`;
}

function renderFootprintCards(sets) {
  const cards = [];
  for (const set of sets || []) {
    for (const footprint of set?.footprints || []) {
      const details = Array.isArray(footprint?.details) ? footprint.details : [];
      const columns = set?.metadata?.columns || [];
      const rows = columns
        .map((column, index) => metadataRow(column?.name, footprintDetailValue(details[index]), column?.unit))
        .filter(Boolean)
        .join('');
      cards.push(`
        <div class="hover-card">
          <h4>Observation footprint · ${safe(set?.tableName || 'unknown')}</h4>
          ${rows ? `<div class="hover-metadata-table">${rows}</div>` : '<div class="hover-meta">No metadata</div>'}
        </div>`);
    }
  }
  return cards;
}

function footprintDetailValue(detail) {
  if (
    detail &&
    typeof detail === 'object' &&
    Object.prototype.hasOwnProperty.call(detail, 'value')
  ) {
    return detail.value;
  }

  return detail;
}

function metadataRow(key, value, unit) {
  if (!key || value == null || value === '') return '';
  return `<div class="hover-metadata-row"><span>${safe(key)}</span><strong>${safe(value)}${unit ? ` ${safe(unit)}` : ''}</strong></div>`;
}

function signature(sourceDetail, footprintSets) {
  const source = sourceDetail?.source;
  const sourceValues = source?.details ? JSON.stringify(source.details) : '';
  const footprints = [];
  for (const set of footprintSets || []) {
    for (const footprint of set?.footprints || []) {
      footprints.push(`${set?.tableName || ''}:${JSON.stringify(footprint?.details || [])}`);
    }
  }
  return `${sourceValues}||${footprints.join('|')}`;
}

function safe(value) {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
