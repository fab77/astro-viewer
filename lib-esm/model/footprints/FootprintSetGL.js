import { shaderUtility } from '../../utils/ShaderUtility.js';
import Footprint from './Footprint.js';
import FootprintProps from './FootprintProps.js';
import { mat4 } from 'gl-matrix';
import global from '../../Global.js';
import { colorHex2RGB } from '../../utils/Utils.js';
import computePerspectiveMatrixSingleton from '../../utils/ComputePerspectiveMatrix.js';
class FootprintSetGL {
    static ELEM_SIZE = 3;
    static BYTES_X_ELEM = new Float32Array().BYTES_PER_ELEMENT;
    static CONVEXPOLY_ELEM_SIZE = 3;
    ready;
    footprintsetProps;
    name;
    description;
    provider;
    tapRepo;
    footprintPolygons = [];
    indexes;
    totPoints;
    totConvexPoints;
    footprintsInPix256;
    attribLocations;
    gl;
    shaderProgram;
    vertexCataloguePositionBuffer;
    vertexhoveredCataloguePositionBuffer;
    indexBuffer;
    hoveredVertexPositionBuffer;
    hoveredIndexBuffer;
    selectedVertexPositionBuffer;
    selectedIndexBuffer;
    vertexCataloguePosition;
    nPrimitiveFlags;
    hoveredIndexes;
    selectedIndexes;
    extHoveredIndexes;
    oldMouseCoords;
    healpixDensityMap;
    hoveredFootprints = [];
    hoveredIndex = [];
    hoveredVertexPosition = [];
    totHoveredPoints;
    selectedFootprints = [];
    selectedIndex = [];
    selectedVertexPosition = [];
    totSelectedPoints;
    constructor(tablename, tabledesc, tapRepo, tapMetadataList) {
        this.ready = false;
        this.name = tablename;
        this.description = tabledesc;
        this.provider = tapRepo._tapBaseURL;
        this.tapRepo = tapRepo;
        this.footprintsInPix256 = new Map();
        this.initFootprintArrays();
        if (!global.gl) {
            throw new Error('WebGL2RenderingContext is not initialized (global.gl is null)');
        }
        this.gl = global.gl;
        this.initGLBuffers();
        this.shaderProgram = this.gl.createProgram();
        this.nPrimitiveFlags = 0;
        this.oldMouseCoords = null;
        const defaultColor = '#8F00FF';
        this.footprintsetProps = new FootprintProps(tapMetadataList, defaultColor);
        this.initShaders();
    }
    initFootprintArrays() {
        this.footprintPolygons = [];
        this.indexes = new Uint32Array();
        this.vertexCataloguePosition = new Float32Array();
        this.totPoints = 0;
        this.totConvexPoints = 0;
        this.extHoveredIndexes = [];
        this.hoveredFootprints = [];
        this.hoveredIndex = [];
        this.hoveredVertexPosition = [];
        this.totHoveredPoints = 0;
        this.hoveredIndexes = [];
        this.selectedFootprints = [];
        this.selectedIndex = [];
        this.selectedVertexPosition = [];
        this.totSelectedPoints = 0;
        this.selectedIndexes = [];
    }
    initGLBuffers() {
        this.vertexCataloguePositionBuffer = this.gl.createBuffer();
        this.vertexhoveredCataloguePositionBuffer = this.gl.createBuffer();
        this.indexBuffer = this.gl.createBuffer();
        this.hoveredVertexPositionBuffer = this.gl.createBuffer();
        this.hoveredIndexBuffer = this.gl.createBuffer();
        this.selectedVertexPositionBuffer = this.gl.createBuffer();
        this.selectedIndexBuffer = this.gl.createBuffer();
        this.attribLocations = {
            position: 0,
            selected: 1,
            pointSize: 2,
            color: [0.0, 1.0, 0.0, 1.0]
        };
    }
    initShaders() {
        const fragmentShader = this.loadShaderFromDOM('fpcat-shader-fs');
        const vertexShader = this.loadShaderFromDOM('fpcat-shader-vs');
        if (!fragmentShader || !vertexShader) {
            throw new Error('Shader sources not found in DOM');
        }
        this.gl.attachShader(this.shaderProgram, vertexShader);
        this.gl.attachShader(this.shaderProgram, fragmentShader);
        this.gl.linkProgram(this.shaderProgram);
        if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
            throw new Error('Could not initialise shaders');
        }
        shaderUtility.useProgram(this.shaderProgram);
    }
    loadShaderFromDOM(shaderId) {
        const shaderScript = document.getElementById(shaderId);
        if (!shaderScript)
            return null;
        let shaderSource = '';
        let currentChild = shaderScript.firstChild;
        while (currentChild) {
            if (currentChild.nodeType === Node.TEXT_NODE) {
                shaderSource += currentChild.textContent;
            }
            currentChild = currentChild.nextSibling;
        }
        let shader = null;
        if (shaderScript.type === 'x-shader/x-fragment') {
            shader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        }
        else if (shaderScript.type === 'x-shader/x-vertex') {
            shader = this.gl.createShader(this.gl.VERTEX_SHADER);
        }
        if (!shader)
            return null;
        this.gl.shaderSource(shader, shaderSource);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error(this.gl.getShaderInfoLog(shader));
            return null;
        }
        return shader;
    }
    addFootprint(in_footprint) {
        this.footprintPolygons.push(in_footprint);
    }
    addFootprints(in_data) {
        this.ready = false;
        const geomDataIndex = this.footprintsetProps.geomColumn?.index;
        if (geomDataIndex === undefined) {
            throw new Error('geomColumn or its index is undefined in footprintsetProps');
        }
        for (let j = 0; j < in_data.length; j++) {
            if (in_data[j][0] !== null) {
                const footprint = new Footprint(in_data[j][geomDataIndex], in_data[j]);
                if (footprint._valid) {
                    this.addFootprint(footprint);
                    this.totPoints += footprint.totPoints;
                    this.totConvexPoints += footprint.totConvexPoints;
                }
            }
        }
        this.initBuffer();
        this.ready = true;
    }
    clearFootprints() {
        this.initFootprintArrays();
    }
    initBuffer() {
        const nFootprints = this.footprintPolygons.length;
        let npolygons = nFootprints - 1;
        for (let j = 0; j < nFootprints; j++) {
            npolygons += this.footprintPolygons[j].polygons.length - 1;
        }
        this.indexes = new Uint32Array(this.totPoints + npolygons + 1);
        const MAX_UNSIGNED_INT = 0xffffffff;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexCataloguePositionBuffer);
        this.vertexCataloguePosition = new Float32Array(3 * this.totPoints);
        let positionIndex = 0;
        let vIdx = 0;
        const R = 1.0;
        this.nPrimitiveFlags = 0;
        for (let j = 0; j < nFootprints; j++) {
            const footprint = this.footprintPolygons[j];
            const footprintPoly = footprint.polygons;
            const identifier = footprint.identifier;
            if (global.healpix4footprints) {
                if (footprint.pixels) {
                    footprint.pixels.forEach((pix) => {
                        if (this.footprintsInPix256.has(pix)) {
                            const curr = this.footprintsInPix256.get(pix);
                            if (!curr.includes(footprint)) {
                                curr.push(footprint);
                            }
                        }
                        else {
                            this.footprintsInPix256.set(pix, [footprint]);
                        }
                    });
                }
            }
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
        console.log('Buffer initialized');
    }
    enableShader(in_mMatrix) {
        this.gl.useProgram(this.shaderProgram);
        const catUniformMVMatrixLoc = this.gl.getUniformLocation(this.shaderProgram, 'uMVMatrix');
        const catUniformProjMatrixLoc = this.gl.getUniformLocation(this.shaderProgram, 'uPMatrix');
        const pointsize = this.gl.getUniformLocation(this.shaderProgram, 'u_pointsize');
        this.attribLocations.position = this.gl.getAttribLocation(this.shaderProgram, 'aCatPosition');
        this.attribLocations.color = this.gl.getUniformLocation(this.shaderProgram, 'u_fragcolor');
        const pMatrix = computePerspectiveMatrixSingleton.pMatrix;
        let mvMatrix = mat4.create();
        if (!global.camera) {
            throw new Error('Camera is not initialized (global.camera is null)');
        }
        mvMatrix = mat4.multiply(mvMatrix, global.camera.getCameraMatrix(), in_mMatrix);
        this.gl.uniformMatrix4fv(catUniformMVMatrixLoc, false, mvMatrix);
        this.gl.uniformMatrix4fv(catUniformProjMatrixLoc, false, pMatrix);
        this.gl.uniform1f(pointsize, 14.0);
    }
    draw(in_mMatrix, in_mouseHelper) {
        if (!this.ready)
            return;
        this.enableShader(in_mMatrix);
        // TODO: integrate checkSelection, hovered & selected drawing logic here (similar to JS version)
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexCataloguePositionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertexCataloguePosition, this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(this.attribLocations.position, FootprintSetGL.ELEM_SIZE, this.gl.FLOAT, false, FootprintSetGL.BYTES_X_ELEM * FootprintSetGL.ELEM_SIZE, 0);
        this.gl.enableVertexAttribArray(this.attribLocations.position);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.indexes, this.gl.STATIC_DRAW);
        const shapeColor = [...colorHex2RGB(this.footprintsetProps.shapeColor), 1.0];
        this.gl.uniform4f(this.attribLocations.color, ...shapeColor);
        // this.gl.uniform1f(this.shaderProgram['pointsize'], 4.0)
        this.gl.drawElements(this.gl.LINE_LOOP, this.indexes.length, this.gl.UNSIGNED_INT, 0);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
        this.oldMouseCoords = in_mouseHelper.xyz;
    }
}
export default FootprintSetGL;
//# sourceMappingURL=FootprintSetGL.js.map