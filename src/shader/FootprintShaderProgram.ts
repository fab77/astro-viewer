/*
 * AstroViewer
 * Copyright (C) Fabrizio Giordano
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-AstroViewer-Commercial
 *
 * AstroViewer is dual-licensed under the GNU Affero General Public License
 * version 3 and a separate commercial license.
 *
 * See LICENSE.md, LICENSE-AGPL.md, and LICENSE-COMMERCIAL.md for details.
 */

// HiPSShaderProgram.ts
import { mat4 } from 'gl-matrix';
import ShaderManager from './ShaderManager.js'

type GL = WebGL2RenderingContext;

type UniformNames = {
  vertex_color: string,
  m_perspective: string,
  m_model_view: string,
  point_size: string
}

type AttributeNames = {
  vertex_pos: string

}

type Locations = {
  pMatrix: WebGLUniformLocation | null
  mvMatrix: WebGLUniformLocation | null
  color: WebGLUniformLocation | null
  position: number
  pointSize: WebGLUniformLocation | null
}

export class FootprintShaderProgram {
// export default class FootprintShaderProgram {
  private _shaderProgram: WebGLProgram | undefined
  private _vertexShader!: WebGLShader
  private _fragmentShader!: WebGLShader

  readonly gl_uniforms: UniformNames
  readonly gl_attributes: AttributeNames
  readonly locations: Locations
  private _webgl: WebGL2RenderingContext;

  constructor(webgl: WebGL2RenderingContext) {
    this._webgl = webgl
    this.gl_uniforms = {
      vertex_color: 'u_fragcolor',
      m_perspective: 'uPMatrix',
      m_model_view: 'uMVMatrix',
      point_size: 'u_pointsize'
    }

    this.gl_attributes = {
      vertex_pos: 'aCatPosition'
    }

    this.locations = {
      pMatrix: null,
      mvMatrix: null,
      color: null,
      position: -1,
      pointSize: -1
    }
  }

  get shaderProgram(): WebGLProgram {
    if (!this._shaderProgram) {
      const gl = this._webgl as GL
      // const gl = global.gl as GL
      this._shaderProgram = gl.createProgram() as WebGLProgram
      this.initShaders()
    }
    return this._shaderProgram
  }

  private initShaders(): void {
    const gl = this._webgl as GL
    // const gl = global.gl as GL

    const fragmentShaderStr = ShaderManager.footprintFS()
    this._fragmentShader = gl.createShader(gl.FRAGMENT_SHADER) as WebGLShader
    gl.shaderSource(this._fragmentShader, fragmentShaderStr)
    gl.compileShader(this._fragmentShader)
    console.log('FS log:', gl.getShaderInfoLog(this._fragmentShader) || 'ok');
    if (!gl.getShaderParameter(this._fragmentShader, gl.COMPILE_STATUS)) {
      alert(gl.getShaderInfoLog(this._fragmentShader) || 'Fragment shader compile error')
      return
    }

    const vertexShaderStr = ShaderManager.footprintVS()
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

    gl.useProgram(this.shaderProgram);

    this.locations.position = gl.getAttribLocation(
      this.shaderProgram as WebGLProgram,
      this.gl_attributes.vertex_pos
    )

    this.locations.pointSize = gl.getUniformLocation(
      this.shaderProgram as WebGLProgram,
      this.gl_uniforms.point_size
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
    const gl = this._webgl as GL
    // const gl = global.gl as GL

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

// export const footprintShaderProgram = new FootprintShaderProgram()