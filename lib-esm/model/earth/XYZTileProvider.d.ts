import Camera from '../../Camera.js';
import type { XYZLayerConfig, XYZTileCoord } from './types.js';
type XYZTileSelection = {
    key: string;
    tiles: XYZTileCoord[];
};
type ViewCenterSpherical = {
    phi: number;
    theta: number;
};
export declare class XYZTileProvider {
    private _config;
    constructor(config: XYZLayerConfig);
    get config(): XYZLayerConfig;
    getInitialTiles(): XYZTileCoord[];
    getTilesForCamera(fovDeg: number, camera: Camera | null, centerSphericalDeg: ViewCenterSpherical | null): XYZTileSelection;
    getTileUrl(tile: XYZTileCoord): string;
    private resolveZoom;
    private clampZoom;
    private resolveViewCenter;
    private latToTileY;
    private wrapTileX;
    private clampTileY;
    private deduplicateTiles;
}
export {};
