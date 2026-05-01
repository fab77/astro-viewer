import { AbstractSkyEntity, SkyEntityDrawInput } from '../AbstractSkyEntity.js';
import type { XYZLayerConfig, XYZLayerDebugStats } from './types.js';
export declare class XYZLayer extends AbstractSkyEntity {
    private static readonly DEFAULT_MAX_CACHED_TILES;
    private _config;
    private _provider;
    private _visibleTilesManager;
    private _meshBuilder;
    private _xyzShaderProgram;
    private _tileCache;
    private _visibleTileKeys;
    private _tilePriorities;
    private _tileSelectionKey;
    private _currentTileCount;
    private _fallbackTileCount;
    constructor(config: XYZLayerConfig, webgl: WebGL2RenderingContext);
    get config(): XYZLayerConfig;
    getDebugStats(): XYZLayerDebugStats;
    private bootstrapTiles;
    draw(input: SkyEntityDrawInput): void;
    private evictCache;
    private disposeTiles;
    private getTileKey;
}
