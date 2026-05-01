export class XYZVisibleTilesManager {
    _provider;
    constructor(provider) {
        this._provider = provider;
    }
    selectTiles(input) {
        const currentZoom = this._provider.resolveZoom(input.fovDeg ?? 180);
        const coreTiles = this.orderTilesByScreenRelevance(this.buildCoreVisibleTiles(currentZoom, input), currentZoom, input.centerSphericalDeg ?? null);
        const coverageTiles = this.orderTilesByScreenRelevance(this.buildCoverageTiles(currentZoom, input, coreTiles), currentZoom, input.centerSphericalDeg ?? null);
        const currentTiles = [...coreTiles, ...coverageTiles];
        const fallbackSeedTiles = this.buildFallbackSeedTiles(coreTiles, currentZoom, input.centerSphericalDeg ?? null);
        const fallbackTiles = this.orderFallbackTiles(Array.from(this.buildFallbackMap(fallbackSeedTiles, currentZoom).values()), currentZoom, input.centerSphericalDeg ?? null);
        const key = `${currentZoom}:${currentTiles.map((tile) => `${tile.x}/${tile.y}`).join('|')}`;
        return {
            key,
            currentTiles,
            fallbackTiles,
            currentZoom,
            coreTileCount: coreTiles.length,
            coverageTileCount: coverageTiles.length,
        };
    }
    buildCoreVisibleTiles(currentZoom, input) {
        const samples = this.collectCoverageSamples(input);
        if (samples.length === 0) {
            return this._provider.getVisibleTilesAtZoom(currentZoom, null, [], [], 0);
        }
        const tiles = [];
        for (const sample of samples) {
            tiles.push(this._provider.tileFromSpherical(currentZoom, sample));
        }
        return this._provider.deduplicateTiles(tiles);
    }
    buildCoverageTiles(currentZoom, input, coreTiles) {
        if (coreTiles.length === 0) {
            return [];
        }
        const ring = this.getNeighborRing(currentZoom, input.fovDeg ?? 180);
        if (ring <= 0) {
            return [];
        }
        const coreSet = new Set(coreTiles.map((tile) => this.key(tile)));
        const coverageTiles = [];
        for (const tile of coreTiles) {
            if (!this.isBoundaryTile(tile, coreSet)) {
                continue;
            }
            const neighbors = this._provider.getNeighborTiles(tile, ring);
            for (const neighbor of neighbors) {
                const neighborKey = this.key(neighbor);
                if (coreSet.has(neighborKey)) {
                    continue;
                }
                coverageTiles.push(neighbor);
            }
        }
        return this._provider.deduplicateTiles(coverageTiles);
    }
    collectCoverageSamples(input) {
        const samples = [];
        if (input.centerSphericalDeg) {
            samples.push(input.centerSphericalDeg);
        }
        for (const sample of input.viewportSphericalSamples ?? []) {
            samples.push(sample);
        }
        const polygonSamples = this.interpolateFoVPolygon(input.fovPolygon ?? []);
        for (const sample of polygonSamples) {
            samples.push(sample);
        }
        return samples;
    }
    interpolateFoVPolygon(fovPolygon) {
        if (fovPolygon.length === 0) {
            return [];
        }
        const polygonSpherical = fovPolygon.map((point) => ({
            phi: point.raDeg < 0 ? point.raDeg + 360 : point.raDeg,
            theta: 90 - point.decDeg,
        }));
        const samples = [...polygonSpherical];
        const segmentInterpolationCount = polygonSpherical.length >= 4 ? 2 : 1;
        for (let i = 0; i < polygonSpherical.length; i++) {
            const start = polygonSpherical[i];
            const end = polygonSpherical[(i + 1) % polygonSpherical.length];
            if (!start || !end)
                continue;
            const startPhi = this.normalizePhi(start.phi);
            let endPhi = this.normalizePhi(end.phi);
            if (Math.abs(endPhi - startPhi) > 180) {
                endPhi += endPhi > startPhi ? -360 : 360;
            }
            for (let step = 1; step <= segmentInterpolationCount; step++) {
                const t = step / (segmentInterpolationCount + 1);
                const phi = this.normalizePhi(startPhi + (endPhi - startPhi) * t);
                const theta = start.theta + (end.theta - start.theta) * t;
                samples.push({ phi, theta });
            }
        }
        return samples;
    }
    getNeighborRing(currentZoom, fovDeg) {
        if (currentZoom >= 12) {
            return 0;
        }
        if (currentZoom >= 8 && fovDeg < 20) {
            return 0;
        }
        if (currentZoom >= 6) {
            return 1;
        }
        return 1;
    }
    isBoundaryTile(tile, coreTileKeys) {
        const directNeighbors = [
            { z: tile.z, x: tile.x - 1, y: tile.y },
            { z: tile.z, x: tile.x + 1, y: tile.y },
            { z: tile.z, x: tile.x, y: tile.y - 1 },
            { z: tile.z, x: tile.x, y: tile.y + 1 },
        ];
        return directNeighbors.some((neighbor) => !coreTileKeys.has(this.key(this.normalizeTile(neighbor))));
    }
    normalizeTile(tile) {
        const dim = 2 ** tile.z;
        return {
            z: tile.z,
            x: ((tile.x % dim) + dim) % dim,
            y: Math.max(0, Math.min(dim - 1, tile.y)),
        };
    }
    normalizePhi(phi) {
        let value = phi;
        while (value < 0)
            value += 360;
        while (value >= 360)
            value -= 360;
        return value;
    }
    buildFallbackMap(currentTiles, currentZoom) {
        const fallbackMap = new Map();
        const minFallbackZoom = Math.max(this._provider.minZoom, currentZoom - 2);
        for (let z = currentZoom - 1; z >= minFallbackZoom; z--) {
            const dz = currentZoom - z;
            for (const tile of currentTiles) {
                const fallback = {
                    z,
                    x: tile.x >> dz,
                    y: tile.y >> dz,
                };
                fallbackMap.set(`${fallback.z}/${fallback.x}/${fallback.y}`, fallback);
            }
        }
        return fallbackMap;
    }
    buildFallbackSeedTiles(coreTiles, zoom, centerSphericalDeg) {
        if (coreTiles.length === 0) {
            return [];
        }
        const coreSet = new Set(coreTiles.map((tile) => this.key(tile)));
        const boundaryTiles = coreTiles.filter((tile) => this.isBoundaryTile(tile, coreSet));
        const centerTile = this.getCenterTileCoord(zoom, centerSphericalDeg);
        const seeds = [...boundaryTiles];
        if (centerTile) {
            const centerKey = this.key(centerTile);
            if (!seeds.some((tile) => this.key(tile) === centerKey)) {
                seeds.push(centerTile);
            }
        }
        return seeds.length > 0 ? seeds : coreTiles;
    }
    orderTilesByScreenRelevance(tiles, zoom, centerSphericalDeg) {
        const centerTile = this.getCenterTileCoord(zoom, centerSphericalDeg);
        if (!centerTile) {
            return tiles;
        }
        return [...tiles].sort((a, b) => {
            const distanceA = Math.abs(a.x - centerTile.x) + Math.abs(a.y - centerTile.y);
            const distanceB = Math.abs(b.x - centerTile.x) + Math.abs(b.y - centerTile.y);
            return distanceA - distanceB;
        });
    }
    orderFallbackTiles(tiles, currentZoom, centerSphericalDeg) {
        return [...tiles].sort((a, b) => {
            if (b.z !== a.z) {
                return b.z - a.z;
            }
            const centerTileA = this.getCenterTileCoord(a.z, centerSphericalDeg);
            const centerTileB = this.getCenterTileCoord(b.z, centerSphericalDeg);
            if (!centerTileA || !centerTileB) {
                return 0;
            }
            const distanceA = Math.abs(a.x - centerTileA.x) + Math.abs(a.y - centerTileA.y);
            const distanceB = Math.abs(b.x - centerTileB.x) + Math.abs(b.y - centerTileB.y);
            return distanceA - distanceB || currentZoom - a.z - (currentZoom - b.z);
        });
    }
    getCenterTileCoord(zoom, centerSphericalDeg) {
        if (!centerSphericalDeg) {
            return null;
        }
        const lonDeg = centerSphericalDeg.phi > 180 ? centerSphericalDeg.phi - 360 : centerSphericalDeg.phi;
        const latDeg = 90 - centerSphericalDeg.theta;
        const dim = 2 ** zoom;
        const x = Math.floor(((lonDeg + 180) / 360) * dim);
        const latRad = (Math.max(-85.0511287798066, Math.min(85.0511287798066, latDeg)) * Math.PI) / 180;
        const y = Math.floor(((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * dim);
        return {
            z: zoom,
            x: ((x % dim) + dim) % dim,
            y: Math.max(0, Math.min(dim - 1, y)),
        };
    }
    key(tile) {
        return `${tile.z}/${tile.x}/${tile.y}`;
    }
}
