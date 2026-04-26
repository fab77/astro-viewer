import { Footprint } from "./Footprint.js";
import MouseHelper from "../../utils/MouseHelper.js";
import { MetadataManager } from "../MetadataManager.js";
import { MetadataColumn } from "../MetadataColumn.js";
import { VisibleTilesManager } from "../hips/VisibleTilesManager.js";
export interface HoveredFootprintDetail {
    metadata: MetadataManager;
    footprints: Footprint[];
    tableName: string;
    description: string;
    provider: string;
}
export type ClickedFootprintState = {
    footprint: Footprint;
    selected: boolean;
};
export type FootprintPickResult = {
    footprints: Footprint[];
    pickedIndexes: number[];
};
export type FootprintClickResult = {
    footprints: Footprint[];
    selectionState: ClickedFootprintState[];
};
export declare class FootprintSetGL {
    static ELEM_SIZE: number;
    static BYTES_X_ELEM: number;
    static CONVEXPOLY_ELEM_SIZE: number;
    _kind: string;
    _ready: boolean;
    _name: string;
    _description: string;
    extHoveredIndexes: Uint32Array;
    oldMouseCoords: any;
    healpixDensityMap: any;
    totConvexPoints: number;
    vertexCataloguePositionBuffer: WebGLBuffer;
    indexBuffer: WebGLBuffer;
    hoveredVertexPositionBuffer: WebGLBuffer;
    hoveredIndexBuffer: WebGLBuffer;
    selectedVertexPositionBuffer: WebGLBuffer;
    selectedIndexBuffer: WebGLBuffer;
    indexes: Uint32Array;
    footprintPolygons: Footprint[];
    vertexCataloguePosition: Float32Array;
    totPoints: number;
    nPrimitiveFlags: number;
    hoveredIndexes: number[];
    hoveredElementIndexes: Uint32Array;
    private _hoveredFootprints;
    hoveredVertexPosition: Float32Array;
    totHoveredPoints: number;
    nHoveredPrimitiveFlags: number;
    selectedIndexes: number[];
    selectedElementIndexes: Uint32Array;
    private _selectedFootprints;
    selectedVertexPosition: Float32Array;
    totSelectedPoints: number;
    nSlectedPrimitiveFlags: number;
    _shapeColor: string;
    private _bufferInitialised;
    private _webgl;
    _isVisible: boolean;
    private _metadataManager;
    _providerUrl: string;
    private _footprintShaderProgram;
    private _visibleTilesManager;
    constructor(fsetName: string, fsetDescription: string, providerUrl: string, metadataManager: MetadataManager, webgl: WebGL2RenderingContext, visibleTilesManager: VisibleTilesManager);
    private initFootprintArrays;
    private initGLBuffers;
    setIsVisible(visibility: boolean): void;
    get isVisible(): boolean;
    get shapeColor(): string;
    get providerUrl(): string;
    get name(): string;
    get metadataManager(): MetadataManager;
    addFootprint(in_footprint: Footprint): void;
    addFootprints(in_data: any[], columnsmeta: MetadataColumn[]): void;
    clearFootprints(): void;
    private initBuffer;
    checkSelection(mouseHelper: MouseHelper): void;
    get hoveredFootprints(): HoveredFootprintDetail;
    get selectedFootprints(): Footprint[];
    private checkClicking;
    private setSelectedIndexes;
    private refreshSelectedFootprints;
    getFootprintsFromPointer(in_mouseHelper: MouseHelper): FootprintPickResult | null;
    selectPrimaryFootprintFromClick(in_mouseHelper: MouseHelper): FootprintClickResult | null;
    /**
     *
     * @param {Footprint[]} footprints
     */
    /**
     *
     * @param {Footprint} footprint
     */
    private FootprintPolygonMatches;
    private findFootprintPolygonIndex;
    extHighlightFootprint(footprint: Footprint, highlighted: boolean): void;
    extAddPolygons2Selected(footprint: Footprint): void;
    initHoveringBuffer(): void;
    initSelectionBuffer(): void;
    changeColor(color: string): void;
    draw(in_mMatrix: Float32Array, in_mouseHelper: MouseHelper, vMatrix: Float32Array, pMatrix: Float32Array): void;
}
