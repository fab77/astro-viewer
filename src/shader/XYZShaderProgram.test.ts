import { describe, expect, it, jest } from "@jest/globals";
import { XYZShaderProgram } from "./XYZShaderProgram.js";

describe("XYZShaderProgram uniform buffers", () => {
  it("rebinds its colormap buffer whenever the program is enabled", () => {
    const program = {} as WebGLProgram;
    const buffer = {} as WebGLBuffer;
    const gl = {
      UNIFORM_BUFFER: 35345,
      useProgram: jest.fn(),
      getUniformLocation: jest.fn(() => ({} as WebGLUniformLocation)),
      getAttribLocation: jest.fn(() => 0),
      uniformMatrix4fv: jest.fn(),
      uniform1i: jest.fn(),
      uniform1f: jest.fn(),
      uniformBlockBinding: jest.fn(),
      bindBufferBase: jest.fn(),
    };
    const subject = Object.create(XYZShaderProgram.prototype) as
      XYZShaderProgram & Record<string, unknown>;
    Object.assign(subject, {
      _webgl: gl,
      _shaderProgram: program,
      _colorMapBuffer: buffer,
      _colorMapBlockIndex: 3,
      _opacity: 1,
      locations: {},
    });

    subject.enableShaders(
      new Float32Array(16),
      new Float32Array(16),
      new Float32Array(16),
      0,
    );

    expect(gl.uniformBlockBinding).toHaveBeenCalledWith(program, 3, 0);
    expect(gl.bindBufferBase).toHaveBeenCalledWith(
      gl.UNIFORM_BUFFER,
      0,
      buffer,
    );
  });
});
