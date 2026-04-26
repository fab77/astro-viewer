type UniformNames = {
    sampler: string;
    factor: string;
    m_perspective: string;
    m_model: string;
    m_view: string;
    colormapIdx: string;
    colormap_red: string;
    colormap_green: string;
    colormap_blue: string;
};
type AttributeNames = {
    vertex_pos: string;
    text_coords: string;
};
type Locations = {
    pMatrix: WebGLUniformLocation | null;
    mMatrix: WebGLUniformLocation | null;
    vMatrix: WebGLUniformLocation | null;
    sampler: WebGLUniformLocation | null;
    textureAlpha: WebGLUniformLocation | null;
    clorMapIdx: WebGLUniformLocation | null;
    vertexPositionAttribute: number;
    textureCoordAttribute: number;
};
export declare class HiPSShaderProgram {
    private _colorMapBlockIndex;
    private _runtimeColorMap;
    private _shaderProgram;
    private _vertexShader;
    private _fragmentShader;
    private _UBO_colorMapBuffer;
    private _UBO_colorMapVariableInfo;
    readonly gl_uniforms: UniformNames;
    readonly gl_attributes: AttributeNames;
    readonly locations: Locations;
    private _webgl;
    constructor(webgl: WebGL2RenderingContext);
    get shaderProgram(): WebGLProgram;
    setRuntimeColorMap(colorMap: {
        r: Float32Array;
        g: Float32Array;
        b: Float32Array;
    } | undefined): void;
    private initShaders;
    enableProgram(): void;
    setGrayscaleShader(): void;
    setNativeShader(): void;
    setColorMapShader(): void;
    private changeFSShader;
    enableShaders(pMatrix: Float32Array, vMatrix: Float32Array, mMatrix: Float32Array, colorMapIdx: number): void;
}
export {};
