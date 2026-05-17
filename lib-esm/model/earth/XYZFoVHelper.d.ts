declare class XYZFoVHelper {
    getZoom(fov: number): number;
    getLonLatSteps(fov: number): {
        lonStep: number;
        latStep: number;
    };
}
export declare const xyzFovHelper: XYZFoVHelper;
export default XYZFoVHelper;
