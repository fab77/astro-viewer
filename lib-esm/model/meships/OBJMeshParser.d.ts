import type { MeshHiPSMesh } from './MeshHiPSTypes.js';
export type OBJGeneratedNormalsMode = 'smooth' | 'flat';
export interface OBJMeshParserOptions {
    readonly preferFileNormals?: boolean;
    readonly generatedNormals?: OBJGeneratedNormalsMode;
}
export declare class OBJMeshParser {
    static parse(text: string, options?: OBJMeshParserOptions): MeshHiPSMesh;
    private static parseFaceToken;
    private static parseIndex;
    private static triangulateFaces;
    private static buildMeshWithFileNormals;
    private static buildMeshWithSmoothNormals;
    private static buildMeshWithFlatNormals;
    private static computeVertexNormals;
    private static computeFaceNormal;
    private static computeRawFaceNormal;
}
