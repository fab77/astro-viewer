declare class ShaderUtility {
    private lastUsedProgram;
    /** Bind a WebGL program only if it's not already bound. */
    useProgram(program: WebGLProgram): void;
    /** Create HiPS fragment shader (FS) */
    createHiPSFSShaderProgram(): WebGLShader | null;
    /** Create HiPS vertex shader (VS) */
    createHiPSVSShaderProgram(): WebGLShader | null;
    enableHiPSShader(): void;
    enableFootprintShader(): void;
    /** Kept original misspelling for compatibility */
    enableCatalgueShader(): void;
    /** Correct-spelling alias */
    enableCatalogueShader(): void;
    /** Kept original misspelling for compatibility */
    enebaleHEALPixShader(): void;
    /** Correct-spelling alias */
    enableHEALPixShader(): void;
    enableRADecShader(): void;
    private compileShader;
}
export declare const shaderUtility: ShaderUtility;
export default ShaderUtility;
//# sourceMappingURL=ShaderUtility.d.ts.map