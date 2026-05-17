import { XYZShaderProgram } from '../../shader/XYZShaderProgram.js';
import { XYZMeshBuilder } from './XYZMeshBuilder.js';
import { XYZTile } from './XYZTile.js';
import type { XYZTileCoord } from './XYZTypes.js';
type Mat4 = Float32Array;
export declare class XYZAnchestorTile extends XYZTile {
    private _ancestorMeshBuilder;
    private _ancestorWebgl;
    private _segmentsPerSide;
    private _meshCache;
    constructor(coord: XYZTileCoord, url: string, webgl: WebGL2RenderingContext, shaderProgram: XYZShaderProgram, meshBuilder?: XYZMeshBuilder, segmentsPerSide?: number);
    draw(pMatrixOrVisibleZoom: Mat4 | number, vMatrixOrVisibleTiles: Mat4 | XYZTileCoord[], mMatrixOrAncestorsMap: Mat4 | Map<string, XYZTileCoord>, colorMapIdxOrPMatrix: number | Mat4, vMatrix?: Mat4, mMatrix?: Mat4, colorMapIdx?: number): boolean;
    dispose(): void;
    private getRemappedMesh;
    private isAncestorOf;
}
export { XYZAnchestorTile as XYZAncestorTile };
