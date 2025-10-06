/**
 * @author Fabrizio Giordano (Fab)
 */
import { vec3 } from "gl-matrix";
export interface SphericalCoords {
    phi: number;
    theta: number;
}
export interface AstroCoords {
    ra: number;
    dec: number;
}
export interface HMS {
    h: number;
    m: number;
    s: number;
}
export interface DMS {
    d: number;
    m: number;
    s: number;
}
export declare function cartesianToSpherical(xyz: vec3): SphericalCoords;
export declare function colorHex2RGB(hexColor: string): [number, number, number];
export declare function degToRad(degrees: number): number;
export declare function radToDeg(radians: number): number;
export declare function sphericalToAstroDeg(phiDeg: number, thetaDeg: number): AstroCoords;
export declare function sphericalToCartesian(phiDeg: number, thetaDeg: number, r?: number): [number, number, number];
export declare function astroDegToSpherical(raDeg: number, decDeg: number): SphericalCoords;
export declare function raDegToHMS(raDeg: number): HMS;
export declare function decDegToDMS(decDeg: number): DMS;
//# sourceMappingURL=Utils.d.ts.map