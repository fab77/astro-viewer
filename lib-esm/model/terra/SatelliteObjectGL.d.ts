export interface SatelliteObjectOptions {
    readonly name: string;
    readonly objUrl: string;
    readonly color?: [number, number, number, number];
    readonly scale?: number;
}
export interface SatelliteObjectPosition {
    readonly longitudeDeg: number;
    readonly latitudeDeg: number;
    readonly altitudeKm?: number;
}
export declare class SatelliteObjectGL {
    private _options;
    private _webgl;
    static readonly EARTH_RADIUS_KM = 6371;
    _kind: string;
    private _gpuMesh;
    private _shaderProgram;
    private _modelMatrix;
    private _isVisible;
    private _ready;
    private _loading;
    private _failed;
    private _color;
    private _scale;
    constructor(_options: SatelliteObjectOptions, _webgl: WebGL2RenderingContext);
    get ready(): boolean;
    get loading(): boolean;
    get failed(): boolean;
    load(): Promise<void>;
    setIsVisible(isVisible: boolean): void;
    setColor(color: [number, number, number, number]): void;
    setScale(scale: number): void;
    setPosition(position: SatelliteObjectPosition, previous?: SatelliteObjectPosition | null, next?: SatelliteObjectPosition | null): void;
    draw(pMatrix: Float32Array, vMatrix: Float32Array, baseModelMatrix: Float32Array): void;
    dispose(): void;
    private computeForward;
    private localEastFallback;
    private setFallbackMatrix;
    private setMatrixFromBasis;
    private uploadMesh;
}
