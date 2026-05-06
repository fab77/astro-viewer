import type { XYZTileCoord } from './types.js';
import { XYZTileProvider } from './XYZTileProvider.js';
import type { SkyEntityDrawInput } from '../AbstractSkyEntity.js';
export type XYZTileSelection = {
    key: string;
    currentTiles: XYZTileCoord[];
    fallbackTiles: XYZTileCoord[];
    currentZoom: number;
    coreTileCount: number;
    coverageTileCount: number;
};
export declare class XYZVisibleTilesManager {
    private _provider;
    constructor(provider: XYZTileProvider);
    selectTiles(input: SkyEntityDrawInput): XYZTileSelection;
    private buildCoreVisibleTiles;
    private buildCoverageTiles;
    private collectCoverageSamples;
    private interpolateFoVPolygon;
    private getNeighborRing;
    private isBoundaryTile;
    private normalizeTile;
    private normalizePhi;
    private buildFallbackMap;
    private buildFallbackSeedTiles;
    private orderTilesByScreenRelevance;
    private orderFallbackTiles;
    private getCenterTileCoord;
    private key;
}
