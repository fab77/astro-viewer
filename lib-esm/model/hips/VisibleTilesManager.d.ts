import { TileBuffer } from './TileBuffer.js';
import { ReadonlyMat4 } from 'gl-matrix';
import { HealpixGrid } from '../grid/HealpixGrid.js';
import { HiPSShaderProgram } from '../../shader/HiPSShaderProgram.js';
import Camera from '../../Camera.js';
interface VisibleTiles {
    pixels: number[];
    order: number;
}
export declare class VisibleTilesManager {
    private _visibleTilesByOrder;
    private _ancestorsMap;
    private initialised;
    private _galVisibleTilesByOrder;
    private _galAncestorsMap;
    private _galacticMatrixInverted;
    private _galacticMatrix;
    private insideSphere;
    private _tileBuffer;
    private _healpixGrid;
    private _webgl;
    constructor(webgl: WebGL2RenderingContext, hipsShaderProgram: HiPSShaderProgram, healpixGrid: HealpixGrid);
    get healpixGrid(): HealpixGrid;
    get tileBuffer(): TileBuffer;
    init(insideSphere: boolean): void;
    getVisibleOrder(): number;
    computeVisiblePixels(order: number, webgl: WebGL2RenderingContext, camera: Camera, pMatrix: ReadonlyMat4): void;
    get visibleTilesByOrder(): VisibleTiles;
    get ancestorsMap(): Map<number, number[]>;
    get galVisibleTilesByOrder(): VisibleTiles;
    get galAncestorsMap(): Map<number, number[]>;
    get visibleOrder(): number;
}
export {};
//# sourceMappingURL=VisibleTilesManager.d.ts.map