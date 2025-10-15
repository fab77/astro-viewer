import CatalogueProps from './CatalogueProps.js';
import Source from '../Source.js';
import { mat4 } from 'gl-matrix';
import MouseHelper from '../../utils/MouseHelper.js';
import { TapRepo } from '../tap/TapRepo.js';
import TapMetadataList from '../tap/TapMetadataList.js';
import TapMetadata from '../tap/TapMetadata.js';
type GL = WebGL2RenderingContext;
declare class CatalogueGL {
    static ELEM_SIZE: number;
    static BYTES_X_ELEM: number;
    static STANDARD_SHAPE_SIZE: number;
    static STANDARD_SHAPE_HUE: number;
    ready: boolean;
    catalogueProps: CatalogueProps;
    name: string;
    description: string;
    tapRepo: TapRepo;
    sources: Source[];
    gl: GL;
    vertexCataloguePositionBuffer: WebGLBuffer | null;
    vertexhoveredCataloguePositionBuffer: WebGLBuffer | null;
    vertexCataloguePosition: Float32Array;
    hoveredIndexes: number[];
    selectedIndexes: number[];
    extHoveredIndexes: number[];
    oldMouseCoords: [number, number, number] | null;
    _isVisible: boolean;
    healpixDensityMap: Map<number, number[]>;
    /**
     * @param tablename - String
     * @param tabledesc - String
     * @param tapRepo   - Object with `_tapBaseURL`
     * @param tapMetadataList - TapMetadataList (as used by CatalogueProps)
     */
    constructor(tablename: string, tabledesc: string, provider: TapRepo, tapMetadataList: TapMetadataList);
    setIsVisible(visibility: boolean): void;
    get isVisible(): boolean;
    private minMax;
    changeCatalogueMetaShapeSize(metacolumnName: string): void;
    changeCatalogueMetaShapeHue(metacolumnName: string): void;
    addSource(source: Source): void;
    /**
     * @param in_data Rows of TAP results
     * @param columnsmeta TapMetadataList (unused here because `CatalogueProps` already holds indices)
     */
    addSources(in_data: any[][], columnsmeta: TapMetadata[]): void;
    clearSources(): void;
    extHighlightSource(source: Source, highlighted: boolean): void;
    extAddSources2Selected(sources: Source[]): void;
    extRemoveSourceFromSelection(source: Source): void;
    private initBuffer;
    private getSelectionRadius;
    private checkSelection;
    /**
     * @param in_mMatrix Model matrix the current catalogue is associated to (e.g. HiPS matrix)
     */
    draw(in_mMatrix: mat4, in_mouseHelper: MouseHelper): void;
}
export default CatalogueGL;
//# sourceMappingURL=CatalogueGL.d.ts.map