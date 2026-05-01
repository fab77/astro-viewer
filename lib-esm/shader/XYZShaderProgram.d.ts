type XYZLocations = {
    pMatrix: WebGLUniformLocation | null;
    mMatrix: WebGLUniformLocation | null;
    vMatrix: WebGLUniformLocation | null;
    sampler: WebGLUniformLocation | null;
    vertexPositionAttribute: number;
    textureCoordAttribute: number;
};
export declare class XYZShaderProgram {
    readonly locations: XYZLocations;
    private _webgl;
    private _shaderProgram?;
    constructor(webgl: WebGL2RenderingContext);
    get shaderProgram(): WebGLProgram;
    enableProgram(): void;
    enableShaders(pMatrix: Float32Array, vMatrix: Float32Array, mMatrix: Float32Array): void;
    private initShaders;
    private compileShader;
}
export {};
