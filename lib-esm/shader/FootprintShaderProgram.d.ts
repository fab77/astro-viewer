type UniformNames = {
    vertex_color: string;
    m_perspective: string;
    m_model_view: string;
    point_size: string;
};
type AttributeNames = {
    vertex_pos: string;
};
type Locations = {
    pMatrix: WebGLUniformLocation | null;
    mvMatrix: WebGLUniformLocation | null;
    color: WebGLUniformLocation | null;
    position: number;
    pointSize: WebGLUniformLocation | null;
};
export declare class FootprintShaderProgram {
    private _shaderProgram;
    private _vertexShader;
    private _fragmentShader;
    readonly gl_uniforms: UniformNames;
    readonly gl_attributes: AttributeNames;
    readonly locations: Locations;
    private _webgl;
    constructor(webgl: WebGL2RenderingContext);
    get shaderProgram(): WebGLProgram;
    private initShaders;
    enableShaders(pMatrix: Float32Array, modelMatrix: Float32Array, viewMatrix: Float32Array): void;
}
export {};
