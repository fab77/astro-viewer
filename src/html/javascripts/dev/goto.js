// goto.js
import { setStatus, el } from './ui.js';
import { state } from './state.js';
import { refreshCenter } from './coords.js';

export function wireGoto() {
  const goRa  = el('goRa');
  const goDec = el('goDec');
  const btnGo = el('btnGoTo');
  if (!btnGo) return;

  btnGo.onclick = () => {
    const ra = Number(goRa?.value), dec = Number(goDec?.value);
    if (!Number.isFinite(ra) || !Number.isFinite(dec)) return setStatus("Enter valid RA and Dec in degrees.");
    const raN = ((ra % 360) + 360) % 360;
    const decC = Math.max(-90, Math.min(90, dec));
    if (!state.AstroAPI?.goTo) return setStatus("AstroAPI.goTo unavailable.");
    try { 
      state.AstroAPI.goTo(raN, decC); 
      setStatus(`➡️ Slewed to RA=${raN.toFixed(5)}°, Dec=${decC.toFixed(5)}°`); 
      refreshCenter();
  }
    catch(e){ setStatus("goTo error: " + (e.message || e)); }
  };

  [goRa, goDec].forEach(inp => inp?.addEventListener('keydown', ev => { if (ev.key === 'Enter') btnGo.click(); }));
}
