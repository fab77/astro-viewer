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
import ShaderManager from "./ShaderManager.js";
import { ColorMaps } from "../model/ColorMaps.js";

type GL = WebGL2RenderingContext;

type UniformNames = {
  sampler: string;
  factor: string;
  m_perspective: string;
  m_model: string;
  m_view: string;
  colormapIdx: string;
  colormap_red: string;
  colormap_green: string;
  colormap_blue: string;

  textureMode: string;
  dataMin: string;
  dataMax: string;
};

type AttributeNames = {
  vertex_pos: string;
  text_coords: string;
};

type Locations = {
  pMatrix: WebGLUniformLocation | null;
  mMatrix: WebGLUniformLocation | null;
  vMatrix: WebGLUniformLocation | null;

  samplers: Array<WebGLUniformLocation | null>;
  textureAlpha: Array<WebGLUniformLocation | null>;
  textureMode: Array<WebGLUniformLocation | null>;
  dataMin: Array<WebGLUniformLocation | null>;
  dataMax: Array<WebGLUniformLocation | null>;

  layerOpacity: WebGLUniformLocation | null;

  clorMapIdx: WebGLUniformLocation | null;

  vertexPositionAttribute: number;
  textureCoordAttribute: number;
};

// export default class HiPSShaderProgram {
export class HiPSShaderProgram {
  private _colorMapBlockIndex: number | null = null;
  private _runtimeColorMap:
    | { r: Float32Array; g: Float32Array; b: Float32Array }
    | undefined;

  private _shaderProgram: WebGLProgram | undefined;
  private _vertexShader!: WebGLShader;
  private _fragmentShader!: WebGLShader;

  private _UBO_colorMapBuffer: WebGLBuffer | null = null;
  private _UBO_colorMapVariableInfo: Record<
    "r_palette" | "g_palette" | "b_palette",
    { index: number; offset: number }
  > = {
    r_palette: { index: 0, offset: 0 },
    g_palette: { index: 0, offset: 0 },
    b_palette: { index: 0, offset: 0 },
  };

  readonly gl_uniforms: UniformNames;
  readonly gl_attributes: AttributeNames;
  readonly locations: Locations;
  private _webgl: WebGL2RenderingContext;

  constructor(webgl: WebGL2RenderingContext) {
    this._webgl = webgl;
    this.gl_uniforms = {
      sampler: "uSampler0",
      factor: "uFactor0",
      m_perspective: "uPMatrix",
      m_model: "uMMatrix",
      m_view: "uVMatrix",
      colormapIdx: "cmapIdx",
      colormap_red: "r",
      colormap_green: "g",
      colormap_blue: "b",

      textureMode: "uTextureMode",
      dataMin: "uDataMin",
      dataMax: "uDataMax",
    };

    this.gl_attributes = {
      vertex_pos: "aVertexPosition",
      text_coords: "aTextureCoord",
    };

    this.locations = {
      pMatrix: null,
      mMatrix: null,
      vMatrix: null,

      samplers: new Array(8).fill(null),
      textureAlpha: new Array(8).fill(null),
      textureMode: new Array(8).fill(null),
      dataMin: new Array(8).fill(null),
      dataMax: new Array(8).fill(null),

      layerOpacity: null,

      clorMapIdx: null,

      vertexPositionAttribute: -1,
      textureCoordAttribute: -1,
    };
  }

  get shaderProgram(): WebGLProgram {
    const gl = this._webgl;

    if (!this._shaderProgram) {
      const program = gl.createProgram();
      this._shaderProgram = program;
      this.initShaders(program);
    }

    gl.useProgram(this._shaderProgram);
    return this._shaderProgram;
  }

  setLayerOpacity(opacity: number): void {
    const gl = this._webgl;

    this.locations.layerOpacity = gl.getUniformLocation(
      this.shaderProgram,
      "uLayerOpacity",
    );

    if (this.locations.layerOpacity !== null) {
      gl.uniform1f(this.locations.layerOpacity, opacity);
    }
  }

  setRuntimeColorMap(
    colorMap: { r: Float32Array; g: Float32Array; b: Float32Array } | undefined,
  ): void {
    this._runtimeColorMap = colorMap;
  }

  private initShaders(program: WebGLProgram): void {
    // const gl = global.gl
    const gl = this._webgl;

    const fragmentShaderStr = ShaderManager.hipsNativeFS();
    this._fragmentShader = gl.createShader(gl.FRAGMENT_SHADER) as WebGLShader;
    gl.shaderSource(this._fragmentShader, fragmentShaderStr);
    gl.compileShader(this._fragmentShader);
    if (!gl.getShaderParameter(this._fragmentShader, gl.COMPILE_STATUS)) {
      alert(
        gl.getShaderInfoLog(this._fragmentShader) ||
          "Fragment shader compile error",
      );
      return;
    }

    const vertexShaderStr = ShaderManager.hipsVS();
    this._vertexShader = gl.createShader(gl.VERTEX_SHADER) as WebGLShader;
    gl.shaderSource(this._vertexShader, vertexShaderStr);
    gl.compileShader(this._vertexShader);
    if (!gl.getShaderParameter(this._vertexShader, gl.COMPILE_STATUS)) {
      alert(
        gl.getShaderInfoLog(this._vertexShader) ||
          "Vertex shader compile error",
      );
      return;
    }

    gl.attachShader(program, this._vertexShader);
    gl.attachShader(program, this._fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      alert("Could not initialise shaders");
    }
  }

  enableProgram(): void {
    // (global.gl).useProgram(this._shaderProgram)
    this._webgl.useProgram(this.shaderProgram);
  }

  setGrayscaleShader(): void {
    // const gl = global.gl
    const gl = this._webgl;
    gl.detachShader(this.shaderProgram, this._fragmentShader);
    const fragmentShaderStr = ShaderManager.hipsGrayscaleFS();
    this.changeFSShader(fragmentShaderStr);
  }

  setNativeShader(): void {
    // const gl = global.gl
    const gl = this._webgl;
    gl.detachShader(this.shaderProgram, this._fragmentShader);
    const fragmentShaderStr = ShaderManager.hipsNativeFS();
    this.changeFSShader(fragmentShaderStr);
  }

  setColorMapShader(): void {
    // const gl = global.gl
    const gl = this._webgl;

    // Swap fragment shader
    gl.detachShader(this.shaderProgram, this._fragmentShader);
    const fragmentShaderStr = ShaderManager.hipsColorMapFS();
    this.changeFSShader(fragmentShaderStr);

    // UBO discovery for the "colormap" block
    const blockIndex = gl.getUniformBlockIndex(this.shaderProgram, "colormap");

    // INVALID_INDEX == 0xFFFFFFFF in WebGL2
    if (blockIndex === gl.INVALID_INDEX) {
      console.warn(
        'HiPSShaderProgram: uniform block "colormap" not found in hipsColorMapFS()',
      );
      this._colorMapBlockIndex = null;
      this._UBO_colorMapBuffer = null;
      return; // do NOT proceed with UBO setup
    }
    this._colorMapBlockIndex = blockIndex;

    // const blockSize = gl.getActiveUniformBlockParameter(
    //   this.shaderProgram,
    //   blockIndex,
    //   gl.UNIFORM_BLOCK_DATA_SIZE
    // ) as number

    const uboVariableNames = ["r_palette", "g_palette", "b_palette"] as const;

    const uboVariableIndices = gl.getUniformIndices(
      this.shaderProgram,
      uboVariableNames as unknown as string[],
    ) as number[];

    const uboVariableOffsets = gl.getActiveUniforms(
      this.shaderProgram,
      uboVariableIndices,
      gl.UNIFORM_OFFSET,
    ) as number[];

    // Create buffer only once
    if (!this._UBO_colorMapBuffer) {
      this._UBO_colorMapBuffer = gl.createBuffer();
      gl.bindBuffer(gl.UNIFORM_BUFFER, this._UBO_colorMapBuffer);

      // std140 layout: 256 floats each padded to 16 bytes => 4096 bytes per palette, total 12288
      const BYTES = 12288; // 3 * 4096
      gl.bufferData(gl.UNIFORM_BUFFER, BYTES, gl.STATIC_DRAW);
      gl.bindBuffer(gl.UNIFORM_BUFFER, null);

      gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, this._UBO_colorMapBuffer);
    }

    // Store offsets
    uboVariableNames.forEach((name, index) => {
      this._UBO_colorMapVariableInfo[name] = {
        index: uboVariableIndices[index],
        offset: uboVariableOffsets[index],
      };
    });
  }

  private changeFSShader(fragmentShaderStr: string): void {
    // const gl = global.gl
    const gl = this._webgl;
    this._fragmentShader = gl.createShader(gl.FRAGMENT_SHADER) as WebGLShader;
    gl.shaderSource(this._fragmentShader, fragmentShaderStr);
    gl.compileShader(this._fragmentShader);
    if (!gl.getShaderParameter(this._fragmentShader, gl.COMPILE_STATUS)) {
      alert(
        gl.getShaderInfoLog(this._fragmentShader) ||
          "Fragment shader compile error",
      );
      return;
    }
    gl.attachShader(this.shaderProgram, this._fragmentShader);
    gl.linkProgram(this.shaderProgram);
    if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
      alert("Could not initialise shaders");
    }
    gl.useProgram(this.shaderProgram);
  }

  setTextureDataMode(
    samplerIndex: number,
    fits: boolean,
    min?: number,
    max?: number,
  ): void {
    if (samplerIndex < 0 || samplerIndex >= 8) {
      throw new Error(`Invalid HiPS sampler index: ${samplerIndex}`);
    }

    const gl = this._webgl;

    const modeLocation = this.locations.textureMode[samplerIndex];

    if (modeLocation) {
      gl.uniform1i(modeLocation, fits ? 1 : 0);
    }

    if (!fits) {
      return;
    }

    if (
      min === undefined ||
      max === undefined ||
      !Number.isFinite(min) ||
      !Number.isFinite(max) ||
      max <= min
    ) {
      throw new Error("Invalid FITS display range.");
    }

    const minLocation = this.locations.dataMin[samplerIndex];
    const maxLocation = this.locations.dataMax[samplerIndex];

    if (minLocation) {
      gl.uniform1f(minLocation, min);
    }

    if (maxLocation) {
      gl.uniform1f(maxLocation, max);
    }
  }

  enableShaders(
    pMatrix: Float32Array,
    vMatrix: Float32Array,
    mMatrix: Float32Array,
    colorMapIdx: number,
  ): void {
    // const gl = global.gl
    const gl = this._webgl;
    gl.useProgram(this.shaderProgram);

    this.locations.pMatrix = gl.getUniformLocation(
      this.shaderProgram,
      this.gl_uniforms.m_perspective,
    );
    this.locations.mMatrix = gl.getUniformLocation(
      this.shaderProgram,
      this.gl_uniforms.m_model,
    );
    this.locations.vMatrix = gl.getUniformLocation(
      this.shaderProgram,
      this.gl_uniforms.m_view,
    );

    this.locations.clorMapIdx = gl.getUniformLocation(
      this.shaderProgram,
      this.gl_uniforms.colormapIdx,
    );

    for (let i = 0; i < 8; i++) {
      this.locations.samplers[i] = gl.getUniformLocation(
        this.shaderProgram,
        `uSampler${i}`,
      );

      this.locations.textureAlpha[i] = gl.getUniformLocation(
        this.shaderProgram,
        `uFactor${i}`,
      );

      this.locations.textureMode[i] = gl.getUniformLocation(
        this.shaderProgram,
        `uTextureMode${i}`,
      );

      this.locations.dataMin[i] = gl.getUniformLocation(
        this.shaderProgram,
        `uDataMin${i}`,
      );

      this.locations.dataMax[i] = gl.getUniformLocation(
        this.shaderProgram,
        `uDataMax${i}`,
      );

      if (this.locations.samplers[i]) {
        gl.uniform1i(this.locations.samplers[i], i);
      }
    }

    gl.uniform1i(this.locations.clorMapIdx, colorMapIdx);

    this.locations.vertexPositionAttribute = gl.getAttribLocation(
      this.shaderProgram,
      this.gl_attributes.vertex_pos,
    );
    this.locations.textureCoordAttribute = gl.getAttribLocation(
      this.shaderProgram,
      this.gl_attributes.text_coords,
    );

    if (
      colorMapIdx >= 2 &&
      this._UBO_colorMapBuffer &&
      this._colorMapBlockIndex !== null
    ) {
      gl.uniformBlockBinding(this.shaderProgram, this._colorMapBlockIndex, 0);
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
        currentColorMap = this._runtimeColorMap;
      }

      if (currentColorMap) {
        const info = this._UBO_colorMapVariableInfo;

        gl.bufferSubData(
          gl.UNIFORM_BUFFER,
          info.r_palette.offset,
          currentColorMap.r,
          0,
        );
        gl.bufferSubData(
          gl.UNIFORM_BUFFER,
          info.g_palette.offset,
          currentColorMap.g,
          0,
        );
        gl.bufferSubData(
          gl.UNIFORM_BUFFER,
          info.b_palette.offset,
          currentColorMap.b,
          0,
        );
      }

      gl.bindBuffer(gl.UNIFORM_BUFFER, null);
    }

    gl.uniformMatrix4fv(this.locations.mMatrix, false, mMatrix);
    gl.uniformMatrix4fv(this.locations.pMatrix, false, pMatrix);
    gl.uniformMatrix4fv(this.locations.vMatrix, false, vMatrix);
  }
}
