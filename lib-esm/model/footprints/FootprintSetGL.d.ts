import { Footprint } from './Footprint.js';
import MouseHelper from '../../utils/MouseHelper.js';
import { MetadataManager } from '../MetadataManager.js';
import { MetadataColumn } from '../MetadataColumn.js';
export interface HoveredFootprintDetail {
    metadata: MetadataManager;
    footprints: Footprint[];
    tableName: string;
    description: string;
    provider: string;
}
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
    _providerUrl: string;
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
    hoveredIndexes: Uint32Array;
    private _hoveredFootprints;
    hoveredVertexPosition: Float32Array;
    totHoveredPoints: number;
    nHoveredPrimitiveFlags: number;
    selectedIndexes: Uint32Array;
    private _selectedFootprints;
    selectedVertexPosition: Float32Array;
    totSelectedPoints: number;
    nSlectedPrimitiveFlags: number;
    _shapeColor: string;
    private _bufferInitialised;
    private _webgl;
    private _footprintShaderProgram;
    _isVisible: boolean;
    private _metadataManager;
    constructor(fsetName: string, fsetDescription: string, providerUrl: string, metadataManager: MetadataManager, webgl: WebGL2RenderingContext);
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
    /**
     *
     * @param {Footprint[]} footprints
     */
    /**
     *
     * @param {Footprint} footprint
     */
    initHoveringBuffer(): void;
    changeColor(color: string): void;
    draw(in_mMatrix: Float32Array, in_mouseHelper: MouseHelper, vMatrix: Float32Array, pMatrix: Float32Array): void;
}
//# sourceMappingURL=FootprintSetGL.d.ts.map