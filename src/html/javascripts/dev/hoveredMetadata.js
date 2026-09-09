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

const selectedSources = new Map();
const selectedFootprints = new Map();
const selectionDomains = new WeakMap();

export function syncInspectorToActiveDomain() {
  hoveredSourceDetail = null;
  lastSignature = '';
  renderCombined([]);
}

export function forgetInspectorSelection(owner) {
  if (!owner) return;
  selectedSources.delete(owner);
  selectedFootprints.delete(owner);
  lastSignature = '';
  renderCombined();
}

function activeDomain() {
  return state.AstroAPI?.getActiveDomain?.() || 'astronomy';
}

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

  const onSourceClicked = (event) => {
    updateSelectedSources(event?.detail);
    renderCombined();
  };

  const onFootprintClicked = (event) => {
    updateSelectedFootprints(event?.detail);
    renderCombined();
  };

  const inspectorEl = el('hoverInspector');
  const stopInspectorWheelPropagation = (event) => {
    if (inspectorEl?.classList.contains('has-selection')) {
      event.stopPropagation();
    }
  };

  const clearInspectorSelection = () => {
    const domain = activeDomain();

    for (const catalogue of [...selectedSources.keys()]) {
      if (selectionDomains.get(catalogue) !== domain) continue;
      catalogue?.clearSelection?.();
      selectedSources.delete(catalogue);
    }

    for (const footprintSet of [...selectedFootprints.keys()]) {
      if (selectionDomains.get(footprintSet) !== domain) continue;
      footprintSet?.clearSelection?.();
      selectedFootprints.delete(footprintSet);
    }

    hoveredSourceDetail = null;

    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
    pending = false;
    lastSignature = '';
    renderCombined([]);
  };

  canvas.addEventListener('mousemove', scheduleFootprintRefresh);
  canvas.addEventListener('mouseenter', scheduleFootprintRefresh);
  canvas.addEventListener('mouseleave', () => {
    hoveredSourceDetail = null;
    renderCombined([]);
  });
  canvas.addEventListener('source-hovered', onSourceHovered);
  canvas.addEventListener('source-clicked', onSourceClicked);
  canvas.addEventListener('footprint-clicked', onFootprintClicked);
  inspectorEl?.addEventListener('wheel', stopInspectorWheelPropagation);
  el('btnClearInspectorSelection')?.addEventListener('click', clearInspectorSelection);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) scheduleFootprintRefresh();
  });

  window.addEventListener('beforeunload', () => {
    if (rafId) cancelAnimationFrame(rafId);
    canvas.removeEventListener('mousemove', scheduleFootprintRefresh);
    canvas.removeEventListener('source-hovered', onSourceHovered);
    canvas.removeEventListener('source-clicked', onSourceClicked);
    canvas.removeEventListener('footprint-clicked', onFootprintClicked);
    inspectorEl?.removeEventListener('wheel', stopInspectorWheelPropagation);
    el('btnClearInspectorSelection')?.removeEventListener('click', clearInspectorSelection);
  });
}

function updateSelectedSources(detail) {
  const catalogue = detail?.catalogue;
  if (!catalogue) return;

  let sources = selectedSources.get(catalogue);
  if (!sources) {
    sources = new Set();
    selectedSources.set(catalogue, sources);
  }
  selectionDomains.set(catalogue, activeDomain());

  for (const item of detail?.selectionState || []) {
    if (!item?.source) continue;
    if (item.selected) sources.add(item.source);
    else sources.delete(item.source);
  }

  if (!sources.size) selectedSources.delete(catalogue);
}

function updateSelectedFootprints(detail) {
  const footprintSet = detail?.footprintSet;
  if (!footprintSet) return;

  let footprints = selectedFootprints.get(footprintSet);
  if (!footprints) {
    footprints = new Set();
    selectedFootprints.set(footprintSet, footprints);
  }
  selectionDomains.set(footprintSet, activeDomain());

  for (const item of detail?.selectionState || []) {
    if (!item?.footprint) continue;
    if (item.selected) footprints.add(item.footprint);
    else footprints.delete(item.footprint);
  }

  if (!footprints.size) selectedFootprints.delete(footprintSet);
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

  const hoverCards = [
    renderSourceCard(hoveredSourceDetail),
    ...renderFootprintCards(footprintSets),
  ].filter(Boolean);
  const selectionCards = renderSelectedCards();
  const hasSelection = selectionCards.length > 0;
  inspectorEl.classList.toggle('has-selection', hasSelection);
  const closeButton = el('btnClearInspectorSelection');
  if (closeButton) closeButton.hidden = !hasSelection;
  const html = [
    renderSection('Preview', hoverCards),
    renderSection('Selected', selectionCards),
  ].filter(Boolean).join('');
  const sig = signature(hoveredSourceDetail, footprintSets, selectionCards);
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

function renderSelectedCards() {
  const cards = [];
  const domain = activeDomain();

  for (const [catalogue, sources] of selectedSources) {
    if (selectionDomains.get(catalogue) !== domain) continue;
    for (const source of sources) {
      cards.push(renderSourceCard({ source, catalogue }, true));
    }
  }

  for (const [footprintSet, footprints] of selectedFootprints) {
    if (selectionDomains.get(footprintSet) !== domain) continue;
    for (const footprint of footprints) {
      cards.push(renderFootprintCard(footprintSet, footprint, true));
    }
  }

  return cards.filter(Boolean);
}

function renderSection(title, cards) {
  if (!cards.length) return '';
  return `
    <section class="inspector-section">
      <div class="inspector-section-title">${safe(title)}</div>
      ${cards.join('')}
    </section>`;
}

function renderSourceCard(detail, selected = false) {
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
    <div class="hover-card${selected ? ' is-selected' : ''}">
      <h4>Catalogue source · ${safe(catalogue.name || 'unknown')}</h4>
      ${rows ? `<div class="hover-metadata-table">${rows}</div>` : '<div class="hover-meta">No metadata</div>'}
    </div>`;
}

function renderFootprintCards(sets) {
  const cards = [];
  for (const set of sets || []) {
    for (const footprint of set?.footprints || []) {
      cards.push(renderFootprintCard(set, footprint));
    }
  }
  return cards.filter(Boolean);
}

function renderFootprintCard(set, footprint, selected = false) {
  if (!set || !footprint) return '';

  const details = Array.isArray(footprint.details) ? footprint.details : [];
  const columns = set?.metadata?.columns || set?.metadataManager?.columns || [];
  const rows = columns
    .map((column, index) => metadataRow(column?.name, footprintDetailValue(details[index]), column?.unit))
    .filter(Boolean)
    .join('');
  const tableName = set?.tableName || set?.name || 'unknown';

  return `
    <div class="hover-card${selected ? ' is-selected' : ''}">
      <h4>Observation footprint · ${safe(tableName)}</h4>
      ${rows ? `<div class="hover-metadata-table">${rows}</div>` : '<div class="hover-meta">No metadata</div>'}
    </div>`;
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

  const renderedValue = renderMetadataValue(key, value, unit);
  return `<div class="hover-metadata-row"><span>${safe(key)}</span>${renderedValue}</div>`;
}

function renderMetadataValue(key, value, unit) {
  if (isGeometryPlaceholder(key, value)) {
    return '<strong>[geometry]</strong>';
  }

  if (isHttpUrl(value)) {
    const href = safe(String(value).trim());
    return `<strong><a class="hover-metadata-link" href="${href}" target="_blank" rel="noopener noreferrer">Open link ↗</a></strong>`;
  }

  return `<strong>${safe(value)}${unit ? ` ${safe(unit)}` : ''}</strong>`;
}

function isGeometryPlaceholder(key, value) {
  if (String(key).trim().toLowerCase() !== 'fov') return false;
  if (value && typeof value === 'object') return true;
  return /^\[D@[0-9a-f]+$/i.test(String(value).trim());
}

function isHttpUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value.trim());
}

function signature(sourceDetail, footprintSets, selectionCards) {
  const source = sourceDetail?.source;
  const sourceValues = source?.details ? JSON.stringify(source.details) : '';
  const footprints = [];
  for (const set of footprintSets || []) {
    for (const footprint of set?.footprints || []) {
      footprints.push(`${set?.tableName || ''}:${JSON.stringify(footprint?.details || [])}`);
    }
  }
  return `${sourceValues}||${footprints.join('|')}||${selectionCards.join('|')}`;
}

function safe(value) {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
