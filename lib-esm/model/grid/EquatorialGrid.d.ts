import type { GridLabelContainers } from './GridTextHelper.js';
import { HealpixGrid } from './HealpixGrid.js';
import { AbstractSkyEntity, SkyEntityDrawInput } from '../AbstractSkyEntity.js';
/** Equatorial grid rendered as RA/Dec great-circle line loops */
export declare class EquatorialGrid extends AbstractSkyEntity {
    static ELEM_SIZE: number;
    static BYTES_X_ELEM: number;
    private showGrid;
    private _shaderProgram;
    private _vertexShader;
    private _fragmentShader;
    private defaultColor;
    private gridText;
    private _attribLocations;
    private _phiVertexPositionBuffer;
    private _thetaVertexPositionBuffer;
    private _fov;
    private _phiStep;
    private _phiStepRad;
    private _thetaStep;
    private _thetaStepRad;
    private _phiArray;
    private _thetaArray;
    private _bufferKey;
    private _dec4Labels;
    private _ra4Labels;
    private _healpixGrid;
    /**
     * @param radius Not used by current implementation (sphere is unit-radius)
     * @param fov    Field of view in degrees
     */
    constructor(webgl: WebGL2RenderingContext, healpixGrid: HealpixGrid, gridLabelContainers?: GridLabelContainers);
    init(fov: number): void;
    /** Compile/link shaders and fetch uniform/attribute locations */
    private initShaders;
    /** Build RA/Dec line vertex arrays based on FoV step helper */
    private initBuffers;
    /** Update buffers when FoV (in degrees) changes */
    refresh(fovDeg: number, coarse?: boolean): void;
    private vectorDistance;
    private enableShader;
    isVisible(): boolean;
    toggleShowGrid(): void;
    /**
     * @param mMatrix model matrix associated with current HiPS (or scene) transform
     * @param fovObj  current field-of-view (degrees). If your FoV type differs,
     *                pass the numeric value here; this signature matches original usage.
     */
    draw(input: SkyEntityDrawInput): void;
}
