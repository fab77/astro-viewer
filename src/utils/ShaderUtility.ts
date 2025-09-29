import global from "../Global";
import ShaderManager from "../shader/ShaderManager";

type GL = WebGLRenderingContext | WebGL2RenderingContext;

class ShaderUtility {
  private lastUsedProgram: WebGLProgram | null = null;

  /** Bind a WebGL program only if it's not already bound. */
  useProgram(program: WebGLProgram): void {
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
  createHiPSFSShaderProgram(): WebGLShader | null {
    const source = ShaderManager.hipsNativeFS();
    return this.compileShader(source, "fragment");
  }

  /** Create HiPS vertex shader (VS) */
  createHiPSVSShaderProgram(): WebGLShader | null {
    const source = ShaderManager.hipsVS();
    return this.compileShader(source, "vertex");
  }

  // --- Enable hooks (left as stubs; add logic as needed) ---
  enableHiPSShader(): void {}
  enableFootprintShader(): void {}

  /** Kept original misspelling for compatibility */
  enableCatalgueShader(): void {}
  /** Correct-spelling alias */
  enableCatalogueShader(): void { this.enableCatalgueShader(); }

  /** Kept original misspelling for compatibility */
  enebaleHEALPixShader(): void {}
  /** Correct-spelling alias */
  enableHEALPixShader(): void { this.enebaleHEALPixShader(); }

  enableRADecShader(): void {}

  // --- Internals ---
  private compileShader(source: string, kind: "vertex" | "fragment"): WebGLShader | null {
    const gl = global.gl;
    if (!gl) {
      throw new Error("WebGL context is not initialized.");
    }
    const type = kind === "vertex" ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER;

    const shader = gl.createShader(type);
    if (!shader) return null;

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