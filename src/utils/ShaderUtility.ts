import global from "../Global.js";
// import ShaderManager from "../shader/ShaderManager.js";

// type GL = WebGLRenderingContext | WebGL2RenderingContext;

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
}

export const shaderUtility = new ShaderUtility();
export default ShaderUtility;