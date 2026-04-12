import { Point } from "../model/Point.js";
import Point2D from "../model/Point2D.js";
type ProjectionFlag = 0 | 1 | 2;
export interface SelectionObj {
    poly4selection: Point2D[][];
    flag: ProjectionFlag;
    maxx: number;
    maxy: number;
    minx: number;
    miny: number;
}
declare class GeomUtils {
    static orthodromicDistance(p1: Point, p2: Point): number;
    /**
     * Decide the 2D projection strategy and pre-project polygons for point-in-polygon tests.
     * Returns the projected polygons + bbox + a flag describing the projection used:
     * 0 → all points in same hemisphere with |Dec| > 10 → stereographic-like projection using x,y from 3D
     * 1 → all points in equatorial belt (|Dec| < 10) → use RA/Dec directly
     * 2 → equatorial belt and polygon crosses RA=0 → shift RA>180 by -360
     */
    static computeSelectionObject(polygons: Point[][]): SelectionObj;
    /** Stereographic projection from 3D point on unit sphere onto plane */
    static stereographic(point: Point): {
        x: number;
        y: number;
    };
    static projectIn2D(point: Point): Point2D;
    /**
     * Robust point-in-polygon (ray casting) using the precomputed selection object.
     * Works with any of the three flags (0,1,2).
     */
    static checkPointInsidePolygon5(selectionObj: SelectionObj, point: Point): boolean;
    static checkPointInsidePolygon4(polygons: Point[][], point: Point): boolean;
}
export default GeomUtils;
//# sourceMappingURL=GeomUtils.d.ts.map