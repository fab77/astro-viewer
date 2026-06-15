# Satellite Timeline Marker Plan

## Goal

Add a minimal timeline controller to the existing ISS Spain development demo so a simple satellite marker moves along the existing `GroundTrackPoint[]` as a function of time.

The MVP should:

- keep using hardcoded demo fixture data
- move one marker along the already-rendered ground-track polyline
- expose play, pause, and seek controls in the dev panel
- update the current footprint polygon together with the marker
- avoid OBJ rendering, satellite meshes, picking, production UI, and `astrospatial-core` changes

## Current Demo State

The ISS Spain dev demo currently loads:

- Spain regions from `test-data/generation/spain_regions.geojson`
- footprint polygons via `TerraFootprintSetGL`
- ground track as an open geographic polyline via `TerraPolylineSetGL`

The fixture in `src/html/javascripts/dev/satelliteFootprintDemo.js` already contains timestamped samples:

```js
{
  timestamp: '2019-06-24T06:20:00.000Z',
  groundTrackPoint: {
    latitudeDeg: 36.620295,
    longitudeDeg: -5.193023,
    altitudeKm: 411.145,
  },
  intersects: true,
  footprint: [[...]],
}
```

This is sufficient for timeline interpolation without calling `astrospatial-core` in the viewer.

## TerraPointSetGL Update Capabilities

`TerraPointSetGL` is a thin subclass of `CatalogueGL`.

`CatalogueGL` already supports:

- `addSources(rows, columns)`
- `addSource(source)`
- `clearSources()`
- lazy buffer rebuild through `_bufferInitialised = false` after `addSources(...)`
- drawing points with `gl.POINTS`

Important implementation detail:

`clearSources()` clears `_sources`, hover state, density map, and `vertexCataloguePosition`, but currently does not explicitly set `_bufferInitialised = false`. If a marker is rebuilt using `clearSources()` followed by `addSources(...)`, `addSources(...)` does mark `_bufferInitialised = false`, so the buffer rebuild should happen on the next draw.

For the timeline MVP, there are two viable approaches:

1. Rebuild a one-point `TerraPointSetGL` whenever the marker position changes.
2. Add a small dedicated marker overlay later.

Recommendation: use `TerraPointSetGL` for the first demo implementation. It is already public, already geographic-capable through the Terra facade, and avoids adding another rendering primitive.

## Can A Point Set Be Updated Every Frame?

It can be updated, but rebuilding a catalogue every animation frame is not ideal:

```js
markerSet.clearSources();
markerSet.addSources([[lon, lat, timestamp, altitudeKm]], columns);
```

For a single marker this is acceptable in a dev demo, but it still causes:

- source object rebuild
- density map rebuild
- buffer rebuild on next draw
- possible hover bookkeeping churn

The better minimal strategy is to update at animation-frame cadence only while playing, but keep the marker set to exactly one source. With a short 9-sample fixture and one marker, this is not a practical performance risk.

Future improvement: add `TerraPointSetGL.setSinglePoint(...)` or a dedicated `TerraMarkerGL` that updates one `Float32Array` and calls `bufferSubData(...)`.

## Timeline Interpolation

Input samples are ordered by timestamp. Convert them once:

```js
const samples = DEMO_OBSERVATIONS.map(sample => ({
  ...sample,
  timeMs: Date.parse(sample.timestamp),
}));
```

Timeline state:

```js
{
  startMs,
  endMs,
  currentMs,
  playing,
  playbackRate,
  rafId,
  lastFrameMs,
}
```

Find the bracketing samples for `currentMs`:

```js
function getTimelineFrame(samples, currentMs) {
  if (currentMs <= samples[0].timeMs) return { previous: samples[0], next: samples[0], t: 0 };
  if (currentMs >= samples.at(-1).timeMs) return { previous: samples.at(-1), next: samples.at(-1), t: 0 };

  for (let index = 0; index < samples.length - 1; index++) {
    const previous = samples[index];
    const next = samples[index + 1];
    if (currentMs >= previous.timeMs && currentMs <= next.timeMs) {
      return {
        previous,
        next,
        t: (currentMs - previous.timeMs) / (next.timeMs - previous.timeMs),
      };
    }
  }
}
```

Interpolate the marker:

```js
function interpolateGroundTrackPoint(previous, next, t) {
  return {
    timestamp: new Date(lerp(previous.timeMs, next.timeMs, t)).toISOString(),
    longitudeDeg: interpolateLongitude(previous.groundTrackPoint.longitudeDeg, next.groundTrackPoint.longitudeDeg, t),
    latitudeDeg: lerp(previous.groundTrackPoint.latitudeDeg, next.groundTrackPoint.latitudeDeg, t),
    altitudeKm: lerp(previous.groundTrackPoint.altitudeKm, next.groundTrackPoint.altitudeKm, t),
  };
}
```

Longitude interpolation must use shortest-path wrapping:

```js
function interpolateLongitude(a, b, t) {
  let delta = normalizeLongitudeDeg(b - a);
  return normalizeLongitudeDeg(a + delta * t);
}
```

This avoids wrong interpolation across the antimeridian if a future fixture crosses +/-180 degrees.

## Current Footprint Update

The simplest implementation should keep the full footprint set visible, and add a second overlay for the current footprint:

- `loadedDemo.footprints`: all footprints, low-contrast cyan
- `loadedDemo.currentFootprint`: one highlighted current footprint, brighter color

On each timeline update:

1. determine the nearest or bracketing sample
2. update the marker with interpolated ground-track position
3. update `currentFootprint` from the nearest sample footprint

For the first MVP, do not interpolate footprint polygon vertices. Use nearest sample by timestamp:

```js
const nearestSample = t < 0.5 ? previous : next;
```

Then rebuild the one-feature `TerraFootprintSetGL`:

```js
api.deleteTerraFootprintSet?.(loadedDemo.currentFootprint);
loadedDemo.currentFootprint = createCurrentFootprintOverlay(api, viewer, nearestSample);
```

This is simple but may churn buffers while playing. Better minimal approach:

- only update current footprint when nearest sample index changes
- marker still updates continuously

That reduces footprint rebuilds from every frame to at most once per sample boundary.

Future improvement: add update methods to `TerraFootprintSetGL` or maintain all footprint polygons and change color/selection state instead of deleting/recreating.

## TimelineController Utility Placement

Recommended location:

```text
src/html/javascripts/dev/satelliteTimelineController.js
```

Reason:

- this is dev-demo specific
- it can stay plain JavaScript with the existing dev panel code
- it avoids production API surface until the interaction model stabilizes
- it does not belong in `astrospatial-core`

Minimal exported factory:

```js
export function createSatelliteTimelineController({
  samples,
  onFrame,
  onStop,
  playbackRate = 1,
}) {
  return {
    play(),
    pause(),
    seek(progress01),
    destroy(),
    getState(),
  };
}
```

`onFrame` receives:

```js
{
  currentMs,
  progress01,
  markerPoint,
  previousSample,
  nextSample,
  nearestSample,
  nearestSampleIndex,
}
```

## Dev Panel Controls

Add controls near the existing "Satellite footprint demo" block in `src/html/index.html`.

Current block contains:

```html
<button id="btnLoadSatelliteFootprintDemo" class="secondary" type="button">Load ISS Spain demo</button>
```

Proposed minimal controls:

```html
<button id="btnSatelliteTimelinePlay" class="secondary" type="button">Play</button>
<button id="btnSatelliteTimelinePause" class="secondary" type="button">Pause</button>
<input id="satelliteTimelineSeek" type="range" min="0" max="1000" value="0" />
<span id="satelliteTimelineTime" class="hint"></span>
```

Controls should be disabled until the demo is loaded.

Wiring belongs in `satelliteFootprintDemo.js` or a small companion module. The cleanest minimal structure:

- `satelliteFootprintDemo.js` owns overlay creation/removal
- `satelliteTimelineController.js` owns time progression
- `satelliteFootprintDemo.js` wires DOM controls to controller methods

## Marker Overlay Strategy

Use one `TerraPointSetGL` marker set:

```js
loadedDemo.marker = createSatelliteMarkerOverlay(api, viewer);
```

Columns:

```js
[
  longitudeDeg,
  latitudeDeg,
  timestamp,
  altitudeKm,
]
```

Initial marker:

```js
updateSatelliteMarker(api, markerSet, firstInterpolatedPoint);
```

Per update:

```js
markerSet.clearSources();
markerSet.addSources([[
  point.longitudeDeg,
  point.latitudeDeg,
  point.timestamp,
  point.altitudeKm,
]], markerColumns);
```

Set marker color with:

```js
api.changeCatalogueColor?.(markerSet, '#ff4d4d');
```

If marker size is too small, encode a shape-size metadata column and call `setCatalogueShapeSize(...)`, or use a larger default in the single source if the existing `CatalogueGL` source mapping supports it.

## Minimal Files To Modify

Implementation:

- `src/html/javascripts/dev/satelliteTimelineController.js`
- `src/html/javascripts/dev/satelliteFootprintDemo.js`
- `src/html/index.html`

Optional if marker update performance or size is insufficient:

- `src/model/terra/TerraPointSetGL.ts`
- `src/model/catalogues/CatalogueGL.ts`

The optional core change would be a targeted helper such as `replaceSources(...)` or `setSingleGeoPoint(...)`, but it is not required for a first dev demo.

No `astrospatial-core` files should be modified.

## Cleanup Lifecycle

Extend `loadedDemo`:

```js
let loadedDemo = {
  country: null,
  footprints: null,
  currentFootprint: null,
  groundTrack: null,
  marker: null,
  timeline: null,
};
```

On reload/clear:

```js
loadedDemo.timeline?.destroy();
if (loadedDemo.marker) api.deleteTerraPointSet?.(loadedDemo.marker);
if (loadedDemo.currentFootprint) api.deleteTerraFootprintSet?.(loadedDemo.currentFootprint);
```

Also cancel any pending `requestAnimationFrame` in the controller.

## Risks And Performance Issues

### Point Set Rebuild Per Frame

Rebuilding a `TerraPointSetGL` every animation frame is heavier than updating one vertex buffer. For one point in a dev demo it is acceptable. Avoid using this approach for thousands of moving objects.

### Footprint Rebuild Per Frame

Rebuilding `TerraFootprintSetGL` every frame would be wasteful. Update current footprint only when the nearest sample index changes.

### Timeline Drift

Use `performance.now()` deltas rather than fixed frame increments. Keep `currentMs` clamped to `[startMs, endMs]`.

### Antimeridian Interpolation

Marker interpolation should use normalized shortest-path longitude interpolation. This fixture does not cross the antimeridian, but the utility should handle it now.

### Demo State Duplication

The demo already has fixture data for ground track and footprints. The timeline should consume that fixture directly and avoid recomputing propagation or footprints in `astro-viewer`.

### Render Ordering

The marker should render above country, footprint, and ground-track overlays. Since `TerraPointSetGL` draws as a catalogue, it currently draws before footprint sets. If the marker appears hidden, either:

- draw marker as a later overlay in a dedicated active collection, or
- create the marker as a small highlighted footprint/circle later, or
- adjust draw order for this dev demo.

For the MVP, test visually before changing global draw order.

### Control State

Controls should be disabled until the demo is loaded and reset when overlays are removed. Otherwise seek/play can call into disposed overlays.

## Recommended MVP Plan

1. Add `satelliteTimelineController.js` with play/pause/seek and interpolation helpers.
2. Add play/pause/range/time controls to the dev panel.
3. In `satelliteFootprintDemo.js`, create:
   - static Spain regions overlay
   - static all-footprints overlay
   - static ground-track polyline overlay
   - dynamic one-point marker overlay
   - dynamic current-footprint overlay
4. On timeline frame:
   - update marker every frame
   - update seek slider and timestamp label
   - update current footprint only when nearest sample index changes
5. On cleanup:
   - pause/destroy controller
   - delete marker and current-footprint overlays
   - delete existing static overlays

This gives a usable moving satellite marker without adding animation infrastructure to production APIs or changing `astrospatial-core`.
