import AbstractSkyEntity from '../AbstractSkyEntity.js';
import { FoV } from '../FoV.js';
declare class HealpixGridSingleton extends AbstractSkyEntity {
    static ELEM_SIZE: number;
    static BYTES_X_ELEM: number;
    private _visibleorder;
    private showGrid;
    private _shaderProgram;
    private fragmentShader;
    private vertexShader;
    private _attribLocations;
    private _nPrimitiveFlags;
    private _vertexCataloguePositionBuffer;
    private _indexBuffer;
    private _vertexCataloguePosition;
    private _indexes;
    private fovObj;
    static INITIAL_FOV: number;
    static RADIUS: number;
    static INITIAL_POSITION: [number, number, number];
    static INITIAL_PhiRad: number;
    static INITIAL_ThetaRad: number;
    constructor(insideSphere: boolean);
    init(): void;
    refreshFoV(insideSphere: boolean): FoV;
    getMinFoV(): number;
    private initShaders;
    initBuffers(pixels: number[], order: number): void;
    updateTiles(pixels: number[], order: number): any;
    private refresh;
    private enableShader;
    toggleShowGrid(): void;
    draw(insideSphere: boolean): void;
    get visibleorder(): number;
}
declare const healpixGridSingleton: HealpixGridSingleton;
export default healpixGridSingleton;
//# sourceMappingURL=HealpixGridSingleton.d.ts.map