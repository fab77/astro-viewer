'use strict';
import global from '../../Global.js';
export default class AllSky {
    _ready = false;
    _hips;
    _format;
    _baseurl;
    _isGalacticHips;
    _order = 3;
    opacity = 1.0;
    _hipsShaderIndex = 0;
    _texture = null;
    _image;
    _texurl;
    _textureLoaded = false;
    _maxTiles = 0;
    _numFacesXTile = 0;
    _numFaces = 0;
    vertexPosition;
    vertexPositionBuffer;
    vertexIndexBuffer;
    vidx = 0;
    _webgl;
    _tileBuffer;
    _hipsShaderProgram;
    constructor(hips, webgl, tileBuffer, hipsShaderProgram) {
        this._tileBuffer = tileBuffer;
        this._hips = hips;
        this._webgl = webgl;
        this._format = hips.format;
        this._baseurl = hips.baseURL;
        this._isGalacticHips = hips.isGalacticHips;
        this._hipsShaderProgram = hipsShaderProgram;
        this.initImage();
    }
    initImage() {
        this._image = new Image();
        this._texurl = `${this._baseurl}/Norder3/Allsky.${this._format}`;
        this._image.onload = () => this.imageLoaded();
        this._image.onerror = () => {
            console.error('File not found? %s', this._texurl);
        };
        this._image.setAttribute('crossorigin', 'anonymous');
        this._image.src = this._texurl;
    }
    imageLoaded() {
        this.textureLoaded();
        this.initModelBuffer();
        this._textureLoaded = true;
        this._ready = true;
    }
    textureLoaded() {
        // hipsShaderProgram.enableProgram()
        this._hipsShaderProgram.enableProgram();
        const gl = this._webgl;
        this._texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + this._hipsShaderIndex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.bindTexture(gl.TEXTURE_2D, this._texture);
        // gl.uniform1i(hipsShaderProgram.shaderProgram.samplerUniform, this._hipsShaderIndex)
        if (!gl.isTexture(this._texture)) {
            console.log('error in texture');
        }
        gl.activeTexture(gl.TEXTURE0 + this._hipsShaderIndex);
        gl.bindTexture(gl.TEXTURE_2D, this._texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        const useMipmaps = true;
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, useMipmaps ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
        // MAG filter: ONLY NEAREST or LINEAR are valid
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR_MIPMAP_LINEAR)
        // gl.generateMipmap(gl.TEXTURE_2D)
        if (useMipmaps)
            gl.generateMipmap(gl.TEXTURE_2D);
    }
    initModelBuffer() {
        const gl = this._webgl;
        const orderjump = 1;
        const tgtHpxOrder = this._order + orderjump;
        const healpix = global.getHealpix(this._order);
        this._maxTiles = healpix.getNPix();
        const tgtHealpix = global.getHealpix(tgtHpxOrder);
        this._numFacesXTile = 4 ** orderjump; // used in gl.draw
        this._numFaces = this._numFacesXTile * this._maxTiles;
        this.vertexPosition = new Float32Array(20 * this._numFaces);
        let sindex = 0;
        let tindex = 0;
        this.vidx = 0;
        for (let t = 0; t < this._maxTiles; t++) {
            const xyf = healpix.nest2xyf(t);
            const dxmin = xyf.ix << orderjump;
            const dxmax = (xyf.ix << orderjump) + (1 << orderjump);
            const dymin = xyf.iy << orderjump;
            const dymax = (xyf.iy << orderjump) + (1 << orderjump);
            this.setupPositionAndTexture4Quadrant(sindex, tindex, dxmin, dxmin + (dxmax - dxmin) / 2, dymin, dymin + (dymax - dymin) / 2, tgtHealpix, xyf, 0, 0);
            this.setupPositionAndTexture4Quadrant(sindex, tindex, dxmin + (dxmax - dxmin) / 2, dxmax, dymin, dymin + (dymax - dymin) / 2, tgtHealpix, xyf, 0, 1);
            this.setupPositionAndTexture4Quadrant(sindex, tindex, dxmin, dxmin + (dxmax - dxmin) / 2, dymin + (dymax - dymin) / 2, dymax, tgtHealpix, xyf, 1, 0);
            this.setupPositionAndTexture4Quadrant(sindex, tindex, dxmin + (dxmax - dxmin) / 2, dxmax, dymin + (dymax - dymin) / 2, dymax, tgtHealpix, xyf, 1, 1);
            sindex++;
            if (sindex === 27) {
                tindex++;
                sindex = 0;
            }
        }
        const vertexIndices = new Uint16Array(6 * this._numFaces);
        let baseFaceIndex = 0;
        for (let i = 0; i < this._numFaces; i++) {
            vertexIndices[6 * i] = baseFaceIndex;
            vertexIndices[6 * i + 1] = baseFaceIndex + 1;
            vertexIndices[6 * i + 2] = baseFaceIndex + 3;
            vertexIndices[6 * i + 3] = baseFaceIndex + 1;
            vertexIndices[6 * i + 4] = baseFaceIndex + 2;
            vertexIndices[6 * i + 5] = baseFaceIndex + 3;
            baseFaceIndex += 4;
        }
        this.vertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertexPosition, gl.STATIC_DRAW);
        this.vertexIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, vertexIndices, gl.STATIC_DRAW);
    }
    setupPositionAndTexture4Quadrant(sindex, tindex, dxmin, dxmax, dymin, dymax, tgthealpix, xyf, qx, qy) {
        let facesVec3Array = [];
        const factor = 2 ** (tgthealpix.order - 3);
        const s_step = 1 / (27 * factor); // 0.037037037...
        const t_step = 1 / (29 * factor); // 0.034482759...
        const s_pixel_size = s_step / 64;
        const t_pixel_size = t_step / 64;
        const base_s = factor * s_step * sindex + s_step * qx;
        const base_t = factor * t_step * tindex + t_step * qy;
        for (let dx = dxmin; dx < dxmax; dx++) {
            for (let dy = dymin; dy < dymax; dy++) {
                facesVec3Array = tgthealpix.getPointsForXyfNoStep(dx, dy, xyf.face);
                // bottom right
                this.vertexPosition[20 * this.vidx] = facesVec3Array[0].x;
                this.vertexPosition[20 * this.vidx + 1] = facesVec3Array[0].y;
                this.vertexPosition[20 * this.vidx + 2] = facesVec3Array[0].z;
                this.vertexPosition[20 * this.vidx + 3] = s_step + base_s - s_pixel_size;
                this.vertexPosition[20 * this.vidx + 4] = 1 - (t_step + base_t) + t_pixel_size;
                // top right
                this.vertexPosition[20 * this.vidx + 5] = facesVec3Array[1].x;
                this.vertexPosition[20 * this.vidx + 6] = facesVec3Array[1].y;
                this.vertexPosition[20 * this.vidx + 7] = facesVec3Array[1].z;
                this.vertexPosition[20 * this.vidx + 8] = s_step + base_s - s_pixel_size;
                this.vertexPosition[20 * this.vidx + 9] = 1 - base_t - t_pixel_size;
                // top left
                this.vertexPosition[20 * this.vidx + 10] = facesVec3Array[2].x;
                this.vertexPosition[20 * this.vidx + 11] = facesVec3Array[2].y;
                this.vertexPosition[20 * this.vidx + 12] = facesVec3Array[2].z;
                this.vertexPosition[20 * this.vidx + 13] = base_s + s_pixel_size;
                this.vertexPosition[20 * this.vidx + 14] = 1 - base_t - t_pixel_size;
                // bottom left
                this.vertexPosition[20 * this.vidx + 15] = facesVec3Array[3].x;
                this.vertexPosition[20 * this.vidx + 16] = facesVec3Array[3].y;
                this.vertexPosition[20 * this.vidx + 17] = facesVec3Array[3].z;
                this.vertexPosition[20 * this.vidx + 18] = base_s + s_pixel_size;
                this.vertexPosition[20 * this.vidx + 19] = 1 - (t_step + base_t) + t_pixel_size;
                this.vidx++;
            }
        }
    }
    /**
     * Renders the all-sky layer and, when available, delegates to higher-resolution child tiles.
     * Returns `true` if it attempted to draw (ready), `false` if still not ready.
     */
    draw(visibleOrder, visibleTilesMap, pMatrix, vMatrix, mMatrix, colorMapIdx) {
        if (!this._ready)
            return false;
        let allSkyTiles2Skip = [];
        if (visibleOrder >= this._order) {
            const skipped = this.drawChildren(visibleOrder, visibleTilesMap, pMatrix, vMatrix, mMatrix, colorMapIdx);
            if (skipped)
                allSkyTiles2Skip = skipped;
        }
        const gl = this._webgl;
        this._hipsShaderProgram.enableShaders(pMatrix, vMatrix, mMatrix, colorMapIdx);
        gl.enableVertexAttribArray(this._hipsShaderProgram.locations.vertexPositionAttribute);
        gl.enableVertexAttribArray(this._hipsShaderProgram.locations.textureCoordAttribute);
        // hipsShaderProgram.enableShaders(pMatrix, vMatrix, mMatrix, colorMapIdx)
        // gl.enableVertexAttribArray((hipsShaderProgram as any).locations.vertexPositionAttribute)
        // gl.enableVertexAttribArray((hipsShaderProgram as any).locations.textureCoordAttribute)
        gl.activeTexture(gl.TEXTURE0 + this._hipsShaderIndex);
        gl.bindTexture(gl.TEXTURE_2D, this._texture);
        // gl.uniform1f(hipsShaderProgram.locations.textureAlpha, this.opacity)
        gl.uniform1f(this._hipsShaderProgram.locations.textureAlpha, this.opacity);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
        gl.vertexAttribPointer(
        // hipsShaderProgram.locations.vertexPositionAttribute,
        this._hipsShaderProgram.locations.vertexPositionAttribute, 3, gl.FLOAT, false, 5 * 4, 0);
        gl.vertexAttribPointer(
        // hipsShaderProgram.locations.textureCoordAttribute,
        this._hipsShaderProgram.locations.textureCoordAttribute, 2, gl.FLOAT, false, 5 * 4, 3 * 4);
        for (let t = 0; t < this._maxTiles; t++) {
            if (!allSkyTiles2Skip.includes(t)) {
                gl.drawElements(gl.TRIANGLES, 6 * this._numFacesXTile, gl.UNSIGNED_SHORT, 12 * t * this._numFacesXTile);
            }
        }
        gl.disableVertexAttribArray(this._hipsShaderProgram.locations.vertexPositionAttribute);
        gl.disableVertexAttribArray(this._hipsShaderProgram.locations.textureCoordAttribute);
        // gl.disableVertexAttribArray(hipsShaderProgram.locations.vertexPositionAttribute)
        // gl.disableVertexAttribArray(hipsShaderProgram.locations.textureCoordAttribute)
        return true;
    }
    drawChildren(visibleOrder, visibleTilesMap, pMatrix, vMatrix, mMatrix, colorMapIdx) {
        const childrenOrder = this._order;
        if (!visibleTilesMap.has(childrenOrder))
            return;
        const visibleTiles = visibleTilesMap.get(childrenOrder);
        const allSkyTiles2Skip = [];
        for (let i = 0; i < visibleTiles.length; i++) {
            const tileno = visibleTiles[i];
            const childTile = this._isGalacticHips
                ? this._tileBuffer.getGalTile(tileno, childrenOrder, this._hips)
                : this._tileBuffer.getTile(tileno, childrenOrder, this._hips);
            // const childTile = this._isGalacticHips
            //   ? newTileBuffer.getGalTile(tileno, childrenOrder, this._hips)
            //   : newTileBuffer.getTile(tileno, childrenOrder, this._hips)
            // childTile.draw(visibleOrder, visibleTilesMap, pMatrix, vMatrix, mMatrix, colorMapIdx)
            childTile.draw(visibleOrder, visibleTilesMap, pMatrix, vMatrix, mMatrix, colorMapIdx, this._hipsShaderProgram);
            if (childTile.getReadyState()) {
                allSkyTiles2Skip.push(tileno);
            }
        }
        return allSkyTiles2Skip;
    }
}
