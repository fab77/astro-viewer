'use strict';
import { Vec3, Pointing } from 'healpixjs';
import global from '../Global.js';
class Source {
    _point;
    _name;
    _details;
    _h_pix;
    _shapesize;
    _brightnessFactor;
    /**
     * @param in_point Point.js (Cartesian/RA-Dec wrapper)
     * @param in_details Optional array of key/value metadata
     */
    constructor(in_point, in_details = []) {
        this._point = in_point;
        this._details = in_details;
        this._shapesize = 8.0;
        this._brightnessFactor = -99;
        this.computeHealpixPixel();
    }
    getDetailByindex(index) {
        if (index < 0 || index >= this._details.length) {
            return undefined;
        }
        return this._details[index].value;
    }
    getDetailByKey(key) {
        const detail = this._details.find((d) => d.key === key);
        return detail ? detail.value : undefined;
    }
    get details() {
        return this._details;
    }
    computeHealpixPixel() {
        // Get Healpix instance from global
        const healpix = global.getHealpix(global.nsideForSelection);
        const vec3 = new Vec3(this._point.x, this._point.y, this._point.z);
        const ptg = new Pointing(vec3, false);
        this._h_pix = healpix.ang2pix(ptg, false);
    }
    get point() {
        return this._point;
    }
    get name() {
        return this._name;
    }
    get healpixPixel() {
        return this._h_pix;
    }
    get shapeSize() {
        return this._shapesize;
    }
    set shapeSize(size) {
        this._shapesize = size;
    }
    get brightnessFactor() {
        return this._brightnessFactor;
    }
    /**
     * @param factor Must be in [-1..1]
     */
    set brightnessFactor(factor) {
        this._brightnessFactor = factor;
    }
}
export default Source;
//# sourceMappingURL=Source.js.map