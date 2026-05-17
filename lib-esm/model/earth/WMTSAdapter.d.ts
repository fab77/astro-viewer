import type { WMTSLayerConfig, XYZLayerConfig } from './XYZConfig.js';
import type { XYZTileCoord } from './XYZTypes.js';
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
