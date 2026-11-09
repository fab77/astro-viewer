# AstroViewer

**AstroViewer** is a lightweight, framework-independent JavaScript/TypeScript library for interactive 3D visualization and analysis of astronomical and Earth observation data.

It provides a WebGL2-based rendering engine and a set of reusable APIs for building scientific visualization applications directly in the browser.

AstroViewer is developed from scratch without depending on visualization frameworks. It integrates astronomical standards and geospatial/Earth observation technologies within the same rendering environment.

## Features

### Astronomy

- Interactive celestial sphere visualization
- HiPS (Hierarchical Progressive Surveys)
- Multiple simultaneous HiPS layers
- Independent HiPS layer opacity
- HiPS layer activation and removal
- Runtime HiPS format switching
- HiPS JPEG/PNG image tiles
- HiPS FITS tiles
- HiPS coverage handling
- HEALPix hierarchical sky tessellation
- FITS astronomical data support
- FITS display scaling (linear, sqrt, log, asinh, gamma)
- FITS display range modes
- Runtime color maps
- Astronomical coordinate systems and transformations
- Field-of-view calculations
- Interactive navigation and animated Fly To
- Grid and coordinate visualization
- TAP-based astronomical data access

### Earth Observation

- Interactive 3D Earth visualization
- XYZ tiled maps
- WMTS map services
- GeoJSON geometries and overlays
- Satellite tracks and observation geometry
- Sensor footprints and cones
- Longitude/latitude navigation and animated Fly To
- Earth-oriented coordinate and picking utilities

### 3D and Scientific Visualization

- WebGL2 rendering
- Inside/outside sphere visualization
- MeshHiPS OBJ tiled meshes
- Runtime color maps
- Interactive camera, navigation and animated Fly To
- Ray picking
- Scientific overlays and geometries
- Framework-independent architecture

---

## Installation

Install AstroViewer from npm:

```bash
npm install astro-viewer
```

To combine rendering with name resolution, TAP queries and HiPS discovery,
install the render-independent service package as well:

```bash
npm install astro-viewer astrospatial-services
```

AstroViewer requires Node.js 22 or later for development and package tooling.

The rendering engine itself runs in a browser-compatible environment with WebGL2 support.

---

## Quick Start

### ES Modules

```html
<canvas id="astrocanvas" style="width: 100vw; height: 100vh"></canvas>

<script type="module">
  import { AstroViewer } from "astro-viewer";

  const canvas = document.getElementById("astrocanvas");
  const viewer = new AstroViewer(canvas);
  viewer.run();

  const optical = await viewer.addHiPSFromUrl(
    "https://cdn.skies.esac.esa.int/DSSColor/",
  );
  viewer.setActiveHiPS(optical);
  viewer.goTo(202.4696, 47.1953); // M51, RA and Dec in degrees
</script>
```

AstroViewer is framework-independent. The same instance can be created from
React, Vue, Angular or any application that owns an `HTMLCanvasElement`.

---

## HiPS

AstroViewer supports HiPS (Hierarchical Progressive Surveys) as native astronomical map layers.

A HiPS survey can be loaded directly from its service URL:

```js
const optical = await viewer.addHiPSFromUrl(
  "https://cdn.skies.esac.esa.int/DSSColor/",
);
viewer.setActiveHiPS(optical);
```

AstroViewer supports standard HiPS image tiles as well as FITS-based HiPS datasets.

For applications that already have HiPS properties, the lower-level descriptor
API remains available:

```js
import { HiPSDescriptor } from "astro-viewer";

const baseUrl = "https://cdn.skies.esac.esa.int/DSSColor/";
const properties = await fetch(`${baseUrl}properties`).then((response) =>
  response.text(),
);
const optical = viewer.addHiPS(new HiPSDescriptor(properties, baseUrl));
```

When a survey exposes multiple supported tile formats, the active format can be changed at runtime.

---

## Multiple HiPS Layers

Multiple HiPS surveys can coexist within the same AstroViewer instance.

```js
const hips1 = await viewer.addHiPSFromUrl(
  "https://cdn.skies.esac.esa.int/DSSColor/",
);

const hips2 = await viewer.addHiPSFromUrl("https://example.org/another-hips/");
```

The currently loaded layers can be retrieved with:

```js
const layers = viewer.getActiveHiPSLayers();
```

The active HiPS layer can be changed without altering layer order:

```js
viewer.setActiveHiPS(hips1);
```

Individual layers can be removed:

```js
viewer.removeHiPS(hips2);
```

or all HiPS layers can be removed:

```js
viewer.removeAllHiPS();
```

### Layer Opacity

Each HiPS layer has independent opacity:

```js
viewer.setHiPSOpacity(hips1, 0.4);
viewer.setHiPSOpacity(hips2, 1.0);
```

Opacity values range from `0` (transparent) to `1` (fully opaque).

This allows multiple astronomical surveys to be visually combined and compared.

An opacity of `0` keeps the layer registered but prevents it from acquiring new
detailed tiles. Existing tiles may remain cached for a later transition. Use
`removeHiPS()` when the layer is no longer needed and its WebGL and tile resources
should be released:

```js
viewer.setHiPSOpacity(hips2, 0); // hidden, still part of the layer stack
viewer.removeHiPS(hips2);       // removed and disposed by AstroViewer
```

Applications should not call a layer's internal `dispose()` method directly.
AstroViewer owns the layer lifecycle and releases resources through
`removeHiPS()` and `removeAllHiPS()`.

---

## HiPS Formats

The formats available for the active HiPS survey can be queried with:

```js
const formats = viewer.getActiveHiPSFormats();
```

The active format can then be changed at runtime:

```js
viewer.changeHiPSFormat("fits");
```

Supported formats depend on the HiPS dataset metadata.

AstroViewer supports conventional image-based HiPS tiles and FITS HiPS tiles.

---

## FITS HiPS Visualization

AstroViewer can render FITS tiles directly as part of the HiPS rendering pipeline.

FITS visualization supports multiple display scaling functions:

```text
linear
sqrt
log
asinh
gamma
```

The display range and scaling parameters can be changed at runtime, allowing scientific image data with different dynamic ranges to be explored interactively.

Color maps can also be applied at runtime to FITS-based HiPS data.

```js
viewer.setActiveHiPS(fitsLayer);
viewer.changeHiPSFormat("fits");
viewer.setHiPSFITSRangeMode("robust");
viewer.setHiPSFITSScaleFunction("asinh");
viewer.changeColorMap("cubehelix");
```

Available formats and visualization options depend on the active survey. Query
the advertised formats before switching:

```js
if (viewer.getActiveHiPSFormats().includes("fits")) {
  viewer.changeHiPSFormat("fits");
}
```

---

## HiPS Coverage

AstroViewer supports survey coverage information associated with HiPS datasets.

Coverage information is used by the tile rendering pipeline to avoid requesting and rendering HEALPix tiles outside the available survey region.

This is particularly useful for partial-sky surveys.

---

## Navigation and Fly To

AstroViewer provides immediate and animated camera navigation.

The viewer can move directly to a target coordinate:

```js
viewer.goTo(firstDeg, secondDeg);
```

or smoothly animate the camera towards the target:

```js
viewer.flyTo(firstDeg, secondDeg);
```

An optional duration can be specified in milliseconds:

```js
viewer.flyTo(firstDeg, secondDeg, 1500);
```

Field of view can be changed immediately or animated:

```js
viewer.setFoV(20);
await viewer.flyToFoV(1.2, 1800);
```

To move the viewpoint inside the celestial sphere:

```js
if (!viewer.getInsideSphere()) {
  viewer.toggleInsideSphere();
}
viewer.flyTo(266.4051, -28.9362, 3200); // Galactic Centre
```

The coordinate semantics depend on the active visualization domain:

- Astronomy uses right ascension and declination.
- Earth visualization uses longitude and latitude.
- Planetary and MeshHiPS visualization uses longitude and latitude.

Fly To uses spherical interpolation and integrates with the viewer rendering loop. User interaction interrupts an active Fly To operation, allowing normal interactive navigation to resume immediately.

---

## Integration with astrospatial-services

`astro-viewer` renders scientific data. `astrospatial-services` provides
render-independent clients for discovering and retrieving that data. Keeping
the packages separate allows the same service clients to be used without a
WebGL viewer.

### Resolve a target with CDS Sesame

Resolve an astronomical name and navigate to the returned ICRS coordinates:

```js
import { AstroViewer } from "astro-viewer";
import { SesameService } from "astrospatial-services/astronomy/name-resolver";

const viewer = new AstroViewer(document.getElementById("astrocanvas"));
viewer.run();
const sesame = new SesameService();
const target = await sesame.resolve("M51");

if (target) {
  viewer.flyTo(target.raDeg, target.decDeg, 1800);
  await viewer.flyToFoV(1.2, 1200);
}
```

`resolve()` returns `null` when the name is not resolved. Network, timeout and
malformed-response failures reject with a `ServiceError`.

### Discover surveys through a HiPS node

Use `HiPSNodeService` to inspect a node, select a survey and pass its service URL
to AstroViewer:

```js
import { HiPSNodeService } from "astrospatial-services/astronomy/hips";

const hipsNode = new HiPSNodeService();
const surveys = await hipsNode.listSurveys(
  "https://example.org/hips-node/hipslist",
);

const dss = surveys.find((survey) =>
  survey.metadata.obs_title?.toLowerCase().includes("dss"),
);

if (dss) {
  const properties = await hipsNode.getProperties(dss.serviceUrl);
  console.log(properties.title, properties.order, properties.tileFormats);

  const layer = await viewer.addHiPSFromUrl(dss.serviceUrl);
  viewer.setActiveHiPS(layer);
}
```

Replace the example URL with the HiPS node used by your application. The exact
node URL is deployment-specific. `listSurveys()` expects a CDS-style `hipslist`,
while `getProperties()` reads the selected survey's standard `properties`
resource.

### Query a TAP service and render a catalogue

The TAP client can execute synchronous ADQL queries. A CSV result can be
normalized to the shared `AstroTable` model and rendered as an AstroViewer
catalogue:

```js
import { TapService } from "astrospatial-services/astronomy/tap";
import { parseCsvTable } from "astrospatial-services";

const tap = new TapService({
  endpoint: "https://gea.esac.esa.int/tap-server/tap",
});

const result = await tap.querySync({
  adql: `
    SELECT TOP 100 source_id, ra, dec, phot_g_mean_mag
    FROM gaiadr3.gaia_source
    WHERE 1 = CONTAINS(
      POINT('ICRS', ra, dec),
      CIRCLE('ICRS', 202.4696, 47.1953, 0.2)
    )
  `,
  format: "csv",
});

const table = parseCsvTable(result.body, {
  mapping: { ra: "ra", dec: "dec", name: "source_id" },
  numericColumns: ["ra", "dec", "phot_g_mean_mag"],
});

const catalogue = viewer.addCatalogue(table, {
  name: "Gaia DR3 around M51",
  providerUrl: "https://gea.esac.esa.int/tap-server/tap",
});

viewer.changeCatalogueColor(catalogue, "#66ccff");
```

TAP table names and columns vary by service. Applications can inspect them with
`listSchemas()`, `listTables()` and `listColumns()` before constructing ADQL.

---

## Earth Maps

AstroViewer also supports tiled Earth observation maps.

### XYZ

XYZ tile services can be used as Earth map layers.

Typical services use URL templates such as:

```text
https://tile.openstreetmap.org/{z}/{x}/{y}.png
```

AstroViewer automatically determines the appropriate tile level according to the current camera position and field of view.

### WMTS

WMTS services can also be integrated through the AstroViewer WMTS support.

This allows standards-based Earth observation imagery to coexist with astronomical visualization functionality within the same rendering architecture.

---

## MeshHiPS

AstroViewer includes support for hierarchical tiled 3D meshes through MeshHiPS.

MeshHiPS can be used for progressively loading OBJ-based surface geometry according to the current field of view and camera distance.

Typical use cases include planetary surfaces and other large hierarchical 3D datasets.

---

## Satellite and Observation Geometry

AstroViewer provides primitives for representing Earth observation and satellite-related geometry, including:

- satellite positions;
- observation tracks;
- ground footprints;
- sensor cones;
- GeoJSON regions and geometries.

These components can be combined to build interactive Earth observation analysis workflows.

---

## API Overview

The main entry point is:

```ts
AstroViewer;
```

Important APIs include:

### HiPS

```ts
activateHiPS(...)
addHiPS(...)
addHiPSFromUrl(...)
removeHiPS(...)
removeAllHiPS()
getActiveHiPS()
getActiveHiPSLayers()
setActiveHiPS(...)
getActiveHiPSFormats()
changeHiPSFormat(...)
setHiPSOpacity(...)
```

### Navigation

```ts
goTo(...)
flyTo(...)
```

### Maps and visualization

AstroViewer also exposes functionality around:

```text
HiPS
HiPSDescriptor
XYZMap
WMTSAdapter
MeshHiPS
GeoJSON
ObservationTrack
satellite and sensor geometry
coordinate and picking utilities
```

See the TypeScript declarations distributed with the package for the complete public API.

---

## Package Formats

AstroViewer is distributed through npm with both ES Module and CommonJS entry points.

The package exposes:

```text
ESM     → lib-esm/index.js
Types   → lib-esm/index.d.ts
CJS     → dist/astroviewer.cjs
Browser → dist/astroviewer.js
```

The package can therefore be consumed by modern JavaScript/TypeScript applications and bundlers.

The AstroViewer rendering engine requires a browser-compatible DOM and WebGL2 environment. Importing the package from Node.js does not imply that the WebGL viewer itself can run in a headless Node environment.

---

## Development

Clone the repository and install the dependencies:

```bash
npm ci
```

Run the test suite:

```bash
npm test
```

Build the package:

```bash
npm run build
```

Run the development server:

```bash
npm run start-server
```

Before publishing or merging a release, the package contents can be inspected with:

```bash
npm pack --dry-run
```

---

## Continuous Integration

The CI pipeline validates:

```text
npm ci
npm test
npm run build
npm pack --dry-run
```

Release publishing is performed through GitHub Actions using npm Trusted Publishing and OpenID Connect (OIDC).

No long-lived npm publishing token is required by the release workflow.

See:

```text
ci-cd.md
```

for the complete development and release workflow.

---

## Browser Requirements

AstroViewer relies on WebGL2 and modern browser APIs.

A recent version of one of the major browsers is recommended:

- Chrome / Chromium
- Firefox
- Safari
- Edge

WebGL2 must be available and enabled.

---

## Architecture

AstroViewer follows a framework-independent architecture.

The rendering and scientific functionality are implemented as reusable JavaScript/TypeScript components rather than being coupled to React, Angular, Vue, or another UI framework.

This allows AstroViewer to be embedded in different applications and user-interface architectures while keeping the scientific visualization layer independent.

The project integrates several lower-level scientific libraries developed within the AstroBrowser ecosystem, including functionality for FITS, WCS and HEALPix processing.

---

## Licensing

AstroViewer is dual-licensed.

### Open-source use

AstroViewer is available under the:

**GNU Affero General Public License v3.0 (AGPL-3.0)**

See:

```text
LICENSE-AGPL.md
```

### Commercial use

A separate commercial license is available for organizations and applications that do not wish to comply with the AGPL requirements.

See:

```text
LICENSE-COMMERCIAL.md
```

The overall licensing terms are described in:

```text
LICENSE.md
```

Third-party dependency licensing information is documented in:

```text
DEPENDENCY-LICENSING.md
```

---

## Project

AstroViewer is part of the **AstroBrowser** ecosystem, a set of scientific visualization and data-analysis technologies designed to support both astronomical and Earth observation applications.

The project focuses on browser-native scientific visualization, interoperability with established scientific standards, and reusable components for building interactive data-analysis environments.

---

## Author

Copyright © Fabrizio Giordano.

AstroViewer is released under:

```text
AGPL-3.0-only OR LicenseRef-AstroViewer-Commercial
```
