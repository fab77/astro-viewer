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
import { mat4 } from 'gl-matrix';
import ShaderManager from './ShaderManager.js';
export class FootprintShaderProgram {
    // export default class FootprintShaderProgram {
    _shaderProgram;
    _vertexShader;
    _fragmentShader;
    gl_uniforms;
    gl_attributes;
    locations;
    _webgl;
    constructor(webgl) {
        this._webgl = webgl;
        this.gl_uniforms = {
            vertex_color: 'u_fragcolor',
            m_perspective: 'uPMatrix',
            m_model_view: 'uMVMatrix',
            point_size: 'u_pointsize'
        };
        this.gl_attributes = {
            vertex_pos: 'aCatPosition'
        };
        this.locations = {
            pMatrix: null,
            mvMatrix: null,
            color: null,
            position: -1,
            pointSize: -1
        };
    }
    get shaderProgram() {
        if (!this._shaderProgram) {
            const gl = this._webgl;
            // const gl = global.gl as GL
            this._shaderProgram = gl.createProgram();
            this.initShaders();
        }
        return this._shaderProgram;
    }
    initShaders() {
        const gl = this._webgl;
        // const gl = global.gl as GL
        const fragmentShaderStr = ShaderManager.footprintFS();
        this._fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(this._fragmentShader, fragmentShaderStr);
        gl.compileShader(this._fragmentShader);
        console.log('FS log:', gl.getShaderInfoLog(this._fragmentShader) || 'ok');
        if (!gl.getShaderParameter(this._fragmentShader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(this._fragmentShader) || 'Fragment shader compile error');
            return;
        }
        const vertexShaderStr = ShaderManager.footprintVS();
        this._vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(this._vertexShader, vertexShaderStr);
        gl.compileShader(this._vertexShader);
        console.log('VS log:', gl.getShaderInfoLog(this._vertexShader) || 'ok');
        if (!gl.getShaderParameter(this._vertexShader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(this._vertexShader) || 'Vertex shader compile error');
            return;
        }
        gl.attachShader(this.shaderProgram, this._vertexShader);
        gl.attachShader(this.shaderProgram, this._fragmentShader);
        gl.linkProgram(this.shaderProgram);
        if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
            alert('Could not initialise shaders');
        }
        gl.useProgram(this.shaderProgram);
        this.locations.position = gl.getAttribLocation(this.shaderProgram, this.gl_attributes.vertex_pos);
        this.locations.pointSize = gl.getUniformLocation(this.shaderProgram, this.gl_uniforms.point_size);
        this.locations.color = gl.getUniformLocation(this.shaderProgram, this.gl_uniforms.vertex_color);
    }
    enableShaders(pMatrix, modelMatrix, viewMatrix) {
        const gl = this._webgl;
        // const gl = global.gl as GL
        gl.useProgram(this.shaderProgram);
        this.locations.pMatrix = gl.getUniformLocation(this.shaderProgram, this.gl_uniforms.m_perspective);
        this.locations.mvMatrix = gl.getUniformLocation(this.shaderProgram, this.gl_uniforms.m_model_view);
        let mvMatrix = mat4.create();
        mvMatrix = mat4.multiply(mvMatrix, viewMatrix, modelMatrix);
        gl.uniformMatrix4fv(this.locations.pMatrix, false, pMatrix);
        gl.uniformMatrix4fv(this.locations.mvMatrix, false, mvMatrix);
    }
}
// export const footprintShaderProgram = new FootprintShaderProgram()
