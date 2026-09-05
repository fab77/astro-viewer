/*
 * AstroViewer
 * Copyright (C) Fabrizio Giordano
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-AstroViewer-Commercial
 */

import { el, setStatus } from './ui.js';
import { state } from './state.js';

const DEFAULT_COLOR = '#00fff2';
let nextOverlayId = 1;

export function addEarthGeoJSONOverlay(name, footprintSet, featureCount) {
  const entry = {
    id: `earth-geojson-${nextOverlayId++}`,
    name: name || 'Imported GeoJSON',
    featureCount: Number(featureCount) || 0,
    footprintSet,
    visible: true,
    color: DEFAULT_COLOR,
  };

  state.AstroAPI?.changeFootprintSetColor?.(footprintSet, entry.color);
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
          <div class="catalogue-card-key mono">GeoJSON · ${entry.featureCount} feature${entry.featureCount === 1 ? '' : 's'}</div>
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
      state.AstroAPI?.deleteTerraFootprintSet?.(entry.footprintSet);
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
        state.AstroAPI?.hideTerraFootprintSet?.(entry.footprintSet, visible);
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
        state.AstroAPI?.changeFootprintSetColor?.(entry.footprintSet, color);
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
      state.AstroAPI?.deleteTerraFootprintSet?.(entry.footprintSet);
    } catch {}
  }

  state.EARTH_GEOJSON_LIST = [];
  renderEarthGeoJSONManager();
}
