/**
 * @author Fabrizio Giordano (Fab77)
 */
'use strict';
import { vec3 } from 'gl-matrix';
import { cartesianToSpherical, sphericalToCartesian, sphericalToAstroDeg, astroDegToSpherical, } from '../utils/Utils.js';
import { CoordsType } from '../utils/CoordsType.js';
import global from '../Global.js';
export class Point {
    _x;
    _y;
    _z;
    _xyz;
    _raDeg;
    _decDeg;
    _raRad;
    _decRad;
    _raDecDeg;
    constructor(in_options, in_type) {
        this._xyz = [0, 0, 0];
        this._raDecDeg = [0, 0];
        // Prefer config value if present, fallback to 12
        const MAX_DECIMALS = global.MAX_DECIMALS ?? 12;
        if (in_type === CoordsType.CARTESIAN) {
            const { x, y, z } = in_options;
            this._x = Number(x.toFixed(MAX_DECIMALS));
            this._y = Number(y.toFixed(MAX_DECIMALS));
            this._z = Number(z.toFixed(MAX_DECIMALS));
            this._xyz = [this._x, this._y, this._z];
            const [ra, dec] = this.computeAstroCoords();
            this._raDeg = Number(ra);
            this._decDeg = Number(dec);
            this._raRad = (this._raDeg * Math.PI) / 180;
            this._decRad = (this._decDeg * Math.PI) / 180;
            this._raDecDeg = [this._raDeg, this._decDeg];
        }
        else if (in_type === CoordsType.ASTRO) {
            const { raDeg, decDeg } = in_options;
            this._raDeg = Number(raDeg);
            this._decDeg = Number(decDeg);
            this._raDecDeg = [this._raDeg, this._decDeg];
            this._raRad = (this._raDeg * Math.PI) / 180;
            this._decRad = (this._decDeg * Math.PI) / 180;
            const [x, y, z] = this.computeCartesianCoords();
            this._x = Number(x.toFixed(MAX_DECIMALS));
            this._y = Number(y.toFixed(MAX_DECIMALS));
            this._z = Number(z.toFixed(MAX_DECIMALS));
            this._xyz = [this._x, this._y, this._z];
        }
        else if (in_type === CoordsType.SPHERICAL) {
            // Not implemented in original; keep behavior
            console.log(`${CoordsType.SPHERICAL} not implemented yet`);
            this._x = 0;
            this._y = 0;
            this._z = 0;
            this._raDeg = 0;
            this._decDeg = 0;
            this._raRad = 0;
            this._decRad = 0;
        }
        else {
            console.error('CoordsType ' + String(in_type) + ' not recognised.');
            // Initialize to zeroed state to keep object consistent
            this._x = 0;
            this._y = 0;
            this._z = 0;
            this._raDeg = 0;
            this._decDeg = 0;
            this._raRad = 0;
            this._decRad = 0;
        }
    }
    computeAstroCoords() {
        const phiThetaDeg = cartesianToSpherical(vec3.fromValues(this._xyz[0], this._xyz[1], this._xyz[2]));
        const rad = sphericalToAstroDeg(phiThetaDeg.phi, phiThetaDeg.theta);
        return [rad.ra, rad.dec];
    }
    computeCartesianCoords() {
        const phiThetaDeg = astroDegToSpherical(this._raDeg, this._decDeg);
        const [x, y, z] = sphericalToCartesian(phiThetaDeg.phi, phiThetaDeg.theta, 1);
        return [x, y, z];
    }
    /**
     * @return {phi, theta} (degrees)
     */
    computeHealpixPhiTheta() {
        return astroDegToSpherical(this._raDeg, this._decDeg);
    }
    /** Scale the vector by a given factor */
    scale(n) {
        return new Point({ x: this.x * n, y: this.y * n, z: this.z * n }, CoordsType.CARTESIAN);
    }
    dot(v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }
    cross(v) {
        return new Point({
            x: this.y * v.z - v.y * this.z,
            y: this.z * v.x - v.z * this.x,
            z: this.x * v.y - v.x * this.y,
        }, CoordsType.CARTESIAN);
    }
    norm() {
        const d = 1 / this.length();
        return new Point({ x: this.x * d, y: this.y * d, z: this.z * d }, CoordsType.CARTESIAN);
    }
    length() {
        return Math.sqrt(this.lengthSquared());
    }
    lengthSquared() {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    }
    subtract(v) {
        return new Point({ x: this.x - v.x, y: this.y - v.y, z: this.z - v.z }, CoordsType.CARTESIAN);
    }
    add(v) {
        return new Point({ x: this.x + v.x, y: this.y + v.y, z: this.z + v.z }, CoordsType.CARTESIAN);
    }
    get x() { return this._x; }
    get y() { return this._y; }
    get z() { return this._z; }
    get xyz() { return this._xyz; }
    get raDeg() { return this._raDeg; }
    get decDeg() { return this._decDeg; }
    get raDecDeg() { return this._raDecDeg; }
    toADQL() {
        return `${this._raDecDeg[0]},${this._raDecDeg[1]}`;
    }
    toString() {
        return `(raDeg, decDeg) => (${this._raDecDeg[0]},${this._raDecDeg[1]}) (x, y,z) => (${this._xyz[0]},${this._xyz[1]},${this._xyz[2]})`;
    }
}
