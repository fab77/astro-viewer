import ShaderManager from './ShaderManager.js';
import { colorMap } from '../model/hips/ColorMap.js';
// export default class HiPSShaderProgram {
export class HiPSShaderProgram {
    _shaderProgram;
    _vertexShader;
    _fragmentShader;
    _UBO_colorMapBuffer = null;
    _UBO_colorMapVariableInfo = {
        r_palette: { index: 0, offset: 0 },
        g_palette: { index: 0, offset: 0 },
        b_palette: { index: 0, offset: 0 }
    };
    gl_uniforms;
    gl_attributes;
    locations;
    _webgl;
    constructor(webgl) {
        this._webgl = webgl;
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
        };
        this.gl_attributes = {
            vertex_pos: 'aVertexPosition',
            text_coords: 'aTextureCoord'
        };
        this.locations = {
            pMatrix: null,
            mMatrix: null,
            vMatrix: null,
            sampler: null,
            textureAlpha: null,
            clorMapIdx: null,
            vertexPositionAttribute: -1,
            textureCoordAttribute: -1
        };
    }
    get shaderProgram() {
        const gl = this._webgl;
        if (!this._shaderProgram) {
            // const gl = global.gl as GL
            this._shaderProgram = gl.createProgram();
            this.initShaders();
        }
        ;
        gl.useProgram(this._shaderProgram);
        return this._shaderProgram;
    }
    initShaders() {
        // const gl = global.gl as GL
        const gl = this._webgl;
        const fragmentShaderStr = ShaderManager.hipsNativeFS();
        this._fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(this._fragmentShader, fragmentShaderStr);
        gl.compileShader(this._fragmentShader);
        if (!gl.getShaderParameter(this._fragmentShader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(this._fragmentShader) || 'Fragment shader compile error');
            return;
        }
        const vertexShaderStr = ShaderManager.hipsVS();
        this._vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(this._vertexShader, vertexShaderStr);
        gl.compileShader(this._vertexShader);
        if (!gl.getShaderParameter(this._vertexShader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(this._vertexShader) || 'Vertex shader compile error');
            return;
        }
        gl.attachShader(this._shaderProgram, this._vertexShader);
        gl.attachShader(this._shaderProgram, this._fragmentShader);
        gl.linkProgram(this._shaderProgram);
        if (!gl.getProgramParameter(this._shaderProgram, gl.LINK_STATUS)) {
            alert('Could not initialise shaders');
        }
    }
    enableProgram() {
        // (global.gl as GL).useProgram(this._shaderProgram as WebGLProgram)
        this._webgl.useProgram(this.shaderProgram);
    }
    setGrayscaleShader() {
        // const gl = global.gl as GL
        const gl = this._webgl;
        gl.detachShader(this.shaderProgram, this._fragmentShader);
        const fragmentShaderStr = ShaderManager.hipsGrayscaleFS();
        this.changeFSShader(fragmentShaderStr);
    }
    setNativeShader() {
        // const gl = global.gl as GL
        const gl = this._webgl;
        gl.detachShader(this.shaderProgram, this._fragmentShader);
        const fragmentShaderStr = ShaderManager.hipsNativeFS();
        this.changeFSShader(fragmentShaderStr);
    }
    setColorMapShader() {
        // const gl = global.gl as GL
        const gl = this._webgl;
        gl.detachShader(this.shaderProgram, this._fragmentShader);
        const fragmentShaderStr = ShaderManager.hipsColorMapFS();
        this.changeFSShader(fragmentShaderStr);
        // UBO discovery
        const blockIndex = gl.getUniformBlockIndex(this.shaderProgram, 'colormap');
        const blockSize = gl.getActiveUniformBlockParameter(this.shaderProgram, blockIndex, gl.UNIFORM_BLOCK_DATA_SIZE);
        const uboVariableNames = ['r_palette', 'g_palette', 'b_palette'];
        const uboVariableIndices = gl.getUniformIndices(this.shaderProgram, uboVariableNames);
        const uboVariableOffsets = gl.getActiveUniforms(this.shaderProgram, uboVariableIndices, gl.UNIFORM_OFFSET);
        this._UBO_colorMapBuffer = gl.createBuffer();
        gl.bindBuffer(gl.UNIFORM_BUFFER, this._UBO_colorMapBuffer);
        // std140 layout: 256 floats each padded to 16 bytes => 4096 bytes per palette, total 12288
        const BYTES = 12288;
        gl.bufferData(gl.UNIFORM_BUFFER, BYTES, gl.STATIC_DRAW);
        gl.bindBuffer(gl.UNIFORM_BUFFER, null);
        gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, this._UBO_colorMapBuffer);
        uboVariableNames.forEach((name, index) => {
            this._UBO_colorMapVariableInfo[name] = {
                index: uboVariableIndices[index],
                offset: uboVariableOffsets[index]
            };
        });
    }
    changeFSShader(fragmentShaderStr) {
        // const gl = global.gl as GL
        const gl = this._webgl;
        this._fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(this._fragmentShader, fragmentShaderStr);
        gl.compileShader(this._fragmentShader);
        if (!gl.getShaderParameter(this._fragmentShader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(this._fragmentShader) || 'Fragment shader compile error');
            return;
        }
        gl.attachShader(this.shaderProgram, this._fragmentShader);
        gl.linkProgram(this.shaderProgram);
        if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
            alert('Could not initialise shaders');
        }
        gl.useProgram(this.shaderProgram);
    }
    enableShaders(pMatrix, vMatrix, mMatrix, colorMapIdx) {
        // const gl = global.gl as GL
        const gl = this._webgl;
        gl.useProgram(this.shaderProgram);
        this.locations.pMatrix = gl.getUniformLocation(this.shaderProgram, this.gl_uniforms.m_perspective);
        this.locations.mMatrix = gl.getUniformLocation(this.shaderProgram, this.gl_uniforms.m_model);
        this.locations.vMatrix = gl.getUniformLocation(this.shaderProgram, this.gl_uniforms.m_view);
        this.locations.sampler = gl.getUniformLocation(this.shaderProgram, this.gl_uniforms.sampler);
        this.locations.textureAlpha = gl.getUniformLocation(this.shaderProgram, this.gl_uniforms.factor);
        this.locations.clorMapIdx = gl.getUniformLocation(this.shaderProgram, this.gl_uniforms.colormapIdx);
        this.locations.vertexPositionAttribute = gl.getAttribLocation(this.shaderProgram, this.gl_attributes.vertex_pos);
        this.locations.textureCoordAttribute = gl.getAttribLocation(this.shaderProgram, this.gl_attributes.text_coords);
        if (colorMapIdx >= 2) {
            const index = gl.getUniformBlockIndex(this.shaderProgram, 'colormap');
            gl.uniformBlockBinding(this.shaderProgram, index, 0);
            gl.bindBuffer(gl.UNIFORM_BUFFER, this._UBO_colorMapBuffer);
            let currentColorMap;
            if (colorMapIdx === 2)
                currentColorMap = colorMap.PLANCK;
            else if (colorMapIdx === 3)
                currentColorMap = colorMap.CMB;
            else if (colorMapIdx === 4)
                currentColorMap = colorMap.RAINBOW;
            else if (colorMapIdx === 5)
                currentColorMap = colorMap.EOSB;
            else if (colorMapIdx === 6)
                currentColorMap = colorMap.CUBEHELIX;
            if (currentColorMap) {
                // Offsets match std140 padded arrays (0, 4096, 8192)
                gl.bufferSubData(gl.UNIFORM_BUFFER, 0, currentColorMap.r, 0);
                gl.bufferSubData(gl.UNIFORM_BUFFER, 4096, currentColorMap.g, 0);
                gl.bufferSubData(gl.UNIFORM_BUFFER, 8192, currentColorMap.b, 0);
            }
            gl.bindBuffer(gl.UNIFORM_BUFFER, null);
        }
        gl.uniformMatrix4fv(this.locations.mMatrix, false, mMatrix);
        gl.uniformMatrix4fv(this.locations.pMatrix, false, pMatrix);
        gl.uniformMatrix4fv(this.locations.vMatrix, false, vMatrix);
    }
}
// export const hipsShaderProgram = new HiPSShaderProgram()
//# sourceMappingURL=HiPSShaderProgram.js.map