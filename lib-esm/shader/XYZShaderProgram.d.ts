type XYZLocations = {
    pMatrix: WebGLUniformLocation | null;
    mMatrix: WebGLUniformLocation | null;
    vMatrix: WebGLUniformLocation | null;
    sampler: WebGLUniformLocation | null;
    colorMapIdx: WebGLUniformLocation | null;
    vertexPositionAttribute: number;
    textureCoordAttribute: number;
};
export declare class XYZShaderProgram {
    readonly locations: XYZLocations;
    private _webgl;
    private _shaderProgram?;
    private _colorMapBlockIndex;
    private _colorMapBuffer;
    private _runtimeColorMap;
    private _colorMapVariableInfo;
    constructor(webgl: WebGL2RenderingContext);
    get shaderProgram(): WebGLProgram;
    enableProgram(): void;
    setRuntimeColorMap(colorMap: {
        r: Float32Array;
        g: Float32Array;
        b: Float32Array;
    } | undefined): void;
    enableShaders(pMatrix: Float32Array, vMatrix: Float32Array, mMatrix: Float32Array, colorMapIdx?: number): void;
    private initShaders;
    private compileShader;
    private initColorMapBuffer;
    private uploadColorMap;
    private getColorMap;
}
export {};
