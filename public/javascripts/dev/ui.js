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
