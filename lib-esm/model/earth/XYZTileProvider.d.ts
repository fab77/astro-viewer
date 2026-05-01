import type { XYZLayerConfig, XYZTileCoord } from './types.js';
export declare class XYZTileProvider {
    private _config;
    constructor(config: XYZLayerConfig);
    get config(): XYZLayerConfig;
    getInitialTiles(): XYZTileCoord[];
    getTileUrl(tile: XYZTileCoord): string;
}
