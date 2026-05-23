/*
 * Simple importer for JSON/CSV to populate dev `state.CAT_LIST` and `state.FP_LIST`.
 * Supports: JSON array of objects, or CSV with headers.
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
  if (/footprint|poly|wkt|stc|shape|outline/i.test(n)) return (window.astroviewer && window.astroviewer.ColumnType) ? window.astroviewer.ColumnType.GEOM_FOOTPRINT : 'GEOM_FOOTPRINT';
  // numeric?
  if (Array.isArray(sampleValues) && sampleValues.length) {
    const ok = sampleValues.every(v => v === null || v === '' || !Number.isNaN(Number(v)));
    if (ok) return (window.astroviewer && window.astroviewer.ColumnType) ? window.astroviewer.ColumnType.NUMBER : 'NUMBER';
  }
  return (window.astroviewer && window.astroviewer.ColumnType) ? window.astroviewer.ColumnType.STRING : 'STRING';
}

function tryCreateLiveCatalogue(name, desc, columns, objects) {
  try {
    if (!state.AstroAPI || !window.astroviewer || !window.astroviewer.MetadataColumn || !window.astroviewer.MetadataManager) return null;
    const MetadataColumn = window.astroviewer.MetadataColumn;
    const ColumnType = window.astroviewer.ColumnType;
    const MetadataManager = window.astroviewer.MetadataManager;

    const colsMeta = columns.map((colName, idx) => {
      const samples = objects.slice(0, 10).map(o => o[colName]);
      const colType = guessColumnType(colName, samples);
      return new MetadataColumn({ index: idx, name: colName, columnType: colType, unit: '' });
    });

    const mm = new MetadataManager(colsMeta);
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

export function wireImporterControls() {
  const fileEl = el('importFile');
  const typeEl = el('importType');
  const btn = el('btnImport');
  const btnClear = el('btnClearImports');

  if (btn) btn.addEventListener('click', () => {
    const files = (fileEl && fileEl.files) ? fileEl.files : null;
    if (!files || !files.length) return setStatus('Select a file to import.');
    const f = files[0];
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = String(ev.target.result || '');
      let parsed = tryParseJSON(text);
      if (parsed == null) {
        const csv = parseCSV(text);
        parsed = csv.rows;
      }
      if (!parsed) return setStatus('Unable to parse file.');

      const type = typeEl?.value || 'catalogue';
      try {
        if (type === 'catalogue') {
          // ensure array
          const arr = Array.isArray(parsed) ? parsed : [parsed];
          // columns inferred from first object
          const columns = arr.length ? Object.keys(arr[0]) : [];
          // try to create a live CatalogueGL via AstroAPI when possible
          const live = tryCreateLiveCatalogue(f.name || 'Imported catalogue', f.name || '', columns, arr);
          if (live) {
            // store the live object in CAT_LIST
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
            setStatus(`Imported catalogue and loaded: ${f.name} (${arr.length} rows)`);
          } else {
            const desc = makeCatalogueDescriptor(arr, f.name || 'Imported catalogue');
            state.CAT_LIST.push(desc);
            const sel = el('catalogues');
            if (sel) {
              const opt = document.createElement('option');
              opt.value = desc.name || desc.id;
              opt.textContent = desc.name || desc.id;
              sel.appendChild(opt);
            }
            renderCatalogueManager();
            persistBasic();
            setStatus(`Imported catalogue: ${desc.name} (${desc.rowCount} rows)`);
          }
        } else {
          const arr = Array.isArray(parsed) ? parsed : [parsed];
          const desc = makeFootprintDescriptor(arr, f.name || 'Imported footprints');
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
          setStatus(`Imported footprints: ${desc.name} (${desc.count} items)`);
        }
      } catch (e) {
        setStatus('Import error: ' + (e.message || e));
      }
    };
    reader.onerror = () => setStatus('File read error.');
    reader.readAsText(f);
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
