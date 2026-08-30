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

AstroViewer requires Node.js 22 or later for development and package tooling.

The rendering engine itself runs in a browser-compatible environment with WebGL2 support.

---

## Quick Start

### ES Modules

```js
import { AstroViewer } from "astro-viewer";

const canvas = document.getElementById("astrocanvas");

const viewer = new AstroViewer(canvas);
```

Example HTML:

```html
<canvas id="astrocanvas"></canvas>

<script type="module">
  import { AstroViewer } from "astro-viewer";

  const canvas = document.getElementById("astrocanvas");
  const viewer = new AstroViewer(canvas);
</script>
```

---

## HiPS

AstroViewer supports HiPS (Hierarchical Progressive Surveys) as native astronomical map layers.

A HiPS survey can be activated using a `HiPSDescriptor`:

```js
import { AstroViewer, HiPSDescriptor } from "astro-viewer";

const canvas = document.getElementById("astrocanvas");

const viewer = new AstroViewer(canvas);

const hipsUrl = "https://alasky.cds.unistra.fr/DSS/DSSColor/";

const response = await fetch(`${hipsUrl}properties`);
const properties = await response.text();

const descriptor = new HiPSDescriptor(properties, new URL(hipsUrl));

viewer.activateHiPS(descriptor, false);
```

AstroViewer supports standard HiPS image tiles as well as FITS-based HiPS datasets.

When a survey exposes multiple supported tile formats, the active format can be changed at runtime.

---

## Multiple HiPS Layers

Multiple HiPS surveys can coexist within the same AstroViewer instance.

```js
const hips1 = await viewer.addHiPSFromUrl(
  "https://alasky.cds.unistra.fr/DSS/DSSColor/",
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

The coordinate semantics depend on the active visualization domain:

- Astronomy uses right ascension and declination.
- Earth visualization uses longitude and latitude.
- Planetary and MeshHiPS visualization uses longitude and latitude.

Fly To uses spherical interpolation and integrates with the viewer rendering loop. User interaction interrupts an active Fly To operation, allowing normal interactive navigation to resume immediately.

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
npm start
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
