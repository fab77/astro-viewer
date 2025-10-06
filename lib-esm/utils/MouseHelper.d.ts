/**
 * @author Fabrizio Giordano (Fab)
 */
import { ReadonlyVec3 } from "gl-matrix";
import { type SphericalCoords, type AstroCoords, type HMS, type DMS } from "./Utils.js";
type XYZ = [number, number, number];
declare class MouseHelper {
    private _xyz;
    private _raDecDeg;
    private _phiThetaDeg;
    raHMS?: HMS;
    decDMS?: DMS;
    /**
     * @param in_xyz [x, y, z]
     * @param in_raDecDeg { ra, dec } in degrees (ICRS/J2000)
     * @param in_phiThetaDeg { phi, theta } in degrees (spherical)
     */
    constructor(in_xyz?: XYZ | null, in_raDecDeg?: AstroCoords | null, in_phiThetaDeg?: SphericalCoords | null);
    /** (Formerly `computeNpix256`) Uses global.nsideForSelection. */
    computeNpix(): number | null;
    /** Update helper state from a world-space 3D point on the unit sphere. */
    update(mousePoint: ReadonlyVec3 | XYZ): void;
    clear(): void;
    get xyz(): XYZ | null;
    get x(): number | null;
    get y(): number | null;
    get z(): number | null;
    get ra(): number | null;
    get dec(): number | null;
    get phi(): number | null;
    get theta(): number | null;
    get raDecDeg(): AstroCoords | null;
    get phiThetaDeg(): SphericalCoords | null;
}
export default MouseHelper;
//# sourceMappingURL=MouseHelper.d.ts.map