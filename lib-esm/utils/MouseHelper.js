/**
 * @author Fabrizio Giordano (Fab)
 */
import { vec3 } from "gl-matrix";
import { Vec3, Pointing } from "healpixjs";
import global from "../Global.js";
import { cartesianToSpherical, sphericalToAstroDeg, raDegToHMS, decDegToDMS, } from "./Utils.js";
function toVec3(p) {
    return Array.isArray(p) ? vec3.fromValues(p[0], p[1], p[2]) : p;
}
class MouseHelper {
    _xyz = null;
    _raDecDeg = null;
    _phiThetaDeg = null;
    raHMS;
    decDMS;
    /**
     * @param in_xyz [x, y, z]
     * @param in_raDecDeg { ra, dec } in degrees (ICRS/J2000)
     * @param in_phiThetaDeg { phi, theta } in degrees (spherical)
     */
    constructor(in_xyz, in_raDecDeg, in_phiThetaDeg) {
        if (in_xyz != null)
            this._xyz = in_xyz;
        if (in_raDecDeg != null)
            this._raDecDeg = in_raDecDeg;
        if (in_phiThetaDeg != null)
            this._phiThetaDeg = in_phiThetaDeg;
        if (this._raDecDeg) {
            this.raHMS = raDegToHMS(this._raDecDeg.ra);
            this.decDMS = decDegToDMS(this._raDecDeg.dec);
        }
    }
    /** (Formerly `computeNpix256`) Uses global.nsideForSelection. */
    computeNpix() {
        if (!this._xyz)
            return null;
        const hp = global.getHealpix(global.nsideForSelection);
        const v = new Vec3(this._xyz[0], this._xyz[1], this._xyz[2]);
        const ptg = new Pointing(v, false);
        return hp.ang2pix(ptg, false);
    }
    /** Update helper state from a world-space 3D point on the unit sphere. */
    update(mousePoint) {
        const mp = toVec3(mousePoint);
        const sph = cartesianToSpherical(mp);
        const radec = sphericalToAstroDeg(sph.phi, sph.theta);
        this._xyz = [mp[0], mp[1], mp[2]];
        this._phiThetaDeg = sph;
        this._raDecDeg = radec;
        this.raHMS = raDegToHMS(radec.ra);
        this.decDMS = decDegToDMS(radec.dec);
    }
    clear() {
        this._xyz = null;
        this._raDecDeg = null;
        this._phiThetaDeg = null;
        this.raHMS = undefined;
        this.decDMS = undefined;
    }
    // --- getters ---
    get xyz() {
        return this._xyz;
    }
    get x() {
        return this._xyz ? this._xyz[0] : null;
    }
    get y() {
        return this._xyz ? this._xyz[1] : null;
    }
    get z() {
        return this._xyz ? this._xyz[2] : null;
    }
    get ra() {
        return this._raDecDeg ? this._raDecDeg.ra : null;
    }
    get dec() {
        return this._raDecDeg ? this._raDecDeg.dec : null;
    }
    get phi() {
        return this._phiThetaDeg ? this._phiThetaDeg.phi : null;
    }
    get theta() {
        return this._phiThetaDeg ? this._phiThetaDeg.theta : null;
    }
    get raDecDeg() {
        return this._raDecDeg;
    }
    get phiThetaDeg() {
        return this._phiThetaDeg;
    }
}
export default MouseHelper;
