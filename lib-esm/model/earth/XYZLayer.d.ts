import { AbstractSkyEntity, SkyEntityDrawInput } from '../AbstractSkyEntity.js';
import type { XYZLayerConfig } from './types.js';
export declare class XYZLayer extends AbstractSkyEntity {
    private _config;
    private _provider;
    private _meshBuilder;
    private _xyzShaderProgram;
    private _tiles;
    private _tileSelectionKey;
    constructor(config: XYZLayerConfig, webgl: WebGL2RenderingContext);
    get config(): XYZLayerConfig;
    private bootstrapTiles;
    draw(input: SkyEntityDrawInput): void;
    private disposeTiles;
}
