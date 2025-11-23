/**
 * @author Fabrizio Giordano (Fab)
 */
import { Point } from '../model/Point.js';
import { ReadonlyMat4 } from 'gl-matrix';
import Camera from '../Camera.js';
import { AbstractSkyEntity } from '../model/AbstractSkyEntity.js';
import { HealpixGrid } from '../model/grid/HealpixGrid.js';
export declare class FoVUtils {
    /**
     * Return the minimum FoV value between `_fovY_deg` and `_fovX_deg`.
     * (Kept here for parity; this class doesn’t maintain those fields.)
     */
    getMinFoV(this: {
        _fovY_deg: number;
        _fovX_deg: number;
    }): number;
    /**
     * Compute the FoV polygon as a list of Points (clockwise).
     * Uses ray picking + frustum planes against a unit sphere.
     */
    static getFoVPolygon(camera: Camera, canvas: HTMLCanvasElement, model: AbstractSkyEntity, healpixGrid: HealpixGrid, webgl: WebGL2RenderingContext): Point[];
    /**
     * Ray pick against 8 key screen positions (corners + midpoints).
     * Returns Points in clockwise order starting from top-left.
     */
    static getScreenCornersIntersection(pMatrix: ReadonlyMat4, camera: Camera, canvas: HTMLCanvasElement, healpixGrid: HealpixGrid, webgl: WebGL2RenderingContext): Point[];
    /** Returns the center point (in J2000) of the current view as a `Point`. */
    static getCenterJ2000(canvas: HTMLCanvasElement, healpixGrid: HealpixGrid, webgl: WebGL2RenderingContext, camera: Camera): Point;
    /** Middle point on the unit sphere along the arc between two 3D points. */
    static computeMiddlePoint(p1: Point, p2: Point): Point[];
    /**
     * Nearest intersection point between a frustum plane and the unit sphere,
     * using the plane normal.
     */
    static getNearestSpherePoint(plane: number[]): Point[];
    /**
     * Intersections between a frustum plane and the unit sphere,
     * computed via two perpendicular planes.
     * Returns two points (first from `plane4Circle_1`, second from `plane4Circle_2`).
     */
    static getFrustumIntersectionWithSphere(_M: ReadonlyMat4, plane4Sphere: number[], plane4Circle_1: number[], plane4Circle_2: number[]): Point[];
    /** Build ADQL string from an array of Points (ra,dec pairs). */
    static getAstroFoVPolygon(points: Point[]): string;
}
//# sourceMappingURL=FoVUtils.d.ts.map