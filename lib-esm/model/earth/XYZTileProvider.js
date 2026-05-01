import global from '../../Global.js';
const MAX_MERCATOR_LAT = 85.0511287798066;
export class XYZTileProvider {
    _config;
    constructor(config) {
        this._config = config;
    }
    get config() {
        return this._config;
    }
    getInitialTiles() {
        return this.getTilesForCamera(180, null, null).tiles;
    }
    getTilesForCamera(fovDeg, camera, centerSphericalDeg) {
        const z = this.resolveZoom(fovDeg);
        const dim = 2 ** z;
        const { lonDeg, latDeg } = this.resolveViewCenter(camera, centerSphericalDeg);
        const centerX = this.wrapTileX(Math.floor(((lonDeg + 180) / 360) * dim), dim);
        const centerY = this.clampTileY(Math.floor(this.latToTileY(latDeg, z)), dim);
        const tileAngularWidth = 360 / dim;
        const halfSpan = Math.max(0, Math.min(dim, Math.ceil(fovDeg / tileAngularWidth / 2) + 1));
        const tiles = [];
        for (let dx = -halfSpan; dx <= halfSpan; dx++) {
            for (let dy = -halfSpan; dy <= halfSpan; dy++) {
                const x = this.wrapTileX(centerX + dx, dim);
                const y = this.clampTileY(centerY + dy, dim);
                tiles.push({ z, x, y });
            }
        }
        return {
            key: `${z}:${centerX}:${centerY}:${halfSpan}`,
            tiles: this.deduplicateTiles(tiles),
        };
    }
    getTileUrl(tile) {
        return this._config.urlTemplate
            .replace(/\{z\}/g, String(tile.z))
            .replace(/\{x\}/g, String(tile.x))
            .replace(/\{y\}/g, String(tile.y));
    }
    resolveZoom(fovDeg) {
        const safeFov = Math.max(0.01, Math.min(180, fovDeg));
        const targetTileWidthDeg = Math.max(0.01, safeFov / 2);
        const rawZoom = Math.ceil(Math.log2(360 / targetTileWidthDeg));
        return this.clampZoom(rawZoom);
    }
    clampZoom(zoom) {
        const minZoom = Math.max(0, Math.floor(this._config.minZoom ?? 0));
        const maxZoom = Math.max(minZoom, Math.floor(this._config.maxZoom ?? 6));
        return Math.max(minZoom, Math.min(maxZoom, zoom));
    }
    resolveViewCenter(camera, centerSphericalDeg) {
        if (centerSphericalDeg) {
            return {
                lonDeg: centerSphericalDeg.phi > 180 ? centerSphericalDeg.phi - 360 : centerSphericalDeg.phi,
                latDeg: 90 - centerSphericalDeg.theta,
            };
        }
        if (!camera) {
            return { lonDeg: 0, latDeg: 0 };
        }
        const [x, y, z] = camera.getCameraPosition();
        const len = Math.hypot(x, y, z);
        if (!Number.isFinite(len) || len === 0) {
            return { lonDeg: 0, latDeg: 0 };
        }
        const scale = global.insideSphere ? 1 / len : -1 / len;
        const vx = x * scale;
        const vy = y * scale;
        const vz = z * scale;
        const lonDeg = (Math.atan2(vy, vx) * 180) / Math.PI;
        const latDeg = (Math.asin(Math.max(-1, Math.min(1, vz))) * 180) / Math.PI;
        return { lonDeg, latDeg };
    }
    latToTileY(latDeg, z) {
        const lat = Math.max(-MAX_MERCATOR_LAT, Math.min(MAX_MERCATOR_LAT, latDeg));
        const latRad = (lat * Math.PI) / 180;
        const n = 2 ** z;
        return ((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n;
    }
    wrapTileX(x, dim) {
        return ((x % dim) + dim) % dim;
    }
    clampTileY(y, dim) {
        return Math.max(0, Math.min(dim - 1, y));
    }
    deduplicateTiles(tiles) {
        const unique = new Map();
        for (const tile of tiles) {
            unique.set(`${tile.z}/${tile.x}/${tile.y}`, tile);
        }
        return Array.from(unique.values());
    }
}
