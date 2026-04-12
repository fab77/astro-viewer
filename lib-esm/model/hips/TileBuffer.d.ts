import Tile from './Tile.js';
import { HiPS } from './HiPS.js';
import { VisibleTilesManager } from './VisibleTilesManager.js';
import { HiPSShaderProgram } from '../../shader/HiPSShaderProgram.js';
export declare class TileBuffer {
    private _tiles;
    private _cachedTiles;
    private _activeHiPS;
    private _galTiles;
    private _galCachedTiles;
    private _galActiveHiPS;
    private _cacheAliveMilliSeconds;
    private _cleanerId;
    private _webgl;
    private _visibleTileManager;
    private _hipsShaderProgram;
    constructor(minutesToLiveInCache: number | undefined, webgl: WebGL2RenderingContext, hipsShaderProgram: HiPSShaderProgram, visibleTileManager: VisibleTilesManager);
    /** Register an equatorial HiPS into the buffer. */
    addHiPS(hips: HiPS): void;
    /** Register a galactic HiPS into the buffer. */
    addGalHiPS(hips: HiPS): void;
    /** Preload/add tile for every registered equatorial HiPS. */
    addTile(order: number, tileno: number): void;
    /** Preload/add tile for every registered galactic HiPS. */
    addGalTile(order: number, tileno: number): void;
    /** Fetch (or create) an equatorial tile, reviving from cache if present. */
    getTile(tileno: number, order: number, hips: HiPS): Tile;
    /** Fetch (or create) a galactic tile, reviving from cache if present. */
    getGalTile(tileno: number, order: number, hips: HiPS): Tile;
    /** Move a tile (equatorial or galactic) into cache. */
    moveTileToCache(tileno: number, order: number, hips: HiPS): void;
    /** Periodically purge stale cached tiles. */
    private cacheCleaner;
    /** Compose a stable key for maps. */
    private key;
    /** Optional: call to stop internal timers if you dispose this buffer. */
    dispose(): void;
}
//# sourceMappingURL=TileBuffer.d.ts.map