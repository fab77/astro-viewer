declare class FoV {
    private static _instance;
    fovXDeg: number;
    fovYDeg: number;
    private _minFoV;
    prevMinFoV: number;
    constructor();
    static get instance(): FoV;
    /** Recomputes FoV for current camera + projection */
    getFoV(insideSphere?: boolean): this;
    /** FoV half-screen chord angle doubled (deg) along a given canvas axis */
    private computeAngle;
    get minFoV(): number;
}
export default FoV;
//# sourceMappingURL=FoV.d.ts.map