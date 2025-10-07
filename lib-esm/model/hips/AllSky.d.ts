import HiPS from './HiPS.js';
export default class AllSky {
    private _ready;
    private _hips;
    private _format;
    private _baseurl;
    private _isGalacticHips;
    private _order;
    opacity: number;
    private _hipsShaderIndex;
    private _texture;
    private _image;
    private _texurl;
    private _textureLoaded;
    private _maxTiles;
    private _numFacesXTile;
    private _numFaces;
    private vertexPosition;
    private vertexPositionBuffer;
    private vertexIndexBuffer;
    private vidx;
    constructor(hips: HiPS);
    private initImage;
    private imageLoaded;
    private textureLoaded;
    private initModelBuffer;
    private setupPositionAndTexture4Quadrant;
    /**
     * Renders the all-sky layer and, when available, delegates to higher-resolution child tiles.
     * Returns `true` if it attempted to draw (ready), `false` if still not ready.
     */
    draw(visibleOrder: number, visibleTilesMap: Map<number, number[]>, pMatrix: Float32Array, vMatrix: Float32Array, mMatrix: Float32Array, colorMapIdx: number): boolean;
    private drawChildren;
}
//# sourceMappingURL=AllSky.d.ts.map