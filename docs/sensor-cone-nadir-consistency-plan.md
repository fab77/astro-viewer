# Sensor Cone Nadir Consistency Plan

## Goal

Analyse why the current ISS Spain dev demo sensor cone looks target-locked to discrete footprint samples and define a minimal path toward continuous nadir-consistent behaviour.

This is an analysis and design plan only. It does not modify `astrospatial-core`, does not modify `astrobrowser-ui`, and does not implement changes.

## Current Demo Linkage

The current dev demo uses a flat hardcoded fixture:

```js
const DEMO_OBSERVATIONS = [
  {
    timestamp,
    groundTrackPoint,
    intersects,
    footprint,
  },
];
```

The timeline controller converts those samples into frames:

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

Current linkage:

- `SatelliteObjectGL` uses `frame.markerPoint`.
- The red fallback `TerraPointSetGL` marker uses `frame.markerPoint`.
- The current footprint overlay uses `frame.nearestSample.footprint`.
- `SensorConeGL` uses `frame.markerPoint` as apex and `frame.nearestSample.footprint` as base.

This means only the apex moves continuously. The base footprint snaps from one precomputed footprint to the next when `nearestSampleIndex` changes. Visually, the frustum appears anchored to a discrete target polygon rather than behaving like a continuously recomputed nadir-pointing sensor.

## Current Data Model Gap

There is no explicit satellite/sensor/observation-track object in the demo.

The demo has:

- hardcoded observation samples
- an implicit ISS identity in UI strings
- an implicit sensor model in comments and fixture origin
- no runtime `SatelliteState`
- no runtime `SensorModel`
- no current interpolated observation object
- no distinction between raw samples, interpolated state, display overlays, and analysis result

The closest structured model is in `astrospatial-core`, where the real example creates:

```js
const sensor = {
  name: "Example nadir optical sensor",
  fieldOfViewDeg: 30,
  pointingMode: "nadir"
};

const groundTrack = computeGroundTrack(propagator, interval);
const observations = groundTrack.map((point) => {
  const state = propagator.propagate(point.timestamp);
  const footprint = computeSensorFootprint(state, sensor, { maxVertices: 16 });
  return { timestamp, groundTrackPoint, footprint, intersects };
});
```

The viewer fixture preserved only the render-ready sample outputs.

## Minimal Observation Track Structure

Introduce a demo-only structure before adding more rendering behaviour. This should live in `satelliteFootprintDemo.js` or a nearby dev fixture module.

Proposed shape:

```js
const DEMO_OBSERVATION_TRACK = {
  satellite: {
    id: "iss",
    name: "ISS (ZARYA)",
    tleName: "ISS (ZARYA)",
  },
  sensor: {
    name: "Demo nadir optical sensor",
    pointingMode: "nadir",
    fieldOfViewDeg: 30,
    footprintVertexCount: 16,
  },
  target: {
    name: "Spain regions",
    geojsonUrl: SPAIN_REGIONS_GEOJSON_URL,
  },
  samples: DEMO_OBSERVATIONS,
};
```

Frame-level structure:

```js
{
  currentMs,
  progress01,
  previousSample,
  nextSample,
  nearestSample,
  nearestSampleIndex,
  interpolationT,
  currentGroundPoint,
  currentFootprint,
}
```

Naming change:

- keep `markerPoint` for backward compatibility in the demo
- also expose `currentGroundPoint` as the semantically clearer name

This would make the data flow explicit:

```text
ObservationTrack
  -> timeline frame
  -> current interpolated ground point
  -> current footprint
  -> marker, OBJ, current footprint overlay, sensor cone
```

## Option A: Interpolate Footprint Vertices

Interpolate the footprint ring between `previousSample.footprint` and `nextSample.footprint`.

Requirements:

- both footprints must have the same number of vertices
- vertices must correspond by index
- longitudes need shortest-path interpolation
- closed duplicate point should be removed before interpolation and restored if needed

Algorithm:

```js
function interpolateFootprint(previous, next, t) {
  const left = normalizeOpenRing(previous.footprint);
  const right = normalizeOpenRing(next.footprint);
  if (left.length !== right.length || left.length < 3) {
    return nearestSample.footprint;
  }

  const ring = left.map(([leftLon, leftLat], index) => {
    const [rightLon, rightLat] = right[index];
    return [
      interpolateLongitude(leftLon, rightLon, t),
      lerp(leftLat, rightLat, t),
    ];
  });

  ring.push(ring[0]);
  return ring;
}
```

Pros:

- minimal change
- no new runtime dependency
- no astrospatial-core package wiring needed in `astro-viewer`
- keeps the cone base moving smoothly
- works with the current fixture because all samples use the same footprint sampling pattern

Cons:

- it is a visual interpolation, not a physical sensor recomputation
- assumes stable vertex correspondence across samples
- can become wrong near antimeridian crossings
- can distort footprints if the underlying sensor model changes vertex ordering or count
- still snaps if vertex counts differ

Fit:

Best short-term option for the dev demo.

## Option B: Recompute Footprint From astrospatial-core At Runtime

Use `astrospatial-core` directly in the dev demo:

```text
TLE + timestamp -> SGP4 SatelliteState -> computeSensorFootprint -> footprint
```

Pros:

- physically and architecturally correct
- keeps marker, current footprint, cone, and analysis output tied to one computation pipeline
- matches the long-term product direction
- eliminates fixture drift

Cons:

- requires package wiring between `astro-viewer` dev app and `astrospatial-core`
- the current marker point is geodetic-only; recomputation needs `SatelliteState` or a propagator
- may require bundling `satellite.js` into the viewer dev app
- makes the viewer demo less standalone
- runtime propagation inside the viewer should not become the production integration pattern by accident

Fit:

Best long-term computational approach, but should be coordinated through `astrobrowser-ui` or a dedicated integration layer rather than ad hoc viewer demo code.

## Option C: Viewer-Only Approximate Nadir Footprint

Compute a simplified footprint directly from `markerPoint` and `sensor.fieldOfViewDeg` in `astro-viewer`.

For a spherical Earth, given:

- sub-satellite lon/lat
- altitude
- FoV

The viewer could approximate a circular or rectangular footprint around the sub-satellite point and update it every frame.

Pros:

- continuous and visually nadir-consistent
- no dependency on `astrospatial-core`
- can be built entirely from `markerPoint`
- useful for an illustrative demo

Cons:

- duplicates computational responsibility already owned by `astrospatial-core`
- risks diverging from core results
- would create two sensor footprint implementations
- rectangular FoV orientation is ambiguous from ground point alone
- easy to accidentally ship as real analysis logic

Fit:

Not recommended except as a clearly labelled visual-only fallback. It violates the current separation of concerns if it becomes anything more than a demo approximation.

## Recommended Short-Term Demo Fix

Use Option A: interpolate footprint polygon vertices between adjacent samples.

Also introduce the minimal `DEMO_OBSERVATION_TRACK` structure to make the fixture semantics explicit.

Short-term changes should be:

1. Wrap `DEMO_OBSERVATIONS` in `DEMO_OBSERVATION_TRACK`.
2. Add sensor metadata:

```js
sensor: {
  name: "Demo nadir optical sensor",
  pointingMode: "nadir",
  fieldOfViewDeg: 30,
  footprintVertexCount: 16,
}
```

3. Add `interpolationT` and `currentFootprint` to timeline frames.
4. Compute `currentFootprint` by interpolating matching footprint rings.
5. Update `SensorConeGL` from:

```js
sensorCone.setGeometry(frame.markerPoint, frame.nearestSample.footprint);
```

to:

```js
sensorCone.setGeometry(frame.currentGroundPoint, frame.currentFootprint);
```

6. Optionally update the current footprint overlay from `currentFootprint` every frame, or keep the overlay nearest-sample-only while making the cone continuous.

Recommended display behaviour:

- cone uses interpolated `currentFootprint`
- OBJ marker uses interpolated `currentGroundPoint`
- fallback point marker uses interpolated `currentGroundPoint`
- current footprint overlay may remain nearest-sample at first to avoid rebuilding `TerraFootprintSetGL` every frame

If the overlay remains nearest-sample-only, label the cone as the continuous display and the red footprint as the sampled analysis footprint in code comments.

## Recommended Long-Term Integration

For `astrobrowser-ui`, use Option B through `astrospatial-core`.

The UI should own orchestration:

```text
User inputs
  -> TLE
  -> time interval
  -> sensor model
  -> target GeoJSON
  -> astrospatial-core analysis
  -> observation track result
  -> astro-viewer render adapters
```

Recommended long-term result shape:

```ts
interface ObservationTrack {
  satellite: {
    id?: string;
    name?: string;
    tle?: TLE;
  };
  sensor: SensorModel;
  target?: {
    id?: string;
    name?: string;
    geojson?: GeoJSONLike;
  };
  samples: ObservationSample[];
}

interface ObservationSample {
  timestamp: Date;
  state: SatelliteState;
  groundTrackPoint: GroundTrackPoint;
  footprint: FootprintPolygon;
  intersectsTarget: boolean;
}
```

For timeline playback, the UI or an integration helper can compute:

```ts
interface ObservationFrame {
  timestamp: Date;
  state?: SatelliteState;
  groundTrackPoint: GroundTrackPoint;
  footprint: FootprintPolygon;
  previousSample: ObservationSample;
  nextSample: ObservationSample;
  interpolationT: number;
}
```

Preferred long-term behaviour:

- recompute from propagator and sensor model at the requested timestamp when accuracy matters
- use interpolation only as a render optimization for playback
- keep `astro-viewer` as a renderer of plain data
- avoid putting propagation or sensor projection algorithms in `astro-viewer`

## Notes On Nadir Consistency

For nadir mode, the cone axis should connect:

```text
satellite position
  -> sub-satellite ground point
  -> footprint centroid
```

The current demo violates this during playback because:

- apex is interpolated continuously
- base is nearest-sample discrete

Interpolating the footprint reduces the visual mismatch. Recomputing via `astrospatial-core` eliminates it.

## Risks

- Footprint interpolation may create invalid rings if sample topology changes.
- Interpolating lon/lat directly is acceptable for this small Spain pass but not globally robust.
- Current footprint overlay rebuilding every frame may be expensive or visually noisy.
- A viewer-only footprint approximation could confuse renderer responsibilities.
- Runtime core integration in `astro-viewer` could create packaging/dependency coupling that should belong in `astrobrowser-ui`.

## Final Recommendation

For the current dev demo, implement a minimal observation-track fixture and interpolate footprint vertices between adjacent samples. This keeps the demo dependency-light and makes the sensor cone visually nadir-consistent enough for development.

For production and `astrobrowser-ui`, drive the timeline from `astrospatial-core` observation samples and recompute or core-interpolate footprints through a shared analysis/integration layer. `astro-viewer` should continue to render only the supplied satellite, footprint, cone, and overlay data.
