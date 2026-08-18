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

// coords.js
import { el, setStatus } from './ui.js';
import { state } from './state.js';

const fmt = (ra, dec) => `RA=${Number(ra).toFixed(5)}°, Dec=${Number(dec).toFixed(5)}°`;
const fmtLonLat = (lon, lat) => `Lon=${Number(lon).toFixed(5)}°, Lat=${Number(lat).toFixed(5)}°`;

function getMode() {
    return state.AstroAPI?.getActiveCoordinateMode?.() ?? 'equatorial';
}

function formatCoords(coords) {
    const mode = getMode();
    if (mode === 'lonlat') {
        const lon = coords.sphericalDeg?.phi > 180 ? coords.sphericalDeg.phi - 360 : coords.sphericalDeg?.phi;
        const lat = 90 - coords.sphericalDeg?.theta;
        return fmtLonLat(lon, lat);
    }

    const suffix = mode === 'galactic' ? ' (galactic HiPS view)' : '';
    return `${fmt(coords.astroDeg.ra, coords.astroDeg.dec)}${suffix}`;
}

export function wireCoords() {
    const centerEl = el('centerCoords');
    const hoverEl = el('hoverCoords');
    const btnRef = el('btnRefreshCenter');
    const canvas = document.getElementById('astrocanvas');

    // initial center update
    refreshCenter();

    // manual refresh button
    btnRef?.addEventListener('click', refreshCenter);

    // auto-refresh center every ~1s (lightweight)
    let centerTimer = setInterval(refreshCenter, 250);

    // pause when tab is hidden (optional, nicer on laptops)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) { clearInterval(centerTimer); centerTimer = null; }
        else if (!centerTimer) { centerTimer = setInterval(refreshCenter, 250); }
    });

    // hover tracking (throttled to animation frames)
    if (canvas) {
        let rafId = 0;
        let pending = false;

        const updateHover = () => {
            rafId = 0;
            pending = false;
            try {
                if (!state.AstroAPI?.getCoordinatesFromMouse) return;
                const coords = state.AstroAPI.getCoordinatesFromMouse();
                if (!coords || !coords.astroDeg) {
                    if (hoverEl) hoverEl.value = "Hover: —";
                    return;
                }
                if (hoverEl) hoverEl.value = `Hover: ${formatCoords(coords)}`;
            } catch (e) {
                // keep it silent to avoid spam
            }
        };

        const onMove = () => {
            if (pending) return;
            pending = true;
            rafId = requestAnimationFrame(updateHover);
        };

        canvas.addEventListener('mousemove', onMove);
        canvas.addEventListener('mouseenter', onMove);
        canvas.addEventListener('mouseleave', () => { if (hoverEl) hoverEl.value = "Hover: —"; });

        // cleanup on unload
        window.addEventListener('beforeunload', () => {
            if (rafId) cancelAnimationFrame(rafId);
            canvas.removeEventListener('mousemove', onMove);
        });
    }
}

export function refreshCenter() {
    const centerEl = el('centerCoords');
    try {
        if (!state.AstroAPI?.getCenterCoordinates) {
            if (centerEl) centerEl.value = "Center: (API not available)";
            return;
        }
        const coords = state.AstroAPI.getCenterCoordinates();
        if (!coords || !coords.astroDeg) {
            if (centerEl) centerEl.value = "Center: —";
            return;
        }
        if (centerEl) centerEl.value = `Center: ${formatCoords(coords)}`;
    } catch (e) {
        if (centerEl) centerEl.value = "Center: —";
    }
}
