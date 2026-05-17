/**
 * Ray picking helpers for XYZ/WebMercator maps.
 *
 * Unlike RayPickingUtils, this module has no HEALPix dependency. It intersects
 * screen rays with an XYZ sphere, converts the hit to lon/lat, then maps that
 * position to XYZ z/x/y tile coordinates.
 */
'use strict';
import { mat4, vec3 } from 'gl-matrix';
const MAX_MERCATOR_LAT = 85.0511287798066;
class XYZRayPickingUtils {
    static getRayFromMouse(mouseX, mouseY, pMatrix, webgl, vMatrix) {
        const gl = webgl;
        const canvas = gl.canvas;
        const rect = canvas.getBoundingClientRect();
        const x = (2.0 * mouseX) / rect.width - 1.0;
        const y = 1.0 - (2.0 * mouseY) / rect.height;
        const rayClip = [x, y, -1.0, 1.0];
        const pInv = mat4.create();
        mat4.invert(pInv, pMatrix);
        const rayEye4 = [0, 0, 0, 0];
        XYZRayPickingUtils.mat4MultiplyVec4(pInv, rayClip, rayEye4);
        const rayEye = [rayEye4[0], rayEye4[1], -1.0, 0.0];
        const vInv = mat4.create();
        mat4.invert(vInv, vMatrix);
        const rayWorld4 = [0, 0, 0, 0];
        XYZRayPickingUtils.mat4MultiplyVec4(vInv, rayEye, rayWorld4);
        const rayWorld = vec3.fromValues(rayWorld4[0], rayWorld4[1], rayWorld4[2]);
        vec3.normalize(rayWorld, rayWorld);
        return rayWorld;
    }
    static raySphere(rayOrigWorld, rayDirectionWorld, sphere) {
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
        }
        else if (disc === 0.0) {
            const t = -b;
            if (t >= 0.0) {
                intersectionDistance = t;
            }
        }
        return intersectionDistance;
    }
    static getIntersectionPointWithModel(mouseX, mouseY, xyzModel, webgl, camera, pMatrix) {
        const vMatrix = camera.getCameraMatrix();
        const rayWorld = XYZRayPickingUtils.getRayFromMouse(mouseX, mouseY, pMatrix, webgl, vMatrix);
        const t = XYZRayPickingUtils.raySphere(camera.getCameraPosition(), rayWorld, xyzModel);
        if (t < 0) {
            return null;
        }
        const worldHit = vec3.create();
        vec3.scale(worldHit, rayWorld, t);
        vec3.add(worldHit, camera.getCameraPosition(), worldHit);
        const worldHit4 = [worldHit[0], worldHit[1], worldHit[2], 1.0];
        const modelHit4 = [0, 0, 0, 0];
        XYZRayPickingUtils.mat4MultiplyVec4(xyzModel.getModelMatrixInverse(), worldHit4, modelHit4);
        return [modelHit4[0], modelHit4[1], modelHit4[2]];
    }
    static getLonLatFromMouse(mouseX, mouseY, xyzModel, webgl, camera, pMatrix) {
        const hit = XYZRayPickingUtils.getIntersectionPointWithModel(mouseX, mouseY, xyzModel, webgl, camera, pMatrix);
        return hit ? XYZRayPickingUtils.modelPointToLonLat(hit) : null;
    }
    static getTileFromMouse(mouseX, mouseY, z, xyzModel, webgl, camera, pMatrix) {
        const lonLat = XYZRayPickingUtils.getLonLatFromMouse(mouseX, mouseY, xyzModel, webgl, camera, pMatrix);
        if (!lonLat || !XYZRayPickingUtils.isMercatorLatitude(lonLat.latDeg)) {
            return null;
        }
        return XYZRayPickingUtils.lonLatToTile(lonLat.lonDeg, lonLat.latDeg, z);
    }
    static getVisibleTilesFromViewport(z, xyzModel, webgl, camera, pMatrix, sampleCount = 9, padding = 2) {
        const gl = webgl;
        const canvas = gl.canvas;
        const rect = canvas.getBoundingClientRect();
        const samples = Math.max(2, Math.floor(sampleCount));
        const edgeSamples = Math.max(samples * 2 + 1, 21);
        const safePadding = Math.max(0, Math.floor(padding));
        const tiles = [];
        const addSample = (x, y) => {
            const tile = XYZRayPickingUtils.getTileFromMouse(x, y, z, xyzModel, webgl, camera, pMatrix);
            if (!tile)
                return;
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
    static modelPointToLonLat(point) {
        const [x, y, z] = point;
        const len = Math.hypot(x, y, z);
        if (!Number.isFinite(len) || len === 0) {
            return { lonDeg: 0, latDeg: 0 };
        }
        const lonDeg = (Math.atan2(y, x) * 180) / Math.PI;
        const latDeg = (Math.asin(Math.max(-1, Math.min(1, z / len))) * 180) / Math.PI;
        return { lonDeg, latDeg };
    }
    static lonLatToTile(lonDeg, latDeg, z) {
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
    static getNeighborTiles(tile, ring = 1) {
        const dim = 2 ** tile.z;
        const tiles = [];
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
    static deduplicateTiles(tiles) {
        const map = new Map();
        for (const tile of tiles) {
            map.set(`${tile.z}/${tile.x}/${tile.y}`, tile);
        }
        return Array.from(map.values());
    }
    static fillSmallTileGaps(tiles) {
        if (tiles.length === 0) {
            return tiles;
        }
        const zoom = tiles[0].z;
        const dim = 2 ** zoom;
        const map = new Map();
        const key = (tile) => `${tile.z}/${tile.x}/${tile.y}`;
        const add = (tile) => {
            map.set(key(tile), tile);
        };
        const has = (x, y) => (y >= 0 && y < dim && map.has(`${zoom}/${XYZRayPickingUtils.wrapTileX(x, dim)}/${y}`));
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
    static latToTileY(latDeg, z) {
        const lat = Math.max(-MAX_MERCATOR_LAT, Math.min(MAX_MERCATOR_LAT, latDeg));
        const latRad = (lat * Math.PI) / 180;
        const dim = 2 ** z;
        return ((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * dim;
    }
    static isMercatorLatitude(latDeg) {
        return Math.abs(latDeg) <= MAX_MERCATOR_LAT;
    }
    static wrapTileX(x, dim) {
        return ((x % dim) + dim) % dim;
    }
    static clampTileY(y, dim) {
        return Math.max(0, Math.min(dim - 1, y));
    }
    static mat4MultiplyVec4(a, b, out) {
        const d = b[0], e = b[1], g = b[2], w = b[3];
        out[0] = a[0] * d + a[4] * e + a[8] * g + a[12] * w;
        out[1] = a[1] * d + a[5] * e + a[9] * g + a[13] * w;
        out[2] = a[2] * d + a[6] * e + a[10] * g + a[14] * w;
        out[3] = a[3] * d + a[7] * e + a[11] * g + a[15] * w;
        return out;
    }
}
export default XYZRayPickingUtils;
