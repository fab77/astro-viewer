/*
 * Earth Observation GeoJSON demos.
 *
 * Demo fixtures intentionally use the same importEarthGeoJSON() workflow as
 * user-selected files; there is no demo-specific renderer path.
 */
import { el, setStatus } from "./ui.js";
import { importEarthGeoJSON } from "./importer.js";

const EARTH_DEMOS = [
  {
    id: "btnLoadEarthItalyPointsDemo",
    label: "Load Italy cities (10 points)",
    fileName: "earth-demo-italy-points.geojson",
    url: "./test-data/earth/earth-demo-italy-points.geojson",
  },
  {
    id: "btnLoadEarthItalyRegionsDemo",
    label: "Load Italy regions (20)",
    fileName: "limits_IT_regions.geojson",
    url: "./test-data/earth/limits_IT_regions.geojson",
  },
  {
    id: "btnLoadEarthSpainRegionsDemo",
    label: "Load Spain regions",
    fileName: "spain_regions.geojson",
    url: "./test-data/earth/spain_regions.geojson",
  },
  {
    id: "btnLoadEarthItalyLinesDemo",
    label: "Load Italy routes (3 lines)",
    fileName: "earth-demo-italy-lines.geojson",
    url: "./test-data/earth/earth-demo-italy-lines.geojson",
  },
];

export function wireEarthGeoJSONDemos() {
  const earth = document.querySelector('[data-dev-tab-panel="earth"]');
  if (!earth || el("earthGeoJSONDemo")) return;

  const panel = document.createElement("details");
  panel.id = "earthGeoJSONDemo";
  panel.open = true;
  panel.dataset.uiPanel = "earth:data";
  panel.innerHTML = `
    <summary>GeoJSON demos</summary>
    <div class="stack" style="margin-top:8px;">
      <div class="hint">
        Local fixtures using the same automatic GeoJSON geometry routing as the importer.
      </div>
      ${EARTH_DEMOS.map((demo) => `
        <button id="${demo.id}" class="secondary" type="button">${demo.label}</button>
      `).join("")}
      <div class="hint">
        Points and polygons support hover/selection. Lines are display-only in 3.12.
      </div>
    </div>
  `;

  const importPanel = el("earthImportPanel");
  if (importPanel?.parentNode) {
    importPanel.parentNode.insertBefore(panel, importPanel);
  } else {
    earth.appendChild(panel);
  }

  for (const demo of EARTH_DEMOS) {
    el(demo.id)?.addEventListener("click", () => loadEarthDemo(demo));
  }
}

async function loadEarthDemo(demo) {
  try {
    const response = await fetch(demo.url);
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    const geojson = await response.json();
    const result = importEarthGeoJSON(demo.fileName, geojson);
    setStatus(`Loaded Earth demo: ${demo.fileName} (${result.summary})`);
  } catch (error) {
    console.error(error);
    setStatus(
      `Earth demo load failed: ${demo.fileName} — ${error.message || error}`,
    );
  }
}
