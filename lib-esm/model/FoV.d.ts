export declare class FoV {
    fovXDeg: number;
    private fovYDeg;
    private _minFoV;
    constructor();
    /** Recomputes FoV for current camera + projection */
    getFoV(insideSphere: boolean): this;
    changeMinFov(deg: number): void;
    /** FoV half-screen chord angle doubled (deg) along a given canvas axis */
    private computeAngle;
    /**
   * Computes the camera position (x,y,z) along the current view direction that would
   * yield the requested minFoV (in degrees), assuming the camera is OUTSIDE the sphere.
   * This method does NOT mutate the camera; it only returns the suggested position.
   *
   * Geometry: for a sphere of radius R observed from distance d (from center),
   * the apparent angular diameter is 2*arcsin(R/d). Our minFoV is that angular diameter
   * along the tighter axis; we solve for d and place the camera on the current
   * center→camera direction with that distance.
   *
   * @param targetMinFoVDeg Desired min FoV in degrees, 0 < targetMinFoVDeg < 180
   * @returns Tuple [x, y, z] for the recommended camera position in world coordinates.
   */
    computeCameraPositionForMinFoV(targetMinFoVDeg: number): [number, number, number];
    get minFoV(): number;
}
//# sourceMappingURL=FoV.d.ts.map