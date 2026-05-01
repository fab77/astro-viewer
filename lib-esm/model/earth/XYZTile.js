export class XYZTile {
    _coord;
    _url;
    _webgl;
    _shaderProgram;
    _positionBuffer;
    _uvBuffer;
    _indexBuffer;
    _texture = null;
    _indices;
    _indexType;
    _ready = false;
    _aborted = false;
    _image;
    constructor(coord, url, mesh, webgl, shaderProgram) {
        this._coord = coord;
        this._url = url;
        this._webgl = webgl;
        this._shaderProgram = shaderProgram;
        this._positionBuffer = webgl.createBuffer();
        this._uvBuffer = webgl.createBuffer();
        this._indexBuffer = webgl.createBuffer();
        this._indices = mesh.indices;
        this._indexType = mesh.indices instanceof Uint32Array ? webgl.UNSIGNED_INT : webgl.UNSIGNED_SHORT;
        webgl.bindBuffer(webgl.ARRAY_BUFFER, this._positionBuffer);
        webgl.bufferData(webgl.ARRAY_BUFFER, mesh.positions, webgl.STATIC_DRAW);
        webgl.bindBuffer(webgl.ARRAY_BUFFER, this._uvBuffer);
        webgl.bufferData(webgl.ARRAY_BUFFER, mesh.uvs, webgl.STATIC_DRAW);
        webgl.bindBuffer(webgl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
        webgl.bufferData(webgl.ELEMENT_ARRAY_BUFFER, mesh.indices, webgl.STATIC_DRAW);
        this.loadTexture();
    }
    get ready() {
        return this._ready;
    }
    get coord() {
        return this._coord;
    }
    loadTexture() {
        const image = new Image();
        this._image = image;
        image.crossOrigin = 'anonymous';
        image.onload = () => this.onImageLoaded();
        image.onerror = () => {
            this._aborted = true;
            this._ready = false;
            console.warn(`[XYZTile] Failed loading ${this._url}`);
        };
        image.src = this._url;
    }
    onImageLoaded() {
        if (!this._image || this._aborted) {
            return;
        }
        const gl = this._webgl;
        const texture = gl.createTexture();
        if (!texture) {
            throw new Error('Could not create XYZ texture');
        }
        this._texture = texture;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        this._ready = true;
    }
    draw(pMatrix, vMatrix, mMatrix) {
        if (!this._ready || !this._texture) {
            return;
        }
        const gl = this._webgl;
        this._shaderProgram.enableShaders(pMatrix, vMatrix, mMatrix);
        gl.bindBuffer(gl.ARRAY_BUFFER, this._positionBuffer);
        gl.vertexAttribPointer(this._shaderProgram.locations.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this._shaderProgram.locations.vertexPositionAttribute);
        gl.bindBuffer(gl.ARRAY_BUFFER, this._uvBuffer);
        gl.vertexAttribPointer(this._shaderProgram.locations.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this._shaderProgram.locations.textureCoordAttribute);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this._texture);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
        gl.drawElements(gl.TRIANGLES, this._indices.length, this._indexType, 0);
        gl.disableVertexAttribArray(this._shaderProgram.locations.vertexPositionAttribute);
        gl.disableVertexAttribArray(this._shaderProgram.locations.textureCoordAttribute);
    }
}
