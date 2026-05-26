/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 146:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Source = void 0;
const healpixjs_1 = __webpack_require__(1138);
const Global_js_1 = __importDefault(__webpack_require__(4382));
class Source {
    _point;
    _name;
    _details;
    _h_pix;
    _shapesize;
    _brightnessFactor;
    /**
     * @param in_point Point.js (Cartesian/RA-Dec wrapper)
     * @param in_details Optional array of key/value metadata
     */
    constructor(in_point, in_details = []) {
        this._point = in_point;
        this._details = in_details;
        this._shapesize = 16.0;
        this._brightnessFactor = -99;
        this.computeHealpixPixel();
    }
    getDetailByindex(index) {
        if (index < 0 || index >= this._details.length) {
            return undefined;
        }
        return this._details[index];
    }
    get details() {
        return this._details;
    }
    computeHealpixPixel() {
        // Get Healpix instance from global
        const healpix = Global_js_1.default.getHealpix(Global_js_1.default.nsideForSelection);
        const vec3 = new healpixjs_1.Vec3(this._point.x, this._point.y, this._point.z);
        const ptg = new healpixjs_1.Pointing(vec3, false);
        this._h_pix = healpix.ang2pix(ptg, false);
    }
    get point() {
        return this._point;
    }
    get name() {
        return this._name;
    }
    get healpixPixel() {
        return this._h_pix;
    }
    get shapeSize() {
        return this._shapesize;
    }
    set shapeSize(size) {
        this._shapesize = size;
    }
    get brightnessFactor() {
        return this._brightnessFactor;
    }
    /**
     * @param factor Must be in [-1..1]
     */
    set brightnessFactor(factor) {
        this._brightnessFactor = factor;
    }
}
exports.Source = Source;


/***/ }),

/***/ 149:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.XYZShaderProgram = void 0;
const ColorMaps_js_1 = __webpack_require__(619);
class XYZShaderProgram {
    locations;
    _webgl;
    _shaderProgram;
    _colorMapBlockIndex = null;
    _colorMapBuffer = null;
    _runtimeColorMap;
    _colorMapVariableInfo = {
        r_palette: { index: 0, offset: 0 },
        g_palette: { index: 0, offset: 0 },
        b_palette: { index: 0, offset: 0 },
    };
    constructor(webgl) {
        this._webgl = webgl;
        this.locations = {
            pMatrix: null,
            mMatrix: null,
            vMatrix: null,
            sampler: null,
            colorMapIdx: null,
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
    setRuntimeColorMap(colorMap) {
        this._runtimeColorMap = colorMap;
    }
    enableShaders(pMatrix, vMatrix, mMatrix, colorMapIdx = 0) {
        const gl = this._webgl;
        const program = this.shaderProgram;
        gl.useProgram(program);
        this.locations.pMatrix = gl.getUniformLocation(program, 'uPMatrix');
        this.locations.mMatrix = gl.getUniformLocation(program, 'uMMatrix');
        this.locations.vMatrix = gl.getUniformLocation(program, 'uVMatrix');
        this.locations.sampler = gl.getUniformLocation(program, 'uSampler');
        this.locations.colorMapIdx = gl.getUniformLocation(program, 'cmapIdx');
        this.locations.vertexPositionAttribute = gl.getAttribLocation(program, 'aVertexPosition');
        this.locations.textureCoordAttribute = gl.getAttribLocation(program, 'aTextureCoord');
        gl.uniformMatrix4fv(this.locations.pMatrix, false, pMatrix);
        gl.uniformMatrix4fv(this.locations.vMatrix, false, vMatrix);
        gl.uniformMatrix4fv(this.locations.mMatrix, false, mMatrix);
        gl.uniform1i(this.locations.sampler, 0);
        gl.uniform1i(this.locations.colorMapIdx, colorMapIdx);
        if (colorMapIdx >= 2) {
            this.uploadColorMap(colorMapIdx);
        }
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
      uniform int cmapIdx;

      layout (std140) uniform colormap {
        float r_palette[256];
        float g_palette[256];
        float b_palette[256];
      };

      out vec4 outColor;

      void main(void) {
        vec4 color = texture(uSampler, vTextureCoord);

        if (cmapIdx == 1) {
          float gray = 0.21 * color.r + 0.71 * color.g + 0.07 * color.b;
          outColor = vec4(vec3(gray), color.a);
          return;
        }

        if (cmapIdx >= 2) {
          int rIndex = int(clamp(color.r * 255.0, 0.0, 255.0));
          int gIndex = int(clamp(color.g * 255.0, 0.0, 255.0));
          int bIndex = int(clamp(color.b * 255.0, 0.0, 255.0));

          outColor = vec4(
            r_palette[rIndex] / 256.0,
            g_palette[gIndex] / 256.0,
            b_palette[bIndex] / 256.0,
            color.a
          );
          return;
        }

        outColor = color;
      }`);
        gl.attachShader(this._shaderProgram, vertexShader);
        gl.attachShader(this._shaderProgram, fragmentShader);
        gl.linkProgram(this._shaderProgram);
        if (!gl.getProgramParameter(this._shaderProgram, gl.LINK_STATUS)) {
            throw new Error(gl.getProgramInfoLog(this._shaderProgram) || 'Could not initialise XYZ shaders');
        }
        this.initColorMapBuffer();
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
    initColorMapBuffer() {
        const gl = this._webgl;
        const program = this._shaderProgram;
        const blockIndex = gl.getUniformBlockIndex(program, 'colormap');
        if (blockIndex === gl.INVALID_INDEX) {
            this._colorMapBlockIndex = null;
            return;
        }
        this._colorMapBlockIndex = blockIndex;
        const variableNames = ['r_palette', 'g_palette', 'b_palette'];
        const variableIndices = gl.getUniformIndices(program, variableNames);
        const variableOffsets = gl.getActiveUniforms(program, variableIndices, gl.UNIFORM_OFFSET);
        variableNames.forEach((name, index) => {
            this._colorMapVariableInfo[name] = {
                index: variableIndices[index],
                offset: variableOffsets[index],
            };
        });
        this._colorMapBuffer = gl.createBuffer();
        gl.bindBuffer(gl.UNIFORM_BUFFER, this._colorMapBuffer);
        gl.bufferData(gl.UNIFORM_BUFFER, 3 * 4096, gl.STATIC_DRAW);
        gl.bindBuffer(gl.UNIFORM_BUFFER, null);
        gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, this._colorMapBuffer);
        gl.uniformBlockBinding(program, blockIndex, 0);
    }
    uploadColorMap(colorMapIdx) {
        if (!this._colorMapBuffer || this._colorMapBlockIndex === null) {
            return;
        }
        const colorMap = this.getColorMap(colorMapIdx);
        if (!colorMap) {
            return;
        }
        const gl = this._webgl;
        const program = this.shaderProgram;
        gl.uniformBlockBinding(program, this._colorMapBlockIndex, 0);
        gl.bindBuffer(gl.UNIFORM_BUFFER, this._colorMapBuffer);
        const info = this._colorMapVariableInfo;
        gl.bufferSubData(gl.UNIFORM_BUFFER, info.r_palette.offset, colorMap.r, 0);
        gl.bufferSubData(gl.UNIFORM_BUFFER, info.g_palette.offset, colorMap.g, 0);
        gl.bufferSubData(gl.UNIFORM_BUFFER, info.b_palette.offset, colorMap.b, 0);
        gl.bindBuffer(gl.UNIFORM_BUFFER, null);
    }
    getColorMap(colorMapIdx) {
        switch (colorMapIdx) {
            case 2:
                return ColorMaps_js_1.ColorMaps.planck;
            case 3:
                return ColorMaps_js_1.ColorMaps.cmb;
            case 4:
                return ColorMaps_js_1.ColorMaps.rainbow;
            case 5:
                return ColorMaps_js_1.ColorMaps.eosb;
            case 6:
                return ColorMaps_js_1.ColorMaps.cubehelix;
            case 7:
                return ColorMaps_js_1.ColorMaps.hot;
            case 8:
                return ColorMaps_js_1.ColorMaps.gray;
            default:
                return this._runtimeColorMap;
        }
    }
}
exports.XYZShaderProgram = XYZShaderProgram;


/***/ }),

/***/ 229:
/***/ ((__unused_webpack_module, exports) => {

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
// FoVHelper.ts

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.fovHelper = void 0;
class FoVHelper {
    static LEVEL_HYSTERESIS = 0.12;
    static HIPS_ORDER_MIN_FOV = {
        0: 179,
        1: 90,
        2: 30,
        3: 20,
        4: 6,
        5: 3.2,
        6: 1.6,
        7: 0.85,
        8: 0.42,
        9: 0.21,
        10: 0.12,
        11: 0.06,
        12: 0.015,
        13: 0,
    };
    getHiPSNorder(fov, currentOrder) {
        const rawOrder = this.getRawHiPSNorder(fov);
        if (currentOrder === undefined || currentOrder === rawOrder)
            return rawOrder;
        if (rawOrder > currentOrder) {
            const boundary = FoVHelper.HIPS_ORDER_MIN_FOV[currentOrder];
            if (boundary > 0 && fov > boundary * (1 - FoVHelper.LEVEL_HYSTERESIS))
                return currentOrder;
        }
        else {
            const boundary = FoVHelper.HIPS_ORDER_MIN_FOV[rawOrder];
            if (boundary > 0 && fov < boundary * (1 + FoVHelper.LEVEL_HYSTERESIS))
                return currentOrder;
        }
        return rawOrder;
    }
    getRawHiPSNorder(fov) {
        if (fov >= 179)
            return 0;
        if (fov >= 90)
            return 1;
        if (fov >= 30)
            return 2;
        if (fov >= 20)
            return 3;
        if (fov >= 6)
            return 4;
        if (fov >= 3.2)
            return 5;
        if (fov >= 1.6)
            return 6;
        if (fov >= 0.85)
            return 7;
        if (fov >= 0.42)
            return 8;
        if (fov >= 0.21)
            return 9;
        if (fov >= 0.12)
            return 10;
        if (fov >= 0.06)
            return 11;
        if (fov >= 0.015)
            return 12;
        return 13;
    }
    getRADegSteps(fov, coarse = false) {
        let raStep;
        let decStep;
        if (coarse && fov < 0.21) {
            raStep = 10;
            decStep = 10;
        }
        else if (fov >= 179) {
            raStep = 10;
            decStep = 10;
        }
        else if (fov >= 25) {
            raStep = 9;
            decStep = 9;
        }
        else if (fov >= 12.5) {
            raStep = 8;
            decStep = 8;
        }
        else if (fov >= 6) {
            raStep = 6;
            decStep = 6;
        }
        else if (fov >= 3.2) {
            raStep = 5;
            decStep = 5;
        }
        else if (fov >= 1.6) {
            raStep = 4;
            decStep = 4;
        }
        else if (fov >= 0.85) {
            raStep = 3;
            decStep = 3;
        }
        else if (fov >= 0.42) {
            raStep = 2;
            decStep = 2;
        }
        else if (fov >= 0.21) {
            raStep = 1;
            decStep = 1;
        }
        else if (fov >= 0.12) {
            raStep = 0.5;
            decStep = 0.5;
        }
        else if (fov >= 0.06) {
            raStep = 0.25;
            decStep = 0.25;
        }
        else {
            raStep = 10;
            decStep = 10;
        }
        return { raStep, decStep };
    }
    getRefOrder(order) {
        switch (order) {
            case 0:
            case 1:
            case 2:
            case 3:
                return order + 6;
            case 4:
            case 5:
            case 6:
            case 7:
                return order + 5;
            case 8:
                return order + 4;
            default:
                return order + 3;
        }
    }
}
exports.fovHelper = new FoVHelper();
exports["default"] = FoVHelper;


/***/ }),

/***/ 592:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FootprintSetGL = void 0;
const Footprint_js_1 = __webpack_require__(2475);
const Utils_js_1 = __webpack_require__(7930);
const FootprintShaderProgram_js_1 = __webpack_require__(8909);
const Point_js_1 = __webpack_require__(6553);
const GeomUtils_js_1 = __importDefault(__webpack_require__(2930));
const CoordsType_js_1 = __webpack_require__(8145);
const MetadataManager_js_1 = __webpack_require__(5403);
class FootprintSetGL {
    static ELEM_SIZE = 3;
    static BYTES_X_ELEM = new Float32Array().BYTES_PER_ELEMENT;
    static CONVEXPOLY_ELEM_SIZE = 3;
    _kind = "FootprintSetGL";
    _ready;
    // footprintsetProps: FootprintProps
    _name;
    _description;
    // tapRepo: TapRepo
    extHoveredIndexes;
    oldMouseCoords;
    healpixDensityMap;
    totConvexPoints;
    // footprintsInPix256: Map<number, Footprint[]>
    // gl: GL;
    // shaderProgram: WebGLProgram
    vertexCataloguePositionBuffer;
    indexBuffer;
    hoveredVertexPositionBuffer;
    hoveredIndexBuffer;
    selectedVertexPositionBuffer;
    selectedIndexBuffer;
    indexes;
    footprintPolygons = [];
    vertexCataloguePosition;
    totPoints;
    nPrimitiveFlags = 0;
    hoveredIndexes;
    hoveredElementIndexes;
    _hoveredFootprints = [];
    hoveredVertexPosition;
    totHoveredPoints;
    nHoveredPrimitiveFlags = 0;
    selectedIndexes;
    selectedElementIndexes;
    _selectedFootprints = [];
    selectedVertexPosition;
    totSelectedPoints;
    nSlectedPrimitiveFlags = 0;
    _shapeColor = "#00fff2ff";
    _coordsType = CoordsType_js_1.CoordsType.ASTRO;
    _bufferInitialised = false;
    _webgl;
    _isVisible = true;
    _metadataManager;
    _providerUrl;
    _footprintShaderProgram;
    _visibleTilesManager;
    constructor(fsetName, fsetDescription, providerUrl, metadataManager, webgl, visibleTilesManager) {
        this._webgl = webgl;
        this._ready = false;
        this._visibleTilesManager = visibleTilesManager;
        this.TYPE = "FOOTPRINT_SET";
        this._name = fsetName;
        this._description = fsetDescription;
        this._providerUrl = providerUrl;
        this._metadataManager = metadataManager;
        this.initFootprintArrays();
        this.oldMouseCoords = null;
        this._footprintShaderProgram = new FootprintShaderProgram_js_1.FootprintShaderProgram(this._webgl);
        this._footprintShaderProgram.shaderProgram;
    }
    initFootprintArrays() {
        this.footprintPolygons = [];
        this.indexes = new Uint32Array();
        this.vertexCataloguePosition = new Float32Array();
        this.totPoints = 0;
        this.totConvexPoints = 0;
        this.extHoveredIndexes = new Uint32Array();
        this._hoveredFootprints = [];
        this.hoveredVertexPosition = new Float32Array();
        this.totHoveredPoints = 0;
        this.hoveredIndexes = [];
        this.hoveredElementIndexes = new Uint32Array();
        this._selectedFootprints = [];
        this.selectedVertexPosition = new Float32Array();
        this.totSelectedPoints = 0;
        this.selectedIndexes = [];
        this.selectedElementIndexes = new Uint32Array();
    }
    initGLBuffers() {
        if (!this._webgl)
            return;
        this.vertexCataloguePositionBuffer = this._webgl.createBuffer();
        this.indexBuffer = this._webgl.createBuffer();
        this.hoveredVertexPositionBuffer = this._webgl.createBuffer();
        this.hoveredIndexBuffer = this._webgl.createBuffer();
        this.selectedVertexPositionBuffer = this._webgl.createBuffer();
        this.selectedIndexBuffer = this._webgl.createBuffer();
    }
    setIsVisible(visibility) {
        this._isVisible = visibility;
    }
    get isVisible() {
        return this._isVisible;
    }
    get shapeColor() {
        return this._shapeColor;
    }
    get providerUrl() {
        return this._providerUrl;
    }
    get name() {
        return this._name;
    }
    get metadataManager() {
        return this._metadataManager;
    }
    addFootprint(in_footprint) {
        this.footprintPolygons.push(in_footprint);
    }
    // addFootprints(in_data: any[], columnsmeta: TapMetadata[]): void {
    addFootprints(in_data, columnsmeta) {
        this._ready = false;
        this._metadataManager = new MetadataManager_js_1.MetadataManager(columnsmeta);
        // const geomDataIndex = this.footprintsetProps.geomColumn?.index
        const geomDataIndex = this._metadataManager.selectedOutlineColumn?.index ?? -1;
        if (geomDataIndex < 0) {
            throw new Error("geomColumn or its index is undefined in footprintsetProps");
        }
        for (let j = 0; j < in_data.length; j++) {
            if (in_data[j][geomDataIndex] !== null) {
                const footprint = new Footprint_js_1.Footprint(in_data[j][geomDataIndex], in_data[j], undefined, this._coordsType);
                if (footprint._valid) {
                    this.addFootprint(footprint);
                    this.totPoints += footprint.totPoints;
                    this.totConvexPoints += footprint.totConvexPoints;
                }
            }
        }
        // this.initBuffer()
        this._ready = true;
        this._bufferInitialised = false;
    }
    clearFootprints() {
        this.initFootprintArrays();
    }
    initBuffer() {
        // this._webgl = webgl
        if (!this._webgl)
            return;
        this.initGLBuffers();
        const nFootprints = this.footprintPolygons.length;
        let npolygons = nFootprints - 1;
        for (let j = 0; j < nFootprints; j++) {
            npolygons += this.footprintPolygons[j].polygons.length - 1;
        }
        this.indexes = new Uint32Array(this.totPoints + npolygons + 1);
        const MAX_UNSIGNED_INT = 0xffffffff;
        this._webgl.bindBuffer(this._webgl.ARRAY_BUFFER, this.vertexCataloguePositionBuffer);
        this.vertexCataloguePosition = new Float32Array(3 * this.totPoints);
        let positionIndex = 0;
        let vIdx = 0;
        const R = 1.0;
        this.nPrimitiveFlags = 0;
        for (let j = 0; j < nFootprints; j++) {
            const footprint = this.footprintPolygons[j];
            const footprintPoly = footprint.polygons;
            if (j > 0) {
                this.indexes[vIdx++] = MAX_UNSIGNED_INT;
                this.nPrimitiveFlags++;
            }
            for (const poly of footprintPoly) {
                if (poly !== footprintPoly[0]) {
                    this.indexes[vIdx++] = MAX_UNSIGNED_INT;
                    this.nPrimitiveFlags++;
                }
                for (const point of poly) {
                    this.vertexCataloguePosition[positionIndex++] = R * point.x;
                    this.vertexCataloguePosition[positionIndex++] = R * point.y;
                    this.vertexCataloguePosition[positionIndex++] = R * point.z;
                    this.indexes[vIdx++] = Math.floor((positionIndex - 1) / 3);
                }
            }
        }
        this.indexes[this.indexes.length - 1] = MAX_UNSIGNED_INT;
        this._webgl.bindBuffer(this._webgl.ARRAY_BUFFER, this.vertexCataloguePositionBuffer);
        this._webgl.bufferData(this._webgl.ARRAY_BUFFER, this.vertexCataloguePosition, this._webgl.STATIC_DRAW);
        this._webgl.bindBuffer(this._webgl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        this._webgl.bufferData(this._webgl.ELEMENT_ARRAY_BUFFER, this.indexes, this._webgl.STATIC_DRAW);
        this._bufferInitialised = true;
        console.log("Buffer initialized");
    }
    checkSelection(mouseHelper) {
        if (!mouseHelper.x || !mouseHelper.y || !mouseHelper.z)
            return;
        let mousePix = mouseHelper.computeNpix();
        if (!mousePix)
            return;
        this._hoveredFootprints = [];
        this.totHoveredPoints = 0;
        const mousePoint = new Point_js_1.Point({ x: mouseHelper.x, y: mouseHelper.y, z: mouseHelper.z }, CoordsType_js_1.CoordsType.CARTESIAN);
        for (let i = 0; i < this.footprintPolygons.length; i++) {
            const footprint = this.footprintPolygons[i];
            if (!footprint.selectionObj)
                continue;
            if (GeomUtils_js_1.default.checkPointInsidePolygon5(footprint.selectionObj, mousePoint)) {
                const details = [...footprint.details];
                // const geomDataIndex = this.footprintsetProps.geomColumn?.index
                const geomDataIndex = this._metadataManager.selectedOutlineColumn?.index ?? -1;
                if (geomDataIndex >= 0)
                    details.splice(geomDataIndex, 1);
                this._hoveredFootprints.push(footprint);
                this.totHoveredPoints += footprint.totPoints;
            }
        }
        this.initHoveringBuffer();
    }
    get hoveredFootprints() {
        return {
            // metadata: this.footprintsetProps.tapMetadataList,
            metadata: this._metadataManager,
            footprints: this._hoveredFootprints,
            tableName: this._name,
            description: this._description,
            // provider: this.tapRepo.tapBaseUrl
            provider: this._providerUrl,
        };
    }
    get selectedFootprints() {
        return this._selectedFootprints;
    }
    checkClicking(in_mouseHelper) {
        if (in_mouseHelper.x == null ||
            in_mouseHelper.y == null ||
            in_mouseHelper.z == null) {
            return [];
        }
        const clickedIndexes = [];
        const mousePoint = new Point_js_1.Point({ x: in_mouseHelper.x, y: in_mouseHelper.y, z: in_mouseHelper.z }, CoordsType_js_1.CoordsType.CARTESIAN);
        for (let i = 0; i < this.footprintPolygons.length; i++) {
            const footprint = this.footprintPolygons[i];
            if (!footprint.selectionObj)
                continue;
            if (GeomUtils_js_1.default.checkPointInsidePolygon5(footprint.selectionObj, mousePoint)) {
                clickedIndexes.push(i);
            }
        }
        return clickedIndexes;
    }
    setSelectedIndexes(selectedIndex) {
        selectedIndex.forEach((idx) => {
            if (idx < 0 || idx >= this.footprintPolygons.length)
                return;
            if (this.selectedIndexes.includes(idx)) {
                this.selectedIndexes.splice(this.selectedIndexes.indexOf(idx), 1);
            }
            else {
                this.selectedIndexes.push(idx);
            }
        });
        this.refreshSelectedFootprints();
    }
    refreshSelectedFootprints() {
        this._selectedFootprints = this.selectedIndexes
            .map((idx) => this.footprintPolygons[idx])
            .filter((footprint) => Boolean(footprint));
        this.totSelectedPoints = this._selectedFootprints.reduce((total, footprint) => total + footprint.totPoints, 0);
        if (this._selectedFootprints.length === 0) {
            this.selectedVertexPosition = new Float32Array();
            this.selectedElementIndexes = new Uint32Array();
            this.nSlectedPrimitiveFlags = 0;
            return;
        }
        this.initSelectionBuffer();
    }
    getFootprintsFromPointer(in_mouseHelper) {
        const pickedIndexes = this.checkClicking(in_mouseHelper);
        if (!pickedIndexes.length) {
            return {
                footprints: [],
                pickedIndexes: [],
            };
        }
        const footprints = [];
        pickedIndexes.forEach((idx) => {
            const footprint = this.footprintPolygons[idx];
            if (footprint)
                footprints.push(footprint);
        });
        return footprints.length ? { footprints, pickedIndexes } : null;
    }
    selectPrimaryFootprintFromClick(in_mouseHelper) {
        const picked = this.getFootprintsFromPointer(in_mouseHelper);
        const clickedIndexes = picked?.pickedIndexes ?? [];
        this.setSelectedIndexes(clickedIndexes);
        if (!clickedIndexes.length) {
            return {
                footprints: [],
                selectionState: [],
            };
        }
        const selectionState = [];
        const selectedFootprints = [];
        clickedIndexes.forEach((idx) => {
            const footprint = this.footprintPolygons[idx];
            if (!footprint)
                return;
            const selected = this.selectedIndexes.includes(idx);
            selectionState.push({ footprint, selected });
            selectedFootprints.push(footprint);
        });
        return selectedFootprints.length
            ? { footprints: selectedFootprints, selectionState }
            : null;
    }
    // highlightFootprint(footprint: Footprint, highlighted: boolean) {
    //   if (highlighted) {
    //     this._hoveredFootprints.push(footprint)
    //     this.totHoveredPoints += footprint.totPoints
    //   } else {
    //     const indexOfFootprint = this._hoveredFootprints.indexOf(footprint)
    //     this._hoveredFootprints.splice(indexOfFootprint, 1)
    //     this.totHoveredPoints -= footprint.totPoints
    //   }
    //   this.initHoveringBuffer()
    // }
    /**
     *
     * @param {Footprint[]} footprints
     */
    // addFootprint2Selected(footprints: Footprint[]) {
    //   let refreshBuffer = false
    //   for (let f of footprints) {
    //     if (!this._selectedFootprints.includes(f)) {
    //       this._selectedFootprints.push(f)
    //       this.totSelectedPoints += f.totPoints
    //       refreshBuffer = true
    //     }
    //   }
    //   if (refreshBuffer) {
    //     this.initSelectionBuffer()
    //   }
    // }
    /**
     *
     * @param {Footprint} footprint
     */
    // removeFootprintFromSelection(footprint: Footprint) {
    //   const indexOfObject = this._selectedFootprints.indexOf(footprint)
    //   if (indexOfObject >= 0) {
    //     this._selectedFootprints.splice(indexOfObject, 1)
    //     this.totSelectedPoints -= footprint.totPoints
    //     if (this._selectedFootprints.length > 0) {
    //       this.initSelectionBuffer()
    //     }
    //   }
    // }
    FootprintPolygonMatches(left, right) {
        if (left === right)
            return true;
        const leftConvexPoly = left.convexPolygons;
        const rightConvexPoly = right.convexPolygons;
        if (leftConvexPoly !== rightConvexPoly ||
            leftConvexPoly !== rightConvexPoly) {
            return false;
        }
        if (left.details.length !== right.details.length) {
            return false;
        }
        for (let i = 0; i < left.details.length; i++) {
            if (!Object.is(left.details[i], right.details[i])) {
                return false;
            }
        }
        return true;
    }
    findFootprintPolygonIndex(footprint) {
        const footprintIndex = this.footprintPolygons.indexOf(footprint);
        if (footprintIndex >= 0) {
            return footprintIndex;
        }
        return this.footprintPolygons.findIndex((candidate) => this.FootprintPolygonMatches(candidate, footprint));
    }
    extHighlightFootprint(footprint, highlighted) {
        const sIdx = this.findFootprintPolygonIndex(footprint);
        if (sIdx < 0)
            return;
        const base = sIdx * FootprintSetGL.ELEM_SIZE;
        if (highlighted) {
            if (!this.hoveredIndexes.includes(sIdx)) {
                this.hoveredIndexes.push(sIdx);
            }
        }
        else {
            if (base + 4 >= this.vertexCataloguePosition.length)
                return;
            const i = this.hoveredIndexes.indexOf(sIdx);
            if (i >= 0) {
                this.hoveredIndexes.splice(i, 1);
            }
        }
    }
    extAddPolygons2Selected(footprint) {
        if (!this._bufferInitialised) {
            this.initBuffer();
        }
        const sIdx = this.findFootprintPolygonIndex(footprint);
        if (sIdx < 0)
            return;
        const base = sIdx * FootprintSetGL.ELEM_SIZE;
        if (!this.selectedIndexes.includes(sIdx)) {
            this.selectedIndexes.push(sIdx);
        }
        else {
            if (base + 4 >= this.vertexCataloguePosition.length)
                return;
            const i = this.selectedIndexes.indexOf(sIdx);
            if (i >= 0) {
                this.selectedIndexes.splice(i, 1);
            }
        }
        this.refreshSelectedFootprints();
    }
    initHoveringBuffer() {
        /*
                TODO better approach. when creating the indexbuffer of footprints,
                add 1 extra position for the selection (set to 0 == not selected),
                and save the position "positionIndex" in an array (selectionIndexes).
                When checking the selection, I get the index of the footprint, which
                matches with the index in the selectionIndexes to retrieve the position
                of the flag to be set to 1 in the vertexposition
                This will ease checking the selection in the vertex/fragment shader and
                set the pointsize and shape color.
                */
        if (!this._webgl)
            return;
        if (this._hoveredFootprints.length == 0) {
            return;
        }
        let nFootprints = this._hoveredFootprints.length;
        let npolygons = nFootprints - 1;
        for (let j = 0; j < nFootprints; j++) {
            npolygons += this._hoveredFootprints[j].polygons.length - 1;
        }
        // this._selectedIndex = new Uint16Array(this._totSelectedPoints + npolygons);
        // let MAX_UNSIGNED_SHORT = 65535; // this is used to enable and disable GL_PRIMITIVE_RESTART_FIXED_INDEX
        this.hoveredElementIndexes = new Uint32Array(this.totHoveredPoints + npolygons);
        const MAX_UNSIGNED_INT = 0xffffffff; // this is used to enable and disable GL_PRIMITIVE_RESTART_FIXED_INDEX
        // let MAX_UNSIGNED_SHORT = Number.MAX_SAFE_INTEGER;
        this._webgl.bindBuffer(this._webgl.ARRAY_BUFFER, this.hoveredVertexPositionBuffer);
        this.hoveredVertexPosition = new Float32Array(3 * this.totHoveredPoints);
        let positionIndex = 0;
        let vIdx = 0;
        let R = 1.0;
        this.nHoveredPrimitiveFlags = 0;
        for (let j = 0; j < nFootprints; j++) {
            let hoveredFootprintPoly = this._hoveredFootprints[j].polygons;
            if (j > 0) {
                this.hoveredElementIndexes[vIdx] = MAX_UNSIGNED_INT;
                this.nHoveredPrimitiveFlags += 1;
                vIdx += 1;
            }
            for (let polyIdx = 0; polyIdx < hoveredFootprintPoly.length; polyIdx++) {
                if (polyIdx > 0) {
                    this.hoveredElementIndexes[vIdx] = MAX_UNSIGNED_INT;
                    this.nHoveredPrimitiveFlags += 1;
                    vIdx += 1;
                }
                const poly = hoveredFootprintPoly[polyIdx];
                for (let pointIdx = 0; pointIdx < poly.length; pointIdx++) {
                    const p = poly[pointIdx];
                    this.hoveredVertexPosition[positionIndex] = R * p.x;
                    this.hoveredVertexPosition[positionIndex + 1] = R * p.y;
                    this.hoveredVertexPosition[positionIndex + 2] = R * p.z;
                    this.hoveredElementIndexes[vIdx] = Math.floor(positionIndex / 3);
                    vIdx += 1;
                    positionIndex += 3;
                }
            }
        }
    }
    initSelectionBuffer() {
        if (!this._webgl)
            return;
        if (this._selectedFootprints.length == 0) {
            return;
        }
        const nFootprints = this._selectedFootprints.length;
        let npolygons = nFootprints - 1;
        for (let j = 0; j < nFootprints; j++) {
            npolygons += this._selectedFootprints[j].polygons.length - 1;
        }
        this.selectedElementIndexes = new Uint32Array(this.totSelectedPoints + npolygons);
        const MAX_UNSIGNED_INT = 0xffffffff;
        this._webgl.bindBuffer(this._webgl.ARRAY_BUFFER, this.selectedVertexPositionBuffer);
        this.selectedVertexPosition = new Float32Array(3 * this.totSelectedPoints);
        let positionIndex = 0;
        let vIdx = 0;
        const R = 1.0;
        this.nSlectedPrimitiveFlags = 0;
        for (let j = 0; j < nFootprints; j++) {
            const footprintPoly = this._selectedFootprints[j].polygons;
            if (j > 0) {
                this.selectedElementIndexes[vIdx] = MAX_UNSIGNED_INT;
                this.nSlectedPrimitiveFlags += 1;
                vIdx += 1;
            }
            for (let polyIdx = 0; polyIdx < footprintPoly.length; polyIdx++) {
                if (polyIdx > 0) {
                    this.selectedElementIndexes[vIdx] = MAX_UNSIGNED_INT;
                    this.nSlectedPrimitiveFlags += 1;
                    vIdx += 1;
                }
                const poly = footprintPoly[polyIdx];
                for (let pointIdx = 0; pointIdx < poly.length; pointIdx++) {
                    const p = poly[pointIdx];
                    this.selectedVertexPosition[positionIndex] = R * p.x;
                    this.selectedVertexPosition[positionIndex + 1] = R * p.y;
                    this.selectedVertexPosition[positionIndex + 2] = R * p.z;
                    this.selectedElementIndexes[vIdx] = Math.floor(positionIndex / 3);
                    vIdx += 1;
                    positionIndex += 3;
                }
            }
        }
    }
    changeColor(color) {
        this._shapeColor = color;
    }
    draw(in_mMatrix, in_mouseHelper, vMatrix, pMatrix) {
        if (!this.isVisible)
            return;
        if (!this._ready)
            return;
        if (!vMatrix)
            return;
        // if (!global.camera) return
        if (!this._bufferInitialised)
            this.initBuffer();
        if (!this._webgl)
            return;
        this._footprintShaderProgram.enableShaders(pMatrix, in_mMatrix, vMatrix);
        // this._footprintShaderProgram.enableShaders(
        //   computePerspectiveMatrixSingleton.pMatrix as Float32Array,
        //   in_mMatrix,
        //   vMatrix
        // )
        if (in_mouseHelper != null && in_mouseHelper.xyz != this.oldMouseCoords) {
            this.checkSelection(in_mouseHelper);
        }
        if (this._hoveredFootprints.length > 0) {
            // TODO POINT_SIZE doesn't have any effect on line thickness!! it only applies to points
            const rgb = (0, Utils_js_1.colorHex2RGB)("#00FF00");
            const alpha = 1.0;
            this._webgl.uniform4f(this._footprintShaderProgram.locations.color, rgb[0], rgb[1], rgb[2], alpha);
            this._webgl.uniform1f(this._footprintShaderProgram.locations.pointSize, 14.0); // <--- POINT_SIZE in LINE_LOOP is not applicable
            this._webgl.bindBuffer(this._webgl.ARRAY_BUFFER, this.hoveredVertexPositionBuffer);
            this._webgl.bufferData(this._webgl.ARRAY_BUFFER, this.hoveredVertexPosition, this._webgl.STATIC_DRAW);
            // setting footprint position
            this._webgl.vertexAttribPointer(this._footprintShaderProgram.locations.position, FootprintSetGL.ELEM_SIZE, this._webgl.FLOAT, false, FootprintSetGL.BYTES_X_ELEM * FootprintSetGL.ELEM_SIZE, 0);
            this._webgl.enableVertexAttribArray(this._footprintShaderProgram.locations.position);
            this._webgl.bindBuffer(this._webgl.ELEMENT_ARRAY_BUFFER, this.hoveredIndexBuffer);
            this._webgl.bufferData(this._webgl.ELEMENT_ARRAY_BUFFER, this.hoveredElementIndexes, this._webgl.STATIC_DRAW);
            // this._gl.drawElements (this._gl.LINE_LOOP, this._selectedVertexPosition.length / 3 + this._nSlectedPrimitiveFlags,this._gl.UNSIGNED_SHORT, 0);
            this._webgl.drawElements(this._webgl.LINE_LOOP, this.hoveredVertexPosition.length / 3 + this.nHoveredPrimitiveFlags, this._webgl.UNSIGNED_INT, 0);
        }
        if (this._selectedFootprints.length > 0) {
            const rgb = (0, Utils_js_1.colorHex2RGB)("#ECB462");
            const alpha = 1.0;
            this._webgl.uniform4f(this._footprintShaderProgram.locations.color, rgb[0], rgb[1], rgb[2], alpha);
            this._webgl.uniform1f(this._footprintShaderProgram.locations.pointSize, 14.0); // <--- POINT_SIZE in LINE_LOOP is not applicable
            this._webgl.bindBuffer(this._webgl.ARRAY_BUFFER, this.selectedVertexPositionBuffer);
            this._webgl.bufferData(this._webgl.ARRAY_BUFFER, this.selectedVertexPosition, this._webgl.STATIC_DRAW);
            // setting footprint position
            this._webgl.vertexAttribPointer(this._footprintShaderProgram.locations.position, FootprintSetGL.ELEM_SIZE, this._webgl.FLOAT, false, FootprintSetGL.BYTES_X_ELEM * FootprintSetGL.ELEM_SIZE, 0);
            this._webgl.enableVertexAttribArray(this._footprintShaderProgram.locations.position);
            this._webgl.bindBuffer(this._webgl.ELEMENT_ARRAY_BUFFER, this.selectedIndexBuffer);
            this._webgl.bufferData(this._webgl.ELEMENT_ARRAY_BUFFER, this.selectedElementIndexes, this._webgl.STATIC_DRAW);
            // this._gl.drawElements (this._gl.LINE_LOOP, this._selectedVertexPosition.length / 3 + this._nSlectedPrimitiveFlags,this._gl.UNSIGNED_SHORT, 0);
            this._webgl.drawElements(this._webgl.LINE_LOOP, this.selectedVertexPosition.length / 3 + this.nSlectedPrimitiveFlags, this._webgl.UNSIGNED_INT, 0);
        }
        this._webgl.bindBuffer(this._webgl.ARRAY_BUFFER, this.vertexCataloguePositionBuffer);
        this._webgl.vertexAttribPointer(this._footprintShaderProgram.locations.position, FootprintSetGL.ELEM_SIZE, this._webgl.FLOAT, false, FootprintSetGL.BYTES_X_ELEM * FootprintSetGL.ELEM_SIZE, 0);
        this._webgl.enableVertexAttribArray(this._footprintShaderProgram.locations.position);
        this._webgl.bindBuffer(this._webgl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        // const shapeColor = [...colorHex2RGB(this.footprintsetProps.shapeColor), 1.0] as [number, number, number, number]
        const shapeColor = [...(0, Utils_js_1.colorHex2RGB)(this._shapeColor), 1.0];
        this._webgl.uniform4f(this._footprintShaderProgram.locations.color, ...shapeColor);
        this._webgl.drawElements(this._webgl.LINE_LOOP, this.indexes.length, this._webgl.UNSIGNED_INT, 0);
        this._webgl.bindBuffer(this._webgl.ARRAY_BUFFER, null);
        this._webgl.bindBuffer(this._webgl.ELEMENT_ARRAY_BUFFER, null);
        this.oldMouseCoords = in_mouseHelper.xyz;
    }
}
exports.FootprintSetGL = FootprintSetGL;
// export default FootprintSetGL


/***/ }),

/***/ 619:
/***/ ((__unused_webpack_module, exports) => {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ColorMaps = exports.COLOR_MAP_SAMPLE_COUNT = void 0;
exports.createColorMapFromSamples = createColorMapFromSamples;
exports.COLOR_MAP_SAMPLE_COUNT = 256;
function validateColorChannel(name, values) {
    if (!Array.isArray(values)) {
        throw new Error(`Channel "${name}" must be an array.`);
    }
    if (values.length !== exports.COLOR_MAP_SAMPLE_COUNT) {
        throw new Error(`Channel "${name}" must contain exactly ${exports.COLOR_MAP_SAMPLE_COUNT} samples.`);
    }
    for (let i = 0; i < values.length; i += 1) {
        const value = values[i];
        if (!Number.isFinite(value)) {
            throw new Error(`Channel "${name}" contains a non-finite value at index ${i}.`);
        }
        if (value < 0 || value > 255) {
            throw new Error(`Channel "${name}" contains an out-of-range value at index ${i}. Expected 0..255.`);
        }
    }
}
function packColorChannel(values) {
    const packed = new Float32Array(exports.COLOR_MAP_SAMPLE_COUNT * 4);
    for (let i = 0; i < exports.COLOR_MAP_SAMPLE_COUNT; i += 1) {
        packed[i * 4] = values[i];
    }
    return packed;
}
function createColorMapFromSamples(name, channels) {
    const trimmedName = name.trim();
    if (!trimmedName) {
        throw new Error("Color map name must not be empty.");
    }
    validateColorChannel("r", channels.r);
    validateColorChannel("g", channels.g);
    validateColorChannel("b", channels.b);
    return {
        name: trimmedName,
        r: packColorChannel(channels.r),
        g: packColorChannel(channels.g),
        b: packColorChannel(channels.b),
    };
}
exports.ColorMaps = {
    grayscale: {
        name: 'grayscale',
        r: new Float32Array([]),
        g: new Float32Array([]),
        b: new Float32Array([]),
        // r: [],
        // g: [],
        // b: [],
    },
    native: {
        name: 'native',
        r: new Float32Array([]),
        g: new Float32Array([]),
        b: new Float32Array([]),
        // r: [],
        // g: [],
        // b: [],
    },
    planck: {
        name: 'planck',
        r: new Float32Array([
            0.0, 0.0, 0.0, 0.0, 0.769231, 0.0, 0.0, 0.0, 1.53846, 0.0, 0.0, 0.0, 2.30769, 0.0, 0.0, 0.0,
            3.07692, 0.0, 0.0, 0.0, 3.84615, 0.0, 0.0, 0.0, 4.61538, 0.0, 0.0, 0.0, 5.38462, 0.0, 0.0,
            0.0, 6.15385, 0.0, 0.0, 0.0, 6.92308, 0.0, 0.0, 0.0, 7.69231, 0.0, 0.0, 0.0, 8.46154, 0.0,
            0.0, 0.0, 9.23077, 0.0, 0.0, 0.0, 10.0, 0.0, 0.0, 0.0, 11.5385, 0.0, 0.0, 0.0, 13.0769, 0.0,
            0.0, 0.0, 14.6154, 0.0, 0.0, 0.0, 16.1538, 0.0, 0.0, 0.0, 17.6923, 0.0, 0.0, 0.0, 19.2308,
            0.0, 0.0, 0.0, 20.7692, 0.0, 0.0, 0.0, 22.3077, 0.0, 0.0, 0.0, 23.8462, 0.0, 0.0, 0.0,
            25.3846, 0.0, 0.0, 0.0, 26.9231, 0.0, 0.0, 0.0, 28.4615, 0.0, 0.0, 0.0, 30.0, 0.0, 0.0, 0.0,
            33.8462, 0.0, 0.0, 0.0, 37.6923, 0.0, 0.0, 0.0, 41.5385, 0.0, 0.0, 0.0, 45.3846, 0.0, 0.0,
            0.0, 49.2308, 0.0, 0.0, 0.0, 53.0769, 0.0, 0.0, 0.0, 56.9231, 0.0, 0.0, 0.0, 60.7692, 0.0,
            0.0, 0.0, 64.6154, 0.0, 0.0, 0.0, 68.4615, 0.0, 0.0, 0.0, 72.3077, 0.0, 0.0, 0.0, 76.1538,
            0.0, 0.0, 0.0, 80.0, 0.0, 0.0, 0.0, 88.5385, 0.0, 0.0, 0.0, 97.0769, 0.0, 0.0, 0.0, 105.615,
            0.0, 0.0, 0.0, 114.154, 0.0, 0.0, 0.0, 122.692, 0.0, 0.0, 0.0, 131.231, 0.0, 0.0, 0.0,
            139.769, 0.0, 0.0, 0.0, 148.308, 0.0, 0.0, 0.0, 156.846, 0.0, 0.0, 0.0, 165.385, 0.0, 0.0,
            0.0, 173.923, 0.0, 0.0, 0.0, 182.462, 0.0, 0.0, 0.0, 191.0, 0.0, 0.0, 0.0, 193.846, 0.0, 0.0,
            0.0, 196.692, 0.0, 0.0, 0.0, 199.538, 0.0, 0.0, 0.0, 202.385, 0.0, 0.0, 0.0, 205.231, 0.0,
            0.0, 0.0, 208.077, 0.0, 0.0, 0.0, 210.923, 0.0, 0.0, 0.0, 213.769, 0.0, 0.0, 0.0, 216.615,
            0.0, 0.0, 0.0, 219.462, 0.0, 0.0, 0.0, 222.308, 0.0, 0.0, 0.0, 225.154, 0.0, 0.0, 0.0, 228.0,
            0.0, 0.0, 0.0, 229.182, 0.0, 0.0, 0.0, 230.364, 0.0, 0.0, 0.0, 231.545, 0.0, 0.0, 0.0,
            232.727, 0.0, 0.0, 0.0, 233.909, 0.0, 0.0, 0.0, 235.091, 0.0, 0.0, 0.0, 236.273, 0.0, 0.0,
            0.0, 237.455, 0.0, 0.0, 0.0, 238.636, 0.0, 0.0, 0.0, 239.818, 0.0, 0.0, 0.0, 241.0, 0.0, 0.0,
            0.0, 241.0, 0.0, 0.0, 0.0, 241.364, 0.0, 0.0, 0.0, 241.727, 0.0, 0.0, 0.0, 242.091, 0.0, 0.0,
            0.0, 242.455, 0.0, 0.0, 0.0, 242.818, 0.0, 0.0, 0.0, 243.182, 0.0, 0.0, 0.0, 243.545, 0.0,
            0.0, 0.0, 243.909, 0.0, 0.0, 0.0, 244.273, 0.0, 0.0, 0.0, 244.636, 0.0, 0.0, 0.0, 245.0, 0.0,
            0.0, 0.0, 245.231, 0.0, 0.0, 0.0, 245.462, 0.0, 0.0, 0.0, 245.692, 0.0, 0.0, 0.0, 245.923,
            0.0, 0.0, 0.0, 246.154, 0.0, 0.0, 0.0, 246.385, 0.0, 0.0, 0.0, 246.615, 0.0, 0.0, 0.0,
            246.846, 0.0, 0.0, 0.0, 247.077, 0.0, 0.0, 0.0, 247.308, 0.0, 0.0, 0.0, 247.538, 0.0, 0.0,
            0.0, 247.769, 0.0, 0.0, 0.0, 248.0, 0.0, 0.0, 0.0, 248.146, 0.0, 0.0, 0.0, 248.292, 0.0, 0.0,
            0.0, 248.438, 0.0, 0.0, 0.0, 248.585, 0.0, 0.0, 0.0, 248.731, 0.0, 0.0, 0.0, 248.877, 0.0,
            0.0, 0.0, 249.023, 0.0, 0.0, 0.0, 249.169, 0.0, 0.0, 0.0, 249.315, 0.0, 0.0, 0.0, 249.462,
            0.0, 0.0, 0.0, 249.608, 0.0, 0.0, 0.0, 249.754, 0.0, 0.0, 0.0, 249.9, 0.0, 0.0, 0.0, 249.312,
            0.0, 0.0, 0.0, 248.723, 0.0, 0.0, 0.0, 248.135, 0.0, 0.0, 0.0, 247.546, 0.0, 0.0, 0.0,
            246.958, 0.0, 0.0, 0.0, 246.369, 0.0, 0.0, 0.0, 245.781, 0.0, 0.0, 0.0, 245.192, 0.0, 0.0,
            0.0, 244.604, 0.0, 0.0, 0.0, 244.015, 0.0, 0.0, 0.0, 243.427, 0.0, 0.0, 0.0, 242.838, 0.0,
            0.0, 0.0, 242.25, 0.0, 0.0, 0.0, 239.308, 0.0, 0.0, 0.0, 236.365, 0.0, 0.0, 0.0, 233.423, 0.0,
            0.0, 0.0, 230.481, 0.0, 0.0, 0.0, 227.538, 0.0, 0.0, 0.0, 224.596, 0.0, 0.0, 0.0, 221.654,
            0.0, 0.0, 0.0, 218.712, 0.0, 0.0, 0.0, 215.769, 0.0, 0.0, 0.0, 212.827, 0.0, 0.0, 0.0,
            209.885, 0.0, 0.0, 0.0, 206.942, 0.0, 0.0, 0.0, 204.0, 0.0, 0.0, 0.0, 201.0, 0.0, 0.0, 0.0,
            198.0, 0.0, 0.0, 0.0, 195.0, 0.0, 0.0, 0.0, 192.0, 0.0, 0.0, 0.0, 189.0, 0.0, 0.0, 0.0, 186.0,
            0.0, 0.0, 0.0, 183.0, 0.0, 0.0, 0.0, 180.0, 0.0, 0.0, 0.0, 177.0, 0.0, 0.0, 0.0, 174.0, 0.0,
            0.0, 0.0, 171.0, 0.0, 0.0, 0.0, 168.0, 0.0, 0.0, 0.0, 165.0, 0.0, 0.0, 0.0, 161.077, 0.0, 0.0,
            0.0, 157.154, 0.0, 0.0, 0.0, 153.231, 0.0, 0.0, 0.0, 149.308, 0.0, 0.0, 0.0, 145.385, 0.0,
            0.0, 0.0, 141.462, 0.0, 0.0, 0.0, 137.538, 0.0, 0.0, 0.0, 133.615, 0.0, 0.0, 0.0, 129.692,
            0.0, 0.0, 0.0, 125.769, 0.0, 0.0, 0.0, 121.846, 0.0, 0.0, 0.0, 117.923, 0.0, 0.0, 0.0, 114.0,
            0.0, 0.0, 0.0, 115.038, 0.0, 0.0, 0.0, 116.077, 0.0, 0.0, 0.0, 117.115, 0.0, 0.0, 0.0,
            118.154, 0.0, 0.0, 0.0, 119.192, 0.0, 0.0, 0.0, 120.231, 0.0, 0.0, 0.0, 121.269, 0.0, 0.0,
            0.0, 122.308, 0.0, 0.0, 0.0, 123.346, 0.0, 0.0, 0.0, 124.385, 0.0, 0.0, 0.0, 125.423, 0.0,
            0.0, 0.0, 126.462, 0.0, 0.0, 0.0, 127.5, 0.0, 0.0, 0.0, 131.423, 0.0, 0.0, 0.0, 135.346, 0.0,
            0.0, 0.0, 139.269, 0.0, 0.0, 0.0, 143.192, 0.0, 0.0, 0.0, 147.115, 0.0, 0.0, 0.0, 151.038,
            0.0, 0.0, 0.0, 154.962, 0.0, 0.0, 0.0, 158.885, 0.0, 0.0, 0.0, 162.808, 0.0, 0.0, 0.0,
            166.731, 0.0, 0.0, 0.0, 170.654, 0.0, 0.0, 0.0, 174.577, 0.0, 0.0, 0.0, 178.5, 0.0, 0.0, 0.0,
            180.462, 0.0, 0.0, 0.0, 182.423, 0.0, 0.0, 0.0, 184.385, 0.0, 0.0, 0.0, 186.346, 0.0, 0.0,
            0.0, 188.308, 0.0, 0.0, 0.0, 190.269, 0.0, 0.0, 0.0, 192.231, 0.0, 0.0, 0.0, 194.192, 0.0,
            0.0, 0.0, 196.154, 0.0, 0.0, 0.0, 198.115, 0.0, 0.0, 0.0, 200.077, 0.0, 0.0, 0.0, 202.038,
            0.0, 0.0, 0.0, 204.0, 0.0, 0.0, 0.0, 205.962, 0.0, 0.0, 0.0, 207.923, 0.0, 0.0, 0.0, 209.885,
            0.0, 0.0, 0.0, 211.846, 0.0, 0.0, 0.0, 213.808, 0.0, 0.0, 0.0, 215.769, 0.0, 0.0, 0.0,
            217.731, 0.0, 0.0, 0.0, 219.692, 0.0, 0.0, 0.0, 221.654, 0.0, 0.0, 0.0, 223.615, 0.0, 0.0,
            0.0, 225.577, 0.0, 0.0, 0.0, 227.538, 0.0, 0.0, 0.0, 229.5, 0.0, 0.0, 0.0, 230.481, 0.0, 0.0,
            0.0, 231.462, 0.0, 0.0, 0.0, 232.442, 0.0, 0.0, 0.0, 233.423, 0.0, 0.0, 0.0, 234.404, 0.0,
            0.0, 0.0, 235.385, 0.0, 0.0, 0.0, 236.365, 0.0, 0.0, 0.0, 237.346, 0.0, 0.0, 0.0, 238.327,
            0.0, 0.0, 0.0, 239.308, 0.0, 0.0, 0.0, 240.288, 0.0, 0.0, 0.0, 241.269, 0.0, 0.0, 0.0, 242.25,
            0.0, 0.0, 0.0, 242.642, 0.0, 0.0, 0.0, 243.035, 0.0, 0.0, 0.0, 243.427, 0.0, 0.0, 0.0,
            243.819, 0.0, 0.0, 0.0, 244.212, 0.0, 0.0, 0.0, 244.604, 0.0, 0.0, 0.0, 244.996, 0.0, 0.0,
            0.0, 245.388, 0.0, 0.0, 0.0, 245.781, 0.0, 0.0, 0.0, 246.173, 0.0, 0.0, 0.0, 246.565, 0.0,
            0.0, 0.0, 246.958, 0.0, 0.0, 0.0, 247.35, 0.0, 0.0, 0.0, 247.814, 0.0, 0.0, 0.0, 248.277, 0.0,
            0.0, 0.0, 248.741, 0.0, 0.0, 0.0, 249.205, 0.0, 0.0, 0.0, 249.668, 0.0, 0.0, 0.0, 250.132,
            0.0, 0.0, 0.0, 250.595, 0.0, 0.0, 0.0, 251.059, 0.0, 0.0, 0.0, 251.523, 0.0, 0.0, 0.0,
            251.986, 0.0, 0.0, 0.0, 252.45, 0.0, 0.0, 0.0
        ]),
        g: new Float32Array([
            0.0, 0.0, 0.0, 0.0, 1.53846, 0.0, 0.0, 0.0, 3.07692, 0.0, 0.0, 0.0, 4.61538, 0.0, 0.0, 0.0,
            6.15385, 0.0, 0.0, 0.0, 7.69231, 0.0, 0.0, 0.0, 9.23077, 0.0, 0.0, 0.0, 10.7692, 0.0, 0.0,
            0.0, 12.3077, 0.0, 0.0, 0.0, 13.8462, 0.0, 0.0, 0.0, 15.3846, 0.0, 0.0, 0.0, 16.9231, 0.0,
            0.0, 0.0, 18.4615, 0.0, 0.0, 0.0, 20.0, 0.0, 0.0, 0.0, 32.6154, 0.0, 0.0, 0.0, 45.2308, 0.0,
            0.0, 0.0, 57.8462, 0.0, 0.0, 0.0, 70.4615, 0.0, 0.0, 0.0, 83.0769, 0.0, 0.0, 0.0, 95.6923,
            0.0, 0.0, 0.0, 108.308, 0.0, 0.0, 0.0, 120.923, 0.0, 0.0, 0.0, 133.538, 0.0, 0.0, 0.0,
            146.154, 0.0, 0.0, 0.0, 158.769, 0.0, 0.0, 0.0, 171.385, 0.0, 0.0, 0.0, 184.0, 0.0, 0.0, 0.0,
            187.923, 0.0, 0.0, 0.0, 191.846, 0.0, 0.0, 0.0, 195.769, 0.0, 0.0, 0.0, 199.692, 0.0, 0.0,
            0.0, 203.615, 0.0, 0.0, 0.0, 207.538, 0.0, 0.0, 0.0, 211.462, 0.0, 0.0, 0.0, 215.385, 0.0,
            0.0, 0.0, 219.308, 0.0, 0.0, 0.0, 223.231, 0.0, 0.0, 0.0, 227.154, 0.0, 0.0, 0.0, 231.077,
            0.0, 0.0, 0.0, 235.0, 0.0, 0.0, 0.0, 235.308, 0.0, 0.0, 0.0, 235.615, 0.0, 0.0, 0.0, 235.923,
            0.0, 0.0, 0.0, 236.231, 0.0, 0.0, 0.0, 236.538, 0.0, 0.0, 0.0, 236.846, 0.0, 0.0, 0.0,
            237.154, 0.0, 0.0, 0.0, 237.462, 0.0, 0.0, 0.0, 237.769, 0.0, 0.0, 0.0, 238.077, 0.0, 0.0,
            0.0, 238.385, 0.0, 0.0, 0.0, 238.692, 0.0, 0.0, 0.0, 239.0, 0.0, 0.0, 0.0, 239.077, 0.0, 0.0,
            0.0, 239.154, 0.0, 0.0, 0.0, 239.231, 0.0, 0.0, 0.0, 239.308, 0.0, 0.0, 0.0, 239.385, 0.0,
            0.0, 0.0, 239.462, 0.0, 0.0, 0.0, 239.538, 0.0, 0.0, 0.0, 239.615, 0.0, 0.0, 0.0, 239.692,
            0.0, 0.0, 0.0, 239.769, 0.0, 0.0, 0.0, 239.846, 0.0, 0.0, 0.0, 239.923, 0.0, 0.0, 0.0, 240.0,
            0.0, 0.0, 0.0, 240.091, 0.0, 0.0, 0.0, 240.182, 0.0, 0.0, 0.0, 240.273, 0.0, 0.0, 0.0,
            240.364, 0.0, 0.0, 0.0, 240.455, 0.0, 0.0, 0.0, 240.545, 0.0, 0.0, 0.0, 240.636, 0.0, 0.0,
            0.0, 240.727, 0.0, 0.0, 0.0, 240.818, 0.0, 0.0, 0.0, 240.909, 0.0, 0.0, 0.0, 241.0, 0.0, 0.0,
            0.0, 241.0, 0.0, 0.0, 0.0, 240.909, 0.0, 0.0, 0.0, 240.818, 0.0, 0.0, 0.0, 240.727, 0.0, 0.0,
            0.0, 240.636, 0.0, 0.0, 0.0, 240.545, 0.0, 0.0, 0.0, 240.455, 0.0, 0.0, 0.0, 240.364, 0.0,
            0.0, 0.0, 240.273, 0.0, 0.0, 0.0, 240.182, 0.0, 0.0, 0.0, 240.091, 0.0, 0.0, 0.0, 240.0, 0.0,
            0.0, 0.0, 239.615, 0.0, 0.0, 0.0, 239.231, 0.0, 0.0, 0.0, 238.846, 0.0, 0.0, 0.0, 238.462,
            0.0, 0.0, 0.0, 238.077, 0.0, 0.0, 0.0, 237.692, 0.0, 0.0, 0.0, 237.308, 0.0, 0.0, 0.0,
            236.923, 0.0, 0.0, 0.0, 236.538, 0.0, 0.0, 0.0, 236.154, 0.0, 0.0, 0.0, 235.769, 0.0, 0.0,
            0.0, 235.385, 0.0, 0.0, 0.0, 235.0, 0.0, 0.0, 0.0, 232.615, 0.0, 0.0, 0.0, 230.231, 0.0, 0.0,
            0.0, 227.846, 0.0, 0.0, 0.0, 225.462, 0.0, 0.0, 0.0, 223.077, 0.0, 0.0, 0.0, 220.692, 0.0,
            0.0, 0.0, 218.308, 0.0, 0.0, 0.0, 215.923, 0.0, 0.0, 0.0, 213.538, 0.0, 0.0, 0.0, 211.154,
            0.0, 0.0, 0.0, 208.769, 0.0, 0.0, 0.0, 206.385, 0.0, 0.0, 0.0, 204.0, 0.0, 0.0, 0.0, 200.077,
            0.0, 0.0, 0.0, 196.154, 0.0, 0.0, 0.0, 192.231, 0.0, 0.0, 0.0, 188.308, 0.0, 0.0, 0.0,
            184.385, 0.0, 0.0, 0.0, 180.462, 0.0, 0.0, 0.0, 176.538, 0.0, 0.0, 0.0, 172.615, 0.0, 0.0,
            0.0, 168.692, 0.0, 0.0, 0.0, 164.769, 0.0, 0.0, 0.0, 160.846, 0.0, 0.0, 0.0, 156.923, 0.0,
            0.0, 0.0, 153.0, 0.0, 0.0, 0.0, 147.115, 0.0, 0.0, 0.0, 141.231, 0.0, 0.0, 0.0, 135.346, 0.0,
            0.0, 0.0, 129.462, 0.0, 0.0, 0.0, 123.577, 0.0, 0.0, 0.0, 117.692, 0.0, 0.0, 0.0, 111.808,
            0.0, 0.0, 0.0, 105.923, 0.0, 0.0, 0.0, 100.038, 0.0, 0.0, 0.0, 94.1538, 0.0, 0.0, 0.0,
            88.2692, 0.0, 0.0, 0.0, 82.3846, 0.0, 0.0, 0.0, 76.5, 0.0, 0.0, 0.0, 73.0769, 0.0, 0.0, 0.0,
            69.6538, 0.0, 0.0, 0.0, 66.2308, 0.0, 0.0, 0.0, 62.8077, 0.0, 0.0, 0.0, 59.3846, 0.0, 0.0,
            0.0, 55.9615, 0.0, 0.0, 0.0, 52.5385, 0.0, 0.0, 0.0, 49.1154, 0.0, 0.0, 0.0, 45.6923, 0.0,
            0.0, 0.0, 42.2692, 0.0, 0.0, 0.0, 38.8462, 0.0, 0.0, 0.0, 35.4231, 0.0, 0.0, 0.0, 32.0, 0.0,
            0.0, 0.0, 29.5385, 0.0, 0.0, 0.0, 27.0769, 0.0, 0.0, 0.0, 24.6154, 0.0, 0.0, 0.0, 22.1538,
            0.0, 0.0, 0.0, 19.6923, 0.0, 0.0, 0.0, 17.2308, 0.0, 0.0, 0.0, 14.7692, 0.0, 0.0, 0.0,
            12.3077, 0.0, 0.0, 0.0, 9.84615, 0.0, 0.0, 0.0, 7.38462, 0.0, 0.0, 0.0, 4.92308, 0.0, 0.0,
            0.0, 2.46154, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 9.80769, 0.0, 0.0, 0.0, 19.6154, 0.0, 0.0,
            0.0, 29.4231, 0.0, 0.0, 0.0, 39.2308, 0.0, 0.0, 0.0, 49.0385, 0.0, 0.0, 0.0, 58.8462, 0.0,
            0.0, 0.0, 68.6538, 0.0, 0.0, 0.0, 78.4615, 0.0, 0.0, 0.0, 88.2692, 0.0, 0.0, 0.0, 98.0769,
            0.0, 0.0, 0.0, 107.885, 0.0, 0.0, 0.0, 117.692, 0.0, 0.0, 0.0, 127.5, 0.0, 0.0, 0.0, 131.423,
            0.0, 0.0, 0.0, 135.346, 0.0, 0.0, 0.0, 139.269, 0.0, 0.0, 0.0, 143.192, 0.0, 0.0, 0.0,
            147.115, 0.0, 0.0, 0.0, 151.038, 0.0, 0.0, 0.0, 154.962, 0.0, 0.0, 0.0, 158.885, 0.0, 0.0,
            0.0, 162.808, 0.0, 0.0, 0.0, 166.731, 0.0, 0.0, 0.0, 170.654, 0.0, 0.0, 0.0, 174.577, 0.0,
            0.0, 0.0, 178.5, 0.0, 0.0, 0.0, 180.462, 0.0, 0.0, 0.0, 182.423, 0.0, 0.0, 0.0, 184.385, 0.0,
            0.0, 0.0, 186.346, 0.0, 0.0, 0.0, 188.308, 0.0, 0.0, 0.0, 190.269, 0.0, 0.0, 0.0, 192.231,
            0.0, 0.0, 0.0, 194.192, 0.0, 0.0, 0.0, 196.154, 0.0, 0.0, 0.0, 198.115, 0.0, 0.0, 0.0,
            200.077, 0.0, 0.0, 0.0, 202.038, 0.0, 0.0, 0.0, 204.0, 0.0, 0.0, 0.0, 205.962, 0.0, 0.0, 0.0,
            207.923, 0.0, 0.0, 0.0, 209.885, 0.0, 0.0, 0.0, 211.846, 0.0, 0.0, 0.0, 213.808, 0.0, 0.0,
            0.0, 215.769, 0.0, 0.0, 0.0, 217.731, 0.0, 0.0, 0.0, 219.692, 0.0, 0.0, 0.0, 221.654, 0.0,
            0.0, 0.0, 223.615, 0.0, 0.0, 0.0, 225.577, 0.0, 0.0, 0.0, 227.538, 0.0, 0.0, 0.0, 229.5, 0.0,
            0.0, 0.0, 230.481, 0.0, 0.0, 0.0, 231.462, 0.0, 0.0, 0.0, 232.442, 0.0, 0.0, 0.0, 233.423,
            0.0, 0.0, 0.0, 234.404, 0.0, 0.0, 0.0, 235.385, 0.0, 0.0, 0.0, 236.365, 0.0, 0.0, 0.0,
            237.346, 0.0, 0.0, 0.0, 238.327, 0.0, 0.0, 0.0, 239.308, 0.0, 0.0, 0.0, 240.288, 0.0, 0.0,
            0.0, 241.269, 0.0, 0.0, 0.0, 242.25, 0.0, 0.0, 0.0, 242.642, 0.0, 0.0, 0.0, 243.035, 0.0, 0.0,
            0.0, 243.427, 0.0, 0.0, 0.0, 243.819, 0.0, 0.0, 0.0, 244.212, 0.0, 0.0, 0.0, 244.604, 0.0,
            0.0, 0.0, 244.996, 0.0, 0.0, 0.0, 245.388, 0.0, 0.0, 0.0, 245.781, 0.0, 0.0, 0.0, 246.173,
            0.0, 0.0, 0.0, 246.565, 0.0, 0.0, 0.0, 246.958, 0.0, 0.0, 0.0, 247.35, 0.0, 0.0, 0.0, 247.814,
            0.0, 0.0, 0.0, 248.277, 0.0, 0.0, 0.0, 248.741, 0.0, 0.0, 0.0, 249.205, 0.0, 0.0, 0.0,
            249.668, 0.0, 0.0, 0.0, 250.132, 0.0, 0.0, 0.0, 250.595, 0.0, 0.0, 0.0, 251.059, 0.0, 0.0,
            0.0, 251.523, 0.0, 0.0, 0.0, 251.986, 0.0, 0.0, 0.0, 252.45, 0.0, 0.0, 0.0
        ]),
        b: new Float32Array([
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 254.615, 0.0, 0.0, 0.0, 254.231, 0.0, 0.0, 0.0, 253.846,
            0.0, 0.0, 0.0, 253.462, 0.0, 0.0, 0.0, 253.077, 0.0, 0.0, 0.0, 252.692, 0.0, 0.0, 0.0,
            252.308, 0.0, 0.0, 0.0, 251.923, 0.0, 0.0, 0.0, 251.538, 0.0, 0.0, 0.0, 251.154, 0.0, 0.0,
            0.0, 250.769, 0.0, 0.0, 0.0, 250.385, 0.0, 0.0, 0.0, 250.0, 0.0, 0.0, 0.0, 249.615, 0.0, 0.0,
            0.0, 249.231, 0.0, 0.0, 0.0, 248.846, 0.0, 0.0, 0.0, 248.462, 0.0, 0.0, 0.0, 248.077, 0.0,
            0.0, 0.0, 247.692, 0.0, 0.0, 0.0, 247.308, 0.0, 0.0, 0.0, 246.923, 0.0, 0.0, 0.0, 246.538,
            0.0, 0.0, 0.0, 246.154, 0.0, 0.0, 0.0, 245.769, 0.0, 0.0, 0.0, 245.385, 0.0, 0.0, 0.0, 245.0,
            0.0, 0.0, 0.0, 242.0, 0.0, 0.0, 0.0, 239.0, 0.0, 0.0, 0.0, 236.0, 0.0, 0.0, 0.0, 233.0, 0.0,
            0.0, 0.0, 230.0, 0.0, 0.0, 0.0, 227.0, 0.0, 0.0, 0.0, 224.0, 0.0, 0.0, 0.0, 221.0, 0.0, 0.0,
            0.0, 218.0, 0.0, 0.0, 0.0, 215.0, 0.0, 0.0, 0.0, 212.0, 0.0, 0.0, 0.0, 212.0, 0.0, 0.0, 0.0,
            208.636, 0.0, 0.0, 0.0, 205.273, 0.0, 0.0, 0.0, 201.909, 0.0, 0.0, 0.0, 198.545, 0.0, 0.0,
            0.0, 195.182, 0.0, 0.0, 0.0, 191.818, 0.0, 0.0, 0.0, 188.455, 0.0, 0.0, 0.0, 185.091, 0.0,
            0.0, 0.0, 181.727, 0.0, 0.0, 0.0, 178.364, 0.0, 0.0, 0.0, 175.0, 0.0, 0.0, 0.0, 171.538, 0.0,
            0.0, 0.0, 168.077, 0.0, 0.0, 0.0, 164.615, 0.0, 0.0, 0.0, 161.154, 0.0, 0.0, 0.0, 157.692,
            0.0, 0.0, 0.0, 154.231, 0.0, 0.0, 0.0, 150.769, 0.0, 0.0, 0.0, 147.308, 0.0, 0.0, 0.0,
            143.846, 0.0, 0.0, 0.0, 140.385, 0.0, 0.0, 0.0, 136.923, 0.0, 0.0, 0.0, 133.462, 0.0, 0.0,
            0.0, 130.0, 0.0, 0.0, 0.0, 122.942, 0.0, 0.0, 0.0, 115.885, 0.0, 0.0, 0.0, 108.827, 0.0, 0.0,
            0.0, 101.769, 0.0, 0.0, 0.0, 94.7115, 0.0, 0.0, 0.0, 87.6539, 0.0, 0.0, 0.0, 80.5962, 0.0,
            0.0, 0.0, 73.5385, 0.0, 0.0, 0.0, 66.4808, 0.0, 0.0, 0.0, 59.4231, 0.0, 0.0, 0.0, 52.3654,
            0.0, 0.0, 0.0, 45.3077, 0.0, 0.0, 0.0, 38.25, 0.0, 0.0, 0.0, 36.2885, 0.0, 0.0, 0.0, 34.3269,
            0.0, 0.0, 0.0, 32.3654, 0.0, 0.0, 0.0, 30.4038, 0.0, 0.0, 0.0, 28.4423, 0.0, 0.0, 0.0,
            26.4808, 0.0, 0.0, 0.0, 24.5192, 0.0, 0.0, 0.0, 22.5577, 0.0, 0.0, 0.0, 20.5962, 0.0, 0.0,
            0.0, 18.6346, 0.0, 0.0, 0.0, 16.6731, 0.0, 0.0, 0.0, 14.7115, 0.0, 0.0, 0.0, 12.75, 0.0, 0.0,
            0.0, 11.7692, 0.0, 0.0, 0.0, 10.7885, 0.0, 0.0, 0.0, 9.80769, 0.0, 0.0, 0.0, 8.82692, 0.0,
            0.0, 0.0, 7.84615, 0.0, 0.0, 0.0, 6.86539, 0.0, 0.0, 0.0, 5.88461, 0.0, 0.0, 0.0, 4.90385,
            0.0, 0.0, 0.0, 3.92308, 0.0, 0.0, 0.0, 2.94231, 0.0, 0.0, 0.0, 1.96154, 0.0, 0.0, 0.0,
            0.980769, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 2.46154, 0.0, 0.0, 0.0, 4.92308, 0.0, 0.0, 0.0,
            7.38462, 0.0, 0.0, 0.0, 9.84616, 0.0, 0.0, 0.0, 12.3077, 0.0, 0.0, 0.0, 14.7692, 0.0, 0.0,
            0.0, 17.2308, 0.0, 0.0, 0.0, 19.6923, 0.0, 0.0, 0.0, 22.1538, 0.0, 0.0, 0.0, 24.6154, 0.0,
            0.0, 0.0, 27.0769, 0.0, 0.0, 0.0, 29.5385, 0.0, 0.0, 0.0, 32.0, 0.0, 0.0, 0.0, 32.0, 0.0, 0.0,
            0.0, 32.0, 0.0, 0.0, 0.0, 32.0, 0.0, 0.0, 0.0, 32.0, 0.0, 0.0, 0.0, 32.0, 0.0, 0.0, 0.0, 32.0,
            0.0, 0.0, 0.0, 32.0, 0.0, 0.0, 0.0, 32.0, 0.0, 0.0, 0.0, 32.0, 0.0, 0.0, 0.0, 32.0, 0.0, 0.0,
            0.0, 32.0, 0.0, 0.0, 0.0, 32.0, 0.0, 0.0, 0.0, 32.0, 0.0, 0.0, 0.0, 41.3077, 0.0, 0.0, 0.0,
            50.6154, 0.0, 0.0, 0.0, 59.9231, 0.0, 0.0, 0.0, 69.2308, 0.0, 0.0, 0.0, 78.5385, 0.0, 0.0,
            0.0, 87.8462, 0.0, 0.0, 0.0, 97.1539, 0.0, 0.0, 0.0, 106.462, 0.0, 0.0, 0.0, 115.769, 0.0,
            0.0, 0.0, 125.077, 0.0, 0.0, 0.0, 134.385, 0.0, 0.0, 0.0, 143.692, 0.0, 0.0, 0.0, 153.0, 0.0,
            0.0, 0.0, 156.923, 0.0, 0.0, 0.0, 160.846, 0.0, 0.0, 0.0, 164.769, 0.0, 0.0, 0.0, 168.692,
            0.0, 0.0, 0.0, 172.615, 0.0, 0.0, 0.0, 176.538, 0.0, 0.0, 0.0, 180.462, 0.0, 0.0, 0.0,
            184.385, 0.0, 0.0, 0.0, 188.308, 0.0, 0.0, 0.0, 192.231, 0.0, 0.0, 0.0, 196.154, 0.0, 0.0,
            0.0, 200.077, 0.0, 0.0, 0.0, 204.0, 0.0, 0.0, 0.0, 205.962, 0.0, 0.0, 0.0, 207.923, 0.0, 0.0,
            0.0, 209.885, 0.0, 0.0, 0.0, 211.846, 0.0, 0.0, 0.0, 213.808, 0.0, 0.0, 0.0, 215.769, 0.0,
            0.0, 0.0, 217.731, 0.0, 0.0, 0.0, 219.692, 0.0, 0.0, 0.0, 221.654, 0.0, 0.0, 0.0, 223.615,
            0.0, 0.0, 0.0, 225.577, 0.0, 0.0, 0.0, 227.538, 0.0, 0.0, 0.0, 229.5, 0.0, 0.0, 0.0, 230.481,
            0.0, 0.0, 0.0, 231.462, 0.0, 0.0, 0.0, 232.442, 0.0, 0.0, 0.0, 233.423, 0.0, 0.0, 0.0,
            234.404, 0.0, 0.0, 0.0, 235.385, 0.0, 0.0, 0.0, 236.365, 0.0, 0.0, 0.0, 237.346, 0.0, 0.0,
            0.0, 238.327, 0.0, 0.0, 0.0, 239.308, 0.0, 0.0, 0.0, 240.288, 0.0, 0.0, 0.0, 241.269, 0.0,
            0.0, 0.0, 242.25, 0.0, 0.0, 0.0, 242.838, 0.0, 0.0, 0.0, 243.427, 0.0, 0.0, 0.0, 244.015, 0.0,
            0.0, 0.0, 244.604, 0.0, 0.0, 0.0, 245.192, 0.0, 0.0, 0.0, 245.781, 0.0, 0.0, 0.0, 246.369,
            0.0, 0.0, 0.0, 246.958, 0.0, 0.0, 0.0, 247.546, 0.0, 0.0, 0.0, 248.135, 0.0, 0.0, 0.0,
            248.723, 0.0, 0.0, 0.0, 249.312, 0.0, 0.0, 0.0, 249.9, 0.0, 0.0, 0.0, 250.096, 0.0, 0.0, 0.0,
            250.292, 0.0, 0.0, 0.0, 250.488, 0.0, 0.0, 0.0, 250.685, 0.0, 0.0, 0.0, 250.881, 0.0, 0.0,
            0.0, 251.077, 0.0, 0.0, 0.0, 251.273, 0.0, 0.0, 0.0, 251.469, 0.0, 0.0, 0.0, 251.665, 0.0,
            0.0, 0.0, 251.862, 0.0, 0.0, 0.0, 252.058, 0.0, 0.0, 0.0, 252.254, 0.0, 0.0, 0.0, 252.45, 0.0,
            0.0, 0.0, 252.682, 0.0, 0.0, 0.0, 252.914, 0.0, 0.0, 0.0, 253.145, 0.0, 0.0, 0.0, 253.377,
            0.0, 0.0, 0.0, 253.609, 0.0, 0.0, 0.0, 253.841, 0.0, 0.0, 0.0, 254.073, 0.0, 0.0, 0.0,
            254.305, 0.0, 0.0, 0.0, 254.536, 0.0, 0.0, 0.0, 254.768, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0
        ]),
    },
    cmb: {
        name: 'cmb',
        r: new Float32Array([
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 6.0, 0.0, 0.0, 0.0, 12.0, 0.0, 0.0, 0.0, 18.0, 0.0, 0.0, 0.0, 24.0, 0.0, 0.0, 0.0,
            30.0, 0.0, 0.0, 0.0, 36.0, 0.0, 0.0, 0.0, 42.0, 0.0, 0.0, 0.0, 48.0, 0.0, 0.0, 0.0, 54.0, 0.0,
            0.0, 0.0, 60.0, 0.0, 0.0, 0.0, 66.0, 0.0, 0.0, 0.0, 72.0, 0.0, 0.0, 0.0, 78.0, 0.0, 0.0, 0.0,
            85.0, 0.0, 0.0, 0.0, 91.0, 0.0, 0.0, 0.0, 97.0, 0.0, 0.0, 0.0, 103.0, 0.0, 0.0, 0.0, 109.0,
            0.0, 0.0, 0.0, 115.0, 0.0, 0.0, 0.0, 121.0, 0.0, 0.0, 0.0, 127.0, 0.0, 0.0, 0.0, 133.0, 0.0,
            0.0, 0.0, 139.0, 0.0, 0.0, 0.0, 145.0, 0.0, 0.0, 0.0, 151.0, 0.0, 0.0, 0.0, 157.0, 0.0, 0.0,
            0.0, 163.0, 0.0, 0.0, 0.0, 170.0, 0.0, 0.0, 0.0, 176.0, 0.0, 0.0, 0.0, 182.0, 0.0, 0.0, 0.0,
            188.0, 0.0, 0.0, 0.0, 194.0, 0.0, 0.0, 0.0, 200.0, 0.0, 0.0, 0.0, 206.0, 0.0, 0.0, 0.0, 212.0,
            0.0, 0.0, 0.0, 218.0, 0.0, 0.0, 0.0, 224.0, 0.0, 0.0, 0.0, 230.0, 0.0, 0.0, 0.0, 236.0, 0.0,
            0.0, 0.0, 242.0, 0.0, 0.0, 0.0, 248.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 251.0, 0.0, 0.0,
            0.0, 247.0, 0.0, 0.0, 0.0, 244.0, 0.0, 0.0, 0.0, 240.0, 0.0, 0.0, 0.0, 236.0, 0.0, 0.0, 0.0,
            233.0, 0.0, 0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 226.0, 0.0, 0.0, 0.0, 222.0, 0.0, 0.0, 0.0, 218.0,
            0.0, 0.0, 0.0, 215.0, 0.0, 0.0, 0.0, 211.0, 0.0, 0.0, 0.0, 208.0, 0.0, 0.0, 0.0, 204.0, 0.0,
            0.0, 0.0, 200.0, 0.0, 0.0, 0.0, 197.0, 0.0, 0.0, 0.0, 193.0, 0.0, 0.0, 0.0, 190.0, 0.0, 0.0,
            0.0, 186.0, 0.0, 0.0, 0.0, 182.0, 0.0, 0.0, 0.0, 179.0, 0.0, 0.0, 0.0, 175.0, 0.0, 0.0, 0.0,
            172.0, 0.0, 0.0, 0.0, 168.0, 0.0, 0.0, 0.0, 164.0, 0.0, 0.0, 0.0, 161.0, 0.0, 0.0, 0.0, 157.0,
            0.0, 0.0, 0.0, 154.0, 0.0, 0.0, 0.0, 150.0, 0.0, 0.0, 0.0, 146.0, 0.0, 0.0, 0.0, 143.0, 0.0,
            0.0, 0.0, 139.0, 0.0, 0.0, 0.0, 136.0, 0.0, 0.0, 0.0, 132.0, 0.0, 0.0, 0.0, 128.0, 0.0, 0.0,
            0.0, 125.0, 0.0, 0.0, 0.0, 121.0, 0.0, 0.0, 0.0, 118.0, 0.0, 0.0, 0.0, 114.0, 0.0, 0.0, 0.0,
            110.0, 0.0, 0.0, 0.0, 107.0, 0.0, 0.0, 0.0, 103.0, 0.0, 0.0, 0.0, 100.0, 0.0, 0.0, 0.0
        ]),
        g: new Float32Array([
            0.0, 0.0, 0.0, 0.0, 2.0, 0.0, 0.0, 0.0, 5.0, 0.0, 0.0, 0.0, 8.0, 0.0, 0.0, 0.0, 10.0, 0.0,
            0.0, 0.0, 13.0, 0.0, 0.0, 0.0, 16.0, 0.0, 0.0, 0.0, 18.0, 0.0, 0.0, 0.0, 21.0, 0.0, 0.0, 0.0,
            24.0, 0.0, 0.0, 0.0, 26.0, 0.0, 0.0, 0.0, 29.0, 0.0, 0.0, 0.0, 32.0, 0.0, 0.0, 0.0, 34.0, 0.0,
            0.0, 0.0, 37.0, 0.0, 0.0, 0.0, 40.0, 0.0, 0.0, 0.0, 42.0, 0.0, 0.0, 0.0, 45.0, 0.0, 0.0, 0.0,
            48.0, 0.0, 0.0, 0.0, 50.0, 0.0, 0.0, 0.0, 53.0, 0.0, 0.0, 0.0, 56.0, 0.0, 0.0, 0.0, 58.0, 0.0,
            0.0, 0.0, 61.0, 0.0, 0.0, 0.0, 64.0, 0.0, 0.0, 0.0, 66.0, 0.0, 0.0, 0.0, 69.0, 0.0, 0.0, 0.0,
            72.0, 0.0, 0.0, 0.0, 74.0, 0.0, 0.0, 0.0, 77.0, 0.0, 0.0, 0.0, 80.0, 0.0, 0.0, 0.0, 82.0, 0.0,
            0.0, 0.0, 85.0, 0.0, 0.0, 0.0, 88.0, 0.0, 0.0, 0.0, 90.0, 0.0, 0.0, 0.0, 93.0, 0.0, 0.0, 0.0,
            96.0, 0.0, 0.0, 0.0, 98.0, 0.0, 0.0, 0.0, 101.0, 0.0, 0.0, 0.0, 104.0, 0.0, 0.0, 0.0, 106.0,
            0.0, 0.0, 0.0, 109.0, 0.0, 0.0, 0.0, 112.0, 0.0, 0.0, 0.0, 114.0, 0.0, 0.0, 0.0, 117.0, 0.0,
            0.0, 0.0, 119.0, 0.0, 0.0, 0.0, 122.0, 0.0, 0.0, 0.0, 124.0, 0.0, 0.0, 0.0, 127.0, 0.0, 0.0,
            0.0, 129.0, 0.0, 0.0, 0.0, 132.0, 0.0, 0.0, 0.0, 134.0, 0.0, 0.0, 0.0, 137.0, 0.0, 0.0, 0.0,
            139.0, 0.0, 0.0, 0.0, 142.0, 0.0, 0.0, 0.0, 144.0, 0.0, 0.0, 0.0, 147.0, 0.0, 0.0, 0.0, 150.0,
            0.0, 0.0, 0.0, 152.0, 0.0, 0.0, 0.0, 155.0, 0.0, 0.0, 0.0, 157.0, 0.0, 0.0, 0.0, 160.0, 0.0,
            0.0, 0.0, 162.0, 0.0, 0.0, 0.0, 165.0, 0.0, 0.0, 0.0, 167.0, 0.0, 0.0, 0.0, 170.0, 0.0, 0.0,
            0.0, 172.0, 0.0, 0.0, 0.0, 175.0, 0.0, 0.0, 0.0, 177.0, 0.0, 0.0, 0.0, 180.0, 0.0, 0.0, 0.0,
            182.0, 0.0, 0.0, 0.0, 185.0, 0.0, 0.0, 0.0, 188.0, 0.0, 0.0, 0.0, 190.0, 0.0, 0.0, 0.0, 193.0,
            0.0, 0.0, 0.0, 195.0, 0.0, 0.0, 0.0, 198.0, 0.0, 0.0, 0.0, 200.0, 0.0, 0.0, 0.0, 203.0, 0.0,
            0.0, 0.0, 205.0, 0.0, 0.0, 0.0, 208.0, 0.0, 0.0, 0.0, 210.0, 0.0, 0.0, 0.0, 213.0, 0.0, 0.0,
            0.0, 215.0, 0.0, 0.0, 0.0, 218.0, 0.0, 0.0, 0.0, 221.0, 0.0, 0.0, 0.0, 221.0, 0.0, 0.0, 0.0,
            221.0, 0.0, 0.0, 0.0, 222.0, 0.0, 0.0, 0.0, 222.0, 0.0, 0.0, 0.0, 222.0, 0.0, 0.0, 0.0, 223.0,
            0.0, 0.0, 0.0, 223.0, 0.0, 0.0, 0.0, 224.0, 0.0, 0.0, 0.0, 224.0, 0.0, 0.0, 0.0, 224.0, 0.0,
            0.0, 0.0, 225.0, 0.0, 0.0, 0.0, 225.0, 0.0, 0.0, 0.0, 225.0, 0.0, 0.0, 0.0, 226.0, 0.0, 0.0,
            0.0, 226.0, 0.0, 0.0, 0.0, 227.0, 0.0, 0.0, 0.0, 227.0, 0.0, 0.0, 0.0, 227.0, 0.0, 0.0, 0.0,
            228.0, 0.0, 0.0, 0.0, 228.0, 0.0, 0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 229.0,
            0.0, 0.0, 0.0, 230.0, 0.0, 0.0, 0.0, 230.0, 0.0, 0.0, 0.0, 230.0, 0.0, 0.0, 0.0, 231.0, 0.0,
            0.0, 0.0, 231.0, 0.0, 0.0, 0.0, 232.0, 0.0, 0.0, 0.0, 232.0, 0.0, 0.0, 0.0, 232.0, 0.0, 0.0,
            0.0, 233.0, 0.0, 0.0, 0.0, 233.0, 0.0, 0.0, 0.0, 233.0, 0.0, 0.0, 0.0, 234.0, 0.0, 0.0, 0.0,
            234.0, 0.0, 0.0, 0.0, 235.0, 0.0, 0.0, 0.0, 235.0, 0.0, 0.0, 0.0, 235.0, 0.0, 0.0, 0.0, 236.0,
            0.0, 0.0, 0.0, 236.0, 0.0, 0.0, 0.0, 237.0, 0.0, 0.0, 0.0, 235.0, 0.0, 0.0, 0.0, 234.0, 0.0,
            0.0, 0.0, 233.0, 0.0, 0.0, 0.0, 231.0, 0.0, 0.0, 0.0, 230.0, 0.0, 0.0, 0.0, 229.0, 0.0, 0.0,
            0.0, 227.0, 0.0, 0.0, 0.0, 226.0, 0.0, 0.0, 0.0, 225.0, 0.0, 0.0, 0.0, 223.0, 0.0, 0.0, 0.0,
            222.0, 0.0, 0.0, 0.0, 221.0, 0.0, 0.0, 0.0, 219.0, 0.0, 0.0, 0.0, 218.0, 0.0, 0.0, 0.0, 217.0,
            0.0, 0.0, 0.0, 215.0, 0.0, 0.0, 0.0, 214.0, 0.0, 0.0, 0.0, 213.0, 0.0, 0.0, 0.0, 211.0, 0.0,
            0.0, 0.0, 210.0, 0.0, 0.0, 0.0, 209.0, 0.0, 0.0, 0.0, 207.0, 0.0, 0.0, 0.0, 206.0, 0.0, 0.0,
            0.0, 205.0, 0.0, 0.0, 0.0, 203.0, 0.0, 0.0, 0.0, 202.0, 0.0, 0.0, 0.0, 201.0, 0.0, 0.0, 0.0,
            199.0, 0.0, 0.0, 0.0, 198.0, 0.0, 0.0, 0.0, 197.0, 0.0, 0.0, 0.0, 195.0, 0.0, 0.0, 0.0, 194.0,
            0.0, 0.0, 0.0, 193.0, 0.0, 0.0, 0.0, 191.0, 0.0, 0.0, 0.0, 190.0, 0.0, 0.0, 0.0, 189.0, 0.0,
            0.0, 0.0, 187.0, 0.0, 0.0, 0.0, 186.0, 0.0, 0.0, 0.0, 185.0, 0.0, 0.0, 0.0, 183.0, 0.0, 0.0,
            0.0, 182.0, 0.0, 0.0, 0.0, 181.0, 0.0, 0.0, 0.0, 180.0, 0.0, 0.0, 0.0, 177.0, 0.0, 0.0, 0.0,
            175.0, 0.0, 0.0, 0.0, 172.0, 0.0, 0.0, 0.0, 170.0, 0.0, 0.0, 0.0, 167.0, 0.0, 0.0, 0.0, 165.0,
            0.0, 0.0, 0.0, 162.0, 0.0, 0.0, 0.0, 160.0, 0.0, 0.0, 0.0, 157.0, 0.0, 0.0, 0.0, 155.0, 0.0,
            0.0, 0.0, 152.0, 0.0, 0.0, 0.0, 150.0, 0.0, 0.0, 0.0, 147.0, 0.0, 0.0, 0.0, 145.0, 0.0, 0.0,
            0.0, 142.0, 0.0, 0.0, 0.0, 140.0, 0.0, 0.0, 0.0, 137.0, 0.0, 0.0, 0.0, 135.0, 0.0, 0.0, 0.0,
            132.0, 0.0, 0.0, 0.0, 130.0, 0.0, 0.0, 0.0, 127.0, 0.0, 0.0, 0.0, 125.0, 0.0, 0.0, 0.0, 122.0,
            0.0, 0.0, 0.0, 120.0, 0.0, 0.0, 0.0, 117.0, 0.0, 0.0, 0.0, 115.0, 0.0, 0.0, 0.0, 112.0, 0.0,
            0.0, 0.0, 110.0, 0.0, 0.0, 0.0, 107.0, 0.0, 0.0, 0.0, 105.0, 0.0, 0.0, 0.0, 102.0, 0.0, 0.0,
            0.0, 100.0, 0.0, 0.0, 0.0, 97.0, 0.0, 0.0, 0.0, 95.0, 0.0, 0.0, 0.0, 92.0, 0.0, 0.0, 0.0,
            90.0, 0.0, 0.0, 0.0, 87.0, 0.0, 0.0, 0.0, 85.0, 0.0, 0.0, 0.0, 82.0, 0.0, 0.0, 0.0, 80.0, 0.0,
            0.0, 0.0, 77.0, 0.0, 0.0, 0.0, 75.0, 0.0, 0.0, 0.0, 73.0, 0.0, 0.0, 0.0, 71.0, 0.0, 0.0, 0.0,
            69.0, 0.0, 0.0, 0.0, 68.0, 0.0, 0.0, 0.0, 66.0, 0.0, 0.0, 0.0, 64.0, 0.0, 0.0, 0.0, 62.0, 0.0,
            0.0, 0.0, 61.0, 0.0, 0.0, 0.0, 59.0, 0.0, 0.0, 0.0, 57.0, 0.0, 0.0, 0.0, 55.0, 0.0, 0.0, 0.0,
            54.0, 0.0, 0.0, 0.0, 52.0, 0.0, 0.0, 0.0, 50.0, 0.0, 0.0, 0.0, 48.0, 0.0, 0.0, 0.0, 47.0, 0.0,
            0.0, 0.0, 45.0, 0.0, 0.0, 0.0, 43.0, 0.0, 0.0, 0.0, 41.0, 0.0, 0.0, 0.0, 40.0, 0.0, 0.0, 0.0,
            38.0, 0.0, 0.0, 0.0, 36.0, 0.0, 0.0, 0.0, 34.0, 0.0, 0.0, 0.0, 33.0, 0.0, 0.0, 0.0, 31.0, 0.0,
            0.0, 0.0, 29.0, 0.0, 0.0, 0.0, 27.0, 0.0, 0.0, 0.0, 26.0, 0.0, 0.0, 0.0, 24.0, 0.0, 0.0, 0.0,
            22.0, 0.0, 0.0, 0.0, 20.0, 0.0, 0.0, 0.0, 19.0, 0.0, 0.0, 0.0, 17.0, 0.0, 0.0, 0.0, 15.0, 0.0,
            0.0, 0.0, 13.0, 0.0, 0.0, 0.0, 12.0, 0.0, 0.0, 0.0, 10.0, 0.0, 0.0, 0.0, 8.0, 0.0, 0.0, 0.0,
            6.0, 0.0, 0.0, 0.0, 5.0, 0.0, 0.0, 0.0, 3.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0
        ]),
        b: new Float32Array([
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 254.0, 0.0, 0.0, 0.0, 253.0, 0.0, 0.0, 0.0, 252.0, 0.0, 0.0, 0.0, 251.0,
            0.0, 0.0, 0.0, 250.0, 0.0, 0.0, 0.0, 249.0, 0.0, 0.0, 0.0, 248.0, 0.0, 0.0, 0.0, 247.0, 0.0,
            0.0, 0.0, 246.0, 0.0, 0.0, 0.0, 245.0, 0.0, 0.0, 0.0, 245.0, 0.0, 0.0, 0.0, 244.0, 0.0, 0.0,
            0.0, 243.0, 0.0, 0.0, 0.0, 242.0, 0.0, 0.0, 0.0, 241.0, 0.0, 0.0, 0.0, 240.0, 0.0, 0.0, 0.0,
            239.0, 0.0, 0.0, 0.0, 238.0, 0.0, 0.0, 0.0, 237.0, 0.0, 0.0, 0.0, 236.0, 0.0, 0.0, 0.0, 236.0,
            0.0, 0.0, 0.0, 235.0, 0.0, 0.0, 0.0, 234.0, 0.0, 0.0, 0.0, 233.0, 0.0, 0.0, 0.0, 232.0, 0.0,
            0.0, 0.0, 231.0, 0.0, 0.0, 0.0, 230.0, 0.0, 0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 228.0, 0.0, 0.0,
            0.0, 227.0, 0.0, 0.0, 0.0, 226.0, 0.0, 0.0, 0.0, 226.0, 0.0, 0.0, 0.0, 225.0, 0.0, 0.0, 0.0,
            224.0, 0.0, 0.0, 0.0, 223.0, 0.0, 0.0, 0.0, 222.0, 0.0, 0.0, 0.0, 221.0, 0.0, 0.0, 0.0, 220.0,
            0.0, 0.0, 0.0, 219.0, 0.0, 0.0, 0.0, 218.0, 0.0, 0.0, 0.0, 217.0, 0.0, 0.0, 0.0, 217.0, 0.0,
            0.0, 0.0, 211.0, 0.0, 0.0, 0.0, 206.0, 0.0, 0.0, 0.0, 201.0, 0.0, 0.0, 0.0, 196.0, 0.0, 0.0,
            0.0, 191.0, 0.0, 0.0, 0.0, 186.0, 0.0, 0.0, 0.0, 181.0, 0.0, 0.0, 0.0, 176.0, 0.0, 0.0, 0.0,
            171.0, 0.0, 0.0, 0.0, 166.0, 0.0, 0.0, 0.0, 161.0, 0.0, 0.0, 0.0, 156.0, 0.0, 0.0, 0.0, 151.0,
            0.0, 0.0, 0.0, 146.0, 0.0, 0.0, 0.0, 141.0, 0.0, 0.0, 0.0, 136.0, 0.0, 0.0, 0.0, 131.0, 0.0,
            0.0, 0.0, 126.0, 0.0, 0.0, 0.0, 121.0, 0.0, 0.0, 0.0, 116.0, 0.0, 0.0, 0.0, 111.0, 0.0, 0.0,
            0.0, 105.0, 0.0, 0.0, 0.0, 100.0, 0.0, 0.0, 0.0, 95.0, 0.0, 0.0, 0.0, 90.0, 0.0, 0.0, 0.0,
            85.0, 0.0, 0.0, 0.0, 80.0, 0.0, 0.0, 0.0, 75.0, 0.0, 0.0, 0.0, 70.0, 0.0, 0.0, 0.0, 65.0, 0.0,
            0.0, 0.0, 60.0, 0.0, 0.0, 0.0, 55.0, 0.0, 0.0, 0.0, 50.0, 0.0, 0.0, 0.0, 45.0, 0.0, 0.0, 0.0,
            40.0, 0.0, 0.0, 0.0, 35.0, 0.0, 0.0, 0.0, 30.0, 0.0, 0.0, 0.0, 25.0, 0.0, 0.0, 0.0, 20.0, 0.0,
            0.0, 0.0, 15.0, 0.0, 0.0, 0.0, 10.0, 0.0, 0.0, 0.0, 5.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0
        ]),
    },
    rainbow: {
        name: 'rainbow',
        r: new Float32Array([
            0.0, 0.0, 0.0, 0.0, 4.0, 0.0, 0.0, 0.0, 9.0, 0.0, 0.0, 0.0, 13.0, 0.0, 0.0, 0.0, 18.0, 0.0,
            0.0, 0.0, 22.0, 0.0, 0.0, 0.0, 27.0, 0.0, 0.0, 0.0, 31.0, 0.0, 0.0, 0.0, 36.0, 0.0, 0.0, 0.0,
            40.0, 0.0, 0.0, 0.0, 45.0, 0.0, 0.0, 0.0, 50.0, 0.0, 0.0, 0.0, 54.0, 0.0, 0.0, 0.0, 58.0, 0.0,
            0.0, 0.0, 61.0, 0.0, 0.0, 0.0, 64.0, 0.0, 0.0, 0.0, 68.0, 0.0, 0.0, 0.0, 69.0, 0.0, 0.0, 0.0,
            72.0, 0.0, 0.0, 0.0, 74.0, 0.0, 0.0, 0.0, 77.0, 0.0, 0.0, 0.0, 79.0, 0.0, 0.0, 0.0, 80.0, 0.0,
            0.0, 0.0, 82.0, 0.0, 0.0, 0.0, 83.0, 0.0, 0.0, 0.0, 85.0, 0.0, 0.0, 0.0, 84.0, 0.0, 0.0, 0.0,
            86.0, 0.0, 0.0, 0.0, 87.0, 0.0, 0.0, 0.0, 88.0, 0.0, 0.0, 0.0, 86.0, 0.0, 0.0, 0.0, 87.0, 0.0,
            0.0, 0.0, 87.0, 0.0, 0.0, 0.0, 87.0, 0.0, 0.0, 0.0, 85.0, 0.0, 0.0, 0.0, 84.0, 0.0, 0.0, 0.0,
            84.0, 0.0, 0.0, 0.0, 84.0, 0.0, 0.0, 0.0, 83.0, 0.0, 0.0, 0.0, 79.0, 0.0, 0.0, 0.0, 78.0, 0.0,
            0.0, 0.0, 77.0, 0.0, 0.0, 0.0, 76.0, 0.0, 0.0, 0.0, 71.0, 0.0, 0.0, 0.0, 70.0, 0.0, 0.0, 0.0,
            68.0, 0.0, 0.0, 0.0, 66.0, 0.0, 0.0, 0.0, 60.0, 0.0, 0.0, 0.0, 58.0, 0.0, 0.0, 0.0, 55.0, 0.0,
            0.0, 0.0, 53.0, 0.0, 0.0, 0.0, 46.0, 0.0, 0.0, 0.0, 43.0, 0.0, 0.0, 0.0, 40.0, 0.0, 0.0, 0.0,
            36.0, 0.0, 0.0, 0.0, 33.0, 0.0, 0.0, 0.0, 25.0, 0.0, 0.0, 0.0, 21.0, 0.0, 0.0, 0.0, 16.0, 0.0,
            0.0, 0.0, 12.0, 0.0, 0.0, 0.0, 4.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 4.0, 0.0, 0.0, 0.0, 8.0, 0.0, 0.0, 0.0, 12.0, 0.0, 0.0, 0.0, 21.0, 0.0,
            0.0, 0.0, 25.0, 0.0, 0.0, 0.0, 29.0, 0.0, 0.0, 0.0, 33.0, 0.0, 0.0, 0.0, 42.0, 0.0, 0.0, 0.0,
            46.0, 0.0, 0.0, 0.0, 51.0, 0.0, 0.0, 0.0, 55.0, 0.0, 0.0, 0.0, 63.0, 0.0, 0.0, 0.0, 67.0, 0.0,
            0.0, 0.0, 72.0, 0.0, 0.0, 0.0, 76.0, 0.0, 0.0, 0.0, 80.0, 0.0, 0.0, 0.0, 89.0, 0.0, 0.0, 0.0,
            93.0, 0.0, 0.0, 0.0, 97.0, 0.0, 0.0, 0.0, 101.0, 0.0, 0.0, 0.0, 110.0, 0.0, 0.0, 0.0, 114.0,
            0.0, 0.0, 0.0, 119.0, 0.0, 0.0, 0.0, 123.0, 0.0, 0.0, 0.0, 131.0, 0.0, 0.0, 0.0, 135.0, 0.0,
            0.0, 0.0, 140.0, 0.0, 0.0, 0.0, 144.0, 0.0, 0.0, 0.0, 153.0, 0.0, 0.0, 0.0, 157.0, 0.0, 0.0,
            0.0, 161.0, 0.0, 0.0, 0.0, 165.0, 0.0, 0.0, 0.0, 169.0, 0.0, 0.0, 0.0, 178.0, 0.0, 0.0, 0.0,
            182.0, 0.0, 0.0, 0.0, 187.0, 0.0, 0.0, 0.0, 191.0, 0.0, 0.0, 0.0, 199.0, 0.0, 0.0, 0.0, 203.0,
            0.0, 0.0, 0.0, 208.0, 0.0, 0.0, 0.0, 212.0, 0.0, 0.0, 0.0, 221.0, 0.0, 0.0, 0.0, 225.0, 0.0,
            0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 233.0, 0.0, 0.0, 0.0, 242.0, 0.0, 0.0, 0.0, 246.0, 0.0, 0.0,
            0.0, 250.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0
        ]),
        g: new Float32Array([
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 4.0, 0.0, 0.0, 0.0, 8.0, 0.0, 0.0, 0.0, 16.0, 0.0, 0.0, 0.0, 21.0, 0.0, 0.0, 0.0, 25.0,
            0.0, 0.0, 0.0, 29.0, 0.0, 0.0, 0.0, 38.0, 0.0, 0.0, 0.0, 42.0, 0.0, 0.0, 0.0, 46.0, 0.0, 0.0,
            0.0, 51.0, 0.0, 0.0, 0.0, 55.0, 0.0, 0.0, 0.0, 63.0, 0.0, 0.0, 0.0, 67.0, 0.0, 0.0, 0.0, 72.0,
            0.0, 0.0, 0.0, 76.0, 0.0, 0.0, 0.0, 84.0, 0.0, 0.0, 0.0, 89.0, 0.0, 0.0, 0.0, 93.0, 0.0, 0.0,
            0.0, 97.0, 0.0, 0.0, 0.0, 106.0, 0.0, 0.0, 0.0, 110.0, 0.0, 0.0, 0.0, 114.0, 0.0, 0.0, 0.0,
            119.0, 0.0, 0.0, 0.0, 127.0, 0.0, 0.0, 0.0, 131.0, 0.0, 0.0, 0.0, 135.0, 0.0, 0.0, 0.0, 140.0,
            0.0, 0.0, 0.0, 144.0, 0.0, 0.0, 0.0, 152.0, 0.0, 0.0, 0.0, 157.0, 0.0, 0.0, 0.0, 161.0, 0.0,
            0.0, 0.0, 165.0, 0.0, 0.0, 0.0, 174.0, 0.0, 0.0, 0.0, 178.0, 0.0, 0.0, 0.0, 182.0, 0.0, 0.0,
            0.0, 187.0, 0.0, 0.0, 0.0, 195.0, 0.0, 0.0, 0.0, 199.0, 0.0, 0.0, 0.0, 203.0, 0.0, 0.0, 0.0,
            208.0, 0.0, 0.0, 0.0, 216.0, 0.0, 0.0, 0.0, 220.0, 0.0, 0.0, 0.0, 225.0, 0.0, 0.0, 0.0, 229.0,
            0.0, 0.0, 0.0, 233.0, 0.0, 0.0, 0.0, 242.0, 0.0, 0.0, 0.0, 246.0, 0.0, 0.0, 0.0, 250.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 250.0, 0.0, 0.0, 0.0, 242.0, 0.0, 0.0, 0.0, 238.0, 0.0, 0.0, 0.0, 233.0, 0.0,
            0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 221.0, 0.0, 0.0, 0.0, 216.0, 0.0, 0.0, 0.0, 212.0, 0.0, 0.0,
            0.0, 208.0, 0.0, 0.0, 0.0, 199.0, 0.0, 0.0, 0.0, 195.0, 0.0, 0.0, 0.0, 191.0, 0.0, 0.0, 0.0,
            187.0, 0.0, 0.0, 0.0, 178.0, 0.0, 0.0, 0.0, 174.0, 0.0, 0.0, 0.0, 170.0, 0.0, 0.0, 0.0, 165.0,
            0.0, 0.0, 0.0, 161.0, 0.0, 0.0, 0.0, 153.0, 0.0, 0.0, 0.0, 148.0, 0.0, 0.0, 0.0, 144.0, 0.0,
            0.0, 0.0, 140.0, 0.0, 0.0, 0.0, 131.0, 0.0, 0.0, 0.0, 127.0, 0.0, 0.0, 0.0, 123.0, 0.0, 0.0,
            0.0, 119.0, 0.0, 0.0, 0.0, 110.0, 0.0, 0.0, 0.0, 106.0, 0.0, 0.0, 0.0, 102.0, 0.0, 0.0, 0.0,
            97.0, 0.0, 0.0, 0.0, 89.0, 0.0, 0.0, 0.0, 85.0, 0.0, 0.0, 0.0, 80.0, 0.0, 0.0, 0.0, 76.0, 0.0,
            0.0, 0.0, 72.0, 0.0, 0.0, 0.0, 63.0, 0.0, 0.0, 0.0, 59.0, 0.0, 0.0, 0.0, 55.0, 0.0, 0.0, 0.0,
            51.0, 0.0, 0.0, 0.0, 42.0, 0.0, 0.0, 0.0, 38.0, 0.0, 0.0, 0.0, 34.0, 0.0, 0.0, 0.0, 29.0, 0.0,
            0.0, 0.0, 21.0, 0.0, 0.0, 0.0, 17.0, 0.0, 0.0, 0.0, 12.0, 0.0, 0.0, 0.0, 8.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0
        ]),
        b: new Float32Array([
            0.0, 0.0, 0.0, 0.0, 3.0, 0.0, 0.0, 0.0, 7.0, 0.0, 0.0, 0.0, 10.0, 0.0, 0.0, 0.0, 14.0, 0.0,
            0.0, 0.0, 19.0, 0.0, 0.0, 0.0, 23.0, 0.0, 0.0, 0.0, 28.0, 0.0, 0.0, 0.0, 32.0, 0.0, 0.0, 0.0,
            38.0, 0.0, 0.0, 0.0, 43.0, 0.0, 0.0, 0.0, 48.0, 0.0, 0.0, 0.0, 53.0, 0.0, 0.0, 0.0, 59.0, 0.0,
            0.0, 0.0, 63.0, 0.0, 0.0, 0.0, 68.0, 0.0, 0.0, 0.0, 72.0, 0.0, 0.0, 0.0, 77.0, 0.0, 0.0, 0.0,
            81.0, 0.0, 0.0, 0.0, 86.0, 0.0, 0.0, 0.0, 91.0, 0.0, 0.0, 0.0, 95.0, 0.0, 0.0, 0.0, 100.0,
            0.0, 0.0, 0.0, 104.0, 0.0, 0.0, 0.0, 109.0, 0.0, 0.0, 0.0, 113.0, 0.0, 0.0, 0.0, 118.0, 0.0,
            0.0, 0.0, 122.0, 0.0, 0.0, 0.0, 127.0, 0.0, 0.0, 0.0, 132.0, 0.0, 0.0, 0.0, 136.0, 0.0, 0.0,
            0.0, 141.0, 0.0, 0.0, 0.0, 145.0, 0.0, 0.0, 0.0, 150.0, 0.0, 0.0, 0.0, 154.0, 0.0, 0.0, 0.0,
            159.0, 0.0, 0.0, 0.0, 163.0, 0.0, 0.0, 0.0, 168.0, 0.0, 0.0, 0.0, 173.0, 0.0, 0.0, 0.0, 177.0,
            0.0, 0.0, 0.0, 182.0, 0.0, 0.0, 0.0, 186.0, 0.0, 0.0, 0.0, 191.0, 0.0, 0.0, 0.0, 195.0, 0.0,
            0.0, 0.0, 200.0, 0.0, 0.0, 0.0, 204.0, 0.0, 0.0, 0.0, 209.0, 0.0, 0.0, 0.0, 214.0, 0.0, 0.0,
            0.0, 218.0, 0.0, 0.0, 0.0, 223.0, 0.0, 0.0, 0.0, 227.0, 0.0, 0.0, 0.0, 232.0, 0.0, 0.0, 0.0,
            236.0, 0.0, 0.0, 0.0, 241.0, 0.0, 0.0, 0.0, 245.0, 0.0, 0.0, 0.0, 250.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 246.0, 0.0,
            0.0, 0.0, 242.0, 0.0, 0.0, 0.0, 238.0, 0.0, 0.0, 0.0, 233.0, 0.0, 0.0, 0.0, 225.0, 0.0, 0.0,
            0.0, 220.0, 0.0, 0.0, 0.0, 216.0, 0.0, 0.0, 0.0, 212.0, 0.0, 0.0, 0.0, 203.0, 0.0, 0.0, 0.0,
            199.0, 0.0, 0.0, 0.0, 195.0, 0.0, 0.0, 0.0, 191.0, 0.0, 0.0, 0.0, 187.0, 0.0, 0.0, 0.0, 178.0,
            0.0, 0.0, 0.0, 174.0, 0.0, 0.0, 0.0, 170.0, 0.0, 0.0, 0.0, 165.0, 0.0, 0.0, 0.0, 157.0, 0.0,
            0.0, 0.0, 152.0, 0.0, 0.0, 0.0, 148.0, 0.0, 0.0, 0.0, 144.0, 0.0, 0.0, 0.0, 135.0, 0.0, 0.0,
            0.0, 131.0, 0.0, 0.0, 0.0, 127.0, 0.0, 0.0, 0.0, 123.0, 0.0, 0.0, 0.0, 114.0, 0.0, 0.0, 0.0,
            110.0, 0.0, 0.0, 0.0, 106.0, 0.0, 0.0, 0.0, 102.0, 0.0, 0.0, 0.0, 97.0, 0.0, 0.0, 0.0, 89.0,
            0.0, 0.0, 0.0, 84.0, 0.0, 0.0, 0.0, 80.0, 0.0, 0.0, 0.0, 76.0, 0.0, 0.0, 0.0, 67.0, 0.0, 0.0,
            0.0, 63.0, 0.0, 0.0, 0.0, 59.0, 0.0, 0.0, 0.0, 55.0, 0.0, 0.0, 0.0, 46.0, 0.0, 0.0, 0.0, 42.0,
            0.0, 0.0, 0.0, 38.0, 0.0, 0.0, 0.0, 34.0, 0.0, 0.0, 0.0, 25.0, 0.0, 0.0, 0.0, 21.0, 0.0, 0.0,
            0.0, 16.0, 0.0, 0.0, 0.0, 12.0, 0.0, 0.0, 0.0, 8.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0
        ]),
    },
    eosb: {
        name: 'eosb',
        r: new Float32Array([
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 9.0, 0.0, 0.0, 0.0, 18.0,
            0.0, 0.0, 0.0, 27.0, 0.0, 0.0, 0.0, 36.0, 0.0, 0.0, 0.0, 45.0, 0.0, 0.0, 0.0, 49.0, 0.0, 0.0,
            0.0, 57.0, 0.0, 0.0, 0.0, 72.0, 0.0, 0.0, 0.0, 81.0, 0.0, 0.0, 0.0, 91.0, 0.0, 0.0, 0.0,
            100.0, 0.0, 0.0, 0.0, 109.0, 0.0, 0.0, 0.0, 118.0, 0.0, 0.0, 0.0, 127.0, 0.0, 0.0, 0.0, 136.0,
            0.0, 0.0, 0.0, 131.0, 0.0, 0.0, 0.0, 139.0, 0.0, 0.0, 0.0, 163.0, 0.0, 0.0, 0.0, 173.0, 0.0,
            0.0, 0.0, 182.0, 0.0, 0.0, 0.0, 191.0, 0.0, 0.0, 0.0, 200.0, 0.0, 0.0, 0.0, 209.0, 0.0, 0.0,
            0.0, 218.0, 0.0, 0.0, 0.0, 227.0, 0.0, 0.0, 0.0, 213.0, 0.0, 0.0, 0.0, 221.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 229.0, 0.0,
            0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 229.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 229.0,
            0.0, 0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 229.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            229.0, 0.0, 0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 229.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 253.0, 0.0, 0.0, 0.0, 251.0, 0.0, 0.0, 0.0, 249.0, 0.0,
            0.0, 0.0, 247.0, 0.0, 0.0, 0.0, 245.0, 0.0, 0.0, 0.0, 243.0, 0.0, 0.0, 0.0, 241.0, 0.0, 0.0,
            0.0, 215.0, 0.0, 0.0, 0.0, 214.0, 0.0, 0.0, 0.0, 235.0, 0.0, 0.0, 0.0, 234.0, 0.0, 0.0, 0.0,
            232.0, 0.0, 0.0, 0.0, 230.0, 0.0, 0.0, 0.0, 228.0, 0.0, 0.0, 0.0, 226.0, 0.0, 0.0, 0.0, 224.0,
            0.0, 0.0, 0.0, 222.0, 0.0, 0.0, 0.0, 198.0, 0.0, 0.0, 0.0, 196.0, 0.0, 0.0, 0.0, 216.0, 0.0,
            0.0, 0.0, 215.0, 0.0, 0.0, 0.0, 213.0, 0.0, 0.0, 0.0, 211.0, 0.0, 0.0, 0.0, 209.0, 0.0, 0.0,
            0.0, 207.0, 0.0, 0.0, 0.0, 205.0, 0.0, 0.0, 0.0, 203.0, 0.0, 0.0, 0.0, 181.0, 0.0, 0.0, 0.0,
            179.0, 0.0, 0.0, 0.0, 197.0, 0.0, 0.0, 0.0, 196.0, 0.0, 0.0, 0.0, 194.0, 0.0, 0.0, 0.0, 192.0,
            0.0, 0.0, 0.0, 190.0, 0.0, 0.0, 0.0, 188.0, 0.0, 0.0, 0.0, 186.0, 0.0, 0.0, 0.0, 184.0, 0.0,
            0.0, 0.0, 164.0, 0.0, 0.0, 0.0, 162.0, 0.0, 0.0, 0.0, 178.0, 0.0, 0.0, 0.0, 176.0, 0.0, 0.0,
            0.0, 175.0, 0.0, 0.0, 0.0, 173.0, 0.0, 0.0, 0.0, 171.0, 0.0, 0.0, 0.0, 169.0, 0.0, 0.0, 0.0,
            167.0, 0.0, 0.0, 0.0, 165.0, 0.0, 0.0, 0.0, 147.0, 0.0, 0.0, 0.0, 145.0, 0.0, 0.0, 0.0, 159.0,
            0.0, 0.0, 0.0, 157.0, 0.0, 0.0, 0.0, 156.0, 0.0, 0.0, 0.0, 154.0, 0.0, 0.0, 0.0, 152.0, 0.0,
            0.0, 0.0, 150.0, 0.0, 0.0, 0.0, 148.0, 0.0, 0.0, 0.0, 146.0, 0.0, 0.0, 0.0, 130.0, 0.0, 0.0,
            0.0, 128.0, 0.0, 0.0, 0.0, 140.0, 0.0, 0.0, 0.0, 138.0, 0.0, 0.0, 0.0, 137.0, 0.0, 0.0, 0.0,
            135.0, 0.0, 0.0, 0.0, 133.0, 0.0, 0.0, 0.0, 131.0, 0.0, 0.0, 0.0, 129.0, 0.0, 0.0, 0.0, 127.0,
            0.0, 0.0, 0.0, 113.0, 0.0, 0.0, 0.0, 111.0, 0.0, 0.0, 0.0, 121.0, 0.0, 0.0, 0.0, 119.0, 0.0,
            0.0, 0.0, 117.0, 0.0, 0.0, 0.0, 117.0, 0.0, 0.0, 0.0
        ]),
        g: new Float32Array([
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 7.0,
            0.0, 0.0, 0.0, 15.0, 0.0, 0.0, 0.0, 23.0, 0.0, 0.0, 0.0, 31.0, 0.0, 0.0, 0.0, 39.0, 0.0, 0.0,
            0.0, 47.0, 0.0, 0.0, 0.0, 55.0, 0.0, 0.0, 0.0, 57.0, 0.0, 0.0, 0.0, 64.0, 0.0, 0.0, 0.0, 79.0,
            0.0, 0.0, 0.0, 87.0, 0.0, 0.0, 0.0, 95.0, 0.0, 0.0, 0.0, 103.0, 0.0, 0.0, 0.0, 111.0, 0.0,
            0.0, 0.0, 119.0, 0.0, 0.0, 0.0, 127.0, 0.0, 0.0, 0.0, 135.0, 0.0, 0.0, 0.0, 129.0, 0.0, 0.0,
            0.0, 136.0, 0.0, 0.0, 0.0, 159.0, 0.0, 0.0, 0.0, 167.0, 0.0, 0.0, 0.0, 175.0, 0.0, 0.0, 0.0,
            183.0, 0.0, 0.0, 0.0, 191.0, 0.0, 0.0, 0.0, 199.0, 0.0, 0.0, 0.0, 207.0, 0.0, 0.0, 0.0, 215.0,
            0.0, 0.0, 0.0, 200.0, 0.0, 0.0, 0.0, 207.0, 0.0, 0.0, 0.0, 239.0, 0.0, 0.0, 0.0, 247.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 229.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 229.0, 0.0,
            0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 250.0,
            0.0, 0.0, 0.0, 246.0, 0.0, 0.0, 0.0, 242.0, 0.0, 0.0, 0.0, 238.0, 0.0, 0.0, 0.0, 233.0, 0.0,
            0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 225.0, 0.0, 0.0, 0.0, 198.0, 0.0, 0.0, 0.0, 195.0, 0.0, 0.0,
            0.0, 212.0, 0.0, 0.0, 0.0, 208.0, 0.0, 0.0, 0.0, 204.0, 0.0, 0.0, 0.0, 199.0, 0.0, 0.0, 0.0,
            195.0, 0.0, 0.0, 0.0, 191.0, 0.0, 0.0, 0.0, 187.0, 0.0, 0.0, 0.0, 182.0, 0.0, 0.0, 0.0, 160.0,
            0.0, 0.0, 0.0, 156.0, 0.0, 0.0, 0.0, 169.0, 0.0, 0.0, 0.0, 165.0, 0.0, 0.0, 0.0, 161.0, 0.0,
            0.0, 0.0, 157.0, 0.0, 0.0, 0.0, 153.0, 0.0, 0.0, 0.0, 148.0, 0.0, 0.0, 0.0, 144.0, 0.0, 0.0,
            0.0, 140.0, 0.0, 0.0, 0.0, 122.0, 0.0, 0.0, 0.0, 118.0, 0.0, 0.0, 0.0, 127.0, 0.0, 0.0, 0.0,
            125.0, 0.0, 0.0, 0.0, 123.0, 0.0, 0.0, 0.0, 121.0, 0.0, 0.0, 0.0, 119.0, 0.0, 0.0, 0.0, 116.0,
            0.0, 0.0, 0.0, 114.0, 0.0, 0.0, 0.0, 112.0, 0.0, 0.0, 0.0, 99.0, 0.0, 0.0, 0.0, 97.0, 0.0,
            0.0, 0.0, 106.0, 0.0, 0.0, 0.0, 104.0, 0.0, 0.0, 0.0, 102.0, 0.0, 0.0, 0.0, 99.0, 0.0, 0.0,
            0.0, 97.0, 0.0, 0.0, 0.0, 95.0, 0.0, 0.0, 0.0, 93.0, 0.0, 0.0, 0.0, 91.0, 0.0, 0.0, 0.0, 80.0,
            0.0, 0.0, 0.0, 78.0, 0.0, 0.0, 0.0, 84.0, 0.0, 0.0, 0.0, 82.0, 0.0, 0.0, 0.0, 80.0, 0.0, 0.0,
            0.0, 78.0, 0.0, 0.0, 0.0, 76.0, 0.0, 0.0, 0.0, 74.0, 0.0, 0.0, 0.0, 72.0, 0.0, 0.0, 0.0, 70.0,
            0.0, 0.0, 0.0, 61.0, 0.0, 0.0, 0.0, 59.0, 0.0, 0.0, 0.0, 63.0, 0.0, 0.0, 0.0, 61.0, 0.0, 0.0,
            0.0, 59.0, 0.0, 0.0, 0.0, 57.0, 0.0, 0.0, 0.0, 55.0, 0.0, 0.0, 0.0, 53.0, 0.0, 0.0, 0.0, 50.0,
            0.0, 0.0, 0.0, 48.0, 0.0, 0.0, 0.0, 42.0, 0.0, 0.0, 0.0, 40.0, 0.0, 0.0, 0.0, 42.0, 0.0, 0.0,
            0.0, 40.0, 0.0, 0.0, 0.0, 38.0, 0.0, 0.0, 0.0, 36.0, 0.0, 0.0, 0.0, 33.0, 0.0, 0.0, 0.0, 31.0,
            0.0, 0.0, 0.0, 29.0, 0.0, 0.0, 0.0, 27.0, 0.0, 0.0, 0.0, 22.0, 0.0, 0.0, 0.0, 21.0, 0.0, 0.0,
            0.0, 21.0, 0.0, 0.0, 0.0, 19.0, 0.0, 0.0, 0.0, 16.0, 0.0, 0.0, 0.0, 14.0, 0.0, 0.0, 0.0, 12.0,
            0.0, 0.0, 0.0, 13.0, 0.0, 0.0, 0.0, 8.0, 0.0, 0.0, 0.0, 6.0, 0.0, 0.0, 0.0, 3.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0
        ]),
        b: new Float32Array([
            116.0, 0.0, 0.0, 0.0, 121.0, 0.0, 0.0, 0.0, 127.0, 0.0, 0.0, 0.0, 131.0, 0.0, 0.0, 0.0, 136.0,
            0.0, 0.0, 0.0, 140.0, 0.0, 0.0, 0.0, 144.0, 0.0, 0.0, 0.0, 148.0, 0.0, 0.0, 0.0, 153.0, 0.0,
            0.0, 0.0, 157.0, 0.0, 0.0, 0.0, 145.0, 0.0, 0.0, 0.0, 149.0, 0.0, 0.0, 0.0, 170.0, 0.0, 0.0,
            0.0, 174.0, 0.0, 0.0, 0.0, 178.0, 0.0, 0.0, 0.0, 182.0, 0.0, 0.0, 0.0, 187.0, 0.0, 0.0, 0.0,
            191.0, 0.0, 0.0, 0.0, 195.0, 0.0, 0.0, 0.0, 199.0, 0.0, 0.0, 0.0, 183.0, 0.0, 0.0, 0.0, 187.0,
            0.0, 0.0, 0.0, 212.0, 0.0, 0.0, 0.0, 216.0, 0.0, 0.0, 0.0, 221.0, 0.0, 0.0, 0.0, 225.0, 0.0,
            0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 233.0, 0.0, 0.0, 0.0, 238.0, 0.0, 0.0, 0.0, 242.0, 0.0, 0.0,
            0.0, 221.0, 0.0, 0.0, 0.0, 225.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 247.0, 0.0, 0.0, 0.0,
            239.0, 0.0, 0.0, 0.0, 231.0, 0.0, 0.0, 0.0, 223.0, 0.0, 0.0, 0.0, 215.0, 0.0, 0.0, 0.0, 207.0,
            0.0, 0.0, 0.0, 199.0, 0.0, 0.0, 0.0, 172.0, 0.0, 0.0, 0.0, 164.0, 0.0, 0.0, 0.0, 175.0, 0.0,
            0.0, 0.0, 167.0, 0.0, 0.0, 0.0, 159.0, 0.0, 0.0, 0.0, 151.0, 0.0, 0.0, 0.0, 143.0, 0.0, 0.0,
            0.0, 135.0, 0.0, 0.0, 0.0, 127.0, 0.0, 0.0, 0.0, 119.0, 0.0, 0.0, 0.0, 100.0, 0.0, 0.0, 0.0,
            93.0, 0.0, 0.0, 0.0, 95.0, 0.0, 0.0, 0.0, 87.0, 0.0, 0.0, 0.0, 79.0, 0.0, 0.0, 0.0, 71.0, 0.0,
            0.0, 0.0, 63.0, 0.0, 0.0, 0.0, 55.0, 0.0, 0.0, 0.0, 47.0, 0.0, 0.0, 0.0, 39.0, 0.0, 0.0, 0.0,
            28.0, 0.0, 0.0, 0.0, 21.0, 0.0, 0.0, 0.0, 15.0, 0.0, 0.0, 0.0, 7.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0
        ]),
    },
    cubehelix: {
        name: 'cubehelix',
        r: new Float32Array([
            0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 3.0, 0.0, 0.0, 0.0, 4.0, 0.0, 0.0, 0.0, 6.0, 0.0, 0.0,
            0.0, 8.0, 0.0, 0.0, 0.0, 9.0, 0.0, 0.0, 0.0, 10.0, 0.0, 0.0, 0.0, 12.0, 0.0, 0.0, 0.0, 13.0,
            0.0, 0.0, 0.0, 14.0, 0.0, 0.0, 0.0, 15.0, 0.0, 0.0, 0.0, 17.0, 0.0, 0.0, 0.0, 18.0, 0.0, 0.0,
            0.0, 19.0, 0.0, 0.0, 0.0, 20.0, 0.0, 0.0, 0.0, 20.0, 0.0, 0.0, 0.0, 21.0, 0.0, 0.0, 0.0, 22.0,
            0.0, 0.0, 0.0, 23.0, 0.0, 0.0, 0.0, 23.0, 0.0, 0.0, 0.0, 24.0, 0.0, 0.0, 0.0, 24.0, 0.0, 0.0,
            0.0, 25.0, 0.0, 0.0, 0.0, 25.0, 0.0, 0.0, 0.0, 25.0, 0.0, 0.0, 0.0, 26.0, 0.0, 0.0, 0.0, 26.0,
            0.0, 0.0, 0.0, 26.0, 0.0, 0.0, 0.0, 26.0, 0.0, 0.0, 0.0, 26.0, 0.0, 0.0, 0.0, 26.0, 0.0, 0.0,
            0.0, 26.0, 0.0, 0.0, 0.0, 26.0, 0.0, 0.0, 0.0, 26.0, 0.0, 0.0, 0.0, 26.0, 0.0, 0.0, 0.0, 26.0,
            0.0, 0.0, 0.0, 25.0, 0.0, 0.0, 0.0, 25.0, 0.0, 0.0, 0.0, 25.0, 0.0, 0.0, 0.0, 25.0, 0.0, 0.0,
            0.0, 24.0, 0.0, 0.0, 0.0, 24.0, 0.0, 0.0, 0.0, 24.0, 0.0, 0.0, 0.0, 23.0, 0.0, 0.0, 0.0, 23.0,
            0.0, 0.0, 0.0, 23.0, 0.0, 0.0, 0.0, 23.0, 0.0, 0.0, 0.0, 22.0, 0.0, 0.0, 0.0, 22.0, 0.0, 0.0,
            0.0, 22.0, 0.0, 0.0, 0.0, 21.0, 0.0, 0.0, 0.0, 21.0, 0.0, 0.0, 0.0, 21.0, 0.0, 0.0, 0.0, 21.0,
            0.0, 0.0, 0.0, 21.0, 0.0, 0.0, 0.0, 21.0, 0.0, 0.0, 0.0, 20.0, 0.0, 0.0, 0.0, 20.0, 0.0, 0.0,
            0.0, 20.0, 0.0, 0.0, 0.0, 21.0, 0.0, 0.0, 0.0, 21.0, 0.0, 0.0, 0.0, 21.0, 0.0, 0.0, 0.0, 21.0,
            0.0, 0.0, 0.0, 21.0, 0.0, 0.0, 0.0, 22.0, 0.0, 0.0, 0.0, 22.0, 0.0, 0.0, 0.0, 22.0, 0.0, 0.0,
            0.0, 23.0, 0.0, 0.0, 0.0, 23.0, 0.0, 0.0, 0.0, 24.0, 0.0, 0.0, 0.0, 25.0, 0.0, 0.0, 0.0, 26.0,
            0.0, 0.0, 0.0, 27.0, 0.0, 0.0, 0.0, 27.0, 0.0, 0.0, 0.0, 28.0, 0.0, 0.0, 0.0, 30.0, 0.0, 0.0,
            0.0, 31.0, 0.0, 0.0, 0.0, 32.0, 0.0, 0.0, 0.0, 33.0, 0.0, 0.0, 0.0, 35.0, 0.0, 0.0, 0.0, 36.0,
            0.0, 0.0, 0.0, 38.0, 0.0, 0.0, 0.0, 39.0, 0.0, 0.0, 0.0, 41.0, 0.0, 0.0, 0.0, 43.0, 0.0, 0.0,
            0.0, 45.0, 0.0, 0.0, 0.0, 47.0, 0.0, 0.0, 0.0, 49.0, 0.0, 0.0, 0.0, 51.0, 0.0, 0.0, 0.0, 53.0,
            0.0, 0.0, 0.0, 55.0, 0.0, 0.0, 0.0, 57.0, 0.0, 0.0, 0.0, 60.0, 0.0, 0.0, 0.0, 62.0, 0.0, 0.0,
            0.0, 65.0, 0.0, 0.0, 0.0, 67.0, 0.0, 0.0, 0.0, 70.0, 0.0, 0.0, 0.0, 72.0, 0.0, 0.0, 0.0, 75.0,
            0.0, 0.0, 0.0, 78.0, 0.0, 0.0, 0.0, 81.0, 0.0, 0.0, 0.0, 83.0, 0.0, 0.0, 0.0, 86.0, 0.0, 0.0,
            0.0, 89.0, 0.0, 0.0, 0.0, 92.0, 0.0, 0.0, 0.0, 95.0, 0.0, 0.0, 0.0, 98.0, 0.0, 0.0, 0.0,
            101.0, 0.0, 0.0, 0.0, 104.0, 0.0, 0.0, 0.0, 107.0, 0.0, 0.0, 0.0, 110.0, 0.0, 0.0, 0.0, 113.0,
            0.0, 0.0, 0.0, 116.0, 0.0, 0.0, 0.0, 120.0, 0.0, 0.0, 0.0, 123.0, 0.0, 0.0, 0.0, 126.0, 0.0,
            0.0, 0.0, 129.0, 0.0, 0.0, 0.0, 132.0, 0.0, 0.0, 0.0, 135.0, 0.0, 0.0, 0.0, 138.0, 0.0, 0.0,
            0.0, 141.0, 0.0, 0.0, 0.0, 144.0, 0.0, 0.0, 0.0, 147.0, 0.0, 0.0, 0.0, 150.0, 0.0, 0.0, 0.0,
            153.0, 0.0, 0.0, 0.0, 155.0, 0.0, 0.0, 0.0, 158.0, 0.0, 0.0, 0.0, 161.0, 0.0, 0.0, 0.0, 164.0,
            0.0, 0.0, 0.0, 166.0, 0.0, 0.0, 0.0, 169.0, 0.0, 0.0, 0.0, 171.0, 0.0, 0.0, 0.0, 174.0, 0.0,
            0.0, 0.0, 176.0, 0.0, 0.0, 0.0, 178.0, 0.0, 0.0, 0.0, 181.0, 0.0, 0.0, 0.0, 183.0, 0.0, 0.0,
            0.0, 185.0, 0.0, 0.0, 0.0, 187.0, 0.0, 0.0, 0.0, 189.0, 0.0, 0.0, 0.0, 191.0, 0.0, 0.0, 0.0,
            193.0, 0.0, 0.0, 0.0, 194.0, 0.0, 0.0, 0.0, 196.0, 0.0, 0.0, 0.0, 198.0, 0.0, 0.0, 0.0, 199.0,
            0.0, 0.0, 0.0, 201.0, 0.0, 0.0, 0.0, 202.0, 0.0, 0.0, 0.0, 203.0, 0.0, 0.0, 0.0, 204.0, 0.0,
            0.0, 0.0, 205.0, 0.0, 0.0, 0.0, 206.0, 0.0, 0.0, 0.0, 207.0, 0.0, 0.0, 0.0, 208.0, 0.0, 0.0,
            0.0, 209.0, 0.0, 0.0, 0.0, 209.0, 0.0, 0.0, 0.0, 210.0, 0.0, 0.0, 0.0, 211.0, 0.0, 0.0, 0.0,
            211.0, 0.0, 0.0, 0.0, 211.0, 0.0, 0.0, 0.0, 212.0, 0.0, 0.0, 0.0, 212.0, 0.0, 0.0, 0.0, 212.0,
            0.0, 0.0, 0.0, 212.0, 0.0, 0.0, 0.0, 212.0, 0.0, 0.0, 0.0, 212.0, 0.0, 0.0, 0.0, 212.0, 0.0,
            0.0, 0.0, 212.0, 0.0, 0.0, 0.0, 211.0, 0.0, 0.0, 0.0, 211.0, 0.0, 0.0, 0.0, 211.0, 0.0, 0.0,
            0.0, 210.0, 0.0, 0.0, 0.0, 210.0, 0.0, 0.0, 0.0, 210.0, 0.0, 0.0, 0.0, 209.0, 0.0, 0.0, 0.0,
            208.0, 0.0, 0.0, 0.0, 208.0, 0.0, 0.0, 0.0, 207.0, 0.0, 0.0, 0.0, 207.0, 0.0, 0.0, 0.0, 206.0,
            0.0, 0.0, 0.0, 205.0, 0.0, 0.0, 0.0, 205.0, 0.0, 0.0, 0.0, 204.0, 0.0, 0.0, 0.0, 203.0, 0.0,
            0.0, 0.0, 203.0, 0.0, 0.0, 0.0, 202.0, 0.0, 0.0, 0.0, 201.0, 0.0, 0.0, 0.0, 201.0, 0.0, 0.0,
            0.0, 200.0, 0.0, 0.0, 0.0, 199.0, 0.0, 0.0, 0.0, 199.0, 0.0, 0.0, 0.0, 198.0, 0.0, 0.0, 0.0,
            197.0, 0.0, 0.0, 0.0, 197.0, 0.0, 0.0, 0.0, 196.0, 0.0, 0.0, 0.0, 196.0, 0.0, 0.0, 0.0, 195.0,
            0.0, 0.0, 0.0, 195.0, 0.0, 0.0, 0.0, 194.0, 0.0, 0.0, 0.0, 194.0, 0.0, 0.0, 0.0, 194.0, 0.0,
            0.0, 0.0, 193.0, 0.0, 0.0, 0.0, 193.0, 0.0, 0.0, 0.0, 193.0, 0.0, 0.0, 0.0, 193.0, 0.0, 0.0,
            0.0, 193.0, 0.0, 0.0, 0.0, 193.0, 0.0, 0.0, 0.0, 193.0, 0.0, 0.0, 0.0, 193.0, 0.0, 0.0, 0.0,
            193.0, 0.0, 0.0, 0.0, 193.0, 0.0, 0.0, 0.0, 194.0, 0.0, 0.0, 0.0, 194.0, 0.0, 0.0, 0.0, 195.0,
            0.0, 0.0, 0.0, 195.0, 0.0, 0.0, 0.0, 196.0, 0.0, 0.0, 0.0, 196.0, 0.0, 0.0, 0.0, 197.0, 0.0,
            0.0, 0.0, 198.0, 0.0, 0.0, 0.0, 199.0, 0.0, 0.0, 0.0, 200.0, 0.0, 0.0, 0.0, 200.0, 0.0, 0.0,
            0.0, 202.0, 0.0, 0.0, 0.0, 203.0, 0.0, 0.0, 0.0, 204.0, 0.0, 0.0, 0.0, 205.0, 0.0, 0.0, 0.0,
            206.0, 0.0, 0.0, 0.0, 208.0, 0.0, 0.0, 0.0, 209.0, 0.0, 0.0, 0.0, 210.0, 0.0, 0.0, 0.0, 212.0,
            0.0, 0.0, 0.0, 213.0, 0.0, 0.0, 0.0, 215.0, 0.0, 0.0, 0.0, 217.0, 0.0, 0.0, 0.0, 218.0, 0.0,
            0.0, 0.0, 220.0, 0.0, 0.0, 0.0, 222.0, 0.0, 0.0, 0.0, 223.0, 0.0, 0.0, 0.0, 225.0, 0.0, 0.0,
            0.0, 227.0, 0.0, 0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 231.0, 0.0, 0.0, 0.0, 232.0, 0.0, 0.0, 0.0,
            234.0, 0.0, 0.0, 0.0, 236.0, 0.0, 0.0, 0.0, 238.0, 0.0, 0.0, 0.0, 240.0, 0.0, 0.0, 0.0, 242.0,
            0.0, 0.0, 0.0, 244.0, 0.0, 0.0, 0.0, 245.0, 0.0, 0.0, 0.0, 247.0, 0.0, 0.0, 0.0, 249.0, 0.0,
            0.0, 0.0, 251.0, 0.0, 0.0, 0.0, 253.0, 0.0, 0.0, 0.0, 255.0
        ]),
        g: new Float32Array([
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 2.0, 0.0, 0.0,
            0.0, 2.0, 0.0, 0.0, 0.0, 3.0, 0.0, 0.0, 0.0, 4.0, 0.0, 0.0, 0.0, 4.0, 0.0, 0.0, 0.0, 5.0, 0.0,
            0.0, 0.0, 6.0, 0.0, 0.0, 0.0, 6.0, 0.0, 0.0, 0.0, 7.0, 0.0, 0.0, 0.0, 8.0, 0.0, 0.0, 0.0, 9.0,
            0.0, 0.0, 0.0, 10.0, 0.0, 0.0, 0.0, 11.0, 0.0, 0.0, 0.0, 11.0, 0.0, 0.0, 0.0, 12.0, 0.0, 0.0,
            0.0, 13.0, 0.0, 0.0, 0.0, 14.0, 0.0, 0.0, 0.0, 15.0, 0.0, 0.0, 0.0, 17.0, 0.0, 0.0, 0.0, 18.0,
            0.0, 0.0, 0.0, 19.0, 0.0, 0.0, 0.0, 20.0, 0.0, 0.0, 0.0, 21.0, 0.0, 0.0, 0.0, 22.0, 0.0, 0.0,
            0.0, 24.0, 0.0, 0.0, 0.0, 25.0, 0.0, 0.0, 0.0, 26.0, 0.0, 0.0, 0.0, 28.0, 0.0, 0.0, 0.0, 29.0,
            0.0, 0.0, 0.0, 31.0, 0.0, 0.0, 0.0, 32.0, 0.0, 0.0, 0.0, 34.0, 0.0, 0.0, 0.0, 35.0, 0.0, 0.0,
            0.0, 37.0, 0.0, 0.0, 0.0, 38.0, 0.0, 0.0, 0.0, 40.0, 0.0, 0.0, 0.0, 41.0, 0.0, 0.0, 0.0, 43.0,
            0.0, 0.0, 0.0, 45.0, 0.0, 0.0, 0.0, 46.0, 0.0, 0.0, 0.0, 48.0, 0.0, 0.0, 0.0, 50.0, 0.0, 0.0,
            0.0, 52.0, 0.0, 0.0, 0.0, 53.0, 0.0, 0.0, 0.0, 55.0, 0.0, 0.0, 0.0, 57.0, 0.0, 0.0, 0.0, 58.0,
            0.0, 0.0, 0.0, 60.0, 0.0, 0.0, 0.0, 62.0, 0.0, 0.0, 0.0, 64.0, 0.0, 0.0, 0.0, 66.0, 0.0, 0.0,
            0.0, 67.0, 0.0, 0.0, 0.0, 69.0, 0.0, 0.0, 0.0, 71.0, 0.0, 0.0, 0.0, 73.0, 0.0, 0.0, 0.0, 74.0,
            0.0, 0.0, 0.0, 76.0, 0.0, 0.0, 0.0, 78.0, 0.0, 0.0, 0.0, 79.0, 0.0, 0.0, 0.0, 81.0, 0.0, 0.0,
            0.0, 83.0, 0.0, 0.0, 0.0, 84.0, 0.0, 0.0, 0.0, 86.0, 0.0, 0.0, 0.0, 88.0, 0.0, 0.0, 0.0, 89.0,
            0.0, 0.0, 0.0, 91.0, 0.0, 0.0, 0.0, 92.0, 0.0, 0.0, 0.0, 94.0, 0.0, 0.0, 0.0, 95.0, 0.0, 0.0,
            0.0, 97.0, 0.0, 0.0, 0.0, 98.0, 0.0, 0.0, 0.0, 99.0, 0.0, 0.0, 0.0, 101.0, 0.0, 0.0, 0.0,
            102.0, 0.0, 0.0, 0.0, 103.0, 0.0, 0.0, 0.0, 104.0, 0.0, 0.0, 0.0, 106.0, 0.0, 0.0, 0.0, 107.0,
            0.0, 0.0, 0.0, 108.0, 0.0, 0.0, 0.0, 109.0, 0.0, 0.0, 0.0, 110.0, 0.0, 0.0, 0.0, 111.0, 0.0,
            0.0, 0.0, 112.0, 0.0, 0.0, 0.0, 113.0, 0.0, 0.0, 0.0, 114.0, 0.0, 0.0, 0.0, 114.0, 0.0, 0.0,
            0.0, 115.0, 0.0, 0.0, 0.0, 116.0, 0.0, 0.0, 0.0, 116.0, 0.0, 0.0, 0.0, 117.0, 0.0, 0.0, 0.0,
            118.0, 0.0, 0.0, 0.0, 118.0, 0.0, 0.0, 0.0, 119.0, 0.0, 0.0, 0.0, 119.0, 0.0, 0.0, 0.0, 120.0,
            0.0, 0.0, 0.0, 120.0, 0.0, 0.0, 0.0, 120.0, 0.0, 0.0, 0.0, 121.0, 0.0, 0.0, 0.0, 121.0, 0.0,
            0.0, 0.0, 121.0, 0.0, 0.0, 0.0, 121.0, 0.0, 0.0, 0.0, 122.0, 0.0, 0.0, 0.0, 122.0, 0.0, 0.0,
            0.0, 122.0, 0.0, 0.0, 0.0, 122.0, 0.0, 0.0, 0.0, 122.0, 0.0, 0.0, 0.0, 122.0, 0.0, 0.0, 0.0,
            122.0, 0.0, 0.0, 0.0, 122.0, 0.0, 0.0, 0.0, 122.0, 0.0, 0.0, 0.0, 122.0, 0.0, 0.0, 0.0, 122.0,
            0.0, 0.0, 0.0, 122.0, 0.0, 0.0, 0.0, 122.0, 0.0, 0.0, 0.0, 122.0, 0.0, 0.0, 0.0, 122.0, 0.0,
            0.0, 0.0, 121.0, 0.0, 0.0, 0.0, 121.0, 0.0, 0.0, 0.0, 121.0, 0.0, 0.0, 0.0, 121.0, 0.0, 0.0,
            0.0, 121.0, 0.0, 0.0, 0.0, 121.0, 0.0, 0.0, 0.0, 121.0, 0.0, 0.0, 0.0, 121.0, 0.0, 0.0, 0.0,
            121.0, 0.0, 0.0, 0.0, 120.0, 0.0, 0.0, 0.0, 120.0, 0.0, 0.0, 0.0, 120.0, 0.0, 0.0, 0.0, 120.0,
            0.0, 0.0, 0.0, 120.0, 0.0, 0.0, 0.0, 120.0, 0.0, 0.0, 0.0, 120.0, 0.0, 0.0, 0.0, 120.0, 0.0,
            0.0, 0.0, 120.0, 0.0, 0.0, 0.0, 120.0, 0.0, 0.0, 0.0, 121.0, 0.0, 0.0, 0.0, 121.0, 0.0, 0.0,
            0.0, 121.0, 0.0, 0.0, 0.0, 121.0, 0.0, 0.0, 0.0, 121.0, 0.0, 0.0, 0.0, 122.0, 0.0, 0.0, 0.0,
            122.0, 0.0, 0.0, 0.0, 122.0, 0.0, 0.0, 0.0, 123.0, 0.0, 0.0, 0.0, 123.0, 0.0, 0.0, 0.0, 124.0,
            0.0, 0.0, 0.0, 124.0, 0.0, 0.0, 0.0, 125.0, 0.0, 0.0, 0.0, 125.0, 0.0, 0.0, 0.0, 126.0, 0.0,
            0.0, 0.0, 127.0, 0.0, 0.0, 0.0, 127.0, 0.0, 0.0, 0.0, 128.0, 0.0, 0.0, 0.0, 129.0, 0.0, 0.0,
            0.0, 130.0, 0.0, 0.0, 0.0, 131.0, 0.0, 0.0, 0.0, 131.0, 0.0, 0.0, 0.0, 132.0, 0.0, 0.0, 0.0,
            133.0, 0.0, 0.0, 0.0, 135.0, 0.0, 0.0, 0.0, 136.0, 0.0, 0.0, 0.0, 137.0, 0.0, 0.0, 0.0, 138.0,
            0.0, 0.0, 0.0, 139.0, 0.0, 0.0, 0.0, 140.0, 0.0, 0.0, 0.0, 142.0, 0.0, 0.0, 0.0, 143.0, 0.0,
            0.0, 0.0, 144.0, 0.0, 0.0, 0.0, 146.0, 0.0, 0.0, 0.0, 147.0, 0.0, 0.0, 0.0, 149.0, 0.0, 0.0,
            0.0, 150.0, 0.0, 0.0, 0.0, 152.0, 0.0, 0.0, 0.0, 154.0, 0.0, 0.0, 0.0, 155.0, 0.0, 0.0, 0.0,
            157.0, 0.0, 0.0, 0.0, 158.0, 0.0, 0.0, 0.0, 160.0, 0.0, 0.0, 0.0, 162.0, 0.0, 0.0, 0.0, 164.0,
            0.0, 0.0, 0.0, 165.0, 0.0, 0.0, 0.0, 167.0, 0.0, 0.0, 0.0, 169.0, 0.0, 0.0, 0.0, 171.0, 0.0,
            0.0, 0.0, 172.0, 0.0, 0.0, 0.0, 174.0, 0.0, 0.0, 0.0, 176.0, 0.0, 0.0, 0.0, 178.0, 0.0, 0.0,
            0.0, 180.0, 0.0, 0.0, 0.0, 182.0, 0.0, 0.0, 0.0, 183.0, 0.0, 0.0, 0.0, 185.0, 0.0, 0.0, 0.0,
            187.0, 0.0, 0.0, 0.0, 189.0, 0.0, 0.0, 0.0, 191.0, 0.0, 0.0, 0.0, 193.0, 0.0, 0.0, 0.0, 194.0,
            0.0, 0.0, 0.0, 196.0, 0.0, 0.0, 0.0, 198.0, 0.0, 0.0, 0.0, 200.0, 0.0, 0.0, 0.0, 202.0, 0.0,
            0.0, 0.0, 203.0, 0.0, 0.0, 0.0, 205.0, 0.0, 0.0, 0.0, 207.0, 0.0, 0.0, 0.0, 208.0, 0.0, 0.0,
            0.0, 210.0, 0.0, 0.0, 0.0, 212.0, 0.0, 0.0, 0.0, 213.0, 0.0, 0.0, 0.0, 215.0, 0.0, 0.0, 0.0,
            216.0, 0.0, 0.0, 0.0, 218.0, 0.0, 0.0, 0.0, 219.0, 0.0, 0.0, 0.0, 221.0, 0.0, 0.0, 0.0, 222.0,
            0.0, 0.0, 0.0, 224.0, 0.0, 0.0, 0.0, 225.0, 0.0, 0.0, 0.0, 226.0, 0.0, 0.0, 0.0, 228.0, 0.0,
            0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 230.0, 0.0, 0.0, 0.0, 231.0, 0.0, 0.0, 0.0, 232.0, 0.0, 0.0,
            0.0, 233.0, 0.0, 0.0, 0.0, 235.0, 0.0, 0.0, 0.0, 236.0, 0.0, 0.0, 0.0, 237.0, 0.0, 0.0, 0.0,
            238.0, 0.0, 0.0, 0.0, 239.0, 0.0, 0.0, 0.0, 240.0, 0.0, 0.0, 0.0, 240.0, 0.0, 0.0, 0.0, 241.0,
            0.0, 0.0, 0.0, 242.0, 0.0, 0.0, 0.0, 243.0, 0.0, 0.0, 0.0, 244.0, 0.0, 0.0, 0.0, 244.0, 0.0,
            0.0, 0.0, 245.0, 0.0, 0.0, 0.0, 246.0, 0.0, 0.0, 0.0, 247.0, 0.0, 0.0, 0.0, 247.0, 0.0, 0.0,
            0.0, 248.0, 0.0, 0.0, 0.0, 248.0, 0.0, 0.0, 0.0, 249.0, 0.0, 0.0, 0.0, 250.0, 0.0, 0.0, 0.0,
            250.0, 0.0, 0.0, 0.0, 251.0, 0.0, 0.0, 0.0, 251.0, 0.0, 0.0, 0.0, 252.0, 0.0, 0.0, 0.0, 252.0,
            0.0, 0.0, 0.0, 253.0, 0.0, 0.0, 0.0, 253.0, 0.0, 0.0, 0.0, 254.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0
        ]),
        b: new Float32Array([
            0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 3.0, 0.0, 0.0, 0.0, 4.0, 0.0, 0.0, 0.0, 6.0, 0.0, 0.0,
            0.0, 8.0, 0.0, 0.0, 0.0, 9.0, 0.0, 0.0, 0.0, 11.0, 0.0, 0.0, 0.0, 13.0, 0.0, 0.0, 0.0, 15.0,
            0.0, 0.0, 0.0, 17.0, 0.0, 0.0, 0.0, 19.0, 0.0, 0.0, 0.0, 21.0, 0.0, 0.0, 0.0, 23.0, 0.0, 0.0,
            0.0, 25.0, 0.0, 0.0, 0.0, 27.0, 0.0, 0.0, 0.0, 29.0, 0.0, 0.0, 0.0, 31.0, 0.0, 0.0, 0.0, 33.0,
            0.0, 0.0, 0.0, 35.0, 0.0, 0.0, 0.0, 37.0, 0.0, 0.0, 0.0, 39.0, 0.0, 0.0, 0.0, 41.0, 0.0, 0.0,
            0.0, 43.0, 0.0, 0.0, 0.0, 45.0, 0.0, 0.0, 0.0, 47.0, 0.0, 0.0, 0.0, 48.0, 0.0, 0.0, 0.0, 50.0,
            0.0, 0.0, 0.0, 52.0, 0.0, 0.0, 0.0, 54.0, 0.0, 0.0, 0.0, 56.0, 0.0, 0.0, 0.0, 57.0, 0.0, 0.0,
            0.0, 59.0, 0.0, 0.0, 0.0, 60.0, 0.0, 0.0, 0.0, 62.0, 0.0, 0.0, 0.0, 63.0, 0.0, 0.0, 0.0, 65.0,
            0.0, 0.0, 0.0, 66.0, 0.0, 0.0, 0.0, 67.0, 0.0, 0.0, 0.0, 69.0, 0.0, 0.0, 0.0, 70.0, 0.0, 0.0,
            0.0, 71.0, 0.0, 0.0, 0.0, 72.0, 0.0, 0.0, 0.0, 73.0, 0.0, 0.0, 0.0, 74.0, 0.0, 0.0, 0.0, 74.0,
            0.0, 0.0, 0.0, 75.0, 0.0, 0.0, 0.0, 76.0, 0.0, 0.0, 0.0, 76.0, 0.0, 0.0, 0.0, 77.0, 0.0, 0.0,
            0.0, 77.0, 0.0, 0.0, 0.0, 77.0, 0.0, 0.0, 0.0, 78.0, 0.0, 0.0, 0.0, 78.0, 0.0, 0.0, 0.0, 78.0,
            0.0, 0.0, 0.0, 78.0, 0.0, 0.0, 0.0, 78.0, 0.0, 0.0, 0.0, 78.0, 0.0, 0.0, 0.0, 78.0, 0.0, 0.0,
            0.0, 77.0, 0.0, 0.0, 0.0, 77.0, 0.0, 0.0, 0.0, 77.0, 0.0, 0.0, 0.0, 76.0, 0.0, 0.0, 0.0, 76.0,
            0.0, 0.0, 0.0, 75.0, 0.0, 0.0, 0.0, 75.0, 0.0, 0.0, 0.0, 74.0, 0.0, 0.0, 0.0, 73.0, 0.0, 0.0,
            0.0, 73.0, 0.0, 0.0, 0.0, 72.0, 0.0, 0.0, 0.0, 71.0, 0.0, 0.0, 0.0, 70.0, 0.0, 0.0, 0.0, 69.0,
            0.0, 0.0, 0.0, 68.0, 0.0, 0.0, 0.0, 67.0, 0.0, 0.0, 0.0, 66.0, 0.0, 0.0, 0.0, 66.0, 0.0, 0.0,
            0.0, 65.0, 0.0, 0.0, 0.0, 64.0, 0.0, 0.0, 0.0, 63.0, 0.0, 0.0, 0.0, 61.0, 0.0, 0.0, 0.0, 60.0,
            0.0, 0.0, 0.0, 59.0, 0.0, 0.0, 0.0, 58.0, 0.0, 0.0, 0.0, 58.0, 0.0, 0.0, 0.0, 57.0, 0.0, 0.0,
            0.0, 56.0, 0.0, 0.0, 0.0, 55.0, 0.0, 0.0, 0.0, 54.0, 0.0, 0.0, 0.0, 53.0, 0.0, 0.0, 0.0, 52.0,
            0.0, 0.0, 0.0, 51.0, 0.0, 0.0, 0.0, 51.0, 0.0, 0.0, 0.0, 50.0, 0.0, 0.0, 0.0, 49.0, 0.0, 0.0,
            0.0, 49.0, 0.0, 0.0, 0.0, 48.0, 0.0, 0.0, 0.0, 48.0, 0.0, 0.0, 0.0, 47.0, 0.0, 0.0, 0.0, 47.0,
            0.0, 0.0, 0.0, 47.0, 0.0, 0.0, 0.0, 46.0, 0.0, 0.0, 0.0, 46.0, 0.0, 0.0, 0.0, 46.0, 0.0, 0.0,
            0.0, 46.0, 0.0, 0.0, 0.0, 46.0, 0.0, 0.0, 0.0, 47.0, 0.0, 0.0, 0.0, 47.0, 0.0, 0.0, 0.0, 47.0,
            0.0, 0.0, 0.0, 48.0, 0.0, 0.0, 0.0, 48.0, 0.0, 0.0, 0.0, 49.0, 0.0, 0.0, 0.0, 50.0, 0.0, 0.0,
            0.0, 50.0, 0.0, 0.0, 0.0, 51.0, 0.0, 0.0, 0.0, 52.0, 0.0, 0.0, 0.0, 53.0, 0.0, 0.0, 0.0, 55.0,
            0.0, 0.0, 0.0, 56.0, 0.0, 0.0, 0.0, 57.0, 0.0, 0.0, 0.0, 59.0, 0.0, 0.0, 0.0, 60.0, 0.0, 0.0,
            0.0, 62.0, 0.0, 0.0, 0.0, 64.0, 0.0, 0.0, 0.0, 65.0, 0.0, 0.0, 0.0, 67.0, 0.0, 0.0, 0.0, 69.0,
            0.0, 0.0, 0.0, 71.0, 0.0, 0.0, 0.0, 74.0, 0.0, 0.0, 0.0, 76.0, 0.0, 0.0, 0.0, 78.0, 0.0, 0.0,
            0.0, 81.0, 0.0, 0.0, 0.0, 83.0, 0.0, 0.0, 0.0, 86.0, 0.0, 0.0, 0.0, 88.0, 0.0, 0.0, 0.0, 91.0,
            0.0, 0.0, 0.0, 94.0, 0.0, 0.0, 0.0, 96.0, 0.0, 0.0, 0.0, 99.0, 0.0, 0.0, 0.0, 102.0, 0.0, 0.0,
            0.0, 105.0, 0.0, 0.0, 0.0, 108.0, 0.0, 0.0, 0.0, 111.0, 0.0, 0.0, 0.0, 114.0, 0.0, 0.0, 0.0,
            117.0, 0.0, 0.0, 0.0, 120.0, 0.0, 0.0, 0.0, 124.0, 0.0, 0.0, 0.0, 127.0, 0.0, 0.0, 0.0, 130.0,
            0.0, 0.0, 0.0, 133.0, 0.0, 0.0, 0.0, 136.0, 0.0, 0.0, 0.0, 140.0, 0.0, 0.0, 0.0, 143.0, 0.0,
            0.0, 0.0, 146.0, 0.0, 0.0, 0.0, 149.0, 0.0, 0.0, 0.0, 153.0, 0.0, 0.0, 0.0, 156.0, 0.0, 0.0,
            0.0, 159.0, 0.0, 0.0, 0.0, 162.0, 0.0, 0.0, 0.0, 165.0, 0.0, 0.0, 0.0, 169.0, 0.0, 0.0, 0.0,
            172.0, 0.0, 0.0, 0.0, 175.0, 0.0, 0.0, 0.0, 178.0, 0.0, 0.0, 0.0, 181.0, 0.0, 0.0, 0.0, 184.0,
            0.0, 0.0, 0.0, 186.0, 0.0, 0.0, 0.0, 189.0, 0.0, 0.0, 0.0, 192.0, 0.0, 0.0, 0.0, 195.0, 0.0,
            0.0, 0.0, 197.0, 0.0, 0.0, 0.0, 200.0, 0.0, 0.0, 0.0, 203.0, 0.0, 0.0, 0.0, 205.0, 0.0, 0.0,
            0.0, 207.0, 0.0, 0.0, 0.0, 210.0, 0.0, 0.0, 0.0, 212.0, 0.0, 0.0, 0.0, 214.0, 0.0, 0.0, 0.0,
            216.0, 0.0, 0.0, 0.0, 218.0, 0.0, 0.0, 0.0, 220.0, 0.0, 0.0, 0.0, 222.0, 0.0, 0.0, 0.0, 224.0,
            0.0, 0.0, 0.0, 226.0, 0.0, 0.0, 0.0, 227.0, 0.0, 0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 230.0, 0.0,
            0.0, 0.0, 231.0, 0.0, 0.0, 0.0, 233.0, 0.0, 0.0, 0.0, 234.0, 0.0, 0.0, 0.0, 235.0, 0.0, 0.0,
            0.0, 236.0, 0.0, 0.0, 0.0, 237.0, 0.0, 0.0, 0.0, 238.0, 0.0, 0.0, 0.0, 239.0, 0.0, 0.0, 0.0,
            239.0, 0.0, 0.0, 0.0, 240.0, 0.0, 0.0, 0.0, 241.0, 0.0, 0.0, 0.0, 241.0, 0.0, 0.0, 0.0, 242.0,
            0.0, 0.0, 0.0, 242.0, 0.0, 0.0, 0.0, 242.0, 0.0, 0.0, 0.0, 243.0, 0.0, 0.0, 0.0, 243.0, 0.0,
            0.0, 0.0, 243.0, 0.0, 0.0, 0.0, 243.0, 0.0, 0.0, 0.0, 243.0, 0.0, 0.0, 0.0, 243.0, 0.0, 0.0,
            0.0, 243.0, 0.0, 0.0, 0.0, 243.0, 0.0, 0.0, 0.0, 243.0, 0.0, 0.0, 0.0, 243.0, 0.0, 0.0, 0.0,
            242.0, 0.0, 0.0, 0.0, 242.0, 0.0, 0.0, 0.0, 242.0, 0.0, 0.0, 0.0, 242.0, 0.0, 0.0, 0.0, 241.0,
            0.0, 0.0, 0.0, 241.0, 0.0, 0.0, 0.0, 241.0, 0.0, 0.0, 0.0, 241.0, 0.0, 0.0, 0.0, 240.0, 0.0,
            0.0, 0.0, 240.0, 0.0, 0.0, 0.0, 240.0, 0.0, 0.0, 0.0, 239.0, 0.0, 0.0, 0.0, 239.0, 0.0, 0.0,
            0.0, 239.0, 0.0, 0.0, 0.0, 239.0, 0.0, 0.0, 0.0, 239.0, 0.0, 0.0, 0.0, 238.0, 0.0, 0.0, 0.0,
            238.0, 0.0, 0.0, 0.0, 238.0, 0.0, 0.0, 0.0, 238.0, 0.0, 0.0, 0.0, 238.0, 0.0, 0.0, 0.0, 238.0,
            0.0, 0.0, 0.0, 238.0, 0.0, 0.0, 0.0, 238.0, 0.0, 0.0, 0.0, 239.0, 0.0, 0.0, 0.0, 239.0, 0.0,
            0.0, 0.0, 239.0, 0.0, 0.0, 0.0, 240.0, 0.0, 0.0, 0.0, 240.0, 0.0, 0.0, 0.0, 240.0, 0.0, 0.0,
            0.0, 241.0, 0.0, 0.0, 0.0, 242.0, 0.0, 0.0, 0.0, 242.0, 0.0, 0.0, 0.0, 243.0, 0.0, 0.0, 0.0,
            244.0, 0.0, 0.0, 0.0, 245.0, 0.0, 0.0, 0.0, 246.0, 0.0, 0.0, 0.0, 247.0, 0.0, 0.0, 0.0, 248.0,
            0.0, 0.0, 0.0, 249.0, 0.0, 0.0, 0.0, 250.0, 0.0, 0.0, 0.0, 252.0, 0.0, 0.0, 0.0, 253.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0
        ]),
    },
    hot: {
        name: 'hot',
        r: new Float32Array([
            0.0, 4.0, 8.0, 12.0, 16.0, 20.0, 24.0, 28.0, 32.0, 36.0, 40.0, 44.0, 48.0, 52.0, 56.0, 60.0,
            64.0, 68.0, 72.0, 76.0, 80.0, 84.0, 88.0, 92.0, 96.0, 100.0, 104.0, 108.0, 112.0, 116.0,
            120.0, 124.0, 128.0, 132.0, 136.0, 140.0, 144.0, 148.0, 152.0, 156.0, 160.0, 164.0, 168.0,
            172.0, 176.0, 180.0, 184.0, 188.0, 192.0, 196.0, 200.0, 204.0, 208.0, 212.0, 216.0, 220.0,
            224.0, 228.0, 232.0, 236.0, 240.0, 244.0, 248.0, 252.0, 255.0, 255.0, 255.0, 255.0, 255.0,
            255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0,
            255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0,
            255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0,
            255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0,
            255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0,
            255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0,
            255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0
        ]),
        g: new Float32Array([
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 2.30769,
            4.61538, 6.92308, 9.23077, 11.5385, 13.8462, 16.1538, 18.4615, 20.7692, 23.0769, 25.3846, 27.6923,
            30.0, 32.3077, 34.6154, 36.9231, 39.2308, 41.5385, 43.8462, 46.1538, 48.4615, 50.7692, 53.0769,
            55.3846, 57.6923, 60.0, 62.3077, 64.6154, 66.9231, 69.2308, 71.5385, 73.8462, 76.1538, 78.4615,
            80.7692, 83.0769, 85.3846, 87.6923, 90.0, 92.3077, 94.6154, 96.9231, 99.2308, 101.538, 103.846, 106.154,
            108.462, 110.769, 113.077, 115.385, 117.692, 120.0, 122.308, 124.615, 126.923, 129.231, 131.538,
            133.846, 136.154, 138.462, 140.769, 143.077, 145.385, 147.692, 150.0, 152.308, 154.615, 156.923,
            159.231, 161.538, 163.846, 166.154, 168.462, 170.769, 173.077, 175.385, 177.692, 180.0, 182.308,
            184.615, 186.923, 189.231, 191.538, 193.846, 196.154, 198.462, 200.769, 203.077, 205.385,
            207.692, 210.0, 212.308, 214.615, 216.923, 219.231, 221.538, 223.846, 226.154, 228.462, 230.769,
            233.077, 235.385, 237.692, 240.0, 242.308, 244.615, 246.923, 249.231, 251.538, 253.846, 255.0,
            255.0, 255.0, 255.0, 255.0, 255.0, 255.0
        ]),
        b: new Float32Array([
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.980769,
            1.96154, 2.94231, 3.92308, 4.90385, 5.88461, 6.86539, 7.84615, 8.82692, 9.80769, 10.7885, 11.7692, 12.75,
            13.7308, 14.7115, 15.6923, 16.6731, 17.6538, 18.6346, 19.6154, 20.5962, 21.5769, 22.5577, 23.5385,
            24.5192, 25.5, 26.4808, 27.4615, 28.4423, 29.4231, 30.4038, 31.3846, 32.3654, 33.3462, 34.3269,
            35.3077, 36.2885, 37.2692, 38.25, 39.2308, 40.2115, 41.1923, 42.1731, 43.1538, 44.1346, 45.1154, 46.0962,
            47.0769, 48.0577, 49.0385, 50.0192, 51.0, 51.9808, 52.9615, 53.9423, 54.9231, 55.9038, 56.8846,
            57.8654, 58.8462, 59.8269, 60.8077, 61.7885, 62.7692, 63.75, 64.7308, 65.7115, 66.6923, 67.6731,
            68.6538, 69.6346, 70.6154, 71.5962, 72.5769, 73.5577, 74.5385, 75.5192, 76.5, 77.4808, 78.4615, 79.4423,
            80.4231, 81.4038, 82.3846, 83.3654, 84.3462, 85.3269, 86.3077, 87.2885, 88.2692, 89.25, 90.2308,
            91.2115, 92.1923, 93.1731, 94.1538, 95.1346, 96.1154, 97.0962, 98.0769, 99.0577, 100.038,
            101.019, 102.0, 102.981, 103.962, 104.942, 105.923, 106.904, 107.885, 108.865, 109.846, 110.827,
            111.808, 112.788, 113.769, 114.75, 115.731, 116.711, 117.692, 118.673, 119.654, 120.634,
            121.615, 122.596, 123.577, 124.557, 125.538, 126.519, 127.5
        ])
    },
    gray: {
        name: 'gray',
        r: new Float32Array([
            0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
            25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46,
            47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66,
            67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88,
            89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107,
            108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123,
            124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138,
            139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152,
            153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164,
            165, 166, 167, 168, 169, 170, 171, 172,
            173, 174, 175, 176, 177,
            178, 179,
            180,
            181,
            182,
            183,
            184,
            185,
            186,
            187,
            188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200,
            201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212,
            213, 214, 215, 216, 217, 218, 219, 220,
            221, 222,
            223,
            224,
            225,
            226,
            227,
            228,
            229,
            230,
            231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242,
            243, 244, 245, 246, 247, 248, 249, 250,
            251,
            252,
            253,
            254,
            255
        ]),
        g: new Float32Array([
            0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
            25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45,
            46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56,
            57,
            58,
            59,
            60,
            61,
            62,
            63,
            64,
            65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82,
            83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94,
            95,
            96,
            97,
            98,
            99,
            100,
            101,
            102,
            103,
            104,
            105, 106, 107, 108, 109, 110, 111, 112, 113, 114,
            115,
            116,
            117,
            118,
            119,
            120,
            121,
            122,
            123,
            124,
            125, 126, 127, 128, 129, 130, 131, 132, 133, 134,
            135,
            136,
            137,
            138,
            139,
            140,
            141,
            142,
            143,
            144,
            145, 146, 147, 148, 149, 150, 151, 152, 153, 154,
            155,
            156,
            157,
            158,
            159,
            160,
            161,
            162,
            163,
            164,
            165, 166, 167, 168, 169, 170, 171, 172, 173, 174,
            175,
            176,
            177,
            178,
            179,
            180,
            181,
            182,
            183,
            184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196,
            197, 198, 199, 200, 201, 202, 203, 204, 205, 206,
            207,
            208,
            209,
            210,
            211,
            212,
            213,
            214,
            215,
            216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227,
            228, 229, 230, 231, 232, 233, 234, 235, 236, 237,
            238,
            239,
            240,
            241,
            242,
            243,
            244,
            245,
            246,
            247, 248, 249, 250,
            251,
            252,
            253,
            254,
            255
        ]),
        b: new Float32Array([
            0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58,
            59,
            60,
            61,
            62,
            63,
            64,
            65,
            66,
            67,
            68,
            69,
            70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88,
            89,
            90,
            91,
            92,
            93,
            94,
            95,
            96,
            97,
            98,
            99,
            100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116,
            117,
            118,
            119,
            120,
            121,
            122,
            123,
            124,
            125,
            126,
            127,
            128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144,
            145,
            146,
            147,
            148,
            149,
            150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164,
            165,
            166,
            167,
            168,
            169,
            170,
            171,
            172,
            173,
            174,
            175,
            176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192,
            193,
            194,
            195,
            196,
            197,
            198,
            199,
            200,
            201,
            202,
            203,
            204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220,
            221,
            222,
            223,
            224,
            225,
            226,
            227,
            228,
            229,
            230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240,
            241,
            242,
            243,
            244,
            245,
            246,
            247,
            248,
            249,
            250,
            251,
            252,
            253,
            254,
            255
        ])
    },
};
exports["default"] = exports.ColorMaps;


/***/ }),

/***/ 772:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AstroViewer = void 0;
// import global from './Global.js'
const AstroSphere_js_1 = __importDefault(__webpack_require__(4723));
const HiPSDescriptor_js_1 = __webpack_require__(5087);
const CatalogueGL_js_1 = __webpack_require__(1232);
const FootprintSetGL_js_1 = __webpack_require__(592);
const Config_js_1 = __webpack_require__(2919);
const ColorMaps_js_1 = __importDefault(__webpack_require__(619));
const XYZTileRequestScheduler_js_1 = __webpack_require__(5409);
const XYZMapDescriptor_js_1 = __webpack_require__(8868);
const TerraPointSetGL_js_1 = __webpack_require__(5781);
const TerraFootprintSetGL_js_1 = __webpack_require__(9022);
// & {
//   viewportWidth: number
//   viewportHeight: number
// }
class AstroViewer {
    astroSphere;
    canvas;
    webgl;
    rafId = null;
    webglContextList = new Map();
    viewfinderEl = null;
    viewfinderVisible = Config_js_1.bootSetup.showViewfinder;
    viewfinderColor = 'rgba(75,148,226,0.68)';
    // API
    run() {
        return this.tick();
    }
    // CATALOGUES
    createCatalogue(catalogueName, catalogueDescription, providerUrl, metadataManager) {
        return new CatalogueGL_js_1.CatalogueGL(catalogueName, catalogueDescription, providerUrl, metadataManager, this.webgl, this.astroSphere.healpixGrid.visibleTilesManager);
    }
    showCatalogue(catalogue) {
        this.astroSphere.showCatalogue(catalogue);
    }
    hideCatalogue(catalogue, isVisible) {
        catalogue.setIsVisible(isVisible);
    }
    deleteCatalogue(catalogue) {
        this.astroSphere.deleteCatalogue(catalogue);
    }
    changeCatalogueRA(catalogue, raColumnName) {
        catalogue.changeMetaRA(raColumnName);
        // catalogue.catalogueProps.changeCatalogueMetaRA(raColumnName)
        return catalogue;
    }
    changeCatalogueDec(catalogue, decColumnName) {
        catalogue.changeMetaDec(decColumnName);
        // catalogue.catalogueProps.changeCatalogueMetaDec(decColumnName)
        return catalogue;
    }
    changeCatalogueColor(catalogue, hexColor) {
        catalogue.changeColor(hexColor);
        // catalogue.catalogueProps.changeColor(hexColor)
        return catalogue;
    }
    setCatalogueShapeHue(catalogue, metadataColumnName) {
        catalogue.changeMetaShapeHue(metadataColumnName);
        return catalogue;
    }
    setCatalogueShapeSize(catalogue, metadataColumnName) {
        catalogue.changeMetaShapeSize(metadataColumnName);
        return catalogue;
    }
    //FOOTPRINT
    createFootprintSet(footprintSetName, footprintSetDescription, providerUrl, metadataManager) {
        return new FootprintSetGL_js_1.FootprintSetGL(footprintSetName, footprintSetDescription, providerUrl, metadataManager, this.webgl, this.astroSphere.healpixGrid.visibleTilesManager);
    }
    showFootprintSet(footprintSet) {
        this.astroSphere.showFootprintSet(footprintSet);
    }
    hideFootprintSet(footprintSet, isVisible) {
        footprintSet.setIsVisible(isVisible);
    }
    deleteFootprintSet(footprintSet) {
        this.astroSphere.deleteFootprintSet(footprintSet);
    }
    // TERRA OVERLAYS
    createTerraPointSet(pointSetName, pointSetDescription, providerUrl, metadataManager) {
        return new TerraPointSetGL_js_1.TerraPointSetGL(pointSetName, pointSetDescription, providerUrl, metadataManager, this.webgl, this.astroSphere.healpixGrid.visibleTilesManager);
    }
    showTerraPointSet(pointSet) {
        this.astroSphere.showCatalogue(pointSet);
    }
    hideTerraPointSet(pointSet, isVisible) {
        pointSet.setIsVisible(isVisible);
    }
    deleteTerraPointSet(pointSet) {
        this.astroSphere.deleteCatalogue(pointSet);
    }
    createTerraFootprintSet(footprintSetName, footprintSetDescription, providerUrl, metadataManager) {
        return new TerraFootprintSetGL_js_1.TerraFootprintSetGL(footprintSetName, footprintSetDescription, providerUrl, metadataManager, this.webgl, this.astroSphere.healpixGrid.visibleTilesManager);
    }
    showTerraFootprintSet(footprintSet) {
        this.astroSphere.showFootprintSet(footprintSet);
    }
    hideTerraFootprintSet(footprintSet, isVisible) {
        footprintSet.setIsVisible(isVisible);
    }
    deleteTerraFootprintSet(footprintSet) {
        this.astroSphere.deleteFootprintSet(footprintSet);
    }
    changeFootprintSetColor(footprintSet, hexColor) {
        // footprintSet.footprintsetProps.changeColor(hexColor)
        footprintSet.changeColor(hexColor);
    }
    getHoveredFootprints() {
        return this.astroSphere.getHoveredFootprints();
    }
    // HIPS
    getDefaultHiPSURL() {
        return Config_js_1.bootSetup.defaultHipsUrl;
    }
    activateHiPS(hipsDescriptor) {
        this.astroSphere.activateHiPS(hipsDescriptor);
    }
    activateXYZ(config) {
        this.astroSphere.activateXYZ(config);
    }
    activateXYZ2(config) {
        const descriptor = new XYZMapDescriptor_js_1.XYZMapDescriptor(config.name ?? 'XYZ Earth2 Layer', config.urlTemplate, config.minZoom ?? 0, config.maxZoom ?? 8, config.segmentsPerSide ?? 48, config.maxCachedTiles ?? 384, 8, config.urlResolver);
        this.astroSphere.activateXYZ2(descriptor);
    }
    activateWMTS(config) {
        this.astroSphere.activateWMTS(config);
    }
    setXYZMaxConcurrentRequests(value) {
        XYZTileRequestScheduler_js_1.xyzTileRequestScheduler.setMaxConcurrent(value);
    }
    getXYZMaxConcurrentRequests() {
        return XYZTileRequestScheduler_js_1.xyzTileRequestScheduler.getMaxConcurrent();
    }
    getXYZDebugStats() {
        return this.astroSphere.getXYZDebugStats();
    }
    getHiPSDebugStats() {
        return this.astroSphere.getHiPSDebugStats();
    }
    async loadHiPS(baseUrl) {
        const hipsUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
        const resp = await fetch(hipsUrl + 'properties');
        if (!resp.ok)
            throw new Error(`HTTP ${resp.status} fetching properties`);
        const propsText = await resp.text();
        const desc = new HiPSDescriptor_js_1.HiPSDescriptor(propsText, hipsUrl);
        this.astroSphere.activateHiPS(desc);
        return desc.surveyName;
        // this.activateHiPS(desc);
    }
    // changeColorMap(hips: HiPS, colorMapName: ColorMapName) {
    changeColorMap(colorMapName) {
        const colorMap = ColorMaps_js_1.default[colorMapName];
        // hips.changeColorMap(colorMap)
        this.astroSphere.changeColorMap(colorMap);
    }
    changeCustomColorMap(colorMap) {
        this.astroSphere.changeColorMap(colorMap);
    }
    getActiveHiPS() {
        return this.astroSphere.activeHiPS;
    }
    getActiveXYZ() {
        return this.astroSphere.activeXYZ;
    }
    // Camera: GOTOs and COORDS
    setCamera(camera) {
        this.astroSphere.setCamera(camera);
    }
    setCameraPosition(pos) {
        this.astroSphere.setCameraPosition(pos);
    }
    setCameraMatrix(viewMatrix) {
        this.astroSphere.setCameraMatrix(viewMatrix);
    }
    restoreAstroViewerState(detail, applyColorMap) {
        this.astroSphere.applyFullCameraState(detail, applyColorMap);
    }
    getCurrentAstroViewerStatus() {
        return this.astroSphere.getCurrentStatus();
    }
    goTo(raDeg, decDeg) {
        // console.log(`AstroViewer.goTo goto(${raDeg}, ${decDeg})`)
        this.astroSphere.goTo(raDeg, decDeg);
    }
    getActiveCoordinateMode() {
        return this.astroSphere.getActiveCoordinateMode();
    }
    getCenterCoordinates() {
        return this.astroSphere.getCentralPointCoordinates();
    }
    getCoordinatesFromMouse() {
        return this.astroSphere.getLastMousePointCoordinates();
    }
    // GRIDs
    setModelMatrix(modelMatrix) {
        this.astroSphere.healpixGrid.setModelMatrix(modelMatrix);
    }
    toggleHealpixGrid() {
        // healpixGridSingleton.toggleShowGrid()
        this.astroSphere.healpixGrid.toggleShowGrid();
    }
    isHealpixGridVisible() {
        // return healpixGridSingleton.isVisible()
        return this.astroSphere.healpixGrid.isVisible();
    }
    toggleEquatorialGrid() {
        // equatorialGridSingleton.toggleShowGrid()
        return this.astroSphere.equatorialGrid.toggleShowGrid();
    }
    isEquatorialGridVisible() {
        // return equatorialGridSingleton.isVisible()
        return this.astroSphere.equatorialGrid.isVisible();
    }
    toggleLonLatGrid() {
        return this.astroSphere.toggleLonLatGrid();
    }
    isLonLatGridVisible() {
        return this.astroSphere.isLonLatGridVisible();
    }
    setEastWestRotationLocked(locked) {
        this.astroSphere.setEastWestRotationLocked(locked);
    }
    isEastWestRotationLocked() {
        return this.astroSphere.isEastWestRotationLocked();
    }
    setNorthSouthRotationLocked(locked) {
        this.astroSphere.setNorthSouthRotationLocked(locked);
    }
    isNorthSouthRotationLocked() {
        return this.astroSphere.isNorthSouthRotationLocked();
    }
    resetAxesOrientation() {
        this.astroSphere.resetAxesOrientation();
    }
    setKeepCameraNorthUp(enabled) {
        this.astroSphere.setKeepCameraNorthUp(enabled);
    }
    isKeepCameraNorthUp() {
        return this.astroSphere.isKeepCameraNorthUp();
    }
    // FOV
    getFoV() {
        return this.astroSphere.getFoV();
    }
    getFoVPolygon() {
        return this.astroSphere.getFoVPolygon();
    }
    changeFoV(deg) {
        this, this.astroSphere.changeFoV(deg);
    }
    changeFoV2(deg) {
        this, this.astroSphere.changeFoV2(deg);
    }
    changeFoV3(deg) {
        this, this.astroSphere.changeFoV3(deg);
    }
    getInsideSphere() {
        return this.astroSphere.getInsideSphere();
    }
    toggleInsideSphere() {
        this.astroSphere.toggleInsideSphere();
    }
    toggleViewfinder() {
        this.viewfinderVisible = !this.viewfinderVisible;
        this.syncViewfinderVisibility();
        return this.viewfinderVisible;
    }
    setViewfinderVisible(visible) {
        this.viewfinderVisible = visible;
        this.syncViewfinderVisibility();
    }
    isViewfinderVisible() {
        return this.viewfinderVisible;
    }
    setViewfinderColor(color) {
        this.viewfinderColor = color;
        this.syncViewfinderColor();
    }
    getViewfinderColor() {
        return this.viewfinderColor;
    }
    setRotationSensitivity(value) {
        this.astroSphere.setCameraRotationSensitivity(value);
    }
    getRotationSensitivity() {
        return this.astroSphere.getCameraRotationSensitivity();
    }
    setZoomSensitivity(value) {
        this.astroSphere.setZoomSensitivity(value);
    }
    getZoomSensitivity() {
        return this.astroSphere.getZoomSensitivity();
    }
    // Internal
    constructor(canvasEl) {
        this.init(canvasEl);
        this.webglContextList = new Map();
    }
    init(canvasEl) {
        console.log('init webgl');
        this.canvas = canvasEl;
        this.initViewfinder();
        const gl = this.canvas.getContext('webgl2', { alpha: false });
        if (!gl) {
            alert('Could not initialise WebGL, sorry :-(');
            throw new Error('WebGL2 not available');
        }
        // Extend with custom fields used elsewhere
        this.webgl = gl;
        // this.webgl.viewportWidth = this.canvas.width
        // this.webgl.viewportHeight = this.canvas.height
        try {
            // 1/255 = 0.00392156862
            this.webgl.clearColor(0 * 0.00392156862, 16 * 0.00392156862, 50 * 0.00392156862, 0.7);
        }
        catch (e) {
            console.log('Error instantiating WebGL context');
        }
        this.initListeners();
        // ; (global as any).gl = this.webgl
        this.astroSphere = new AstroSphere_js_1.default(this.canvas, this.webgl);
    }
    initViewfinder() {
        const parent = this.canvas.parentElement;
        if (!parent)
            return;
        if (window.getComputedStyle(parent).position === 'static') {
            parent.style.position = 'relative';
        }
        const viewfinder = document.createElement('div');
        viewfinder.setAttribute('data-astro-viewfinder', 'true');
        viewfinder.setAttribute('aria-hidden', 'true');
        viewfinder.style.position = 'absolute';
        viewfinder.style.left = '50%';
        viewfinder.style.top = '50%';
        viewfinder.style.width = '44px';
        viewfinder.style.height = '44px';
        viewfinder.style.transform = 'translate(-50%, -50%)';
        viewfinder.style.pointerEvents = 'none';
        viewfinder.style.zIndex = '1';
        viewfinder.style.boxSizing = 'border-box';
        const segments = [
            { left: '50%', top: '7px', width: '1px', height: '11px', transform: 'translateX(-50%)' },
            { left: '50%', bottom: '7px', width: '1px', height: '11px', transform: 'translateX(-50%)' },
            { left: '7px', top: '50%', width: '11px', height: '1px', transform: 'translateY(-50%)' },
            { right: '7px', top: '50%', width: '11px', height: '1px', transform: 'translateY(-50%)' },
        ];
        for (const segmentDef of segments) {
            const segment = document.createElement('div');
            segment.style.position = 'absolute';
            segment.style.left = segmentDef.left ?? 'auto';
            segment.style.right = segmentDef.right ?? 'auto';
            segment.style.top = segmentDef.top ?? 'auto';
            segment.style.bottom = segmentDef.bottom ?? 'auto';
            segment.style.width = segmentDef.width;
            segment.style.height = segmentDef.height;
            segment.style.transform = segmentDef.transform;
            segment.style.background = 'currentColor';
            segment.style.borderRadius = '999px';
            segment.style.boxShadow = '0 0 0 1px rgba(0, 0, 0, 0.14)';
            viewfinder.appendChild(segment);
        }
        parent.appendChild(viewfinder);
        this.viewfinderEl = viewfinder;
        this.syncViewfinderVisibility();
        this.syncViewfinderColor();
    }
    syncViewfinderVisibility() {
        if (!this.viewfinderEl)
            return;
        this.viewfinderEl.style.display = this.viewfinderVisible ? 'block' : 'none';
    }
    syncViewfinderColor() {
        if (!this.viewfinderEl)
            return;
        this.viewfinderEl.style.color = this.viewfinderColor;
    }
    initListeners() {
        console.log('inside initListeners');
        const resizeCanvas = () => {
            console.log('[resizeCanvas]');
            const rect = this.canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            const newWidth = Math.max(1, Math.floor(rect.width * dpr));
            const newHeight = Math.max(1, Math.floor(rect.height * dpr));
            if (this.canvas.width !== newWidth || this.canvas.height !== newHeight) {
                this.canvas.width = newWidth;
                this.canvas.height = newHeight;
                // this.webgl.viewportWidth = this.canvas.width
                // this.webgl.viewportHeight = this.canvas.height
                this.webgl.viewport(0, 0, this.canvas.width, this.canvas.height);
            }
        };
        const handleContextLost = (event) => {
            console.log('[handleContextLost]');
            event.preventDefault();
            if (this.rafId !== null) {
                cancelAnimationFrame(this.rafId);
                this.rafId = null;
            }
        };
        const handleContextRestored = (_event) => {
            console.log('[handleContextRestored]');
            // this.webgl.viewportWidth = this.canvas.width
            // this.webgl.viewportHeight = this.canvas.height
            this.webgl.clearColor(0 * 0.00392156862, 16 * 0.00392156862, 50 * 0.00392156862, 0.7);
            this.webgl.enable(this.webgl.DEPTH_TEST);
            this.rafId = requestAnimationFrame(() => this.tick());
        };
        // 🔥 ResizeObserver per pannelli / split / layout dinamici
        if ('ResizeObserver' in window) {
            const ro = new ResizeObserver(() => {
                resizeCanvas();
            });
            // Osserva il canvas o il suo parent (a tua scelta)
            ro.observe(this.canvas);
        }
        window.addEventListener('resize', resizeCanvas);
        this.canvas.addEventListener('webglcontextlost', handleContextLost, false);
        this.canvas.addEventListener('webglcontextrestored', handleContextRestored, false);
        resizeCanvas();
    }
    tick() {
        this.drawScene();
        this.rafId = requestAnimationFrame(() => this.tick());
        return this.rafId;
    }
    drawScene() {
        this.astroSphere.draw(this.canvas);
    }
}
exports.AstroViewer = AstroViewer;


/***/ }),

/***/ 1072:
/***/ ((__unused_webpack_module, exports) => {

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

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MetadataColumn = exports.ColumnType = void 0;
var ColumnType;
(function (ColumnType) {
    ColumnType["STRING"] = "STRING";
    ColumnType["NUMBER"] = "NUMBER";
    ColumnType["GEOM_RA"] = "GEOM_RA";
    ColumnType["GEOM_DEC"] = "GEOM_DEC";
    ColumnType["GEOM_FOOTPRINT"] = "GEOM_FOOTPRINT";
    ColumnType["MAIN_NAME"] = "MAIN_NAME";
})(ColumnType || (exports.ColumnType = ColumnType = {}));
class MetadataColumn {
    _index; // mandatory
    _name; // mandatory
    _description = ""; // mandatory default ""
    _columnType; // mandatory
    _unit; // mandatory
    _details = new Map();
    constructor(init) {
        if (!init.name)
            throw new Error(`No name column defined.`);
        this._name = init.name;
        if (init.index < 0 || isNaN(init.index))
            throw new Error(`No index column defined.`);
        this._index = init.index;
        this._columnType = init.columnType ?? ColumnType.STRING;
        this._unit = init.unit ?? "";
        this._description = init.description ?? "";
        if (init.details)
            this._details = new Map(init.details);
    }
    get details() {
        return new Map(this._details);
    }
    /** Get any detail; optional fallback. */
    getDetail(key, fallback) {
        return this._details.has(key) ? this._details.get(key) : fallback;
    }
    /** Type-leaning getters with fallbacks. */
    getString(key, fallback = "") {
        const v = this._details.get(key);
        return typeof v === "string" ? v : fallback;
    }
    getNumber(key, fallback = NaN) {
        const v = this._details.get(key);
        return typeof v === "number" ? v : fallback;
    }
    /** Set or update a detail. */
    setDetail(key, value) {
        this._details.set(key, value);
    }
    /** Add many details at once. */
    setDetails(details) {
        const entries = details instanceof Map ? details.entries() : Object.entries(details);
        for (const [k, v] of entries)
            this._details.set(k, v);
    }
    /** Keys, values, entries (as arrays). */
    detailKeys() {
        return Array.from(this._details.keys());
    }
    detailValues() {
        return Array.from(this._details.values());
    }
    detailEntries() {
        return Array.from(this._details.entries());
    }
    // ---------- core getters/setters ----------
    get name() {
        return this._name;
    }
    get description() {
        return this._description;
    }
    get columnType() {
        return this._columnType;
    }
    get index() {
        return this._index;
    }
    get unit() {
        return this._unit;
    }
    // ---------- serialisation ----------
    toJSON() {
        return {
            name: this._name,
            description: this._description,
            columnType: this._columnType,
            index: this._index,
            unit: this._unit,
            details: Object.fromEntries(this._details),
        };
    }
}
exports.MetadataColumn = MetadataColumn;


/***/ }),

/***/ 1138:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  CircleFinder: () => (/* reexport */ CircleFinder),
  Constants: () => (/* reexport */ Constants),
  Fxyf: () => (/* reexport */ Fxyf),
  Healpix: () => (/* reexport */ Healpix),
  Hploc: () => (/* reexport */ Hploc),
  Pointing: () => (/* reexport */ Pointing),
  RangeSet: () => (/* reexport */ RangeSet),
  Vec3: () => (/* reexport */ Vec3),
  Xyf: () => (/* reexport */ Xyf),
  Zphi: () => (/* reexport */ Zphi),
  pstack: () => (/* reexport */ pstack)
});

;// ./node_modules/healpixjs/lib-esm/Constants.js
class Constants {
}
//	static halfpi = Math.PI/2.;
Constants.halfpi = 1.5707963267948966;
Constants.inv_halfpi = 2. / Math.PI;
/** The Constant twopi. */
Constants.twopi = 2 * Math.PI;
Constants.inv_twopi = 1. / (2 * Math.PI);
//# sourceMappingURL=Constants.js.map
;// ./node_modules/healpixjs/lib-esm/pstack.js
class pstack {
    /** Creation from individual components */
    constructor(sz) {
        this.p = new Array(sz);
        this.o = new Int32Array(sz);
        this.s = 0;
        this.m = 0;
    }
    ;
    /**
     * @param p long
     * @param o int
     */
    push(p_, o_) {
        this.p[this.s] = p_;
        this.o[this.s] = o_;
        ++this.s;
    }
    ;
    pop() {
        --this.s;
    }
    ;
    popToMark() {
        this.s = this.m;
    }
    ;
    size() {
        return this.s;
    }
    ;
    mark() {
        this.m = this.s;
    }
    ;
    otop() {
        return this.o[this.s - 1];
    }
    ;
    ptop() {
        return this.p[this.s - 1];
    }
    ;
}
//# sourceMappingURL=pstack.js.map
;// ./node_modules/healpixjs/lib-esm/Pointing.js

class Pointing {
    /**
     *
     * @param {*} vec3 Vec3.js
     * @param {*} mirror
     * @param {*} in_theta radians
     * @param {*} in_phi radians
     */
    constructor(vec3, mirror, in_theta, in_phi) {
        if (vec3 != null) {
            this.theta = Hploc.atan2(Math.sqrt(vec3.x * vec3.x + vec3.y * vec3.y), vec3.z);
            if (mirror) {
                this.phi = -Hploc.atan2(vec3.y, vec3.x);
            }
            else {
                this.phi = Hploc.atan2(vec3.y, vec3.x);
            }
            if (this.phi < 0.0) {
                this.phi = this.phi + 2 * Math.PI;
            }
            if (this.phi >= 2 * Math.PI) {
                this.phi = this.phi - 2 * Math.PI;
            }
        }
        else {
            this.theta = in_theta;
            this.phi = in_phi;
        }
    }
}
//# sourceMappingURL=Pointing.js.map
;// ./node_modules/healpixjs/lib-esm/Zphi.js
class Zphi {
    /** Creation from individual components */
    constructor(z_, phi_) {
        this.z = z_;
        this.phi = phi_;
    }
    ;
}
//# sourceMappingURL=Zphi.js.map
;// ./node_modules/healpixjs/lib-esm/Hploc.js



class Hploc {
    constructor(ptg) {
        Hploc.PI4_A = 0.7853981554508209228515625;
        Hploc.PI4_B = 0.794662735614792836713604629039764404296875e-8;
        Hploc.PI4_C = 0.306161699786838294306516483068750264552437361480769e-16;
        Hploc.M_1_PI = 0.3183098861837906715377675267450287;
        if (ptg) {
            this.sth = 0.0;
            this.have_sth = false;
            this.z = Hploc.cos(ptg.theta);
            this._phi = ptg.phi;
            if (Math.abs(this.z) > 0.99) {
                this.sth = Hploc.sin(ptg.theta);
                this.have_sth = true;
            }
        }
    }
    setZ(z) {
        this.z = z;
    }
    ;
    get phi() {
        return this._phi;
    }
    ;
    set phi(phi) {
        this._phi = phi;
    }
    ;
    setSth(sth) {
        this.sth = sth;
    }
    ;
    toPointing(mirror) {
        const st = this.have_sth ? this.sth : Math.sqrt((1.0 - this.z) * (1.0 + this.z));
        return new Pointing(null, false, Hploc.atan2(st, this.z), this._phi);
    }
    toVec3() {
        var st = this.have_sth ? this.sth : Math.sqrt((1.0 - this.z) * (1.0 + this.z));
        var vector = new Vec3(st * Hploc.cos(this.phi), st * Hploc.sin(this.phi), this.z);
        // var vector = new Vec3(st*Math.cos(this.phi),st*Math.sin(this.phi),this.z);
        return vector;
    }
    ;
    toZphi() {
        return new Zphi(this.z, this.phi);
    }
    static sin(d) {
        let u = d * Hploc.M_1_PI;
        let q = Math.floor(u < 0 ? u - 0.5 : u + 0.5);
        let x = 4.0 * q;
        d -= x * Hploc.PI4_A;
        d -= x * Hploc.PI4_B;
        d -= x * Hploc.PI4_C;
        if ((q & 1) != 0) {
            d = -d;
        }
        return this.sincoshelper(d);
    }
    ;
    static cos(d) {
        //		let u = d * Hploc.M_1_PI - 0.5;
        let u = d * Hploc.M_1_PI - 0.5;
        //		u -= 0.5;
        let q = 1 + 2 * Math.floor(u < 0 ? u - 0.5 : u + 0.5);
        let x = 2.0 * q;
        let t = x * Hploc.PI4_A;
        d = d - t;
        d -= x * Hploc.PI4_B;
        d -= x * Hploc.PI4_C;
        if ((q & 2) == 0) {
            d = -d;
        }
        return Hploc.sincoshelper(d);
    }
    ;
    static sincoshelper(d) {
        let s = d * d;
        let u = -7.97255955009037868891952e-18;
        u = u * s + 2.81009972710863200091251e-15;
        u = u * s - 7.64712219118158833288484e-13;
        u = u * s + 1.60590430605664501629054e-10;
        u = u * s - 2.50521083763502045810755e-08;
        u = u * s + 2.75573192239198747630416e-06;
        u = u * s - 0.000198412698412696162806809;
        u = u * s + 0.00833333333333332974823815;
        u = u * s - 0.166666666666666657414808;
        return s * u * d + d;
    }
    ;
    /** This method calculates the arc sine of x in radians. The return
    value is in the range [-pi/2, pi/2]. The results may have
    maximum error of 3 ulps. */
    static asin(d) {
        return Hploc.mulsign(Hploc.atan2k(Math.abs(d), Math.sqrt((1 + d) * (1 - d))), d);
    }
    ;
    /** This method calculates the arc cosine of x in radians. The
        return value is in the range [0, pi]. The results may have
        maximum error of 3 ulps. */
    static acos(d) {
        return Hploc.mulsign(Hploc.atan2k(Math.sqrt((1 + d) * (1 - d)), Math.abs(d)), d) + (d < 0 ? Math.PI : 0);
    }
    ;
    static mulsign(x, y) {
        let sign = Hploc.copySign(1, y);
        return sign * x;
    }
    ;
    static copySign(magnitude, sign) {
        return sign < 0 ? -Math.abs(magnitude) : Math.abs(magnitude);
        // let finalsign = 1;
        // if (Object.is(finalsign , -0)){
        // 	sign = -1;
        // }else if (Object.is(finalsign , 0)){
        // 	sign = 1;
        // }else {
        // 	sign = Math.sign(finalsign);
        // }
        // return finalsign * magnitude;
    }
    static atanhelper(s) {
        let t = s * s;
        let u = -1.88796008463073496563746e-05;
        u = u * t + (0.000209850076645816976906797);
        u = u * t + (-0.00110611831486672482563471);
        u = u * t + (0.00370026744188713119232403);
        u = u * t + (-0.00889896195887655491740809);
        u = u * t + (0.016599329773529201970117);
        u = u * t + (-0.0254517624932312641616861);
        u = u * t + (0.0337852580001353069993897);
        u = u * t + (-0.0407629191276836500001934);
        u = u * t + (0.0466667150077840625632675);
        u = u * t + (-0.0523674852303482457616113);
        u = u * t + (0.0587666392926673580854313);
        u = u * t + (-0.0666573579361080525984562);
        u = u * t + (0.0769219538311769618355029);
        u = u * t + (-0.090908995008245008229153);
        u = u * t + (0.111111105648261418443745);
        u = u * t + (-0.14285714266771329383765);
        u = u * t + (0.199999999996591265594148);
        u = u * t + (-0.333333333333311110369124);
        return u * t * s + s;
    }
    ;
    static atan2k(y, x) {
        let q = 0.;
        if (x < 0) {
            x = -x;
            q = -2.;
        }
        if (y > x) {
            let t = x;
            x = y;
            y = -t;
            q += 1.;
        }
        return Hploc.atanhelper(y / x) + q * (Math.PI / 2);
    }
    ;
    /** This method calculates the arc tangent of y/x in radians, using
    the signs of the two arguments to determine the quadrant of the
    result. The results may have maximum error of 2 ulps. */
    static atan2(y, x) {
        let r = Hploc.atan2k(Math.abs(y), x);
        r = Hploc.mulsign(r, x);
        if (Hploc.isinf(x) || x == 0) {
            r = Math.PI / 2 - (Hploc.isinf(x) ? (Hploc.copySign(1, x) * (Math.PI / 2)) : 0);
        }
        if (Hploc.isinf(y)) {
            r = Math.PI / 2 - (Hploc.isinf(x) ? (Hploc.copySign(1, x) * (Math.PI * 1 / 4)) : 0);
        }
        if (y == 0) {
            r = (Hploc.copySign(1, x) == -1 ? Math.PI : 0);
        }
        return Hploc.isnan(x) || Hploc.isnan(y) ? NaN : Hploc.mulsign(r, y);
    }
    ;
    /** Checks if the argument is a NaN or not. */
    static isnan(d) {
        return d != d;
    }
    ;
    /** Checks if the argument is either positive or negative infinity. */
    static isinf(d) {
        return Math.abs(d) === +Infinity;
    }
    ;
}
Hploc.PI4_A = 0.7853981554508209228515625;
Hploc.PI4_B = 0.794662735614792836713604629039764404296875e-8;
Hploc.PI4_C = 0.306161699786838294306516483068750264552437361480769e-16;
Hploc.M_1_PI = 0.3183098861837906715377675267450287;
//# sourceMappingURL=Hploc.js.map
;// ./node_modules/healpixjs/lib-esm/Vec3.js
/**
 * Partial porting to Javascript of Vec3.java from Healpix3.30
 */


class Vec3 {
    constructor(in_x, in_y, in_z) {
        if (in_x instanceof Pointing) {
            let ptg = in_x;
            let sth = Hploc.sin(ptg.theta);
            this.x = sth * Hploc.cos(ptg.phi);
            this.y = sth * Hploc.sin(ptg.phi);
            this.z = Hploc.cos(ptg.theta);
        }
        else {
            this.x = in_x;
            this.y = in_y;
            this.z = in_z;
        }
    }
    getX() {
        return this.x;
    }
    ;
    getY() {
        return this.y;
    }
    ;
    getZ() {
        return this.z;
    }
    ;
    /** Scale the vector by a given factor
    @param n the scale factor */
    scale(n) {
        this.x *= n;
        this.y *= n;
        this.z *= n;
    }
    ;
    /** Vector cross product.
    @param v another vector
    @return the vector cross product between this vector and {@code v} */
    cross(v) {
        return new Vec3(this.y * v.z - v.y * this.z, this.z * v.x - v.z * this.x, this.x * v.y - v.x * this.y);
    }
    ;
    /** Vector addition
        * @param v the vector to be added
        * @return addition result */
    add(v) {
        return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z);
    }
    ;
    /** Normalize the vector */
    normalize() {
        let d = 1. / this.length();
        this.x *= d;
        this.y *= d;
        this.z *= d;
    }
    ;
    /** Return normalized vector */
    norm() {
        let d = 1. / this.length();
        return new Vec3(this.x * d, this.y * d, this.z * d);
    }
    ;
    /** Vector length
    @return the length of the vector. */
    length() {
        return Math.sqrt(this.lengthSquared());
    }
    ;
    /** Squared vector length
        @return the squared length of the vector. */
    lengthSquared() {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    }
    ;
    /** Computes the dot product of the this vector and {@code v1}.
     * @param v1 another vector
     * @return dot product */
    dot(v1) {
        return this.x * v1.x + this.y * v1.y + this.z * v1.z;
    }
    ;
    /** Vector subtraction
     * @param v the vector to be subtracted
     * @return subtraction result */
    sub(v) {
        return new Vec3(this.x - v.x, this.y - v.y, this.z - v.z);
    }
    ;
    /** Angle between two vectors.
    @param v1 another vector
    @return the angle in radians between this vector and {@code v1};
      constrained to the range [0,PI]. */
    angle(v1) {
        return Hploc.atan2(this.cross(v1).length(), this.dot(v1));
    }
    /** Invert the signs of all components */
    flip() {
        this.x *= -1.0;
        this.y *= -1.0;
        this.z *= -1.0;
    }
    static pointing2Vec3(pointing) {
        let sth = Hploc.sin(pointing.theta);
        let x = sth * Hploc.cos(pointing.phi);
        let y = sth * Hploc.sin(pointing.phi);
        let z = Hploc.cos(pointing.theta);
        return new Vec3(x, y, z);
    }
    ;
}
//# sourceMappingURL=Vec3.js.map
;// ./node_modules/healpixjs/lib-esm/CircleFinder.js

class CircleFinder {
    /**
     * @param point: Vec3
     */
    constructor(point) {
        let np = point.length;
        //HealpixUtils.check(np>=2,"too few points");
        if (!(np >= 2)) {
            console.log("too few points");
            return;
        }
        this.center = point[0].add(point[1]);
        this.center.normalize();
        this.cosrad = point[0].dot(this.center);
        for (let i = 2; i < np; ++i) {
            if (point[i].dot(this.center) < this.cosrad) { // point outside the current circle
                this.getCircle(point, i);
            }
        }
    }
    ;
    /**
     * @parm point: Vec3
     * @param q: int
     */
    getCircle(point, q) {
        this.center = point[0].add(point[q]);
        this.center.normalize();
        this.cosrad = point[0].dot(this.center);
        for (let i = 1; i < q; ++i) {
            if (point[i].dot(this.center) < this.cosrad) { // point outside the current circle
                this.getCircle2(point, i, q);
            }
        }
    }
    ;
    /**
     * @parm point: Vec3
     * @param q1: int
     * @param q2: int
     */
    getCircle2(point, q1, q2) {
        this.center = point[q1].add(point[q2]);
        this.center.normalize();
        this.cosrad = point[q1].dot(this.center);
        for (let i = 0; i < q1; ++i) {
            if (point[i].dot(this.center) < this.cosrad) { // point outside the current circle
                this.center = (point[q1].sub(point[i])).cross(point[q2].sub(point[i]));
                this.center.normalize();
                this.cosrad = point[i].dot(this.center);
                if (this.cosrad < 0) {
                    this.center.flip();
                    this.cosrad = -this.cosrad;
                }
            }
        }
    }
    ;
    getCenter() {
        return new Vec3(this.center.x, this.center.y, this.center.z);
    }
    getCosrad() {
        return this.cosrad;
    }
    ;
}
//# sourceMappingURL=CircleFinder.js.map
;// ./node_modules/healpixjs/lib-esm/Fxyf.js
/**
 * Partial porting to Javascript of Fxyf.java from Healpix3.30
 */

class Fxyf {
    constructor(x, y, f) {
        this.fx = x;
        this.fy = y;
        this.face = f;
        // coordinate of the lowest corner of each face
        this.jrll = new Uint8Array([2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4]);
        this.jpll = new Uint8Array([1, 3, 5, 7, 0, 2, 4, 6, 1, 3, 5, 7]);
        this.halfpi = Math.PI / 2.;
    }
    toHploc() {
        let loc = new Hploc();
        let jr = this.jrll[this.face] - this.fx - this.fy;
        let nr;
        if (jr < 1) {
            nr = jr;
            let tmp = nr * nr / 3.;
            loc.z = 1 - tmp;
            if (loc.z > 0.99) {
                loc.sth = Math.sqrt(tmp * (2.0 - tmp));
                loc.have_sth = true;
            }
        }
        else if (jr > 3) {
            nr = 4 - jr;
            let tmp = nr * nr / 3.;
            loc.z = tmp - 1;
            if (loc.z < -0.99) {
                loc.sth = Math.sqrt(tmp * (2.0 - tmp));
                loc.have_sth = true;
            }
        }
        else {
            nr = 1;
            loc.z = (2 - jr) * 2.0 / 3.;
        }
        let tmp = this.jpll[this.face] * nr + this.fx - this.fy;
        if (tmp < 0) {
            tmp += 8;
        }
        if (tmp >= 8) {
            tmp -= 8;
        }
        loc.phi = (nr < 1e-15) ? 0 : (0.5 * this.halfpi * tmp) / nr;
        return loc;
    }
    ;
    toVec3() {
        return this.toHploc().toVec3();
    }
    ;
}
//# sourceMappingURL=Fxyf.js.map
;// ./node_modules/healpixjs/lib-esm/RangeSet.js
class RangeSet {
    /**
     * @param int cap: initial capacity
     */
    constructor(cap) {
        if (cap < 0)
            console.error("capacity must be positive");
        this.r = new Int32Array(cap << 1);
        this.sz = 0;
    }
    ;
    /** Append a single-value range to the object.
    @param val value to append */
    append(val) {
        this.append1(val, val + 1);
    }
    ;
    /** Append a range to the object.
   @param a first long in range
   @param b one-after-last long in range */
    append1(a, b) {
        if (a >= b)
            return;
        if ((this.sz > 0) && (a <= this.r[this.sz - 1])) {
            if (a < this.r[this.sz - 2])
                console.error("bad append operation");
            if (b > this.r[this.sz - 1])
                this.r[this.sz - 1] = b;
            return;
        }
        // this.ensureCapacity(this.sz+2);
        let cap = this.sz + 2;
        if (this.r.length < cap) {
            let newsize = Math.max(2 * this.r.length, cap);
            let rnew = new Int32Array(newsize);
            rnew.set(this.r);
            this.r = rnew;
        }
        this.r[this.sz] = a;
        this.r[this.sz + 1] = b;
        this.sz += 2;
    }
    ;
    /** Make sure the object can hold at least the given number of entries.
     * @param cap int
     * */
    ensureCapacity(cap) {
        if (this.r.length < cap)
            this.resize(Math.max(2 * this.r.length, cap));
    }
    ;
    /**
     * @param newsize int
     */
    resize(newsize) {
        if (newsize < this.sz)
            console.error("requested array size too small");
        if (newsize == this.r.length)
            return;
        let rnew = new Int32Array(newsize);
        let sliced = this.r.slice(0, this.sz + 1);
        //		this.arrayCopy(this.r, 0, rnew, 0, this.sz);
        this.r = sliced;
    }
    ;
}
//# sourceMappingURL=RangeSet.js.map
;// ./node_modules/healpixjs/lib-esm/Xyf.js
/**
 * Partial porting to Javascript of Xyf.java from Healpix3.30
 */
class Xyf {
    constructor(x, y, f) {
        this.ix = x;
        this.iy = y;
        this.face = f;
    }
}
//# sourceMappingURL=Xyf.js.map
;// ./node_modules/healpixjs/lib-esm/Healpix.js











/**
 * Partial porting to Javascript of HealpixBase.java from Healpix3.30
 */
// import Fxyf from './Fxyf.js';
// import Hploc from './Hploc.js';
// import Xyf from './Xyf.js';
// import Vec3 from './Vec3.js';
// import Pointing from './Pointing.js';
// import CircleFinder from './CircleFinder.js';
// import Zphi from './Zphi.js';
// import pstack from './pstack.js';
// import Constants from './Constants.js';
// import RangeSet from './RangeSet.js';
class Healpix {
    constructor(nside_in) {
        this.order_max = 29;
        this.inv_halfpi = 2.0 / Math.PI;
        this.twothird = 2.0 / 3.;
        // console.log("twothird "+this.twothird);
        // this.ns_max=1L<<order_max;
        this.ns_max = Math.pow(2, this.order_max);
        this.ctab = new Uint16Array([
            0, 1, 256, 257, 2, 3, 258, 259, 512, 513, 768, 769, 514, 515, 770, 771, 4, 5, 260, 261, 6, 7, 262,
            263, 516, 517, 772, 773, 518, 519, 774, 775, 1024, 1025, 1280, 1281, 1026, 1027, 1282, 1283,
            1536, 1537, 1792, 1793, 1538, 1539, 1794, 1795, 1028, 1029, 1284, 1285, 1030, 1031, 1286,
            1287, 1540, 1541, 1796, 1797, 1542, 1543, 1798, 1799, 8, 9, 264, 265, 10, 11, 266, 267, 520,
            521, 776, 777, 522, 523, 778, 779, 12, 13, 268, 269, 14, 15, 270, 271, 524, 525, 780, 781, 526,
            527, 782, 783, 1032, 1033, 1288, 1289, 1034, 1035, 1290, 1291, 1544, 1545, 1800, 1801, 1546,
            1547, 1802, 1803, 1036, 1037, 1292, 1293, 1038, 1039, 1294, 1295, 1548, 1549, 1804, 1805,
            1550, 1551, 1806, 1807, 2048, 2049, 2304, 2305, 2050, 2051, 2306, 2307, 2560, 2561, 2816,
            2817, 2562, 2563, 2818, 2819, 2052, 2053, 2308, 2309, 2054, 2055, 2310, 2311, 2564, 2565,
            2820, 2821, 2566, 2567, 2822, 2823, 3072, 3073, 3328, 3329, 3074, 3075, 3330, 3331, 3584,
            3585, 3840, 3841, 3586, 3587, 3842, 3843, 3076, 3077, 3332, 3333, 3078, 3079, 3334, 3335,
            3588, 3589, 3844, 3845, 3590, 3591, 3846, 3847, 2056, 2057, 2312, 2313, 2058, 2059, 2314,
            2315, 2568, 2569, 2824, 2825, 2570, 2571, 2826, 2827, 2060, 2061, 2316, 2317, 2062, 2063,
            2318, 2319, 2572, 2573, 2828, 2829, 2574, 2575, 2830, 2831, 3080, 3081, 3336, 3337, 3082,
            3083, 3338, 3339, 3592, 3593, 3848, 3849, 3594, 3595, 3850, 3851, 3084, 3085, 3340, 3341,
            3086, 3087, 3342, 3343, 3596, 3597, 3852, 3853, 3598, 3599, 3854, 3855
        ]);
        this.utab = new Uint16Array([0, 1, 4, 5, 16, 17, 20, 21, 64, 65, 68, 69, 80, 81, 84, 85, 256, 257, 260, 261, 272, 273, 276, 277,
            320, 321, 324, 325, 336, 337, 340, 341, 1024, 1025, 1028, 1029, 1040, 1041, 1044, 1045, 1088,
            1089, 1092, 1093, 1104, 1105, 1108, 1109, 1280, 1281, 1284, 1285, 1296, 1297, 1300, 1301,
            1344, 1345, 1348, 1349, 1360, 1361, 1364, 1365, 4096, 4097, 4100, 4101, 4112, 4113, 4116,
            4117, 4160, 4161, 4164, 4165, 4176, 4177, 4180, 4181, 4352, 4353, 4356, 4357, 4368, 4369,
            4372, 4373, 4416, 4417, 4420, 4421, 4432, 4433, 4436, 4437, 5120, 5121, 5124, 5125, 5136,
            5137, 5140, 5141, 5184, 5185, 5188, 5189, 5200, 5201, 5204, 5205, 5376, 5377, 5380, 5381,
            5392, 5393, 5396, 5397, 5440, 5441, 5444, 5445, 5456, 5457, 5460, 5461, 16384, 16385, 16388,
            16389, 16400, 16401, 16404, 16405, 16448, 16449, 16452, 16453, 16464, 16465, 16468, 16469,
            16640, 16641, 16644, 16645, 16656, 16657, 16660, 16661, 16704, 16705, 16708, 16709, 16720,
            16721, 16724, 16725, 17408, 17409, 17412, 17413, 17424, 17425, 17428, 17429, 17472, 17473,
            17476, 17477, 17488, 17489, 17492, 17493, 17664, 17665, 17668, 17669, 17680, 17681, 17684,
            17685, 17728, 17729, 17732, 17733, 17744, 17745, 17748, 17749, 20480, 20481, 20484, 20485,
            20496, 20497, 20500, 20501, 20544, 20545, 20548, 20549, 20560, 20561, 20564, 20565, 20736,
            20737, 20740, 20741, 20752, 20753, 20756, 20757, 20800, 20801, 20804, 20805, 20816, 20817,
            20820, 20821, 21504, 21505, 21508, 21509, 21520, 21521, 21524, 21525, 21568, 21569, 21572,
            21573, 21584, 21585, 21588, 21589, 21760, 21761, 21764, 21765, 21776, 21777, 21780, 21781,
            21824, 21825, 21828, 21829, 21840, 21841, 21844, 21845]);
        this.jrll = new Int16Array([2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4]);
        this.jpll = new Int16Array([1, 3, 5, 7, 0, 2, 4, 6, 1, 3, 5, 7]);
        this.xoffset = new Int16Array([-1, -1, 0, 1, 1, 1, 0, -1]);
        this.yoffset = new Int16Array([0, 1, 1, 1, 0, -1, -1, -1]);
        this.facearray = [
            new Int16Array([8, 9, 10, 11, -1, -1, -1, -1, 10, 11, 8, 9]),
            new Int16Array([5, 6, 7, 4, 8, 9, 10, 11, 9, 10, 11, 8]),
            new Int16Array([-1, -1, -1, -1, 5, 6, 7, 4, -1, -1, -1, -1]),
            new Int16Array([4, 5, 6, 7, 11, 8, 9, 10, 11, 8, 9, 10]),
            new Int16Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]),
            new Int16Array([1, 2, 3, 0, 0, 1, 2, 3, 5, 6, 7, 4]),
            new Int16Array([-1, -1, -1, -1, 7, 4, 5, 6, -1, -1, -1, -1]),
            new Int16Array([3, 0, 1, 2, 3, 0, 1, 2, 4, 5, 6, 7]),
            new Int16Array([2, 3, 0, 1, -1, -1, -1, -1, 0, 1, 2, 3]) // N
        ];
        // questo forse deve essere un UInt8Array. Viene usato da neighbours
        this.swaparray = [
            new Int16Array([0, 0, 3]),
            new Int16Array([0, 0, 6]),
            new Int16Array([0, 0, 0]),
            new Int16Array([0, 0, 5]),
            new Int16Array([0, 0, 0]),
            new Int16Array([5, 0, 0]),
            new Int16Array([0, 0, 0]),
            new Int16Array([6, 0, 0]),
            new Int16Array([3, 0, 0]) // N
        ];
        if (nside_in <= this.ns_max && nside_in > 0) {
            this.nside = nside_in;
            this.npface = this.nside * this.nside;
            this.npix = 12 * this.npface;
            this.order = this.nside2order(this.nside);
            this.nl2 = 2 * this.nside;
            this.nl3 = 3 * this.nside;
            this.nl4 = 4 * this.nside;
            this.fact2 = 4.0 / this.npix;
            this.fact1 = (this.nside << 1) * this.fact2;
            this.ncap = 2 * this.nside * (this.nside - 1); // pixels in each polar cap
            // console.log("order: "+this.order);
            // console.log("nside: "+this.nside);
        }
        this.bn = [];
        this.mpr = [];
        this.cmpr = [];
        this.smpr = [];
        // TODO INFINITE LOOP!!!!!! FIX ITTTTTTTTTT
        // TODO INFINITE LOOP!!!!!! FIX ITTTTTTTTTT
        // TODO INFINITE LOOP!!!!!! FIX ITTTTTTTTTT
        // TODO INFINITE LOOP!!!!!! FIX ITTTTTTTTTT
        // TODO INFINITE LOOP!!!!!! FIX ITTTTTTTTTT
        // TODO INFINITE LOOP!!!!!! FIX ITTTTTTTTTT
        // TODO INFINITE LOOP!!!!!! FIX ITTTTTTTTTT
        // Uncaught RangeError: Maximum call stack size exceeded
        // MOVED TO computeBn()
        //        for (let i=0; i <= this.order_max; ++i) {
        //        	this.bn[i]=new Healpix(1<<i);
        //        	this.mpr[i]=bn[i].maxPixrad();
        //        	this.cmpr[i]=Math.cos(mpr[i]);
        //        	this.smpr[i]=Math.sin(mpr[i]);
        //        }
    }
    computeBn() {
        for (let i = 0; i <= this.order_max; ++i) {
            this.bn[i] = new Healpix(1 << i);
            this.mpr[i] = this.bn[i].maxPixrad();
            this.cmpr[i] = Hploc.cos(this.mpr[i]);
            this.smpr[i] = Hploc.sin(this.mpr[i]);
        }
    }
    getNPix() {
        return this.npix;
    }
    ;
    getBoundaries(pix) {
        let points = new Array();
        let xyf = this.nest2xyf(pix);
        let dc = 0.5 / this.nside;
        let xc = (xyf.ix + 0.5) / this.nside;
        let yc = (xyf.iy + 0.5) / this.nside;
        points[0] = new Fxyf(xc + dc, yc + dc, xyf.face).toVec3();
        points[1] = new Fxyf(xc - dc, yc + dc, xyf.face).toVec3();
        points[2] = new Fxyf(xc - dc, yc - dc, xyf.face).toVec3();
        points[3] = new Fxyf(xc + dc, yc - dc, xyf.face).toVec3();
        return points;
    }
    ;
    /** Returns a set of points along the boundary of the given pixel.
     * Step 1 gives 4 points on the corners. The first point corresponds
     * to the northernmost corner, the subsequent points follow the pixel
     * boundary through west, south and east corners.
     *
     * @param pix pixel index number
     * @param step the number of returned points is 4*step
     * @return {@link Vec3} for each point
     */
    getBoundariesWithStep(pix, step) {
        // var points = new Array(); 
        let points = new Array();
        let xyf = this.nest2xyf(pix);
        let dc = 0.5 / this.nside;
        let xc = (xyf.ix + 0.5) / this.nside;
        let yc = (xyf.iy + 0.5) / this.nside;
        let d = 1.0 / (this.nside * step);
        for (let i = 0; i < step; i++) {
            points[i] = new Fxyf(xc + dc - i * d, yc + dc, xyf.face).toVec3();
            points[i + step] = new Fxyf(xc - dc, yc + dc - i * d, xyf.face).toVec3();
            points[i + 2 * step] = new Fxyf(xc - dc + i * d, yc - dc, xyf.face).toVec3();
            points[i + 3 * step] = new Fxyf(xc + dc, yc - dc + i * d, xyf.face).toVec3();
        }
        return points;
    }
    ;
    getPointsForXyfNoStep(x, y, face) {
        // let nside = Math.pow(2, this.order);
        let points = new Array();
        let xyf = new Xyf(x, y, face);
        let dc = 0.5 / this.nside;
        let xc = (xyf.ix + 0.5) / this.nside;
        let yc = (xyf.iy + 0.5) / this.nside;
        points[0] = new Fxyf(xc + dc, yc + dc, xyf.face).toVec3();
        points[1] = new Fxyf(xc - dc, yc + dc, xyf.face).toVec3();
        points[2] = new Fxyf(xc - dc, yc - dc, xyf.face).toVec3();
        points[3] = new Fxyf(xc + dc, yc - dc, xyf.face).toVec3();
        return points;
    }
    getPointsForXyf(x, y, step, face) {
        let nside = step * Math.pow(2, this.order);
        let points = new Array();
        let xyf = new Xyf(x, y, face);
        let dc = 0.5 / nside;
        let xc = (xyf.ix + 0.5) / nside;
        let yc = (xyf.iy + 0.5) / nside;
        points[0] = new Fxyf(xc + dc, yc + dc, xyf.face).toVec3();
        points[1] = new Fxyf(xc - dc, yc + dc, xyf.face).toVec3();
        points[2] = new Fxyf(xc - dc, yc - dc, xyf.face).toVec3();
        points[3] = new Fxyf(xc + dc, yc - dc, xyf.face).toVec3();
        return points;
    }
    /** Returns the neighboring pixels of ipix.
    This method works in both RING and NEST schemes, but is
    considerably faster in the NEST scheme.
    @param ipix the requested pixel number.
    @return array with indices of the neighboring pixels.
      The returned array contains (in this order)
      the pixel numbers of the SW, W, NW, N, NE, E, SE and S neighbor
      of ipix. If a neighbor does not exist (this can only happen
      for the W, N, E and S neighbors), its entry is set to -1. */
    neighbours(ipix) {
        let result = new Int32Array(8);
        let xyf = this.nest2xyf(ipix);
        let ix = xyf.ix;
        let iy = xyf.iy;
        let face_num = xyf.face;
        var nsm1 = this.nside - 1;
        if ((ix > 0) && (ix < nsm1) && (iy > 0) && (iy < nsm1)) {
            let fpix = Math.floor(face_num << (2 * this.order));
            let px0 = this.spread_bits(ix);
            let py0 = this.spread_bits(iy) << 1;
            let pxp = this.spread_bits(ix + 1);
            let pyp = this.spread_bits(iy + 1) << 1;
            let pxm = this.spread_bits(ix - 1);
            let pym = this.spread_bits(iy - 1) << 1;
            result[0] = fpix + pxm + py0;
            result[1] = fpix + pxm + pyp;
            result[2] = fpix + px0 + pyp;
            result[3] = fpix + pxp + pyp;
            result[4] = fpix + pxp + py0;
            result[5] = fpix + pxp + pym;
            result[6] = fpix + px0 + pym;
            result[7] = fpix + pxm + pym;
        }
        else {
            for (let i = 0; i < 8; ++i) {
                let x = ix + this.xoffset[i];
                let y = iy + this.yoffset[i];
                let nbnum = 4;
                if (x < 0) {
                    x += this.nside;
                    nbnum -= 1;
                }
                else if (x >= this.nside) {
                    x -= this.nside;
                    nbnum += 1;
                }
                if (y < 0) {
                    y += this.nside;
                    nbnum -= 3;
                }
                else if (y >= this.nside) {
                    y -= this.nside;
                    nbnum += 3;
                }
                let f = this.facearray[nbnum][face_num];
                if (f >= 0) {
                    let bits = this.swaparray[nbnum][face_num >>> 2];
                    if ((bits & 1) > 0) {
                        x = Math.floor(this.nside - x - 1);
                    }
                    if ((bits & 2) > 0) {
                        y = Math.floor(this.nside - y - 1);
                    }
                    if ((bits & 4) > 0) {
                        let tint = x;
                        x = y;
                        y = tint;
                    }
                    result[i] = this.xyf2nest(x, y, f);
                }
                else {
                    result[i] = -1;
                }
            }
        }
        return result;
    }
    ;
    nside2order(nside) {
        return ((nside & (nside - 1)) != 0) ? -1 : Math.log2(nside);
    }
    ;
    nest2xyf(ipix) {
        let pix = Math.floor(ipix & (this.npface - 1));
        let xyf = new Xyf(this.compress_bits(pix), this.compress_bits(pix >> 1), Math.floor((ipix >> (2 * this.order))));
        return xyf;
    }
    ;
    xyf2nest(ix, iy, face_num) {
        return Math.floor(face_num << (2 * this.order))
            + this.spread_bits(ix) + (this.spread_bits(iy) << 1);
    }
    ;
    loc2pix(hploc) {
        let z = hploc.z;
        let phi = hploc.phi;
        let za = Math.abs(z);
        let tt = this.fmodulo((phi * this.inv_halfpi), 4.0); // in [0,4)
        let pixNo;
        if (za <= this.twothird) { // Equatorial region
            let temp1 = this.nside * (0.5 + tt);
            let temp2 = this.nside * (z * 0.75);
            let jp = Math.floor(temp1 - temp2); // index of ascending edge line
            let jm = Math.floor(temp1 + temp2); // index of descending edge line
            let ifp = Math.floor(jp >>> this.order); // in {0,4}
            let ifm = Math.floor(jm >>> this.order);
            let face_num = Math.floor((ifp == ifm) ? (ifp | 4) : ((ifp < ifm) ? ifp : (ifm + 8)));
            let ix = Math.floor(jm & (this.nside - 1));
            let iy = Math.floor(this.nside - (jp & (this.nside - 1)) - 1);
            pixNo = this.xyf2nest(ix, iy, face_num);
        }
        else { // polar region, za > 2/3
            let ntt = Math.min(3, Math.floor(tt));
            let tp = tt - ntt;
            let tmp = ((za < 0.99) || (!hploc.have_sth)) ?
                this.nside * Math.sqrt(3 * (1 - za)) :
                this.nside * hploc.sth / Math.sqrt((1.0 + za) / 3.);
            let jp = Math.floor(tp * tmp); // increasing edge line index
            let jm = Math.floor((1.0 - tp) * tmp); // decreasing edge line index
            if (jp >= this.nside) {
                jp = this.nside - 1; // for points too close to the boundary
            }
            if (jm >= this.nside) {
                jm = this.nside - 1;
            }
            if (z >= 0) {
                pixNo = this.xyf2nest(Math.floor(this.nside - jm - 1), Math.floor(this.nside - jp - 1), ntt);
            }
            else {
                pixNo = this.xyf2nest(Math.floor(jp), Math.floor(jm), ntt + 8);
            }
        }
        return pixNo;
    }
    ;
    /** Returns the normalized 3-vector corresponding to the center of the
    supplied pixel.
    @param pix long the requested pixel number.
    @return the pixel's center coordinates. */
    pix2vec(pix) {
        return this.pix2loc(pix).toVec3();
    }
    ;
    /** Returns the Zphi corresponding to the center of the supplied pixel.
     @param pix the requested pixel number.
     @return the pixel's center coordinates. */
    pix2zphi(pix) {
        return this.pix2loc(pix).toZphi();
    }
    pix2ang(pix, mirror) {
        return this.pix2loc(pix).toPointing(mirror);
    }
    /**
     * @param pix long
     * @return Hploc
     */
    pix2loc(pix) {
        let loc = new Hploc(undefined);
        let xyf = this.nest2xyf(pix);
        let jr = ((this.jrll[xyf.face]) << this.order) - xyf.ix - xyf.iy - 1;
        let nr;
        if (jr < this.nside) {
            nr = jr;
            let tmp = (nr * nr) * this.fact2;
            loc.z = 1 - tmp;
            if (loc.z > 0.99) {
                loc.sth = Math.sqrt(tmp * (2. - tmp));
                loc.have_sth = true;
            }
        }
        else if (jr > this.nl3) {
            nr = this.nl4 - jr;
            let tmp = (nr * nr) * this.fact2;
            loc.z = tmp - 1;
            if (loc.z < -0.99) {
                loc.sth = Math.sqrt(tmp * (2. - tmp));
                loc.have_sth = true;
            }
        }
        else {
            nr = this.nside;
            loc.z = (this.nl2 - jr) * this.fact1;
        }
        let tmp = (this.jpll[xyf.face]) * nr + xyf.ix - xyf.iy;
        //      	assert(tmp<8*nr); // must not happen
        if (tmp < 0) {
            tmp += 8 * nr;
        }
        loc.phi = (nr == this.nside) ? 0.75 * Constants.halfpi * tmp * this.fact1 : (0.5 * Constants.halfpi * tmp) / nr;
        // loc.setPhi((nr == this.nside) ? 0.75 * Constants.halfpi * tmp * this.fact1 : (0.5 * Constants.halfpi * tmp)/nr);
        return loc;
    }
    ;
    za2vec(z, a) {
        const sin_theta = Math.sqrt(1 - z * z);
        const X = sin_theta * Math.cos(a);
        const Y = sin_theta * Math.sin(a);
        return new Vec3(X, Y, z);
    }
    ang2vec(theta, phi) {
        const z = Math.cos(theta);
        return this.za2vec(z, phi);
    }
    vec2ang(v) {
        const { z, a } = this.vec2za(v.getX(), v.getY(), v.getZ());
        return { theta: Math.acos(z), phi: a };
    }
    vec2za(X, Y, z) {
        const r2 = X * X + Y * Y;
        if (r2 == 0)
            return { z: z < 0 ? -1 : 1, a: 0 };
        else {
            const PI2 = Math.PI / 2;
            const a = (Math.atan2(Y, X) + PI2) % PI2;
            z /= Math.sqrt(z * z + r2);
            return { z, a };
        }
    }
    ang2pix(ptg, mirror) {
        return this.loc2pix(new Hploc(ptg));
    }
    ;
    fmodulo(v1, v2) {
        if (v1 >= 0) {
            return (v1 < v2) ? v1 : v1 % v2;
        }
        var tmp = v1 % v2 + v2;
        return (tmp === v2) ? 0.0 : tmp;
    }
    ;
    compress_bits(v) {
        var raw = Math.floor((v & 0x5555)) | Math.floor(((v & 0x55550000) >>> 15));
        var compressed = this.ctab[raw & 0xff] | (this.ctab[raw >>> 8] << 4);
        return compressed;
    }
    ;
    spread_bits(v) {
        return Math.floor(this.utab[v & 0xff]) | Math.floor((this.utab[(v >>> 8) & 0xff] << 16))
            | Math.floor((this.utab[(v >>> 16) & 0xff] << 32)) | Math.floor((this.utab[(v >>> 24) & 0xff] << 48));
    }
    ;
    /**
     * Returns a range set of pixels that overlap with the convex polygon
     * defined by the {@code vertex} array.
     * <p>
     * This method is more efficient in the RING scheme.
     * <p>
     * This method may return some pixels which don't overlap with the polygon
     * at all. The higher {@code fact} is chosen, the fewer false positives are
     * returned, at the cost of increased run time.
     *
     * @param vertex
     *            an array containing the vertices of the requested convex
     *            polygon.
     * @param fact
     *            The overlapping test will be done at the resolution
     *            {@code fact*nside}. For NESTED ordering, {@code fact} must be
     *            a power of 2, else it can be any positive integer. A typical
     *            choice would be 4.
     * @return the requested set of pixel number ranges
     */
    queryPolygonInclusive(vertex, fact) {
        let inclusive = (fact != 0);
        let nv = vertex.length;
        //        let ncirc = inclusive ? nv+1 : nv;
        if (!(nv >= 3)) {
            console.log("not enough vertices in polygon");
            return;
        }
        let vv = new Array();
        for (let i = 0; i < nv; ++i) {
            vv[i] = Vec3.pointing2Vec3(vertex[i]);
        }
        let normal = new Array();
        let flip = 0;
        let index = 0;
        let back = false;
        while (index < vv.length) {
            let first = vv[index];
            let medium = null;
            let last = null;
            if (index == vv.length - 1) {
                last = vv[1];
                medium = vv[0];
            }
            else if (index == vv.length - 2) {
                last = vv[0];
                medium = vv[index + 1];
            }
            else {
                medium = vv[index + 1];
                last = vv[index + 2];
            }
            normal[index] = first.cross(medium).norm();
            let hnd = normal[index].dot(last);
            if (index == 0) {
                flip = (hnd < 0.) ? -1 : 1;
                let tmp = new Pointing(first); // TODO not used
                back = false;
            }
            else {
                let flipThnd = flip * hnd;
                if (flipThnd < 0) {
                    let tmp = new Pointing(medium);
                    vv.splice(index + 1, 1);
                    normal.splice(index, 1);
                    back = true;
                    index -= 1;
                    continue;
                }
                else {
                    let tmp = new Pointing(first);
                    back = false;
                }
            }
            normal[index].scale(flip);
            index += 1;
        }
        nv = vv.length;
        let ncirc = inclusive ? nv + 1 : nv;
        let rad = new Array(ncirc);
        rad = rad.fill(Constants.halfpi);
        //        rad = rad.fill(1.5707963267948966);
        //        let p = "1.5707963267948966";
        //        rad = rad.fill(parseFloat(p));
        if (inclusive) {
            let cf = new CircleFinder(vv);
            normal[nv] = cf.getCenter();
            rad[nv] = Hploc.acos(cf.getCosrad());
        }
        return this.queryMultiDisc(normal, rad, fact);
    }
    ;
    /**
     * For NEST schema only
     *
     * @param normal:
     *            Vec3[]
     * @param rad:
     *            Float32Array
     * @param fact:
     *            The overlapping test will be done at the resolution
     *            {@code fact*nside}. For NESTED ordering, {@code fact} must be
     *            a power of 2, else it can be any positive integer. A typical
     *            choice would be 4.
     * @return RangeSet the requested set of pixel number ranges
     */
    queryMultiDisc(norm, rad, fact) {
        this.computeBn();
        let inclusive = (fact != 0);
        let nv = norm.length;
        // HealpixUtils.check(nv==rad.lengt0,"inconsistent input arrays");
        if (!(nv == rad.length)) {
            console.error("inconsistent input arrays");
            return;
        }
        let res = new RangeSet(4 << 1);
        // Removed code for Scheme.RING
        let oplus = 0;
        if (inclusive) {
            if (!(Math.pow(2, this.order_max - this.order) >= fact)) {
                console.error("invalid oversampling factor");
            }
            if (!((fact & (fact - 1)) == 0)) {
                console.error("oversampling factor must be a power of 2");
            }
            oplus = this.ilog2(fact);
        }
        let omax = this.order + oplus; // the order up to which we test
        // TODO: ignore all disks with radius>=pi
        //        let crlimit = new Float32Array[omax+1][nv][3];
        let crlimit = new Array(omax + 1);
        let o;
        let i;
        for (o = 0; o <= omax; ++o) { // prepare data at the required orders
            crlimit[o] = new Array(nv);
            let dr = this.bn[o].maxPixrad(); // safety distance
            for (i = 0; i < nv; ++i) {
                crlimit[o][i] = new Float64Array(3);
                crlimit[o][i][0] = (rad[i] + dr > Math.PI) ? -1 : Hploc.cos(rad[i] + dr);
                crlimit[o][i][1] = (o == 0) ? Hploc.cos(rad[i]) : crlimit[0][i][1];
                crlimit[o][i][2] = (rad[i] - dr < 0.) ? 1. : Hploc.cos(rad[i] - dr);
            }
        }
        let stk = new pstack(12 + 3 * omax);
        for (let i = 0; i < 12; i++) { // insert the 12 base pixels in reverse
            // order
            stk.push(11 - i, 0);
        }
        while (stk.size() > 0) { // as long as there are pixels on the stack
            // pop current pixel number and order from the stack
            let pix = stk.ptop();
            let o = stk.otop();
            stk.pop();
            let pv = this.bn[o].pix2vec(pix);
            let zone = 3;
            for (let i = 0; (i < nv) && (zone > 0); ++i) {
                let crad = pv.dot(norm[i]);
                for (let iz = 0; iz < zone; ++iz) {
                    if (crad < crlimit[o][i][iz]) {
                        zone = iz;
                    }
                }
            }
            if (zone > 0) {
                this.check_pixel(o, omax, zone, res, pix, stk, inclusive);
            }
        }
        return res;
    }
    ;
    /** Integer base 2 logarithm.
    @param arg
    @return the largest integer {@code n} that fulfills {@code 2^n<=arg}.
    For negative arguments and zero, 0 is returned. */
    ilog2(arg) {
        let max = Math.max(arg, 1);
        return 31 - Math.clz32(max);
    }
    ;
    /** Computes the cosine of the angular distance between two z, phi positions
      on the unit sphere. */
    cosdist_zphi(z1, phi1, z2, phi2) {
        return z1 * z2 + Hploc.cos(phi1 - phi2) * Math.sqrt((1.0 - z1 * z1) * (1.0 - z2 * z2));
    }
    /**
     * @param int o
     * @param int omax
     * @param int zone
     * @param RangeSet pixset
     * @param long pix
     * @param pstack stk
     * @param boolean inclusive
     */
    check_pixel(o, omax, zone, pixset, pix, stk, inclusive) {
        if (zone == 0)
            return;
        if (o < this.order) {
            if (zone >= 3) { // output all subpixels
                let sdist = 2 * (this.order - o); // the "bit-shift distance" between map orders
                pixset.append1(pix << sdist, ((pix + 1) << sdist));
            }
            else { // (zone>=1)
                for (let i = 0; i < 4; ++i) {
                    stk.push(4 * pix + 3 - i, o + 1); // add children
                }
            }
        }
        else if (o > this.order) { // this implies that inclusive==true
            if (zone >= 2) { // pixel center in shape
                pixset.append(pix >>> (2 * (o - this.order))); // output the parent pixel at order
                stk.popToMark(); // unwind the stack
            }
            else { // (zone>=1): pixel center in safety range
                if (o < omax) { // check sublevels
                    for (let i = 0; i < 4; ++i) { // add children in reverse order
                        stk.push(4 * pix + 3 - i, o + 1); // add children
                    }
                }
                else { // at resolution limit
                    pixset.append(pix >>> (2 * (o - this.order))); // output the parent pixel at order
                    stk.popToMark(); // unwind the stack
                }
            }
        }
        else { // o==order
            if (zone >= 2) {
                pixset.append(pix);
            }
            else if (inclusive) { // and (zone>=1)
                if (this.order < omax) { // check sublevels
                    stk.mark(); // remember current stack position
                    for (let i = 0; i < 4; ++i) { // add children in reverse order
                        stk.push(4 * pix + 3 - i, o + 1); // add children
                    }
                }
                else { // at resolution limit
                    pixset.append(pix); // output the pixel
                }
            }
        }
    }
    /** Returns the maximum angular distance between a pixel center and its
    corners.
    @return maximum angular distance between a pixel center and its
      corners. */
    maxPixrad() {
        let zphia = new Zphi(2. / 3., Math.PI / this.nl4);
        let xyz1 = this.convertZphi2xyz(zphia);
        let va = new Vec3(xyz1[0], xyz1[1], xyz1[2]);
        let t1 = 1. - 1. / this.nside;
        t1 *= t1;
        let zphib = new Zphi(1 - t1 / 3, 0);
        let xyz2 = this.convertZphi2xyz(zphib);
        let vb = new Vec3(xyz2[0], xyz2[1], xyz2[2]);
        return va.angle(vb);
    }
    ;
    /**
     * this is a workaround replacing the Vec3(Zphi) constructor.
     */
    convertZphi2xyz(zphi) {
        let sth = Math.sqrt((1.0 - zphi.z) * (1.0 + zphi.z));
        let x = sth * Hploc.cos(zphi.phi);
        let y = sth * Hploc.sin(zphi.phi);
        let z = zphi.z;
        return [x, y, z];
    }
    ;
    /** Returns a range set of pixels which overlap with a given disk. <p>
      This method is more efficient in the RING scheme. <p>
      This method may return some pixels which don't overlap with
      the polygon at all. The higher {@code fact} is chosen, the fewer false
      positives are returned, at the cost of increased run time.
      @param ptg the angular coordinates of the disk center
      @param radius the radius (in radians) of the disk
      @param fact The overlapping test will be done at the resolution
        {@code fact*nside}. For NESTED ordering, {@code fact} must be a power
        of 2, else it can be any positive integer. A typical choice would be 4.
      @return the requested set of pixel number ranges  */
    queryDiscInclusive(ptg, radius, fact) {
        this.computeBn();
        let inclusive = (fact != 0);
        let pixset = new RangeSet();
        if (radius >= Math.PI) { // disk covers the whole sphere
            pixset.append1(0, this.npix);
            return pixset;
        }
        let oplus = 0;
        if (inclusive) {
            // HealpixUtils.check ((1L<<order_max)>=fact,"invalid oversampling factor");
            if (!((fact & (fact - 1)) == 0)) {
                console.error("oversampling factor must be a power of 2");
            }
            oplus = this.ilog2(fact);
        }
        let omax = Math.min(this.order_max, this.order + oplus); // the order up to which we test
        let vptg = Vec3.pointing2Vec3(ptg);
        let crpdr = new Array(omax + 1);
        let crmdr = new Array(omax + 1);
        let cosrad = Hploc.cos(radius);
        let sinrad = Hploc.sin(radius);
        for (let o = 0; o <= omax; o++) { // prepare data at the required orders
            let dr = this.mpr[o]; // safety distance
            let cdr = this.cmpr[o];
            let sdr = this.smpr[o];
            crpdr[o] = (radius + dr > Math.PI) ? -1. : cosrad * cdr - sinrad * sdr;
            crmdr[o] = (radius - dr < 0.) ? 1. : cosrad * cdr + sinrad * sdr;
        }
        let stk = new pstack(12 + 3 * omax);
        for (let i = 0; i < 12; i++) { // insert the 12 base pixels in reverse order
            stk.push(11 - i, 0);
        }
        while (stk.size() > 0) { // as long as there are pixels on the stack
            // pop current pixel number and order from the stack
            let pix = stk.ptop();
            let curro = stk.otop();
            stk.pop();
            let pos = this.bn[curro].pix2zphi(pix);
            // cosine of angular distance between pixel center and disk center
            let cangdist = this.cosdist_zphi(vptg.z, ptg.phi, pos.z, pos.phi);
            if (cangdist > crpdr[curro]) {
                let zone = (cangdist < cosrad) ? 1 : ((cangdist <= crmdr[curro]) ? 2 : 3);
                this.check_pixel(curro, omax, zone, pixset, pix, stk, inclusive);
            }
        }
        return pixset;
    }
}
//# sourceMappingURL=Healpix.js.map
;// ./node_modules/healpixjs/lib-esm/index.js











//# sourceMappingURL=index.js.map

/***/ }),

/***/ 1229:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Footprint = exports.Source = exports.WMTSAdapter = exports.XYZMap = exports.HiPS = exports.createColorMapFromSamples = exports.COLOR_MAP_SAMPLE_COUNT = exports.ColorMaps = exports.GeoJSONParser = exports.CoordsType = exports.FoVUtils = exports.CartesianOpts = exports.PointInitOpts = exports.AstroOpts = exports.SphericalOpts = exports.Point = exports.ColumnType = exports.MetadataInit = exports.MetadataColumn = exports.MetadataManager = exports.TerraFootprintSetGL = exports.TerraPointSetGL = exports.CatalogueGL = exports.FootprintSetGL = exports.HoveredFootprintDetail = exports.SphereFoV = exports.FoV = exports.HiPSDescriptor = exports.AstroViewer = void 0;
var AstroViewer_js_1 = __webpack_require__(772);
Object.defineProperty(exports, "AstroViewer", ({ enumerable: true, get: function () { return AstroViewer_js_1.AstroViewer; } }));
var HiPSDescriptor_js_1 = __webpack_require__(5087);
Object.defineProperty(exports, "HiPSDescriptor", ({ enumerable: true, get: function () { return HiPSDescriptor_js_1.HiPSDescriptor; } }));
var SphereFoV_js_1 = __webpack_require__(5803);
Object.defineProperty(exports, "FoV", ({ enumerable: true, get: function () { return SphereFoV_js_1.SphereFoV; } }));
var SphereFoV_js_2 = __webpack_require__(5803);
Object.defineProperty(exports, "SphereFoV", ({ enumerable: true, get: function () { return SphereFoV_js_2.SphereFoV; } }));
var FootprintSetGL_js_1 = __webpack_require__(592);
Object.defineProperty(exports, "HoveredFootprintDetail", ({ enumerable: true, get: function () { return FootprintSetGL_js_1.HoveredFootprintDetail; } }));
Object.defineProperty(exports, "FootprintSetGL", ({ enumerable: true, get: function () { return FootprintSetGL_js_1.FootprintSetGL; } }));
var CatalogueGL_js_1 = __webpack_require__(1232);
Object.defineProperty(exports, "CatalogueGL", ({ enumerable: true, get: function () { return CatalogueGL_js_1.CatalogueGL; } }));
var TerraPointSetGL_js_1 = __webpack_require__(5781);
Object.defineProperty(exports, "TerraPointSetGL", ({ enumerable: true, get: function () { return TerraPointSetGL_js_1.TerraPointSetGL; } }));
var TerraFootprintSetGL_js_1 = __webpack_require__(9022);
Object.defineProperty(exports, "TerraFootprintSetGL", ({ enumerable: true, get: function () { return TerraFootprintSetGL_js_1.TerraFootprintSetGL; } }));
var MetadataManager_js_1 = __webpack_require__(5403);
Object.defineProperty(exports, "MetadataManager", ({ enumerable: true, get: function () { return MetadataManager_js_1.MetadataManager; } }));
var MetadataColumn_js_1 = __webpack_require__(1072);
Object.defineProperty(exports, "MetadataColumn", ({ enumerable: true, get: function () { return MetadataColumn_js_1.MetadataColumn; } }));
Object.defineProperty(exports, "MetadataInit", ({ enumerable: true, get: function () { return MetadataColumn_js_1.MetadataInit; } }));
Object.defineProperty(exports, "ColumnType", ({ enumerable: true, get: function () { return MetadataColumn_js_1.ColumnType; } }));
var Point_js_1 = __webpack_require__(6553);
Object.defineProperty(exports, "Point", ({ enumerable: true, get: function () { return Point_js_1.Point; } }));
Object.defineProperty(exports, "SphericalOpts", ({ enumerable: true, get: function () { return Point_js_1.SphericalOpts; } }));
Object.defineProperty(exports, "AstroOpts", ({ enumerable: true, get: function () { return Point_js_1.AstroOpts; } }));
Object.defineProperty(exports, "PointInitOpts", ({ enumerable: true, get: function () { return Point_js_1.PointInitOpts; } }));
Object.defineProperty(exports, "CartesianOpts", ({ enumerable: true, get: function () { return Point_js_1.CartesianOpts; } }));
var FoVUtils_js_1 = __webpack_require__(8083);
Object.defineProperty(exports, "FoVUtils", ({ enumerable: true, get: function () { return FoVUtils_js_1.FoVUtils; } }));
var CoordsType_js_1 = __webpack_require__(8145);
Object.defineProperty(exports, "CoordsType", ({ enumerable: true, get: function () { return CoordsType_js_1.CoordsType; } }));
var GeoJSONParser_js_1 = __webpack_require__(8755);
Object.defineProperty(exports, "GeoJSONParser", ({ enumerable: true, get: function () { return __importDefault(GeoJSONParser_js_1).default; } }));
var ColorMaps_js_1 = __webpack_require__(619);
Object.defineProperty(exports, "ColorMaps", ({ enumerable: true, get: function () { return ColorMaps_js_1.ColorMaps; } }));
Object.defineProperty(exports, "COLOR_MAP_SAMPLE_COUNT", ({ enumerable: true, get: function () { return ColorMaps_js_1.COLOR_MAP_SAMPLE_COUNT; } }));
Object.defineProperty(exports, "createColorMapFromSamples", ({ enumerable: true, get: function () { return ColorMaps_js_1.createColorMapFromSamples; } }));
var HiPS_js_1 = __webpack_require__(3726);
Object.defineProperty(exports, "HiPS", ({ enumerable: true, get: function () { return HiPS_js_1.HiPS; } }));
var XYZMap_js_1 = __webpack_require__(1741);
Object.defineProperty(exports, "XYZMap", ({ enumerable: true, get: function () { return XYZMap_js_1.XYZMap; } }));
var WMTSAdapter_js_1 = __webpack_require__(3956);
Object.defineProperty(exports, "WMTSAdapter", ({ enumerable: true, get: function () { return WMTSAdapter_js_1.WMTSAdapter; } }));
var Source_js_1 = __webpack_require__(146);
Object.defineProperty(exports, "Source", ({ enumerable: true, get: function () { return Source_js_1.Source; } }));
var Footprint_js_1 = __webpack_require__(2475);
Object.defineProperty(exports, "Footprint", ({ enumerable: true, get: function () { return Footprint_js_1.Footprint; } }));
console.log('astroviewer UMD loaded');


/***/ }),

/***/ 1232:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CatalogueGL = void 0;
const Source_js_1 = __webpack_require__(146);
const Point_js_1 = __webpack_require__(6553);
const CoordsType_js_1 = __webpack_require__(8145);
const Utils_js_1 = __webpack_require__(7930);
const CatalogueShaderProgram_js_1 = __webpack_require__(3559);
const MetadataManager_js_1 = __webpack_require__(5403);
class CatalogueGL {
    _kind = "CatalogueGL";
    static ELEM_SIZE = 6;
    static BYTES_X_ELEM = new Float32Array().BYTES_PER_ELEMENT;
    static STANDARD_SHAPE_SIZE = 10.0;
    static STANDARD_SHAPE_HUE = 3.0;
    _ready;
    _name;
    _description;
    // Data
    _sources;
    // gl: GL;
    // Buffers & arrays
    vertexCataloguePositionBuffer = null;
    vertexhoveredCataloguePositionBuffer = null;
    vertexCataloguePosition;
    _bufferInitialised = false;
    _webgl;
    // Index/selection bookkeeping
    hoveredIndexes;
    selectedIndexes;
    extHoveredIndexes;
    // extSelectedIndexes: number[];
    _oldMouseCoords;
    _metadataManager;
    _isVisible = true;
    _shapeColor = '#8F00FF';
    _healpixDensityMap;
    _providerUrl;
    _catalogueShaderProgram;
    _visibleTilesManager;
    constructor(catalogueName, catalogueDescription, providerUrl, metadataManager, webgl, visibleTilesManager) {
        this._webgl = webgl;
        this._ready = false;
        this._visibleTilesManager = visibleTilesManager;
        this.TYPE = 'SOURCE_CATALOGUE';
        this._name = catalogueName;
        this._description = catalogueDescription;
        this._providerUrl = providerUrl;
        this._metadataManager = metadataManager;
        this._sources = [];
        // GL init
        // this.gl = global.gl as GL;
        // this.vertexCataloguePositionBuffer = this.gl.createBuffer();
        // this.vertexhoveredCataloguePositionBuffer = this.gl.createBuffer();
        this.vertexCataloguePosition = new Float32Array(0);
        this.hoveredIndexes = [];
        this.selectedIndexes = [];
        this.extHoveredIndexes = [];
        // this.extSelectedIndexes = [];
        this._oldMouseCoords = null;
        this._healpixDensityMap = new Map();
        // this.catalogueProps = new CatalogueProps(metadataManager, defaultColor);
        // call catalogueShaderProgram to init shaders if they are not yet initialised 
        this._catalogueShaderProgram = new CatalogueShaderProgram_js_1.CatalogueShaderProgram(this._webgl);
        this._catalogueShaderProgram.shaderProgram;
        // catalogueShaderProgram.shaderProgram
        this._isVisible = true;
    }
    setIsVisible(visibility) {
        this._isVisible = visibility;
    }
    get shapeColor() {
        return this._shapeColor;
    }
    get providerUrl() {
        return this._providerUrl;
    }
    get name() {
        return this._name;
    }
    get isVisible() {
        return this._isVisible;
    }
    minMax(columnindex) {
        if (!this._sources.length)
            return { min: 0, max: 0 };
        let min = this._sources[0].details[columnindex];
        if (isNaN(Number(min))) {
            // console.warn(`${this.catalogueProps.tapMetadataList.metadataList[columnindex].name} doesn't contain only number values`)
            console.warn(`${this._metadataManager.columns[columnindex].name} doesn't contain only number values`);
            return { min: 0, max: 0 };
        }
        let max = min;
        for (const source of this._sources) {
            const v = source.details[columnindex];
            if (isNaN(Number(v))) {
                // console.warn(`${this.catalogueProps.tapMetadataList.metadataList[columnindex].name} doesn't contain number only values`)
                console.warn(`${this._metadataManager.columns[columnindex].name} doesn't contain number only values`);
                return { min: 0, max: 0 };
            }
            if (v < min)
                min = v;
            if (v > max)
                max = v;
        }
        return {
            min: Number(min),
            max: Number(max)
        };
    }
    get metadataManager() {
        return this._metadataManager;
    }
    changeMetaRA(raColumnName) {
        this._metadataManager.selectedRaColumn = raColumnName;
    }
    changeMetaDec(decColumnName) {
        this._metadataManager.selectedDecColumn = decColumnName;
    }
    changeColor(color) {
        this._shapeColor = color;
    }
    changeMetaShapeSize(metacolumnName) {
        if (!this._webgl)
            return;
        if (metacolumnName == MetadataManager_js_1.MetadataManager.STANDARD_SIZE) {
            this._metadataManager.resetShapeColumn();
            for (const source of this._sources) {
                const size = CatalogueGL.STANDARD_SHAPE_SIZE;
                source.shapeSize = size;
            }
            this._bufferInitialised = false;
            // this.initBuffer(this._webgl);
            return;
        }
        // const oldShapeSizeName = this.catalogueProps.shapeSizeColumn?.name
        // this.catalogueProps.changeCatalogueMetaShapeSize(metacolumnName);
        // const idx = this.catalogueProps.shapeSizeColumn?.index ?? this.catalogueProps.shapeSizeColumn?.index;
        const oldShapeSizeName = this._metadataManager.selectedShapeColumn?.name;
        this._metadataManager.selectedShapeColumn = metacolumnName;
        const idx = this._metadataManager.selectedShapeColumn?.index ?? -1;
        if (idx < 0) {
            // if (oldShapeSizeName) this.catalogueProps.changeCatalogueMetaShapeSize(oldShapeSizeName);
            if (oldShapeSizeName)
                this._metadataManager.selectedShapeColumn = oldShapeSizeName;
            return;
        }
        const minmax = this.minMax(idx);
        if (minmax.min == minmax.max) {
            console.warn(`${minmax} min and max are equals. No resizing will be applied.`);
            return;
        }
        for (const source of this._sources) {
            const raw = Number(source.getDetailByindex(idx));
            const min = Number(minmax.min);
            const max = Number(minmax.max);
            const norm = (raw - min) / Math.max(1e-12, (max - min));
            const size = norm * (20 - 8) + 8;
            source.shapeSize = size;
        }
        this._bufferInitialised = false;
        // this.initBuffer(this._webgl);
    }
    changeMetaShapeHue(metacolumnName) {
        if (!this._webgl)
            return;
        if (metacolumnName == MetadataManager_js_1.MetadataManager.STANDARD_HUE) {
            this._metadataManager.resetHueColumn();
            for (const source of this._sources) {
                const hue = CatalogueGL.STANDARD_SHAPE_HUE;
                source.brightnessFactor = hue;
            }
            this._bufferInitialised = false;
            // this.initBuffer(this._webgl);
            return;
        }
        const oldHueSizeName = this._metadataManager.selectedShapeColumn?.name;
        this._metadataManager.selectedHueColumn = metacolumnName;
        const idx = this._metadataManager.selectedHueColumn?.index ?? -1;
        if (idx < 0) {
            if (oldHueSizeName)
                this._metadataManager.selectedHueColumn = oldHueSizeName;
            return;
        }
        const minmax = this.minMax(idx);
        if (minmax.min == minmax.max) {
            console.warn(`${minmax} min and max are equals. No resizing will be applied.`);
            return;
        }
        for (const source of this._sources) {
            const raw = Number(source.getDetailByindex(idx));
            const min = Number(minmax.min);
            const max = Number(minmax.max);
            const norm = (raw - min) / Math.max(1e-12, (max - min));
            // map [0,1] -> [1,-1]
            source.brightnessFactor = -(norm * 2 - 1);
        }
        this._bufferInitialised = false;
        // this.initBuffer(this._webgl);
    }
    get sources() {
        return this._sources;
    }
    addSource(source) {
        this._sources.push(source);
    }
    /**
     * @param in_data Rows of TAP results
     * @param columnsmeta TapMetadataList (unused here because `CatalogueProps` already holds indices)
     */
    addSources(in_data, columnsmeta) {
        this._ready = false;
        this._sources = [];
        this._metadataManager = new MetadataManager_js_1.MetadataManager(columnsmeta);
        // const raDataIndex = (this.catalogueProps.raColumn as any).index ?? (this.catalogueProps.raColumn as any)._index;
        // const decDataIndex = (this.catalogueProps.decColumn as any).index ?? (this.catalogueProps.decColumn as any)._index;
        const raDataIndex = this._metadataManager.selectedRaColumn?.index ?? -1;
        const decDataIndex = this._metadataManager.selectedDecColumn?.index ?? -1;
        if (raDataIndex < 0 || decDataIndex < 0)
            throw new Error(`(ra, dec) idx not defined (${raDataIndex}, ${decDataIndex}) `);
        for (let j = 0; j < in_data.length; j++) {
            const point = new Point_js_1.Point({
                raDeg: in_data[j][raDataIndex],
                decDeg: in_data[j][decDataIndex]
            }, CoordsType_js_1.CoordsType.ASTRO);
            const source = new Source_js_1.Source(point, in_data[j]);
            // Ensure optional fields exist
            source.shapeSize = source.shapeSize ?? CatalogueGL.STANDARD_SHAPE_SIZE;
            source.brightnessFactor = 3;
            this.addSource(source);
            // if (this.catalogueProps.shapeHueColumn?.name) {
            if (this._metadataManager.selectedHueColumn?.name) {
                // this.changeCatalogueMetaShapeHue(this.catalogueProps.shapeHueColumn.name)
                this.changeMetaShapeHue(this._metadataManager.selectedHueColumn.name);
            }
            // if (this.catalogueProps.shapeSizeColumn?.name) {
            if (this._metadataManager.selectedShapeColumn?.name) {
                // this.changeCatalogueMetaShapeSize(this.shapeSizeColumn.name)
                this.changeMetaShapeSize(this._metadataManager.selectedShapeColumn.name);
            }
        }
        // this.initBuffer();
        this._ready = true;
        this._bufferInitialised = false;
    }
    clearSources() {
        this._sources = [];
        this.hoveredIndexes = [];
        this._healpixDensityMap.clear();
        this.vertexCataloguePosition = new Float32Array(0);
    }
    sourceMatches(left, right) {
        if (left === right)
            return true;
        const leftPoint = left.point;
        const rightPoint = right.point;
        if (leftPoint.raDeg !== rightPoint.raDeg ||
            leftPoint.decDeg !== rightPoint.decDeg) {
            return false;
        }
        if (left.details.length !== right.details.length) {
            return false;
        }
        for (let i = 0; i < left.details.length; i++) {
            if (!Object.is(left.details[i], right.details[i])) {
                return false;
            }
        }
        return true;
    }
    findSourceIndex(source) {
        const sourceIndex = this._sources.indexOf(source);
        if (sourceIndex >= 0) {
            return sourceIndex;
        }
        return this._sources.findIndex((candidate) => this.sourceMatches(candidate, source));
    }
    extHighlightSource(source, highlighted) {
        const sIdx = this.findSourceIndex(source);
        if (sIdx < 0)
            return;
        const base = sIdx * CatalogueGL.ELEM_SIZE;
        if (highlighted) {
            if (!this.hoveredIndexes.includes(sIdx)) {
                this.hoveredIndexes.push(sIdx);
            }
        }
        else {
            if (base + 4 >= this.vertexCataloguePosition.length)
                return;
            const i = this.hoveredIndexes.indexOf(sIdx);
            if (i >= 0) {
                this.hoveredIndexes.splice(i, 1);
                this.vertexCataloguePosition[base + 3] = 0.0; // not hovered
                this.vertexCataloguePosition[base + 4] = this._sources[sIdx]?.shapeSize ?? CatalogueGL.STANDARD_SHAPE_SIZE;
            }
        }
    }
    extAddSources2Selected(source) {
        if (!this._bufferInitialised) {
            this.initBuffer();
        }
        const sIdx = this.findSourceIndex(source);
        if (sIdx < 0)
            return;
        const base = sIdx * CatalogueGL.ELEM_SIZE;
        if (!this.selectedIndexes.includes(sIdx)) {
            this.selectedIndexes.push(sIdx);
            // this.vertexCataloguePosition[base + 3] = 2.0; // selected
            // this.vertexCataloguePosition[base + 4] = this._sources[sIdx]?.shapeSize ?? CatalogueGL.STANDARD_SHAPE_SIZE;
        }
        else {
            if (base + 4 >= this.vertexCataloguePosition.length)
                return;
            const i = this.selectedIndexes.indexOf(sIdx);
            if (i >= 0) {
                this.selectedIndexes.splice(i, 1);
                this.vertexCataloguePosition[base + 3] = 0.0; // not selected
                this.vertexCataloguePosition[base + 4] = this._sources[sIdx]?.shapeSize ?? CatalogueGL.STANDARD_SHAPE_SIZE;
            }
        }
    }
    initBuffer() {
        // this._webgl = webgl
        this.vertexCataloguePositionBuffer = this._webgl.createBuffer();
        this.vertexhoveredCataloguePositionBuffer = this._webgl.createBuffer();
        this._webgl.bindBuffer(this._webgl.ARRAY_BUFFER, this.vertexCataloguePositionBuffer);
        const nSources = this._sources.length;
        this.vertexCataloguePosition = new Float32Array(nSources * CatalogueGL.ELEM_SIZE);
        let positionIndex = 0;
        for (let j = 0; j < nSources; j++) {
            const currSource = this._sources[j];
            const currPix = currSource.healpixPixel;
            // density map
            const bucket = this._healpixDensityMap.get(currPix);
            if (bucket) {
                if (!bucket.includes(j))
                    bucket.push(j);
            }
            else {
                this._healpixDensityMap.set(currPix, [j]);
            }
            // position
            this.vertexCataloguePosition[positionIndex + 0] = currSource.point.x;
            this.vertexCataloguePosition[positionIndex + 1] = currSource.point.y;
            this.vertexCataloguePosition[positionIndex + 2] = currSource.point.z;
            // hovered flag
            this.vertexCataloguePosition[positionIndex + 3] = 0.0;
            // size
            this.vertexCataloguePosition[positionIndex + 4] = currSource.shapeSize ?? CatalogueGL.STANDARD_SHAPE_SIZE;
            // brightness
            this.vertexCataloguePosition[positionIndex + 5] = currSource.brightnessFactor ?? 0.0;
            positionIndex += CatalogueGL.ELEM_SIZE;
        }
        this._webgl.bufferData(this._webgl.ARRAY_BUFFER, this.vertexCataloguePosition, this._webgl.STATIC_DRAW);
        this._bufferInitialised = true;
    }
    getSelectionRadius() {
        const order = this._visibleTilesManager.getVisibleOrder();
        switch (order) {
            case 0:
            case 1:
            case 2:
                // return 0.005;
                return 0.01;
            case 3:
            // return 0.001;
            case 4:
            // return 0.0009;
            case 5:
                // return 0.0005;
                return 0.005;
            case 6:
            // return 0.0001;
            case 7:
            // return 0.00009;
            case 8:
                // return 0.00005;
                return 0.001;
            case 9:
                return 0.0005;
            default:
                return 0.0001;
        }
    }
    checkClicking(in_mouseHelper) {
        if (in_mouseHelper.x == null || in_mouseHelper.y == null || in_mouseHelper.z == null) {
            console.log('CatalogueGL.checkClicking: missing mouse coords');
            return [];
        }
        const clickedIndexes = [];
        const mousePix = in_mouseHelper.computeNpix();
        if (mousePix != null && this._healpixDensityMap.has(mousePix)) {
            const candidates = this._healpixDensityMap.get(mousePix);
            const selR = this.getSelectionRadius();
            for (let i = 0; i < candidates.length; i++) {
                const sourceIdx = candidates[i];
                const source = this._sources[sourceIdx];
                if (!source)
                    continue;
                const dx = source.point.x - in_mouseHelper.x;
                const dy = source.point.y - in_mouseHelper.y;
                const dz = source.point.z - in_mouseHelper.z;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                if (dist <= selR) {
                    clickedIndexes.push(sourceIdx);
                }
            }
        }
        return clickedIndexes;
    }
    // private setSelectedIndexes(nextSelected: number[]) {
    //     const deduped = Array.from(new Set(nextSelected))
    //         .filter((idx) => idx >= 0 && idx < this._sources.length);
    //     if (this.vertexCataloguePosition.length) {
    //         for (const prevIdx of this.selectedIndexes) {
    //             if (deduped.includes(prevIdx)) continue;
    //             const base = prevIdx * CatalogueGL.ELEM_SIZE;
    //             if (base + 4 >= this.vertexCataloguePosition.length) continue;
    //             if (!this.hoveredIndexes.includes(prevIdx) && !this.extHoveredIndexes.includes(prevIdx)) {
    //                 this.vertexCataloguePosition[base + 3] = 0.0;
    //             }
    //             this.vertexCataloguePosition[base + 4] = this._sources[prevIdx]?.shapeSize ?? CatalogueGL.STANDARD_SHAPE_SIZE;
    //         }
    //     }
    //     this.selectedIndexes = deduped;
    // }
    setSelectedIndexes(selectedIndex) {
        selectedIndex.forEach(idx => {
            if (idx < 0 || idx >= this._sources.length)
                return;
            const base = idx * CatalogueGL.ELEM_SIZE;
            if (base + 4 >= this.vertexCataloguePosition.length)
                return;
            if (this.selectedIndexes.includes(idx)) {
                this.selectedIndexes.splice(this.selectedIndexes.indexOf(idx), 1);
                this.vertexCataloguePosition[base + 3] = 0.0; // not selected
                this.vertexCataloguePosition[base + 4] = this._sources[idx]?.shapeSize ?? CatalogueGL.STANDARD_SHAPE_SIZE;
            }
            else {
                this.selectedIndexes.push(idx);
                this.vertexCataloguePosition[base + 3] = 2.0; // selected
                this.vertexCataloguePosition[base + 4] = this._sources[idx]?.shapeSize ?? CatalogueGL.STANDARD_SHAPE_SIZE;
            }
        });
    }
    /**
     * Run click-picking and update selection with the nearest candidate in current pixel.
     * Returns the selected source or null if no source was hit.
     */
    getSourcesFromPointer(in_mouseHelper) {
        const pickedIndexes = this.checkClicking(in_mouseHelper);
        if (!pickedIndexes.length) {
            return {
                sources: [],
                pickedIndexes: [],
            };
        }
        const sources = [];
        pickedIndexes.forEach(idx => {
            const source = this._sources[idx];
            if (source)
                sources.push(source);
        });
        return sources.length ? { sources, pickedIndexes } : null;
    }
    /**
     * Run click-picking and update selection with the nearest candidate in current pixel.
     * Returns the selected source or null if no source was hit.
     */
    selectPrimarySourceFromClick(in_mouseHelper) {
        const picked = this.getSourcesFromPointer(in_mouseHelper);
        const clickedIndexes = picked?.pickedIndexes ?? [];
        // if (!clickedIndexes.length) {
        //     this.setSelectedIndexes([]);
        //     return null;
        // }
        // const selectedIdx = clickedIndexes[0];
        // this.setSelectedIndexes([selectedIdx]);
        // return this._sources[selectedIdx] ?? null;
        this.setSelectedIndexes(clickedIndexes);
        if (!clickedIndexes.length) {
            return {
                sources: [],
                selectionState: [],
            };
        }
        const selectionState = [];
        const selectedSources = [];
        clickedIndexes.forEach(idx => {
            const source = this._sources[idx];
            if (!source)
                return;
            const selected = this.selectedIndexes.includes(idx);
            selectionState.push({ source, selected });
            selectedSources.push(source);
        });
        return selectedSources.length
            ? { sources: selectedSources, selectionState }
            : null;
    }
    getPrimaryHoveredSource() {
        if (!this.hoveredIndexes.length)
            return null;
        const idx = this.hoveredIndexes[0];
        return this._sources[idx] ?? null;
    }
    checkHovering(in_mouseHelper) {
        if (in_mouseHelper.x == null || in_mouseHelper.y == null || in_mouseHelper.z == null) {
            console.log('CatalogueGL.checkHovering: missing mouse coords');
            return [];
        }
        const hoveredIndexes = [];
        const mousePix = in_mouseHelper.computeNpix();
        if (mousePix != null && this._healpixDensityMap.has(mousePix)) {
            const candidates = this._healpixDensityMap.get(mousePix);
            const selR = this.getSelectionRadius();
            for (let i = 0; i < candidates.length; i++) {
                const sourceIdx = candidates[i];
                const source = this._sources[sourceIdx];
                if (!source)
                    continue;
                const dx = source.point.x - in_mouseHelper.x;
                const dy = source.point.y - in_mouseHelper.y;
                const dz = source.point.z - in_mouseHelper.z;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                if (dist <= selR) {
                    hoveredIndexes.push(sourceIdx);
                }
            }
        }
        return hoveredIndexes;
    }
    /**
     * @param in_mMatrix Model matrix the current catalogue is associated to (e.g. HiPS matrix)
     */
    draw(in_mMatrix, in_mouseHelper, vMatrix, pMatrix) {
        if (!this.isVisible)
            return;
        if (!this._ready)
            return;
        if (!vMatrix)
            return;
        if (!this._bufferInitialised)
            this.initBuffer();
        if (!this._webgl)
            return;
        this._catalogueShaderProgram.enableShaders(pMatrix, in_mMatrix, vMatrix);
        this._webgl.bindBuffer(this._webgl.ARRAY_BUFFER, this.vertexCataloguePositionBuffer);
        // positions
        this._webgl.vertexAttribPointer(this._catalogueShaderProgram.locations.position, 3, this._webgl.FLOAT, false, CatalogueGL.BYTES_X_ELEM * CatalogueGL.ELEM_SIZE, 0);
        this._webgl.enableVertexAttribArray(this._catalogueShaderProgram.locations.position);
        // hovered flag
        this._webgl.vertexAttribPointer(this._catalogueShaderProgram.locations.hovered, 1, this._webgl.FLOAT, false, CatalogueGL.BYTES_X_ELEM * CatalogueGL.ELEM_SIZE, CatalogueGL.BYTES_X_ELEM * 3);
        this._webgl.enableVertexAttribArray(this._catalogueShaderProgram.locations.hovered);
        // point size
        this._webgl.vertexAttribPointer(this._catalogueShaderProgram.locations.pointSize, 1, this._webgl.FLOAT, false, CatalogueGL.BYTES_X_ELEM * CatalogueGL.ELEM_SIZE, CatalogueGL.BYTES_X_ELEM * 4);
        this._webgl.enableVertexAttribArray(this._catalogueShaderProgram.locations.pointSize);
        // brightness
        this._webgl.vertexAttribPointer(this._catalogueShaderProgram.locations.brightness, 1, this._webgl.FLOAT, false, CatalogueGL.BYTES_X_ELEM * CatalogueGL.ELEM_SIZE, CatalogueGL.BYTES_X_ELEM * 5);
        this._webgl.enableVertexAttribArray(this._catalogueShaderProgram.locations.brightness);
        // color
        const rgb = (0, Utils_js_1.colorHex2RGB)(this._shapeColor);
        if (this._catalogueShaderProgram.locations.color) {
            this._webgl.uniform4f(this._catalogueShaderProgram.locations.color, rgb[0], rgb[1], rgb[2], 1.0);
        }
        // selected flags
        for (let s = 0; s < this.selectedIndexes.length; s++) {
            const idx = this.selectedIndexes[s];
            const base = idx * CatalogueGL.ELEM_SIZE;
            this.vertexCataloguePosition[base + 3] = 2.0; // selected
            this.vertexCataloguePosition[base + 4] = this._sources[idx].shapeSize; // size
        }
        // clear old hovered
        for (let k = 0; k < this.hoveredIndexes.length; k++) {
            const base = this.hoveredIndexes[k] * CatalogueGL.ELEM_SIZE;
            // if (this.vertexCataloguePosition[base + 3] == 2.0) continue; // selected, skip hover
            this.vertexCataloguePosition[base + 3] = 0.0; // not hovered
            this.vertexCataloguePosition[base + 4] = this._sources[this.hoveredIndexes[k]].shapeSize; // size
        }
        // Hover logic on mouse move
        if (in_mouseHelper != null && in_mouseHelper.xyz !== this._oldMouseCoords) {
            // // clear old hovered
            // for (let k = 0; k < this.hoveredIndexes.length; k++) {
            //     const base = this.hoveredIndexes[k] * CatalogueGL.ELEM_SIZE;
            //     if (this.vertexCataloguePosition[base + 3] == 2.0) continue; // selected, skip hover
            //     this.vertexCataloguePosition[base + 3] = 0.0; // not hovered
            //     this.vertexCataloguePosition[base + 4] = this._sources[this.hoveredIndexes[k]].shapeSize; // size
            // }
            this.hoveredIndexes = this.checkHovering(in_mouseHelper);
            // // new hovered
            // for (let i = 0; i < this.hoveredIndexes.length; i++) {
            //     const idx = this.hoveredIndexes[i];
            //     const base = idx * CatalogueGL.ELEM_SIZE;
            //     if (this.vertexCataloguePosition[base + 3] == 2.0) continue; // selected, skip hover
            //     this.vertexCataloguePosition[base + 3] = 1.0; // hovered
            //     this.vertexCataloguePosition[base + 4] = this._sources[idx].shapeSize; // size
            // }
        }
        // new hovered
        for (let i = 0; i < this.hoveredIndexes.length; i++) {
            const idx = this.hoveredIndexes[i];
            const base = idx * CatalogueGL.ELEM_SIZE;
            // if (this.vertexCataloguePosition[base + 3] == 2.0) continue; // selected, skip hover
            this.vertexCataloguePosition[base + 3] = 1.0; // hovered
            this.vertexCataloguePosition[base + 4] = this._sources[idx].shapeSize; // size
        }
        // upload buffer
        this._webgl.bufferData(this._webgl.ARRAY_BUFFER, this.vertexCataloguePosition, this._webgl.STATIC_DRAW);
        // draw
        const numItems = this.vertexCataloguePosition.length / CatalogueGL.ELEM_SIZE;
        this._webgl.drawArrays(this._webgl.POINTS, 0, numItems);
        this._oldMouseCoords = in_mouseHelper.xyz;
    }
}
exports.CatalogueGL = CatalogueGL;
// export default CatalogueGL;


/***/ }),

/***/ 1375:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.XYZTile = void 0;
const XYZMeshBuilder_js_1 = __webpack_require__(8819);
class XYZTile {
    _coord;
    _url;
    _webgl;
    _shaderProgram;
    _meshBuilder;
    _gpuMesh;
    _texture = null;
    _image;
    _ready = false;
    _loading = false;
    _aborted = false;
    _failedUntil = 0;
    _lastUsedAt = 0;
    _createdAt = Date.now();
    constructor(coord, url, webgl, shaderProgram, meshBuilder = new XYZMeshBuilder_js_1.XYZMeshBuilder(), segmentsPerSide = 16) {
        this._coord = coord;
        this._url = url;
        this._webgl = webgl;
        this._shaderProgram = shaderProgram;
        this._meshBuilder = meshBuilder;
        const mesh = this._meshBuilder.buildTileMesh(coord, segmentsPerSide);
        this._gpuMesh = this._meshBuilder.uploadMesh(mesh, this._webgl);
        this.initImage();
    }
    get coord() {
        return this._coord;
    }
    get ready() {
        return this._ready;
    }
    get loading() {
        return this._loading;
    }
    get failedUntil() {
        return this._failedUntil;
    }
    get lastUsedAt() {
        return this._lastUsedAt;
    }
    get createdAt() {
        return this._createdAt;
    }
    touch() {
        this._lastUsedAt = Date.now();
    }
    initImage() {
        if (this._loading || this._ready || this._aborted) {
            return;
        }
        const now = Date.now();
        if (this._failedUntil > now) {
            return;
        }
        this._loading = true;
        const image = new Image();
        this._image = image;
        image.crossOrigin = 'anonymous';
        image.onload = () => this.imageLoaded();
        image.onerror = () => {
            this._ready = false;
            this._loading = false;
            this._failedUntil = Date.now() + 30_000;
        };
        image.src = this._url;
    }
    imageLoaded() {
        if (!this._image || this._aborted) {
            return;
        }
        this.textureLoaded(this._image);
        this._loading = false;
        this._failedUntil = 0;
        this._ready = true;
    }
    textureLoaded(image) {
        const gl = this._webgl;
        this._shaderProgram.enableProgram();
        const texture = gl.createTexture();
        if (!texture) {
            throw new Error(`Could not create XYZ texture for ${this.key}`);
        }
        this._texture = texture;
        gl.activeTexture(gl.TEXTURE0);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }
    draw(pMatrix, vMatrix, mMatrix, colorMapIdx) {
        this.touch();
        if (!this._ready || !this._texture || this._aborted) {
            return false;
        }
        this.drawWithGpuMesh(this._gpuMesh, pMatrix, vMatrix, mMatrix, colorMapIdx);
        return true;
    }
    drawRemapped(mesh, pMatrix, vMatrix, mMatrix, colorMapIdx) {
        this.touch();
        if (!this._ready || !this._texture || this._aborted) {
            return false;
        }
        this.drawWithGpuMesh(mesh, pMatrix, vMatrix, mMatrix, colorMapIdx);
        return true;
    }
    dispose() {
        const gl = this._webgl;
        if (this._texture) {
            gl.deleteTexture(this._texture);
            this._texture = null;
        }
        if (this._gpuMesh.positionBuffer) {
            gl.deleteBuffer(this._gpuMesh.positionBuffer);
            this._gpuMesh.positionBuffer = null;
        }
        if (this._gpuMesh.uvBuffer) {
            gl.deleteBuffer(this._gpuMesh.uvBuffer);
            this._gpuMesh.uvBuffer = null;
        }
        if (this._gpuMesh.indexBuffer) {
            gl.deleteBuffer(this._gpuMesh.indexBuffer);
            this._gpuMesh.indexBuffer = null;
        }
        this._image = undefined;
        this._ready = false;
        this._loading = false;
        this._aborted = true;
    }
    drawWithGpuMesh(mesh, pMatrix, vMatrix, mMatrix, colorMapIdx) {
        if (!this._texture) {
            return;
        }
        const gl = this._webgl;
        this._shaderProgram.enableShaders(pMatrix, vMatrix, mMatrix, colorMapIdx);
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.positionBuffer);
        gl.vertexAttribPointer(this._shaderProgram.locations.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this._shaderProgram.locations.vertexPositionAttribute);
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.uvBuffer);
        gl.vertexAttribPointer(this._shaderProgram.locations.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this._shaderProgram.locations.textureCoordAttribute);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this._texture);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
        gl.drawElements(gl.TRIANGLES, mesh.indexCount, mesh.indexType, 0);
        gl.disableVertexAttribArray(this._shaderProgram.locations.vertexPositionAttribute);
        gl.disableVertexAttribArray(this._shaderProgram.locations.textureCoordAttribute);
    }
    get key() {
        return `${this._coord.z}/${this._coord.x}/${this._coord.y}`;
    }
}
exports.XYZTile = XYZTile;


/***/ }),

/***/ 1741:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.XYZMap = void 0;
const AbstractSkyEntity_js_1 = __webpack_require__(4735);
const XYZVisibleTilesManager_js_1 = __webpack_require__(6937);
const XYZFoVHelper_js_1 = __webpack_require__(8284);
const ColorMaps_js_1 = __webpack_require__(619);
const LonLatGrid_js_1 = __webpack_require__(8124);
const XYZShaderProgram_js_1 = __webpack_require__(149);
const XYZTileBuffer_js_1 = __webpack_require__(2737);
const XYZAnchestorTile_js_1 = __webpack_require__(3174);
const XYZMeshBuilder_js_1 = __webpack_require__(8819);
class XYZMap extends AbstractSkyEntity_js_1.AbstractSkyEntity {
    _xyzShaderProgram;
    _descriptor;
    _visibleTilesManager;
    _tileBuffer;
    _meshBuilder;
    _baseurl;
    _zoom;
    _latLonGrid;
    _colorMapIdx = 0;
    _colorMap = ColorMaps_js_1.ColorMaps['native'];
    constructor(radius, position, xrad, yrad, descriptor, webgl) {
        super(radius, position, xrad, yrad, descriptor.name, webgl, false);
        this._descriptor = descriptor;
        this._xyzShaderProgram = new XYZShaderProgram_js_1.XYZShaderProgram(webgl);
        this._meshBuilder = new XYZMeshBuilder_js_1.XYZMeshBuilder();
        this._tileBuffer = new XYZTileBuffer_js_1.XYZTileBuffer(1);
        this.initGL(webgl);
        this._latLonGrid = new LonLatGrid_js_1.LatLonGrid(radius, position, xrad, yrad, 'LatLonGrid', this._webgl);
        this._visibleTilesManager = new XYZVisibleTilesManager_js_1.XYZVisibleTilesManager();
        this._baseurl = descriptor.url;
        this.initShaders();
        const fov = 180;
        this._zoom = XYZFoVHelper_js_1.xyzFovHelper.getZoom(fov);
    }
    changeColorMap(colorMap) {
        this._colorMap = colorMap;
        switch (colorMap.name) {
            case 'grayscale':
                this._colorMapIdx = 1;
                this._colorMap = ColorMaps_js_1.ColorMaps['grayscale'];
                break;
            case 'planck':
                this._colorMapIdx = 2;
                this._colorMap = ColorMaps_js_1.ColorMaps['planck'];
                break;
            case 'cmb':
                this._colorMapIdx = 3;
                this._colorMap = ColorMaps_js_1.ColorMaps['cmb'];
                break;
            case 'rainbow':
                this._colorMapIdx = 4;
                this._colorMap = ColorMaps_js_1.ColorMaps['rainbow'];
                break;
            case 'eosb':
                this._colorMapIdx = 5;
                this._colorMap = ColorMaps_js_1.ColorMaps['eosb'];
                break;
            case 'cubehelix':
                this._colorMapIdx = 6;
                this._colorMap = ColorMaps_js_1.ColorMaps['cubehelix'];
                break;
            case 'hot':
                this._colorMapIdx = 7;
                this._colorMap = ColorMaps_js_1.ColorMaps['hot'];
                break;
            case 'gray':
                this._colorMapIdx = 8;
                this._colorMap = ColorMaps_js_1.ColorMaps['gray'];
                break;
            case 'native':
                this._colorMapIdx = 0;
                this._colorMap = ColorMaps_js_1.ColorMaps['native'];
                break;
            default:
                this._colorMapIdx = 9;
                this._colorMap = colorMap;
        }
    }
    initShaders() {
        this._xyzShaderProgram.enableProgram();
    }
    isLonLatGridVisible() {
        return this._latLonGrid.isVisible();
    }
    toggleLonLatGrid() {
        return this._latLonGrid.toggleShowGrid();
    }
    getFoV() {
        return this._latLonGrid.getFoV();
    }
    refresh(input) {
        const fov = this._latLonGrid.refreshFoV(input);
        // this._zoom = this.resolveVisibleZoom(fov)
        this._zoom = XYZFoVHelper_js_1.xyzFovHelper.getZoom(fov);
    }
    draw(input) {
        const vMatrix = input.camera.getCameraMatrix();
        if (!vMatrix)
            return;
        const pMatrix = input.pMatrix;
        if (!pMatrix)
            return;
        this.refresh(input);
        const mMatrix = this.getModelMatrix();
        this._xyzShaderProgram.setRuntimeColorMap(this._colorMap);
        const tileSelection = this._visibleTilesManager.computeVisibleTiles(this._zoom, this, this._webgl, input.camera, input.pMatrix);
        const visibleTiles = tileSelection.visibleTiles;
        const ancestorsMap = tileSelection.ancestorsMap;
        const tileKeys = this._tileBuffer.ensureTiles(this.getTilesToEnsure(visibleTiles, ancestorsMap), (coord) => this.createTile(coord));
        this._tileBuffer.evictCached(this._descriptor.maxCachedTiles);
        for (const tileKey of tileKeys) {
            const tile = this._tileBuffer.getActiveTile(tileKey);
            if (!tile || tile.coord.z !== tileSelection.currentZoom) {
                continue;
            }
            const drawn = tile.draw(pMatrix, vMatrix, mMatrix, this._colorMapIdx);
            if (drawn) {
                continue;
            }
            const ancestorTile = this.findBestAvailableAncestor(tile.coord);
            ancestorTile?.draw(tileSelection.currentZoom, [tile.coord], ancestorsMap, pMatrix, vMatrix, mMatrix, this._colorMapIdx);
        }
        this._latLonGrid.draw(input);
    }
    createTile(coord) {
        return new XYZAnchestorTile_js_1.XYZAnchestorTile(coord, this.resolveTileUrl(coord), this._webgl, this._xyzShaderProgram, this._meshBuilder, this._descriptor.segmentsPerSide);
    }
    getTilesToEnsure(visibleTiles, ancestorsMap) {
        const tilesByKey = new Map();
        for (const tile of visibleTiles) {
            tilesByKey.set(this.tileKey(tile), tile);
        }
        for (const ancestor of ancestorsMap.values()) {
            tilesByKey.set(this.tileKey(ancestor), ancestor);
        }
        return Array.from(tilesByKey.values());
    }
    findBestAvailableAncestor(targetTile) {
        for (let z = targetTile.z - 1; z >= 0; z--) {
            const dz = targetTile.z - z;
            const ancestorCoord = {
                z,
                x: targetTile.x >> dz,
                y: targetTile.y >> dz,
            };
            const ancestorTile = this._tileBuffer.getAnyTile(this.tileKey(ancestorCoord));
            if (ancestorTile?.ready) {
                return ancestorTile;
            }
        }
        return null;
    }
    resolveTileUrl(tile) {
        const urlResolver = this._descriptor.urlResolver;
        if (urlResolver) {
            return urlResolver(tile);
        }
        const dim = 2 ** tile.z;
        const y = this._descriptor.flipY ? dim - 1 - tile.y : tile.y;
        const subdomains = this._descriptor.subdomains;
        const subdomain = subdomains.length > 0
            ? subdomains[Math.abs(tile.x + tile.y + tile.z) % subdomains.length]
            : '';
        return this._baseurl
            .replace(/\{z\}/g, String(tile.z))
            .replace(/\{x\}/g, String(tile.x))
            .replace(/\{y\}/g, String(y))
            .replace(/\{s\}/g, subdomain ?? '');
    }
    getDebugStats() {
        const activeTiles = Array.from(this._tileBuffer.activeTiles.values(), (entry) => entry.tile);
        const cachedTiles = Array.from(this._tileBuffer.cachedTiles.values(), (entry) => entry.tile);
        const allTiles = [...activeTiles, ...cachedTiles];
        const selection = this._visibleTilesManager.selection;
        return {
            cacheSize: this._tileBuffer.size,
            visibleTileCount: selection.visibleTiles.length,
            currentTileCount: activeTiles.filter((tile) => tile.coord.z === selection.currentZoom).length,
            fallbackTileCount: selection.ancestorsMap.size,
            coreTileCount: selection.visibleTiles.length,
            coverageTileCount: selection.visibleTiles.length,
            readyTileCount: allTiles.filter((tile) => tile.ready).length,
            loadingTileCount: allTiles.filter((tile) => tile.loading).length,
            coolingDownTileCount: 0,
            currentZoom: selection.currentZoom,
            tileSelectionKey: selection.key,
            isSettling: false,
            coarseTileCount: selection.ancestorsMap.size,
            hasPendingSelection: false,
            pendingSelectionKey: null,
        };
    }
    tileKey(tile) {
        return `${tile.z}/${tile.x}/${tile.y}`;
    }
}
exports.XYZMap = XYZMap;


/***/ }),

/***/ 1961:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  glMatrix: () => (/* reexport */ common_namespaceObject),
  mat2: () => (/* reexport */ mat2_namespaceObject),
  mat2d: () => (/* reexport */ mat2d_namespaceObject),
  mat3: () => (/* reexport */ mat3_namespaceObject),
  mat4: () => (/* reexport */ mat4_namespaceObject),
  quat: () => (/* reexport */ quat_namespaceObject),
  quat2: () => (/* reexport */ quat2_namespaceObject),
  vec2: () => (/* reexport */ vec2_namespaceObject),
  vec3: () => (/* reexport */ vec3_namespaceObject),
  vec4: () => (/* reexport */ vec4_namespaceObject)
});

// NAMESPACE OBJECT: ./node_modules/gl-matrix/esm/common.js
var common_namespaceObject = {};
__webpack_require__.r(common_namespaceObject);
__webpack_require__.d(common_namespaceObject, {
  ANGLE_ORDER: () => (ANGLE_ORDER),
  ARRAY_TYPE: () => (ARRAY_TYPE),
  EPSILON: () => (EPSILON),
  RANDOM: () => (RANDOM),
  equals: () => (equals),
  round: () => (round),
  setMatrixArrayType: () => (setMatrixArrayType),
  toDegree: () => (toDegree),
  toRadian: () => (toRadian)
});

// NAMESPACE OBJECT: ./node_modules/gl-matrix/esm/mat2.js
var mat2_namespaceObject = {};
__webpack_require__.r(mat2_namespaceObject);
__webpack_require__.d(mat2_namespaceObject, {
  LDU: () => (LDU),
  add: () => (add),
  adjoint: () => (adjoint),
  clone: () => (clone),
  copy: () => (copy),
  create: () => (create),
  determinant: () => (determinant),
  equals: () => (mat2_equals),
  exactEquals: () => (exactEquals),
  frob: () => (frob),
  fromRotation: () => (fromRotation),
  fromScaling: () => (fromScaling),
  fromValues: () => (fromValues),
  identity: () => (identity),
  invert: () => (invert),
  mul: () => (mul),
  multiply: () => (multiply),
  multiplyScalar: () => (multiplyScalar),
  multiplyScalarAndAdd: () => (multiplyScalarAndAdd),
  rotate: () => (rotate),
  scale: () => (scale),
  set: () => (set),
  str: () => (str),
  sub: () => (sub),
  subtract: () => (subtract),
  transpose: () => (transpose)
});

// NAMESPACE OBJECT: ./node_modules/gl-matrix/esm/mat2d.js
var mat2d_namespaceObject = {};
__webpack_require__.r(mat2d_namespaceObject);
__webpack_require__.d(mat2d_namespaceObject, {
  add: () => (mat2d_add),
  clone: () => (mat2d_clone),
  copy: () => (mat2d_copy),
  create: () => (mat2d_create),
  determinant: () => (mat2d_determinant),
  equals: () => (mat2d_equals),
  exactEquals: () => (mat2d_exactEquals),
  frob: () => (mat2d_frob),
  fromRotation: () => (mat2d_fromRotation),
  fromScaling: () => (mat2d_fromScaling),
  fromTranslation: () => (fromTranslation),
  fromValues: () => (mat2d_fromValues),
  identity: () => (mat2d_identity),
  invert: () => (mat2d_invert),
  mul: () => (mat2d_mul),
  multiply: () => (mat2d_multiply),
  multiplyScalar: () => (mat2d_multiplyScalar),
  multiplyScalarAndAdd: () => (mat2d_multiplyScalarAndAdd),
  rotate: () => (mat2d_rotate),
  scale: () => (mat2d_scale),
  set: () => (mat2d_set),
  str: () => (mat2d_str),
  sub: () => (mat2d_sub),
  subtract: () => (mat2d_subtract),
  translate: () => (translate)
});

// NAMESPACE OBJECT: ./node_modules/gl-matrix/esm/mat3.js
var mat3_namespaceObject = {};
__webpack_require__.r(mat3_namespaceObject);
__webpack_require__.d(mat3_namespaceObject, {
  add: () => (mat3_add),
  adjoint: () => (mat3_adjoint),
  clone: () => (mat3_clone),
  copy: () => (mat3_copy),
  create: () => (mat3_create),
  determinant: () => (mat3_determinant),
  equals: () => (mat3_equals),
  exactEquals: () => (mat3_exactEquals),
  frob: () => (mat3_frob),
  fromMat2d: () => (fromMat2d),
  fromMat4: () => (fromMat4),
  fromQuat: () => (fromQuat),
  fromRotation: () => (mat3_fromRotation),
  fromScaling: () => (mat3_fromScaling),
  fromTranslation: () => (mat3_fromTranslation),
  fromValues: () => (mat3_fromValues),
  identity: () => (mat3_identity),
  invert: () => (mat3_invert),
  mul: () => (mat3_mul),
  multiply: () => (mat3_multiply),
  multiplyScalar: () => (mat3_multiplyScalar),
  multiplyScalarAndAdd: () => (mat3_multiplyScalarAndAdd),
  normalFromMat4: () => (normalFromMat4),
  projection: () => (projection),
  rotate: () => (mat3_rotate),
  scale: () => (mat3_scale),
  set: () => (mat3_set),
  str: () => (mat3_str),
  sub: () => (mat3_sub),
  subtract: () => (mat3_subtract),
  translate: () => (mat3_translate),
  transpose: () => (mat3_transpose)
});

// NAMESPACE OBJECT: ./node_modules/gl-matrix/esm/mat4.js
var mat4_namespaceObject = {};
__webpack_require__.r(mat4_namespaceObject);
__webpack_require__.d(mat4_namespaceObject, {
  add: () => (mat4_add),
  adjoint: () => (mat4_adjoint),
  clone: () => (mat4_clone),
  copy: () => (mat4_copy),
  create: () => (mat4_create),
  decompose: () => (decompose),
  determinant: () => (mat4_determinant),
  equals: () => (mat4_equals),
  exactEquals: () => (mat4_exactEquals),
  frob: () => (mat4_frob),
  fromQuat: () => (mat4_fromQuat),
  fromQuat2: () => (fromQuat2),
  fromRotation: () => (mat4_fromRotation),
  fromRotationTranslation: () => (fromRotationTranslation),
  fromRotationTranslationScale: () => (fromRotationTranslationScale),
  fromRotationTranslationScaleOrigin: () => (fromRotationTranslationScaleOrigin),
  fromScaling: () => (mat4_fromScaling),
  fromTranslation: () => (mat4_fromTranslation),
  fromValues: () => (mat4_fromValues),
  fromXRotation: () => (fromXRotation),
  fromYRotation: () => (fromYRotation),
  fromZRotation: () => (fromZRotation),
  frustum: () => (frustum),
  getRotation: () => (getRotation),
  getScaling: () => (getScaling),
  getTranslation: () => (getTranslation),
  identity: () => (mat4_identity),
  invert: () => (mat4_invert),
  lookAt: () => (lookAt),
  mul: () => (mat4_mul),
  multiply: () => (mat4_multiply),
  multiplyScalar: () => (mat4_multiplyScalar),
  multiplyScalarAndAdd: () => (mat4_multiplyScalarAndAdd),
  ortho: () => (ortho),
  orthoNO: () => (orthoNO),
  orthoZO: () => (orthoZO),
  perspective: () => (perspective),
  perspectiveFromFieldOfView: () => (perspectiveFromFieldOfView),
  perspectiveNO: () => (perspectiveNO),
  perspectiveZO: () => (perspectiveZO),
  rotate: () => (mat4_rotate),
  rotateX: () => (rotateX),
  rotateY: () => (rotateY),
  rotateZ: () => (rotateZ),
  scale: () => (mat4_scale),
  set: () => (mat4_set),
  str: () => (mat4_str),
  sub: () => (mat4_sub),
  subtract: () => (mat4_subtract),
  targetTo: () => (targetTo),
  translate: () => (mat4_translate),
  transpose: () => (mat4_transpose)
});

// NAMESPACE OBJECT: ./node_modules/gl-matrix/esm/vec3.js
var vec3_namespaceObject = {};
__webpack_require__.r(vec3_namespaceObject);
__webpack_require__.d(vec3_namespaceObject, {
  add: () => (vec3_add),
  angle: () => (angle),
  bezier: () => (bezier),
  ceil: () => (ceil),
  clone: () => (vec3_clone),
  copy: () => (vec3_copy),
  create: () => (vec3_create),
  cross: () => (cross),
  dist: () => (dist),
  distance: () => (distance),
  div: () => (div),
  divide: () => (divide),
  dot: () => (vec3_dot),
  equals: () => (vec3_equals),
  exactEquals: () => (vec3_exactEquals),
  floor: () => (floor),
  forEach: () => (forEach),
  fromValues: () => (vec3_fromValues),
  hermite: () => (hermite),
  inverse: () => (inverse),
  len: () => (len),
  length: () => (vec3_length),
  lerp: () => (lerp),
  max: () => (max),
  min: () => (min),
  mul: () => (vec3_mul),
  multiply: () => (vec3_multiply),
  negate: () => (negate),
  normalize: () => (normalize),
  random: () => (random),
  rotateX: () => (vec3_rotateX),
  rotateY: () => (vec3_rotateY),
  rotateZ: () => (vec3_rotateZ),
  round: () => (vec3_round),
  scale: () => (vec3_scale),
  scaleAndAdd: () => (scaleAndAdd),
  set: () => (vec3_set),
  slerp: () => (slerp),
  sqrDist: () => (sqrDist),
  sqrLen: () => (sqrLen),
  squaredDistance: () => (squaredDistance),
  squaredLength: () => (squaredLength),
  str: () => (vec3_str),
  sub: () => (vec3_sub),
  subtract: () => (vec3_subtract),
  transformMat3: () => (transformMat3),
  transformMat4: () => (transformMat4),
  transformQuat: () => (transformQuat),
  zero: () => (zero)
});

// NAMESPACE OBJECT: ./node_modules/gl-matrix/esm/vec4.js
var vec4_namespaceObject = {};
__webpack_require__.r(vec4_namespaceObject);
__webpack_require__.d(vec4_namespaceObject, {
  add: () => (vec4_add),
  ceil: () => (vec4_ceil),
  clone: () => (vec4_clone),
  copy: () => (vec4_copy),
  create: () => (vec4_create),
  cross: () => (vec4_cross),
  dist: () => (vec4_dist),
  distance: () => (vec4_distance),
  div: () => (vec4_div),
  divide: () => (vec4_divide),
  dot: () => (dot),
  equals: () => (vec4_equals),
  exactEquals: () => (vec4_exactEquals),
  floor: () => (vec4_floor),
  forEach: () => (vec4_forEach),
  fromValues: () => (vec4_fromValues),
  inverse: () => (vec4_inverse),
  len: () => (vec4_len),
  length: () => (vec4_length),
  lerp: () => (vec4_lerp),
  max: () => (vec4_max),
  min: () => (vec4_min),
  mul: () => (vec4_mul),
  multiply: () => (vec4_multiply),
  negate: () => (vec4_negate),
  normalize: () => (vec4_normalize),
  random: () => (vec4_random),
  round: () => (vec4_round),
  scale: () => (vec4_scale),
  scaleAndAdd: () => (vec4_scaleAndAdd),
  set: () => (vec4_set),
  sqrDist: () => (vec4_sqrDist),
  sqrLen: () => (vec4_sqrLen),
  squaredDistance: () => (vec4_squaredDistance),
  squaredLength: () => (vec4_squaredLength),
  str: () => (vec4_str),
  sub: () => (vec4_sub),
  subtract: () => (vec4_subtract),
  transformMat4: () => (vec4_transformMat4),
  transformQuat: () => (vec4_transformQuat),
  zero: () => (vec4_zero)
});

// NAMESPACE OBJECT: ./node_modules/gl-matrix/esm/quat.js
var quat_namespaceObject = {};
__webpack_require__.r(quat_namespaceObject);
__webpack_require__.d(quat_namespaceObject, {
  add: () => (quat_add),
  calculateW: () => (calculateW),
  clone: () => (quat_clone),
  conjugate: () => (conjugate),
  copy: () => (quat_copy),
  create: () => (quat_create),
  dot: () => (quat_dot),
  equals: () => (quat_equals),
  exactEquals: () => (quat_exactEquals),
  exp: () => (exp),
  fromEuler: () => (fromEuler),
  fromMat3: () => (fromMat3),
  fromValues: () => (quat_fromValues),
  getAngle: () => (getAngle),
  getAxisAngle: () => (getAxisAngle),
  identity: () => (quat_identity),
  invert: () => (quat_invert),
  len: () => (quat_len),
  length: () => (quat_length),
  lerp: () => (quat_lerp),
  ln: () => (ln),
  mul: () => (quat_mul),
  multiply: () => (quat_multiply),
  normalize: () => (quat_normalize),
  pow: () => (pow),
  random: () => (quat_random),
  rotateX: () => (quat_rotateX),
  rotateY: () => (quat_rotateY),
  rotateZ: () => (quat_rotateZ),
  rotationTo: () => (rotationTo),
  scale: () => (quat_scale),
  set: () => (quat_set),
  setAxes: () => (setAxes),
  setAxisAngle: () => (setAxisAngle),
  slerp: () => (quat_slerp),
  sqlerp: () => (sqlerp),
  sqrLen: () => (quat_sqrLen),
  squaredLength: () => (quat_squaredLength),
  str: () => (quat_str)
});

// NAMESPACE OBJECT: ./node_modules/gl-matrix/esm/quat2.js
var quat2_namespaceObject = {};
__webpack_require__.r(quat2_namespaceObject);
__webpack_require__.d(quat2_namespaceObject, {
  add: () => (quat2_add),
  clone: () => (quat2_clone),
  conjugate: () => (quat2_conjugate),
  copy: () => (quat2_copy),
  create: () => (quat2_create),
  dot: () => (quat2_dot),
  equals: () => (quat2_equals),
  exactEquals: () => (quat2_exactEquals),
  fromMat4: () => (quat2_fromMat4),
  fromRotation: () => (quat2_fromRotation),
  fromRotationTranslation: () => (quat2_fromRotationTranslation),
  fromRotationTranslationValues: () => (fromRotationTranslationValues),
  fromTranslation: () => (quat2_fromTranslation),
  fromValues: () => (quat2_fromValues),
  getDual: () => (getDual),
  getReal: () => (getReal),
  getTranslation: () => (quat2_getTranslation),
  identity: () => (quat2_identity),
  invert: () => (quat2_invert),
  len: () => (quat2_len),
  length: () => (quat2_length),
  lerp: () => (quat2_lerp),
  mul: () => (quat2_mul),
  multiply: () => (quat2_multiply),
  normalize: () => (quat2_normalize),
  rotateAroundAxis: () => (rotateAroundAxis),
  rotateByQuatAppend: () => (rotateByQuatAppend),
  rotateByQuatPrepend: () => (rotateByQuatPrepend),
  rotateX: () => (quat2_rotateX),
  rotateY: () => (quat2_rotateY),
  rotateZ: () => (quat2_rotateZ),
  scale: () => (quat2_scale),
  set: () => (quat2_set),
  setDual: () => (setDual),
  setReal: () => (setReal),
  sqrLen: () => (quat2_sqrLen),
  squaredLength: () => (quat2_squaredLength),
  str: () => (quat2_str),
  translate: () => (quat2_translate)
});

// NAMESPACE OBJECT: ./node_modules/gl-matrix/esm/vec2.js
var vec2_namespaceObject = {};
__webpack_require__.r(vec2_namespaceObject);
__webpack_require__.d(vec2_namespaceObject, {
  add: () => (vec2_add),
  angle: () => (vec2_angle),
  ceil: () => (vec2_ceil),
  clone: () => (vec2_clone),
  copy: () => (vec2_copy),
  create: () => (vec2_create),
  cross: () => (vec2_cross),
  dist: () => (vec2_dist),
  distance: () => (vec2_distance),
  div: () => (vec2_div),
  divide: () => (vec2_divide),
  dot: () => (vec2_dot),
  equals: () => (vec2_equals),
  exactEquals: () => (vec2_exactEquals),
  floor: () => (vec2_floor),
  forEach: () => (vec2_forEach),
  fromValues: () => (vec2_fromValues),
  inverse: () => (vec2_inverse),
  len: () => (vec2_len),
  length: () => (vec2_length),
  lerp: () => (vec2_lerp),
  max: () => (vec2_max),
  min: () => (vec2_min),
  mul: () => (vec2_mul),
  multiply: () => (vec2_multiply),
  negate: () => (vec2_negate),
  normalize: () => (vec2_normalize),
  random: () => (vec2_random),
  rotate: () => (vec2_rotate),
  round: () => (vec2_round),
  scale: () => (vec2_scale),
  scaleAndAdd: () => (vec2_scaleAndAdd),
  set: () => (vec2_set),
  signedAngle: () => (signedAngle),
  sqrDist: () => (vec2_sqrDist),
  sqrLen: () => (vec2_sqrLen),
  squaredDistance: () => (vec2_squaredDistance),
  squaredLength: () => (vec2_squaredLength),
  str: () => (vec2_str),
  sub: () => (vec2_sub),
  subtract: () => (vec2_subtract),
  transformMat2: () => (transformMat2),
  transformMat2d: () => (transformMat2d),
  transformMat3: () => (vec2_transformMat3),
  transformMat4: () => (vec2_transformMat4),
  zero: () => (vec2_zero)
});

;// ./node_modules/gl-matrix/esm/common.js
/**
 * Common utilities
 * @module glMatrix
 */

// Configuration Constants
var EPSILON = 0.000001;
var ARRAY_TYPE = typeof Float32Array !== "undefined" ? Float32Array : Array;
var RANDOM = Math.random;
var ANGLE_ORDER = "zyx";

/**
 * Symmetric round
 * see https://www.npmjs.com/package/round-half-up-symmetric#user-content-detailed-background
 *
 * @param {Number} a value to round
 */
function round(a) {
  if (a >= 0) return Math.round(a);
  return a % 0.5 === 0 ? Math.floor(a) : Math.round(a);
}

/**
 * Sets the type of array used when creating new vectors and matrices
 *
 * @param {Float32ArrayConstructor | ArrayConstructor} type Array type, such as Float32Array or Array
 */
function setMatrixArrayType(type) {
  ARRAY_TYPE = type;
}
var degree = Math.PI / 180;
var radian = 180 / Math.PI;

/**
 * Convert Degree To Radian
 *
 * @param {Number} a Angle in Degrees
 */
function toRadian(a) {
  return a * degree;
}

/**
 * Convert Radian To Degree
 *
 * @param {Number} a Angle in Radians
 */
function toDegree(a) {
  return a * radian;
}

/**
 * Tests whether or not the arguments have approximately the same value, within an absolute
 * or relative tolerance of glMatrix.EPSILON (an absolute tolerance is used for values less
 * than or equal to 1.0, and a relative tolerance is used for larger values)
 *
 * @param {Number} a          The first number to test.
 * @param {Number} b          The second number to test.
 * @param {Number} tolerance  Absolute or relative tolerance (default glMatrix.EPSILON)
 * @returns {Boolean} True if the numbers are approximately equal, false otherwise.
 */
function equals(a, b) {
  var tolerance = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : EPSILON;
  return Math.abs(a - b) <= tolerance * Math.max(1, Math.abs(a), Math.abs(b));
}
;// ./node_modules/gl-matrix/esm/mat2.js


/**
 * 2x2 Matrix
 * @module mat2
 */

/**
 * Creates a new identity mat2
 *
 * @returns {mat2} a new 2x2 matrix
 */
function create() {
  var out = new ARRAY_TYPE(4);
  if (ARRAY_TYPE != Float32Array) {
    out[1] = 0;
    out[2] = 0;
  }
  out[0] = 1;
  out[3] = 1;
  return out;
}

/**
 * Creates a new mat2 initialized with values from an existing matrix
 *
 * @param {ReadonlyMat2} a matrix to clone
 * @returns {mat2} a new 2x2 matrix
 */
function clone(a) {
  var out = new ARRAY_TYPE(4);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  return out;
}

/**
 * Copy the values from one mat2 to another
 *
 * @param {mat2} out the receiving matrix
 * @param {ReadonlyMat2} a the source matrix
 * @returns {mat2} out
 */
function copy(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  return out;
}

/**
 * Set a mat2 to the identity matrix
 *
 * @param {mat2} out the receiving matrix
 * @returns {mat2} out
 */
function identity(out) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 1;
  return out;
}

/**
 * Create a new mat2 with the given values
 *
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m10 Component in column 1, row 0 position (index 2)
 * @param {Number} m11 Component in column 1, row 1 position (index 3)
 * @returns {mat2} out A new 2x2 matrix
 */
function fromValues(m00, m01, m10, m11) {
  var out = new ARRAY_TYPE(4);
  out[0] = m00;
  out[1] = m01;
  out[2] = m10;
  out[3] = m11;
  return out;
}

/**
 * Set the components of a mat2 to the given values
 *
 * @param {mat2} out the receiving matrix
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m10 Component in column 1, row 0 position (index 2)
 * @param {Number} m11 Component in column 1, row 1 position (index 3)
 * @returns {mat2} out
 */
function set(out, m00, m01, m10, m11) {
  out[0] = m00;
  out[1] = m01;
  out[2] = m10;
  out[3] = m11;
  return out;
}

/**
 * Transpose the values of a mat2
 *
 * @param {mat2} out the receiving matrix
 * @param {ReadonlyMat2} a the source matrix
 * @returns {mat2} out
 */
function transpose(out, a) {
  // If we are transposing ourselves we can skip a few steps but have to cache
  // some values
  if (out === a) {
    var a1 = a[1];
    out[1] = a[2];
    out[2] = a1;
  } else {
    out[0] = a[0];
    out[1] = a[2];
    out[2] = a[1];
    out[3] = a[3];
  }
  return out;
}

/**
 * Inverts a mat2
 *
 * @param {mat2} out the receiving matrix
 * @param {ReadonlyMat2} a the source matrix
 * @returns {mat2 | null} out, or null if source matrix is not invertible
 */
function invert(out, a) {
  var a0 = a[0],
    a1 = a[1],
    a2 = a[2],
    a3 = a[3];

  // Calculate the determinant
  var det = a0 * a3 - a2 * a1;
  if (!det) {
    return null;
  }
  det = 1.0 / det;
  out[0] = a3 * det;
  out[1] = -a1 * det;
  out[2] = -a2 * det;
  out[3] = a0 * det;
  return out;
}

/**
 * Calculates the adjugate of a mat2
 *
 * @param {mat2} out the receiving matrix
 * @param {ReadonlyMat2} a the source matrix
 * @returns {mat2} out
 */
function adjoint(out, a) {
  // Caching this value is necessary if out == a
  var a0 = a[0];
  out[0] = a[3];
  out[1] = -a[1];
  out[2] = -a[2];
  out[3] = a0;
  return out;
}

/**
 * Calculates the determinant of a mat2
 *
 * @param {ReadonlyMat2} a the source matrix
 * @returns {Number} determinant of a
 */
function determinant(a) {
  return a[0] * a[3] - a[2] * a[1];
}

/**
 * Multiplies two mat2's
 *
 * @param {mat2} out the receiving matrix
 * @param {ReadonlyMat2} a the first operand
 * @param {ReadonlyMat2} b the second operand
 * @returns {mat2} out
 */
function multiply(out, a, b) {
  var a0 = a[0],
    a1 = a[1],
    a2 = a[2],
    a3 = a[3];
  var b0 = b[0],
    b1 = b[1],
    b2 = b[2],
    b3 = b[3];
  out[0] = a0 * b0 + a2 * b1;
  out[1] = a1 * b0 + a3 * b1;
  out[2] = a0 * b2 + a2 * b3;
  out[3] = a1 * b2 + a3 * b3;
  return out;
}

/**
 * Rotates a mat2 by the given angle
 *
 * @param {mat2} out the receiving matrix
 * @param {ReadonlyMat2} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat2} out
 */
function rotate(out, a, rad) {
  var a0 = a[0],
    a1 = a[1],
    a2 = a[2],
    a3 = a[3];
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  out[0] = a0 * c + a2 * s;
  out[1] = a1 * c + a3 * s;
  out[2] = a0 * -s + a2 * c;
  out[3] = a1 * -s + a3 * c;
  return out;
}

/**
 * Scales the mat2 by the dimensions in the given vec2
 *
 * @param {mat2} out the receiving matrix
 * @param {ReadonlyMat2} a the matrix to rotate
 * @param {ReadonlyVec2} v the vec2 to scale the matrix by
 * @returns {mat2} out
 **/
function scale(out, a, v) {
  var a0 = a[0],
    a1 = a[1],
    a2 = a[2],
    a3 = a[3];
  var v0 = v[0],
    v1 = v[1];
  out[0] = a0 * v0;
  out[1] = a1 * v0;
  out[2] = a2 * v1;
  out[3] = a3 * v1;
  return out;
}

/**
 * Creates a matrix from a given angle
 * This is equivalent to (but much faster than):
 *
 *     mat2.identity(dest);
 *     mat2.rotate(dest, dest, rad);
 *
 * @param {mat2} out mat2 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat2} out
 */
function fromRotation(out, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  out[0] = c;
  out[1] = s;
  out[2] = -s;
  out[3] = c;
  return out;
}

/**
 * Creates a matrix from a vector scaling
 * This is equivalent to (but much faster than):
 *
 *     mat2.identity(dest);
 *     mat2.scale(dest, dest, vec);
 *
 * @param {mat2} out mat2 receiving operation result
 * @param {ReadonlyVec2} v Scaling vector
 * @returns {mat2} out
 */
function fromScaling(out, v) {
  out[0] = v[0];
  out[1] = 0;
  out[2] = 0;
  out[3] = v[1];
  return out;
}

/**
 * Returns a string representation of a mat2
 *
 * @param {ReadonlyMat2} a matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
function str(a) {
  return "mat2(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ")";
}

/**
 * Returns Frobenius norm of a mat2
 *
 * @param {ReadonlyMat2} a the matrix to calculate Frobenius norm of
 * @returns {Number} Frobenius norm
 */
function frob(a) {
  return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2] + a[3] * a[3]);
}

/**
 * Returns L, D and U matrices (Lower triangular, Diagonal and Upper triangular) by factorizing the input matrix
 * @param {ReadonlyMat2} L the lower triangular matrix
 * @param {ReadonlyMat2} D the diagonal matrix
 * @param {ReadonlyMat2} U the upper triangular matrix
 * @param {ReadonlyMat2} a the input matrix to factorize
 */

function LDU(L, D, U, a) {
  L[2] = a[2] / a[0];
  U[0] = a[0];
  U[1] = a[1];
  U[3] = a[3] - L[2] * U[1];
  return [L, D, U];
}

/**
 * Adds two mat2's
 *
 * @param {mat2} out the receiving matrix
 * @param {ReadonlyMat2} a the first operand
 * @param {ReadonlyMat2} b the second operand
 * @returns {mat2} out
 */
function add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  out[3] = a[3] + b[3];
  return out;
}

/**
 * Subtracts matrix b from matrix a
 *
 * @param {mat2} out the receiving matrix
 * @param {ReadonlyMat2} a the first operand
 * @param {ReadonlyMat2} b the second operand
 * @returns {mat2} out
 */
function subtract(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  out[3] = a[3] - b[3];
  return out;
}

/**
 * Returns whether or not the matrices have exactly the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyMat2} a The first matrix.
 * @param {ReadonlyMat2} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
function exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}

/**
 * Returns whether or not the matrices have approximately the same elements in the same position.
 *
 * @param {ReadonlyMat2} a The first matrix.
 * @param {ReadonlyMat2} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
function mat2_equals(a, b) {
  var a0 = a[0],
    a1 = a[1],
    a2 = a[2],
    a3 = a[3];
  var b0 = b[0],
    b1 = b[1],
    b2 = b[2],
    b3 = b[3];
  return Math.abs(a0 - b0) <= EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3));
}

/**
 * Multiply each element of the matrix by a scalar.
 *
 * @param {mat2} out the receiving matrix
 * @param {ReadonlyMat2} a the matrix to scale
 * @param {Number} b amount to scale the matrix's elements by
 * @returns {mat2} out
 */
function multiplyScalar(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  out[3] = a[3] * b;
  return out;
}

/**
 * Adds two mat2's after multiplying each element of the second operand by a scalar value.
 *
 * @param {mat2} out the receiving vector
 * @param {ReadonlyMat2} a the first operand
 * @param {ReadonlyMat2} b the second operand
 * @param {Number} scale the amount to scale b's elements by before adding
 * @returns {mat2} out
 */
function multiplyScalarAndAdd(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  out[2] = a[2] + b[2] * scale;
  out[3] = a[3] + b[3] * scale;
  return out;
}

/**
 * Alias for {@link mat2.multiply}
 * @function
 */
var mul = multiply;

/**
 * Alias for {@link mat2.subtract}
 * @function
 */
var sub = subtract;
;// ./node_modules/gl-matrix/esm/mat2d.js


/**
 * 2x3 Matrix
 * @module mat2d
 * @description
 * A mat2d contains six elements defined as:
 * <pre>
 * [a, b,
 *  c, d,
 *  tx, ty]
 * </pre>
 * This is a short form for the 3x3 matrix:
 * <pre>
 * [a, b, 0,
 *  c, d, 0,
 *  tx, ty, 1]
 * </pre>
 * The last column is ignored so the array is shorter and operations are faster.
 */

/**
 * Creates a new identity mat2d
 *
 * @returns {mat2d} a new 2x3 matrix
 */
function mat2d_create() {
  var out = new ARRAY_TYPE(6);
  if (ARRAY_TYPE != Float32Array) {
    out[1] = 0;
    out[2] = 0;
    out[4] = 0;
    out[5] = 0;
  }
  out[0] = 1;
  out[3] = 1;
  return out;
}

/**
 * Creates a new mat2d initialized with values from an existing matrix
 *
 * @param {ReadonlyMat2d} a matrix to clone
 * @returns {mat2d} a new 2x3 matrix
 */
function mat2d_clone(a) {
  var out = new ARRAY_TYPE(6);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  return out;
}

/**
 * Copy the values from one mat2d to another
 *
 * @param {mat2d} out the receiving matrix
 * @param {ReadonlyMat2d} a the source matrix
 * @returns {mat2d} out
 */
function mat2d_copy(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  return out;
}

/**
 * Set a mat2d to the identity matrix
 *
 * @param {mat2d} out the receiving matrix
 * @returns {mat2d} out
 */
function mat2d_identity(out) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 1;
  out[4] = 0;
  out[5] = 0;
  return out;
}

/**
 * Create a new mat2d with the given values
 *
 * @param {Number} a Component A (index 0)
 * @param {Number} b Component B (index 1)
 * @param {Number} c Component C (index 2)
 * @param {Number} d Component D (index 3)
 * @param {Number} tx Component TX (index 4)
 * @param {Number} ty Component TY (index 5)
 * @returns {mat2d} A new mat2d
 */
function mat2d_fromValues(a, b, c, d, tx, ty) {
  var out = new ARRAY_TYPE(6);
  out[0] = a;
  out[1] = b;
  out[2] = c;
  out[3] = d;
  out[4] = tx;
  out[5] = ty;
  return out;
}

/**
 * Set the components of a mat2d to the given values
 *
 * @param {mat2d} out the receiving matrix
 * @param {Number} a Component A (index 0)
 * @param {Number} b Component B (index 1)
 * @param {Number} c Component C (index 2)
 * @param {Number} d Component D (index 3)
 * @param {Number} tx Component TX (index 4)
 * @param {Number} ty Component TY (index 5)
 * @returns {mat2d} out
 */
function mat2d_set(out, a, b, c, d, tx, ty) {
  out[0] = a;
  out[1] = b;
  out[2] = c;
  out[3] = d;
  out[4] = tx;
  out[5] = ty;
  return out;
}

/**
 * Inverts a mat2d
 *
 * @param {mat2d} out the receiving matrix
 * @param {ReadonlyMat2d} a the source matrix
 * @returns {mat2d | null} out, or null if source matrix is not invertible
 */
function mat2d_invert(out, a) {
  var aa = a[0],
    ab = a[1],
    ac = a[2],
    ad = a[3];
  var atx = a[4],
    aty = a[5];
  var det = aa * ad - ab * ac;
  if (!det) {
    return null;
  }
  det = 1.0 / det;
  out[0] = ad * det;
  out[1] = -ab * det;
  out[2] = -ac * det;
  out[3] = aa * det;
  out[4] = (ac * aty - ad * atx) * det;
  out[5] = (ab * atx - aa * aty) * det;
  return out;
}

/**
 * Calculates the determinant of a mat2d
 *
 * @param {ReadonlyMat2d} a the source matrix
 * @returns {Number} determinant of a
 */
function mat2d_determinant(a) {
  return a[0] * a[3] - a[1] * a[2];
}

/**
 * Multiplies two mat2d's
 *
 * @param {mat2d} out the receiving matrix
 * @param {ReadonlyMat2d} a the first operand
 * @param {ReadonlyMat2d} b the second operand
 * @returns {mat2d} out
 */
function mat2d_multiply(out, a, b) {
  var a0 = a[0],
    a1 = a[1],
    a2 = a[2],
    a3 = a[3],
    a4 = a[4],
    a5 = a[5];
  var b0 = b[0],
    b1 = b[1],
    b2 = b[2],
    b3 = b[3],
    b4 = b[4],
    b5 = b[5];
  out[0] = a0 * b0 + a2 * b1;
  out[1] = a1 * b0 + a3 * b1;
  out[2] = a0 * b2 + a2 * b3;
  out[3] = a1 * b2 + a3 * b3;
  out[4] = a0 * b4 + a2 * b5 + a4;
  out[5] = a1 * b4 + a3 * b5 + a5;
  return out;
}

/**
 * Rotates a mat2d by the given angle
 *
 * @param {mat2d} out the receiving matrix
 * @param {ReadonlyMat2d} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat2d} out
 */
function mat2d_rotate(out, a, rad) {
  var a0 = a[0],
    a1 = a[1],
    a2 = a[2],
    a3 = a[3],
    a4 = a[4],
    a5 = a[5];
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  out[0] = a0 * c + a2 * s;
  out[1] = a1 * c + a3 * s;
  out[2] = a0 * -s + a2 * c;
  out[3] = a1 * -s + a3 * c;
  out[4] = a4;
  out[5] = a5;
  return out;
}

/**
 * Scales the mat2d by the dimensions in the given vec2
 *
 * @param {mat2d} out the receiving matrix
 * @param {ReadonlyMat2d} a the matrix to translate
 * @param {ReadonlyVec2} v the vec2 to scale the matrix by
 * @returns {mat2d} out
 **/
function mat2d_scale(out, a, v) {
  var a0 = a[0],
    a1 = a[1],
    a2 = a[2],
    a3 = a[3],
    a4 = a[4],
    a5 = a[5];
  var v0 = v[0],
    v1 = v[1];
  out[0] = a0 * v0;
  out[1] = a1 * v0;
  out[2] = a2 * v1;
  out[3] = a3 * v1;
  out[4] = a4;
  out[5] = a5;
  return out;
}

/**
 * Translates the mat2d by the dimensions in the given vec2
 *
 * @param {mat2d} out the receiving matrix
 * @param {ReadonlyMat2d} a the matrix to translate
 * @param {ReadonlyVec2} v the vec2 to translate the matrix by
 * @returns {mat2d} out
 **/
function translate(out, a, v) {
  var a0 = a[0],
    a1 = a[1],
    a2 = a[2],
    a3 = a[3],
    a4 = a[4],
    a5 = a[5];
  var v0 = v[0],
    v1 = v[1];
  out[0] = a0;
  out[1] = a1;
  out[2] = a2;
  out[3] = a3;
  out[4] = a0 * v0 + a2 * v1 + a4;
  out[5] = a1 * v0 + a3 * v1 + a5;
  return out;
}

/**
 * Creates a matrix from a given angle
 * This is equivalent to (but much faster than):
 *
 *     mat2d.identity(dest);
 *     mat2d.rotate(dest, dest, rad);
 *
 * @param {mat2d} out mat2d receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat2d} out
 */
function mat2d_fromRotation(out, rad) {
  var s = Math.sin(rad),
    c = Math.cos(rad);
  out[0] = c;
  out[1] = s;
  out[2] = -s;
  out[3] = c;
  out[4] = 0;
  out[5] = 0;
  return out;
}

/**
 * Creates a matrix from a vector scaling
 * This is equivalent to (but much faster than):
 *
 *     mat2d.identity(dest);
 *     mat2d.scale(dest, dest, vec);
 *
 * @param {mat2d} out mat2d receiving operation result
 * @param {ReadonlyVec2} v Scaling vector
 * @returns {mat2d} out
 */
function mat2d_fromScaling(out, v) {
  out[0] = v[0];
  out[1] = 0;
  out[2] = 0;
  out[3] = v[1];
  out[4] = 0;
  out[5] = 0;
  return out;
}

/**
 * Creates a matrix from a vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat2d.identity(dest);
 *     mat2d.translate(dest, dest, vec);
 *
 * @param {mat2d} out mat2d receiving operation result
 * @param {ReadonlyVec2} v Translation vector
 * @returns {mat2d} out
 */
function fromTranslation(out, v) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 1;
  out[4] = v[0];
  out[5] = v[1];
  return out;
}

/**
 * Returns a string representation of a mat2d
 *
 * @param {ReadonlyMat2d} a matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
function mat2d_str(a) {
  return "mat2d(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ", " + a[4] + ", " + a[5] + ")";
}

/**
 * Returns Frobenius norm of a mat2d
 *
 * @param {ReadonlyMat2d} a the matrix to calculate Frobenius norm of
 * @returns {Number} Frobenius norm
 */
function mat2d_frob(a) {
  return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2] + a[3] * a[3] + a[4] * a[4] + a[5] * a[5] + 1);
}

/**
 * Adds two mat2d's
 *
 * @param {mat2d} out the receiving matrix
 * @param {ReadonlyMat2d} a the first operand
 * @param {ReadonlyMat2d} b the second operand
 * @returns {mat2d} out
 */
function mat2d_add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  out[3] = a[3] + b[3];
  out[4] = a[4] + b[4];
  out[5] = a[5] + b[5];
  return out;
}

/**
 * Subtracts matrix b from matrix a
 *
 * @param {mat2d} out the receiving matrix
 * @param {ReadonlyMat2d} a the first operand
 * @param {ReadonlyMat2d} b the second operand
 * @returns {mat2d} out
 */
function mat2d_subtract(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  out[3] = a[3] - b[3];
  out[4] = a[4] - b[4];
  out[5] = a[5] - b[5];
  return out;
}

/**
 * Multiply each element of the matrix by a scalar.
 *
 * @param {mat2d} out the receiving matrix
 * @param {ReadonlyMat2d} a the matrix to scale
 * @param {Number} b amount to scale the matrix's elements by
 * @returns {mat2d} out
 */
function mat2d_multiplyScalar(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  out[3] = a[3] * b;
  out[4] = a[4] * b;
  out[5] = a[5] * b;
  return out;
}

/**
 * Adds two mat2d's after multiplying each element of the second operand by a scalar value.
 *
 * @param {mat2d} out the receiving vector
 * @param {ReadonlyMat2d} a the first operand
 * @param {ReadonlyMat2d} b the second operand
 * @param {Number} scale the amount to scale b's elements by before adding
 * @returns {mat2d} out
 */
function mat2d_multiplyScalarAndAdd(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  out[2] = a[2] + b[2] * scale;
  out[3] = a[3] + b[3] * scale;
  out[4] = a[4] + b[4] * scale;
  out[5] = a[5] + b[5] * scale;
  return out;
}

/**
 * Returns whether or not the matrices have exactly the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyMat2d} a The first matrix.
 * @param {ReadonlyMat2d} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
function mat2d_exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5];
}

/**
 * Returns whether or not the matrices have approximately the same elements in the same position.
 *
 * @param {ReadonlyMat2d} a The first matrix.
 * @param {ReadonlyMat2d} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
function mat2d_equals(a, b) {
  var a0 = a[0],
    a1 = a[1],
    a2 = a[2],
    a3 = a[3],
    a4 = a[4],
    a5 = a[5];
  var b0 = b[0],
    b1 = b[1],
    b2 = b[2],
    b3 = b[3],
    b4 = b[4],
    b5 = b[5];
  return Math.abs(a0 - b0) <= EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= EPSILON * Math.max(1.0, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= EPSILON * Math.max(1.0, Math.abs(a5), Math.abs(b5));
}

/**
 * Alias for {@link mat2d.multiply}
 * @function
 */
var mat2d_mul = mat2d_multiply;

/**
 * Alias for {@link mat2d.subtract}
 * @function
 */
var mat2d_sub = mat2d_subtract;
;// ./node_modules/gl-matrix/esm/mat3.js


/**
 * 3x3 Matrix
 * @module mat3
 */

/**
 * Creates a new identity mat3
 *
 * @returns {mat3} a new 3x3 matrix
 */
function mat3_create() {
  var out = new ARRAY_TYPE(9);
  if (ARRAY_TYPE != Float32Array) {
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
  }
  out[0] = 1;
  out[4] = 1;
  out[8] = 1;
  return out;
}

/**
 * Copies the upper-left 3x3 values into the given mat3.
 *
 * @param {mat3} out the receiving 3x3 matrix
 * @param {ReadonlyMat4} a   the source 4x4 matrix
 * @returns {mat3} out
 */
function fromMat4(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[4];
  out[4] = a[5];
  out[5] = a[6];
  out[6] = a[8];
  out[7] = a[9];
  out[8] = a[10];
  return out;
}

/**
 * Creates a new mat3 initialized with values from an existing matrix
 *
 * @param {ReadonlyMat3} a matrix to clone
 * @returns {mat3} a new 3x3 matrix
 */
function mat3_clone(a) {
  var out = new ARRAY_TYPE(9);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  out[6] = a[6];
  out[7] = a[7];
  out[8] = a[8];
  return out;
}

/**
 * Copy the values from one mat3 to another
 *
 * @param {mat3} out the receiving matrix
 * @param {ReadonlyMat3} a the source matrix
 * @returns {mat3} out
 */
function mat3_copy(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  out[6] = a[6];
  out[7] = a[7];
  out[8] = a[8];
  return out;
}

/**
 * Create a new mat3 with the given values
 *
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m02 Component in column 0, row 2 position (index 2)
 * @param {Number} m10 Component in column 1, row 0 position (index 3)
 * @param {Number} m11 Component in column 1, row 1 position (index 4)
 * @param {Number} m12 Component in column 1, row 2 position (index 5)
 * @param {Number} m20 Component in column 2, row 0 position (index 6)
 * @param {Number} m21 Component in column 2, row 1 position (index 7)
 * @param {Number} m22 Component in column 2, row 2 position (index 8)
 * @returns {mat3} A new mat3
 */
function mat3_fromValues(m00, m01, m02, m10, m11, m12, m20, m21, m22) {
  var out = new ARRAY_TYPE(9);
  out[0] = m00;
  out[1] = m01;
  out[2] = m02;
  out[3] = m10;
  out[4] = m11;
  out[5] = m12;
  out[6] = m20;
  out[7] = m21;
  out[8] = m22;
  return out;
}

/**
 * Set the components of a mat3 to the given values
 *
 * @param {mat3} out the receiving matrix
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m02 Component in column 0, row 2 position (index 2)
 * @param {Number} m10 Component in column 1, row 0 position (index 3)
 * @param {Number} m11 Component in column 1, row 1 position (index 4)
 * @param {Number} m12 Component in column 1, row 2 position (index 5)
 * @param {Number} m20 Component in column 2, row 0 position (index 6)
 * @param {Number} m21 Component in column 2, row 1 position (index 7)
 * @param {Number} m22 Component in column 2, row 2 position (index 8)
 * @returns {mat3} out
 */
function mat3_set(out, m00, m01, m02, m10, m11, m12, m20, m21, m22) {
  out[0] = m00;
  out[1] = m01;
  out[2] = m02;
  out[3] = m10;
  out[4] = m11;
  out[5] = m12;
  out[6] = m20;
  out[7] = m21;
  out[8] = m22;
  return out;
}

/**
 * Set a mat3 to the identity matrix
 *
 * @param {mat3} out the receiving matrix
 * @returns {mat3} out
 */
function mat3_identity(out) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 1;
  out[5] = 0;
  out[6] = 0;
  out[7] = 0;
  out[8] = 1;
  return out;
}

/**
 * Transpose the values of a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {ReadonlyMat3} a the source matrix
 * @returns {mat3} out
 */
function mat3_transpose(out, a) {
  // If we are transposing ourselves we can skip a few steps but have to cache some values
  if (out === a) {
    var a01 = a[1],
      a02 = a[2],
      a12 = a[5];
    out[1] = a[3];
    out[2] = a[6];
    out[3] = a01;
    out[5] = a[7];
    out[6] = a02;
    out[7] = a12;
  } else {
    out[0] = a[0];
    out[1] = a[3];
    out[2] = a[6];
    out[3] = a[1];
    out[4] = a[4];
    out[5] = a[7];
    out[6] = a[2];
    out[7] = a[5];
    out[8] = a[8];
  }
  return out;
}

/**
 * Inverts a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {ReadonlyMat3} a the source matrix
 * @returns {mat3 | null} out, or null if source matrix is not invertible
 */
function mat3_invert(out, a) {
  var a00 = a[0],
    a01 = a[1],
    a02 = a[2];
  var a10 = a[3],
    a11 = a[4],
    a12 = a[5];
  var a20 = a[6],
    a21 = a[7],
    a22 = a[8];
  var b01 = a22 * a11 - a12 * a21;
  var b11 = -a22 * a10 + a12 * a20;
  var b21 = a21 * a10 - a11 * a20;

  // Calculate the determinant
  var det = a00 * b01 + a01 * b11 + a02 * b21;
  if (!det) {
    return null;
  }
  det = 1.0 / det;
  out[0] = b01 * det;
  out[1] = (-a22 * a01 + a02 * a21) * det;
  out[2] = (a12 * a01 - a02 * a11) * det;
  out[3] = b11 * det;
  out[4] = (a22 * a00 - a02 * a20) * det;
  out[5] = (-a12 * a00 + a02 * a10) * det;
  out[6] = b21 * det;
  out[7] = (-a21 * a00 + a01 * a20) * det;
  out[8] = (a11 * a00 - a01 * a10) * det;
  return out;
}

/**
 * Calculates the adjugate of a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {ReadonlyMat3} a the source matrix
 * @returns {mat3} out
 */
function mat3_adjoint(out, a) {
  var a00 = a[0],
    a01 = a[1],
    a02 = a[2];
  var a10 = a[3],
    a11 = a[4],
    a12 = a[5];
  var a20 = a[6],
    a21 = a[7],
    a22 = a[8];
  out[0] = a11 * a22 - a12 * a21;
  out[1] = a02 * a21 - a01 * a22;
  out[2] = a01 * a12 - a02 * a11;
  out[3] = a12 * a20 - a10 * a22;
  out[4] = a00 * a22 - a02 * a20;
  out[5] = a02 * a10 - a00 * a12;
  out[6] = a10 * a21 - a11 * a20;
  out[7] = a01 * a20 - a00 * a21;
  out[8] = a00 * a11 - a01 * a10;
  return out;
}

/**
 * Calculates the determinant of a mat3
 *
 * @param {ReadonlyMat3} a the source matrix
 * @returns {Number} determinant of a
 */
function mat3_determinant(a) {
  var a00 = a[0],
    a01 = a[1],
    a02 = a[2];
  var a10 = a[3],
    a11 = a[4],
    a12 = a[5];
  var a20 = a[6],
    a21 = a[7],
    a22 = a[8];
  return a00 * (a22 * a11 - a12 * a21) + a01 * (-a22 * a10 + a12 * a20) + a02 * (a21 * a10 - a11 * a20);
}

/**
 * Multiplies two mat3's
 *
 * @param {mat3} out the receiving matrix
 * @param {ReadonlyMat3} a the first operand
 * @param {ReadonlyMat3} b the second operand
 * @returns {mat3} out
 */
function mat3_multiply(out, a, b) {
  var a00 = a[0],
    a01 = a[1],
    a02 = a[2];
  var a10 = a[3],
    a11 = a[4],
    a12 = a[5];
  var a20 = a[6],
    a21 = a[7],
    a22 = a[8];
  var b00 = b[0],
    b01 = b[1],
    b02 = b[2];
  var b10 = b[3],
    b11 = b[4],
    b12 = b[5];
  var b20 = b[6],
    b21 = b[7],
    b22 = b[8];
  out[0] = b00 * a00 + b01 * a10 + b02 * a20;
  out[1] = b00 * a01 + b01 * a11 + b02 * a21;
  out[2] = b00 * a02 + b01 * a12 + b02 * a22;
  out[3] = b10 * a00 + b11 * a10 + b12 * a20;
  out[4] = b10 * a01 + b11 * a11 + b12 * a21;
  out[5] = b10 * a02 + b11 * a12 + b12 * a22;
  out[6] = b20 * a00 + b21 * a10 + b22 * a20;
  out[7] = b20 * a01 + b21 * a11 + b22 * a21;
  out[8] = b20 * a02 + b21 * a12 + b22 * a22;
  return out;
}

/**
 * Translate a mat3 by the given vector
 *
 * @param {mat3} out the receiving matrix
 * @param {ReadonlyMat3} a the matrix to translate
 * @param {ReadonlyVec2} v vector to translate by
 * @returns {mat3} out
 */
function mat3_translate(out, a, v) {
  var a00 = a[0],
    a01 = a[1],
    a02 = a[2],
    a10 = a[3],
    a11 = a[4],
    a12 = a[5],
    a20 = a[6],
    a21 = a[7],
    a22 = a[8],
    x = v[0],
    y = v[1];
  out[0] = a00;
  out[1] = a01;
  out[2] = a02;
  out[3] = a10;
  out[4] = a11;
  out[5] = a12;
  out[6] = x * a00 + y * a10 + a20;
  out[7] = x * a01 + y * a11 + a21;
  out[8] = x * a02 + y * a12 + a22;
  return out;
}

/**
 * Rotates a mat3 by the given angle
 *
 * @param {mat3} out the receiving matrix
 * @param {ReadonlyMat3} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat3} out
 */
function mat3_rotate(out, a, rad) {
  var a00 = a[0],
    a01 = a[1],
    a02 = a[2],
    a10 = a[3],
    a11 = a[4],
    a12 = a[5],
    a20 = a[6],
    a21 = a[7],
    a22 = a[8],
    s = Math.sin(rad),
    c = Math.cos(rad);
  out[0] = c * a00 + s * a10;
  out[1] = c * a01 + s * a11;
  out[2] = c * a02 + s * a12;
  out[3] = c * a10 - s * a00;
  out[4] = c * a11 - s * a01;
  out[5] = c * a12 - s * a02;
  out[6] = a20;
  out[7] = a21;
  out[8] = a22;
  return out;
}

/**
 * Scales the mat3 by the dimensions in the given vec2
 *
 * @param {mat3} out the receiving matrix
 * @param {ReadonlyMat3} a the matrix to scale
 * @param {ReadonlyVec2} v the vec2 to scale the matrix by
 * @returns {mat3} out
 **/
function mat3_scale(out, a, v) {
  var x = v[0],
    y = v[1];
  out[0] = x * a[0];
  out[1] = x * a[1];
  out[2] = x * a[2];
  out[3] = y * a[3];
  out[4] = y * a[4];
  out[5] = y * a[5];
  out[6] = a[6];
  out[7] = a[7];
  out[8] = a[8];
  return out;
}

/**
 * Creates a matrix from a vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat3.identity(dest);
 *     mat3.translate(dest, dest, vec);
 *
 * @param {mat3} out mat3 receiving operation result
 * @param {ReadonlyVec2} v Translation vector
 * @returns {mat3} out
 */
function mat3_fromTranslation(out, v) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 1;
  out[5] = 0;
  out[6] = v[0];
  out[7] = v[1];
  out[8] = 1;
  return out;
}

/**
 * Creates a matrix from a given angle
 * This is equivalent to (but much faster than):
 *
 *     mat3.identity(dest);
 *     mat3.rotate(dest, dest, rad);
 *
 * @param {mat3} out mat3 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat3} out
 */
function mat3_fromRotation(out, rad) {
  var s = Math.sin(rad),
    c = Math.cos(rad);
  out[0] = c;
  out[1] = s;
  out[2] = 0;
  out[3] = -s;
  out[4] = c;
  out[5] = 0;
  out[6] = 0;
  out[7] = 0;
  out[8] = 1;
  return out;
}

/**
 * Creates a matrix from a vector scaling
 * This is equivalent to (but much faster than):
 *
 *     mat3.identity(dest);
 *     mat3.scale(dest, dest, vec);
 *
 * @param {mat3} out mat3 receiving operation result
 * @param {ReadonlyVec2} v Scaling vector
 * @returns {mat3} out
 */
function mat3_fromScaling(out, v) {
  out[0] = v[0];
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = v[1];
  out[5] = 0;
  out[6] = 0;
  out[7] = 0;
  out[8] = 1;
  return out;
}

/**
 * Copies the values from a mat2d into a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {ReadonlyMat2d} a the matrix to copy
 * @returns {mat3} out
 **/
function fromMat2d(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = 0;
  out[3] = a[2];
  out[4] = a[3];
  out[5] = 0;
  out[6] = a[4];
  out[7] = a[5];
  out[8] = 1;
  return out;
}

/**
 * Calculates a 3x3 matrix from the given quaternion
 *
 * @param {mat3} out mat3 receiving operation result
 * @param {ReadonlyQuat} q Quaternion to create matrix from
 *
 * @returns {mat3} out
 */
function fromQuat(out, q) {
  var x = q[0],
    y = q[1],
    z = q[2],
    w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;
  var xx = x * x2;
  var yx = y * x2;
  var yy = y * y2;
  var zx = z * x2;
  var zy = z * y2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;
  out[0] = 1 - yy - zz;
  out[3] = yx - wz;
  out[6] = zx + wy;
  out[1] = yx + wz;
  out[4] = 1 - xx - zz;
  out[7] = zy - wx;
  out[2] = zx - wy;
  out[5] = zy + wx;
  out[8] = 1 - xx - yy;
  return out;
}

/**
 * Calculates a 3x3 normal matrix (transpose inverse) from the 4x4 matrix
 *
 * @param {mat3} out mat3 receiving operation result
 * @param {ReadonlyMat4} a Mat4 to derive the normal matrix from
 *
 * @returns {mat3} out
 */
function normalFromMat4(out, a) {
  var a00 = a[0],
    a01 = a[1],
    a02 = a[2],
    a03 = a[3];
  var a10 = a[4],
    a11 = a[5],
    a12 = a[6],
    a13 = a[7];
  var a20 = a[8],
    a21 = a[9],
    a22 = a[10],
    a23 = a[11];
  var a30 = a[12],
    a31 = a[13],
    a32 = a[14],
    a33 = a[15];
  var b00 = a00 * a11 - a01 * a10;
  var b01 = a00 * a12 - a02 * a10;
  var b02 = a00 * a13 - a03 * a10;
  var b03 = a01 * a12 - a02 * a11;
  var b04 = a01 * a13 - a03 * a11;
  var b05 = a02 * a13 - a03 * a12;
  var b06 = a20 * a31 - a21 * a30;
  var b07 = a20 * a32 - a22 * a30;
  var b08 = a20 * a33 - a23 * a30;
  var b09 = a21 * a32 - a22 * a31;
  var b10 = a21 * a33 - a23 * a31;
  var b11 = a22 * a33 - a23 * a32;

  // Calculate the determinant
  var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  if (!det) {
    return null;
  }
  det = 1.0 / det;
  out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
  out[1] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
  out[2] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
  out[3] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
  out[4] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
  out[5] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
  out[6] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
  out[7] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
  out[8] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
  return out;
}

/**
 * Generates a 2D projection matrix with the given bounds
 *
 * @param {mat3} out mat3 frustum matrix will be written into
 * @param {number} width Width of your gl context
 * @param {number} height Height of gl context
 * @returns {mat3} out
 */
function projection(out, width, height) {
  out[0] = 2 / width;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = -2 / height;
  out[5] = 0;
  out[6] = -1;
  out[7] = 1;
  out[8] = 1;
  return out;
}

/**
 * Returns a string representation of a mat3
 *
 * @param {ReadonlyMat3} a matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
function mat3_str(a) {
  return "mat3(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ", " + a[4] + ", " + a[5] + ", " + a[6] + ", " + a[7] + ", " + a[8] + ")";
}

/**
 * Returns Frobenius norm of a mat3
 *
 * @param {ReadonlyMat3} a the matrix to calculate Frobenius norm of
 * @returns {Number} Frobenius norm
 */
function mat3_frob(a) {
  return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2] + a[3] * a[3] + a[4] * a[4] + a[5] * a[5] + a[6] * a[6] + a[7] * a[7] + a[8] * a[8]);
}

/**
 * Adds two mat3's
 *
 * @param {mat3} out the receiving matrix
 * @param {ReadonlyMat3} a the first operand
 * @param {ReadonlyMat3} b the second operand
 * @returns {mat3} out
 */
function mat3_add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  out[3] = a[3] + b[3];
  out[4] = a[4] + b[4];
  out[5] = a[5] + b[5];
  out[6] = a[6] + b[6];
  out[7] = a[7] + b[7];
  out[8] = a[8] + b[8];
  return out;
}

/**
 * Subtracts matrix b from matrix a
 *
 * @param {mat3} out the receiving matrix
 * @param {ReadonlyMat3} a the first operand
 * @param {ReadonlyMat3} b the second operand
 * @returns {mat3} out
 */
function mat3_subtract(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  out[3] = a[3] - b[3];
  out[4] = a[4] - b[4];
  out[5] = a[5] - b[5];
  out[6] = a[6] - b[6];
  out[7] = a[7] - b[7];
  out[8] = a[8] - b[8];
  return out;
}

/**
 * Multiply each element of the matrix by a scalar.
 *
 * @param {mat3} out the receiving matrix
 * @param {ReadonlyMat3} a the matrix to scale
 * @param {Number} b amount to scale the matrix's elements by
 * @returns {mat3} out
 */
function mat3_multiplyScalar(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  out[3] = a[3] * b;
  out[4] = a[4] * b;
  out[5] = a[5] * b;
  out[6] = a[6] * b;
  out[7] = a[7] * b;
  out[8] = a[8] * b;
  return out;
}

/**
 * Adds two mat3's after multiplying each element of the second operand by a scalar value.
 *
 * @param {mat3} out the receiving vector
 * @param {ReadonlyMat3} a the first operand
 * @param {ReadonlyMat3} b the second operand
 * @param {Number} scale the amount to scale b's elements by before adding
 * @returns {mat3} out
 */
function mat3_multiplyScalarAndAdd(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  out[2] = a[2] + b[2] * scale;
  out[3] = a[3] + b[3] * scale;
  out[4] = a[4] + b[4] * scale;
  out[5] = a[5] + b[5] * scale;
  out[6] = a[6] + b[6] * scale;
  out[7] = a[7] + b[7] * scale;
  out[8] = a[8] + b[8] * scale;
  return out;
}

/**
 * Returns whether or not the matrices have exactly the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyMat3} a The first matrix.
 * @param {ReadonlyMat3} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
function mat3_exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7] && a[8] === b[8];
}

/**
 * Returns whether or not the matrices have approximately the same elements in the same position.
 *
 * @param {ReadonlyMat3} a The first matrix.
 * @param {ReadonlyMat3} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
function mat3_equals(a, b) {
  var a0 = a[0],
    a1 = a[1],
    a2 = a[2],
    a3 = a[3],
    a4 = a[4],
    a5 = a[5],
    a6 = a[6],
    a7 = a[7],
    a8 = a[8];
  var b0 = b[0],
    b1 = b[1],
    b2 = b[2],
    b3 = b[3],
    b4 = b[4],
    b5 = b[5],
    b6 = b[6],
    b7 = b[7],
    b8 = b[8];
  return Math.abs(a0 - b0) <= EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= EPSILON * Math.max(1.0, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= EPSILON * Math.max(1.0, Math.abs(a5), Math.abs(b5)) && Math.abs(a6 - b6) <= EPSILON * Math.max(1.0, Math.abs(a6), Math.abs(b6)) && Math.abs(a7 - b7) <= EPSILON * Math.max(1.0, Math.abs(a7), Math.abs(b7)) && Math.abs(a8 - b8) <= EPSILON * Math.max(1.0, Math.abs(a8), Math.abs(b8));
}

/**
 * Alias for {@link mat3.multiply}
 * @function
 */
var mat3_mul = mat3_multiply;

/**
 * Alias for {@link mat3.subtract}
 * @function
 */
var mat3_sub = mat3_subtract;
;// ./node_modules/gl-matrix/esm/mat4.js


/**
 * 4x4 Matrix<br>Format: column-major, when typed out it looks like row-major<br>The matrices are being post multiplied.
 * @module mat4
 */

/**
 * Creates a new identity mat4
 *
 * @returns {mat4} a new 4x4 matrix
 */
function mat4_create() {
  var out = new ARRAY_TYPE(16);
  if (ARRAY_TYPE != Float32Array) {
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
  }
  out[0] = 1;
  out[5] = 1;
  out[10] = 1;
  out[15] = 1;
  return out;
}

/**
 * Creates a new mat4 initialized with values from an existing matrix
 *
 * @param {ReadonlyMat4} a matrix to clone
 * @returns {mat4} a new 4x4 matrix
 */
function mat4_clone(a) {
  var out = new ARRAY_TYPE(16);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  out[6] = a[6];
  out[7] = a[7];
  out[8] = a[8];
  out[9] = a[9];
  out[10] = a[10];
  out[11] = a[11];
  out[12] = a[12];
  out[13] = a[13];
  out[14] = a[14];
  out[15] = a[15];
  return out;
}

/**
 * Copy the values from one mat4 to another
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the source matrix
 * @returns {mat4} out
 */
function mat4_copy(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  out[6] = a[6];
  out[7] = a[7];
  out[8] = a[8];
  out[9] = a[9];
  out[10] = a[10];
  out[11] = a[11];
  out[12] = a[12];
  out[13] = a[13];
  out[14] = a[14];
  out[15] = a[15];
  return out;
}

/**
 * Create a new mat4 with the given values
 *
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m02 Component in column 0, row 2 position (index 2)
 * @param {Number} m03 Component in column 0, row 3 position (index 3)
 * @param {Number} m10 Component in column 1, row 0 position (index 4)
 * @param {Number} m11 Component in column 1, row 1 position (index 5)
 * @param {Number} m12 Component in column 1, row 2 position (index 6)
 * @param {Number} m13 Component in column 1, row 3 position (index 7)
 * @param {Number} m20 Component in column 2, row 0 position (index 8)
 * @param {Number} m21 Component in column 2, row 1 position (index 9)
 * @param {Number} m22 Component in column 2, row 2 position (index 10)
 * @param {Number} m23 Component in column 2, row 3 position (index 11)
 * @param {Number} m30 Component in column 3, row 0 position (index 12)
 * @param {Number} m31 Component in column 3, row 1 position (index 13)
 * @param {Number} m32 Component in column 3, row 2 position (index 14)
 * @param {Number} m33 Component in column 3, row 3 position (index 15)
 * @returns {mat4} A new mat4
 */
function mat4_fromValues(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
  var out = new ARRAY_TYPE(16);
  out[0] = m00;
  out[1] = m01;
  out[2] = m02;
  out[3] = m03;
  out[4] = m10;
  out[5] = m11;
  out[6] = m12;
  out[7] = m13;
  out[8] = m20;
  out[9] = m21;
  out[10] = m22;
  out[11] = m23;
  out[12] = m30;
  out[13] = m31;
  out[14] = m32;
  out[15] = m33;
  return out;
}

/**
 * Set the components of a mat4 to the given values
 *
 * @param {mat4} out the receiving matrix
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m02 Component in column 0, row 2 position (index 2)
 * @param {Number} m03 Component in column 0, row 3 position (index 3)
 * @param {Number} m10 Component in column 1, row 0 position (index 4)
 * @param {Number} m11 Component in column 1, row 1 position (index 5)
 * @param {Number} m12 Component in column 1, row 2 position (index 6)
 * @param {Number} m13 Component in column 1, row 3 position (index 7)
 * @param {Number} m20 Component in column 2, row 0 position (index 8)
 * @param {Number} m21 Component in column 2, row 1 position (index 9)
 * @param {Number} m22 Component in column 2, row 2 position (index 10)
 * @param {Number} m23 Component in column 2, row 3 position (index 11)
 * @param {Number} m30 Component in column 3, row 0 position (index 12)
 * @param {Number} m31 Component in column 3, row 1 position (index 13)
 * @param {Number} m32 Component in column 3, row 2 position (index 14)
 * @param {Number} m33 Component in column 3, row 3 position (index 15)
 * @returns {mat4} out
 */
function mat4_set(out, m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
  out[0] = m00;
  out[1] = m01;
  out[2] = m02;
  out[3] = m03;
  out[4] = m10;
  out[5] = m11;
  out[6] = m12;
  out[7] = m13;
  out[8] = m20;
  out[9] = m21;
  out[10] = m22;
  out[11] = m23;
  out[12] = m30;
  out[13] = m31;
  out[14] = m32;
  out[15] = m33;
  return out;
}

/**
 * Set a mat4 to the identity matrix
 *
 * @param {mat4} out the receiving matrix
 * @returns {mat4} out
 */
function mat4_identity(out) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}

/**
 * Transpose the values of a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the source matrix
 * @returns {mat4} out
 */
function mat4_transpose(out, a) {
  // If we are transposing ourselves we can skip a few steps but have to cache some values
  if (out === a) {
    var a01 = a[1],
      a02 = a[2],
      a03 = a[3];
    var a12 = a[6],
      a13 = a[7];
    var a23 = a[11];
    out[1] = a[4];
    out[2] = a[8];
    out[3] = a[12];
    out[4] = a01;
    out[6] = a[9];
    out[7] = a[13];
    out[8] = a02;
    out[9] = a12;
    out[11] = a[14];
    out[12] = a03;
    out[13] = a13;
    out[14] = a23;
  } else {
    out[0] = a[0];
    out[1] = a[4];
    out[2] = a[8];
    out[3] = a[12];
    out[4] = a[1];
    out[5] = a[5];
    out[6] = a[9];
    out[7] = a[13];
    out[8] = a[2];
    out[9] = a[6];
    out[10] = a[10];
    out[11] = a[14];
    out[12] = a[3];
    out[13] = a[7];
    out[14] = a[11];
    out[15] = a[15];
  }
  return out;
}

/**
 * Inverts a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the source matrix
 * @returns {mat4 | null} out, or null if source matrix is not invertible
 */
function mat4_invert(out, a) {
  var a00 = a[0],
    a01 = a[1],
    a02 = a[2],
    a03 = a[3];
  var a10 = a[4],
    a11 = a[5],
    a12 = a[6],
    a13 = a[7];
  var a20 = a[8],
    a21 = a[9],
    a22 = a[10],
    a23 = a[11];
  var a30 = a[12],
    a31 = a[13],
    a32 = a[14],
    a33 = a[15];
  var b00 = a00 * a11 - a01 * a10;
  var b01 = a00 * a12 - a02 * a10;
  var b02 = a00 * a13 - a03 * a10;
  var b03 = a01 * a12 - a02 * a11;
  var b04 = a01 * a13 - a03 * a11;
  var b05 = a02 * a13 - a03 * a12;
  var b06 = a20 * a31 - a21 * a30;
  var b07 = a20 * a32 - a22 * a30;
  var b08 = a20 * a33 - a23 * a30;
  var b09 = a21 * a32 - a22 * a31;
  var b10 = a21 * a33 - a23 * a31;
  var b11 = a22 * a33 - a23 * a32;

  // Calculate the determinant
  var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  if (!det) {
    return null;
  }
  det = 1.0 / det;
  out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
  out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
  out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
  out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
  out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
  out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
  out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
  out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
  out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
  out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
  out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
  out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
  out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
  out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
  out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
  out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
  return out;
}

/**
 * Calculates the adjugate of a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the source matrix
 * @returns {mat4} out
 */
function mat4_adjoint(out, a) {
  var a00 = a[0],
    a01 = a[1],
    a02 = a[2],
    a03 = a[3];
  var a10 = a[4],
    a11 = a[5],
    a12 = a[6],
    a13 = a[7];
  var a20 = a[8],
    a21 = a[9],
    a22 = a[10],
    a23 = a[11];
  var a30 = a[12],
    a31 = a[13],
    a32 = a[14],
    a33 = a[15];
  var b00 = a00 * a11 - a01 * a10;
  var b01 = a00 * a12 - a02 * a10;
  var b02 = a00 * a13 - a03 * a10;
  var b03 = a01 * a12 - a02 * a11;
  var b04 = a01 * a13 - a03 * a11;
  var b05 = a02 * a13 - a03 * a12;
  var b06 = a20 * a31 - a21 * a30;
  var b07 = a20 * a32 - a22 * a30;
  var b08 = a20 * a33 - a23 * a30;
  var b09 = a21 * a32 - a22 * a31;
  var b10 = a21 * a33 - a23 * a31;
  var b11 = a22 * a33 - a23 * a32;
  out[0] = a11 * b11 - a12 * b10 + a13 * b09;
  out[1] = a02 * b10 - a01 * b11 - a03 * b09;
  out[2] = a31 * b05 - a32 * b04 + a33 * b03;
  out[3] = a22 * b04 - a21 * b05 - a23 * b03;
  out[4] = a12 * b08 - a10 * b11 - a13 * b07;
  out[5] = a00 * b11 - a02 * b08 + a03 * b07;
  out[6] = a32 * b02 - a30 * b05 - a33 * b01;
  out[7] = a20 * b05 - a22 * b02 + a23 * b01;
  out[8] = a10 * b10 - a11 * b08 + a13 * b06;
  out[9] = a01 * b08 - a00 * b10 - a03 * b06;
  out[10] = a30 * b04 - a31 * b02 + a33 * b00;
  out[11] = a21 * b02 - a20 * b04 - a23 * b00;
  out[12] = a11 * b07 - a10 * b09 - a12 * b06;
  out[13] = a00 * b09 - a01 * b07 + a02 * b06;
  out[14] = a31 * b01 - a30 * b03 - a32 * b00;
  out[15] = a20 * b03 - a21 * b01 + a22 * b00;
  return out;
}

/**
 * Calculates the determinant of a mat4
 *
 * @param {ReadonlyMat4} a the source matrix
 * @returns {Number} determinant of a
 */
function mat4_determinant(a) {
  var a00 = a[0],
    a01 = a[1],
    a02 = a[2],
    a03 = a[3];
  var a10 = a[4],
    a11 = a[5],
    a12 = a[6],
    a13 = a[7];
  var a20 = a[8],
    a21 = a[9],
    a22 = a[10],
    a23 = a[11];
  var a30 = a[12],
    a31 = a[13],
    a32 = a[14],
    a33 = a[15];
  var b0 = a00 * a11 - a01 * a10;
  var b1 = a00 * a12 - a02 * a10;
  var b2 = a01 * a12 - a02 * a11;
  var b3 = a20 * a31 - a21 * a30;
  var b4 = a20 * a32 - a22 * a30;
  var b5 = a21 * a32 - a22 * a31;
  var b6 = a00 * b5 - a01 * b4 + a02 * b3;
  var b7 = a10 * b5 - a11 * b4 + a12 * b3;
  var b8 = a20 * b2 - a21 * b1 + a22 * b0;
  var b9 = a30 * b2 - a31 * b1 + a32 * b0;

  // Calculate the determinant
  return a13 * b6 - a03 * b7 + a33 * b8 - a23 * b9;
}

/**
 * Multiplies two mat4s
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the first operand
 * @param {ReadonlyMat4} b the second operand
 * @returns {mat4} out
 */
function mat4_multiply(out, a, b) {
  var a00 = a[0],
    a01 = a[1],
    a02 = a[2],
    a03 = a[3];
  var a10 = a[4],
    a11 = a[5],
    a12 = a[6],
    a13 = a[7];
  var a20 = a[8],
    a21 = a[9],
    a22 = a[10],
    a23 = a[11];
  var a30 = a[12],
    a31 = a[13],
    a32 = a[14],
    a33 = a[15];

  // Cache only the current line of the second matrix
  var b0 = b[0],
    b1 = b[1],
    b2 = b[2],
    b3 = b[3];
  out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[4];
  b1 = b[5];
  b2 = b[6];
  b3 = b[7];
  out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[8];
  b1 = b[9];
  b2 = b[10];
  b3 = b[11];
  out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[12];
  b1 = b[13];
  b2 = b[14];
  b3 = b[15];
  out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  return out;
}

/**
 * Translate a mat4 by the given vector
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to translate
 * @param {ReadonlyVec3} v vector to translate by
 * @returns {mat4} out
 */
function mat4_translate(out, a, v) {
  var x = v[0],
    y = v[1],
    z = v[2];
  var a00, a01, a02, a03;
  var a10, a11, a12, a13;
  var a20, a21, a22, a23;
  if (a === out) {
    out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
    out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
    out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
    out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
  } else {
    a00 = a[0];
    a01 = a[1];
    a02 = a[2];
    a03 = a[3];
    a10 = a[4];
    a11 = a[5];
    a12 = a[6];
    a13 = a[7];
    a20 = a[8];
    a21 = a[9];
    a22 = a[10];
    a23 = a[11];
    out[0] = a00;
    out[1] = a01;
    out[2] = a02;
    out[3] = a03;
    out[4] = a10;
    out[5] = a11;
    out[6] = a12;
    out[7] = a13;
    out[8] = a20;
    out[9] = a21;
    out[10] = a22;
    out[11] = a23;
    out[12] = a00 * x + a10 * y + a20 * z + a[12];
    out[13] = a01 * x + a11 * y + a21 * z + a[13];
    out[14] = a02 * x + a12 * y + a22 * z + a[14];
    out[15] = a03 * x + a13 * y + a23 * z + a[15];
  }
  return out;
}

/**
 * Scales the mat4 by the dimensions in the given vec3 not using vectorization
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to scale
 * @param {ReadonlyVec3} v the vec3 to scale the matrix by
 * @returns {mat4} out
 **/
function mat4_scale(out, a, v) {
  var x = v[0],
    y = v[1],
    z = v[2];
  out[0] = a[0] * x;
  out[1] = a[1] * x;
  out[2] = a[2] * x;
  out[3] = a[3] * x;
  out[4] = a[4] * y;
  out[5] = a[5] * y;
  out[6] = a[6] * y;
  out[7] = a[7] * y;
  out[8] = a[8] * z;
  out[9] = a[9] * z;
  out[10] = a[10] * z;
  out[11] = a[11] * z;
  out[12] = a[12];
  out[13] = a[13];
  out[14] = a[14];
  out[15] = a[15];
  return out;
}

/**
 * Rotates a mat4 by the given angle around the given axis
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @param {ReadonlyVec3} axis the axis to rotate around
 * @returns {mat4} out
 */
function mat4_rotate(out, a, rad, axis) {
  var x = axis[0],
    y = axis[1],
    z = axis[2];
  var len = Math.sqrt(x * x + y * y + z * z);
  var s, c, t;
  var a00, a01, a02, a03;
  var a10, a11, a12, a13;
  var a20, a21, a22, a23;
  var b00, b01, b02;
  var b10, b11, b12;
  var b20, b21, b22;
  if (len < EPSILON) {
    return null;
  }
  len = 1 / len;
  x *= len;
  y *= len;
  z *= len;
  s = Math.sin(rad);
  c = Math.cos(rad);
  t = 1 - c;
  a00 = a[0];
  a01 = a[1];
  a02 = a[2];
  a03 = a[3];
  a10 = a[4];
  a11 = a[5];
  a12 = a[6];
  a13 = a[7];
  a20 = a[8];
  a21 = a[9];
  a22 = a[10];
  a23 = a[11];

  // Construct the elements of the rotation matrix
  b00 = x * x * t + c;
  b01 = y * x * t + z * s;
  b02 = z * x * t - y * s;
  b10 = x * y * t - z * s;
  b11 = y * y * t + c;
  b12 = z * y * t + x * s;
  b20 = x * z * t + y * s;
  b21 = y * z * t - x * s;
  b22 = z * z * t + c;

  // Perform rotation-specific matrix multiplication
  out[0] = a00 * b00 + a10 * b01 + a20 * b02;
  out[1] = a01 * b00 + a11 * b01 + a21 * b02;
  out[2] = a02 * b00 + a12 * b01 + a22 * b02;
  out[3] = a03 * b00 + a13 * b01 + a23 * b02;
  out[4] = a00 * b10 + a10 * b11 + a20 * b12;
  out[5] = a01 * b10 + a11 * b11 + a21 * b12;
  out[6] = a02 * b10 + a12 * b11 + a22 * b12;
  out[7] = a03 * b10 + a13 * b11 + a23 * b12;
  out[8] = a00 * b20 + a10 * b21 + a20 * b22;
  out[9] = a01 * b20 + a11 * b21 + a21 * b22;
  out[10] = a02 * b20 + a12 * b21 + a22 * b22;
  out[11] = a03 * b20 + a13 * b21 + a23 * b22;
  if (a !== out) {
    // If the source and destination differ, copy the unchanged last row
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }
  return out;
}

/**
 * Rotates a matrix by the given angle around the X axis
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
function rotateX(out, a, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  var a10 = a[4];
  var a11 = a[5];
  var a12 = a[6];
  var a13 = a[7];
  var a20 = a[8];
  var a21 = a[9];
  var a22 = a[10];
  var a23 = a[11];
  if (a !== out) {
    // If the source and destination differ, copy the unchanged rows
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }

  // Perform axis-specific matrix multiplication
  out[4] = a10 * c + a20 * s;
  out[5] = a11 * c + a21 * s;
  out[6] = a12 * c + a22 * s;
  out[7] = a13 * c + a23 * s;
  out[8] = a20 * c - a10 * s;
  out[9] = a21 * c - a11 * s;
  out[10] = a22 * c - a12 * s;
  out[11] = a23 * c - a13 * s;
  return out;
}

/**
 * Rotates a matrix by the given angle around the Y axis
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
function rotateY(out, a, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  var a00 = a[0];
  var a01 = a[1];
  var a02 = a[2];
  var a03 = a[3];
  var a20 = a[8];
  var a21 = a[9];
  var a22 = a[10];
  var a23 = a[11];
  if (a !== out) {
    // If the source and destination differ, copy the unchanged rows
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }

  // Perform axis-specific matrix multiplication
  out[0] = a00 * c - a20 * s;
  out[1] = a01 * c - a21 * s;
  out[2] = a02 * c - a22 * s;
  out[3] = a03 * c - a23 * s;
  out[8] = a00 * s + a20 * c;
  out[9] = a01 * s + a21 * c;
  out[10] = a02 * s + a22 * c;
  out[11] = a03 * s + a23 * c;
  return out;
}

/**
 * Rotates a matrix by the given angle around the Z axis
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
function rotateZ(out, a, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  var a00 = a[0];
  var a01 = a[1];
  var a02 = a[2];
  var a03 = a[3];
  var a10 = a[4];
  var a11 = a[5];
  var a12 = a[6];
  var a13 = a[7];
  if (a !== out) {
    // If the source and destination differ, copy the unchanged last row
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }

  // Perform axis-specific matrix multiplication
  out[0] = a00 * c + a10 * s;
  out[1] = a01 * c + a11 * s;
  out[2] = a02 * c + a12 * s;
  out[3] = a03 * c + a13 * s;
  out[4] = a10 * c - a00 * s;
  out[5] = a11 * c - a01 * s;
  out[6] = a12 * c - a02 * s;
  out[7] = a13 * c - a03 * s;
  return out;
}

/**
 * Creates a matrix from a vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, dest, vec);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {ReadonlyVec3} v Translation vector
 * @returns {mat4} out
 */
function mat4_fromTranslation(out, v) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = v[0];
  out[13] = v[1];
  out[14] = v[2];
  out[15] = 1;
  return out;
}

/**
 * Creates a matrix from a vector scaling
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.scale(dest, dest, vec);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {ReadonlyVec3} v Scaling vector
 * @returns {mat4} out
 */
function mat4_fromScaling(out, v) {
  out[0] = v[0];
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = v[1];
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = v[2];
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}

/**
 * Creates a matrix from a given angle around a given axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotate(dest, dest, rad, axis);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @param {ReadonlyVec3} axis the axis to rotate around
 * @returns {mat4} out
 */
function mat4_fromRotation(out, rad, axis) {
  var x = axis[0],
    y = axis[1],
    z = axis[2];
  var len = Math.sqrt(x * x + y * y + z * z);
  var s, c, t;
  if (len < EPSILON) {
    return null;
  }
  len = 1 / len;
  x *= len;
  y *= len;
  z *= len;
  s = Math.sin(rad);
  c = Math.cos(rad);
  t = 1 - c;

  // Perform rotation-specific matrix multiplication
  out[0] = x * x * t + c;
  out[1] = y * x * t + z * s;
  out[2] = z * x * t - y * s;
  out[3] = 0;
  out[4] = x * y * t - z * s;
  out[5] = y * y * t + c;
  out[6] = z * y * t + x * s;
  out[7] = 0;
  out[8] = x * z * t + y * s;
  out[9] = y * z * t - x * s;
  out[10] = z * z * t + c;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}

/**
 * Creates a matrix from the given angle around the X axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotateX(dest, dest, rad);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
function fromXRotation(out, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);

  // Perform axis-specific matrix multiplication
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = c;
  out[6] = s;
  out[7] = 0;
  out[8] = 0;
  out[9] = -s;
  out[10] = c;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}

/**
 * Creates a matrix from the given angle around the Y axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotateY(dest, dest, rad);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
function fromYRotation(out, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);

  // Perform axis-specific matrix multiplication
  out[0] = c;
  out[1] = 0;
  out[2] = -s;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = s;
  out[9] = 0;
  out[10] = c;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}

/**
 * Creates a matrix from the given angle around the Z axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotateZ(dest, dest, rad);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
function fromZRotation(out, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);

  // Perform axis-specific matrix multiplication
  out[0] = c;
  out[1] = s;
  out[2] = 0;
  out[3] = 0;
  out[4] = -s;
  out[5] = c;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}

/**
 * Creates a matrix from a quaternion rotation and vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, dest, vec);
 *     let quatMat = mat4.create();
 *     mat4.fromQuat(quatMat, quat);
 *     mat4.multiply(dest, dest, quatMat);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat} q Rotation quaternion
 * @param {ReadonlyVec3} v Translation vector
 * @returns {mat4} out
 */
function fromRotationTranslation(out, q, v) {
  // Quaternion math
  var x = q[0],
    y = q[1],
    z = q[2],
    w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;
  var xx = x * x2;
  var xy = x * y2;
  var xz = x * z2;
  var yy = y * y2;
  var yz = y * z2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;
  out[0] = 1 - (yy + zz);
  out[1] = xy + wz;
  out[2] = xz - wy;
  out[3] = 0;
  out[4] = xy - wz;
  out[5] = 1 - (xx + zz);
  out[6] = yz + wx;
  out[7] = 0;
  out[8] = xz + wy;
  out[9] = yz - wx;
  out[10] = 1 - (xx + yy);
  out[11] = 0;
  out[12] = v[0];
  out[13] = v[1];
  out[14] = v[2];
  out[15] = 1;
  return out;
}

/**
 * Creates a new mat4 from a dual quat.
 *
 * @param {mat4} out Matrix
 * @param {ReadonlyQuat2} a Dual Quaternion
 * @returns {mat4} mat4 receiving operation result
 */
function fromQuat2(out, a) {
  var translation = new ARRAY_TYPE(3);
  var bx = -a[0],
    by = -a[1],
    bz = -a[2],
    bw = a[3],
    ax = a[4],
    ay = a[5],
    az = a[6],
    aw = a[7];
  var magnitude = bx * bx + by * by + bz * bz + bw * bw;
  //Only scale if it makes sense
  if (magnitude > 0) {
    translation[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2 / magnitude;
    translation[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2 / magnitude;
    translation[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2 / magnitude;
  } else {
    translation[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2;
    translation[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2;
    translation[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2;
  }
  fromRotationTranslation(out, a, translation);
  return out;
}

/**
 * Returns the translation vector component of a transformation
 *  matrix. If a matrix is built with fromRotationTranslation,
 *  the returned vector will be the same as the translation vector
 *  originally supplied.
 * @param  {vec3} out Vector to receive translation component
 * @param  {ReadonlyMat4} mat Matrix to be decomposed (input)
 * @return {vec3} out
 */
function getTranslation(out, mat) {
  out[0] = mat[12];
  out[1] = mat[13];
  out[2] = mat[14];
  return out;
}

/**
 * Returns the scaling factor component of a transformation
 *  matrix. If a matrix is built with fromRotationTranslationScale
 *  with a normalized Quaternion parameter, the returned vector will be
 *  the same as the scaling vector
 *  originally supplied.
 * @param  {vec3} out Vector to receive scaling factor component
 * @param  {ReadonlyMat4} mat Matrix to be decomposed (input)
 * @return {vec3} out
 */
function getScaling(out, mat) {
  var m11 = mat[0];
  var m12 = mat[1];
  var m13 = mat[2];
  var m21 = mat[4];
  var m22 = mat[5];
  var m23 = mat[6];
  var m31 = mat[8];
  var m32 = mat[9];
  var m33 = mat[10];
  out[0] = Math.sqrt(m11 * m11 + m12 * m12 + m13 * m13);
  out[1] = Math.sqrt(m21 * m21 + m22 * m22 + m23 * m23);
  out[2] = Math.sqrt(m31 * m31 + m32 * m32 + m33 * m33);
  return out;
}

/**
 * Returns a quaternion representing the rotational component
 *  of a transformation matrix. If a matrix is built with
 *  fromRotationTranslation, the returned quaternion will be the
 *  same as the quaternion originally supplied.
 * @param {quat} out Quaternion to receive the rotation component
 * @param {ReadonlyMat4} mat Matrix to be decomposed (input)
 * @return {quat} out
 */
function getRotation(out, mat) {
  var scaling = new ARRAY_TYPE(3);
  getScaling(scaling, mat);
  var is1 = 1 / scaling[0];
  var is2 = 1 / scaling[1];
  var is3 = 1 / scaling[2];
  var sm11 = mat[0] * is1;
  var sm12 = mat[1] * is2;
  var sm13 = mat[2] * is3;
  var sm21 = mat[4] * is1;
  var sm22 = mat[5] * is2;
  var sm23 = mat[6] * is3;
  var sm31 = mat[8] * is1;
  var sm32 = mat[9] * is2;
  var sm33 = mat[10] * is3;
  var trace = sm11 + sm22 + sm33;
  var S = 0;
  if (trace > 0) {
    S = Math.sqrt(trace + 1.0) * 2;
    out[3] = 0.25 * S;
    out[0] = (sm23 - sm32) / S;
    out[1] = (sm31 - sm13) / S;
    out[2] = (sm12 - sm21) / S;
  } else if (sm11 > sm22 && sm11 > sm33) {
    S = Math.sqrt(1.0 + sm11 - sm22 - sm33) * 2;
    out[3] = (sm23 - sm32) / S;
    out[0] = 0.25 * S;
    out[1] = (sm12 + sm21) / S;
    out[2] = (sm31 + sm13) / S;
  } else if (sm22 > sm33) {
    S = Math.sqrt(1.0 + sm22 - sm11 - sm33) * 2;
    out[3] = (sm31 - sm13) / S;
    out[0] = (sm12 + sm21) / S;
    out[1] = 0.25 * S;
    out[2] = (sm23 + sm32) / S;
  } else {
    S = Math.sqrt(1.0 + sm33 - sm11 - sm22) * 2;
    out[3] = (sm12 - sm21) / S;
    out[0] = (sm31 + sm13) / S;
    out[1] = (sm23 + sm32) / S;
    out[2] = 0.25 * S;
  }
  return out;
}

/**
 * Decomposes a transformation matrix into its rotation, translation
 * and scale components. Returns only the rotation component
 * @param  {quat} out_r Quaternion to receive the rotation component
 * @param  {vec3} out_t Vector to receive the translation vector
 * @param  {vec3} out_s Vector to receive the scaling factor
 * @param  {ReadonlyMat4} mat Matrix to be decomposed (input)
 * @returns {quat} out_r
 */
function decompose(out_r, out_t, out_s, mat) {
  out_t[0] = mat[12];
  out_t[1] = mat[13];
  out_t[2] = mat[14];
  var m11 = mat[0];
  var m12 = mat[1];
  var m13 = mat[2];
  var m21 = mat[4];
  var m22 = mat[5];
  var m23 = mat[6];
  var m31 = mat[8];
  var m32 = mat[9];
  var m33 = mat[10];
  out_s[0] = Math.sqrt(m11 * m11 + m12 * m12 + m13 * m13);
  out_s[1] = Math.sqrt(m21 * m21 + m22 * m22 + m23 * m23);
  out_s[2] = Math.sqrt(m31 * m31 + m32 * m32 + m33 * m33);
  var is1 = 1 / out_s[0];
  var is2 = 1 / out_s[1];
  var is3 = 1 / out_s[2];
  var sm11 = m11 * is1;
  var sm12 = m12 * is2;
  var sm13 = m13 * is3;
  var sm21 = m21 * is1;
  var sm22 = m22 * is2;
  var sm23 = m23 * is3;
  var sm31 = m31 * is1;
  var sm32 = m32 * is2;
  var sm33 = m33 * is3;
  var trace = sm11 + sm22 + sm33;
  var S = 0;
  if (trace > 0) {
    S = Math.sqrt(trace + 1.0) * 2;
    out_r[3] = 0.25 * S;
    out_r[0] = (sm23 - sm32) / S;
    out_r[1] = (sm31 - sm13) / S;
    out_r[2] = (sm12 - sm21) / S;
  } else if (sm11 > sm22 && sm11 > sm33) {
    S = Math.sqrt(1.0 + sm11 - sm22 - sm33) * 2;
    out_r[3] = (sm23 - sm32) / S;
    out_r[0] = 0.25 * S;
    out_r[1] = (sm12 + sm21) / S;
    out_r[2] = (sm31 + sm13) / S;
  } else if (sm22 > sm33) {
    S = Math.sqrt(1.0 + sm22 - sm11 - sm33) * 2;
    out_r[3] = (sm31 - sm13) / S;
    out_r[0] = (sm12 + sm21) / S;
    out_r[1] = 0.25 * S;
    out_r[2] = (sm23 + sm32) / S;
  } else {
    S = Math.sqrt(1.0 + sm33 - sm11 - sm22) * 2;
    out_r[3] = (sm12 - sm21) / S;
    out_r[0] = (sm31 + sm13) / S;
    out_r[1] = (sm23 + sm32) / S;
    out_r[2] = 0.25 * S;
  }
  return out_r;
}

/**
 * Creates a matrix from a quaternion rotation, vector translation and vector scale
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, dest, vec);
 *     let quatMat = mat4.create();
 *     mat4.fromQuat(quatMat, quat);
 *     mat4.multiply(dest, dest, quatMat);
 *     mat4.scale(dest, dest, scale)
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat} q Rotation quaternion
 * @param {ReadonlyVec3} v Translation vector
 * @param {ReadonlyVec3} s Scaling vector
 * @returns {mat4} out
 */
function fromRotationTranslationScale(out, q, v, s) {
  // Quaternion math
  var x = q[0],
    y = q[1],
    z = q[2],
    w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;
  var xx = x * x2;
  var xy = x * y2;
  var xz = x * z2;
  var yy = y * y2;
  var yz = y * z2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;
  var sx = s[0];
  var sy = s[1];
  var sz = s[2];
  out[0] = (1 - (yy + zz)) * sx;
  out[1] = (xy + wz) * sx;
  out[2] = (xz - wy) * sx;
  out[3] = 0;
  out[4] = (xy - wz) * sy;
  out[5] = (1 - (xx + zz)) * sy;
  out[6] = (yz + wx) * sy;
  out[7] = 0;
  out[8] = (xz + wy) * sz;
  out[9] = (yz - wx) * sz;
  out[10] = (1 - (xx + yy)) * sz;
  out[11] = 0;
  out[12] = v[0];
  out[13] = v[1];
  out[14] = v[2];
  out[15] = 1;
  return out;
}

/**
 * Creates a matrix from a quaternion rotation, vector translation and vector scale, rotating and scaling around the given origin
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, dest, vec);
 *     mat4.translate(dest, dest, origin);
 *     let quatMat = mat4.create();
 *     mat4.fromQuat(quatMat, quat);
 *     mat4.multiply(dest, dest, quatMat);
 *     mat4.scale(dest, dest, scale)
 *     mat4.translate(dest, dest, negativeOrigin);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat} q Rotation quaternion
 * @param {ReadonlyVec3} v Translation vector
 * @param {ReadonlyVec3} s Scaling vector
 * @param {ReadonlyVec3} o The origin vector around which to scale and rotate
 * @returns {mat4} out
 */
function fromRotationTranslationScaleOrigin(out, q, v, s, o) {
  // Quaternion math
  var x = q[0],
    y = q[1],
    z = q[2],
    w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;
  var xx = x * x2;
  var xy = x * y2;
  var xz = x * z2;
  var yy = y * y2;
  var yz = y * z2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;
  var sx = s[0];
  var sy = s[1];
  var sz = s[2];
  var ox = o[0];
  var oy = o[1];
  var oz = o[2];
  var out0 = (1 - (yy + zz)) * sx;
  var out1 = (xy + wz) * sx;
  var out2 = (xz - wy) * sx;
  var out4 = (xy - wz) * sy;
  var out5 = (1 - (xx + zz)) * sy;
  var out6 = (yz + wx) * sy;
  var out8 = (xz + wy) * sz;
  var out9 = (yz - wx) * sz;
  var out10 = (1 - (xx + yy)) * sz;
  out[0] = out0;
  out[1] = out1;
  out[2] = out2;
  out[3] = 0;
  out[4] = out4;
  out[5] = out5;
  out[6] = out6;
  out[7] = 0;
  out[8] = out8;
  out[9] = out9;
  out[10] = out10;
  out[11] = 0;
  out[12] = v[0] + ox - (out0 * ox + out4 * oy + out8 * oz);
  out[13] = v[1] + oy - (out1 * ox + out5 * oy + out9 * oz);
  out[14] = v[2] + oz - (out2 * ox + out6 * oy + out10 * oz);
  out[15] = 1;
  return out;
}

/**
 * Calculates a 4x4 matrix from the given quaternion
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {ReadonlyQuat} q Quaternion to create matrix from
 *
 * @returns {mat4} out
 */
function mat4_fromQuat(out, q) {
  var x = q[0],
    y = q[1],
    z = q[2],
    w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;
  var xx = x * x2;
  var yx = y * x2;
  var yy = y * y2;
  var zx = z * x2;
  var zy = z * y2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;
  out[0] = 1 - yy - zz;
  out[1] = yx + wz;
  out[2] = zx - wy;
  out[3] = 0;
  out[4] = yx - wz;
  out[5] = 1 - xx - zz;
  out[6] = zy + wx;
  out[7] = 0;
  out[8] = zx + wy;
  out[9] = zy - wx;
  out[10] = 1 - xx - yy;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}

/**
 * Generates a frustum matrix with the given bounds
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {Number} left Left bound of the frustum
 * @param {Number} right Right bound of the frustum
 * @param {Number} bottom Bottom bound of the frustum
 * @param {Number} top Top bound of the frustum
 * @param {Number} near Near bound of the frustum
 * @param {Number} far Far bound of the frustum
 * @returns {mat4} out
 */
function frustum(out, left, right, bottom, top, near, far) {
  var rl = 1 / (right - left);
  var tb = 1 / (top - bottom);
  var nf = 1 / (near - far);
  out[0] = near * 2 * rl;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = near * 2 * tb;
  out[6] = 0;
  out[7] = 0;
  out[8] = (right + left) * rl;
  out[9] = (top + bottom) * tb;
  out[10] = (far + near) * nf;
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[14] = far * near * 2 * nf;
  out[15] = 0;
  return out;
}

/**
 * Generates a perspective projection matrix with the given bounds.
 * The near/far clip planes correspond to a normalized device coordinate Z range of [-1, 1],
 * which matches WebGL/OpenGL's clip volume.
 * Passing null/undefined/no value for far will generate infinite projection matrix.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} fovy Vertical field of view in radians
 * @param {number} aspect Aspect ratio. typically viewport width/height
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum, can be null or Infinity
 * @returns {mat4} out
 */
function perspectiveNO(out, fovy, aspect, near, far) {
  var f = 1.0 / Math.tan(fovy / 2);
  out[0] = f / aspect;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = f;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[15] = 0;
  if (far != null && far !== Infinity) {
    var nf = 1 / (near - far);
    out[10] = (far + near) * nf;
    out[14] = 2 * far * near * nf;
  } else {
    out[10] = -1;
    out[14] = -2 * near;
  }
  return out;
}

/**
 * Alias for {@link mat4.perspectiveNO}
 * @function
 */
var perspective = perspectiveNO;

/**
 * Generates a perspective projection matrix suitable for WebGPU with the given bounds.
 * The near/far clip planes correspond to a normalized device coordinate Z range of [0, 1],
 * which matches WebGPU/Vulkan/DirectX/Metal's clip volume.
 * Passing null/undefined/no value for far will generate infinite projection matrix.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} fovy Vertical field of view in radians
 * @param {number} aspect Aspect ratio. typically viewport width/height
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum, can be null or Infinity
 * @returns {mat4} out
 */
function perspectiveZO(out, fovy, aspect, near, far) {
  var f = 1.0 / Math.tan(fovy / 2);
  out[0] = f / aspect;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = f;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[15] = 0;
  if (far != null && far !== Infinity) {
    var nf = 1 / (near - far);
    out[10] = far * nf;
    out[14] = far * near * nf;
  } else {
    out[10] = -1;
    out[14] = -near;
  }
  return out;
}

/**
 * Generates a perspective projection matrix with the given field of view.
 * This is primarily useful for generating projection matrices to be used
 * with the still experiemental WebVR API.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {Object} fov Object containing the following values: upDegrees, downDegrees, leftDegrees, rightDegrees
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */
function perspectiveFromFieldOfView(out, fov, near, far) {
  var upTan = Math.tan(fov.upDegrees * Math.PI / 180.0);
  var downTan = Math.tan(fov.downDegrees * Math.PI / 180.0);
  var leftTan = Math.tan(fov.leftDegrees * Math.PI / 180.0);
  var rightTan = Math.tan(fov.rightDegrees * Math.PI / 180.0);
  var xScale = 2.0 / (leftTan + rightTan);
  var yScale = 2.0 / (upTan + downTan);
  out[0] = xScale;
  out[1] = 0.0;
  out[2] = 0.0;
  out[3] = 0.0;
  out[4] = 0.0;
  out[5] = yScale;
  out[6] = 0.0;
  out[7] = 0.0;
  out[8] = -((leftTan - rightTan) * xScale * 0.5);
  out[9] = (upTan - downTan) * yScale * 0.5;
  out[10] = far / (near - far);
  out[11] = -1.0;
  out[12] = 0.0;
  out[13] = 0.0;
  out[14] = far * near / (near - far);
  out[15] = 0.0;
  return out;
}

/**
 * Generates a orthogonal projection matrix with the given bounds.
 * The near/far clip planes correspond to a normalized device coordinate Z range of [-1, 1],
 * which matches WebGL/OpenGL's clip volume.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} left Left bound of the frustum
 * @param {number} right Right bound of the frustum
 * @param {number} bottom Bottom bound of the frustum
 * @param {number} top Top bound of the frustum
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */
function orthoNO(out, left, right, bottom, top, near, far) {
  var lr = 1 / (left - right);
  var bt = 1 / (bottom - top);
  var nf = 1 / (near - far);
  out[0] = -2 * lr;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = -2 * bt;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 2 * nf;
  out[11] = 0;
  out[12] = (left + right) * lr;
  out[13] = (top + bottom) * bt;
  out[14] = (far + near) * nf;
  out[15] = 1;
  return out;
}

/**
 * Alias for {@link mat4.orthoNO}
 * @function
 */
var ortho = orthoNO;

/**
 * Generates a orthogonal projection matrix with the given bounds.
 * The near/far clip planes correspond to a normalized device coordinate Z range of [0, 1],
 * which matches WebGPU/Vulkan/DirectX/Metal's clip volume.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} left Left bound of the frustum
 * @param {number} right Right bound of the frustum
 * @param {number} bottom Bottom bound of the frustum
 * @param {number} top Top bound of the frustum
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */
function orthoZO(out, left, right, bottom, top, near, far) {
  var lr = 1 / (left - right);
  var bt = 1 / (bottom - top);
  var nf = 1 / (near - far);
  out[0] = -2 * lr;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = -2 * bt;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = nf;
  out[11] = 0;
  out[12] = (left + right) * lr;
  out[13] = (top + bottom) * bt;
  out[14] = near * nf;
  out[15] = 1;
  return out;
}

/**
 * Generates a look-at matrix with the given eye position, focal point, and up axis.
 * If you want a matrix that actually makes an object look at another object, you should use targetTo instead.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {ReadonlyVec3} eye Position of the viewer
 * @param {ReadonlyVec3} center Point the viewer is looking at
 * @param {ReadonlyVec3} up vec3 pointing up
 * @returns {mat4} out
 */
function lookAt(out, eye, center, up) {
  var x0, x1, x2, y0, y1, y2, z0, z1, z2, len;
  var eyex = eye[0];
  var eyey = eye[1];
  var eyez = eye[2];
  var upx = up[0];
  var upy = up[1];
  var upz = up[2];
  var centerx = center[0];
  var centery = center[1];
  var centerz = center[2];
  if (Math.abs(eyex - centerx) < EPSILON && Math.abs(eyey - centery) < EPSILON && Math.abs(eyez - centerz) < EPSILON) {
    return mat4_identity(out);
  }
  z0 = eyex - centerx;
  z1 = eyey - centery;
  z2 = eyez - centerz;
  len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
  z0 *= len;
  z1 *= len;
  z2 *= len;
  x0 = upy * z2 - upz * z1;
  x1 = upz * z0 - upx * z2;
  x2 = upx * z1 - upy * z0;
  len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
  if (!len) {
    x0 = 0;
    x1 = 0;
    x2 = 0;
  } else {
    len = 1 / len;
    x0 *= len;
    x1 *= len;
    x2 *= len;
  }
  y0 = z1 * x2 - z2 * x1;
  y1 = z2 * x0 - z0 * x2;
  y2 = z0 * x1 - z1 * x0;
  len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
  if (!len) {
    y0 = 0;
    y1 = 0;
    y2 = 0;
  } else {
    len = 1 / len;
    y0 *= len;
    y1 *= len;
    y2 *= len;
  }
  out[0] = x0;
  out[1] = y0;
  out[2] = z0;
  out[3] = 0;
  out[4] = x1;
  out[5] = y1;
  out[6] = z1;
  out[7] = 0;
  out[8] = x2;
  out[9] = y2;
  out[10] = z2;
  out[11] = 0;
  out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
  out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
  out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
  out[15] = 1;
  return out;
}

/**
 * Generates a matrix that makes something look at something else.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {ReadonlyVec3} eye Position of the viewer
 * @param {ReadonlyVec3} target Point the viewer is looking at
 * @param {ReadonlyVec3} up vec3 pointing up
 * @returns {mat4} out
 */
function targetTo(out, eye, target, up) {
  var eyex = eye[0],
    eyey = eye[1],
    eyez = eye[2],
    upx = up[0],
    upy = up[1],
    upz = up[2];
  var z0 = eyex - target[0],
    z1 = eyey - target[1],
    z2 = eyez - target[2];
  var len = z0 * z0 + z1 * z1 + z2 * z2;
  if (len > 0) {
    len = 1 / Math.sqrt(len);
    z0 *= len;
    z1 *= len;
    z2 *= len;
  }
  var x0 = upy * z2 - upz * z1,
    x1 = upz * z0 - upx * z2,
    x2 = upx * z1 - upy * z0;
  len = x0 * x0 + x1 * x1 + x2 * x2;
  if (len > 0) {
    len = 1 / Math.sqrt(len);
    x0 *= len;
    x1 *= len;
    x2 *= len;
  }
  out[0] = x0;
  out[1] = x1;
  out[2] = x2;
  out[3] = 0;
  out[4] = z1 * x2 - z2 * x1;
  out[5] = z2 * x0 - z0 * x2;
  out[6] = z0 * x1 - z1 * x0;
  out[7] = 0;
  out[8] = z0;
  out[9] = z1;
  out[10] = z2;
  out[11] = 0;
  out[12] = eyex;
  out[13] = eyey;
  out[14] = eyez;
  out[15] = 1;
  return out;
}

/**
 * Returns a string representation of a mat4
 *
 * @param {ReadonlyMat4} a matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
function mat4_str(a) {
  return "mat4(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ", " + a[4] + ", " + a[5] + ", " + a[6] + ", " + a[7] + ", " + a[8] + ", " + a[9] + ", " + a[10] + ", " + a[11] + ", " + a[12] + ", " + a[13] + ", " + a[14] + ", " + a[15] + ")";
}

/**
 * Returns Frobenius norm of a mat4
 *
 * @param {ReadonlyMat4} a the matrix to calculate Frobenius norm of
 * @returns {Number} Frobenius norm
 */
function mat4_frob(a) {
  return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2] + a[3] * a[3] + a[4] * a[4] + a[5] * a[5] + a[6] * a[6] + a[7] * a[7] + a[8] * a[8] + a[9] * a[9] + a[10] * a[10] + a[11] * a[11] + a[12] * a[12] + a[13] * a[13] + a[14] * a[14] + a[15] * a[15]);
}

/**
 * Adds two mat4's
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the first operand
 * @param {ReadonlyMat4} b the second operand
 * @returns {mat4} out
 */
function mat4_add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  out[3] = a[3] + b[3];
  out[4] = a[4] + b[4];
  out[5] = a[5] + b[5];
  out[6] = a[6] + b[6];
  out[7] = a[7] + b[7];
  out[8] = a[8] + b[8];
  out[9] = a[9] + b[9];
  out[10] = a[10] + b[10];
  out[11] = a[11] + b[11];
  out[12] = a[12] + b[12];
  out[13] = a[13] + b[13];
  out[14] = a[14] + b[14];
  out[15] = a[15] + b[15];
  return out;
}

/**
 * Subtracts matrix b from matrix a
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the first operand
 * @param {ReadonlyMat4} b the second operand
 * @returns {mat4} out
 */
function mat4_subtract(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  out[3] = a[3] - b[3];
  out[4] = a[4] - b[4];
  out[5] = a[5] - b[5];
  out[6] = a[6] - b[6];
  out[7] = a[7] - b[7];
  out[8] = a[8] - b[8];
  out[9] = a[9] - b[9];
  out[10] = a[10] - b[10];
  out[11] = a[11] - b[11];
  out[12] = a[12] - b[12];
  out[13] = a[13] - b[13];
  out[14] = a[14] - b[14];
  out[15] = a[15] - b[15];
  return out;
}

/**
 * Multiply each element of the matrix by a scalar.
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to scale
 * @param {Number} b amount to scale the matrix's elements by
 * @returns {mat4} out
 */
function mat4_multiplyScalar(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  out[3] = a[3] * b;
  out[4] = a[4] * b;
  out[5] = a[5] * b;
  out[6] = a[6] * b;
  out[7] = a[7] * b;
  out[8] = a[8] * b;
  out[9] = a[9] * b;
  out[10] = a[10] * b;
  out[11] = a[11] * b;
  out[12] = a[12] * b;
  out[13] = a[13] * b;
  out[14] = a[14] * b;
  out[15] = a[15] * b;
  return out;
}

/**
 * Adds two mat4's after multiplying each element of the second operand by a scalar value.
 *
 * @param {mat4} out the receiving vector
 * @param {ReadonlyMat4} a the first operand
 * @param {ReadonlyMat4} b the second operand
 * @param {Number} scale the amount to scale b's elements by before adding
 * @returns {mat4} out
 */
function mat4_multiplyScalarAndAdd(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  out[2] = a[2] + b[2] * scale;
  out[3] = a[3] + b[3] * scale;
  out[4] = a[4] + b[4] * scale;
  out[5] = a[5] + b[5] * scale;
  out[6] = a[6] + b[6] * scale;
  out[7] = a[7] + b[7] * scale;
  out[8] = a[8] + b[8] * scale;
  out[9] = a[9] + b[9] * scale;
  out[10] = a[10] + b[10] * scale;
  out[11] = a[11] + b[11] * scale;
  out[12] = a[12] + b[12] * scale;
  out[13] = a[13] + b[13] * scale;
  out[14] = a[14] + b[14] * scale;
  out[15] = a[15] + b[15] * scale;
  return out;
}

/**
 * Returns whether or not the matrices have exactly the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyMat4} a The first matrix.
 * @param {ReadonlyMat4} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
function mat4_exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7] && a[8] === b[8] && a[9] === b[9] && a[10] === b[10] && a[11] === b[11] && a[12] === b[12] && a[13] === b[13] && a[14] === b[14] && a[15] === b[15];
}

/**
 * Returns whether or not the matrices have approximately the same elements in the same position.
 *
 * @param {ReadonlyMat4} a The first matrix.
 * @param {ReadonlyMat4} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
function mat4_equals(a, b) {
  var a0 = a[0],
    a1 = a[1],
    a2 = a[2],
    a3 = a[3];
  var a4 = a[4],
    a5 = a[5],
    a6 = a[6],
    a7 = a[7];
  var a8 = a[8],
    a9 = a[9],
    a10 = a[10],
    a11 = a[11];
  var a12 = a[12],
    a13 = a[13],
    a14 = a[14],
    a15 = a[15];
  var b0 = b[0],
    b1 = b[1],
    b2 = b[2],
    b3 = b[3];
  var b4 = b[4],
    b5 = b[5],
    b6 = b[6],
    b7 = b[7];
  var b8 = b[8],
    b9 = b[9],
    b10 = b[10],
    b11 = b[11];
  var b12 = b[12],
    b13 = b[13],
    b14 = b[14],
    b15 = b[15];
  return Math.abs(a0 - b0) <= EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= EPSILON * Math.max(1.0, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= EPSILON * Math.max(1.0, Math.abs(a5), Math.abs(b5)) && Math.abs(a6 - b6) <= EPSILON * Math.max(1.0, Math.abs(a6), Math.abs(b6)) && Math.abs(a7 - b7) <= EPSILON * Math.max(1.0, Math.abs(a7), Math.abs(b7)) && Math.abs(a8 - b8) <= EPSILON * Math.max(1.0, Math.abs(a8), Math.abs(b8)) && Math.abs(a9 - b9) <= EPSILON * Math.max(1.0, Math.abs(a9), Math.abs(b9)) && Math.abs(a10 - b10) <= EPSILON * Math.max(1.0, Math.abs(a10), Math.abs(b10)) && Math.abs(a11 - b11) <= EPSILON * Math.max(1.0, Math.abs(a11), Math.abs(b11)) && Math.abs(a12 - b12) <= EPSILON * Math.max(1.0, Math.abs(a12), Math.abs(b12)) && Math.abs(a13 - b13) <= EPSILON * Math.max(1.0, Math.abs(a13), Math.abs(b13)) && Math.abs(a14 - b14) <= EPSILON * Math.max(1.0, Math.abs(a14), Math.abs(b14)) && Math.abs(a15 - b15) <= EPSILON * Math.max(1.0, Math.abs(a15), Math.abs(b15));
}

/**
 * Alias for {@link mat4.multiply}
 * @function
 */
var mat4_mul = mat4_multiply;

/**
 * Alias for {@link mat4.subtract}
 * @function
 */
var mat4_sub = mat4_subtract;
;// ./node_modules/gl-matrix/esm/vec3.js


/**
 * 3 Dimensional Vector
 * @module vec3
 */

/**
 * Creates a new, empty vec3
 *
 * @returns {vec3} a new 3D vector
 */
function vec3_create() {
  var out = new ARRAY_TYPE(3);
  if (ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
  }
  return out;
}

/**
 * Creates a new vec3 initialized with values from an existing vector
 *
 * @param {ReadonlyVec3} a vector to clone
 * @returns {vec3} a new 3D vector
 */
function vec3_clone(a) {
  var out = new ARRAY_TYPE(3);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  return out;
}

/**
 * Calculates the length of a vec3
 *
 * @param {ReadonlyVec3} a vector to calculate length of
 * @returns {Number} length of a
 */
function vec3_length(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  return Math.sqrt(x * x + y * y + z * z);
}

/**
 * Creates a new vec3 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} a new 3D vector
 */
function vec3_fromValues(x, y, z) {
  var out = new ARRAY_TYPE(3);
  out[0] = x;
  out[1] = y;
  out[2] = z;
  return out;
}

/**
 * Copy the values from one vec3 to another
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the source vector
 * @returns {vec3} out
 */
function vec3_copy(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  return out;
}

/**
 * Set the components of a vec3 to the given values
 *
 * @param {vec3} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} out
 */
function vec3_set(out, x, y, z) {
  out[0] = x;
  out[1] = y;
  out[2] = z;
  return out;
}

/**
 * Adds two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */
function vec3_add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  return out;
}

/**
 * Subtracts vector b from vector a
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */
function vec3_subtract(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  return out;
}

/**
 * Multiplies two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */
function vec3_multiply(out, a, b) {
  out[0] = a[0] * b[0];
  out[1] = a[1] * b[1];
  out[2] = a[2] * b[2];
  return out;
}

/**
 * Divides two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */
function divide(out, a, b) {
  out[0] = a[0] / b[0];
  out[1] = a[1] / b[1];
  out[2] = a[2] / b[2];
  return out;
}

/**
 * Math.ceil the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to ceil
 * @returns {vec3} out
 */
function ceil(out, a) {
  out[0] = Math.ceil(a[0]);
  out[1] = Math.ceil(a[1]);
  out[2] = Math.ceil(a[2]);
  return out;
}

/**
 * Math.floor the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to floor
 * @returns {vec3} out
 */
function floor(out, a) {
  out[0] = Math.floor(a[0]);
  out[1] = Math.floor(a[1]);
  out[2] = Math.floor(a[2]);
  return out;
}

/**
 * Returns the minimum of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */
function min(out, a, b) {
  out[0] = Math.min(a[0], b[0]);
  out[1] = Math.min(a[1], b[1]);
  out[2] = Math.min(a[2], b[2]);
  return out;
}

/**
 * Returns the maximum of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */
function max(out, a, b) {
  out[0] = Math.max(a[0], b[0]);
  out[1] = Math.max(a[1], b[1]);
  out[2] = Math.max(a[2], b[2]);
  return out;
}

/**
 * symmetric round the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to round
 * @returns {vec3} out
 */
function vec3_round(out, a) {
  out[0] = round(a[0]);
  out[1] = round(a[1]);
  out[2] = round(a[2]);
  return out;
}

/**
 * Scales a vec3 by a scalar number
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec3} out
 */
function vec3_scale(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  return out;
}

/**
 * Adds two vec3's after scaling the second operand by a scalar value
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec3} out
 */
function scaleAndAdd(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  out[2] = a[2] + b[2] * scale;
  return out;
}

/**
 * Calculates the euclidian distance between two vec3's
 *
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {Number} distance between a and b
 */
function distance(a, b) {
  var x = b[0] - a[0];
  var y = b[1] - a[1];
  var z = b[2] - a[2];
  return Math.sqrt(x * x + y * y + z * z);
}

/**
 * Calculates the squared euclidian distance between two vec3's
 *
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {Number} squared distance between a and b
 */
function squaredDistance(a, b) {
  var x = b[0] - a[0];
  var y = b[1] - a[1];
  var z = b[2] - a[2];
  return x * x + y * y + z * z;
}

/**
 * Calculates the squared length of a vec3
 *
 * @param {ReadonlyVec3} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */
function squaredLength(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  return x * x + y * y + z * z;
}

/**
 * Negates the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to negate
 * @returns {vec3} out
 */
function negate(out, a) {
  out[0] = -a[0];
  out[1] = -a[1];
  out[2] = -a[2];
  return out;
}

/**
 * Returns the inverse of the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to invert
 * @returns {vec3} out
 */
function inverse(out, a) {
  out[0] = 1.0 / a[0];
  out[1] = 1.0 / a[1];
  out[2] = 1.0 / a[2];
  return out;
}

/**
 * Normalize a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to normalize
 * @returns {vec3} out
 */
function normalize(out, a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var len = x * x + y * y + z * z;
  if (len > 0) {
    //TODO: evaluate use of glm_invsqrt here?
    len = 1 / Math.sqrt(len);
  }
  out[0] = a[0] * len;
  out[1] = a[1] * len;
  out[2] = a[2] * len;
  return out;
}

/**
 * Calculates the dot product of two vec3's
 *
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {Number} dot product of a and b
 */
function vec3_dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/**
 * Computes the cross product of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */
function cross(out, a, b) {
  var ax = a[0],
    ay = a[1],
    az = a[2];
  var bx = b[0],
    by = b[1],
    bz = b[2];
  out[0] = ay * bz - az * by;
  out[1] = az * bx - ax * bz;
  out[2] = ax * by - ay * bx;
  return out;
}

/**
 * Performs a linear interpolation between two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {vec3} out
 */
function lerp(out, a, b, t) {
  var ax = a[0];
  var ay = a[1];
  var az = a[2];
  out[0] = ax + t * (b[0] - ax);
  out[1] = ay + t * (b[1] - ay);
  out[2] = az + t * (b[2] - az);
  return out;
}

/**
 * Performs a spherical linear interpolation between two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {vec3} out
 */
function slerp(out, a, b, t) {
  var angle = Math.acos(Math.min(Math.max(vec3_dot(a, b), -1), 1));
  var sinTotal = Math.sin(angle);
  var ratioA = Math.sin((1 - t) * angle) / sinTotal;
  var ratioB = Math.sin(t * angle) / sinTotal;
  out[0] = ratioA * a[0] + ratioB * b[0];
  out[1] = ratioA * a[1] + ratioB * b[1];
  out[2] = ratioA * a[2] + ratioB * b[2];
  return out;
}

/**
 * Performs a hermite interpolation with two control points
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @param {ReadonlyVec3} c the third operand
 * @param {ReadonlyVec3} d the fourth operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {vec3} out
 */
function hermite(out, a, b, c, d, t) {
  var factorTimes2 = t * t;
  var factor1 = factorTimes2 * (2 * t - 3) + 1;
  var factor2 = factorTimes2 * (t - 2) + t;
  var factor3 = factorTimes2 * (t - 1);
  var factor4 = factorTimes2 * (3 - 2 * t);
  out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
  out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
  out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;
  return out;
}

/**
 * Performs a bezier interpolation with two control points
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @param {ReadonlyVec3} c the third operand
 * @param {ReadonlyVec3} d the fourth operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {vec3} out
 */
function bezier(out, a, b, c, d, t) {
  var inverseFactor = 1 - t;
  var inverseFactorTimesTwo = inverseFactor * inverseFactor;
  var factorTimes2 = t * t;
  var factor1 = inverseFactorTimesTwo * inverseFactor;
  var factor2 = 3 * t * inverseFactorTimesTwo;
  var factor3 = 3 * factorTimes2 * inverseFactor;
  var factor4 = factorTimes2 * t;
  out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
  out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
  out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;
  return out;
}

/**
 * Generates a random vector with the given scale
 *
 * @param {vec3} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If omitted, a unit vector will be returned
 * @returns {vec3} out
 */
function random(out, scale) {
  scale = scale === undefined ? 1.0 : scale;
  var r = RANDOM() * 2.0 * Math.PI;
  var z = RANDOM() * 2.0 - 1.0;
  var zScale = Math.sqrt(1.0 - z * z) * scale;
  out[0] = Math.cos(r) * zScale;
  out[1] = Math.sin(r) * zScale;
  out[2] = z * scale;
  return out;
}

/**
 * Transforms the vec3 with a mat4.
 * 4th vector component is implicitly '1'
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the vector to transform
 * @param {ReadonlyMat4} m matrix to transform with
 * @returns {vec3} out
 */
function transformMat4(out, a, m) {
  var x = a[0],
    y = a[1],
    z = a[2];
  var w = m[3] * x + m[7] * y + m[11] * z + m[15];
  w = w || 1.0;
  out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
  out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
  out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
  return out;
}

/**
 * Transforms the vec3 with a mat3.
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the vector to transform
 * @param {ReadonlyMat3} m the 3x3 matrix to transform with
 * @returns {vec3} out
 */
function transformMat3(out, a, m) {
  var x = a[0],
    y = a[1],
    z = a[2];
  out[0] = x * m[0] + y * m[3] + z * m[6];
  out[1] = x * m[1] + y * m[4] + z * m[7];
  out[2] = x * m[2] + y * m[5] + z * m[8];
  return out;
}

/**
 * Transforms the vec3 with a quat
 * Can also be used for dual quaternions. (Multiply it with the real part)
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the vector to transform
 * @param {ReadonlyQuat} q normalized quaternion to transform with
 * @returns {vec3} out
 */
function transformQuat(out, a, q) {
  // Fast Vector Rotation using Quaternions by Robert Eisele
  // https://raw.org/proof/vector-rotation-using-quaternions/

  var qx = q[0],
    qy = q[1],
    qz = q[2],
    qw = q[3];
  var vx = a[0],
    vy = a[1],
    vz = a[2];

  // t = q x v
  var tx = qy * vz - qz * vy;
  var ty = qz * vx - qx * vz;
  var tz = qx * vy - qy * vx;

  // t = 2t
  tx = tx + tx;
  ty = ty + ty;
  tz = tz + tz;

  // v + w t + q x t
  out[0] = vx + qw * tx + qy * tz - qz * ty;
  out[1] = vy + qw * ty + qz * tx - qx * tz;
  out[2] = vz + qw * tz + qx * ty - qy * tx;
  return out;
}

/**
 * Rotate a 3D vector around the x-axis
 * @param {vec3} out The receiving vec3
 * @param {ReadonlyVec3} a The vec3 point to rotate
 * @param {ReadonlyVec3} b The origin of the rotation
 * @param {Number} rad The angle of rotation in radians
 * @returns {vec3} out
 */
function vec3_rotateX(out, a, b, rad) {
  var p = [],
    r = [];
  //Translate point to the origin
  p[0] = a[0] - b[0];
  p[1] = a[1] - b[1];
  p[2] = a[2] - b[2];

  //perform rotation
  r[0] = p[0];
  r[1] = p[1] * Math.cos(rad) - p[2] * Math.sin(rad);
  r[2] = p[1] * Math.sin(rad) + p[2] * Math.cos(rad);

  //translate to correct position
  out[0] = r[0] + b[0];
  out[1] = r[1] + b[1];
  out[2] = r[2] + b[2];
  return out;
}

/**
 * Rotate a 3D vector around the y-axis
 * @param {vec3} out The receiving vec3
 * @param {ReadonlyVec3} a The vec3 point to rotate
 * @param {ReadonlyVec3} b The origin of the rotation
 * @param {Number} rad The angle of rotation in radians
 * @returns {vec3} out
 */
function vec3_rotateY(out, a, b, rad) {
  var p = [],
    r = [];
  //Translate point to the origin
  p[0] = a[0] - b[0];
  p[1] = a[1] - b[1];
  p[2] = a[2] - b[2];

  //perform rotation
  r[0] = p[2] * Math.sin(rad) + p[0] * Math.cos(rad);
  r[1] = p[1];
  r[2] = p[2] * Math.cos(rad) - p[0] * Math.sin(rad);

  //translate to correct position
  out[0] = r[0] + b[0];
  out[1] = r[1] + b[1];
  out[2] = r[2] + b[2];
  return out;
}

/**
 * Rotate a 3D vector around the z-axis
 * @param {vec3} out The receiving vec3
 * @param {ReadonlyVec3} a The vec3 point to rotate
 * @param {ReadonlyVec3} b The origin of the rotation
 * @param {Number} rad The angle of rotation in radians
 * @returns {vec3} out
 */
function vec3_rotateZ(out, a, b, rad) {
  var p = [],
    r = [];
  //Translate point to the origin
  p[0] = a[0] - b[0];
  p[1] = a[1] - b[1];
  p[2] = a[2] - b[2];

  //perform rotation
  r[0] = p[0] * Math.cos(rad) - p[1] * Math.sin(rad);
  r[1] = p[0] * Math.sin(rad) + p[1] * Math.cos(rad);
  r[2] = p[2];

  //translate to correct position
  out[0] = r[0] + b[0];
  out[1] = r[1] + b[1];
  out[2] = r[2] + b[2];
  return out;
}

/**
 * Get the angle between two 3D vectors
 * @param {ReadonlyVec3} a The first operand
 * @param {ReadonlyVec3} b The second operand
 * @returns {Number} The angle in radians
 */
function angle(a, b) {
  var ax = a[0],
    ay = a[1],
    az = a[2],
    bx = b[0],
    by = b[1],
    bz = b[2],
    mag = Math.sqrt((ax * ax + ay * ay + az * az) * (bx * bx + by * by + bz * bz)),
    cosine = mag && vec3_dot(a, b) / mag;
  return Math.acos(Math.min(Math.max(cosine, -1), 1));
}

/**
 * Set the components of a vec3 to zero
 *
 * @param {vec3} out the receiving vector
 * @returns {vec3} out
 */
function zero(out) {
  out[0] = 0.0;
  out[1] = 0.0;
  out[2] = 0.0;
  return out;
}

/**
 * Returns a string representation of a vector
 *
 * @param {ReadonlyVec3} a vector to represent as a string
 * @returns {String} string representation of the vector
 */
function vec3_str(a) {
  return "vec3(" + a[0] + ", " + a[1] + ", " + a[2] + ")";
}

/**
 * Returns whether or not the vectors have exactly the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyVec3} a The first vector.
 * @param {ReadonlyVec3} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
function vec3_exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

/**
 * Returns whether or not the vectors have approximately the same elements in the same position.
 *
 * @param {ReadonlyVec3} a The first vector.
 * @param {ReadonlyVec3} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
function vec3_equals(a, b) {
  var a0 = a[0],
    a1 = a[1],
    a2 = a[2];
  var b0 = b[0],
    b1 = b[1],
    b2 = b[2];
  return Math.abs(a0 - b0) <= EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2));
}

/**
 * Alias for {@link vec3.subtract}
 * @function
 */
var vec3_sub = vec3_subtract;

/**
 * Alias for {@link vec3.multiply}
 * @function
 */
var vec3_mul = vec3_multiply;

/**
 * Alias for {@link vec3.divide}
 * @function
 */
var div = divide;

/**
 * Alias for {@link vec3.distance}
 * @function
 */
var dist = distance;

/**
 * Alias for {@link vec3.squaredDistance}
 * @function
 */
var sqrDist = squaredDistance;

/**
 * Alias for {@link vec3.length}
 * @function
 */
var len = vec3_length;

/**
 * Alias for {@link vec3.squaredLength}
 * @function
 */
var sqrLen = squaredLength;

/**
 * Perform some operation over an array of vec3s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
var forEach = function () {
  var vec = vec3_create();
  return function (a, stride, offset, count, fn, arg) {
    var i, l;
    if (!stride) {
      stride = 3;
    }
    if (!offset) {
      offset = 0;
    }
    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }
    for (i = offset; i < l; i += stride) {
      vec[0] = a[i];
      vec[1] = a[i + 1];
      vec[2] = a[i + 2];
      fn(vec, vec, arg);
      a[i] = vec[0];
      a[i + 1] = vec[1];
      a[i + 2] = vec[2];
    }
    return a;
  };
}();
;// ./node_modules/gl-matrix/esm/vec4.js


/**
 * 4 Dimensional Vector
 * @module vec4
 */

/**
 * Creates a new, empty vec4
 *
 * @returns {vec4} a new 4D vector
 */
function vec4_create() {
  var out = new ARRAY_TYPE(4);
  if (ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
  }
  return out;
}

/**
 * Creates a new vec4 initialized with values from an existing vector
 *
 * @param {ReadonlyVec4} a vector to clone
 * @returns {vec4} a new 4D vector
 */
function vec4_clone(a) {
  var out = new ARRAY_TYPE(4);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  return out;
}

/**
 * Creates a new vec4 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {vec4} a new 4D vector
 */
function vec4_fromValues(x, y, z, w) {
  var out = new ARRAY_TYPE(4);
  out[0] = x;
  out[1] = y;
  out[2] = z;
  out[3] = w;
  return out;
}

/**
 * Copy the values from one vec4 to another
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the source vector
 * @returns {vec4} out
 */
function vec4_copy(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  return out;
}

/**
 * Set the components of a vec4 to the given values
 *
 * @param {vec4} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {vec4} out
 */
function vec4_set(out, x, y, z, w) {
  out[0] = x;
  out[1] = y;
  out[2] = z;
  out[3] = w;
  return out;
}

/**
 * Adds two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {vec4} out
 */
function vec4_add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  out[3] = a[3] + b[3];
  return out;
}

/**
 * Subtracts vector b from vector a
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {vec4} out
 */
function vec4_subtract(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  out[3] = a[3] - b[3];
  return out;
}

/**
 * Multiplies two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {vec4} out
 */
function vec4_multiply(out, a, b) {
  out[0] = a[0] * b[0];
  out[1] = a[1] * b[1];
  out[2] = a[2] * b[2];
  out[3] = a[3] * b[3];
  return out;
}

/**
 * Divides two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {vec4} out
 */
function vec4_divide(out, a, b) {
  out[0] = a[0] / b[0];
  out[1] = a[1] / b[1];
  out[2] = a[2] / b[2];
  out[3] = a[3] / b[3];
  return out;
}

/**
 * Math.ceil the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to ceil
 * @returns {vec4} out
 */
function vec4_ceil(out, a) {
  out[0] = Math.ceil(a[0]);
  out[1] = Math.ceil(a[1]);
  out[2] = Math.ceil(a[2]);
  out[3] = Math.ceil(a[3]);
  return out;
}

/**
 * Math.floor the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to floor
 * @returns {vec4} out
 */
function vec4_floor(out, a) {
  out[0] = Math.floor(a[0]);
  out[1] = Math.floor(a[1]);
  out[2] = Math.floor(a[2]);
  out[3] = Math.floor(a[3]);
  return out;
}

/**
 * Returns the minimum of two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {vec4} out
 */
function vec4_min(out, a, b) {
  out[0] = Math.min(a[0], b[0]);
  out[1] = Math.min(a[1], b[1]);
  out[2] = Math.min(a[2], b[2]);
  out[3] = Math.min(a[3], b[3]);
  return out;
}

/**
 * Returns the maximum of two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {vec4} out
 */
function vec4_max(out, a, b) {
  out[0] = Math.max(a[0], b[0]);
  out[1] = Math.max(a[1], b[1]);
  out[2] = Math.max(a[2], b[2]);
  out[3] = Math.max(a[3], b[3]);
  return out;
}

/**
 * symmetric round the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to round
 * @returns {vec4} out
 */
function vec4_round(out, a) {
  out[0] = round(a[0]);
  out[1] = round(a[1]);
  out[2] = round(a[2]);
  out[3] = round(a[3]);
  return out;
}

/**
 * Scales a vec4 by a scalar number
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec4} out
 */
function vec4_scale(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  out[3] = a[3] * b;
  return out;
}

/**
 * Adds two vec4's after scaling the second operand by a scalar value
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec4} out
 */
function vec4_scaleAndAdd(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  out[2] = a[2] + b[2] * scale;
  out[3] = a[3] + b[3] * scale;
  return out;
}

/**
 * Calculates the euclidian distance between two vec4's
 *
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {Number} distance between a and b
 */
function vec4_distance(a, b) {
  var x = b[0] - a[0];
  var y = b[1] - a[1];
  var z = b[2] - a[2];
  var w = b[3] - a[3];
  return Math.sqrt(x * x + y * y + z * z + w * w);
}

/**
 * Calculates the squared euclidian distance between two vec4's
 *
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {Number} squared distance between a and b
 */
function vec4_squaredDistance(a, b) {
  var x = b[0] - a[0];
  var y = b[1] - a[1];
  var z = b[2] - a[2];
  var w = b[3] - a[3];
  return x * x + y * y + z * z + w * w;
}

/**
 * Calculates the length of a vec4
 *
 * @param {ReadonlyVec4} a vector to calculate length of
 * @returns {Number} length of a
 */
function vec4_length(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var w = a[3];
  return Math.sqrt(x * x + y * y + z * z + w * w);
}

/**
 * Calculates the squared length of a vec4
 *
 * @param {ReadonlyVec4} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */
function vec4_squaredLength(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var w = a[3];
  return x * x + y * y + z * z + w * w;
}

/**
 * Negates the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to negate
 * @returns {vec4} out
 */
function vec4_negate(out, a) {
  out[0] = -a[0];
  out[1] = -a[1];
  out[2] = -a[2];
  out[3] = -a[3];
  return out;
}

/**
 * Returns the inverse of the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to invert
 * @returns {vec4} out
 */
function vec4_inverse(out, a) {
  out[0] = 1.0 / a[0];
  out[1] = 1.0 / a[1];
  out[2] = 1.0 / a[2];
  out[3] = 1.0 / a[3];
  return out;
}

/**
 * Normalize a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to normalize
 * @returns {vec4} out
 */
function vec4_normalize(out, a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var w = a[3];
  var len = x * x + y * y + z * z + w * w;
  if (len > 0) {
    len = 1 / Math.sqrt(len);
  }
  out[0] = x * len;
  out[1] = y * len;
  out[2] = z * len;
  out[3] = w * len;
  return out;
}

/**
 * Calculates the dot product of two vec4's
 *
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {Number} dot product of a and b
 */
function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
}

/**
 * Returns the cross-product of three vectors in a 4-dimensional space
 *
 * @param {ReadonlyVec4} out the receiving vector
 * @param {ReadonlyVec4} u the first vector
 * @param {ReadonlyVec4} v the second vector
 * @param {ReadonlyVec4} w the third vector
 * @returns {vec4} result
 */
function vec4_cross(out, u, v, w) {
  var A = v[0] * w[1] - v[1] * w[0],
    B = v[0] * w[2] - v[2] * w[0],
    C = v[0] * w[3] - v[3] * w[0],
    D = v[1] * w[2] - v[2] * w[1],
    E = v[1] * w[3] - v[3] * w[1],
    F = v[2] * w[3] - v[3] * w[2];
  var G = u[0];
  var H = u[1];
  var I = u[2];
  var J = u[3];
  out[0] = H * F - I * E + J * D;
  out[1] = -(G * F) + I * C - J * B;
  out[2] = G * E - H * C + J * A;
  out[3] = -(G * D) + H * B - I * A;
  return out;
}

/**
 * Performs a linear interpolation between two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {vec4} out
 */
function vec4_lerp(out, a, b, t) {
  var ax = a[0];
  var ay = a[1];
  var az = a[2];
  var aw = a[3];
  out[0] = ax + t * (b[0] - ax);
  out[1] = ay + t * (b[1] - ay);
  out[2] = az + t * (b[2] - az);
  out[3] = aw + t * (b[3] - aw);
  return out;
}

/**
 * Generates a random vector with the given scale
 *
 * @param {vec4} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If omitted, a unit vector will be returned
 * @returns {vec4} out
 */
function vec4_random(out, scale) {
  scale = scale === undefined ? 1.0 : scale;

  // Marsaglia, George. Choosing a Point from the Surface of a
  // Sphere. Ann. Math. Statist. 43 (1972), no. 2, 645--646.
  // http://projecteuclid.org/euclid.aoms/1177692644;
  var v1, v2, v3, v4;
  var s1, s2;
  var rand;
  rand = RANDOM();
  v1 = rand * 2 - 1;
  v2 = (4 * RANDOM() - 2) * Math.sqrt(rand * -rand + rand);
  s1 = v1 * v1 + v2 * v2;
  rand = RANDOM();
  v3 = rand * 2 - 1;
  v4 = (4 * RANDOM() - 2) * Math.sqrt(rand * -rand + rand);
  s2 = v3 * v3 + v4 * v4;
  var d = Math.sqrt((1 - s1) / s2);
  out[0] = scale * v1;
  out[1] = scale * v2;
  out[2] = scale * v3 * d;
  out[3] = scale * v4 * d;
  return out;
}

/**
 * Transforms the vec4 with a mat4.
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the vector to transform
 * @param {ReadonlyMat4} m matrix to transform with
 * @returns {vec4} out
 */
function vec4_transformMat4(out, a, m) {
  var x = a[0],
    y = a[1],
    z = a[2],
    w = a[3];
  out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
  out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
  out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
  out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
  return out;
}

/**
 * Transforms the vec4 with a quat
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the vector to transform
 * @param {ReadonlyQuat} q normalized quaternion to transform with
 * @returns {vec4} out
 */
function vec4_transformQuat(out, a, q) {
  // Fast Vector Rotation using Quaternions by Robert Eisele
  // https://raw.org/proof/vector-rotation-using-quaternions/

  var qx = q[0],
    qy = q[1],
    qz = q[2],
    qw = q[3];
  var vx = a[0],
    vy = a[1],
    vz = a[2];

  // t = q x v
  var tx = qy * vz - qz * vy;
  var ty = qz * vx - qx * vz;
  var tz = qx * vy - qy * vx;

  // t = 2t
  tx = tx + tx;
  ty = ty + ty;
  tz = tz + tz;

  // v + w t + q x t
  out[0] = vx + qw * tx + qy * tz - qz * ty;
  out[1] = vy + qw * ty + qz * tx - qx * tz;
  out[2] = vz + qw * tz + qx * ty - qy * tx;
  out[3] = a[3];
  return out;
}

/**
 * Set the components of a vec4 to zero
 *
 * @param {vec4} out the receiving vector
 * @returns {vec4} out
 */
function vec4_zero(out) {
  out[0] = 0.0;
  out[1] = 0.0;
  out[2] = 0.0;
  out[3] = 0.0;
  return out;
}

/**
 * Returns a string representation of a vector
 *
 * @param {ReadonlyVec4} a vector to represent as a string
 * @returns {String} string representation of the vector
 */
function vec4_str(a) {
  return "vec4(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ")";
}

/**
 * Returns whether or not the vectors have exactly the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyVec4} a The first vector.
 * @param {ReadonlyVec4} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
function vec4_exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}

/**
 * Returns whether or not the vectors have approximately the same elements in the same position.
 *
 * @param {ReadonlyVec4} a The first vector.
 * @param {ReadonlyVec4} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
function vec4_equals(a, b) {
  var a0 = a[0],
    a1 = a[1],
    a2 = a[2],
    a3 = a[3];
  var b0 = b[0],
    b1 = b[1],
    b2 = b[2],
    b3 = b[3];
  return Math.abs(a0 - b0) <= EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3));
}

/**
 * Alias for {@link vec4.subtract}
 * @function
 */
var vec4_sub = vec4_subtract;

/**
 * Alias for {@link vec4.multiply}
 * @function
 */
var vec4_mul = vec4_multiply;

/**
 * Alias for {@link vec4.divide}
 * @function
 */
var vec4_div = vec4_divide;

/**
 * Alias for {@link vec4.distance}
 * @function
 */
var vec4_dist = vec4_distance;

/**
 * Alias for {@link vec4.squaredDistance}
 * @function
 */
var vec4_sqrDist = vec4_squaredDistance;

/**
 * Alias for {@link vec4.length}
 * @function
 */
var vec4_len = vec4_length;

/**
 * Alias for {@link vec4.squaredLength}
 * @function
 */
var vec4_sqrLen = vec4_squaredLength;

/**
 * Perform some operation over an array of vec4s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec4. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec4s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
var vec4_forEach = function () {
  var vec = vec4_create();
  return function (a, stride, offset, count, fn, arg) {
    var i, l;
    if (!stride) {
      stride = 4;
    }
    if (!offset) {
      offset = 0;
    }
    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }
    for (i = offset; i < l; i += stride) {
      vec[0] = a[i];
      vec[1] = a[i + 1];
      vec[2] = a[i + 2];
      vec[3] = a[i + 3];
      fn(vec, vec, arg);
      a[i] = vec[0];
      a[i + 1] = vec[1];
      a[i + 2] = vec[2];
      a[i + 3] = vec[3];
    }
    return a;
  };
}();
;// ./node_modules/gl-matrix/esm/quat.js





/**
 * Quaternion in the format XYZW
 * @module quat
 */

/**
 * Creates a new identity quat
 *
 * @returns {quat} a new quaternion
 */
function quat_create() {
  var out = new ARRAY_TYPE(4);
  if (ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
  }
  out[3] = 1;
  return out;
}

/**
 * Set a quat to the identity quaternion
 *
 * @param {quat} out the receiving quaternion
 * @returns {quat} out
 */
function quat_identity(out) {
  out[0] = 0;
  out[1] = 0;
  out[2] = 0;
  out[3] = 1;
  return out;
}

/**
 * Sets a quat from the given angle and rotation axis,
 * then returns it.
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyVec3} axis the axis around which to rotate
 * @param {Number} rad the angle in radians
 * @returns {quat} out
 **/
function setAxisAngle(out, axis, rad) {
  rad = rad * 0.5;
  var s = Math.sin(rad);
  out[0] = s * axis[0];
  out[1] = s * axis[1];
  out[2] = s * axis[2];
  out[3] = Math.cos(rad);
  return out;
}

/**
 * Gets the rotation axis and angle for a given
 *  quaternion. If a quaternion is created with
 *  setAxisAngle, this method will return the same
 *  values as providied in the original parameter list
 *  OR functionally equivalent values.
 * Example: The quaternion formed by axis [0, 0, 1] and
 *  angle -90 is the same as the quaternion formed by
 *  [0, 0, 1] and 270. This method favors the latter.
 * @param  {vec3} out_axis  Vector receiving the axis of rotation
 * @param  {ReadonlyQuat} q     Quaternion to be decomposed
 * @return {Number}     Angle, in radians, of the rotation
 */
function getAxisAngle(out_axis, q) {
  var rad = Math.acos(q[3]) * 2.0;
  var s = Math.sin(rad / 2.0);
  if (s > EPSILON) {
    out_axis[0] = q[0] / s;
    out_axis[1] = q[1] / s;
    out_axis[2] = q[2] / s;
  } else {
    // If s is zero, return any axis (no rotation - axis does not matter)
    out_axis[0] = 1;
    out_axis[1] = 0;
    out_axis[2] = 0;
  }
  return rad;
}

/**
 * Gets the angular distance between two unit quaternions
 *
 * @param  {ReadonlyQuat} a     Origin unit quaternion
 * @param  {ReadonlyQuat} b     Destination unit quaternion
 * @return {Number}     Angle, in radians, between the two quaternions
 */
function getAngle(a, b) {
  var dotproduct = quat_dot(a, b);
  return Math.acos(2 * dotproduct * dotproduct - 1);
}

/**
 * Multiplies two quat's
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a the first operand
 * @param {ReadonlyQuat} b the second operand
 * @returns {quat} out
 */
function quat_multiply(out, a, b) {
  var ax = a[0],
    ay = a[1],
    az = a[2],
    aw = a[3];
  var bx = b[0],
    by = b[1],
    bz = b[2],
    bw = b[3];
  out[0] = ax * bw + aw * bx + ay * bz - az * by;
  out[1] = ay * bw + aw * by + az * bx - ax * bz;
  out[2] = az * bw + aw * bz + ax * by - ay * bx;
  out[3] = aw * bw - ax * bx - ay * by - az * bz;
  return out;
}

/**
 * Rotates a quaternion by the given angle about the X axis
 *
 * @param {quat} out quat receiving operation result
 * @param {ReadonlyQuat} a quat to rotate
 * @param {number} rad angle (in radians) to rotate
 * @returns {quat} out
 */
function quat_rotateX(out, a, rad) {
  rad *= 0.5;
  var ax = a[0],
    ay = a[1],
    az = a[2],
    aw = a[3];
  var bx = Math.sin(rad),
    bw = Math.cos(rad);
  out[0] = ax * bw + aw * bx;
  out[1] = ay * bw + az * bx;
  out[2] = az * bw - ay * bx;
  out[3] = aw * bw - ax * bx;
  return out;
}

/**
 * Rotates a quaternion by the given angle about the Y axis
 *
 * @param {quat} out quat receiving operation result
 * @param {ReadonlyQuat} a quat to rotate
 * @param {number} rad angle (in radians) to rotate
 * @returns {quat} out
 */
function quat_rotateY(out, a, rad) {
  rad *= 0.5;
  var ax = a[0],
    ay = a[1],
    az = a[2],
    aw = a[3];
  var by = Math.sin(rad),
    bw = Math.cos(rad);
  out[0] = ax * bw - az * by;
  out[1] = ay * bw + aw * by;
  out[2] = az * bw + ax * by;
  out[3] = aw * bw - ay * by;
  return out;
}

/**
 * Rotates a quaternion by the given angle about the Z axis
 *
 * @param {quat} out quat receiving operation result
 * @param {ReadonlyQuat} a quat to rotate
 * @param {number} rad angle (in radians) to rotate
 * @returns {quat} out
 */
function quat_rotateZ(out, a, rad) {
  rad *= 0.5;
  var ax = a[0],
    ay = a[1],
    az = a[2],
    aw = a[3];
  var bz = Math.sin(rad),
    bw = Math.cos(rad);
  out[0] = ax * bw + ay * bz;
  out[1] = ay * bw - ax * bz;
  out[2] = az * bw + aw * bz;
  out[3] = aw * bw - az * bz;
  return out;
}

/**
 * Calculates the W component of a quat from the X, Y, and Z components.
 * Assumes that quaternion is 1 unit in length.
 * Any existing W component will be ignored.
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a quat to calculate W component of
 * @returns {quat} out
 */
function calculateW(out, a) {
  var x = a[0],
    y = a[1],
    z = a[2];
  out[0] = x;
  out[1] = y;
  out[2] = z;
  out[3] = Math.sqrt(Math.abs(1.0 - x * x - y * y - z * z));
  return out;
}

/**
 * Calculate the exponential of a unit quaternion.
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a quat to calculate the exponential of
 * @returns {quat} out
 */
function exp(out, a) {
  var x = a[0],
    y = a[1],
    z = a[2],
    w = a[3];
  var r = Math.sqrt(x * x + y * y + z * z);
  var et = Math.exp(w);
  var s = r > 0 ? et * Math.sin(r) / r : 0;
  out[0] = x * s;
  out[1] = y * s;
  out[2] = z * s;
  out[3] = et * Math.cos(r);
  return out;
}

/**
 * Calculate the natural logarithm of a unit quaternion.
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a quat to calculate the exponential of
 * @returns {quat} out
 */
function ln(out, a) {
  var x = a[0],
    y = a[1],
    z = a[2],
    w = a[3];
  var r = Math.sqrt(x * x + y * y + z * z);
  var t = r > 0 ? Math.atan2(r, w) / r : 0;
  out[0] = x * t;
  out[1] = y * t;
  out[2] = z * t;
  out[3] = 0.5 * Math.log(x * x + y * y + z * z + w * w);
  return out;
}

/**
 * Calculate the scalar power of a unit quaternion.
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a quat to calculate the exponential of
 * @param {Number} b amount to scale the quaternion by
 * @returns {quat} out
 */
function pow(out, a, b) {
  ln(out, a);
  quat_scale(out, out, b);
  exp(out, out);
  return out;
}

/**
 * Performs a spherical linear interpolation between two quat
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a the first operand
 * @param {ReadonlyQuat} b the second operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {quat} out
 */
function quat_slerp(out, a, b, t) {
  // benchmarks:
  //    http://jsperf.com/quaternion-slerp-implementations
  var ax = a[0],
    ay = a[1],
    az = a[2],
    aw = a[3];
  var bx = b[0],
    by = b[1],
    bz = b[2],
    bw = b[3];
  var omega, cosom, sinom, scale0, scale1;

  // calc cosine
  cosom = ax * bx + ay * by + az * bz + aw * bw;
  // adjust signs (if necessary)
  if (cosom < 0.0) {
    cosom = -cosom;
    bx = -bx;
    by = -by;
    bz = -bz;
    bw = -bw;
  }
  // calculate coefficients
  if (1.0 - cosom > EPSILON) {
    // standard case (slerp)
    omega = Math.acos(cosom);
    sinom = Math.sin(omega);
    scale0 = Math.sin((1.0 - t) * omega) / sinom;
    scale1 = Math.sin(t * omega) / sinom;
  } else {
    // "from" and "to" quaternions are very close
    //  ... so we can do a linear interpolation
    scale0 = 1.0 - t;
    scale1 = t;
  }
  // calculate final values
  out[0] = scale0 * ax + scale1 * bx;
  out[1] = scale0 * ay + scale1 * by;
  out[2] = scale0 * az + scale1 * bz;
  out[3] = scale0 * aw + scale1 * bw;
  return out;
}

/**
 * Generates a random unit quaternion
 *
 * @param {quat} out the receiving quaternion
 * @returns {quat} out
 */
function quat_random(out) {
  // Implementation of http://planning.cs.uiuc.edu/node198.html
  // TODO: Calling random 3 times is probably not the fastest solution
  var u1 = RANDOM();
  var u2 = RANDOM();
  var u3 = RANDOM();
  var sqrt1MinusU1 = Math.sqrt(1 - u1);
  var sqrtU1 = Math.sqrt(u1);
  out[0] = sqrt1MinusU1 * Math.sin(2.0 * Math.PI * u2);
  out[1] = sqrt1MinusU1 * Math.cos(2.0 * Math.PI * u2);
  out[2] = sqrtU1 * Math.sin(2.0 * Math.PI * u3);
  out[3] = sqrtU1 * Math.cos(2.0 * Math.PI * u3);
  return out;
}

/**
 * Calculates the inverse of a quat
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a quat to calculate inverse of
 * @returns {quat} out
 */
function quat_invert(out, a) {
  var a0 = a[0],
    a1 = a[1],
    a2 = a[2],
    a3 = a[3];
  var dot = a0 * a0 + a1 * a1 + a2 * a2 + a3 * a3;
  var invDot = dot ? 1.0 / dot : 0;

  // TODO: Would be faster to return [0,0,0,0] immediately if dot == 0

  out[0] = -a0 * invDot;
  out[1] = -a1 * invDot;
  out[2] = -a2 * invDot;
  out[3] = a3 * invDot;
  return out;
}

/**
 * Calculates the conjugate of a quat
 * If the quaternion is normalized, this function is faster than quat.inverse and produces the same result.
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a quat to calculate conjugate of
 * @returns {quat} out
 */
function conjugate(out, a) {
  out[0] = -a[0];
  out[1] = -a[1];
  out[2] = -a[2];
  out[3] = a[3];
  return out;
}

/**
 * Creates a quaternion from the given 3x3 rotation matrix.
 *
 * NOTE: The resultant quaternion is not normalized, so you should be sure
 * to renormalize the quaternion yourself where necessary.
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyMat3} m rotation matrix
 * @returns {quat} out
 * @function
 */
function fromMat3(out, m) {
  // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
  // article "Quaternion Calculus and Fast Animation".
  var fTrace = m[0] + m[4] + m[8];
  var fRoot;
  if (fTrace > 0.0) {
    // |w| > 1/2, may as well choose w > 1/2
    fRoot = Math.sqrt(fTrace + 1.0); // 2w
    out[3] = 0.5 * fRoot;
    fRoot = 0.5 / fRoot; // 1/(4w)
    out[0] = (m[5] - m[7]) * fRoot;
    out[1] = (m[6] - m[2]) * fRoot;
    out[2] = (m[1] - m[3]) * fRoot;
  } else {
    // |w| <= 1/2
    var i = 0;
    if (m[4] > m[0]) i = 1;
    if (m[8] > m[i * 3 + i]) i = 2;
    var j = (i + 1) % 3;
    var k = (i + 2) % 3;
    fRoot = Math.sqrt(m[i * 3 + i] - m[j * 3 + j] - m[k * 3 + k] + 1.0);
    out[i] = 0.5 * fRoot;
    fRoot = 0.5 / fRoot;
    out[3] = (m[j * 3 + k] - m[k * 3 + j]) * fRoot;
    out[j] = (m[j * 3 + i] + m[i * 3 + j]) * fRoot;
    out[k] = (m[k * 3 + i] + m[i * 3 + k]) * fRoot;
  }
  return out;
}

/**
 * Creates a quaternion from the given euler angle x, y, z using the provided intrinsic order for the conversion.
 *
 * @param {quat} out the receiving quaternion
 * @param {Number} x Angle to rotate around X axis in degrees.
 * @param {Number} y Angle to rotate around Y axis in degrees.
 * @param {Number} z Angle to rotate around Z axis in degrees.
 * @param {'xyz'|'xzy'|'yxz'|'yzx'|'zxy'|'zyx'} order Intrinsic order for conversion, default is zyx.
 * @returns {quat} out
 * @function
 */
function fromEuler(out, x, y, z) {
  var order = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : ANGLE_ORDER;
  var halfToRad = Math.PI / 360;
  x *= halfToRad;
  z *= halfToRad;
  y *= halfToRad;
  var sx = Math.sin(x);
  var cx = Math.cos(x);
  var sy = Math.sin(y);
  var cy = Math.cos(y);
  var sz = Math.sin(z);
  var cz = Math.cos(z);
  switch (order) {
    case "xyz":
      out[0] = sx * cy * cz + cx * sy * sz;
      out[1] = cx * sy * cz - sx * cy * sz;
      out[2] = cx * cy * sz + sx * sy * cz;
      out[3] = cx * cy * cz - sx * sy * sz;
      break;
    case "xzy":
      out[0] = sx * cy * cz - cx * sy * sz;
      out[1] = cx * sy * cz - sx * cy * sz;
      out[2] = cx * cy * sz + sx * sy * cz;
      out[3] = cx * cy * cz + sx * sy * sz;
      break;
    case "yxz":
      out[0] = sx * cy * cz + cx * sy * sz;
      out[1] = cx * sy * cz - sx * cy * sz;
      out[2] = cx * cy * sz - sx * sy * cz;
      out[3] = cx * cy * cz + sx * sy * sz;
      break;
    case "yzx":
      out[0] = sx * cy * cz + cx * sy * sz;
      out[1] = cx * sy * cz + sx * cy * sz;
      out[2] = cx * cy * sz - sx * sy * cz;
      out[3] = cx * cy * cz - sx * sy * sz;
      break;
    case "zxy":
      out[0] = sx * cy * cz - cx * sy * sz;
      out[1] = cx * sy * cz + sx * cy * sz;
      out[2] = cx * cy * sz + sx * sy * cz;
      out[3] = cx * cy * cz - sx * sy * sz;
      break;
    case "zyx":
      out[0] = sx * cy * cz - cx * sy * sz;
      out[1] = cx * sy * cz + sx * cy * sz;
      out[2] = cx * cy * sz - sx * sy * cz;
      out[3] = cx * cy * cz + sx * sy * sz;
      break;
    default:
      throw new Error('Unknown angle order ' + order);
  }
  return out;
}

/**
 * Returns a string representation of a quaternion
 *
 * @param {ReadonlyQuat} a vector to represent as a string
 * @returns {String} string representation of the vector
 */
function quat_str(a) {
  return "quat(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ")";
}

/**
 * Creates a new quat initialized with values from an existing quaternion
 *
 * @param {ReadonlyQuat} a quaternion to clone
 * @returns {quat} a new quaternion
 * @function
 */
var quat_clone = vec4_clone;

/**
 * Creates a new quat initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {quat} a new quaternion
 * @function
 */
var quat_fromValues = vec4_fromValues;

/**
 * Copy the values from one quat to another
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a the source quaternion
 * @returns {quat} out
 * @function
 */
var quat_copy = vec4_copy;

/**
 * Set the components of a quat to the given values
 *
 * @param {quat} out the receiving quaternion
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {quat} out
 * @function
 */
var quat_set = vec4_set;

/**
 * Adds two quat's
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a the first operand
 * @param {ReadonlyQuat} b the second operand
 * @returns {quat} out
 * @function
 */
var quat_add = vec4_add;

/**
 * Alias for {@link quat.multiply}
 * @function
 */
var quat_mul = quat_multiply;

/**
 * Scales a quat by a scalar number
 *
 * @param {quat} out the receiving vector
 * @param {ReadonlyQuat} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {quat} out
 * @function
 */
var quat_scale = vec4_scale;

/**
 * Calculates the dot product of two quat's
 *
 * @param {ReadonlyQuat} a the first operand
 * @param {ReadonlyQuat} b the second operand
 * @returns {Number} dot product of a and b
 * @function
 */
var quat_dot = dot;

/**
 * Performs a linear interpolation between two quat's
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a the first operand
 * @param {ReadonlyQuat} b the second operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {quat} out
 * @function
 */
var quat_lerp = vec4_lerp;

/**
 * Calculates the length of a quat
 *
 * @param {ReadonlyQuat} a vector to calculate length of
 * @returns {Number} length of a
 */
var quat_length = vec4_length;

/**
 * Alias for {@link quat.length}
 * @function
 */
var quat_len = quat_length;

/**
 * Calculates the squared length of a quat
 *
 * @param {ReadonlyQuat} a vector to calculate squared length of
 * @returns {Number} squared length of a
 * @function
 */
var quat_squaredLength = vec4_squaredLength;

/**
 * Alias for {@link quat.squaredLength}
 * @function
 */
var quat_sqrLen = quat_squaredLength;

/**
 * Normalize a quat
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a quaternion to normalize
 * @returns {quat} out
 * @function
 */
var quat_normalize = vec4_normalize;

/**
 * Returns whether or not the quaternions have exactly the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyQuat} a The first quaternion.
 * @param {ReadonlyQuat} b The second quaternion.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
var quat_exactEquals = vec4_exactEquals;

/**
 * Returns whether or not the quaternions point approximately to the same direction.
 *
 * Both quaternions are assumed to be unit length.
 *
 * @param {ReadonlyQuat} a The first unit quaternion.
 * @param {ReadonlyQuat} b The second unit quaternion.
 * @returns {Boolean} True if the quaternions are equal, false otherwise.
 */
function quat_equals(a, b) {
  return Math.abs(dot(a, b)) >= 1 - EPSILON;
}

/**
 * Sets a quaternion to represent the shortest rotation from one
 * vector to another.
 *
 * Both vectors are assumed to be unit length.
 *
 * @param {quat} out the receiving quaternion.
 * @param {ReadonlyVec3} a the initial vector
 * @param {ReadonlyVec3} b the destination vector
 * @returns {quat} out
 */
var rotationTo = function () {
  var tmpvec3 = vec3_create();
  var xUnitVec3 = vec3_fromValues(1, 0, 0);
  var yUnitVec3 = vec3_fromValues(0, 1, 0);
  return function (out, a, b) {
    var dot = vec3_dot(a, b);
    if (dot < -0.999999) {
      cross(tmpvec3, xUnitVec3, a);
      if (len(tmpvec3) < 0.000001) cross(tmpvec3, yUnitVec3, a);
      normalize(tmpvec3, tmpvec3);
      setAxisAngle(out, tmpvec3, Math.PI);
      return out;
    } else if (dot > 0.999999) {
      out[0] = 0;
      out[1] = 0;
      out[2] = 0;
      out[3] = 1;
      return out;
    } else {
      cross(tmpvec3, a, b);
      out[0] = tmpvec3[0];
      out[1] = tmpvec3[1];
      out[2] = tmpvec3[2];
      out[3] = 1 + dot;
      return quat_normalize(out, out);
    }
  };
}();

/**
 * Performs a spherical linear interpolation with two control points
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a the first operand
 * @param {ReadonlyQuat} b the second operand
 * @param {ReadonlyQuat} c the third operand
 * @param {ReadonlyQuat} d the fourth operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {quat} out
 */
var sqlerp = function () {
  var temp1 = quat_create();
  var temp2 = quat_create();
  return function (out, a, b, c, d, t) {
    quat_slerp(temp1, a, d, t);
    quat_slerp(temp2, b, c, t);
    quat_slerp(out, temp1, temp2, 2 * t * (1 - t));
    return out;
  };
}();

/**
 * Sets the specified quaternion with values corresponding to the given
 * axes. Each axis is a vec3 and is expected to be unit length and
 * perpendicular to all other specified axes.
 *
 * @param {ReadonlyVec3} view  the vector representing the viewing direction
 * @param {ReadonlyVec3} right the vector representing the local "right" direction
 * @param {ReadonlyVec3} up    the vector representing the local "up" direction
 * @returns {quat} out
 */
var setAxes = function () {
  var matr = mat3_create();
  return function (out, view, right, up) {
    matr[0] = right[0];
    matr[3] = right[1];
    matr[6] = right[2];
    matr[1] = up[0];
    matr[4] = up[1];
    matr[7] = up[2];
    matr[2] = -view[0];
    matr[5] = -view[1];
    matr[8] = -view[2];
    return quat_normalize(out, fromMat3(out, matr));
  };
}();
;// ./node_modules/gl-matrix/esm/quat2.js




/**
 * Dual Quaternion<br>
 * Format: [real, dual]<br>
 * Quaternion format: XYZW<br>
 * Make sure to have normalized dual quaternions, otherwise the functions may not work as intended.<br>
 * @module quat2
 */

/**
 * Creates a new identity dual quat
 *
 * @returns {quat2} a new dual quaternion [real -> rotation, dual -> translation]
 */
function quat2_create() {
  var dq = new ARRAY_TYPE(8);
  if (ARRAY_TYPE != Float32Array) {
    dq[0] = 0;
    dq[1] = 0;
    dq[2] = 0;
    dq[4] = 0;
    dq[5] = 0;
    dq[6] = 0;
    dq[7] = 0;
  }
  dq[3] = 1;
  return dq;
}

/**
 * Creates a new quat initialized with values from an existing quaternion
 *
 * @param {ReadonlyQuat2} a dual quaternion to clone
 * @returns {quat2} new dual quaternion
 * @function
 */
function quat2_clone(a) {
  var dq = new ARRAY_TYPE(8);
  dq[0] = a[0];
  dq[1] = a[1];
  dq[2] = a[2];
  dq[3] = a[3];
  dq[4] = a[4];
  dq[5] = a[5];
  dq[6] = a[6];
  dq[7] = a[7];
  return dq;
}

/**
 * Creates a new dual quat initialized with the given values
 *
 * @param {Number} x1 X component
 * @param {Number} y1 Y component
 * @param {Number} z1 Z component
 * @param {Number} w1 W component
 * @param {Number} x2 X component
 * @param {Number} y2 Y component
 * @param {Number} z2 Z component
 * @param {Number} w2 W component
 * @returns {quat2} new dual quaternion
 * @function
 */
function quat2_fromValues(x1, y1, z1, w1, x2, y2, z2, w2) {
  var dq = new ARRAY_TYPE(8);
  dq[0] = x1;
  dq[1] = y1;
  dq[2] = z1;
  dq[3] = w1;
  dq[4] = x2;
  dq[5] = y2;
  dq[6] = z2;
  dq[7] = w2;
  return dq;
}

/**
 * Creates a new dual quat from the given values (quat and translation)
 *
 * @param {Number} x1 X component
 * @param {Number} y1 Y component
 * @param {Number} z1 Z component
 * @param {Number} w1 W component
 * @param {Number} x2 X component (translation)
 * @param {Number} y2 Y component (translation)
 * @param {Number} z2 Z component (translation)
 * @returns {quat2} new dual quaternion
 * @function
 */
function fromRotationTranslationValues(x1, y1, z1, w1, x2, y2, z2) {
  var dq = new ARRAY_TYPE(8);
  dq[0] = x1;
  dq[1] = y1;
  dq[2] = z1;
  dq[3] = w1;
  var ax = x2 * 0.5,
    ay = y2 * 0.5,
    az = z2 * 0.5;
  dq[4] = ax * w1 + ay * z1 - az * y1;
  dq[5] = ay * w1 + az * x1 - ax * z1;
  dq[6] = az * w1 + ax * y1 - ay * x1;
  dq[7] = -ax * x1 - ay * y1 - az * z1;
  return dq;
}

/**
 * Creates a dual quat from a quaternion and a translation
 *
 * @param {ReadonlyQuat2} dual quaternion receiving operation result
 * @param {ReadonlyQuat} q a normalized quaternion
 * @param {ReadonlyVec3} t translation vector
 * @returns {quat2} dual quaternion receiving operation result
 * @function
 */
function quat2_fromRotationTranslation(out, q, t) {
  var ax = t[0] * 0.5,
    ay = t[1] * 0.5,
    az = t[2] * 0.5,
    bx = q[0],
    by = q[1],
    bz = q[2],
    bw = q[3];
  out[0] = bx;
  out[1] = by;
  out[2] = bz;
  out[3] = bw;
  out[4] = ax * bw + ay * bz - az * by;
  out[5] = ay * bw + az * bx - ax * bz;
  out[6] = az * bw + ax * by - ay * bx;
  out[7] = -ax * bx - ay * by - az * bz;
  return out;
}

/**
 * Creates a dual quat from a translation
 *
 * @param {ReadonlyQuat2} dual quaternion receiving operation result
 * @param {ReadonlyVec3} t translation vector
 * @returns {quat2} dual quaternion receiving operation result
 * @function
 */
function quat2_fromTranslation(out, t) {
  out[0] = 0;
  out[1] = 0;
  out[2] = 0;
  out[3] = 1;
  out[4] = t[0] * 0.5;
  out[5] = t[1] * 0.5;
  out[6] = t[2] * 0.5;
  out[7] = 0;
  return out;
}

/**
 * Creates a dual quat from a quaternion
 *
 * @param {ReadonlyQuat2} dual quaternion receiving operation result
 * @param {ReadonlyQuat} q the quaternion
 * @returns {quat2} dual quaternion receiving operation result
 * @function
 */
function quat2_fromRotation(out, q) {
  out[0] = q[0];
  out[1] = q[1];
  out[2] = q[2];
  out[3] = q[3];
  out[4] = 0;
  out[5] = 0;
  out[6] = 0;
  out[7] = 0;
  return out;
}

/**
 * Creates a new dual quat from a matrix (4x4)
 *
 * @param {quat2} out the dual quaternion
 * @param {ReadonlyMat4} a the matrix
 * @returns {quat2} dual quat receiving operation result
 * @function
 */
function quat2_fromMat4(out, a) {
  //TODO Optimize this
  var outer = quat_create();
  getRotation(outer, a);
  var t = new ARRAY_TYPE(3);
  getTranslation(t, a);
  quat2_fromRotationTranslation(out, outer, t);
  return out;
}

/**
 * Copy the values from one dual quat to another
 *
 * @param {quat2} out the receiving dual quaternion
 * @param {ReadonlyQuat2} a the source dual quaternion
 * @returns {quat2} out
 * @function
 */
function quat2_copy(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  out[6] = a[6];
  out[7] = a[7];
  return out;
}

/**
 * Set a dual quat to the identity dual quaternion
 *
 * @param {quat2} out the receiving quaternion
 * @returns {quat2} out
 */
function quat2_identity(out) {
  out[0] = 0;
  out[1] = 0;
  out[2] = 0;
  out[3] = 1;
  out[4] = 0;
  out[5] = 0;
  out[6] = 0;
  out[7] = 0;
  return out;
}

/**
 * Set the components of a dual quat to the given values
 *
 * @param {quat2} out the receiving quaternion
 * @param {Number} x1 X component
 * @param {Number} y1 Y component
 * @param {Number} z1 Z component
 * @param {Number} w1 W component
 * @param {Number} x2 X component
 * @param {Number} y2 Y component
 * @param {Number} z2 Z component
 * @param {Number} w2 W component
 * @returns {quat2} out
 * @function
 */
function quat2_set(out, x1, y1, z1, w1, x2, y2, z2, w2) {
  out[0] = x1;
  out[1] = y1;
  out[2] = z1;
  out[3] = w1;
  out[4] = x2;
  out[5] = y2;
  out[6] = z2;
  out[7] = w2;
  return out;
}

/**
 * Gets the real part of a dual quat
 * @param  {quat} out real part
 * @param  {ReadonlyQuat2} a Dual Quaternion
 * @return {quat} real part
 */
var getReal = quat_copy;

/**
 * Gets the dual part of a dual quat
 * @param  {quat} out dual part
 * @param  {ReadonlyQuat2} a Dual Quaternion
 * @return {quat} dual part
 */
function getDual(out, a) {
  out[0] = a[4];
  out[1] = a[5];
  out[2] = a[6];
  out[3] = a[7];
  return out;
}

/**
 * Set the real component of a dual quat to the given quaternion
 *
 * @param {quat2} out the receiving quaternion
 * @param {ReadonlyQuat} q a quaternion representing the real part
 * @returns {quat2} out
 * @function
 */
var setReal = quat_copy;

/**
 * Set the dual component of a dual quat to the given quaternion
 *
 * @param {quat2} out the receiving quaternion
 * @param {ReadonlyQuat} q a quaternion representing the dual part
 * @returns {quat2} out
 * @function
 */
function setDual(out, q) {
  out[4] = q[0];
  out[5] = q[1];
  out[6] = q[2];
  out[7] = q[3];
  return out;
}

/**
 * Gets the translation of a normalized dual quat
 * @param  {vec3} out translation
 * @param  {ReadonlyQuat2} a Dual Quaternion to be decomposed
 * @return {vec3} translation
 */
function quat2_getTranslation(out, a) {
  var ax = a[4],
    ay = a[5],
    az = a[6],
    aw = a[7],
    bx = -a[0],
    by = -a[1],
    bz = -a[2],
    bw = a[3];
  out[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2;
  out[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2;
  out[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2;
  return out;
}

/**
 * Translates a dual quat by the given vector
 *
 * @param {quat2} out the receiving dual quaternion
 * @param {ReadonlyQuat2} a the dual quaternion to translate
 * @param {ReadonlyVec3} v vector to translate by
 * @returns {quat2} out
 */
function quat2_translate(out, a, v) {
  var ax1 = a[0],
    ay1 = a[1],
    az1 = a[2],
    aw1 = a[3],
    bx1 = v[0] * 0.5,
    by1 = v[1] * 0.5,
    bz1 = v[2] * 0.5,
    ax2 = a[4],
    ay2 = a[5],
    az2 = a[6],
    aw2 = a[7];
  out[0] = ax1;
  out[1] = ay1;
  out[2] = az1;
  out[3] = aw1;
  out[4] = aw1 * bx1 + ay1 * bz1 - az1 * by1 + ax2;
  out[5] = aw1 * by1 + az1 * bx1 - ax1 * bz1 + ay2;
  out[6] = aw1 * bz1 + ax1 * by1 - ay1 * bx1 + az2;
  out[7] = -ax1 * bx1 - ay1 * by1 - az1 * bz1 + aw2;
  return out;
}

/**
 * Rotates a dual quat around the X axis
 *
 * @param {quat2} out the receiving dual quaternion
 * @param {ReadonlyQuat2} a the dual quaternion to rotate
 * @param {number} rad how far should the rotation be
 * @returns {quat2} out
 */
function quat2_rotateX(out, a, rad) {
  var bx = -a[0],
    by = -a[1],
    bz = -a[2],
    bw = a[3],
    ax = a[4],
    ay = a[5],
    az = a[6],
    aw = a[7],
    ax1 = ax * bw + aw * bx + ay * bz - az * by,
    ay1 = ay * bw + aw * by + az * bx - ax * bz,
    az1 = az * bw + aw * bz + ax * by - ay * bx,
    aw1 = aw * bw - ax * bx - ay * by - az * bz;
  quat_rotateX(out, a, rad);
  bx = out[0];
  by = out[1];
  bz = out[2];
  bw = out[3];
  out[4] = ax1 * bw + aw1 * bx + ay1 * bz - az1 * by;
  out[5] = ay1 * bw + aw1 * by + az1 * bx - ax1 * bz;
  out[6] = az1 * bw + aw1 * bz + ax1 * by - ay1 * bx;
  out[7] = aw1 * bw - ax1 * bx - ay1 * by - az1 * bz;
  return out;
}

/**
 * Rotates a dual quat around the Y axis
 *
 * @param {quat2} out the receiving dual quaternion
 * @param {ReadonlyQuat2} a the dual quaternion to rotate
 * @param {number} rad how far should the rotation be
 * @returns {quat2} out
 */
function quat2_rotateY(out, a, rad) {
  var bx = -a[0],
    by = -a[1],
    bz = -a[2],
    bw = a[3],
    ax = a[4],
    ay = a[5],
    az = a[6],
    aw = a[7],
    ax1 = ax * bw + aw * bx + ay * bz - az * by,
    ay1 = ay * bw + aw * by + az * bx - ax * bz,
    az1 = az * bw + aw * bz + ax * by - ay * bx,
    aw1 = aw * bw - ax * bx - ay * by - az * bz;
  quat_rotateY(out, a, rad);
  bx = out[0];
  by = out[1];
  bz = out[2];
  bw = out[3];
  out[4] = ax1 * bw + aw1 * bx + ay1 * bz - az1 * by;
  out[5] = ay1 * bw + aw1 * by + az1 * bx - ax1 * bz;
  out[6] = az1 * bw + aw1 * bz + ax1 * by - ay1 * bx;
  out[7] = aw1 * bw - ax1 * bx - ay1 * by - az1 * bz;
  return out;
}

/**
 * Rotates a dual quat around the Z axis
 *
 * @param {quat2} out the receiving dual quaternion
 * @param {ReadonlyQuat2} a the dual quaternion to rotate
 * @param {number} rad how far should the rotation be
 * @returns {quat2} out
 */
function quat2_rotateZ(out, a, rad) {
  var bx = -a[0],
    by = -a[1],
    bz = -a[2],
    bw = a[3],
    ax = a[4],
    ay = a[5],
    az = a[6],
    aw = a[7],
    ax1 = ax * bw + aw * bx + ay * bz - az * by,
    ay1 = ay * bw + aw * by + az * bx - ax * bz,
    az1 = az * bw + aw * bz + ax * by - ay * bx,
    aw1 = aw * bw - ax * bx - ay * by - az * bz;
  quat_rotateZ(out, a, rad);
  bx = out[0];
  by = out[1];
  bz = out[2];
  bw = out[3];
  out[4] = ax1 * bw + aw1 * bx + ay1 * bz - az1 * by;
  out[5] = ay1 * bw + aw1 * by + az1 * bx - ax1 * bz;
  out[6] = az1 * bw + aw1 * bz + ax1 * by - ay1 * bx;
  out[7] = aw1 * bw - ax1 * bx - ay1 * by - az1 * bz;
  return out;
}

/**
 * Rotates a dual quat by a given quaternion (a * q)
 *
 * @param {quat2} out the receiving dual quaternion
 * @param {ReadonlyQuat2} a the dual quaternion to rotate
 * @param {ReadonlyQuat} q quaternion to rotate by
 * @returns {quat2} out
 */
function rotateByQuatAppend(out, a, q) {
  var qx = q[0],
    qy = q[1],
    qz = q[2],
    qw = q[3],
    ax = a[0],
    ay = a[1],
    az = a[2],
    aw = a[3];
  out[0] = ax * qw + aw * qx + ay * qz - az * qy;
  out[1] = ay * qw + aw * qy + az * qx - ax * qz;
  out[2] = az * qw + aw * qz + ax * qy - ay * qx;
  out[3] = aw * qw - ax * qx - ay * qy - az * qz;
  ax = a[4];
  ay = a[5];
  az = a[6];
  aw = a[7];
  out[4] = ax * qw + aw * qx + ay * qz - az * qy;
  out[5] = ay * qw + aw * qy + az * qx - ax * qz;
  out[6] = az * qw + aw * qz + ax * qy - ay * qx;
  out[7] = aw * qw - ax * qx - ay * qy - az * qz;
  return out;
}

/**
 * Rotates a dual quat by a given quaternion (q * a)
 *
 * @param {quat2} out the receiving dual quaternion
 * @param {ReadonlyQuat} q quaternion to rotate by
 * @param {ReadonlyQuat2} a the dual quaternion to rotate
 * @returns {quat2} out
 */
function rotateByQuatPrepend(out, q, a) {
  var qx = q[0],
    qy = q[1],
    qz = q[2],
    qw = q[3],
    bx = a[0],
    by = a[1],
    bz = a[2],
    bw = a[3];
  out[0] = qx * bw + qw * bx + qy * bz - qz * by;
  out[1] = qy * bw + qw * by + qz * bx - qx * bz;
  out[2] = qz * bw + qw * bz + qx * by - qy * bx;
  out[3] = qw * bw - qx * bx - qy * by - qz * bz;
  bx = a[4];
  by = a[5];
  bz = a[6];
  bw = a[7];
  out[4] = qx * bw + qw * bx + qy * bz - qz * by;
  out[5] = qy * bw + qw * by + qz * bx - qx * bz;
  out[6] = qz * bw + qw * bz + qx * by - qy * bx;
  out[7] = qw * bw - qx * bx - qy * by - qz * bz;
  return out;
}

/**
 * Rotates a dual quat around a given axis. Does the normalisation automatically
 *
 * @param {quat2} out the receiving dual quaternion
 * @param {ReadonlyQuat2} a the dual quaternion to rotate
 * @param {ReadonlyVec3} axis the axis to rotate around
 * @param {Number} rad how far the rotation should be
 * @returns {quat2} out
 */
function rotateAroundAxis(out, a, axis, rad) {
  //Special case for rad = 0
  if (Math.abs(rad) < EPSILON) {
    return quat2_copy(out, a);
  }
  var axisLength = Math.sqrt(axis[0] * axis[0] + axis[1] * axis[1] + axis[2] * axis[2]);
  rad = rad * 0.5;
  var s = Math.sin(rad);
  var bx = s * axis[0] / axisLength;
  var by = s * axis[1] / axisLength;
  var bz = s * axis[2] / axisLength;
  var bw = Math.cos(rad);
  var ax1 = a[0],
    ay1 = a[1],
    az1 = a[2],
    aw1 = a[3];
  out[0] = ax1 * bw + aw1 * bx + ay1 * bz - az1 * by;
  out[1] = ay1 * bw + aw1 * by + az1 * bx - ax1 * bz;
  out[2] = az1 * bw + aw1 * bz + ax1 * by - ay1 * bx;
  out[3] = aw1 * bw - ax1 * bx - ay1 * by - az1 * bz;
  var ax = a[4],
    ay = a[5],
    az = a[6],
    aw = a[7];
  out[4] = ax * bw + aw * bx + ay * bz - az * by;
  out[5] = ay * bw + aw * by + az * bx - ax * bz;
  out[6] = az * bw + aw * bz + ax * by - ay * bx;
  out[7] = aw * bw - ax * bx - ay * by - az * bz;
  return out;
}

/**
 * Adds two dual quat's
 *
 * @param {quat2} out the receiving dual quaternion
 * @param {ReadonlyQuat2} a the first operand
 * @param {ReadonlyQuat2} b the second operand
 * @returns {quat2} out
 * @function
 */
function quat2_add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  out[3] = a[3] + b[3];
  out[4] = a[4] + b[4];
  out[5] = a[5] + b[5];
  out[6] = a[6] + b[6];
  out[7] = a[7] + b[7];
  return out;
}

/**
 * Multiplies two dual quat's
 *
 * @param {quat2} out the receiving dual quaternion
 * @param {ReadonlyQuat2} a the first operand
 * @param {ReadonlyQuat2} b the second operand
 * @returns {quat2} out
 */
function quat2_multiply(out, a, b) {
  var ax0 = a[0],
    ay0 = a[1],
    az0 = a[2],
    aw0 = a[3],
    bx1 = b[4],
    by1 = b[5],
    bz1 = b[6],
    bw1 = b[7],
    ax1 = a[4],
    ay1 = a[5],
    az1 = a[6],
    aw1 = a[7],
    bx0 = b[0],
    by0 = b[1],
    bz0 = b[2],
    bw0 = b[3];
  out[0] = ax0 * bw0 + aw0 * bx0 + ay0 * bz0 - az0 * by0;
  out[1] = ay0 * bw0 + aw0 * by0 + az0 * bx0 - ax0 * bz0;
  out[2] = az0 * bw0 + aw0 * bz0 + ax0 * by0 - ay0 * bx0;
  out[3] = aw0 * bw0 - ax0 * bx0 - ay0 * by0 - az0 * bz0;
  out[4] = ax0 * bw1 + aw0 * bx1 + ay0 * bz1 - az0 * by1 + ax1 * bw0 + aw1 * bx0 + ay1 * bz0 - az1 * by0;
  out[5] = ay0 * bw1 + aw0 * by1 + az0 * bx1 - ax0 * bz1 + ay1 * bw0 + aw1 * by0 + az1 * bx0 - ax1 * bz0;
  out[6] = az0 * bw1 + aw0 * bz1 + ax0 * by1 - ay0 * bx1 + az1 * bw0 + aw1 * bz0 + ax1 * by0 - ay1 * bx0;
  out[7] = aw0 * bw1 - ax0 * bx1 - ay0 * by1 - az0 * bz1 + aw1 * bw0 - ax1 * bx0 - ay1 * by0 - az1 * bz0;
  return out;
}

/**
 * Alias for {@link quat2.multiply}
 * @function
 */
var quat2_mul = quat2_multiply;

/**
 * Scales a dual quat by a scalar number
 *
 * @param {quat2} out the receiving dual quat
 * @param {ReadonlyQuat2} a the dual quat to scale
 * @param {Number} b amount to scale the dual quat by
 * @returns {quat2} out
 * @function
 */
function quat2_scale(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  out[3] = a[3] * b;
  out[4] = a[4] * b;
  out[5] = a[5] * b;
  out[6] = a[6] * b;
  out[7] = a[7] * b;
  return out;
}

/**
 * Calculates the dot product of two dual quat's (The dot product of the real parts)
 *
 * @param {ReadonlyQuat2} a the first operand
 * @param {ReadonlyQuat2} b the second operand
 * @returns {Number} dot product of a and b
 * @function
 */
var quat2_dot = quat_dot;

/**
 * Performs a linear interpolation between two dual quats's
 * NOTE: The resulting dual quaternions won't always be normalized (The error is most noticeable when t = 0.5)
 *
 * @param {quat2} out the receiving dual quat
 * @param {ReadonlyQuat2} a the first operand
 * @param {ReadonlyQuat2} b the second operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {quat2} out
 */
function quat2_lerp(out, a, b, t) {
  var mt = 1 - t;
  if (quat2_dot(a, b) < 0) t = -t;
  out[0] = a[0] * mt + b[0] * t;
  out[1] = a[1] * mt + b[1] * t;
  out[2] = a[2] * mt + b[2] * t;
  out[3] = a[3] * mt + b[3] * t;
  out[4] = a[4] * mt + b[4] * t;
  out[5] = a[5] * mt + b[5] * t;
  out[6] = a[6] * mt + b[6] * t;
  out[7] = a[7] * mt + b[7] * t;
  return out;
}

/**
 * Calculates the inverse of a dual quat. If they are normalized, conjugate is cheaper
 *
 * @param {quat2} out the receiving dual quaternion
 * @param {ReadonlyQuat2} a dual quat to calculate inverse of
 * @returns {quat2} out
 */
function quat2_invert(out, a) {
  var sqlen = quat2_squaredLength(a);
  out[0] = -a[0] / sqlen;
  out[1] = -a[1] / sqlen;
  out[2] = -a[2] / sqlen;
  out[3] = a[3] / sqlen;
  out[4] = -a[4] / sqlen;
  out[5] = -a[5] / sqlen;
  out[6] = -a[6] / sqlen;
  out[7] = a[7] / sqlen;
  return out;
}

/**
 * Calculates the conjugate of a dual quat
 * If the dual quaternion is normalized, this function is faster than quat2.inverse and produces the same result.
 *
 * @param {quat2} out the receiving quaternion
 * @param {ReadonlyQuat2} a quat to calculate conjugate of
 * @returns {quat2} out
 */
function quat2_conjugate(out, a) {
  out[0] = -a[0];
  out[1] = -a[1];
  out[2] = -a[2];
  out[3] = a[3];
  out[4] = -a[4];
  out[5] = -a[5];
  out[6] = -a[6];
  out[7] = a[7];
  return out;
}

/**
 * Calculates the length of a dual quat
 *
 * @param {ReadonlyQuat2} a dual quat to calculate length of
 * @returns {Number} length of a
 * @function
 */
var quat2_length = quat_length;

/**
 * Alias for {@link quat2.length}
 * @function
 */
var quat2_len = quat2_length;

/**
 * Calculates the squared length of a dual quat
 *
 * @param {ReadonlyQuat2} a dual quat to calculate squared length of
 * @returns {Number} squared length of a
 * @function
 */
var quat2_squaredLength = quat_squaredLength;

/**
 * Alias for {@link quat2.squaredLength}
 * @function
 */
var quat2_sqrLen = quat2_squaredLength;

/**
 * Normalize a dual quat
 *
 * @param {quat2} out the receiving dual quaternion
 * @param {ReadonlyQuat2} a dual quaternion to normalize
 * @returns {quat2} out
 * @function
 */
function quat2_normalize(out, a) {
  var magnitude = quat2_squaredLength(a);
  if (magnitude > 0) {
    magnitude = Math.sqrt(magnitude);
    var a0 = a[0] / magnitude;
    var a1 = a[1] / magnitude;
    var a2 = a[2] / magnitude;
    var a3 = a[3] / magnitude;
    var b0 = a[4];
    var b1 = a[5];
    var b2 = a[6];
    var b3 = a[7];
    var a_dot_b = a0 * b0 + a1 * b1 + a2 * b2 + a3 * b3;
    out[0] = a0;
    out[1] = a1;
    out[2] = a2;
    out[3] = a3;
    out[4] = (b0 - a0 * a_dot_b) / magnitude;
    out[5] = (b1 - a1 * a_dot_b) / magnitude;
    out[6] = (b2 - a2 * a_dot_b) / magnitude;
    out[7] = (b3 - a3 * a_dot_b) / magnitude;
  }
  return out;
}

/**
 * Returns a string representation of a dual quaternion
 *
 * @param {ReadonlyQuat2} a dual quaternion to represent as a string
 * @returns {String} string representation of the dual quat
 */
function quat2_str(a) {
  return "quat2(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ", " + a[4] + ", " + a[5] + ", " + a[6] + ", " + a[7] + ")";
}

/**
 * Returns whether or not the dual quaternions have exactly the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyQuat2} a the first dual quaternion.
 * @param {ReadonlyQuat2} b the second dual quaternion.
 * @returns {Boolean} true if the dual quaternions are equal, false otherwise.
 */
function quat2_exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7];
}

/**
 * Returns whether or not the dual quaternions have approximately the same elements in the same position.
 *
 * @param {ReadonlyQuat2} a the first dual quat.
 * @param {ReadonlyQuat2} b the second dual quat.
 * @returns {Boolean} true if the dual quats are equal, false otherwise.
 */
function quat2_equals(a, b) {
  var a0 = a[0],
    a1 = a[1],
    a2 = a[2],
    a3 = a[3],
    a4 = a[4],
    a5 = a[5],
    a6 = a[6],
    a7 = a[7];
  var b0 = b[0],
    b1 = b[1],
    b2 = b[2],
    b3 = b[3],
    b4 = b[4],
    b5 = b[5],
    b6 = b[6],
    b7 = b[7];
  return Math.abs(a0 - b0) <= EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= EPSILON * Math.max(1.0, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= EPSILON * Math.max(1.0, Math.abs(a5), Math.abs(b5)) && Math.abs(a6 - b6) <= EPSILON * Math.max(1.0, Math.abs(a6), Math.abs(b6)) && Math.abs(a7 - b7) <= EPSILON * Math.max(1.0, Math.abs(a7), Math.abs(b7));
}
;// ./node_modules/gl-matrix/esm/vec2.js


/**
 * 2 Dimensional Vector
 * @module vec2
 */

/**
 * Creates a new, empty vec2
 *
 * @returns {vec2} a new 2D vector
 */
function vec2_create() {
  var out = new ARRAY_TYPE(2);
  if (ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
  }
  return out;
}

/**
 * Creates a new vec2 initialized with values from an existing vector
 *
 * @param {ReadonlyVec2} a vector to clone
 * @returns {vec2} a new 2D vector
 */
function vec2_clone(a) {
  var out = new ARRAY_TYPE(2);
  out[0] = a[0];
  out[1] = a[1];
  return out;
}

/**
 * Creates a new vec2 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @returns {vec2} a new 2D vector
 */
function vec2_fromValues(x, y) {
  var out = new ARRAY_TYPE(2);
  out[0] = x;
  out[1] = y;
  return out;
}

/**
 * Copy the values from one vec2 to another
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the source vector
 * @returns {vec2} out
 */
function vec2_copy(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  return out;
}

/**
 * Set the components of a vec2 to the given values
 *
 * @param {vec2} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @returns {vec2} out
 */
function vec2_set(out, x, y) {
  out[0] = x;
  out[1] = y;
  return out;
}

/**
 * Adds two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {vec2} out
 */
function vec2_add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  return out;
}

/**
 * Subtracts vector b from vector a
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {vec2} out
 */
function vec2_subtract(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  return out;
}

/**
 * Multiplies two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {vec2} out
 */
function vec2_multiply(out, a, b) {
  out[0] = a[0] * b[0];
  out[1] = a[1] * b[1];
  return out;
}

/**
 * Divides two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {vec2} out
 */
function vec2_divide(out, a, b) {
  out[0] = a[0] / b[0];
  out[1] = a[1] / b[1];
  return out;
}

/**
 * Math.ceil the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a vector to ceil
 * @returns {vec2} out
 */
function vec2_ceil(out, a) {
  out[0] = Math.ceil(a[0]);
  out[1] = Math.ceil(a[1]);
  return out;
}

/**
 * Math.floor the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a vector to floor
 * @returns {vec2} out
 */
function vec2_floor(out, a) {
  out[0] = Math.floor(a[0]);
  out[1] = Math.floor(a[1]);
  return out;
}

/**
 * Returns the minimum of two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {vec2} out
 */
function vec2_min(out, a, b) {
  out[0] = Math.min(a[0], b[0]);
  out[1] = Math.min(a[1], b[1]);
  return out;
}

/**
 * Returns the maximum of two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {vec2} out
 */
function vec2_max(out, a, b) {
  out[0] = Math.max(a[0], b[0]);
  out[1] = Math.max(a[1], b[1]);
  return out;
}

/**
 * symmetric round the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a vector to round
 * @returns {vec2} out
 */
function vec2_round(out, a) {
  out[0] = round(a[0]);
  out[1] = round(a[1]);
  return out;
}

/**
 * Scales a vec2 by a scalar number
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec2} out
 */
function vec2_scale(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  return out;
}

/**
 * Adds two vec2's after scaling the second operand by a scalar value
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec2} out
 */
function vec2_scaleAndAdd(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  return out;
}

/**
 * Calculates the euclidian distance between two vec2's
 *
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {Number} distance between a and b
 */
function vec2_distance(a, b) {
  var x = b[0] - a[0],
    y = b[1] - a[1];
  return Math.sqrt(x * x + y * y);
}

/**
 * Calculates the squared euclidian distance between two vec2's
 *
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {Number} squared distance between a and b
 */
function vec2_squaredDistance(a, b) {
  var x = b[0] - a[0],
    y = b[1] - a[1];
  return x * x + y * y;
}

/**
 * Calculates the length of a vec2
 *
 * @param {ReadonlyVec2} a vector to calculate length of
 * @returns {Number} length of a
 */
function vec2_length(a) {
  var x = a[0],
    y = a[1];
  return Math.sqrt(x * x + y * y);
}

/**
 * Calculates the squared length of a vec2
 *
 * @param {ReadonlyVec2} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */
function vec2_squaredLength(a) {
  var x = a[0],
    y = a[1];
  return x * x + y * y;
}

/**
 * Negates the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a vector to negate
 * @returns {vec2} out
 */
function vec2_negate(out, a) {
  out[0] = -a[0];
  out[1] = -a[1];
  return out;
}

/**
 * Returns the inverse of the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a vector to invert
 * @returns {vec2} out
 */
function vec2_inverse(out, a) {
  out[0] = 1.0 / a[0];
  out[1] = 1.0 / a[1];
  return out;
}

/**
 * Normalize a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a vector to normalize
 * @returns {vec2} out
 */
function vec2_normalize(out, a) {
  var x = a[0],
    y = a[1];
  var len = x * x + y * y;
  if (len > 0) {
    //TODO: evaluate use of glm_invsqrt here?
    len = 1 / Math.sqrt(len);
  }
  out[0] = a[0] * len;
  out[1] = a[1] * len;
  return out;
}

/**
 * Calculates the dot product of two vec2's
 *
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {Number} dot product of a and b
 */
function vec2_dot(a, b) {
  return a[0] * b[0] + a[1] * b[1];
}

/**
 * Computes the cross product of two vec2's
 * Note that the cross product must by definition produce a 3D vector
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {vec3} out
 */
function vec2_cross(out, a, b) {
  var z = a[0] * b[1] - a[1] * b[0];
  out[0] = out[1] = 0;
  out[2] = z;
  return out;
}

/**
 * Performs a linear interpolation between two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {vec2} out
 */
function vec2_lerp(out, a, b, t) {
  var ax = a[0],
    ay = a[1];
  out[0] = ax + t * (b[0] - ax);
  out[1] = ay + t * (b[1] - ay);
  return out;
}

/**
 * Generates a random vector with the given scale
 *
 * @param {vec2} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If omitted, a unit vector will be returned
 * @returns {vec2} out
 */
function vec2_random(out, scale) {
  scale = scale === undefined ? 1.0 : scale;
  var r = RANDOM() * 2.0 * Math.PI;
  out[0] = Math.cos(r) * scale;
  out[1] = Math.sin(r) * scale;
  return out;
}

/**
 * Transforms the vec2 with a mat2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the vector to transform
 * @param {ReadonlyMat2} m matrix to transform with
 * @returns {vec2} out
 */
function transformMat2(out, a, m) {
  var x = a[0],
    y = a[1];
  out[0] = m[0] * x + m[2] * y;
  out[1] = m[1] * x + m[3] * y;
  return out;
}

/**
 * Transforms the vec2 with a mat2d
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the vector to transform
 * @param {ReadonlyMat2d} m matrix to transform with
 * @returns {vec2} out
 */
function transformMat2d(out, a, m) {
  var x = a[0],
    y = a[1];
  out[0] = m[0] * x + m[2] * y + m[4];
  out[1] = m[1] * x + m[3] * y + m[5];
  return out;
}

/**
 * Transforms the vec2 with a mat3
 * 3rd vector component is implicitly '1'
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the vector to transform
 * @param {ReadonlyMat3} m matrix to transform with
 * @returns {vec2} out
 */
function vec2_transformMat3(out, a, m) {
  var x = a[0],
    y = a[1];
  out[0] = m[0] * x + m[3] * y + m[6];
  out[1] = m[1] * x + m[4] * y + m[7];
  return out;
}

/**
 * Transforms the vec2 with a mat4
 * 3rd vector component is implicitly '0'
 * 4th vector component is implicitly '1'
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the vector to transform
 * @param {ReadonlyMat4} m matrix to transform with
 * @returns {vec2} out
 */
function vec2_transformMat4(out, a, m) {
  var x = a[0];
  var y = a[1];
  out[0] = m[0] * x + m[4] * y + m[12];
  out[1] = m[1] * x + m[5] * y + m[13];
  return out;
}

/**
 * Rotate a 2D vector
 * @param {vec2} out The receiving vec2
 * @param {ReadonlyVec2} a The vec2 point to rotate
 * @param {ReadonlyVec2} b The origin of the rotation
 * @param {Number} rad The angle of rotation in radians
 * @returns {vec2} out
 */
function vec2_rotate(out, a, b, rad) {
  //Translate point to the origin
  var p0 = a[0] - b[0],
    p1 = a[1] - b[1],
    sinC = Math.sin(rad),
    cosC = Math.cos(rad);

  //perform rotation and translate to correct position
  out[0] = p0 * cosC - p1 * sinC + b[0];
  out[1] = p0 * sinC + p1 * cosC + b[1];
  return out;
}

/**
 * Get the smallest angle between two 2D vectors
 * @param {ReadonlyVec2} a The first operand
 * @param {ReadonlyVec2} b The second operand
 * @returns {Number} The angle in radians
 */
function vec2_angle(a, b) {
  var ax = a[0],
    ay = a[1],
    bx = b[0],
    by = b[1];
  return Math.abs(Math.atan2(ay * bx - ax * by, ax * bx + ay * by));
}

/**
 * Get the signed angle in the interval [-pi,pi] between two 2D vectors (positive if `a` is to the right of `b`)
 * 
 * @param {ReadonlyVec2} a The first vector
 * @param {ReadonlyVec2} b The second vector
 * @returns {number} The signed angle in radians
 */
function signedAngle(a, b) {
  var ax = a[0],
    ay = a[1],
    bx = b[0],
    by = b[1];
  return Math.atan2(ax * by - ay * bx, ax * bx + ay * by);
}

/**
 * Set the components of a vec2 to zero
 *
 * @param {vec2} out the receiving vector
 * @returns {vec2} out
 */
function vec2_zero(out) {
  out[0] = 0.0;
  out[1] = 0.0;
  return out;
}

/**
 * Returns a string representation of a vector
 *
 * @param {ReadonlyVec2} a vector to represent as a string
 * @returns {String} string representation of the vector
 */
function vec2_str(a) {
  return "vec2(" + a[0] + ", " + a[1] + ")";
}

/**
 * Returns whether or not the vectors exactly have the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyVec2} a The first vector.
 * @param {ReadonlyVec2} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
function vec2_exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1];
}

/**
 * Returns whether or not the vectors have approximately the same elements in the same position.
 *
 * @param {ReadonlyVec2} a The first vector.
 * @param {ReadonlyVec2} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
function vec2_equals(a, b) {
  var a0 = a[0],
    a1 = a[1];
  var b0 = b[0],
    b1 = b[1];
  return Math.abs(a0 - b0) <= EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1));
}

/**
 * Alias for {@link vec2.length}
 * @function
 */
var vec2_len = vec2_length;

/**
 * Alias for {@link vec2.subtract}
 * @function
 */
var vec2_sub = vec2_subtract;

/**
 * Alias for {@link vec2.multiply}
 * @function
 */
var vec2_mul = vec2_multiply;

/**
 * Alias for {@link vec2.divide}
 * @function
 */
var vec2_div = vec2_divide;

/**
 * Alias for {@link vec2.distance}
 * @function
 */
var vec2_dist = vec2_distance;

/**
 * Alias for {@link vec2.squaredDistance}
 * @function
 */
var vec2_sqrDist = vec2_squaredDistance;

/**
 * Alias for {@link vec2.squaredLength}
 * @function
 */
var vec2_sqrLen = vec2_squaredLength;

/**
 * Perform some operation over an array of vec2s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec2. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
var vec2_forEach = function () {
  var vec = vec2_create();
  return function (a, stride, offset, count, fn, arg) {
    var i, l;
    if (!stride) {
      stride = 2;
    }
    if (!offset) {
      offset = 0;
    }
    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }
    for (i = offset; i < l; i += stride) {
      vec[0] = a[i];
      vec[1] = a[i + 1];
      fn(vec, vec, arg);
      a[i] = vec[0];
      a[i + 1] = vec[1];
    }
    return a;
  };
}();
;// ./node_modules/gl-matrix/esm/index.js












/***/ }),

/***/ 2056:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.VisibleTilesManager = void 0;
const Global_js_1 = __importDefault(__webpack_require__(4382));
const healpixjs_1 = __webpack_require__(1138);
const RayPickingUtils_js_1 = __importDefault(__webpack_require__(4639));
// import { newTileBuffer } from './TileBuffer.js';
const TileBuffer_js_1 = __webpack_require__(4006);
const gl_matrix_1 = __webpack_require__(1961);
// import healpixGridSingleton from '../grid/HealpixGridSingleton.js';
// import {HealpixGridSingleton} from '../grid/HealpixGridSingleton.js';
const Config_js_1 = __webpack_require__(2919);
class VisibleTilesManager {
    _visibleTilesByOrder;
    _ancestorsMap;
    initialised;
    _galVisibleTilesByOrder;
    _galAncestorsMap;
    _galacticMatrixInverted;
    _galacticMatrix;
    insideSphere = Config_js_1.bootSetup.insideSphere;
    _tileBuffer;
    _healpixGrid;
    _webgl;
    constructor(webgl, hipsShaderProgram, healpixGrid) {
        this._webgl = webgl;
        this._healpixGrid = healpixGrid;
        this._visibleTilesByOrder = { pixels: [], order: 0 };
        this._ancestorsMap = new Map();
        this.initialised = false;
        this._galVisibleTilesByOrder = { pixels: [], order: 0 };
        this._galAncestorsMap = new Map();
        // Matrices for galactic <-> equatorial
        this._galacticMatrixInverted = gl_matrix_1.mat4.create();
        this._galacticMatrix = gl_matrix_1.mat4.create();
        // From https://observablehq.com/@fil/galactic-rotations (single-precision friendly)
        // This matrix is (galactic -> equatorial); we store its inverse too.
        gl_matrix_1.mat4.set(this._galacticMatrixInverted, -0.054876, -0.873437, -0.483835, 0, 0.494109, -0.44483, 0.746982, -0, -0.867666, -0.198076, 0.455984, 0, 0, 0, 0, 1);
        gl_matrix_1.mat4.invert(this._galacticMatrix, this._galacticMatrixInverted);
        this._tileBuffer = new TileBuffer_js_1.TileBuffer(1, webgl, hipsShaderProgram, this);
    }
    get healpixGrid() {
        return this._healpixGrid;
    }
    get tileBuffer() {
        return this._tileBuffer;
    }
    init(insideSphere) {
        this.initialised = true;
        this.insideSphere = insideSphere;
        // this.computeVisiblePixels();
        // setInterval(() => this.computeVisiblePixels(), 500);
    }
    getVisibleOrder() {
        // return healpixGridSingleton.visibleorder;
        return this._healpixGrid.visibleorder;
    }
    // computeVisiblePixels(): void {
    computeVisiblePixels(order, webgl, camera, pMatrix) {
        if (!this.initialised)
            return;
        // let order = healpixGridSingleton.visibleorder;
        if (Global_js_1.default.insideSphere && order < 3) {
            order = 3;
        }
        this._ancestorsMap.set(order, []);
        this._galAncestorsMap.set(order, []);
        let pixels = [];
        let galTiles = [];
        if (order === 0) {
            const geomhealpix = Global_js_1.default.getHealpix(0);
            const npix = geomhealpix.getNPix();
            for (let i = 0; i < npix; i++) {
                pixels.push(i);
                this._ancestorsMap.get(order).push(i);
                galTiles.push(i);
                this._galAncestorsMap.get(order).push(i);
            }
        }
        else {
            const geomhealpix = Global_js_1.default.getHealpix(order);
            // const maxX = (global.gl as GL).canvas.width;
            // const maxY = (global.gl as GL).canvas.height;
            const maxX = webgl.canvas.width;
            const maxY = webgl.canvas.height;
            // Sample a grid of screen points, project to the sphere, then to galactic
            for (let i = 0; i <= maxX; i += maxX / 30) {
                for (let j = 0; j <= maxY; j += maxY / 30) {
                    const hit = RayPickingUtils_js_1.default.getIntersectionPointWithSingleModel(i, j, this._healpixGrid, this._webgl, camera, pMatrix);
                    if (hit.length > 0) {
                        // Equatorial -> Galactic (use _galacticMatrix)
                        const galVec = gl_matrix_1.vec4.create();
                        gl_matrix_1.vec4.transformMat4(galVec, [hit[0], hit[1], hit[2], 1], this._galacticMatrix);
                        // Index in galactic HEALPix
                        const galPoint = new healpixjs_1.Pointing(new healpixjs_1.Vec3(galVec[0], galVec[1], galVec[2]));
                        const galTileNo = geomhealpix.ang2pix(galPoint);
                        // Index in equatorial HEALPix
                        const curPoint = new healpixjs_1.Pointing(new healpixjs_1.Vec3(hit[0], hit[1], hit[2]));
                        const currPixNo = geomhealpix.ang2pix(curPoint);
                        if (!pixels.includes(currPixNo)) {
                            pixels.push(currPixNo);
                            this._ancestorsMap.get(order).push(currPixNo);
                            // newTileBuffer.addTile(order, currPixNo);
                            this._tileBuffer.addTile(order, currPixNo);
                        }
                        if (!galTiles.includes(galTileNo)) {
                            galTiles.push(galTileNo);
                            this._galAncestorsMap.get(order).push(galTileNo);
                            // newTileBuffer.addGalTile(order, galTileNo);
                            this._tileBuffer.addGalTile(order, galTileNo);
                        }
                    }
                }
            }
        }
        this._visibleTilesByOrder = { pixels: pixels, order: order };
        this._galVisibleTilesByOrder = { pixels: galTiles, order: order };
        // Build ancestor pyramids down to order 0
        for (let o = 1; o < order; o++) {
            const tgtOrder = order - o;
            const list = this._ancestorsMap.get(tgtOrder) ?? [];
            this._ancestorsMap.set(tgtOrder, list);
            for (let p = 0; p < pixels.length; p++) {
                const parent = pixels[p] >> (2 * o);
                if (!list.includes(parent)) {
                    list.push(parent);
                    // newTileBuffer.addTile(tgtOrder, parent);
                    this._tileBuffer.addTile(tgtOrder, parent);
                }
            }
        }
        for (let o = 1; o < order; o++) {
            const tgtOrder = order - o;
            const list = this._galAncestorsMap.get(tgtOrder) ?? [];
            this._galAncestorsMap.set(tgtOrder, list);
            for (let p = 0; p < galTiles.length; p++) {
                const parent = galTiles[p] >> (2 * o);
                if (!list.includes(parent)) {
                    list.push(parent);
                    // newTileBuffer.addGalTile(tgtOrder, parent);
                    this._tileBuffer.addGalTile(tgtOrder, parent);
                }
            }
        }
    }
    get visibleTilesByOrder() {
        return this._visibleTilesByOrder;
    }
    get ancestorsMap() {
        return this._ancestorsMap;
    }
    get galVisibleTilesByOrder() {
        return this._galVisibleTilesByOrder;
    }
    get galAncestorsMap() {
        return this._galAncestorsMap;
    }
    get visibleOrder() {
        return this._visibleTilesByOrder.order;
    }
}
exports.VisibleTilesManager = VisibleTilesManager;
// export const visibleTilesManager = new VisibleTilesManager();


/***/ }),

/***/ 2166:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

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
/**
 * Ray picking helpers for XYZ/WebMercator maps.
 *
 * Unlike RayPickingUtils, this module has no HEALPix dependency. It intersects
 * screen rays with an XYZ sphere, converts the hit to lon/lat, then maps that
 * position to XYZ z/x/y tile coordinates.
 */

Object.defineProperty(exports, "__esModule", ({ value: true }));
const gl_matrix_1 = __webpack_require__(1961);
const MAX_MERCATOR_LAT = 85.0511287798066;
class XYZRayPickingUtils {
    static getRayFromMouse(mouseX, mouseY, pMatrix, webgl, vMatrix) {
        const gl = webgl;
        const canvas = gl.canvas;
        const rect = canvas.getBoundingClientRect();
        const x = (2.0 * mouseX) / rect.width - 1.0;
        const y = 1.0 - (2.0 * mouseY) / rect.height;
        const rayClip = [x, y, -1.0, 1.0];
        const pInv = gl_matrix_1.mat4.create();
        gl_matrix_1.mat4.invert(pInv, pMatrix);
        const rayEye4 = [0, 0, 0, 0];
        XYZRayPickingUtils.mat4MultiplyVec4(pInv, rayClip, rayEye4);
        const rayEye = [rayEye4[0], rayEye4[1], -1.0, 0.0];
        const vInv = gl_matrix_1.mat4.create();
        gl_matrix_1.mat4.invert(vInv, vMatrix);
        const rayWorld4 = [0, 0, 0, 0];
        XYZRayPickingUtils.mat4MultiplyVec4(vInv, rayEye, rayWorld4);
        const rayWorld = gl_matrix_1.vec3.fromValues(rayWorld4[0], rayWorld4[1], rayWorld4[2]);
        gl_matrix_1.vec3.normalize(rayWorld, rayWorld);
        return rayWorld;
    }
    static raySphere(rayOrigWorld, rayDirectionWorld, sphere) {
        let intersectionDistance = -1;
        const L = gl_matrix_1.vec3.create();
        gl_matrix_1.vec3.subtract(L, rayOrigWorld, sphere.center);
        const b = gl_matrix_1.vec3.dot(rayDirectionWorld, L);
        const c = gl_matrix_1.vec3.dot(L, L) - sphere.radius * sphere.radius;
        const disc = b * b - c;
        if (disc > 0.0) {
            const s = Math.sqrt(disc);
            const ta = -b + s;
            const tb = -b - s;
            if (ta >= 0.0 || tb >= 0.0) {
                intersectionDistance = tb < 0.0 ? ta : Math.min(ta, tb);
            }
        }
        else if (disc === 0.0) {
            const t = -b;
            if (t >= 0.0) {
                intersectionDistance = t;
            }
        }
        return intersectionDistance;
    }
    static getIntersectionPointWithModel(mouseX, mouseY, xyzModel, webgl, camera, pMatrix) {
        const vMatrix = camera.getCameraMatrix();
        const rayWorld = XYZRayPickingUtils.getRayFromMouse(mouseX, mouseY, pMatrix, webgl, vMatrix);
        const t = XYZRayPickingUtils.raySphere(camera.getCameraPosition(), rayWorld, xyzModel);
        if (t < 0) {
            return null;
        }
        const worldHit = gl_matrix_1.vec3.create();
        gl_matrix_1.vec3.scale(worldHit, rayWorld, t);
        gl_matrix_1.vec3.add(worldHit, camera.getCameraPosition(), worldHit);
        const worldHit4 = [worldHit[0], worldHit[1], worldHit[2], 1.0];
        const modelHit4 = [0, 0, 0, 0];
        XYZRayPickingUtils.mat4MultiplyVec4(xyzModel.getModelMatrixInverse(), worldHit4, modelHit4);
        return [modelHit4[0], modelHit4[1], modelHit4[2]];
    }
    static getLonLatFromMouse(mouseX, mouseY, xyzModel, webgl, camera, pMatrix) {
        const hit = XYZRayPickingUtils.getIntersectionPointWithModel(mouseX, mouseY, xyzModel, webgl, camera, pMatrix);
        return hit ? XYZRayPickingUtils.modelPointToLonLat(hit) : null;
    }
    static getTileFromMouse(mouseX, mouseY, z, xyzModel, webgl, camera, pMatrix) {
        const lonLat = XYZRayPickingUtils.getLonLatFromMouse(mouseX, mouseY, xyzModel, webgl, camera, pMatrix);
        if (!lonLat || !XYZRayPickingUtils.isMercatorLatitude(lonLat.latDeg)) {
            return null;
        }
        return XYZRayPickingUtils.lonLatToTile(lonLat.lonDeg, lonLat.latDeg, z);
    }
    static getVisibleTilesFromViewport(z, xyzModel, webgl, camera, pMatrix, sampleCount = 9, padding = 2) {
        const gl = webgl;
        const canvas = gl.canvas;
        const rect = canvas.getBoundingClientRect();
        const samples = Math.max(2, Math.floor(sampleCount));
        const edgeSamples = Math.max(samples * 2 + 1, 21);
        const safePadding = Math.max(0, Math.floor(padding));
        const tiles = [];
        const addSample = (x, y) => {
            const tile = XYZRayPickingUtils.getTileFromMouse(x, y, z, xyzModel, webgl, camera, pMatrix);
            if (!tile)
                return;
            tiles.push(tile);
            tiles.push(...XYZRayPickingUtils.getNeighborTiles(tile, safePadding));
        };
        for (let iy = 0; iy < samples; iy++) {
            const y = samples === 1 ? rect.height / 2 : (iy / (samples - 1)) * rect.height;
            for (let ix = 0; ix < samples; ix++) {
                const x = samples === 1 ? rect.width / 2 : (ix / (samples - 1)) * rect.width;
                addSample(x, y);
            }
        }
        for (let i = 0; i < edgeSamples; i++) {
            const t = edgeSamples === 1 ? 0.5 : i / (edgeSamples - 1);
            const x = t * rect.width;
            const y = t * rect.height;
            addSample(x, 0);
            addSample(x, rect.height);
            addSample(0, y);
            addSample(rect.width, y);
        }
        return XYZRayPickingUtils.fillSmallTileGaps(XYZRayPickingUtils.deduplicateTiles(tiles));
    }
    static modelPointToLonLat(point) {
        const [x, y, z] = point;
        const len = Math.hypot(x, y, z);
        if (!Number.isFinite(len) || len === 0) {
            return { lonDeg: 0, latDeg: 0 };
        }
        const lonDeg = (Math.atan2(y, x) * 180) / Math.PI;
        const latDeg = (Math.asin(Math.max(-1, Math.min(1, z / len))) * 180) / Math.PI;
        return { lonDeg, latDeg };
    }
    static lonLatToTile(lonDeg, latDeg, z) {
        const zoom = Math.max(0, Math.floor(z));
        const dim = 2 ** zoom;
        const x = Math.floor(((lonDeg + 180) / 360) * dim);
        const y = Math.floor(XYZRayPickingUtils.latToTileY(latDeg, zoom));
        return {
            z: zoom,
            x: XYZRayPickingUtils.wrapTileX(x, dim),
            y: XYZRayPickingUtils.clampTileY(y, dim),
        };
    }
    static getNeighborTiles(tile, ring = 1) {
        const dim = 2 ** tile.z;
        const tiles = [];
        const safeRing = Math.max(0, Math.floor(ring));
        for (let dx = -safeRing; dx <= safeRing; dx++) {
            for (let dy = -safeRing; dy <= safeRing; dy++) {
                tiles.push({
                    z: tile.z,
                    x: XYZRayPickingUtils.wrapTileX(tile.x + dx, dim),
                    y: XYZRayPickingUtils.clampTileY(tile.y + dy, dim),
                });
            }
        }
        return XYZRayPickingUtils.deduplicateTiles(tiles);
    }
    static deduplicateTiles(tiles) {
        const map = new Map();
        for (const tile of tiles) {
            map.set(`${tile.z}/${tile.x}/${tile.y}`, tile);
        }
        return Array.from(map.values());
    }
    static fillSmallTileGaps(tiles) {
        if (tiles.length === 0) {
            return tiles;
        }
        const zoom = tiles[0].z;
        const dim = 2 ** zoom;
        const map = new Map();
        const key = (tile) => `${tile.z}/${tile.x}/${tile.y}`;
        const add = (tile) => {
            map.set(key(tile), tile);
        };
        const has = (x, y) => (y >= 0 && y < dim && map.has(`${zoom}/${XYZRayPickingUtils.wrapTileX(x, dim)}/${y}`));
        for (const tile of tiles) {
            add(tile);
        }
        for (const tile of tiles) {
            const x = tile.x;
            const y = tile.y;
            if (has(x - 2, y) && !has(x - 1, y)) {
                add({ z: zoom, x: XYZRayPickingUtils.wrapTileX(x - 1, dim), y });
            }
            if (has(x + 2, y) && !has(x + 1, y)) {
                add({ z: zoom, x: XYZRayPickingUtils.wrapTileX(x + 1, dim), y });
            }
            if (has(x, y - 2) && !has(x, y - 1)) {
                add({ z: zoom, x, y: y - 1 });
            }
            if (has(x, y + 2) && !has(x, y + 1)) {
                add({ z: zoom, x, y: y + 1 });
            }
        }
        return Array.from(map.values());
    }
    static latToTileY(latDeg, z) {
        const lat = Math.max(-MAX_MERCATOR_LAT, Math.min(MAX_MERCATOR_LAT, latDeg));
        const latRad = (lat * Math.PI) / 180;
        const dim = 2 ** z;
        return ((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * dim;
    }
    static isMercatorLatitude(latDeg) {
        return Math.abs(latDeg) <= MAX_MERCATOR_LAT;
    }
    static wrapTileX(x, dim) {
        return ((x % dim) + dim) % dim;
    }
    static clampTileY(y, dim) {
        return Math.max(0, Math.min(dim - 1, y));
    }
    static mat4MultiplyVec4(a, b, out) {
        const d = b[0], e = b[1], g = b[2], w = b[3];
        out[0] = a[0] * d + a[4] * e + a[8] * g + a[12] * w;
        out[1] = a[1] * d + a[5] * e + a[9] * g + a[13] * w;
        out[2] = a[2] * d + a[6] * e + a[10] * g + a[14] * w;
        out[3] = a[3] * d + a[7] * e + a[11] * g + a[15] * w;
        return out;
    }
}
exports["default"] = XYZRayPickingUtils;


/***/ }),

/***/ 2368:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const Global_js_1 = __importDefault(__webpack_require__(4382));
class AllSky {
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
        const healpix = Global_js_1.default.getHealpix(this._order);
        this._maxTiles = healpix.getNPix();
        const tgtHealpix = Global_js_1.default.getHealpix(tgtHpxOrder);
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
exports["default"] = AllSky;


/***/ }),

/***/ 2475:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Footprint = void 0;
/**
 * @author Fabrizio Giordano (Fab)
 */
// import { Pointing, Healpix } from 'healpixjs';
// import { degToRad } from '../../utils/Utils.js';
const GeomUtils_js_1 = __importDefault(__webpack_require__(2930));
// import global from '../../Global.js';
const STCSParser_js_1 = __importDefault(__webpack_require__(9665));
const CoordsType_js_1 = __webpack_require__(8145);
// export interface ParsedSTCS {
//   polygons: Point[][]; // array of polygons (each polygon is array of Point objects)
//   totpoints: number;
// }
class Footprint {
    _polygons = []; // array of polygons (-> array of points)
    _convexPolygons = []; // convex polygons
    _stcs; // STC-S string
    _valid = false;
    _details;
    _totPoints = 0;
    _totConvexPoints = 0;
    _npix256;
    _footprintsPointsOrder;
    _coordsType;
    _selectionObj;
    _identifier;
    _center; // could be typed if you have a Point type
    /**
     * @param in_stcs STC-S representation of the footprint
     * @param in_details optional metadata
     * @param footprintsPointsOrder 1-> clockwise, -1 counter clockwise
     */
    constructor(in_stcs, in_details = [], footprintsPointsOrder, coordsType = CoordsType_js_1.CoordsType.ASTRO) {
        this._coordsType = coordsType;
        if (in_stcs) {
            this._stcs = in_stcs.toUpperCase();
            this._details = in_details;
            this._totPoints = 0;
            this._totConvexPoints = 0;
            this._footprintsPointsOrder = footprintsPointsOrder;
            this.computePoints();
            this._selectionObj = this.computeSelectionObject();
            this._valid = true;
        }
        else {
            this._details = [];
        }
    }
    static fromPolygons(polygons, details = [], coordsType = CoordsType_js_1.CoordsType.ASTRO) {
        const footprint = new Footprint(undefined, [], undefined, coordsType);
        footprint._polygons = polygons;
        footprint._details = details;
        footprint._totPoints = polygons.reduce((total, polygon) => total + polygon.length, 0);
        footprint._totConvexPoints = 0;
        footprint._coordsType = coordsType;
        footprint._selectionObj = footprint.computeSelectionObject();
        footprint._valid = footprint._totPoints > 0;
        return footprint;
    }
    computeSelectionObject() {
        return GeomUtils_js_1.default.computeSelectionObject(this._polygons);
    }
    // /**
    //  * Return array of HEALPix pixels covering the footprint
    //  * NOTE: despite the name, nside is not fixed at 256. It comes from Global.js
    //  */
    // private computeNpix256(): number[] {
    //   const healpix256 = new Healpix(global.nsideForSelection);
    //   const points: Pointing[] = [];
    //   for (const poly of this._convexPolygons) {
    //     for (const currPoint of poly) {
    //       const phiTheta = currPoint.computeHealpixPhiTheta();
    //       const phiRad = degToRad(phiTheta.phi);
    //       const thetaRad = degToRad(phiTheta.theta);
    //       points.push(new Pointing(null, false, thetaRad, phiRad));
    //     }
    //   }
    //   const rangeSet = healpix256.queryPolygonInclusive(points, 32);
    //   return Array.from(rangeSet.r);
    // }
    computePoints() {
        const res = STCSParser_js_1.default.parseSTCS(this._stcs, {
            coordsType: this._coordsType,
        });
        this._polygons = res.polygons;
        this._totPoints = res.totpoints;
    }
    get valid() {
        return this._valid;
    }
    get totPoints() {
        return this._totPoints;
    }
    get totConvexPoints() {
        return this._totConvexPoints;
    }
    get polygons() {
        return this._polygons;
    }
    get convexPolygons() {
        return this._convexPolygons;
    }
    get identifier() {
        return this._identifier;
    }
    get center() {
        return this._center;
    }
    get pixels() {
        return this._npix256;
    }
    get details() {
        return this._details;
    }
    get selectionObj() {
        return this._selectionObj;
    }
}
exports.Footprint = Footprint;


/***/ }),

/***/ 2737:
/***/ ((__unused_webpack_module, exports) => {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.XYZTileBuffer = void 0;
class XYZTileBuffer {
    _tiles = new Map();
    _cachedTiles = new Map();
    _cacheAliveMilliSeconds;
    _cleanerId;
    constructor(minutesToLiveInCache = 1) {
        this._cacheAliveMilliSeconds = minutesToLiveInCache * 60 * 1000;
        if (typeof window !== 'undefined') {
            this._cleanerId = window.setInterval(() => {
                this.cacheCleaner();
            }, 10_000);
        }
    }
    get activeTiles() {
        return this._tiles;
    }
    get cachedTiles() {
        return this._cachedTiles;
    }
    get size() {
        return this._tiles.size + this._cachedTiles.size;
    }
    ensureTiles(visibleTiles, tileFactory) {
        const visibleTileKeys = [];
        for (const tileCoord of visibleTiles) {
            const tile = this.getTile(tileCoord, tileFactory);
            this.touchTile(tile);
            visibleTileKeys.push(this.key(tileCoord));
        }
        this.syncVisibleTiles(visibleTileKeys);
        return visibleTileKeys;
    }
    getTile(tileCoord, tileFactory) {
        const tileKey = this.key(tileCoord);
        if (this._tiles.has(tileKey)) {
            return this._tiles.get(tileKey).tile;
        }
        if (this._cachedTiles.has(tileKey)) {
            const entry = this._cachedTiles.get(tileKey);
            entry.cacheTime0 = undefined;
            this._tiles.set(tileKey, entry);
            this._cachedTiles.delete(tileKey);
            return entry.tile;
        }
        const tile = tileFactory(tileCoord);
        this._tiles.set(tileKey, { tile });
        return tile;
    }
    getActiveTile(tileKey) {
        return this._tiles.get(tileKey)?.tile ?? null;
    }
    getAnyTile(tileKey) {
        return this._tiles.get(tileKey)?.tile ?? this._cachedTiles.get(tileKey)?.tile ?? null;
    }
    getActiveTiles() {
        return Array.from(this._tiles.values(), (entry) => entry.tile);
    }
    syncVisibleTiles(visibleTileKeys) {
        const visibleKeySet = new Set(visibleTileKeys);
        for (const [tileKey, entry] of this._tiles) {
            if (visibleKeySet.has(tileKey)) {
                this.touchTile(entry.tile);
                continue;
            }
            entry.cacheTime0 = Date.now();
            this._cachedTiles.set(tileKey, entry);
            this._tiles.delete(tileKey);
        }
    }
    evictCached(maxCachedTiles) {
        if (this.size <= maxCachedTiles) {
            return;
        }
        const candidates = Array.from(this._cachedTiles.entries()).sort((a, b) => {
            return this.getTileAgeScore(a[1].tile) - this.getTileAgeScore(b[1].tile);
        });
        for (const [tileKey, entry] of candidates) {
            if (this.size <= maxCachedTiles) {
                break;
            }
            if (entry.tile.loading) {
                continue;
            }
            entry.tile.dispose?.();
            this._cachedTiles.delete(tileKey);
        }
    }
    dispose() {
        if (this._cleanerId !== undefined && typeof window !== 'undefined') {
            window.clearInterval(this._cleanerId);
            this._cleanerId = undefined;
        }
        for (const entry of this._tiles.values()) {
            entry.tile.dispose?.();
        }
        for (const entry of this._cachedTiles.values()) {
            entry.tile.dispose?.();
        }
        this._tiles.clear();
        this._cachedTiles.clear();
    }
    key(tileCoord) {
        return XYZTileBuffer.key(tileCoord);
    }
    static key(tileCoord) {
        return `${tileCoord.z}/${tileCoord.x}/${tileCoord.y}`;
    }
    cacheCleaner() {
        const now = Date.now();
        for (const [tileKey, entry] of this._cachedTiles) {
            const t0 = entry.cacheTime0;
            if (t0 === undefined || now - t0 <= this._cacheAliveMilliSeconds || entry.tile.loading) {
                continue;
            }
            entry.tile.dispose?.();
            this._cachedTiles.delete(tileKey);
        }
    }
    touchTile(tile) {
        tile.touch?.();
    }
    getTileAgeScore(tile) {
        const lastUsedAt = tile.lastUsedAt ?? 0;
        const createdAt = tile.createdAt ?? lastUsedAt;
        return Math.min(lastUsedAt || createdAt, createdAt);
    }
}
exports.XYZTileBuffer = XYZTileBuffer;


/***/ }),

/***/ 2885:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const Global_js_1 = __importDefault(__webpack_require__(4382));
const FoVHelper_js_1 = __webpack_require__(229);
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
    _webgl;
    constructor(tileno, order, hips, tileBuffer, hipsShaderProgram, webgl) {
        this._hipsShaderProgram = hipsShaderProgram;
        this._tileBuffer = tileBuffer;
        this._hips = hips;
        this._tileno = tileno;
        this._webgl = webgl;
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
        const gl = this._webgl;
        gl.activeTexture(gl.TEXTURE0 + this._hipsShaderIndex);
        gl.bindTexture(gl.TEXTURE_2D, this._texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._image);
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
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        if (!gl.isTexture(this._texture)) {
            console.log('error in texture');
        }
    }
    initModelBuffer() {
        const gl = this._webgl;
        this.vertexPosition = [];
        this.vertexPositionBuffer = [];
        this.vertexIndices = new Uint16Array();
        // this.vertexIndexBuffer created later
        const reforder = FoVHelper_js_1.fovHelper.getRefOrder(this._order);
        const orighealpix = Global_js_1.default.getHealpix(this._order);
        const origxyf = orighealpix.nest2xyf(this._tileno);
        const orderjump = reforder - this._order;
        const dxmin = origxyf.ix << orderjump;
        const dxmax = (origxyf.ix << orderjump) + (1 << orderjump);
        const dymin = origxyf.iy << orderjump;
        const dymax = (origxyf.iy << orderjump) + (1 << orderjump);
        const healpix = Global_js_1.default.getHealpix(reforder);
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
        this.vertexPositionBuffer[qidx] = this._webgl.createBuffer();
        this._webgl.bindBuffer(this._webgl.ARRAY_BUFFER, this.vertexPositionBuffer[qidx]);
        this._webgl.bufferData(this._webgl.ARRAY_BUFFER, this.vertexPosition[qidx], this._webgl.STATIC_DRAW);
    }
    // Version used by the original JS, collecting _pixels via xyf2nest + getBoundaries
    setupPositionAndTexture4Quadrant(dxmin, dxmax, dymin, dymax, qidx, healpix, orderjump, origxyf) {
        const gl = this._webgl;
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
        // this._image.onload = () => this.imageLoaded()
        let quadrantsToDraw = new Set([0, 1, 2, 3]);
        if (visibleOrder > this._order) {
            const q = this.drawChildren(visibleOrder, visibleTilesMap, pMatrix, vMatrix, mMatrix, colorMapIdx);
            if (q)
                quadrantsToDraw = q;
        }
        this._hipsShaderProgram.enableShaders(pMatrix, vMatrix, mMatrix, colorMapIdx);
        const gl = this._webgl;
        gl.enableVertexAttribArray(this._hipsShaderProgram.locations.vertexPositionAttribute);
        gl.enableVertexAttribArray(this._hipsShaderProgram.locations.textureCoordAttribute);
        gl.activeTexture(gl.TEXTURE0 + this._hipsShaderIndex);
        gl.bindTexture(gl.TEXTURE_2D, this._texture);
        gl.uniform1f(this._hipsShaderProgram.locations.textureAlpha, this.opacity);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
        const elemno = this.vertexIndices.length;
        quadrantsToDraw.forEach((qidx) => {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer[qidx]);
            gl.vertexAttribPointer(this._hipsShaderProgram.locations.vertexPositionAttribute, 3, gl.FLOAT, false, 5 * 4, 0);
            gl.vertexAttribPointer(this._hipsShaderProgram.locations.textureCoordAttribute, 2, gl.FLOAT, false, 5 * 4, 3 * 4);
            gl.drawElements(gl.TRIANGLES, elemno, gl.UNSIGNED_SHORT, 0);
        });
        gl.disableVertexAttribArray(this._hipsShaderProgram.locations.vertexPositionAttribute);
        gl.disableVertexAttribArray(this._hipsShaderProgram.locations.textureCoordAttribute);
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
                // childTile.draw(visibleOrder, visibleTilesMap, pMatrix, vMatrix, mMatrix, colorMapIdx)
                childTile.draw(visibleOrder, visibleTilesMap, pMatrix, vMatrix, mMatrix, colorMapIdx, this._hipsShaderProgram);
                if (childTile._ready) {
                    quadrantsToDraw.delete(childTile._tileno - (this._tileno << 2));
                }
            }
        }
        return quadrantsToDraw;
    }
}
exports["default"] = AncestorTile;


/***/ }),

/***/ 2919:
/***/ ((__unused_webpack_module, exports) => {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.bootSetup = exports.tapRepos = exports.hipsNodes = void 0;
exports.hipsNodes = [
    "https://skies.esac.esa.int/",
    "https://alasky.cds.unistra.fr/",
];
// If you want to re-enable multiple TAP repos, just uncomment and extend the array
// export const tapRepos: string[] = [
//   "https://archive.eso.org/tap_cat/",
//   "https://archive.eso.org/tap_obs/",
//   "https://sky.esa.int/esasky-tap/tap/",
//   "https://ws.cadc-ccda.hia-iha.nrc-cnrc.gc.ca/argus",
// ];
exports.tapRepos = [
    "https://sky.esa.int/esasky-tap/tap/",
];
exports.bootSetup = {
    insideSphere: false,
    defaultHips: "",
    camera_fov_deg: 34,
    camera_fov_rad: 34 * Math.PI / 180.0,
    inside_camera_fov_deg: 60,
    inside_camera_fov_rad: 60 * Math.PI / 180.0,
    camera_near_plane: 0.00001,
    camera_far_plane: 2.5,
    corsProxyUrl: "http://localhost:4000/",
    useCORSProxy: false,
    maxDecimals: 15,
    // defaultHipsUrl: "//alasky.u-strasbg.fr/DSS/DSSColor/",
    defaultHipsUrl: "https://cdn.skies.esac.esa.int/DSSColor/",
    version: "Astrobrowser v1.0.0",
    debug: false,
    insideView: false,
    showViewfinder: false,
};


/***/ }),

/***/ 2930:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const Point_js_1 = __webpack_require__(6553);
const Point2D_js_1 = __importDefault(__webpack_require__(7559));
const CoordsType_js_1 = __webpack_require__(8145);
class GeomUtils {
    // Orthodromic (great-circle) distance in radians
    static orthodromicDistance(p1, p2) {
        return Math.acos(Math.sin(p1.decDeg * Math.PI / 180) * Math.sin(p2.decDeg * Math.PI / 180) +
            Math.cos(p1.decDeg * Math.PI / 180) * Math.cos(p2.decDeg * Math.PI / 180) *
                Math.cos((p2.raDeg - p1.raDeg) * Math.PI / 180));
    }
    /**
     * Decide the 2D projection strategy and pre-project polygons for point-in-polygon tests.
     * Returns the projected polygons + bbox + a flag describing the projection used:
     * 0 → all points in same hemisphere with |Dec| > 10 → stereographic-like projection using x,y from 3D
     * 1 → all points in equatorial belt (|Dec| < 10) → use RA/Dec directly
     * 2 → equatorial belt and polygon crosses RA=0 → shift RA>180 by -360
     */
    static computeSelectionObject(polygons) {
        let poly4selection = [];
        let flag = 0;
        let maxx;
        let maxy;
        let minx;
        let miny;
        const DEC_THRESHOLD = 10;
        //  1 → northern hemisphere (Dec > +10), -1 → southern (Dec < -10), 0 → equatorial belt
        let hemisphere = 0;
        if (polygons[0][0].decDeg >= DEC_THRESHOLD) {
            hemisphere = 1;
        }
        else if (polygons[0][0].decDeg <= -DEC_THRESHOLD) {
            hemisphere = -1;
        }
        else {
            flag = 1;
        }
        // Case flag = 0 → stereographic-like projection using x,y,z from 3D point
        if (flag === 0) {
            const first = GeomUtils.projectIn2D(polygons[0][0]);
            maxx = minx = first.x;
            maxy = miny = first.y;
            for (const currpoly of polygons) {
                const selpoly = [];
                for (const point of currpoly) {
                    // If a point violates the hemisphere constraint, fall back to belt logic
                    if ((point.decDeg > hemisphere * DEC_THRESHOLD && hemisphere === -1) ||
                        (point.decDeg < hemisphere * DEC_THRESHOLD && hemisphere === 1)) {
                        flag = 1;
                        poly4selection = [];
                        break;
                    }
                    const p = GeomUtils.projectIn2D(point);
                    selpoly.push(p);
                    if (p.x > maxx)
                        maxx = p.x;
                    if (p.y > maxy)
                        maxy = p.y;
                    if (p.x < minx)
                        minx = p.x;
                    if (p.y < miny)
                        miny = p.y;
                }
                poly4selection.push(selpoly);
            }
        }
        if (flag === 0) {
            return {
                poly4selection,
                flag,
                maxx: maxx,
                maxy: maxy,
                minx: minx,
                miny: miny,
            };
        }
        // Case flag = 1 or 2 → work directly in (RA,Dec)
        const RA_THRESHOLD = 180;
        let belowThreshold = polygons[0][0].raDeg < RA_THRESHOLD;
        maxx = minx = polygons[0][0].raDeg;
        maxy = miny = polygons[0][0].decDeg;
        for (const currpoly of polygons) {
            const selpoly = [];
            for (const point of currpoly) {
                const p = new Point2D_js_1.default(point.raDeg, point.decDeg);
                selpoly.push(p);
                if (point.raDeg > maxx)
                    maxx = point.raDeg;
                if (point.decDeg > maxy)
                    maxy = point.decDeg;
                if (point.raDeg < minx)
                    minx = point.raDeg;
                if (point.decDeg < miny)
                    miny = point.decDeg;
                // Detect crossing of RA=0 meridian
                if ((point.raDeg >= RA_THRESHOLD && belowThreshold) ||
                    (point.raDeg <= RA_THRESHOLD && !belowThreshold)) {
                    flag = 2;
                    poly4selection = [];
                    break;
                }
            }
            poly4selection.push(selpoly);
        }
        if (flag === 1) {
            return {
                poly4selection,
                flag,
                maxx,
                maxy,
                minx,
                miny,
            };
        }
        // Case flag = 2 → shift RA>180 by -360 to unwrap around RA=0
        let startRA = polygons[0][0].raDeg;
        maxx = startRA >= RA_THRESHOLD ? startRA - 360 : startRA;
        maxy = polygons[0][0].decDeg;
        minx = maxx;
        miny = maxy;
        for (const currpoly of polygons) {
            const selpoly = [];
            for (const point of currpoly) {
                const curra = point.raDeg >= RA_THRESHOLD ? point.raDeg - 360 : point.raDeg;
                if (curra > maxx)
                    maxx = curra;
                if (point.decDeg > maxy)
                    maxy = point.decDeg;
                if (curra < minx)
                    minx = curra;
                if (point.decDeg < miny)
                    miny = point.decDeg;
                selpoly.push(new Point2D_js_1.default(curra, point.decDeg));
            }
            poly4selection.push(selpoly);
        }
        return {
            poly4selection,
            flag,
            maxx,
            maxy,
            minx,
            miny,
        };
    }
    /** Stereographic projection from 3D point on unit sphere onto plane */
    static stereographic(point) {
        const x = Number(point.xyz[0]);
        const y = Number(point.xyz[1]);
        const z = Number(point.xyz[2]);
        return {
            x: (2 * x) / (1 - z),
            y: (2 * y) / (1 - z),
        };
    }
    static projectIn2D(point) {
        const p = GeomUtils.stereographic(point);
        return new Point2D_js_1.default(p.x, p.y);
    }
    /**
     * Robust point-in-polygon (ray casting) using the precomputed selection object.
     * Works with any of the three flags (0,1,2).
     */
    static checkPointInsidePolygon5(selectionObj, point) {
        let p0;
        if (selectionObj.flag === 0) {
            p0 = GeomUtils.projectIn2D(point);
        }
        else if (selectionObj.flag === 1) {
            p0 = new Point2D_js_1.default(point.raDeg, point.decDeg);
        }
        else {
            const RA_THRESHOLD = 180;
            const raShifted = point.raDeg >= RA_THRESHOLD ? point.raDeg - 360 : point.raDeg;
            p0 = new Point2D_js_1.default(raShifted, point.decDeg);
        }
        const p1 = new Point2D_js_1.default(p0.x, p0.y + 2 * Math.abs(selectionObj.maxy - selectionObj.miny));
        // quick reject by bbox
        if (p0.x > selectionObj.maxx ||
            p0.x < selectionObj.minx ||
            p0.y > selectionObj.maxy ||
            p0.y < selectionObj.miny) {
            return false;
        }
        // Ray casting against each sub-polygon
        for (const currpoly of selectionObj.poly4selection) {
            let intersections = 0;
            for (let i = 0; i < currpoly.length - 1; i++) {
                const p2 = currpoly[i];
                const p3 = currpoly[i + 1];
                const denominator = (p3.y - p2.y) * (p1.x - p0.x) - (p3.x - p2.x) * (p1.y - p0.y);
                const numerator01 = (p3.x - p2.x) * (p0.y - p2.y) - (p3.y - p2.y) * (p0.x - p2.x);
                const numerator23 = (p1.x - p0.x) * (p0.y - p2.y) - (p1.y - p0.y) * (p0.x - p2.x);
                if (denominator !== 0) {
                    const lamda01 = numerator01 / denominator;
                    const lambda23 = numerator23 / denominator;
                    if (lamda01 >= 0 && lamda01 <= 1 && lambda23 >= 0 && lambda23 <= 1) {
                        intersections++;
                    }
                }
            }
            // close the polygon: last with first
            {
                const p2 = currpoly[currpoly.length - 1];
                const p3 = currpoly[0];
                const denominator = (p3.y - p2.y) * (p1.x - p0.x) - (p3.x - p2.x) * (p1.y - p0.y);
                const numerator01 = (p3.x - p2.x) * (p0.y - p2.y) - (p3.y - p2.y) * (p0.x - p2.x);
                const numerator23 = (p1.x - p0.x) * (p0.y - p2.y) - (p1.y - p0.y) * (p0.x - p2.x);
                if (denominator !== 0) {
                    const lamda01 = numerator01 / denominator;
                    const lambda23 = numerator23 / denominator;
                    if (lamda01 >= 0 && lamda01 <= 1 && lambda23 >= 0 && lambda23 <= 1) {
                        intersections++;
                    }
                }
            }
            if (intersections % 2 === 1) {
                return true; // inside this subpolygon
            }
        }
        return false;
    }
    // Legacy version kept for reference; now typed and using getters
    static checkPointInsidePolygon4(polygons, point) {
        const p0 = GeomUtils.projectIn2D(point);
        let maxdist = point.raDeg + 15;
        if (maxdist > 360)
            maxdist = point.raDeg - 15;
        const p1point = new Point_js_1.Point({ raDeg: maxdist, decDeg: point.decDeg }, CoordsType_js_1.CoordsType.ASTRO);
        const p1 = GeomUtils.projectIn2D(p1point);
        for (const currpoly of polygons) {
            let intersections = 0;
            for (let i = 0; i < currpoly.length - 1; i++) {
                const p2 = GeomUtils.projectIn2D(currpoly[i]);
                const p3 = GeomUtils.projectIn2D(currpoly[i + 1]);
                const denominator = (p3.y - p2.y) * (p1.x - p0.x) - (p3.x - p2.x) * (p1.y - p0.y);
                const numerator01 = (p3.x - p2.x) * (p0.y - p2.y) - (p3.y - p2.y) * (p0.x - p2.x);
                const numerator23 = (p1.x - p0.x) * (p0.y - p2.y) - (p1.y - p0.y) * (p0.x - p2.x);
                if (denominator !== 0) {
                    const lamda01 = numerator01 / denominator;
                    const lambda23 = numerator23 / denominator;
                    if (lamda01 >= 0 && lamda01 <= 1 && lambda23 >= 0 && lambda23 <= 1) {
                        intersections++;
                    }
                }
            }
            {
                const p2 = GeomUtils.projectIn2D(currpoly[currpoly.length - 1]);
                const p3 = GeomUtils.projectIn2D(currpoly[0]);
                const denominator = (p3.y - p2.y) * (p1.x - p0.x) - (p3.x - p2.x) * (p1.y - p0.y);
                const numerator01 = (p3.x - p2.x) * (p0.y - p2.y) - (p3.y - p2.y) * (p0.x - p2.x);
                const numerator23 = (p1.x - p0.x) * (p0.y - p2.y) - (p1.y - p0.y) * (p0.x - p2.x);
                if (denominator !== 0) {
                    const lamda01 = numerator01 / denominator;
                    const lambda23 = numerator23 / denominator;
                    if (lamda01 >= 0 && lamda01 <= 1 && lambda23 >= 0 && lambda23 <= 1) {
                        intersections++;
                    }
                }
            }
            if (intersections % 2 === 1)
                return true;
        }
        return false;
    }
}
exports["default"] = GeomUtils;


/***/ }),

/***/ 3174:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.XYZAncestorTile = exports.XYZAnchestorTile = void 0;
const XYZMeshBuilder_js_1 = __webpack_require__(8819);
const XYZTile_js_1 = __webpack_require__(1375);
class XYZAnchestorTile extends XYZTile_js_1.XYZTile {
    _ancestorMeshBuilder;
    _ancestorWebgl;
    _segmentsPerSide;
    _meshCache = new Map();
    constructor(coord, url, webgl, shaderProgram, meshBuilder = new XYZMeshBuilder_js_1.XYZMeshBuilder(), segmentsPerSide = 16) {
        super(coord, url, webgl, shaderProgram, meshBuilder, segmentsPerSide);
        this._ancestorMeshBuilder = meshBuilder;
        this._ancestorWebgl = webgl;
        this._segmentsPerSide = segmentsPerSide;
    }
    draw(pMatrixOrVisibleZoom, vMatrixOrVisibleTiles, mMatrixOrAncestorsMap, colorMapIdxOrPMatrix, vMatrix, mMatrix, colorMapIdx) {
        if (typeof pMatrixOrVisibleZoom !== 'number') {
            return super.draw(pMatrixOrVisibleZoom, vMatrixOrVisibleTiles, mMatrixOrAncestorsMap, colorMapIdxOrPMatrix);
        }
        if (!vMatrix || !mMatrix || colorMapIdx === undefined) {
            return false;
        }
        const visibleZoom = pMatrixOrVisibleZoom;
        const visibleTiles = vMatrixOrVisibleTiles;
        const ancestorsMap = mMatrixOrAncestorsMap;
        const pMatrix = colorMapIdxOrPMatrix;
        let drawn = false;
        if (visibleZoom <= this.coord.z) {
            return super.draw(pMatrix, vMatrix, mMatrix, colorMapIdx);
        }
        for (const targetTile of visibleTiles) {
            if (!this.isAncestorOf(targetTile)) {
                continue;
            }
            const ancestorKey = `${this.coord.z}/${this.coord.x}/${this.coord.y}`;
            if (!ancestorsMap.has(ancestorKey)) {
                continue;
            }
            const mesh = this.getRemappedMesh(targetTile);
            drawn = super.drawRemapped(mesh, pMatrix, vMatrix, mMatrix, colorMapIdx) || drawn;
        }
        return drawn;
    }
    dispose() {
        for (const mesh of this._meshCache.values()) {
            if (mesh.positionBuffer)
                this._ancestorWebgl.deleteBuffer(mesh.positionBuffer);
            if (mesh.uvBuffer)
                this._ancestorWebgl.deleteBuffer(mesh.uvBuffer);
            if (mesh.indexBuffer)
                this._ancestorWebgl.deleteBuffer(mesh.indexBuffer);
        }
        this._meshCache.clear();
        super.dispose();
    }
    getRemappedMesh(targetTile) {
        const key = `${targetTile.z}/${targetTile.x}/${targetTile.y}->${this.coord.z}/${this.coord.x}/${this.coord.y}`;
        const existing = this._meshCache.get(key);
        if (existing) {
            return existing;
        }
        const mesh = this._ancestorMeshBuilder.buildAncestorMesh(targetTile, this.coord, this._segmentsPerSide);
        const uploaded = this._ancestorMeshBuilder.uploadMesh(mesh, this._ancestorWebgl);
        this._meshCache.set(key, uploaded);
        return uploaded;
    }
    isAncestorOf(targetTile) {
        if (targetTile.z <= this.coord.z) {
            return targetTile.z === this.coord.z
                && targetTile.x === this.coord.x
                && targetTile.y === this.coord.y;
        }
        const dz = targetTile.z - this.coord.z;
        return (targetTile.x >> dz) === this.coord.x && (targetTile.y >> dz) === this.coord.y;
    }
}
exports.XYZAnchestorTile = XYZAnchestorTile;
exports.XYZAncestorTile = XYZAnchestorTile;


/***/ }),

/***/ 3559:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CatalogueShaderProgram = void 0;
// HiPSShaderProgram.ts
const gl_matrix_1 = __webpack_require__(1961);
const ShaderManager_js_1 = __importDefault(__webpack_require__(5947));
// export default class CatalogueShaderProgram {
class CatalogueShaderProgram {
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
            m_model_view: 'uMVMatrix'
        };
        this.gl_attributes = {
            vertex_pos: 'aCatPosition',
            vertex_selected: 'a_selected',
            point_size: 'a_pointsize',
            point_hue: 'a_brightness'
        };
        this.locations = {
            pMatrix: null,
            mvMatrix: null,
            color: null,
            position: -1,
            hovered: -1,
            pointSize: -1,
            brightness: -1
        };
    }
    get shaderProgram() {
        if (!this._shaderProgram) {
            // const gl = global.gl as GL
            const gl = this._webgl;
            this._shaderProgram = gl.createProgram();
            this.initShaders();
        }
        return this._shaderProgram;
    }
    initShaders() {
        // const gl = global.gl as GL
        const gl = this._webgl;
        const fragmentShaderStr = ShaderManager_js_1.default.catalogueFS();
        this._fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(this._fragmentShader, fragmentShaderStr);
        gl.compileShader(this._fragmentShader);
        console.log('FS log:', gl.getShaderInfoLog(this._fragmentShader) || 'ok');
        if (!gl.getShaderParameter(this._fragmentShader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(this._fragmentShader) || 'Fragment shader compile error');
            return;
        }
        const vertexShaderStr = ShaderManager_js_1.default.catalogueVS();
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
        // shaderUtility.useProgram(this.shaderProgram)
        gl.useProgram(this.shaderProgram);
        this.locations.position = gl.getAttribLocation(this.shaderProgram, this.gl_attributes.vertex_pos);
        this.locations.hovered = gl.getAttribLocation(this.shaderProgram, this.gl_attributes.vertex_selected);
        this.locations.pointSize = gl.getAttribLocation(this.shaderProgram, this.gl_attributes.point_size);
        this.locations.brightness = gl.getAttribLocation(this.shaderProgram, this.gl_attributes.point_hue);
        this.locations.color = gl.getUniformLocation(this.shaderProgram, this.gl_uniforms.vertex_color);
    }
    enableShaders(pMatrix, modelMatrix, viewMatrix) {
        // const gl = global.gl as GL
        const gl = this._webgl;
        // shaderUtility.useProgram(this.shaderProgram)
        gl.useProgram(this.shaderProgram);
        this.locations.pMatrix = gl.getUniformLocation(this.shaderProgram, this.gl_uniforms.m_perspective);
        this.locations.mvMatrix = gl.getUniformLocation(this.shaderProgram, this.gl_uniforms.m_model_view);
        let mvMatrix = gl_matrix_1.mat4.create();
        mvMatrix = gl_matrix_1.mat4.multiply(mvMatrix, viewMatrix, modelMatrix);
        gl.uniformMatrix4fv(this.locations.pMatrix, false, pMatrix);
        gl.uniformMatrix4fv(this.locations.mvMatrix, false, mvMatrix);
    }
}
exports.CatalogueShaderProgram = CatalogueShaderProgram;
// export const catalogueShaderProgram = new CatalogueShaderProgram()


/***/ }),

/***/ 3726:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HiPS = void 0;
/**
 * @author Fabrizio Giordano (Fab77)
 */
const AbstractSkyEntity_js_1 = __webpack_require__(4735);
const FoVHelper_js_1 = __webpack_require__(229);
const ColorMaps_js_1 = __importDefault(__webpack_require__(619));
const AncestorTile_js_1 = __importDefault(__webpack_require__(2885));
const AllSky_js_1 = __importDefault(__webpack_require__(2368));
class HiPS extends AbstractSkyEntity_js_1.AbstractSkyEntity {
    _ancestorTiles;
    _allSkyTile;
    _descriptor;
    _format;
    _baseurl;
    _maxorder;
    _minorder;
    _visibleorder = 3;
    _allSky = true;
    samplerIdx = 0;
    colorMapIdx = 0;
    colorMap = ColorMaps_js_1.default['native'];
    _healpixGrid;
    // exposed read-only helpers
    get maxOrder() { return this._maxorder; }
    get minOrder() { return this._minorder; }
    get baseURL() { return this._baseurl; }
    get format() { return this._format; }
    get propertiesRawText() { return this._descriptor.propertiesRawText; }
    get properties() { return this._descriptor.properties; }
    constructor(radius, position, xrad, yrad, descriptor, webgl, healpixGrid) {
        super(radius, position, xrad, yrad, descriptor.surveyName, webgl, descriptor.isGalactic);
        this._descriptor = descriptor;
        this.initGL(webgl);
        this._healpixGrid = healpixGrid;
        this._healpixGrid.visibleTilesManager.tileBuffer.addHiPS(this);
        // DEBUG logs kept from JS (optional)
        // eslint-disable-next-line no-console
        console.log('HiPS frame ' + descriptor.hipsFrame);
        // eslint-disable-next-line no-console
        console.log('HiPS minOrder ' + descriptor.minOrder);
        this._format = descriptor.imgFormats[0];
        this._baseurl = descriptor.url;
        this._maxorder = descriptor.maxOrder;
        this._minorder = descriptor.minOrder;
        this.initShaders();
        // pick initial order from a starting FoV
        const fov = 180;
        let order = FoVHelper_js_1.fovHelper.getHiPSNorder(fov);
        this._visibleorder = Math.min(order, this._maxorder);
        this._ancestorTiles = [];
        this._allSkyTile = null;
        // auto-detect all-sky: original code forces true
        this._allSky = true;
        if (this._allSky) {
            this._allSkyTile = new AllSky_js_1.default(this, this._webgl, this._healpixGrid.visibleTilesManager.tileBuffer, super.hipsShaderProgram);
        }
        else {
            for (let t = 0; t < 12; t++) {
                this._ancestorTiles.push(new AncestorTile_js_1.default(t, 0, this, this._healpixGrid.visibleTilesManager.tileBuffer, super.hipsShaderProgram, this._webgl));
            }
        }
    }
    getProperty(key) {
        return this._descriptor.getProperty(key);
    }
    changeFormat(format) {
        this._format = format;
        // original code referenced _tileBuffer; if you have one, wire it back.
        // Keeping calls no-op to avoid breaking at runtime if _tileBuffer is undefined.
        // (newVisibleTilesManager + TileBuffer drive the actual tile lifecycle)
        // @ts-ignore
        if (this._tileBuffer?.clearAll)
            this._tileBuffer.clearAll();
        // @ts-ignore
        if (this._tileBuffer)
            this._tileBuffer._format = this._format;
        const pixelByOrder = this.isGalacticHips
            ? this._healpixGrid.visibleTilesManager.galVisibleTilesByOrder
            : this._healpixGrid.visibleTilesManager.visibleTilesByOrder;
        // const pixelByOrder =
        //   this.isGalacticHips
        //     ? visibleTilesManager.galVisibleTilesByOrder
        //     : visibleTilesManager.visibleTilesByOrder
        // @ts-ignore
        if (this._tileBuffer?.updateTiles)
            this._tileBuffer.updateTiles(pixelByOrder.pixels, pixelByOrder.order);
    }
    /**
     * Shader colormap switcher
     * 0 -> native
     * 1 -> grayscale
     * 2 -> planck
     * 3 -> cmb
     * 4 -> rainbow
     * 5 -> eosb
     * 6 -> cubehelix
     */
    changeColorMap(colorMap) {
        console.log('HiPS.changeColorMap -> shaderProgram', super.hipsShaderProgram.shaderProgram);
        this.colorMap = colorMap;
        switch (colorMap.name) {
            case 'grayscale':
                this.colorMapIdx = 1;
                // hipsShaderProgram.setGrayscaleShader()
                this.colorMap = ColorMaps_js_1.default['grayscale'];
                super.hipsShaderProgram.setGrayscaleShader();
                break;
            case 'planck':
                this.colorMapIdx = 2;
                this.colorMap = ColorMaps_js_1.default['planck'];
                // hipsShaderProgram.setColorMapShader()
                super.hipsShaderProgram.setColorMapShader();
                break;
            case 'cmb':
                this.colorMapIdx = 3;
                this.colorMap = ColorMaps_js_1.default['cmb'];
                // hipsShaderProgram.setColorMapShader()
                super.hipsShaderProgram.setColorMapShader();
                break;
            case 'rainbow':
                this.colorMapIdx = 4;
                this.colorMap = ColorMaps_js_1.default['rainbow'];
                // hipsShaderProgram.setColorMapShader()
                super.hipsShaderProgram.setColorMapShader();
                break;
            case 'eosb':
                this.colorMapIdx = 5;
                this.colorMap = ColorMaps_js_1.default['eosb'];
                super.hipsShaderProgram.setColorMapShader();
                // hipsShaderProgram.setColorMapShader()
                break;
            case 'cubehelix':
                this.colorMapIdx = 6;
                this.colorMap = ColorMaps_js_1.default['cubehelix'];
                super.hipsShaderProgram.setColorMapShader();
                // hipsShaderProgram.setColorMapShader()
                break;
            case 'hot':
                this.colorMapIdx = 7;
                this.colorMap = ColorMaps_js_1.default['hot'];
                super.hipsShaderProgram.setColorMapShader();
                // hipsShaderProgram.setColorMapShader()
                break;
            case 'gray':
                this.colorMapIdx = 8;
                this.colorMap = ColorMaps_js_1.default['gray'];
                super.hipsShaderProgram.setColorMapShader();
                // hipsShaderProgram.setColorMapShader()
                break;
            case 'native':
                this.colorMapIdx = 0;
                this.colorMap = ColorMaps_js_1.default['native'];
                super.hipsShaderProgram.setNativeShader();
                break;
            default:
                this.colorMapIdx = 9;
                this.colorMap = colorMap;
                super.hipsShaderProgram.setColorMapShader();
        }
    }
    initShaders() {
        super.hipsShaderProgram.enableProgram();
        // hipsShaderProgram.enableProgram()
        // this.shaderProgram = super.hipsShaderProgram.shaderProgram
        // this.shaderProgram = hipsShaderProgram.shaderProgram
    }
    getCurrentHealpixOrder() {
        return this._visibleorder;
    }
    getDebugStats() {
        const tileBuffer = this._healpixGrid.visibleTilesManager.tileBuffer;
        const visibleTiles = this.isGalacticHips
            ? this._healpixGrid.visibleTilesManager.galVisibleTilesByOrder
            : this._healpixGrid.visibleTilesManager.visibleTilesByOrder;
        return {
            activeBaseLayer: 'hips',
            hipsName: this._descriptor.surveyName,
            hipsUrl: this._baseurl,
            isGalactic: this.isGalacticHips,
            currentOrder: visibleTiles.order,
            visibleTileCount: visibleTiles.pixels.length,
            activeTileCount: tileBuffer.activeTileCount,
            cachedTileCount: tileBuffer.cachedTileCount,
            cacheSize: tileBuffer.size,
            readyTileCount: tileBuffer.readyTileCount,
            loadingTileCount: tileBuffer.loadingTileCount,
        };
    }
    refresh(input) {
        // const fov = this._healpixGrid.getMinFoV()
        // this._visibleorder = Math.min(fovHelper.getHiPSNorder(fov), this._maxorder)
        const rawFov = input.fovDeg ?? this._healpixGrid.getMinFoV();
        const fov = Number.isFinite(rawFov) && rawFov > 0 ? rawFov : 1e-6;
        this._visibleorder = Math.min(FoVHelper_js_1.fovHelper.getHiPSNorder(fov, this._visibleorder), this._maxorder);
    }
    draw(input) {
        const vMatrix = input.camera.getCameraMatrix();
        if (!vMatrix)
            return;
        const pMatrix = input.pMatrix;
        if (!pMatrix)
            return;
        this.refresh(input);
        const mMatrix = this.getModelMatrix();
        super.hipsShaderProgram.setRuntimeColorMap(this.colorMap);
        if (this._allSky && this._allSkyTile) {
            if (this.isGalacticHips) {
                this._allSkyTile.draw(this._healpixGrid.visibleTilesManager.galVisibleTilesByOrder.order, this._healpixGrid.visibleTilesManager.galAncestorsMap, 
                // visibleTilesManager.galVisibleTilesByOrder.order,
                // visibleTilesManager.galAncestorsMap,
                pMatrix, vMatrix, mMatrix, this.colorMapIdx);
            }
            else {
                this._allSkyTile.draw(this._healpixGrid.visibleTilesManager.visibleTilesByOrder.order, this._healpixGrid.visibleTilesManager.ancestorsMap, 
                // visibleTilesManager.visibleTilesByOrder.order,
                // visibleTilesManager.ancestorsMap,
                pMatrix, vMatrix, mMatrix, this.colorMapIdx);
            }
            return;
        }
        // Non all-sky path
        const order = this.isGalacticHips
            ? this._healpixGrid.visibleTilesManager.galVisibleTilesByOrder.order
            : this._healpixGrid.visibleTilesManager.visibleTilesByOrder.order;
        const map = this.isGalacticHips
            ? this._healpixGrid.visibleTilesManager.galAncestorsMap
            : this._healpixGrid.visibleTilesManager.ancestorsMap;
        this._ancestorTiles.forEach((ancestor) => {
            ancestor.draw(order, map, pMatrix, vMatrix, mMatrix, this.colorMapIdx);
        });
    }
}
exports.HiPS = HiPS;


/***/ }),

/***/ 3956:
/***/ ((__unused_webpack_module, exports) => {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WMTSAdapter = void 0;
function replaceTokens(template, values) {
    return Object.entries(values).reduce((result, [key, value]) => result.replace(new RegExp(`\\{${key}\\}`, 'g'), value), template);
}
class WMTSAdapter {
    _config;
    constructor(config) {
        this._config = config;
    }
    toXYZLayerConfig() {
        const inferredMaxZoom = this.getInferredMaxZoom();
        return {
            urlTemplate: this._config.urlTemplate ?? this._config.baseUrl,
            minZoom: this._config.minZoom,
            maxZoom: inferredMaxZoom,
            segmentsPerSide: this._config.segmentsPerSide,
            tileSize: this._config.tileSize,
            maxCachedTiles: this._config.maxCachedTiles,
            subdomains: this._config.subdomains,
            attribution: this._config.attribution,
            flipY: this._config.flipY,
            urlResolver: (tile) => this.getTileUrl(tile),
        };
    }
    getInferredMaxZoom() {
        const matrixLabelCount = this._config.matrixLabels?.length ?? 0;
        const maxFromLabels = matrixLabelCount > 0 ? matrixLabelCount - 1 : undefined;
        if (maxFromLabels == null) {
            return this._config.maxZoom;
        }
        if (this._config.maxZoom == null) {
            return maxFromLabels;
        }
        return Math.min(this._config.maxZoom, maxFromLabels);
    }
    getTileUrl(tile) {
        return this._config.requestEncoding === 'rest'
            ? this.buildRestUrl(tile)
            : this.buildKvpUrl(tile);
    }
    buildRestUrl(tile) {
        const template = this._config.urlTemplate ?? this._config.baseUrl;
        const values = this.getCommonTokenValues(tile);
        const resolved = replaceTokens(template, values);
        return resolved.replace(/(?<!:)\/{2,}/g, '/');
    }
    buildKvpUrl(tile) {
        const baseUrl = new URL(this._config.baseUrl);
        const values = this.getCommonTokenValues(tile);
        const params = baseUrl.searchParams;
        params.set('SERVICE', 'WMTS');
        params.set('REQUEST', 'GetTile');
        params.set('VERSION', this._config.version ?? '1.0.0');
        params.set('LAYER', this._config.layer);
        params.set('STYLE', this._config.style ?? 'default');
        params.set('FORMAT', this._config.format ?? 'image/png');
        params.set('TILEMATRIXSET', this._config.tileMatrixSet);
        params.set('TILEMATRIX', values.TileMatrix);
        params.set('TILEROW', values.TileRow);
        params.set('TILECOL', values.TileCol);
        for (const [key, value] of Object.entries(this._config.dimensions ?? {})) {
            params.set(key, value);
        }
        return baseUrl.toString();
    }
    getCommonTokenValues(tile) {
        const dim = 2 ** tile.z;
        const effectiveY = this._config.flipY ? dim - 1 - tile.y : tile.y;
        const matrixLabel = this._config.matrixLabels?.[tile.z] ?? String(tile.z);
        const tileFormat = this._config.format ?? 'image/png';
        const tileFormatExtension = tileFormat.replace(/^image\//, '');
        return {
            Layer: this._config.layer,
            Style: this._config.style ?? 'default',
            Time: this._config.time ?? '',
            TileMatrixSet: this._config.tileMatrixSet,
            TileMatrix: matrixLabel,
            TileRow: String(effectiveY),
            TileCol: String(tile.x),
            Format: tileFormatExtension,
            TileFormat: tileFormat,
            TileFormatExtension: tileFormatExtension,
            ...Object.fromEntries(Object.entries(this._config.dimensions ?? {}).map(([key, value]) => [key, value])),
        };
    }
}
exports.WMTSAdapter = WMTSAdapter;


/***/ }),

/***/ 4006:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TileBuffer = void 0;
// TileBuffer.ts
const Tile_js_1 = __importDefault(__webpack_require__(8256)); // adjust if your file is named differently
// export default class TileBuffer {
class TileBuffer {
    // Equatorial
    _tiles;
    _cachedTiles;
    _activeHiPS;
    // Galactic
    _galTiles;
    _galCachedTiles;
    _galActiveHiPS;
    _cacheAliveMilliSeconds;
    _cleanerId;
    _webgl;
    _visibleTileManager;
    _hipsShaderProgram;
    constructor(minutesToLiveInCache = 1, webgl, hipsShaderProgram, visibleTileManager) {
        this._hipsShaderProgram = hipsShaderProgram;
        this._visibleTileManager = visibleTileManager;
        this._webgl = webgl;
        this._tiles = new Map();
        this._cachedTiles = new Map();
        this._activeHiPS = new Map();
        this._galTiles = new Map();
        this._galCachedTiles = new Map();
        this._galActiveHiPS = new Map();
        this._cacheAliveMilliSeconds = minutesToLiveInCache * 60 * 1000;
        this._cleanerId = window.setInterval(() => {
            this.cacheCleaner();
        }, 10_000);
    }
    /** Register an equatorial HiPS into the buffer. */
    addHiPS(hips) {
        if (this._activeHiPS.has(hips)) {
            console.error('HiPS already present in TileBuffer');
            return;
        }
        this._activeHiPS.set(hips, new Map());
    }
    /** Register a galactic HiPS into the buffer. */
    addGalHiPS(hips) {
        if (this._galActiveHiPS.has(hips)) {
            console.error('HiPS already present in TileBuffer');
            return;
        }
        this._galActiveHiPS.set(hips, new Map());
    }
    /** Preload/add tile for every registered equatorial HiPS. */
    addTile(order, tileno) {
        for (const hips of this._activeHiPS.keys()) {
            if (order > hips.maxOrder) {
                continue;
            }
            this.getTile(tileno, order, hips);
        }
    }
    /** Preload/add tile for every registered galactic HiPS. */
    addGalTile(order, tileno) {
        for (const hips of this._galActiveHiPS.keys()) {
            if (order > hips.maxOrder) {
                continue;
            }
            this.getGalTile(tileno, order, hips);
        }
    }
    /** Fetch (or create) an equatorial tile, reviving from cache if present. */
    getTile(tileno, order, hips) {
        const tileKey = this.key(order, tileno, hips.baseURL);
        if (!this._tiles.has(tileKey)) {
            if (this._cachedTiles.has(tileKey)) {
                const tile = this._cachedTiles.get(tileKey);
                this._tiles.set(tileKey, tile);
                this._cachedTiles.delete(tileKey);
                tile.resetCacheTime0();
            }
            else {
                // const tile = new Tile(tileno, order, hips as any, this, this._webgl, this._visibleTileManager, this._hipsShaderProgram)
                const tile = new Tile_js_1.default(tileno, order, hips, this, this._webgl, this._visibleTileManager);
                this._tiles.set(tileKey, tile);
            }
        }
        return this._tiles.get(tileKey);
    }
    /** Fetch (or create) a galactic tile, reviving from cache if present. */
    getGalTile(tileno, order, hips) {
        const tileKey = this.key(order, tileno, hips.baseURL);
        if (!this._galTiles.has(tileKey)) {
            if (this._galCachedTiles.has(tileKey)) {
                const tile = this._galCachedTiles.get(tileKey);
                this._galTiles.set(tileKey, tile);
                this._galCachedTiles.delete(tileKey);
                tile.resetCacheTime0();
            }
            else {
                // const tile = new Tile(tileno, order, hips as any, this, this._webgl, this._visibleTileManager, this._hipsShaderProgram)
                const tile = new Tile_js_1.default(tileno, order, hips, this, this._webgl, this._visibleTileManager);
                this._galTiles.set(tileKey, tile);
            }
        }
        return this._galTiles.get(tileKey);
    }
    /** Move a tile (equatorial or galactic) into cache. */
    moveTileToCache(tileno, order, hips) {
        const tileKey = this.key(order, tileno, hips.baseURL);
        if (this._tiles.has(tileKey)) {
            const tile = this._tiles.get(tileKey);
            tile.setCacheTime0();
            this._cachedTiles.set(tileKey, tile);
            this._tiles.delete(tileKey);
        }
        if (this._galTiles.has(tileKey)) {
            const tile = this._galTiles.get(tileKey);
            tile.setCacheTime0();
            this._galCachedTiles.set(tileKey, tile);
            this._galTiles.delete(tileKey);
        }
    }
    /** Periodically purge stale cached tiles. */
    cacheCleaner() {
        const now = Date.now();
        for (const [tileKey, tile] of this._cachedTiles) {
            const t0 = tile.cacheTime0;
            if (!tile.inView && t0 !== undefined && now - t0 > this._cacheAliveMilliSeconds) {
                tile.destroyIntervals();
                this._cachedTiles.delete(tileKey);
            }
        }
        for (const [tileKey, tile] of this._galCachedTiles) {
            const t0 = tile.cacheTime0;
            if (!tile.inView && t0 !== undefined && now - t0 > this._cacheAliveMilliSeconds) {
                tile.destroyIntervals();
                this._galCachedTiles.delete(tileKey);
            }
        }
    }
    /** Compose a stable key for maps. */
    key(order, tileno, baseURL) {
        return `${order}#${tileno}#${baseURL}`;
    }
    /** Optional: call to stop internal timers if you dispose this buffer. */
    dispose() {
        window.clearInterval(this._cleanerId);
    }
    get size() {
        return this._tiles.size + this._cachedTiles.size + this._galTiles.size + this._galCachedTiles.size;
    }
    get activeTileCount() {
        return this._tiles.size + this._galTiles.size;
    }
    get cachedTileCount() {
        return this._cachedTiles.size + this._galCachedTiles.size;
    }
    get readyTileCount() {
        let count = 0;
        for (const tile of this._tiles.values()) {
            if (tile.getReadyState())
                count++;
        }
        for (const tile of this._galTiles.values()) {
            if (tile.getReadyState())
                count++;
        }
        for (const tile of this._cachedTiles.values()) {
            if (tile.getReadyState())
                count++;
        }
        for (const tile of this._galCachedTiles.values()) {
            if (tile.getReadyState())
                count++;
        }
        return count;
    }
    get loadingTileCount() {
        let count = 0;
        for (const tile of this._tiles.values()) {
            if (tile.isLoading())
                count++;
        }
        for (const tile of this._galTiles.values()) {
            if (tile.isLoading())
                count++;
        }
        for (const tile of this._cachedTiles.values()) {
            if (tile.isLoading())
                count++;
        }
        for (const tile of this._galCachedTiles.values()) {
            if (tile.isLoading())
                count++;
        }
        return count;
    }
}
exports.TileBuffer = TileBuffer;
// Singleton (kept for compatibility with your original export)
// export const newTileBuffer = new TileBuffer()


/***/ }),

/***/ 4382:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

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

Object.defineProperty(exports, "__esModule", ({ value: true }));
const healpixjs_1 = __webpack_require__(1138);
const Config_js_1 = __webpack_require__(2919);
class Global {
    // --- cached / runtime state ---
    // private _camera: Camera | null;
    // private _gl: GL | null;
    _healpix;
    // --- config/state flags ---
    _selectionnside;
    // private _healpix4footprints: boolean;
    _useCORSProxy;
    _corsProxyUrl;
    _maxDecimals;
    _debug;
    _insideSphere;
    _version;
    constructor() {
        this._useCORSProxy = Config_js_1.bootSetup.useCORSProxy;
        this._corsProxyUrl = Config_js_1.bootSetup.corsProxyUrl;
        this._maxDecimals = Config_js_1.bootSetup.maxDecimals;
        this._debug = Config_js_1.bootSetup.debug;
        this._insideSphere = Config_js_1.bootSetup.insideView;
        this._version = Config_js_1.bootSetup.version;
        this._healpix = {};
        this._selectionnside = 32;
    }
    init() {
        console.log('Global.init()');
    }
    // --- getters/setters ---
    get version() { return this._version; }
    set corsProxyUrl(url) { this._corsProxyUrl = url; }
    get corsProxyUrl() { return this._corsProxyUrl; }
    get useCORSProxy() { return this._useCORSProxy; }
    set useCORSProxy(enabled) { this._useCORSProxy = enabled; }
    get debug() { return this._debug; }
    getHealpix(order) {
        if (this._healpix[order] === undefined) {
            // order is HEALPix "order" ⇒ nside = 2^order
            this._healpix[order] = new healpixjs_1.Healpix(Math.pow(2, order));
        }
        return this._healpix[order];
    }
    get MAX_DECIMALS() { return this._maxDecimals; }
    set insideSphere(v) { this._insideSphere = v; }
    get insideSphere() { return this._insideSphere; }
    get nsideForSelection() { return this._selectionnside; }
}
const global = new Global();
exports["default"] = global;


/***/ }),

/***/ 4396:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
/**
 * @author Fabrizio Giordano (Fab)
 */
const gl_matrix_1 = __webpack_require__(1961);
const healpixjs_1 = __webpack_require__(1138);
const Global_js_1 = __importDefault(__webpack_require__(4382));
const Utils_js_1 = __webpack_require__(7930);
function toVec3(p) {
    return Array.isArray(p) ? gl_matrix_1.vec3.fromValues(p[0], p[1], p[2]) : p;
}
class MouseHelper {
    _xyz = null;
    _raDecDeg = null;
    _phiThetaDeg = null;
    raHMS;
    decDMS;
    /**
     * @param in_xyz [x, y, z]
     * @param in_raDecDeg { ra, dec } in degrees (ICRS/J2000)
     * @param in_phiThetaDeg { phi, theta } in degrees (spherical)
     */
    constructor(in_xyz, in_raDecDeg, in_phiThetaDeg) {
        if (in_xyz != null)
            this._xyz = in_xyz;
        if (in_raDecDeg != null)
            this._raDecDeg = in_raDecDeg;
        if (in_phiThetaDeg != null)
            this._phiThetaDeg = in_phiThetaDeg;
        if (this._raDecDeg) {
            this.raHMS = (0, Utils_js_1.raDegToHMS)(this._raDecDeg.ra);
            this.decDMS = (0, Utils_js_1.decDegToDMS)(this._raDecDeg.dec);
        }
    }
    /** (Formerly `computeNpix256`) Uses global.nsideForSelection. */
    computeNpix() {
        if (!this._xyz)
            return null;
        const hp = Global_js_1.default.getHealpix(Global_js_1.default.nsideForSelection);
        const v = new healpixjs_1.Vec3(this._xyz[0], this._xyz[1], this._xyz[2]);
        const ptg = new healpixjs_1.Pointing(v, false);
        return hp.ang2pix(ptg, false);
    }
    /** Update helper state from a world-space 3D point on the unit sphere. */
    update(mousePoint) {
        const mp = toVec3(mousePoint);
        const sph = (0, Utils_js_1.cartesianToSpherical)(mp);
        const radec = (0, Utils_js_1.sphericalToAstroDeg)(sph.phi, sph.theta);
        this._xyz = [mp[0], mp[1], mp[2]];
        this._phiThetaDeg = sph;
        this._raDecDeg = radec;
        this.raHMS = (0, Utils_js_1.raDegToHMS)(radec.ra);
        this.decDMS = (0, Utils_js_1.decDegToDMS)(radec.dec);
    }
    clear() {
        this._xyz = null;
        this._raDecDeg = null;
        this._phiThetaDeg = null;
        this.raHMS = undefined;
        this.decDMS = undefined;
    }
    // --- getters ---
    get xyz() {
        return this._xyz;
    }
    get x() {
        return this._xyz ? this._xyz[0] : null;
    }
    get y() {
        return this._xyz ? this._xyz[1] : null;
    }
    get z() {
        return this._xyz ? this._xyz[2] : null;
    }
    get ra() {
        return this._raDecDeg ? this._raDecDeg.ra : null;
    }
    get dec() {
        return this._raDecDeg ? this._raDecDeg.dec : null;
    }
    get phi() {
        return this._phiThetaDeg ? this._phiThetaDeg.phi : null;
    }
    get theta() {
        return this._phiThetaDeg ? this._phiThetaDeg.theta : null;
    }
    get raDecDeg() {
        return this._raDecDeg;
    }
    get phiThetaDeg() {
        return this._phiThetaDeg;
    }
}
exports["default"] = MouseHelper;


/***/ }),

/***/ 4595:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HealpixGrid = void 0;
const AbstractSkyEntity_js_1 = __webpack_require__(4735);
const Global_js_1 = __importDefault(__webpack_require__(4382));
const gl_matrix_1 = __webpack_require__(1961);
const FoVHelper_js_1 = __webpack_require__(229);
const FoVUtils_js_1 = __webpack_require__(8083);
const SphereFoV_js_1 = __webpack_require__(5803);
const CoordsType_js_1 = __webpack_require__(8145);
const Point_js_1 = __webpack_require__(6553);
const GridShaderManager_js_1 = __importDefault(__webpack_require__(4707));
const GeomUtils_js_1 = __importDefault(__webpack_require__(2930));
const GridTextHelper_js_1 = __importDefault(__webpack_require__(5361));
const Utils_js_1 = __webpack_require__(7930);
const VisibleTilesManager_js_1 = __webpack_require__(2056);
const Config_js_1 = __webpack_require__(2919);
class HealpixGrid extends AbstractSkyEntity_js_1.AbstractSkyEntity {
    static ELEM_SIZE = 3;
    static BYTES_X_ELEM = new Float32Array().BYTES_PER_ELEMENT;
    _visibleorder = 0;
    showGrid = false;
    _shaderProgram;
    fragmentShader;
    vertexShader;
    defaultColor = '#ec0acaff';
    gridText = new GridTextHelper_js_1.default('healpix');
    // private _hipsShaderProgram: HiPSShaderProgram
    _attribLocations = {
        position: 0,
        selected: 1,
        pointSize: 2,
        color: 3,
    };
    _nPrimitiveFlags = 0;
    _vertexCataloguePositionBuffer;
    _indexBuffer;
    _vertexCataloguePosition = new Float32Array(0);
    _indexes = new Uint32Array(0);
    _fovObj;
    static INITIAL_FOV = 180;
    static RADIUS = 1;
    static INITIAL_POSITION = [0.0, 0.0, 0.0];
    static INITIAL_PhiRad = 0;
    static INITIAL_ThetaRad = 0;
    _visibleTilesManager;
    constructor(webgl) {
        super(HealpixGrid.RADIUS, HealpixGrid.INITIAL_POSITION, HealpixGrid.INITIAL_PhiRad, HealpixGrid.INITIAL_ThetaRad, 'healpix-grid', webgl);
        this.init();
        this._visibleTilesManager = new VisibleTilesManager_js_1.VisibleTilesManager(this._webgl, super.hipsShaderProgram, this);
        this._visibleTilesManager.init(Config_js_1.bootSetup.insideSphere);
    }
    init() {
        console.log('HealpixGridSingleton.init()');
        this.initGL(super.webgl);
        this._shaderProgram = super.webgl.createProgram();
        this.initShaders();
        const order = FoVHelper_js_1.fovHelper.getHiPSNorder(HealpixGrid.INITIAL_FOV);
        this._visibleorder = order;
        this._nPrimitiveFlags = 0;
        this._vertexCataloguePositionBuffer = super.webgl.createBuffer();
        this._indexBuffer = super.webgl.createBuffer();
        this._vertexCataloguePosition = new Float32Array(0);
        this._fovObj = new SphereFoV_js_1.SphereFoV(super.webgl);
    }
    get fovObj() {
        return this._fovObj;
    }
    get RADIUS() {
        return HealpixGrid.RADIUS;
    }
    get INITIAL_POSITION() {
        return HealpixGrid.INITIAL_POSITION;
    }
    get INITIAL_PhiRad() {
        return HealpixGrid.INITIAL_PhiRad;
    }
    get INITIAL_ThetaRad() {
        return HealpixGrid.INITIAL_ThetaRad;
    }
    refreshFoV(camera, pMatrix) {
        return this._fovObj.getFoV(Global_js_1.default.insideSphere, this, camera, pMatrix);
    }
    getFoV() {
        return this._fovObj;
    }
    getMinFoV() {
        return this._fovObj.minFoV;
    }
    initShaders() {
        const gl = super.webgl;
        const fragmentShaderStr = GridShaderManager_js_1.default.healpixGridFS();
        this.fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(this.fragmentShader, fragmentShaderStr);
        gl.compileShader(this.fragmentShader);
        if (!gl.getShaderParameter(this.fragmentShader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(this.fragmentShader) || 'Fragment shader compile error');
            return;
        }
        const vertexShaderStr = GridShaderManager_js_1.default.healpixGridVS();
        this.vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(this.vertexShader, vertexShaderStr);
        gl.compileShader(this.vertexShader);
        if (!gl.getShaderParameter(this.vertexShader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(this.vertexShader) || 'Vertex shader compile error');
            return;
        }
        gl.attachShader(this._shaderProgram, this.vertexShader);
        gl.attachShader(this._shaderProgram, this.fragmentShader);
        gl.linkProgram(this._shaderProgram);
        if (!gl.getProgramParameter(this._shaderProgram, gl.LINK_STATUS)) {
            alert('Could not initialise shaders');
        }
        gl.useProgram(this._shaderProgram);
    }
    initBuffers(pixels, order) {
        this._nPrimitiveFlags = 0;
        const healpix = Global_js_1.default.getHealpix(order);
        const subhpx = Global_js_1.default.getHealpix(order + 1);
        const subsubhpx = Global_js_1.default.getHealpix(order + 2);
        let positionIndex = 0;
        let vIdx = 0;
        const R = 1.0;
        const MAX_UINT = 0xffffffff;
        this._indexes = new Uint32Array(17 * pixels.length);
        this._vertexCataloguePosition = new Float32Array(3 * 16 * pixels.length);
        for (let p = 0; p < pixels.length; p++) {
            const vecs = healpix.getBoundaries(pixels[p]);
            const cpix0 = pixels[p] << 2;
            const cpix1 = cpix0 + 1;
            const cpix2 = cpix0 + 2;
            const cpix3 = cpix0 + 3;
            const cp0vecs = subhpx.getBoundaries(cpix0);
            const cp3vecs = subhpx.getBoundaries(cpix3);
            // helper to push a vertex
            const pushV = (v) => {
                this._vertexCataloguePosition[positionIndex] = R * v.x;
                this._vertexCataloguePosition[positionIndex + 1] = R * v.y;
                this._vertexCataloguePosition[positionIndex + 2] = R * v.z;
                this._indexes[vIdx] = Math.floor(positionIndex / 3);
                vIdx += 1;
                positionIndex += 3;
            };
            // v0(3/0)
            pushV(vecs[0]);
            // v1(15/2)
            let subcpix3 = cpix3 << 2;
            let subcpix3_3 = subcpix3 + 3;
            let tmp = subsubhpx.getBoundaries(subcpix3_3);
            pushV(tmp[1]);
            // v1(3/1)
            pushV(cp3vecs[1]);
            // v0(2/2)
            let subcpix2 = cpix2 << 2;
            let subcpix2_2 = subcpix2 + 2;
            tmp = subsubhpx.getBoundaries(subcpix2_2);
            pushV(tmp[0]);
            // v1(0/0)
            pushV(vecs[1]);
            // v2(2/2)
            pushV(tmp[2]);
            // v1(0/1)
            pushV(cp0vecs[1]);
            // v1(0/2)
            let subcpix0 = cpix0 << 2;
            let subcpix0_2 = subcpix0;
            tmp = subsubhpx.getBoundaries(subcpix0_2);
            pushV(tmp[1]);
            // v2(0/0)
            pushV(vecs[2]);
            // v3(0/2)
            pushV(tmp[3]);
            // v3(0/1)
            pushV(cp0vecs[3]);
            // v2(5/2)
            let subcpix1 = cpix1 << 2;
            let subcpix1_1 = subcpix1 + 1;
            tmp = subsubhpx.getBoundaries(subcpix1_1);
            pushV(tmp[2]);
            // v3(0/0)
            pushV(vecs[3]);
            // v0(5/2)
            pushV(tmp[0]);
            // v3(3/1)
            pushV(cp3vecs[3]);
            tmp = subsubhpx.getBoundaries(subcpix3_3);
            pushV(tmp[3]);
            // primitive restart
            this._indexes[vIdx] = MAX_UINT;
            this._nPrimitiveFlags += 1;
            vIdx += 1;
        }
    }
    // updateTiles(pixels: number[], order: number) {
    //   return (this as any)._tileBuffer.updateTiles(pixels, order);
    // }
    refresh(camera, pMatrix) {
        this.refreshFoV(camera, pMatrix);
        const fov = this.getMinFoV();
        // expose to global (legacy)
        // (global as any).hipsFoV = fov;
        // global.order = fovHelper.getHiPSNorder(fov);
        // this._visibleorder = global.order;
        this._visibleorder = FoVHelper_js_1.fovHelper.getHiPSNorder(fov, this._visibleorder);
    }
    enableShader(in_mMatrix, pMatrix, vMatrix) {
        const gl = super.webgl;
        gl.useProgram(this._shaderProgram);
        // TODO move locations retrieval elsewhere
        // Uniform locations
        const uMV = gl.getUniformLocation(this._shaderProgram, 'uMVMatrix');
        const uP = gl.getUniformLocation(this._shaderProgram, 'uPMatrix');
        const uColor = super.webgl.getUniformLocation(this._shaderProgram, 'u_fragcolor');
        // Attribute locations
        this._attribLocations.position = gl.getAttribLocation(this._shaderProgram, 'aCatPosition');
        let mvMatrix = gl_matrix_1.mat4.create();
        // mvMatrix = mat4.multiply(mvMatrix, (global.camera as any).getCameraMatrix(), in_mMatrix);
        mvMatrix = gl_matrix_1.mat4.multiply(mvMatrix, vMatrix, in_mMatrix);
        if (uMV)
            gl.uniformMatrix4fv(uMV, false, mvMatrix);
        if (uP)
            gl.uniformMatrix4fv(uP, false, pMatrix);
        if (uColor) {
            const rgb = (0, Utils_js_1.colorHex2RGB)(this.defaultColor);
            gl.uniform4f(uColor, rgb[0], rgb[1], rgb[2], 1.0);
        }
    }
    isVisible() {
        return this.showGrid;
    }
    toggleShowGrid() {
        this.showGrid = !this.showGrid;
    }
    get visibleTilesManager() {
        return this._visibleTilesManager;
    }
    draw(input) {
        const gl = super.webgl;
        const mMatrix = this.getModelMatrix();
        // const vMatrix = input.camera.getCameraMatrix()
        const camera = input.camera;
        if (!camera)
            return;
        const vMatrix = camera.getCameraMatrix();
        const pMatrix = input.pMatrix;
        if (!pMatrix)
            return;
        // this.refresh(camera, pMatrix);
        const rawFov = input.fovDeg ?? this.getMinFoV();
        const fov = Number.isFinite(rawFov) && rawFov > 0 ? rawFov : 1e-6;
        this._visibleorder = FoVHelper_js_1.fovHelper.getHiPSNorder(fov, this._visibleorder);
        if (!this.showGrid) {
            // gridTextHelper.resetDivSets();
            this.gridText.resetDivSets();
            return;
        }
        // const visibleTiles = visibleTilesManager.visibleTilesByOrder
        const visibleTiles = this._visibleTilesManager.visibleTilesByOrder;
        const pixels = visibleTiles.pixels;
        const order = visibleTiles.order;
        this.initBuffers(pixels, order);
        // const pMatrix = computePerspectiveMatrixSingleton.pMatrix as ReadonlyMat4;
        this.enableShader(mMatrix, pMatrix, vMatrix);
        // Upload positions
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexCataloguePositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this._vertexCataloguePosition, gl.STATIC_DRAW);
        gl.vertexAttribPointer(this._attribLocations.position, HealpixGrid.ELEM_SIZE, gl.FLOAT, false, HealpixGrid.BYTES_X_ELEM * HealpixGrid.ELEM_SIZE, 0);
        gl.enableVertexAttribArray(this._attribLocations.position);
        // Index buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this._indexes, gl.STATIC_DRAW);
        gl.drawElements(gl.LINE_LOOP, this._vertexCataloguePosition.length / 3 + this._nPrimitiveFlags, gl.UNSIGNED_INT, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        // Project and label pixel centers that are inside current FoV
        let mvMatrix = gl_matrix_1.mat4.create();
        // mvMatrix = mat4.multiply(mvMatrix, (global.camera as any).getCameraMatrix(), mMatrix);
        mvMatrix = gl_matrix_1.mat4.multiply(mvMatrix, vMatrix, mMatrix);
        let mvpMatrix = gl_matrix_1.mat4.create();
        mvpMatrix = gl_matrix_1.mat4.multiply(mvpMatrix, pMatrix, mvMatrix);
        // FIX: pass model & pMatrix to match FoVUtils TS signature
        const center = FoVUtils_js_1.FoVUtils.getCenterJ2000(gl.canvas, this, this._webgl, camera, pMatrix);
        const fovMin = (this.getMinFoV() * Math.PI) / 180 / 2;
        for (let p = 0; p < pixels.length; p++) {
            const pixCenter = Global_js_1.default.getHealpix(this._visibleorder).pix2vec(pixels[p]);
            // const pixCenter = (global.getHealpix(global.order).pix2vec(pixels[p]) as BoundVec);
            const point = new Point_js_1.Point({ x: pixCenter.x, y: pixCenter.y, z: pixCenter.z }, CoordsType_js_1.CoordsType.CARTESIAN);
            const distance = GeomUtils_js_1.default.orthodromicDistance(center, point);
            if (distance < fovMin) {
                const vertex = [pixCenter.x, pixCenter.y, pixCenter.z, 1];
                const clipspace = gl_matrix_1.vec4.create();
                gl_matrix_1.vec4.transformMat4(clipspace, vertex, mvpMatrix);
                // NDC divide
                clipspace[0] /= clipspace[3];
                clipspace[1] /= clipspace[3];
                // clip -> CSS pixels
                const canvasRect = gl.canvas.getBoundingClientRect();
                const pixelX = canvasRect.left + (clipspace[0] * 0.5 + 0.5) * canvasRect.width;
                const pixelY = canvasRect.top + (clipspace[1] * -0.5 + 0.5) * canvasRect.height;
                this.gridText.addHPXDivSet(this._visibleorder + '/' + pixels[p], pixelX, pixelY);
                // gridTextHelper.addHPXDivSet(this._visibleorder + '/' + pixels[p], pixelX, pixelY);
            }
        }
        // gridTextHelper.resetDivSets();
        this.gridText.resetDivSets();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }
    get visibleorder() {
        return this._visibleorder;
    }
}
exports.HealpixGrid = HealpixGrid;


/***/ }),

/***/ 4639:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

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
/**
 * @author Fabrizio Giordano (Fab)
 */

Object.defineProperty(exports, "__esModule", ({ value: true }));
const gl_matrix_1 = __webpack_require__(1961);
class RayPickingUtils {
    static lastNearestVisibleObjectIdx = -1;
    /** Get index of the last object found under the mouse (if any). */
    static getNearestVisibleObjectIdx() {
        return this.lastNearestVisibleObjectIdx;
    }
    /**
     * Builds a world-space ray from mouse coords.
     * @param mouseX ClientX (page pixels)
     * @param mouseY ClientY (page pixels)
     * @param pMatrix Projection matrix
     * @returns World-space direction (normalized) as a vec3
     */
    static getRayFromMouse(mouseX, mouseY, pMatrix, webgl, vMatrix) {
        const gl = webgl;
        const canvas = gl.canvas;
        const rect = canvas.getBoundingClientRect();
        // mouseX / mouseY are already local to the canvas (CSS pixels)
        const canvasMX = mouseX;
        const canvasMY = mouseY;
        // Use rect.width / rect.height (CSS) for NDC
        const x = (2.0 * canvasMX) / rect.width - 1.0;
        const y = 1.0 - (2.0 * canvasMY) / rect.height;
        const z = -1.0;
        const rayClip = [x, y, z, 1.0];
        const pInv = gl_matrix_1.mat4.create();
        gl_matrix_1.mat4.invert(pInv, pMatrix);
        const rayEye4 = [0, 0, 0, 0];
        RayPickingUtils.mat4MultiplyVec4(pInv, rayClip, rayEye4);
        // direction in eye space
        const rayEye = [rayEye4[0], rayEye4[1], -1.0, 0.0];
        const vInv = gl_matrix_1.mat4.create();
        gl_matrix_1.mat4.invert(vInv, vMatrix);
        const rayWorld4 = [0, 0, 0, 0];
        RayPickingUtils.mat4MultiplyVec4(vInv, rayEye, rayWorld4);
        const rayWorld = gl_matrix_1.vec3.fromValues(rayWorld4[0], rayWorld4[1], rayWorld4[2]);
        gl_matrix_1.vec3.normalize(rayWorld, rayWorld);
        return rayWorld;
    }
    /** a*b (4x4 * vec4) → vec4 (in `out`) */
    static mat4MultiplyVec4(a, b, out) {
        const d = b[0], e = b[1], g = b[2], w = b[3];
        out[0] = a[0] * d + a[4] * e + a[8] * g + a[12] * w;
        out[1] = a[1] * d + a[5] * e + a[9] * g + a[13] * w;
        out[2] = a[2] * d + a[6] * e + a[10] * g + a[14] * w;
        out[3] = a[3] * d + a[7] * e + a[11] * g + a[15] * w;
        return out;
    }
    /**
     * Ray–sphere intersection (world space).
     * @returns distance `t` along the ray to the first hit, or `-1` if no hit.
     */
    static raySphere(rayOrigWorld, rayDirectionWorld, healpixGridSingleton) {
        let intersectionDistance = -1;
        const L = gl_matrix_1.vec3.create();
        gl_matrix_1.vec3.subtract(L, rayOrigWorld, healpixGridSingleton.center);
        const b = gl_matrix_1.vec3.dot(rayDirectionWorld, L);
        const c = gl_matrix_1.vec3.dot(L, L) - healpixGridSingleton.radius * healpixGridSingleton.radius;
        const disc = b * b - c;
        if (disc > 0.0) {
            const s = Math.sqrt(disc);
            const ta = -b + s;
            const tb = -b - s;
            if (ta < 0.0 && tb < 0.0) {
                // behind camera
            }
            else if (tb < 0.0) {
                intersectionDistance = ta;
            }
            else {
                intersectionDistance = Math.min(ta, tb);
            }
        }
        else if (disc === 0.0) {
            const t = -b; // tangent
            if (t >= 0.0) {
                intersectionDistance = t;
            }
        }
        return intersectionDistance;
    }
    /**
     * Compute intersection with a single model (defaults to the Healpix grid).
     * @returns model-space intersection point (vec3) if hit, otherwise empty array; and the picked model.
     */
    static getIntersectionPointWithSingleModel(mouseX, mouseY, healpixGrid, webgl, camera, pMatrix) {
        const vMatrix = camera.getCameraMatrix();
        const rayWorld = RayPickingUtils.getRayFromMouse(mouseX, mouseY, pMatrix, webgl, vMatrix);
        const t = RayPickingUtils.raySphere(camera.getCameraPosition(), rayWorld, healpixGrid);
        let intersectionModelPoint = [];
        if (t >= 0) {
            // world intersection
            const worldHit = gl_matrix_1.vec3.create();
            gl_matrix_1.vec3.scale(worldHit, rayWorld, t);
            gl_matrix_1.vec3.add(worldHit, camera.getCameraPosition(), worldHit);
            // world → model
            const worldHit4 = [worldHit[0], worldHit[1], worldHit[2], 1.0];
            const modelHit4 = [0, 0, 0, 0];
            // RayPickingUtils.mat4MultiplyVec4(healpixGridSingleton.getModelMatrixInverse(), worldHit4, modelHit4);
            RayPickingUtils.mat4MultiplyVec4(healpixGrid.getModelMatrixInverse(), worldHit4, modelHit4);
            intersectionModelPoint = [modelHit4[0], modelHit4[1], modelHit4[2]];
        }
        return intersectionModelPoint;
    }
}
exports["default"] = RayPickingUtils;


/***/ }),

/***/ 4707:
/***/ ((__unused_webpack_module, exports) => {

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
// GridShaderManager.ts

Object.defineProperty(exports, "__esModule", ({ value: true }));
class GridShaderManager {
    static healpixGridVS() {
        return `#version 300 es
        in vec4 aCatPosition;
        uniform mat4 uMVMatrix;
        uniform mat4 uPMatrix;

        void main() {
            gl_Position = uPMatrix * uMVMatrix * aCatPosition;
            gl_PointSize = 7.0;
        }`;
    }
    static healpixGridFS() {
        return `#version 300 es
        precision mediump float;

        uniform vec4 u_fragcolor;
        out vec4 fragColor;

        void main() {
            // fragColor = vec4(1.0, 0.0, 0.0, 1.0);
            fragColor = u_fragcolor;
        }`;
    }
}
exports["default"] = GridShaderManager;


/***/ }),

/***/ 4723:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const Config_js_1 = __webpack_require__(2919);
const Camera_js_1 = __importDefault(__webpack_require__(7734));
const RayPickingUtils_js_1 = __importDefault(__webpack_require__(4639));
const Global_js_1 = __importDefault(__webpack_require__(4382));
const MouseHelper_js_1 = __importDefault(__webpack_require__(4396));
const Utils_js_1 = __webpack_require__(7930);
const HiPS_js_1 = __webpack_require__(3726);
const PerspectiveMatrixManager_js_1 = __webpack_require__(9685);
const Point_js_1 = __webpack_require__(6553);
const FoVUtils_js_1 = __webpack_require__(8083);
const EquatorialGrid_js_1 = __webpack_require__(9839);
const HealpixGrid_js_1 = __webpack_require__(4595);
const CoordsType_js_1 = __webpack_require__(8145);
const ColorMaps_js_1 = __importDefault(__webpack_require__(619));
const XYZTileRequestScheduler_js_1 = __webpack_require__(5409);
const WMTSAdapter_js_1 = __webpack_require__(3956);
const XYZMapDescriptor_js_1 = __webpack_require__(8868);
const XYZMap_js_1 = __webpack_require__(1741);
const gl_matrix_1 = __webpack_require__(1961);
/**
 * AstroSphere — main WebGL scene controller (TS port)
 */
class AstroSphere {
    static MIN_WHEEL_SCALE = 0.85;
    static MAX_WHEEL_SCALE = 1.8;
    _camera;
    _perspectiveMatrixManager;
    centralPoinCoords;
    mousePointCoords;
    canvas;
    _healpixGrid;
    _equatorialGrid;
    mouseHelper;
    mouseDown = false;
    lastMouseX = null;
    lastMouseY = null;
    inertiaX = 0.0;
    inertiaY = 0.0;
    zoomInertia = 0.0;
    pointerDownX = null;
    pointerDownY = null;
    pointerDownAt = 0;
    _activeHiPS = null;
    _activeXYZ2 = null;
    _activeBaseLayer = null;
    startup = true;
    fov;
    activeCatalogues = [];
    activeFootprintSets = [];
    _webgl;
    _selectedColorMap;
    _cameraStatusChanged = false;
    lastCameraChangedAt = 0;
    lastCameraMotionAt = 0;
    lastHoveredSource = null;
    lastHoveredCatalogue = null;
    zoomSensitivity = 1.0;
    lockedEastWestRaDeg = null;
    lockedNorthSouthDecDeg = null;
    keepCameraNorthUp = true;
    constructor(canvas, webgl) {
        console.log("[AstroSphere] new instance for canvas", canvas.id);
        // Keep global GL context (as in original JS)
        this._webgl = webgl;
        this.mouseHelper = new MouseHelper_js_1.default();
        this.canvas = canvas;
        const nativeColorMap = "native";
        this._selectedColorMap = ColorMaps_js_1.default[nativeColorMap];
        Global_js_1.default.insideSphere = Config_js_1.bootSetup.insideSphere;
        this.initCamera();
        this._healpixGrid = new HealpixGrid_js_1.HealpixGrid(this._webgl);
        this._perspectiveMatrixManager = new PerspectiveMatrixManager_js_1.PerspectiveMatrixManager(canvas, this._camera, Config_js_1.bootSetup.camera_fov_deg, Config_js_1.bootSetup.camera_near_plane, Config_js_1.bootSetup.insideSphere);
        this._perspectiveMatrixManager.computePerspectiveMatrix(canvas, this._camera, Config_js_1.bootSetup.camera_fov_deg, Config_js_1.bootSetup.camera_near_plane, Config_js_1.bootSetup.insideSphere);
        this._equatorialGrid = new EquatorialGrid_js_1.EquatorialGrid(this._webgl, this._healpixGrid);
        this._equatorialGrid.init(this._healpixGrid.getMinFoV());
        this.updateCentralPoint();
        this.startup = true;
        this.addEventListeners(canvas);
        this.fov = this._healpixGrid.refreshFoV(this._camera, this._perspectiveMatrixManager.pMatrix);
        this._camera.refreshFoV(this.fov.minFoV);
    }
    initCamera() {
        if (Config_js_1.bootSetup.insideSphere) {
            this._camera = new Camera_js_1.default([0.0, 0.0, -0.005], true);
        }
        else {
            this._camera = new Camera_js_1.default([0.0, 0.0, 4.0], false);
        }
    }
    setCamera(camera) {
        this._camera = camera;
    }
    setCameraRotationSensitivity(value) {
        this._camera.setRotationSensitivity(value);
    }
    getCameraRotationSensitivity() {
        return this._camera.getRotationSensitivity();
    }
    get healpixGrid() {
        return this._healpixGrid;
    }
    get equatorialGrid() {
        return this._equatorialGrid;
    }
    // This is a lickely a duplication of FoVUtils.getCenterJ2000(this.canvas)
    updateCentralPoint() {
        const sphericalCoords = this.getPhiThetaDeg(this.canvas);
        const astroCoords = (0, Utils_js_1.sphericalToAstroDeg)(sphericalCoords.phi, sphericalCoords.theta);
        const raHMS = (0, Utils_js_1.raDegToHMS)(astroCoords.ra);
        const decDMS = (0, Utils_js_1.decDegToDMS)(astroCoords.dec);
        this.centralPoinCoords = {
            astroDeg: astroCoords,
            sphericalDeg: sphericalCoords,
            raHMS: raHMS,
            decDMS: decDMS,
        };
        return this.centralPoinCoords;
    }
    updateLastMousePoint() {
        const sphericalCoords = {
            phi: this.mouseHelper.phi,
            theta: this.mouseHelper.theta,
        };
        const astroCoords = {
            ra: this.mouseHelper.ra,
            dec: this.mouseHelper.dec,
        };
        const raHMS = this.mouseHelper.raHMS;
        const decDMS = this.mouseHelper.decDMS;
        this.mousePointCoords = {
            astroDeg: astroCoords,
            sphericalDeg: sphericalCoords,
            raHMS: raHMS,
            decDMS: decDMS,
        };
        return this.mousePointCoords;
    }
    clearLastMousePoint() {
        this.mousePointCoords = undefined;
    }
    // This should call FoVUtils.getJ200Centre(this.canvas)
    getCentralPointCoordinates() {
        return this.centralPoinCoords;
    }
    getLastMousePointCoordinates() {
        return this.mousePointCoords;
    }
    clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }
    computeZoomStep(currentFov, deltaY) {
        const direction = deltaY < 0 ? -1 : 1;
        const wheelScale = this.clamp(Math.abs(deltaY) / 120, AstroSphere.MIN_WHEEL_SCALE, AstroSphere.MAX_WHEEL_SCALE);
        const baseMagnitude = this.clamp(0.0012 + 0.0025 * Math.sqrt(Math.max(currentFov, 0)), 0.0012, 0.04);
        return direction * baseMagnitude * wheelScale * this.zoomSensitivity;
    }
    setZoomSensitivity(value) {
        this.zoomSensitivity = this.clamp(value, 0.2, 3);
    }
    getZoomSensitivity() {
        return this.zoomSensitivity;
    }
    filterRotationDeltaByAstroLocks(deltaX, deltaY) {
        const lockEastWest = this._camera.isRotationLockedY();
        const lockNorthSouth = this._camera.isRotationLockedX();
        if (!lockEastWest && !lockNorthSouth) {
            return { deltaX, deltaY };
        }
        const center = RayPickingUtils_js_1.default.getIntersectionPointWithSingleModel(this.canvas.clientWidth / 2, this.canvas.clientHeight / 2, this._healpixGrid, this._webgl, this._camera, this._perspectiveMatrixManager.pMatrix);
        if (!center || center.length < 3) {
            return { deltaX, deltaY };
        }
        const centerVec = gl_matrix_1.vec3.normalize(gl_matrix_1.vec3.create(), gl_matrix_1.vec3.fromValues(center[0], center[1], center[2]));
        const northAxis = gl_matrix_1.vec3.fromValues(0, 0, 1);
        const eastVec = gl_matrix_1.vec3.cross(gl_matrix_1.vec3.create(), northAxis, centerVec);
        if (gl_matrix_1.vec3.length(eastVec) < 1e-6) {
            gl_matrix_1.vec3.set(eastVec, 1, 0, 0);
        }
        else {
            gl_matrix_1.vec3.normalize(eastVec, eastVec);
        }
        const northProjection = gl_matrix_1.vec3.scale(gl_matrix_1.vec3.create(), centerVec, gl_matrix_1.vec3.dot(northAxis, centerVec));
        const northVec = gl_matrix_1.vec3.subtract(gl_matrix_1.vec3.create(), northAxis, northProjection);
        if (gl_matrix_1.vec3.length(northVec) < 1e-6) {
            gl_matrix_1.vec3.cross(northVec, centerVec, eastVec);
        }
        gl_matrix_1.vec3.normalize(northVec, northVec);
        const eastScreen = this.projectModelDirectionToScreen(centerVec, eastVec);
        const northScreen = this.projectModelDirectionToScreen(centerVec, northVec);
        if (!eastScreen || !northScreen) {
            return { deltaX, deltaY };
        }
        let nextDeltaX = deltaX;
        let nextDeltaY = deltaY;
        if (lockEastWest) {
            const amount = nextDeltaX * eastScreen.x + nextDeltaY * eastScreen.y;
            nextDeltaX -= amount * eastScreen.x;
            nextDeltaY -= amount * eastScreen.y;
        }
        if (lockNorthSouth) {
            const amount = nextDeltaX * northScreen.x + nextDeltaY * northScreen.y;
            nextDeltaX -= amount * northScreen.x;
            nextDeltaY -= amount * northScreen.y;
        }
        return {
            deltaX: nextDeltaX,
            deltaY: nextDeltaY,
        };
    }
    projectModelDirectionToScreen(centerModel, directionModel) {
        const offsetModel = gl_matrix_1.vec3.scaleAndAdd(gl_matrix_1.vec3.create(), centerModel, directionModel, 0.01);
        const centerScreen = this.projectModelPointToScreen(centerModel);
        const offsetScreen = this.projectModelPointToScreen(offsetModel);
        if (!centerScreen || !offsetScreen) {
            return null;
        }
        const x = offsetScreen.x - centerScreen.x;
        const y = offsetScreen.y - centerScreen.y;
        const len = Math.hypot(x, y);
        if (len < 1e-6) {
            return null;
        }
        return { x: x / len, y: y / len };
    }
    projectModelPointToScreen(pointModel) {
        const vMatrix = this._camera.getCameraMatrix();
        const mMatrix = this._healpixGrid.getModelMatrix();
        const mvMatrix = gl_matrix_1.mat4.create();
        const mvpMatrix = gl_matrix_1.mat4.create();
        gl_matrix_1.mat4.multiply(mvMatrix, vMatrix, mMatrix);
        gl_matrix_1.mat4.multiply(mvpMatrix, this._perspectiveMatrixManager.pMatrix, mvMatrix);
        const clip = gl_matrix_1.vec4.fromValues(pointModel[0], pointModel[1], pointModel[2], 1);
        gl_matrix_1.vec4.transformMat4(clip, clip, mvpMatrix);
        if (Math.abs(clip[3]) < 1e-6) {
            return null;
        }
        return {
            x: clip[0] / clip[3],
            y: -(clip[1] / clip[3]),
        };
    }
    enforceAstronomicalRotationLocks() {
        if (this.lockedEastWestRaDeg == null &&
            this.lockedNorthSouthDecDeg == null) {
            return false;
        }
        const center = this.updateCentralPoint();
        if (!center) {
            return false;
        }
        const nextRa = this.lockedEastWestRaDeg ?? center.astroDeg.ra;
        const nextDec = this.lockedNorthSouthDecDeg ?? center.astroDeg.dec;
        const needsCorrection = Math.abs(nextRa - center.astroDeg.ra) > 1e-6 ||
            Math.abs(nextDec - center.astroDeg.dec) > 1e-6;
        if (!needsCorrection) {
            return false;
        }
        this._camera.goTo(nextRa, nextDec);
        this._perspectiveMatrixManager.computePerspectiveMatrix(this.canvas, this._camera, Config_js_1.bootSetup.camera_fov_deg, Config_js_1.bootSetup.camera_near_plane, Global_js_1.default.insideSphere);
        this.updateCentralPoint();
        return true;
    }
    enforceCameraNorthUp() {
        if (!this.keepCameraNorthUp) {
            return false;
        }
        const center = this.updateCentralPoint();
        if (!center) {
            return false;
        }
        this._camera.goTo(center.astroDeg.ra, center.astroDeg.dec);
        this._perspectiveMatrixManager.computePerspectiveMatrix(this.canvas, this._camera, Config_js_1.bootSetup.camera_fov_deg, Config_js_1.bootSetup.camera_near_plane, Global_js_1.default.insideSphere);
        this.updateCentralPoint();
        return true;
    }
    emitCameraChanged(reason) {
        // avoid dispatch before scene is ready
        if (!this._activeHiPS)
            return;
        if (!this._healpixGrid?.fovObj)
            return;
        const detail = this.getCurrentStatus();
        if (!detail)
            return;
        // optional debug
        // console.log('[AstroSphere] emit camera-changed:', reason);
        this.canvas.dispatchEvent(new CustomEvent("camera-changed", {
            detail,
            bubbles: true,
            composed: true,
        }));
    }
    addEventListeners(canvas) {
        if (Global_js_1.default.debug) {
            console.log("[AstroSphere::addEventListeners]");
        }
        const CLICK_MAX_DISTANCE_PX = 4;
        const CLICK_MAX_DURATION_MS = 250;
        const rect = canvas.getBoundingClientRect();
        this.lastMouseX = rect.left; // locale al canvas
        this.lastMouseY = rect.top;
        const handleMouseDown = (event) => {
            canvas.setPointerCapture(event.pointerId);
            this.mouseDown = true;
            const rect = canvas.getBoundingClientRect();
            this.lastMouseX = event.clientX - rect.left; // locale al canvas
            this.lastMouseY = event.clientY - rect.top; // locale al canvas
            this.pointerDownX = this.lastMouseX;
            this.pointerDownY = this.lastMouseY;
            this.pointerDownAt = Date.now();
            const mousePoint = RayPickingUtils_js_1.default.getIntersectionPointWithSingleModel(this.lastMouseX, this.lastMouseY, this._healpixGrid, this._webgl, this._camera, this._perspectiveMatrixManager.pMatrix);
            if (mousePoint && mousePoint.length > 0) {
                this.mouseHelper.update(mousePoint);
                this.updateLastMousePoint();
            }
            else {
                this.clearLastMousePoint();
            }
            event.preventDefault();
            return false;
        };
        const handleMouseUp = (event) => {
            canvas.releasePointerCapture(event.pointerId);
            this.mouseDown = false;
            document.body.style.cursor = "auto";
            if (event.button !== 0) {
                event.preventDefault();
                return false;
            }
            const rect = canvas.getBoundingClientRect();
            const localX = event.clientX - rect.left;
            const localY = event.clientY - rect.top;
            this.lastMouseX = localX;
            this.lastMouseY = localY;
            const moveDist = Math.hypot(localX - (this.pointerDownX ?? localX), localY - (this.pointerDownY ?? localY));
            const elapsedMs = Date.now() - this.pointerDownAt;
            const isClick = moveDist <= CLICK_MAX_DISTANCE_PX && elapsedMs <= CLICK_MAX_DURATION_MS;
            if (isClick) {
                const mousePoint = RayPickingUtils_js_1.default.getIntersectionPointWithSingleModel(localX, localY, this._healpixGrid, this._webgl, this._camera, this._perspectiveMatrixManager.pMatrix);
                if (mousePoint && mousePoint.length > 0) {
                    this.mouseHelper.update(mousePoint);
                    this.updateLastMousePoint();
                    for (const cat of this.activeCatalogues) {
                        const clickResult = cat.selectPrimarySourceFromClick(this.mouseHelper);
                        if (!clickResult?.sources.length)
                            continue;
                        this._webgl.canvas.dispatchEvent(new CustomEvent("source-clicked", {
                            detail: {
                                source: clickResult.sources,
                                selectionState: clickResult.selectionState,
                                catalogue: cat,
                            },
                            bubbles: true,
                            composed: true,
                        }));
                    }
                    for (const fset of this.activeFootprintSets) {
                        const clickResult = fset.selectPrimaryFootprintFromClick(this.mouseHelper);
                        if (!clickResult?.footprints.length)
                            continue;
                        this._webgl.canvas.dispatchEvent(new CustomEvent("footprint-clicked", {
                            detail: {
                                footprint: clickResult.footprints,
                                selectionState: clickResult.selectionState,
                                footprintSet: fset,
                            },
                            bubbles: true,
                            composed: true,
                        }));
                    }
                }
            }
            else {
                this.clearLastMousePoint();
            }
        };
        const handleMouseMove = (event) => {
            const rect = canvas.getBoundingClientRect();
            // 🔹 canvas-local coordinates
            const localX = event.clientX - rect.left;
            const localY = event.clientY - rect.top;
            const newX = localX;
            const newY = localY;
            // if (!healpixGridSingleton) return;
            if (!this._healpixGrid)
                return;
            if (this.mouseDown) {
                document.body.style.cursor = "grab";
                const dragDirection = Global_js_1.default.insideSphere ? -1 : 1;
                const dragSpeed = Global_js_1.default.insideSphere ? 10.0 : 1;
                const deltaX = (dragDirection * dragSpeed * (newX - (this.lastMouseX ?? newX)) * Math.PI) /
                    canvas.width;
                const deltaY = (dragDirection * dragSpeed * (newY - (this.lastMouseY ?? newY)) * Math.PI) /
                    canvas.height;
                const filteredDelta = this.filterRotationDeltaByAstroLocks(deltaX, deltaY);
                this.inertiaX += 0.1 * filteredDelta.deltaX;
                this.inertiaY += 0.1 * filteredDelta.deltaY;
                this.updateCentralPoint();
            }
            else {
                // Use canvas-local coords for picking
                const mousePoint = RayPickingUtils_js_1.default.getIntersectionPointWithSingleModel(localX, localY, this._healpixGrid, this._webgl, this._camera, this._perspectiveMatrixManager.pMatrix);
                if (mousePoint && mousePoint.length > 0) {
                    this.mouseHelper.update(mousePoint);
                    this.updateLastMousePoint();
                }
                else {
                    this.clearLastMousePoint();
                }
            }
            if (!this.centralPoinCoords) {
                this.updateCentralPoint();
            }
            this.lastMouseX = newX;
            this.lastMouseY = newY;
            // During drag, camera rotation is applied in the render loop via inertia.
            // Defer the camera-changed event to that loop so coordinates reflect the
            // actual updated camera state instead of the pre-rotation state.
            this._cameraStatusChanged = true;
            event.preventDefault();
        };
        const handleMouseWheel = (event) => {
            const currentFov = this._healpixGrid.getMinFoV();
            const zoomStep = this.computeZoomStep(currentFov, event.deltaY);
            // Apply wheel zoom immediately and discard any queued inertia so reversing
            // direction feels responsive instead of "buffered".
            this.zoomInertia = 0;
            this._camera.zoom(zoomStep);
            this.lastCameraMotionAt = performance.now();
            this.fov = this._healpixGrid.refreshFoV(this._camera, this._perspectiveMatrixManager.pMatrix);
            this._camera.refreshFoV(this.fov.minFoV);
            this._cameraStatusChanged = true;
            this.emitCameraChanged("wheel");
            event.preventDefault();
        };
        const handleContextMenu = (event) => {
            event.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const localX = event.clientX - rect.left;
            const localY = event.clientY - rect.top;
            const mousePoint = RayPickingUtils_js_1.default.getIntersectionPointWithSingleModel(localX, localY, this._healpixGrid, this._webgl, this._camera, this._perspectiveMatrixManager.pMatrix);
            if (!mousePoint || mousePoint.length === 0) {
                return false;
            }
            this.mouseHelper.update(mousePoint);
            this.updateLastMousePoint();
            for (const cat of this.activeCatalogues) {
                const pickResult = cat.getSourcesFromPointer(this.mouseHelper);
                if (!pickResult?.sources.length)
                    continue;
                this._webgl.canvas.dispatchEvent(new CustomEvent("source-contextmenu", {
                    detail: {
                        source: pickResult.sources,
                        catalogue: cat,
                        clientX: event.clientX,
                        clientY: event.clientY,
                    },
                    bubbles: true,
                    composed: true,
                }));
                break;
            }
            for (const fset of this.activeFootprintSets) {
                const pickResult = fset.getFootprintsFromPointer(this.mouseHelper);
                if (!pickResult?.footprints.length)
                    continue;
                this._webgl.canvas.dispatchEvent(new CustomEvent("footprint-contextmenu", {
                    detail: {
                        footprint: pickResult.footprints,
                        footprintSet: fset,
                        clientX: event.clientX,
                        clientY: event.clientY,
                    },
                    bubbles: true,
                    composed: true,
                }));
                break;
            }
            return false;
        };
        const onKeyDown = (evt) => {
            if (!evt.ctrlKey) {
                return;
            }
            // console.log('[AstroSphere::onKeyDown] key=', evt.key)
            switch (evt.key) {
                case "1":
                    // Free camera
                    this._camera.clearRotationLock();
                    break;
                case "2":
                    // Lock X axis rotation
                    this._camera.setRotationLock({ x: true, y: false, z: false });
                    break;
                case "3":
                    // Lock Y axis rotation
                    this._camera.setRotationLock({ x: false, y: true, z: false });
                    break;
                case "4":
                    // Lock Z axis rotation
                    this._camera.setRotationLock({ x: false, y: false, z: true });
                    break;
            }
        };
        console.log("[AstroSphere] registering pointer and wheel listeners on canvas");
        canvas.onpointerdown = handleMouseDown;
        canvas.onpointerup = handleMouseUp;
        canvas.onpointermove = handleMouseMove;
        canvas.onpointerleave = () => {
            this.clearLastMousePoint();
            this._cameraStatusChanged = true;
            this.emitCameraChanged("pointerleave");
        };
        console.log("[AstroSphere] adding wheel event listener with passive: false");
        canvas.addEventListener("wheel", handleMouseWheel, { passive: false });
        canvas.addEventListener("contextmenu", handleContextMenu);
        console.log("[AstroSphere] registering global keydown listener on document");
        document.addEventListener("keydown", onKeyDown, { capture: true });
    }
    // REVIEW THIS METHOD AND MOVE IT
    getPhiThetaDeg(canvas) {
        const rect = canvas.getBoundingClientRect();
        const maxX = rect.width;
        const maxY = rect.height;
        const pickerPoint = RayPickingUtils_js_1.default.getIntersectionPointWithSingleModel(maxX / 2, maxY / 2, this._healpixGrid, this._webgl, this._camera, this._perspectiveMatrixManager.pMatrix);
        return (0, Utils_js_1.cartesianToSpherical)(pickerPoint);
    }
    collectViewportSphericalSamples(sampleCount = 5) {
        const rect = this.canvas.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const samples = [];
        for (let ix = 0; ix < sampleCount; ix++) {
            const x = sampleCount === 1 ? width / 2 : (ix / (sampleCount - 1)) * width;
            for (let iy = 0; iy < sampleCount; iy++) {
                const y = sampleCount === 1 ? height / 2 : (iy / (sampleCount - 1)) * height;
                const hit = RayPickingUtils_js_1.default.getIntersectionPointWithSingleModel(x, y, this._healpixGrid, this._webgl, this._camera, this._perspectiveMatrixManager.pMatrix);
                if (hit && hit.length > 0) {
                    samples.push((0, Utils_js_1.cartesianToSpherical)(hit));
                }
            }
        }
        return samples;
    }
    activateHiPS(hipsDescriptor) {
        this._activeHiPS = new HiPS_js_1.HiPS(1, [0.0, 0.0, 0.0], 0, 0, hipsDescriptor, this._webgl, this._healpixGrid);
        this._activeBaseLayer = "hips";
    }
    activateXYZ(config) {
        this.activateXYZ2(new XYZMapDescriptor_js_1.XYZMapDescriptor(config.name ?? "XYZ Earth2 Layer", config.urlTemplate, config.minZoom ?? 0, config.maxZoom ?? 8, config.segmentsPerSide ?? 48, config.maxCachedTiles ?? 384, 8, config.urlResolver));
        this._activeBaseLayer = "xyz";
    }
    activateXYZ2(config) {
        this._activeXYZ2 = new XYZMap_js_1.XYZMap(1, [0.0, 0.0, 0.0], 0, 0, config, this._webgl);
        this._activeBaseLayer = "xyz";
    }
    activateWMTS(config) {
        const adapter = new WMTSAdapter_js_1.WMTSAdapter(config);
        const xyzConfig = adapter.toXYZLayerConfig();
        this._activeXYZ2 = new XYZMap_js_1.XYZMap(1, [0.0, 0.0, 0.0], 0, 0, new XYZMapDescriptor_js_1.XYZMapDescriptor(config.layer ? `WMTS ${config.layer}` : "WMTS Earth2 Layer", xyzConfig.urlTemplate, xyzConfig.minZoom ?? 0, xyzConfig.maxZoom ?? 8, xyzConfig.segmentsPerSide ?? 48, xyzConfig.maxCachedTiles ?? 384, 8, xyzConfig.urlResolver), this._webgl);
        this._activeBaseLayer = "xyz";
    }
    // Catalogue section
    async showCatalogue(cat) {
        // console.log(cat)
        if (cat)
            this.activeCatalogues.push(cat);
        return cat;
    }
    deleteCatalogue(catalogue) {
        this.activeCatalogues = this.activeCatalogues.filter((c) => c !== catalogue);
    }
    // End Catalogue section
    // Footprint section
    async showFootprintSet(fset) {
        // console.log(fset)
        if (fset)
            this.activeFootprintSets.push(fset);
        return fset;
    }
    deleteFootprintSet(footprintSet) {
        this.activeFootprintSets = this.activeFootprintSets.filter((fst) => fst !== footprintSet);
    }
    getHoveredFootprints() {
        let footprintsHovered = [];
        this.activeFootprintSets.forEach((fset) => {
            footprintsHovered.push(fset.hoveredFootprints);
        });
        return footprintsHovered;
    }
    // End Footprint section
    goTo(raDeg, decDeg) {
        this._camera.goTo(raDeg, decDeg);
    }
    getActiveCoordinateMode() {
        if (this._activeBaseLayer === "xyz") {
            return "lonlat";
        }
        if (this._activeBaseLayer === "hips" && this._activeHiPS?.isGalacticHips) {
            return "galactic";
        }
        return "equatorial";
    }
    resetAxesOrientation() {
        const center = this.updateCentralPoint();
        if (!center)
            return;
        this.inertiaX = 0;
        this.inertiaY = 0;
        this._camera.goTo(center.astroDeg.ra, center.astroDeg.dec);
        this._perspectiveMatrixManager.computePerspectiveMatrix(this.canvas, this._camera, Config_js_1.bootSetup.camera_fov_deg, Config_js_1.bootSetup.camera_near_plane, Global_js_1.default.insideSphere);
        this.updateCentralPoint();
        this._cameraStatusChanged = true;
    }
    setKeepCameraNorthUp(enabled) {
        this.keepCameraNorthUp = enabled;
        if (enabled) {
            this.resetAxesOrientation();
        }
    }
    isKeepCameraNorthUp() {
        return this.keepCameraNorthUp;
    }
    getFoV() {
        if (this._activeBaseLayer === "xyz" && this._activeXYZ2) {
            return this._activeXYZ2.getFoV();
        }
        return this.fov;
    }
    getFoVPolygon() {
        if (this.healpixGrid == null)
            throw new Error(`healpixGrid is ${this.healpixGrid}`);
        return FoVUtils_js_1.FoVUtils.getFoVPolygon(this._camera, this.canvas, this._healpixGrid, this._healpixGrid, this._webgl, this._perspectiveMatrixManager.pMatrix);
    }
    changeFoV(deg) {
        const distance = this._healpixGrid.getFoV().computeDistanceFromAngle(deg);
        this._camera.translate(distance);
        this.fov = this._healpixGrid.refreshFoV(this._camera, this._perspectiveMatrixManager.pMatrix);
        this._camera.refreshFoV(this.fov.minFoV);
    }
    changeFoV2(deg) {
        const newCameraPos = this._healpixGrid
            .getFoV()
            .computeCameraPositionForFoV(deg);
        this._camera.setCameraPosition(newCameraPos);
    }
    changeFoV3(deg) {
        const newPos = this._healpixGrid
            .getFoV()
            .computeCameraPositionForAngularDiameter(deg);
        this._camera.setCameraPosition(newPos);
        // Recompute projection after moving the camera
        this._perspectiveMatrixManager.computePerspectiveMatrix(this.canvas, this._camera, Config_js_1.bootSetup.camera_fov_deg, Config_js_1.bootSetup.camera_near_plane, false);
    }
    getInsideSphere() {
        return Global_js_1.default.insideSphere;
    }
    toggleInsideSphere() {
        const centerBeforeToggle = this.updateCentralPoint();
        this.inertiaX = 0;
        this.inertiaY = 0;
        this.zoomInertia = 0;
        Global_js_1.default.insideSphere = !Global_js_1.default.insideSphere;
        // console.log(global.insideSphere)
        this._camera.toggleInsideSphere();
        this._camera.goTo(centerBeforeToggle.astroDeg.ra, centerBeforeToggle.astroDeg.dec);
        this._perspectiveMatrixManager.computePerspectiveMatrix(this.canvas, this._camera, Config_js_1.bootSetup.camera_fov_deg, Config_js_1.bootSetup.camera_near_plane, Global_js_1.default.insideSphere);
        this.fov = this._healpixGrid.refreshFoV(this._camera, this._perspectiveMatrixManager.pMatrix);
        this._camera.refreshFoV(this.fov.minFoV);
        this.updateCentralPoint();
        this.lastCameraMotionAt = performance.now();
        this._cameraStatusChanged = true;
        this.emitCameraChanged("inside-sphere-toggle");
        requestAnimationFrame(() => this.draw(this.canvas));
    }
    // imposta posizione camera
    setCameraPosition(pos) {
        this._camera.setCameraPosition(pos);
        this._perspectiveMatrixManager.computePerspectiveMatrix(this.canvas, this._camera, Config_js_1.bootSetup.camera_fov_deg, Config_js_1.bootSetup.camera_near_plane, Global_js_1.default.insideSphere);
    }
    // imposta orientamento camera tramite view matrix
    setCameraMatrix(viewMatrix) {
        this._camera.setCameraMatrix(viewMatrix);
        this._perspectiveMatrixManager.computePerspectiveMatrix(this.canvas, this._camera, Config_js_1.bootSetup.camera_fov_deg, Config_js_1.bootSetup.camera_near_plane, Global_js_1.default.insideSphere);
    }
    _refreshingStatus = false;
    // set completo camera (pos + orientamento)
    applyFullCameraState(detail, applyColor) {
        this._refreshingStatus = true;
        this._camera = detail.camera;
        // this.goTo(detail.centralPoint.raDeg, detail.centralPoint.decDeg)
        this._healpixGrid.setModelMatrix(detail.mMatrix);
        this._perspectiveMatrixManager.pMatrix = detail.pMatrix;
        this.setCameraMatrix(detail.vMatrix);
        // this.goTo(detail.centralPoint.raDeg, detail.centralPoint.decDeg)
        if (applyColor) {
            this._activeHiPS?.changeColorMap(detail.colorMap);
        }
        this._refreshingStatus = false;
    }
    getCurrentStatus() {
        this.updateCentralPoint();
        const centralradeg = this.centralPoinCoords?.astroDeg.ra;
        const centraldecdeg = this.centralPoinCoords?.astroDeg.dec;
        // if (!centraldecdeg || !centralradeg) {
        if (centralradeg == null || centraldecdeg == null) {
            return null;
        }
        // if (this._rotating && centraldecdeg && centralradeg) {
        const detail = {
            fovDeg: this.fov.minFoV,
            fovXDeg: this.fov.xFoV,
            fovYDeg: this.fov.yFoV,
            position: this._camera.getCameraPosition(),
            vMatrix: this._camera.getCameraMatrix(),
            pMatrix: this._perspectiveMatrixManager.pMatrix,
            mMatrix: this._healpixGrid.getModelMatrix(),
            camera: this._camera,
            timestamp: performance.now(),
            centralPoint: new Point_js_1.Point({ raDeg: centralradeg, decDeg: centraldecdeg }, CoordsType_js_1.CoordsType.ASTRO),
            mouseHoverPoint: this.mousePointCoords,
            colorMap: this._selectedColorMap,
            getFoVPolygon: [],
        };
        return detail;
        // }
        // return null
    }
    changeColorMap(cm) {
        if (!this._activeHiPS && !this._activeXYZ2)
            return;
        this._selectedColorMap = cm;
        this._activeHiPS?.changeColorMap(cm);
        this._activeXYZ2?.changeColorMap(cm);
    }
    prevFov = 0;
    prevCentralRaDeg = null;
    prevCentralDecDeg = null;
    get activeHiPS() {
        return this._activeHiPS;
    }
    get activeXYZ() {
        return this._activeXYZ2;
    }
    isLonLatGridVisible() {
        return this._activeXYZ2?.isLonLatGridVisible() ?? false;
    }
    toggleLonLatGrid() {
        return this._activeXYZ2?.toggleLonLatGrid() ?? false;
    }
    setEastWestRotationLocked(locked) {
        this._camera.setRotationLock({ y: locked });
        if (locked)
            this.inertiaX = 0;
        this.lockedEastWestRaDeg = locked
            ? (this.updateCentralPoint()?.astroDeg.ra ?? null)
            : null;
    }
    isEastWestRotationLocked() {
        return this._camera.isRotationLockedY();
    }
    setNorthSouthRotationLocked(locked) {
        this._camera.setRotationLock({ x: locked });
        if (locked)
            this.inertiaY = 0;
        this.lockedNorthSouthDecDeg = locked
            ? (this.updateCentralPoint()?.astroDeg.dec ?? null)
            : null;
    }
    isNorthSouthRotationLocked() {
        return this._camera.isRotationLockedX();
    }
    getXYZDebugStats() {
        return {
            activeBaseLayer: this._activeBaseLayer,
            layer: this._activeXYZ2?.getDebugStats() ?? null,
            requests: XYZTileRequestScheduler_js_1.xyzTileRequestScheduler.getDebugStats(),
        };
    }
    getHiPSDebugStats() {
        if (!this._activeHiPS)
            return null;
        return this._activeHiPS.getDebugStats();
    }
    draw(canvas) {
        if (this._refreshingStatus)
            return;
        if (!this._webgl)
            return;
        if (!this._activeHiPS && !this._activeXYZ2)
            return;
        if (!this._healpixGrid || Object.keys(this._healpixGrid).length === 0)
            return;
        if (this._healpixGrid.fovObj === undefined)
            return;
        // In WebGL2, OES_element_index_uint is core, no need to fetch the extension each frame.
        // global.gl.getExtension('OES_element_index_uint')
        // global.gl.clear(global.gl.COLOR_BUFFER_BIT | global.gl.DEPTH_BUFFER_BIT)
        this._perspectiveMatrixManager.computePerspectiveMatrix(canvas, this._camera, Config_js_1.bootSetup.camera_fov_deg, Config_js_1.bootSetup.camera_near_plane, Global_js_1.default.insideSphere);
        let cameraRotated = false;
        let THETA = 0;
        let PHI = 0;
        this._webgl.viewport(0, 0, this._webgl.drawingBufferWidth, this._webgl.drawingBufferHeight);
        this._webgl.clear(this._webgl.COLOR_BUFFER_BIT | this._webgl.DEPTH_BUFFER_BIT);
        // Zoom inertia
        if (this.zoomInertia !== 0) {
            if (Math.abs(this.zoomInertia) > 0.0001) {
                this._camera.zoom(this.zoomInertia);
                this.zoomInertia *= 0.95;
                this.lastCameraMotionAt = performance.now();
                this.fov = this._healpixGrid.refreshFoV(this._camera, this._perspectiveMatrixManager.pMatrix);
                this._camera.refreshFoV(this.fov.minFoV);
                if (this.prevFov !== this.fov.minFoV) {
                    if (!this.centralPoinCoords) {
                        this.centralPoinCoords = this.updateCentralPoint();
                    }
                    this.prevFov = this.fov.minFoV;
                }
            }
            else {
                this.zoomInertia = 0;
            }
            this._cameraStatusChanged = true;
        }
        // Rotation inertia
        if (this.mouseDown ||
            Math.abs(this.inertiaX) > 0.02 ||
            Math.abs(this.inertiaY) > 0.02) {
            cameraRotated = true;
            const filteredInertia = this.filterRotationDeltaByAstroLocks(this.inertiaX, this.inertiaY);
            PHI = filteredInertia.deltaX;
            THETA = filteredInertia.deltaY;
            this.inertiaX = filteredInertia.deltaX * 0.95;
            this.inertiaY = filteredInertia.deltaY * 0.95;
            this._camera.rotate(PHI, THETA);
            this.lastCameraMotionAt = performance.now();
            this._perspectiveMatrixManager.computePerspectiveMatrix(canvas, this._camera, Config_js_1.bootSetup.camera_fov_deg, Config_js_1.bootSetup.camera_near_plane, Global_js_1.default.insideSphere);
            const lockCorrected = this.enforceAstronomicalRotationLocks();
            if (!lockCorrected) {
                this.enforceCameraNorthUp();
            }
        }
        else {
            this.inertiaY = 0;
            this.inertiaX = 0;
        }
        const nextFoV = this._healpixGrid.refreshFoV(this._camera, this._perspectiveMatrixManager.pMatrix);
        if (Number.isFinite(nextFoV.minFoV) && nextFoV.minFoV > 0) {
            this.fov = nextFoV;
            this._camera.refreshFoV(this.fov.minFoV);
            this.prevFov = this.fov.minFoV;
        }
        // Se la camera è ruotata (anche solo per inerzia), aggiorna punto centrale + emetti cameraChanged
        if (cameraRotated) {
            // Ricalcola il punto centrale
            const center = this.updateCentralPoint();
            const centralRaDeg = center.astroDeg.ra;
            const centralDecDeg = center.astroDeg.dec;
            // Evita spam: emetti solo se è cambiato abbastanza
            const raChanged = this.prevCentralRaDeg === null ||
                Math.abs(centralRaDeg - this.prevCentralRaDeg) > 1e-5;
            const decChanged = this.prevCentralDecDeg === null ||
                Math.abs(centralDecDeg - this.prevCentralDecDeg) > 1e-5;
            if (raChanged || decChanged) {
                this.prevCentralRaDeg = centralRaDeg;
                this.prevCentralDecDeg = centralDecDeg;
            }
        }
        if (this._cameraStatusChanged) {
            const now = performance.now();
            const shouldEmitCameraChanged = !this.mouseDown || now - this.lastCameraChangedAt > 100;
            const detail = shouldEmitCameraChanged ? this.getCurrentStatus() : null;
            if (detail) {
                // console.log('[AstroSphere::draw] emitting camera-changed event due to camera status change', detail)
                // console.log('[AstroSphere::draw] inertia', this.zoomInertia, this.inertiaX, this.inertiaY)
                this.canvas.dispatchEvent(new CustomEvent("camera-changed", {
                    detail,
                    bubbles: true,
                    composed: true,
                }));
                this.lastCameraChangedAt = now;
            }
            if (!this.startup && shouldEmitCameraChanged) {
                this._cameraStatusChanged = false;
            }
        }
        // GL state
        this._webgl.disable(this._webgl.DEPTH_TEST);
        this._webgl.enable(this._webgl.BLEND);
        this._webgl.enable(this._webgl.CULL_FACE);
        this._webgl.cullFace(Global_js_1.default.insideSphere ? this._webgl.FRONT : this._webgl.BACK);
        this._webgl.blendFunc(this._webgl.SRC_ALPHA, this._webgl.ONE_MINUS_SRC_ALPHA);
        if (this._activeBaseLayer === "hips" && this._activeHiPS) {
            const visibleOrder = Math.min(this._healpixGrid.visibleorder, this._activeHiPS.maxOrder);
            this._healpixGrid.visibleTilesManager.computeVisiblePixels(visibleOrder, this._webgl, this._camera, this._perspectiveMatrixManager.pMatrix);
        }
        // DRAW HiPS
        const stableFovDeg = this.fov?.minFoV ?? this._healpixGrid.getMinFoV();
        const nowForGrid = performance.now();
        const cameraMovingForGrid = this.mouseDown ||
            Math.abs(this.zoomInertia) > 0.0001 ||
            Math.abs(this.inertiaX) > 0.02 ||
            Math.abs(this.inertiaY) > 0.02 ||
            nowForGrid - this.lastCameraMotionAt < 220;
        // const skyEntityDrawInput: SkyEntityDrawInput = {
        // fovDeg: this._healpixGrid.getMinFoV(),
        //   camera: this._camera,
        //   pMatrix: this._perspectiveMatrixManager.pMatrix,
        //   centerSphericalDeg: this.updateCentralPoint().sphericalDeg,
        //   fovPolygon: this._activeBaseLayer === 'xyz' ? this.getFoVPolygon() : undefined,
        //   viewportSphericalSamples: this._activeBaseLayer === 'xyz' ? this.collectViewportSphericalSamples(7) : undefined,
        // }
        const skyEntityDrawInput = {
            fovDeg: stableFovDeg,
            camera: this._camera,
            pMatrix: this._perspectiveMatrixManager.pMatrix,
            centerSphericalDeg: this.updateCentralPoint().sphericalDeg,
            fovPolygon: undefined,
            viewportSphericalSamples: undefined,
            cameraMoving: cameraMovingForGrid,
        };
        if (this._activeBaseLayer === "hips") {
            this._activeHiPS?.draw(skyEntityDrawInput);
        }
        if (this._activeBaseLayer === "xyz") {
            this._activeXYZ2?.draw(skyEntityDrawInput);
        }
        this._healpixGrid.draw(skyEntityDrawInput);
        this._equatorialGrid.draw(skyEntityDrawInput);
        this._webgl.enable(this._webgl.DEPTH_TEST);
        this._webgl.disable(this._webgl.CULL_FACE);
        if (this.startup) {
            this.startup = false;
            const phiTheta = this.getPhiThetaDeg(canvas);
            const raDecDeg = (0, Utils_js_1.sphericalToAstroDeg)(phiTheta.phi, phiTheta.theta);
            const raHMS = (0, Utils_js_1.raDegToHMS)(raDecDeg.ra);
            const decDMS = (0, Utils_js_1.decDegToDMS)(raDecDeg.dec);
            // this.prevFov = this._healpixGrid.getMinFoV();
            this.prevFov = this.fov?.minFoV ?? this._healpixGrid.getMinFoV();
            this._cameraStatusChanged = true;
            console.log("(startup coords)", {
                raDeg: raDecDeg.ra,
                decDeg: raDecDeg.dec,
                raHMS,
                decDMS,
            });
        }
        this.activeCatalogues.forEach((cat) => {
            const activeModelMatrix = this._activeHiPS?.getModelMatrix() ??
                this._activeXYZ2?.getModelMatrix();
            if (activeModelMatrix) {
                cat.draw(activeModelMatrix, this.mouseHelper, this._camera.getCameraMatrix(), this._perspectiveMatrixManager.pMatrix);
            }
        });
        this.emitHoveredSourceIfChanged();
        this.activeFootprintSets.forEach((fst) => {
            const activeModelMatrix = this._activeHiPS?.getModelMatrix() ??
                this._activeXYZ2?.getModelMatrix();
            if (activeModelMatrix) {
                fst.draw(activeModelMatrix, this.mouseHelper, this._camera.getCameraMatrix(), this._perspectiveMatrixManager.pMatrix);
            }
        });
    }
    emitHoveredSourceIfChanged() {
        let nextHoveredSource = null;
        let nextHoveredCatalogue = null;
        for (const cat of this.activeCatalogues) {
            const hovered = cat.getPrimaryHoveredSource();
            if (!hovered)
                continue;
            nextHoveredSource = hovered;
            nextHoveredCatalogue = cat;
            break;
        }
        const unchanged = nextHoveredSource === this.lastHoveredSource &&
            nextHoveredCatalogue === this.lastHoveredCatalogue;
        if (unchanged)
            return;
        this.lastHoveredSource = nextHoveredSource;
        this.lastHoveredCatalogue = nextHoveredCatalogue;
        this._webgl.canvas.dispatchEvent(new CustomEvent("source-hovered", {
            detail: { source: nextHoveredSource, catalogue: nextHoveredCatalogue },
            bubbles: true,
            composed: true,
        }));
    }
}
exports["default"] = AstroSphere;


/***/ }),

/***/ 4735:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AbstractSkyEntity = void 0;
/**
 * @author Fabrizio Giordano (Fab)
 */
const gl_matrix_1 = __webpack_require__(1961);
const HiPSShaderProgram_js_1 = __webpack_require__(7786);
class AbstractSkyEntity {
    // Public-ish properties used elsewhere in the app
    refreshMe = false;
    fovX_deg = 180;
    fovY_deg = 180;
    xRad;
    yRad;
    prevFoV = this.fovX_deg;
    _name;
    // public insideSphere: boolean = bootSetup.insideSphere
    // Picking/sphere
    center;
    radius;
    isGalacticHips;
    // GL resources
    vertexTextureCoordBuffer = null;
    vertexPositionBuffer = null;
    vertexIndexBuffer = null;
    shaderProgram = null;
    // Matrices
    T = gl_matrix_1.mat4.create();
    R = gl_matrix_1.mat4.create();
    modelMatrix = gl_matrix_1.mat4.create();
    inverseModelMatrix = gl_matrix_1.mat4.create();
    // Precomputed transform from galactic to equatorial (already inverted)
    galacticMatrixInverted = gl_matrix_1.mat4.create();
    _webgl;
    _hipsShaderProgram;
    // protected _visibleTilesManager: VisibleTilesManager
    // protected _tileBuffer: TileBuffer
    constructor(in_radius, in_position, in_xRad, in_yRad, in_name, webgl, isGalacticHips) {
        this._webgl = webgl;
        this.xRad = in_xRad;
        this.yRad = in_yRad;
        this._name = in_name;
        this.center = gl_matrix_1.vec3.clone(in_position);
        this.radius = in_radius;
        // this.insideSphere = global.insideSphere
        this.isGalacticHips = !!isGalacticHips;
        // Fill the matrix via Float32Array.set (safer than mat4.set with 16 scalars)
        gl_matrix_1.mat4.set(this.galacticMatrixInverted, -0.054875582456588745, -0.8734370470046997, -0.48383501172065735, 0, 0.49410945177078247, -0.4448296129703522, 0.7469822764396667, 0, -0.8676661849021912, -0.19807636737823486, 0.4559837877750397, 0, 0, 0, 0, 1);
        // this._tileBuffer = new TileBuffer(1, this._webgl)
        // this._visibleTilesManager = new VisibleTilesManager(this._tileBuffer)
        // this._visibleTilesManager = new VisibleTilesManager()
        this._hipsShaderProgram = new HiPSShaderProgram_js_1.HiPSShaderProgram(this._webgl);
    }
    get name() {
        return this._name;
    }
    get hipsShaderProgram() {
        return this._hipsShaderProgram;
    }
    // get tileBuffer() {
    //   return this._tileBuffer
    // }
    get webgl() {
        return this._webgl;
    }
    /** GL setup and initial model transform */
    initGL(gl) {
        // GL resources
        this.vertexTextureCoordBuffer = gl.createBuffer();
        this.vertexPositionBuffer = gl.createBuffer();
        this.vertexIndexBuffer = gl.createBuffer();
        this.shaderProgram = gl.createProgram();
        // Reset object transforms
        this.T = gl_matrix_1.mat4.create();
        this.R = gl_matrix_1.mat4.create();
        this.modelMatrix = gl_matrix_1.mat4.create();
        this.inverseModelMatrix = gl_matrix_1.mat4.create();
        // Initial pose
        this.translate(this.center);
        this.rotate(this.xRad, this.yRad);
    }
    translate(translation) {
        gl_matrix_1.mat4.translate(this.T, this.T, translation);
        this.refreshModelMatrix();
    }
    rotate(rad1, rad2) {
        gl_matrix_1.mat4.rotate(this.R, this.R, rad2, [0, 0, 1]);
        gl_matrix_1.mat4.rotate(this.R, this.R, rad1, [1, 0, 0]);
        this.refreshModelMatrix();
    }
    rotateFromZero(rad1, rad2) {
        gl_matrix_1.mat4.identity(this.R);
        gl_matrix_1.mat4.rotate(this.R, this.R, rad1, [1, 0, 0]);
        gl_matrix_1.mat4.rotate(this.R, this.R, rad2, [0, 0, 1]);
        this.refreshModelMatrix();
    }
    refreshModelMatrix() {
        const R_inverse = gl_matrix_1.mat4.create();
        gl_matrix_1.mat4.invert(R_inverse, this.R);
        gl_matrix_1.mat4.multiply(this.modelMatrix, this.T, R_inverse);
        // Apply galactic frame transform if needed
        if (this.isGalacticHips) {
            gl_matrix_1.mat4.multiply(this.modelMatrix, this.modelMatrix, this.galacticMatrixInverted);
        }
    }
    getModelMatrixInverse() {
        gl_matrix_1.mat4.identity(this.inverseModelMatrix);
        gl_matrix_1.mat4.invert(this.inverseModelMatrix, this.modelMatrix);
        return this.inverseModelMatrix;
    }
    getModelMatrix() {
        return this.modelMatrix;
    }
    setModelMatrix(modelMatrix) {
        this.modelMatrix = modelMatrix;
    }
    /** Children with hierarchical geometry (e.g., HiPS) can override this. */
    setGeometryNeedsToBeRefreshed() {
        this.refreshGeometryOnFoVChanged = false;
    }
    // Helpers operating on raw mat4 buffers (kept from your JS)
    rotateX(m, angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const mv1 = m[1], mv5 = m[5], mv9 = m[9];
        m[1] = m[1] * c - m[2] * s;
        m[5] = m[5] * c - m[6] * s;
        m[9] = m[9] * c - m[10] * s;
        m[2] = m[2] * c + mv1 * s;
        m[6] = m[6] * c + mv5 * s;
        m[10] = m[10] * c + mv9 * s;
        return m;
    }
    rotateY(m, angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const mv0 = m[0], mv4 = m[4], mv8 = m[8];
        m[0] = c * m[0] + s * m[2];
        m[4] = c * m[4] + s * m[6];
        m[8] = c * m[8] + s * m[10];
        m[2] = c * m[2] - s * mv0;
        m[6] = c * m[6] - s * mv4;
        m[10] = c * m[10] - s * mv8;
        return m;
    }
}
exports.AbstractSkyEntity = AbstractSkyEntity;


/***/ }),

/***/ 5087:
/***/ ((__unused_webpack_module, exports) => {

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
// HiPSDescriptor.ts

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HiPSDescriptor = void 0;
class HiPSDescriptor {
    _minOrder = 3;
    _imgformats = [];
    _datarange = { min: undefined, max: undefined };
    _maxOrder;
    _tilewidth;
    _hipsFrame;
    _hipsName = 'NONAME';
    _hipsurl;
    _emMin;
    _emMax;
    _isGalctic = false;
    _propertiesRawText;
    _propertiesMap = new Map();
    constructor(hipsproperties, hipsurl) {
        this._hipsurl = hipsurl;
        this._propertiesRawText = hipsproperties;
        const lines = hipsproperties.split(/\r\n|\n/);
        for (const raw of lines) {
            const line = raw.trim();
            if (!line || line.startsWith('#'))
                continue;
            const maybeKey = line.slice(0, line.indexOf('=')).trim();
            const maybeValue = this.getValue(line);
            if (maybeKey && maybeValue !== undefined) {
                this._propertiesMap.set(maybeKey, maybeValue);
            }
            if (line.startsWith('hips_tile_format') || line.startsWith('format')) {
                // normalize jpeg→jpg
                const list = this.getValue(line)?.replace(/jpeg/gi, 'jpg') ?? '';
                this._imgformats = list.split(/\s+/).filter(Boolean);
            }
            else if (line.startsWith('hips_data_range')) {
                const v = this.getValue(line);
                if (v) {
                    const [minStr, maxStr] = v.split(/\s+/);
                    this._datarange.min = parseFloat(minStr);
                    this._datarange.max = parseFloat(maxStr);
                }
            }
            else if (line.startsWith('hips_tile_width')) {
                const n = Number(this.getValue(line));
                this._tilewidth = Number.isFinite(n) ? n : undefined;
            }
            else if (line.startsWith('hips_order_min')) {
                const n = Number(this.getValue(line));
                this._minOrder = Number.isFinite(n) ? n : this._minOrder;
            }
            else if (line.startsWith('hips_order') || line.startsWith('maxOrder')) {
                const n = Number(this.getValue(line));
                this._maxOrder = Number.isFinite(n) ? n : this._maxOrder;
            }
            else if (line.startsWith('hips_frame') || line.startsWith('frame')) {
                this._hipsFrame = this.getValue(line);
            }
            else if (line.startsWith('obs_collection') || line.startsWith('label')) {
                this._hipsName = this.getValue(line) ?? this._hipsName;
            }
            else if (line.startsWith('em_min')) {
                const n = Number(this.getValue(line));
                this._emMin = Number.isFinite(n) ? n : undefined;
            }
            else if (line.startsWith('em_max')) {
                const n = Number(this.getValue(line));
                this._emMax = Number.isFinite(n) ? n : undefined;
            }
        }
        if (!this._hipsName) {
            console.warn(`[HiPSDescriptor] hipsName not defined in properties of ${this._hipsurl}. Defaulting to 'NONAME'.`);
        }
        if (!this._hipsFrame) {
            console.warn(`[HiPSDescriptor] hips_frame not defined in properties of ${this._hipsurl}. Defaulting to 'equatorial'.`);
            this._hipsFrame = 'equatorial';
        }
        this._isGalctic = this._hipsFrame.toLowerCase().includes('gal');
        if (this._maxOrder === undefined || this._imgformats.length === 0) {
            throw new Error(`[HiPSDescriptor] Invalid properties for ${this._hipsurl}. maxOrder=${this._maxOrder}, imgFormats.length=${this._imgformats.length}`);
        }
    }
    getValue(line) {
        const idx = line.indexOf('=');
        if (idx < 0)
            return undefined;
        return line.slice(idx + 1).trim();
    }
    // --- Getters ---
    get propertiesRawText() {
        return this._propertiesRawText;
    }
    get properties() {
        return new Map(this._propertiesMap);
    }
    getProperty(key) {
        return this._propertiesMap.get(key);
    }
    get surveyName() {
        return this._hipsName;
    }
    get url() {
        return this._hipsurl;
    }
    get maxOrder() {
        return this._maxOrder;
    }
    get minOrder() {
        return this._minOrder;
    }
    get imgFormats() {
        return this._imgformats;
    }
    get hipsFrame() {
        return this._hipsFrame;
    }
    get isGalactic() {
        return this._isGalctic;
    }
    get emMin() {
        return this._emMin;
    }
    get emMax() {
        return this._emMax;
    }
    get tileWidth() {
        return this._tilewidth;
    }
    get dataRange() {
        return this._datarange;
    }
}
exports.HiPSDescriptor = HiPSDescriptor;


/***/ }),

/***/ 5361:
/***/ ((__unused_webpack_module, exports) => {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
class GridTextHelper {
    static layers = new Map();
    layer;
    constructor(layer = 'equatorial') {
        this.layer = layer;
        GridTextHelper.getLayerState(layer);
    }
    initHtml() {
        GridTextHelper.getLayerState(this.layer);
    }
    resetDivSets(layer = this.layer) {
        const state = GridTextHelper.getLayerState(layer);
        for (; state.divSetNdx < state.divSets.length; ++state.divSetNdx) {
            state.divSets[state.divSetNdx].style.display = 'none';
        }
        state.divSetNdx = 0;
    }
    addHPXDivSet(msg, x, y) {
        this.addLabel('healpix', msg, x + 25, y, 'hpx');
    }
    addEqDivSet(msg, x, y, type) {
        this.addLabel('equatorial', msg, type === 'ra' ? x + 25 : x, type === 'ra' ? y : y + 25, type);
    }
    addLonLatDivSet(msg, x, y, type) {
        this.addLabel('lonlat', msg, type === 'lon' ? x + 25 : x, type === 'lon' ? y : y + 25, type);
    }
    addLabel(layer, msg, x, y, kind) {
        const state = GridTextHelper.getLayerState(layer);
        if (!state.container)
            return;
        let divSet = state.divSets[state.divSetNdx++];
        if (!divSet) {
            const div = document.createElement('div');
            const textNode = document.createTextNode('');
            div.appendChild(textNode);
            state.container.appendChild(div);
            divSet = { div, textNode, style: div.style };
            state.divSets.push(divSet);
        }
        divSet.div.className = this.classNameForKind(kind);
        divSet.style.display = 'block';
        divSet.style.left = `${Math.floor(x)}px`;
        divSet.style.top = `${Math.floor(y)}px`;
        divSet.textNode.nodeValue = msg;
    }
    classNameForKind(kind) {
        switch (kind) {
            case 'dec':
                return 'floating-div-dec';
            case 'lat':
                return 'floating-div-lat';
            case 'lon':
                return 'floating-div-lon';
            case 'hpx':
            case 'ra':
            default:
                return 'floating-div-ra';
        }
    }
    static getLayerState(layer) {
        const current = GridTextHelper.layers.get(layer);
        if (current) {
            if (!current.container)
                current.container = GridTextHelper.resolveContainer(layer);
            return current;
        }
        const state = {
            container: GridTextHelper.resolveContainer(layer),
            divSets: [],
            divSetNdx: 0,
        };
        GridTextHelper.layers.set(layer, state);
        return state;
    }
    static resolveContainer(layer) {
        if (layer === 'healpix') {
            return document.querySelector('#gridhpx');
        }
        return document.querySelector('#gridcoords');
    }
}
exports["default"] = GridTextHelper;


/***/ }),

/***/ 5403:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MetadataManager = void 0;
const MetadataColumn_js_1 = __webpack_require__(1072);
class MetadataManager {
    static STANDARD_SIZE = "STANDARD_SIZE";
    static STANDARD_HUE = "STANDARD_HUE";
    _outlineColumnList = [];
    _raColumnList = [];
    _decColumnList = [];
    _shapeColumnList = [];
    _hueColumnList = [];
    _selectedOutlineColumn;
    _selectedRaColumn;
    _selectedDecColumn;
    _selectedShapeColumn;
    _selectedHueColumn;
    _selectedNameColumn;
    _columns = [];
    constructor(metadataColumns) {
        metadataColumns.forEach(c => {
            if (c.columnType == MetadataColumn_js_1.ColumnType.NUMBER) {
                this.addHueColumn(c);
                this.addShapeColumn(c);
            }
            if (c.columnType == MetadataColumn_js_1.ColumnType.GEOM_RA) {
                this.addRaColumn(c);
            }
            if (c.columnType == MetadataColumn_js_1.ColumnType.GEOM_DEC) {
                this.addDecColumn(c);
            }
            if (c.columnType == MetadataColumn_js_1.ColumnType.GEOM_FOOTPRINT) {
                this.addOutlineColumn(c);
            }
            if (c.columnType == MetadataColumn_js_1.ColumnType.MAIN_NAME) {
                this._selectedNameColumn = c;
            }
            this._columns.push(c);
        });
        // if (!this._selectedNameColumn) {
        //     throw new Error("No name column found")
        // }
    }
    addOutlineColumn(outlineColumn) {
        this._outlineColumnList.push(outlineColumn);
        this._selectedOutlineColumn = outlineColumn;
    }
    addRaColumn(column) {
        this._selectedRaColumn = this._selectedRaColumn || column;
        this._raColumnList.push(column);
    }
    addDecColumn(column) {
        this._selectedDecColumn = this._selectedDecColumn || column;
        this._decColumnList.push(column);
    }
    addHueColumn(column) {
        this._hueColumnList.push(column);
    }
    addShapeColumn(column) {
        this._shapeColumnList.push(column);
    }
    get selectedRaColumn() {
        return this._selectedRaColumn;
    }
    get selectedDecColumn() {
        return this._selectedDecColumn;
    }
    get selectedHueColumn() {
        return this._selectedHueColumn;
    }
    get selectedShapeColumn() {
        return this._selectedShapeColumn;
    }
    get selectedOutlineColumn() {
        return this._selectedOutlineColumn;
    }
    get selectedNameColumn() {
        return this._selectedNameColumn;
    }
    get columns() {
        return this._columns;
    }
    get raColumnList() {
        return this._raColumnList;
    }
    get decColumnList() {
        return this._decColumnList;
    }
    get outlineColumnList() {
        return this._outlineColumnList;
    }
    get hueColumnList() {
        return this._hueColumnList;
    }
    get shapeColumnList() {
        return this._shapeColumnList;
    }
    set selectedRaColumn(columnName) {
        this._selectedRaColumn = this._raColumnList.find(c => c.name === columnName) || this._selectedRaColumn;
    }
    set selectedDecColumn(columnName) {
        this._selectedDecColumn = this._decColumnList.find(c => c.name === columnName) || this._selectedDecColumn;
    }
    set selectedOutlineColumn(columnName) {
        this._selectedOutlineColumn = this._outlineColumnList.find(c => c.name === columnName) || this._selectedOutlineColumn;
    }
    set selectedHueColumn(columnName) {
        this._selectedHueColumn = this._hueColumnList.find(c => c.name === columnName);
    }
    set selectedShapeColumn(columnName) {
        this._selectedShapeColumn = this._shapeColumnList.find(c => c.name === columnName);
    }
    set selectedNameColumn(columnName) {
        this._selectedNameColumn = this._columns.find(c => c.name === columnName);
    }
    resetShapeColumn() {
        this._selectedShapeColumn = undefined;
    }
    resetHueColumn() {
        this._selectedHueColumn = undefined;
    }
}
exports.MetadataManager = MetadataManager;


/***/ }),

/***/ 5409:
/***/ ((__unused_webpack_module, exports) => {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.xyzTileRequestScheduler = exports.XYZTileRequestScheduler = exports.XYZTileRequestError = void 0;
class XYZTileRequestError extends Error {
    cooldownMs;
    retryable;
    constructor(message, cooldownMs, retryable = true) {
        super(message);
        this.name = 'XYZTileRequestError';
        this.cooldownMs = cooldownMs;
        this.retryable = retryable;
    }
}
exports.XYZTileRequestError = XYZTileRequestError;
class XYZTileRequestScheduler {
    _maxConcurrent;
    _activeCount = 0;
    _queue = [];
    _inflight = new Map();
    _hostBackoff = new Map();
    _sequence = 0;
    constructor(maxConcurrent = 4) {
        this._maxConcurrent = maxConcurrent;
    }
    setMaxConcurrent(maxConcurrent) {
        this._maxConcurrent = Math.max(1, Math.floor(maxConcurrent));
        this.pump();
    }
    getMaxConcurrent() {
        return this._maxConcurrent;
    }
    getDebugStats() {
        const now = Date.now();
        const hostsInBackoff = Array.from(this._hostBackoff.entries())
            .map(([host, state]) => ({
            host,
            cooldownMs: Math.max(0, state.cooldownUntil - now),
            consecutiveFailures: state.consecutiveFailures,
        }))
            .filter((entry) => entry.cooldownMs > 0 || entry.consecutiveFailures > 0)
            .sort((a, b) => b.cooldownMs - a.cooldownMs);
        return {
            activeRequests: this._activeCount,
            queuedRequests: this._queue.length,
            inflightRequests: this._inflight.size,
            maxConcurrentRequests: this._maxConcurrent,
            highestQueuedPriority: this._queue[0]?.priority ?? null,
            hostsInBackoff,
        };
    }
    load(url, priority = 0) {
        const inflight = this._inflight.get(url);
        if (inflight) {
            return inflight;
        }
        const hostCooldown = this.getHostCooldown(url);
        const now = Date.now();
        if (hostCooldown > now) {
            return Promise.reject(new XYZTileRequestError(`Cooldown active for ${new URL(url).host}`, hostCooldown - now));
        }
        const promise = new Promise((resolve, reject) => {
            this._queue.push({
                url,
                resolve,
                reject,
                priority,
                sequence: this._sequence++,
            });
            this._queue.sort((a, b) => b.priority - a.priority || a.sequence - b.sequence);
            this.pump();
        }).finally(() => {
            this._inflight.delete(url);
        });
        this._inflight.set(url, promise);
        return promise;
    }
    pump() {
        while (this._activeCount < this._maxConcurrent && this._queue.length > 0) {
            const item = this._queue.shift();
            if (!item)
                return;
            const hostCooldown = this.getHostCooldown(item.url);
            const now = Date.now();
            if (hostCooldown > now) {
                item.reject(new XYZTileRequestError(`Cooldown active for ${new URL(item.url).host}`, hostCooldown - now));
                continue;
            }
            this._activeCount += 1;
            this.fetchBlob(item)
                .then(item.resolve)
                .catch(item.reject)
                .finally(() => {
                this._activeCount -= 1;
                this.pump();
            });
        }
    }
    async fetchBlob(item) {
        try {
            const response = await fetch(item.url, {
                mode: 'cors',
                cache: 'force-cache',
            });
            if (!response.ok) {
                const isTransient = response.status === 429 || response.status >= 500;
                const cooldownMs = this.registerFailure(item.url, isTransient);
                throw new XYZTileRequestError(`HTTP ${response.status} loading ${item.url}`, isTransient ? cooldownMs : 5 * 60 * 1000, isTransient);
            }
            this.registerSuccess(item.url);
            return await response.blob();
        }
        catch (error) {
            if (error instanceof XYZTileRequestError) {
                throw error;
            }
            const cooldownMs = this.registerFailure(item.url, false);
            throw new XYZTileRequestError(`Network/CORS failure loading ${item.url}`, cooldownMs, true);
        }
    }
    getHostCooldown(url) {
        try {
            return this._hostBackoff.get(new URL(url).host)?.cooldownUntil ?? 0;
        }
        catch {
            return 0;
        }
    }
    registerSuccess(url) {
        try {
            const host = new URL(url).host;
            this._hostBackoff.set(host, {
                cooldownUntil: 0,
                consecutiveFailures: 0,
            });
        }
        catch {
            // no-op
        }
    }
    registerFailure(url, isRateLimited) {
        if (!isRateLimited) {
            return 0;
        }
        try {
            const host = new URL(url).host;
            const previous = this._hostBackoff.get(host) ?? {
                cooldownUntil: 0,
                consecutiveFailures: 0,
            };
            const consecutiveFailures = previous.consecutiveFailures + 1;
            const baseDelayMs = 4000;
            const cooldownMs = Math.min(120000, baseDelayMs * (2 ** Math.min(consecutiveFailures - 1, 5)));
            this._hostBackoff.set(host, {
                cooldownUntil: Date.now() + cooldownMs,
                consecutiveFailures,
            });
            return cooldownMs;
        }
        catch {
            return 30000;
        }
    }
}
exports.XYZTileRequestScheduler = XYZTileRequestScheduler;
exports.xyzTileRequestScheduler = new XYZTileRequestScheduler();


/***/ }),

/***/ 5781:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TerraPointSetGL = void 0;
const CatalogueGL_js_1 = __webpack_require__(1232);
class TerraPointSetGL extends CatalogueGL_js_1.CatalogueGL {
    _kind = 'TerraPointSetGL';
}
exports.TerraPointSetGL = TerraPointSetGL;


/***/ }),

/***/ 5803:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SphereFoV = void 0;
const gl_matrix_1 = __webpack_require__(1961);
const Utils_js_1 = __webpack_require__(7930);
class SphereFoV {
    static MIN_FOV_DEG = 1e-6;
    fovXDeg = 180;
    fovYDeg = 180;
    ratio = 0;
    _minFoV = 180;
    _webgl;
    _lastModel = null;
    _lastCamera = null;
    constructor(webgl) {
        this._webgl = webgl;
    }
    getFoV(insideSphere, model, camera, pMatrix) {
        this._lastModel = model;
        this._lastCamera = camera;
        const canvas = this._webgl.canvas;
        if (!canvas) {
            this.fovXDeg = 180;
            this.fovYDeg = 180;
            this._minFoV = this.minFoV;
            return this;
        }
        const rect = canvas.getBoundingClientRect();
        const canvasWidth = rect.width;
        const canvasHeight = rect.height;
        this.fovXDeg = this.computeAngle(0, canvasHeight / 2, insideSphere, model, camera, pMatrix).angleDeg;
        this.fovYDeg = this.computeAngle(canvasWidth / 2, 0, insideSphere, model, camera, pMatrix).angleDeg;
        this._minFoV = this.minFoV;
        this.ratio = this.computeRatio(camera);
        return this;
    }
    computeRatio(camera) {
        const pos = camera.getCameraPosition();
        const distanceFromCenter = Math.sqrt(pos[0] * pos[0] + pos[1] * pos[1] + pos[2] * pos[2]);
        return distanceFromCenter / this.fovYDeg;
    }
    get minFoV() {
        const minFov = this.fovYDeg <= this.fovXDeg ? this.fovYDeg : this.fovXDeg;
        this._minFoV = Math.max(minFov, SphereFoV.MIN_FOV_DEG);
        return this._minFoV;
    }
    get xFoV() {
        return this.fovXDeg;
    }
    get yFoV() {
        return this.fovYDeg;
    }
    computeDistanceFromAngle(angleDeg) {
        return angleDeg * this.ratio;
    }
    changeMinFov(deg) {
        if (this.fovYDeg <= this.fovXDeg) {
            this.fovYDeg = deg;
        }
        else {
            this.fovXDeg = deg;
        }
        this.minFoV;
    }
    computeCameraPositionForMinFoV(targetMinFoVDeg) {
        return this.computeCameraPositionForFoV(targetMinFoVDeg);
    }
    computeCameraPositionForFoV(targetFoVDeg) {
        return this.computeCameraPositionForAngularDiameter(targetFoVDeg);
    }
    computeCameraPositionForAngularDiameter(targetAngularDiameterDeg) {
        if (!this._lastModel || !this._lastCamera) {
            return [0, 0, 0];
        }
        const eps = 1e-6;
        const clamped = Math.max(eps, Math.min(180 - eps, targetAngularDiameterDeg));
        const halfRad = (clamped * Math.PI) / 360.0;
        const sinHalf = Math.sin(halfRad);
        if (sinHalf <= 0) {
            return [0, 0, 0];
        }
        const model = this._lastModel;
        const camera = this._lastCamera;
        const targetDistance = Math.max(model.radius / sinHalf, model.radius + 1e-4);
        const camPos = camera.getCameraPosition();
        const direction = gl_matrix_1.vec3.fromValues(camPos[0] - model.center[0], camPos[1] - model.center[1], camPos[2] - model.center[2]);
        if (gl_matrix_1.vec3.length(direction) < eps) {
            gl_matrix_1.vec3.set(direction, 0, 0, 1);
        }
        else {
            gl_matrix_1.vec3.normalize(direction, direction);
        }
        return [
            model.center[0] + direction[0] * targetDistance,
            model.center[1] + direction[1] * targetDistance,
            model.center[2] + direction[2] * targetDistance,
        ];
    }
    computeAngle(canvasX, canvasY, insideSphere, model, camera, pMatrix) {
        const canvas = this._webgl.canvas;
        const rect = canvas.getBoundingClientRect();
        const centerHit = this.getIntersectionPointWithModel(rect.width / 2, rect.height / 2, model, camera, pMatrix);
        const edgeHit = this.getIntersectionPointWithModel(canvasX, canvasY, model, camera, pMatrix);
        if (!centerHit || !edgeHit) {
            return { angleDeg: 180, distance: -1 };
        }
        const angleDeg = 2 * this.computeAngularDistanceDeg(centerHit.point, edgeHit.point);
        return {
            angleDeg,
            distance: edgeHit.distance,
        };
    }
    computeAngularDistanceDeg(a, b) {
        const aNorm = gl_matrix_1.vec3.normalize(gl_matrix_1.vec3.create(), a);
        const bNorm = gl_matrix_1.vec3.normalize(gl_matrix_1.vec3.create(), b);
        const dot = gl_matrix_1.vec3.dot(aNorm, bNorm);
        const cross = gl_matrix_1.vec3.cross(gl_matrix_1.vec3.create(), aNorm, bNorm);
        const angleRad = Math.atan2(gl_matrix_1.vec3.length(cross), Math.min(1, Math.max(-1, dot)));
        return (0, Utils_js_1.radToDeg)(angleRad);
    }
    getIntersectionPointWithModel(mouseX, mouseY, model, camera, pMatrix) {
        const rayWorld = this.getRayFromMouse(mouseX, mouseY, pMatrix, camera.getCameraMatrix());
        const distance = this.raySphere(camera.getCameraPosition(), rayWorld, model);
        if (distance < 0) {
            return null;
        }
        const worldHit = gl_matrix_1.vec3.create();
        gl_matrix_1.vec3.scale(worldHit, rayWorld, distance);
        gl_matrix_1.vec3.add(worldHit, camera.getCameraPosition(), worldHit);
        const worldHit4 = [worldHit[0], worldHit[1], worldHit[2], 1.0];
        const modelHit4 = [0, 0, 0, 0];
        this.mat4MultiplyVec4(model.getModelMatrixInverse(), worldHit4, modelHit4);
        return {
            point: gl_matrix_1.vec3.fromValues(modelHit4[0], modelHit4[1], modelHit4[2]),
            distance,
        };
    }
    getRayFromMouse(mouseX, mouseY, pMatrix, vMatrix) {
        const gl = this._webgl;
        const canvas = gl.canvas;
        const rect = canvas.getBoundingClientRect();
        const x = (2.0 * mouseX) / rect.width - 1.0;
        const y = 1.0 - (2.0 * mouseY) / rect.height;
        const rayClip = [x, y, -1.0, 1.0];
        const pInv = gl_matrix_1.mat4.create();
        gl_matrix_1.mat4.invert(pInv, pMatrix);
        const rayEye4 = [0, 0, 0, 0];
        this.mat4MultiplyVec4(pInv, rayClip, rayEye4);
        const rayEye = [rayEye4[0], rayEye4[1], -1.0, 0.0];
        const vInv = gl_matrix_1.mat4.create();
        gl_matrix_1.mat4.invert(vInv, vMatrix);
        const rayWorld4 = [0, 0, 0, 0];
        this.mat4MultiplyVec4(vInv, rayEye, rayWorld4);
        const rayWorld = gl_matrix_1.vec3.fromValues(rayWorld4[0], rayWorld4[1], rayWorld4[2]);
        gl_matrix_1.vec3.normalize(rayWorld, rayWorld);
        return rayWorld;
    }
    raySphere(rayOrigWorld, rayDirectionWorld, sphere) {
        let intersectionDistance = -1;
        const L = gl_matrix_1.vec3.create();
        gl_matrix_1.vec3.subtract(L, rayOrigWorld, sphere.center);
        const b = gl_matrix_1.vec3.dot(rayDirectionWorld, L);
        const c = gl_matrix_1.vec3.dot(L, L) - sphere.radius * sphere.radius;
        const disc = b * b - c;
        if (disc > 0.0) {
            const s = Math.sqrt(disc);
            const ta = -b + s;
            const tb = -b - s;
            if (ta >= 0.0 || tb >= 0.0) {
                intersectionDistance = tb < 0.0 ? ta : Math.min(ta, tb);
            }
        }
        else if (disc === 0.0) {
            const t = -b;
            if (t >= 0.0) {
                intersectionDistance = t;
            }
        }
        return intersectionDistance;
    }
    mat4MultiplyVec4(m, v, out) {
        out[0] = m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12] * v[3];
        out[1] = m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13] * v[3];
        out[2] = m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14] * v[3];
        out[3] = m[3] * v[0] + m[7] * v[1] + m[11] * v[2] + m[15] * v[3];
    }
}
exports.SphereFoV = SphereFoV;


/***/ }),

/***/ 5947:
/***/ ((__unused_webpack_module, exports) => {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
class ShaderManager {
    static catalogueVS() {
        return `#version 300 es
    in vec4 aCatPosition;
    in float a_selected;
    in float a_pointsize;
    in float a_brightness;

    out float v_selected;
    out float v_brightness;
    out lowp vec4 vColor;  // not used

    uniform mat4 uPMatrix;
    uniform mat4 uMVMatrix;

    void main() {

      gl_Position = (uPMatrix * uMVMatrix * aCatPosition);
      gl_PointSize = a_pointsize;
      v_selected = a_selected;
      v_brightness = a_brightness;
    }`;
    }
    static catalogueFS() {
        return `#version 300 es
    precision mediump float;
    
    #ifdef GL_OES_standard_derivatives
    #extension GL_OES_standard_derivatives : enable
    #endif

    // https://www.desultoryquest.com/blog/drawing-anti-aliased-circular-points-using-opengl-slash-webgl/

    // precision mediump float;

    in float v_selected;
    in float v_brightness;

    uniform vec4 u_fragcolor;

    out vec4 fragColor;

    // varying float v_selected;
    // varying float v_brightness;

    const float EPSILON = 1e-10;
    
    vec3 RGBtoHCV(in vec3 rgb) {
      // RGB [0..1] to Hue-Chroma-Value [0..1]
      // Based on work by Sam Hocevar and Emil Persson
      vec4 p = (rgb.g < rgb.b) ? vec4(rgb.bg, -1., 2. / 3.) : vec4(rgb.gb, 0., -1. / 3.);
      vec4 q = (rgb.r < p.x) ? vec4(p.xyw, rgb.r) : vec4(rgb.r, p.yzx);
      float c = q.x - min(q.w, q.y);
      float h = abs((q.w - q.y) / (6. * c + EPSILON) + q.z);
      return vec3(h, c, q.x);
    }

    vec3 RGBtoHSL(in vec3 rgb) {
      // RGB [0..1] to Hue-Saturation-Lightness [0..1]
      vec3 hcv = RGBtoHCV(rgb);
      //vec3 hcv = vec3(1., 1., 1.);
      float z = hcv.z - hcv.y * 0.5;
      float s = hcv.y / (1. - abs(z * 2. - 1.) + EPSILON);
      return vec3(hcv.x, s, z);
    }

    vec3 HUEtoRGB(in float hue){
      // Hue [0..1] to RGB [0..1]
      // See http://www.chilliant.com/rgb2hsv.html
      vec3 rgb = abs(hue * 6. - vec3(3, 2, 4)) * vec3(1, -1, -1) + vec3(-1, 2, 2);
      return clamp(rgb, 0., 1.);
    }

    vec3 HSLtoRGB(in vec3 hsl) {
      // Hue-Saturation-Lightness [0..1] to RGB [0..1]
      vec3 rgb = HUEtoRGB(hsl.x);
      float c = (1. - abs(2. * hsl.z - 1.)) * hsl.y;
      return (rgb - 0.5) * c + hsl.z;
    }
  
    void main() {

      float r = 0.0, delta = 0.0, alpha = 1.0;
      vec2 cxy = 2.0 * gl_PointCoord - 1.0;
      r = dot(cxy, cxy);
      if (r > 1.0) {
        discard;
      }

      #ifdef GL_OES_standard_derivatives
        delta = fwidth(r);
        alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);
      #endif

      if (v_selected == 1.0){
        // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0) * (alpha);
        fragColor = vec4(1.0, 0.0, 0.0, 1.0) * (alpha);
      } else if (v_selected == 2.0){
        // gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0) * (alpha);
        fragColor = vec4(1.0, 1.0, 0.0, 1.0) * (alpha);
      }else{
        if (r < 0.4) {
          discard;
        }
        if ( v_brightness >= -1.0 && v_brightness <= 1.0) {
          // Round-trip RGB->HSL->RGB with time-dependent lightness
          vec3 hsl = RGBtoHSL(vec3(u_fragcolor));
          //hsl.z = pow(hsl.z, sin(iTime) + 1.5);
          // hsl.z = pow(hsl.z, v_brightness + 1.5);
          hsl.z = pow(hsl.z, v_brightness + 1.5);
          vec3 hslcolor = HSLtoRGB(hsl);
          // gl_FragColor = vec4(hslcolor, u_fragcolor[3]) * (alpha);
          fragColor = vec4(hslcolor, u_fragcolor[3]) * (alpha);
        } else {
          // gl_FragColor = u_fragcolor * (alpha);
          fragColor = u_fragcolor * (alpha);
        }
      }
    }`;
    }
    static footprintVS() {
        return `#version 300 es
    precision highp float;

    layout(location = 0) in vec4 aCatPosition;

    uniform float u_pointsize;
    uniform mat4 uMVMatrix;
    uniform mat4 uPMatrix;

    void main() {
      gl_Position = uPMatrix * uMVMatrix * aCatPosition;
      gl_PointSize = u_pointsize;   // Works in WebGL2
    }`;
    }
    static footprintFS() {
        return `#version 300 es
    precision mediump float;

    uniform vec4 u_fragcolor;
    out vec4 fragColor;

    void main() {
      fragColor = u_fragcolor;
    }`;
    }
    static hipsVS() {
        return `#version 300 es
    in vec3 aVertexPosition;
    in vec2 aTextureCoord;

    uniform mat4 uMMatrix;
    uniform mat4 uVMatrix;
    uniform mat4 uPMatrix;

    out vec2 vTextureCoord;

    void main() {
      gl_Position = uPMatrix * uVMatrix * uMMatrix * vec4(aVertexPosition, 1.0);
      vTextureCoord = aTextureCoord;
    }`;
    }
    static hipsNativeFS() {
        return `#version 300 es
    precision mediump float;

    in vec2 vTextureCoord;

    uniform sampler2D uSampler0;
    uniform sampler2D uSampler1;
    uniform sampler2D uSampler2;
    uniform sampler2D uSampler3;
    uniform sampler2D uSampler4;
    uniform sampler2D uSampler5;
    uniform sampler2D uSampler6;
    uniform sampler2D uSampler7;

    uniform float uFactor0;
    uniform float uFactor1;
    uniform float uFactor2;
    uniform float uFactor3;
    uniform float uFactor4;
    uniform float uFactor5;
    uniform float uFactor6;
    uniform float uFactor7;

    out vec4 fragColor;

    void main() {
      vec3 finalColor = vec3(0.0);

      if (uFactor0 >= 0.0){
        vec4 mycolor;
        #if __VERSION__ > 120
          vec4 color0 = texture(uSampler0, vTextureCoord);
        #else
          vec4 color0 = texture2D(uSampler0, vTextureCoord);
        #endif
        mycolor = color0;
        finalColor += mycolor.rgb * uFactor0;
      } else if (uFactor7 >= 0.0){
        finalColor = vec3(1.0, 0.0, 0.0);
      }
      fragColor = vec4(finalColor, 1.0);
    }`;
    }
    static hipsGrayscaleFS() {
        return `#version 300 es
    precision mediump float;

    in vec2 vTextureCoord;

    uniform sampler2D uSampler0;
    uniform sampler2D uSampler1;
    uniform sampler2D uSampler2;
    uniform sampler2D uSampler3;
    uniform sampler2D uSampler4;
    uniform sampler2D uSampler5;
    uniform sampler2D uSampler6;
    uniform sampler2D uSampler7;

    uniform float uFactor0;
    uniform float uFactor1;
    uniform float uFactor2;
    uniform float uFactor3;
    uniform float uFactor4;
    uniform float uFactor5;
    uniform float uFactor6;
    uniform float uFactor7;

    out vec4 fragColor;

    void main() {
      vec3 finalColor = vec3(0.0);

      if (uFactor0 >= 0.0){
        #if __VERSION__ > 120
          vec4 color0 = texture(uSampler0, vTextureCoord);
        #else
          vec4 color0 = texture2D(uSampler0, vTextureCoord);
        #endif
        float gray = 0.21 * color0.r + 0.71 * color0.g + 0.07 * color0.b;
        finalColor = color0.rgb * (1.0 - uFactor0) + vec3(gray) * uFactor0;
      }
      if (uFactor1 >= 0.0){
        #if __VERSION__ > 120
          vec4 color1 = texture(uSampler1, vTextureCoord);
        #else
          vec4 color1 = texture2D(uSampler1, vTextureCoord);
        #endif
        finalColor += color1.rgb * uFactor1;
      }
      if (uFactor2 >= 0.0){
        #if __VERSION__ > 120
          vec4 color2 = texture(uSampler2, vTextureCoord);
        #else
          vec4 color2 = texture2D(uSampler2, vTextureCoord);
        #endif
        finalColor += color2.rgb * uFactor2;
      }
      if (uFactor3 >= 0.0){
        #if __VERSION__ > 120
          vec4 color3 = texture(uSampler3, vTextureCoord);
        #else
          vec4 color3 = texture2D(uSampler3, vTextureCoord);
        #endif
        finalColor += color3.rgb * uFactor3;
      }
      if (uFactor4 >= 0.0){
        #if __VERSION__ > 120
          vec4 color4 = texture(uSampler4, vTextureCoord);
        #else
          vec4 color4 = texture2D(uSampler4, vTextureCoord);
        #endif
        finalColor += color4.rgb * uFactor4;
      }
      if (uFactor5 >= 0.0){
        #if __VERSION__ > 120
          vec4 color5 = texture(uSampler5, vTextureCoord);
        #else
          vec4 color5 = texture2D(uSampler5, vTextureCoord);
        #endif
        finalColor += color5.rgb * uFactor5;
      }
      if (uFactor6 >= 0.0){
        #if __VERSION__ > 120
          vec4 color6 = texture(uSampler6, vTextureCoord);
        #else
          vec4 color6 = texture2D(uSampler6, vTextureCoord);
        #endif
        finalColor += color6.rgb * uFactor6;
      }
      if (uFactor7 >= 0.0){
        #if __VERSION__ > 120
          vec4 color7 = texture(uSampler7, vTextureCoord);
        #else
          vec4 color7 = texture2D(uSampler7, vTextureCoord);
        #endif
        finalColor += color7.rgb * uFactor7;
      }
      fragColor = vec4(finalColor, 1.0);
    }`;
    }
    static hipsColorMapFS() {
        return `#version 300 es
    precision mediump float;

    in vec2 vTextureCoord;

    // UBO
    layout (std140) uniform colormap {
      float r_palette[256];
      float g_palette[256];
      float b_palette[256];
    };

    uniform sampler2D uSampler0;
    uniform float uFactor0;

    out vec4 fragColor;

    void main() {
      #if __VERSION__ > 120
        vec4 color0 = texture(uSampler0, vTextureCoord);
      #else
        vec4 color0 = texture2D(uSampler0, vTextureCoord);
      #endif

      int x = int(color0.r * 255.0);
      float px = r_palette[x] / 256.0;

      int y = int(color0.g * 255.0);
      float py = g_palette[y] / 256.0;

      int z = int(color0.b * 255.0);
      float pz = b_palette[z] / 256.0;

      // uFactor0 reserved for future blending if needed
      fragColor = vec4(px, py, pz, 1.0);
    }`;
    }
}
exports["default"] = ShaderManager;


/***/ }),

/***/ 6553:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
/**
 * @author Fabrizio Giordano (Fab77)
 */

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Point = void 0;
const gl_matrix_1 = __webpack_require__(1961);
const Utils_js_1 = __webpack_require__(7930);
const CoordsType_js_1 = __webpack_require__(8145);
const Global_js_1 = __importDefault(__webpack_require__(4382));
class Point {
    _x;
    _y;
    _z;
    _xyz;
    _raDeg;
    _decDeg;
    _raRad;
    _decRad;
    _raDecDeg;
    _lonLatDeg;
    constructor(in_options, in_type) {
        this._xyz = [0, 0, 0];
        this._raDecDeg = [0, 0];
        // Prefer config value if present, fallback to 12
        const MAX_DECIMALS = Global_js_1.default.MAX_DECIMALS ?? 12;
        if (in_type === CoordsType_js_1.CoordsType.CARTESIAN) {
            const { x, y, z } = in_options;
            this._x = Number(x.toFixed(MAX_DECIMALS));
            this._y = Number(y.toFixed(MAX_DECIMALS));
            this._z = Number(z.toFixed(MAX_DECIMALS));
            this._xyz = [this._x, this._y, this._z];
            const [ra, dec] = this.computeAstroCoords();
            this._raDeg = Number(ra);
            this._decDeg = Number(dec);
            this._raRad = (this._raDeg * Math.PI) / 180;
            this._decRad = (this._decDeg * Math.PI) / 180;
            this._raDecDeg = [this._raDeg, this._decDeg];
        }
        else if (in_type === CoordsType_js_1.CoordsType.ASTRO) {
            const { raDeg, decDeg } = in_options;
            this._raDeg = Number(raDeg);
            this._decDeg = Number(decDeg);
            this._raDecDeg = [this._raDeg, this._decDeg];
            this._raRad = (this._raDeg * Math.PI) / 180;
            this._decRad = (this._decDeg * Math.PI) / 180;
            const [x, y, z] = this.computeCartesianCoords();
            this._x = Number(x.toFixed(MAX_DECIMALS));
            this._y = Number(y.toFixed(MAX_DECIMALS));
            this._z = Number(z.toFixed(MAX_DECIMALS));
            this._xyz = [this._x, this._y, this._z];
        }
        else if (in_type === CoordsType_js_1.CoordsType.GEOGRAPHIC) {
            const { lonDeg, latDeg } = in_options;
            this._lonLatDeg = [Number(lonDeg), Number(latDeg)];
            this._raDeg = this._lonLatDeg[0];
            this._decDeg = this._lonLatDeg[1];
            this._raDecDeg = [this._raDeg, this._decDeg];
            this._raRad = (this._raDeg * Math.PI) / 180;
            this._decRad = (this._decDeg * Math.PI) / 180;
            const [x, y, z] = this.computeCartesianCoords();
            this._x = Number(x.toFixed(MAX_DECIMALS));
            this._y = Number(y.toFixed(MAX_DECIMALS));
            this._z = Number(z.toFixed(MAX_DECIMALS));
            this._xyz = [this._x, this._y, this._z];
        }
        else if (in_type === CoordsType_js_1.CoordsType.SPHERICAL) {
            // Not implemented in original; keep behavior
            console.log(`${CoordsType_js_1.CoordsType.SPHERICAL} not implemented yet`);
            this._x = 0;
            this._y = 0;
            this._z = 0;
            this._raDeg = 0;
            this._decDeg = 0;
            this._raRad = 0;
            this._decRad = 0;
        }
        else {
            console.error('CoordsType ' + String(in_type) + ' not recognised.');
            // Initialize to zeroed state to keep object consistent
            this._x = 0;
            this._y = 0;
            this._z = 0;
            this._raDeg = 0;
            this._decDeg = 0;
            this._raRad = 0;
            this._decRad = 0;
        }
    }
    computeAstroCoords() {
        const phiThetaDeg = (0, Utils_js_1.cartesianToSpherical)(gl_matrix_1.vec3.fromValues(this._xyz[0], this._xyz[1], this._xyz[2]));
        const rad = (0, Utils_js_1.sphericalToAstroDeg)(phiThetaDeg.phi, phiThetaDeg.theta);
        return [rad.ra, rad.dec];
    }
    computeCartesianCoords() {
        const phiThetaDeg = (0, Utils_js_1.astroDegToSpherical)(this._raDeg, this._decDeg);
        const [x, y, z] = (0, Utils_js_1.sphericalToCartesian)(phiThetaDeg.phi, phiThetaDeg.theta, 1);
        return [x, y, z];
    }
    /**
     * @return {phi, theta} (degrees)
     */
    computeHealpixPhiTheta() {
        return (0, Utils_js_1.astroDegToSpherical)(this._raDeg, this._decDeg);
    }
    /** Scale the vector by a given factor */
    scale(n) {
        return new Point({ x: this.x * n, y: this.y * n, z: this.z * n }, CoordsType_js_1.CoordsType.CARTESIAN);
    }
    dot(v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }
    cross(v) {
        return new Point({
            x: this.y * v.z - v.y * this.z,
            y: this.z * v.x - v.z * this.x,
            z: this.x * v.y - v.x * this.y,
        }, CoordsType_js_1.CoordsType.CARTESIAN);
    }
    norm() {
        const d = 1 / this.length();
        return new Point({ x: this.x * d, y: this.y * d, z: this.z * d }, CoordsType_js_1.CoordsType.CARTESIAN);
    }
    length() {
        return Math.sqrt(this.lengthSquared());
    }
    lengthSquared() {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    }
    subtract(v) {
        return new Point({ x: this.x - v.x, y: this.y - v.y, z: this.z - v.z }, CoordsType_js_1.CoordsType.CARTESIAN);
    }
    add(v) {
        return new Point({ x: this.x + v.x, y: this.y + v.y, z: this.z + v.z }, CoordsType_js_1.CoordsType.CARTESIAN);
    }
    get x() { return this._x; }
    get y() { return this._y; }
    get z() { return this._z; }
    get xyz() { return this._xyz; }
    get raDeg() { return this._raDeg; }
    get decDeg() { return this._decDeg; }
    get raDecDeg() { return this._raDecDeg; }
    get lonDeg() { return this._lonLatDeg?.[0] ?? this._raDeg; }
    get latDeg() { return this._lonLatDeg?.[1] ?? this._decDeg; }
    get lonLatDeg() { return this._lonLatDeg ?? [this._raDeg, this._decDeg]; }
    toADQL() {
        return `${this._raDecDeg[0]},${this._raDecDeg[1]}`;
    }
    toString() {
        return `(raDeg, decDeg) => (${this._raDecDeg[0]},${this._raDecDeg[1]}) (x, y,z) => (${this._xyz[0]},${this._xyz[1]},${this._xyz[2]})`;
    }
}
exports.Point = Point;


/***/ }),

/***/ 6937:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.XYZVisibleTilesManager = void 0;
const XYZRayPickingUtils_js_1 = __importDefault(__webpack_require__(2166));
class XYZVisibleTilesManager {
    _ancestorsMap = new Map();
    _visibleTilesMap = new Map();
    _visibleTiles = [];
    _selection = {
        key: '0:',
        currentZoom: 0,
        visibleTiles: [],
        visibleTilesMap: new Map(),
        ancestorsMap: new Map(),
    };
    get ancestorsMap() {
        return this._ancestorsMap;
    }
    get visibleTiles() {
        return this._visibleTiles;
    }
    get visibleTilesMap() {
        return this._visibleTilesMap;
    }
    get selection() {
        return this._selection;
    }
    computeVisibleTiles(z, xyzModel, webgl, camera, pMatrix, sampleCount = 9, padding = 2) {
        this._visibleTiles = XYZRayPickingUtils_js_1.default.getVisibleTilesFromViewport(z, xyzModel, webgl, camera, pMatrix, sampleCount, padding);
        this._visibleTilesMap = this.buildTileMap(this._visibleTiles);
        this.refreshAncestorsMap(this._visibleTiles);
        this._selection = {
            key: this.buildSelectionKey(z, this._visibleTiles),
            currentZoom: z,
            visibleTiles: this._visibleTiles,
            visibleTilesMap: this._visibleTilesMap,
            ancestorsMap: this._ancestorsMap,
        };
        return this._selection;
    }
    refreshAncestorsMap(visibleTiles) {
        this._ancestorsMap.clear();
        for (const tile of visibleTiles) {
            for (let z = tile.z - 1; z >= 0; z--) {
                const dz = tile.z - z;
                const ancestor = {
                    z,
                    x: tile.x >> dz,
                    y: tile.y >> dz,
                };
                this._ancestorsMap.set(`${ancestor.z}/${ancestor.x}/${ancestor.y}`, ancestor);
            }
        }
    }
    buildTileMap(tiles) {
        const map = new Map();
        for (const tile of tiles) {
            map.set(this.key(tile), tile);
        }
        return map;
    }
    buildSelectionKey(z, tiles) {
        return `${z}:${tiles.map((tile) => `${tile.x}/${tile.y}`).join('|')}`;
    }
    key(tile) {
        return `${tile.z}/${tile.x}/${tile.y}`;
    }
}
exports.XYZVisibleTilesManager = XYZVisibleTilesManager;


/***/ }),

/***/ 7559:
/***/ ((__unused_webpack_module, exports) => {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
class Point2D {
    _x;
    _y;
    constructor(x, y) {
        this._x = x;
        this._y = y;
    }
    get x() {
        return this._x;
    }
    get y() {
        return this._y;
    }
}
exports["default"] = Point2D;


/***/ }),

/***/ 7734:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
/**
 * @author Fabrizio Giordano (Fab)
 */
const gl_matrix_1 = __webpack_require__(1961);
const Utils_js_1 = __webpack_require__(7930);
const Global_js_1 = __importDefault(__webpack_require__(4382));
class Camera {
    insideSphere = false;
    cam_pos = gl_matrix_1.vec3.create(); // camera position
    cam_speed = 1.0;
    vMatrix = gl_matrix_1.mat4.create(); // view matrix
    T = gl_matrix_1.mat4.create(); // translation matrix
    R = gl_matrix_1.mat4.create(); // rotation matrix
    // Optional state used in rotate helpers
    FoV = 180.0;
    previousFoV = 180.0;
    move = gl_matrix_1.vec3.create();
    phi = 0; // accumulated yaw (radians)
    theta = 0; // accumulated pitch (radians)
    rotationSensitivity = 1.0;
    // lock rotation around world axes
    lockRotX = false;
    lockRotY = false;
    lockRotZ = false;
    constructor(in_position, in_sphere) {
        this.init(in_position, in_sphere);
    }
    init(in_position, in_sphere) {
        this.insideSphere = in_sphere;
        this.cam_pos = gl_matrix_1.vec3.clone(in_position);
        this.vMatrix = gl_matrix_1.mat4.create();
        this.T = gl_matrix_1.mat4.create();
        this.R = gl_matrix_1.mat4.create();
        gl_matrix_1.mat4.translate(this.T, this.T, [this.cam_pos[0], this.cam_pos[1], this.cam_pos[2]]);
        // reset helpers
        this.FoV = this.previousFoV = 180.0;
        this.move = gl_matrix_1.vec3.clone([0, 0, 0]);
        const raDeg = 0;
        const decDeg = 0;
        this.goTo(raDeg, decDeg);
    }
    goTo(raDeg, decDeg) {
        this.goToPhiTheta((0, Utils_js_1.astroDegToSpherical)(raDeg, decDeg));
    }
    goToPhiTheta(ptDeg) {
        const xyz = (0, Utils_js_1.sphericalToCartesian)(ptDeg.phi, ptDeg.theta, this.cam_pos[2]);
        const targetDirection = gl_matrix_1.vec3.normalize(gl_matrix_1.vec3.create(), gl_matrix_1.vec3.fromValues(xyz[0], xyz[1], xyz[2]));
        const celestialNorth = gl_matrix_1.vec3.fromValues(0.0, 0.0, 1.0);
        const northProjection = gl_matrix_1.vec3.scale(gl_matrix_1.vec3.create(), targetDirection, gl_matrix_1.vec3.dot(celestialNorth, targetDirection));
        const cameraUp = gl_matrix_1.vec3.subtract(gl_matrix_1.vec3.create(), celestialNorth, northProjection);
        if (gl_matrix_1.vec3.length(cameraUp) < 1e-6) {
            gl_matrix_1.vec3.set(cameraUp, 0.0, 1.0, 0.0);
        }
        else {
            gl_matrix_1.vec3.normalize(cameraUp, cameraUp);
        }
        let cameraMatrix = gl_matrix_1.mat4.create();
        cameraMatrix = gl_matrix_1.mat4.translate(cameraMatrix, cameraMatrix, gl_matrix_1.vec3.fromValues(xyz[0], xyz[1], xyz[2]));
        const focusPoint = [0.0, 0.0, 0.0];
        const cameraPos = [cameraMatrix[12], cameraMatrix[13], cameraMatrix[14]];
        cameraMatrix = gl_matrix_1.mat4.targetTo(cameraMatrix, cameraPos, focusPoint, cameraUp);
        this.R = gl_matrix_1.mat4.clone(cameraMatrix);
        this.R[12] = 0;
        this.R[13] = 0;
        this.R[14] = 0;
        const viewMatrix = gl_matrix_1.mat4.create();
        if (this.cam_pos[2] !== 0) {
            gl_matrix_1.mat4.invert(viewMatrix, cameraMatrix);
        }
        this.vMatrix = viewMatrix;
    }
    toggleInsideSphere() {
        // if (inside !== global.insideSphere) {
        //   global.insideSphere = inside;
        this.insideSphere = Global_js_1.default.insideSphere;
        if (Global_js_1.default.insideSphere) {
            this.cam_pos[0] = 0;
            this.cam_pos[1] = 0;
            this.cam_pos[2] = -0.005;
        }
        else {
            this.cam_pos[2] = 2.0 + this.cam_pos[2];
        }
        gl_matrix_1.mat4.translate(this.T, gl_matrix_1.mat4.create(), this.cam_pos);
        this.refreshViewMatrix();
        // }
    }
    zoom(inertia) {
        this.move = gl_matrix_1.vec3.clone([0, 0, 0]);
        this.move[2] += this.cam_speed * inertia;
        if (Global_js_1.default.insideSphere) {
            if (this.cam_pos[2] + this.move[2] >= -0.005 && inertia > 0) {
                this.cam_pos[2] = -0.005;
                inertia = 0;
            }
            else if (this.cam_pos[2] + this.move[2] <= -0.9885 && inertia < 0) {
                this.cam_pos[2] = -0.9885;
                inertia = 0;
            }
            else {
                this.cam_pos[2] += this.move[2];
            }
        }
        else {
            // Keep zoom responsive near the sphere surface without the abrupt
            // threshold jumps that made the 0.2 -> 0.05 deg range feel sticky.
            const distanceFromSurface = Math.max(this.cam_pos[2] - 1, 1e-6);
            const normalizedDistance = Math.min(1, distanceFromSurface / 0.3);
            const zoomScale = 0.015 + 0.985 * Math.pow(normalizedDistance, 1.2);
            this.move[2] *= zoomScale;
            if (this.cam_pos[2] + this.move[2] <= 1.000001 && inertia < 0) {
                this.cam_pos[2] = 1.000001;
            }
            else {
                this.cam_pos[2] += this.move[2];
            }
        }
        const identity = gl_matrix_1.mat4.create();
        gl_matrix_1.mat4.translate(this.T, identity, this.cam_pos);
        this.refreshViewMatrix();
    }
    /**
     * Move the camera forward/backward along its current viewing direction.
     * Positive distance moves *forward* (toward where the camera is looking),
     * negative distance moves *backward*.
     *
     * This does not enforce inside/outside-sphere bounds; if you want clamping,
     * handle it before calling or we can extend this to mimic `zoom()` bounds.
     */
    moveAlongView(distance) {
        // World-space forward vector: transform camera-space -Z by inverse rotation
        const R_inverse = gl_matrix_1.mat4.create();
        gl_matrix_1.mat4.invert(R_inverse, this.R);
        const forwardCam = gl_matrix_1.vec3.fromValues(0, 0, -1); // camera looks along -Z in its local space
        const fwdWorld = gl_matrix_1.vec3.create();
        gl_matrix_1.vec3.transformMat4(fwdWorld, forwardCam, R_inverse);
        // Normalise to get direction only
        const len = Math.hypot(fwdWorld[0], fwdWorld[1], fwdWorld[2]);
        if (len > 0) {
            fwdWorld[0] /= len;
            fwdWorld[1] /= len;
            fwdWorld[2] /= len;
        }
        // Update camera position
        this.cam_pos[0] += fwdWorld[0] * distance;
        this.cam_pos[1] += fwdWorld[1] * distance;
        this.cam_pos[2] += fwdWorld[2] * distance;
        // Rebuild translation matrix and view matrix
        const identity = gl_matrix_1.mat4.create();
        gl_matrix_1.mat4.translate(this.T, identity, this.cam_pos);
        this.refreshViewMatrix();
    }
    translate(distance) {
        this.cam_pos[2] = distance + 1;
        const identity = gl_matrix_1.mat4.create();
        gl_matrix_1.mat4.translate(this.T, identity, this.cam_pos);
        this.refreshViewMatrix();
    }
    rotateX(sign) {
        if (this.lockRotX)
            return;
        const factorRad = sign * 0.01;
        this.theta += factorRad;
        gl_matrix_1.mat4.rotate(this.R, this.R, factorRad, [1, 0, 0]);
        this.refreshViewMatrix();
    }
    rotateY(sign) {
        if (this.lockRotY)
            return;
        const factorRad = sign * 0.01;
        this.phi += factorRad;
        gl_matrix_1.mat4.rotate(this.R, this.R, factorRad, [0, 1, 0]);
        this.refreshViewMatrix();
    }
    rotateZ(sign) {
        if (this.lockRotZ)
            return;
        const factorRad = sign * 0.01;
        // this.phi += factorRad;
        gl_matrix_1.mat4.rotate(this.R, this.R, factorRad, [0, 0, 1]);
        this.refreshViewMatrix();
    }
    rotateXRadian(radian) {
        if (this.lockRotX)
            return;
        gl_matrix_1.mat4.rotate(this.R, this.R, radian, [1, 0, 0]);
        this.refreshViewMatrix();
    }
    rotateYRadian(radian) {
        if (this.lockRotY)
            return;
        this.phi += radian;
        gl_matrix_1.mat4.rotate(this.R, this.R, radian, [0, 1, 0]);
        this.refreshViewMatrix();
    }
    rotateZRadian(radian) {
        if (this.lockRotZ)
            return;
        gl_matrix_1.mat4.rotate(this.R, this.R, radian, [0, 0, 1]);
        this.refreshViewMatrix();
    }
    rotate(phi, theta) {
        // If Z is locked, completely disable orbit rotation
        if (this.lockRotZ) {
            return;
        }
        const totRot = Math.sqrt(phi * phi + theta * theta);
        if (totRot === 0)
            return;
        const pos = this.getCameraPosition();
        const dist2Center = Math.sqrt(pos[0] * pos[0] + pos[1] * pos[1] + pos[2] * pos[2]);
        const distanceFromSurface = Math.max(dist2Center - 1, 1e-6);
        const normalizedDistance = Math.min(1, distanceFromSurface / 0.45);
        const distanceFactor = 0.02 + 0.98 * Math.pow(normalizedDistance, 1.55);
        // Keep tiny FoV more stable and predictable while preserving responsiveness
        // at medium and wide fields of view.
        const normalizedFoV = Math.min(1, this.FoV / 18);
        const fovFactor = 0.06 + 1.55 * Math.pow(normalizedFoV, 0.52);
        const usedRot = ((totRot * distanceFactor * fovFactor) / 1.9) * this.rotationSensitivity;
        let axisX = theta;
        let axisY = phi;
        const axisLen = Math.sqrt(axisX * axisX + axisY * axisY);
        // If after locking we have no axis left, do nothing
        if (axisLen === 0) {
            return;
        }
        axisX /= axisLen;
        axisY /= axisLen;
        gl_matrix_1.mat4.rotate(this.R, this.R, -usedRot, [axisX, axisY, 0]);
        this.refreshViewMatrix();
    }
    setRotationSensitivity(value) {
        this.rotationSensitivity = Math.min(3, Math.max(0.2, value));
    }
    getRotationSensitivity() {
        return this.rotationSensitivity;
    }
    // rotate(phi: number, theta: number): void {
    //   // totRot is the magnitude of the requested rotation
    //   const totRot = Math.sqrt(phi * phi + theta * theta);
    //   if (totRot === 0) return;
    //   // If both X and Y rotations are locked, nothing to do
    //   if (this.lockRotX && this.lockRotY) {
    //     return;
    //   }
    //   const pos = this.getCameraPosition();
    //   const dist2Center = Math.sqrt(pos[0] * pos[0] + pos[1] * pos[1] + pos[2] * pos[2]);
    //   const usedRot = (totRot * (dist2Center - 1)) / 3.0;
    //   // Build an axis from phi/theta, but zero components that are locked
    //   let axisX = this.lockRotX ? 0 : theta;
    //   let axisY = this.lockRotY ? 0 : phi;
    //   const axisLen = Math.sqrt(axisX * axisX + axisY * axisY);
    //   // If after locking we have no axis left, do nothing
    //   if (axisLen === 0) {
    //     return;
    //   }
    //   axisX /= axisLen;
    //   axisY /= axisLen;
    //   mat4.rotate(this.R, this.R, -usedRot, [axisX, axisY, 0]);
    //   this.refreshViewMatrix();
    // }
    // rotate(phi: number, theta: number): void {
    //   const totRot = Math.sqrt(phi * phi + theta * theta);
    //   if (totRot === 0) return;
    //   const pos = this.getCameraPosition();
    //   const dist2Center = Math.sqrt(pos[0] * pos[0] + pos[1] * pos[1] + pos[2] * pos[2]);
    //   const usedRot = (totRot * (dist2Center - 1)) / 3.0;
    //   mat4.rotate(this.R, this.R, -usedRot, [theta / totRot, phi / totRot, 0]);
    //   this.refreshViewMatrix();
    // }
    refreshViewMatrix() {
        const T_inverse = gl_matrix_1.mat4.create();
        const R_inverse = gl_matrix_1.mat4.create();
        gl_matrix_1.mat4.invert(T_inverse, this.T);
        gl_matrix_1.mat4.invert(R_inverse, this.R);
        gl_matrix_1.mat4.multiply(this.vMatrix, T_inverse, R_inverse);
    }
    refreshFoV(currentFoV) {
        this.previousFoV = this.FoV;
        this.FoV = currentFoV;
    }
    getCameraMatrix() {
        return this.vMatrix;
    }
    getCameraPosition() {
        const inv = gl_matrix_1.mat4.create();
        if (!gl_matrix_1.mat4.invert(inv, this.vMatrix)) {
            // fallback — we already maintain cam_pos
            return [this.cam_pos[0], this.cam_pos[1], this.cam_pos[2]];
        }
        return [inv[12], inv[13], inv[14]];
    }
    setCameraMatrix(viewMatrix) {
        this.vMatrix = viewMatrix;
    }
    setCameraPosition(position) {
        // Update authoritative position
        this.cam_pos = gl_matrix_1.vec3.fromValues(position[0], position[1], position[2]);
        // Rebuild translation matrix from cam_pos
        gl_matrix_1.mat4.translate(this.T, gl_matrix_1.mat4.create(), this.cam_pos);
        // Do NOT touch this.R here (keep orientation)
        // Recompute view: vMatrix = inv(T) * inv(R)
        this.refreshViewMatrix();
    }
    getCameraAngle() {
        const [x, y, z] = this.getCameraPosition();
        const posVec = gl_matrix_1.vec3.fromValues(x, y, z);
        const ptDeg = (0, Utils_js_1.cartesianToSpherical)(posVec);
        // eslint-disable-next-line no-console
        console.log("[Camera::getCameraAngle]", ptDeg);
        return ptDeg;
    }
    /**
     * Lock/unlock rotation around world axes X, Y, Z.
     * Passing `undefined` leaves that axis as-is.
     */
    setRotationLock(options) {
        if (options.x !== undefined)
            this.lockRotX = options.x;
        if (options.y !== undefined)
            this.lockRotY = options.y;
        if (options.z !== undefined)
            this.lockRotZ = options.z;
    }
    /** Convenience helpers */
    clearRotationLock() {
        this.lockRotX = this.lockRotY = this.lockRotZ = false;
    }
    isRotationLockedX() { return this.lockRotX; }
    isRotationLockedY() { return this.lockRotY; }
    isRotationLockedZ() { return this.lockRotZ; }
}
exports["default"] = Camera;


/***/ }),

/***/ 7786:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HiPSShaderProgram = void 0;
// HiPSShaderProgram.ts
const ShaderManager_js_1 = __importDefault(__webpack_require__(5947));
const ColorMaps_js_1 = __webpack_require__(619);
// export default class HiPSShaderProgram {
class HiPSShaderProgram {
    _colorMapBlockIndex = null;
    _runtimeColorMap;
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
    setRuntimeColorMap(colorMap) {
        this._runtimeColorMap = colorMap;
    }
    initShaders() {
        // const gl = global.gl as GL
        const gl = this._webgl;
        const fragmentShaderStr = ShaderManager_js_1.default.hipsNativeFS();
        this._fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(this._fragmentShader, fragmentShaderStr);
        gl.compileShader(this._fragmentShader);
        if (!gl.getShaderParameter(this._fragmentShader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(this._fragmentShader) || 'Fragment shader compile error');
            return;
        }
        const vertexShaderStr = ShaderManager_js_1.default.hipsVS();
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
        const fragmentShaderStr = ShaderManager_js_1.default.hipsGrayscaleFS();
        this.changeFSShader(fragmentShaderStr);
    }
    setNativeShader() {
        // const gl = global.gl as GL
        const gl = this._webgl;
        gl.detachShader(this.shaderProgram, this._fragmentShader);
        const fragmentShaderStr = ShaderManager_js_1.default.hipsNativeFS();
        this.changeFSShader(fragmentShaderStr);
    }
    setColorMapShader() {
        // const gl = global.gl as GL
        const gl = this._webgl;
        // Swap fragment shader
        gl.detachShader(this.shaderProgram, this._fragmentShader);
        const fragmentShaderStr = ShaderManager_js_1.default.hipsColorMapFS();
        this.changeFSShader(fragmentShaderStr);
        // UBO discovery for the "colormap" block
        const blockIndex = gl.getUniformBlockIndex(this.shaderProgram, 'colormap');
        // INVALID_INDEX == 0xFFFFFFFF in WebGL2
        if (blockIndex === gl.INVALID_INDEX) {
            console.warn('HiPSShaderProgram: uniform block "colormap" not found in hipsColorMapFS()');
            this._colorMapBlockIndex = null;
            this._UBO_colorMapBuffer = null;
            return; // do NOT proceed with UBO setup
        }
        this._colorMapBlockIndex = blockIndex;
        // const blockSize = gl.getActiveUniformBlockParameter(
        //   this.shaderProgram as WebGLProgram,
        //   blockIndex,
        //   gl.UNIFORM_BLOCK_DATA_SIZE
        // ) as number
        const uboVariableNames = ['r_palette', 'g_palette', 'b_palette'];
        const uboVariableIndices = gl.getUniformIndices(this.shaderProgram, uboVariableNames);
        const uboVariableOffsets = gl.getActiveUniforms(this.shaderProgram, uboVariableIndices, gl.UNIFORM_OFFSET);
        // Create buffer only once
        if (!this._UBO_colorMapBuffer) {
            this._UBO_colorMapBuffer = gl.createBuffer();
            gl.bindBuffer(gl.UNIFORM_BUFFER, this._UBO_colorMapBuffer);
            // std140 layout: 256 floats each padded to 16 bytes => 4096 bytes per palette, total 12288
            const BYTES = 12288; // 3 * 4096
            gl.bufferData(gl.UNIFORM_BUFFER, BYTES, gl.STATIC_DRAW);
            gl.bindBuffer(gl.UNIFORM_BUFFER, null);
            gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, this._UBO_colorMapBuffer);
        }
        // Store offsets
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
        // NEW
        // if (this.locations.clorMapIdx) {
        gl.uniform1i(this.locations.clorMapIdx, colorMapIdx);
        // }
        // Make sampler explicit: we always use TEXTURE0 in your draw code
        if (this.locations.sampler) {
            gl.uniform1i(this.locations.sampler, 0);
        }
        // END NEW
        this.locations.vertexPositionAttribute = gl.getAttribLocation(this.shaderProgram, this.gl_attributes.vertex_pos);
        this.locations.textureCoordAttribute = gl.getAttribLocation(this.shaderProgram, this.gl_attributes.text_coords);
        if (colorMapIdx >= 2 && this._UBO_colorMapBuffer && this._colorMapBlockIndex !== null) {
            gl.uniformBlockBinding(this.shaderProgram, this._colorMapBlockIndex, 0);
            gl.bindBuffer(gl.UNIFORM_BUFFER, this._UBO_colorMapBuffer);
            let currentColorMap;
            if (colorMapIdx === 2) {
                currentColorMap = {
                    r: ColorMaps_js_1.ColorMaps.planck.r,
                    g: ColorMaps_js_1.ColorMaps.planck.g,
                    b: ColorMaps_js_1.ColorMaps.planck.b,
                };
            }
            else if (colorMapIdx === 3) {
                currentColorMap = {
                    r: ColorMaps_js_1.ColorMaps.cmb.r,
                    g: ColorMaps_js_1.ColorMaps.cmb.g,
                    b: ColorMaps_js_1.ColorMaps.cmb.b,
                };
            }
            else if (colorMapIdx === 4) {
                currentColorMap = {
                    r: ColorMaps_js_1.ColorMaps.rainbow.r,
                    g: ColorMaps_js_1.ColorMaps.rainbow.g,
                    b: ColorMaps_js_1.ColorMaps.rainbow.b,
                };
            }
            else if (colorMapIdx === 5) {
                currentColorMap = {
                    r: ColorMaps_js_1.ColorMaps.eosb.r,
                    g: ColorMaps_js_1.ColorMaps.eosb.g,
                    b: ColorMaps_js_1.ColorMaps.eosb.b,
                };
            }
            else if (colorMapIdx === 6) {
                currentColorMap = {
                    r: ColorMaps_js_1.ColorMaps.cubehelix.r,
                    g: ColorMaps_js_1.ColorMaps.cubehelix.g,
                    b: ColorMaps_js_1.ColorMaps.cubehelix.b,
                };
            }
            else if (colorMapIdx === 7) {
                currentColorMap = {
                    r: ColorMaps_js_1.ColorMaps.hot.r,
                    g: ColorMaps_js_1.ColorMaps.hot.g,
                    b: ColorMaps_js_1.ColorMaps.hot.b,
                };
            }
            else if (colorMapIdx === 8) {
                currentColorMap = {
                    r: ColorMaps_js_1.ColorMaps.gray.r,
                    g: ColorMaps_js_1.ColorMaps.gray.g,
                    b: ColorMaps_js_1.ColorMaps.gray.b,
                };
            }
            if (!currentColorMap) {
                currentColorMap = this._runtimeColorMap;
            }
            if (currentColorMap) {
                const info = this._UBO_colorMapVariableInfo;
                gl.bufferSubData(gl.UNIFORM_BUFFER, info.r_palette.offset, currentColorMap.r, 0);
                gl.bufferSubData(gl.UNIFORM_BUFFER, info.g_palette.offset, currentColorMap.g, 0);
                gl.bufferSubData(gl.UNIFORM_BUFFER, info.b_palette.offset, currentColorMap.b, 0);
            }
            gl.bindBuffer(gl.UNIFORM_BUFFER, null);
        }
        gl.uniformMatrix4fv(this.locations.mMatrix, false, mMatrix);
        gl.uniformMatrix4fv(this.locations.pMatrix, false, pMatrix);
        gl.uniformMatrix4fv(this.locations.vMatrix, false, vMatrix);
    }
}
exports.HiPSShaderProgram = HiPSShaderProgram;


/***/ }),

/***/ 7930:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.cartesianToSpherical = cartesianToSpherical;
exports.colorHex2RGB = colorHex2RGB;
exports.degToRad = degToRad;
exports.radToDeg = radToDeg;
exports.sphericalToAstroDeg = sphericalToAstroDeg;
exports.sphericalToCartesian = sphericalToCartesian;
exports.astroDegToSpherical = astroDegToSpherical;
exports.raDegToHMS = raDegToHMS;
exports.decDegToDMS = decDegToDMS;
/**
 * @author Fabrizio Giordano (Fab)
 */
const gl_matrix_1 = __webpack_require__(1961);
// results in degrees
function cartesianToSpherical(xyz) {
    const dotXYZ = gl_matrix_1.vec3.dot(xyz, xyz);
    const r = Math.sqrt(dotXYZ);
    let theta = Math.acos(xyz[2] / r);
    theta = radToDeg(theta);
    // NB: in atan(y/x) is written with params switched atan2(x, y)
    let phi = Math.atan2(xyz[1], xyz[0]);
    phi = radToDeg(phi);
    if (phi < 0) {
        phi += 360;
    }
    return { phi, theta };
}
function colorHex2RGB(hexColor) {
    const hex1 = hexColor.substring(1, 3);
    const hex2 = hexColor.substring(3, 5);
    const hex3 = hexColor.substring(5, 7);
    const dec1 = parseInt(hex1, 16);
    const dec2 = parseInt(hex2, 16);
    const dec3 = parseInt(hex3, 16);
    const rgb1 = (dec1 / 255).toFixed(2);
    const rgb2 = (dec2 / 255).toFixed(2);
    const rgb3 = (dec3 / 255).toFixed(2);
    return [parseFloat(rgb1), parseFloat(rgb2), parseFloat(rgb3)];
}
function degToRad(degrees) {
    return (degrees / 180) * Math.PI;
}
function radToDeg(radians) {
    return (radians * 180) / Math.PI;
}
function sphericalToAstroDeg(phiDeg, thetaDeg) {
    let raDeg = phiDeg;
    if (raDeg < 0) {
        raDeg += 360;
    }
    const decDeg = 90 - thetaDeg;
    return { ra: raDeg, dec: decDeg };
}
function sphericalToCartesian(phiDeg, thetaDeg, r = 1) {
    const x = r * Math.sin(degToRad(thetaDeg)) * Math.cos(degToRad(phiDeg));
    const y = r * Math.sin(degToRad(thetaDeg)) * Math.sin(degToRad(phiDeg));
    const z = r * Math.cos(degToRad(thetaDeg));
    return [x, y, z];
}
function astroDegToSpherical(raDeg, decDeg) {
    let phiDeg = raDeg;
    if (phiDeg < 0) {
        phiDeg += 360;
    }
    const thetaDeg = 90 - decDeg;
    return { phi: phiDeg, theta: thetaDeg };
}
function raDegToHMS(raDeg) {
    const h = Math.floor(raDeg / 15);
    const m = Math.floor((raDeg / 15 - h) * 60);
    const s = (raDeg / 15 - h - m / 60) * 3600;
    return { h, m, s };
}
function decDegToDMS(decDeg) {
    let sign = 1;
    if (decDeg < 0) {
        sign = -1;
    }
    const decDegAbs = Math.abs(decDeg);
    let d = Math.trunc(decDegAbs);
    const m = Math.trunc((decDegAbs - d) * 60);
    const s = (decDegAbs - d - m / 60) * 3600;
    d = d * sign;
    return { d, m, s };
}


/***/ }),

/***/ 8083:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FoVUtils = void 0;
/**
 * @author Fabrizio Giordano (Fab)
 */
const Point_js_1 = __webpack_require__(6553);
const RayPickingUtils_js_1 = __importDefault(__webpack_require__(4639));
const CoordsType_js_1 = __webpack_require__(8145);
const gl_matrix_1 = __webpack_require__(1961);
class FoVUtils {
    /**
     * Return the minimum FoV value between `_fovY_deg` and `_fovX_deg`.
     * (Kept here for parity; this class doesn’t maintain those fields.)
     */
    getMinFoV() {
        return this._fovY_deg <= this._fovX_deg ? this._fovY_deg : this._fovX_deg;
    }
    /**
     * Compute the FoV polygon as a list of Points (clockwise).
     * Uses ray picking + frustum planes against a unit sphere.
     */
    static getFoVPolygon(
    // _pMatrix: ReadonlyMat4 | null,
    camera, canvas, model, healpixGrid, webgl, pMatrix) {
        // const pMatrix = (computePerspectiveMatrixSingleton.pMatrix ??
        //   _pMatrix) as ReadonlyMat4;
        // const pMatrix = computePerspectiveMatrixSingleton.pMatrix as ReadonlyMat4 
        const vMatrix = camera.getCameraMatrix();
        const mMatrix = model.getModelMatrix();
        const canvasWidth = canvas.clientWidth;
        const canvasHeight = canvas.clientHeight;
        let points = [];
        // First check: does the sphere cover the whole screen?
        const intersectionWithModel = RayPickingUtils_js_1.default.getIntersectionPointWithSingleModel(0, 0, healpixGrid, webgl, camera, pMatrix);
        if (intersectionWithModel.length > 0) {
            // Fully covered → grab corners + midpoints (CASE C)
            const cornersPoints = FoVUtils.getScreenCornersIntersection(pMatrix, camera, canvas, healpixGrid, webgl);
            points = cornersPoints;
        }
        else {
            // Partial coverage: build frustum planes
            let M = gl_matrix_1.mat4.create();
            M = gl_matrix_1.mat4.multiply(M, vMatrix, mMatrix);
            M = gl_matrix_1.mat4.multiply(M, pMatrix, M);
            const topPlane = [M[3] - M[1], M[7] - M[5], M[11] - M[9], M[15] - M[13]]; // m41-m21, ...
            const bottomPlane = [M[3] + M[1], M[7] + M[5], M[11] + M[9], M[15] + M[13]];
            const rightPlane = [M[3] - M[0], M[7] - M[4], M[11] - M[8], M[15] - M[12]];
            const leftPlane = [M[3] + M[0], M[7] + M[4], M[11] + M[8], M[15] + M[12]];
            const intersectionTopMiddle = RayPickingUtils_js_1.default.getIntersectionPointWithSingleModel(canvasWidth / 2, 0, healpixGrid, webgl, camera, pMatrix);
            const intersectionRightMiddle = RayPickingUtils_js_1.default.getIntersectionPointWithSingleModel(canvasWidth, canvasHeight / 2, healpixGrid, webgl, camera, pMatrix);
            // CASE A: zoomed out, hemisphere fully visible
            if (intersectionTopMiddle.length === 0 &&
                intersectionRightMiddle.length === 0) {
                const topPoints = FoVUtils.getNearestSpherePoint(topPlane);
                const bottomPoints = FoVUtils.getNearestSpherePoint(bottomPlane);
                const leftPoints = FoVUtils.getNearestSpherePoint(leftPlane);
                const rightPoints = FoVUtils.getNearestSpherePoint(rightPlane);
                const middleLeftTop = FoVUtils.computeMiddlePoint(leftPoints[0], topPoints[0])[0];
                const middleTopRight = FoVUtils.computeMiddlePoint(topPoints[0], rightPoints[0])[0];
                const middleRightBottom = FoVUtils.computeMiddlePoint(rightPoints[0], bottomPoints[0])[0];
                const middleBottomLeft = FoVUtils.computeMiddlePoint(bottomPoints[0], leftPoints[0])[0];
                points.push(topPoints[0], middleTopRight, rightPoints[0], middleRightBottom, bottomPoints[0], middleBottomLeft, leftPoints[0], middleLeftTop);
            }
            // CASE E: no intersection on top/bottom planes
            else if (intersectionTopMiddle.length === 0) {
                const topPoints = FoVUtils.getNearestSpherePoint(topPlane);
                const bottomPoints = FoVUtils.getNearestSpherePoint(bottomPlane);
                const leftPoints = FoVUtils.getFrustumIntersectionWithSphere(M, leftPlane, bottomPlane, topPlane);
                const rightPoints = FoVUtils.getFrustumIntersectionWithSphere(M, rightPlane, topPlane, bottomPlane);
                const middleLeftTop = FoVUtils.computeMiddlePoint(leftPoints[1], topPoints[0])[0];
                const middleTopRight = FoVUtils.computeMiddlePoint(topPoints[0], rightPoints[0])[0];
                const middleRightBottom = FoVUtils.computeMiddlePoint(rightPoints[1], bottomPoints[0])[0];
                const middleBottomLeft = FoVUtils.computeMiddlePoint(bottomPoints[0], leftPoints[0])[0];
                points.push(topPoints[0], middleTopRight, rightPoints[0], rightPoints[1], middleRightBottom, bottomPoints[0], middleBottomLeft, leftPoints[0], leftPoints[1], middleLeftTop);
            }
            // CASE D: no intersection on right/left planes
            else if (intersectionRightMiddle.length === 0) {
                const topPoints = FoVUtils.getFrustumIntersectionWithSphere(M, topPlane, leftPlane, rightPlane);
                const bottomPoints = FoVUtils.getFrustumIntersectionWithSphere(M, bottomPlane, rightPlane, leftPlane);
                const leftPoints = FoVUtils.getNearestSpherePoint(leftPlane);
                const rightPoints = FoVUtils.getNearestSpherePoint(rightPlane);
                const middleLeftTop = FoVUtils.computeMiddlePoint(leftPoints[0], topPoints[0])[0];
                const middleTopRight = FoVUtils.computeMiddlePoint(topPoints[1], rightPoints[0])[0];
                const middleRightBottom = FoVUtils.computeMiddlePoint(rightPoints[0], bottomPoints[0])[0];
                const middleBottomLeft = FoVUtils.computeMiddlePoint(bottomPoints[1], leftPoints[0])[0];
                points.push(topPoints[0], topPoints[1], middleTopRight, rightPoints[0], middleRightBottom, bottomPoints[0], bottomPoints[1], middleBottomLeft, leftPoints[0], middleLeftTop);
            }
            // CASE B: all frustum planes intersect
            else {
                const topPoints = FoVUtils.getFrustumIntersectionWithSphere(M, topPlane, leftPlane, rightPlane);
                const bottomPoints = FoVUtils.getFrustumIntersectionWithSphere(M, bottomPlane, rightPlane, leftPlane);
                const leftPoints = FoVUtils.getFrustumIntersectionWithSphere(M, leftPlane, bottomPlane, topPlane);
                const rightPoints = FoVUtils.getFrustumIntersectionWithSphere(M, rightPlane, topPlane, bottomPlane);
                points.push(topPoints[0], topPoints[1], rightPoints[0], rightPoints[1], bottomPoints[0], bottomPoints[1], leftPoints[0], leftPoints[1]);
            }
        }
        return points;
    }
    /**
     * Ray pick against 8 key screen positions (corners + midpoints).
     * Returns Points in clockwise order starting from top-left.
     */
    static getScreenCornersIntersection(pMatrix, camera, canvas, healpixGrid, webgl) {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        const topLeft = RayPickingUtils_js_1.default.getIntersectionPointWithSingleModel(0, 0, healpixGrid, webgl, camera, pMatrix);
        const middleTop = RayPickingUtils_js_1.default.getIntersectionPointWithSingleModel(w / 2, 0, healpixGrid, webgl, camera, pMatrix);
        const topRight = RayPickingUtils_js_1.default.getIntersectionPointWithSingleModel(w, 0, healpixGrid, webgl, camera, pMatrix);
        const middleRight = RayPickingUtils_js_1.default.getIntersectionPointWithSingleModel(w, h / 2, healpixGrid, webgl, camera, pMatrix);
        const bottomRight = RayPickingUtils_js_1.default.getIntersectionPointWithSingleModel(w, h, healpixGrid, webgl, camera, pMatrix);
        const middleBottom = RayPickingUtils_js_1.default.getIntersectionPointWithSingleModel(w / 2, h, healpixGrid, webgl, camera, pMatrix);
        const bottomLeft = RayPickingUtils_js_1.default.getIntersectionPointWithSingleModel(0, h, healpixGrid, webgl, camera, pMatrix);
        const middleLeft = RayPickingUtils_js_1.default.getIntersectionPointWithSingleModel(0, h / 2, healpixGrid, webgl, camera, pMatrix);
        const out = [];
        const pushIf = (ip) => {
            if (ip.length > 0) {
                out.push(new Point_js_1.Point({ x: ip[0], y: ip[1], z: ip[2] }, CoordsType_js_1.CoordsType.CARTESIAN));
            }
        };
        pushIf(topLeft);
        pushIf(middleTop);
        pushIf(topRight);
        pushIf(middleRight);
        pushIf(bottomRight);
        pushIf(middleBottom);
        pushIf(bottomLeft);
        pushIf(middleLeft);
        return out;
    }
    /** Returns the center point (in J2000) of the current view as a `Point`. */
    static getCenterJ2000(canvas, healpixGrid, webgl, camera, pMatrix) {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        const center = RayPickingUtils_js_1.default.getIntersectionPointWithSingleModel(w / 2, h / 2, healpixGrid, webgl, camera, pMatrix);
        if (center.length <= 0)
            throw Error(`Central point is null`);
        return new Point_js_1.Point({ x: center[0], y: center[1], z: center[2] }, CoordsType_js_1.CoordsType.CARTESIAN);
    }
    /** Middle point on the unit sphere along the arc between two 3D points. */
    static computeMiddlePoint(p1, p2) {
        // midpoint of segment
        const xm = (p1.x + p2.x) / 2;
        const ym = (p1.y + p2.y) / 2;
        const zm = (p1.z + p2.z) / 2;
        // project the midpoint back to unit sphere
        const len = Math.hypot(xm, ym, zm) || 1;
        const x = xm / len;
        const y = ym / len;
        const z = zm / len;
        return [new Point_js_1.Point({ x, y, z }, CoordsType_js_1.CoordsType.CARTESIAN)];
    }
    /**
     * Nearest intersection point between a frustum plane and the unit sphere,
     * using the plane normal.
     */
    static getNearestSpherePoint(plane) {
        const [A, B, C, D] = plane;
        const R = 1;
        const invLen = 1 / Math.sqrt(A * A + B * B + C * C);
        const t1 = R * invLen;
        const t2 = -R * invLen;
        const P1 = [A * t1, B * t1, C * t1];
        const P2 = [A * t2, B * t2, C * t2];
        const den = Math.sqrt(A * A + B * B + C * C) || 1;
        const dist1 = Math.abs(A * P1[0] + B * P1[1] + C * P1[2] + D) / den;
        const dist2 = Math.abs(A * P2[0] + B * P2[1] + C * P2[2] + D) / den;
        const P = dist1 <= dist2 ? P1 : P2;
        return [new Point_js_1.Point({ x: P[0], y: P[1], z: P[2] }, CoordsType_js_1.CoordsType.CARTESIAN)];
    }
    /**
     * Intersections between a frustum plane and the unit sphere,
     * computed via two perpendicular planes.
     * Returns two points (first from `plane4Circle_1`, second from `plane4Circle_2`).
     */
    static getFrustumIntersectionWithSphere(_M, plane4Sphere, plane4Circle_1, plane4Circle_2) {
        const [A0, B0, C0, D0] = plane4Sphere;
        // center of the circle (projection of sphere center onto plane)
        const denom0 = (A0 * A0 + B0 * B0 + C0 * C0) || 1;
        const x_c = -(A0 * D0) / denom0;
        const y_c = -(B0 * D0) / denom0;
        const z_c = -(C0 * D0) / denom0;
        const d = Math.abs(D0) / Math.sqrt(denom0); // distance from sphere center (0,0,0)
        const R = 1;
        const out = [];
        if (R > d) {
            const r = Math.sqrt(R * R - d * d);
            const pick = (plane) => {
                const [A, B, C, D] = plane;
                const invLen = 1 / Math.sqrt(A * A + B * B + C * C);
                const t1 = r * invLen;
                const t2 = -r * invLen;
                const P1 = [x_c + A * t1, y_c + B * t1, z_c + C * t1];
                const P2 = [x_c + A * t2, y_c + B * t2, z_c + C * t2];
                const den = Math.sqrt(A * A + B * B + C * C) || 1;
                const dist1 = Math.abs(A * P1[0] + B * P1[1] + C * P1[2] + D) / den;
                const dist2 = Math.abs(A * P2[0] + B * P2[1] + C * P2[2] + D) / den;
                return dist1 <= dist2 ? P1 : P2;
            };
            const P_intersection_1 = pick(plane4Circle_1);
            const P_intersection_2 = pick(plane4Circle_2);
            out.push(new Point_js_1.Point({ x: P_intersection_1[0], y: P_intersection_1[1], z: P_intersection_1[2] }, CoordsType_js_1.CoordsType.CARTESIAN), new Point_js_1.Point({ x: P_intersection_2[0], y: P_intersection_2[1], z: P_intersection_2[2] }, CoordsType_js_1.CoordsType.CARTESIAN));
        }
        else if (R === d) {
            // Tangent: both intersections collapse to the circle center on the plane
            out.push(new Point_js_1.Point({ x: x_c, y: y_c, z: z_c }, CoordsType_js_1.CoordsType.CARTESIAN), new Point_js_1.Point({ x: x_c, y: y_c, z: z_c }, CoordsType_js_1.CoordsType.CARTESIAN));
        }
        else {
            // No intersection; return empty to avoid pushing undefined values
            // console.log('Frustum plane not intersecting the sphere');
        }
        return out;
    }
    /** Build ADQL string from an array of Points (ra,dec pairs). */
    static getAstroFoVPolygon(points) {
        return points.map(p => p.toADQL()).join(',');
    }
}
exports.FoVUtils = FoVUtils;


/***/ }),

/***/ 8124:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LatLonGrid = void 0;
/* eslint-disable @typescript-eslint/no-non-null-assertion */
const gl_matrix_1 = __webpack_require__(1961);
const AbstractSkyEntity_js_1 = __webpack_require__(4735);
const XYZFoVHelper_js_1 = __webpack_require__(8284);
const GridShaderManager_js_1 = __importDefault(__webpack_require__(4707));
const Utils_js_1 = __webpack_require__(7930);
const SphereFoV_js_1 = __webpack_require__(5803);
const Global_js_1 = __importDefault(__webpack_require__(4382));
const GridTextHelper_js_1 = __importDefault(__webpack_require__(5361));
class LatLonGrid extends AbstractSkyEntity_js_1.AbstractSkyEntity {
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
    gridText = new GridTextHelper_js_1.default('lonlat');
    constructor(radius, position, xrad, yrad, name, webgl) {
        super(radius, position, xrad, yrad, name, webgl);
        this._fovObj = new SphereFoV_js_1.SphereFoV(webgl);
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
        const fsSource = GridShaderManager_js_1.default.healpixGridFS();
        this._fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(this._fragmentShader, fsSource);
        gl.compileShader(this._fragmentShader);
        if (!gl.getShaderParameter(this._fragmentShader, gl.COMPILE_STATUS)) {
            const log = gl.getShaderInfoLog(this._fragmentShader) || 'Unknown fragment shader error';
            console.error(log);
            alert(log);
            return;
        }
        const vsSource = GridShaderManager_js_1.default.healpixGridVS();
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
        const steps = XYZFoVHelper_js_1.xyzFovHelper.getLonLatSteps(fovDeg, coarse);
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
        const lonRad = (0, Utils_js_1.degToRad)(lonDeg);
        const latRad = (0, Utils_js_1.degToRad)(latDeg);
        const cosLat = Math.cos(latRad);
        return [
            cosLat * Math.cos(lonRad),
            cosLat * Math.sin(lonRad),
            Math.sin(latRad),
        ];
    }
    refresh(fovDeg, input) {
        const coarse = !!input.cameraMoving;
        const steps = XYZFoVHelper_js_1.xyzFovHelper.getLonLatSteps(fovDeg, coarse);
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
        this._fovObj.getFoV(Global_js_1.default.insideSphere, this, input.camera, input.pMatrix);
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
        const mvMatrix = gl_matrix_1.mat4.create();
        gl_matrix_1.mat4.multiply(mvMatrix, vMatrix, mMatrix);
        const uMVMatrixLoc = gl.getUniformLocation(this._shaderProgram, 'uMVMatrix');
        const uPMatrixLoc = gl.getUniformLocation(this._shaderProgram, 'uPMatrix');
        const uColor = gl.getUniformLocation(this._shaderProgram, 'u_fragcolor');
        this._attribLocations.position = gl.getAttribLocation(this._shaderProgram, 'aCatPosition');
        if (uMVMatrixLoc)
            gl.uniformMatrix4fv(uMVMatrixLoc, false, mvMatrix);
        if (uPMatrixLoc)
            gl.uniformMatrix4fv(uPMatrixLoc, false, pMatrix);
        if (uColor) {
            const rgb = (0, Utils_js_1.colorHex2RGB)(this.defaultColor);
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
        const mvMatrix = gl_matrix_1.mat4.create();
        const mvpMatrix = gl_matrix_1.mat4.create();
        gl_matrix_1.mat4.multiply(mvMatrix, vMatrix, mMatrix);
        gl_matrix_1.mat4.multiply(mvpMatrix, pMatrix, mvMatrix);
        const clipspace = gl_matrix_1.vec4.fromValues(point[0], point[1], point[2], 1);
        gl_matrix_1.vec4.transformMat4(clipspace, clipspace, mvpMatrix);
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
exports.LatLonGrid = LatLonGrid;


/***/ }),

/***/ 8145:
/***/ ((__unused_webpack_module, exports) => {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CoordsType = void 0;
/**
 * Enum for coordinate types.
 * @author Fabrizio Giordano (Fab77)
 */
var CoordsType;
(function (CoordsType) {
    CoordsType["CARTESIAN"] = "cartesian";
    CoordsType["SPHERICAL"] = "spherical";
    CoordsType["ASTRO"] = "astro";
    CoordsType["GEOGRAPHIC"] = "geographic";
})(CoordsType || (exports.CoordsType = CoordsType = {}));
// export default CoordsType;


/***/ }),

/***/ 8256:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
// Tile.ts
const Global_js_1 = __importDefault(__webpack_require__(4382));
const FoVHelper_js_1 = __webpack_require__(229);
// ------------------------------------------------------------------------
class Tile {
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
    isLoading() {
        return !this._ready && !this._abort;
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
        const reforder = FoVHelper_js_1.fovHelper.getRefOrder(this._order);
        const orighealpix = Global_js_1.default.getHealpix(this._order);
        const origxyf = orighealpix.nest2xyf(this._tileno);
        const orderjump = reforder - this._order;
        const dxmin = origxyf.ix << orderjump;
        const dxmax = (origxyf.ix << orderjump) + (1 << orderjump);
        const dymin = origxyf.iy << orderjump;
        const dymax = (origxyf.iy << orderjump) + (1 << orderjump);
        const healpix = Global_js_1.default.getHealpix(reforder);
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
exports["default"] = Tile;


/***/ }),

/***/ 8284:
/***/ ((__unused_webpack_module, exports) => {

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
// FoVHelper.ts

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.xyzFovHelper = void 0;
class XYZFoVHelper {
    static LEVEL_HYSTERESIS = 0.12;
    static ZOOM_MIN_FOV = {
        2: 179,
        3: 90,
        4: 30,
        5: 20,
        6: 6,
        7: 3.2,
        8: 1.6,
        9: 0.85,
        10: 0.42,
        11: 0.21,
        12: 0.12,
        13: 0.06,
        14: 0.015,
        15: 0,
    };
    getZoom(fov, currentZoom) {
        const rawZoom = this.getRawZoom(fov);
        if (currentZoom === undefined || currentZoom === rawZoom)
            return rawZoom;
        if (rawZoom > currentZoom) {
            const boundary = XYZFoVHelper.ZOOM_MIN_FOV[currentZoom];
            if (boundary > 0 && fov > boundary * (1 - XYZFoVHelper.LEVEL_HYSTERESIS))
                return currentZoom;
        }
        else {
            const boundary = XYZFoVHelper.ZOOM_MIN_FOV[rawZoom];
            if (boundary > 0 && fov < boundary * (1 + XYZFoVHelper.LEVEL_HYSTERESIS))
                return currentZoom;
        }
        return rawZoom;
    }
    getRawZoom(fov) {
        if (fov >= 179)
            return 2;
        if (fov >= 90)
            return 3;
        if (fov >= 30)
            return 4;
        if (fov >= 20)
            return 5;
        if (fov >= 6)
            return 6;
        if (fov >= 3.2)
            return 7;
        if (fov >= 1.6)
            return 8;
        if (fov >= 0.85)
            return 9;
        if (fov >= 0.42)
            return 10;
        if (fov >= 0.21)
            return 11;
        if (fov >= 0.12)
            return 12;
        if (fov >= 0.06)
            return 13;
        if (fov >= 0.015)
            return 14;
        return 15;
    }
    // used in grid drawing
    getLonLatSteps(fov, coarse = false) {
        let lonStep;
        let latStep;
        if (coarse && fov < 0.21) {
            lonStep = 10;
            latStep = 10;
        }
        else if (fov >= 179) {
            lonStep = 10;
            latStep = 10;
        }
        else if (fov >= 25) {
            lonStep = 9;
            latStep = 9;
        }
        else if (fov >= 12.5) {
            lonStep = 8;
            latStep = 8;
        }
        else if (fov >= 6) {
            lonStep = 6;
            latStep = 6;
        }
        else if (fov >= 3.2) {
            lonStep = 5;
            latStep = 5;
        }
        else if (fov >= 1.6) {
            lonStep = 4;
            latStep = 4;
        }
        else if (fov >= 0.85) {
            lonStep = 3;
            latStep = 3;
        }
        else if (fov >= 0.42) {
            lonStep = 2;
            latStep = 2;
        }
        else if (fov >= 0.21) {
            lonStep = 1;
            latStep = 1;
        }
        else if (fov >= 0.12) {
            lonStep = 0.5;
            latStep = 0.5;
        }
        else if (fov >= 0.06) {
            lonStep = 0.25;
            latStep = 0.25;
        }
        else {
            lonStep = 10;
            latStep = 10;
        }
        return { lonStep, latStep };
    }
}
exports.xyzFovHelper = new XYZFoVHelper();
exports["default"] = XYZFoVHelper;


/***/ }),

/***/ 8755:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
const CoordsType_js_1 = __webpack_require__(8145);
const Point_js_1 = __webpack_require__(6553);
class GeoJSONParser {
    static isGeoJSON(value) {
        if (!value || typeof value !== 'object')
            return false;
        const type = value.type;
        return type === 'FeatureCollection'
            || type === 'Feature'
            || type === 'Polygon'
            || type === 'MultiPolygon'
            || type === 'GeometryCollection';
    }
    static parseGeoJSON(value) {
        if (!value || typeof value !== 'object') {
            throw new Error('GeoJSON root must be an object');
        }
        const obj = value;
        if (obj.type === 'FeatureCollection') {
            if (!Array.isArray(obj.features))
                throw new Error('GeoJSON FeatureCollection has no features array');
            return obj.features.flatMap((feature) => GeoJSONParser.parseFeature(feature));
        }
        if (obj.type === 'Feature')
            return GeoJSONParser.parseFeature(obj);
        if (obj.type === 'Polygon' || obj.type === 'MultiPolygon' || obj.type === 'GeometryCollection') {
            return GeoJSONParser.parseGeometry(obj, {});
        }
        throw new Error(`Unsupported GeoJSON type: ${obj.type ?? 'unknown'}`);
    }
    static parseFeature(value) {
        if (!value || typeof value !== 'object')
            throw new Error('GeoJSON feature must be an object');
        const feature = value;
        if (feature.type !== 'Feature')
            throw new Error('GeoJSON feature has invalid type');
        if (!feature.geometry)
            return [];
        return GeoJSONParser.parseGeometry(feature.geometry, feature.properties ?? {}, feature.id);
    }
    static parseGeometry(geometry, properties, id) {
        if (geometry.type === 'Polygon') {
            return [{
                    id,
                    geometryType: 'Polygon',
                    properties,
                    polygons: GeoJSONParser.parsePolygonCoordinates(geometry.coordinates),
                }];
        }
        if (geometry.type === 'MultiPolygon') {
            return [{
                    id,
                    geometryType: 'MultiPolygon',
                    properties,
                    polygons: GeoJSONParser.parseMultiPolygonCoordinates(geometry.coordinates),
                }];
        }
        if (geometry.type === 'GeometryCollection') {
            if (!Array.isArray(geometry.geometries))
                return [];
            return geometry.geometries.flatMap((child) => GeoJSONParser.parseGeometry(child, properties, id));
        }
        return [];
    }
    static parseMultiPolygonCoordinates(coordinates) {
        if (!Array.isArray(coordinates))
            throw new Error('GeoJSON MultiPolygon coordinates must be an array');
        return coordinates.flatMap((polygonCoordinates) => GeoJSONParser.parsePolygonCoordinates(polygonCoordinates));
    }
    static parsePolygonCoordinates(coordinates) {
        if (!Array.isArray(coordinates))
            throw new Error('GeoJSON Polygon coordinates must be an array');
        return coordinates
            .map((ring) => GeoJSONParser.parseLinearRing(ring))
            .filter((ring) => ring.length >= 3);
    }
    static parseLinearRing(ring) {
        if (!Array.isArray(ring))
            throw new Error('GeoJSON linear ring must be an array');
        const points = ring.map((position) => GeoJSONParser.parsePosition(position));
        if (points.length > 1) {
            const first = points[0];
            const last = points[points.length - 1];
            if (first.lonDeg === last.lonDeg && first.latDeg === last.latDeg)
                points.pop();
        }
        return points;
    }
    static parsePosition(position) {
        if (!Array.isArray(position) || position.length < 2) {
            throw new Error('GeoJSON position must be [longitude, latitude]');
        }
        const [lonDeg, latDeg] = position;
        if (!Number.isFinite(lonDeg) || !Number.isFinite(latDeg)) {
            throw new Error('GeoJSON position contains non-finite longitude/latitude');
        }
        return new Point_js_1.Point({ lonDeg, latDeg }, CoordsType_js_1.CoordsType.GEOGRAPHIC);
    }
}
exports["default"] = GeoJSONParser;


/***/ }),

/***/ 8819:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.XYZMeshBuilder = void 0;
const Utils_js_1 = __webpack_require__(7930);
const MAX_MERCATOR_LAT = 85.0511287798066;
function mercatorYToLatDeg(yNormalized) {
    const mercator = Math.PI * (1 - 2 * yNormalized);
    return (Math.atan(Math.sinh(mercator)) * 180) / Math.PI;
}
function wrapLonToPhi(lonDeg) {
    return lonDeg < 0 ? lonDeg + 360 : lonDeg;
}
class XYZMeshBuilder {
    buildTileMesh(tile, segmentsPerSide = 16) {
        const segments = Math.max(1, Math.floor(segmentsPerSide));
        const gridSize = segments + 1;
        const vertexCount = gridSize * gridSize;
        const positions = new Float32Array(vertexCount * 3);
        const uvs = new Float32Array(vertexCount * 2);
        const tileCount = 2 ** tile.z;
        let p = 0;
        let uv = 0;
        for (let row = 0; row <= segments; row++) {
            const v = row / segments;
            const yNormalized = (tile.y + v) / tileCount;
            const latDeg = Math.max(-MAX_MERCATOR_LAT, Math.min(MAX_MERCATOR_LAT, mercatorYToLatDeg(yNormalized)));
            const thetaDeg = 90 - latDeg;
            for (let col = 0; col <= segments; col++) {
                const u = col / segments;
                const xNormalized = (tile.x + u) / tileCount;
                const lonDeg = xNormalized * 360 - 180;
                const phiDeg = wrapLonToPhi(lonDeg);
                const [x, y, z] = (0, Utils_js_1.sphericalToCartesian)(phiDeg, thetaDeg, 1);
                positions[p++] = x;
                positions[p++] = y;
                positions[p++] = z;
                uvs[uv++] = u;
                uvs[uv++] = 1 - v;
            }
        }
        const rawIndices = new Uint32Array(segments * segments * 2 * 3);
        let i = 0;
        for (let row = 0; row < segments; row++) {
            for (let col = 0; col < segments; col++) {
                const topLeft = row * gridSize + col;
                const topRight = topLeft + 1;
                const bottomLeft = topLeft + gridSize;
                const bottomRight = bottomLeft + 1;
                rawIndices[i++] = topLeft;
                rawIndices[i++] = bottomLeft;
                rawIndices[i++] = topRight;
                rawIndices[i++] = topRight;
                rawIndices[i++] = bottomLeft;
                rawIndices[i++] = bottomRight;
            }
        }
        const indices = rawIndices.length > 65535 ? rawIndices : new Uint16Array(rawIndices);
        return { positions, uvs, indices };
    }
    buildAncestorMesh(targetTile, ancestorTile, segmentsPerSide = 16) {
        const baseMesh = this.buildTileMesh(targetTile, segmentsPerSide);
        const dz = targetTile.z - ancestorTile.z;
        const scale = 2 ** dz;
        const subTileX = targetTile.x - (ancestorTile.x << dz);
        const subTileY = targetTile.y - (ancestorTile.y << dz);
        const uvs = new Float32Array(baseMesh.uvs.length);
        for (let i = 0; i < baseMesh.uvs.length; i += 2) {
            const u = baseMesh.uvs[i] ?? 0;
            const baseV = baseMesh.uvs[i + 1] ?? 0;
            const v = 1 - baseV;
            uvs[i] = (subTileX + u) / scale;
            uvs[i + 1] = 1 - (subTileY + v) / scale;
        }
        return {
            positions: baseMesh.positions,
            uvs,
            indices: baseMesh.indices,
        };
    }
    uploadMesh(mesh, webgl) {
        const positionBuffer = webgl.createBuffer();
        const uvBuffer = webgl.createBuffer();
        const indexBuffer = webgl.createBuffer();
        const indexType = mesh.indices instanceof Uint32Array ? webgl.UNSIGNED_INT : webgl.UNSIGNED_SHORT;
        webgl.bindBuffer(webgl.ARRAY_BUFFER, positionBuffer);
        webgl.bufferData(webgl.ARRAY_BUFFER, mesh.positions, webgl.STATIC_DRAW);
        webgl.bindBuffer(webgl.ARRAY_BUFFER, uvBuffer);
        webgl.bufferData(webgl.ARRAY_BUFFER, mesh.uvs, webgl.STATIC_DRAW);
        webgl.bindBuffer(webgl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        webgl.bufferData(webgl.ELEMENT_ARRAY_BUFFER, mesh.indices, webgl.STATIC_DRAW);
        return {
            positionBuffer,
            uvBuffer,
            indexBuffer,
            indexCount: mesh.indices.length,
            indexType,
        };
    }
}
exports.XYZMeshBuilder = XYZMeshBuilder;


/***/ }),

/***/ 8868:
/***/ ((__unused_webpack_module, exports) => {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.XYZMapDescriptor = void 0;
class XYZMapDescriptor {
    _name;
    _url;
    _urlResolver;
    _minZoom;
    _maxZoom;
    _segmentsPerSide;
    _tileSize;
    _maxCachedTiles;
    _interactionDebounceMs;
    _subdomains;
    _attribution;
    _flipY;
    _maxConcurrentLoads;
    constructor(name, url, minZoom = 0, maxZoom = 8, segmentsPerSide = 16, maxCachedTiles = 384, maxConcurrentLoads = 8, urlResolver) {
        this._name = name;
        this._url = url;
        this._urlResolver = urlResolver;
        this._minZoom = minZoom;
        this._maxZoom = maxZoom;
        this._segmentsPerSide = segmentsPerSide;
        this._maxCachedTiles = maxCachedTiles;
        this._interactionDebounceMs = 100;
        this._subdomains = ['a', 'b', 'c'];
        this._attribution = '';
        this._flipY = false;
        this._maxConcurrentLoads = maxConcurrentLoads;
    }
    get url() {
        return this._url;
    }
    get urlResolver() {
        return this._urlResolver;
    }
    get name() {
        return this._name;
    }
    get minZoom() {
        return this._minZoom;
    }
    get maxZoom() {
        return this._maxZoom;
    }
    get segmentsPerSide() {
        return this._segmentsPerSide;
    }
    get maxCachedTiles() {
        return this._maxCachedTiles;
    }
    get interactionDebounceMs() {
        return this._interactionDebounceMs;
    }
    get subdomains() {
        return this._subdomains;
    }
    get attribution() {
        return this._attribution;
    }
    get flipY() {
        return this._flipY;
    }
    get maxConcurrentLoads() {
        return this._maxConcurrentLoads;
    }
}
exports.XYZMapDescriptor = XYZMapDescriptor;


/***/ }),

/***/ 8909:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FootprintShaderProgram = void 0;
// HiPSShaderProgram.ts
const gl_matrix_1 = __webpack_require__(1961);
const ShaderManager_js_1 = __importDefault(__webpack_require__(5947));
class FootprintShaderProgram {
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
        const fragmentShaderStr = ShaderManager_js_1.default.footprintFS();
        this._fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(this._fragmentShader, fragmentShaderStr);
        gl.compileShader(this._fragmentShader);
        console.log('FS log:', gl.getShaderInfoLog(this._fragmentShader) || 'ok');
        if (!gl.getShaderParameter(this._fragmentShader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(this._fragmentShader) || 'Fragment shader compile error');
            return;
        }
        const vertexShaderStr = ShaderManager_js_1.default.footprintVS();
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
        let mvMatrix = gl_matrix_1.mat4.create();
        mvMatrix = gl_matrix_1.mat4.multiply(mvMatrix, viewMatrix, modelMatrix);
        gl.uniformMatrix4fv(this.locations.pMatrix, false, pMatrix);
        gl.uniformMatrix4fv(this.locations.mvMatrix, false, mvMatrix);
    }
}
exports.FootprintShaderProgram = FootprintShaderProgram;
// export const footprintShaderProgram = new FootprintShaderProgram()


/***/ }),

/***/ 9022:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TerraFootprintSetGL = void 0;
const FootprintSetGL_js_1 = __webpack_require__(592);
const CoordsType_js_1 = __webpack_require__(8145);
const Footprint_js_1 = __webpack_require__(2475);
const MetadataColumn_js_1 = __webpack_require__(1072);
const MetadataManager_js_1 = __webpack_require__(5403);
const MetadataColumn_js_2 = __webpack_require__(1072);
class TerraFootprintSetGL extends FootprintSetGL_js_1.FootprintSetGL {
    _kind = 'TerraFootprintSetGL';
    _coordsType = CoordsType_js_1.CoordsType.GEOGRAPHIC;
    addGeoJSONFeatures(features) {
        this._ready = false;
        this.clearFootprints();
        this._metadataManager = new MetadataManager_js_1.MetadataManager(this.createGeoJSONMetadataColumns(features));
        for (const feature of features) {
            const footprint = Footprint_js_1.Footprint.fromPolygons(feature.polygons, this.createGeoJSONDetails(feature), CoordsType_js_1.CoordsType.GEOGRAPHIC);
            if (footprint.valid) {
                this.addFootprint(footprint);
                this.totPoints += footprint.totPoints;
                this.totConvexPoints += footprint.totConvexPoints;
            }
        }
        this._ready = true;
        this._bufferInitialised = false;
    }
    createGeoJSONMetadataColumns(features) {
        const names = new Set();
        features.forEach(feature => Object.keys(feature.properties).forEach(name => names.add(name)));
        return Array.from(names).map((name, index) => {
            const values = features.map(feature => feature.properties[name]).filter(value => value !== null && value !== undefined && value !== '');
            const isNumber = values.length > 0 && values.every(value => typeof value === 'number' || !Number.isNaN(Number(value)));
            const isName = /^name$|nome|denominazione|label|title/i.test(name);
            return new MetadataColumn_js_1.MetadataColumn({
                index,
                name,
                columnType: isName ? MetadataColumn_js_2.ColumnType.MAIN_NAME : (isNumber ? MetadataColumn_js_2.ColumnType.NUMBER : MetadataColumn_js_2.ColumnType.STRING),
                unit: '',
            });
        });
    }
    createGeoJSONDetails(feature) {
        return Object.entries(feature.properties).map(([key, value]) => ({
            key,
            value: typeof value === 'number' ? value : String(value ?? ''),
        }));
    }
}
exports.TerraFootprintSetGL = TerraFootprintSetGL;


/***/ }),

/***/ 9665:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
/**
 * @author Fabrizio Giordano (Fab77)
 */
const Point_js_1 = __webpack_require__(6553);
const CoordsType_js_1 = __webpack_require__(8145);
const Global_js_1 = __importDefault(__webpack_require__(4382));
class STCSParser {
    static parseSTCS(stcs, options = {}) {
        const stcsParsed = STCSParser.cleanStcs(stcs);
        let totPoints = 0;
        const polygons = [];
        if (stcsParsed.includes("POLYGON")) {
            return STCSParser.parsePolygon(stcsParsed, options);
        }
        else if (stcsParsed.includes("CIRCLE")) {
            return STCSParser.parseCircle(stcsParsed, options);
        }
        else {
            console.warn("STCS not recognised");
        }
        return { totpoints: totPoints, polygons };
    }
    static cleanStcs(stcs) {
        // Uppercase once
        let s = stcs.toUpperCase();
        // Remove tokens
        s = s
            .replace(/'ICRS'/g, '')
            .replace(/\bICRS\b/g, '')
            .replace(/\bJ2000\b/g, '')
            .replace(/\bUNION\b/g, '')
            .replace(/\bTOPOCENTER\b/g, '');
        // Remove parentheses
        s = s.replace(/[()]/g, '');
        // Collapse extra spaces and trim
        s = s.replace(/ {2,}/g, ' ').trim();
        return s;
    }
    static parsePolygon(stcs, options = {}) {
        let totPoints = 0;
        const polygons = [];
        const MAX_DECIMALS = Global_js_1.default.MAX_DECIMALS ?? 12;
        const coordsType = options.coordsType ?? CoordsType_js_1.CoordsType.ASTRO;
        const polys = stcs.split("POLYGON ");
        for (let i = 1; i < polys.length; i++) {
            const currPoly = [];
            const points = polys[i].trim().split(" ");
            // If first point is repeated as last, remove the duplicate
            const p0 = Number(parseFloat(points[0]).toFixed(MAX_DECIMALS));
            const p1 = Number(parseFloat(points[1]).toFixed(MAX_DECIMALS));
            const plast0 = Number(parseFloat(points[points.length - 2]).toFixed(MAX_DECIMALS));
            const plast1 = Number(parseFloat(points[points.length - 1]).toFixed(MAX_DECIMALS));
            if (p0 === plast0 && p1 === plast1) {
                points.splice(points.length - 2, 2);
            }
            if (points.length > 2) {
                for (let p = 0; p < points.length - 1; p += 2) {
                    const xDeg = Number(parseFloat(points[p]).toFixed(MAX_DECIMALS));
                    const yDeg = Number(parseFloat(points[p + 1]).toFixed(MAX_DECIMALS));
                    const point = coordsType === CoordsType_js_1.CoordsType.GEOGRAPHIC
                        ? new Point_js_1.Point({ lonDeg: xDeg, latDeg: yDeg }, CoordsType_js_1.CoordsType.GEOGRAPHIC)
                        : new Point_js_1.Point({ raDeg: xDeg, decDeg: yDeg }, CoordsType_js_1.CoordsType.ASTRO);
                    currPoly.push(point);
                    totPoints += 1;
                }
                polygons.push(currPoly);
            }
        }
        return { totpoints: totPoints, polygons };
    }
    // Example format: "CIRCLE ICRS 8.739685 4.38147 0.027833"
    static parseCircle(stcs, options = {}) {
        let totPoints = 0;
        const polygons = [];
        const coordsType = options.coordsType ?? CoordsType_js_1.CoordsType.ASTRO;
        const polys = stcs.split("CIRCLE ");
        for (let i = 1; i < polys.length; i++) {
            const currPoly = [];
            const tokens = polys[i].trim().split(" ");
            const ra = Number(tokens[0]);
            const dec = Number(tokens[1]);
            const radius = Number(tokens[2]);
            const POINTS_PER_QUADRANT = 6;
            const npoints = POINTS_PER_QUADRANT * 4;
            const alpha = (2 * Math.PI) / npoints;
            // Generate points around the circle
            for (let p = npoints; p > 0; p--) {
                const curra = radius * Math.cos(p * alpha) + ra;
                const curdec = radius * Math.sin(p * alpha) + dec;
                const point = coordsType === CoordsType_js_1.CoordsType.GEOGRAPHIC
                    ? new Point_js_1.Point({ lonDeg: curra, latDeg: curdec }, CoordsType_js_1.CoordsType.GEOGRAPHIC)
                    : new Point_js_1.Point({ raDeg: curra, decDeg: curdec }, CoordsType_js_1.CoordsType.ASTRO);
                currPoly.push(point);
                totPoints += 1;
            }
            polygons.push(currPoly);
        }
        return { totpoints: totPoints, polygons };
    }
}
exports["default"] = STCSParser;


/***/ }),

/***/ 9685:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PerspectiveMatrixManager = void 0;
const gl_matrix_1 = __webpack_require__(1961);
const Config_js_1 = __webpack_require__(2919);
class PerspectiveMatrixManager {
    _pMatrix;
    _aspectRatio = 1;
    constructor(canvas, camera, fovDeg, nearPlane = 0.1, insideSphere) {
        this._pMatrix = this.computePerspectiveMatrix(canvas, camera, fovDeg, nearPlane, insideSphere);
    }
    get pMatrix() {
        return this._pMatrix;
    }
    set pMatrix(pMatrix) {
        this._pMatrix = pMatrix;
    }
    computePerspectiveMatrix(canvas, camera, fovDeg, nearPlane = 0.1, insideSphere) {
        this._aspectRatio = canvas.width / canvas.height;
        const p = gl_matrix_1.mat4.create();
        let farPlane;
        if (insideSphere) {
            // Inside the sphere: cap slightly beyond radius
            farPlane = 1.1;
        }
        else {
            const camMat = camera.getCameraMatrix();
            const distCamera = -Number(camMat[14]); // camera z translation
            const r = 1; // HiPS sphere radius (inject real value if available)
            // Guard against negative due to rounding/logic
            const c2 = Math.sqrt(Math.max(distCamera ** 2 - r ** 2, 0));
            const beta = Math.atan2(c2, r);
            const cf = c2 * Math.sin(beta);
            farPlane = cf > 0 ? cf : r;
        }
        const effectiveFovDeg = insideSphere ? Config_js_1.bootSetup.inside_camera_fov_deg : fovDeg;
        const effectiveNearPlane = insideSphere ? Math.max(nearPlane, 0.001) : nearPlane;
        gl_matrix_1.mat4.perspective(p, (effectiveFovDeg * Math.PI) / 180, this._aspectRatio, effectiveNearPlane, farPlane);
        this._pMatrix = p;
        return p;
    }
}
exports.PerspectiveMatrixManager = PerspectiveMatrixManager;


/***/ }),

/***/ 9839:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EquatorialGrid = void 0;
/* eslint-disable @typescript-eslint/no-non-null-assertion */
const gl_matrix_1 = __webpack_require__(1961);
const FoVHelper_js_1 = __webpack_require__(229);
const Utils_js_1 = __webpack_require__(7930);
const GridShaderManager_js_1 = __importDefault(__webpack_require__(4707));
const Point_js_1 = __webpack_require__(6553);
const CoordsType_js_1 = __webpack_require__(8145);
const FoVUtils_js_1 = __webpack_require__(8083);
const GridTextHelper_js_1 = __importDefault(__webpack_require__(5361));
const HealpixGrid_js_1 = __webpack_require__(4595);
const AbstractSkyEntity_js_1 = __webpack_require__(4735);
/** Equatorial grid rendered as RA/Dec great-circle line loops */
class EquatorialGrid extends AbstractSkyEntity_js_1.AbstractSkyEntity {
    static ELEM_SIZE = 3;
    static BYTES_X_ELEM = new Float32Array().BYTES_PER_ELEMENT;
    showGrid = false;
    // private _gl: GL;
    _shaderProgram;
    _vertexShader;
    _fragmentShader;
    defaultColor = '#41d421';
    gridText = new GridTextHelper_js_1.default('equatorial');
    _attribLocations = {
        position: 0,
        selected: 1,
        pointSize: 2,
        color: 3,
    };
    _phiVertexPositionBuffer;
    _thetaVertexPositionBuffer;
    _fov;
    // Step sizes (degrees + radians) and label caches
    _phiStep = 0;
    _phiStepRad = 0;
    _thetaStep = 0;
    _thetaStepRad = 0;
    _phiArray = [];
    _thetaArray = [];
    _bufferKey = '';
    // For placing text labels near current view center:
    //  - _dec4Labels: key = RA(deg), value = points along that RA ring (for Dec labels)
    //  - _ra4Labels : key = Dec(deg), value = points along that Dec ring (for RA labels)
    _dec4Labels = new Map();
    _ra4Labels = new Map();
    _healpixGrid;
    /**
     * @param radius Not used by current implementation (sphere is unit-radius)
     * @param fov    Field of view in degrees
     */
    constructor(webgl, healpixGrid) {
        super(HealpixGrid_js_1.HealpixGrid.RADIUS, HealpixGrid_js_1.HealpixGrid.INITIAL_POSITION, HealpixGrid_js_1.HealpixGrid.INITIAL_PhiRad, HealpixGrid_js_1.HealpixGrid.INITIAL_ThetaRad, 'equatorial-grid', webgl);
        this._healpixGrid = healpixGrid;
    }
    init(fov) {
        this._fov = fov;
        this.initGL(super.webgl);
        // Program & buffers
        this._shaderProgram = super.webgl.createProgram();
        this.initShaders();
        this._phiVertexPositionBuffer = super.webgl.createBuffer();
        this._thetaVertexPositionBuffer = super.webgl.createBuffer();
        // Build initial RA/Dec line buffers
        this.initBuffers(this._fov);
    }
    /** Compile/link shaders and fetch uniform/attribute locations */
    initShaders() {
        // Fragment
        const fsSource = GridShaderManager_js_1.default.healpixGridFS();
        this._fragmentShader = super.webgl.createShader(super.webgl.FRAGMENT_SHADER);
        super.webgl.shaderSource(this._fragmentShader, fsSource);
        super.webgl.compileShader(this._fragmentShader);
        if (!super.webgl.getShaderParameter(this._fragmentShader, super.webgl.COMPILE_STATUS)) {
            // Keep identical behavior (alert) but surface errors in console too
            const log = super.webgl.getShaderInfoLog(this._fragmentShader) || 'Unknown fragment shader error';
            console.error(log);
            alert(log);
            return;
        }
        // Vertex
        const vsSource = GridShaderManager_js_1.default.healpixGridVS();
        this._vertexShader = super.webgl.createShader(super.webgl.VERTEX_SHADER);
        super.webgl.shaderSource(this._vertexShader, vsSource);
        super.webgl.compileShader(this._vertexShader);
        if (!super.webgl.getShaderParameter(this._vertexShader, super.webgl.COMPILE_STATUS)) {
            const log = super.webgl.getShaderInfoLog(this._vertexShader) || 'Unknown vertex shader error';
            console.error(log);
            alert(log);
            return;
        }
        // Link
        super.webgl.attachShader(this._shaderProgram, this._vertexShader);
        super.webgl.attachShader(this._shaderProgram, this._fragmentShader);
        super.webgl.linkProgram(this._shaderProgram);
        if (!super.webgl.getProgramParameter(this._shaderProgram, super.webgl.LINK_STATUS)) {
            alert('Could not initialise shaders');
        }
        super.webgl.useProgram(this._shaderProgram);
    }
    /** Build RA/Dec line vertex arrays based on FoV step helper */
    initBuffers(fovDeg, coarse = false) {
        const R = 1.0;
        const steps = FoVHelper_js_1.fovHelper.getRADegSteps(fovDeg, coarse);
        const phiStep = steps.raStep; // RA step (deg)
        const thetaStep = steps.decStep; // Dec step (deg)
        this._phiStep = phiStep;
        this._phiStepRad = (0, Utils_js_1.degToRad)(phiStep);
        this._thetaStep = thetaStep;
        this._thetaStepRad = (0, Utils_js_1.degToRad)(thetaStep);
        this._ra4Labels = new Map();
        this._dec4Labels = new Map();
        this._phiArray = [];
        this._thetaArray = [];
        // Lines of constant Dec (varying RA): for each Dec, a ring with vertices every phiStep°
        for (let theta = thetaStep; theta < 180; theta += thetaStep) {
            const phiVertexPosition = new Float32Array((360 / phiStep) * 3);
            const thetaRad = (0, Utils_js_1.degToRad)(theta);
            for (let phi = 0; phi < 360; phi += phiStep) {
                const phiRad = (0, Utils_js_1.degToRad)(phi);
                const x = R * Math.sin(thetaRad) * Math.cos(phiRad);
                const y = R * Math.sin(thetaRad) * Math.sin(phiRad);
                const z = R * Math.cos(thetaRad);
                const idx = Math.floor(phi / phiStep);
                phiVertexPosition[3 * idx + 0] = x;
                phiVertexPosition[3 * idx + 1] = y;
                phiVertexPosition[3 * idx + 2] = z;
                if (!this._dec4Labels.has(phi))
                    this._dec4Labels.set(phi, []);
                this._dec4Labels.get(phi).push([x, y, z]);
            }
            this._phiArray.push(phiVertexPosition);
        }
        // Lines of constant RA (varying Dec): for each RA, a ring with vertices every thetaStep°
        for (let phi = 0; phi < 360; phi += phiStep) {
            const thetaVertexPosition = new Float32Array((360 / thetaStep) * 3);
            const phiRad = (0, Utils_js_1.degToRad)(phi);
            for (let theta = 0; theta < 360; theta += thetaStep) {
                const thetaRad = (0, Utils_js_1.degToRad)(theta);
                const x = R * Math.sin(thetaRad) * Math.cos(phiRad);
                const y = R * Math.sin(thetaRad) * Math.sin(phiRad);
                const z = R * Math.cos(thetaRad);
                const idx = Math.floor(theta / thetaStep);
                thetaVertexPosition[3 * idx + 0] = x;
                thetaVertexPosition[3 * idx + 1] = y;
                thetaVertexPosition[3 * idx + 2] = z;
                const decKey = 90 - theta; // original code’s keying for RA labels
                if (!this._ra4Labels.has(decKey))
                    this._ra4Labels.set(decKey, []);
                this._ra4Labels.get(decKey).push([x, y, z]);
            }
            this._thetaArray.push(thetaVertexPosition);
        }
    }
    /** Update buffers when FoV (in degrees) changes */
    refresh(fovDeg, coarse = false) {
        // const fovDeg = healpixGridSingleton.getMinFoV()
        const steps = FoVHelper_js_1.fovHelper.getRADegSteps(fovDeg, coarse);
        const bufferKey = `${coarse ? 'coarse' : 'settled'}:${steps.raStep}:${steps.decStep}`;
        if (this._bufferKey !== bufferKey) {
            this._fov = fovDeg;
            this._bufferKey = bufferKey;
            this.initBuffers(this._fov, coarse);
        }
    }
    vectorDistance(p1, p2) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dz = p1.z - p2.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    enableShader(mMatrix, pMatrix, vMatrix) {
        const gl = super.webgl;
        gl.useProgram(this._shaderProgram);
        // uMVMatrix = camera * model
        const mvMatrix = gl_matrix_1.mat4.create();
        // mat4.multiply(mvMatrix, (global.camera as any).getCameraMatrix() as mat4, mMatrix);
        gl_matrix_1.mat4.multiply(mvMatrix, vMatrix, mMatrix);
        // TODO move locations retrieval elsewhere
        // Uniform locations
        const uMVMatrixLoc = gl.getUniformLocation(this._shaderProgram, 'uMVMatrix');
        const uPMatrixLoc = gl.getUniformLocation(this._shaderProgram, 'uPMatrix');
        const uColor = gl.getUniformLocation(this._shaderProgram, 'u_fragcolor');
        // Attribute locations
        this._attribLocations.position = gl.getAttribLocation(this._shaderProgram, 'aCatPosition');
        if (uMVMatrixLoc)
            gl.uniformMatrix4fv(uMVMatrixLoc, false, mvMatrix);
        if (uPMatrixLoc)
            gl.uniformMatrix4fv(uPMatrixLoc, false, pMatrix);
        if (uColor) {
            const rgb = (0, Utils_js_1.colorHex2RGB)(this.defaultColor);
            gl.uniform4f(uColor, rgb[0], rgb[1], rgb[2], 1.0);
        }
    }
    isVisible() {
        return this.showGrid;
    }
    toggleShowGrid() {
        this.showGrid = !this.showGrid;
    }
    /**
     * @param mMatrix model matrix associated with current HiPS (or scene) transform
     * @param fovObj  current field-of-view (degrees). If your FoV type differs,
     *                pass the numeric value here; this signature matches original usage.
     */
    draw(input) {
        const fovDeg = input.fovDeg;
        if (!fovDeg)
            return;
        const gl = super.webgl;
        const mMatrix = this.getModelMatrix();
        const camera = input.camera;
        if (!camera)
            return;
        const vMatrix = camera.getCameraMatrix();
        const pMatrix = input.pMatrix;
        if (!pMatrix)
            return;
        if (!vMatrix)
            return;
        if (this._thetaArray.length === 0)
            return;
        this.refresh(fovDeg, !!input.cameraMoving);
        if (!this.showGrid) {
            // gridTextHelper.resetDivSets();
            this.gridText.resetDivSets();
            return;
        }
        // const pMatrix = computePerspectiveMatrixSingleton.pMatrix as ReadonlyMat4;
        this.enableShader(mMatrix, pMatrix, vMatrix);
        // Draw Dec rings
        for (let i = 0; i < this._phiArray.length; i++) {
            super.webgl.bindBuffer(super.webgl.ARRAY_BUFFER, this._phiVertexPositionBuffer);
            super.webgl.bufferData(super.webgl.ARRAY_BUFFER, this._phiArray[i], super.webgl.STATIC_DRAW);
            super.webgl.vertexAttribPointer(this._attribLocations.position, 3, super.webgl.FLOAT, false, 0, 0);
            super.webgl.enableVertexAttribArray(this._attribLocations.position);
            super.webgl.drawArrays(super.webgl.LINE_LOOP, 0, 360 / this._phiStep);
        }
        // Draw RA rings
        for (let j = 0; j < this._thetaArray.length; j++) {
            super.webgl.bindBuffer(super.webgl.ARRAY_BUFFER, this._thetaVertexPositionBuffer);
            super.webgl.bufferData(super.webgl.ARRAY_BUFFER, this._thetaArray[j], super.webgl.STATIC_DRAW);
            super.webgl.vertexAttribPointer(this._attribLocations.position, 3, super.webgl.FLOAT, false, 0, 0);
            super.webgl.enableVertexAttribArray(this._attribLocations.position);
            super.webgl.drawArrays(super.webgl.LINE_LOOP, 0, 360 / this._thetaStep);
        }
        // Label layout (HTML overlay)
        const center = FoVUtils_js_1.FoVUtils.getCenterJ2000(gl.canvas, this._healpixGrid, this._webgl, camera, pMatrix);
        // MVP = P * V * M
        const mvMatrix = gl_matrix_1.mat4.create();
        // mat4.multiply(mvMatrix, (global.camera as any).getCameraMatrix() as unknown as mat4, mMatrix);
        gl_matrix_1.mat4.multiply(mvMatrix, vMatrix, mMatrix);
        const mvpMatrix = gl_matrix_1.mat4.create();
        gl_matrix_1.mat4.multiply(mvpMatrix, pMatrix, mvMatrix);
        // Dec labels (loop over RA keys)
        for (const [raDegKey, points] of this._dec4Labels.entries()) {
            if (Math.abs(raDegKey - center.raDeg) <= this._phiStep) {
                for (let p = 0; p < points.length; p++) {
                    const [x, y, z] = points[p];
                    const phiPoint = [x, y, z, 1];
                    const point = new Point_js_1.Point({ x, y, z }, CoordsType_js_1.CoordsType.CARTESIAN);
                    const decDeg = point.decDeg;
                    if (Math.abs(decDeg - center.decDeg) < 60) {
                        const clipspace = gl_matrix_1.vec4.create();
                        gl_matrix_1.vec4.transformMat4(clipspace, phiPoint, mvpMatrix);
                        // perspective divide
                        clipspace[0] /= clipspace[3];
                        clipspace[1] /= clipspace[3];
                        // clip -> CSS pixels
                        const canvasRect = super.webgl.canvas.getBoundingClientRect();
                        const pixelX = canvasRect.left + (clipspace[0] * 0.5 + 0.5) * canvasRect.width;
                        const pixelY = canvasRect.top + (clipspace[1] * -0.5 + 0.5) * canvasRect.height;
                        this.gridText.addEqDivSet(decDeg.toFixed(2), pixelX, pixelY, 'dec');
                        // gridTextHelper.addEqDivSet(decDeg.toFixed(2), pixelX, pixelY, 'dec');
                    }
                }
            }
        }
        // RA labels (loop over Dec keys)
        for (const [decDegKey, points] of this._ra4Labels.entries()) {
            if (Math.abs(decDegKey - center.decDeg) <= this._thetaStep) {
                for (let p = 0; p < points.length; p++) {
                    const [x, y, z] = points[p];
                    const phiPoint = [x, y, z, 1];
                    const point = new Point_js_1.Point({ x, y, z }, CoordsType_js_1.CoordsType.CARTESIAN);
                    const d = this.vectorDistance(point, center);
                    const raDeg = point.raDeg;
                    if (d < (0, Utils_js_1.degToRad)(50)) {
                        const clipspace = gl_matrix_1.vec4.create();
                        gl_matrix_1.vec4.transformMat4(clipspace, phiPoint, mvpMatrix);
                        clipspace[0] /= clipspace[3];
                        clipspace[1] /= clipspace[3];
                        const canvasRect = super.webgl.canvas.getBoundingClientRect();
                        const pixelX = canvasRect.left + (clipspace[0] * 0.5 + 0.5) * canvasRect.width;
                        const pixelY = canvasRect.top + (clipspace[1] * -0.5 + 0.5) * canvasRect.height;
                        // gridTextHelper.addEqDivSet(raDeg.toFixed(2), pixelX, pixelY, 'ra');
                        this.gridText.addEqDivSet(raDeg.toFixed(2), pixelX, pixelY, 'ra');
                    }
                }
            }
        }
        this.gridText.resetDivSets();
        // gridTextHelper.resetDivSets();
        // Cleanup
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }
}
exports.EquatorialGrid = EquatorialGrid;
// const equatorialGridSingleton = new EquatorialGrid();
// export default equatorialGridSingleton;


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(1229);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;