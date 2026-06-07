/*
 * AstroViewer
 * Copyright (C) Fabrizio Giordano
 * SPDX-License-Identifier: LicenseRef-AstroViewer-Dual-License
 */

type MeshHiPSLocations = {
  pMatrix: WebGLUniformLocation | null
  mMatrix: WebGLUniformLocation | null
  vMatrix: WebGLUniformLocation | null
  color: WebGLUniformLocation | null
  vertexPositionAttribute: number
}

export class MeshHiPSShaderProgram {
  readonly locations: MeshHiPSLocations
  private _shaderProgram?: WebGLProgram

  constructor(private _webgl: WebGL2RenderingContext) {
    this.locations = {
      pMatrix: null,
      mMatrix: null,
      vMatrix: null,
      color: null,
      vertexPositionAttribute: -1,
    }
  }

  get shaderProgram(): WebGLProgram {
    const gl = this._webgl
    if (!this._shaderProgram) {
      const program = gl.createProgram()
      if (!program) throw new Error('Could not create MeshHiPS shader program')
      this._shaderProgram = program
      this.initShaders()
    }
    gl.useProgram(this._shaderProgram)
    return this._shaderProgram
  }

  enableProgram(): void {
    this._webgl.useProgram(this.shaderProgram)
  }

  enableShaders(
    pMatrix: Float32Array,
    vMatrix: Float32Array,
    mMatrix: Float32Array,
    color: [number, number, number, number],
  ): void {
    const gl = this._webgl
    const program = this.shaderProgram
    gl.useProgram(program)

    this.locations.pMatrix = gl.getUniformLocation(program, 'uPMatrix')
    this.locations.vMatrix = gl.getUniformLocation(program, 'uVMatrix')
    this.locations.mMatrix = gl.getUniformLocation(program, 'uMMatrix')
    this.locations.color = gl.getUniformLocation(program, 'uColor')
    this.locations.vertexPositionAttribute = gl.getAttribLocation(program, 'aVertexPosition')

    gl.uniformMatrix4fv(this.locations.pMatrix, false, pMatrix)
    gl.uniformMatrix4fv(this.locations.vMatrix, false, vMatrix)
    gl.uniformMatrix4fv(this.locations.mMatrix, false, mMatrix)
    gl.uniform4fv(this.locations.color, color)
  }

  private initShaders(): void {
    const gl = this._webgl
    const vertexShader = this.compileShader(
      gl.VERTEX_SHADER,
      `#version 300 es
      in vec3 aVertexPosition;
      uniform mat4 uPMatrix;
      uniform mat4 uVMatrix;
      uniform mat4 uMMatrix;
      void main(void) {
        gl_Position = uPMatrix * uVMatrix * uMMatrix * vec4(aVertexPosition, 1.0);
      }`,
    )

    const fragmentShader = this.compileShader(
      gl.FRAGMENT_SHADER,
      `#version 300 es
      precision mediump float;
      uniform vec4 uColor;
      out vec4 outColor;
      void main(void) {
        outColor = uColor;
      }`,
    )

    gl.attachShader(this._shaderProgram as WebGLProgram, vertexShader)
    gl.attachShader(this._shaderProgram as WebGLProgram, fragmentShader)
    gl.linkProgram(this._shaderProgram as WebGLProgram)

    if (!gl.getProgramParameter(this._shaderProgram as WebGLProgram, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(this._shaderProgram as WebGLProgram) || 'Could not initialise MeshHiPS shaders')
    }
  }

  private compileShader(type: number, source: string): WebGLShader {
    const gl = this._webgl
    const shader = gl.createShader(type)
    if (!shader) throw new Error('Could not create MeshHiPS shader')
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader) || 'MeshHiPS shader compile error')
    }
    return shader
  }
}
