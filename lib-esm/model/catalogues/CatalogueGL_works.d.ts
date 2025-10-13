import CatalogueProps from './CatalogueProps.js';
import Source from '../Source.js';
import { mat4 } from 'gl-matrix';
import MouseHelper from '../../utils/MouseHelper.js';
import { TapRepo } from '../tap/TapRepo.js';
import TapMetadataList from '../tap/TapMetadataList.js';
type GL = WebGL2RenderingContext;
declare class CatalogueGL {
    static ELEM_SIZE: number;
    static BYTES_X_ELEM: number;
    ready: boolean;
    catalogueProps: CatalogueProps;
    name: string;
    description: string;
    tapRepo: TapRepo;
    sources: Source[];
    attribLocations: {
        position: number;
        hovered: number;
        pointSize: number;
        color: WebGLUniformLocation | null;
        brightness: number;
    };
    gl: GL;
    shaderProgram: WebGLProgram;
    vertexCataloguePositionBuffer: WebGLBuffer | null;
    vertexhoveredCataloguePositionBuffer: WebGLBuffer | null;
    vertexCataloguePosition: Float32Array;
    hoveredIndexes: number[];
    selectedIndexes: number[];
    extHoveredIndexes: number[];
    oldMouseCoords: [number, number, number] | null;
    healpixDensityMap: Map<number, number[]>;
    /**
     * @param tablename - String
     * @param tabledesc - String
     * @param tapRepo   - Object with `_tapBaseURL`
     * @param tapMetadataList - TapMetadataList (as used by CatalogueProps)
     */
    constructor(tablename: string, tabledesc: string, provider: TapRepo, tapMetadataList: TapMetadataList);
    private minMax;
    changeCatalogueMetaShapeSize(metacolumnName: string): void;
    changeCatalogueMetaShapeHue(metacolumnName: string): void;
    private initShaders;
    private loadShaderFromDOM;
    addSource(source: Source): void;
    /**
     * @param in_data Rows of TAP results
     * @param columnsmeta TapMetadataList (unused here because `CatalogueProps` already holds indices)
     */
    addSources(in_data: any[][], columnsmeta: any): void;
    clearSources(): void;
    extHighlightSource(source: Source, highlighted: boolean): void;
    extAddSources2Selected(sources: Source[]): void;
    extRemoveSourceFromSelection(source: Source): void;
    private initBuffer;
    private getSelectionRadius;
    private checkSelection;
    private enableShader;
    /**
     * @param in_mMatrix Model matrix the current catalogue is associated to (e.g. HiPS matrix)
     */
    draw(in_mMatrix: mat4, in_mouseHelper: MouseHelper): void;
}
export default CatalogueGL;
//# sourceMappingURL=CatalogueGL_works.d.ts.map