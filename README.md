# 🌌 AstroViewer

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![TypeScript](https://img.shields.io/badge/language-TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![WebGL](https://img.shields.io/badge/3D-WebGL-orange.svg)](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API)

**AstroViewer** is a lightweight 3D engine for **HiPS (Hierarchical Progressive Surveys)** visualisation and exploration, written in **TypeScript** and **WebGL**.  
It powers the next generation of **Astrobrowser** and provides a simple API for embedding 3D HiPS viewers, catalogue overlays, and TAP service interactions in any web project.

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
Here is a minimal example that loads the HiPS survey, activates a TAP service, and displays a source catalogue.

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

      const desc = new astroviewer.HiPSDescriptor(propsText, new URL(hipsUrl));
      const insideSphere = false;

      window.AstroAPI.activateHiPS(desc, insideSphere);
      window.AstroAPI.run();

      const tapRepo = await astroviewer.addTAPRepo("https://sky.esa.int/esasky-tap/tap");
      const catalogue = tapRepo.cataloguesList.find(cat => cat.name === "catalogues.integral_ibis");

      window.AstroAPI.showCatalogue(catalogue);
    }
  </script>
</body>
</html>
```

---

## 🧩 Node.js / TypeScript Usage

You can also use AstroViewer as a Node module:

```bash
npm install ./path/to/astro-core
```

Then import from your code:

```ts
// ESM
import { AstroViewer, HiPSDescriptor, addTAPRepo } from 'astro-core';

// or CommonJS
const { AstroViewer, HiPSDescriptor, addTAPRepo } = require('astro-core');
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

You should see something like:

```
Starting up http-server, serving public

http-server version: 14.1.1

http-server settings:
CORS: disabled
Cache: 3600 seconds
Connection Timeout: 120 seconds
Directory Listings: visible
AutoIndex: visible

Available on:
  http://127.0.0.1:8080
  http://10.0.0.184:8080
Hit CTRL-C to stop the server
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
- `addTAPRepo()` — loads TAP repositories and metadata  
- `FoV`, `AstroSphere`, `HealpixGridSingleton`, etc. — geometry, camera, and rendering utilities  

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
import { AstroViewer } from 'astro-core';
const AC = new AstroViewer();
```

#### `run()`
Start the render loop and event handling.

```js
AC.run();
```

#### `stop()`
Stop/pause the render loop.

```js
AC.stop();
```

---

### HiPS Datasets

#### `activateHiPS(descriptor: HiPSDescriptor, insideSphere = false)`
Activate a HiPS dataset for rendering.

```js
const hipsUrl = "https://alasky.cds.unistra.fr/DSS/DSSColor/";
const props = await (await fetch(hipsUrl + "properties")).text();
const desc = new astroviewer.HiPSDescriptor(props, new URL(hipsUrl));

AC.activateHiPS(desc, /* insideSphere */ false);
```

#### `toggleInsideSphere()`
Toggle the point-of-view (outside vs inside the HiPS sphere).

```js
AC.toggleInsideSphere();   // outside <-> inside
```

---

### Camera & Navigation

#### `goto(raDeg: number, decDeg: number, opts?)`
Fly the camera to a sky coordinate (ICRS). Optional parameters:
- `fovDeg?: number` – target field of view (angular diameter)
- `durationMs?: number` – animation duration (default ~1000–1500 ms)
- `easing?: (t:number)=>number` – custom easing

```js
await AC.goto(287.0, 12.5, { fovDeg: 60, durationMs: 1500 });
```


---

### Overlays & Grids

#### `toggleHealpixGrid()`
Show/hide the HEALPix grid overlay.

```js
AC.toggleHealpixGrid();
```

---

### TAP Repositories & Catalogues

#### `addTAPRepo(url: string): Promise<TapRepo>`
Discover capabilities and available datasets (catalogues, footprints, etc.).

```js
const tapRepo = await astroviewer.addTAPRepo("https://sky.esa.int/esasky-tap/tap");

// Explore the lists (names depend on the service)
console.log(tapRepo.cataloguesList.map(c => c.name));
console.log(tapRepo.obsList?.map(o => o.name)); // if provided
```

#### `showCatalogue(catalogue: CatalogueGL)`
Render a catalogue from a TAP repository.

```js
const cat = tapRepo.cataloguesList.find(c => c.name === "catalogues.integral_ibis");
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

#### `on(eventName: string, handler: Function)` / `off(eventName: string, handler: Function)`
Listen to viewer events (e.g., click on source, pointer move).

```js
AC.on?.("pointermove", (info) => {
  // info.ra, info.dec, info.pixelX, info.pixelY, etc.
  console.log("Hover:", info);
});
```

#### `getCenterCoords()`
Return the current ICRS center of the viewport.

```js
const { ra, dec } = AC.getCenterCoords?.() ?? { ra: 0, dec: 0 };
```

#### `setBackgroundColor(hex: string)`
```js
AC.setBackgroundColor?.("#000000");
```

> If a method above is not present in your build, it means it’s not exported by `src/index.ts`.  
> To inspect what’s available in the UMD build, open your page and run:
>
> ```js
> console.log(Object.keys(astroviewer));
> console.log(Object.getOwnPropertyNames(astroviewer.AstroViewer.prototype));
> ```



## 📜 License

This project is released under the **GNU GPL v3** license.  
© 2025 Fabrizio Giordano (fab77)

---

## 🔗 Links

- 🏠 [GitHub Repository](https://github.com/fab77/astro-core)
- 🪐 [HiPS Standard (IVOA)](https://www.ivoa.net/documents/HiPS/)
- 🛰️ [ESA Sky TAP Service](https://sky.esa.int/esasky-tap/tap)
- ✉️ [Report Issues](https://github.com/fab77/astro-core/issues)
