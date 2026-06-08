import type { MeshHiPSMesh } from './MeshHiPSTypes.js';
export declare class OBJMeshParser {
    static parse(text: string): MeshHiPSMesh;
    private static computeVertexNormals;
    private static resolveIndex;
}
