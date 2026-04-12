import { Point } from "../model/Point.js";
import Point2D from "../model/Point2D.js";
import { CoordsType } from "./CoordsType.js";
class GeomUtils {
    // Orthodromic (great-circle) distance in radians
    static orthodromicDistance(p1, p2) {
        return Math.acos(Math.sin(p1.decDeg * Math.PI / 180) * Math.sin(p2.decDeg * Math.PI / 180) +
            Math.cos(p1.decDeg * Math.PI / 180) * Math.cos(p2.decDeg * Math.PI / 180) *
                Math.cos((p2.raDeg - p1.raDeg) * Math.PI / 180));
    }
    /**
     * Decide the 2D projection strategy and pre-project polygons for point-in-polygon tests.
     * Returns the projected polygons + bbox + a flag describing the projection used:
     * 0 → all points in same hemisphere with |Dec| > 10 → stereographic-like projection using x,y from 3D
     * 1 → all points in equatorial belt (|Dec| < 10) → use RA/Dec directly
     * 2 → equatorial belt and polygon crosses RA=0 → shift RA>180 by -360
     */
    static computeSelectionObject(polygons) {
        let poly4selection = [];
        let flag = 0;
        let maxx;
        let maxy;
        let minx;
        let miny;
        const DEC_THRESHOLD = 10;
        //  1 → northern hemisphere (Dec > +10), -1 → southern (Dec < -10), 0 → equatorial belt
        let hemisphere = 0;
        if (polygons[0][0].decDeg >= DEC_THRESHOLD) {
            hemisphere = 1;
        }
        else if (polygons[0][0].decDeg <= -DEC_THRESHOLD) {
            hemisphere = -1;
        }
        else {
            flag = 1;
        }
        // Case flag = 0 → stereographic-like projection using x,y,z from 3D point
        if (flag === 0) {
            const first = GeomUtils.projectIn2D(polygons[0][0]);
            maxx = minx = first.x;
            maxy = miny = first.y;
            for (const currpoly of polygons) {
                const selpoly = [];
                for (const point of currpoly) {
                    // If a point violates the hemisphere constraint, fall back to belt logic
                    if ((point.decDeg > hemisphere * DEC_THRESHOLD && hemisphere === -1) ||
                        (point.decDeg < hemisphere * DEC_THRESHOLD && hemisphere === 1)) {
                        flag = 1;
                        poly4selection = [];
                        break;
                    }
                    const p = GeomUtils.projectIn2D(point);
                    selpoly.push(p);
                    if (p.x > maxx)
                        maxx = p.x;
                    if (p.y > maxy)
                        maxy = p.y;
                    if (p.x < minx)
                        minx = p.x;
                    if (p.y < miny)
                        miny = p.y;
                }
                poly4selection.push(selpoly);
            }
        }
        if (flag === 0) {
            return {
                poly4selection,
                flag,
                maxx: maxx,
                maxy: maxy,
                minx: minx,
                miny: miny,
            };
        }
        // Case flag = 1 or 2 → work directly in (RA,Dec)
        const RA_THRESHOLD = 180;
        let belowThreshold = polygons[0][0].raDeg < RA_THRESHOLD;
        maxx = minx = polygons[0][0].raDeg;
        maxy = miny = polygons[0][0].decDeg;
        for (const currpoly of polygons) {
            const selpoly = [];
            for (const point of currpoly) {
                const p = new Point2D(point.raDeg, point.decDeg);
                selpoly.push(p);
                if (point.raDeg > maxx)
                    maxx = point.raDeg;
                if (point.decDeg > maxy)
                    maxy = point.decDeg;
                if (point.raDeg < minx)
                    minx = point.raDeg;
                if (point.decDeg < miny)
                    miny = point.decDeg;
                // Detect crossing of RA=0 meridian
                if ((point.raDeg >= RA_THRESHOLD && belowThreshold) ||
                    (point.raDeg <= RA_THRESHOLD && !belowThreshold)) {
                    flag = 2;
                    poly4selection = [];
                    break;
                }
            }
            poly4selection.push(selpoly);
        }
        if (flag === 1) {
            return {
                poly4selection,
                flag,
                maxx,
                maxy,
                minx,
                miny,
            };
        }
        // Case flag = 2 → shift RA>180 by -360 to unwrap around RA=0
        let startRA = polygons[0][0].raDeg;
        maxx = startRA >= RA_THRESHOLD ? startRA - 360 : startRA;
        maxy = polygons[0][0].decDeg;
        minx = maxx;
        miny = maxy;
        for (const currpoly of polygons) {
            const selpoly = [];
            for (const point of currpoly) {
                const curra = point.raDeg >= RA_THRESHOLD ? point.raDeg - 360 : point.raDeg;
                if (curra > maxx)
                    maxx = curra;
                if (point.decDeg > maxy)
                    maxy = point.decDeg;
                if (curra < minx)
                    minx = curra;
                if (point.decDeg < miny)
                    miny = point.decDeg;
                selpoly.push(new Point2D(curra, point.decDeg));
            }
            poly4selection.push(selpoly);
        }
        return {
            poly4selection,
            flag,
            maxx,
            maxy,
            minx,
            miny,
        };
    }
    /** Stereographic projection from 3D point on unit sphere onto plane */
    static stereographic(point) {
        const x = Number(point.xyz[0]);
        const y = Number(point.xyz[1]);
        const z = Number(point.xyz[2]);
        return {
            x: (2 * x) / (1 - z),
            y: (2 * y) / (1 - z),
        };
    }
    static projectIn2D(point) {
        const p = GeomUtils.stereographic(point);
        return new Point2D(p.x, p.y);
    }
    /**
     * Robust point-in-polygon (ray casting) using the precomputed selection object.
     * Works with any of the three flags (0,1,2).
     */
    static checkPointInsidePolygon5(selectionObj, point) {
        let p0;
        if (selectionObj.flag === 0) {
            p0 = GeomUtils.projectIn2D(point);
        }
        else if (selectionObj.flag === 1) {
            p0 = new Point2D(point.raDeg, point.decDeg);
        }
        else {
            const RA_THRESHOLD = 180;
            const raShifted = point.raDeg >= RA_THRESHOLD ? point.raDeg - 360 : point.raDeg;
            p0 = new Point2D(raShifted, point.decDeg);
        }
        const p1 = new Point2D(p0.x, p0.y + 2 * Math.abs(selectionObj.maxy - selectionObj.miny));
        // quick reject by bbox
        if (p0.x > selectionObj.maxx ||
            p0.x < selectionObj.minx ||
            p0.y > selectionObj.maxy ||
            p0.y < selectionObj.miny) {
            return false;
        }
        // Ray casting against each sub-polygon
        for (const currpoly of selectionObj.poly4selection) {
            let intersections = 0;
            for (let i = 0; i < currpoly.length - 1; i++) {
                const p2 = currpoly[i];
                const p3 = currpoly[i + 1];
                const denominator = (p3.y - p2.y) * (p1.x - p0.x) - (p3.x - p2.x) * (p1.y - p0.y);
                const numerator01 = (p3.x - p2.x) * (p0.y - p2.y) - (p3.y - p2.y) * (p0.x - p2.x);
                const numerator23 = (p1.x - p0.x) * (p0.y - p2.y) - (p1.y - p0.y) * (p0.x - p2.x);
                if (denominator !== 0) {
                    const lamda01 = numerator01 / denominator;
                    const lambda23 = numerator23 / denominator;
                    if (lamda01 >= 0 && lamda01 <= 1 && lambda23 >= 0 && lambda23 <= 1) {
                        intersections++;
                    }
                }
            }
            // close the polygon: last with first
            {
                const p2 = currpoly[currpoly.length - 1];
                const p3 = currpoly[0];
                const denominator = (p3.y - p2.y) * (p1.x - p0.x) - (p3.x - p2.x) * (p1.y - p0.y);
                const numerator01 = (p3.x - p2.x) * (p0.y - p2.y) - (p3.y - p2.y) * (p0.x - p2.x);
                const numerator23 = (p1.x - p0.x) * (p0.y - p2.y) - (p1.y - p0.y) * (p0.x - p2.x);
                if (denominator !== 0) {
                    const lamda01 = numerator01 / denominator;
                    const lambda23 = numerator23 / denominator;
                    if (lamda01 >= 0 && lamda01 <= 1 && lambda23 >= 0 && lambda23 <= 1) {
                        intersections++;
                    }
                }
            }
            if (intersections % 2 === 1) {
                return true; // inside this subpolygon
            }
        }
        return false;
    }
    // Legacy version kept for reference; now typed and using getters
    static checkPointInsidePolygon4(polygons, point) {
        const p0 = GeomUtils.projectIn2D(point);
        let maxdist = point.raDeg + 15;
        if (maxdist > 360)
            maxdist = point.raDeg - 15;
        const p1point = new Point({ raDeg: maxdist, decDeg: point.decDeg }, CoordsType.ASTRO);
        const p1 = GeomUtils.projectIn2D(p1point);
        for (const currpoly of polygons) {
            let intersections = 0;
            for (let i = 0; i < currpoly.length - 1; i++) {
                const p2 = GeomUtils.projectIn2D(currpoly[i]);
                const p3 = GeomUtils.projectIn2D(currpoly[i + 1]);
                const denominator = (p3.y - p2.y) * (p1.x - p0.x) - (p3.x - p2.x) * (p1.y - p0.y);
                const numerator01 = (p3.x - p2.x) * (p0.y - p2.y) - (p3.y - p2.y) * (p0.x - p2.x);
                const numerator23 = (p1.x - p0.x) * (p0.y - p2.y) - (p1.y - p0.y) * (p0.x - p2.x);
                if (denominator !== 0) {
                    const lamda01 = numerator01 / denominator;
                    const lambda23 = numerator23 / denominator;
                    if (lamda01 >= 0 && lamda01 <= 1 && lambda23 >= 0 && lambda23 <= 1) {
                        intersections++;
                    }
                }
            }
            {
                const p2 = GeomUtils.projectIn2D(currpoly[currpoly.length - 1]);
                const p3 = GeomUtils.projectIn2D(currpoly[0]);
                const denominator = (p3.y - p2.y) * (p1.x - p0.x) - (p3.x - p2.x) * (p1.y - p0.y);
                const numerator01 = (p3.x - p2.x) * (p0.y - p2.y) - (p3.y - p2.y) * (p0.x - p2.x);
                const numerator23 = (p1.x - p0.x) * (p0.y - p2.y) - (p1.y - p0.y) * (p0.x - p2.x);
                if (denominator !== 0) {
                    const lamda01 = numerator01 / denominator;
                    const lambda23 = numerator23 / denominator;
                    if (lamda01 >= 0 && lamda01 <= 1 && lambda23 >= 0 && lambda23 <= 1) {
                        intersections++;
                    }
                }
            }
            if (intersections % 2 === 1)
                return true;
        }
        return false;
    }
}
export default GeomUtils;
//# sourceMappingURL=GeomUtils.js.map