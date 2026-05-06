import type { XYZTileCoord, XYZTileGpuMesh } from './types.js';
import { XYZMeshBuilder } from './XYZMeshBuilder.js';
export declare class XYZAncestorMeshCache {
    private _webgl;
    private _meshBuilder;
    private _meshes;
    constructor(webgl: WebGL2RenderingContext, meshBuilder: XYZMeshBuilder);
    getMesh(targetTile: XYZTileCoord, ancestorTile: XYZTileCoord, segmentsPerSide: number): XYZTileGpuMesh;
    dispose(): void;
}
