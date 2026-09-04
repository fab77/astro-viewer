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

import { el, showLoading, showReady } from "./ui.js";
import { state } from "./state.js";

function formatBackoffEntries(entries) {
  if (!entries?.length) {
    return "Backoff: none";
  }

  const text = entries
    .slice(0, 3)
    .map(
      (entry) =>
        `${entry.host} ${Math.ceil(entry.cooldownMs / 1000)}s (${entry.consecutiveFailures})`,
    )
    .join(" · ");

  return `Backoff: ${text}${entries.length > 3 ? " …" : ""}`;
}

let earthInitialising = false;
let earthWasLoading = false;
let earthIdleSamples = 0;

export function markEarthInitialising() {
  earthInitialising = true;
  earthWasLoading = false;
  earthIdleSamples = 0;

  showLoading("Initialising Earth layer…");
}

export function wireXYZDiagnostics() {
  const update = () => {
    const stats = state.AstroAPI?.getXYZDebugStats?.();
    const fov = state.AstroAPI?.getFoV?.();

    const astronomyFovEl = el("astronomyFoV");
    const xyzFovEl = el("xyzDiagFoV");

    const summaryEl = el("xyzDiagSummary");
    const cacheEl = el("xyzDiagCache");
    const requestsEl = el("xyzDiagRequests");
    const backoffEl = el("xyzDiagBackoff");

    const fovText = fov
      ? `FoV: min ${fov.minFoV?.toFixed?.(4) ?? "—"}° · x ${fov.xFoV?.toFixed?.(4) ?? "—"}° · y ${fov.yFoV?.toFixed?.(4) ?? "—"}°`
      : "FoV: —";

    if (astronomyFovEl) {
      astronomyFovEl.value = fovText;
    }

    if (xyzFovEl) {
      xyzFovEl.value = fovText;
    }

    if (!summaryEl || !cacheEl || !requestsEl || !backoffEl) {
      return;
    }

    if (!stats) {
      summaryEl.textContent = "Mode: —";
      cacheEl.textContent = "Cache: —";
      requestsEl.textContent = "Requests: —";
      backoffEl.textContent = "Backoff: none";
      return;
    }

    const mode = stats.activeBaseLayer ?? "none";
    const layer = stats.layer;
    const requests = stats.requests;

    summaryEl.textContent = `Mode: ${mode} · Zoom: ${layer?.currentZoom ?? "—"} · Visible: ${layer?.visibleTileCount ?? 0} · Core/Coverage: ${layer?.coreTileCount ?? 0}/${layer?.coverageTileCount ?? 0} · Fallback: ${layer?.fallbackTileCount ?? 0} · Settling: ${layer?.isSettling ? "yes" : "no"} · Pending: ${layer?.hasPendingSelection ? "yes" : "no"}`;
    cacheEl.textContent = `Cache: ${layer?.cacheSize ?? 0} · Ready: ${layer?.readyTileCount ?? 0} · Loading: ${layer?.loadingTileCount ?? 0} · Cooldown: ${layer?.coolingDownTileCount ?? 0}`;
    requestsEl.textContent = `Requests: active ${requests.activeRequests}/${requests.maxConcurrentRequests} · queue ${requests.queuedRequests} · inflight ${requests.inflightRequests} · top prio ${requests.highestQueuedPriority ?? "—"}`;
    backoffEl.textContent = formatBackoffEntries(requests.hostsInBackoff);

    const earthIsLoading =
      (layer?.loadingTileCount ?? 0) > 0 ||
      (requests?.activeRequests ?? 0) > 0 ||
      (requests?.queuedRequests ?? 0) > 0 ||
      (requests?.inflightRequests ?? 0) > 0;

    if (earthIsLoading) {
      earthInitialising = false;
      earthWasLoading = true;
      earthIdleSamples = 0;

      showLoading("Loading tiles…");
    } else if (earthInitialising || earthWasLoading) {
      earthIdleSamples += 1;

      /*
       * Require two consecutive idle samples before declaring
       * the Earth layer ready.
       */
      if (earthIdleSamples >= 2) {
        showReady();

        earthInitialising = false;
        earthWasLoading = false;
        earthIdleSamples = 0;
      }
    }
  };

  update();
  window.setInterval(update, 750);
}

let hipsInitialising = false;
let hipsWasLoading = false;
let hipsIdleSamples = 0;

export function markHiPSInitialising() {
  hipsInitialising = true;
  hipsWasLoading = false;
  hipsIdleSamples = 0;
}

export function wireHiPSDiagnostics() {
  const update = () => {
    const stats = state.AstroAPI?.getHiPSDebugStats?.();
    const summaryEl = el("hipsDiagSummary");
    const cacheEl = el("hipsDiagCache");
    const requestsEl = el("hipsDiagRequests");
    const backoffEl = el("hipsDiagBackoff");

    if (!summaryEl || !cacheEl || !requestsEl || !backoffEl) {
      return;
    }

    if (!stats) {
      summaryEl.textContent = "Mode: —";
      cacheEl.textContent = "Cache: —";
      requestsEl.textContent = "Requests: —";
      backoffEl.textContent = "Backoff: none";
      return;
    }

    const frameType = stats.isGalactic ? "galactic" : "equatorial";
    summaryEl.textContent = `Mode: hips · ${stats.hipsName ?? "HiPS"} · ${frameType} · Order: ${stats.currentOrder ?? "—"} · Visible: ${stats.visibleTileCount ?? 0}`;
    cacheEl.textContent = `Cache: size ${stats.cacheSize ?? 0} · active ${stats.activeTileCount ?? 0} · cached ${stats.cachedTileCount ?? 0} · ready ${stats.readyTileCount ?? 0} · loading ${stats.loadingTileCount ?? 0}`;
    requestsEl.textContent = "Requests: not tracked";
    backoffEl.textContent = "Backoff: none";
    if ((stats.loadingTileCount ?? 0) > 0) {
      hipsInitialising = false;
      hipsWasLoading = true;
      hipsIdleSamples = 0;

      showLoading("Loading tiles…");
    } else if (hipsInitialising || hipsWasLoading) {
      hipsIdleSamples += 1;

      /*
       * Require two consecutive idle samples before declaring the
       * HiPS ready. This avoids flickering between tile batches.
       */
      if (hipsIdleSamples >= 2) {
        showReady();

        hipsInitialising = false;
        hipsWasLoading = false;
        hipsIdleSamples = 0;
      }
    }
  };

  update();
  window.setInterval(update, 750);
}

let meshInitialising = false;
let meshWasLoading = false;
let meshIdleSamples = 0;

export function markMeshInitialising() {
  meshInitialising = true;
  meshWasLoading = false;
  meshIdleSamples = 0;

  showLoading("Initialising MeshHiPS…");
}

export function wireMeshHiPSDiagnostics() {
  const update = () => {
    const stats = state.AstroAPI?.getMeshHiPSDebugStats?.();

    if (!stats) {
      return;
    }

    if ((stats.loadingTileCount ?? 0) > 0) {
      meshInitialising = false;
      meshWasLoading = true;
      meshIdleSamples = 0;

      showLoading("Loading tiles…");
    } else if (meshInitialising || meshWasLoading) {
      meshIdleSamples += 1;

      /*
       * Require two consecutive idle samples before declaring
       * the MeshHiPS ready.
       */
      if (meshIdleSamples >= 2) {
        showReady();

        meshInitialising = false;
        meshWasLoading = false;
        meshIdleSamples = 0;
      }
    }
  };

  update();
  window.setInterval(update, 750);
}
