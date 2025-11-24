import { HiPSShaderProgram } from '../../shader/HiPSShaderProgram.js';
import { TileBuffer } from './TileBuffer.js';
import { HiPS } from './HiPS.js';
declare class AncestorTile {
    private _hips;
    private _tileno;
    private _baseurl;
    private _order;
    private _ready;
    private _format;
    private _isGalacticHips;
    opacity: number;
    private _hipsShaderIndex;
    private _pixels;
    private _texture;
    private _image;
    private _texurl;
    private vertexPosition;
    private vertexPositionBuffer;
    private vertexIndices;
    private vertexIndexBuffer;
    private _tileBuffer;
    private _hipsShaderProgram;
    private _webgl;
    constructor(tileno: number, order: number, hips: HiPS, tileBuffer: TileBuffer, hipsShaderProgram: HiPSShaderProgram, webgl: WebGL2RenderingContext);
    destroyIntervals(): void;
    private initImage;
    private imageLoaded;
    private textureLoaded;
    private initModelBuffer;
    private computeVertexIndices;
    private setupPositionAndTexture4Quadrant2;
    private setupPositionAndTexture4Quadrant;
    draw(visibleOrder: number, visibleTilesMap: Map<number, number[]>, pMatrix: Float32Array, vMatrix: Float32Array, mMatrix: Float32Array, colorMapIdx: number): boolean;
    private drawChildren;
}
export default AncestorTile;
//# sourceMappingURL=AncestorTile.d.ts.map