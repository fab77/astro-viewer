'use strict';
import { AbstractSkyEntity } from '../AbstractSkyEntity.js';
import global from '../../Global.js';
import { mat4, vec4 } from 'gl-matrix';
import { fovHelper } from '../hips/FoVHelper.js';
import { FoVUtils } from '../../utils/FoVUtils.js';
import { FoV } from '../FoV.js';
import { CoordsType } from '../../utils/CoordsType.js';
import { Point } from '../Point.js';
import GridShaderManager from '../../shader/GridShaderManager.js';
import GeomUtils from '../../utils/GeomUtils.js';
import GridTextHelper from './GridTextHelper.js';
// import { visibleTilesManager } from '../hips/VisibleTilesManager.js';
// import { VisibleTilesManager } from '../hips/VisibleTilesManager.js';
import computePerspectiveMatrixSingleton from '../../utils/ComputePerspectiveMatrix.js';
import { colorHex2RGB } from '../../utils/Utils.js';
import { VisibleTilesManager } from '../hips/VisibleTilesManager.js';
import { bootSetup } from '../../Config.js';
export class HealpixGrid extends AbstractSkyEntity {
    static ELEM_SIZE = 3;
    static BYTES_X_ELEM = new Float32Array().BYTES_PER_ELEMENT;
    _visibleorder = 0;
    showGrid = false;
    _shaderProgram;
    fragmentShader;
    vertexShader;
    defaultColor = '#ec0acaff';
    gridText = new GridTextHelper();
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
    fovObj;
    static INITIAL_FOV = 180;
    static RADIUS = 1;
    static INITIAL_POSITION = [0.0, 0.0, 0.0];
    static INITIAL_PhiRad = 0;
    static INITIAL_ThetaRad = 0;
    _visibleTilesManager;
    constructor(webgl) {
        super(HealpixGrid.RADIUS, HealpixGrid.INITIAL_POSITION, HealpixGrid.INITIAL_PhiRad, HealpixGrid.INITIAL_ThetaRad, 'healpix-grid', webgl);
        this.init();
        this._visibleTilesManager = new VisibleTilesManager(this._webgl, super.hipsShaderProgram, this);
        this._visibleTilesManager.init(bootSetup.insideSphere);
    }
    init() {
        console.log('HealpixGridSingleton.init()');
        this.initGL(super.webgl);
        this._shaderProgram = super.webgl.createProgram();
        this.initShaders();
        const order = fovHelper.getHiPSNorder(HealpixGrid.INITIAL_FOV);
        this._visibleorder = order;
        this._nPrimitiveFlags = 0;
        this._vertexCataloguePositionBuffer = super.webgl.createBuffer();
        this._indexBuffer = super.webgl.createBuffer();
        this._vertexCataloguePosition = new Float32Array(0);
        this.fovObj = new FoV(super.webgl);
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
    refreshFoV(camera) {
        return this.fovObj.getFoV(global.insideSphere, this, camera);
    }
    getFoV() {
        return this.fovObj;
    }
    getMinFoV() {
        return this.fovObj.minFoV;
    }
    initShaders() {
        const gl = super.webgl;
        const fragmentShaderStr = GridShaderManager.healpixGridFS();
        this.fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(this.fragmentShader, fragmentShaderStr);
        gl.compileShader(this.fragmentShader);
        if (!gl.getShaderParameter(this.fragmentShader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(this.fragmentShader) || 'Fragment shader compile error');
            return;
        }
        const vertexShaderStr = GridShaderManager.healpixGridVS();
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
        const healpix = global.getHealpix(order);
        const subhpx = global.getHealpix(order + 1);
        const subsubhpx = global.getHealpix(order + 2);
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
    refresh(camera) {
        this.refreshFoV(camera);
        const fov = this.getMinFoV();
        // expose to global (legacy)
        // (global as any).hipsFoV = fov;
        // global.order = fovHelper.getHiPSNorder(fov);
        // this._visibleorder = global.order;
        this._visibleorder = fovHelper.getHiPSNorder(fov);
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
        let mvMatrix = mat4.create();
        // mvMatrix = mat4.multiply(mvMatrix, (global.camera as any).getCameraMatrix(), in_mMatrix);
        mvMatrix = mat4.multiply(mvMatrix, vMatrix, in_mMatrix);
        if (uMV)
            gl.uniformMatrix4fv(uMV, false, mvMatrix);
        if (uP)
            gl.uniformMatrix4fv(uP, false, pMatrix);
        if (uColor) {
            const rgb = colorHex2RGB(this.defaultColor);
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
        this.refresh(camera);
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
        const pMatrix = computePerspectiveMatrixSingleton.pMatrix;
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
        let mvMatrix = mat4.create();
        // mvMatrix = mat4.multiply(mvMatrix, (global.camera as any).getCameraMatrix(), mMatrix);
        mvMatrix = mat4.multiply(mvMatrix, vMatrix, mMatrix);
        let mvpMatrix = mat4.create();
        mvpMatrix = mat4.multiply(mvpMatrix, pMatrix, mvMatrix);
        // FIX: pass model & pMatrix to match FoVUtils TS signature
        const center = FoVUtils.getCenterJ2000(gl.canvas, this, this._webgl, camera);
        const fovMin = (this.getMinFoV() * Math.PI) / 180 / 2;
        for (let p = 0; p < pixels.length; p++) {
            const pixCenter = global.getHealpix(this._visibleorder).pix2vec(pixels[p]);
            // const pixCenter = (global.getHealpix(global.order).pix2vec(pixels[p]) as BoundVec);
            const point = new Point({ x: pixCenter.x, y: pixCenter.y, z: pixCenter.z }, CoordsType.CARTESIAN);
            const distance = GeomUtils.orthodromicDistance(center, point);
            if (distance < fovMin) {
                const vertex = [pixCenter.x, pixCenter.y, pixCenter.z, 1];
                const clipspace = vec4.create();
                vec4.transformMat4(clipspace, vertex, mvpMatrix);
                // NDC divide
                clipspace[0] /= clipspace[3];
                clipspace[1] /= clipspace[3];
                // clip → pixels
                const pixelX = (clipspace[0] * 0.5 + 0.5) * gl.canvas.width;
                const pixelY = (clipspace[1] * -0.5 + 0.5) * gl.canvas.height;
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
//# sourceMappingURL=HealpixGrid.js.map