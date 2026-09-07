/*
 * AstroViewer
 * Copyright (C) Fabrizio Giordano
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-AstroViewer-Commercial
 */

import { el, setStatus } from './ui.js';
import { state } from './state.js';

const DEFAULT_COLOR = '#00fff2';
let nextOverlayId = 1;


function overlayLabel(kind) {
  if (kind === 'points') return 'Points';
  if (kind === 'lines') return 'Lines';
  return 'Polygons';
}

function changeOverlayColor(entry, color) {
  if (entry.kind === 'points') {
    state.AstroAPI?.changeCatalogueColor?.(entry.overlay, color);
  } else if (entry.kind === 'lines') {
    state.AstroAPI?.changeTerraPolylineSetColor?.(entry.overlay, color);
  } else {
    state.AstroAPI?.changeFootprintSetColor?.(entry.overlay, color);
  }
}

function setOverlayVisible(entry, visible) {
  if (entry.kind === 'points') {
    state.AstroAPI?.hideTerraPointSet?.(entry.overlay, visible);
  } else if (entry.kind === 'lines') {
    state.AstroAPI?.hideTerraPolylineSet?.(entry.overlay, visible);
  } else {
    state.AstroAPI?.hideTerraFootprintSet?.(entry.overlay, visible);
  }
}

function deleteOverlay(entry) {
  if (entry.kind === 'points') {
    state.AstroAPI?.deleteTerraPointSet?.(entry.overlay);
  } else if (entry.kind === 'lines') {
    state.AstroAPI?.deleteTerraPolylineSet?.(entry.overlay);
  } else {
    state.AstroAPI?.deleteTerraFootprintSet?.(entry.overlay);
  }
}

export function addEarthGeoJSONOverlay(name, overlay, featureCount, kind = 'polygons') {
  const entry = {
    id: `earth-geojson-${nextOverlayId++}`,
    name: name || 'Imported GeoJSON',
    featureCount: Number(featureCount) || 0,
    overlay,
    kind,
    visible: true,
    color: DEFAULT_COLOR,
  };

  changeOverlayColor(entry, entry.color);
  state.EARTH_GEOJSON_LIST.push(entry);
  return entry;
}

export function renderEarthGeoJSONManager() {
  const container = el('earthGeoJSONOverlays');
  if (!container) return;

  container.innerHTML = '';

  if (!state.EARTH_GEOJSON_LIST.length) {
    container.innerHTML = '<div class="hint catalogue-empty">No geographic overlays loaded.</div>';
    return;
  }

  state.EARTH_GEOJSON_LIST.forEach((entry, idx) => {
    const card = document.createElement('div');
    card.className = `catalogue-card${entry.visible ? '' : ' is-hidden'}`;
    card.dataset.idx = String(idx);
    card.innerHTML = `
      <div class="catalogue-card-header">
        <div class="catalogue-card-heading">
          <div class="catalogue-card-title">${entry.name}</div>
          <div class="catalogue-card-key mono">${overlayLabel(entry.kind)} · ${entry.featureCount} feature${entry.featureCount === 1 ? '' : 's'}</div>
        </div>
        <label class="catalogue-visibility">
          <input type="checkbox" class="earth-geojson-vis" ${entry.visible ? 'checked' : ''} />
          <span>Visible</span>
        </label>
      </div>

      <div class="catalogue-card-footer">
        <label class="catalogue-colour">
          <span>Colour</span>
          <input type="color" class="earth-geojson-color" value="${entry.color}" title="Change colour" />
        </label>

        <div class="catalogue-card-actions">
          <button class="earth-geojson-del secondary" title="Remove geographic overlay">Delete</button>
        </div>
      </div>`;

    container.appendChild(card);
  });
}

let wired = false;
export function wireEarthGeoJSONManagerControls() {
  if (wired) return;
  wired = true;

  el('earthGeoJSONOverlays')?.addEventListener('click', (ev) => {
    const card = ev.target.closest('.catalogue-card');
    if (!card || !ev.target.classList.contains('earth-geojson-del')) return;

    const idx = Number(card.dataset.idx);
    const entry = state.EARTH_GEOJSON_LIST[idx];
    if (!entry) return;

    try {
      deleteOverlay(entry);
      state.EARTH_GEOJSON_LIST.splice(idx, 1);
      renderEarthGeoJSONManager();
      setStatus(`Deleted Earth GeoJSON overlay: ${entry.name}`);
    } catch (e) {
      setStatus('Delete error: ' + (e.message || e));
    }
  });

  el('earthGeoJSONOverlays')?.addEventListener('change', (ev) => {
    const card = ev.target.closest('.catalogue-card');
    if (!card) return;

    const idx = Number(card.dataset.idx);
    const entry = state.EARTH_GEOJSON_LIST[idx];
    if (!entry) return;

    if (ev.target.classList.contains('earth-geojson-vis')) {
      const visible = !!ev.target.checked;
      try {
        setOverlayVisible(entry, visible);
        entry.visible = visible;
        card.classList.toggle('is-hidden', !visible);
        setStatus(`${visible ? 'Visible' : 'Hidden'} Earth GeoJSON overlay: ${entry.name}`);
      } catch (e) {
        setStatus('Visibility error: ' + (e.message || e));
      }
      return;
    }

    if (ev.target.classList.contains('earth-geojson-color')) {
      const color = String(ev.target.value || '');
      try {
        changeOverlayColor(entry, color);
        entry.color = color;
        setStatus(`Colour ${color} for Earth GeoJSON overlay: ${entry.name}`);
      } catch (e) {
        setStatus('Colour change error: ' + (e.message || e));
      }
    }
  });
}

export function clearEarthGeoJSONOverlays() {
  for (const entry of state.EARTH_GEOJSON_LIST) {
    try {
      deleteOverlay(entry);
    } catch {}
  }

  state.EARTH_GEOJSON_LIST = [];
  renderEarthGeoJSONManager();
}
