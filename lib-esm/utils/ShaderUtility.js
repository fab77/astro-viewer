import global from "../Global.js";
import ShaderManager from "../shader/ShaderManager.js";
class ShaderUtility {
    lastUsedProgram = null;
    /** Bind a WebGL program only if it's not already bound. */
    useProgram(program) {
        const gl = global.gl;
        if (!gl) {
            throw new Error("WebGL context is not initialized.");
        }
        if (this.lastUsedProgram !== program) {
            gl.useProgram(program);
            this.lastUsedProgram = program;
        }
    }
    /** Create HiPS fragment shader (FS) */
    createHiPSFSShaderProgram() {
        const source = ShaderManager.hipsNativeFS();
        return this.compileShader(source, "fragment");
    }
    /** Create HiPS vertex shader (VS) */
    createHiPSVSShaderProgram() {
        const source = ShaderManager.hipsVS();
        return this.compileShader(source, "vertex");
    }
    // --- Enable hooks (left as stubs; add logic as needed) ---
    enableHiPSShader() { }
    enableFootprintShader() { }
    /** Kept original misspelling for compatibility */
    enableCatalgueShader() { }
    /** Correct-spelling alias */
    enableCatalogueShader() { this.enableCatalgueShader(); }
    /** Kept original misspelling for compatibility */
    enebaleHEALPixShader() { }
    /** Correct-spelling alias */
    enableHEALPixShader() { this.enebaleHEALPixShader(); }
    enableRADecShader() { }
    // --- Internals ---
    compileShader(source, kind) {
        const gl = global.gl;
        if (!gl) {
            throw new Error("WebGL context is not initialized.");
        }
        const type = kind === "vertex" ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER;
        const shader = gl.createShader(type);
        if (!shader)
            return null;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            // In browsers, alert exists; you may prefer console.error instead.
            alert(gl.getShaderInfoLog(shader) ?? "Unknown shader compile error");
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }
}
export const shaderUtility = new ShaderUtility();
export default ShaderUtility;
//# sourceMappingURL=ShaderUtility.js.map