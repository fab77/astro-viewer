/*
 * AstroViewer
 * Copyright (C) Fabrizio Giordano
 * SPDX-License-Identifier: LicenseRef-AstroViewer-Dual-License
 *
 * This file is part of AstroViewer.
 * AstroViewer is distributed under a dual-license model.
 * Commercial use requires a separate commercial license.
 * Non-commercial use is governed by LICENSE-NONCOMMERCIAL.md.
 *
 * See LICENSE.md, LICENSE-COMMERCIAL.md, and LICENSE-NONCOMMERCIAL.md for details.
 */

import { el } from './ui.js';
import { state } from './state.js';

function formatBackoffEntries(entries) {
  if (!entries?.length) {
    return 'Backoff: none';
  }

  const text = entries
    .slice(0, 3)
    .map((entry) => `${entry.host} ${Math.ceil(entry.cooldownMs / 1000)}s (${entry.consecutiveFailures})`)
    .join(' · ');

  return `Backoff: ${text}${entries.length > 3 ? ' …' : ''}`;
}

export function wireXYZDiagnostics() {
  const update = () => {
    const stats = state.AstroAPI?.getXYZDebugStats?.();
    const fov = state.AstroAPI?.getFoV?.();
    const fovEl = el('xyzDiagFoV');
    const summaryEl = el('xyzDiagSummary');
    const cacheEl = el('xyzDiagCache');
    const requestsEl = el('xyzDiagRequests');
    const backoffEl = el('xyzDiagBackoff');

    if (!fovEl || !summaryEl || !cacheEl || !requestsEl || !backoffEl) {
      return;
    }

    if (fov) {
      fovEl.value = `FoV: min ${fov.minFoV?.toFixed?.(4) ?? '—'}° · x ${fov.xFoV?.toFixed?.(4) ?? '—'}° · y ${fov.yFoV?.toFixed?.(4) ?? '—'}°`;
    } else {
      fovEl.value = 'FoV: —';
    }

    if (!stats) {
      summaryEl.textContent = 'Mode: —';
      cacheEl.textContent = 'Cache: —';
      requestsEl.textContent = 'Requests: —';
      backoffEl.textContent = 'Backoff: none';
      return;
    }

    const mode = stats.activeBaseLayer ?? 'none';
    const layer = stats.layer;
    const requests = stats.requests;

    
    summaryEl.textContent = `Mode: ${mode} · Zoom: ${layer?.currentZoom ?? '—'} · Visible: ${layer?.visibleTileCount ?? 0} · Core/Coverage: ${layer?.coreTileCount ?? 0}/${layer?.coverageTileCount ?? 0} · Fallback: ${layer?.fallbackTileCount ?? 0} · Settling: ${layer?.isSettling ? 'yes' : 'no'} · Pending: ${layer?.hasPendingSelection ? 'yes' : 'no'}`;
    cacheEl.textContent = `Cache: ${layer?.cacheSize ?? 0} · Ready: ${layer?.readyTileCount ?? 0} · Loading: ${layer?.loadingTileCount ?? 0} · Cooldown: ${layer?.coolingDownTileCount ?? 0}`;
    requestsEl.textContent = `Requests: active ${requests.activeRequests}/${requests.maxConcurrentRequests} · queue ${requests.queuedRequests} · inflight ${requests.inflightRequests} · top prio ${requests.highestQueuedPriority ?? '—'}`;
    backoffEl.textContent = formatBackoffEntries(requests.hostsInBackoff);
  };

  update();
  window.setInterval(update, 750);
}

export function wireHiPSDiagnostics() {
  const update = () => {
    const stats = state.AstroAPI?.getHiPSDebugStats?.();
    const summaryEl = el('hipsDiagSummary');
    const cacheEl = el('hipsDiagCache');
    const requestsEl = el('hipsDiagRequests');
    const backoffEl = el('hipsDiagBackoff');

    if (!summaryEl || !cacheEl || !requestsEl || !backoffEl) {
      return;
    }

    if (!stats) {
      summaryEl.textContent = 'Mode: —';
      cacheEl.textContent = 'Cache: —';
      requestsEl.textContent = 'Requests: —';
      backoffEl.textContent = 'Backoff: none';
      return;
    }

    const frameType = stats.isGalactic ? 'galactic' : 'equatorial';
    summaryEl.textContent = `Mode: hips · ${stats.hipsName ?? 'HiPS'} · ${frameType} · Order: ${stats.currentOrder ?? '—'} · Visible: ${stats.visibleTileCount ?? 0}`;
    cacheEl.textContent = `Cache: size ${stats.cacheSize ?? 0} · active ${stats.activeTileCount ?? 0} · cached ${stats.cachedTileCount ?? 0} · ready ${stats.readyTileCount ?? 0} · loading ${stats.loadingTileCount ?? 0}`;
    requestsEl.textContent = 'Requests: not tracked';
    backoffEl.textContent = 'Backoff: none';
  };

  update();
  window.setInterval(update, 750);
}
