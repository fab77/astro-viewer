/*
 * Astronomy overlay demos backed by local ESASky TAP fixtures.
 */
import { el, setStatus } from "./ui.js";
import { state } from "./state.js";
import { renderCatalogueManager } from "./catalogueManager.js";
import { footprintKey, renderFootprintManager } from "./footprintManager.js";

const CATALOGUE_FIXTURE = "./test-data/astronomy/hsc_m51_sources.json";
const FOOTPRINT_FIXTURE = "./test-data/astronomy/hst_m51_observations.json";

export function wireAstronomyOverlayDemos() {
  const astronomy = document.querySelector('[data-dev-tab-panel="astronomy"]');

  if (!astronomy || el("astronomyOverlayDemo")) return;

  const cataloguePanel = document.createElement("details");
  cataloguePanel.id = "astronomyCatalogueDemo";
  cataloguePanel.open = true;
  cataloguePanel.dataset.uiPanel = "astronomy:data";

  cataloguePanel.innerHTML = `
    <summary>Catalogue demo</summary>
    <div class="stack" style="margin-top:8px;">
      <div class="hint">
        Local HSC fixture generated from ESASky TAP around M51.
      </div>

      <button
        id="btnLoadHscCatalogueDemo"
        class="secondary"
        type="button"
      >
        Load HSC catalogue (~40)
      </button>

      <div class="hint">
        Hover a source to inspect its metadata.
      </div>
    </div>
  `;

  const overlayPanel = document.createElement("details");
  overlayPanel.id = "astronomyOverlayDemo";
  overlayPanel.open = true;
  overlayPanel.dataset.uiPanel = "astronomy:overlays";

  overlayPanel.innerHTML = `
    <summary>Observation demo</summary>
    <div class="stack" style="margin-top:8px;">
      <div class="hint">
        Local HST observation fixture generated from ESASky TAP around M51.
      </div>

      <button
        id="btnLoadHstFootprintsDemo"
        class="secondary"
        type="button"
      >
        Load HST observations (~40)
      </button>

      <div class="hint">
        Hover an observation footprint to inspect its metadata.
      </div>
    </div>
  `;

  const catalogueManager = el("catalogueManagerPanel");
  if (catalogueManager?.parentNode) {
    catalogueManager.parentNode.insertBefore(cataloguePanel, catalogueManager);
  } else {
    astronomy.appendChild(cataloguePanel);
  }

  const stcsManager = el("stcsManagerPanel");
  if (stcsManager?.parentNode) {
    stcsManager.parentNode.insertBefore(overlayPanel, stcsManager);
  } else {
    astronomy.appendChild(overlayPanel);
  }

  el("btnLoadHscCatalogueDemo")?.addEventListener(
    "click",
    loadCatalogueFixture,
  );

  el("btnLoadHstFootprintsDemo")?.addEventListener(
    "click",
    loadFootprintFixture,
  );
}

async function loadCatalogueFixture() {
  try {
    const fixture = await loadFixture(CATALOGUE_FIXTURE);
    const live = createCatalogue(fixture);
    state.CAT_LIST.push(live);
    renderCatalogueManager();
    goToFixture(fixture);
    setStatus(
      `Loaded ${fixture.rows.length} HSC catalogue sources from ESASky fixture.`,
    );
  } catch (error) {
    console.error(error);
    setStatus(`HSC fixture load failed: ${error.message || error}`);
  }
}

async function loadFootprintFixture() {
  try {
    const fixture = await loadFixture(FOOTPRINT_FIXTURE);
    const live = createFootprintSet(fixture);
    state.FP_LIST.push(live);

    const key = footprintKey(live);
    const color = "#ffaa00";
    state.FP_VIS.set(key, true);
    state.FP_COLOR.set(key, color);
    state.AstroAPI.changeFootprintSetColor?.(live, color);

    renderFootprintManager();
    goToFixture(fixture);
    setStatus(
      `Loaded ${fixture.rows.length} HST observation footprints from ESASky fixture.`,
    );
  } catch (error) {
    console.error(error);
    setStatus(`HST fixture load failed: ${error.message || error}`);
  }
}

async function loadFixture(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `${response.status} ${response.statusText}. Generate fixtures with: node scripts/generate_esasky_demo_fixtures.mjs`,
    );
  }
  const fixture = await response.json();
  if (
    !Array.isArray(fixture?.columns) ||
    !Array.isArray(fixture?.rows) ||
    fixture.rows.length === 0
  ) {
    throw new Error("Invalid or empty fixture");
  }
  return fixture;
}

function createMetadata(fixture, footprint = false) {
  const { MetadataColumn, MetadataManager, ColumnType } = window.astroviewer;
  const columns = fixture.columns.map((column, index) => {
    let columnType = ColumnType.STRING;
    if (column.name === fixture.mapping?.ra) columnType = ColumnType.GEOM_RA;
    else if (column.name === fixture.mapping?.dec)
      columnType = ColumnType.GEOM_DEC;
    else if (footprint && column.name === fixture.mapping?.footprint)
      columnType = ColumnType.GEOM_FOOTPRINT;
    else if (column.name === fixture.mapping?.name)
      columnType = ColumnType.MAIN_NAME;
    else if (column.numeric) columnType = ColumnType.NUMBER;
    return new MetadataColumn({
      index,
      name: column.name,
      columnType,
      unit: column.unit || "",
      description: column.description || "",
    });
  });
  return { columns, manager: new MetadataManager(columns) };
}

function createCatalogue(fixture) {
  const { columns, manager } = createMetadata(fixture, false);
  const catalogue = state.AstroAPI.createCatalogue(
    fixture.name || "HSC ESASky demo",
    fixture.description || "Hubble Source Catalog fixture from ESASky TAP",
    fixture.source || "https://sky.esa.int/esasky-tap/tap",
    manager,
  );
  catalogue.addSources(fixture.rows, columns);
  state.AstroAPI.showCatalogue(catalogue);
  return catalogue;
}

function createFootprintSet(fixture) {
  const { columns, manager } = createMetadata(fixture, true);
  const footprintSet = state.AstroAPI.createFootprintSet(
    fixture.name || "HST ESASky observations",
    fixture.description || "HST observation footprints from ESASky TAP",
    fixture.source || "https://sky.esa.int/esasky-tap/tap",
    manager,
  );
  footprintSet.addFootprints(fixture.rows, columns);
  state.AstroAPI.showFootprintSet(footprintSet);
  return footprintSet;
}

function goToFixture(fixture) {
  const ra = Number(fixture.center?.ra);
  const dec = Number(fixture.center?.dec);
  if (Number.isFinite(ra) && Number.isFinite(dec))
    state.AstroAPI.goTo?.(ra, dec);
}
