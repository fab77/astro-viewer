/*
 * Simple importer for JSON/CSV to populate dev `state.CAT_LIST` and `state.FP_LIST`.
 * Supports: JSON array of objects, or CSV with headers.
 * Note: Footprint column should contain STCS format (e.g., POLYGON lon1 lat1 lon2 lat2 ...)
 */
import { el, setStatus } from "./ui.js";
import { state, persistBasic } from "./state.js";
import { renderCatalogueManager } from "./catalogueManager.js";
import { renderFootprintManager } from "./footprintManager.js";

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
  if (!lines.length) return { columns: [], rows: [] };
  const header = lines[0].split(/,|;|\t/).map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const cols = line.split(/,|;|\t/);
    const obj = {};
    for (let i = 0; i < header.length; i++)
      obj[header[i]] = cols[i] !== undefined ? cols[i].trim() : "";
    return obj;
  });
  return { columns: header, rows };
}

function tryParseJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function makeCatalogueDescriptor(parsed, name) {
  // parsed: array of objects
  const columns = parsed.length ? Object.keys(parsed[0]) : [];
  const rows = parsed.map((obj) =>
    columns.map((k) => {
      const v = obj[k];
      const n = Number(v);
      return typeof v === "number" ||
        (String(v).trim() !== "" && !Number.isNaN(n))
        ? n
        : v;
    }),
  );

  return {
    name: name || `Imported catalogue ${new Date().toISOString()}`,
    id: `import-cat-${Date.now()}`,
    table: "imported",
    rowCount: rows.length,
    _importColumns: columns,
    _importRows: rows,
    // Keep original objects for convenience
    _importObjects: parsed,
  };
}

function guessColumnType(name, sampleValues) {
  const n = String(name || "").toLowerCase();
  if (/\bra\b|^ra$|radeg/.test(n))
    return window.astroviewer && window.astroviewer.ColumnType
      ? window.astroviewer.ColumnType.GEOM_RA
      : "GEOM_RA";
  if (/\bdec\b|^dec$|decdeg/.test(n))
    return window.astroviewer && window.astroviewer.ColumnType
      ? window.astroviewer.ColumnType.GEOM_DEC
      : "GEOM_DEC";
  if (/^stcs?$|footprint|wkt|shape|outline|geometry|^geom$|polygon$/i.test(n))
    return window.astroviewer && window.astroviewer.ColumnType
      ? window.astroviewer.ColumnType.GEOM_FOOTPRINT
      : "GEOM_FOOTPRINT";
  // numeric?
  if (Array.isArray(sampleValues) && sampleValues.length) {
    const ok = sampleValues.every(
      (v) => v === null || v === "" || !Number.isNaN(Number(v)),
    );
    if (ok)
      return window.astroviewer && window.astroviewer.ColumnType
        ? window.astroviewer.ColumnType.NUMBER
        : "NUMBER";
  }
  return window.astroviewer && window.astroviewer.ColumnType
    ? window.astroviewer.ColumnType.STRING
    : "STRING";
}

let lastAstronomyParsed = null;
let lastEarthParsed = null;

function isGeoJSON(value) {
  return (
    Boolean(window.astroviewer?.GeoJSONParser?.isGeoJSON?.(value)) ||
    Boolean(
      value &&
      typeof value === "object" &&
      [
        "FeatureCollection",
        "Feature",
        "Polygon",
        "MultiPolygon",
        "GeometryCollection",
      ].includes(value.type),
    )
  );
}

function geoJSONPropertyColumns(geojson) {
  const features =
    geojson?.type === "FeatureCollection" ? geojson.features : [geojson];
  const columns = new Set();
  for (const feature of features || []) {
    const properties = feature?.type === "Feature" ? feature.properties : {};
    Object.keys(properties || {}).forEach((key) => columns.add(key));
  }
  return Array.from(columns);
}

function geoJSONFeatureCount(geojson) {
  if (geojson?.type === "FeatureCollection")
    return geojson.features?.length || 0;
  return isGeoJSON(geojson) ? 1 : 0;
}

function findColumn(columns, patterns) {
  return (
    columns.find((c) =>
      patterns.some((pattern) => pattern.test(String(c || ""))),
    ) || ""
  );
}

function setSelectValue(id, value) {
  const sel = el(id);
  if (sel && value) sel.value = value;
}

function findDefaultMapping(columns) {
  return {
    ra: findColumn(columns, [
      /^ra$/i,
      /ra_?deg/i,
      /right_?ascension/i,
      /^lon$/i,
      /longitude/i,
    ]),
    dec: findColumn(columns, [/^dec$/i, /dec_?deg/i, /^lat$/i, /latitude/i]),
    name: findColumn(columns, [
      /^name$/i,
      /nome/i,
      /denominazione/i,
      /label/i,
      /title/i,
    ]),
    outline: findColumn(columns, [
      /^stcs?$/i,
      /footprint/i,
      /outline/i,
      /geometry/i,
      /^geom$/i,
      /^polygon$/i,
      /wkt/i,
      /shape/i,
    ]),
    mediaSrc: findColumn(columns, [
      /^media_?src$/i,
      /^media_?url$/i,
      /^icon_?url$/i,
      /^image_?url$/i,
      /^sprite_?url$/i,
      /^thumbnail$/i,
      /^thumb_?url$/i,
    ]),
    mediaType: findColumn(columns, [
      /^media_?type$/i,
      /^marker_?type$/i,
      /^symbol_?type$/i,
    ]),
    mediaScale: findColumn(columns, [
      /^media_?scale$/i,
      /^marker_?scale$/i,
      /^icon_?scale$/i,
      /^image_?scale$/i,
    ]),
    mediaRotation: findColumn(columns, [
      /^media_?rotation$/i,
      /^marker_?rotation$/i,
      /^icon_?rotation$/i,
      /^rotation_?deg$/i,
      /^angle$/i,
    ]),
    mediaOpacity: findColumn(columns, [
      /^media_?opacity$/i,
      /^marker_?opacity$/i,
      /^icon_?opacity$/i,
      /^opacity$/i,
    ]),
  };
}

function applyAstronomyDefaultMappings(columns) {
  const mapping = findDefaultMapping(columns);

  setSelectValue("astronomyImportMapRa", mapping.ra);
  setSelectValue("astronomyImportMapDec", mapping.dec);
  setSelectValue("astronomyImportMapName", mapping.name);
  setSelectValue("astronomyImportMapOutline", mapping.outline);
  setSelectValue("astronomyImportMapMediaSrc", mapping.mediaSrc);
  setSelectValue("astronomyImportMapMediaType", mapping.mediaType);
  setSelectValue("astronomyImportMapMediaScale", mapping.mediaScale);
  setSelectValue("astronomyImportMapMediaRotation", mapping.mediaRotation);
  setSelectValue("astronomyImportMapMediaOpacity", mapping.mediaOpacity);

  const typeEl = el("astronomyImportType");

  if (typeEl && mapping.outline) {
    typeEl.value = "footprint";
  }

  return mapping;
}

function populateAstronomyMappingSelects(columns) {
  const ids = [
    "astronomyImportMapRa",
    "astronomyImportMapDec",
    "astronomyImportMapName",
    "astronomyImportMapSize",
    "astronomyImportMapHue",
    "astronomyImportMapOutline",
    "astronomyImportMapMediaSrc",
    "astronomyImportMapMediaType",
    "astronomyImportMapMediaScale",
    "astronomyImportMapMediaRotation",
    "astronomyImportMapMediaOpacity",
  ];

  ids.forEach((id) => {
    const sel = el(id);
    if (!sel) return;

    sel.innerHTML = "";

    const empty = document.createElement("option");
    empty.value = "";

    empty.textContent =
      id === "astronomyImportMapSize" ||
      id === "astronomyImportMapHue" ||
      id === "astronomyImportMapOutline" ||
      id.startsWith("astronomyImportMapMedia")
        ? "— none —"
        : "— auto —";

    sel.appendChild(empty);

    columns.forEach((column) => {
      const option = document.createElement("option");
      option.value = column;
      option.textContent = column;
      sel.appendChild(option);
    });
  });
}

function firstFootprintCoordinate(objects, columns, outlineColumn) {
  const column = outlineColumn || findDefaultMapping(columns).outline;
  if (!column) return null;

  for (const obj of objects) {
    const stcs = String(obj[column] || "");
    const match = stcs.match(
      /POLYGON\s+(?:ICRS|J2000)?\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/i,
    );
    if (!match) continue;

    const raDeg = Number(match[1]);
    const decDeg = Number(match[2]);
    if (Number.isFinite(raDeg) && Number.isFinite(decDeg)) {
      return { raDeg, decDeg };
    }
  }

  return null;
}

function firstGeoJSONCoordinate(features) {
  for (const feature of features || []) {
    for (const polygon of feature.polygons || []) {
      const point = polygon[0];
      if (
        point &&
        Number.isFinite(point.lonDeg) &&
        Number.isFinite(point.latDeg)
      ) {
        return { lonDeg: point.lonDeg, latDeg: point.latDeg };
      }
    }
  }
  return null;
}

function tryCreateLiveCatalogue(name, desc, columns, objects, mapping = {}) {
  try {
    if (
      !state.AstroAPI ||
      !window.astroviewer ||
      !window.astroviewer.MetadataColumn ||
      !window.astroviewer.MetadataManager
    )
      return null;
    const MetadataColumn = window.astroviewer.MetadataColumn;
    const ColumnType = window.astroviewer.ColumnType;
    const MetadataManager = window.astroviewer.MetadataManager;

    const colsMeta = columns.map((colName, idx) => {
      const samples = objects.slice(0, 10).map((o) => o[colName]);
      // prefer explicit mapping
      let colType;
      if (mapping.ra && mapping.ra === colName) colType = ColumnType.GEOM_RA;
      else if (mapping.dec && mapping.dec === colName)
        colType = ColumnType.GEOM_DEC;
      else if (mapping.outline && mapping.outline === colName)
        colType = ColumnType.GEOM_FOOTPRINT;
      else if (mapping.size && mapping.size === colName)
        colType = ColumnType.NUMBER;
      else if (mapping.hue && mapping.hue === colName)
        colType = ColumnType.NUMBER;
      else if (mapping.name && mapping.name === colName)
        colType = ColumnType.MAIN_NAME;
      else colType = guessColumnType(colName, samples);
      return new MetadataColumn({
        index: idx,
        name: colName,
        columnType: colType,
        unit: "",
      });
    });

    const mm = new MetadataManager(colsMeta);
    // apply mapping preferences
    try {
      if (mapping.ra) mm.selectedRaColumn = mapping.ra;
    } catch {}
    try {
      if (mapping.dec) mm.selectedDecColumn = mapping.dec;
    } catch {}
    try {
      if (mapping.size) mm.selectedShapeColumn = mapping.size;
    } catch {}
    try {
      if (mapping.hue) mm.selectedHueColumn = mapping.hue;
    } catch {}
    try {
      if (mapping.name) mm.selectedNameColumn = mapping.name;
    } catch {}
    const catGL = state.AstroAPI.createCatalogue(
      name || desc,
      "",
      "import",
      mm,
    );
    // prepare rows as arrays
    const rows = objects.map((o) =>
      columns.map((k) => {
        const v = o[k];
        const n = Number(v);
        return typeof v === "number" ||
          (String(v).trim() !== "" && !Number.isNaN(n))
          ? n
          : v;
      }),
    );
    // add sources
    if (typeof catGL.addSources === "function") {
      catGL.addSources(rows, colsMeta, {
        mediaColumns: {
          type: mapping.mediaType || "",
          src: mapping.mediaSrc || "",
          scale: mapping.mediaScale || "",
          rotation: mapping.mediaRotation || "",
          opacity: mapping.mediaOpacity || "",
        },
      });
    }
    // show and return
    try {
      state.AstroAPI.showCatalogue(catGL);
    } catch {}
    return catGL;
  } catch (e) {
    console.error("[importer] live catalogue import failed", e);
    return null;
  }
}

function makeFootprintDescriptor(parsed, name) {
  // Expect parsed to be array of footprint-like objects.
  return {
    name: name || `Imported footprints ${new Date().toISOString()}`,
    id: `import-fp-${Date.now()}`,
    table: "imported",
    count: Array.isArray(parsed) ? parsed.length : 0,
    _importObjects: parsed,
  };
}

function tryCreateLiveFootprintSet(name, desc, columns, objects, mapping = {}) {
  try {
    if (
      !state.AstroAPI ||
      !window.astroviewer ||
      !window.astroviewer.MetadataColumn ||
      !window.astroviewer.MetadataManager
    )
      return null;
    const MetadataColumn = window.astroviewer.MetadataColumn;
    const ColumnType = window.astroviewer.ColumnType;
    const MetadataManager = window.astroviewer.MetadataManager;

    const colsMeta = columns.map((colName, idx) => {
      const samples = objects.slice(0, 10).map((o) => o[colName]);
      // prefer explicit mapping
      let colType;
      if (mapping.ra && mapping.ra === colName) colType = ColumnType.GEOM_RA;
      else if (mapping.dec && mapping.dec === colName)
        colType = ColumnType.GEOM_DEC;
      else if (mapping.outline && mapping.outline === colName)
        colType = ColumnType.GEOM_FOOTPRINT;
      else if (mapping.name && mapping.name === colName)
        colType = ColumnType.MAIN_NAME;
      else colType = guessColumnType(colName, samples);
      return new MetadataColumn({
        index: idx,
        name: colName,
        columnType: colType,
        unit: "",
      });
    });

    const mm = new MetadataManager(colsMeta);
    // apply mapping preferences
    try {
      if (mapping.ra) mm.selectedRaColumn = mapping.ra;
    } catch {}
    try {
      if (mapping.dec) mm.selectedDecColumn = mapping.dec;
    } catch {}
    try {
      if (mapping.outline) mm.selectedOutlineColumn = mapping.outline;
    } catch {}
    try {
      if (mapping.name) mm.selectedNameColumn = mapping.name;
    } catch {}

    const fpSetGL = state.AstroAPI.createFootprintSet(name || desc, "", "", mm);

    // prepare rows as arrays
    const rows = objects.map((o) =>
      columns.map((k) => {
        const v = o[k];
        const n = Number(v);
        return typeof v === "number" ||
          (String(v).trim() !== "" && !Number.isNaN(n))
          ? n
          : v;
      }),
    );

    // add footprints
    if (typeof fpSetGL.addFootprints === "function") {
      fpSetGL.addFootprints(rows, colsMeta);
    }
    // show and return
    try {
      state.AstroAPI.showFootprintSet(fpSetGL);
    } catch {}
    return fpSetGL;
  } catch (e) {
    console.error("[importer] live footprint import failed", e);
    return null;
  }
}

function tryCreateLiveGeoJSONFootprintSet(name, geojson) {
  try {
    console.time("[earth import] total");

    console.time("[earth import] parseGeoJSON");
    const features = window.astroviewer.GeoJSONParser.parseGeoJSON(geojson);
    console.timeEnd("[earth import] parseGeoJSON");

    console.log(
      "[earth import] features:",
      features.length,
      "points:",
      features.reduce(
        (total, feature) =>
          total +
          feature.polygons.reduce((sum, polygon) => sum + polygon.length, 0),
        0,
      ),
    );

    console.time("[earth import] createTerraFootprintSet");
    const fpSetGL = state.AstroAPI.createTerraFootprintSet(
      name,
      "",
      "",
      new window.astroviewer.MetadataManager([]),
    );
    console.timeEnd("[earth import] createTerraFootprintSet");

    console.time("[earth import] addGeoJSONFeatures");
    fpSetGL.addGeoJSONFeatures(features);
    console.timeEnd("[earth import] addGeoJSONFeatures");

    console.time("[earth import] showTerraFootprintSet");
    state.AstroAPI.showTerraFootprintSet(fpSetGL);
    console.timeEnd("[earth import] showTerraFootprintSet");

    const center = firstGeoJSONCoordinate(features);

    if (center && typeof state.AstroAPI.goTo === "function") {
      state.AstroAPI.goTo(center.lonDeg, center.latDeg);
    }

    console.timeEnd("[earth import] total");

    return fpSetGL;
  } catch (e) {
    console.error("[importer] live GeoJSON footprint import failed", e);

    return null;
  }
}

export function wireImporterControls() {
  wireAstronomyImporter();
  wireEarthImporter();
}

function wireAstronomyImporter() {
  const fileEl = el("astronomyImportFile");
  const typeEl = el("astronomyImportType");
  const btn = el("btnAstronomyImport");
  const btnClear = el("btnClearAstronomyImports");

  fileEl?.addEventListener("change", () => {
    const files = fileEl.files;

    if (!files?.length) {
      return setStatus("Select an astronomy file to import.");
    }

    const file = files[0];
    const reader = new FileReader();

    reader.onload = (ev) => {
      const text = String(ev.target.result || "");
      const parsedJSON = tryParseJSON(text);

      let columns = [];
      let objects = [];

      if (parsedJSON == null) {
        const csv = parseCSV(text);
        objects = csv.rows;
        columns = csv.columns;
      } else {
        if (isGeoJSON(parsedJSON)) {
          return setStatus(
            "GeoJSON belongs to the Earth Observation importer.",
          );
        }

        objects = Array.isArray(parsedJSON) ? parsedJSON : [parsedJSON];

        columns = objects.length ? Object.keys(objects[0]) : [];
      }

      if (!objects.length) {
        return setStatus("Parsed astronomy file but no rows found.");
      }

      lastAstronomyParsed = {
        filename: file.name || "",
        columns,
        objects,
      };

      populateAstronomyMappingSelects(columns);

      const defaults = applyAstronomyDefaultMappings(columns);

      const detected = defaults.outline
        ? " Detected STCS footprint column."
        : "";

      setStatus(
        `Astronomy file parsed: ${file.name} (${objects.length} rows).${detected} Choose mappings then click Import.`,
      );
    };

    reader.onerror = () => {
      setStatus("Astronomy file read error.");
    };

    reader.readAsText(file);
  });

  btn?.addEventListener("click", () => {
    if (!lastAstronomyParsed) {
      return setStatus("Select and parse an astronomy file first.");
    }

    const fileName = lastAstronomyParsed.filename || "Imported astronomy file";

    const type = typeEl?.value || "catalogue";

    const mapping = {
      ra: el("astronomyImportMapRa")?.value || "",
      dec: el("astronomyImportMapDec")?.value || "",
      name: el("astronomyImportMapName")?.value || "",
      size: el("astronomyImportMapSize")?.value || "",
      hue: el("astronomyImportMapHue")?.value || "",
      outline: el("astronomyImportMapOutline")?.value || "",
      mediaSrc: el("astronomyImportMapMediaSrc")?.value || "",
      mediaType: el("astronomyImportMapMediaType")?.value || "",
      mediaScale: el("astronomyImportMapMediaScale")?.value || "",
      mediaRotation: el("astronomyImportMapMediaRotation")?.value || "",
      mediaOpacity: el("astronomyImportMapMediaOpacity")?.value || "",
    };

    try {
      if (type === "catalogue") {
        importAstronomyCatalogue(fileName, lastAstronomyParsed, mapping);
      } else {
        importAstronomyFootprints(fileName, lastAstronomyParsed, mapping);
      }
    } catch (e) {
      setStatus("Astronomy import error: " + (e.message || e));
    }
  });

  btnClear?.addEventListener("click", () => {
    state.CAT_LIST = state.CAT_LIST.filter(
      (catalogue) =>
        !(catalogue.id && String(catalogue.id).startsWith("import-cat-")),
    );

    state.FP_LIST = state.FP_LIST.filter(
      (footprint) =>
        !(footprint.id && String(footprint.id).startsWith("import-fp-")),
    );

    lastAstronomyParsed = null;

    renderCatalogueManager();
    renderFootprintManager();
    persistBasic();

    setStatus("Cleared imported astronomy catalogues and footprints.");
  });
}

function wireEarthImporter() {
  const fileEl = el("earthImportFile");
  const btn = el("btnEarthImport");
  const btnClear = el("btnClearEarthImports");

  fileEl?.addEventListener("change", () => {
    const files = fileEl.files;

    if (!files?.length) {
      return setStatus("Select a GeoJSON file to import.");
    }

    const file = files[0];
    const reader = new FileReader();

    reader.onload = (ev) => {
      const text = String(ev.target.result || "");
      const parsed = tryParseJSON(text);

      if (!parsed || !isGeoJSON(parsed)) {
        lastEarthParsed = null;

        return setStatus("Earth Observation importer expects GeoJSON.");
      }

      lastEarthParsed = {
        filename: file.name || "",
        geojson: parsed,
      };

      setStatus(
        `Earth GeoJSON parsed: ${file.name} (${geoJSONFeatureCount(parsed)} features). Click Import.`,
      );
    };

    reader.onerror = () => {
      setStatus("GeoJSON file read error.");
    };

    reader.readAsText(file);
  });

  btn?.addEventListener("click", () => {
    if (!lastEarthParsed?.geojson) {
      return setStatus("Select and parse a GeoJSON file first.");
    }

    const fileName = lastEarthParsed.filename || "Imported GeoJSON";

    try {
      const live = tryCreateLiveGeoJSONFootprintSet(
        fileName,
        lastEarthParsed.geojson,
      );

      if (!live) {
        return setStatus(`GeoJSON import failed: ${fileName}`);
      }

      state.FP_LIST.push(live);

      renderFootprintManager();
      persistBasic();

      setStatus(
        `Imported Earth GeoJSON: ${fileName} (${geoJSONFeatureCount(lastEarthParsed.geojson)} features)`,
      );
    } catch (e) {
      setStatus("Earth import error: " + (e.message || e));
    }
  });

  btnClear?.addEventListener("click", () => {
    lastEarthParsed = null;

    setStatus("Cleared Earth importer selection.");
  });
}

function importAstronomyCatalogue(fileName, parsed, mapping) {
  const { objects, columns } = parsed;

  const live = tryCreateLiveCatalogue(
    fileName,
    fileName,
    columns,
    objects,
    mapping,
  );

  if (live) {
    state.CAT_LIST.push(live);
    renderCatalogueManager();
    persistBasic();

    setStatus(
      `Imported astronomy catalogue: ${fileName} (${objects.length} rows)`,
    );

    return;
  }

  const descriptor = makeCatalogueDescriptor(objects, fileName);

  state.CAT_LIST.push(descriptor);

  renderCatalogueManager();
  persistBasic();

  setStatus(
    `Imported astronomy catalogue descriptor: ${descriptor.name} (${descriptor.rowCount} rows)`,
  );
}

function importAstronomyFootprints(fileName, parsed, mapping) {
  const { objects, columns } = parsed;

  const live = tryCreateLiveFootprintSet(
    fileName,
    fileName,
    columns,
    objects,
    mapping,
  );

  if (live) {
    state.FP_LIST.push(live);

    renderFootprintManager();
    persistBasic();

    const center = firstFootprintCoordinate(objects, columns, mapping.outline);

    if (center && typeof state.AstroAPI?.goTo === "function") {
      state.AstroAPI.goTo(center.raDeg, center.decDeg);
    }

    setStatus(
      `Imported astronomy footprints: ${fileName} (${objects.length} items)`,
    );

    return;
  }

  const descriptor = makeFootprintDescriptor(objects, fileName);

  state.FP_LIST.push(descriptor);

  renderFootprintManager();
  persistBasic();

  setStatus(
    `Imported astronomy footprints descriptor: ${descriptor.name} (${descriptor.count} items)`,
  );
}

export default { wireImporterControls };
