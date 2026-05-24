/*
 * Simple importer for JSON/CSV to populate dev `state.CAT_LIST` and `state.FP_LIST`.
 * Supports: JSON array of objects, or CSV with headers.
 * Note: Footprint column should contain STCS format (e.g., POLYGON lon1 lat1 lon2 lat2 ...)
 */
import { el, setStatus } from './ui.js';
import { state, persistBasic } from './state.js';
import { renderCatalogueManager } from './catalogueManager.js';
import { renderFootprintManager } from './footprintManager.js';

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length);
  if (!lines.length) return { columns: [], rows: [] };
  const header = lines[0].split(/,|;|\t/).map(h => h.trim());
  const rows = lines.slice(1).map(line => {
    const cols = line.split(/,|;|\t/);
    const obj = {};
    for (let i = 0; i < header.length; i++) obj[header[i]] = cols[i] !== undefined ? cols[i].trim() : '';
    return obj;
  });
  return { columns: header, rows };
}

function tryParseJSON(text) {
  try { return JSON.parse(text); } catch { return null; }
}

function makeCatalogueDescriptor(parsed, name) {
  // parsed: array of objects
  const columns = parsed.length ? Object.keys(parsed[0]) : [];
  const rows = parsed.map(obj => columns.map(k => {
    const v = obj[k];
    const n = Number(v);
    return (typeof v === 'number' || (String(v).trim() !== '' && !Number.isNaN(n))) ? n : v;
  }));

  return {
    name: name || `Imported catalogue ${new Date().toISOString()}`,
    id: `import-cat-${Date.now()}`,
    table: 'imported',
    rowCount: rows.length,
    _importColumns: columns,
    _importRows: rows,
    // Keep original objects for convenience
    _importObjects: parsed,
  };
}

function guessColumnType(name, sampleValues) {
  const n = String(name || '').toLowerCase();
  if (/\bra\b|^ra$|radeg/.test(n)) return (window.astroviewer && window.astroviewer.ColumnType) ? window.astroviewer.ColumnType.GEOM_RA : 'GEOM_RA';
  if (/\bdec\b|^dec$|decdeg/.test(n)) return (window.astroviewer && window.astroviewer.ColumnType) ? window.astroviewer.ColumnType.GEOM_DEC : 'GEOM_DEC';
  if (/^stcs?$|footprint|wkt|shape|outline|geometry|^geom$|polygon$/i.test(n)) return (window.astroviewer && window.astroviewer.ColumnType) ? window.astroviewer.ColumnType.GEOM_FOOTPRINT : 'GEOM_FOOTPRINT';
  // numeric?
  if (Array.isArray(sampleValues) && sampleValues.length) {
    const ok = sampleValues.every(v => v === null || v === '' || !Number.isNaN(Number(v)));
    if (ok) return (window.astroviewer && window.astroviewer.ColumnType) ? window.astroviewer.ColumnType.NUMBER : 'NUMBER';
  }
  return (window.astroviewer && window.astroviewer.ColumnType) ? window.astroviewer.ColumnType.STRING : 'STRING';
}

let lastParsed = null; // { filename, columns, objects }

function findColumn(columns, patterns) {
  return columns.find(c => patterns.some(pattern => pattern.test(String(c || '')))) || '';
}

function setSelectValue(id, value) {
  const sel = el(id);
  if (sel && value) sel.value = value;
}

function findDefaultMapping(columns) {
  return {
    ra: findColumn(columns, [/^ra$/i, /ra_?deg/i, /right_?ascension/i, /^lon$/i, /longitude/i]),
    dec: findColumn(columns, [/^dec$/i, /dec_?deg/i, /^lat$/i, /latitude/i]),
    name: findColumn(columns, [/^name$/i, /nome/i, /denominazione/i, /label/i, /title/i]),
    outline: findColumn(columns, [/^stcs?$/i, /footprint/i, /outline/i, /geometry/i, /^geom$/i, /^polygon$/i, /wkt/i, /shape/i]),
  };
}

function applyDefaultMappings(columns) {
  const mapping = findDefaultMapping(columns);
  setSelectValue('importMapRa', mapping.ra);
  setSelectValue('importMapDec', mapping.dec);
  setSelectValue('importMapName', mapping.name);
  setSelectValue('importMapOutline', mapping.outline);

  const typeEl = el('importType');
  if (typeEl && mapping.outline) {
    typeEl.value = 'footprint';
  }

  return mapping;
}

function populateMappingSelects(columns) {
  const ids = ['importMapRa','importMapDec','importMapName','importMapSize','importMapHue','importMapOutline'];
  ids.forEach(id => {
    const sel = el(id);
    if (!sel) return;
    sel.innerHTML = '';
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = id === 'importMapSize' || id === 'importMapHue' || id === 'importMapOutline' ? '— none —' : '— auto —';
    sel.appendChild(empty);
    columns.forEach(c => {
      const o = document.createElement('option'); o.value = c; o.textContent = c; sel.appendChild(o);
    });
  });
}

function firstFootprintCoordinate(objects, columns, outlineColumn) {
  const column = outlineColumn || findDefaultMapping(columns).outline;
  if (!column) return null;

  for (const obj of objects) {
    const stcs = String(obj[column] || '');
    const match = stcs.match(/POLYGON\s+(?:ICRS|J2000)?\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/i);
    if (!match) continue;

    const raDeg = Number(match[1]);
    const decDeg = Number(match[2]);
    if (Number.isFinite(raDeg) && Number.isFinite(decDeg)) {
      return { raDeg, decDeg };
    }
  }

  return null;
}

function tryCreateLiveCatalogue(name, desc, columns, objects, mapping = {}) {
  try {
    if (!state.AstroAPI || !window.astroviewer || !window.astroviewer.MetadataColumn || !window.astroviewer.MetadataManager) return null;
    const MetadataColumn = window.astroviewer.MetadataColumn;
    const ColumnType = window.astroviewer.ColumnType;
    const MetadataManager = window.astroviewer.MetadataManager;

    const colsMeta = columns.map((colName, idx) => {
      const samples = objects.slice(0, 10).map(o => o[colName]);
      // prefer explicit mapping
      let colType;
      if (mapping.ra && mapping.ra === colName) colType = ColumnType.GEOM_RA;
      else if (mapping.dec && mapping.dec === colName) colType = ColumnType.GEOM_DEC;
      else if (mapping.outline && mapping.outline === colName) colType = ColumnType.GEOM_FOOTPRINT;
      else if (mapping.size && mapping.size === colName) colType = ColumnType.NUMBER;
      else if (mapping.hue && mapping.hue === colName) colType = ColumnType.NUMBER;
      else if (mapping.name && mapping.name === colName) colType = ColumnType.MAIN_NAME;
      else colType = guessColumnType(colName, samples);
      return new MetadataColumn({ index: idx, name: colName, columnType: colType, unit: '' });
    });

    const mm = new MetadataManager(colsMeta);
    // apply mapping preferences
    try { if (mapping.ra) mm.selectedRaColumn = mapping.ra; } catch { }
    try { if (mapping.dec) mm.selectedDecColumn = mapping.dec; } catch { }
    try { if (mapping.size) mm.selectedShapeColumn = mapping.size; } catch { }
    try { if (mapping.hue) mm.selectedHueColumn = mapping.hue; } catch { }
    try { if (mapping.name) mm.selectedNameColumn = mapping.name; } catch { }
    const catGL = state.AstroAPI.createCatalogue(name || desc, '', 'import', mm);
    // prepare rows as arrays
    const rows = objects.map(o => columns.map(k => {
      const v = o[k];
      const n = Number(v);
      return (typeof v === 'number' || (String(v).trim() !== '' && !Number.isNaN(n))) ? n : v;
    }));
    // add sources
    if (typeof catGL.addSources === 'function') {
      catGL.addSources(rows, colsMeta);
    }
    // show and return
    try { state.AstroAPI.showCatalogue(catGL); } catch { }
    return catGL;
  } catch (e) {
    console.error('[importer] live catalogue import failed', e);
    return null;
  }
}

function makeFootprintDescriptor(parsed, name) {
  // Expect parsed to be array of footprint-like objects.
  return {
    name: name || `Imported footprints ${new Date().toISOString()}`,
    id: `import-fp-${Date.now()}`,
    table: 'imported',
    count: Array.isArray(parsed) ? parsed.length : 0,
    _importObjects: parsed,
  };
}

function tryCreateLiveFootprintSet(name, desc, columns, objects, mapping = {}) {
  try {
    if (!state.AstroAPI || !window.astroviewer || !window.astroviewer.MetadataColumn || !window.astroviewer.MetadataManager) return null;
    const MetadataColumn = window.astroviewer.MetadataColumn;
    const ColumnType = window.astroviewer.ColumnType;
    const MetadataManager = window.astroviewer.MetadataManager;

    const colsMeta = columns.map((colName, idx) => {
      const samples = objects.slice(0, 10).map(o => o[colName]);
      // prefer explicit mapping
      let colType;
      if (mapping.ra && mapping.ra === colName) colType = ColumnType.GEOM_RA;
      else if (mapping.dec && mapping.dec === colName) colType = ColumnType.GEOM_DEC;
      else if (mapping.outline && mapping.outline === colName) colType = ColumnType.GEOM_FOOTPRINT;
      else if (mapping.name && mapping.name === colName) colType = ColumnType.MAIN_NAME;
      else colType = guessColumnType(colName, samples);
      return new MetadataColumn({ index: idx, name: colName, columnType: colType, unit: '' });
    });

    const mm = new MetadataManager(colsMeta);
    // apply mapping preferences
    try { if (mapping.ra) mm.selectedRaColumn = mapping.ra; } catch { }
    try { if (mapping.dec) mm.selectedDecColumn = mapping.dec; } catch { }
    try { if (mapping.outline) mm.selectedOutlineColumn = mapping.outline; } catch { }
    try { if (mapping.name) mm.selectedNameColumn = mapping.name; } catch { }

    const fpSetGL = state.AstroAPI.createFootprintSet(name || desc, '', '', mm);
    
    // prepare rows as arrays
    const rows = objects.map(o => columns.map(k => {
      const v = o[k];
      const n = Number(v);
      return (typeof v === 'number' || (String(v).trim() !== '' && !Number.isNaN(n))) ? n : v;
    }));
    
    // add footprints
    if (typeof fpSetGL.addFootprints === 'function') {
      fpSetGL.addFootprints(rows, colsMeta);
    }
    // show and return
    try { state.AstroAPI.showFootprintSet(fpSetGL); } catch { }
    return fpSetGL;
  } catch (e) {
    console.error('[importer] live footprint import failed', e);
    return null;
  }
}

export function wireImporterControls() {
  const fileEl = el('importFile');
  const typeEl = el('importType');
  const btn = el('btnImport');
  const btnClear = el('btnClearImports');
  // read file on selection and populate mapping selects
  if (fileEl) fileEl.addEventListener('change', () => {
    const files = (fileEl && fileEl.files) ? fileEl.files : null;
    if (!files || !files.length) return setStatus('Select a file to import.');
    const f = files[0];
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = String(ev.target.result || '');
      let parsed = tryParseJSON(text);
      let columns = [];
      let objects = [];
      if (parsed == null) {
        const csv = parseCSV(text);
        objects = csv.rows;
        columns = csv.columns;
      } else {
        objects = Array.isArray(parsed) ? parsed : [parsed];
        columns = objects.length ? Object.keys(objects[0]) : [];
      }
      if (!objects || !objects.length) return setStatus('Parsed file but no rows found.');
      lastParsed = { filename: f.name || '', columns, objects };
      populateMappingSelects(columns);
      const defaults = applyDefaultMappings(columns);
      const detected = defaults.outline ? ' Detected STCS footprint column.' : '';
      setStatus(`File parsed: ${f.name} (${objects.length} rows).${detected} Choose mappings then click Import.`);
    };
    reader.onerror = () => setStatus('File read error.');
    reader.readAsText(f);
  });

  if (btn) btn.addEventListener('click', () => {
    if (!lastParsed) return setStatus('Select and parse a file first.');
    const fName = lastParsed.filename || 'Imported file';
    const type = typeEl?.value || 'catalogue';
    const mapping = {
      ra: el('importMapRa')?.value || '',
      dec: el('importMapDec')?.value || '',
      name: el('importMapName')?.value || '',
      size: el('importMapSize')?.value || '',
      hue: el('importMapHue')?.value || '',
      outline: el('importMapOutline')?.value || '',
    };

    try {
      if (type === 'catalogue') {
        const arr = lastParsed.objects;
        const columns = lastParsed.columns;
        const live = tryCreateLiveCatalogue(fName, fName, columns, arr, mapping);
        if (live) {
          state.CAT_LIST.push(live);
          const sel = el('catalogues');
          if (sel) {
            const opt = document.createElement('option');
            opt.value = live.name || live._name || live.id || `#${state.CAT_LIST.length-1}`;
            opt.textContent = live.name || live._name || opt.value;
            sel.appendChild(opt);
          }
          renderCatalogueManager();
          persistBasic();
          setStatus(`Imported catalogue and loaded: ${fName} (${arr.length} rows)`);
        } else {
          const desc = makeCatalogueDescriptor(lastParsed.objects, fName);
          state.CAT_LIST.push(desc);
          const sel = el('catalogues');
          if (sel) { const opt = document.createElement('option'); opt.value = desc.name || desc.id; opt.textContent = desc.name || desc.id; sel.appendChild(opt); }
          renderCatalogueManager();
          persistBasic();
          setStatus(`Imported catalogue: ${desc.name} (${desc.rowCount} rows)`);
        }
      } else {
        const arr = lastParsed.objects;
        const columns = lastParsed.columns;
        const live = tryCreateLiveFootprintSet(fName, fName, columns, arr, mapping);
        if (live) {
          state.FP_LIST.push(live);
          const sel = el('footprints');
          if (sel) {
            const opt = document.createElement('option');
            opt.value = live.name || live._name || live.id || `#${state.FP_LIST.length-1}`;
            opt.textContent = live.name || live._name || opt.value;
            sel.appendChild(opt);
          }
          renderFootprintManager();
          persistBasic();
          const center = firstFootprintCoordinate(arr, columns, mapping.outline);
          if (center && typeof state.AstroAPI?.goTo === 'function') {
            state.AstroAPI.goTo(center.raDeg, center.decDeg);
          }
          setStatus(`Imported footprints and loaded: ${fName} (${arr.length} items)`);
        } else {
          // fallback: create descriptor only
          const desc = makeFootprintDescriptor(arr, fName);
          state.FP_LIST.push(desc);
          const sel = el('footprints');
          if (sel) {
            const opt = document.createElement('option');
            opt.value = desc.name || desc.id;
            opt.textContent = desc.name || desc.id;
            sel.appendChild(opt);
          }
          renderFootprintManager();
          persistBasic();
          setStatus(`Imported footprints (descriptor only): ${desc.name} (${desc.count} items)`);
        }
      }
    } catch (e) {
      setStatus('Import error: ' + (e.message || e));
    }
  });

  if (btnClear) btnClear.addEventListener('click', () => {
    // Remove imported entries (heuristic: id startsWith import-)
    state.CAT_LIST = state.CAT_LIST.filter(c => !(c.id && String(c.id).startsWith('import-cat-')));
    state.FP_LIST = state.FP_LIST.filter(f => !(f.id && String(f.id).startsWith('import-fp-')));
    // Clear selects
    const catSel = el('catalogues'); if (catSel) catSel.innerHTML = '';
    const fpSel = el('footprints'); if (fpSel) fpSel.innerHTML = '';
    renderCatalogueManager();
    renderFootprintManager();
    persistBasic();
    setStatus('Cleared imported catalogues and footprints.');
  });
}

export default { wireImporterControls };
