import { HealpixGridSingleton } from './grid/HealpixGridSingleton.js';
export declare class FoV {
    private fovXDeg;
    private fovYDeg;
    private ratio;
    private _minFoV;
    private _webgl;
    constructor(webgl: WebGL2RenderingContext);
    /** Recomputes FoV for current camera + projection */
    getFoV(insideSphere: boolean, healpixGridSingleton: HealpixGridSingleton, webgl: WebGL2RenderingContext): FoV;
    private computeRatio;
    changeMinFov(deg: number): void;
    get minFoV(): number;
    computeDistanceFromAngle(angleDeg: number): number;
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
    /**
       * Computes the camera world-space position required to achieve a target FoV (deg),
       * keeping the same viewing direction. Acts as the inverse of computeAngle().
       *
       * @param targetFoVDeg desired full FoV angle in degrees (0 < FoV < 180)
       * @param canvasWidth  canvas width in pixels
       * @param canvasHeight canvas height in pixels
       * @returns [x, y, z] coordinates for the new camera position
       */
    computeCameraPositionForFoV(targetFoVDeg: number): [number, number, number];
    /**
   * Return a camera position such that the sphere's apparent angular diameter
   * (the silhouette, not the surface coverage) equals targetAngularDiameterDeg.
   * Keeps current view direction; does not mutate the camera.
   *
   * @param targetAngularDiameterDeg desired apparent diameter in degrees (0<α<180)
   * @returns [x,y,z] world position
   */
    computeCameraPositionForAngularDiameter(targetAngularDiameterDeg: number): [number, number, number];
}
//# sourceMappingURL=FoV.d.ts.map