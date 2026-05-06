import type { XYZTileCoord, XYZTileMesh, XYZTileGpuMesh } from './types.js';
export declare class XYZMeshBuilder {
    buildTileMesh(tile: XYZTileCoord, segmentsPerSide?: number): XYZTileMesh;
    buildAncestorMesh(targetTile: XYZTileCoord, ancestorTile: XYZTileCoord, segmentsPerSide?: number): XYZTileMesh;
    uploadMesh(mesh: XYZTileMesh, webgl: WebGL2RenderingContext): XYZTileGpuMesh;
}
