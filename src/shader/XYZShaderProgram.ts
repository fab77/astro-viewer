/*
 * AstroViewer
 * Copyright (C) Fabrizio Giordano
 * SPDX-License-Identifier: LicenseRef-AstroViewer-Dual-License
 *
 * This file is part of AstroViewer.
 * AstroViewer is distributed under a dual-license model.
 * Commercial use requires a separate commercial license.
 * Non-commercial use is governed by LICENSE-NONCOMMERCIAL.md.
 *
 * See LICENSE.md, LICENSE-COMMERCIAL.md, and LICENSE-NONCOMMERCIAL.md for details.
 */

import { ColorMaps } from '../model/ColorMaps.js'

type GL = WebGL2RenderingContext

type XYZLocations = {
  pMatrix: WebGLUniformLocation | null
  mMatrix: WebGLUniformLocation | null
  vMatrix: WebGLUniformLocation | null
  sampler: WebGLUniformLocation | null
  colorMapIdx: WebGLUniformLocation | null
  vertexPositionAttribute: number
  textureCoordAttribute: number
}

export class XYZShaderProgram {
  readonly locations: XYZLocations
  private _webgl: WebGL2RenderingContext
  private _shaderProgram?: WebGLProgram
  private _colorMapBlockIndex: number | null = null
  private _colorMapBuffer: WebGLBuffer | null = null
  private _runtimeColorMap:
    | { r: Float32Array; g: Float32Array; b: Float32Array }
    | undefined
  private _colorMapVariableInfo: Record<
    'r_palette' | 'g_palette' | 'b_palette',
    { index: number; offset: number }
  > = {
    r_palette: { index: 0, offset: 0 },
    g_palette: { index: 0, offset: 0 },
    b_palette: { index: 0, offset: 0 },
  }

  constructor(webgl: WebGL2RenderingContext) {
    this._webgl = webgl
    this.locations = {
      pMatrix: null,
      mMatrix: null,
      vMatrix: null,
      sampler: null,
      colorMapIdx: null,
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

  setRuntimeColorMap(
    colorMap:
      | { r: Float32Array; g: Float32Array; b: Float32Array }
      | undefined,
  ): void {
    this._runtimeColorMap = colorMap
  }

  enableShaders(
    pMatrix: Float32Array,
    vMatrix: Float32Array,
    mMatrix: Float32Array,
    colorMapIdx = 0,
  ): void {
    const gl = this._webgl as GL
    const program = this.shaderProgram
    gl.useProgram(program)

    this.locations.pMatrix = gl.getUniformLocation(program, 'uPMatrix')
    this.locations.mMatrix = gl.getUniformLocation(program, 'uMMatrix')
    this.locations.vMatrix = gl.getUniformLocation(program, 'uVMatrix')
    this.locations.sampler = gl.getUniformLocation(program, 'uSampler')
    this.locations.colorMapIdx = gl.getUniformLocation(program, 'cmapIdx')
    this.locations.vertexPositionAttribute = gl.getAttribLocation(program, 'aVertexPosition')
    this.locations.textureCoordAttribute = gl.getAttribLocation(program, 'aTextureCoord')

    gl.uniformMatrix4fv(this.locations.pMatrix, false, pMatrix)
    gl.uniformMatrix4fv(this.locations.vMatrix, false, vMatrix)
    gl.uniformMatrix4fv(this.locations.mMatrix, false, mMatrix)
    gl.uniform1i(this.locations.sampler, 0)
    gl.uniform1i(this.locations.colorMapIdx, colorMapIdx)

    if (colorMapIdx >= 2) {
      this.uploadColorMap(colorMapIdx)
    }
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
      uniform int cmapIdx;

      layout (std140) uniform colormap {
        float r_palette[256];
        float g_palette[256];
        float b_palette[256];
      };

      out vec4 outColor;

      void main(void) {
        vec4 color = texture(uSampler, vTextureCoord);

        if (cmapIdx == 1) {
          float gray = 0.21 * color.r + 0.71 * color.g + 0.07 * color.b;
          outColor = vec4(vec3(gray), color.a);
          return;
        }

        if (cmapIdx >= 2) {
          int rIndex = int(clamp(color.r * 255.0, 0.0, 255.0));
          int gIndex = int(clamp(color.g * 255.0, 0.0, 255.0));
          int bIndex = int(clamp(color.b * 255.0, 0.0, 255.0));

          outColor = vec4(
            r_palette[rIndex] / 256.0,
            g_palette[gIndex] / 256.0,
            b_palette[bIndex] / 256.0,
            color.a
          );
          return;
        }

        outColor = color;
      }`,
    )

    gl.attachShader(this._shaderProgram as WebGLProgram, vertexShader)
    gl.attachShader(this._shaderProgram as WebGLProgram, fragmentShader)
    gl.linkProgram(this._shaderProgram as WebGLProgram)

    if (!gl.getProgramParameter(this._shaderProgram as WebGLProgram, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(this._shaderProgram as WebGLProgram) || 'Could not initialise XYZ shaders')
    }

    this.initColorMapBuffer()
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

  private initColorMapBuffer(): void {
    const gl = this._webgl as GL
    const program = this._shaderProgram as WebGLProgram

    const blockIndex = gl.getUniformBlockIndex(program, 'colormap')
    if (blockIndex === gl.INVALID_INDEX) {
      this._colorMapBlockIndex = null
      return
    }

    this._colorMapBlockIndex = blockIndex

    const variableNames = ['r_palette', 'g_palette', 'b_palette'] as const
    const variableIndices = gl.getUniformIndices(
      program,
      variableNames as unknown as string[],
    ) as number[]
    const variableOffsets = gl.getActiveUniforms(
      program,
      variableIndices,
      gl.UNIFORM_OFFSET,
    ) as number[]

    variableNames.forEach((name, index) => {
      this._colorMapVariableInfo[name] = {
        index: variableIndices[index],
        offset: variableOffsets[index],
      }
    })

    this._colorMapBuffer = gl.createBuffer()
    gl.bindBuffer(gl.UNIFORM_BUFFER, this._colorMapBuffer)
    gl.bufferData(gl.UNIFORM_BUFFER, 3 * 4096, gl.STATIC_DRAW)
    gl.bindBuffer(gl.UNIFORM_BUFFER, null)
    gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, this._colorMapBuffer)
    gl.uniformBlockBinding(program, blockIndex, 0)
  }

  private uploadColorMap(colorMapIdx: number): void {
    if (!this._colorMapBuffer || this._colorMapBlockIndex === null) {
      return
    }

    const colorMap = this.getColorMap(colorMapIdx)
    if (!colorMap) {
      return
    }

    const gl = this._webgl as GL
    const program = this.shaderProgram
    gl.uniformBlockBinding(program, this._colorMapBlockIndex, 0)
    gl.bindBuffer(gl.UNIFORM_BUFFER, this._colorMapBuffer)

    const info = this._colorMapVariableInfo
    gl.bufferSubData(gl.UNIFORM_BUFFER, info.r_palette.offset, colorMap.r, 0)
    gl.bufferSubData(gl.UNIFORM_BUFFER, info.g_palette.offset, colorMap.g, 0)
    gl.bufferSubData(gl.UNIFORM_BUFFER, info.b_palette.offset, colorMap.b, 0)

    gl.bindBuffer(gl.UNIFORM_BUFFER, null)
  }

  private getColorMap(
    colorMapIdx: number,
  ): { r: Float32Array; g: Float32Array; b: Float32Array } | undefined {
    switch (colorMapIdx) {
      case 2:
        return ColorMaps.planck
      case 3:
        return ColorMaps.cmb
      case 4:
        return ColorMaps.rainbow
      case 5:
        return ColorMaps.eosb
      case 6:
        return ColorMaps.cubehelix
      case 7:
        return ColorMaps.hot
      case 8:
        return ColorMaps.gray
      default:
        return this._runtimeColorMap
    }
  }
}
