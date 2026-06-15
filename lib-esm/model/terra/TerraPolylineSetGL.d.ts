import MouseHelper from '../../utils/MouseHelper.js';
import { MetadataManager } from '../MetadataManager.js';
import { VisibleTilesManager } from '../hips/VisibleTilesManager.js';
export interface TerraPolylinePoint {
    readonly longitudeDeg: number;
    readonly latitudeDeg: number;
    readonly altitudeKm?: number;
    readonly timestamp?: Date | string;
}
export interface TerraPolylineMetadata {
    readonly name?: string;
    readonly [key: string]: unknown;
}
export declare class TerraPolylineSetGL {
    private _name;
    private _description;
    private _providerUrl;
    private _metadataManager;
    private _webgl;
    private _visibleTilesManager;
    static ELEM_SIZE: number;
    static BYTES_X_ELEM: number;
    _kind: string;
    _isVisible: boolean;
    _ready: boolean;
    private _shapeColor;
    private _bufferInitialised;
    private paths;
    private renderSegments;
    private _polylineShaderProgram;
    constructor(_name: string, _description: string, _providerUrl: string, _metadataManager: MetadataManager, _webgl: WebGL2RenderingContext, _visibleTilesManager: VisibleTilesManager);
    addPath(points: readonly TerraPolylinePoint[], metadata?: TerraPolylineMetadata): void;
    addGroundTrack(points: readonly TerraPolylinePoint[], metadata?: TerraPolylineMetadata): void;
    clearPaths(): void;
    setIsVisible(isVisible: boolean): void;
    get isVisible(): boolean;
    changeColor(color: string): void;
    dispose(): void;
    draw(in_mMatrix: Float32Array, _in_mouseHelper: MouseHelper, vMatrix: Float32Array, pMatrix: Float32Array): void;
    private initBuffers;
    private buildRenderSegments;
    private splitPath;
    private disposeBuffers;
}
