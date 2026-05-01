type GL = WebGL2RenderingContext

type XYZLocations = {
  pMatrix: WebGLUniformLocation | null
  mMatrix: WebGLUniformLocation | null
  vMatrix: WebGLUniformLocation | null
  sampler: WebGLUniformLocation | null
  vertexPositionAttribute: number
  textureCoordAttribute: number
}

export class XYZShaderProgram {
  readonly locations: XYZLocations
  private _webgl: WebGL2RenderingContext
  private _shaderProgram?: WebGLProgram

  constructor(webgl: WebGL2RenderingContext) {
    this._webgl = webgl
    this.locations = {
      pMatrix: null,
      mMatrix: null,
      vMatrix: null,
      sampler: null,
      vertexPositionAttribute: -1,
      textureCoordAttribute: -1,
    }
  }

  get shaderProgram(): WebGLProgram {
    const gl = this._webgl as GL
    if (!this._shaderProgram) {
      const program = gl.createProgram()
      if (!program) {
        throw new Error('Could not create XYZ shader program')
      }
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
  ): void {
    const gl = this._webgl as GL
    const program = this.shaderProgram
    gl.useProgram(program)

    this.locations.pMatrix = gl.getUniformLocation(program, 'uPMatrix')
    this.locations.mMatrix = gl.getUniformLocation(program, 'uMMatrix')
    this.locations.vMatrix = gl.getUniformLocation(program, 'uVMatrix')
    this.locations.sampler = gl.getUniformLocation(program, 'uSampler')
    this.locations.vertexPositionAttribute = gl.getAttribLocation(program, 'aVertexPosition')
    this.locations.textureCoordAttribute = gl.getAttribLocation(program, 'aTextureCoord')

    gl.uniformMatrix4fv(this.locations.pMatrix, false, pMatrix)
    gl.uniformMatrix4fv(this.locations.vMatrix, false, vMatrix)
    gl.uniformMatrix4fv(this.locations.mMatrix, false, mMatrix)
    gl.uniform1i(this.locations.sampler, 0)
  }

  private initShaders(): void {
    const gl = this._webgl as GL
    const vertexShader = this.compileShader(
      gl.VERTEX_SHADER,
      `#version 300 es
      in vec3 aVertexPosition;
      in vec2 aTextureCoord;
      uniform mat4 uPMatrix;
      uniform mat4 uVMatrix;
      uniform mat4 uMMatrix;
      out vec2 vTextureCoord;
      void main(void) {
        vTextureCoord = aTextureCoord;
        gl_Position = uPMatrix * uVMatrix * uMMatrix * vec4(aVertexPosition, 1.0);
      }`,
    )

    const fragmentShader = this.compileShader(
      gl.FRAGMENT_SHADER,
      `#version 300 es
      precision mediump float;
      in vec2 vTextureCoord;
      uniform sampler2D uSampler;
      out vec4 outColor;
      void main(void) {
        outColor = texture(uSampler, vTextureCoord);
      }`,
    )

    gl.attachShader(this._shaderProgram as WebGLProgram, vertexShader)
    gl.attachShader(this._shaderProgram as WebGLProgram, fragmentShader)
    gl.linkProgram(this._shaderProgram as WebGLProgram)

    if (!gl.getProgramParameter(this._shaderProgram as WebGLProgram, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(this._shaderProgram as WebGLProgram) || 'Could not initialise XYZ shaders')
    }
  }

  private compileShader(type: number, source: string): WebGLShader {
    const gl = this._webgl as GL
    const shader = gl.createShader(type)
    if (!shader) {
      throw new Error('Could not create XYZ shader')
    }
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader) || 'XYZ shader compile error')
    }
    return shader
  }
}
