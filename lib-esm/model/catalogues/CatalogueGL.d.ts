import Source from '../Source.js';
import { mat4 } from 'gl-matrix';
import MouseHelper from '../../utils/MouseHelper.js';
import { MetadataManager } from '../MetadataManager.js';
import { MetadataColumn } from '../MetadataColumn.js';
type GL = WebGL2RenderingContext;
export declare class CatalogueGL {
    _kind: string;
    static ELEM_SIZE: number;
    static BYTES_X_ELEM: number;
    static STANDARD_SHAPE_SIZE: number;
    static STANDARD_SHAPE_HUE: number;
    _ready: boolean;
    _name: string;
    _description: string;
    sources: Source[];
    gl: GL;
    vertexCataloguePositionBuffer: WebGLBuffer | null;
    vertexhoveredCataloguePositionBuffer: WebGLBuffer | null;
    vertexCataloguePosition: Float32Array;
    hoveredIndexes: number[];
    selectedIndexes: number[];
    extHoveredIndexes: number[];
    _oldMouseCoords: [number, number, number] | null;
    private _metadataManager;
    _isVisible: boolean;
    _shapeColor: string;
    _healpixDensityMap: Map<number, number[]>;
    _providerUrl: string;
    constructor(catalogueName: string, catalogueDescription: string, providerUrl: string, metadataManager: MetadataManager);
    setIsVisible(visibility: boolean): void;
    get shapeColor(): string;
    get providerUrl(): string;
    get name(): string;
    get isVisible(): boolean;
    private minMax;
    get metadataManager(): MetadataManager;
    changeMetaRA(raColumnName: string): void;
    changeMetaDec(decColumnName: string): void;
    changeColor(color: string): void;
    changeMetaShapeSize(metacolumnName: string): void;
    changeMetaShapeHue(metacolumnName: string): void;
    addSource(source: Source): void;
    /**
     * @param in_data Rows of TAP results
     * @param columnsmeta TapMetadataList (unused here because `CatalogueProps` already holds indices)
     */
    addSources(in_data: any[][], columnsmeta: MetadataColumn[]): void;
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
export {};
//# sourceMappingURL=CatalogueGL.d.ts.map