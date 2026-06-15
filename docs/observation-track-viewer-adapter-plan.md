# ObservationTrack Viewer Adapter Plan

## Goal

Define how `astro-viewer` should consume an `ObservationTrack` produced by `astrospatial-core` and replace the hardcoded ISS Spain demo wiring with a generic viewer-side adapter.

This is a planning document only. It does not modify `astrospatial-core`, `astro-viewer` source code, or `astrobrowser-ui`.

## Current State

`astrospatial-core` now exports plain data model types:

- `ObservationTrack`
- `ObservationSample`
- `SatelliteConfig`
- `SensorConfig`
- `ObservationVisualisationConfig`
- related satellite, sensor, target, and footprint types

`astrospatial-core/examples/real-tle-spain-observation.mjs` builds an `ObservationTrack` from:

```text
TLE -> SGP4 -> GroundTrackPoint[] -> FootprintPolygon[] -> GeoJSON intersection
```

`astro-viewer` already has render primitives needed by a satellite observation track:

- `TerraPolylineSetGL`
- `TerraFootprintSetGL`
- `TerraPointSetGL`
- `SatelliteObjectGL`
- `SensorConeGL`
- `satelliteTimelineController`

The current ISS Spain dev demo hardcodes a fixture in `src/html/javascripts/dev/satelliteFootprintDemo.js` and directly wires that fixture into viewer objects.

## Recommended Placement

Add a generic adapter under `src/model/terra/observation/` or `src/observation/`.

Recommended structure:

```text
src/observation/
  ObservationTrackViewerAdapter.ts
  ObservationTrackTimeline.ts
  ObservationTrackTypes.ts
  index.ts
```

Rationale:

- It is viewer-facing, not a core terra primitive.
- It coordinates several existing render primitives.
- It should be reusable by the dev demo and later by `astrobrowser-ui`.
- It should not live inside `src/html/javascripts/dev/`, which should remain only demo wiring.

Alternative:

```text
src/model/terra/ObservationTrackGL.ts
```

This is less ideal because the adapter owns multiple GL objects rather than being one rendering primitive.

## Type Dependency Strategy

`astro-viewer` should not add a runtime dependency on `astrospatial-core`.

Use structural plain-object types in `astro-viewer` that mirror only the fields needed for rendering:

```ts
export interface ObservationTrackLike {
  readonly id?: string;
  readonly satellite?: ObservationSatelliteLike;
  readonly sensor?: ObservationSensorLike;
  readonly target?: ObservationTargetLike;
  readonly visualisation?: ObservationVisualisationLike;
  readonly samples: readonly ObservationSampleLike[];
}
```

The adapter can accept real `astrospatial-core` `ObservationTrack` objects because TypeScript is structurally typed, but `astro-viewer` should not import them at runtime.

Possible implementation choices:

- no `astrospatial-core` dependency at all
- optional `import type` only if package dependency policy allows it
- best MVP: define local `ObservationTrackLike` types and document compatibility

Recommendation:

Use local structural types. Let `astrobrowser-ui` import `astrospatial-core` and pass the plain object to `astro-viewer`.

## Data Mapping

### Ground Track

Map:

```ts
ObservationTrack.samples[].groundTrackPoint
```

to:

```ts
TerraPolylineSetGL.addGroundTrack(points, metadata?)
```

Each point should include:

- `longitudeDeg`
- `latitudeDeg`
- `altitudeKm`
- `timestamp`

The adapter should pass samples in timestamp order and let `TerraPolylineSetGL` perform antimeridian splitting.

### Footprints

Map:

```ts
ObservationTrack.samples[].footprint
```

to:

```ts
TerraFootprintSetGL
```

The adapter should convert each footprint to a GeoJSON `Feature`.

For `FootprintPolygon`:

```ts
{
  type: "Polygon",
  coordinates: [[
    [longitudeDeg, latitudeDeg],
    ...
  ]]
}
```

For future `FootprintMultiPolygon`:

```ts
{
  type: "MultiPolygon",
  coordinates: [
    [[[longitudeDeg, latitudeDeg], ...]],
    ...
  ]
}
```

The adapter should keep all-footprints and current-footprint as separate overlays:

- all-footprints: static sampled output
- current-footprint: dynamic nearest sample or current interpolated display footprint

### Satellite Model

Map:

```ts
ObservationTrack.satellite.model
```

to:

```ts
SatelliteObjectGL
```

Suggested field mapping:

- `model.objUrl` -> `SatelliteObjectGLOptions.objUrl`
- `model.visualScale` -> `SatelliteObjectGLOptions.scale`
- `satellite.name` -> object name

Bounding-box normalization should stay inside `SatelliteObjectGL` if implemented. The adapter should pass configuration; it should not parse OBJ assets.

If no OBJ URL is available, the adapter should either:

- skip `SatelliteObjectGL`
- optionally create a `TerraPointSetGL` fallback marker

### Sensor Cone

Map the current timeline frame:

```ts
frame.currentGroundPoint
frame.currentFootprint
```

to:

```ts
SensorConeGL.setGeometry(frame.currentGroundPoint, currentFootprintRing)
```

For MVP, use the first polygon ring if a future footprint is a `MultiPolygon`. Later, `SensorConeGL` may need multiple bases or multiple cone instances.

The cone must remain a visualization of supplied data. It must not compute sensor geometry.

## Adapter Design

Proposed API:

```ts
export interface ObservationTrackViewerAdapterOptions {
  readonly viewer: AstroViewer;
  readonly metadataManagerFactory?: () => MetadataManager;
  readonly colors?: ObservationTrackViewerColors;
}

export class ObservationTrackViewerAdapter {
  constructor(options: ObservationTrackViewerAdapterOptions);

  load(track: ObservationTrackLike): ObservationTrackViewerHandle;
  clear(): void;
}

export interface ObservationTrackViewerHandle {
  readonly track: ObservationTrackLike;
  readonly timeline: ObservationTrackTimelineController;
  play(): void;
  pause(): void;
  seek(progress01: number): void;
  setVisualisation(config: Partial<ObservationVisualisationLike>): void;
  dispose(): void;
}
```

The handle should own all created viewer objects:

- target footprint set
- all-footprints set
- current-footprint set
- ground-track polyline set
- fallback marker point set
- satellite object
- sensor cone
- timeline controller

This avoids leaking cleanup responsibility to demo code.

## Timeline Generalisation

The existing `satelliteTimelineController.js` should become a generic timeline utility for `ObservationTrackLike.samples`.

Recommended production location:

```text
src/observation/ObservationTrackTimeline.ts
```

Keep the current behaviour:

- `play()`
- `pause()`
- `seek(progress01)`
- `destroy()`
- `getState()`
- shortest-path longitude interpolation
- nearest-sample lookup

Generalise sample access:

- read `sample.timestamp`
- read `sample.groundTrackPoint`
- read `sample.footprint`
- output `currentGroundPoint`
- output `currentFootprint`

Footprint interpolation should remain documented as visual-only:

- use it only when adjacent footprints have matching vertex counts
- use shortest-path longitude interpolation
- fall back to nearest sample when unsafe

Authoritative computation remains outside `astro-viewer`.

## Visualisation Config

`ObservationVisualisationConfig` should be interpreted as initial render preferences, not persistent UI state owned by the viewer.

The adapter may apply:

- `showSatelliteModel`
- `showGroundTrack`
- `showFootprint`
- `showSensorCone`
- `showCurrentFootprintOnly`
- `showAllFootprints`

But the source of truth should remain the caller:

- dev demo for local testing
- `astrobrowser-ui` for production widgets

The adapter should expose `setVisualisation(...)` to toggle viewer object visibility. It should not create form controls, buttons, or timeline UI.

## Keeping Computation Out Of astro-viewer

The adapter must not:

- parse TLE
- propagate orbits
- compute ground tracks
- compute sensor footprints
- compute GeoJSON intersections
- infer sensor footprint from FoV

It may:

- validate that render fields are present and finite
- convert footprints to GeoJSON for `TerraFootprintSetGL`
- interpolate display state between samples
- choose nearest sample for highlighted footprints
- update WebGL object visibility and lifecycle

## Minimal Files To Modify When Implementing

Source:

- `src/observation/ObservationTrackTypes.ts`
- `src/observation/ObservationTrackTimeline.ts`
- `src/observation/ObservationTrackViewerAdapter.ts`
- `src/observation/index.ts`
- `src/index.ts`
- `src/html/javascripts/dev/satelliteFootprintDemo.js`

Optional if the adapter needs small viewer facade improvements:

- `src/AstroViewer.ts`

Generated after build/web:

- `dist/*`
- `lib-esm/*`
- `public/javascripts/*`
- `public/javascripts/dev/*`

Do not modify:

- `astrospatial-core`
- `astrobrowser-ui`

## Migration Plan For The Dev Demo

1. Keep the hardcoded ISS Spain fixture initially.
2. Reshape it to match `ObservationTrackLike`.
3. Replace direct demo functions with:

```js
loadedDemo.handle = adapter.load(DEMO_OBSERVATION_TRACK);
```

4. Wire existing dev UI controls to:

```js
handle.play();
handle.pause();
handle.seek(progress01);
```

5. Keep the Spain GeoJSON fetch in demo code until the adapter accepts pre-parsed target overlays cleanly.
6. Remove duplicated demo cleanup once `handle.dispose()` owns all created objects.

The demo should remain dependency-free from `astrospatial-core` packaging. A future integration demo can load a real `ObservationTrack` JSON artifact produced by `astrospatial-core`.

## Public API Considerations

Exporting the adapter from `astro-viewer` is useful for `astrobrowser-ui`, but it should be explicitly render-only:

```ts
export {
  ObservationTrackViewerAdapter
} from "./observation/ObservationTrackViewerAdapter.js";

export type {
  ObservationTrackLike,
  ObservationSampleLike,
  ObservationVisualisationLike
} from "./observation/index.js";
```

Avoid naming it as an analysis API. It should be clear that `astro-viewer` consumes precomputed tracks.

## Risks

### Dependency Direction

If `astro-viewer` imports `astrospatial-core`, the dependency graph becomes less clean:

```text
astrobrowser-ui -> astro-viewer -> astrospatial-core
```

This risks pulling SGP4 and analysis dependencies into viewer-only consumers. Use structural types instead.

### Bundling

`astrospatial-core` depends on `satellite.js`. A runtime import from `astro-viewer` would increase viewer bundle size even for users that only need rendering.

Keeping the adapter structural avoids this.

### Type Drift

Local structural types can drift from `astrospatial-core` types. Mitigation:

- document compatibility with `astrospatial-core` `ObservationTrack`
- keep the adapter field requirements minimal
- add a dev/example test that passes a real generated `ObservationTrack` object

### Public Demo Files

`npm run web` copies source demo files into `public/`. Implementation may change both source and generated public assets. Keep generated files out of committed source unless the repo convention requires them.

### Footprint Shapes

Current demo footprints are simple polygon rings. Future `MultiPolygon` support may require:

- multiple `TerraFootprintSetGL` features
- multiple `SensorConeGL` instances
- selection of the active polygon under the satellite

### Timeline Semantics

Interpolated current footprint is visual-only. If the product needs accurate frame-by-frame analysis, `astrobrowser-ui` should ask `astrospatial-core` to recompute at the current timestamp.

## Recommendation

Implement a render-only `ObservationTrackViewerAdapter` in `astro-viewer` using structural `ObservationTrackLike` objects.

Use it to replace the hardcoded ISS Spain demo wiring first. Then let `astrobrowser-ui` pass real `astrospatial-core` `ObservationTrack` objects into the same adapter once the satellite widget integration begins.

The resulting responsibility split remains:

```text
astrospatial-core: compute ObservationTrack
astrobrowser-ui: own workflow and UI state
astro-viewer: render ObservationTrack-like data
```
