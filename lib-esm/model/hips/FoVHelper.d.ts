declare class FoVHelper {
    getHiPSNorder(fov: number): number;
    getRADegSteps(fov: number): {
        raStep: number;
        decStep: number;
    };
    getRefOrder(order: number): number;
}
export declare const fovHelper: FoVHelper;
export default FoVHelper;
//# sourceMappingURL=FoVHelper.d.ts.map