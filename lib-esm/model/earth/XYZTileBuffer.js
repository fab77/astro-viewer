import { XYZTile } from './XYZTile.js';
export class XYZTileBuffer {
    _tiles = new Map();
    _cachedTiles = new Map();
    _cacheAliveMilliSeconds;
    _cleanerId;
    _webgl;
    _meshBuilder;
    _shaderProgram;
    constructor(minutesToLiveInCache = 1, webgl, meshBuilder, shaderProgram) {
        this._cacheAliveMilliSeconds = minutesToLiveInCache * 60 * 1000;
        this._webgl = webgl;
        this._meshBuilder = meshBuilder;
        this._shaderProgram = shaderProgram;
        this._cleanerId = window.setInterval(() => {
            this.cacheCleaner();
        }, 10_000);
    }
    get activeTiles() {
        return this._tiles;
    }
    get cachedTiles() {
        return this._cachedTiles;
    }
    get size() {
        return this._tiles.size + this._cachedTiles.size;
    }
    getTile(tileCoord, url, segmentsPerSide, role) {
        const tileKey = this.key(tileCoord);
        if (!this._tiles.has(tileKey)) {
            if (this._cachedTiles.has(tileKey)) {
                const entry = this._cachedTiles.get(tileKey);
                entry.cacheTime0 = undefined;
                entry.role = role;
                this._tiles.set(tileKey, entry);
                this._cachedTiles.delete(tileKey);
            }
            else {
                const mesh = this._meshBuilder.buildTileMesh(tileCoord, segmentsPerSide);
                this._tiles.set(tileKey, {
                    tile: new XYZTile(tileCoord, url, mesh, this._webgl, this._shaderProgram),
                    role,
                });
            }
        }
        else {
            const entry = this._tiles.get(tileKey);
            entry.role = role;
        }
        return this._tiles.get(tileKey).tile;
    }
    getExistingTile(tileCoord, role) {
        const tileKey = this.key(tileCoord);
        if (this._tiles.has(tileKey)) {
            const entry = this._tiles.get(tileKey);
            entry.role = role;
            return entry.tile;
        }
        if (this._cachedTiles.has(tileKey)) {
            const entry = this._cachedTiles.get(tileKey);
            entry.cacheTime0 = undefined;
            entry.role = role;
            this._tiles.set(tileKey, entry);
            this._cachedTiles.delete(tileKey);
            return entry.tile;
        }
        return null;
    }
    ensureTiles(requests, segmentsPerSide) {
        const visibleTileKeys = [];
        for (const request of requests) {
            const tile = request.role === 'fallback'
                ? this.getExistingTile(request.tileCoord, 'fallback')
                : this.getTile(request.tileCoord, request.url, segmentsPerSide, request.role);
            if (!tile) {
                continue;
            }
            tile.touch();
            if (request.role !== 'fallback') {
                tile.primeLoad(request.priority);
            }
            visibleTileKeys.push(this.key(request.tileCoord));
        }
        this.syncVisibleTiles(visibleTileKeys);
        return visibleTileKeys;
    }
    getActiveTile(tileKey) {
        return this._tiles.get(tileKey)?.tile ?? null;
    }
    getAnyTile(tileKey) {
        return this._tiles.get(tileKey)?.tile ?? this._cachedTiles.get(tileKey)?.tile ?? null;
    }
    syncVisibleTiles(visibleTileKeys) {
        const visibleKeySet = new Set(visibleTileKeys);
        for (const [tileKey, entry] of this._tiles) {
            if (visibleKeySet.has(tileKey)) {
                entry.tile.touch();
                continue;
            }
            entry.cacheTime0 = Date.now();
            this._cachedTiles.set(tileKey, entry);
            this._tiles.delete(tileKey);
        }
    }
    evictCached(maxCachedTiles) {
        if (this.size <= maxCachedTiles) {
            return;
        }
        const candidates = Array.from(this._cachedTiles.entries()).sort((a, b) => {
            const scoreA = Math.min(a[1].tile.lastUsedAt || a[1].tile.createdAt, a[1].tile.createdAt);
            const scoreB = Math.min(b[1].tile.lastUsedAt || b[1].tile.createdAt, b[1].tile.createdAt);
            return scoreA - scoreB;
        });
        for (const [tileKey, entry] of candidates) {
            if (this.size <= maxCachedTiles) {
                break;
            }
            if (entry.tile.loading) {
                continue;
            }
            entry.tile.dispose();
            this._cachedTiles.delete(tileKey);
        }
    }
    dispose() {
        window.clearInterval(this._cleanerId);
        for (const entry of this._tiles.values()) {
            entry.tile.dispose();
        }
        for (const entry of this._cachedTiles.values()) {
            entry.tile.dispose();
        }
        this._tiles.clear();
        this._cachedTiles.clear();
    }
    cacheCleaner() {
        const now = Date.now();
        for (const [tileKey, entry] of this._cachedTiles) {
            const t0 = entry.cacheTime0;
            if (t0 !== undefined && now - t0 > this._cacheAliveMilliSeconds && !entry.tile.loading) {
                entry.tile.dispose();
                this._cachedTiles.delete(tileKey);
            }
        }
    }
    key(tileCoord) {
        return `${tileCoord.z}/${tileCoord.x}/${tileCoord.y}`;
    }
}
