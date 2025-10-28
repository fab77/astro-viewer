import global from '../../Global.js';
import CatalogueProps from './CatalogueProps.js';
import Source from '../Source.js';
import Point from '../Point.js';
import { visibleTilesManager } from '../hips/VisibleTilesManager.js';
import CoordsType from '../..//utils/CoordsType.js';
import { colorHex2RGB } from '../../utils/Utils.js';
import computePerspectiveMatrixSingleton from '../../utils/ComputePerspectiveMatrix.js';
import { catalogueShaderProgram } from '../../shader/CatalogueShaderProgram.js';
// `Source` is assumed to expose at least these:
export class CatalogueGL {
    static ELEM_SIZE;
    static BYTES_X_ELEM;
    static STANDARD_SHAPE_SIZE = 8.0;
    static STANDARD_SHAPE_HUE = 3.0;
    // Core state
    ready;
    catalogueProps;
    name;
    description;
    tapRepo;
    // Data
    sources;
    gl;
    // shaderProgram: WebGLProgram;
    // Buffers & arrays
    vertexCataloguePositionBuffer;
    vertexhoveredCataloguePositionBuffer;
    vertexCataloguePosition;
    // Index/selection bookkeeping
    hoveredIndexes;
    selectedIndexes;
    extHoveredIndexes;
    oldMouseCoords;
    _isVisible = true;
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
        this.vertexCataloguePositionBuffer = this.gl.createBuffer();
        this.vertexhoveredCataloguePositionBuffer = this.gl.createBuffer();
        this.vertexCataloguePosition = new Float32Array(0);
        this.hoveredIndexes = [];
        this.selectedIndexes = [];
        this.extHoveredIndexes = [];
        this.oldMouseCoords = null;
        this.healpixDensityMap = new Map();
        const defaultColor = '#8F00FF';
        this.catalogueProps = new CatalogueProps(tapMetadataList, defaultColor);
        // call catalogueShaderProgram to init shaders if they are not yet initialised 
        catalogueShaderProgram.shaderProgram;
        this._isVisible = true;
    }
    setIsVisible(visibility) {
        this._isVisible = visibility;
    }
    get isVisible() {
        return this._isVisible;
    }
    minMax(columnindex) {
        if (!this.sources.length)
            return { min: 0, max: 0 };
        let min = this.sources[0].details[columnindex];
        if (isNaN(Number(min))) {
            // console.warn(`${this.catalogueProps.tapMetadataList.metadataList[columnindex].name} doesn't contain number only values`)
            console.warn(`${this.catalogueProps.tapMetadataList.metadataList[columnindex].name} doesn't contain only number values`);
            return { min: 0, max: 0 };
        }
        let max = min;
        for (const source of this.sources) {
            const v = source.details[columnindex];
            if (isNaN(Number(v))) {
                console.warn(`${this.catalogueProps.tapMetadataList.metadataList[columnindex].name} doesn't contain number only values`);
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
    changeCatalogueMetaShapeSize(metacolumnName) {
        if (metacolumnName == CatalogueProps.STANDARD_SIZE) {
            this.catalogueProps.resetCatalogueMetaShapeSize();
            for (const source of this.sources) {
                const size = CatalogueGL.STANDARD_SHAPE_SIZE;
                source.shapeSize = size;
            }
            this.initBuffer();
            return;
        }
        const oldShapeSizeName = this.catalogueProps.shapeSizeColumn?.name;
        this.catalogueProps.changeCatalogueMetaShapeSize(metacolumnName);
        const idx = this.catalogueProps.shapeSizeColumn?.index ?? this.catalogueProps.shapeSizeColumn?.index;
        if (idx == null) {
            if (oldShapeSizeName)
                this.catalogueProps.changeCatalogueMetaShapeSize(oldShapeSizeName);
            return;
        }
        const minmax = this.minMax(idx);
        if (minmax.min == minmax.max) {
            console.warn(`${minmax} min and max are equals. No resizing will be applied.`);
            return;
        }
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
        if (metacolumnName == CatalogueProps.STANDARD_SIZE) {
            this.catalogueProps.resetCatalogueMetaShapeHue();
            for (const source of this.sources) {
                const hue = CatalogueGL.STANDARD_SHAPE_HUE;
                source.brightnessFactor = hue;
            }
            this.initBuffer();
            return;
        }
        const oldHueSizeName = this.catalogueProps.shapeHueColumn?.name;
        this.catalogueProps.changeCatalogueMetaShapeHue(metacolumnName);
        const idx = this.catalogueProps.shapeHueColumn?.index ?? this.catalogueProps.shapeHueColumn?.index;
        if (idx == null) {
            if (oldHueSizeName)
                this.catalogueProps.changeCatalogueMetaShapeHue(oldHueSizeName);
            return;
        }
        const minmax = this.minMax(idx);
        if (minmax.min == minmax.max) {
            console.warn(`${minmax} min and max are equals. No resizing will be applied.`);
            return;
        }
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
    addSource(source) {
        this.sources.push(source);
    }
    /**
     * @param in_data Rows of TAP results
     * @param columnsmeta TapMetadataList (unused here because `CatalogueProps` already holds indices)
     */
    addSources(in_data, columnsmeta) {
        this.ready = false;
        this.sources = [];
        const raDataIndex = this.catalogueProps.raColumn.index ?? this.catalogueProps.raColumn._index;
        const decDataIndex = this.catalogueProps.decColumn.index ?? this.catalogueProps.decColumn._index;
        for (let j = 0; j < in_data.length; j++) {
            const point = new Point({
                raDeg: in_data[j][raDataIndex],
                decDeg: in_data[j][decDataIndex]
            }, CoordsType.ASTRO);
            const source = new Source(point, in_data[j]);
            // Ensure optional fields exist
            source.shapeSize = source.shapeSize ?? CatalogueGL.STANDARD_SHAPE_SIZE;
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
            this.vertexCataloguePosition[positionIndex + 4] = currSource.shapeSize ?? CatalogueGL.STANDARD_SHAPE_SIZE;
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
    /**
     * @param in_mMatrix Model matrix the current catalogue is associated to (e.g. HiPS matrix)
     */
    draw(in_mMatrix, in_mouseHelper) {
        if (!this.isVisible)
            return;
        if (!this.ready)
            return;
        if (!global.camera)
            return;
        catalogueShaderProgram.enableShaders(computePerspectiveMatrixSingleton.pMatrix, in_mMatrix, global.camera.getCameraMatrix());
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexCataloguePositionBuffer);
        // positions
        this.gl.vertexAttribPointer(catalogueShaderProgram.locations.position, 3, this.gl.FLOAT, false, CatalogueGL.BYTES_X_ELEM * CatalogueGL.ELEM_SIZE, 0);
        this.gl.enableVertexAttribArray(catalogueShaderProgram.locations.position);
        // hovered flag
        this.gl.vertexAttribPointer(catalogueShaderProgram.locations.hovered, 1, this.gl.FLOAT, false, CatalogueGL.BYTES_X_ELEM * CatalogueGL.ELEM_SIZE, CatalogueGL.BYTES_X_ELEM * 3);
        this.gl.enableVertexAttribArray(catalogueShaderProgram.locations.hovered);
        // point size
        this.gl.vertexAttribPointer(catalogueShaderProgram.locations.pointSize, 1, this.gl.FLOAT, false, CatalogueGL.BYTES_X_ELEM * CatalogueGL.ELEM_SIZE, CatalogueGL.BYTES_X_ELEM * 4);
        this.gl.enableVertexAttribArray(catalogueShaderProgram.locations.pointSize);
        // brightness
        this.gl.vertexAttribPointer(catalogueShaderProgram.locations.brightness, 1, this.gl.FLOAT, false, CatalogueGL.BYTES_X_ELEM * CatalogueGL.ELEM_SIZE, CatalogueGL.BYTES_X_ELEM * 5);
        this.gl.enableVertexAttribArray(catalogueShaderProgram.locations.brightness);
        // color
        const rgb = colorHex2RGB(this.catalogueProps.shapeColor);
        if (catalogueShaderProgram.locations.color) {
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
// export default CatalogueGL;
//# sourceMappingURL=CatalogueGL.js.map