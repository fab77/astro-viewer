# 🌌 AstroViewer

[![License: AGPL-3.0 or Commercial](https://img.shields.io/badge/license-AGPL--3.0%20or%20Commercial-blue.svg)](#licensing)
[![TypeScript](https://img.shields.io/badge/language-TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![WebGL](https://img.shields.io/badge/3D-WebGL-orange.svg)](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API)

**AstroViewer** is a standards-driven 3D scientific visualization engine for astronomical and Earth-observation data, written in **TypeScript** and **WebGL**.

It provides reusable visualization and interaction components for scientific web applications, including support for astronomical imagery and catalogues, spatial footprints, coordinate-aware navigation, Earth imagery, satellite observation geometry, and standards-based scientific data access.

Current capabilities include support for technologies and standards such as:

- **HiPS** and **HEALPix** for hierarchical astronomical imagery and spatial indexing
- **FITS** and astronomical coordinate transformations
- **TAP**-based catalogue access and astronomical metadata
- catalogue overlays and spatial footprints
- **STC-S** geometry parsing
- Earth visualization using tiled **XYZ** and **WMTS** imagery
- satellite trajectories, observation tracks, footprints, and sensor geometry
- WebGL-based 3D rendering, picking, camera navigation, and scientific overlays

AstroViewer is the visualization engine used by **Astrobrowser**, but is designed as an independent npm library that can be embedded in other scientific web applications.

## Licensing

AstroViewer is dual-licensed under:

- the **GNU Affero General Public License version 3 (AGPL-3.0)**; or
- a separate **commercial license**.

The AGPL-3.0 option is an open-source license and may be used for both commercial and non-commercial purposes, provided that its requirements are satisfied.

The commercial license is an alternative for organizations that want to integrate AstroViewer into proprietary products, services, or other software under terms that do not impose the AGPL-3.0 copyleft requirements.

See:

- `LICENSE.md` for an overview of the dual-license model
- `LICENSE-AGPL.md` for the full AGPL-3.0 license text
- `LICENSE-COMMERCIAL.md` for information about commercial licensing
- `DEPENDENCY-LICENSING.md` for the licensing status of AstroViewer dependencies

---

## 📦 Bundles

AstroViewer builds the following bundles in the `dist/` directory:

| File | Description |
|------|--------------|
| `astroviewer.js` | UMD bundle for browser environments |
| `astroviewer.min.js` | Minified UMD bundle |
| `astroviewer.cjs` | CommonJS build for Node.js |
| `*.map` | Source maps for debugging |

---

## 🪐 Quick Start (Browser)

Copy the bundle into your project and link it in your HTML page:

```html
<script src="./javascripts/astroviewer.js"></script>
```

Then you can use the global `astroviewer` object directly.  
Here is a minimal example that loads a HiPS survey and starts the viewer.

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>AstroViewer Demo</title>
  <script src="./javascripts/astroviewer.js"></script>
</head>
<body onload="run();">
  <canvas id="astrocanvas"></canvas>
  <script>
    let window.AstroAPI = undefined;

    async function run() {
      const AC = new astroviewer.AstroViewer();
      window.AstroAPI = AC;

      const hipsUrl = "https://alasky.cds.unistra.fr/DSS/DSSColor/";
      const resp = await fetch(hipsUrl + "properties");
      const propsText = await resp.text();

      const desc = new astroviewer.HiPSDescriptor(propsText, hipsUrl);
      window.AstroAPI.activateHiPS(desc);
      window.AstroAPI.run();
    }
  </script>
</body>
</html>
```

---

## 🧩 Node.js / TypeScript Usage

You can also use AstroViewer as a Node module:

```bash
npm install astro-viewer
```

Then import from your code:

```ts
// ESM
import { AstroViewer, HiPSDescriptor } from 'astro-viewer';

// or CommonJS
const { AstroViewer, HiPSDescriptor } = require('astro-viewer');
```

---

## 🧪 Development Web Interface

AstroViewer includes a development web UI to explore features such as HiPS loading, FoV control, catalogue management, and footprints.  
You need **Node.js ≥ 22** installed.

Clone this repository and run:

```bash
npm run all
```

This command will:
- Compile the TypeScript source
- Build the bundles
- Prepare the web testing interface
- Start a local web server

You should see output similar to:

```
Serving HTTP on 0.0.0.0 port 8080
```

Then open one of the links in your browser (e.g. [http://127.0.0.1:8080](http://127.0.0.1:8080)) to start exploring **AstroViewer**.

---

## 🛠️ Build Scripts

| Command | Description |
|----------|--------------|
| `npm run clean` | Remove `dist` and `lib-esm` directories |
| `npm run dev` | Build in development mode and watch for changes |
| `npm run prod` | Production build (minified and with source maps) |
| `npm run web` | Copy bundles and assets into the public folder |
| `npm run all` | Full build + launch development web UI |

---

## 📚 API Overview

Main exported classes and utilities:

- `AstroViewer` — main application controller  
- `HiPSDescriptor` — handles HiPS metadata and configuration  
- `FootprintSetGL` — renders observation footprints  
- `CatalogueGL` — renders astronomical catalogues  
- `FoV` and related geometry/color-map utilities — camera and rendering helpers  

---


---

## 🔧 API Reference & Usage

Below is a practical overview of the **most commonly exposed methods** via the UMD global `astroviewer` (browser) or the module exports (Node/ESM).  
> **Note:** The bundles only include what is exported from `src/index.ts`. If your build exposes additional methods, follow the same patterns shown here.

### Core Lifecycle

#### `new AstroViewer(options?)`
Create the viewer controller.

```js
// Browser (UMD)
const AC = new astroviewer.AstroViewer({
  canvas: document.getElementById('astrocanvas'), // optional; defaults to #astrocanvas
  antialias: true                                  // optional
});
```

```ts
// Node/ESM
import { AstroViewer } from 'astro-viewer';
const AC = new AstroViewer();
```

#### `run()`
Start the render loop and event handling.

```js
AC.run();
```

### HiPS Datasets

#### `activateHiPS(descriptor: HiPSDescriptor)`
Activate a HiPS dataset for rendering.

```js
const hipsUrl = "https://alasky.cds.unistra.fr/DSS/DSSColor/";
const props = await (await fetch(hipsUrl + "properties")).text();
const desc = new astroviewer.HiPSDescriptor(props, hipsUrl);

AC.activateHiPS(desc);
```

#### `toggleInsideSphere()`
Toggle the point-of-view (outside vs inside the HiPS sphere).

```js
AC.toggleInsideSphere();   // outside <-> inside
```

---

### Camera & Navigation

#### `goTo(raDeg: number, decDeg: number)`
Move the camera to a sky coordinate (ICRS).

```js
AC.goTo(287.0, 12.5);
```


---

### Overlays & Grids

#### `toggleHealpixGrid()`
Show/hide the HEALPix grid overlay.

```js
AC.toggleHealpixGrid();
```

---

### Catalogues

#### `showCatalogue(catalogue: CatalogueGL)`
Render a catalogue layer.

```js
AC.showCatalogue(cat);
```

#### `hideCatalogue(catalogue: CatalogueGL, isVisible: boolean)`
Toggle visibility without removing it.

```js
AC.hideCatalogue(cat, false);  // hide
AC.hideCatalogue(cat, true);   // show
```

#### `deleteCatalogue(catalogue: CatalogueGL)`
Remove a catalogue layer completely.

```js
AC.deleteCatalogue(cat);
```

#### `changeCatalogueColor(catalogue: CatalogueGL, hexColor: string)`
Change the colour of rendered catalogue points/sources.

```js
AC.changeCatalogueColor(cat, "#ff8800");
```

---

### Footprints (Observations)

The following methods mirror the catalogue API, but for **observation footprints**.

#### `showFootprintSet(footprintSet: FootprintSetGL)`
```js
const footprints = tapRepo.obsList.find(o => o.name === "observations.some_collection");
AC.showFootprintSet(footprints);
```

#### `hideFootprintSet(footprintSet: FootprintSetGL, isVisible: boolean)`
```js
AC.hideFootprintSet(footprints, false); // hide
AC.hideFootprintSet(footprints, true);  // show
```

#### `deleteFootprintSet(footprintSet: FootprintSetGL)`
```js
AC.deleteFootprintSet(footprints);
```

#### `changeFootprintSetColor(footprintSet: FootprintSetGL, hexColor: string)`
```js
AC.changeFootprintSetColor(footprints, "#00ffaa");
```

---

### Events & Utilities (if exported)

Depending on your build, you may also have helpers like:

#### `getCenterCoordinates()`
Return the current ICRS center of the viewport.

```js
const coords = AC.getCenterCoordinates();
```

#### `toggleInsideSphere()`
```js
AC.toggleInsideSphere();
```

> If a method above is not present in your build, it means it’s not exported by `src/index.ts`.  
> To inspect what’s available in the UMD build, open your page and run:
>
> ```js
> console.log(Object.keys(astroviewer));
> console.log(Object.getOwnPropertyNames(astroviewer.AstroViewer.prototype));
> ```



## 📜 License

AstroViewer is dual-licensed under:

- **GNU Affero General Public License version 3 (AGPL-3.0)**
- **Commercial License**

You may use AstroViewer under the AGPL-3.0, including in commercial contexts, provided that you comply with its terms.

If the AGPL-3.0 requirements are not suitable for your project, a separate commercial license is available for proprietary integration and other use cases requiring alternative licensing terms.

See `LICENSE.md`, `LICENSE-AGPL.md`, and `LICENSE-COMMERCIAL.md` for details.

---

## 🔗 Links

- 🏠 [GitHub Repository](https://github.com/fab77/astro-viewer)
- 🪐 [HiPS Standard (IVOA)](https://www.ivoa.net/documents/HiPS/)
- 🛰️ [ESA Sky TAP Service](https://sky.esa.int/esasky-tap/tap)
- ✉️ [Report Issues](https://github.com/fab77/astro-viewer/issues)
