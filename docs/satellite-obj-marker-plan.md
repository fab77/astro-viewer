# Satellite OBJ Marker Plan

## Goal

Render a simple OBJ satellite model in the existing ISS Spain development demo and move it along the current satellite timeline.

This is a design plan only. It does not implement OBJ rendering, does not modify `astrospatial-core`, and does not add production UI or satellite propagation features.

## Existing OBJ And Mesh Code

### AstroViewer MeshHiPS

`astro-viewer` already contains browser-side OBJ parsing and WebGL mesh rendering under:

```text
src/model/meships/
├── OBJMeshParser.ts
├── MeshHiPSTile.ts
├── MeshHiPS.ts
└── MeshHiPSTypes.ts

src/shader/MeshHiPSShaderProgram.ts
```

Reusable pieces:

- `OBJMeshParser.parse(text)` parses OBJ `v` and `f` records.
- It triangulates polygon faces with a fan.
- It supports positive and negative OBJ vertex indices.
- It computes per-vertex normals.
- It returns typed arrays:

```ts
export type MeshHiPSMesh = {
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
};
```

- `MeshHiPSTile.uploadMesh(...)` demonstrates GPU buffer creation:
  - position buffer
  - normal buffer
  - triangle index buffer
  - optional line index buffer
- `MeshHiPSTile.draw(...)` demonstrates:
  - binding position and normal attributes
  - drawing `gl.TRIANGLES`
  - optional wireframe `gl.LINES`
  - buffer disposal
- `MeshHiPSShaderProgram` provides a minimal lit mesh shader with:
  - `aVertexPosition`
  - `aVertexNormal`
  - `uPMatrix`
  - `uVMatrix`
  - `uMMatrix`
  - `uColor`

This is already the right rendering stack for a simple satellite mesh marker.

### 3DHIPS Code

The `3dhips` / `3DHIPS` projects contain OBJ utilities and a standalone viewer:

- `src/obj_mesh.ts`
- `src/hips_obj_from_mesh.ts`
- `viewer/main.js`

Useful concepts:

- simple OBJ parsing
- triangulation
- normal generation
- line index generation for wireframe rendering
- raw WebGL buffer setup

However, these files are not a direct runtime fit for `astro-viewer`:

- `src/obj_mesh.ts` is Node-oriented and uses `fs`.
- `hips_obj_from_mesh.ts` is an offline tiling/generation tool.
- `viewer/main.js` is standalone demo code, not integrated into `AstroSphere`.

Recommendation: do not import 3DHIPS directly. Reuse the concepts and, where needed, port small logic already mirrored by `astro-viewer`'s `OBJMeshParser` and `MeshHiPSTile`.

## Reuse Recommendation

For a minimal satellite OBJ marker, reuse these `astro-viewer` components:

- `OBJMeshParser` for parsing OBJ text.
- `MeshHiPSShaderProgram` for lit position/normal rendering.
- `MeshHiPSTypes` style for mesh and GPU buffer shapes.
- `MeshHiPSTile.uploadMesh(...)` and `dispose()` logic as the reference for buffer management.

Do not reuse `MeshHiPS` directly. It is a tiled terrain/base-layer renderer with FOV-driven tile selection and cache eviction. A satellite model is one small moving object with one model matrix.

## Minimal SatelliteObjectGL Design

Add a dev-compatible but reusable render class:

```text
src/model/terra/SatelliteObjectGL.ts
```

Possible public shape:

```ts
export interface SatelliteObjectOptions {
  readonly name: string;
  readonly objUrl: string;
  readonly color?: [number, number, number, number];
  readonly scale?: number;
  readonly altitudeScale?: number;
  readonly wireframe?: boolean;
}

export interface SatelliteObjectPosition {
  readonly longitudeDeg: number;
  readonly latitudeDeg: number;
  readonly altitudeKm?: number;
  readonly headingDeg?: number;
}

export class SatelliteObjectGL {
  constructor(options, webgl);
  load(): Promise<void>;
  setPosition(position: SatelliteObjectPosition): void;
  setColor(color: [number, number, number, number]): void;
  setScale(scale: number): void;
  setIsVisible(isVisible: boolean): void;
  draw(pMatrix: Float32Array, vMatrix: Float32Array, baseModelMatrix: Float32Array): void;
  dispose(): void;
}
```

Internal state:

```ts
private mesh: MeshHiPSMesh | null;
private gpuMesh: SatelliteGpuMesh | null;
private shader: MeshHiPSShaderProgram;
private objectModelMatrix: mat4;
private ready = false;
private visible = true;
```

GPU mesh can match `MeshHiPSGpuMesh`:

```ts
type SatelliteGpuMesh = {
  positionBuffer: WebGLBuffer | null;
  normalBuffer: WebGLBuffer | null;
  indexBuffer: WebGLBuffer | null;
  lineIndexBuffer: WebGLBuffer | null;
  indexCount: number;
  lineIndexCount: number;
  indexType: number;
};
```

For MVP, triangle rendering is enough. Wireframe can be optional because line index generation already exists in `MeshHiPSTile`.

## OBJ Asset Strategy

Use a very small OBJ file in dev test data:

```text
src/html/test-data/satellite/simple_satellite.obj
```

It can be a low-poly cube/body with two flat panels. Keep it tiny and inspectable.

`npm run web` already copies `src/html/test-data/` to `public/test-data/`, so the dev demo can load:

```text
test-data/satellite/simple_satellite.obj
```

No network access is needed.

## Position From Lon/Lat/Alt

AstroViewer geographic overlays use a unit globe. `Point({ lonDeg, latDeg }, CoordsType.GEOGRAPHIC)` already converts geographic lon/lat to a unit vector in viewer coordinates.

For a satellite at altitude:

```ts
const earthRadiusKm = 6371;
const altitudeKm = position.altitudeKm ?? 0;
const radialScale = 1 + altitudeKm / earthRadiusKm;
const unit = new Point({ lonDeg, latDeg }, CoordsType.GEOGRAPHIC);
const worldPosition = [
  unit.x * radialScale,
  unit.y * radialScale,
  unit.z * radialScale,
];
```

ISS altitude around 410 km gives `radialScale ~= 1.064`, which should visibly place the model above the surface while staying attached to the Earth coordinate frame.

If the model visually intersects the surface, add a small dev-only visual offset:

```ts
const radialScale = 1 + altitudeKm / earthRadiusKm + visualAltitudeOffset;
```

Default `visualAltitudeOffset` should be `0` or very small. Avoid lying too much about position.

## Visual Scale

Real satellite dimensions are far too small for a unit Earth. The object must use a visual scale independent from physical size.

Recommended MVP:

```ts
const objectScale = options.scale ?? 0.025;
```

This means the mesh appears as roughly 2.5% of Earth radius. It is not physically accurate; it is a visual marker.

Expose this clearly as `scale` or `visualScale`, not as real kilometers.

Future improvement: screen-space constant-size marker or zoom-dependent scale.

## Initial Orientation

For the MVP, orient the object in a local tangent frame:

- local `up`: radial outward vector from Earth center to satellite
- local `forward`: direction of motion along the ground track
- local `right`: `cross(forward, up)`

Given previous/current/next marker points from the timeline:

```ts
const up = normalize(worldPosition);
const prev = lonLatAltToWorld(previousPoint);
const next = lonLatAltToWorld(nextPoint);
let forward = normalize(next - prev);
forward = normalize(forward - up * dot(forward, up)); // project onto tangent plane
const right = normalize(cross(forward, up));
const correctedForward = normalize(cross(up, right));
```

Build a model matrix from basis vectors:

```text
right, correctedForward, up, worldPosition
```

Then apply object scale.

Initial axis convention must be chosen for the OBJ:

- model local +Z points "up" from Earth
- model local +Y points forward along track
- model local +X points right

If the OBJ model is authored differently, add a fixed pre-rotation matrix.

For the first implementation, an acceptable fallback is:

- align `up` to radial outward
- use a fixed eastward/northward tangent direction for heading if motion direction is unavailable

## Transform Update From Timeline

The current `satelliteTimelineController` already emits:

- `markerPoint`
- `previousSample`
- `nextSample`
- `nearestSample`
- `nearestSampleIndex`

Extend the demo `onFrame` handler:

```js
loadedDemo.satelliteObject?.setPosition({
  longitudeDeg: frame.markerPoint.longitudeDeg,
  latitudeDeg: frame.markerPoint.latitudeDeg,
  altitudeKm: frame.markerPoint.altitudeKm,
}, {
  previous: frame.previousSample.groundTrackPoint,
  next: frame.nextSample.groundTrackPoint,
});
```

The object should only update its transform matrix. It should not re-upload OBJ buffers per frame.

The current footprint overlay can continue using nearest sample updates; the OBJ marker position can interpolate continuously.

## Rendering Integration

Add a new active object collection to `AstroSphere`:

```ts
private activeSatelliteObjects: SatelliteObjectGL[] = [];
```

Lifecycle methods:

```ts
showSatelliteObject(object: SatelliteObjectGL): SatelliteObjectGL;
deleteSatelliteObject(object: SatelliteObjectGL): void;
```

Draw after footprints, polylines, and point marker overlays:

```ts
for (const object of activeSatelliteObjects) {
  object.draw(pMatrix, cameraMatrix, activeModelMatrix);
}
```

The object's final model matrix should combine:

```text
active base-layer model matrix * object local lon/lat/alt transform
```

This keeps the object in the same coordinate frame as Terra overlays.

## AstroViewer Facade Proposal

Minimal facade methods:

```ts
createSatelliteObject(options: SatelliteObjectOptions): SatelliteObjectGL;
showSatelliteObject(object: SatelliteObjectGL): void;
hideSatelliteObject(object: SatelliteObjectGL, isVisible: boolean): void;
deleteSatelliteObject(object: SatelliteObjectGL): void;
```

Keep this limited to `astro-viewer`. Do not add `astrobrowser-ui` widgets yet.

If the API feels too production-like, keep object creation in the dev module for the first pass. The cleaner long-term path is a real `SatelliteObjectGL` overlay API.

## Dev Demo Integration

Extend `loadedDemo`:

```js
let loadedDemo = {
  country: null,
  footprints: null,
  currentFootprint: null,
  groundTrack: null,
  marker: null,
  satelliteObject: null,
  timeline: null,
};
```

On load:

1. load Spain regions
2. create static footprint overlays
3. create ground-track polyline
4. create current point marker
5. create `SatelliteObjectGL`
6. load OBJ asynchronously
7. create timeline

On timeline frame:

```js
updateSatelliteMarker(...);
loadedDemo.satelliteObject?.setPosition(frame.markerPoint, {
  previous: frame.previousSample.groundTrackPoint,
  next: frame.nextSample.groundTrackPoint,
});
updateCurrentFootprintIfNearestSampleChanged(...);
```

On cleanup:

```js
loadedDemo.timeline?.destroy();
api.deleteSatelliteObject?.(loadedDemo.satelliteObject);
```

## Minimal Files To Modify

Core rendering:

- `src/model/terra/SatelliteObjectGL.ts`
- `src/AstroViewer.ts`
- `src/AstroSphere.ts`
- `src/index.ts`

Potential reusable helper extraction:

- `src/model/meships/MeshUploadUtils.ts`

Only create this if avoiding duplication from `MeshHiPSTile.uploadMesh(...)` is worth it.

Dev demo:

- `src/html/javascripts/dev/satelliteFootprintDemo.js`
- `src/html/test-data/satellite/simple_satellite.obj`

Optional shader:

- reuse `src/shader/MeshHiPSShaderProgram.ts` for MVP
- add `src/shader/SatelliteObjectShaderProgram.ts` later only if object-specific lighting, color, or texture support is needed

No `astrospatial-core` files should be modified.

## Risks And Limitations

### Model Scale Is Not Physical

The OBJ model must be scaled visually. A physically accurate ISS model would be invisible at Earth scale.

### Altitude Is Approximate In Viewer Coordinates

The viewer uses a unit globe. Converting altitude with `1 + altitudeKm / 6371` is consistent with a spherical Earth but not WGS84.

### Orientation Can Be Ambiguous

Ground-track direction is not full spacecraft attitude. It provides a plausible forward direction, not real nadir/velocity/attitude orientation. True attitude requires more state than the demo has.

### OBJ Parser Limitations

Current `OBJMeshParser` supports vertex positions and faces. It ignores:

- materials (`.mtl`)
- texture coordinates
- supplied normals
- smoothing groups
- object/group names

This is acceptable for a simple single-color OBJ marker.

### Depth And Occlusion

With depth testing enabled, the object may disappear behind the globe when on the far side. That is correct for outside-sphere Earth view. Inside-sphere mode and base-layer model matrices must be checked visually.

### Draw Order

The object should draw after overlays. If it draws before footprints or polylines, it may be visually hidden. If it draws without depth testing, it may incorrectly appear through Earth.

### Asset Loading State

The timeline may start before the OBJ finishes loading. The object should no-op draw until ready and then appear at the latest timeline transform.

### WebGL Buffer Cleanup

The object must delete position, normal, index, and optional line-index buffers on demo reload or object deletion.

### Shader Coupling

Reusing `MeshHiPSShaderProgram` is pragmatic but semantically odd. If satellite rendering grows, create a `SatelliteObjectShaderProgram` with the same initial shader code.

## Recommended MVP

1. Reuse `OBJMeshParser` and `MeshHiPSShaderProgram`.
2. Add `SatelliteObjectGL` as a small single-mesh overlay class.
3. Load a tiny local OBJ from `test-data/satellite/simple_satellite.obj`.
4. Convert timeline lon/lat/alt to unit-globe position.
5. Scale visually with a fixed `visualScale`.
6. Orient with radial up and ground-track tangent forward.
7. Update only the model matrix each timeline frame.
8. Draw after Terra overlays in `AstroSphere`.
9. Dispose GPU buffers on demo cleanup.

This gives a visible moving 3D satellite marker without changing propagation, footprint analysis, astrobrowser UI, or production satellite APIs.
