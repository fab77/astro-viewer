import { Point } from '../Point.js';
import type { XYZLayerConfig, XYZTileCoord } from './types.js';
type ViewCenterSpherical = {
    phi: number;
    theta: number;
};
export declare class XYZTileProvider {
    private _config;
    constructor(config: XYZLayerConfig);
    get config(): XYZLayerConfig;
    get minZoom(): number;
    get maxZoom(): number;
    getInitialTiles(): XYZTileCoord[];
    getTileUrl(tile: XYZTileCoord): string;
    resolveZoom(fovDeg: number): number;
    private clampZoom;
    getVisibleTilesAtZoom(z: number, centerSphericalDeg: ViewCenterSpherical | null, fovPolygon: Point[], viewportSphericalSamples: ViewCenterSpherical[], padding?: number): XYZTileCoord[];
    private resolveViewCenter;
    private latToTileY;
    private wrapTileX;
    private normalizeLonAround;
    private clampTileY;
    private deduplicateTiles;
}
export {};
