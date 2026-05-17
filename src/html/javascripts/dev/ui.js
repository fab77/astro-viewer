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

// ui.js
export const el = (id) => document.getElementById(id);
export const setStatus = (t) => { const s = el('status'); if (s) s.textContent = t || ''; };

export function minimisePanel() {
  const panel = el('devpanel');
  if (!panel) return;
  panel.dataset.min = "1";
  panel.style.height = "44px";
  panel.style.overflow = "hidden";
  panel.style.opacity = "0";
  const rb = el('restoreBtn');
  if (rb) rb.style.display = "inline-block";
}

export function restorePanel() {
  const panel = el('devpanel');
  if (!panel) return;
  panel.dataset.min = "0";
  panel.style.height = "";
  panel.style.overflow = "";
  panel.style.opacity = "1";
  const rb = el('restoreBtn');
  if (rb) rb.style.display = "none";
}
