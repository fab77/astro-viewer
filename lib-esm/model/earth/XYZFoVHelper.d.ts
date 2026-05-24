declare class XYZFoVHelper {
    private static readonly LEVEL_HYSTERESIS;
    private static readonly ZOOM_MIN_FOV;
    getZoom(fov: number, currentZoom?: number): number;
    private getRawZoom;
    getLonLatSteps(fov: number, coarse?: boolean): {
        lonStep: number;
        latStep: number;
    };
}
export declare const xyzFovHelper: XYZFoVHelper;
export default XYZFoVHelper;
