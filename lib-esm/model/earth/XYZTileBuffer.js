export class XYZTileBuffer {
    _tiles = new Map();
    _cachedTiles = new Map();
    _cacheAliveMilliSeconds;
    _cleanerId;
    constructor(minutesToLiveInCache = 1) {
        this._cacheAliveMilliSeconds = minutesToLiveInCache * 60 * 1000;
        if (typeof window !== 'undefined') {
            this._cleanerId = window.setInterval(() => {
                this.cacheCleaner();
            }, 10_000);
        }
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
    ensureTiles(visibleTiles, tileFactory) {
        const visibleTileKeys = [];
        for (const tileCoord of visibleTiles) {
            const tile = this.getTile(tileCoord, tileFactory);
            this.touchTile(tile);
            visibleTileKeys.push(this.key(tileCoord));
        }
        this.syncVisibleTiles(visibleTileKeys);
        return visibleTileKeys;
    }
    getTile(tileCoord, tileFactory) {
        const tileKey = this.key(tileCoord);
        if (this._tiles.has(tileKey)) {
            return this._tiles.get(tileKey).tile;
        }
        if (this._cachedTiles.has(tileKey)) {
            const entry = this._cachedTiles.get(tileKey);
            entry.cacheTime0 = undefined;
            this._tiles.set(tileKey, entry);
            this._cachedTiles.delete(tileKey);
            return entry.tile;
        }
        const tile = tileFactory(tileCoord);
        this._tiles.set(tileKey, { tile });
        return tile;
    }
    getActiveTile(tileKey) {
        return this._tiles.get(tileKey)?.tile ?? null;
    }
    getAnyTile(tileKey) {
        return this._tiles.get(tileKey)?.tile ?? this._cachedTiles.get(tileKey)?.tile ?? null;
    }
    getActiveTiles() {
        return Array.from(this._tiles.values(), (entry) => entry.tile);
    }
    syncVisibleTiles(visibleTileKeys) {
        const visibleKeySet = new Set(visibleTileKeys);
        for (const [tileKey, entry] of this._tiles) {
            if (visibleKeySet.has(tileKey)) {
                this.touchTile(entry.tile);
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
            return this.getTileAgeScore(a[1].tile) - this.getTileAgeScore(b[1].tile);
        });
        for (const [tileKey, entry] of candidates) {
            if (this.size <= maxCachedTiles) {
                break;
            }
            if (entry.tile.loading) {
                continue;
            }
            entry.tile.dispose?.();
            this._cachedTiles.delete(tileKey);
        }
    }
    dispose() {
        if (this._cleanerId !== undefined && typeof window !== 'undefined') {
            window.clearInterval(this._cleanerId);
            this._cleanerId = undefined;
        }
        for (const entry of this._tiles.values()) {
            entry.tile.dispose?.();
        }
        for (const entry of this._cachedTiles.values()) {
            entry.tile.dispose?.();
        }
        this._tiles.clear();
        this._cachedTiles.clear();
    }
    key(tileCoord) {
        return XYZTileBuffer.key(tileCoord);
    }
    static key(tileCoord) {
        return `${tileCoord.z}/${tileCoord.x}/${tileCoord.y}`;
    }
    cacheCleaner() {
        const now = Date.now();
        for (const [tileKey, entry] of this._cachedTiles) {
            const t0 = entry.cacheTime0;
            if (t0 === undefined || now - t0 <= this._cacheAliveMilliSeconds || entry.tile.loading) {
                continue;
            }
            entry.tile.dispose?.();
            this._cachedTiles.delete(tileKey);
        }
    }
    touchTile(tile) {
        tile.touch?.();
    }
    getTileAgeScore(tile) {
        const lastUsedAt = tile.lastUsedAt ?? 0;
        const createdAt = tile.createdAt ?? lastUsedAt;
        return Math.min(lastUsedAt || createdAt, createdAt);
    }
}
