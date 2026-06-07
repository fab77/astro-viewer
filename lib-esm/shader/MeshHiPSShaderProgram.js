/*
 * AstroViewer
 * Copyright (C) Fabrizio Giordano
 * SPDX-License-Identifier: LicenseRef-AstroViewer-Dual-License
 */
export class MeshHiPSShaderProgram {
    _webgl;
    locations;
    _shaderProgram;
    constructor(_webgl) {
        this._webgl = _webgl;
        this.locations = {
            pMatrix: null,
            mMatrix: null,
            vMatrix: null,
            color: null,
            vertexPositionAttribute: -1,
        };
    }
    get shaderProgram() {
        const gl = this._webgl;
        if (!this._shaderProgram) {
            const program = gl.createProgram();
            if (!program)
                throw new Error('Could not create MeshHiPS shader program');
            this._shaderProgram = program;
            this.initShaders();
        }
        gl.useProgram(this._shaderProgram);
        return this._shaderProgram;
    }
    enableProgram() {
        this._webgl.useProgram(this.shaderProgram);
    }
    enableShaders(pMatrix, vMatrix, mMatrix, color) {
        const gl = this._webgl;
        const program = this.shaderProgram;
        gl.useProgram(program);
        this.locations.pMatrix = gl.getUniformLocation(program, 'uPMatrix');
        this.locations.vMatrix = gl.getUniformLocation(program, 'uVMatrix');
        this.locations.mMatrix = gl.getUniformLocation(program, 'uMMatrix');
        this.locations.color = gl.getUniformLocation(program, 'uColor');
        this.locations.vertexPositionAttribute = gl.getAttribLocation(program, 'aVertexPosition');
        gl.uniformMatrix4fv(this.locations.pMatrix, false, pMatrix);
        gl.uniformMatrix4fv(this.locations.vMatrix, false, vMatrix);
        gl.uniformMatrix4fv(this.locations.mMatrix, false, mMatrix);
        gl.uniform4fv(this.locations.color, color);
    }
    initShaders() {
        const gl = this._webgl;
        const vertexShader = this.compileShader(gl.VERTEX_SHADER, `#version 300 es
      in vec3 aVertexPosition;
      uniform mat4 uPMatrix;
      uniform mat4 uVMatrix;
      uniform mat4 uMMatrix;
      void main(void) {
        gl_Position = uPMatrix * uVMatrix * uMMatrix * vec4(aVertexPosition, 1.0);
      }`);
        const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, `#version 300 es
      precision mediump float;
      uniform vec4 uColor;
      out vec4 outColor;
      void main(void) {
        outColor = uColor;
      }`);
        gl.attachShader(this._shaderProgram, vertexShader);
        gl.attachShader(this._shaderProgram, fragmentShader);
        gl.linkProgram(this._shaderProgram);
        if (!gl.getProgramParameter(this._shaderProgram, gl.LINK_STATUS)) {
            throw new Error(gl.getProgramInfoLog(this._shaderProgram) || 'Could not initialise MeshHiPS shaders');
        }
    }
    compileShader(type, source) {
        const gl = this._webgl;
        const shader = gl.createShader(type);
        if (!shader)
            throw new Error('Could not create MeshHiPS shader');
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error(gl.getShaderInfoLog(shader) || 'MeshHiPS shader compile error');
        }
        return shader;
    }
}
