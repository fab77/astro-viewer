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
    get minZoom() {
        return Math.max(0, Math.floor(this._config.minZoom ?? 0));
    }
    get maxZoom() {
        return Math.max(this.minZoom, Math.floor(this._config.maxZoom ?? 6));
    }
    getInitialTiles() {
        return this.getVisibleTilesAtZoom(1, null, [], [], 1);
    }
    getTileUrl(tile) {
        if (this._config.urlResolver) {
            return this._config.urlResolver(tile);
        }
        const effectiveY = this.getEffectiveTileY(tile);
        const subdomain = this.getSubdomain(tile);
        return this._config.urlTemplate
            .replace(/\{z\}/g, String(tile.z))
            .replace(/\{x\}/g, String(tile.x))
            .replace(/\{y\}/g, String(effectiveY))
            .replace(/\{s\}/g, subdomain);
    }
    resolveZoom(fovDeg) {
        const safeFov = Math.max(0.01, Math.min(180, fovDeg));
        const targetTileWidthDeg = Math.max(0.01, safeFov / 2);
        const rawZoom = Math.ceil(Math.log2(360 / targetTileWidthDeg));
        return this.clampZoom(rawZoom);
    }
    clampZoom(zoom) {
        return Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
    }
    getEffectiveTileY(tile) {
        if (!this._config.flipY) {
            return tile.y;
        }
        const dim = 2 ** tile.z;
        return dim - 1 - tile.y;
    }
    getSubdomain(tile) {
        const subdomains = this._config.subdomains ?? [];
        if (subdomains.length === 0) {
            return '';
        }
        const index = Math.abs(tile.x + tile.y + tile.z) % subdomains.length;
        return subdomains[index] ?? '';
    }
    getVisibleTilesAtZoom(z, centerSphericalDeg, fovPolygon, viewportSphericalSamples, padding = 1) {
        const dim = 2 ** z;
        const center = this.resolveViewCenter(null, centerSphericalDeg);
        const normalizedCenterLon = this.normalizeLonAround(center.lonDeg, center.lonDeg);
        const polygonPoints = fovPolygon.length > 0
            ? fovPolygon.map((point) => ({
                lonDeg: this.normalizeLonAround(point.raDeg > 180 ? point.raDeg - 360 : point.raDeg, normalizedCenterLon),
                latDeg: point.decDeg,
            }))
            : [center];
        const samplePoints = viewportSphericalSamples.map((sample) => ({
            lonDeg: this.normalizeLonAround(sample.phi > 180 ? sample.phi - 360 : sample.phi, normalizedCenterLon),
            latDeg: 90 - sample.theta,
        }));
        const coveragePoints = [center, ...polygonPoints, ...samplePoints];
        let minLon = normalizedCenterLon;
        let maxLon = normalizedCenterLon;
        let minLat = center.latDeg;
        let maxLat = center.latDeg;
        for (const point of coveragePoints) {
            minLon = Math.min(minLon, point.lonDeg);
            maxLon = Math.max(maxLon, point.lonDeg);
            minLat = Math.min(minLat, point.latDeg);
            maxLat = Math.max(maxLat, point.latDeg);
        }
        const adaptivePadding = Math.max(padding, Math.min(3, Math.max(1, Math.ceil(z / 3))));
        const minX = Math.floor(((minLon + 180) / 360) * dim) - adaptivePadding;
        const maxX = Math.floor(((maxLon + 180) / 360) * dim) + adaptivePadding;
        const minY = Math.floor(this.latToTileY(maxLat, z)) - adaptivePadding;
        const maxY = Math.floor(this.latToTileY(minLat, z)) + adaptivePadding;
        const tiles = [];
        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                tiles.push({
                    z,
                    x: this.wrapTileX(x, dim),
                    y: this.clampTileY(y, dim),
                });
            }
        }
        for (const point of coveragePoints) {
            const centerTileX = Math.floor(((point.lonDeg + 180) / 360) * dim);
            const centerTileY = Math.floor(this.latToTileY(point.latDeg, z));
            for (let dx = -adaptivePadding; dx <= adaptivePadding; dx++) {
                for (let dy = -adaptivePadding; dy <= adaptivePadding; dy++) {
                    tiles.push({
                        z,
                        x: this.wrapTileX(centerTileX + dx, dim),
                        y: this.clampTileY(centerTileY + dy, dim),
                    });
                }
            }
        }
        return this.deduplicateTiles(tiles);
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
    normalizeLonAround(lonDeg, referenceLonDeg) {
        let lon = lonDeg;
        while (lon - referenceLonDeg > 180)
            lon -= 360;
        while (lon - referenceLonDeg < -180)
            lon += 360;
        return lon;
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
