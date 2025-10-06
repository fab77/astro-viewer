export interface HipsLike {
    format: string;
    baseURL: string;
    maxOrder: number;
    minOrder: number;
    isGalacticHips: boolean;
}
declare class AllSkyTile {
    private _hips;
    private _tileno;
    private _baseurl;
    private _order;
    private _ready;
    private _abort;
    private _format;
    private _maxorder;
    private _minorder;
    private _isGalacticHips;
    opacity: number;
    private _hipsShaderIndex;
    private _pixels;
    private _texture;
    private _cacheTime0;
    private _inView;
    private _image;
    private _imageLoaded;
    private _downloading;
    private _textureLoaded;
    private vertexPosition;
    private vertexPositionBuffer;
    private vertexIndices;
    private vertexIndexBuffer;
    constructor(tileno: number, order: number, hips: HipsLike, image: HTMLImageElement);
    get cacheTime0(): number | undefined;
    resetCacheTime0(): void;
    setCacheTime0(): void;
    private imageLoaded;
    private textureLoaded;
    private initModelBuffer;
    private computeVertexIndices;
    private setupPositionAndTexture4Quadrant2;
    get inView(): boolean;
    draw(visibleOrder: number, // unused here but kept for signature parity
    visibleTilesMap: Map<number, number[]>, // unused
    pMatrix: Float32Array, // unused in this tile (shader expects already set)
    vMatrix: Float32Array, // unused
    mMatrix: Float32Array, // unused
    colorMapIdx: number): void;
}
export default AllSkyTile;
//# sourceMappingURL=AllSkyTile.d.ts.map