declare class FoVHelper {
    private static readonly LEVEL_HYSTERESIS;
    private static readonly HIPS_ORDER_MIN_FOV;
    getHiPSNorder(fov: number, currentOrder?: number): number;
    private getRawHiPSNorder;
    getRADegSteps(fov: number, coarse?: boolean): {
        raStep: number;
        decStep: number;
    };
    getRefOrder(order: number): number;
}
export declare const fovHelper: FoVHelper;
export default FoVHelper;
