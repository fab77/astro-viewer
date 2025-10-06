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
export default class HiPSShaderProgram {
    private _shaderProgram;
    private _vertexShader;
    private _fragmentShader;
    private _UBO_colorMapBuffer;
    private _UBO_colorMapVariableInfo;
    readonly gl_uniforms: UniformNames;
    readonly gl_attributes: AttributeNames;
    readonly locations: Locations;
    constructor();
    get shaderProgram(): WebGLProgram;
    private initShaders;
    enableProgram(): void;
    setGrayscaleShader(): void;
    setNativeShader(): void;
    setColorMapShader(): void;
    private changeFSShader;
    enableShaders(pMatrix: Float32Array, vMatrix: Float32Array, mMatrix: Float32Array, colorMapIdx: number): void;
}
export declare const hipsShaderProgram: HiPSShaderProgram;
export {};
//# sourceMappingURL=HiPSShaderProgram.d.ts.map