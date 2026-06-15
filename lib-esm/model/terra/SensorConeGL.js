/*
 * AstroViewer
 * Copyright (C) Fabrizio Giordano
 * SPDX-License-Identifier: LicenseRef-AstroViewer-Dual-License
 */
import { FootprintShaderProgram } from '../../shader/FootprintShaderProgram.js';
import { CoordsType } from '../../utils/CoordsType.js';
import { Point } from '../Point.js';
export class SensorConeGL {
    _options;
    _webgl;
    static EARTH_RADIUS_KM = 6371;
    static ELEM_SIZE = 3;
    _kind = 'SensorConeGL';
    _lineBuffer = null;
    _lineVertexCount = 0;
    _isVisible = true;
    _shaderProgram;
    _color;
    constructor(_options, _webgl) {
        this._options = _options;
        this._webgl = _webgl;
        this._shaderProgram = new FootprintShaderProgram(this._webgl);
        this._color = _options.color ?? [0.0, 1.0, 0.95, 0.68];
    }
    setGeometry(apex, footprint) {
        if (!isValidPoint(apex)) {
            this.clear();
            return;
        }
        const ring = normalizeFootprintRing(footprint);
        if (ring.length < 3 || crossesAntimeridian(ring)) {
            this.clear();
            return;
        }
        const apexVertex = lonLatAltToWorld(apex);
        const footprintVertices = ring.map(([longitudeDeg, latitudeDeg]) => (lonLatAltToWorld({ longitudeDeg, latitudeDeg, altitudeKm: 0 })));
        const vertices = this.buildLineVertices(apexVertex, footprintVertices);
        this.uploadLineVertices(vertices);
    }
    setIsVisible(isVisible) {
        this._isVisible = isVisible;
    }
    setColor(color) {
        this._color = color;
    }
    clear() {
        this._lineVertexCount = 0;
        if (this._lineBuffer) {
            this._webgl.deleteBuffer(this._lineBuffer);
            this._lineBuffer = null;
        }
    }
    draw(pMatrix, vMatrix, baseModelMatrix) {
        if (!this._isVisible)
            return;
        if (!this._lineBuffer || this._lineVertexCount === 0)
            return;
        const gl = this._webgl;
        const previousBlend = gl.isEnabled(gl.BLEND);
        const previousDepthTest = gl.isEnabled(gl.DEPTH_TEST);
        const previousCullFace = gl.isEnabled(gl.CULL_FACE);
        const previousDepthMask = gl.getParameter(gl.DEPTH_WRITEMASK);
        const previousDepthFunc = gl.getParameter(gl.DEPTH_FUNC);
        const previousBlendSrcRgb = gl.getParameter(gl.BLEND_SRC_RGB);
        const previousBlendDstRgb = gl.getParameter(gl.BLEND_DST_RGB);
        const previousBlendSrcAlpha = gl.getParameter(gl.BLEND_SRC_ALPHA);
        const previousBlendDstAlpha = gl.getParameter(gl.BLEND_DST_ALPHA);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.DEPTH_TEST);
        gl.depthMask(false);
        gl.disable(gl.CULL_FACE);
        this._shaderProgram.enableShaders(pMatrix, baseModelMatrix, vMatrix);
        gl.uniform4f(this._shaderProgram.locations.color, this._color[0], this._color[1], this._color[2], this._color[3]);
        gl.bindBuffer(gl.ARRAY_BUFFER, this._lineBuffer);
        gl.vertexAttribPointer(this._shaderProgram.locations.position, SensorConeGL.ELEM_SIZE, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this._shaderProgram.locations.position);
        gl.drawArrays(gl.LINES, 0, this._lineVertexCount);
        gl.disableVertexAttribArray(this._shaderProgram.locations.position);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.depthMask(previousDepthMask);
        gl.depthFunc(previousDepthFunc);
        gl.blendFuncSeparate(previousBlendSrcRgb, previousBlendDstRgb, previousBlendSrcAlpha, previousBlendDstAlpha);
        if (previousCullFace)
            gl.enable(gl.CULL_FACE);
        else
            gl.disable(gl.CULL_FACE);
        if (previousDepthTest)
            gl.enable(gl.DEPTH_TEST);
        else
            gl.disable(gl.DEPTH_TEST);
        if (previousBlend)
            gl.enable(gl.BLEND);
        else
            gl.disable(gl.BLEND);
    }
    dispose() {
        this.clear();
    }
    buildLineVertices(apex, footprintVertices) {
        const vertexCount = footprintVertices.length * 4;
        const vertices = new Float32Array(vertexCount * SensorConeGL.ELEM_SIZE);
        let offset = 0;
        for (const vertex of footprintVertices) {
            offset = writeVertex(vertices, offset, apex);
            offset = writeVertex(vertices, offset, vertex);
        }
        for (let index = 0; index < footprintVertices.length; index++) {
            const current = footprintVertices[index];
            const next = footprintVertices[(index + 1) % footprintVertices.length];
            offset = writeVertex(vertices, offset, current);
            offset = writeVertex(vertices, offset, next);
        }
        return vertices;
    }
    uploadLineVertices(vertices) {
        if (!this._lineBuffer) {
            this._lineBuffer = this._webgl.createBuffer();
        }
        if (!this._lineBuffer) {
            throw new Error(`Could not create SensorConeGL line buffer for ${this._options.name}`);
        }
        this._webgl.bindBuffer(this._webgl.ARRAY_BUFFER, this._lineBuffer);
        this._webgl.bufferData(this._webgl.ARRAY_BUFFER, vertices, this._webgl.DYNAMIC_DRAW);
        this._webgl.bindBuffer(this._webgl.ARRAY_BUFFER, null);
        this._lineVertexCount = vertices.length / SensorConeGL.ELEM_SIZE;
    }
}
function normalizeFootprintRing(footprint) {
    const ring = [];
    for (const coordinate of footprint) {
        if (!Array.isArray(coordinate) || coordinate.length < 2)
            return [];
        const longitudeDeg = Number(coordinate[0]);
        const latitudeDeg = Number(coordinate[1]);
        if (!isValidLonLat(longitudeDeg, latitudeDeg))
            return [];
        ring.push([normalizeLongitudeDeg(longitudeDeg), latitudeDeg]);
    }
    while (ring.length > 1 && sameLonLat(ring[0], ring[ring.length - 1])) {
        ring.pop();
    }
    const unique = new Set(ring.map(([longitudeDeg, latitudeDeg]) => (`${longitudeDeg.toFixed(9)},${latitudeDeg.toFixed(9)}`)));
    return unique.size >= 3 ? ring : [];
}
function lonLatAltToWorld(point) {
    const geoPoint = new Point({
        lonDeg: normalizeLongitudeDeg(point.longitudeDeg),
        latDeg: point.latitudeDeg,
    }, CoordsType.GEOGRAPHIC);
    const radialScale = 1 + Math.max(0, point.altitudeKm ?? 0) / SensorConeGL.EARTH_RADIUS_KM;
    return [
        geoPoint.x * radialScale,
        geoPoint.y * radialScale,
        geoPoint.z * radialScale,
    ];
}
function writeVertex(vertices, offset, vertex) {
    vertices[offset] = vertex[0];
    vertices[offset + 1] = vertex[1];
    vertices[offset + 2] = vertex[2];
    return offset + SensorConeGL.ELEM_SIZE;
}
function isValidPoint(point) {
    return isValidLonLat(point.longitudeDeg, point.latitudeDeg)
        && (point.altitudeKm === undefined || Number.isFinite(point.altitudeKm));
}
function isValidLonLat(longitudeDeg, latitudeDeg) {
    return Number.isFinite(longitudeDeg)
        && Number.isFinite(latitudeDeg)
        && latitudeDeg >= -90
        && latitudeDeg <= 90;
}
function sameLonLat(left, right) {
    return Math.abs(left[0] - right[0]) < 1e-9
        && Math.abs(left[1] - right[1]) < 1e-9;
}
function crossesAntimeridian(ring) {
    for (let index = 0; index < ring.length; index++) {
        const current = ring[index];
        const next = ring[(index + 1) % ring.length];
        if (Math.abs(normalizeLongitudeDeg(next[0]) - normalizeLongitudeDeg(current[0])) > 180) {
            return true;
        }
    }
    return false;
}
function normalizeLongitudeDeg(longitudeDeg) {
    const normalized = ((((longitudeDeg + 180) % 360) + 360) % 360) - 180;
    return Object.is(normalized, -0) ? 0 : normalized;
}
