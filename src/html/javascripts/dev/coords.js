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

import { el } from "./ui.js";
import { state } from "./state.js";

function formatRaDec(ra, dec) {
  return `RA=${Number(ra).toFixed(5)}°, Dec=${Number(dec).toFixed(5)}°`;
}

function formatLonLat(lon, lat) {
  return `Lon=${Number(lon).toFixed(5)}°, Lat=${Number(lat).toFixed(5)}°`;
}

function getLonLat(coords) {
  const phi = coords?.sphericalDeg?.phi;
  const theta = coords?.sphericalDeg?.theta;

  if (!Number.isFinite(phi) || !Number.isFinite(theta)) {
    return null;
  }

  return {
    lon: phi > 180 ? phi - 360 : phi,
    lat: 90 - theta,
  };
}

function updateCoordinateReadouts(prefix, coords) {
  const astronomyEl = el(`astronomy${prefix}Coords`);
  const earthEl = el(`earth${prefix}Coords`);
  const meshEl = el(`mesh${prefix}Coords`);

  const label = prefix === "Center" ? "Center" : "Hover";

  if (!coords?.astroDeg) {
    if (astronomyEl) astronomyEl.value = `${label}: —`;
    if (earthEl) earthEl.value = `${label}: —`;
    if (meshEl) meshEl.value = `${label}: —`;
    return;
  }

  if (astronomyEl) {
    astronomyEl.value =
      `${label}: ` + formatRaDec(coords.astroDeg.ra, coords.astroDeg.dec);
  }

  const lonLat = getLonLat(coords);

  if (!lonLat) {
    if (earthEl) earthEl.value = `${label}: —`;
    if (meshEl) meshEl.value = `${label}: —`;
    return;
  }

  const formattedLonLat = formatLonLat(lonLat.lon, lonLat.lat);

  if (earthEl) {
    earthEl.value = `${label}: ${formattedLonLat}`;
  }

  if (meshEl) {
    meshEl.value = `${label}: ${formattedLonLat}`;
  }
}

export function wireCoords() {
  const canvas = document.getElementById("astrocanvas");

  refreshCenter();

  el("btnAstronomyRefreshCenter")?.addEventListener("click", refreshCenter);

  el("btnEarthRefreshCenter")?.addEventListener("click", refreshCenter);

  el("btnMeshRefreshCenter")?.addEventListener("click", refreshCenter);

  /*
   * Keep center coordinates synchronized with camera movement.
   */
  let centerTimer = window.setInterval(refreshCenter, 250);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      window.clearInterval(centerTimer);
      centerTimer = null;
    } else if (!centerTimer) {
      centerTimer = window.setInterval(refreshCenter, 250);
    }
  });

  if (!canvas) return;

  let rafId = 0;
  let pending = false;

  const updateHover = () => {
    rafId = 0;
    pending = false;

    try {
      if (!state.AstroAPI?.getCoordinatesFromMouse) {
        return;
      }

      const coords = state.AstroAPI.getCoordinatesFromMouse();

      updateCoordinateReadouts("Hover", coords);
    } catch {
      // Hover updates are intentionally silent.
    }
  };

  const onMove = () => {
    if (pending) return;

    pending = true;
    rafId = requestAnimationFrame(updateHover);
  };

  const clearHover = () => {
    updateCoordinateReadouts("Hover", null);
  };

  canvas.addEventListener("mousemove", onMove);
  canvas.addEventListener("mouseenter", onMove);
  canvas.addEventListener("mouseleave", clearHover);

  window.addEventListener("beforeunload", () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
    }

    if (centerTimer) {
      window.clearInterval(centerTimer);
    }

    canvas.removeEventListener("mousemove", onMove);
    canvas.removeEventListener("mouseenter", onMove);
    canvas.removeEventListener("mouseleave", clearHover);
  });
}

export function refreshCenter() {
  try {
    if (!state.AstroAPI?.getCenterCoordinates) {
      updateCoordinateReadouts("Center", null);
      return;
    }

    const coords = state.AstroAPI.getCenterCoordinates();

    updateCoordinateReadouts("Center", coords);
  } catch {
    updateCoordinateReadouts("Center", null);
  }
}
