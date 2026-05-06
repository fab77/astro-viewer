import { XYZShaderProgram } from '../../shader/XYZShaderProgram.js';
import { XYZMeshBuilder } from './XYZMeshBuilder.js';
import { XYZTile } from './XYZTile.js';
import type { XYZTileCoord } from './types.js';
export type XYZTileRequest = {
    tileCoord: XYZTileCoord;
    url: string;
    priority: number;
    role: 'current' | 'coverage' | 'fallback' | 'base';
};
type XYZTileBufferEntry = {
    tile: XYZTile;
    cacheTime0?: number;
    role: 'current' | 'coverage' | 'fallback' | 'base';
};
export declare class XYZTileBuffer {
    private _tiles;
    private _cachedTiles;
    private _cacheAliveMilliSeconds;
    private _cleanerId;
    private _webgl;
    private _meshBuilder;
    private _shaderProgram;
    constructor(minutesToLiveInCache: number | undefined, webgl: WebGL2RenderingContext, meshBuilder: XYZMeshBuilder, shaderProgram: XYZShaderProgram);
    get activeTiles(): Map<string, XYZTileBufferEntry>;
    get cachedTiles(): Map<string, XYZTileBufferEntry>;
    get size(): number;
    getTile(tileCoord: XYZTileCoord, url: string, segmentsPerSide: number, role: 'current' | 'coverage' | 'fallback' | 'base'): XYZTile;
    private getExistingTile;
    ensureTiles(requests: XYZTileRequest[], segmentsPerSide: number): string[];
    getActiveTile(tileKey: string): XYZTile | null;
    getAnyTile(tileKey: string): XYZTile | null;
    syncVisibleTiles(visibleTileKeys: string[]): void;
    evictCached(maxCachedTiles: number): void;
    dispose(): void;
    private cacheCleaner;
    private key;
}
export {};
