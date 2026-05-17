import type { XYZTileCoord } from './XYZTypes.js';
export type XYZBufferedTile = {
    coord: XYZTileCoord;
    loading?: boolean;
    lastUsedAt?: number;
    createdAt?: number;
    touch?: () => void;
    dispose?: () => void;
};
export type XYZTileBufferEntry<TTile extends XYZBufferedTile = XYZBufferedTile> = {
    tile: TTile;
    cacheTime0?: number;
};
export type XYZTileFactory<TTile extends XYZBufferedTile = XYZBufferedTile> = (coord: XYZTileCoord) => TTile;
export declare class XYZTileBuffer<TTile extends XYZBufferedTile = XYZBufferedTile> {
    private _tiles;
    private _cachedTiles;
    private _cacheAliveMilliSeconds;
    private _cleanerId;
    constructor(minutesToLiveInCache?: number);
    get activeTiles(): Map<string, XYZTileBufferEntry<TTile>>;
    get cachedTiles(): Map<string, XYZTileBufferEntry<TTile>>;
    get size(): number;
    ensureTiles(visibleTiles: XYZTileCoord[], tileFactory: XYZTileFactory<TTile>): string[];
    getTile(tileCoord: XYZTileCoord, tileFactory: XYZTileFactory<TTile>): TTile;
    getActiveTile(tileKey: string): TTile | null;
    getAnyTile(tileKey: string): TTile | null;
    getActiveTiles(): TTile[];
    syncVisibleTiles(visibleTileKeys: string[]): void;
    evictCached(maxCachedTiles: number): void;
    dispose(): void;
    key(tileCoord: XYZTileCoord): string;
    static key(tileCoord: XYZTileCoord): string;
    private cacheCleaner;
    private touchTile;
    private getTileAgeScore;
}
