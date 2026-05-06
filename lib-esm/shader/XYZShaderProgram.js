export class XYZShaderProgram {
    locations;
    _webgl;
    _shaderProgram;
    constructor(webgl) {
        this._webgl = webgl;
        this.locations = {
            pMatrix: null,
            mMatrix: null,
            vMatrix: null,
            sampler: null,
            vertexPositionAttribute: -1,
            textureCoordAttribute: -1,
        };
    }
    get shaderProgram() {
        const gl = this._webgl;
        if (!this._shaderProgram) {
            const program = gl.createProgram();
            if (!program) {
                throw new Error('Could not create XYZ shader program');
            }
            this._shaderProgram = program;
            this.initShaders();
        }
        gl.useProgram(this._shaderProgram);
        return this._shaderProgram;
    }
    enableProgram() {
        this._webgl.useProgram(this.shaderProgram);
    }
    enableShaders(pMatrix, vMatrix, mMatrix) {
        const gl = this._webgl;
        const program = this.shaderProgram;
        gl.useProgram(program);
        this.locations.pMatrix = gl.getUniformLocation(program, 'uPMatrix');
        this.locations.mMatrix = gl.getUniformLocation(program, 'uMMatrix');
        this.locations.vMatrix = gl.getUniformLocation(program, 'uVMatrix');
        this.locations.sampler = gl.getUniformLocation(program, 'uSampler');
        this.locations.vertexPositionAttribute = gl.getAttribLocation(program, 'aVertexPosition');
        this.locations.textureCoordAttribute = gl.getAttribLocation(program, 'aTextureCoord');
        gl.uniformMatrix4fv(this.locations.pMatrix, false, pMatrix);
        gl.uniformMatrix4fv(this.locations.vMatrix, false, vMatrix);
        gl.uniformMatrix4fv(this.locations.mMatrix, false, mMatrix);
        gl.uniform1i(this.locations.sampler, 0);
    }
    initShaders() {
        const gl = this._webgl;
        const vertexShader = this.compileShader(gl.VERTEX_SHADER, `#version 300 es
      in vec3 aVertexPosition;
      in vec2 aTextureCoord;
      uniform mat4 uPMatrix;
      uniform mat4 uVMatrix;
      uniform mat4 uMMatrix;
      out vec2 vTextureCoord;
      void main(void) {
        vTextureCoord = aTextureCoord;
        gl_Position = uPMatrix * uVMatrix * uMMatrix * vec4(aVertexPosition, 1.0);
      }`);
        const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, `#version 300 es
      precision mediump float;
      in vec2 vTextureCoord;
      uniform sampler2D uSampler;
      out vec4 outColor;
      void main(void) {
        outColor = texture(uSampler, vTextureCoord);
      }`);
        gl.attachShader(this._shaderProgram, vertexShader);
        gl.attachShader(this._shaderProgram, fragmentShader);
        gl.linkProgram(this._shaderProgram);
        if (!gl.getProgramParameter(this._shaderProgram, gl.LINK_STATUS)) {
            throw new Error(gl.getProgramInfoLog(this._shaderProgram) || 'Could not initialise XYZ shaders');
        }
    }
    compileShader(type, source) {
        const gl = this._webgl;
        const shader = gl.createShader(type);
        if (!shader) {
            throw new Error('Could not create XYZ shader');
        }
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error(gl.getShaderInfoLog(shader) || 'XYZ shader compile error');
        }
        return shader;
    }
}
