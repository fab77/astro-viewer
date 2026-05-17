/**
 * Ray picking helpers for XYZ/WebMercator maps.
 *
 * Unlike RayPickingUtils, this module has no HEALPix dependency. It intersects
 * screen rays with an XYZ sphere, converts the hit to lon/lat, then maps that
 * position to XYZ z/x/y tile coordinates.
 */
'use strict';

import { mat4, ReadonlyMat4, ReadonlyVec3, vec3 } from 'gl-matrix';

import Camera from '../Camera.js';
import { AbstractSkyEntity } from '../model/AbstractSkyEntity.js';
import type { XYZTileCoord } from '../model/earth2/XYZTypes.js';

type GL = WebGLRenderingContext | WebGL2RenderingContext;

export type XYZLonLat = {
  lonDeg: number;
  latDeg: number;
};

const MAX_MERCATOR_LAT = 85.0511287798066;

class XYZRayPickingUtils {
  static getRayFromMouse(
    mouseX: number,
    mouseY: number,
    pMatrix: ReadonlyMat4,
    webgl: WebGL2RenderingContext,
    vMatrix: ReadonlyMat4,
  ): vec3 {
    const gl = webgl as GL;
    const canvas = gl.canvas as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();

    const x = (2.0 * mouseX) / rect.width - 1.0;
    const y = 1.0 - (2.0 * mouseY) / rect.height;
    const rayClip: [number, number, number, number] = [x, y, -1.0, 1.0];

    const pInv = mat4.create();
    mat4.invert(pInv, pMatrix);
    const rayEye4: [number, number, number, number] = [0, 0, 0, 0];
    XYZRayPickingUtils.mat4MultiplyVec4(pInv, rayClip, rayEye4);

    const rayEye: [number, number, number, number] = [rayEye4[0], rayEye4[1], -1.0, 0.0];
    const vInv = mat4.create();
    mat4.invert(vInv, vMatrix);
    const rayWorld4: [number, number, number, number] = [0, 0, 0, 0];
    XYZRayPickingUtils.mat4MultiplyVec4(vInv, rayEye, rayWorld4);

    const rayWorld = vec3.fromValues(rayWorld4[0], rayWorld4[1], rayWorld4[2]);
    vec3.normalize(rayWorld, rayWorld);
    return rayWorld;
  }

  static raySphere(
    rayOrigWorld: ReadonlyVec3,
    rayDirectionWorld: ReadonlyVec3,
    sphere: Pick<AbstractSkyEntity, 'center' | 'radius'>,
  ): number {
    let intersectionDistance = -1;
    const L = vec3.create();
    vec3.subtract(L, rayOrigWorld, sphere.center);

    const b = vec3.dot(rayDirectionWorld, L);
    const c = vec3.dot(L, L) - sphere.radius * sphere.radius;
    const disc = b * b - c;

    if (disc > 0.0) {
      const s = Math.sqrt(disc);
      const ta = -b + s;
      const tb = -b - s;

      if (ta >= 0.0 || tb >= 0.0) {
        intersectionDistance = tb < 0.0 ? ta : Math.min(ta, tb);
      }
    } else if (disc === 0.0) {
      const t = -b;
      if (t >= 0.0) {
        intersectionDistance = t;
      }
    }

    return intersectionDistance;
  }

  static getIntersectionPointWithModel(
    mouseX: number,
    mouseY: number,
    xyzModel: AbstractSkyEntity,
    webgl: WebGL2RenderingContext,
    camera: Camera,
    pMatrix: ReadonlyMat4,
  ): [number, number, number] | null {
    const vMatrix = camera.getCameraMatrix();
    const rayWorld = XYZRayPickingUtils.getRayFromMouse(mouseX, mouseY, pMatrix, webgl, vMatrix);
    const t = XYZRayPickingUtils.raySphere(
      camera.getCameraPosition() as ReadonlyVec3,
      rayWorld,
      xyzModel,
    );

    if (t < 0) {
      return null;
    }

    const worldHit = vec3.create();
    vec3.scale(worldHit, rayWorld, t);
    vec3.add(worldHit, camera.getCameraPosition() as ReadonlyVec3, worldHit);

    const worldHit4: [number, number, number, number] = [worldHit[0], worldHit[1], worldHit[2], 1.0];
    const modelHit4: [number, number, number, number] = [0, 0, 0, 0];
    XYZRayPickingUtils.mat4MultiplyVec4(xyzModel.getModelMatrixInverse(), worldHit4, modelHit4);

    return [modelHit4[0], modelHit4[1], modelHit4[2]];
  }

  static getLonLatFromMouse(
    mouseX: number,
    mouseY: number,
    xyzModel: AbstractSkyEntity,
    webgl: WebGL2RenderingContext,
    camera: Camera,
    pMatrix: ReadonlyMat4,
  ): XYZLonLat | null {
    const hit = XYZRayPickingUtils.getIntersectionPointWithModel(
      mouseX,
      mouseY,
      xyzModel,
      webgl,
      camera,
      pMatrix,
    );

    return hit ? XYZRayPickingUtils.modelPointToLonLat(hit) : null;
  }

  static getTileFromMouse(
    mouseX: number,
    mouseY: number,
    z: number,
    xyzModel: AbstractSkyEntity,
    webgl: WebGL2RenderingContext,
    camera: Camera,
    pMatrix: ReadonlyMat4,
  ): XYZTileCoord | null {
    const lonLat = XYZRayPickingUtils.getLonLatFromMouse(
      mouseX,
      mouseY,
      xyzModel,
      webgl,
      camera,
      pMatrix,
    );

    if (!lonLat || !XYZRayPickingUtils.isMercatorLatitude(lonLat.latDeg)) {
      return null;
    }

    return XYZRayPickingUtils.lonLatToTile(lonLat.lonDeg, lonLat.latDeg, z);
  }

  static getVisibleTilesFromViewport(
    z: number,
    xyzModel: AbstractSkyEntity,
    webgl: WebGL2RenderingContext,
    camera: Camera,
    pMatrix: ReadonlyMat4,
    sampleCount = 9,
    padding = 2,
  ): XYZTileCoord[] {
    const gl = webgl as GL;
    const canvas = gl.canvas as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const samples = Math.max(2, Math.floor(sampleCount));
    const edgeSamples = Math.max(samples * 2 + 1, 21);
    const safePadding = Math.max(0, Math.floor(padding));
    const tiles: XYZTileCoord[] = [];

    const addSample = (x: number, y: number): void => {
      const tile = XYZRayPickingUtils.getTileFromMouse(x, y, z, xyzModel, webgl, camera, pMatrix);
      if (!tile) return;

      tiles.push(tile);
      tiles.push(...XYZRayPickingUtils.getNeighborTiles(tile, safePadding));
    };

    for (let iy = 0; iy < samples; iy++) {
      const y = samples === 1 ? rect.height / 2 : (iy / (samples - 1)) * rect.height;
      for (let ix = 0; ix < samples; ix++) {
        const x = samples === 1 ? rect.width / 2 : (ix / (samples - 1)) * rect.width;
        addSample(x, y);
      }
    }

    for (let i = 0; i < edgeSamples; i++) {
      const t = edgeSamples === 1 ? 0.5 : i / (edgeSamples - 1);
      const x = t * rect.width;
      const y = t * rect.height;

      addSample(x, 0);
      addSample(x, rect.height);
      addSample(0, y);
      addSample(rect.width, y);
    }

    return XYZRayPickingUtils.fillSmallTileGaps(XYZRayPickingUtils.deduplicateTiles(tiles));
  }

  static modelPointToLonLat(point: Readonly<[number, number, number]>): XYZLonLat {
    const [x, y, z] = point;
    const len = Math.hypot(x, y, z);
    if (!Number.isFinite(len) || len === 0) {
      return { lonDeg: 0, latDeg: 0 };
    }

    const lonDeg = (Math.atan2(y, x) * 180) / Math.PI;
    const latDeg = (Math.asin(Math.max(-1, Math.min(1, z / len))) * 180) / Math.PI;

    return { lonDeg, latDeg };
  }

  static lonLatToTile(lonDeg: number, latDeg: number, z: number): XYZTileCoord {
    const zoom = Math.max(0, Math.floor(z));
    const dim = 2 ** zoom;
    const x = Math.floor(((lonDeg + 180) / 360) * dim);
    const y = Math.floor(XYZRayPickingUtils.latToTileY(latDeg, zoom));

    return {
      z: zoom,
      x: XYZRayPickingUtils.wrapTileX(x, dim),
      y: XYZRayPickingUtils.clampTileY(y, dim),
    };
  }

  static getNeighborTiles(tile: XYZTileCoord, ring = 1): XYZTileCoord[] {
    const dim = 2 ** tile.z;
    const tiles: XYZTileCoord[] = [];
    const safeRing = Math.max(0, Math.floor(ring));

    for (let dx = -safeRing; dx <= safeRing; dx++) {
      for (let dy = -safeRing; dy <= safeRing; dy++) {
        tiles.push({
          z: tile.z,
          x: XYZRayPickingUtils.wrapTileX(tile.x + dx, dim),
          y: XYZRayPickingUtils.clampTileY(tile.y + dy, dim),
        });
      }
    }

    return XYZRayPickingUtils.deduplicateTiles(tiles);
  }

  static deduplicateTiles(tiles: XYZTileCoord[]): XYZTileCoord[] {
    const map = new Map<string, XYZTileCoord>();
    for (const tile of tiles) {
      map.set(`${tile.z}/${tile.x}/${tile.y}`, tile);
    }
    return Array.from(map.values());
  }

  private static fillSmallTileGaps(tiles: XYZTileCoord[]): XYZTileCoord[] {
    if (tiles.length === 0) {
      return tiles;
    }

    const zoom = tiles[0].z;
    const dim = 2 ** zoom;
    const map = new Map<string, XYZTileCoord>();
    const key = (tile: XYZTileCoord): string => `${tile.z}/${tile.x}/${tile.y}`;
    const add = (tile: XYZTileCoord): void => {
      map.set(key(tile), tile);
    };
    const has = (x: number, y: number): boolean => (
      y >= 0 && y < dim && map.has(`${zoom}/${XYZRayPickingUtils.wrapTileX(x, dim)}/${y}`)
    );

    for (const tile of tiles) {
      add(tile);
    }

    for (const tile of tiles) {
      const x = tile.x;
      const y = tile.y;

      if (has(x - 2, y) && !has(x - 1, y)) {
        add({ z: zoom, x: XYZRayPickingUtils.wrapTileX(x - 1, dim), y });
      }
      if (has(x + 2, y) && !has(x + 1, y)) {
        add({ z: zoom, x: XYZRayPickingUtils.wrapTileX(x + 1, dim), y });
      }
      if (has(x, y - 2) && !has(x, y - 1)) {
        add({ z: zoom, x, y: y - 1 });
      }
      if (has(x, y + 2) && !has(x, y + 1)) {
        add({ z: zoom, x, y: y + 1 });
      }
    }

    return Array.from(map.values());
  }

  private static latToTileY(latDeg: number, z: number): number {
    const lat = Math.max(-MAX_MERCATOR_LAT, Math.min(MAX_MERCATOR_LAT, latDeg));
    const latRad = (lat * Math.PI) / 180;
    const dim = 2 ** z;
    return ((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * dim;
  }

  private static isMercatorLatitude(latDeg: number): boolean {
    return Math.abs(latDeg) <= MAX_MERCATOR_LAT;
  }

  private static wrapTileX(x: number, dim: number): number {
    return ((x % dim) + dim) % dim;
  }

  private static clampTileY(y: number, dim: number): number {
    return Math.max(0, Math.min(dim - 1, y));
  }

  private static mat4MultiplyVec4(
    a: ReadonlyMat4,
    b: Readonly<[number, number, number, number]>,
    out: [number, number, number, number],
  ): [number, number, number, number] {
    const d = b[0], e = b[1], g = b[2], w = b[3];
    out[0] = a[0] * d + a[4] * e + a[8] * g + a[12] * w;
    out[1] = a[1] * d + a[5] * e + a[9] * g + a[13] * w;
    out[2] = a[2] * d + a[6] * e + a[10] * g + a[14] * w;
    out[3] = a[3] * d + a[7] * e + a[11] * g + a[15] * w;
    return out;
  }
}

export default XYZRayPickingUtils;
