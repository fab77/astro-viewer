type UniformNames = {
    vertex_color: string;
    m_perspective: string;
    m_model_view: string;
};
type AttributeNames = {
    vertex_pos: string;
    vertex_selected: string;
    point_size: string;
    point_hue: string;
};
type Locations = {
    pMatrix: WebGLUniformLocation | null;
    mvMatrix: WebGLUniformLocation | null;
    color: WebGLUniformLocation | null;
    position: number;
    hovered: number;
    pointSize: number;
    brightness: number;
};
export default class CatalogueShaderProgram {
    private _shaderProgram;
    private _vertexShader;
    private _fragmentShader;
    readonly gl_uniforms: UniformNames;
    readonly gl_attributes: AttributeNames;
    readonly locations: Locations;
    constructor();
    get shaderProgram(): WebGLProgram;
    private initShaders;
    enableShaders(pMatrix: Float32Array, modelMatrix: Float32Array, viewMatrix: Float32Array): void;
}
export declare const catalogueShaderProgram: CatalogueShaderProgram;
export {};
//# sourceMappingURL=CatalogueShaderProgram.d.ts.map