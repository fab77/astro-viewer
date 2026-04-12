import { type SphericalCoords } from '../utils/Utils.js';
import { CoordsType } from '../utils/CoordsType.js';
export type CartesianOpts = {
    x: number;
    y: number;
    z: number;
};
export type AstroOpts = {
    raDeg: number;
    decDeg: number;
};
export type SphericalOpts = {
    phiDeg: number;
    thetaDeg: number;
};
export type PointInitOpts = CartesianOpts | AstroOpts | SphericalOpts;
export declare class Point {
    private _x;
    private _y;
    private _z;
    private _xyz;
    private _raDeg;
    private _decDeg;
    private _raRad;
    private _decRad;
    private _raDecDeg;
    constructor(in_options: PointInitOpts, in_type: CoordsType);
    private computeAstroCoords;
    private computeCartesianCoords;
    /**
     * @return {phi, theta} (degrees)
     */
    computeHealpixPhiTheta(): SphericalCoords;
    /** Scale the vector by a given factor */
    scale(n: number): Point;
    dot(v: Point): number;
    cross(v: Point): Point;
    norm(): Point;
    length(): number;
    lengthSquared(): number;
    subtract(v: Point): Point;
    add(v: Point): Point;
    get x(): number;
    get y(): number;
    get z(): number;
    get xyz(): [number, number, number];
    get raDeg(): number;
    get decDeg(): number;
    get raDecDeg(): [number, number];
    toADQL(): string;
    toString(): string;
}
//# sourceMappingURL=Point.d.ts.map