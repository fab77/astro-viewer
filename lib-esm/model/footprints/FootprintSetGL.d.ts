import Footprint from './Footprint.js';
import FootprintProps from './FootprintProps.js';
import { mat4 } from 'gl-matrix';
import { TapRepo } from '../tap/TapRepo.js';
import TapMetadataList from '../tap/TapMetadataList.js';
import TapMetadata from '../tap/TapMetadata.js';
import MouseHelper from '../../utils/MouseHelper.js';
type GL = WebGL2RenderingContext;
export interface HoveredFootprintDetail {
    metadata: TapMetadataList;
    footprints: Footprint[];
    tableName: string;
    description: string;
    provider: string;
}
declare class FootprintSetGL {
    static ELEM_SIZE: number;
    static BYTES_X_ELEM: number;
    static CONVEXPOLY_ELEM_SIZE: number;
    ready: boolean;
    footprintsetProps: FootprintProps;
    name: string;
    description: string;
    tapRepo: TapRepo;
    extHoveredIndexes: Uint32Array;
    oldMouseCoords: any;
    healpixDensityMap: any;
    totConvexPoints: number;
    gl: GL;
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
    _isVisible: boolean;
    constructor(tablename: string, tabledesc: string, tapRepo: TapRepo, tapMetadataList: TapMetadataList);
    private initFootprintArrays;
    private initGLBuffers;
    setIsVisible(visibility: boolean): void;
    get isVisible(): boolean;
    addFootprint(in_footprint: Footprint): void;
    addFootprints(in_data: any[], columnsmeta: TapMetadata[]): void;
    clearFootprints(): void;
    private initBuffer;
    checkSelection(mouseHelper: MouseHelper): void;
    get hoveredFootprints(): HoveredFootprintDetail;
    get selectedFootprints(): Footprint[];
    highlightFootprint(footprint: Footprint, highlighted: boolean): void;
    /**
     *
     * @param {Footprint[]} footprints
     */
    addFootprint2Selected(footprints: Footprint[]): void;
    /**
     *
     * @param {Footprint} footprint
     */
    removeFootprintFromSelection(footprint: Footprint): void;
    initHoveringBuffer(): void;
    initSelectionBuffer(): void;
    draw(in_mMatrix: mat4, in_mouseHelper: MouseHelper): void;
}
export default FootprintSetGL;
//# sourceMappingURL=FootprintSetGL.d.ts.map