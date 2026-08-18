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

// goto.js
import { setStatus, el } from './ui.js';
import { state } from './state.js';
import { refreshCenter } from './coords.js';

export function wireGoto() {
  const goRa  = el('goRa');
  const goDec = el('goDec');
  const goToLabel = el('goToLabel');
  const btnGo = el('btnGoTo');
  if (!btnGo) return;

  const syncMode = () => {
    const mode = state.AstroAPI?.getActiveCoordinateMode?.() ?? 'equatorial';
    if (mode === 'lonlat') {
      if (goToLabel) goToLabel.textContent = 'Go to (Lon°, Lat°)';
      if (goRa) goRa.placeholder = 'Lon −180–+180';
      if (goDec) goDec.placeholder = 'Lat −90–+90';
      return mode;
    }

    if (mode === 'galactic') {
      if (goToLabel) goToLabel.textContent = 'Go to (RA°, Dec°) on galactic HiPS';
      if (goRa) goRa.placeholder = 'RA 0–360';
      if (goDec) goDec.placeholder = 'Dec −90–+90';
      return mode;
    }

    if (goToLabel) goToLabel.textContent = 'Go to (RA°, Dec°)';
    if (goRa) goRa.placeholder = 'RA 0–360';
    if (goDec) goDec.placeholder = 'Dec −90–+90';
    return mode;
  };

  btnGo.onclick = () => {
    const mode = syncMode();
    const first = Number(goRa?.value), second = Number(goDec?.value);
    if (!Number.isFinite(first) || !Number.isFinite(second)) {
      return setStatus(mode === 'lonlat' ? "Enter valid Lon and Lat in degrees." : "Enter valid RA and Dec in degrees.");
    }

    const firstN = mode === 'lonlat'
      ? ((first + 180) % 360 + 360) % 360 - 180
      : ((first % 360) + 360) % 360;
    const secondC = Math.max(-90, Math.min(90, second));
    if (!state.AstroAPI?.goTo) return setStatus("AstroAPI.goTo unavailable.");
    try { 
      state.AstroAPI.goTo(firstN, secondC); 
      if (mode === 'lonlat') {
        setStatus(`➡️ Slewed to Lon=${firstN.toFixed(5)}°, Lat=${secondC.toFixed(5)}°`);
      } else if (mode === 'galactic') {
        setStatus(`➡️ Slewed to RA=${firstN.toFixed(5)}°, Dec=${secondC.toFixed(5)}° on galactic HiPS`);
      } else {
        setStatus(`➡️ Slewed to RA=${firstN.toFixed(5)}°, Dec=${secondC.toFixed(5)}°`);
      }
      refreshCenter();
  }
    catch(e){ setStatus("goTo error: " + (e.message || e)); }
  };

  [goRa, goDec].forEach(inp => inp?.addEventListener('keydown', ev => { if (ev.key === 'Enter') btnGo.click(); }));
  syncMode();
  window.setInterval(syncMode, 750);
}
