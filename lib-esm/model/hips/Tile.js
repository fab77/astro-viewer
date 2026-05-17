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
// Tile.ts
import global from '../../Global.js';
import { fovHelper } from './FoVHelper.js';
// ------------------------------------------------------------------------
export default class Tile {
    _hips;
    _tileno;
    _baseurl;
    _order;
    _format;
    _maxorder;
    _isGalacticHips;
    _ready = false;
    _abort = false;
    _image;
    _textureLoaded = false;
    _texture;
    _texurl = '';
    _hipsShaderIndex = 0;
    _cacheTime0;
    _inView = true;
    _amIStillInFoV_requsetID;
    // geometry buffers
    vertexPosition = [];
    vertexPositionBuffer = [];
    vertexIndices = new Uint16Array();
    vertexIndexBuffer;
    _tileBuffer;
    opacity = 1.0;
    _webgl;
    _visibleTileManager;
    // private _hipsShaderProgram
    constructor(tileno, order, hips, tileBuffer, webgl, visibleTileManager) {
        // this._hipsShaderProgram = hipsShaderProgram
        this._visibleTileManager = visibleTileManager;
        this._webgl = webgl;
        this._tileBuffer = tileBuffer;
        this._hips = hips;
        this._tileno = tileno;
        this._format = hips.format;
        this._baseurl = hips.baseURL;
        this._maxorder = hips.maxOrder;
        this._isGalacticHips = hips.isGalacticHips;
        this._order = order;
        this._amIStillInFoV_requsetID = window.setInterval(() => {
            this.amIStillInFoV();
        }, 5000);
        this.initImage();
    }
    destroyIntervals() {
        window.clearInterval(this._amIStillInFoV_requsetID);
    }
    getReadyState() {
        return this._ready;
    }
    get cacheTime0() {
        return this._cacheTime0;
    }
    resetCacheTime0() {
        this._cacheTime0 = undefined;
    }
    setCacheTime0() {
        this._cacheTime0 = new Date().getTime();
    }
    initImage() {
        if (this._order > this._maxorder) {
            this._ready = false;
            this._abort = true;
            this.destroyIntervals();
            console.warn(`[Tile] Skipping tile request above max order: requested order ${this._order}, max order ${this._maxorder}, url ${this._baseurl}`);
            return;
        }
        this._image = new Image();
        const dirnumber = Math.floor(this._tileno / 10000) * 10000;
        this._texurl = `${this._baseurl}/Norder${this._order}/Dir${dirnumber}/Npix${this._tileno}.${this._format}`;
        this._image.onload = () => this.imageLoaded();
        this._image.onerror = () => {
            // console.error('File not found?', this._texurl)
            this._ready = false;
            this._abort = true;
            this.destroyIntervals();
        };
        this._image.crossOrigin = 'anonymous';
        this._image.src = this._texurl;
    }
    imageLoaded() {
        // this.textureLoaded()
        // this.initModelBuffer()
        // this._textureLoaded = true
        this._ready = true;
    }
    // private textureLoaded(): void {
    textureLoaded(hipsShaderProgram) {
        // this._hipsShaderProgram.enableProgram()
        hipsShaderProgram.enableProgram();
        const gl = this._webgl;
        this._texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + this._hipsShaderIndex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.bindTexture(gl.TEXTURE_2D, this._texture);
        if (!gl.isTexture(this._texture)) {
            console.log('error in texture');
        }
        gl.activeTexture(gl.TEXTURE0 + this._hipsShaderIndex);
        gl.bindTexture(gl.TEXTURE_2D, this._texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        // FIX: use the sampler location we fetched in enableShaders()
        // gl.uniform1i((this._hipsShaderProgram.locations as ShaderLocations).sampler, this._hipsShaderIndex)
        // gl.uniform1i((hipsShaderProgram.locations as ShaderLocations).sampler, this._hipsShaderIndex)
        if (!gl.isTexture(this._texture)) {
            console.warn('Texture creation failed');
        }
        this.initModelBuffer();
        this._textureLoaded = true;
    }
    initModelBuffer() {
        const gl = this._webgl;
        this.vertexPosition = [];
        this.vertexPositionBuffer = [];
        this.vertexIndices = new Uint16Array();
        const reforder = fovHelper.getRefOrder(this._order);
        const orighealpix = global.getHealpix(this._order);
        const origxyf = orighealpix.nest2xyf(this._tileno);
        const orderjump = reforder - this._order;
        const dxmin = origxyf.ix << orderjump;
        const dxmax = (origxyf.ix << orderjump) + (1 << orderjump);
        const dymin = origxyf.iy << orderjump;
        const dymax = (origxyf.iy << orderjump) + (1 << orderjump);
        const healpix = global.getHealpix(reforder);
        this.setupPositionAndTexture4Quadrant2(dxmin, dxmin + (dxmax - dxmin) / 2, dymin, dymin + (dymax - dymin) / 2, 0, healpix, orderjump, origxyf);
        this.setupPositionAndTexture4Quadrant2(dxmin + (dxmax - dxmin) / 2, dxmax, dymin, dymin + (dymax - dymin) / 2, 1, healpix, orderjump, origxyf);
        this.setupPositionAndTexture4Quadrant2(dxmin, dxmin + (dxmax - dxmin) / 2, dymin + (dymax - dymin) / 2, dymax, 2, healpix, orderjump, origxyf);
        this.setupPositionAndTexture4Quadrant2(dxmin + (dxmax - dxmin) / 2, dxmax, dymin + (dymax - dymin) / 2, dymax, 3, healpix, orderjump, origxyf);
        const pixelsXQuadrant = this.vertexPosition[0].length / 20;
        const idx = this.computeVertexIndices(pixelsXQuadrant);
        // If large, upgrade to Uint32 indices
        if (idx.length > 65535) {
            // Optional: require OES_element_index_uint if you’re still on WebGL1
            this.vertexIndices = new Uint32Array(idx);
        }
        else {
            this.vertexIndices = new Uint16Array(idx);
        }
        this.vertexIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndices, gl.STATIC_DRAW);
    }
    computeVertexIndices(pixelsXQuadrant) {
        const vertexIndices = new Uint32Array(6 * pixelsXQuadrant);
        let baseFaceIndex = 0;
        for (let j = 0; j < pixelsXQuadrant; j++) {
            const b = baseFaceIndex;
            vertexIndices[6 * j] = b;
            vertexIndices[6 * j + 1] = b + 1;
            vertexIndices[6 * j + 2] = b + 2;
            vertexIndices[6 * j + 3] = b + 2;
            vertexIndices[6 * j + 4] = b + 3;
            vertexIndices[6 * j + 5] = b;
            baseFaceIndex += 4;
        }
        return vertexIndices;
    }
    setupPositionAndTexture4Quadrant2(dxmin, dxmax, dymin, dymax, qidx, healpix, orderjump, origxyf) {
        const gl = this._webgl;
        this.vertexPosition[qidx] = new Float32Array(20 * (dxmax - dxmin) * (dymax - dymin));
        const step = 1 / (1 << orderjump);
        let p = 0;
        const s_pixel_size = 0;
        const t_pixel_size = 0;
        for (let dx = dxmin; dx < dxmax; dx++) {
            for (let dy = dymin; dy < dymax; dy++) {
                const facesVec3Array = healpix.getPointsForXyfNoStep(dx, dy, origxyf.face);
                const uindex = dy - (origxyf.iy << orderjump);
                const vindex = dx - (origxyf.ix << orderjump);
                // v0
                this.vertexPosition[qidx][20 * p] = facesVec3Array[0].x;
                this.vertexPosition[qidx][20 * p + 1] = facesVec3Array[0].y;
                this.vertexPosition[qidx][20 * p + 2] = facesVec3Array[0].z;
                this.vertexPosition[qidx][20 * p + 3] = step + step * uindex + s_pixel_size;
                this.vertexPosition[qidx][20 * p + 4] = 1 - (step + step * vindex) - t_pixel_size;
                // v1
                this.vertexPosition[qidx][20 * p + 5] = facesVec3Array[1].x;
                this.vertexPosition[qidx][20 * p + 6] = facesVec3Array[1].y;
                this.vertexPosition[qidx][20 * p + 7] = facesVec3Array[1].z;
                this.vertexPosition[qidx][20 * p + 8] = step + step * uindex + s_pixel_size;
                this.vertexPosition[qidx][20 * p + 9] = 1 - step * vindex + t_pixel_size;
                // v2
                this.vertexPosition[qidx][20 * p + 10] = facesVec3Array[2].x;
                this.vertexPosition[qidx][20 * p + 11] = facesVec3Array[2].y;
                this.vertexPosition[qidx][20 * p + 12] = facesVec3Array[2].z;
                this.vertexPosition[qidx][20 * p + 13] = step * uindex - s_pixel_size;
                this.vertexPosition[qidx][20 * p + 14] = 1 - step * vindex + t_pixel_size;
                // v3
                this.vertexPosition[qidx][20 * p + 15] = facesVec3Array[3].x;
                this.vertexPosition[qidx][20 * p + 16] = facesVec3Array[3].y;
                this.vertexPosition[qidx][20 * p + 17] = facesVec3Array[3].z;
                this.vertexPosition[qidx][20 * p + 18] = step * uindex - s_pixel_size;
                this.vertexPosition[qidx][20 * p + 19] = 1 - (step + step * vindex) - t_pixel_size;
                p++;
            }
        }
        this.vertexPositionBuffer[qidx] = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer[qidx]);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertexPosition[qidx], gl.STATIC_DRAW);
    }
    get inView() {
        return this._inView;
    }
    moveToCache() {
        // newTileBuffer.moveTileToCache(this._tileno, this._order, this._hips)
        this._tileBuffer.moveTileToCache(this._tileno, this._order, this._hips);
        this._inView = false;
        this.destroyIntervals();
    }
    amIStillInFoV() {
        if (this._textureLoaded)
            this._ready = true;
        if (this._isGalacticHips) {
            if (this._visibleTileManager.galAncestorsMap.has(this._order)) {
                if (!this._visibleTileManager.galAncestorsMap.get(this._order).includes(this._tileno)) {
                    this.moveToCache();
                }
                else {
                    this._inView = true;
                }
            }
            // if (visibleTilesManager.galAncestorsMap.has(this._order)) {
            //   if (!visibleTilesManager.galAncestorsMap.get(this._order)!.includes(this._tileno)) {
            //     this.moveToCache()
            //   } else {
            //     this._inView = true
            //   }
            // }
            if (this._order == this._visibleTileManager.visibleOrder) {
                if (!this._visibleTileManager.galVisibleTilesByOrder.pixels.includes(this._tileno)) {
                    this.moveToCache();
                }
                else {
                    this._inView = true;
                }
            }
            // if (this._order == visibleTilesManager.visibleOrder) {
            //   if (!visibleTilesManager.galVisibleTilesByOrder.pixels.includes(this._tileno)) {
            //     this.moveToCache()
            //   } else {
            //     this._inView = true
            //   }
            // }
        }
        else {
            if (this._visibleTileManager.ancestorsMap.has(this._order)) {
                if (!this._visibleTileManager.ancestorsMap.get(this._order).includes(this._tileno)) {
                    this.moveToCache();
                }
                else {
                    this._inView = true;
                }
            }
            // if (visibleTilesManager.ancestorsMap.has(this._order)) {
            //   if (!visibleTilesManager.ancestorsMap.get(this._order)!.includes(this._tileno)) {
            //     this.moveToCache()
            //   } else {
            //     this._inView = true
            //   }
            // }
            if (this._order == this._visibleTileManager.visibleOrder) {
                if (!this._visibleTileManager.visibleTilesByOrder.pixels.includes(this._tileno)) {
                    this.moveToCache();
                }
                else {
                    this._inView = true;
                }
            }
            // if (this._order == visibleTilesManager.visibleOrder) {
            //   if (!visibleTilesManager.visibleTilesByOrder.pixels.includes(this._tileno)) {
            //     this.moveToCache()
            //   } else {
            //     this._inView = true
            //   }
            // }
        }
    }
    draw(visibleOrder, visibleTilesMap, pMatrix, vMatrix, mMatrix, colorMapIdx, hipsShaderProgram) {
        if (!this._ready || this._abort)
            return;
        if (!this._textureLoaded) {
            this.textureLoaded(hipsShaderProgram);
        }
        let quadrantsToDraw = new Set([0, 1, 2, 3]);
        if (visibleOrder > this._order && this._order < this._maxorder) {
            // const kids = this.drawChildren(visibleOrder, visibleTilesMap, pMatrix, vMatrix, mMatrix, colorMapIdx)
            const kids = this.drawChildren(visibleOrder, visibleTilesMap, pMatrix, vMatrix, mMatrix, colorMapIdx, hipsShaderProgram);
            if (kids)
                quadrantsToDraw = kids;
        }
        const gl = this._webgl;
        hipsShaderProgram.enableShaders(pMatrix, vMatrix, mMatrix, colorMapIdx);
        // this._hipsShaderProgram.enableShaders(pMatrix, vMatrix, mMatrix, colorMapIdx)
        // Enable attributes (these locations are retrieved in enableShaders)
        // gl.enableVertexAttribArray(this._hipsShaderProgram.locations.vertexPositionAttribute)
        // gl.enableVertexAttribArray(this._hipsShaderProgram.locations.textureCoordAttribute)
        gl.enableVertexAttribArray(hipsShaderProgram.locations.vertexPositionAttribute);
        gl.enableVertexAttribArray(hipsShaderProgram.locations.textureCoordAttribute);
        gl.activeTexture(gl.TEXTURE0 + this._hipsShaderIndex);
        gl.bindTexture(gl.TEXTURE_2D, this._texture);
        // gl.uniform1f(this._hipsShaderProgram.locations.textureAlpha, this.opacity)
        gl.uniform1f(hipsShaderProgram.locations.textureAlpha, this.opacity);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
        const elemno = this.vertexIndices.length;
        const indexType = this.vertexIndices instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
        quadrantsToDraw.forEach((qidx) => {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer[qidx]);
            gl.vertexAttribPointer(
            // this._hipsShaderProgram.locations.vertexPositionAttribute,
            hipsShaderProgram.locations.vertexPositionAttribute, 3, gl.FLOAT, false, 5 * 4, 0);
            gl.vertexAttribPointer(
            // this._hipsShaderProgram.locations.textureCoordAttribute,
            hipsShaderProgram.locations.textureCoordAttribute, 2, gl.FLOAT, false, 5 * 4, 3 * 4);
            gl.drawElements(gl.TRIANGLES, elemno, indexType, 0);
        });
        // gl.disableVertexAttribArray(this._hipsShaderProgram.locations.vertexPositionAttribute)
        // gl.disableVertexAttribArray(this._hipsShaderProgram.locations.textureCoordAttribute)
        gl.disableVertexAttribArray(hipsShaderProgram.locations.vertexPositionAttribute);
        gl.disableVertexAttribArray(hipsShaderProgram.locations.textureCoordAttribute);
    }
    drawChildren(visibleOrder, visibleTilesMap, pMatrix, vMatrix, mMatrix, colorMapIdx, hipsShaderProgram) {
        const quadrantsToDraw = new Set([0, 1, 2, 3]);
        const childrenOrder = this._order + 1;
        if (!visibleTilesMap.has(childrenOrder))
            return;
        for (let c = 0; c < 4; c++) {
            const childTileNo = (this._tileno << 2) + c;
            const list = visibleTilesMap.get(childrenOrder);
            if (list.includes(childTileNo)) {
                const childTile = this._isGalacticHips
                    ? this._tileBuffer.getGalTile(childTileNo, childrenOrder, this._hips)
                    : this._tileBuffer.getTile(childTileNo, childrenOrder, this._hips);
                // const childTile = this._isGalacticHips
                //   ? newTileBuffer.getGalTile(childTileNo, childrenOrder, this._hips)
                //   : newTileBuffer.getTile(childTileNo, childrenOrder, this._hips)
                // childTile.draw(visibleOrder, visibleTilesMap, pMatrix, vMatrix, mMatrix, colorMapIdx)
                childTile.draw(visibleOrder, visibleTilesMap, pMatrix, vMatrix, mMatrix, colorMapIdx, hipsShaderProgram);
                if (childTile._ready) {
                    quadrantsToDraw.delete(childTileNo - (this._tileno << 2));
                }
            }
        }
        return quadrantsToDraw;
    }
}
