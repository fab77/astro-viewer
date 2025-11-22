'use strict';
import global from '../../Global.js';
import { fovHelper } from './FoVHelper.js';
class AncestorTile {
    _hips;
    _tileno;
    _baseurl;
    _order;
    _ready = false;
    _format;
    _isGalacticHips;
    opacity = 1.0;
    _hipsShaderIndex = 0;
    _pixels = [];
    _texture = null;
    _image;
    _texurl = '';
    vertexPosition;
    vertexPositionBuffer;
    vertexIndices;
    vertexIndexBuffer;
    _tileBuffer;
    _hipsShaderProgram;
    constructor(tileno, order, hips, tileBuffer, hipsShaderProgram) {
        this._hipsShaderProgram = hipsShaderProgram;
        this._tileBuffer = tileBuffer;
        this._hips = hips;
        this._tileno = tileno;
        this._format = hips.format;
        this._baseurl = hips.baseURL;
        this._isGalacticHips = hips.isGalacticHips;
        this._order = order;
        this.initImage();
    }
    // Kept for API parity; there is no interval created in this class.
    destroyIntervals() {
        // no-op
    }
    initImage() {
        const dirnumber = Math.floor(this._tileno / 10000) * 10000;
        this._texurl = `${this._baseurl}/Norder${this._order}/Dir${dirnumber}/Npix${this._tileno}.${this._format}`;
        this._image = new Image();
        this._image.onload = () => this.imageLoaded();
        this._image.onerror = () => {
            console.error('File not found? %s', this._texurl);
        };
        this._image.crossOrigin = 'anonymous';
        // If you ever need FITS handling, call this.loadImage() instead.
        this._image.src = this._texurl;
    }
    imageLoaded() {
        this.textureLoaded();
        this.initModelBuffer();
        const gl = global.gl;
        gl.activeTexture(gl.TEXTURE0 + this._hipsShaderIndex);
        gl.bindTexture(gl.TEXTURE_2D, this._texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._image);
        this._ready = true;
    }
    textureLoaded() {
        // hipsShaderProgram.enableProgram()
        this._hipsShaderProgram.enableProgram();
        const gl = global.gl;
        this._texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + this._hipsShaderIndex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.bindTexture(gl.TEXTURE_2D, this._texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        // gl.uniform1i((hipsShaderProgram as any).shaderProgram.samplerUniform, this._hipsShaderIndex)
        // gl.uniform1i(this._hipsShaderProgram.shaderProgram.samplerUniform, this._hipsShaderIndex)
        if (!gl.isTexture(this._texture)) {
            console.log('error in texture');
        }
    }
    initModelBuffer() {
        const gl = global.gl;
        this.vertexPosition = [];
        this.vertexPositionBuffer = [];
        this.vertexIndices = new Uint16Array();
        // this.vertexIndexBuffer created later
        const reforder = fovHelper.getRefOrder(this._order);
        const orighealpix = global.getHealpix(this._order);
        const origxyf = orighealpix.nest2xyf(this._tileno);
        const orderjump = reforder - this._order;
        const dxmin = origxyf.ix << orderjump;
        const dxmax = (origxyf.ix << orderjump) + (1 << orderjump);
        const dymin = origxyf.iy << orderjump;
        const dymax = (origxyf.iy << orderjump) + (1 << orderjump);
        const healpix = global.getHealpix(reforder);
        this._pixels = [];
        // Using getBoundaries (like the JS source)
        this.setupPositionAndTexture4Quadrant(dxmin, dxmax / 2, dymin, dymax / 2, 0, healpix, orderjump, origxyf);
        this.setupPositionAndTexture4Quadrant(dxmax / 2, dxmax, dymin, dymax / 2, 1, healpix, orderjump, origxyf);
        this.setupPositionAndTexture4Quadrant(dxmin, dxmax / 2, dymax / 2, dymax, 2, healpix, orderjump, origxyf);
        this.setupPositionAndTexture4Quadrant(dxmax / 2, dxmax, dymax / 2, dymax, 3, healpix, orderjump, origxyf);
        const pixelsXQuadrant = this.vertexPosition[0].length / 20;
        this.vertexIndices = this.computeVertexIndices(pixelsXQuadrant);
        this.vertexIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndices, gl.STATIC_DRAW);
    }
    computeVertexIndices(pixelsXQuadrant) {
        const vertexIndices = new Uint16Array(6 * pixelsXQuadrant);
        let baseFaceIndex = 0;
        for (let j = 0; j < pixelsXQuadrant; j++) {
            vertexIndices[6 * j] = baseFaceIndex;
            vertexIndices[6 * j + 1] = baseFaceIndex + 1;
            vertexIndices[6 * j + 2] = baseFaceIndex + 2;
            vertexIndices[6 * j + 3] = baseFaceIndex + 2;
            vertexIndices[6 * j + 4] = baseFaceIndex + 3;
            vertexIndices[6 * j + 5] = baseFaceIndex;
            baseFaceIndex += 4;
        }
        return vertexIndices;
    }
    // Version that uses getPointsForXyfNoStep (kept for reference; not used in this class)
    setupPositionAndTexture4Quadrant2(dxmin, dxmax, dymin, dymax, qidx, healpix, orderjump, origxyf) {
        const gl = global.gl;
        this.vertexPosition[qidx] = new Float32Array(20 * (dxmax - dxmin) * (dymax - dymin));
        const step = 1 / (1 << orderjump);
        let p = 0;
        for (let dx = dxmin; dx < dxmax; dx++) {
            for (let dy = dymin; dy < dymax; dy++) {
                const facesVec3Array = healpix.getPointsForXyfNoStep(dx, dy, origxyf.face);
                const uindex = dy - (origxyf.iy << orderjump);
                const vindex = dx - (origxyf.ix << orderjump);
                this.vertexPosition[qidx][20 * p] = facesVec3Array[0].x;
                this.vertexPosition[qidx][20 * p + 1] = facesVec3Array[0].y;
                this.vertexPosition[qidx][20 * p + 2] = facesVec3Array[0].z;
                this.vertexPosition[qidx][20 * p + 3] = step + step * uindex;
                this.vertexPosition[qidx][20 * p + 4] = 1 - (step + step * vindex);
                this.vertexPosition[qidx][20 * p + 5] = facesVec3Array[1].x;
                this.vertexPosition[qidx][20 * p + 6] = facesVec3Array[1].y;
                this.vertexPosition[qidx][20 * p + 7] = facesVec3Array[1].z;
                this.vertexPosition[qidx][20 * p + 8] = step + step * uindex;
                this.vertexPosition[qidx][20 * p + 9] = 1 - step * vindex;
                this.vertexPosition[qidx][20 * p + 10] = facesVec3Array[2].x;
                this.vertexPosition[qidx][20 * p + 11] = facesVec3Array[2].y;
                this.vertexPosition[qidx][20 * p + 12] = facesVec3Array[2].z;
                this.vertexPosition[qidx][20 * p + 13] = step * uindex;
                this.vertexPosition[qidx][20 * p + 14] = 1 - step * vindex;
                this.vertexPosition[qidx][20 * p + 15] = facesVec3Array[3].x;
                this.vertexPosition[qidx][20 * p + 16] = facesVec3Array[3].y;
                this.vertexPosition[qidx][20 * p + 17] = facesVec3Array[3].z;
                this.vertexPosition[qidx][20 * p + 18] = step * uindex;
                this.vertexPosition[qidx][20 * p + 19] = 1 - (step + step * vindex);
                p++;
            }
        }
        this.vertexPositionBuffer[qidx] = global.gl.createBuffer();
        global.gl.bindBuffer(global.gl.ARRAY_BUFFER, this.vertexPositionBuffer[qidx]);
        global.gl.bufferData(global.gl.ARRAY_BUFFER, this.vertexPosition[qidx], global.gl.STATIC_DRAW);
    }
    // Version used by the original JS, collecting _pixels via xyf2nest + getBoundaries
    setupPositionAndTexture4Quadrant(dxmin, dxmax, dymin, dymax, qidx, healpix, orderjump, origxyf) {
        const gl = global.gl;
        this.vertexPosition[qidx] = new Float32Array(20 * (dxmax - dxmin) * (dymax - dymin));
        const step = 1 / (1 << orderjump);
        let p = 0;
        for (let dx = dxmin; dx < dxmax; dx++) {
            for (let dy = dymin; dy < dymax; dy++) {
                const ipix3 = healpix.xyf2nest(dx, dy, origxyf.face);
                this._pixels.push(ipix3);
                const facesVec3Array = healpix.getBoundaries(ipix3);
                const uindex = dy - (origxyf.iy << orderjump);
                const vindex = dx - (origxyf.ix << orderjump);
                this.vertexPosition[qidx][20 * p] = facesVec3Array[0].x;
                this.vertexPosition[qidx][20 * p + 1] = facesVec3Array[0].y;
                this.vertexPosition[qidx][20 * p + 2] = facesVec3Array[0].z;
                this.vertexPosition[qidx][20 * p + 3] = step + step * uindex;
                this.vertexPosition[qidx][20 * p + 4] = 1 - (step + step * vindex);
                this.vertexPosition[qidx][20 * p + 5] = facesVec3Array[1].x;
                this.vertexPosition[qidx][20 * p + 6] = facesVec3Array[1].y;
                this.vertexPosition[qidx][20 * p + 7] = facesVec3Array[1].z;
                this.vertexPosition[qidx][20 * p + 8] = step + step * uindex;
                this.vertexPosition[qidx][20 * p + 9] = 1 - step * vindex;
                this.vertexPosition[qidx][20 * p + 10] = facesVec3Array[2].x;
                this.vertexPosition[qidx][20 * p + 11] = facesVec3Array[2].y;
                this.vertexPosition[qidx][20 * p + 12] = facesVec3Array[2].z;
                this.vertexPosition[qidx][20 * p + 13] = step * uindex;
                this.vertexPosition[qidx][20 * p + 14] = 1 - step * vindex;
                this.vertexPosition[qidx][20 * p + 15] = facesVec3Array[3].x;
                this.vertexPosition[qidx][20 * p + 16] = facesVec3Array[3].y;
                this.vertexPosition[qidx][20 * p + 17] = facesVec3Array[3].z;
                this.vertexPosition[qidx][20 * p + 18] = step * uindex;
                this.vertexPosition[qidx][20 * p + 19] = 1 - (step + step * vindex);
                p++;
            }
        }
        this.vertexPositionBuffer[qidx] = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer[qidx]);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertexPosition[qidx], gl.STATIC_DRAW);
    }
    draw(visibleOrder, visibleTilesMap, pMatrix, vMatrix, mMatrix, colorMapIdx) {
        if (!this._ready)
            return false;
        let quadrantsToDraw = new Set([0, 1, 2, 3]);
        if (visibleOrder > this._order) {
            const q = this.drawChildren(visibleOrder, visibleTilesMap, pMatrix, vMatrix, mMatrix, colorMapIdx);
            if (q)
                quadrantsToDraw = q;
        }
        // hipsShaderProgram.enableShaders(pMatrix, vMatrix, mMatrix, colorMapIdx)
        this._hipsShaderProgram.enableShaders(pMatrix, vMatrix, mMatrix, colorMapIdx);
        const gl = global.gl;
        gl.enableVertexAttribArray(this._hipsShaderProgram.locations.vertexPositionAttribute);
        gl.enableVertexAttribArray(this._hipsShaderProgram.locations.textureCoordAttribute);
        // gl.enableVertexAttribArray((hipsShaderProgram as any).locations.vertexPositionAttribute)
        // gl.enableVertexAttribArray((hipsShaderProgram as any).locations.textureCoordAttribute)
        gl.activeTexture(gl.TEXTURE0 + this._hipsShaderIndex);
        gl.bindTexture(gl.TEXTURE_2D, this._texture);
        // gl.uniform1f((hipsShaderProgram as any).locations.textureAlpha, this.opacity)
        gl.uniform1f(this._hipsShaderProgram.locations.textureAlpha, this.opacity);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
        const elemno = this.vertexIndices.length;
        quadrantsToDraw.forEach((qidx) => {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer[qidx]);
            gl.vertexAttribPointer(
            // (hipsShaderProgram as any).locations.vertexPositionAttribute,
            this._hipsShaderProgram.locations.vertexPositionAttribute, 3, gl.FLOAT, false, 5 * 4, 0);
            gl.vertexAttribPointer(
            // (hipsShaderProgram as any).locations.textureCoordAttribute,
            this._hipsShaderProgram.locations.textureCoordAttribute, 2, gl.FLOAT, false, 5 * 4, 3 * 4);
            gl.drawElements(gl.TRIANGLES, elemno, gl.UNSIGNED_SHORT, 0);
        });
        gl.disableVertexAttribArray(this._hipsShaderProgram.locations.vertexPositionAttribute);
        gl.disableVertexAttribArray(this._hipsShaderProgram.locations.textureCoordAttribute);
        // gl.disableVertexAttribArray((hipsShaderProgram as any).locations.vertexPositionAttribute)
        // gl.disableVertexAttribArray((hipsShaderProgram as any).locations.textureCoordAttribute)
        return true;
    }
    drawChildren(visibleOrder, visibleTilesMap, pMatrix, vMatrix, mMatrix, colorMapIdx) {
        const quadrantsToDraw = new Set([0, 1, 2, 3]);
        const childrenOrder = this._order + 1;
        if (!visibleTilesMap.has(childrenOrder))
            return;
        for (let c = 0; c < 4; c++) {
            const childTileNo = (this._tileno << 2) + c;
            const visibleChildren = visibleTilesMap.get(childrenOrder);
            if (visibleChildren.includes(childTileNo)) {
                const childTile = this._isGalacticHips
                    ? this._tileBuffer.getGalTile(childTileNo, childrenOrder, this._hips)
                    : this._tileBuffer.getTile(childTileNo, childrenOrder, this._hips);
                // const childTile = this._isGalacticHips
                //   ? newTileBuffer.getGalTile(childTileNo, childrenOrder, this._hips)
                //   : newTileBuffer.getTile(childTileNo, childrenOrder, this._hips)
                childTile.draw(visibleOrder, visibleTilesMap, pMatrix, vMatrix, mMatrix, colorMapIdx);
                if (childTile._ready) {
                    quadrantsToDraw.delete(childTile._tileno - (this._tileno << 2));
                }
            }
        }
        return quadrantsToDraw;
    }
}
export default AncestorTile;
//# sourceMappingURL=AncestorTile.js.map