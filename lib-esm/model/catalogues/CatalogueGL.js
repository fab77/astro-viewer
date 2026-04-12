import { Source } from '../Source.js';
import { Point } from '../Point.js';
import { CoordsType } from '../..//utils/CoordsType.js';
import { colorHex2RGB } from '../../utils/Utils.js';
import { CatalogueShaderProgram } from '../../shader/CatalogueShaderProgram.js';
import { MetadataManager } from '../MetadataManager.js';
export class CatalogueGL {
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
        this._catalogueShaderProgram = new CatalogueShaderProgram(this._webgl);
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
        if (metacolumnName == MetadataManager.STANDARD_SIZE) {
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
        if (metacolumnName == MetadataManager.STANDARD_HUE) {
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
        this._metadataManager = new MetadataManager(columnsmeta);
        // const raDataIndex = (this.catalogueProps.raColumn as any).index ?? (this.catalogueProps.raColumn as any)._index;
        // const decDataIndex = (this.catalogueProps.decColumn as any).index ?? (this.catalogueProps.decColumn as any)._index;
        const raDataIndex = this._metadataManager.selectedRaColumn?.index ?? -1;
        const decDataIndex = this._metadataManager.selectedDecColumn?.index ?? -1;
        if (raDataIndex < 0 || decDataIndex < 0)
            throw new Error(`(ra, dec) idx not defined (${raDataIndex}, ${decDataIndex}) `);
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
        const rgb = colorHex2RGB(this._shapeColor);
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
// export default CatalogueGL;
//# sourceMappingURL=CatalogueGL.js.map