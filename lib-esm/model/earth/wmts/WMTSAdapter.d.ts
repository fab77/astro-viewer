import type { WMTSLayerConfig, XYZLayerConfig, XYZTileCoord } from '../types.js';
export declare class WMTSAdapter {
    private _config;
    constructor(config: WMTSLayerConfig);
    toXYZLayerConfig(): XYZLayerConfig;
    private getInferredMaxZoom;
    getTileUrl(tile: XYZTileCoord): string;
    private buildRestUrl;
    private buildKvpUrl;
    private getCommonTokenValues;
}
