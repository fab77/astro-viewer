# TerraPolylineSetGL Plan

## Goal

Add a minimal geographic polyline overlay to `astro-viewer` for rendering `astrospatial-core` `GroundTrackPoint[]` outputs as open ground-track lines.

The current ISS Spain development demo renders ground-track samples with `TerraPointSetGL`. That is useful as a temporary fallback, but it does not show the continuous pass geometry. The proposed `TerraPolylineSetGL` should render one or more open geographic paths on the Earth surface without introducing new map, UI, or satellite-computation responsibilities into `astro-viewer`.

This document is a design plan only. It does not implement the class.

## Existing Overlay Lifecycle

`AstroViewer` exposes public factory and lifecycle methods for catalogues and footprints:

- `createCatalogue(...)`, `showCatalogue(...)`, `hideCatalogue(...)`, `deleteCatalogue(...)`
- `createFootprintSet(...)`, `showFootprintSet(...)`, `hideFootprintSet(...)`, `deleteFootprintSet(...)`
- `createTerraPointSet(...)`, `showTerraPointSet(...)`, `hideTerraPointSet(...)`, `deleteTerraPointSet(...)`
- `createTerraFootprintSet(...)`, `showTerraFootprintSet(...)`, `hideTerraFootprintSet(...)`, `deleteTerraFootprintSet(...)`

`TerraPointSetGL` is currently a thin subclass of `CatalogueGL`.

`TerraFootprintSetGL` is a thin geographic wrapper over `FootprintSetGL`. It sets `CoordsType.GEOGRAPHIC` and adds `addGeoJSONFeatures(...)`, converting parsed GeoJSON polygons into `Footprint` instances.

`AstroSphere` maintains active overlay collections:

- `activeCatalogues: CatalogueGL[]`
- `activeFootprintSets: FootprintSetGL[]`

The draw order in `AstroSphere.draw(...)` is currently:

1. active base layer: HiPS, XYZ, or MeshHiPS
2. Healpix grid
3. Equatorial grid
4. active catalogues, including `TerraPointSetGL`
5. active footprint sets, including `TerraFootprintSetGL`

The MVP polyline overlay should follow this same lifecycle style. The cleanest approach is to add a third active overlay collection for geographic lines:

```ts
private activePolylineSets: TerraPolylineSetGL[] = [];
```

and draw it after footprint sets or between catalogues and footprint sets. For the satellite demo, drawing after footprint sets is preferable so the ground track remains visible on top of filled or outlined target/footprint polygons.

## Existing Line Rendering Patterns

### LonLatGrid

`LatLonGrid` already renders geographic meridians and parallels using line primitives:

- `gl.drawArrays(gl.LINE_STRIP, ...)` for longitude lines
- `gl.drawArrays(gl.LINE_LOOP, ...)` for latitude rings
- `GridShaderManager.healpixGridVS()`
- `GridShaderManager.healpixGridFS()`
- a single `aCatPosition` attribute
- `uMVMatrix`, `uPMatrix`, and `u_fragcolor` uniforms

This is the closest rendering pattern for `TerraPolylineSetGL`. It already demonstrates simple colored line rendering with model/view/projection matrices.

### EquatorialGrid and HealpixGrid

`EquatorialGrid` and `HealpixGrid` also use the grid shader and WebGL line primitives. They are useful examples for shader setup, matrix uniforms, and line draw calls, but their geometry is grid-specific.

### FootprintSetGL

`FootprintSetGL` renders polygon outlines with `gl.LINE_LOOP` and `FootprintShaderProgram`. It also handles hover/selection and indexed buffers. It is useful for overlay lifecycle and color handling, but it is heavier than needed for open ground tracks.

For `TerraPolylineSetGL`, do not subclass `FootprintSetGL`: a ground track is an open path, not a closed polygon, and should not inherit footprint hit-testing or `LINE_LOOP` assumptions.

### Shader Reuse

The minimum implementation can reuse either:

- `GridShaderManager.healpixGridVS/FS`, as `LatLonGrid` does, or
- `FootprintShaderProgram`, since it already provides position/color/matrix setup for overlay lines.

Recommendation: start with `FootprintShaderProgram` or a tiny `PolylineShaderProgram` wrapper with the same shader sources. A dedicated wrapper keeps the class independent from grid internals while avoiding a new shader design.

## Required Minimal Implementation

### Data Model

Add a new class:

```text
src/model/terra/TerraPolylineSetGL.ts
```

Minimal public types:

```ts
export interface TerraPolylinePoint {
  readonly longitudeDeg: number;
  readonly latitudeDeg: number;
  readonly altitudeKm?: number;
  readonly timestamp?: Date | string;
}

export interface TerraPolylineMetadata {
  readonly name?: string;
  readonly [key: string]: unknown;
}

export interface TerraPolylinePath {
  readonly points: readonly TerraPolylinePoint[];
  readonly metadata?: TerraPolylineMetadata;
}
```

The class should store multiple paths:

```ts
private paths: TerraPolylinePath[] = [];
private renderSegments: Float32Array[] = [];
private vertexBuffers: WebGLBuffer[] = [];
private _ready = false;
private _bufferInitialised = false;
private _isVisible = true;
private _shapeColor = '#ffe066';
```

### Public Methods

Minimal methods:

```ts
addPath(points: readonly TerraPolylinePoint[], metadata?: TerraPolylineMetadata): void;
addGroundTrack(points: readonly GroundTrackLike[], metadata?: TerraPolylineMetadata): void;
clearPaths(): void;
setIsVisible(isVisible: boolean): void;
changeColor(hexColor: string): void;
draw(
  modelMatrix: Float32Array,
  mouseHelper: MouseHelper,
  viewMatrix: Float32Array,
  perspectiveMatrix: Float32Array
): void;
dispose(): void;
```

`addGroundTrack(...)` should be a convenience method for `astrospatial-core` outputs:

```ts
export interface GroundTrackLike {
  readonly timestamp?: Date | string;
  readonly latitudeDeg: number;
  readonly longitudeDeg: number;
  readonly altitudeKm?: number;
}
```

No dependency on `astrospatial-core` should be introduced. Use structural typing.

### Geographic Conversion

Use existing `Point` conversion:

```ts
new Point({ lonDeg, latDeg }, CoordsType.GEOGRAPHIC)
```

Then write `R * point.x`, `R * point.y`, `R * point.z` into the vertex array, following `FootprintSetGL` and the Terra footprint path. Use the same effective radius convention as existing overlays, probably `R = 1.0` unless the footprint implementation proves it uses a larger radius internally.

### Open LINE_STRIP Rendering

Each render segment should draw as an open line:

```ts
gl.drawArrays(gl.LINE_STRIP, 0, segment.length / 3);
```

For the MVP, avoid index buffers. Each split segment can have one `Float32Array` and one `WebGLBuffer`. This keeps antimeridian splitting simple and avoids primitive-restart complexity.

### Multiple Paths

`addPath(...)` appends one logical path. During buffer rebuild:

1. validate and normalize points
2. split each path at antimeridian crossings
3. convert each segment to a `Float32Array`
4. create/update one buffer per segment

Drawing loops over `renderSegments`:

```ts
for (const segment of renderSegments) {
  bind buffer;
  vertexAttribPointer(...);
  drawArrays(LINE_STRIP, ...);
}
```

### Antimeridian Splitting

A geographic ground track can jump from `179.x` to `-179.x`, which would otherwise draw a long chord across the globe.

Minimal splitting rule:

```ts
if (Math.abs(normalizeLon(next.lon - current.lon)) is not enough)
if (Math.abs(next.lon - current.lon) > 180) split before next point
```

Recommended helper:

```ts
function crossesAntimeridian(aLon: number, bLon: number): boolean {
  return Math.abs(normalizeLongitudeDeg(bLon) - normalizeLongitudeDeg(aLon)) > 180;
}
```

MVP behavior should split at the discontinuity and not insert an interpolated antimeridian endpoint. That avoids creating misleading points and is sufficient for short ground-track samples. A future improvement can compute exact crossing points at `+/-180` for visually continuous edge-to-edge tracks.

Also split on invalid points, non-finite coordinates, or latitude outside `[-90, 90]`.

### Buffer Creation, Update, Disposal

`TerraPolylineSetGL` should own its WebGL buffers.

Minimal lifecycle:

- mark `_bufferInitialised = false` whenever paths change
- delete old buffers before rebuilding
- create one `ARRAY_BUFFER` per render segment
- upload each `Float32Array` with `STATIC_DRAW`
- in `dispose()`, delete all buffers and clear arrays

`deleteTerraPolylineSet(...)` should remove the set from `AstroSphere.activePolylineSets` and call `dispose()`. Existing catalogue/footprint delete methods currently only remove from active arrays, so adding explicit cleanup for the new class would improve the new path without changing old behavior.

## Public API Proposal

Add to `AstroViewer`:

```ts
createTerraPolylineSet(
  polylineSetName: string,
  polylineSetDescription: string,
  providerUrl: string,
  metadataManager: MetadataManager,
): TerraPolylineSetGL;

showTerraPolylineSet(polylineSet: TerraPolylineSetGL): TerraPolylineSetGL | Promise<TerraPolylineSetGL>;

hideTerraPolylineSet(polylineSet: TerraPolylineSetGL, isVisible: boolean): void;

deleteTerraPolylineSet(polylineSet: TerraPolylineSetGL): void;

changeTerraPolylineSetColor(polylineSet: TerraPolylineSetGL, hexColor: string): TerraPolylineSetGL;
```

Add to `TerraPolylineSetGL`:

```ts
addGroundTrack(
  points: readonly {
    readonly timestamp?: Date | string;
    readonly latitudeDeg: number;
    readonly longitudeDeg: number;
    readonly altitudeKm?: number;
  }[],
  metadata?: TerraPolylineMetadata,
): void;
```

Example use in the satellite demo:

```js
const set = api.createTerraPolylineSet(
  'Demo ISS ground track',
  'GroundTrackPoint[] rendered as LINE_STRIP',
  'astrospatial-core fixture',
  new viewer.MetadataManager([]),
);
set.addGroundTrack(DEMO_OBSERVATIONS.map(sample => sample.groundTrackPoint), {
  name: 'ISS pass over Spain',
});
api.changeTerraPolylineSetColor?.(set, '#ffe066');
api.showTerraPolylineSet(set);
```

## Minimal Files To Modify

Implementation files:

- `src/model/terra/TerraPolylineSetGL.ts`
- `src/AstroViewer.ts`
- `src/AstroSphere.ts`
- `src/index.ts`

Demo update:

- `src/html/javascripts/dev/satelliteFootprintDemo.js`

Optional, only if using a dedicated shader wrapper:

- `src/shader/PolylineShaderProgram.ts`

Tests:

- `src/AstroSphere.test.ts` for active collection lifecycle if practical
- a small unit test for antimeridian splitting if `splitPolylineAtAntimeridian` is implemented as an exported or separately testable helper

## Proposed Architecture

```text
astrospatial-core
  GroundTrackPoint[]
        |
        v
astro-viewer dev/demo adapter
  createTerraPolylineSet()
  addGroundTrack(points)
        |
        v
TerraPolylineSetGL
  validate lon/lat
  split antimeridian crossings
  lon/lat -> Point(CoordsType.GEOGRAPHIC)
  Point -> Float32Array segments
  WebGL ARRAY_BUFFER per segment
        |
        v
AstroSphere
  activePolylineSets[]
  draw LINE_STRIP paths with active base-layer model matrix
```

`TerraPolylineSetGL` should stay render-only. It should not compute propagation, footprints, intersections, or ground-track sampling.

## Draw Order Recommendation

Recommended order:

1. base layer
2. grids
3. catalogues / point sets
4. footprint sets
5. polyline sets

This makes ground tracks visible over country overlays and footprint outlines. If visual clutter becomes a problem, expose a future z-order or layer-order option.

## Risks

### Antimeridian Handling

Without splitting, `LINE_STRIP` draws a long line across the globe. The MVP should split on jumps greater than 180 degrees. Exact edge interpolation can be deferred.

### Line Thickness

WebGL line width is implementation-dependent and often limited to 1 px. The MVP should accept thin lines. Thicker tracks require a future screen-space or globe-surface ribbon mesh implementation.

### Draw Order

If drawn before footprints, tracks may be hidden by dense polygon overlays. Draw after footprints for the satellite demo.

### Memory Cleanup

Existing delete methods mostly remove overlays from active arrays. `TerraPolylineSetGL` should still implement `dispose()` and `deleteTerraPolylineSet(...)` should call it, because repeated demo loads can otherwise leak WebGL buffers.

### Shader Architecture Compatibility

The grid shader and footprint shader both support simple colored position-only lines. Reusing one is enough for the MVP. A dedicated `PolylineShaderProgram` is cleaner long-term but not strictly necessary.

### Picking and Hovering

The MVP should not implement line picking. Ground-track hover can be added later using nearest-segment tests in lon/lat or screen space.

### Geographic Versus Astronomical Coordinates

Use `CoordsType.GEOGRAPHIC` and `Point({ lonDeg, latDeg }, CoordsType.GEOGRAPHIC)`. Do not pass longitude as RA or latitude as DEC through catalogue APIs.

## Recommendation

Implement `TerraPolylineSetGL` as a small independent overlay class, not as a `CatalogueGL` or `FootprintSetGL` subclass.

Use simple `LINE_STRIP` rendering, one buffer per antimeridian-safe segment, and structural input compatibility with `astrospatial-core` `GroundTrackPoint[]`.

Integrate it into `AstroViewer` with symmetric create/show/hide/delete methods and into `AstroSphere` with a dedicated `activePolylineSets` collection. Update the ISS Spain demo to replace the temporary `TerraPointSetGL` ground-track fallback with `TerraPolylineSetGL` once the class exists.
