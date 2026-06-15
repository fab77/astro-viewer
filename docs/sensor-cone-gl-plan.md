# SensorConeGL Plan

## Goal

Render a minimal sensor frustum from the animated satellite marker to the current footprint polygon in the ISS Spain development demo.

This is a design plan only. It does not modify `astrospatial-core`, does not modify `astrobrowser-ui`, and does not implement `SensorConeGL`.

## Current Demo Context

The current ISS Spain dev demo already has the data needed to draw a nadir sensor volume:

- `frame.markerPoint`: interpolated satellite lon/lat/alt for the current timeline frame.
- `frame.nearestSample.footprint`: current sampled footprint polygon in `[longitudeDeg, latitudeDeg]` coordinates.
- `SatelliteObjectGL`: animated OBJ marker updated on every timeline frame.
- `TerraPolylineSetGL`: static ground track.
- `TerraFootprintSetGL`: static all-footprints overlay plus dynamic current footprint overlay.
- `satelliteTimelineController`: play/pause/seek and frame interpolation.

The cone should be a viewer-side visualization of already computed data. It should not compute sensor geometry or alter `astrospatial-core`.

## Existing Shader Infrastructure

### Useful Existing Pieces

`FootprintShaderProgram` is suitable for simple colored line rendering:

- accepts position-only vertices
- applies projection and model-view matrices
- supports uniform color with alpha
- already used by `TerraPolylineSetGL`

`MeshHiPSShaderProgram` is suitable for lit triangle meshes:

- accepts positions and normals
- supports uniform color with alpha
- is currently used by MeshHiPS and `SatelliteObjectGL`

`TerraPolylineSetGL` is the best lifecycle reference for:

- converting lon/lat to `Point(..., CoordsType.GEOGRAPHIC)`
- building WebGL buffers
- drawing dynamic line primitives
- disposing buffers

`SatelliteObjectGL` is the best reference for:

- standalone terra-side render object
- `AstroSphere` lifecycle integration
- per-frame transform updates
- draw-after-terra-overlays behavior

### Gaps

There is no dedicated transparent mesh shader for unlit colored geometry. Reusing `MeshHiPSShaderProgram` for filled cone faces would work, but it would add lighting behavior that is not needed for a sensor volume and may make the cone visually noisy.

For the MVP, use wireframe first. If filled faces are added, prefer a tiny dedicated unlit shader rather than stretching `MeshHiPSShaderProgram` further.

## Recommended MVP

Implement `SensorConeGL` as wireframe-only first.

Wireframe should render:

- footprint perimeter
- rays from satellite apex to footprint vertices
- optional closing ray/perimeter segment for closed polygons

This gives a clear frustum without the depth sorting complexity of transparent faces.

Add transparent side faces only after the wireframe is stable.

## Minimal SensorConeGL Design

Add:

```text
src/model/terra/SensorConeGL.ts
```

Proposed types:

```ts
export interface SensorConePoint {
  readonly longitudeDeg: number;
  readonly latitudeDeg: number;
  readonly altitudeKm?: number;
}

export interface SensorConeOptions {
  readonly name: string;
  readonly color?: [number, number, number, number];
  readonly wireframe?: boolean;
  readonly filled?: boolean;
}

export class SensorConeGL {
  constructor(options: SensorConeOptions, webgl: WebGL2RenderingContext);
  setIsVisible(isVisible: boolean): void;
  setColor(color: [number, number, number, number]): void;
  setGeometry(apex: SensorConePoint, footprint: readonly [number, number][]): void;
  clear(): void;
  draw(pMatrix: Float32Array, vMatrix: Float32Array, baseModelMatrix: Float32Array): void;
  dispose(): void;
}
```

Internal state:

```ts
private lineBuffer: WebGLBuffer | null;
private lineVertexCount = 0;
private fillPositionBuffer: WebGLBuffer | null;
private fillIndexBuffer: WebGLBuffer | null;
private fillIndexCount = 0;
private visible = true;
private dirty = true;
```

For the first implementation, only `lineBuffer` is required.

## Coordinate Conversion

Use the same geographic conversion convention as terra overlays and `SatelliteObjectGL`.

Satellite apex:

```ts
const point = new Point(
  { lonDeg: longitudeDeg, latDeg: latitudeDeg },
  CoordsType.GEOGRAPHIC,
);

const radialScale = 1 + altitudeKm / 6371;
const apex = [
  point.x * radialScale,
  point.y * radialScale,
  point.z * radialScale,
];
```

Footprint vertices:

```ts
const point = new Point(
  { lonDeg: footprintLonDeg, latDeg: footprintLatDeg },
  CoordsType.GEOGRAPHIC,
);

const surface = [point.x, point.y, point.z];
```

The `SensorConeGL` vertex positions should be local to the active Earth model matrix, exactly like `TerraPolylineSetGL`, `TerraFootprintSetGL`, and `SatelliteObjectGL`. `AstroSphere` will pass the active base-layer model matrix at draw time.

## Footprint Polygon Handling

`astrospatial-core` footprint polygons are closed. GeoJSON polygon rings are also commonly closed. `SensorConeGL.setGeometry(...)` should normalize this:

1. reject non-finite lon/lat
2. reject latitudes outside `[-90, 90]`
3. normalize longitudes to `[-180, 180)`
4. remove duplicate closing coordinate if first and last lon/lat match
5. require at least 3 unique footprint vertices

For polygons with more than 4 vertices, keep all vertices. The current footprint samples have many boundary points because the rectangular FoV is sampled along boundary rays. A cone/frustum drawn to every boundary point represents that sampled boundary better than reducing it to four corners.

Wireframe construction:

```text
for each footprint vertex:
  add line apex -> vertex

for each footprint edge:
  add line vertex[i] -> vertex[(i + 1) % n]
```

Use `gl.LINES`, not `LINE_STRIP`, because the geometry is a set of independent rays and ring segments.

Filled construction, future step:

```text
side faces:
  triangle apex, vertex[i], vertex[i + 1]

base face:
  optional triangle fan from footprint centroid to ring vertices
```

Do not render the base face in the MVP. The existing current `TerraFootprintSetGL` already marks the footprint on Earth.

## Antimeridian Handling

For the ISS Spain demo, current samples do not cross the antimeridian. The MVP can document this limitation.

For broader use, the cone should not simply split the footprint ring at longitude jumps like `TerraPolylineSetGL`, because a frustum side from apex to footprint may still be valid across the split. Robust global support needs a consistent footprint representation from `astrospatial-core`, likely either:

- multiple rings split at the antimeridian, or
- ECF/cartesian footprint vertices supplied directly

MVP recommendation:

- support normal polygons that do not cross the antimeridian
- skip drawing if normalized adjacent longitude delta exceeds 180 degrees
- log a debug warning only in dev builds if useful

## Render Mode

### Wireframe First

Recommended first implementation:

- `gl.LINES`
- color cyan or red-orange with alpha around `0.65`
- depth test enabled
- depth mask unchanged or disabled only during draw

This is simple, readable, and avoids most transparency sorting issues.

### Transparent Faces Later

Filled side faces can be added behind an option:

```ts
filled: true
```

If added:

- use a dedicated unlit `SensorConeShaderProgram`
- render side triangles with alpha around `0.14-0.22`
- disable face culling
- enable blending
- set `depthMask(false)` while drawing filled faces
- restore previous GL state after drawing
- draw wireframe after filled faces

Transparent geometry will still have ordering artifacts without sorting. For one cone this is acceptable in a dev demo, but not a general solution.

## Draw Order

Current `AstroSphere.draw(...)` order after base layer:

1. catalogues / point sets
2. footprint sets
3. polyline sets
4. satellite objects

Recommended order:

1. catalogues / point sets
2. footprint sets
3. polyline sets
4. sensor cones
5. satellite objects

Drawing the cone before the satellite object keeps the OBJ marker visible at the apex. Drawing the cone after footprints keeps the frustum visually attached to the current footprint.

For transparent filled faces, draw:

1. cone filled faces
2. cone wireframe
3. satellite object

## GL State Management

`AstroSphere` currently enables depth test and disables culling before drawing terra overlays.

`SensorConeGL.draw(...)` should preserve and restore:

- `BLEND`
- `DEPTH_TEST`
- `DEPTH_WRITEMASK`
- `CULL_FACE`
- `DEPTH_FUNC`

Recommended wireframe state:

```ts
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
gl.enable(gl.DEPTH_TEST);
gl.depthMask(false);
gl.disable(gl.CULL_FACE);
```

Then restore previous state. `depthMask(false)` prevents the cone lines from polluting the depth buffer before the satellite object draws.

For filled faces, use the same state but draw triangles before lines.

## Minimal AstroSphere Lifecycle

Add import:

```ts
import { SensorConeGL } from "./model/terra/SensorConeGL.js";
```

Add collection:

```ts
private activeSensorCones: SensorConeGL[] = [];
```

Add methods:

```ts
async showSensorCone(sensorCone: SensorConeGL) {
  if (sensorCone) this.activeSensorCones.push(sensorCone);
  return sensorCone;
}

deleteSensorCone(sensorCone: SensorConeGL) {
  this.activeSensorCones = this.activeSensorCones.filter((cone) => cone !== sensorCone);
  sensorCone.dispose();
}
```

Draw after polyline sets and before satellite objects:

```ts
this.activeSensorCones.forEach((cone) => {
  const activeModelMatrix =
    this._activeHiPS?.getModelMatrix() ??
    this._activeXYZ2?.getModelMatrix() ??
    this._activeMeshHiPS?.getModelMatrix();

  if (activeModelMatrix) {
    cone.draw(
      this._perspectiveMatrixManager.pMatrix as Float32Array,
      this._camera.getCameraMatrix() as Float32Array,
      activeModelMatrix as Float32Array,
    );
  }
});
```

## Minimal AstroViewer Facade

Add:

```ts
createSensorCone(options: SensorConeOptions): SensorConeGL;
showSensorCone(sensorCone: SensorConeGL): void;
hideSensorCone(sensorCone: SensorConeGL, isVisible: boolean): void;
deleteSensorCone(sensorCone: SensorConeGL): void;
```

Export:

```ts
export { SensorConeGL } from "./model/terra/SensorConeGL.js";
export type { SensorConeOptions, SensorConePoint } from "./model/terra/SensorConeGL.js";
```

Keep this in `astro-viewer`; do not add astrobrowser UI controls yet.

## Minimal Dev Demo Changes

In `satelliteFootprintDemo.js`:

1. Add `sensorCone: null` to `loadedDemo`.
2. Create the cone after `satelliteObject`:

```js
loadedDemo.sensorCone = api.createSensorCone({
  name: "Demo ISS sensor cone",
  color: [0.0, 1.0, 0.95, 0.68],
  wireframe: true,
  filled: false,
});
api.showSensorCone?.(loadedDemo.sensorCone);
```

3. Update it on every timeline frame:

```js
updateSensorCone(loadedDemo.sensorCone, frame);
```

4. Implement:

```js
function updateSensorCone(sensorCone, frame) {
  if (!sensorCone || typeof sensorCone.setGeometry !== "function") return;
  sensorCone.setGeometry(frame.markerPoint, frame.nearestSample.footprint);
}
```

5. Delete it during cleanup:

```js
if (loadedDemo.sensorCone) api.deleteSensorCone?.(loadedDemo.sensorCone);
```

This uses nearest-sample footprint, matching the existing current footprint overlay update behavior. A future smoother version can interpolate footprint boundary vertices between samples if both adjacent samples have matching vertex counts.

## Updating Every Timeline Frame

Wireframe cone geometry can be rebuilt on every timeline frame. Current demo data is small:

- one apex
- one footprint ring with roughly 16 coordinates
- line vertex count around `2 * n rays + 2 * n perimeter vertices`

This is cheap. The implementation should use `gl.DYNAMIC_DRAW` for line buffer updates.

Optimization if needed:

- allocate a larger buffer once
- update with `bufferSubData`
- rebuild only when footprint vertex count changes

This is not necessary for the MVP.

## Footprint Interpolation

For MVP:

- interpolate only satellite apex through `frame.markerPoint`
- use `frame.nearestSample.footprint` for the footprint ring

This means the cone footprint snaps once per minute, just like the current footprint overlay. That is acceptable for a dev demo and avoids inventing geometry interpolation.

Future:

- if `previousSample.footprint.length === nextSample.footprint.length`, interpolate each footprint vertex longitude/latitude using shortest-path longitude interpolation
- otherwise keep nearest-sample fallback

## Minimal Files To Modify When Implementing

Source:

- `src/model/terra/SensorConeGL.ts`
- `src/AstroSphere.ts`
- `src/AstroViewer.ts`
- `src/index.ts`
- `src/html/javascripts/dev/satelliteFootprintDemo.js`

Optional shader:

- `src/shader/SensorConeShaderProgram.ts` for filled faces

Generated after build/web:

- `dist/*`
- `lib-esm/*`
- `public/javascripts/*`
- `public/javascripts/dev/satelliteFootprintDemo.js`

No changes needed in:

- `astrospatial-core`
- `astrobrowser-ui`
- `3dhips`

## Risks And Limitations

- Transparent filled cones can have sorting artifacts because WebGL alpha blending is order-dependent.
- Depth interactions near the globe limb may hide parts of the cone; this is physically reasonable but may be surprising.
- `gl.LINE` width is effectively 1 px on most WebGL implementations. Thick lines require a billboard/tube implementation and should be out of scope.
- Footprints crossing the antimeridian need special handling and should be skipped or split explicitly in the MVP.
- Using nearest-sample footprint causes visible snapping once per sample interval.
- If the satellite apex is behind Earth relative to the camera, the cone may be partially or fully depth-occluded.
- Filled side faces with `depthMask(false)` avoid corrupting later depth tests but can render through some existing transparent overlays.
- Large footprint polygons are fine for line rendering, but filled fan triangulation may fail for concave rings. Side faces are safe; base face triangulation should be avoided initially.

## Proposed Implementation Plan

1. Add `SensorConeGL` wireframe-only with `setGeometry(...)`, `draw(...)`, and `dispose()`.
2. Convert apex and footprint lon/lat to unit-globe coordinates using `Point(..., CoordsType.GEOGRAPHIC)`.
3. Build `gl.LINES` vertices for apex rays and footprint perimeter.
4. Add `AstroSphere` lifecycle and draw after polylines, before satellite objects.
5. Add `AstroViewer` facade methods and public exports.
6. Wire the dev demo to create/update/delete the cone.
7. Run `npm test`, `npm run build`, and `npm run web`.
8. Validate visually with play/pause/seek and camera rotation.
9. Add transparent filled side faces only after wireframe is stable.

## Recommendation

Implement wireframe-only `SensorConeGL` first. It provides the key visual relationship between satellite, sensor direction, and footprint with low rendering risk. Keep filled translucent faces optional and deferred until the line version is verified in the ISS Spain demo.
