import global from '../../Global.js';
import CatalogueProps from './CatalogueProps.js';
import Source from '../Source.js';
import Point from '../Point.js';
import { visibleTilesManager } from '../hips/VisibleTilesManager.js';
import CoordsType from '../..//utils/CoordsType.js';
import { mat4 } from 'gl-matrix';
import { colorHex2RGB } from '../../utils/Utils.js';
import computePerspectiveMatrixSingleton from '../../utils/ComputePerspectiveMatrix.js';
import { catalogueShaderProgram } from '../../shader/CatalogueShaderProgram.js';
// `Source` is assumed to expose at least these:
class CatalogueGL {
    static ELEM_SIZE;
    static BYTES_X_ELEM;
    // Core state
    ready;
    catalogueProps;
    name;
    description;
    tapRepo;
    // Data
    sources;
    // GL & shader
    // attribLocations: {
    //     position: number;
    //     hovered: number;
    //     pointSize: number;
    //     color: WebGLUniformLocation | null;
    //     brightness: number;
    // };
    gl;
    shaderProgram;
    // Buffers & arrays
    vertexCataloguePositionBuffer;
    vertexhoveredCataloguePositionBuffer;
    vertexCataloguePosition;
    // Index/selection bookkeeping
    hoveredIndexes;
    selectedIndexes;
    extHoveredIndexes;
    oldMouseCoords;
    // Healpix pixel => indices map
    healpixDensityMap;
    /**
     * @param tablename - String
     * @param tabledesc - String
     * @param tapRepo   - Object with `_tapBaseURL`
     * @param tapMetadataList - TapMetadataList (as used by CatalogueProps)
     */
    constructor(tablename, tabledesc, provider, tapMetadataList) {
        this.ready = false;
        this.TYPE = 'SOURCE_CATALOGUE';
        CatalogueGL.ELEM_SIZE = 6; // x,y,z, hoveredFlag, size, brightness
        CatalogueGL.BYTES_X_ELEM = new Float32Array().BYTES_PER_ELEMENT;
        this.name = tablename;
        this.description = tabledesc;
        this.tapRepo = provider;
        this.sources = [];
        // GL init
        this.gl = global.gl;
        this.shaderProgram = this.gl.createProgram();
        this.vertexCataloguePositionBuffer = this.gl.createBuffer();
        this.vertexhoveredCataloguePositionBuffer = this.gl.createBuffer();
        this.vertexCataloguePosition = new Float32Array(0);
        this.hoveredIndexes = [];
        this.selectedIndexes = [];
        this.extHoveredIndexes = [];
        this.oldMouseCoords = null;
        // this.attribLocations = {
        //     position: 0,
        //     hovered: 1,
        //     pointSize: 2,
        //     color: null,
        //     brightness: 3
        // };
        this.healpixDensityMap = new Map();
        const defaultColor = '#8F00FF';
        this.catalogueProps = new CatalogueProps(tapMetadataList, defaultColor);
        // this.initShaders();
        // catalogueShaderProgram.initShaders()
        catalogueShaderProgram.shaderProgram;
    }
    minMax(columnindex) {
        if (!this.sources.length)
            return { min: 0, max: 0 };
        let min = this.sources[0].details[columnindex];
        let max = min;
        for (const source of this.sources) {
            const v = source.details[columnindex];
            if (v < min)
                min = v;
            if (v > max)
                max = v;
        }
        return { min, max };
    }
    changeCatalogueMetaShapeSize(metacolumnName) {
        this.catalogueProps.changeCatalogueMetaShapeSize(metacolumnName);
        const idx = this.catalogueProps.shapeSizeColumn?.index ?? this.catalogueProps.shapeSizeColumn?.index;
        if (idx == null)
            return;
        const minmax = this.minMax(idx);
        for (const source of this.sources) {
            const raw = Number(source.getDetailByindex(idx));
            const min = Number(minmax.min);
            const max = Number(minmax.max);
            const norm = (raw - min) / Math.max(1e-12, (max - min));
            const size = norm * (20 - 8) + 8;
            source.shapeSize = size;
        }
        this.initBuffer();
    }
    changeCatalogueMetaShapeHue(metacolumnName) {
        this.catalogueProps.changeCatalogueMetaShapeHue(metacolumnName);
        const idx = this.catalogueProps.shapeHueColumn?.index ?? this.catalogueProps.shapeHueColumn?.index;
        if (idx == null)
            return;
        const minmax = this.minMax(idx);
        for (const source of this.sources) {
            const raw = Number(source.getDetailByindex(idx));
            const min = Number(minmax.min);
            const max = Number(minmax.max);
            const norm = (raw - min) / Math.max(1e-12, (max - min));
            // map [0,1] -> [1,-1]
            source.brightnessFactor = -(norm * 2 - 1);
        }
        this.initBuffer();
    }
    // private initShaders() {
    //     // catalogueShaderProgram.enableProgram()
    //     // this.shaderProgram = catalogueShaderProgram.shaderProgram
    //     // const fragmentShader = ShaderManager.catalogueFS()
    //     // const vertexShader = ShaderManager.catalogueVS()
    //     const fragmentShader = this.loadShaderFromDOM('cat-shader-fs');
    //     const vertexShader = this.loadShaderFromDOM('cat-shader-vs');
    //     if (!fragmentShader || !vertexShader) {
    //         throw new Error('CatalogueGL: missing shaders in DOM (cat-shader-fs / cat-shader-vs)');
    //     }
    //     try {
    //         this.gl.attachShader(this.shaderProgram as WebGLProgram, vertexShader);
    //         this.gl.attachShader(this.shaderProgram as WebGLProgram, fragmentShader);
    //         this.gl.linkProgram(this.shaderProgram as WebGLProgram);
    //     } catch (err: any) {
    //         console.error(err?.message ?? err)
    //         console.log(this.shaderProgram)
    //         console.log(vertexShader)
    //         console.log(fragmentShader)
    //         throw new Error('Could not initialise shaders');
    //     }
    //     if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
    //         throw new Error('Could not initialise shaders');
    //     }
    //     shaderUtility.useProgram(this.shaderProgram);
    //     // Resolve locations once (stable)
    //     this.attribLocations.position = this.gl.getAttribLocation(this.shaderProgram, 'aCatPosition');
    //     this.attribLocations.hovered = this.gl.getAttribLocation(this.shaderProgram, 'a_selected');
    //     this.attribLocations.pointSize = this.gl.getAttribLocation(this.shaderProgram, 'a_pointsize');
    //     this.attribLocations.brightness = this.gl.getAttribLocation(this.shaderProgram, 'a_brightness');
    //     this.attribLocations.color = this.gl.getUniformLocation(this.shaderProgram, 'u_fragcolor');
    // }
    // private loadShaderFromDOM(shaderId: string): WebGLShader | null {
    //     let shader: WebGLShader | null = null;
    //     let shaderSource = ""
    //     if (shaderId == "cat-shader-fs") {
    //         shaderSource = ShaderManager.catalogueFS()
    //         shader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
    //     } else {
    //         shaderSource = ShaderManager.catalogueVS()
    //         shader = this.gl.createShader(this.gl.VERTEX_SHADER);
    //     }
    //     if (!shader) return null;
    //     if (shaderSource.length <= 0) return null;
    //     this.gl.shaderSource(shader, shaderSource);
    //     this.gl.compileShader(shader);
    //     if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
    //         const info = this.gl.getShaderInfoLog(shader) || 'Unknown shader compile error';
    //         this.gl.deleteShader(shader);
    //         throw new Error(info);
    //     }
    //     return shader;
    // }
    addSource(source) {
        this.sources.push(source);
    }
    /**
     * @param in_data Rows of TAP results
     * @param columnsmeta TapMetadataList (unused here because `CatalogueProps` already holds indices)
     */
    addSources(in_data, columnsmeta) {
        this.ready = false;
        const raDataIndex = this.catalogueProps.raColumn.index ?? this.catalogueProps.raColumn._index;
        const decDataIndex = this.catalogueProps.decColumn.index ?? this.catalogueProps.decColumn._index;
        for (let j = 0; j < in_data.length; j++) {
            const point = new Point({
                raDeg: in_data[j][raDataIndex],
                decDeg: in_data[j][decDataIndex]
            }, CoordsType.ASTRO);
            const source = new Source(point, in_data[j]);
            // Ensure optional fields exist
            source.shapeSize = source.shapeSize ?? 8.0;
            source.brightnessFactor = 3;
            this.addSource(source);
        }
        this.initBuffer();
        this.ready = true;
    }
    clearSources() {
        this.sources = [];
        this.hoveredIndexes = [];
        this.healpixDensityMap.clear();
        this.vertexCataloguePosition = new Float32Array(0);
    }
    extHighlightSource(source, highlighted) {
        const sIdx = this.sources.indexOf(source);
        if (sIdx < 0)
            return;
        if (highlighted) {
            if (!this.extHoveredIndexes.includes(sIdx)) {
                this.extHoveredIndexes.push(sIdx);
            }
        }
        else {
            const i = this.extHoveredIndexes.indexOf(sIdx);
            if (i >= 0)
                this.extHoveredIndexes.splice(i, 1);
        }
        // const hoveredSources = this.extHoveredIndexes.map(i => this.sources[i]);
        // session.updateHoveredSources(this, hoveredSources);
    }
    extAddSources2Selected(sources) {
        for (const s of sources) {
            const sIdx = this.sources.indexOf(s);
            if (sIdx >= 0 && !this.selectedIndexes.includes(sIdx)) {
                this.selectedIndexes.push(sIdx);
            }
        }
    }
    extRemoveSourceFromSelection(source) {
        const indexOfObject = this.sources.indexOf(source);
        if (indexOfObject < 0)
            return;
        const sidx = this.selectedIndexes.indexOf(indexOfObject);
        if (sidx >= 0)
            this.selectedIndexes.splice(sidx, 1);
        const eidx = this.extHoveredIndexes.indexOf(indexOfObject);
        if (eidx >= 0)
            this.extHoveredIndexes.splice(eidx, 1);
        // Clear hovered flag in buffer view (if present)
        if (this.vertexCataloguePosition.length >= (indexOfObject + 1) * CatalogueGL.ELEM_SIZE) {
            this.vertexCataloguePosition[indexOfObject * CatalogueGL.ELEM_SIZE + 3] = 0.0;
        }
    }
    initBuffer() {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexCataloguePositionBuffer);
        const nSources = this.sources.length;
        this.vertexCataloguePosition = new Float32Array(nSources * CatalogueGL.ELEM_SIZE);
        let positionIndex = 0;
        for (let j = 0; j < nSources; j++) {
            const currSource = this.sources[j];
            const currPix = currSource.healpixPixel;
            // density map
            const bucket = this.healpixDensityMap.get(currPix);
            if (bucket) {
                if (!bucket.includes(j))
                    bucket.push(j);
            }
            else {
                this.healpixDensityMap.set(currPix, [j]);
            }
            // position
            this.vertexCataloguePosition[positionIndex + 0] = currSource.point.x;
            this.vertexCataloguePosition[positionIndex + 1] = currSource.point.y;
            this.vertexCataloguePosition[positionIndex + 2] = currSource.point.z;
            // hovered flag
            this.vertexCataloguePosition[positionIndex + 3] = 0.0;
            // size
            this.vertexCataloguePosition[positionIndex + 4] = currSource.shapeSize ?? 8.0;
            // brightness
            this.vertexCataloguePosition[positionIndex + 5] = currSource.brightnessFactor ?? 0.0;
            positionIndex += CatalogueGL.ELEM_SIZE;
        }
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertexCataloguePosition, this.gl.STATIC_DRAW);
    }
    getSelectionRadius() {
        const order = visibleTilesManager.getVisibleOrder();
        switch (order) {
            case 0:
            case 1:
            case 2:
                return 0.005;
            case 3:
                return 0.001;
            case 4:
                return 0.0009;
            case 5:
                return 0.0005;
            case 6:
                return 0.0001;
            case 7:
                return 0.00009;
            case 8:
                return 0.00005;
            case 9:
                return 0.00001;
            default:
                return 0.000005;
        }
    }
    checkSelection(in_mouseHelper) {
        if (in_mouseHelper.x == null || in_mouseHelper.y == null || in_mouseHelper.z == null) {
            console.log('CatalogueGL.checkSelection: missing mouse coords');
            return [];
        }
        const hoveredIndexes = [];
        const sourcesHovered = [];
        const mousePix = in_mouseHelper.computeNpix();
        if (mousePix != null && this.healpixDensityMap.has(mousePix)) {
            const candidates = this.healpixDensityMap.get(mousePix);
            const selR = this.getSelectionRadius();
            for (let i = 0; i < candidates.length; i++) {
                const sourceIdx = candidates[i];
                const source = this.sources[sourceIdx];
                if (!source)
                    continue;
                const dx = source.point.x - in_mouseHelper.x;
                const dy = source.point.y - in_mouseHelper.y;
                const dz = source.point.z - in_mouseHelper.z;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                if (dist <= selR) {
                    hoveredIndexes.push(sourceIdx);
                    sourcesHovered.push(source);
                }
            }
        }
        // session.updateHoveredSources(this, sourcesHovered);
        return hoveredIndexes;
    }
    enableShader(in_mMatrix) {
        this.gl.useProgram(this.shaderProgram);
        const mvLoc = this.gl.getUniformLocation(this.shaderProgram, 'uMVMatrix');
        const projLoc = this.gl.getUniformLocation(this.shaderProgram, 'uPMatrix');
        const pMatrix = computePerspectiveMatrixSingleton.pMatrix;
        let mvMatrix = mat4.create();
        if (global.camera == null) {
            console.warn('CatalogueGL.enableShader: missing global.camera');
            return;
        }
        mvMatrix = mat4.multiply(mvMatrix, global.camera.getCameraMatrix(), in_mMatrix);
        this.gl.uniformMatrix4fv(mvLoc, false, mvMatrix);
        this.gl.uniformMatrix4fv(projLoc, false, pMatrix);
    }
    /**
     * @param in_mMatrix Model matrix the current catalogue is associated to (e.g. HiPS matrix)
     */
    draw(in_mMatrix, in_mouseHelper) {
        if (!this.ready)
            return;
        if (!global.camera)
            return;
        // this.enableShader(in_mMatrix);
        catalogueShaderProgram.enableShaders(computePerspectiveMatrixSingleton.pMatrix, in_mMatrix, global.camera.getCameraMatrix());
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexCataloguePositionBuffer);
        // positions
        this.gl.vertexAttribPointer(
        // this.attribLocations.position,
        catalogueShaderProgram.locations.position, 3, this.gl.FLOAT, false, CatalogueGL.BYTES_X_ELEM * CatalogueGL.ELEM_SIZE, 0);
        // this.gl.enableVertexAttribArray(this.attribLocations.position);
        this.gl.enableVertexAttribArray(catalogueShaderProgram.locations.position);
        // hovered flag
        this.gl.vertexAttribPointer(
        // this.attribLocations.hovered,
        catalogueShaderProgram.locations.hovered, 1, this.gl.FLOAT, false, CatalogueGL.BYTES_X_ELEM * CatalogueGL.ELEM_SIZE, CatalogueGL.BYTES_X_ELEM * 3);
        // this.gl.enableVertexAttribArray(this.attribLocations.hovered);
        this.gl.enableVertexAttribArray(catalogueShaderProgram.locations.hovered);
        // point size
        this.gl.vertexAttribPointer(
        // this.attribLocations.pointSize,
        catalogueShaderProgram.locations.pointSize, 1, this.gl.FLOAT, false, CatalogueGL.BYTES_X_ELEM * CatalogueGL.ELEM_SIZE, CatalogueGL.BYTES_X_ELEM * 4);
        // this.gl.enableVertexAttribArray(this.attribLocations.pointSize);
        this.gl.enableVertexAttribArray(catalogueShaderProgram.locations.pointSize);
        // brightness
        this.gl.vertexAttribPointer(
        // this.attribLocations.brightness,
        catalogueShaderProgram.locations.brightness, 1, this.gl.FLOAT, false, CatalogueGL.BYTES_X_ELEM * CatalogueGL.ELEM_SIZE, CatalogueGL.BYTES_X_ELEM * 5);
        // this.gl.enableVertexAttribArray(this.attribLocations.brightness);
        this.gl.enableVertexAttribArray(catalogueShaderProgram.locations.brightness);
        // color
        const rgb = colorHex2RGB(this.catalogueProps.shapeColor);
        // if (this.attribLocations.color) {
        if (catalogueShaderProgram.locations.color) {
            // this.gl.uniform4f(this.attribLocations.color, rgb[0], rgb[1], rgb[2], 1.0);
            this.gl.uniform4f(catalogueShaderProgram.locations.color, rgb[0], rgb[1], rgb[2], 1.0);
        }
        // Hover logic on mouse move
        if (in_mouseHelper != null && in_mouseHelper.xyz !== this.oldMouseCoords) {
            // clear old hovered
            for (let k = 0; k < this.hoveredIndexes.length; k++) {
                const base = this.hoveredIndexes[k] * CatalogueGL.ELEM_SIZE;
                this.vertexCataloguePosition[base + 3] = 0.0; // not hovered
                this.vertexCataloguePosition[base + 4] = this.sources[this.hoveredIndexes[k]].shapeSize; // size
            }
            this.hoveredIndexes = this.checkSelection(in_mouseHelper);
            // new hovered
            for (let i = 0; i < this.hoveredIndexes.length; i++) {
                const idx = this.hoveredIndexes[i];
                const base = idx * CatalogueGL.ELEM_SIZE;
                this.vertexCataloguePosition[base + 3] = 1.0; // hovered
                this.vertexCataloguePosition[base + 4] = this.sources[idx].shapeSize; // size
            }
        }
        // selected flags
        for (let s = 0; s < this.selectedIndexes.length; s++) {
            const idx = this.selectedIndexes[s];
            const base = idx * CatalogueGL.ELEM_SIZE;
            this.vertexCataloguePosition[base + 3] = 2.0; // selected
            this.vertexCataloguePosition[base + 4] = this.sources[idx].shapeSize; // size
        }
        // external hovered
        for (let e = 0; e < this.extHoveredIndexes.length; e++) {
            const idx = this.extHoveredIndexes[e];
            const base = idx * CatalogueGL.ELEM_SIZE;
            this.vertexCataloguePosition[base + 3] = 1.0; // hovered
            this.vertexCataloguePosition[base + 4] = this.sources[idx].shapeSize; // size
        }
        // upload buffer
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertexCataloguePosition, this.gl.STATIC_DRAW);
        // draw
        const numItems = this.vertexCataloguePosition.length / CatalogueGL.ELEM_SIZE;
        this.gl.drawArrays(this.gl.POINTS, 0, numItems);
        this.oldMouseCoords = in_mouseHelper.xyz;
    }
}
export default CatalogueGL;
//# sourceMappingURL=CatalogueGL.js.map