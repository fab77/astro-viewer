// TileBuffer.ts
import Tile from './Tile.js'; // adjust if your file is named differently
// export default class TileBuffer {
export class TileBuffer {
    // Equatorial
    _tiles;
    _cachedTiles;
    _activeHiPS;
    // Galactic
    _galTiles;
    _galCachedTiles;
    _galActiveHiPS;
    _cacheAliveMilliSeconds;
    _cleanerId;
    _webgl;
    _visibleTileManager;
    _hipsShaderProgram;
    constructor(minutesToLiveInCache = 1, webgl, hipsShaderProgram, visibleTileManager) {
        this._hipsShaderProgram = hipsShaderProgram;
        this._visibleTileManager = visibleTileManager;
        this._webgl = webgl;
        this._tiles = new Map();
        this._cachedTiles = new Map();
        this._activeHiPS = new Map();
        this._galTiles = new Map();
        this._galCachedTiles = new Map();
        this._galActiveHiPS = new Map();
        this._cacheAliveMilliSeconds = minutesToLiveInCache * 60 * 1000;
        this._cleanerId = window.setInterval(() => {
            this.cacheCleaner();
        }, 10_000);
    }
    /** Register an equatorial HiPS into the buffer. */
    addHiPS(hips) {
        if (this._activeHiPS.has(hips)) {
            console.error('HiPS already present in TileBuffer');
            return;
        }
        this._activeHiPS.set(hips, new Map());
    }
    /** Register a galactic HiPS into the buffer. */
    addGalHiPS(hips) {
        if (this._galActiveHiPS.has(hips)) {
            console.error('HiPS already present in TileBuffer');
            return;
        }
        this._galActiveHiPS.set(hips, new Map());
    }
    /** Preload/add tile for every registered equatorial HiPS. */
    addTile(order, tileno) {
        for (const hips of this._activeHiPS.keys()) {
            if (order > hips.maxOrder) {
                continue;
            }
            this.getTile(tileno, order, hips);
        }
    }
    /** Preload/add tile for every registered galactic HiPS. */
    addGalTile(order, tileno) {
        for (const hips of this._galActiveHiPS.keys()) {
            if (order > hips.maxOrder) {
                continue;
            }
            this.getGalTile(tileno, order, hips);
        }
    }
    /** Fetch (or create) an equatorial tile, reviving from cache if present. */
    getTile(tileno, order, hips) {
        const tileKey = this.key(order, tileno, hips.baseURL);
        if (!this._tiles.has(tileKey)) {
            if (this._cachedTiles.has(tileKey)) {
                const tile = this._cachedTiles.get(tileKey);
                this._tiles.set(tileKey, tile);
                this._cachedTiles.delete(tileKey);
                tile.resetCacheTime0();
            }
            else {
                // const tile = new Tile(tileno, order, hips as any, this, this._webgl, this._visibleTileManager, this._hipsShaderProgram)
                const tile = new Tile(tileno, order, hips, this, this._webgl, this._visibleTileManager);
                this._tiles.set(tileKey, tile);
            }
        }
        return this._tiles.get(tileKey);
    }
    /** Fetch (or create) a galactic tile, reviving from cache if present. */
    getGalTile(tileno, order, hips) {
        const tileKey = this.key(order, tileno, hips.baseURL);
        if (!this._galTiles.has(tileKey)) {
            if (this._galCachedTiles.has(tileKey)) {
                const tile = this._galCachedTiles.get(tileKey);
                this._galTiles.set(tileKey, tile);
                this._galCachedTiles.delete(tileKey);
                tile.resetCacheTime0();
            }
            else {
                // const tile = new Tile(tileno, order, hips as any, this, this._webgl, this._visibleTileManager, this._hipsShaderProgram)
                const tile = new Tile(tileno, order, hips, this, this._webgl, this._visibleTileManager);
                this._galTiles.set(tileKey, tile);
            }
        }
        return this._galTiles.get(tileKey);
    }
    /** Move a tile (equatorial or galactic) into cache. */
    moveTileToCache(tileno, order, hips) {
        const tileKey = this.key(order, tileno, hips.baseURL);
        if (this._tiles.has(tileKey)) {
            const tile = this._tiles.get(tileKey);
            tile.setCacheTime0();
            this._cachedTiles.set(tileKey, tile);
            this._tiles.delete(tileKey);
        }
        if (this._galTiles.has(tileKey)) {
            const tile = this._galTiles.get(tileKey);
            tile.setCacheTime0();
            this._galCachedTiles.set(tileKey, tile);
            this._galTiles.delete(tileKey);
        }
    }
    /** Periodically purge stale cached tiles. */
    cacheCleaner() {
        const now = Date.now();
        for (const [tileKey, tile] of this._cachedTiles) {
            const t0 = tile.cacheTime0;
            if (!tile.inView && t0 !== undefined && now - t0 > this._cacheAliveMilliSeconds) {
                tile.destroyIntervals();
                this._cachedTiles.delete(tileKey);
            }
        }
        for (const [tileKey, tile] of this._galCachedTiles) {
            const t0 = tile.cacheTime0;
            if (!tile.inView && t0 !== undefined && now - t0 > this._cacheAliveMilliSeconds) {
                tile.destroyIntervals();
                this._galCachedTiles.delete(tileKey);
            }
        }
    }
    /** Compose a stable key for maps. */
    key(order, tileno, baseURL) {
        return `${order}#${tileno}#${baseURL}`;
    }
    /** Optional: call to stop internal timers if you dispose this buffer. */
    dispose() {
        window.clearInterval(this._cleanerId);
    }
}
// Singleton (kept for compatibility with your original export)
// export const newTileBuffer = new TileBuffer()
//# sourceMappingURL=TileBuffer.js.map