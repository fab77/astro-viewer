import { MeshHiPSShaderProgram } from '../../shader/MeshHiPSShaderProgram.js';
import type { MeshHiPSTileCoord } from './MeshHiPSTypes.js';
type Mat4 = Float32Array;
export declare class MeshHiPSTile {
    readonly coord: MeshHiPSTileCoord;
    private _url;
    private _webgl;
    private _shaderProgram;
    private _gpuMesh;
    private _ready;
    private _loading;
    private _failed;
    private _lastUsedAt;
    private _createdAt;
    constructor(coord: MeshHiPSTileCoord, _url: string, _webgl: WebGL2RenderingContext, _shaderProgram: MeshHiPSShaderProgram);
    get ready(): boolean;
    get loading(): boolean;
    get failed(): boolean;
    get lastUsedAt(): number;
    get createdAt(): number;
    touch(): void;
    draw(pMatrix: Mat4, vMatrix: Mat4, mMatrix: Mat4, color: [number, number, number, number], wireframe: boolean): boolean;
    dispose(): void;
    private load;
    private uploadMesh;
    private buildLineIndices;
    private get key();
}
export {};
