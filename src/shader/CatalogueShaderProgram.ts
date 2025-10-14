// HiPSShaderProgram.ts
import { mat4 } from 'gl-matrix';
import global from '../Global.js'
import ShaderManager from './ShaderManager.js'

type GL = WebGL2RenderingContext;

type UniformNames = {
  vertex_color: string,
  m_perspective: string,
  m_model_view: string,
}

type AttributeNames = {
  vertex_pos: string
  vertex_selected: string
  point_size: string
  point_hue: string
}

type Locations = {
  pMatrix: WebGLUniformLocation | null
  mvMatrix: WebGLUniformLocation | null
  color: WebGLUniformLocation | null
  position: number
  hovered: number
  pointSize: number
  brightness: number
}

export default class CatalogueShaderProgram {
  private _shaderProgram: WebGLProgram | undefined
  private _vertexShader!: WebGLShader
  private _fragmentShader!: WebGLShader

  readonly gl_uniforms: UniformNames
  readonly gl_attributes: AttributeNames
  readonly locations: Locations

  
  constructor() {
    this.gl_uniforms = {
      vertex_color: 'u_fragcolor',
      m_perspective: 'uPMatrix',
      m_model_view: 'uMVMatrix'
    }

    this.gl_attributes = {
      vertex_pos: 'aCatPosition',
      vertex_selected: 'a_selected',
      point_size: 'a_pointsize',
      point_hue: 'a_brightness'
    }

    this.locations = {
      pMatrix: null,
      mvMatrix: null,
      color: null,
      position: -1,
      hovered: -1,
      pointSize: -1,
      brightness: -1
    }
  }

  get shaderProgram(): WebGLProgram {
    if (!this._shaderProgram) {
      const gl = global.gl as GL
      this._shaderProgram = gl.createProgram() as WebGLProgram
      this.initShaders()
    }
    return this._shaderProgram
  }

  private initShaders(): void {
    const gl = global.gl as GL

    const fragmentShaderStr = ShaderManager.catalogueFS()
    this._fragmentShader = gl.createShader(gl.FRAGMENT_SHADER) as WebGLShader
    gl.shaderSource(this._fragmentShader, fragmentShaderStr)
    gl.compileShader(this._fragmentShader)
    console.log('FS log:', gl.getShaderInfoLog(this._fragmentShader) || 'ok');
    if (!gl.getShaderParameter(this._fragmentShader, gl.COMPILE_STATUS)) {
      alert(gl.getShaderInfoLog(this._fragmentShader) || 'Fragment shader compile error')
      return
    }

    const vertexShaderStr = ShaderManager.catalogueVS()
    this._vertexShader = gl.createShader(gl.VERTEX_SHADER) as WebGLShader
    gl.shaderSource(this._vertexShader, vertexShaderStr)
    gl.compileShader(this._vertexShader)
    console.log('VS log:', gl.getShaderInfoLog(this._vertexShader) || 'ok');
    if (!gl.getShaderParameter(this._vertexShader, gl.COMPILE_STATUS)) {
      alert(gl.getShaderInfoLog(this._vertexShader) || 'Vertex shader compile error')
      return
    }

    gl.attachShader(this.shaderProgram as WebGLProgram, this._vertexShader)
    gl.attachShader(this.shaderProgram as WebGLProgram, this._fragmentShader)
    gl.linkProgram(this.shaderProgram as WebGLProgram)

    if (!gl.getProgramParameter(this.shaderProgram as WebGLProgram, gl.LINK_STATUS)) {
      alert('Could not initialise shaders')
    }

    // shaderUtility.useProgram(this.shaderProgram)
    gl.useProgram(this.shaderProgram);

    this.locations.position = gl.getAttribLocation(
      this.shaderProgram as WebGLProgram,
      this.gl_attributes.vertex_pos
    )
    this.locations.hovered = gl.getAttribLocation(
      this.shaderProgram as WebGLProgram,
      this.gl_attributes.vertex_selected
    )
    this.locations.pointSize = gl.getAttribLocation(
      this.shaderProgram as WebGLProgram,
      this.gl_attributes.point_size
    )
    this.locations.brightness = gl.getAttribLocation(
      this.shaderProgram as WebGLProgram,
      this.gl_attributes.point_hue
    )
    this.locations.color = gl.getUniformLocation(
      this.shaderProgram as WebGLProgram,
      this.gl_uniforms.vertex_color
    )


  }

  enableShaders(
    pMatrix: Float32Array,
    modelMatrix: Float32Array,
    viewMatrix: Float32Array
  ): void {
    const gl = global.gl as GL
    
    // shaderUtility.useProgram(this.shaderProgram)
    gl.useProgram(this.shaderProgram);


    this.locations.pMatrix = gl.getUniformLocation(
      this.shaderProgram as WebGLProgram,
      this.gl_uniforms.m_perspective
    )

    this.locations.mvMatrix = gl.getUniformLocation(
      this.shaderProgram as WebGLProgram,
      this.gl_uniforms.m_model_view
    )

    let mvMatrix = mat4.create()
    mvMatrix = mat4.multiply(mvMatrix, viewMatrix, modelMatrix)
    gl.uniformMatrix4fv(this.locations.pMatrix, false, pMatrix)
    gl.uniformMatrix4fv(this.locations.mvMatrix, false, mvMatrix as Float32Array)
  }
}

export const catalogueShaderProgram = new CatalogueShaderProgram()