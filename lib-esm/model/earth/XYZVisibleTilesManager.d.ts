import type { XYZTileCoord } from './types.js';
import { XYZTileProvider } from './XYZTileProvider.js';
import type { SkyEntityDrawInput } from '../AbstractSkyEntity.js';
export type XYZTileSelection = {
    key: string;
    currentTiles: XYZTileCoord[];
    fallbackTiles: XYZTileCoord[];
};
export declare class XYZVisibleTilesManager {
    private _provider;
    constructor(provider: XYZTileProvider);
    selectTiles(input: SkyEntityDrawInput): XYZTileSelection;
}
