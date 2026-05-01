import { XYZShaderProgram } from '../../shader/XYZShaderProgram.js';
import type { XYZTileCoord, XYZTileMesh } from './types.js';
export declare class XYZTile {
    private _coord;
    private _url;
    private _webgl;
    private _shaderProgram;
    private _positionBuffer;
    private _uvBuffer;
    private _indexBuffer;
    private _texture;
    private _indices;
    private _indexType;
    private _ready;
    private _aborted;
    private _image?;
    constructor(coord: XYZTileCoord, url: string, mesh: XYZTileMesh, webgl: WebGL2RenderingContext, shaderProgram: XYZShaderProgram);
    get ready(): boolean;
    get coord(): XYZTileCoord;
    private loadTexture;
    private onImageLoaded;
    draw(pMatrix: Float32Array, vMatrix: Float32Array, mMatrix: Float32Array): void;
    dispose(): void;
}
