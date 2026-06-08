type MeshHiPSLocations = {
    pMatrix: WebGLUniformLocation | null;
    mMatrix: WebGLUniformLocation | null;
    vMatrix: WebGLUniformLocation | null;
    color: WebGLUniformLocation | null;
    vertexPositionAttribute: number;
    vertexNormalAttribute: number;
};
export declare class MeshHiPSShaderProgram {
    private _webgl;
    readonly locations: MeshHiPSLocations;
    private _shaderProgram?;
    constructor(_webgl: WebGL2RenderingContext);
    get shaderProgram(): WebGLProgram;
    enableProgram(): void;
    enableShaders(pMatrix: Float32Array, vMatrix: Float32Array, mMatrix: Float32Array, color: [number, number, number, number]): void;
    private initShaders;
    private compileShader;
}
export {};
