import type { XYZTileCoord } from './XYZTypes.js';
export declare class XYZMapDescriptor {
    _name: string;
    _url: string;
    _urlResolver?: (tile: XYZTileCoord) => string;
    _minZoom?: number;
    _maxZoom?: number;
    _segmentsPerSide?: number;
    _tileSize?: number;
    _maxCachedTiles?: number;
    _interactionDebounceMs?: number;
    _subdomains?: string[];
    _attribution?: string;
    _flipY?: boolean;
    _maxConcurrentLoads?: number;
    constructor(name: string, url: string, minZoom?: number, maxZoom?: number, segmentsPerSide?: number, maxCachedTiles?: number, maxConcurrentLoads?: number, urlResolver?: (tile: XYZTileCoord) => string);
    get url(): string;
    get urlResolver(): ((tile: XYZTileCoord) => string) | undefined;
    get name(): string;
    get minZoom(): number;
    get maxZoom(): number;
    get segmentsPerSide(): number;
    get maxCachedTiles(): number;
    get interactionDebounceMs(): number;
    get subdomains(): string[];
    get attribution(): string;
    get flipY(): boolean;
    get maxConcurrentLoads(): number;
}
