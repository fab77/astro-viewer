import { Source } from '../Source.js';
import MouseHelper from '../../utils/MouseHelper.js';
import { CatalogueShaderProgram } from '../../shader/CatalogueShaderProgram.js';
import { MetadataManager } from '../MetadataManager.js';
import { MetadataColumn } from '../MetadataColumn.js';
import { VisibleTilesManager } from '../hips/VisibleTilesManager.js';
export declare class CatalogueGL {
    _kind: string;
    static ELEM_SIZE: number;
    static BYTES_X_ELEM: number;
    static STANDARD_SHAPE_SIZE: number;
    static STANDARD_SHAPE_HUE: number;
    _ready: boolean;
    _name: string;
    _description: string;
    _sources: Source[];
    vertexCataloguePositionBuffer: WebGLBuffer | null;
    vertexhoveredCataloguePositionBuffer: WebGLBuffer | null;
    vertexCataloguePosition: Float32Array;
    private _bufferInitialised;
    private _webgl;
    hoveredIndexes: number[];
    selectedIndexes: number[];
    extHoveredIndexes: number[];
    _oldMouseCoords: [number, number, number] | null;
    private _metadataManager;
    _isVisible: boolean;
    _shapeColor: string;
    _healpixDensityMap: Map<number, number[]>;
    _providerUrl: string;
    _catalogueShaderProgram: CatalogueShaderProgram;
    private _visibleTilesManager;
    constructor(catalogueName: string, catalogueDescription: string, providerUrl: string, metadataManager: MetadataManager, webgl: WebGL2RenderingContext, visibleTilesManager: VisibleTilesManager);
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
    get sources(): Source[];
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
    private checkClicking;
    private setSelectedIndexes;
    /**
     * Run click-picking and update selection with the nearest candidate in current pixel.
     * Returns the selected source or null if no source was hit.
     */
    selectPrimarySourceFromClick(in_mouseHelper: MouseHelper): Source | null;
    getPrimaryHoveredSource(): Source | null;
    private checkHovering;
    /**
     * @param in_mMatrix Model matrix the current catalogue is associated to (e.g. HiPS matrix)
     */
    draw(in_mMatrix: Float32Array, in_mouseHelper: MouseHelper, vMatrix: Float32Array, pMatrix: Float32Array): void;
}
//# sourceMappingURL=CatalogueGL.d.ts.map