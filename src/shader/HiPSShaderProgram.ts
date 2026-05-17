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

// HiPSShaderProgram.ts
import ShaderManager from './ShaderManager.js'
import { ColorMaps } from '../model/ColorMaps.js'

type GL = WebGL2RenderingContext;

type UniformNames = {
  sampler: string
  factor: string
  m_perspective: string
  m_model: string
  m_view: string
  colormapIdx: string
  colormap_red: string
  colormap_green: string
  colormap_blue: string
}

type AttributeNames = {
  vertex_pos: string
  text_coords: string
}

type Locations = {
  pMatrix: WebGLUniformLocation | null
  mMatrix: WebGLUniformLocation | null
  vMatrix: WebGLUniformLocation | null
  sampler: WebGLUniformLocation | null
  textureAlpha: WebGLUniformLocation | null
  clorMapIdx: WebGLUniformLocation | null
  vertexPositionAttribute: number
  textureCoordAttribute: number
}

// export default class HiPSShaderProgram {
export class HiPSShaderProgram {
  private _colorMapBlockIndex: number | null = null;
  private _runtimeColorMap:
    | { r: Float32Array; g: Float32Array; b: Float32Array }
    | undefined;

  private _shaderProgram: WebGLProgram | undefined
  private _vertexShader!: WebGLShader
  private _fragmentShader!: WebGLShader

  private _UBO_colorMapBuffer: WebGLBuffer | null = null
  private _UBO_colorMapVariableInfo: Record<
    'r_palette' | 'g_palette' | 'b_palette',
    { index: number; offset: number }
  > = {
      r_palette: { index: 0, offset: 0 },
      g_palette: { index: 0, offset: 0 },
      b_palette: { index: 0, offset: 0 }
    }

  readonly gl_uniforms: UniformNames
  readonly gl_attributes: AttributeNames
  readonly locations: Locations
  private _webgl: WebGL2RenderingContext

  constructor(webgl: WebGL2RenderingContext) {
    this._webgl = webgl
    this.gl_uniforms = {
      sampler: 'uSampler0',
      factor: 'uFactor0',
      m_perspective: 'uPMatrix',
      m_model: 'uMMatrix',
      m_view: 'uVMatrix',
      colormapIdx: 'cmapIdx',
      colormap_red: 'r',
      colormap_green: 'g',
      colormap_blue: 'b'
    }

    this.gl_attributes = {
      vertex_pos: 'aVertexPosition',
      text_coords: 'aTextureCoord'
    }

    this.locations = {
      pMatrix: null,
      mMatrix: null,
      vMatrix: null,
      sampler: null,
      textureAlpha: null,
      clorMapIdx: null,
      vertexPositionAttribute: -1,
      textureCoordAttribute: -1
    }
  }

  get shaderProgram(): WebGLProgram {
    const gl = this._webgl as GL
    if (!this._shaderProgram) {
      // const gl = global.gl as GL
      this._shaderProgram = gl.createProgram() as WebGLProgram
      this.initShaders()
    }
    ; gl.useProgram(this._shaderProgram)
    return this._shaderProgram
  }

  setRuntimeColorMap(
    colorMap:
      | { r: Float32Array; g: Float32Array; b: Float32Array }
      | undefined,
  ): void {
    this._runtimeColorMap = colorMap
  }

  private initShaders(): void {
    // const gl = global.gl as GL
    const gl = this._webgl as GL

    const fragmentShaderStr = ShaderManager.hipsNativeFS()
    this._fragmentShader = gl.createShader(gl.FRAGMENT_SHADER) as WebGLShader
    gl.shaderSource(this._fragmentShader, fragmentShaderStr)
    gl.compileShader(this._fragmentShader)
    if (!gl.getShaderParameter(this._fragmentShader, gl.COMPILE_STATUS)) {
      alert(gl.getShaderInfoLog(this._fragmentShader) || 'Fragment shader compile error')
      return
    }

    const vertexShaderStr = ShaderManager.hipsVS()
    this._vertexShader = gl.createShader(gl.VERTEX_SHADER) as WebGLShader
    gl.shaderSource(this._vertexShader, vertexShaderStr)
    gl.compileShader(this._vertexShader)
    if (!gl.getShaderParameter(this._vertexShader, gl.COMPILE_STATUS)) {
      alert(gl.getShaderInfoLog(this._vertexShader) || 'Vertex shader compile error')
      return
    }

    gl.attachShader(this._shaderProgram as WebGLProgram, this._vertexShader)
    gl.attachShader(this._shaderProgram as WebGLProgram, this._fragmentShader)
    gl.linkProgram(this._shaderProgram as WebGLProgram)

    if (!gl.getProgramParameter(this._shaderProgram as WebGLProgram, gl.LINK_STATUS)) {
      alert('Could not initialise shaders')
    }
  }

  enableProgram(): void {
    // (global.gl as GL).useProgram(this._shaderProgram as WebGLProgram)
    (this._webgl as GL).useProgram(this.shaderProgram as WebGLProgram)

  }

  setGrayscaleShader(): void {
    // const gl = global.gl as GL
    const gl = this._webgl as GL
    gl.detachShader(this.shaderProgram as WebGLProgram, this._fragmentShader)
    const fragmentShaderStr = ShaderManager.hipsGrayscaleFS()
    this.changeFSShader(fragmentShaderStr)
  }

  setNativeShader(): void {
    // const gl = global.gl as GL
    const gl = this._webgl as GL
    gl.detachShader(this.shaderProgram as WebGLProgram, this._fragmentShader)
    const fragmentShaderStr = ShaderManager.hipsNativeFS()
    this.changeFSShader(fragmentShaderStr)
  }

  setColorMapShader(): void {
    // const gl = global.gl as GL
    const gl = this._webgl as GL

    // Swap fragment shader
    gl.detachShader(this.shaderProgram as WebGLProgram, this._fragmentShader)
    const fragmentShaderStr = ShaderManager.hipsColorMapFS()
    this.changeFSShader(fragmentShaderStr)

    // UBO discovery for the "colormap" block
    const blockIndex = gl.getUniformBlockIndex(
      this.shaderProgram as WebGLProgram,
      'colormap'
    )

    // INVALID_INDEX == 0xFFFFFFFF in WebGL2
    if (blockIndex === gl.INVALID_INDEX) {
      console.warn(
        'HiPSShaderProgram: uniform block "colormap" not found in hipsColorMapFS()'
      );
      this._colorMapBlockIndex = null;
      this._UBO_colorMapBuffer = null;
      return;   // do NOT proceed with UBO setup
    }
    this._colorMapBlockIndex = blockIndex;


    // const blockSize = gl.getActiveUniformBlockParameter(
    //   this.shaderProgram as WebGLProgram,
    //   blockIndex,
    //   gl.UNIFORM_BLOCK_DATA_SIZE
    // ) as number

    const uboVariableNames = ['r_palette', 'g_palette', 'b_palette'] as const

    const uboVariableIndices = gl.getUniformIndices(
      this.shaderProgram as WebGLProgram,
      uboVariableNames as unknown as string[]
    ) as number[]

    const uboVariableOffsets = gl.getActiveUniforms(
      this.shaderProgram as WebGLProgram,
      uboVariableIndices,
      gl.UNIFORM_OFFSET
    ) as number[]

    // Create buffer only once
    if (!this._UBO_colorMapBuffer) {
      this._UBO_colorMapBuffer = gl.createBuffer()
      gl.bindBuffer(gl.UNIFORM_BUFFER, this._UBO_colorMapBuffer)

      // std140 layout: 256 floats each padded to 16 bytes => 4096 bytes per palette, total 12288
      const BYTES = 12288; // 3 * 4096
      gl.bufferData(gl.UNIFORM_BUFFER, BYTES, gl.STATIC_DRAW)
      gl.bindBuffer(gl.UNIFORM_BUFFER, null)

      gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, this._UBO_colorMapBuffer)
    }

    // Store offsets
    uboVariableNames.forEach((name, index) => {
      this._UBO_colorMapVariableInfo[name] = {
        index: uboVariableIndices[index],
        offset: uboVariableOffsets[index]
      }
    })
  }

  private changeFSShader(fragmentShaderStr: string): void {
    // const gl = global.gl as GL
    const gl = this._webgl as GL
    this._fragmentShader = gl.createShader(gl.FRAGMENT_SHADER) as WebGLShader
    gl.shaderSource(this._fragmentShader, fragmentShaderStr)
    gl.compileShader(this._fragmentShader)
    if (!gl.getShaderParameter(this._fragmentShader, gl.COMPILE_STATUS)) {
      alert(gl.getShaderInfoLog(this._fragmentShader) || 'Fragment shader compile error')
      return
    }
    gl.attachShader(this.shaderProgram as WebGLProgram, this._fragmentShader)
    gl.linkProgram(this.shaderProgram as WebGLProgram)
    if (!gl.getProgramParameter(this.shaderProgram as WebGLProgram, gl.LINK_STATUS)) {
      alert('Could not initialise shaders')
    }
    gl.useProgram(this.shaderProgram as WebGLProgram)
  }

  enableShaders(
    pMatrix: Float32Array,
    vMatrix: Float32Array,
    mMatrix: Float32Array,
    colorMapIdx: number
  ): void {
    // const gl = global.gl as GL
    const gl = this._webgl as GL
    gl.useProgram(this.shaderProgram as WebGLProgram)

    this.locations.pMatrix = gl.getUniformLocation(
      this.shaderProgram as WebGLProgram,
      this.gl_uniforms.m_perspective
    )
    this.locations.mMatrix = gl.getUniformLocation(
      this.shaderProgram as WebGLProgram,
      this.gl_uniforms.m_model
    )
    this.locations.vMatrix = gl.getUniformLocation(
      this.shaderProgram as WebGLProgram,
      this.gl_uniforms.m_view
    )
    this.locations.sampler = gl.getUniformLocation(
      this.shaderProgram as WebGLProgram,
      this.gl_uniforms.sampler
    )
    this.locations.textureAlpha = gl.getUniformLocation(
      this.shaderProgram as WebGLProgram,
      this.gl_uniforms.factor
    )
    this.locations.clorMapIdx = gl.getUniformLocation(
      this.shaderProgram as WebGLProgram,
      this.gl_uniforms.colormapIdx
    )


    // NEW
    // if (this.locations.clorMapIdx) {
    gl.uniform1i(this.locations.clorMapIdx, colorMapIdx);
    // }

    // Make sampler explicit: we always use TEXTURE0 in your draw code
    if (this.locations.sampler) {
      gl.uniform1i(this.locations.sampler, 0);
    }
    // END NEW

    this.locations.vertexPositionAttribute = gl.getAttribLocation(
      this.shaderProgram as WebGLProgram,
      this.gl_attributes.vertex_pos
    )
    this.locations.textureCoordAttribute = gl.getAttribLocation(
      this.shaderProgram as WebGLProgram,
      this.gl_attributes.text_coords
    )

    if (colorMapIdx >= 2 && this._UBO_colorMapBuffer && this._colorMapBlockIndex !== null) {
      gl.uniformBlockBinding(
        this.shaderProgram as WebGLProgram,
        this._colorMapBlockIndex,
        0
      );
      gl.bindBuffer(gl.UNIFORM_BUFFER, this._UBO_colorMapBuffer);

      let currentColorMap:
        | { r: Float32Array; g: Float32Array; b: Float32Array }
        | undefined;


      if (colorMapIdx === 2) {
        currentColorMap = {
          r: ColorMaps.planck.r,
          g: ColorMaps.planck.g,
          b: ColorMaps.planck.b,
        };
      } else if (colorMapIdx === 3) {
        currentColorMap = {
          r: ColorMaps.cmb.r,
          g: ColorMaps.cmb.g,
          b: ColorMaps.cmb.b,
        };
      } else if (colorMapIdx === 4) {
        currentColorMap = {
          r: ColorMaps.rainbow.r,
          g: ColorMaps.rainbow.g,
          b: ColorMaps.rainbow.b,
        };
      } else if (colorMapIdx === 5) {
        currentColorMap = {
          r: ColorMaps.eosb.r,
          g: ColorMaps.eosb.g,
          b: ColorMaps.eosb.b,
        };
      } else if (colorMapIdx === 6) {
        currentColorMap = {
          r: ColorMaps.cubehelix.r,
          g: ColorMaps.cubehelix.g,
          b: ColorMaps.cubehelix.b,
        };
      } else if (colorMapIdx === 7) {
        currentColorMap = {
          r: ColorMaps.hot.r,
          g: ColorMaps.hot.g,
          b: ColorMaps.hot.b,
        };
      } else if (colorMapIdx === 8) {
        currentColorMap = {
          r: ColorMaps.gray.r,
          g: ColorMaps.gray.g,
          b: ColorMaps.gray.b,
        };
      }

      if (!currentColorMap) {
        currentColorMap = this._runtimeColorMap
      }

      if (currentColorMap) {
        const info = this._UBO_colorMapVariableInfo;

        gl.bufferSubData(gl.UNIFORM_BUFFER, info.r_palette.offset, currentColorMap.r, 0);
        gl.bufferSubData(gl.UNIFORM_BUFFER, info.g_palette.offset, currentColorMap.g, 0);
        gl.bufferSubData(gl.UNIFORM_BUFFER, info.b_palette.offset, currentColorMap.b, 0);
      }

      gl.bindBuffer(gl.UNIFORM_BUFFER, null);
    }

    gl.uniformMatrix4fv(this.locations.mMatrix, false, mMatrix)
    gl.uniformMatrix4fv(this.locations.pMatrix, false, pMatrix)
    gl.uniformMatrix4fv(this.locations.vMatrix, false, vMatrix)
  }
}
