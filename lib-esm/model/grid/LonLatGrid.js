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
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { mat4, vec4 } from 'gl-matrix';
import { AbstractSkyEntity } from '../AbstractSkyEntity.js';
import { xyzFovHelper } from '../earth/XYZFoVHelper.js';
import GridShaderManager from '../../shader/GridShaderManager.js';
import { colorHex2RGB, degToRad } from '../../utils/Utils.js';
import { SphereFoV } from '../SphereFoV.js';
import global from '../../Global.js';
import GridTextHelper from './GridTextHelper.js';
export class LatLonGrid extends AbstractSkyEntity {
    static ELEM_SIZE = 3;
    static BYTES_X_ELEM = new Float32Array().BYTES_PER_ELEMENT;
    _shaderProgram;
    _vertexShader;
    _fragmentShader;
    _attribLocations = {
        position: 0,
    };
    _lonVertexPositionBuffer;
    _latVertexPositionBuffer;
    _lonStep = 10;
    _latStep = 10;
    _segmentStep = 1;
    _fovObj;
    _fovDeg = 180;
    _showGrid = true;
    _lonArray = [];
    _latArray = [];
    _bufferKey = '';
    defaultColor = '#41d4d4';
    gridText = new GridTextHelper('lonlat');
    constructor(radius, position, xrad, yrad, name, webgl) {
        super(radius, position, xrad, yrad, name, webgl);
        this._fovObj = new SphereFoV(webgl);
        this.init();
    }
    init() {
        this.initGL(super.webgl);
        const gl = super.webgl;
        this._shaderProgram = gl.createProgram();
        this.initShaders();
        this._lonVertexPositionBuffer = gl.createBuffer();
        this._latVertexPositionBuffer = gl.createBuffer();
        this.initBuffers(this._fovDeg);
    }
    initShaders() {
        const gl = super.webgl;
        const fsSource = GridShaderManager.healpixGridFS();
        this._fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(this._fragmentShader, fsSource);
        gl.compileShader(this._fragmentShader);
        if (!gl.getShaderParameter(this._fragmentShader, gl.COMPILE_STATUS)) {
            const log = gl.getShaderInfoLog(this._fragmentShader) || 'Unknown fragment shader error';
            console.error(log);
            alert(log);
            return;
        }
        const vsSource = GridShaderManager.healpixGridVS();
        this._vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(this._vertexShader, vsSource);
        gl.compileShader(this._vertexShader);
        if (!gl.getShaderParameter(this._vertexShader, gl.COMPILE_STATUS)) {
            const log = gl.getShaderInfoLog(this._vertexShader) || 'Unknown vertex shader error';
            console.error(log);
            alert(log);
            return;
        }
        gl.attachShader(this._shaderProgram, this._vertexShader);
        gl.attachShader(this._shaderProgram, this._fragmentShader);
        gl.linkProgram(this._shaderProgram);
        if (!gl.getProgramParameter(this._shaderProgram, gl.LINK_STATUS)) {
            alert('Could not initialise shaders');
        }
        gl.useProgram(this._shaderProgram);
    }
    initBuffers(fovDeg, centerSphericalDeg, coarse = false) {
        const steps = xyzFovHelper.getLonLatSteps(fovDeg, coarse);
        this._lonStep = steps.lonStep;
        this._latStep = steps.latStep;
        this._segmentStep = Math.max(Math.min(this._lonStep, this._latStep), 0.25);
        this._lonArray = [];
        this._latArray = [];
        const center = centerSphericalDeg
            ? {
                lon: this.normalizeLon(centerSphericalDeg.phi > 180 ? centerSphericalDeg.phi - 360 : centerSphericalDeg.phi),
                lat: 90 - centerSphericalDeg.theta,
            }
            : null;
        const localGrid = !!center && !coarse && fovDeg < 2;
        const lonValues = localGrid
            ? this.buildLonRange(center.lon, Math.max(fovDeg * 4, this._lonStep * 3), this._lonStep)
            : this.buildLonRange(0, 180, this._lonStep);
        const latValues = localGrid
            ? this.buildLatRange(center.lat, Math.max(fovDeg * 4, this._latStep * 3), this._latStep)
            : this.buildLatRange(0, 90, this._latStep);
        const latSegmentRange = localGrid && center
            ? this.buildLatRange(center.lat, Math.max(fovDeg * 4, this._latStep * 3), this._segmentStep)
            : this.buildLatRange(0, 90, this._segmentStep);
        const lonSegmentRange = localGrid && center
            ? this.buildLonRange(center.lon, Math.max(fovDeg * 4, this._lonStep * 3), this._segmentStep)
            : this.buildLonRange(0, 180, this._segmentStep);
        for (const lon of lonValues) {
            const vertices = [];
            for (const lat of latSegmentRange) {
                vertices.push(...this.lonLatToCartesian(lon, Math.min(lat, 90)));
            }
            this._lonArray.push(new Float32Array(vertices));
        }
        for (const lat of latValues) {
            const vertices = [];
            if (lat <= -90 || lat >= 90)
                continue;
            for (const lon of lonSegmentRange) {
                vertices.push(...this.lonLatToCartesian(Math.min(lon, 180), lat));
            }
            this._latArray.push(new Float32Array(vertices));
        }
    }
    buildLonRange(centerLon, halfSpan, step) {
        const values = [];
        const start = Math.floor((centerLon - halfSpan) / step) * step;
        const end = Math.ceil((centerLon + halfSpan) / step) * step;
        for (let lon = start; lon <= end; lon += step) {
            values.push(this.normalizeLon(lon));
        }
        return values;
    }
    buildLatRange(centerLat, halfSpan, step) {
        const values = [];
        const start = Math.max(-90, Math.floor((centerLat - halfSpan) / step) * step);
        const end = Math.min(90, Math.ceil((centerLat + halfSpan) / step) * step);
        for (let lat = start; lat <= end; lat += step) {
            values.push(lat);
        }
        return values;
    }
    lonLatToCartesian(lonDeg, latDeg) {
        const lonRad = degToRad(lonDeg);
        const latRad = degToRad(latDeg);
        const cosLat = Math.cos(latRad);
        return [
            cosLat * Math.cos(lonRad),
            cosLat * Math.sin(lonRad),
            Math.sin(latRad),
        ];
    }
    refresh(fovDeg, input) {
        const coarse = !!input.cameraMoving;
        const steps = xyzFovHelper.getLonLatSteps(fovDeg, coarse);
        const center = input.centerSphericalDeg;
        const localGrid = !!center && !coarse && fovDeg < 2;
        const centerLon = center ? this.normalizeLon(center.phi > 180 ? center.phi - 360 : center.phi) : 0;
        const centerLat = center ? 90 - center.theta : 0;
        const centerKey = localGrid
            ? `${this.roundToStep(centerLon, Math.max(steps.lonStep, fovDeg))}:${this.roundToStep(centerLat, Math.max(steps.latStep, fovDeg))}`
            : 'global';
        const bufferKey = `${coarse ? 'coarse' : 'settled'}:${steps.lonStep}:${steps.latStep}:${centerKey}`;
        if (this._bufferKey !== bufferKey) {
            this._fovDeg = fovDeg;
            this._bufferKey = bufferKey;
            this.initBuffers(this._fovDeg, input.centerSphericalDeg, coarse);
        }
    }
    refreshFoV(input) {
        if (!input.camera || !input.pMatrix)
            return this._fovDeg;
        this._fovObj.getFoV(global.insideSphere, this, input.camera, input.pMatrix);
        this.refresh(this._fovObj.minFoV, input);
        return this._fovObj.minFoV;
    }
    getMinFoVDeg() {
        return this._fovObj.minFoV;
    }
    getFoV() {
        return this._fovObj;
    }
    isVisible() {
        return this._showGrid;
    }
    toggleShowGrid() {
        this._showGrid = !this._showGrid;
        return this._showGrid;
    }
    setShowGrid(showGrid) {
        this._showGrid = showGrid;
    }
    enableShader(mMatrix, pMatrix, vMatrix) {
        const gl = super.webgl;
        gl.useProgram(this._shaderProgram);
        const mvMatrix = mat4.create();
        mat4.multiply(mvMatrix, vMatrix, mMatrix);
        const uMVMatrixLoc = gl.getUniformLocation(this._shaderProgram, 'uMVMatrix');
        const uPMatrixLoc = gl.getUniformLocation(this._shaderProgram, 'uPMatrix');
        const uColor = gl.getUniformLocation(this._shaderProgram, 'u_fragcolor');
        this._attribLocations.position = gl.getAttribLocation(this._shaderProgram, 'aCatPosition');
        if (uMVMatrixLoc)
            gl.uniformMatrix4fv(uMVMatrixLoc, false, mvMatrix);
        if (uPMatrixLoc)
            gl.uniformMatrix4fv(uPMatrixLoc, false, pMatrix);
        if (uColor) {
            const rgb = colorHex2RGB(this.defaultColor);
            gl.uniform4f(uColor, rgb[0], rgb[1], rgb[2], 1.0);
        }
    }
    draw(input) {
        if (!this._showGrid) {
            this.gridText.resetDivSets();
            return;
        }
        const gl = super.webgl;
        const camera = input.camera;
        if (!camera)
            return;
        const pMatrix = input.pMatrix;
        if (!pMatrix)
            return;
        this.refreshFoV(input);
        const vMatrix = camera.getCameraMatrix();
        if (!vMatrix)
            return;
        const mMatrix = this.getModelMatrix();
        this.enableShader(mMatrix, pMatrix, vMatrix);
        for (const lonLine of this._lonArray) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this._lonVertexPositionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, lonLine, gl.STATIC_DRAW);
            gl.vertexAttribPointer(this._attribLocations.position, LatLonGrid.ELEM_SIZE, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this._attribLocations.position);
            gl.drawArrays(gl.LINE_STRIP, 0, lonLine.length / LatLonGrid.ELEM_SIZE);
        }
        for (const latLine of this._latArray) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this._latVertexPositionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, latLine, gl.STATIC_DRAW);
            gl.vertexAttribPointer(this._attribLocations.position, LatLonGrid.ELEM_SIZE, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this._attribLocations.position);
            gl.drawArrays(gl.LINE_LOOP, 0, latLine.length / LatLonGrid.ELEM_SIZE);
        }
        this.drawLabels(input, mMatrix, pMatrix, vMatrix);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }
    drawLabels(input, mMatrix, pMatrix, vMatrix) {
        const center = input.centerSphericalDeg;
        if (!center) {
            this.gridText.resetDivSets();
            return;
        }
        const centerLon = this.normalizeLon(center.phi > 180 ? center.phi - 360 : center.phi);
        const centerLat = 90 - center.theta;
        const lonLine = this.normalizeLon(this.roundToStep(centerLon, this._lonStep));
        const latLine = Math.max(-90 + this._latStep, Math.min(90 - this._latStep, this.roundToStep(centerLat, this._latStep)));
        const lonLabelPoint = this.lonLatToCartesian(lonLine, Math.max(-80, Math.min(80, centerLat)));
        const latLabelPoint = this.lonLatToCartesian(centerLon, latLine);
        const lonScreen = this.projectPointToScreen(lonLabelPoint, mMatrix, pMatrix, vMatrix);
        if (lonScreen) {
            this.gridText.addLonLatDivSet(`${lonLine.toFixed(0)}° lon`, lonScreen.x, lonScreen.y, 'lon');
        }
        const latScreen = this.projectPointToScreen(latLabelPoint, mMatrix, pMatrix, vMatrix);
        if (latScreen) {
            this.gridText.addLonLatDivSet(`${latLine.toFixed(0)}° lat`, latScreen.x, latScreen.y, 'lat');
        }
        this.gridText.resetDivSets();
    }
    projectPointToScreen(point, mMatrix, pMatrix, vMatrix) {
        const mvMatrix = mat4.create();
        const mvpMatrix = mat4.create();
        mat4.multiply(mvMatrix, vMatrix, mMatrix);
        mat4.multiply(mvpMatrix, pMatrix, mvMatrix);
        const clipspace = vec4.fromValues(point[0], point[1], point[2], 1);
        vec4.transformMat4(clipspace, clipspace, mvpMatrix);
        if (Math.abs(clipspace[3]) < 1e-6) {
            return null;
        }
        clipspace[0] /= clipspace[3];
        clipspace[1] /= clipspace[3];
        if (clipspace[0] < -1 || clipspace[0] > 1 || clipspace[1] < -1 || clipspace[1] > 1) {
            return null;
        }
        const canvasRect = super.webgl.canvas.getBoundingClientRect();
        return {
            x: canvasRect.left + (clipspace[0] * 0.5 + 0.5) * canvasRect.width,
            y: canvasRect.top + (clipspace[1] * -0.5 + 0.5) * canvasRect.height,
        };
    }
    roundToStep(value, step) {
        if (step <= 0)
            return value;
        return Math.round(value / step) * step;
    }
    normalizeLon(lonDeg) {
        let lon = lonDeg;
        while (lon < -180)
            lon += 360;
        while (lon > 180)
            lon -= 360;
        return lon;
    }
}
