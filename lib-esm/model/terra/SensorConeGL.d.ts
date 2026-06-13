export interface SensorConePoint {
    readonly longitudeDeg: number;
    readonly latitudeDeg: number;
    readonly altitudeKm?: number;
}
export interface SensorConeOptions {
    readonly name: string;
    readonly color?: [number, number, number, number];
    readonly wireframe?: boolean;
    readonly filled?: boolean;
}
export type SensorConeFootprintPosition = readonly [longitudeDeg: number, latitudeDeg: number];
export declare class SensorConeGL {
    private _options;
    private _webgl;
    static readonly EARTH_RADIUS_KM = 6371;
    static readonly ELEM_SIZE = 3;
    _kind: string;
    private _lineBuffer;
    private _lineVertexCount;
    private _isVisible;
    private _shaderProgram;
    private _color;
    constructor(_options: SensorConeOptions, _webgl: WebGL2RenderingContext);
    setGeometry(apex: SensorConePoint, footprint: readonly SensorConeFootprintPosition[]): void;
    setIsVisible(isVisible: boolean): void;
    setColor(color: [number, number, number, number]): void;
    clear(): void;
    draw(pMatrix: Float32Array, vMatrix: Float32Array, baseModelMatrix: Float32Array): void;
    dispose(): void;
    private buildLineVertices;
    private uploadLineVertices;
}
