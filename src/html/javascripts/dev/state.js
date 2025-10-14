// state.js
export const LS_KEYS = {
  hipsUrl:  'dev_hips_url',
  tapUrl:   'dev_tap_url',
  catVis:   'dev_cat_visibility',
  catSizeBy:'dev_cat_sizeby',
  catHueBy: 'dev_cat_hueby',
};

export const state = {
  AstroAPI: undefined,
  TAP: undefined,
  CAT_LIST: [],
  FP_LIST: [],
  CAT_VIS: new Map(),     // catalogueKey -> boolean
  CAT_SIZEBY: new Map(),  // catalogueKey -> columnName
  CAT_HUEBY: new Map(),   // catalogueKey -> columnName
};

export function catalogueKey(c) {
  return c?.name || String(c?.id) || c?.table || JSON.stringify(c);
}

export function loadPersisted() {
  try {
    const hipsEl = document.getElementById('hipsUrl');
    const tapEl  = document.getElementById('tapUrl');
    const hips = localStorage.getItem(LS_KEYS.hipsUrl);
    const tap  = localStorage.getItem(LS_KEYS.tapUrl);
    if (hips && hipsEl) hipsEl.value = hips;
    if (tap  && tapEl)  tapEl.value  = tap;

    const vis = JSON.parse(localStorage.getItem(LS_KEYS.catVis) || '{}');
    Object.entries(vis).forEach(([k,v]) => state.CAT_VIS.set(k, !!v));

    const sz  = JSON.parse(localStorage.getItem(LS_KEYS.catSizeBy) || '{}');
    Object.entries(sz).forEach(([k,v]) => state.CAT_SIZEBY.set(k, v));

    const hue = JSON.parse(localStorage.getItem(LS_KEYS.catHueBy) || '{}');
    Object.entries(hue).forEach(([k,v]) => state.CAT_HUEBY.set(k, v));
  } catch {}
}

export function persistBasic() {
  try {
    const hipsEl = document.getElementById('hipsUrl');
    const tapEl  = document.getElementById('tapUrl');
    if (hipsEl) localStorage.setItem(LS_KEYS.hipsUrl, hipsEl.value.trim());
    if (tapEl)  localStorage.setItem(LS_KEYS.tapUrl,  tapEl.value.trim());
    localStorage.setItem(LS_KEYS.catVis,   JSON.stringify(Object.fromEntries(state.CAT_VIS)));
    localStorage.setItem(LS_KEYS.catSizeBy,JSON.stringify(Object.fromEntries(state.CAT_SIZEBY)));
    localStorage.setItem(LS_KEYS.catHueBy, JSON.stringify(Object.fromEntries(state.CAT_HUEBY)));
  } catch {}
}
