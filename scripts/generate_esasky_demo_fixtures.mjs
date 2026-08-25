import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TAP_SYNC = "https://sky.esa.int/esasky-tap/tap/sync";
const CENTER = {
  ra: 202.469575,
  dec: 47.195258,
  radiusDeg: 0.35,
  label: "M51",
};
const LIMIT = 40;
const outputDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../src/html/test-data/astronomy",
);

const NUMERIC_TYPES = new Set([
  "SMALLINT",
  "INTEGER",
  "BIGINT",
  "REAL",
  "FLOAT",
  "DOUBLE",
  "short",
  "int",
  "long",
  "float",
  "double",
]);

async function tapQuery(query) {
  const body = new URLSearchParams({
    REQUEST: "doQuery",
    LANG: "ADQL",
    FORMAT: "csv",
    QUERY: query,
  });
  const response = await fetch(TAP_SYNC, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body,
  });
  if (!response.ok)
    throw new Error(`ESASky TAP ${response.status}: ${await response.text()}`);
  return parseCsv(await response.text());
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  if (!rows.length) return { columns: [], rows: [] };
  const columns = rows.shift();
  return { columns, rows: rows.filter((r) => r.some((v) => v !== "")) };
}

function objects(result) {
  return result.rows.map((row) =>
    Object.fromEntries(result.columns.map((name, i) => [name, row[i] ?? ""])),
  );
}

async function descriptor(category, mission) {
  const q = `SELECT d.*, ra.column_name AS ra, dec.column_name AS dec
FROM descriptors d
JOIN TAP_SCHEMA.columns ra ON d.table_name = ra.table_name
JOIN TAP_SCHEMA.columns dec ON d.table_name = dec.table_name
WHERE d.category = '${category}'
  AND d.mission = '${mission}'
  AND ra.ucd = 'pos.eq.ra;meta.main'
  AND dec.ucd = 'pos.eq.dec;meta.main'`;
  const rows = objects(await tapQuery(q));
  if (!rows.length)
    throw new Error(`No ESASky descriptor found for ${category}/${mission}`);
  return rows[0];
}

async function columnMetadata(tableName) {
  const escaped = tableName.replaceAll("'", "''");
  const q = `SELECT column_name, datatype, unit, description, ucd
FROM TAP_SCHEMA.columns
WHERE table_name = '${escaped}'`;
  return objects(await tapQuery(q));
}

function normalizeColumns(resultColumns, metadata) {
  const byName = new Map(metadata.map((c) => [c.column_name, c]));
  return resultColumns.map((name) => {
    const m = byName.get(name) || {};
    return {
      name,
      numeric: NUMERIC_TYPES.has(m.datatype),
      unit: m.unit || "",
      description: m.description || "",
      ucd: m.ucd || "",
    };
  });
}

function normalizeRows(result, columns) {
  return result.rows.map((row) =>
    columns.map((column, i) => {
      const value = row[i] ?? "";
      if (column.numeric && value !== "" && Number.isFinite(Number(value)))
        return Number(value);
      return value;
    }),
  );
}

function findNameColumn(columns) {
  const mainId = columns.find(
    (c) => /meta\.id/.test(c.ucd) && /meta\.main/.test(c.ucd),
  );
  if (mainId) return mainId.name;
  const named = columns.find((c) =>
    /(^|_)(name|source_id|designation|obsid|observation_id)($|_)/i.test(c.name),
  );
  return named?.name || "";
}

function findFootprintColumn(columns) {
  return (
    columns.find((c) => /^stc_s$/i.test(c.name))?.name ||
    columns.find((c) => /^(s_region|footprint|fov)$/i.test(c.name))?.name ||
    columns.find((c) => /(footprint|region|stc|fov)/i.test(c.name))?.name ||
    ""
  );
}

async function buildFixture({
  category,
  mission,
  filename,
  displayName,
  description,
}) {
  const d = await descriptor(category, mission);
  const table = d.table_name;
  const metadata = await columnMetadata(table);
  const intersectPolygon =
    String(d.intersect_polygon_query).toLowerCase() === "true" ||
    String(d.intersect_polygon_query) === "1";
  const where = intersectPolygon
    ? `1=INTERSECTS(CIRCLE('ICRS', ${CENTER.ra}, ${CENTER.dec}, ${CENTER.radiusDeg}), fov)`
    : `1=CONTAINS(POINT('ICRS', ${d.ra}, ${d.dec}), CIRCLE('ICRS', ${CENTER.ra}, ${CENTER.dec}, ${CENTER.radiusDeg}))`;
  const result = await tapQuery(
    `SELECT TOP ${LIMIT} * FROM ${table} WHERE ${where}`,
  );
  if (!result.rows.length)
    throw new Error(`No rows returned from ${table} around ${CENTER.label}`);

  const columns = normalizeColumns(result.columns, metadata);
  const footprint =
    category === "observations" ? findFootprintColumn(columns) : "";
  if (category === "observations" && !footprint) {
    throw new Error(
      `Observation table ${table} returned no footprint/STC-S column`,
    );
  }

  const fixture = {
    name: displayName,
    description,
    source: TAP_SYNC.replace("/sync", ""),
    generatedFrom: {
      table,
      category,
      mission,
      center: CENTER,
      queryLimit: LIMIT,
    },
    center: { ra: CENTER.ra, dec: CENTER.dec },
    mapping: {
      ra: d.ra,
      dec: d.dec,
      name: findNameColumn(columns),
      ...(footprint ? { footprint } : {}),
    },
    columns,
    rows: normalizeRows(result, columns),
  };

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    path.join(outputDir, filename),
    JSON.stringify(fixture, null, 2) + "\n",
  );
  console.log(`${filename}: ${fixture.rows.length} rows from ${table}`);
}

await buildFixture({
  category: "catalogues",
  mission: "HSC",
  filename: "hsc_m51_sources.json",
  displayName: "HSC sources around M51",
  description:
    "Hubble Source Catalog sources retrieved from the ESASky TAP service around M51.",
});

await buildFixture({
  category: "observations",
  mission: "HST-OPTICAL",
  filename: "hst_m51_observations.json",
  displayName: "HST optical observations around M51",
  description:
    "HST optical observations and real STC-S footprints retrieved from the ESASky TAP service around M51.",
});
