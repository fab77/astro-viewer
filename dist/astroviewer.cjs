/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  AstroViewer: () => (/* reexport */ AstroViewer),
  FoV: () => (/* reexport */ FoV),
  HiPSDescriptor: () => (/* reexport */ HiPSDescriptor),
  TapRepo: () => (/* reexport */ TapRepo),
  addTAPRepo: () => (/* reexport */ addTAPRepo)
});

;// ./node_modules/healpixjs/lib-esm/Constants.js
class Constants {
}
//	static halfpi = Math.PI/2.;
Constants.halfpi = 1.5707963267948966;
Constants.inv_halfpi = 2. / Math.PI;
/** The Constant twopi. */
Constants.twopi = 2 * Math.PI;
Constants.inv_twopi = 1. / (2 * Math.PI);
//# sourceMappingURL=Constants.js.map
;// ./node_modules/healpixjs/lib-esm/Pointing.js

class Pointing {
    /**
     *
     * @param {*} vec3 Vec3.js
     * @param {*} mirror
     * @param {*} in_theta radians
     * @param {*} in_phi radians
     */
    constructor(vec3, mirror, in_theta, in_phi) {
        if (vec3 != null) {
            this.theta = Hploc.atan2(Math.sqrt(vec3.x * vec3.x + vec3.y * vec3.y), vec3.z);
            if (mirror) {
                this.phi = -Hploc.atan2(vec3.y, vec3.x);
            }
            else {
                this.phi = Hploc.atan2(vec3.y, vec3.x);
            }
            if (this.phi < 0.0) {
                this.phi = this.phi + 2 * Math.PI;
            }
            if (this.phi >= 2 * Math.PI) {
                this.phi = this.phi - 2 * Math.PI;
            }
        }
        else {
            this.theta = in_theta;
            this.phi = in_phi;
        }
    }
}
//# sourceMappingURL=Pointing.js.map
;// ./node_modules/healpixjs/lib-esm/Zphi.js
class Zphi {
    /** Creation from individual components */
    constructor(z_, phi_) {
        this.z = z_;
        this.phi = phi_;
    }
    ;
}
//# sourceMappingURL=Zphi.js.map
;// ./node_modules/healpixjs/lib-esm/Hploc.js



class Hploc {
    constructor(ptg) {
        Hploc.PI4_A = 0.7853981554508209228515625;
        Hploc.PI4_B = 0.794662735614792836713604629039764404296875e-8;
        Hploc.PI4_C = 0.306161699786838294306516483068750264552437361480769e-16;
        Hploc.M_1_PI = 0.3183098861837906715377675267450287;
        if (ptg) {
            this.sth = 0.0;
            this.have_sth = false;
            this.z = Hploc.cos(ptg.theta);
            this._phi = ptg.phi;
            if (Math.abs(this.z) > 0.99) {
                this.sth = Hploc.sin(ptg.theta);
                this.have_sth = true;
            }
        }
    }
    setZ(z) {
        this.z = z;
    }
    ;
    get phi() {
        return this._phi;
    }
    ;
    set phi(phi) {
        this._phi = phi;
    }
    ;
    setSth(sth) {
        this.sth = sth;
    }
    ;
    toPointing(mirror) {
        const st = this.have_sth ? this.sth : Math.sqrt((1.0 - this.z) * (1.0 + this.z));
        return new Pointing(null, false, Hploc.atan2(st, this.z), this._phi);
    }
    toVec3() {
        var st = this.have_sth ? this.sth : Math.sqrt((1.0 - this.z) * (1.0 + this.z));
        var vector = new Vec3(st * Hploc.cos(this.phi), st * Hploc.sin(this.phi), this.z);
        // var vector = new Vec3(st*Math.cos(this.phi),st*Math.sin(this.phi),this.z);
        return vector;
    }
    ;
    toZphi() {
        return new Zphi(this.z, this.phi);
    }
    static sin(d) {
        let u = d * Hploc.M_1_PI;
        let q = Math.floor(u < 0 ? u - 0.5 : u + 0.5);
        let x = 4.0 * q;
        d -= x * Hploc.PI4_A;
        d -= x * Hploc.PI4_B;
        d -= x * Hploc.PI4_C;
        if ((q & 1) != 0) {
            d = -d;
        }
        return this.sincoshelper(d);
    }
    ;
    static cos(d) {
        //		let u = d * Hploc.M_1_PI - 0.5;
        let u = d * Hploc.M_1_PI - 0.5;
        //		u -= 0.5;
        let q = 1 + 2 * Math.floor(u < 0 ? u - 0.5 : u + 0.5);
        let x = 2.0 * q;
        let t = x * Hploc.PI4_A;
        d = d - t;
        d -= x * Hploc.PI4_B;
        d -= x * Hploc.PI4_C;
        if ((q & 2) == 0) {
            d = -d;
        }
        return Hploc.sincoshelper(d);
    }
    ;
    static sincoshelper(d) {
        let s = d * d;
        let u = -7.97255955009037868891952e-18;
        u = u * s + 2.81009972710863200091251e-15;
        u = u * s - 7.64712219118158833288484e-13;
        u = u * s + 1.60590430605664501629054e-10;
        u = u * s - 2.50521083763502045810755e-08;
        u = u * s + 2.75573192239198747630416e-06;
        u = u * s - 0.000198412698412696162806809;
        u = u * s + 0.00833333333333332974823815;
        u = u * s - 0.166666666666666657414808;
        return s * u * d + d;
    }
    ;
    /** This method calculates the arc sine of x in radians. The return
    value is in the range [-pi/2, pi/2]. The results may have
    maximum error of 3 ulps. */
    static asin(d) {
        return Hploc.mulsign(Hploc.atan2k(Math.abs(d), Math.sqrt((1 + d) * (1 - d))), d);
    }
    ;
    /** This method calculates the arc cosine of x in radians. The
        return value is in the range [0, pi]. The results may have
        maximum error of 3 ulps. */
    static acos(d) {
        return Hploc.mulsign(Hploc.atan2k(Math.sqrt((1 + d) * (1 - d)), Math.abs(d)), d) + (d < 0 ? Math.PI : 0);
    }
    ;
    static mulsign(x, y) {
        let sign = Hploc.copySign(1, y);
        return sign * x;
    }
    ;
    static copySign(magnitude, sign) {
        return sign < 0 ? -Math.abs(magnitude) : Math.abs(magnitude);
        // let finalsign = 1;
        // if (Object.is(finalsign , -0)){
        // 	sign = -1;
        // }else if (Object.is(finalsign , 0)){
        // 	sign = 1;
        // }else {
        // 	sign = Math.sign(finalsign);
        // }
        // return finalsign * magnitude;
    }
    static atanhelper(s) {
        let t = s * s;
        let u = -1.88796008463073496563746e-05;
        u = u * t + (0.000209850076645816976906797);
        u = u * t + (-0.00110611831486672482563471);
        u = u * t + (0.00370026744188713119232403);
        u = u * t + (-0.00889896195887655491740809);
        u = u * t + (0.016599329773529201970117);
        u = u * t + (-0.0254517624932312641616861);
        u = u * t + (0.0337852580001353069993897);
        u = u * t + (-0.0407629191276836500001934);
        u = u * t + (0.0466667150077840625632675);
        u = u * t + (-0.0523674852303482457616113);
        u = u * t + (0.0587666392926673580854313);
        u = u * t + (-0.0666573579361080525984562);
        u = u * t + (0.0769219538311769618355029);
        u = u * t + (-0.090908995008245008229153);
        u = u * t + (0.111111105648261418443745);
        u = u * t + (-0.14285714266771329383765);
        u = u * t + (0.199999999996591265594148);
        u = u * t + (-0.333333333333311110369124);
        return u * t * s + s;
    }
    ;
    static atan2k(y, x) {
        let q = 0.;
        if (x < 0) {
            x = -x;
            q = -2.;
        }
        if (y > x) {
            let t = x;
            x = y;
            y = -t;
            q += 1.;
        }
        return Hploc.atanhelper(y / x) + q * (Math.PI / 2);
    }
    ;
    /** This method calculates the arc tangent of y/x in radians, using
    the signs of the two arguments to determine the quadrant of the
    result. The results may have maximum error of 2 ulps. */
    static atan2(y, x) {
        let r = Hploc.atan2k(Math.abs(y), x);
        r = Hploc.mulsign(r, x);
        if (Hploc.isinf(x) || x == 0) {
            r = Math.PI / 2 - (Hploc.isinf(x) ? (Hploc.copySign(1, x) * (Math.PI / 2)) : 0);
        }
        if (Hploc.isinf(y)) {
            r = Math.PI / 2 - (Hploc.isinf(x) ? (Hploc.copySign(1, x) * (Math.PI * 1 / 4)) : 0);
        }
        if (y == 0) {
            r = (Hploc.copySign(1, x) == -1 ? Math.PI : 0);
        }
        return Hploc.isnan(x) || Hploc.isnan(y) ? NaN : Hploc.mulsign(r, y);
    }
    ;
    /** Checks if the argument is a NaN or not. */
    static isnan(d) {
        return d != d;
    }
    ;
    /** Checks if the argument is either positive or negative infinity. */
    static isinf(d) {
        return Math.abs(d) === +Infinity;
    }
    ;
}
Hploc.PI4_A = 0.7853981554508209228515625;
Hploc.PI4_B = 0.794662735614792836713604629039764404296875e-8;
Hploc.PI4_C = 0.306161699786838294306516483068750264552437361480769e-16;
Hploc.M_1_PI = 0.3183098861837906715377675267450287;
//# sourceMappingURL=Hploc.js.map
;// ./node_modules/healpixjs/lib-esm/Vec3.js
/**
 * Partial porting to Javascript of Vec3.java from Healpix3.30
 */


class Vec3 {
    constructor(in_x, in_y, in_z) {
        if (in_x instanceof Pointing) {
            let ptg = in_x;
            let sth = Hploc.sin(ptg.theta);
            this.x = sth * Hploc.cos(ptg.phi);
            this.y = sth * Hploc.sin(ptg.phi);
            this.z = Hploc.cos(ptg.theta);
        }
        else {
            this.x = in_x;
            this.y = in_y;
            this.z = in_z;
        }
    }
    getX() {
        return this.x;
    }
    ;
    getY() {
        return this.y;
    }
    ;
    getZ() {
        return this.z;
    }
    ;
    /** Scale the vector by a given factor
    @param n the scale factor */
    scale(n) {
        this.x *= n;
        this.y *= n;
        this.z *= n;
    }
    ;
    /** Vector cross product.
    @param v another vector
    @return the vector cross product between this vector and {@code v} */
    cross(v) {
        return new Vec3(this.y * v.z - v.y * this.z, this.z * v.x - v.z * this.x, this.x * v.y - v.x * this.y);
    }
    ;
    /** Vector addition
        * @param v the vector to be added
        * @return addition result */
    add(v) {
        return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z);
    }
    ;
    /** Normalize the vector */
    normalize() {
        let d = 1. / this.length();
        this.x *= d;
        this.y *= d;
        this.z *= d;
    }
    ;
    /** Return normalized vector */
    norm() {
        let d = 1. / this.length();
        return new Vec3(this.x * d, this.y * d, this.z * d);
    }
    ;
    /** Vector length
    @return the length of the vector. */
    length() {
        return Math.sqrt(this.lengthSquared());
    }
    ;
    /** Squared vector length
        @return the squared length of the vector. */
    lengthSquared() {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    }
    ;
    /** Computes the dot product of the this vector and {@code v1}.
     * @param v1 another vector
     * @return dot product */
    dot(v1) {
        return this.x * v1.x + this.y * v1.y + this.z * v1.z;
    }
    ;
    /** Vector subtraction
     * @param v the vector to be subtracted
     * @return subtraction result */
    sub(v) {
        return new Vec3(this.x - v.x, this.y - v.y, this.z - v.z);
    }
    ;
    /** Angle between two vectors.
    @param v1 another vector
    @return the angle in radians between this vector and {@code v1};
      constrained to the range [0,PI]. */
    angle(v1) {
        return Hploc.atan2(this.cross(v1).length(), this.dot(v1));
    }
    /** Invert the signs of all components */
    flip() {
        this.x *= -1.0;
        this.y *= -1.0;
        this.z *= -1.0;
    }
    static pointing2Vec3(pointing) {
        let sth = Hploc.sin(pointing.theta);
        let x = sth * Hploc.cos(pointing.phi);
        let y = sth * Hploc.sin(pointing.phi);
        let z = Hploc.cos(pointing.theta);
        return new Vec3(x, y, z);
    }
    ;
}
//# sourceMappingURL=Vec3.js.map
;// ./node_modules/healpixjs/lib-esm/CircleFinder.js

class CircleFinder {
    /**
     * @param point: Vec3
     */
    constructor(point) {
        let np = point.length;
        //HealpixUtils.check(np>=2,"too few points");
        if (!(np >= 2)) {
            console.log("too few points");
            return;
        }
        this.center = point[0].add(point[1]);
        this.center.normalize();
        this.cosrad = point[0].dot(this.center);
        for (let i = 2; i < np; ++i) {
            if (point[i].dot(this.center) < this.cosrad) { // point outside the current circle
                this.getCircle(point, i);
            }
        }
    }
    ;
    /**
     * @parm point: Vec3
     * @param q: int
     */
    getCircle(point, q) {
        this.center = point[0].add(point[q]);
        this.center.normalize();
        this.cosrad = point[0].dot(this.center);
        for (let i = 1; i < q; ++i) {
            if (point[i].dot(this.center) < this.cosrad) { // point outside the current circle
                this.getCircle2(point, i, q);
            }
        }
    }
    ;
    /**
     * @parm point: Vec3
     * @param q1: int
     * @param q2: int
     */
    getCircle2(point, q1, q2) {
        this.center = point[q1].add(point[q2]);
        this.center.normalize();
        this.cosrad = point[q1].dot(this.center);
        for (let i = 0; i < q1; ++i) {
            if (point[i].dot(this.center) < this.cosrad) { // point outside the current circle
                this.center = (point[q1].sub(point[i])).cross(point[q2].sub(point[i]));
                this.center.normalize();
                this.cosrad = point[i].dot(this.center);
                if (this.cosrad < 0) {
                    this.center.flip();
                    this.cosrad = -this.cosrad;
                }
            }
        }
    }
    ;
    getCenter() {
        return new Vec3(this.center.x, this.center.y, this.center.z);
    }
    getCosrad() {
        return this.cosrad;
    }
    ;
}
//# sourceMappingURL=CircleFinder.js.map
;// ./node_modules/healpixjs/lib-esm/Fxyf.js
/**
 * Partial porting to Javascript of Fxyf.java from Healpix3.30
 */

class Fxyf {
    constructor(x, y, f) {
        this.fx = x;
        this.fy = y;
        this.face = f;
        // coordinate of the lowest corner of each face
        this.jrll = new Uint8Array([2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4]);
        this.jpll = new Uint8Array([1, 3, 5, 7, 0, 2, 4, 6, 1, 3, 5, 7]);
        this.halfpi = Math.PI / 2.;
    }
    toHploc() {
        let loc = new Hploc();
        let jr = this.jrll[this.face] - this.fx - this.fy;
        let nr;
        if (jr < 1) {
            nr = jr;
            let tmp = nr * nr / 3.;
            loc.z = 1 - tmp;
            if (loc.z > 0.99) {
                loc.sth = Math.sqrt(tmp * (2.0 - tmp));
                loc.have_sth = true;
            }
        }
        else if (jr > 3) {
            nr = 4 - jr;
            let tmp = nr * nr / 3.;
            loc.z = tmp - 1;
            if (loc.z < -0.99) {
                loc.sth = Math.sqrt(tmp * (2.0 - tmp));
                loc.have_sth = true;
            }
        }
        else {
            nr = 1;
            loc.z = (2 - jr) * 2.0 / 3.;
        }
        let tmp = this.jpll[this.face] * nr + this.fx - this.fy;
        if (tmp < 0) {
            tmp += 8;
        }
        if (tmp >= 8) {
            tmp -= 8;
        }
        loc.phi = (nr < 1e-15) ? 0 : (0.5 * this.halfpi * tmp) / nr;
        return loc;
    }
    ;
    toVec3() {
        return this.toHploc().toVec3();
    }
    ;
}
//# sourceMappingURL=Fxyf.js.map
;// ./node_modules/healpixjs/lib-esm/pstack.js
class pstack {
    /** Creation from individual components */
    constructor(sz) {
        this.p = new Array(sz);
        this.o = new Int32Array(sz);
        this.s = 0;
        this.m = 0;
    }
    ;
    /**
     * @param p long
     * @param o int
     */
    push(p_, o_) {
        this.p[this.s] = p_;
        this.o[this.s] = o_;
        ++this.s;
    }
    ;
    pop() {
        --this.s;
    }
    ;
    popToMark() {
        this.s = this.m;
    }
    ;
    size() {
        return this.s;
    }
    ;
    mark() {
        this.m = this.s;
    }
    ;
    otop() {
        return this.o[this.s - 1];
    }
    ;
    ptop() {
        return this.p[this.s - 1];
    }
    ;
}
//# sourceMappingURL=pstack.js.map
;// ./node_modules/healpixjs/lib-esm/RangeSet.js
class RangeSet {
    /**
     * @param int cap: initial capacity
     */
    constructor(cap) {
        if (cap < 0)
            console.error("capacity must be positive");
        this.r = new Int32Array(cap << 1);
        this.sz = 0;
    }
    ;
    /** Append a single-value range to the object.
    @param val value to append */
    append(val) {
        this.append1(val, val + 1);
    }
    ;
    /** Append a range to the object.
   @param a first long in range
   @param b one-after-last long in range */
    append1(a, b) {
        if (a >= b)
            return;
        if ((this.sz > 0) && (a <= this.r[this.sz - 1])) {
            if (a < this.r[this.sz - 2])
                console.error("bad append operation");
            if (b > this.r[this.sz - 1])
                this.r[this.sz - 1] = b;
            return;
        }
        // this.ensureCapacity(this.sz+2);
        let cap = this.sz + 2;
        if (this.r.length < cap) {
            let newsize = Math.max(2 * this.r.length, cap);
            let rnew = new Int32Array(newsize);
            rnew.set(this.r);
            this.r = rnew;
        }
        this.r[this.sz] = a;
        this.r[this.sz + 1] = b;
        this.sz += 2;
    }
    ;
    /** Make sure the object can hold at least the given number of entries.
     * @param cap int
     * */
    ensureCapacity(cap) {
        if (this.r.length < cap)
            this.resize(Math.max(2 * this.r.length, cap));
    }
    ;
    /**
     * @param newsize int
     */
    resize(newsize) {
        if (newsize < this.sz)
            console.error("requested array size too small");
        if (newsize == this.r.length)
            return;
        let rnew = new Int32Array(newsize);
        let sliced = this.r.slice(0, this.sz + 1);
        //		this.arrayCopy(this.r, 0, rnew, 0, this.sz);
        this.r = sliced;
    }
    ;
}
//# sourceMappingURL=RangeSet.js.map
;// ./node_modules/healpixjs/lib-esm/Xyf.js
/**
 * Partial porting to Javascript of Xyf.java from Healpix3.30
 */
class Xyf {
    constructor(x, y, f) {
        this.ix = x;
        this.iy = y;
        this.face = f;
    }
}
//# sourceMappingURL=Xyf.js.map
;// ./node_modules/healpixjs/lib-esm/Healpix.js











/**
 * Partial porting to Javascript of HealpixBase.java from Healpix3.30
 */
// import Fxyf from './Fxyf.js';
// import Hploc from './Hploc.js';
// import Xyf from './Xyf.js';
// import Vec3 from './Vec3.js';
// import Pointing from './Pointing.js';
// import CircleFinder from './CircleFinder.js';
// import Zphi from './Zphi.js';
// import pstack from './pstack.js';
// import Constants from './Constants.js';
// import RangeSet from './RangeSet.js';
class Healpix {
    constructor(nside_in) {
        this.order_max = 29;
        this.inv_halfpi = 2.0 / Math.PI;
        this.twothird = 2.0 / 3.;
        // console.log("twothird "+this.twothird);
        // this.ns_max=1L<<order_max;
        this.ns_max = Math.pow(2, this.order_max);
        this.ctab = new Uint16Array([
            0, 1, 256, 257, 2, 3, 258, 259, 512, 513, 768, 769, 514, 515, 770, 771, 4, 5, 260, 261, 6, 7, 262,
            263, 516, 517, 772, 773, 518, 519, 774, 775, 1024, 1025, 1280, 1281, 1026, 1027, 1282, 1283,
            1536, 1537, 1792, 1793, 1538, 1539, 1794, 1795, 1028, 1029, 1284, 1285, 1030, 1031, 1286,
            1287, 1540, 1541, 1796, 1797, 1542, 1543, 1798, 1799, 8, 9, 264, 265, 10, 11, 266, 267, 520,
            521, 776, 777, 522, 523, 778, 779, 12, 13, 268, 269, 14, 15, 270, 271, 524, 525, 780, 781, 526,
            527, 782, 783, 1032, 1033, 1288, 1289, 1034, 1035, 1290, 1291, 1544, 1545, 1800, 1801, 1546,
            1547, 1802, 1803, 1036, 1037, 1292, 1293, 1038, 1039, 1294, 1295, 1548, 1549, 1804, 1805,
            1550, 1551, 1806, 1807, 2048, 2049, 2304, 2305, 2050, 2051, 2306, 2307, 2560, 2561, 2816,
            2817, 2562, 2563, 2818, 2819, 2052, 2053, 2308, 2309, 2054, 2055, 2310, 2311, 2564, 2565,
            2820, 2821, 2566, 2567, 2822, 2823, 3072, 3073, 3328, 3329, 3074, 3075, 3330, 3331, 3584,
            3585, 3840, 3841, 3586, 3587, 3842, 3843, 3076, 3077, 3332, 3333, 3078, 3079, 3334, 3335,
            3588, 3589, 3844, 3845, 3590, 3591, 3846, 3847, 2056, 2057, 2312, 2313, 2058, 2059, 2314,
            2315, 2568, 2569, 2824, 2825, 2570, 2571, 2826, 2827, 2060, 2061, 2316, 2317, 2062, 2063,
            2318, 2319, 2572, 2573, 2828, 2829, 2574, 2575, 2830, 2831, 3080, 3081, 3336, 3337, 3082,
            3083, 3338, 3339, 3592, 3593, 3848, 3849, 3594, 3595, 3850, 3851, 3084, 3085, 3340, 3341,
            3086, 3087, 3342, 3343, 3596, 3597, 3852, 3853, 3598, 3599, 3854, 3855
        ]);
        this.utab = new Uint16Array([0, 1, 4, 5, 16, 17, 20, 21, 64, 65, 68, 69, 80, 81, 84, 85, 256, 257, 260, 261, 272, 273, 276, 277,
            320, 321, 324, 325, 336, 337, 340, 341, 1024, 1025, 1028, 1029, 1040, 1041, 1044, 1045, 1088,
            1089, 1092, 1093, 1104, 1105, 1108, 1109, 1280, 1281, 1284, 1285, 1296, 1297, 1300, 1301,
            1344, 1345, 1348, 1349, 1360, 1361, 1364, 1365, 4096, 4097, 4100, 4101, 4112, 4113, 4116,
            4117, 4160, 4161, 4164, 4165, 4176, 4177, 4180, 4181, 4352, 4353, 4356, 4357, 4368, 4369,
            4372, 4373, 4416, 4417, 4420, 4421, 4432, 4433, 4436, 4437, 5120, 5121, 5124, 5125, 5136,
            5137, 5140, 5141, 5184, 5185, 5188, 5189, 5200, 5201, 5204, 5205, 5376, 5377, 5380, 5381,
            5392, 5393, 5396, 5397, 5440, 5441, 5444, 5445, 5456, 5457, 5460, 5461, 16384, 16385, 16388,
            16389, 16400, 16401, 16404, 16405, 16448, 16449, 16452, 16453, 16464, 16465, 16468, 16469,
            16640, 16641, 16644, 16645, 16656, 16657, 16660, 16661, 16704, 16705, 16708, 16709, 16720,
            16721, 16724, 16725, 17408, 17409, 17412, 17413, 17424, 17425, 17428, 17429, 17472, 17473,
            17476, 17477, 17488, 17489, 17492, 17493, 17664, 17665, 17668, 17669, 17680, 17681, 17684,
            17685, 17728, 17729, 17732, 17733, 17744, 17745, 17748, 17749, 20480, 20481, 20484, 20485,
            20496, 20497, 20500, 20501, 20544, 20545, 20548, 20549, 20560, 20561, 20564, 20565, 20736,
            20737, 20740, 20741, 20752, 20753, 20756, 20757, 20800, 20801, 20804, 20805, 20816, 20817,
            20820, 20821, 21504, 21505, 21508, 21509, 21520, 21521, 21524, 21525, 21568, 21569, 21572,
            21573, 21584, 21585, 21588, 21589, 21760, 21761, 21764, 21765, 21776, 21777, 21780, 21781,
            21824, 21825, 21828, 21829, 21840, 21841, 21844, 21845]);
        this.jrll = new Int16Array([2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4]);
        this.jpll = new Int16Array([1, 3, 5, 7, 0, 2, 4, 6, 1, 3, 5, 7]);
        this.xoffset = new Int16Array([-1, -1, 0, 1, 1, 1, 0, -1]);
        this.yoffset = new Int16Array([0, 1, 1, 1, 0, -1, -1, -1]);
        this.facearray = [
            new Int16Array([8, 9, 10, 11, -1, -1, -1, -1, 10, 11, 8, 9]),
            new Int16Array([5, 6, 7, 4, 8, 9, 10, 11, 9, 10, 11, 8]),
            new Int16Array([-1, -1, -1, -1, 5, 6, 7, 4, -1, -1, -1, -1]),
            new Int16Array([4, 5, 6, 7, 11, 8, 9, 10, 11, 8, 9, 10]),
            new Int16Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]),
            new Int16Array([1, 2, 3, 0, 0, 1, 2, 3, 5, 6, 7, 4]),
            new Int16Array([-1, -1, -1, -1, 7, 4, 5, 6, -1, -1, -1, -1]),
            new Int16Array([3, 0, 1, 2, 3, 0, 1, 2, 4, 5, 6, 7]),
            new Int16Array([2, 3, 0, 1, -1, -1, -1, -1, 0, 1, 2, 3]) // N
        ];
        // questo forse deve essere un UInt8Array. Viene usato da neighbours
        this.swaparray = [
            new Int16Array([0, 0, 3]),
            new Int16Array([0, 0, 6]),
            new Int16Array([0, 0, 0]),
            new Int16Array([0, 0, 5]),
            new Int16Array([0, 0, 0]),
            new Int16Array([5, 0, 0]),
            new Int16Array([0, 0, 0]),
            new Int16Array([6, 0, 0]),
            new Int16Array([3, 0, 0]) // N
        ];
        if (nside_in <= this.ns_max && nside_in > 0) {
            this.nside = nside_in;
            this.npface = this.nside * this.nside;
            this.npix = 12 * this.npface;
            this.order = this.nside2order(this.nside);
            this.nl2 = 2 * this.nside;
            this.nl3 = 3 * this.nside;
            this.nl4 = 4 * this.nside;
            this.fact2 = 4.0 / this.npix;
            this.fact1 = (this.nside << 1) * this.fact2;
            this.ncap = 2 * this.nside * (this.nside - 1); // pixels in each polar cap
            // console.log("order: "+this.order);
            // console.log("nside: "+this.nside);
        }
        this.bn = [];
        this.mpr = [];
        this.cmpr = [];
        this.smpr = [];
        // TODO INFINITE LOOP!!!!!! FIX ITTTTTTTTTT
        // TODO INFINITE LOOP!!!!!! FIX ITTTTTTTTTT
        // TODO INFINITE LOOP!!!!!! FIX ITTTTTTTTTT
        // TODO INFINITE LOOP!!!!!! FIX ITTTTTTTTTT
        // TODO INFINITE LOOP!!!!!! FIX ITTTTTTTTTT
        // TODO INFINITE LOOP!!!!!! FIX ITTTTTTTTTT
        // TODO INFINITE LOOP!!!!!! FIX ITTTTTTTTTT
        // Uncaught RangeError: Maximum call stack size exceeded
        // MOVED TO computeBn()
        //        for (let i=0; i <= this.order_max; ++i) {
        //        	this.bn[i]=new Healpix(1<<i);
        //        	this.mpr[i]=bn[i].maxPixrad();
        //        	this.cmpr[i]=Math.cos(mpr[i]);
        //        	this.smpr[i]=Math.sin(mpr[i]);
        //        }
    }
    computeBn() {
        for (let i = 0; i <= this.order_max; ++i) {
            this.bn[i] = new Healpix(1 << i);
            this.mpr[i] = this.bn[i].maxPixrad();
            this.cmpr[i] = Hploc.cos(this.mpr[i]);
            this.smpr[i] = Hploc.sin(this.mpr[i]);
        }
    }
    getNPix() {
        return this.npix;
    }
    ;
    getBoundaries(pix) {
        let points = new Array();
        let xyf = this.nest2xyf(pix);
        let dc = 0.5 / this.nside;
        let xc = (xyf.ix + 0.5) / this.nside;
        let yc = (xyf.iy + 0.5) / this.nside;
        points[0] = new Fxyf(xc + dc, yc + dc, xyf.face).toVec3();
        points[1] = new Fxyf(xc - dc, yc + dc, xyf.face).toVec3();
        points[2] = new Fxyf(xc - dc, yc - dc, xyf.face).toVec3();
        points[3] = new Fxyf(xc + dc, yc - dc, xyf.face).toVec3();
        return points;
    }
    ;
    /** Returns a set of points along the boundary of the given pixel.
     * Step 1 gives 4 points on the corners. The first point corresponds
     * to the northernmost corner, the subsequent points follow the pixel
     * boundary through west, south and east corners.
     *
     * @param pix pixel index number
     * @param step the number of returned points is 4*step
     * @return {@link Vec3} for each point
     */
    getBoundariesWithStep(pix, step) {
        // var points = new Array(); 
        let points = new Array();
        let xyf = this.nest2xyf(pix);
        let dc = 0.5 / this.nside;
        let xc = (xyf.ix + 0.5) / this.nside;
        let yc = (xyf.iy + 0.5) / this.nside;
        let d = 1.0 / (this.nside * step);
        for (let i = 0; i < step; i++) {
            points[i] = new Fxyf(xc + dc - i * d, yc + dc, xyf.face).toVec3();
            points[i + step] = new Fxyf(xc - dc, yc + dc - i * d, xyf.face).toVec3();
            points[i + 2 * step] = new Fxyf(xc - dc + i * d, yc - dc, xyf.face).toVec3();
            points[i + 3 * step] = new Fxyf(xc + dc, yc - dc + i * d, xyf.face).toVec3();
        }
        return points;
    }
    ;
    getPointsForXyfNoStep(x, y, face) {
        // let nside = Math.pow(2, this.order);
        let points = new Array();
        let xyf = new Xyf(x, y, face);
        let dc = 0.5 / this.nside;
        let xc = (xyf.ix + 0.5) / this.nside;
        let yc = (xyf.iy + 0.5) / this.nside;
        points[0] = new Fxyf(xc + dc, yc + dc, xyf.face).toVec3();
        points[1] = new Fxyf(xc - dc, yc + dc, xyf.face).toVec3();
        points[2] = new Fxyf(xc - dc, yc - dc, xyf.face).toVec3();
        points[3] = new Fxyf(xc + dc, yc - dc, xyf.face).toVec3();
        return points;
    }
    getPointsForXyf(x, y, step, face) {
        let nside = step * Math.pow(2, this.order);
        let points = new Array();
        let xyf = new Xyf(x, y, face);
        let dc = 0.5 / nside;
        let xc = (xyf.ix + 0.5) / nside;
        let yc = (xyf.iy + 0.5) / nside;
        points[0] = new Fxyf(xc + dc, yc + dc, xyf.face).toVec3();
        points[1] = new Fxyf(xc - dc, yc + dc, xyf.face).toVec3();
        points[2] = new Fxyf(xc - dc, yc - dc, xyf.face).toVec3();
        points[3] = new Fxyf(xc + dc, yc - dc, xyf.face).toVec3();
        return points;
    }
    /** Returns the neighboring pixels of ipix.
    This method works in both RING and NEST schemes, but is
    considerably faster in the NEST scheme.
    @param ipix the requested pixel number.
    @return array with indices of the neighboring pixels.
      The returned array contains (in this order)
      the pixel numbers of the SW, W, NW, N, NE, E, SE and S neighbor
      of ipix. If a neighbor does not exist (this can only happen
      for the W, N, E and S neighbors), its entry is set to -1. */
    neighbours(ipix) {
        let result = new Int32Array(8);
        let xyf = this.nest2xyf(ipix);
        let ix = xyf.ix;
        let iy = xyf.iy;
        let face_num = xyf.face;
        var nsm1 = this.nside - 1;
        if ((ix > 0) && (ix < nsm1) && (iy > 0) && (iy < nsm1)) {
            let fpix = Math.floor(face_num << (2 * this.order));
            let px0 = this.spread_bits(ix);
            let py0 = this.spread_bits(iy) << 1;
            let pxp = this.spread_bits(ix + 1);
            let pyp = this.spread_bits(iy + 1) << 1;
            let pxm = this.spread_bits(ix - 1);
            let pym = this.spread_bits(iy - 1) << 1;
            result[0] = fpix + pxm + py0;
            result[1] = fpix + pxm + pyp;
            result[2] = fpix + px0 + pyp;
            result[3] = fpix + pxp + pyp;
            result[4] = fpix + pxp + py0;
            result[5] = fpix + pxp + pym;
            result[6] = fpix + px0 + pym;
            result[7] = fpix + pxm + pym;
        }
        else {
            for (let i = 0; i < 8; ++i) {
                let x = ix + this.xoffset[i];
                let y = iy + this.yoffset[i];
                let nbnum = 4;
                if (x < 0) {
                    x += this.nside;
                    nbnum -= 1;
                }
                else if (x >= this.nside) {
                    x -= this.nside;
                    nbnum += 1;
                }
                if (y < 0) {
                    y += this.nside;
                    nbnum -= 3;
                }
                else if (y >= this.nside) {
                    y -= this.nside;
                    nbnum += 3;
                }
                let f = this.facearray[nbnum][face_num];
                if (f >= 0) {
                    let bits = this.swaparray[nbnum][face_num >>> 2];
                    if ((bits & 1) > 0) {
                        x = Math.floor(this.nside - x - 1);
                    }
                    if ((bits & 2) > 0) {
                        y = Math.floor(this.nside - y - 1);
                    }
                    if ((bits & 4) > 0) {
                        let tint = x;
                        x = y;
                        y = tint;
                    }
                    result[i] = this.xyf2nest(x, y, f);
                }
                else {
                    result[i] = -1;
                }
            }
        }
        return result;
    }
    ;
    nside2order(nside) {
        return ((nside & (nside - 1)) != 0) ? -1 : Math.log2(nside);
    }
    ;
    nest2xyf(ipix) {
        let pix = Math.floor(ipix & (this.npface - 1));
        let xyf = new Xyf(this.compress_bits(pix), this.compress_bits(pix >> 1), Math.floor((ipix >> (2 * this.order))));
        return xyf;
    }
    ;
    xyf2nest(ix, iy, face_num) {
        return Math.floor(face_num << (2 * this.order))
            + this.spread_bits(ix) + (this.spread_bits(iy) << 1);
    }
    ;
    loc2pix(hploc) {
        let z = hploc.z;
        let phi = hploc.phi;
        let za = Math.abs(z);
        let tt = this.fmodulo((phi * this.inv_halfpi), 4.0); // in [0,4)
        let pixNo;
        if (za <= this.twothird) { // Equatorial region
            let temp1 = this.nside * (0.5 + tt);
            let temp2 = this.nside * (z * 0.75);
            let jp = Math.floor(temp1 - temp2); // index of ascending edge line
            let jm = Math.floor(temp1 + temp2); // index of descending edge line
            let ifp = Math.floor(jp >>> this.order); // in {0,4}
            let ifm = Math.floor(jm >>> this.order);
            let face_num = Math.floor((ifp == ifm) ? (ifp | 4) : ((ifp < ifm) ? ifp : (ifm + 8)));
            let ix = Math.floor(jm & (this.nside - 1));
            let iy = Math.floor(this.nside - (jp & (this.nside - 1)) - 1);
            pixNo = this.xyf2nest(ix, iy, face_num);
        }
        else { // polar region, za > 2/3
            let ntt = Math.min(3, Math.floor(tt));
            let tp = tt - ntt;
            let tmp = ((za < 0.99) || (!hploc.have_sth)) ?
                this.nside * Math.sqrt(3 * (1 - za)) :
                this.nside * hploc.sth / Math.sqrt((1.0 + za) / 3.);
            let jp = Math.floor(tp * tmp); // increasing edge line index
            let jm = Math.floor((1.0 - tp) * tmp); // decreasing edge line index
            if (jp >= this.nside) {
                jp = this.nside - 1; // for points too close to the boundary
            }
            if (jm >= this.nside) {
                jm = this.nside - 1;
            }
            if (z >= 0) {
                pixNo = this.xyf2nest(Math.floor(this.nside - jm - 1), Math.floor(this.nside - jp - 1), ntt);
            }
            else {
                pixNo = this.xyf2nest(Math.floor(jp), Math.floor(jm), ntt + 8);
            }
        }
        return pixNo;
    }
    ;
    /** Returns the normalized 3-vector corresponding to the center of the
    supplied pixel.
    @param pix long the requested pixel number.
    @return the pixel's center coordinates. */
    pix2vec(pix) {
        return this.pix2loc(pix).toVec3();
    }
    ;
    /** Returns the Zphi corresponding to the center of the supplied pixel.
     @param pix the requested pixel number.
     @return the pixel's center coordinates. */
    pix2zphi(pix) {
        return this.pix2loc(pix).toZphi();
    }
    pix2ang(pix, mirror) {
        return this.pix2loc(pix).toPointing(mirror);
    }
    /**
     * @param pix long
     * @return Hploc
     */
    pix2loc(pix) {
        let loc = new Hploc(undefined);
        let xyf = this.nest2xyf(pix);
        let jr = ((this.jrll[xyf.face]) << this.order) - xyf.ix - xyf.iy - 1;
        let nr;
        if (jr < this.nside) {
            nr = jr;
            let tmp = (nr * nr) * this.fact2;
            loc.z = 1 - tmp;
            if (loc.z > 0.99) {
                loc.sth = Math.sqrt(tmp * (2. - tmp));
                loc.have_sth = true;
            }
        }
        else if (jr > this.nl3) {
            nr = this.nl4 - jr;
            let tmp = (nr * nr) * this.fact2;
            loc.z = tmp - 1;
            if (loc.z < -0.99) {
                loc.sth = Math.sqrt(tmp * (2. - tmp));
                loc.have_sth = true;
            }
        }
        else {
            nr = this.nside;
            loc.z = (this.nl2 - jr) * this.fact1;
        }
        let tmp = (this.jpll[xyf.face]) * nr + xyf.ix - xyf.iy;
        //      	assert(tmp<8*nr); // must not happen
        if (tmp < 0) {
            tmp += 8 * nr;
        }
        loc.phi = (nr == this.nside) ? 0.75 * Constants.halfpi * tmp * this.fact1 : (0.5 * Constants.halfpi * tmp) / nr;
        // loc.setPhi((nr == this.nside) ? 0.75 * Constants.halfpi * tmp * this.fact1 : (0.5 * Constants.halfpi * tmp)/nr);
        return loc;
    }
    ;
    za2vec(z, a) {
        const sin_theta = Math.sqrt(1 - z * z);
        const X = sin_theta * Math.cos(a);
        const Y = sin_theta * Math.sin(a);
        return new Vec3(X, Y, z);
    }
    ang2vec(theta, phi) {
        const z = Math.cos(theta);
        return this.za2vec(z, phi);
    }
    vec2ang(v) {
        const { z, a } = this.vec2za(v.getX(), v.getY(), v.getZ());
        return { theta: Math.acos(z), phi: a };
    }
    vec2za(X, Y, z) {
        const r2 = X * X + Y * Y;
        if (r2 == 0)
            return { z: z < 0 ? -1 : 1, a: 0 };
        else {
            const PI2 = Math.PI / 2;
            const a = (Math.atan2(Y, X) + PI2) % PI2;
            z /= Math.sqrt(z * z + r2);
            return { z, a };
        }
    }
    ang2pix(ptg, mirror) {
        return this.loc2pix(new Hploc(ptg));
    }
    ;
    fmodulo(v1, v2) {
        if (v1 >= 0) {
            return (v1 < v2) ? v1 : v1 % v2;
        }
        var tmp = v1 % v2 + v2;
        return (tmp === v2) ? 0.0 : tmp;
    }
    ;
    compress_bits(v) {
        var raw = Math.floor((v & 0x5555)) | Math.floor(((v & 0x55550000) >>> 15));
        var compressed = this.ctab[raw & 0xff] | (this.ctab[raw >>> 8] << 4);
        return compressed;
    }
    ;
    spread_bits(v) {
        return Math.floor(this.utab[v & 0xff]) | Math.floor((this.utab[(v >>> 8) & 0xff] << 16))
            | Math.floor((this.utab[(v >>> 16) & 0xff] << 32)) | Math.floor((this.utab[(v >>> 24) & 0xff] << 48));
    }
    ;
    /**
     * Returns a range set of pixels that overlap with the convex polygon
     * defined by the {@code vertex} array.
     * <p>
     * This method is more efficient in the RING scheme.
     * <p>
     * This method may return some pixels which don't overlap with the polygon
     * at all. The higher {@code fact} is chosen, the fewer false positives are
     * returned, at the cost of increased run time.
     *
     * @param vertex
     *            an array containing the vertices of the requested convex
     *            polygon.
     * @param fact
     *            The overlapping test will be done at the resolution
     *            {@code fact*nside}. For NESTED ordering, {@code fact} must be
     *            a power of 2, else it can be any positive integer. A typical
     *            choice would be 4.
     * @return the requested set of pixel number ranges
     */
    queryPolygonInclusive(vertex, fact) {
        let inclusive = (fact != 0);
        let nv = vertex.length;
        //        let ncirc = inclusive ? nv+1 : nv;
        if (!(nv >= 3)) {
            console.log("not enough vertices in polygon");
            return;
        }
        let vv = new Array();
        for (let i = 0; i < nv; ++i) {
            vv[i] = Vec3.pointing2Vec3(vertex[i]);
        }
        let normal = new Array();
        let flip = 0;
        let index = 0;
        let back = false;
        while (index < vv.length) {
            let first = vv[index];
            let medium = null;
            let last = null;
            if (index == vv.length - 1) {
                last = vv[1];
                medium = vv[0];
            }
            else if (index == vv.length - 2) {
                last = vv[0];
                medium = vv[index + 1];
            }
            else {
                medium = vv[index + 1];
                last = vv[index + 2];
            }
            normal[index] = first.cross(medium).norm();
            let hnd = normal[index].dot(last);
            if (index == 0) {
                flip = (hnd < 0.) ? -1 : 1;
                let tmp = new Pointing(first); // TODO not used
                back = false;
            }
            else {
                let flipThnd = flip * hnd;
                if (flipThnd < 0) {
                    let tmp = new Pointing(medium);
                    vv.splice(index + 1, 1);
                    normal.splice(index, 1);
                    back = true;
                    index -= 1;
                    continue;
                }
                else {
                    let tmp = new Pointing(first);
                    back = false;
                }
            }
            normal[index].scale(flip);
            index += 1;
        }
        nv = vv.length;
        let ncirc = inclusive ? nv + 1 : nv;
        let rad = new Array(ncirc);
        rad = rad.fill(Constants.halfpi);
        //        rad = rad.fill(1.5707963267948966);
        //        let p = "1.5707963267948966";
        //        rad = rad.fill(parseFloat(p));
        if (inclusive) {
            let cf = new CircleFinder(vv);
            normal[nv] = cf.getCenter();
            rad[nv] = Hploc.acos(cf.getCosrad());
        }
        return this.queryMultiDisc(normal, rad, fact);
    }
    ;
    /**
     * For NEST schema only
     *
     * @param normal:
     *            Vec3[]
     * @param rad:
     *            Float32Array
     * @param fact:
     *            The overlapping test will be done at the resolution
     *            {@code fact*nside}. For NESTED ordering, {@code fact} must be
     *            a power of 2, else it can be any positive integer. A typical
     *            choice would be 4.
     * @return RangeSet the requested set of pixel number ranges
     */
    queryMultiDisc(norm, rad, fact) {
        this.computeBn();
        let inclusive = (fact != 0);
        let nv = norm.length;
        // HealpixUtils.check(nv==rad.lengt0,"inconsistent input arrays");
        if (!(nv == rad.length)) {
            console.error("inconsistent input arrays");
            return;
        }
        let res = new RangeSet(4 << 1);
        // Removed code for Scheme.RING
        let oplus = 0;
        if (inclusive) {
            if (!(Math.pow(2, this.order_max - this.order) >= fact)) {
                console.error("invalid oversampling factor");
            }
            if (!((fact & (fact - 1)) == 0)) {
                console.error("oversampling factor must be a power of 2");
            }
            oplus = this.ilog2(fact);
        }
        let omax = this.order + oplus; // the order up to which we test
        // TODO: ignore all disks with radius>=pi
        //        let crlimit = new Float32Array[omax+1][nv][3];
        let crlimit = new Array(omax + 1);
        let o;
        let i;
        for (o = 0; o <= omax; ++o) { // prepare data at the required orders
            crlimit[o] = new Array(nv);
            let dr = this.bn[o].maxPixrad(); // safety distance
            for (i = 0; i < nv; ++i) {
                crlimit[o][i] = new Float64Array(3);
                crlimit[o][i][0] = (rad[i] + dr > Math.PI) ? -1 : Hploc.cos(rad[i] + dr);
                crlimit[o][i][1] = (o == 0) ? Hploc.cos(rad[i]) : crlimit[0][i][1];
                crlimit[o][i][2] = (rad[i] - dr < 0.) ? 1. : Hploc.cos(rad[i] - dr);
            }
        }
        let stk = new pstack(12 + 3 * omax);
        for (let i = 0; i < 12; i++) { // insert the 12 base pixels in reverse
            // order
            stk.push(11 - i, 0);
        }
        while (stk.size() > 0) { // as long as there are pixels on the stack
            // pop current pixel number and order from the stack
            let pix = stk.ptop();
            let o = stk.otop();
            stk.pop();
            let pv = this.bn[o].pix2vec(pix);
            let zone = 3;
            for (let i = 0; (i < nv) && (zone > 0); ++i) {
                let crad = pv.dot(norm[i]);
                for (let iz = 0; iz < zone; ++iz) {
                    if (crad < crlimit[o][i][iz]) {
                        zone = iz;
                    }
                }
            }
            if (zone > 0) {
                this.check_pixel(o, omax, zone, res, pix, stk, inclusive);
            }
        }
        return res;
    }
    ;
    /** Integer base 2 logarithm.
    @param arg
    @return the largest integer {@code n} that fulfills {@code 2^n<=arg}.
    For negative arguments and zero, 0 is returned. */
    ilog2(arg) {
        let max = Math.max(arg, 1);
        return 31 - Math.clz32(max);
    }
    ;
    /** Computes the cosine of the angular distance between two z, phi positions
      on the unit sphere. */
    cosdist_zphi(z1, phi1, z2, phi2) {
        return z1 * z2 + Hploc.cos(phi1 - phi2) * Math.sqrt((1.0 - z1 * z1) * (1.0 - z2 * z2));
    }
    /**
     * @param int o
     * @param int omax
     * @param int zone
     * @param RangeSet pixset
     * @param long pix
     * @param pstack stk
     * @param boolean inclusive
     */
    check_pixel(o, omax, zone, pixset, pix, stk, inclusive) {
        if (zone == 0)
            return;
        if (o < this.order) {
            if (zone >= 3) { // output all subpixels
                let sdist = 2 * (this.order - o); // the "bit-shift distance" between map orders
                pixset.append1(pix << sdist, ((pix + 1) << sdist));
            }
            else { // (zone>=1)
                for (let i = 0; i < 4; ++i) {
                    stk.push(4 * pix + 3 - i, o + 1); // add children
                }
            }
        }
        else if (o > this.order) { // this implies that inclusive==true
            if (zone >= 2) { // pixel center in shape
                pixset.append(pix >>> (2 * (o - this.order))); // output the parent pixel at order
                stk.popToMark(); // unwind the stack
            }
            else { // (zone>=1): pixel center in safety range
                if (o < omax) { // check sublevels
                    for (let i = 0; i < 4; ++i) { // add children in reverse order
                        stk.push(4 * pix + 3 - i, o + 1); // add children
                    }
                }
                else { // at resolution limit
                    pixset.append(pix >>> (2 * (o - this.order))); // output the parent pixel at order
                    stk.popToMark(); // unwind the stack
                }
            }
        }
        else { // o==order
            if (zone >= 2) {
                pixset.append(pix);
            }
            else if (inclusive) { // and (zone>=1)
                if (this.order < omax) { // check sublevels
                    stk.mark(); // remember current stack position
                    for (let i = 0; i < 4; ++i) { // add children in reverse order
                        stk.push(4 * pix + 3 - i, o + 1); // add children
                    }
                }
                else { // at resolution limit
                    pixset.append(pix); // output the pixel
                }
            }
        }
    }
    /** Returns the maximum angular distance between a pixel center and its
    corners.
    @return maximum angular distance between a pixel center and its
      corners. */
    maxPixrad() {
        let zphia = new Zphi(2. / 3., Math.PI / this.nl4);
        let xyz1 = this.convertZphi2xyz(zphia);
        let va = new Vec3(xyz1[0], xyz1[1], xyz1[2]);
        let t1 = 1. - 1. / this.nside;
        t1 *= t1;
        let zphib = new Zphi(1 - t1 / 3, 0);
        let xyz2 = this.convertZphi2xyz(zphib);
        let vb = new Vec3(xyz2[0], xyz2[1], xyz2[2]);
        return va.angle(vb);
    }
    ;
    /**
     * this is a workaround replacing the Vec3(Zphi) constructor.
     */
    convertZphi2xyz(zphi) {
        let sth = Math.sqrt((1.0 - zphi.z) * (1.0 + zphi.z));
        let x = sth * Hploc.cos(zphi.phi);
        let y = sth * Hploc.sin(zphi.phi);
        let z = zphi.z;
        return [x, y, z];
    }
    ;
    /** Returns a range set of pixels which overlap with a given disk. <p>
      This method is more efficient in the RING scheme. <p>
      This method may return some pixels which don't overlap with
      the polygon at all. The higher {@code fact} is chosen, the fewer false
      positives are returned, at the cost of increased run time.
      @param ptg the angular coordinates of the disk center
      @param radius the radius (in radians) of the disk
      @param fact The overlapping test will be done at the resolution
        {@code fact*nside}. For NESTED ordering, {@code fact} must be a power
        of 2, else it can be any positive integer. A typical choice would be 4.
      @return the requested set of pixel number ranges  */
    queryDiscInclusive(ptg, radius, fact) {
        this.computeBn();
        let inclusive = (fact != 0);
        let pixset = new RangeSet();
        if (radius >= Math.PI) { // disk covers the whole sphere
            pixset.append1(0, this.npix);
            return pixset;
        }
        let oplus = 0;
        if (inclusive) {
            // HealpixUtils.check ((1L<<order_max)>=fact,"invalid oversampling factor");
            if (!((fact & (fact - 1)) == 0)) {
                console.error("oversampling factor must be a power of 2");
            }
            oplus = this.ilog2(fact);
        }
        let omax = Math.min(this.order_max, this.order + oplus); // the order up to which we test
        let vptg = Vec3.pointing2Vec3(ptg);
        let crpdr = new Array(omax + 1);
        let crmdr = new Array(omax + 1);
        let cosrad = Hploc.cos(radius);
        let sinrad = Hploc.sin(radius);
        for (let o = 0; o <= omax; o++) { // prepare data at the required orders
            let dr = this.mpr[o]; // safety distance
            let cdr = this.cmpr[o];
            let sdr = this.smpr[o];
            crpdr[o] = (radius + dr > Math.PI) ? -1. : cosrad * cdr - sinrad * sdr;
            crmdr[o] = (radius - dr < 0.) ? 1. : cosrad * cdr + sinrad * sdr;
        }
        let stk = new pstack(12 + 3 * omax);
        for (let i = 0; i < 12; i++) { // insert the 12 base pixels in reverse order
            stk.push(11 - i, 0);
        }
        while (stk.size() > 0) { // as long as there are pixels on the stack
            // pop current pixel number and order from the stack
            let pix = stk.ptop();
            let curro = stk.otop();
            stk.pop();
            let pos = this.bn[curro].pix2zphi(pix);
            // cosine of angular distance between pixel center and disk center
            let cangdist = this.cosdist_zphi(vptg.z, ptg.phi, pos.z, pos.phi);
            if (cangdist > crpdr[curro]) {
                let zone = (cangdist < cosrad) ? 1 : ((cangdist <= crmdr[curro]) ? 2 : 3);
                this.check_pixel(curro, omax, zone, pixset, pix, stk, inclusive);
            }
        }
        return pixset;
    }
}
//# sourceMappingURL=Healpix.js.map
;// ./node_modules/healpixjs/lib-esm/index.js











//# sourceMappingURL=index.js.map
;// ./src/Config.ts
const hipsNodes = (/* unused pure expression or super */ null && ([
    "https://skies.esac.esa.int/",
    "https://alasky.cds.unistra.fr/",
]));
// If you want to re-enable multiple TAP repos, just uncomment and extend the array
// export const tapRepos: string[] = [
//   "https://archive.eso.org/tap_cat/",
//   "https://archive.eso.org/tap_obs/",
//   "https://sky.esa.int/esasky-tap/tap/",
//   "https://ws.cadc-ccda.hia-iha.nrc-cnrc.gc.ca/argus",
// ];
const tapRepos = (/* unused pure expression or super */ null && ([
    "https://sky.esa.int/esasky-tap/tap/",
]));
const bootSetup = {
    insideSphere: false,
    defaultHips: "",
    camera_fov_deg: 34,
    camera_fov_rad: 34 * Math.PI / 180.0,
    camera_near_plane: 0.00001,
    camera_far_plane: 2.5,
    corsProxyUrl: "http://localhost:4000/",
    useCORSProxy: false,
    maxDecimals: 15,
    // defaultHipsUrl: "//alasky.u-strasbg.fr/DSS/DSSColor/",
    defaultHipsUrl: "https://cdn.skies.esac.esa.int/DSSColor/",
    version: "Astrobrowser v1.0.0",
    debug: false,
    insideView: false,
};

;// ./src/Global.ts



class Global {
    // --- cached / runtime state ---
    _camera;
    _gl;
    _healpix;
    // --- config/state flags ---
    _selectionnside;
    // private _healpix4footprints: boolean;
    _useCORSProxy;
    _corsProxyUrl;
    _maxDecimals;
    _debug;
    _insideSphere;
    _version;
    constructor() {
        this._useCORSProxy = bootSetup.useCORSProxy;
        this._corsProxyUrl = bootSetup.corsProxyUrl;
        this._maxDecimals = bootSetup.maxDecimals;
        this._debug = bootSetup.debug;
        this._insideSphere = bootSetup.insideView;
        this._version = bootSetup.version;
        this._camera = null;
        this._gl = null;
        this._healpix = {};
        this._selectionnside = 32;
        // this._healpix4footprints = false;
    }
    init() {
        console.log('Global.init()');
    }
    // --- getters/setters ---
    get version() { return this._version; }
    set corsProxyUrl(url) { this._corsProxyUrl = url; }
    get corsProxyUrl() { return this._corsProxyUrl; }
    get useCORSProxy() { return this._useCORSProxy; }
    set useCORSProxy(enabled) { this._useCORSProxy = enabled; }
    get debug() { return this._debug; }
    getHealpix(order) {
        if (this._healpix[order] === undefined) {
            // order is HEALPix "order" ⇒ nside = 2^order
            this._healpix[order] = new Healpix(Math.pow(2, order));
        }
        return this._healpix[order];
    }
    get MAX_DECIMALS() { return this._maxDecimals; }
    get camera() { return this._camera; }
    set camera(in_camera) { this._camera = in_camera; }
    get gl() { return this._gl; }
    set gl(in_gl) { this._gl = in_gl; }
    set insideSphere(v) { this._insideSphere = v; }
    get insideSphere() { return this._insideSphere; }
    get nsideForSelection() { return this._selectionnside; }
}
const global = new Global();
/* harmony default export */ const src_Global = (global);

;// ./node_modules/gl-matrix/esm/common.js
/**
 * Common utilities
 * @module glMatrix
 */

// Configuration Constants
var EPSILON = 0.000001;
var ARRAY_TYPE = typeof Float32Array !== "undefined" ? Float32Array : Array;
var RANDOM = Math.random;
var ANGLE_ORDER = "zyx";

/**
 * Symmetric round
 * see https://www.npmjs.com/package/round-half-up-symmetric#user-content-detailed-background
 *
 * @param {Number} a value to round
 */
function round(a) {
  if (a >= 0) return Math.round(a);
  return a % 0.5 === 0 ? Math.floor(a) : Math.round(a);
}

/**
 * Sets the type of array used when creating new vectors and matrices
 *
 * @param {Float32ArrayConstructor | ArrayConstructor} type Array type, such as Float32Array or Array
 */
function setMatrixArrayType(type) {
  ARRAY_TYPE = type;
}
var degree = Math.PI / 180;
var radian = 180 / Math.PI;

/**
 * Convert Degree To Radian
 *
 * @param {Number} a Angle in Degrees
 */
function toRadian(a) {
  return a * degree;
}

/**
 * Convert Radian To Degree
 *
 * @param {Number} a Angle in Radians
 */
function toDegree(a) {
  return a * radian;
}

/**
 * Tests whether or not the arguments have approximately the same value, within an absolute
 * or relative tolerance of glMatrix.EPSILON (an absolute tolerance is used for values less
 * than or equal to 1.0, and a relative tolerance is used for larger values)
 *
 * @param {Number} a          The first number to test.
 * @param {Number} b          The second number to test.
 * @param {Number} tolerance  Absolute or relative tolerance (default glMatrix.EPSILON)
 * @returns {Boolean} True if the numbers are approximately equal, false otherwise.
 */
function equals(a, b) {
  var tolerance = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : EPSILON;
  return Math.abs(a - b) <= tolerance * Math.max(1, Math.abs(a), Math.abs(b));
}
;// ./node_modules/gl-matrix/esm/vec3.js


/**
 * 3 Dimensional Vector
 * @module vec3
 */

/**
 * Creates a new, empty vec3
 *
 * @returns {vec3} a new 3D vector
 */
function create() {
  var out = new ARRAY_TYPE(3);
  if (ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
  }
  return out;
}

/**
 * Creates a new vec3 initialized with values from an existing vector
 *
 * @param {ReadonlyVec3} a vector to clone
 * @returns {vec3} a new 3D vector
 */
function clone(a) {
  var out = new ARRAY_TYPE(3);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  return out;
}

/**
 * Calculates the length of a vec3
 *
 * @param {ReadonlyVec3} a vector to calculate length of
 * @returns {Number} length of a
 */
function vec3_length(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  return Math.sqrt(x * x + y * y + z * z);
}

/**
 * Creates a new vec3 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} a new 3D vector
 */
function fromValues(x, y, z) {
  var out = new ARRAY_TYPE(3);
  out[0] = x;
  out[1] = y;
  out[2] = z;
  return out;
}

/**
 * Copy the values from one vec3 to another
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the source vector
 * @returns {vec3} out
 */
function copy(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  return out;
}

/**
 * Set the components of a vec3 to the given values
 *
 * @param {vec3} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} out
 */
function set(out, x, y, z) {
  out[0] = x;
  out[1] = y;
  out[2] = z;
  return out;
}

/**
 * Adds two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */
function add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  return out;
}

/**
 * Subtracts vector b from vector a
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */
function subtract(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  return out;
}

/**
 * Multiplies two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */
function multiply(out, a, b) {
  out[0] = a[0] * b[0];
  out[1] = a[1] * b[1];
  out[2] = a[2] * b[2];
  return out;
}

/**
 * Divides two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */
function divide(out, a, b) {
  out[0] = a[0] / b[0];
  out[1] = a[1] / b[1];
  out[2] = a[2] / b[2];
  return out;
}

/**
 * Math.ceil the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to ceil
 * @returns {vec3} out
 */
function ceil(out, a) {
  out[0] = Math.ceil(a[0]);
  out[1] = Math.ceil(a[1]);
  out[2] = Math.ceil(a[2]);
  return out;
}

/**
 * Math.floor the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to floor
 * @returns {vec3} out
 */
function floor(out, a) {
  out[0] = Math.floor(a[0]);
  out[1] = Math.floor(a[1]);
  out[2] = Math.floor(a[2]);
  return out;
}

/**
 * Returns the minimum of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */
function min(out, a, b) {
  out[0] = Math.min(a[0], b[0]);
  out[1] = Math.min(a[1], b[1]);
  out[2] = Math.min(a[2], b[2]);
  return out;
}

/**
 * Returns the maximum of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */
function max(out, a, b) {
  out[0] = Math.max(a[0], b[0]);
  out[1] = Math.max(a[1], b[1]);
  out[2] = Math.max(a[2], b[2]);
  return out;
}

/**
 * symmetric round the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to round
 * @returns {vec3} out
 */
function vec3_round(out, a) {
  out[0] = glMatrix.round(a[0]);
  out[1] = glMatrix.round(a[1]);
  out[2] = glMatrix.round(a[2]);
  return out;
}

/**
 * Scales a vec3 by a scalar number
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec3} out
 */
function scale(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  return out;
}

/**
 * Adds two vec3's after scaling the second operand by a scalar value
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec3} out
 */
function scaleAndAdd(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  out[2] = a[2] + b[2] * scale;
  return out;
}

/**
 * Calculates the euclidian distance between two vec3's
 *
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {Number} distance between a and b
 */
function distance(a, b) {
  var x = b[0] - a[0];
  var y = b[1] - a[1];
  var z = b[2] - a[2];
  return Math.sqrt(x * x + y * y + z * z);
}

/**
 * Calculates the squared euclidian distance between two vec3's
 *
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {Number} squared distance between a and b
 */
function squaredDistance(a, b) {
  var x = b[0] - a[0];
  var y = b[1] - a[1];
  var z = b[2] - a[2];
  return x * x + y * y + z * z;
}

/**
 * Calculates the squared length of a vec3
 *
 * @param {ReadonlyVec3} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */
function squaredLength(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  return x * x + y * y + z * z;
}

/**
 * Negates the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to negate
 * @returns {vec3} out
 */
function negate(out, a) {
  out[0] = -a[0];
  out[1] = -a[1];
  out[2] = -a[2];
  return out;
}

/**
 * Returns the inverse of the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to invert
 * @returns {vec3} out
 */
function inverse(out, a) {
  out[0] = 1.0 / a[0];
  out[1] = 1.0 / a[1];
  out[2] = 1.0 / a[2];
  return out;
}

/**
 * Normalize a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to normalize
 * @returns {vec3} out
 */
function normalize(out, a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var len = x * x + y * y + z * z;
  if (len > 0) {
    //TODO: evaluate use of glm_invsqrt here?
    len = 1 / Math.sqrt(len);
  }
  out[0] = a[0] * len;
  out[1] = a[1] * len;
  out[2] = a[2] * len;
  return out;
}

/**
 * Calculates the dot product of two vec3's
 *
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {Number} dot product of a and b
 */
function vec3_dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/**
 * Computes the cross product of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */
function cross(out, a, b) {
  var ax = a[0],
    ay = a[1],
    az = a[2];
  var bx = b[0],
    by = b[1],
    bz = b[2];
  out[0] = ay * bz - az * by;
  out[1] = az * bx - ax * bz;
  out[2] = ax * by - ay * bx;
  return out;
}

/**
 * Performs a linear interpolation between two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {vec3} out
 */
function lerp(out, a, b, t) {
  var ax = a[0];
  var ay = a[1];
  var az = a[2];
  out[0] = ax + t * (b[0] - ax);
  out[1] = ay + t * (b[1] - ay);
  out[2] = az + t * (b[2] - az);
  return out;
}

/**
 * Performs a spherical linear interpolation between two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {vec3} out
 */
function slerp(out, a, b, t) {
  var angle = Math.acos(Math.min(Math.max(vec3_dot(a, b), -1), 1));
  var sinTotal = Math.sin(angle);
  var ratioA = Math.sin((1 - t) * angle) / sinTotal;
  var ratioB = Math.sin(t * angle) / sinTotal;
  out[0] = ratioA * a[0] + ratioB * b[0];
  out[1] = ratioA * a[1] + ratioB * b[1];
  out[2] = ratioA * a[2] + ratioB * b[2];
  return out;
}

/**
 * Performs a hermite interpolation with two control points
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @param {ReadonlyVec3} c the third operand
 * @param {ReadonlyVec3} d the fourth operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {vec3} out
 */
function hermite(out, a, b, c, d, t) {
  var factorTimes2 = t * t;
  var factor1 = factorTimes2 * (2 * t - 3) + 1;
  var factor2 = factorTimes2 * (t - 2) + t;
  var factor3 = factorTimes2 * (t - 1);
  var factor4 = factorTimes2 * (3 - 2 * t);
  out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
  out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
  out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;
  return out;
}

/**
 * Performs a bezier interpolation with two control points
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @param {ReadonlyVec3} c the third operand
 * @param {ReadonlyVec3} d the fourth operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {vec3} out
 */
function bezier(out, a, b, c, d, t) {
  var inverseFactor = 1 - t;
  var inverseFactorTimesTwo = inverseFactor * inverseFactor;
  var factorTimes2 = t * t;
  var factor1 = inverseFactorTimesTwo * inverseFactor;
  var factor2 = 3 * t * inverseFactorTimesTwo;
  var factor3 = 3 * factorTimes2 * inverseFactor;
  var factor4 = factorTimes2 * t;
  out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
  out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
  out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;
  return out;
}

/**
 * Generates a random vector with the given scale
 *
 * @param {vec3} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If omitted, a unit vector will be returned
 * @returns {vec3} out
 */
function random(out, scale) {
  scale = scale === undefined ? 1.0 : scale;
  var r = glMatrix.RANDOM() * 2.0 * Math.PI;
  var z = glMatrix.RANDOM() * 2.0 - 1.0;
  var zScale = Math.sqrt(1.0 - z * z) * scale;
  out[0] = Math.cos(r) * zScale;
  out[1] = Math.sin(r) * zScale;
  out[2] = z * scale;
  return out;
}

/**
 * Transforms the vec3 with a mat4.
 * 4th vector component is implicitly '1'
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the vector to transform
 * @param {ReadonlyMat4} m matrix to transform with
 * @returns {vec3} out
 */
function transformMat4(out, a, m) {
  var x = a[0],
    y = a[1],
    z = a[2];
  var w = m[3] * x + m[7] * y + m[11] * z + m[15];
  w = w || 1.0;
  out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
  out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
  out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
  return out;
}

/**
 * Transforms the vec3 with a mat3.
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the vector to transform
 * @param {ReadonlyMat3} m the 3x3 matrix to transform with
 * @returns {vec3} out
 */
function transformMat3(out, a, m) {
  var x = a[0],
    y = a[1],
    z = a[2];
  out[0] = x * m[0] + y * m[3] + z * m[6];
  out[1] = x * m[1] + y * m[4] + z * m[7];
  out[2] = x * m[2] + y * m[5] + z * m[8];
  return out;
}

/**
 * Transforms the vec3 with a quat
 * Can also be used for dual quaternions. (Multiply it with the real part)
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the vector to transform
 * @param {ReadonlyQuat} q normalized quaternion to transform with
 * @returns {vec3} out
 */
function transformQuat(out, a, q) {
  // Fast Vector Rotation using Quaternions by Robert Eisele
  // https://raw.org/proof/vector-rotation-using-quaternions/

  var qx = q[0],
    qy = q[1],
    qz = q[2],
    qw = q[3];
  var vx = a[0],
    vy = a[1],
    vz = a[2];

  // t = q x v
  var tx = qy * vz - qz * vy;
  var ty = qz * vx - qx * vz;
  var tz = qx * vy - qy * vx;

  // t = 2t
  tx = tx + tx;
  ty = ty + ty;
  tz = tz + tz;

  // v + w t + q x t
  out[0] = vx + qw * tx + qy * tz - qz * ty;
  out[1] = vy + qw * ty + qz * tx - qx * tz;
  out[2] = vz + qw * tz + qx * ty - qy * tx;
  return out;
}

/**
 * Rotate a 3D vector around the x-axis
 * @param {vec3} out The receiving vec3
 * @param {ReadonlyVec3} a The vec3 point to rotate
 * @param {ReadonlyVec3} b The origin of the rotation
 * @param {Number} rad The angle of rotation in radians
 * @returns {vec3} out
 */
function rotateX(out, a, b, rad) {
  var p = [],
    r = [];
  //Translate point to the origin
  p[0] = a[0] - b[0];
  p[1] = a[1] - b[1];
  p[2] = a[2] - b[2];

  //perform rotation
  r[0] = p[0];
  r[1] = p[1] * Math.cos(rad) - p[2] * Math.sin(rad);
  r[2] = p[1] * Math.sin(rad) + p[2] * Math.cos(rad);

  //translate to correct position
  out[0] = r[0] + b[0];
  out[1] = r[1] + b[1];
  out[2] = r[2] + b[2];
  return out;
}

/**
 * Rotate a 3D vector around the y-axis
 * @param {vec3} out The receiving vec3
 * @param {ReadonlyVec3} a The vec3 point to rotate
 * @param {ReadonlyVec3} b The origin of the rotation
 * @param {Number} rad The angle of rotation in radians
 * @returns {vec3} out
 */
function rotateY(out, a, b, rad) {
  var p = [],
    r = [];
  //Translate point to the origin
  p[0] = a[0] - b[0];
  p[1] = a[1] - b[1];
  p[2] = a[2] - b[2];

  //perform rotation
  r[0] = p[2] * Math.sin(rad) + p[0] * Math.cos(rad);
  r[1] = p[1];
  r[2] = p[2] * Math.cos(rad) - p[0] * Math.sin(rad);

  //translate to correct position
  out[0] = r[0] + b[0];
  out[1] = r[1] + b[1];
  out[2] = r[2] + b[2];
  return out;
}

/**
 * Rotate a 3D vector around the z-axis
 * @param {vec3} out The receiving vec3
 * @param {ReadonlyVec3} a The vec3 point to rotate
 * @param {ReadonlyVec3} b The origin of the rotation
 * @param {Number} rad The angle of rotation in radians
 * @returns {vec3} out
 */
function rotateZ(out, a, b, rad) {
  var p = [],
    r = [];
  //Translate point to the origin
  p[0] = a[0] - b[0];
  p[1] = a[1] - b[1];
  p[2] = a[2] - b[2];

  //perform rotation
  r[0] = p[0] * Math.cos(rad) - p[1] * Math.sin(rad);
  r[1] = p[0] * Math.sin(rad) + p[1] * Math.cos(rad);
  r[2] = p[2];

  //translate to correct position
  out[0] = r[0] + b[0];
  out[1] = r[1] + b[1];
  out[2] = r[2] + b[2];
  return out;
}

/**
 * Get the angle between two 3D vectors
 * @param {ReadonlyVec3} a The first operand
 * @param {ReadonlyVec3} b The second operand
 * @returns {Number} The angle in radians
 */
function angle(a, b) {
  var ax = a[0],
    ay = a[1],
    az = a[2],
    bx = b[0],
    by = b[1],
    bz = b[2],
    mag = Math.sqrt((ax * ax + ay * ay + az * az) * (bx * bx + by * by + bz * bz)),
    cosine = mag && vec3_dot(a, b) / mag;
  return Math.acos(Math.min(Math.max(cosine, -1), 1));
}

/**
 * Set the components of a vec3 to zero
 *
 * @param {vec3} out the receiving vector
 * @returns {vec3} out
 */
function zero(out) {
  out[0] = 0.0;
  out[1] = 0.0;
  out[2] = 0.0;
  return out;
}

/**
 * Returns a string representation of a vector
 *
 * @param {ReadonlyVec3} a vector to represent as a string
 * @returns {String} string representation of the vector
 */
function str(a) {
  return "vec3(" + a[0] + ", " + a[1] + ", " + a[2] + ")";
}

/**
 * Returns whether or not the vectors have exactly the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyVec3} a The first vector.
 * @param {ReadonlyVec3} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
function exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

/**
 * Returns whether or not the vectors have approximately the same elements in the same position.
 *
 * @param {ReadonlyVec3} a The first vector.
 * @param {ReadonlyVec3} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
function vec3_equals(a, b) {
  var a0 = a[0],
    a1 = a[1],
    a2 = a[2];
  var b0 = b[0],
    b1 = b[1],
    b2 = b[2];
  return Math.abs(a0 - b0) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2));
}

/**
 * Alias for {@link vec3.subtract}
 * @function
 */
var sub = (/* unused pure expression or super */ null && (subtract));

/**
 * Alias for {@link vec3.multiply}
 * @function
 */
var mul = (/* unused pure expression or super */ null && (multiply));

/**
 * Alias for {@link vec3.divide}
 * @function
 */
var div = (/* unused pure expression or super */ null && (divide));

/**
 * Alias for {@link vec3.distance}
 * @function
 */
var dist = (/* unused pure expression or super */ null && (distance));

/**
 * Alias for {@link vec3.squaredDistance}
 * @function
 */
var sqrDist = (/* unused pure expression or super */ null && (squaredDistance));

/**
 * Alias for {@link vec3.length}
 * @function
 */
var len = (/* unused pure expression or super */ null && (vec3_length));

/**
 * Alias for {@link vec3.squaredLength}
 * @function
 */
var sqrLen = (/* unused pure expression or super */ null && (squaredLength));

/**
 * Perform some operation over an array of vec3s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
var forEach = function () {
  var vec = create();
  return function (a, stride, offset, count, fn, arg) {
    var i, l;
    if (!stride) {
      stride = 3;
    }
    if (!offset) {
      offset = 0;
    }
    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }
    for (i = offset; i < l; i += stride) {
      vec[0] = a[i];
      vec[1] = a[i + 1];
      vec[2] = a[i + 2];
      fn(vec, vec, arg);
      a[i] = vec[0];
      a[i + 1] = vec[1];
      a[i + 2] = vec[2];
    }
    return a;
  };
}();
;// ./node_modules/gl-matrix/esm/mat4.js


/**
 * 4x4 Matrix<br>Format: column-major, when typed out it looks like row-major<br>The matrices are being post multiplied.
 * @module mat4
 */

/**
 * Creates a new identity mat4
 *
 * @returns {mat4} a new 4x4 matrix
 */
function mat4_create() {
  var out = new ARRAY_TYPE(16);
  if (ARRAY_TYPE != Float32Array) {
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
  }
  out[0] = 1;
  out[5] = 1;
  out[10] = 1;
  out[15] = 1;
  return out;
}

/**
 * Creates a new mat4 initialized with values from an existing matrix
 *
 * @param {ReadonlyMat4} a matrix to clone
 * @returns {mat4} a new 4x4 matrix
 */
function mat4_clone(a) {
  var out = new ARRAY_TYPE(16);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  out[6] = a[6];
  out[7] = a[7];
  out[8] = a[8];
  out[9] = a[9];
  out[10] = a[10];
  out[11] = a[11];
  out[12] = a[12];
  out[13] = a[13];
  out[14] = a[14];
  out[15] = a[15];
  return out;
}

/**
 * Copy the values from one mat4 to another
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the source matrix
 * @returns {mat4} out
 */
function mat4_copy(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  out[6] = a[6];
  out[7] = a[7];
  out[8] = a[8];
  out[9] = a[9];
  out[10] = a[10];
  out[11] = a[11];
  out[12] = a[12];
  out[13] = a[13];
  out[14] = a[14];
  out[15] = a[15];
  return out;
}

/**
 * Create a new mat4 with the given values
 *
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m02 Component in column 0, row 2 position (index 2)
 * @param {Number} m03 Component in column 0, row 3 position (index 3)
 * @param {Number} m10 Component in column 1, row 0 position (index 4)
 * @param {Number} m11 Component in column 1, row 1 position (index 5)
 * @param {Number} m12 Component in column 1, row 2 position (index 6)
 * @param {Number} m13 Component in column 1, row 3 position (index 7)
 * @param {Number} m20 Component in column 2, row 0 position (index 8)
 * @param {Number} m21 Component in column 2, row 1 position (index 9)
 * @param {Number} m22 Component in column 2, row 2 position (index 10)
 * @param {Number} m23 Component in column 2, row 3 position (index 11)
 * @param {Number} m30 Component in column 3, row 0 position (index 12)
 * @param {Number} m31 Component in column 3, row 1 position (index 13)
 * @param {Number} m32 Component in column 3, row 2 position (index 14)
 * @param {Number} m33 Component in column 3, row 3 position (index 15)
 * @returns {mat4} A new mat4
 */
function mat4_fromValues(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
  var out = new glMatrix.ARRAY_TYPE(16);
  out[0] = m00;
  out[1] = m01;
  out[2] = m02;
  out[3] = m03;
  out[4] = m10;
  out[5] = m11;
  out[6] = m12;
  out[7] = m13;
  out[8] = m20;
  out[9] = m21;
  out[10] = m22;
  out[11] = m23;
  out[12] = m30;
  out[13] = m31;
  out[14] = m32;
  out[15] = m33;
  return out;
}

/**
 * Set the components of a mat4 to the given values
 *
 * @param {mat4} out the receiving matrix
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m02 Component in column 0, row 2 position (index 2)
 * @param {Number} m03 Component in column 0, row 3 position (index 3)
 * @param {Number} m10 Component in column 1, row 0 position (index 4)
 * @param {Number} m11 Component in column 1, row 1 position (index 5)
 * @param {Number} m12 Component in column 1, row 2 position (index 6)
 * @param {Number} m13 Component in column 1, row 3 position (index 7)
 * @param {Number} m20 Component in column 2, row 0 position (index 8)
 * @param {Number} m21 Component in column 2, row 1 position (index 9)
 * @param {Number} m22 Component in column 2, row 2 position (index 10)
 * @param {Number} m23 Component in column 2, row 3 position (index 11)
 * @param {Number} m30 Component in column 3, row 0 position (index 12)
 * @param {Number} m31 Component in column 3, row 1 position (index 13)
 * @param {Number} m32 Component in column 3, row 2 position (index 14)
 * @param {Number} m33 Component in column 3, row 3 position (index 15)
 * @returns {mat4} out
 */
function mat4_set(out, m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
  out[0] = m00;
  out[1] = m01;
  out[2] = m02;
  out[3] = m03;
  out[4] = m10;
  out[5] = m11;
  out[6] = m12;
  out[7] = m13;
  out[8] = m20;
  out[9] = m21;
  out[10] = m22;
  out[11] = m23;
  out[12] = m30;
  out[13] = m31;
  out[14] = m32;
  out[15] = m33;
  return out;
}

/**
 * Set a mat4 to the identity matrix
 *
 * @param {mat4} out the receiving matrix
 * @returns {mat4} out
 */
function identity(out) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}

/**
 * Transpose the values of a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the source matrix
 * @returns {mat4} out
 */
function transpose(out, a) {
  // If we are transposing ourselves we can skip a few steps but have to cache some values
  if (out === a) {
    var a01 = a[1],
      a02 = a[2],
      a03 = a[3];
    var a12 = a[6],
      a13 = a[7];
    var a23 = a[11];
    out[1] = a[4];
    out[2] = a[8];
    out[3] = a[12];
    out[4] = a01;
    out[6] = a[9];
    out[7] = a[13];
    out[8] = a02;
    out[9] = a12;
    out[11] = a[14];
    out[12] = a03;
    out[13] = a13;
    out[14] = a23;
  } else {
    out[0] = a[0];
    out[1] = a[4];
    out[2] = a[8];
    out[3] = a[12];
    out[4] = a[1];
    out[5] = a[5];
    out[6] = a[9];
    out[7] = a[13];
    out[8] = a[2];
    out[9] = a[6];
    out[10] = a[10];
    out[11] = a[14];
    out[12] = a[3];
    out[13] = a[7];
    out[14] = a[11];
    out[15] = a[15];
  }
  return out;
}

/**
 * Inverts a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the source matrix
 * @returns {mat4 | null} out, or null if source matrix is not invertible
 */
function invert(out, a) {
  var a00 = a[0],
    a01 = a[1],
    a02 = a[2],
    a03 = a[3];
  var a10 = a[4],
    a11 = a[5],
    a12 = a[6],
    a13 = a[7];
  var a20 = a[8],
    a21 = a[9],
    a22 = a[10],
    a23 = a[11];
  var a30 = a[12],
    a31 = a[13],
    a32 = a[14],
    a33 = a[15];
  var b00 = a00 * a11 - a01 * a10;
  var b01 = a00 * a12 - a02 * a10;
  var b02 = a00 * a13 - a03 * a10;
  var b03 = a01 * a12 - a02 * a11;
  var b04 = a01 * a13 - a03 * a11;
  var b05 = a02 * a13 - a03 * a12;
  var b06 = a20 * a31 - a21 * a30;
  var b07 = a20 * a32 - a22 * a30;
  var b08 = a20 * a33 - a23 * a30;
  var b09 = a21 * a32 - a22 * a31;
  var b10 = a21 * a33 - a23 * a31;
  var b11 = a22 * a33 - a23 * a32;

  // Calculate the determinant
  var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  if (!det) {
    return null;
  }
  det = 1.0 / det;
  out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
  out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
  out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
  out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
  out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
  out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
  out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
  out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
  out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
  out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
  out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
  out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
  out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
  out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
  out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
  out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
  return out;
}

/**
 * Calculates the adjugate of a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the source matrix
 * @returns {mat4} out
 */
function adjoint(out, a) {
  var a00 = a[0],
    a01 = a[1],
    a02 = a[2],
    a03 = a[3];
  var a10 = a[4],
    a11 = a[5],
    a12 = a[6],
    a13 = a[7];
  var a20 = a[8],
    a21 = a[9],
    a22 = a[10],
    a23 = a[11];
  var a30 = a[12],
    a31 = a[13],
    a32 = a[14],
    a33 = a[15];
  var b00 = a00 * a11 - a01 * a10;
  var b01 = a00 * a12 - a02 * a10;
  var b02 = a00 * a13 - a03 * a10;
  var b03 = a01 * a12 - a02 * a11;
  var b04 = a01 * a13 - a03 * a11;
  var b05 = a02 * a13 - a03 * a12;
  var b06 = a20 * a31 - a21 * a30;
  var b07 = a20 * a32 - a22 * a30;
  var b08 = a20 * a33 - a23 * a30;
  var b09 = a21 * a32 - a22 * a31;
  var b10 = a21 * a33 - a23 * a31;
  var b11 = a22 * a33 - a23 * a32;
  out[0] = a11 * b11 - a12 * b10 + a13 * b09;
  out[1] = a02 * b10 - a01 * b11 - a03 * b09;
  out[2] = a31 * b05 - a32 * b04 + a33 * b03;
  out[3] = a22 * b04 - a21 * b05 - a23 * b03;
  out[4] = a12 * b08 - a10 * b11 - a13 * b07;
  out[5] = a00 * b11 - a02 * b08 + a03 * b07;
  out[6] = a32 * b02 - a30 * b05 - a33 * b01;
  out[7] = a20 * b05 - a22 * b02 + a23 * b01;
  out[8] = a10 * b10 - a11 * b08 + a13 * b06;
  out[9] = a01 * b08 - a00 * b10 - a03 * b06;
  out[10] = a30 * b04 - a31 * b02 + a33 * b00;
  out[11] = a21 * b02 - a20 * b04 - a23 * b00;
  out[12] = a11 * b07 - a10 * b09 - a12 * b06;
  out[13] = a00 * b09 - a01 * b07 + a02 * b06;
  out[14] = a31 * b01 - a30 * b03 - a32 * b00;
  out[15] = a20 * b03 - a21 * b01 + a22 * b00;
  return out;
}

/**
 * Calculates the determinant of a mat4
 *
 * @param {ReadonlyMat4} a the source matrix
 * @returns {Number} determinant of a
 */
function determinant(a) {
  var a00 = a[0],
    a01 = a[1],
    a02 = a[2],
    a03 = a[3];
  var a10 = a[4],
    a11 = a[5],
    a12 = a[6],
    a13 = a[7];
  var a20 = a[8],
    a21 = a[9],
    a22 = a[10],
    a23 = a[11];
  var a30 = a[12],
    a31 = a[13],
    a32 = a[14],
    a33 = a[15];
  var b0 = a00 * a11 - a01 * a10;
  var b1 = a00 * a12 - a02 * a10;
  var b2 = a01 * a12 - a02 * a11;
  var b3 = a20 * a31 - a21 * a30;
  var b4 = a20 * a32 - a22 * a30;
  var b5 = a21 * a32 - a22 * a31;
  var b6 = a00 * b5 - a01 * b4 + a02 * b3;
  var b7 = a10 * b5 - a11 * b4 + a12 * b3;
  var b8 = a20 * b2 - a21 * b1 + a22 * b0;
  var b9 = a30 * b2 - a31 * b1 + a32 * b0;

  // Calculate the determinant
  return a13 * b6 - a03 * b7 + a33 * b8 - a23 * b9;
}

/**
 * Multiplies two mat4s
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the first operand
 * @param {ReadonlyMat4} b the second operand
 * @returns {mat4} out
 */
function mat4_multiply(out, a, b) {
  var a00 = a[0],
    a01 = a[1],
    a02 = a[2],
    a03 = a[3];
  var a10 = a[4],
    a11 = a[5],
    a12 = a[6],
    a13 = a[7];
  var a20 = a[8],
    a21 = a[9],
    a22 = a[10],
    a23 = a[11];
  var a30 = a[12],
    a31 = a[13],
    a32 = a[14],
    a33 = a[15];

  // Cache only the current line of the second matrix
  var b0 = b[0],
    b1 = b[1],
    b2 = b[2],
    b3 = b[3];
  out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[4];
  b1 = b[5];
  b2 = b[6];
  b3 = b[7];
  out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[8];
  b1 = b[9];
  b2 = b[10];
  b3 = b[11];
  out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[12];
  b1 = b[13];
  b2 = b[14];
  b3 = b[15];
  out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  return out;
}

/**
 * Translate a mat4 by the given vector
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to translate
 * @param {ReadonlyVec3} v vector to translate by
 * @returns {mat4} out
 */
function translate(out, a, v) {
  var x = v[0],
    y = v[1],
    z = v[2];
  var a00, a01, a02, a03;
  var a10, a11, a12, a13;
  var a20, a21, a22, a23;
  if (a === out) {
    out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
    out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
    out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
    out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
  } else {
    a00 = a[0];
    a01 = a[1];
    a02 = a[2];
    a03 = a[3];
    a10 = a[4];
    a11 = a[5];
    a12 = a[6];
    a13 = a[7];
    a20 = a[8];
    a21 = a[9];
    a22 = a[10];
    a23 = a[11];
    out[0] = a00;
    out[1] = a01;
    out[2] = a02;
    out[3] = a03;
    out[4] = a10;
    out[5] = a11;
    out[6] = a12;
    out[7] = a13;
    out[8] = a20;
    out[9] = a21;
    out[10] = a22;
    out[11] = a23;
    out[12] = a00 * x + a10 * y + a20 * z + a[12];
    out[13] = a01 * x + a11 * y + a21 * z + a[13];
    out[14] = a02 * x + a12 * y + a22 * z + a[14];
    out[15] = a03 * x + a13 * y + a23 * z + a[15];
  }
  return out;
}

/**
 * Scales the mat4 by the dimensions in the given vec3 not using vectorization
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to scale
 * @param {ReadonlyVec3} v the vec3 to scale the matrix by
 * @returns {mat4} out
 **/
function mat4_scale(out, a, v) {
  var x = v[0],
    y = v[1],
    z = v[2];
  out[0] = a[0] * x;
  out[1] = a[1] * x;
  out[2] = a[2] * x;
  out[3] = a[3] * x;
  out[4] = a[4] * y;
  out[5] = a[5] * y;
  out[6] = a[6] * y;
  out[7] = a[7] * y;
  out[8] = a[8] * z;
  out[9] = a[9] * z;
  out[10] = a[10] * z;
  out[11] = a[11] * z;
  out[12] = a[12];
  out[13] = a[13];
  out[14] = a[14];
  out[15] = a[15];
  return out;
}

/**
 * Rotates a mat4 by the given angle around the given axis
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @param {ReadonlyVec3} axis the axis to rotate around
 * @returns {mat4} out
 */
function rotate(out, a, rad, axis) {
  var x = axis[0],
    y = axis[1],
    z = axis[2];
  var len = Math.sqrt(x * x + y * y + z * z);
  var s, c, t;
  var a00, a01, a02, a03;
  var a10, a11, a12, a13;
  var a20, a21, a22, a23;
  var b00, b01, b02;
  var b10, b11, b12;
  var b20, b21, b22;
  if (len < EPSILON) {
    return null;
  }
  len = 1 / len;
  x *= len;
  y *= len;
  z *= len;
  s = Math.sin(rad);
  c = Math.cos(rad);
  t = 1 - c;
  a00 = a[0];
  a01 = a[1];
  a02 = a[2];
  a03 = a[3];
  a10 = a[4];
  a11 = a[5];
  a12 = a[6];
  a13 = a[7];
  a20 = a[8];
  a21 = a[9];
  a22 = a[10];
  a23 = a[11];

  // Construct the elements of the rotation matrix
  b00 = x * x * t + c;
  b01 = y * x * t + z * s;
  b02 = z * x * t - y * s;
  b10 = x * y * t - z * s;
  b11 = y * y * t + c;
  b12 = z * y * t + x * s;
  b20 = x * z * t + y * s;
  b21 = y * z * t - x * s;
  b22 = z * z * t + c;

  // Perform rotation-specific matrix multiplication
  out[0] = a00 * b00 + a10 * b01 + a20 * b02;
  out[1] = a01 * b00 + a11 * b01 + a21 * b02;
  out[2] = a02 * b00 + a12 * b01 + a22 * b02;
  out[3] = a03 * b00 + a13 * b01 + a23 * b02;
  out[4] = a00 * b10 + a10 * b11 + a20 * b12;
  out[5] = a01 * b10 + a11 * b11 + a21 * b12;
  out[6] = a02 * b10 + a12 * b11 + a22 * b12;
  out[7] = a03 * b10 + a13 * b11 + a23 * b12;
  out[8] = a00 * b20 + a10 * b21 + a20 * b22;
  out[9] = a01 * b20 + a11 * b21 + a21 * b22;
  out[10] = a02 * b20 + a12 * b21 + a22 * b22;
  out[11] = a03 * b20 + a13 * b21 + a23 * b22;
  if (a !== out) {
    // If the source and destination differ, copy the unchanged last row
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }
  return out;
}

/**
 * Rotates a matrix by the given angle around the X axis
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
function mat4_rotateX(out, a, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  var a10 = a[4];
  var a11 = a[5];
  var a12 = a[6];
  var a13 = a[7];
  var a20 = a[8];
  var a21 = a[9];
  var a22 = a[10];
  var a23 = a[11];
  if (a !== out) {
    // If the source and destination differ, copy the unchanged rows
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }

  // Perform axis-specific matrix multiplication
  out[4] = a10 * c + a20 * s;
  out[5] = a11 * c + a21 * s;
  out[6] = a12 * c + a22 * s;
  out[7] = a13 * c + a23 * s;
  out[8] = a20 * c - a10 * s;
  out[9] = a21 * c - a11 * s;
  out[10] = a22 * c - a12 * s;
  out[11] = a23 * c - a13 * s;
  return out;
}

/**
 * Rotates a matrix by the given angle around the Y axis
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
function mat4_rotateY(out, a, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  var a00 = a[0];
  var a01 = a[1];
  var a02 = a[2];
  var a03 = a[3];
  var a20 = a[8];
  var a21 = a[9];
  var a22 = a[10];
  var a23 = a[11];
  if (a !== out) {
    // If the source and destination differ, copy the unchanged rows
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }

  // Perform axis-specific matrix multiplication
  out[0] = a00 * c - a20 * s;
  out[1] = a01 * c - a21 * s;
  out[2] = a02 * c - a22 * s;
  out[3] = a03 * c - a23 * s;
  out[8] = a00 * s + a20 * c;
  out[9] = a01 * s + a21 * c;
  out[10] = a02 * s + a22 * c;
  out[11] = a03 * s + a23 * c;
  return out;
}

/**
 * Rotates a matrix by the given angle around the Z axis
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
function mat4_rotateZ(out, a, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  var a00 = a[0];
  var a01 = a[1];
  var a02 = a[2];
  var a03 = a[3];
  var a10 = a[4];
  var a11 = a[5];
  var a12 = a[6];
  var a13 = a[7];
  if (a !== out) {
    // If the source and destination differ, copy the unchanged last row
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }

  // Perform axis-specific matrix multiplication
  out[0] = a00 * c + a10 * s;
  out[1] = a01 * c + a11 * s;
  out[2] = a02 * c + a12 * s;
  out[3] = a03 * c + a13 * s;
  out[4] = a10 * c - a00 * s;
  out[5] = a11 * c - a01 * s;
  out[6] = a12 * c - a02 * s;
  out[7] = a13 * c - a03 * s;
  return out;
}

/**
 * Creates a matrix from a vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, dest, vec);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {ReadonlyVec3} v Translation vector
 * @returns {mat4} out
 */
function fromTranslation(out, v) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = v[0];
  out[13] = v[1];
  out[14] = v[2];
  out[15] = 1;
  return out;
}

/**
 * Creates a matrix from a vector scaling
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.scale(dest, dest, vec);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {ReadonlyVec3} v Scaling vector
 * @returns {mat4} out
 */
function fromScaling(out, v) {
  out[0] = v[0];
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = v[1];
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = v[2];
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}

/**
 * Creates a matrix from a given angle around a given axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotate(dest, dest, rad, axis);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @param {ReadonlyVec3} axis the axis to rotate around
 * @returns {mat4} out
 */
function fromRotation(out, rad, axis) {
  var x = axis[0],
    y = axis[1],
    z = axis[2];
  var len = Math.sqrt(x * x + y * y + z * z);
  var s, c, t;
  if (len < glMatrix.EPSILON) {
    return null;
  }
  len = 1 / len;
  x *= len;
  y *= len;
  z *= len;
  s = Math.sin(rad);
  c = Math.cos(rad);
  t = 1 - c;

  // Perform rotation-specific matrix multiplication
  out[0] = x * x * t + c;
  out[1] = y * x * t + z * s;
  out[2] = z * x * t - y * s;
  out[3] = 0;
  out[4] = x * y * t - z * s;
  out[5] = y * y * t + c;
  out[6] = z * y * t + x * s;
  out[7] = 0;
  out[8] = x * z * t + y * s;
  out[9] = y * z * t - x * s;
  out[10] = z * z * t + c;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}

/**
 * Creates a matrix from the given angle around the X axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotateX(dest, dest, rad);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
function fromXRotation(out, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);

  // Perform axis-specific matrix multiplication
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = c;
  out[6] = s;
  out[7] = 0;
  out[8] = 0;
  out[9] = -s;
  out[10] = c;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}

/**
 * Creates a matrix from the given angle around the Y axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotateY(dest, dest, rad);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
function fromYRotation(out, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);

  // Perform axis-specific matrix multiplication
  out[0] = c;
  out[1] = 0;
  out[2] = -s;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = s;
  out[9] = 0;
  out[10] = c;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}

/**
 * Creates a matrix from the given angle around the Z axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotateZ(dest, dest, rad);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
function fromZRotation(out, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);

  // Perform axis-specific matrix multiplication
  out[0] = c;
  out[1] = s;
  out[2] = 0;
  out[3] = 0;
  out[4] = -s;
  out[5] = c;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}

/**
 * Creates a matrix from a quaternion rotation and vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, dest, vec);
 *     let quatMat = mat4.create();
 *     mat4.fromQuat(quatMat, quat);
 *     mat4.multiply(dest, dest, quatMat);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat} q Rotation quaternion
 * @param {ReadonlyVec3} v Translation vector
 * @returns {mat4} out
 */
function fromRotationTranslation(out, q, v) {
  // Quaternion math
  var x = q[0],
    y = q[1],
    z = q[2],
    w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;
  var xx = x * x2;
  var xy = x * y2;
  var xz = x * z2;
  var yy = y * y2;
  var yz = y * z2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;
  out[0] = 1 - (yy + zz);
  out[1] = xy + wz;
  out[2] = xz - wy;
  out[3] = 0;
  out[4] = xy - wz;
  out[5] = 1 - (xx + zz);
  out[6] = yz + wx;
  out[7] = 0;
  out[8] = xz + wy;
  out[9] = yz - wx;
  out[10] = 1 - (xx + yy);
  out[11] = 0;
  out[12] = v[0];
  out[13] = v[1];
  out[14] = v[2];
  out[15] = 1;
  return out;
}

/**
 * Creates a new mat4 from a dual quat.
 *
 * @param {mat4} out Matrix
 * @param {ReadonlyQuat2} a Dual Quaternion
 * @returns {mat4} mat4 receiving operation result
 */
function fromQuat2(out, a) {
  var translation = new glMatrix.ARRAY_TYPE(3);
  var bx = -a[0],
    by = -a[1],
    bz = -a[2],
    bw = a[3],
    ax = a[4],
    ay = a[5],
    az = a[6],
    aw = a[7];
  var magnitude = bx * bx + by * by + bz * bz + bw * bw;
  //Only scale if it makes sense
  if (magnitude > 0) {
    translation[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2 / magnitude;
    translation[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2 / magnitude;
    translation[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2 / magnitude;
  } else {
    translation[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2;
    translation[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2;
    translation[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2;
  }
  fromRotationTranslation(out, a, translation);
  return out;
}

/**
 * Returns the translation vector component of a transformation
 *  matrix. If a matrix is built with fromRotationTranslation,
 *  the returned vector will be the same as the translation vector
 *  originally supplied.
 * @param  {vec3} out Vector to receive translation component
 * @param  {ReadonlyMat4} mat Matrix to be decomposed (input)
 * @return {vec3} out
 */
function getTranslation(out, mat) {
  out[0] = mat[12];
  out[1] = mat[13];
  out[2] = mat[14];
  return out;
}

/**
 * Returns the scaling factor component of a transformation
 *  matrix. If a matrix is built with fromRotationTranslationScale
 *  with a normalized Quaternion parameter, the returned vector will be
 *  the same as the scaling vector
 *  originally supplied.
 * @param  {vec3} out Vector to receive scaling factor component
 * @param  {ReadonlyMat4} mat Matrix to be decomposed (input)
 * @return {vec3} out
 */
function getScaling(out, mat) {
  var m11 = mat[0];
  var m12 = mat[1];
  var m13 = mat[2];
  var m21 = mat[4];
  var m22 = mat[5];
  var m23 = mat[6];
  var m31 = mat[8];
  var m32 = mat[9];
  var m33 = mat[10];
  out[0] = Math.sqrt(m11 * m11 + m12 * m12 + m13 * m13);
  out[1] = Math.sqrt(m21 * m21 + m22 * m22 + m23 * m23);
  out[2] = Math.sqrt(m31 * m31 + m32 * m32 + m33 * m33);
  return out;
}

/**
 * Returns a quaternion representing the rotational component
 *  of a transformation matrix. If a matrix is built with
 *  fromRotationTranslation, the returned quaternion will be the
 *  same as the quaternion originally supplied.
 * @param {quat} out Quaternion to receive the rotation component
 * @param {ReadonlyMat4} mat Matrix to be decomposed (input)
 * @return {quat} out
 */
function getRotation(out, mat) {
  var scaling = new glMatrix.ARRAY_TYPE(3);
  getScaling(scaling, mat);
  var is1 = 1 / scaling[0];
  var is2 = 1 / scaling[1];
  var is3 = 1 / scaling[2];
  var sm11 = mat[0] * is1;
  var sm12 = mat[1] * is2;
  var sm13 = mat[2] * is3;
  var sm21 = mat[4] * is1;
  var sm22 = mat[5] * is2;
  var sm23 = mat[6] * is3;
  var sm31 = mat[8] * is1;
  var sm32 = mat[9] * is2;
  var sm33 = mat[10] * is3;
  var trace = sm11 + sm22 + sm33;
  var S = 0;
  if (trace > 0) {
    S = Math.sqrt(trace + 1.0) * 2;
    out[3] = 0.25 * S;
    out[0] = (sm23 - sm32) / S;
    out[1] = (sm31 - sm13) / S;
    out[2] = (sm12 - sm21) / S;
  } else if (sm11 > sm22 && sm11 > sm33) {
    S = Math.sqrt(1.0 + sm11 - sm22 - sm33) * 2;
    out[3] = (sm23 - sm32) / S;
    out[0] = 0.25 * S;
    out[1] = (sm12 + sm21) / S;
    out[2] = (sm31 + sm13) / S;
  } else if (sm22 > sm33) {
    S = Math.sqrt(1.0 + sm22 - sm11 - sm33) * 2;
    out[3] = (sm31 - sm13) / S;
    out[0] = (sm12 + sm21) / S;
    out[1] = 0.25 * S;
    out[2] = (sm23 + sm32) / S;
  } else {
    S = Math.sqrt(1.0 + sm33 - sm11 - sm22) * 2;
    out[3] = (sm12 - sm21) / S;
    out[0] = (sm31 + sm13) / S;
    out[1] = (sm23 + sm32) / S;
    out[2] = 0.25 * S;
  }
  return out;
}

/**
 * Decomposes a transformation matrix into its rotation, translation
 * and scale components. Returns only the rotation component
 * @param  {quat} out_r Quaternion to receive the rotation component
 * @param  {vec3} out_t Vector to receive the translation vector
 * @param  {vec3} out_s Vector to receive the scaling factor
 * @param  {ReadonlyMat4} mat Matrix to be decomposed (input)
 * @returns {quat} out_r
 */
function decompose(out_r, out_t, out_s, mat) {
  out_t[0] = mat[12];
  out_t[1] = mat[13];
  out_t[2] = mat[14];
  var m11 = mat[0];
  var m12 = mat[1];
  var m13 = mat[2];
  var m21 = mat[4];
  var m22 = mat[5];
  var m23 = mat[6];
  var m31 = mat[8];
  var m32 = mat[9];
  var m33 = mat[10];
  out_s[0] = Math.sqrt(m11 * m11 + m12 * m12 + m13 * m13);
  out_s[1] = Math.sqrt(m21 * m21 + m22 * m22 + m23 * m23);
  out_s[2] = Math.sqrt(m31 * m31 + m32 * m32 + m33 * m33);
  var is1 = 1 / out_s[0];
  var is2 = 1 / out_s[1];
  var is3 = 1 / out_s[2];
  var sm11 = m11 * is1;
  var sm12 = m12 * is2;
  var sm13 = m13 * is3;
  var sm21 = m21 * is1;
  var sm22 = m22 * is2;
  var sm23 = m23 * is3;
  var sm31 = m31 * is1;
  var sm32 = m32 * is2;
  var sm33 = m33 * is3;
  var trace = sm11 + sm22 + sm33;
  var S = 0;
  if (trace > 0) {
    S = Math.sqrt(trace + 1.0) * 2;
    out_r[3] = 0.25 * S;
    out_r[0] = (sm23 - sm32) / S;
    out_r[1] = (sm31 - sm13) / S;
    out_r[2] = (sm12 - sm21) / S;
  } else if (sm11 > sm22 && sm11 > sm33) {
    S = Math.sqrt(1.0 + sm11 - sm22 - sm33) * 2;
    out_r[3] = (sm23 - sm32) / S;
    out_r[0] = 0.25 * S;
    out_r[1] = (sm12 + sm21) / S;
    out_r[2] = (sm31 + sm13) / S;
  } else if (sm22 > sm33) {
    S = Math.sqrt(1.0 + sm22 - sm11 - sm33) * 2;
    out_r[3] = (sm31 - sm13) / S;
    out_r[0] = (sm12 + sm21) / S;
    out_r[1] = 0.25 * S;
    out_r[2] = (sm23 + sm32) / S;
  } else {
    S = Math.sqrt(1.0 + sm33 - sm11 - sm22) * 2;
    out_r[3] = (sm12 - sm21) / S;
    out_r[0] = (sm31 + sm13) / S;
    out_r[1] = (sm23 + sm32) / S;
    out_r[2] = 0.25 * S;
  }
  return out_r;
}

/**
 * Creates a matrix from a quaternion rotation, vector translation and vector scale
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, dest, vec);
 *     let quatMat = mat4.create();
 *     mat4.fromQuat(quatMat, quat);
 *     mat4.multiply(dest, dest, quatMat);
 *     mat4.scale(dest, dest, scale)
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat} q Rotation quaternion
 * @param {ReadonlyVec3} v Translation vector
 * @param {ReadonlyVec3} s Scaling vector
 * @returns {mat4} out
 */
function fromRotationTranslationScale(out, q, v, s) {
  // Quaternion math
  var x = q[0],
    y = q[1],
    z = q[2],
    w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;
  var xx = x * x2;
  var xy = x * y2;
  var xz = x * z2;
  var yy = y * y2;
  var yz = y * z2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;
  var sx = s[0];
  var sy = s[1];
  var sz = s[2];
  out[0] = (1 - (yy + zz)) * sx;
  out[1] = (xy + wz) * sx;
  out[2] = (xz - wy) * sx;
  out[3] = 0;
  out[4] = (xy - wz) * sy;
  out[5] = (1 - (xx + zz)) * sy;
  out[6] = (yz + wx) * sy;
  out[7] = 0;
  out[8] = (xz + wy) * sz;
  out[9] = (yz - wx) * sz;
  out[10] = (1 - (xx + yy)) * sz;
  out[11] = 0;
  out[12] = v[0];
  out[13] = v[1];
  out[14] = v[2];
  out[15] = 1;
  return out;
}

/**
 * Creates a matrix from a quaternion rotation, vector translation and vector scale, rotating and scaling around the given origin
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, dest, vec);
 *     mat4.translate(dest, dest, origin);
 *     let quatMat = mat4.create();
 *     mat4.fromQuat(quatMat, quat);
 *     mat4.multiply(dest, dest, quatMat);
 *     mat4.scale(dest, dest, scale)
 *     mat4.translate(dest, dest, negativeOrigin);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat} q Rotation quaternion
 * @param {ReadonlyVec3} v Translation vector
 * @param {ReadonlyVec3} s Scaling vector
 * @param {ReadonlyVec3} o The origin vector around which to scale and rotate
 * @returns {mat4} out
 */
function fromRotationTranslationScaleOrigin(out, q, v, s, o) {
  // Quaternion math
  var x = q[0],
    y = q[1],
    z = q[2],
    w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;
  var xx = x * x2;
  var xy = x * y2;
  var xz = x * z2;
  var yy = y * y2;
  var yz = y * z2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;
  var sx = s[0];
  var sy = s[1];
  var sz = s[2];
  var ox = o[0];
  var oy = o[1];
  var oz = o[2];
  var out0 = (1 - (yy + zz)) * sx;
  var out1 = (xy + wz) * sx;
  var out2 = (xz - wy) * sx;
  var out4 = (xy - wz) * sy;
  var out5 = (1 - (xx + zz)) * sy;
  var out6 = (yz + wx) * sy;
  var out8 = (xz + wy) * sz;
  var out9 = (yz - wx) * sz;
  var out10 = (1 - (xx + yy)) * sz;
  out[0] = out0;
  out[1] = out1;
  out[2] = out2;
  out[3] = 0;
  out[4] = out4;
  out[5] = out5;
  out[6] = out6;
  out[7] = 0;
  out[8] = out8;
  out[9] = out9;
  out[10] = out10;
  out[11] = 0;
  out[12] = v[0] + ox - (out0 * ox + out4 * oy + out8 * oz);
  out[13] = v[1] + oy - (out1 * ox + out5 * oy + out9 * oz);
  out[14] = v[2] + oz - (out2 * ox + out6 * oy + out10 * oz);
  out[15] = 1;
  return out;
}

/**
 * Calculates a 4x4 matrix from the given quaternion
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {ReadonlyQuat} q Quaternion to create matrix from
 *
 * @returns {mat4} out
 */
function fromQuat(out, q) {
  var x = q[0],
    y = q[1],
    z = q[2],
    w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;
  var xx = x * x2;
  var yx = y * x2;
  var yy = y * y2;
  var zx = z * x2;
  var zy = z * y2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;
  out[0] = 1 - yy - zz;
  out[1] = yx + wz;
  out[2] = zx - wy;
  out[3] = 0;
  out[4] = yx - wz;
  out[5] = 1 - xx - zz;
  out[6] = zy + wx;
  out[7] = 0;
  out[8] = zx + wy;
  out[9] = zy - wx;
  out[10] = 1 - xx - yy;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}

/**
 * Generates a frustum matrix with the given bounds
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {Number} left Left bound of the frustum
 * @param {Number} right Right bound of the frustum
 * @param {Number} bottom Bottom bound of the frustum
 * @param {Number} top Top bound of the frustum
 * @param {Number} near Near bound of the frustum
 * @param {Number} far Far bound of the frustum
 * @returns {mat4} out
 */
function frustum(out, left, right, bottom, top, near, far) {
  var rl = 1 / (right - left);
  var tb = 1 / (top - bottom);
  var nf = 1 / (near - far);
  out[0] = near * 2 * rl;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = near * 2 * tb;
  out[6] = 0;
  out[7] = 0;
  out[8] = (right + left) * rl;
  out[9] = (top + bottom) * tb;
  out[10] = (far + near) * nf;
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[14] = far * near * 2 * nf;
  out[15] = 0;
  return out;
}

/**
 * Generates a perspective projection matrix with the given bounds.
 * The near/far clip planes correspond to a normalized device coordinate Z range of [-1, 1],
 * which matches WebGL/OpenGL's clip volume.
 * Passing null/undefined/no value for far will generate infinite projection matrix.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} fovy Vertical field of view in radians
 * @param {number} aspect Aspect ratio. typically viewport width/height
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum, can be null or Infinity
 * @returns {mat4} out
 */
function perspectiveNO(out, fovy, aspect, near, far) {
  var f = 1.0 / Math.tan(fovy / 2);
  out[0] = f / aspect;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = f;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[15] = 0;
  if (far != null && far !== Infinity) {
    var nf = 1 / (near - far);
    out[10] = (far + near) * nf;
    out[14] = 2 * far * near * nf;
  } else {
    out[10] = -1;
    out[14] = -2 * near;
  }
  return out;
}

/**
 * Alias for {@link mat4.perspectiveNO}
 * @function
 */
var perspective = perspectiveNO;

/**
 * Generates a perspective projection matrix suitable for WebGPU with the given bounds.
 * The near/far clip planes correspond to a normalized device coordinate Z range of [0, 1],
 * which matches WebGPU/Vulkan/DirectX/Metal's clip volume.
 * Passing null/undefined/no value for far will generate infinite projection matrix.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} fovy Vertical field of view in radians
 * @param {number} aspect Aspect ratio. typically viewport width/height
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum, can be null or Infinity
 * @returns {mat4} out
 */
function perspectiveZO(out, fovy, aspect, near, far) {
  var f = 1.0 / Math.tan(fovy / 2);
  out[0] = f / aspect;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = f;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[15] = 0;
  if (far != null && far !== Infinity) {
    var nf = 1 / (near - far);
    out[10] = far * nf;
    out[14] = far * near * nf;
  } else {
    out[10] = -1;
    out[14] = -near;
  }
  return out;
}

/**
 * Generates a perspective projection matrix with the given field of view.
 * This is primarily useful for generating projection matrices to be used
 * with the still experiemental WebVR API.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {Object} fov Object containing the following values: upDegrees, downDegrees, leftDegrees, rightDegrees
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */
function perspectiveFromFieldOfView(out, fov, near, far) {
  var upTan = Math.tan(fov.upDegrees * Math.PI / 180.0);
  var downTan = Math.tan(fov.downDegrees * Math.PI / 180.0);
  var leftTan = Math.tan(fov.leftDegrees * Math.PI / 180.0);
  var rightTan = Math.tan(fov.rightDegrees * Math.PI / 180.0);
  var xScale = 2.0 / (leftTan + rightTan);
  var yScale = 2.0 / (upTan + downTan);
  out[0] = xScale;
  out[1] = 0.0;
  out[2] = 0.0;
  out[3] = 0.0;
  out[4] = 0.0;
  out[5] = yScale;
  out[6] = 0.0;
  out[7] = 0.0;
  out[8] = -((leftTan - rightTan) * xScale * 0.5);
  out[9] = (upTan - downTan) * yScale * 0.5;
  out[10] = far / (near - far);
  out[11] = -1.0;
  out[12] = 0.0;
  out[13] = 0.0;
  out[14] = far * near / (near - far);
  out[15] = 0.0;
  return out;
}

/**
 * Generates a orthogonal projection matrix with the given bounds.
 * The near/far clip planes correspond to a normalized device coordinate Z range of [-1, 1],
 * which matches WebGL/OpenGL's clip volume.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} left Left bound of the frustum
 * @param {number} right Right bound of the frustum
 * @param {number} bottom Bottom bound of the frustum
 * @param {number} top Top bound of the frustum
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */
function orthoNO(out, left, right, bottom, top, near, far) {
  var lr = 1 / (left - right);
  var bt = 1 / (bottom - top);
  var nf = 1 / (near - far);
  out[0] = -2 * lr;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = -2 * bt;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 2 * nf;
  out[11] = 0;
  out[12] = (left + right) * lr;
  out[13] = (top + bottom) * bt;
  out[14] = (far + near) * nf;
  out[15] = 1;
  return out;
}

/**
 * Alias for {@link mat4.orthoNO}
 * @function
 */
var ortho = (/* unused pure expression or super */ null && (orthoNO));

/**
 * Generates a orthogonal projection matrix with the given bounds.
 * The near/far clip planes correspond to a normalized device coordinate Z range of [0, 1],
 * which matches WebGPU/Vulkan/DirectX/Metal's clip volume.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} left Left bound of the frustum
 * @param {number} right Right bound of the frustum
 * @param {number} bottom Bottom bound of the frustum
 * @param {number} top Top bound of the frustum
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */
function orthoZO(out, left, right, bottom, top, near, far) {
  var lr = 1 / (left - right);
  var bt = 1 / (bottom - top);
  var nf = 1 / (near - far);
  out[0] = -2 * lr;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = -2 * bt;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = nf;
  out[11] = 0;
  out[12] = (left + right) * lr;
  out[13] = (top + bottom) * bt;
  out[14] = near * nf;
  out[15] = 1;
  return out;
}

/**
 * Generates a look-at matrix with the given eye position, focal point, and up axis.
 * If you want a matrix that actually makes an object look at another object, you should use targetTo instead.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {ReadonlyVec3} eye Position of the viewer
 * @param {ReadonlyVec3} center Point the viewer is looking at
 * @param {ReadonlyVec3} up vec3 pointing up
 * @returns {mat4} out
 */
function lookAt(out, eye, center, up) {
  var x0, x1, x2, y0, y1, y2, z0, z1, z2, len;
  var eyex = eye[0];
  var eyey = eye[1];
  var eyez = eye[2];
  var upx = up[0];
  var upy = up[1];
  var upz = up[2];
  var centerx = center[0];
  var centery = center[1];
  var centerz = center[2];
  if (Math.abs(eyex - centerx) < glMatrix.EPSILON && Math.abs(eyey - centery) < glMatrix.EPSILON && Math.abs(eyez - centerz) < glMatrix.EPSILON) {
    return identity(out);
  }
  z0 = eyex - centerx;
  z1 = eyey - centery;
  z2 = eyez - centerz;
  len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
  z0 *= len;
  z1 *= len;
  z2 *= len;
  x0 = upy * z2 - upz * z1;
  x1 = upz * z0 - upx * z2;
  x2 = upx * z1 - upy * z0;
  len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
  if (!len) {
    x0 = 0;
    x1 = 0;
    x2 = 0;
  } else {
    len = 1 / len;
    x0 *= len;
    x1 *= len;
    x2 *= len;
  }
  y0 = z1 * x2 - z2 * x1;
  y1 = z2 * x0 - z0 * x2;
  y2 = z0 * x1 - z1 * x0;
  len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
  if (!len) {
    y0 = 0;
    y1 = 0;
    y2 = 0;
  } else {
    len = 1 / len;
    y0 *= len;
    y1 *= len;
    y2 *= len;
  }
  out[0] = x0;
  out[1] = y0;
  out[2] = z0;
  out[3] = 0;
  out[4] = x1;
  out[5] = y1;
  out[6] = z1;
  out[7] = 0;
  out[8] = x2;
  out[9] = y2;
  out[10] = z2;
  out[11] = 0;
  out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
  out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
  out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
  out[15] = 1;
  return out;
}

/**
 * Generates a matrix that makes something look at something else.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {ReadonlyVec3} eye Position of the viewer
 * @param {ReadonlyVec3} target Point the viewer is looking at
 * @param {ReadonlyVec3} up vec3 pointing up
 * @returns {mat4} out
 */
function targetTo(out, eye, target, up) {
  var eyex = eye[0],
    eyey = eye[1],
    eyez = eye[2],
    upx = up[0],
    upy = up[1],
    upz = up[2];
  var z0 = eyex - target[0],
    z1 = eyey - target[1],
    z2 = eyez - target[2];
  var len = z0 * z0 + z1 * z1 + z2 * z2;
  if (len > 0) {
    len = 1 / Math.sqrt(len);
    z0 *= len;
    z1 *= len;
    z2 *= len;
  }
  var x0 = upy * z2 - upz * z1,
    x1 = upz * z0 - upx * z2,
    x2 = upx * z1 - upy * z0;
  len = x0 * x0 + x1 * x1 + x2 * x2;
  if (len > 0) {
    len = 1 / Math.sqrt(len);
    x0 *= len;
    x1 *= len;
    x2 *= len;
  }
  out[0] = x0;
  out[1] = x1;
  out[2] = x2;
  out[3] = 0;
  out[4] = z1 * x2 - z2 * x1;
  out[5] = z2 * x0 - z0 * x2;
  out[6] = z0 * x1 - z1 * x0;
  out[7] = 0;
  out[8] = z0;
  out[9] = z1;
  out[10] = z2;
  out[11] = 0;
  out[12] = eyex;
  out[13] = eyey;
  out[14] = eyez;
  out[15] = 1;
  return out;
}

/**
 * Returns a string representation of a mat4
 *
 * @param {ReadonlyMat4} a matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
function mat4_str(a) {
  return "mat4(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ", " + a[4] + ", " + a[5] + ", " + a[6] + ", " + a[7] + ", " + a[8] + ", " + a[9] + ", " + a[10] + ", " + a[11] + ", " + a[12] + ", " + a[13] + ", " + a[14] + ", " + a[15] + ")";
}

/**
 * Returns Frobenius norm of a mat4
 *
 * @param {ReadonlyMat4} a the matrix to calculate Frobenius norm of
 * @returns {Number} Frobenius norm
 */
function frob(a) {
  return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2] + a[3] * a[3] + a[4] * a[4] + a[5] * a[5] + a[6] * a[6] + a[7] * a[7] + a[8] * a[8] + a[9] * a[9] + a[10] * a[10] + a[11] * a[11] + a[12] * a[12] + a[13] * a[13] + a[14] * a[14] + a[15] * a[15]);
}

/**
 * Adds two mat4's
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the first operand
 * @param {ReadonlyMat4} b the second operand
 * @returns {mat4} out
 */
function mat4_add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  out[3] = a[3] + b[3];
  out[4] = a[4] + b[4];
  out[5] = a[5] + b[5];
  out[6] = a[6] + b[6];
  out[7] = a[7] + b[7];
  out[8] = a[8] + b[8];
  out[9] = a[9] + b[9];
  out[10] = a[10] + b[10];
  out[11] = a[11] + b[11];
  out[12] = a[12] + b[12];
  out[13] = a[13] + b[13];
  out[14] = a[14] + b[14];
  out[15] = a[15] + b[15];
  return out;
}

/**
 * Subtracts matrix b from matrix a
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the first operand
 * @param {ReadonlyMat4} b the second operand
 * @returns {mat4} out
 */
function mat4_subtract(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  out[3] = a[3] - b[3];
  out[4] = a[4] - b[4];
  out[5] = a[5] - b[5];
  out[6] = a[6] - b[6];
  out[7] = a[7] - b[7];
  out[8] = a[8] - b[8];
  out[9] = a[9] - b[9];
  out[10] = a[10] - b[10];
  out[11] = a[11] - b[11];
  out[12] = a[12] - b[12];
  out[13] = a[13] - b[13];
  out[14] = a[14] - b[14];
  out[15] = a[15] - b[15];
  return out;
}

/**
 * Multiply each element of the matrix by a scalar.
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to scale
 * @param {Number} b amount to scale the matrix's elements by
 * @returns {mat4} out
 */
function multiplyScalar(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  out[3] = a[3] * b;
  out[4] = a[4] * b;
  out[5] = a[5] * b;
  out[6] = a[6] * b;
  out[7] = a[7] * b;
  out[8] = a[8] * b;
  out[9] = a[9] * b;
  out[10] = a[10] * b;
  out[11] = a[11] * b;
  out[12] = a[12] * b;
  out[13] = a[13] * b;
  out[14] = a[14] * b;
  out[15] = a[15] * b;
  return out;
}

/**
 * Adds two mat4's after multiplying each element of the second operand by a scalar value.
 *
 * @param {mat4} out the receiving vector
 * @param {ReadonlyMat4} a the first operand
 * @param {ReadonlyMat4} b the second operand
 * @param {Number} scale the amount to scale b's elements by before adding
 * @returns {mat4} out
 */
function multiplyScalarAndAdd(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  out[2] = a[2] + b[2] * scale;
  out[3] = a[3] + b[3] * scale;
  out[4] = a[4] + b[4] * scale;
  out[5] = a[5] + b[5] * scale;
  out[6] = a[6] + b[6] * scale;
  out[7] = a[7] + b[7] * scale;
  out[8] = a[8] + b[8] * scale;
  out[9] = a[9] + b[9] * scale;
  out[10] = a[10] + b[10] * scale;
  out[11] = a[11] + b[11] * scale;
  out[12] = a[12] + b[12] * scale;
  out[13] = a[13] + b[13] * scale;
  out[14] = a[14] + b[14] * scale;
  out[15] = a[15] + b[15] * scale;
  return out;
}

/**
 * Returns whether or not the matrices have exactly the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyMat4} a The first matrix.
 * @param {ReadonlyMat4} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
function mat4_exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7] && a[8] === b[8] && a[9] === b[9] && a[10] === b[10] && a[11] === b[11] && a[12] === b[12] && a[13] === b[13] && a[14] === b[14] && a[15] === b[15];
}

/**
 * Returns whether or not the matrices have approximately the same elements in the same position.
 *
 * @param {ReadonlyMat4} a The first matrix.
 * @param {ReadonlyMat4} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
function mat4_equals(a, b) {
  var a0 = a[0],
    a1 = a[1],
    a2 = a[2],
    a3 = a[3];
  var a4 = a[4],
    a5 = a[5],
    a6 = a[6],
    a7 = a[7];
  var a8 = a[8],
    a9 = a[9],
    a10 = a[10],
    a11 = a[11];
  var a12 = a[12],
    a13 = a[13],
    a14 = a[14],
    a15 = a[15];
  var b0 = b[0],
    b1 = b[1],
    b2 = b[2],
    b3 = b[3];
  var b4 = b[4],
    b5 = b[5],
    b6 = b[6],
    b7 = b[7];
  var b8 = b[8],
    b9 = b[9],
    b10 = b[10],
    b11 = b[11];
  var b12 = b[12],
    b13 = b[13],
    b14 = b[14],
    b15 = b[15];
  return Math.abs(a0 - b0) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a5), Math.abs(b5)) && Math.abs(a6 - b6) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a6), Math.abs(b6)) && Math.abs(a7 - b7) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a7), Math.abs(b7)) && Math.abs(a8 - b8) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a8), Math.abs(b8)) && Math.abs(a9 - b9) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a9), Math.abs(b9)) && Math.abs(a10 - b10) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a10), Math.abs(b10)) && Math.abs(a11 - b11) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a11), Math.abs(b11)) && Math.abs(a12 - b12) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a12), Math.abs(b12)) && Math.abs(a13 - b13) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a13), Math.abs(b13)) && Math.abs(a14 - b14) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a14), Math.abs(b14)) && Math.abs(a15 - b15) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a15), Math.abs(b15));
}

/**
 * Alias for {@link mat4.multiply}
 * @function
 */
var mat4_mul = (/* unused pure expression or super */ null && (mat4_multiply));

/**
 * Alias for {@link mat4.subtract}
 * @function
 */
var mat4_sub = (/* unused pure expression or super */ null && (mat4_subtract));
;// ./src/utils/Utils.ts
/**
 * @author Fabrizio Giordano (Fab)
 */

// results in degrees
function cartesianToSpherical(xyz) {
    const dotXYZ = vec3_dot(xyz, xyz);
    const r = Math.sqrt(dotXYZ);
    let theta = Math.acos(xyz[2] / r);
    theta = radToDeg(theta);
    // NB: in atan(y/x) is written with params switched atan2(x, y)
    let phi = Math.atan2(xyz[1], xyz[0]);
    phi = radToDeg(phi);
    if (phi < 0) {
        phi += 360;
    }
    return { phi, theta };
}
function colorHex2RGB(hexColor) {
    const hex1 = hexColor.substring(1, 3);
    const hex2 = hexColor.substring(3, 5);
    const hex3 = hexColor.substring(5, 7);
    const dec1 = parseInt(hex1, 16);
    const dec2 = parseInt(hex2, 16);
    const dec3 = parseInt(hex3, 16);
    const rgb1 = (dec1 / 255).toFixed(2);
    const rgb2 = (dec2 / 255).toFixed(2);
    const rgb3 = (dec3 / 255).toFixed(2);
    return [parseFloat(rgb1), parseFloat(rgb2), parseFloat(rgb3)];
}
function degToRad(degrees) {
    return (degrees / 180) * Math.PI;
}
function radToDeg(radians) {
    return (radians * 180) / Math.PI;
}
function sphericalToAstroDeg(phiDeg, thetaDeg) {
    let raDeg = phiDeg;
    if (raDeg < 0) {
        raDeg += 360;
    }
    const decDeg = 90 - thetaDeg;
    return { ra: raDeg, dec: decDeg };
}
function sphericalToCartesian(phiDeg, thetaDeg, r = 1) {
    const x = r * Math.sin(degToRad(thetaDeg)) * Math.cos(degToRad(phiDeg));
    const y = r * Math.sin(degToRad(thetaDeg)) * Math.sin(degToRad(phiDeg));
    const z = r * Math.cos(degToRad(thetaDeg));
    return [x, y, z];
}
function astroDegToSpherical(raDeg, decDeg) {
    let phiDeg = raDeg;
    if (phiDeg < 0) {
        phiDeg += 360;
    }
    const thetaDeg = 90 - decDeg;
    return { phi: phiDeg, theta: thetaDeg };
}
function raDegToHMS(raDeg) {
    const h = Math.floor(raDeg / 15);
    const m = Math.floor((raDeg / 15 - h) * 60);
    const s = (raDeg / 15 - h - m / 60) * 3600;
    return { h, m, s };
}
function decDegToDMS(decDeg) {
    let sign = 1;
    if (decDeg < 0) {
        sign = -1;
    }
    const decDegAbs = Math.abs(decDeg);
    let d = Math.trunc(decDegAbs);
    const m = Math.trunc((decDegAbs - d) * 60);
    const s = (decDegAbs - d - m / 60) * 3600;
    d = d * sign;
    return { d, m, s };
}

;// ./src/Camera.ts
/**
 * @author Fabrizio Giordano (Fab)
 */



class Camera {
    insideSphere = false;
    cam_pos = create(); // camera position
    cam_speed = 1.0;
    vMatrix = mat4_create(); // view matrix
    T = mat4_create(); // translation matrix
    R = mat4_create(); // rotation matrix
    // Optional state used in rotate helpers
    FoV = 180.0;
    previousFoV = 180.0;
    move = create();
    phi = 0; // accumulated yaw (radians)
    theta = 0; // accumulated pitch (radians)
    constructor(in_position, in_sphere) {
        this.init(in_position, in_sphere);
    }
    init(in_position, in_sphere) {
        this.insideSphere = in_sphere;
        this.cam_pos = clone(in_position);
        this.vMatrix = mat4_create();
        this.T = mat4_create();
        this.R = mat4_create();
        translate(this.T, this.T, [this.cam_pos[0], this.cam_pos[1], this.cam_pos[2]]);
        // reset helpers
        this.FoV = this.previousFoV = 180.0;
        this.move = clone([0, 0, 0]);
        const raDeg = 0;
        const decDeg = 0;
        this.goTo(raDeg, decDeg);
    }
    goTo(raDeg, decDeg) {
        // eslint-disable-next-line no-console
        console.log(`global.insideSphere: ${src_Global.insideSphere}`);
        // mirror RA
        const mirroredRA = 360 - raDeg;
        this.goToPhiTheta(astroDegToSpherical(mirroredRA, decDeg));
    }
    goToPhiTheta(ptDeg) {
        const xyz = sphericalToCartesian(ptDeg.phi, ptDeg.theta, this.cam_pos[2]);
        let cameraMatrix = mat4_create();
        cameraMatrix = translate(cameraMatrix, cameraMatrix, fromValues(xyz[0], xyz[1], xyz[2]));
        const focusPoint = [0.0, 0.0, 0.0];
        const cameraUp = clone([0.0, 1.0, 0.0]);
        const cameraPos = [cameraMatrix[12], cameraMatrix[13], cameraMatrix[14]];
        cameraMatrix = targetTo(cameraMatrix, cameraPos, focusPoint, cameraUp);
        this.R = mat4_clone(cameraMatrix);
        this.R[12] = 0;
        this.R[13] = 0;
        this.R[14] = 0;
        const viewMatrix = mat4_create();
        if (this.cam_pos[2] !== 0) {
            invert(viewMatrix, cameraMatrix);
        }
        this.vMatrix = viewMatrix;
    }
    toggleInsideSphere() {
        // if (inside !== global.insideSphere) {
        //   global.insideSphere = inside;
        if (src_Global.insideSphere) {
            if (this.cam_pos[2] <= 2) {
                this.cam_pos[2] = -2 + this.cam_pos[2];
            }
            else {
                this.cam_pos[2] = -0.005;
            }
        }
        else {
            this.cam_pos[2] = 2.0 + this.cam_pos[2];
        }
        translate(this.T, mat4_create(), this.cam_pos);
        this.refreshViewMatrix();
        // }
    }
    zoom(inertia) {
        this.move = clone([0, 0, 0]);
        this.move[2] += this.cam_speed * inertia;
        if (src_Global.insideSphere) {
            if (this.cam_pos[2] + this.move[2] >= -0.005 && inertia > 0) {
                this.cam_pos[2] = -0.005;
                inertia = 0;
            }
            else if (this.cam_pos[2] + this.move[2] <= -0.9885 && inertia < 0) {
                this.cam_pos[2] = -0.9885;
                inertia = 0;
            }
            else {
                this.cam_pos[2] += this.move[2];
            }
        }
        else {
            if (this.cam_pos[2] < 1.005) {
                this.move[2] *= this.cam_pos[2] / 100;
            }
            else if (this.cam_pos[2] < 1.05) {
                this.move[2] *= this.cam_pos[2] / 20;
            }
            else if (this.cam_pos[2] < 1.3) {
                this.move[2] *= this.cam_pos[2] / 3;
            }
            if (this.cam_pos[2] + this.move[2] <= 1.000001 && inertia < 0) {
                this.cam_pos[2] = 1.000001;
            }
            else {
                this.cam_pos[2] += this.move[2];
            }
            // NOTE: your original code adds move[2] twice; if that's unintended, remove this next line.
            // this.cam_pos[2] += this.move[2];
        }
        const identity = mat4_create();
        translate(this.T, identity, this.cam_pos);
        this.refreshViewMatrix();
    }
    /**
     * Move the camera forward/backward along its current viewing direction.
     * Positive distance moves *forward* (toward where the camera is looking),
     * negative distance moves *backward*.
     *
     * This does not enforce inside/outside-sphere bounds; if you want clamping,
     * handle it before calling or we can extend this to mimic `zoom()` bounds.
     */
    moveAlongView(distance) {
        // World-space forward vector: transform camera-space -Z by inverse rotation
        const R_inverse = mat4_create();
        invert(R_inverse, this.R);
        const forwardCam = fromValues(0, 0, -1); // camera looks along -Z in its local space
        const fwdWorld = create();
        transformMat4(fwdWorld, forwardCam, R_inverse);
        // Normalise to get direction only
        const len = Math.hypot(fwdWorld[0], fwdWorld[1], fwdWorld[2]);
        if (len > 0) {
            fwdWorld[0] /= len;
            fwdWorld[1] /= len;
            fwdWorld[2] /= len;
        }
        // Update camera position
        this.cam_pos[0] += fwdWorld[0] * distance;
        this.cam_pos[1] += fwdWorld[1] * distance;
        this.cam_pos[2] += fwdWorld[2] * distance;
        // Rebuild translation matrix and view matrix
        const identity = mat4_create();
        translate(this.T, identity, this.cam_pos);
        this.refreshViewMatrix();
    }
    translate(distance) {
        // const pos = this.getCameraPosition();
        this.cam_pos[2] = distance + 1;
        // vec3.scale(pos, pos, distance);
        const identity = mat4_create();
        translate(this.T, identity, this.cam_pos);
        this.refreshViewMatrix();
    }
    rotateZ(sign) {
        const factorRad = sign * 0.01;
        this.phi += factorRad;
        rotate(this.R, this.R, factorRad, [0, 0, 1]);
        this.refreshViewMatrix();
    }
    rotateY(sign) {
        const factorRad = sign * 0.01;
        this.phi += factorRad;
        rotate(this.R, this.R, factorRad, [0, 1, 0]);
        this.refreshViewMatrix();
    }
    rotateXRadian(radian) {
        rotate(this.R, this.R, radian, [1, 0, 0]);
        this.refreshViewMatrix();
    }
    rotateYRadian(radian) {
        this.phi += radian;
        rotate(this.R, this.R, radian, [0, 1, 0]);
        this.refreshViewMatrix();
    }
    rotateZRadian(radian) {
        rotate(this.R, this.R, radian, [0, 0, 1]);
        this.refreshViewMatrix();
    }
    rotateX(sign) {
        const factorRad = sign * 0.01;
        this.theta += factorRad;
        rotate(this.R, this.R, factorRad, [1, 0, 0]);
        this.refreshViewMatrix();
    }
    rotate(phi, theta) {
        const totRot = Math.sqrt(phi * phi + theta * theta);
        if (totRot === 0)
            return;
        const pos = this.getCameraPosition();
        const dist2Center = Math.sqrt(pos[0] * pos[0] + pos[1] * pos[1] + pos[2] * pos[2]);
        const usedRot = (totRot * (dist2Center - 1)) / 3.0;
        rotate(this.R, this.R, -usedRot, [theta / totRot, phi / totRot, 0]);
        this.refreshViewMatrix();
    }
    refreshViewMatrix() {
        const T_inverse = mat4_create();
        const R_inverse = mat4_create();
        invert(T_inverse, this.T);
        invert(R_inverse, this.R);
        mat4_multiply(this.vMatrix, T_inverse, R_inverse);
    }
    refreshFoV(currentFoV) {
        this.previousFoV = this.FoV;
        this.FoV = currentFoV;
    }
    getCameraMatrix() {
        return this.vMatrix;
    }
    getCameraPosition() {
        const inv = mat4_create();
        if (!invert(inv, this.vMatrix)) {
            // fallback — we already maintain cam_pos
            return [this.cam_pos[0], this.cam_pos[1], this.cam_pos[2]];
        }
        return [inv[12], inv[13], inv[14]];
    }
    // setCameraPosition(position: Vec3Tuple) {
    //   const inv = mat4.create();
    //   if (mat4.invert(inv, this.vMatrix)) {
    //     [inv[12], inv[13], inv[14]] = [position[0], position[1], position[2]]
    //     mat4.invert(this.vMatrix, inv)
    //   }
    // }
    setCameraPosition(position) {
        // Update authoritative position
        this.cam_pos = fromValues(position[0], position[1], position[2]);
        // Rebuild translation matrix from cam_pos
        translate(this.T, mat4_create(), this.cam_pos);
        // Do NOT touch this.R here (keep orientation)
        // Recompute view: vMatrix = inv(T) * inv(R)
        this.refreshViewMatrix();
    }
    getCameraAngle() {
        const [x, y, z] = this.getCameraPosition();
        const posVec = fromValues(x, y, z);
        const ptDeg = cartesianToSpherical(posVec);
        // eslint-disable-next-line no-console
        console.log("[Camera::getCameraAngle]", ptDeg);
        return ptDeg;
    }
}
/* harmony default export */ const src_Camera = (Camera);

;// ./src/utils/ComputePerspectiveMatrix.ts

class ComputePerspectiveMatrixSingleton {
    _pMatrix = null;
    _aspectRatio = 1;
    get pMatrix() {
        return this._pMatrix;
    }
    computePerspectiveMatrix(canvas, camera, fovDeg, nearPlane = 0.1, insideSphere) {
        this._aspectRatio = canvas.width / canvas.height;
        const p = mat4_create();
        let farPlane;
        if (insideSphere) {
            // Inside the sphere: cap slightly beyond radius
            farPlane = 1.1;
        }
        else {
            const camMat = camera.getCameraMatrix();
            const distCamera = -Number(camMat[14]); // camera z translation
            const r = 1; // HiPS sphere radius (inject real value if available)
            // Guard against negative due to rounding/logic
            const c2 = Math.sqrt(Math.max(distCamera ** 2 - r ** 2, 0));
            const beta = Math.atan2(c2, r);
            const cf = c2 * Math.sin(beta);
            farPlane = cf > 0 ? cf : r;
        }
        perspective(p, (fovDeg * Math.PI) / 180, this._aspectRatio, nearPlane, farPlane);
        this._pMatrix = p;
        return p;
    }
}
const computePerspectiveMatrixSingleton = new ComputePerspectiveMatrixSingleton();
/* harmony default export */ const ComputePerspectiveMatrix = (computePerspectiveMatrixSingleton);

;// ./src/model/AbstractSkyEntity.ts
/**
 * @author Fabrizio Giordano (Fab)
 */


class AbstractSkyEntity {
    // Public-ish properties used elsewhere in the app
    refreshMe = false;
    fovX_deg = 180;
    fovY_deg = 180;
    xRad;
    yRad;
    prevFoV = this.fovX_deg;
    name;
    // public insideSphere: boolean = bootSetup.insideSphere
    // Picking/sphere
    center;
    radius;
    isGalacticHips;
    // GL resources
    vertexTextureCoordBuffer = null;
    vertexPositionBuffer = null;
    vertexIndexBuffer = null;
    shaderProgram = null;
    // Matrices
    T = mat4_create();
    R = mat4_create();
    modelMatrix = mat4_create();
    inverseModelMatrix = mat4_create();
    // Precomputed transform from galactic to equatorial (already inverted)
    galacticMatrixInverted = mat4_create();
    constructor(in_radius, in_position, in_xRad, in_yRad, in_name, isGalacticHips) {
        this.xRad = in_xRad;
        this.yRad = in_yRad;
        this.name = in_name;
        this.center = clone(in_position);
        this.radius = in_radius;
        // this.insideSphere = global.insideSphere
        this.isGalacticHips = !!isGalacticHips;
        // Fill the matrix via Float32Array.set (safer than mat4.set with 16 scalars)
        mat4_set(this.galacticMatrixInverted, -0.054875582456588745, -0.8734370470046997, -0.48383501172065735, 0, 0.49410945177078247, -0.4448296129703522, 0.7469822764396667, 0, -0.8676661849021912, -0.19807636737823486, 0.4559837877750397, 0, 0, 0, 0, 1);
    }
    /** GL setup and initial model transform */
    initGL(gl) {
        // GL resources
        this.vertexTextureCoordBuffer = gl.createBuffer();
        this.vertexPositionBuffer = gl.createBuffer();
        this.vertexIndexBuffer = gl.createBuffer();
        this.shaderProgram = gl.createProgram();
        // Reset object transforms
        this.T = mat4_create();
        this.R = mat4_create();
        this.modelMatrix = mat4_create();
        this.inverseModelMatrix = mat4_create();
        // Initial pose
        this.translate(this.center);
        this.rotate(this.xRad, this.yRad);
    }
    translate(translation) {
        translate(this.T, this.T, translation);
        this.refreshModelMatrix();
    }
    rotate(rad1, rad2) {
        rotate(this.R, this.R, rad2, [0, 0, 1]);
        rotate(this.R, this.R, rad1, [1, 0, 0]);
        this.refreshModelMatrix();
    }
    rotateFromZero(rad1, rad2) {
        identity(this.R);
        rotate(this.R, this.R, rad1, [1, 0, 0]);
        rotate(this.R, this.R, rad2, [0, 0, 1]);
        this.refreshModelMatrix();
    }
    refreshModelMatrix() {
        const R_inverse = mat4_create();
        invert(R_inverse, this.R);
        mat4_multiply(this.modelMatrix, this.T, R_inverse);
        // Flip Y if we're outside the sphere
        if (!src_Global.insideSphere) {
            this.modelMatrix[1] = -this.modelMatrix[1];
            this.modelMatrix[5] = -this.modelMatrix[5];
            this.modelMatrix[9] = -this.modelMatrix[9];
            this.modelMatrix[13] = -this.modelMatrix[13];
        }
        // Apply galactic frame transform if needed
        if (this.isGalacticHips) {
            mat4_multiply(this.modelMatrix, this.modelMatrix, this.galacticMatrixInverted);
        }
    }
    getModelMatrixInverse() {
        identity(this.inverseModelMatrix);
        invert(this.inverseModelMatrix, this.modelMatrix);
        return this.inverseModelMatrix;
    }
    getModelMatrix() {
        return this.modelMatrix;
    }
    /** Children with hierarchical geometry (e.g., HiPS) can override this. */
    setGeometryNeedsToBeRefreshed() {
        this.refreshGeometryOnFoVChanged = false;
    }
    // Helpers operating on raw mat4 buffers (kept from your JS)
    rotateX(m, angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const mv1 = m[1], mv5 = m[5], mv9 = m[9];
        m[1] = m[1] * c - m[2] * s;
        m[5] = m[5] * c - m[6] * s;
        m[9] = m[9] * c - m[10] * s;
        m[2] = m[2] * c + mv1 * s;
        m[6] = m[6] * c + mv5 * s;
        m[10] = m[10] * c + mv9 * s;
        return m;
    }
    rotateY(m, angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const mv0 = m[0], mv4 = m[4], mv8 = m[8];
        m[0] = c * m[0] + s * m[2];
        m[4] = c * m[4] + s * m[6];
        m[8] = c * m[8] + s * m[10];
        m[2] = c * m[2] - s * mv0;
        m[6] = c * m[6] - s * mv4;
        m[10] = c * m[10] - s * mv8;
        return m;
    }
}
/* harmony default export */ const model_AbstractSkyEntity = (AbstractSkyEntity);

;// ./node_modules/gl-matrix/esm/vec4.js


/**
 * 4 Dimensional Vector
 * @module vec4
 */

/**
 * Creates a new, empty vec4
 *
 * @returns {vec4} a new 4D vector
 */
function vec4_create() {
  var out = new ARRAY_TYPE(4);
  if (ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
  }
  return out;
}

/**
 * Creates a new vec4 initialized with values from an existing vector
 *
 * @param {ReadonlyVec4} a vector to clone
 * @returns {vec4} a new 4D vector
 */
function vec4_clone(a) {
  var out = new glMatrix.ARRAY_TYPE(4);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  return out;
}

/**
 * Creates a new vec4 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {vec4} a new 4D vector
 */
function vec4_fromValues(x, y, z, w) {
  var out = new glMatrix.ARRAY_TYPE(4);
  out[0] = x;
  out[1] = y;
  out[2] = z;
  out[3] = w;
  return out;
}

/**
 * Copy the values from one vec4 to another
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the source vector
 * @returns {vec4} out
 */
function vec4_copy(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  return out;
}

/**
 * Set the components of a vec4 to the given values
 *
 * @param {vec4} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {vec4} out
 */
function vec4_set(out, x, y, z, w) {
  out[0] = x;
  out[1] = y;
  out[2] = z;
  out[3] = w;
  return out;
}

/**
 * Adds two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {vec4} out
 */
function vec4_add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  out[3] = a[3] + b[3];
  return out;
}

/**
 * Subtracts vector b from vector a
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {vec4} out
 */
function vec4_subtract(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  out[3] = a[3] - b[3];
  return out;
}

/**
 * Multiplies two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {vec4} out
 */
function vec4_multiply(out, a, b) {
  out[0] = a[0] * b[0];
  out[1] = a[1] * b[1];
  out[2] = a[2] * b[2];
  out[3] = a[3] * b[3];
  return out;
}

/**
 * Divides two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {vec4} out
 */
function vec4_divide(out, a, b) {
  out[0] = a[0] / b[0];
  out[1] = a[1] / b[1];
  out[2] = a[2] / b[2];
  out[3] = a[3] / b[3];
  return out;
}

/**
 * Math.ceil the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to ceil
 * @returns {vec4} out
 */
function vec4_ceil(out, a) {
  out[0] = Math.ceil(a[0]);
  out[1] = Math.ceil(a[1]);
  out[2] = Math.ceil(a[2]);
  out[3] = Math.ceil(a[3]);
  return out;
}

/**
 * Math.floor the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to floor
 * @returns {vec4} out
 */
function vec4_floor(out, a) {
  out[0] = Math.floor(a[0]);
  out[1] = Math.floor(a[1]);
  out[2] = Math.floor(a[2]);
  out[3] = Math.floor(a[3]);
  return out;
}

/**
 * Returns the minimum of two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {vec4} out
 */
function vec4_min(out, a, b) {
  out[0] = Math.min(a[0], b[0]);
  out[1] = Math.min(a[1], b[1]);
  out[2] = Math.min(a[2], b[2]);
  out[3] = Math.min(a[3], b[3]);
  return out;
}

/**
 * Returns the maximum of two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {vec4} out
 */
function vec4_max(out, a, b) {
  out[0] = Math.max(a[0], b[0]);
  out[1] = Math.max(a[1], b[1]);
  out[2] = Math.max(a[2], b[2]);
  out[3] = Math.max(a[3], b[3]);
  return out;
}

/**
 * symmetric round the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to round
 * @returns {vec4} out
 */
function vec4_round(out, a) {
  out[0] = glMatrix.round(a[0]);
  out[1] = glMatrix.round(a[1]);
  out[2] = glMatrix.round(a[2]);
  out[3] = glMatrix.round(a[3]);
  return out;
}

/**
 * Scales a vec4 by a scalar number
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec4} out
 */
function vec4_scale(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  out[3] = a[3] * b;
  return out;
}

/**
 * Adds two vec4's after scaling the second operand by a scalar value
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec4} out
 */
function vec4_scaleAndAdd(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  out[2] = a[2] + b[2] * scale;
  out[3] = a[3] + b[3] * scale;
  return out;
}

/**
 * Calculates the euclidian distance between two vec4's
 *
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {Number} distance between a and b
 */
function vec4_distance(a, b) {
  var x = b[0] - a[0];
  var y = b[1] - a[1];
  var z = b[2] - a[2];
  var w = b[3] - a[3];
  return Math.sqrt(x * x + y * y + z * z + w * w);
}

/**
 * Calculates the squared euclidian distance between two vec4's
 *
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {Number} squared distance between a and b
 */
function vec4_squaredDistance(a, b) {
  var x = b[0] - a[0];
  var y = b[1] - a[1];
  var z = b[2] - a[2];
  var w = b[3] - a[3];
  return x * x + y * y + z * z + w * w;
}

/**
 * Calculates the length of a vec4
 *
 * @param {ReadonlyVec4} a vector to calculate length of
 * @returns {Number} length of a
 */
function vec4_length(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var w = a[3];
  return Math.sqrt(x * x + y * y + z * z + w * w);
}

/**
 * Calculates the squared length of a vec4
 *
 * @param {ReadonlyVec4} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */
function vec4_squaredLength(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var w = a[3];
  return x * x + y * y + z * z + w * w;
}

/**
 * Negates the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to negate
 * @returns {vec4} out
 */
function vec4_negate(out, a) {
  out[0] = -a[0];
  out[1] = -a[1];
  out[2] = -a[2];
  out[3] = -a[3];
  return out;
}

/**
 * Returns the inverse of the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to invert
 * @returns {vec4} out
 */
function vec4_inverse(out, a) {
  out[0] = 1.0 / a[0];
  out[1] = 1.0 / a[1];
  out[2] = 1.0 / a[2];
  out[3] = 1.0 / a[3];
  return out;
}

/**
 * Normalize a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to normalize
 * @returns {vec4} out
 */
function vec4_normalize(out, a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var w = a[3];
  var len = x * x + y * y + z * z + w * w;
  if (len > 0) {
    len = 1 / Math.sqrt(len);
  }
  out[0] = x * len;
  out[1] = y * len;
  out[2] = z * len;
  out[3] = w * len;
  return out;
}

/**
 * Calculates the dot product of two vec4's
 *
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {Number} dot product of a and b
 */
function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
}

/**
 * Returns the cross-product of three vectors in a 4-dimensional space
 *
 * @param {ReadonlyVec4} out the receiving vector
 * @param {ReadonlyVec4} u the first vector
 * @param {ReadonlyVec4} v the second vector
 * @param {ReadonlyVec4} w the third vector
 * @returns {vec4} result
 */
function vec4_cross(out, u, v, w) {
  var A = v[0] * w[1] - v[1] * w[0],
    B = v[0] * w[2] - v[2] * w[0],
    C = v[0] * w[3] - v[3] * w[0],
    D = v[1] * w[2] - v[2] * w[1],
    E = v[1] * w[3] - v[3] * w[1],
    F = v[2] * w[3] - v[3] * w[2];
  var G = u[0];
  var H = u[1];
  var I = u[2];
  var J = u[3];
  out[0] = H * F - I * E + J * D;
  out[1] = -(G * F) + I * C - J * B;
  out[2] = G * E - H * C + J * A;
  out[3] = -(G * D) + H * B - I * A;
  return out;
}

/**
 * Performs a linear interpolation between two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {vec4} out
 */
function vec4_lerp(out, a, b, t) {
  var ax = a[0];
  var ay = a[1];
  var az = a[2];
  var aw = a[3];
  out[0] = ax + t * (b[0] - ax);
  out[1] = ay + t * (b[1] - ay);
  out[2] = az + t * (b[2] - az);
  out[3] = aw + t * (b[3] - aw);
  return out;
}

/**
 * Generates a random vector with the given scale
 *
 * @param {vec4} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If omitted, a unit vector will be returned
 * @returns {vec4} out
 */
function vec4_random(out, scale) {
  scale = scale === undefined ? 1.0 : scale;

  // Marsaglia, George. Choosing a Point from the Surface of a
  // Sphere. Ann. Math. Statist. 43 (1972), no. 2, 645--646.
  // http://projecteuclid.org/euclid.aoms/1177692644;
  var v1, v2, v3, v4;
  var s1, s2;
  var rand;
  rand = glMatrix.RANDOM();
  v1 = rand * 2 - 1;
  v2 = (4 * glMatrix.RANDOM() - 2) * Math.sqrt(rand * -rand + rand);
  s1 = v1 * v1 + v2 * v2;
  rand = glMatrix.RANDOM();
  v3 = rand * 2 - 1;
  v4 = (4 * glMatrix.RANDOM() - 2) * Math.sqrt(rand * -rand + rand);
  s2 = v3 * v3 + v4 * v4;
  var d = Math.sqrt((1 - s1) / s2);
  out[0] = scale * v1;
  out[1] = scale * v2;
  out[2] = scale * v3 * d;
  out[3] = scale * v4 * d;
  return out;
}

/**
 * Transforms the vec4 with a mat4.
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the vector to transform
 * @param {ReadonlyMat4} m matrix to transform with
 * @returns {vec4} out
 */
function vec4_transformMat4(out, a, m) {
  var x = a[0],
    y = a[1],
    z = a[2],
    w = a[3];
  out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
  out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
  out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
  out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
  return out;
}

/**
 * Transforms the vec4 with a quat
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the vector to transform
 * @param {ReadonlyQuat} q normalized quaternion to transform with
 * @returns {vec4} out
 */
function vec4_transformQuat(out, a, q) {
  // Fast Vector Rotation using Quaternions by Robert Eisele
  // https://raw.org/proof/vector-rotation-using-quaternions/

  var qx = q[0],
    qy = q[1],
    qz = q[2],
    qw = q[3];
  var vx = a[0],
    vy = a[1],
    vz = a[2];

  // t = q x v
  var tx = qy * vz - qz * vy;
  var ty = qz * vx - qx * vz;
  var tz = qx * vy - qy * vx;

  // t = 2t
  tx = tx + tx;
  ty = ty + ty;
  tz = tz + tz;

  // v + w t + q x t
  out[0] = vx + qw * tx + qy * tz - qz * ty;
  out[1] = vy + qw * ty + qz * tx - qx * tz;
  out[2] = vz + qw * tz + qx * ty - qy * tx;
  out[3] = a[3];
  return out;
}

/**
 * Set the components of a vec4 to zero
 *
 * @param {vec4} out the receiving vector
 * @returns {vec4} out
 */
function vec4_zero(out) {
  out[0] = 0.0;
  out[1] = 0.0;
  out[2] = 0.0;
  out[3] = 0.0;
  return out;
}

/**
 * Returns a string representation of a vector
 *
 * @param {ReadonlyVec4} a vector to represent as a string
 * @returns {String} string representation of the vector
 */
function vec4_str(a) {
  return "vec4(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ")";
}

/**
 * Returns whether or not the vectors have exactly the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyVec4} a The first vector.
 * @param {ReadonlyVec4} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
function vec4_exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}

/**
 * Returns whether or not the vectors have approximately the same elements in the same position.
 *
 * @param {ReadonlyVec4} a The first vector.
 * @param {ReadonlyVec4} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
function vec4_equals(a, b) {
  var a0 = a[0],
    a1 = a[1],
    a2 = a[2],
    a3 = a[3];
  var b0 = b[0],
    b1 = b[1],
    b2 = b[2],
    b3 = b[3];
  return Math.abs(a0 - b0) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3));
}

/**
 * Alias for {@link vec4.subtract}
 * @function
 */
var vec4_sub = (/* unused pure expression or super */ null && (vec4_subtract));

/**
 * Alias for {@link vec4.multiply}
 * @function
 */
var vec4_mul = (/* unused pure expression or super */ null && (vec4_multiply));

/**
 * Alias for {@link vec4.divide}
 * @function
 */
var vec4_div = (/* unused pure expression or super */ null && (vec4_divide));

/**
 * Alias for {@link vec4.distance}
 * @function
 */
var vec4_dist = (/* unused pure expression or super */ null && (vec4_distance));

/**
 * Alias for {@link vec4.squaredDistance}
 * @function
 */
var vec4_sqrDist = (/* unused pure expression or super */ null && (vec4_squaredDistance));

/**
 * Alias for {@link vec4.length}
 * @function
 */
var vec4_len = (/* unused pure expression or super */ null && (vec4_length));

/**
 * Alias for {@link vec4.squaredLength}
 * @function
 */
var vec4_sqrLen = (/* unused pure expression or super */ null && (vec4_squaredLength));

/**
 * Perform some operation over an array of vec4s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec4. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec4s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
var vec4_forEach = function () {
  var vec = vec4_create();
  return function (a, stride, offset, count, fn, arg) {
    var i, l;
    if (!stride) {
      stride = 4;
    }
    if (!offset) {
      offset = 0;
    }
    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }
    for (i = offset; i < l; i += stride) {
      vec[0] = a[i];
      vec[1] = a[i + 1];
      vec[2] = a[i + 2];
      vec[3] = a[i + 3];
      fn(vec, vec, arg);
      a[i] = vec[0];
      a[i + 1] = vec[1];
      a[i + 2] = vec[2];
      a[i + 3] = vec[3];
    }
    return a;
  };
}();
;// ./src/model/hips/FoVHelper.ts
// FoVHelper.ts

class FoVHelper {
    getHiPSNorder(fov) {
        if (fov >= 179)
            return 0;
        if (fov >= 90)
            return 1;
        if (fov >= 30)
            return 2;
        if (fov >= 20)
            return 3;
        if (fov >= 6)
            return 4;
        if (fov >= 3.2)
            return 5;
        if (fov >= 1.6)
            return 6;
        if (fov >= 0.85)
            return 7;
        if (fov >= 0.42)
            return 8;
        if (fov >= 0.21)
            return 9;
        if (fov >= 0.12)
            return 10;
        if (fov >= 0.06)
            return 11;
        if (fov < 0.015)
            return 12;
        return 13;
    }
    getRADegSteps(fov) {
        let raStep;
        let decStep;
        if (fov >= 179) {
            raStep = 10;
            decStep = 10;
        }
        else if (fov >= 25) {
            raStep = 9;
            decStep = 9;
        }
        else if (fov >= 12.5) {
            raStep = 8;
            decStep = 8;
        }
        else if (fov >= 6) {
            raStep = 6;
            decStep = 6;
        }
        else if (fov >= 3.2) {
            raStep = 5;
            decStep = 5;
        }
        else if (fov >= 1.6) {
            raStep = 4;
            decStep = 4;
        }
        else if (fov >= 0.85) {
            raStep = 3;
            decStep = 3;
        }
        else if (fov >= 0.42) {
            raStep = 2;
            decStep = 2;
        }
        else if (fov >= 0.21) {
            raStep = 1;
            decStep = 1;
        }
        else if (fov >= 0.12) {
            raStep = 0.5;
            decStep = 0.5;
        }
        else if (fov >= 0.06) {
            raStep = 0.25;
            decStep = 0.25;
        }
        else {
            raStep = 10;
            decStep = 10;
        }
        return { raStep, decStep };
    }
    getRefOrder(order) {
        switch (order) {
            case 0:
            case 1:
            case 2:
            case 3:
                return order + 6;
            case 4:
            case 5:
            case 6:
            case 7:
                return order + 5;
            case 8:
                return order + 4;
            default:
                return order + 3;
        }
    }
}
const fovHelper = new FoVHelper();
/* harmony default export */ const hips_FoVHelper = ((/* unused pure expression or super */ null && (FoVHelper)));

;// ./src/utils/CoordsType.ts
/**
 * Enum for coordinate types.
 * @author Fabrizio Giordano (Fab77)
 */
var CoordsType;
(function (CoordsType) {
    CoordsType["CARTESIAN"] = "cartesian";
    CoordsType["SPHERICAL"] = "spherical";
    CoordsType["ASTRO"] = "astro";
})(CoordsType || (CoordsType = {}));
/* harmony default export */ const utils_CoordsType = (CoordsType);

;// ./src/model/Point.ts
/**
 * @author Fabrizio Giordano (Fab77)
 */





class Point {
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
        const MAX_DECIMALS = src_Global.MAX_DECIMALS ?? src_Global.maxDecimals ?? 12;
        if (in_type === utils_CoordsType.CARTESIAN) {
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
        else if (in_type === utils_CoordsType.ASTRO) {
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
        else if (in_type === utils_CoordsType.SPHERICAL) {
            // Not implemented in original; keep behavior
            console.log(`${utils_CoordsType.SPHERICAL} not implemented yet`);
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
        const phiThetaDeg = cartesianToSpherical(fromValues(this._xyz[0], this._xyz[1], this._xyz[2]));
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
        return new Point({ x: this.x * n, y: this.y * n, z: this.z * n }, utils_CoordsType.CARTESIAN);
    }
    dot(v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }
    cross(v) {
        return new Point({
            x: this.y * v.z - v.y * this.z,
            y: this.z * v.x - v.z * this.x,
            z: this.x * v.y - v.x * this.y,
        }, utils_CoordsType.CARTESIAN);
    }
    norm() {
        const d = 1 / this.length();
        return new Point({ x: this.x * d, y: this.y * d, z: this.z * d }, utils_CoordsType.CARTESIAN);
    }
    length() {
        return Math.sqrt(this.lengthSquared());
    }
    lengthSquared() {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    }
    subtract(v) {
        return new Point({ x: this.x - v.x, y: this.y - v.y, z: this.z - v.z }, utils_CoordsType.CARTESIAN);
    }
    add(v) {
        return new Point({ x: this.x + v.x, y: this.y + v.y, z: this.z + v.z }, utils_CoordsType.CARTESIAN);
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
/* harmony default export */ const model_Point = (Point);

;// ./src/utils/FoVUtils.ts

/**
 * @author Fabrizio Giordano (Fab)
 */





class FoVUtils {
    /**
     * Return the minimum FoV value between `_fovY_deg` and `_fovX_deg`.
     * (Kept here for parity; this class doesn’t maintain those fields.)
     */
    getMinFoV() {
        return this._fovY_deg <= this._fovX_deg ? this._fovY_deg : this._fovX_deg;
    }
    /**
     * Compute the FoV polygon as a list of Points (clockwise).
     * Uses ray picking + frustum planes against a unit sphere.
     */
    static getFoVPolygon(
    // _pMatrix: ReadonlyMat4 | null,
    camera, canvas, model) {
        // const pMatrix = (computePerspectiveMatrixSingleton.pMatrix ??
        //   _pMatrix) as ReadonlyMat4;
        const pMatrix = ComputePerspectiveMatrix.pMatrix;
        const vMatrix = camera.getCameraMatrix();
        const mMatrix = model.getModelMatrix();
        const canvasWidth = canvas.clientWidth;
        const canvasHeight = canvas.clientHeight;
        let points = [];
        // First check: does the sphere cover the whole screen?
        const intersectionWithModel = utils_RayPickingUtils.getIntersectionPointWithSingleModel(0, 0);
        if (intersectionWithModel.length > 0) {
            // Fully covered → grab corners + midpoints (CASE C)
            const cornersPoints = FoVUtils.getScreenCornersIntersection(pMatrix, camera, canvas);
            points = cornersPoints;
        }
        else {
            // Partial coverage: build frustum planes
            let M = mat4_create();
            M = mat4_multiply(M, vMatrix, mMatrix);
            M = mat4_multiply(M, pMatrix, M);
            const topPlane = [M[3] - M[1], M[7] - M[5], M[11] - M[9], M[15] - M[13]]; // m41-m21, ...
            const bottomPlane = [M[3] + M[1], M[7] + M[5], M[11] + M[9], M[15] + M[13]];
            const rightPlane = [M[3] - M[0], M[7] - M[4], M[11] - M[8], M[15] - M[12]];
            const leftPlane = [M[3] + M[0], M[7] + M[4], M[11] + M[8], M[15] + M[12]];
            const intersectionTopMiddle = utils_RayPickingUtils.getIntersectionPointWithSingleModel(canvasWidth / 2, 0);
            const intersectionRightMiddle = utils_RayPickingUtils.getIntersectionPointWithSingleModel(canvasWidth, canvasHeight / 2);
            // CASE A: zoomed out, hemisphere fully visible
            if (intersectionTopMiddle.length === 0 &&
                intersectionRightMiddle.length === 0) {
                const topPoints = FoVUtils.getNearestSpherePoint(topPlane);
                const bottomPoints = FoVUtils.getNearestSpherePoint(bottomPlane);
                const leftPoints = FoVUtils.getNearestSpherePoint(leftPlane);
                const rightPoints = FoVUtils.getNearestSpherePoint(rightPlane);
                const middleLeftTop = FoVUtils.computeMiddlePoint(leftPoints[0], topPoints[0])[0];
                const middleTopRight = FoVUtils.computeMiddlePoint(topPoints[0], rightPoints[0])[0];
                const middleRightBottom = FoVUtils.computeMiddlePoint(rightPoints[0], bottomPoints[0])[0];
                const middleBottomLeft = FoVUtils.computeMiddlePoint(bottomPoints[0], leftPoints[0])[0];
                points.push(topPoints[0], middleTopRight, rightPoints[0], middleRightBottom, bottomPoints[0], middleBottomLeft, leftPoints[0], middleLeftTop);
            }
            // CASE E: no intersection on top/bottom planes
            else if (intersectionTopMiddle.length === 0) {
                const topPoints = FoVUtils.getNearestSpherePoint(topPlane);
                const bottomPoints = FoVUtils.getNearestSpherePoint(bottomPlane);
                const leftPoints = FoVUtils.getFrustumIntersectionWithSphere(M, leftPlane, bottomPlane, topPlane);
                const rightPoints = FoVUtils.getFrustumIntersectionWithSphere(M, rightPlane, topPlane, bottomPlane);
                const middleLeftTop = FoVUtils.computeMiddlePoint(leftPoints[1], topPoints[0])[0];
                const middleTopRight = FoVUtils.computeMiddlePoint(topPoints[0], rightPoints[0])[0];
                const middleRightBottom = FoVUtils.computeMiddlePoint(rightPoints[1], bottomPoints[0])[0];
                const middleBottomLeft = FoVUtils.computeMiddlePoint(bottomPoints[0], leftPoints[0])[0];
                points.push(topPoints[0], middleTopRight, rightPoints[0], rightPoints[1], middleRightBottom, bottomPoints[0], middleBottomLeft, leftPoints[0], leftPoints[1], middleLeftTop);
            }
            // CASE D: no intersection on right/left planes
            else if (intersectionRightMiddle.length === 0) {
                const topPoints = FoVUtils.getFrustumIntersectionWithSphere(M, topPlane, leftPlane, rightPlane);
                const bottomPoints = FoVUtils.getFrustumIntersectionWithSphere(M, bottomPlane, rightPlane, leftPlane);
                const leftPoints = FoVUtils.getNearestSpherePoint(leftPlane);
                const rightPoints = FoVUtils.getNearestSpherePoint(rightPlane);
                const middleLeftTop = FoVUtils.computeMiddlePoint(leftPoints[0], topPoints[0])[0];
                const middleTopRight = FoVUtils.computeMiddlePoint(topPoints[1], rightPoints[0])[0];
                const middleRightBottom = FoVUtils.computeMiddlePoint(rightPoints[0], bottomPoints[0])[0];
                const middleBottomLeft = FoVUtils.computeMiddlePoint(bottomPoints[1], leftPoints[0])[0];
                points.push(topPoints[0], topPoints[1], middleTopRight, rightPoints[0], middleRightBottom, bottomPoints[0], bottomPoints[1], middleBottomLeft, leftPoints[0], middleLeftTop);
            }
            // CASE B: all frustum planes intersect
            else {
                const topPoints = FoVUtils.getFrustumIntersectionWithSphere(M, topPlane, leftPlane, rightPlane);
                const bottomPoints = FoVUtils.getFrustumIntersectionWithSphere(M, bottomPlane, rightPlane, leftPlane);
                const leftPoints = FoVUtils.getFrustumIntersectionWithSphere(M, leftPlane, bottomPlane, topPlane);
                const rightPoints = FoVUtils.getFrustumIntersectionWithSphere(M, rightPlane, topPlane, bottomPlane);
                points.push(topPoints[0], topPoints[1], rightPoints[0], rightPoints[1], bottomPoints[0], bottomPoints[1], leftPoints[0], leftPoints[1]);
            }
        }
        return points;
    }
    /**
     * Ray pick against 8 key screen positions (corners + midpoints).
     * Returns Points in clockwise order starting from top-left.
     */
    static getScreenCornersIntersection(pMatrix, camera, canvas) {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        const topLeft = utils_RayPickingUtils.getIntersectionPointWithSingleModel(0, 0);
        const middleTop = utils_RayPickingUtils.getIntersectionPointWithSingleModel(w / 2, 0);
        const topRight = utils_RayPickingUtils.getIntersectionPointWithSingleModel(w, 0);
        const middleRight = utils_RayPickingUtils.getIntersectionPointWithSingleModel(w, h / 2);
        const bottomRight = utils_RayPickingUtils.getIntersectionPointWithSingleModel(w, h);
        const middleBottom = utils_RayPickingUtils.getIntersectionPointWithSingleModel(w / 2, h);
        const bottomLeft = utils_RayPickingUtils.getIntersectionPointWithSingleModel(0, h);
        const middleLeft = utils_RayPickingUtils.getIntersectionPointWithSingleModel(0, h / 2);
        const out = [];
        const pushIf = (ip) => {
            if (ip.length > 0) {
                out.push(new model_Point({ x: ip[0], y: ip[1], z: ip[2] }, utils_CoordsType.CARTESIAN));
            }
        };
        pushIf(topLeft);
        pushIf(middleTop);
        pushIf(topRight);
        pushIf(middleRight);
        pushIf(bottomRight);
        pushIf(middleBottom);
        pushIf(bottomLeft);
        pushIf(middleLeft);
        return out;
    }
    /** Returns the center point (in J2000) of the current view as a `Point`. */
    static getCenterJ2000(canvas) {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        const center = utils_RayPickingUtils.getIntersectionPointWithSingleModel(w / 2, h / 2);
        return new model_Point({ x: center[0], y: center[1], z: center[2] }, utils_CoordsType.CARTESIAN);
    }
    /** Middle point on the unit sphere along the arc between two 3D points. */
    static computeMiddlePoint(p1, p2) {
        // midpoint of segment
        const xm = (p1.x + p2.x) / 2;
        const ym = (p1.y + p2.y) / 2;
        const zm = (p1.z + p2.z) / 2;
        // project the midpoint back to unit sphere
        const len = Math.hypot(xm, ym, zm) || 1;
        const x = xm / len;
        const y = ym / len;
        const z = zm / len;
        return [new model_Point({ x, y, z }, utils_CoordsType.CARTESIAN)];
    }
    /**
     * Nearest intersection point between a frustum plane and the unit sphere,
     * using the plane normal.
     */
    static getNearestSpherePoint(plane) {
        const [A, B, C, D] = plane;
        const R = 1;
        const invLen = 1 / Math.sqrt(A * A + B * B + C * C);
        const t1 = R * invLen;
        const t2 = -R * invLen;
        const P1 = [A * t1, B * t1, C * t1];
        const P2 = [A * t2, B * t2, C * t2];
        const den = Math.sqrt(A * A + B * B + C * C) || 1;
        const dist1 = Math.abs(A * P1[0] + B * P1[1] + C * P1[2] + D) / den;
        const dist2 = Math.abs(A * P2[0] + B * P2[1] + C * P2[2] + D) / den;
        const P = dist1 <= dist2 ? P1 : P2;
        return [new model_Point({ x: P[0], y: P[1], z: P[2] }, utils_CoordsType.CARTESIAN)];
    }
    /**
     * Intersections between a frustum plane and the unit sphere,
     * computed via two perpendicular planes.
     * Returns two points (first from `plane4Circle_1`, second from `plane4Circle_2`).
     */
    static getFrustumIntersectionWithSphere(_M, plane4Sphere, plane4Circle_1, plane4Circle_2) {
        const [A0, B0, C0, D0] = plane4Sphere;
        // center of the circle (projection of sphere center onto plane)
        const denom0 = (A0 * A0 + B0 * B0 + C0 * C0) || 1;
        const x_c = -(A0 * D0) / denom0;
        const y_c = -(B0 * D0) / denom0;
        const z_c = -(C0 * D0) / denom0;
        const d = Math.abs(D0) / Math.sqrt(denom0); // distance from sphere center (0,0,0)
        const R = 1;
        const out = [];
        if (R > d) {
            const r = Math.sqrt(R * R - d * d);
            const pick = (plane) => {
                const [A, B, C, D] = plane;
                const invLen = 1 / Math.sqrt(A * A + B * B + C * C);
                const t1 = r * invLen;
                const t2 = -r * invLen;
                const P1 = [x_c + A * t1, y_c + B * t1, z_c + C * t1];
                const P2 = [x_c + A * t2, y_c + B * t2, z_c + C * t2];
                const den = Math.sqrt(A * A + B * B + C * C) || 1;
                const dist1 = Math.abs(A * P1[0] + B * P1[1] + C * P1[2] + D) / den;
                const dist2 = Math.abs(A * P2[0] + B * P2[1] + C * P2[2] + D) / den;
                return dist1 <= dist2 ? P1 : P2;
            };
            const P_intersection_1 = pick(plane4Circle_1);
            const P_intersection_2 = pick(plane4Circle_2);
            out.push(new model_Point({ x: P_intersection_1[0], y: P_intersection_1[1], z: P_intersection_1[2] }, utils_CoordsType.CARTESIAN), new model_Point({ x: P_intersection_2[0], y: P_intersection_2[1], z: P_intersection_2[2] }, utils_CoordsType.CARTESIAN));
        }
        else if (R === d) {
            // Tangent: both intersections collapse to the circle center on the plane
            out.push(new model_Point({ x: x_c, y: y_c, z: z_c }, utils_CoordsType.CARTESIAN), new model_Point({ x: x_c, y: y_c, z: z_c }, utils_CoordsType.CARTESIAN));
        }
        else {
            // No intersection; return empty to avoid pushing undefined values
            // console.log('Frustum plane not intersecting the sphere');
        }
        return out;
    }
    /** Build ADQL string from an array of Points (ra,dec pairs). */
    static getAstroFoVPolygon(points) {
        return points.map(p => p.toADQL()).join(',');
    }
}
/* harmony default export */ const utils_FoVUtils = (FoVUtils);

;// ./src/model/FoV.ts

/**
 * FoV singleton (TypeScript)
 * - Uses computePerspectiveMatrixSingleton.pMatrix
 * - Guards acos domain (numeric safety)
 * - Uses vec3.transformMat4 instead of custom mat4*vec3
 * - Keeps original “insideSphere ? 360 - angle : angle” behavior
 */






class FoV {
    fovXDeg = 180;
    fovYDeg = 180;
    ratio = +0;
    _minFoV = 180;
    constructor() { }
    /** Recomputes FoV for current camera + projection */
    getFoV(insideSphere) {
        const gl = src_Global.gl;
        if (!gl || !gl.canvas) {
            // Handle the error or assign default values
            this.fovXDeg = 180;
            this.fovYDeg = 180;
            this._minFoV = this.minFoV;
            return this;
        }
        // horizontal FoV: ray through (centerY)
        // const x = this.computeAngle(0, gl.canvas.height / 2, insideSphere)
        const xFoVComputed = this.computeAngle(0, gl.canvas.height / 2, insideSphere);
        this.fovXDeg = xFoVComputed.angleDeg;
        // this.xDistance = xFoVComputed.distance
        // this.xAngleRatio = this.fovXDeg / this.xDistance
        // vertical FoV: ray through (centerX)
        // this.fovYDeg = this.computeAngle(gl.canvas.width / 2, 0, insideSphere)
        const yFoVComputed = this.computeAngle(gl.canvas.width / 2, 0, insideSphere);
        this.fovYDeg = yFoVComputed.angleDeg;
        // this.yDistance = yFoVComputed.distance
        // this.yAngleRatio = this.fovYDeg / this.yDistance
        this._minFoV = this.minFoV;
        this.ratio = this.computeRatio();
        return this;
    }
    computeRatio() {
        const camera = src_Global.camera;
        if (!camera)
            throw Error("Camera not defined");
        const pos = camera.getCameraPosition();
        const distanceFromCenter = Math.sqrt(pos[0] * pos[0] + pos[1] * pos[1] + pos[2] * pos[2]);
        // const distanceFromSphere = distanceFromCenter - healpixGridSingleton.RADIUS
        const ratio = distanceFromCenter / this.fovYDeg;
        return ratio;
    }
    changeMinFov(deg) {
        console.log("inside changeMinFov");
        if (this.fovYDeg <= this.fovXDeg) {
            this.fovYDeg = deg;
        }
        else {
            this.fovXDeg = deg;
        }
        console.log("changeMinFov: ping");
        this.minFoV;
        // this.fovYDeg <= this.fovXDeg ? this.fovYDeg = deg : this.fovXDeg = deg
    }
    get minFoV() {
        this._minFoV = this.fovYDeg <= this.fovXDeg ? this.fovYDeg : this.fovXDeg;
        return this._minFoV;
    }
    computeDistanceFromAngle(angleDeg) {
        const desiredFoV = angleDeg;
        const distance = desiredFoV * this.ratio;
        // return Math.abs(distance)
        return distance;
    }
    /** FoV half-screen chord angle doubled (deg) along a given canvas axis */
    computeAngle(canvasX, canvasY, insideSphere) {
        const camera = src_Global.camera;
        const pMatrix = ComputePerspectiveMatrix.pMatrix;
        if (!pMatrix) {
            // Handle the error or assign a default value
            console.warn('FoV: projection matrix is null');
            return { angleDeg: 180, distance: 1 };
        }
        if (!camera) {
            // Handle the error or assign a default value
            console.warn('FoV: camera is null');
            return { angleDeg: 180, distance: 1 };
        }
        const rayWorld = utils_RayPickingUtils.getRayFromMouse(canvasX, canvasY, pMatrix);
        const intersectionDistance = utils_RayPickingUtils.raySphere(camera.getCameraPosition(), rayWorld);
        let angleDeg;
        if (intersectionDistance > 0) {
            // world-space intersection point on the sphere
            const hit = create();
            scale(hit, rayWorld, intersectionDistance);
            add(hit, camera.getCameraPosition(), hit);
            const center = grid_HealpixGridSingleton.center;
            // vectors from sphere center
            const vHit = create();
            subtract(vHit, hit, center);
            // reference vector: rotate world +Z into current camera orientation, then from center
            const refWorldZ = fromValues(center[0], center[1], center[2] + grid_HealpixGridSingleton.radius);
            const vInv = mat4_create();
            invert(vInv, camera.getCameraMatrix());
            const refCamZ = create();
            transformMat4(refCamZ, refWorldZ, vInv);
            const vRef = create();
            subtract(vRef, refCamZ, center);
            // angle between vHit and vRef, doubled
            const dot = vec3_dot(vHit, vRef);
            const n1 = vec3_length(vHit);
            const n2 = vec3_length(vRef);
            // numeric safety for acos
            const c = Math.min(1, Math.max(-1, dot / (n1 * n2)));
            const angleRad = Math.acos(c);
            angleDeg = 2 * radToDeg(angleRad);
        }
        else {
            angleDeg = 180;
        }
        const finalAngle = insideSphere ? 360 - angleDeg : angleDeg;
        // return insideSphere ? 360 - angleDeg : angleDeg
        return { angleDeg: finalAngle, distance: intersectionDistance };
    }
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
    computeCameraPositionForMinFoV(targetMinFoVDeg) {
        const camera = src_Global.camera;
        const center = grid_HealpixGridSingleton.center;
        const R = grid_HealpixGridSingleton.radius;
        if (!camera) {
            console.warn('FoV.computeCameraPositionForMinFoV: camera not available; returning a sensible default.');
            return [center[0], center[1], center[2] + 2 * R];
        }
        // Clamp and validate input
        const eps = 1e-6;
        const clamped = Math.max(eps, Math.min(180 - eps, targetMinFoVDeg));
        const halfRad = (clamped * Math.PI / 180) * 0.5;
        // Distance from center needed to achieve the angular diameter
        // minFoV = 2 * arcsin(R / d)  =>  d = R / sin(minFoV/2)
        const sinHalf = Math.sin(halfRad);
        if (sinHalf <= 0) {
            console.warn('FoV.computeCameraPositionForMinFoV: invalid targetMinFoVDeg, using fallback.');
            return [center[0], center[1], center[2] + 2 * R];
        }
        let d = R / sinHalf;
        // Ensure we remain strictly outside the sphere
        d = Math.max(d, R + 1e-4);
        // Use the current center→camera direction to keep orientation
        const camPos = camera.getCameraPosition();
        let dirX = camPos[0] - center[0];
        let dirY = camPos[1] - center[1];
        let dirZ = camPos[2] - center[2];
        const len = Math.hypot(dirX, dirY, dirZ);
        if (len < eps) {
            // If somehow at the center, use +Z as a default direction
            dirX = 0;
            dirY = 0;
            dirZ = 1;
        }
        else {
            dirX /= len;
            dirY /= len;
            dirZ /= len;
        }
        const newX = center[0] + dirX * d;
        const newY = center[1] + dirY * d;
        const newZ = center[2] + dirZ * d;
        return [newX, newY, newZ];
    }
    /**
       * Computes the camera world-space position required to achieve a target FoV (deg),
       * keeping the same viewing direction. Acts as the inverse of computeAngle().
       *
       * @param targetFoVDeg desired full FoV angle in degrees (0 < FoV < 180)
       * @param canvasWidth  canvas width in pixels
       * @param canvasHeight canvas height in pixels
       * @returns [x, y, z] coordinates for the new camera position
       */
    computeCameraPositionForFoV(targetFoVDeg) {
        const camera = src_Global.camera;
        const center = grid_HealpixGridSingleton.center;
        const R = grid_HealpixGridSingleton.radius;
        if (!camera) {
            console.warn("FoV.computeCameraPositionForFoV: camera missing.");
            return [center[0], center[1], center[2] + 2 * R];
        }
        const eps = 1e-6;
        const clamped = Math.max(eps, Math.min(180 - eps, targetFoVDeg));
        const halfRad = (clamped * Math.PI) / 360.0; // half-angle in radians
        // Distance from center that yields this FoV
        const sinHalf = Math.sin(halfRad);
        if (sinHalf <= 0) {
            console.warn("FoV.computeCameraPositionForFoV: invalid FoV.");
            return [center[0], center[1], center[2] + 2 * R];
        }
        let d = R / sinHalf;
        // Slightly outside sphere to avoid clipping
        d = Math.max(d, R + 1e-4);
        // Get current viewing direction
        const camPos = camera.getCameraPosition();
        let dirX = camPos[0] - center[0];
        let dirY = camPos[1] - center[1];
        let dirZ = camPos[2] - center[2];
        const len = Math.hypot(dirX, dirY, dirZ);
        if (len < eps) {
            dirX = 0;
            dirY = 0;
            dirZ = 1;
        }
        else {
            dirX /= len;
            dirY /= len;
            dirZ /= len;
        }
        const newX = center[0] + dirX * d;
        const newY = center[1] + dirY * d;
        const newZ = center[2] + dirZ * d;
        return [newX, newY, newZ];
    }
    /**
   * Return a camera position such that the sphere's apparent angular diameter
   * (the silhouette, not the surface coverage) equals targetAngularDiameterDeg.
   * Keeps current view direction; does not mutate the camera.
   *
   * @param targetAngularDiameterDeg desired apparent diameter in degrees (0<α<180)
   * @returns [x,y,z] world position
   */
    computeCameraPositionForAngularDiameter(targetAngularDiameterDeg) {
        const camera = src_Global.camera;
        const center = grid_HealpixGridSingleton.center;
        const R = grid_HealpixGridSingleton.radius;
        if (!camera) {
            console.warn('computeCameraPositionForAngularDiameter: camera missing.');
            return [center[0], center[1], center[2] + 2 * R];
        }
        const eps = 1e-6;
        const α = Math.max(eps, Math.min(180 - eps, targetAngularDiameterDeg));
        const half = (α * Math.PI) / 360.0;
        const sinHalf = Math.sin(half);
        // d = R / sin(α/2)
        let d = R / sinHalf;
        d = Math.max(d, R + 1e-4); // stay outside
        // project along current center→camera direction
        const [cx, cy, cz] = center;
        const [px, py, pz] = camera.getCameraPosition();
        let dx = px - cx, dy = py - cy, dz = pz - cz;
        const L = Math.hypot(dx, dy, dz);
        if (L < eps) {
            dx = 0;
            dy = 0;
            dz = 1;
        }
        else {
            dx /= L;
            dy /= L;
            dz /= L;
        }
        return [cx + dx * d, cy + dy * d, cz + dz * d];
    }
}

;// ./src/shader/GridShaderManager.ts
// GridShaderManager.ts

class GridShaderManager {
    static healpixGridVS() {
        return `#version 300 es
        in vec4 aCatPosition;
        uniform mat4 uMVMatrix;
        uniform mat4 uPMatrix;

        void main() {
            gl_Position = uPMatrix * uMVMatrix * aCatPosition;
            gl_PointSize = 7.0;
        }`;
    }
    static healpixGridFS() {
        return `#version 300 es
        precision mediump float;

        uniform vec4 u_fragcolor;
        out vec4 fragColor;

        void main() {
            // fragColor = vec4(1.0, 0.0, 0.0, 1.0);
            fragColor = u_fragcolor;
        }`;
    }
}
/* harmony default export */ const shader_GridShaderManager = (GridShaderManager);

;// ./src/model/Point2D.ts
class Point2D {
    _x;
    _y;
    constructor(x, y) {
        this._x = x;
        this._y = y;
    }
    get x() {
        return this._x;
    }
    get y() {
        return this._y;
    }
}
/* harmony default export */ const model_Point2D = (Point2D);

;// ./src/utils/GeomUtils.ts



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
                const p = new model_Point2D(point.raDeg, point.decDeg);
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
                selpoly.push(new model_Point2D(curra, point.decDeg));
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
        return new model_Point2D(p.x, p.y);
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
            p0 = new model_Point2D(point.raDeg, point.decDeg);
        }
        else {
            const RA_THRESHOLD = 180;
            const raShifted = point.raDeg >= RA_THRESHOLD ? point.raDeg - 360 : point.raDeg;
            p0 = new model_Point2D(raShifted, point.decDeg);
        }
        const p1 = new model_Point2D(p0.x, p0.y + 2 * Math.abs(selectionObj.maxy - selectionObj.miny));
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
        const p1point = new model_Point({ raDeg: maxdist, decDeg: point.decDeg }, utils_CoordsType.ASTRO);
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
/* harmony default export */ const utils_GeomUtils = (GeomUtils);

;// ./src/model/grid/GridTextHelper.ts
/**
 * @author Fabrizio Giordano (Fab)
 * @param in_radius - number
 * @param in_gl - GL context
 * @param in_position - array of double e.g. [0.0, 0.0, 0.0]
 */
class GridTextHelper {
    _divEqContainerElement;
    _divHPXContainerElement;
    _divSets;
    _divSetNdx;
    constructor() {
        this._divEqContainerElement = document.querySelector('#gridcoords');
        this._divHPXContainerElement = document.querySelector('#gridhpx');
        this._divSetNdx = 0;
        this._divSets = [];
    }
    initHtml() {
        // Kept for API parity; nothing required here with current logic.
    }
    resetDivSets() {
        // Hide remaining divs and reset index
        for (; this._divSetNdx < this._divSets.length; ++this._divSetNdx) {
            this._divSets[this._divSetNdx].style.display = 'none';
        }
        this._divSetNdx = 0;
    }
    /**
     * Add / reuse a floating label for HPX coordinates
     */
    addHPXDivSet(msg, x, y) {
        let divSet = this._divSets[this._divSetNdx++];
        // Create on demand
        if (!divSet) {
            const div = document.createElement('div');
            const textNode = document.createTextNode('');
            div.className = 'floating-div-ra'; // style like RA tags
            div.appendChild(textNode);
            if (!this._divHPXContainerElement) {
                this._divHPXContainerElement = document.querySelector('#gridhpx');
            }
            if (!this._divHPXContainerElement) {
                // If container is still missing, abort gracefully
                return;
            }
            this._divHPXContainerElement.appendChild(div);
            divSet = { div, textNode, style: div.style };
            this._divSets.push(divSet);
        }
        // Show & position
        divSet.style.display = 'block';
        divSet.style.left = `${Math.floor(x + 25)}px`;
        divSet.style.top = `${Math.floor(y)}px`;
        divSet.textNode.nodeValue = msg;
    }
    /**
     * Add / reuse a floating label for Equatorial coords
     * @param type 'ra' or 'dec'
     */
    addEqDivSet(msg, x, y, type) {
        let divSet = this._divSets[this._divSetNdx++];
        if (!divSet) {
            const div = document.createElement('div');
            const textNode = document.createTextNode('');
            div.className = type === 'ra' ? 'floating-div-ra' : 'floating-div-dec';
            div.appendChild(textNode);
            if (!this._divEqContainerElement) {
                this._divEqContainerElement = document.querySelector('#gridcoords');
            }
            if (!this._divEqContainerElement) {
                // If container is still missing, abort gracefully
                return;
            }
            this._divEqContainerElement.appendChild(div);
            divSet = { div, textNode, style: div.style };
            this._divSets.push(divSet);
        }
        divSet.style.display = 'block';
        if (type === 'ra') {
            divSet.style.left = `${Math.floor(x + 25)}px`;
            divSet.style.top = `${Math.floor(y)}px`;
        }
        else {
            divSet.style.left = `${Math.floor(x)}px`;
            divSet.style.top = `${Math.floor(y + 25)}px`;
        }
        divSet.textNode.nodeValue = msg;
    }
}
// export const gridTextHelper = new GridTextHelper();
/* harmony default export */ const grid_GridTextHelper = (GridTextHelper);

;// ./src/shader/ShaderManager.ts
// ShaderManager.ts
class ShaderManager {
    static catalogueVS() {
        return `#version 300 es
    in vec4 aCatPosition;
    in float a_selected;
    in float a_pointsize;
    in float a_brightness;

    out float v_selected;
    out float v_brightness;
    out lowp vec4 vColor;  // not used

    uniform mat4 uPMatrix;
    uniform mat4 uMVMatrix;

    void main() {

      gl_Position = (uPMatrix * uMVMatrix * aCatPosition);
      gl_PointSize = a_pointsize;
      v_selected = a_selected;
      v_brightness = a_brightness;
    }`;
    }
    static catalogueFS() {
        return `#version 300 es
    precision mediump float;
    
    #ifdef GL_OES_standard_derivatives
    #extension GL_OES_standard_derivatives : enable
    #endif

    // https://www.desultoryquest.com/blog/drawing-anti-aliased-circular-points-using-opengl-slash-webgl/

    // precision mediump float;

    in float v_selected;
    in float v_brightness;

    uniform vec4 u_fragcolor;

    out vec4 fragColor;

    // varying float v_selected;
    // varying float v_brightness;

    const float EPSILON = 1e-10;
    
    vec3 RGBtoHCV(in vec3 rgb) {
      // RGB [0..1] to Hue-Chroma-Value [0..1]
      // Based on work by Sam Hocevar and Emil Persson
      vec4 p = (rgb.g < rgb.b) ? vec4(rgb.bg, -1., 2. / 3.) : vec4(rgb.gb, 0., -1. / 3.);
      vec4 q = (rgb.r < p.x) ? vec4(p.xyw, rgb.r) : vec4(rgb.r, p.yzx);
      float c = q.x - min(q.w, q.y);
      float h = abs((q.w - q.y) / (6. * c + EPSILON) + q.z);
      return vec3(h, c, q.x);
    }

    vec3 RGBtoHSL(in vec3 rgb) {
      // RGB [0..1] to Hue-Saturation-Lightness [0..1]
      vec3 hcv = RGBtoHCV(rgb);
      //vec3 hcv = vec3(1., 1., 1.);
      float z = hcv.z - hcv.y * 0.5;
      float s = hcv.y / (1. - abs(z * 2. - 1.) + EPSILON);
      return vec3(hcv.x, s, z);
    }

    vec3 HUEtoRGB(in float hue){
      // Hue [0..1] to RGB [0..1]
      // See http://www.chilliant.com/rgb2hsv.html
      vec3 rgb = abs(hue * 6. - vec3(3, 2, 4)) * vec3(1, -1, -1) + vec3(-1, 2, 2);
      return clamp(rgb, 0., 1.);
    }

    vec3 HSLtoRGB(in vec3 hsl) {
      // Hue-Saturation-Lightness [0..1] to RGB [0..1]
      vec3 rgb = HUEtoRGB(hsl.x);
      float c = (1. - abs(2. * hsl.z - 1.)) * hsl.y;
      return (rgb - 0.5) * c + hsl.z;
    }
  
    void main() {

      float r = 0.0, delta = 0.0, alpha = 1.0;
      vec2 cxy = 2.0 * gl_PointCoord - 1.0;
      r = dot(cxy, cxy);
      if (r > 1.0) {
        discard;
      }

      #ifdef GL_OES_standard_derivatives
        delta = fwidth(r);
        alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);
      #endif

      if (v_selected == 1.0){
        // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0) * (alpha);
        fragColor = vec4(1.0, 0.0, 0.0, 1.0) * (alpha);
      } else if (v_selected == 2.0){
        // gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0) * (alpha);
        fragColor = vec4(1.0, 1.0, 0.0, 1.0) * (alpha);
      }else{
        if (r < 0.4) {
          discard;
        }
        if ( v_brightness >= -1.0 && v_brightness <= 1.0) {
          // Round-trip RGB->HSL->RGB with time-dependent lightness
          vec3 hsl = RGBtoHSL(vec3(u_fragcolor));
          //hsl.z = pow(hsl.z, sin(iTime) + 1.5);
          // hsl.z = pow(hsl.z, v_brightness + 1.5);
          hsl.z = pow(hsl.z, v_brightness + 1.5);
          vec3 hslcolor = HSLtoRGB(hsl);
          // gl_FragColor = vec4(hslcolor, u_fragcolor[3]) * (alpha);
          fragColor = vec4(hslcolor, u_fragcolor[3]) * (alpha);
        } else {
          // gl_FragColor = u_fragcolor * (alpha);
          fragColor = u_fragcolor * (alpha);
        }
      }
    }`;
    }
    static footprintVS() {
        return `#version 300 es
    precision highp float;

    layout(location = 0) in vec4 aCatPosition;

    uniform float u_pointsize;
    uniform mat4 uMVMatrix;
    uniform mat4 uPMatrix;

    void main() {
      gl_Position = uPMatrix * uMVMatrix * aCatPosition;
      gl_PointSize = u_pointsize;   // Works in WebGL2
    }`;
    }
    static footprintFS() {
        return `#version 300 es
    precision mediump float;

    uniform vec4 u_fragcolor;
    out vec4 fragColor;

    void main() {
      fragColor = u_fragcolor;
    }`;
    }
    static hipsVS() {
        return `#version 300 es
    in vec3 aVertexPosition;
    in vec2 aTextureCoord;

    uniform mat4 uMMatrix;
    uniform mat4 uVMatrix;
    uniform mat4 uPMatrix;

    out vec2 vTextureCoord;

    void main() {
      gl_Position = uPMatrix * uVMatrix * uMMatrix * vec4(aVertexPosition, 1.0);
      vTextureCoord = aTextureCoord;
    }`;
    }
    static hipsNativeFS() {
        return `#version 300 es
    precision mediump float;

    in vec2 vTextureCoord;

    uniform sampler2D uSampler0;
    uniform sampler2D uSampler1;
    uniform sampler2D uSampler2;
    uniform sampler2D uSampler3;
    uniform sampler2D uSampler4;
    uniform sampler2D uSampler5;
    uniform sampler2D uSampler6;
    uniform sampler2D uSampler7;

    uniform float uFactor0;
    uniform float uFactor1;
    uniform float uFactor2;
    uniform float uFactor3;
    uniform float uFactor4;
    uniform float uFactor5;
    uniform float uFactor6;
    uniform float uFactor7;

    out vec4 fragColor;

    void main() {
      vec3 finalColor = vec3(0.0);

      if (uFactor0 >= 0.0){
        vec4 mycolor;
        #if __VERSION__ > 120
          vec4 color0 = texture(uSampler0, vTextureCoord);
        #else
          vec4 color0 = texture2D(uSampler0, vTextureCoord);
        #endif
        mycolor = color0;
        finalColor += mycolor.rgb * uFactor0;
      } else if (uFactor7 >= 0.0){
        finalColor = vec3(1.0, 0.0, 0.0);
      }
      fragColor = vec4(finalColor, 1.0);
    }`;
    }
    static hipsGrayscaleFS() {
        return `#version 300 es
    precision mediump float;

    in vec2 vTextureCoord;

    uniform sampler2D uSampler0;
    uniform sampler2D uSampler1;
    uniform sampler2D uSampler2;
    uniform sampler2D uSampler3;
    uniform sampler2D uSampler4;
    uniform sampler2D uSampler5;
    uniform sampler2D uSampler6;
    uniform sampler2D uSampler7;

    uniform float uFactor0;
    uniform float uFactor1;
    uniform float uFactor2;
    uniform float uFactor3;
    uniform float uFactor4;
    uniform float uFactor5;
    uniform float uFactor6;
    uniform float uFactor7;

    out vec4 fragColor;

    void main() {
      vec3 finalColor = vec3(0.0);

      if (uFactor0 >= 0.0){
        #if __VERSION__ > 120
          vec4 color0 = texture(uSampler0, vTextureCoord);
        #else
          vec4 color0 = texture2D(uSampler0, vTextureCoord);
        #endif
        float gray = 0.21 * color0.r + 0.71 * color0.g + 0.07 * color0.b;
        finalColor = color0.rgb * (1.0 - uFactor0) + vec3(gray) * uFactor0;
      }
      if (uFactor1 >= 0.0){
        #if __VERSION__ > 120
          vec4 color1 = texture(uSampler1, vTextureCoord);
        #else
          vec4 color1 = texture2D(uSampler1, vTextureCoord);
        #endif
        finalColor += color1.rgb * uFactor1;
      }
      if (uFactor2 >= 0.0){
        #if __VERSION__ > 120
          vec4 color2 = texture(uSampler2, vTextureCoord);
        #else
          vec4 color2 = texture2D(uSampler2, vTextureCoord);
        #endif
        finalColor += color2.rgb * uFactor2;
      }
      if (uFactor3 >= 0.0){
        #if __VERSION__ > 120
          vec4 color3 = texture(uSampler3, vTextureCoord);
        #else
          vec4 color3 = texture2D(uSampler3, vTextureCoord);
        #endif
        finalColor += color3.rgb * uFactor3;
      }
      if (uFactor4 >= 0.0){
        #if __VERSION__ > 120
          vec4 color4 = texture(uSampler4, vTextureCoord);
        #else
          vec4 color4 = texture2D(uSampler4, vTextureCoord);
        #endif
        finalColor += color4.rgb * uFactor4;
      }
      if (uFactor5 >= 0.0){
        #if __VERSION__ > 120
          vec4 color5 = texture(uSampler5, vTextureCoord);
        #else
          vec4 color5 = texture2D(uSampler5, vTextureCoord);
        #endif
        finalColor += color5.rgb * uFactor5;
      }
      if (uFactor6 >= 0.0){
        #if __VERSION__ > 120
          vec4 color6 = texture(uSampler6, vTextureCoord);
        #else
          vec4 color6 = texture2D(uSampler6, vTextureCoord);
        #endif
        finalColor += color6.rgb * uFactor6;
      }
      if (uFactor7 >= 0.0){
        #if __VERSION__ > 120
          vec4 color7 = texture(uSampler7, vTextureCoord);
        #else
          vec4 color7 = texture2D(uSampler7, vTextureCoord);
        #endif
        finalColor += color7.rgb * uFactor7;
      }
      fragColor = vec4(finalColor, 1.0);
    }`;
    }
    static hipsColorMapFS() {
        return `#version 300 es
    precision mediump float;

    in vec2 vTextureCoord;

    // UBO
    layout (std140) uniform colormap {
      float r_palette[256];
      float g_palette[256];
      float b_palette[256];
    };

    uniform sampler2D uSampler0;
    uniform float uFactor0;

    out vec4 fragColor;

    void main() {
      #if __VERSION__ > 120
        vec4 color0 = texture(uSampler0, vTextureCoord);
      #else
        vec4 color0 = texture2D(uSampler0, vTextureCoord);
      #endif

      int x = int(color0.r * 255.0);
      float px = r_palette[x] / 256.0;

      int y = int(color0.g * 255.0);
      float py = g_palette[y] / 256.0;

      int z = int(color0.b * 255.0);
      float pz = b_palette[z] / 256.0;

      // uFactor0 reserved for future blending if needed
      fragColor = vec4(px, py, pz, 1.0);
    }`;
    }
}

;// ./src/model/hips/ColorMap.ts
/**
 * @author Fabrizio Giordano (Fab77)
 * Enum for coordinate types.
 * @readonly
 * @enum {{name: string, hex: string}}
 */
class ColorMap {
    PLANCK = {
        // "r": new Float32Array([0.00000,0.769231,1.53846,2.30769,3.07692,3.84615,4.61538,5.38462,6.15385,6.92308,7.69231,8.46154,9.23077,10.0000,11.5385,13.0769,14.6154,16.1538,17.6923,19.2308,20.7692,22.3077,23.8462,25.3846,26.9231,28.4615,30.0000,33.8462,37.6923,41.5385,45.3846,49.2308,53.0769,56.9231,60.7692,64.6154,68.4615,72.3077,76.1538,80.0000,88.5385,97.0769,105.615,114.154,122.692,131.231,139.769,148.308,156.846,165.385,173.923,182.462,191.000,193.846,196.692,199.538,202.385,205.231,208.077,210.923,213.769,216.615,219.462,222.308,225.154,228.000,229.182,230.364,231.545,232.727,233.909,235.091,236.273,237.455,238.636,239.818,241.000,241.000,241.364,241.727,242.091,242.455,242.818,243.182,243.545,243.909,244.273,244.636,245.000,245.231,245.462,245.692,245.923,246.154,246.385,246.615,246.846,247.077,247.308,247.538,247.769,248.000,248.146,248.292,248.438,248.585,248.731,248.877,249.023,249.169,249.315,249.462,249.608,249.754,249.900,249.312,248.723,248.135,247.546,246.958,246.369,245.781,245.192,244.604,244.015,243.427,242.838,242.250,239.308,236.365,233.423,230.481,227.538,224.596,221.654,218.712,215.769,212.827,209.885,206.942,204.000,201.000,198.000,195.000,192.000,189.000,186.000,183.000,180.000,177.000,174.000,171.000,168.000,165.000,161.077,157.154,153.231,149.308,145.385,141.462,137.538,133.615,129.692,125.769,121.846,117.923,114.000,115.038,116.077,117.115,118.154,119.192,120.231,121.269,122.308,123.346,124.385,125.423,126.462,127.500,131.423,135.346,139.269,143.192,147.115,151.038,154.962,158.885,162.808,166.731,170.654,174.577,178.500,180.462,182.423,184.385,186.346,188.308,190.269,192.231,194.192,196.154,198.115,200.077,202.038,204.000,205.962,207.923,209.885,211.846,213.808,215.769,217.731,219.692,221.654,223.615,225.577,227.538,229.500,230.481,231.462,232.442,233.423,234.404,235.385,236.365,237.346,238.327,239.308,240.288,241.269,242.250,242.642,243.035,243.427,243.819,244.212,244.604,244.996,245.388,245.781,246.173,246.565,246.958,247.350,247.814,248.277,248.741,249.205,249.668,250.132,250.595,251.059,251.523,251.986,252.450]),
        // "g": new Float32Array([0.00000,1.53846,3.07692,4.61538,6.15385,7.69231,9.23077,10.7692,12.3077,13.8462,15.3846,16.9231,18.4615,20.0000,32.6154,45.2308,57.8462,70.4615,83.0769,95.6923,108.308,120.923,133.538,146.154,158.769,171.385,184.000,187.923,191.846,195.769,199.692,203.615,207.538,211.462,215.385,219.308,223.231,227.154,231.077,235.000,235.308,235.615,235.923,236.231,236.538,236.846,237.154,237.462,237.769,238.077,238.385,238.692,239.000,239.077,239.154,239.231,239.308,239.385,239.462,239.538,239.615,239.692,239.769,239.846,239.923,240.000,240.091,240.182,240.273,240.364,240.455,240.545,240.636,240.727,240.818,240.909,241.000,241.000,240.909,240.818,240.727,240.636,240.545,240.455,240.364,240.273,240.182,240.091,240.000,239.615,239.231,238.846,238.462,238.077,237.692,237.308,236.923,236.538,236.154,235.769,235.385,235.000,232.615,230.231,227.846,225.462,223.077,220.692,218.308,215.923,213.538,211.154,208.769,206.385,204.000,200.077,196.154,192.231,188.308,184.385,180.462,176.538,172.615,168.692,164.769,160.846,156.923,153.000,147.115,141.231,135.346,129.462,123.577,117.692,111.808,105.923,100.038,94.1538,88.2692,82.3846,76.5000,73.0769,69.6538,66.2308,62.8077,59.3846,55.9615,52.5385,49.1154,45.6923,42.2692,38.8462,35.4231,32.0000,29.5385,27.0769,24.6154,22.1538,19.6923,17.2308,14.7692,12.3077,9.84615,7.38462,4.92308,2.46154,0.00000,9.80769,19.6154,29.4231,39.2308,49.0385,58.8462,68.6538,78.4615,88.2692,98.0769,107.885,117.692,127.500,131.423,135.346,139.269,143.192,147.115,151.038,154.962,158.885,162.808,166.731,170.654,174.577,178.500,180.462,182.423,184.385,186.346,188.308,190.269,192.231,194.192,196.154,198.115,200.077,202.038,204.000,205.962,207.923,209.885,211.846,213.808,215.769,217.731,219.692,221.654,223.615,225.577,227.538,229.500,230.481,231.462,232.442,233.423,234.404,235.385,236.365,237.346,238.327,239.308,240.288,241.269,242.250,242.642,243.035,243.427,243.819,244.212,244.604,244.996,245.388,245.781,246.173,246.565,246.958,247.350,247.814,248.277,248.741,249.205,249.668,250.132,250.595,251.059,251.523,251.986,252.450]),
        // "b": new Float32Array([255.000,255.000,255.000,255.000,255.000,255.000,255.000,255.000,255.000,255.000,255.000,255.000,255.000,255.000,255.000,255.000,255.000,255.000,255.000,255.000,255.000,255.000,255.000,255.000,255.000,255.000,255.000,255.000,255.000,255.000,255.000,255.000,255.000,255.000,255.000,255.000,255.000,255.000,255.000,255.000,254.615,254.231,253.846,253.462,253.077,252.692,252.308,251.923,251.538,251.154,250.769,250.385,250.000,249.615,249.231,248.846,248.462,248.077,247.692,247.308,246.923,246.538,246.154,245.769,245.385,245.000,242.000,239.000,236.000,233.000,230.000,227.000,224.000,221.000,218.000,215.000,212.000,212.000,208.636,205.273,201.909,198.545,195.182,191.818,188.455,185.091,181.727,178.364,175.000,171.538,168.077,164.615,161.154,157.692,154.231,150.769,147.308,143.846,140.385,136.923,133.462,130.000,122.942,115.885,108.827,101.769,94.7115,87.6539,80.5962,73.5385,66.4808,59.4231,52.3654,45.3077,38.2500,36.2885,34.3269,32.3654,30.4038,28.4423,26.4808,24.5192,22.5577,20.5962,18.6346,16.6731,14.7115,12.7500,11.7692,10.7885,9.80769,8.82692,7.84615,6.86539,5.88461,4.90385,3.92308,2.94231,1.96154,0.980769,0.00000,2.46154,4.92308,7.38462,9.84616,12.3077,14.7692,17.2308,19.6923,22.1538,24.6154,27.0769,29.5385,32.0000,32.0000,32.0000,32.0000,32.0000,32.0000,32.0000,32.0000,32.0000,32.0000,32.0000,32.0000,32.0000,32.0000,41.3077,50.6154,59.9231,69.2308,78.5385,87.8462,97.1539,106.462,115.769,125.077,134.385,143.692,153.000,156.923,160.846,164.769,168.692,172.615,176.538,180.462,184.385,188.308,192.231,196.154,200.077,204.000,205.962,207.923,209.885,211.846,213.808,215.769,217.731,219.692,221.654,223.615,225.577,227.538,229.500,230.481,231.462,232.442,233.423,234.404,235.385,236.365,237.346,238.327,239.308,240.288,241.269,242.250,242.838,243.427,244.015,244.604,245.192,245.781,246.369,246.958,247.546,248.135,248.723,249.312,249.900,250.096,250.292,250.488,250.685,250.881,251.077,251.273,251.469,251.665,251.862,252.058,252.254,252.450,252.682,252.914,253.145,253.377,253.609,253.841,254.073,254.305,254.536,254.768,255.000])
        r: new Float32Array([
            0.0, 0.0, 0.0, 0.0, 0.769231, 0.0, 0.0, 0.0, 1.53846, 0.0, 0.0, 0.0, 2.30769, 0.0, 0.0, 0.0,
            3.07692, 0.0, 0.0, 0.0, 3.84615, 0.0, 0.0, 0.0, 4.61538, 0.0, 0.0, 0.0, 5.38462, 0.0, 0.0,
            0.0, 6.15385, 0.0, 0.0, 0.0, 6.92308, 0.0, 0.0, 0.0, 7.69231, 0.0, 0.0, 0.0, 8.46154, 0.0,
            0.0, 0.0, 9.23077, 0.0, 0.0, 0.0, 10.0, 0.0, 0.0, 0.0, 11.5385, 0.0, 0.0, 0.0, 13.0769, 0.0,
            0.0, 0.0, 14.6154, 0.0, 0.0, 0.0, 16.1538, 0.0, 0.0, 0.0, 17.6923, 0.0, 0.0, 0.0, 19.2308,
            0.0, 0.0, 0.0, 20.7692, 0.0, 0.0, 0.0, 22.3077, 0.0, 0.0, 0.0, 23.8462, 0.0, 0.0, 0.0,
            25.3846, 0.0, 0.0, 0.0, 26.9231, 0.0, 0.0, 0.0, 28.4615, 0.0, 0.0, 0.0, 30.0, 0.0, 0.0, 0.0,
            33.8462, 0.0, 0.0, 0.0, 37.6923, 0.0, 0.0, 0.0, 41.5385, 0.0, 0.0, 0.0, 45.3846, 0.0, 0.0,
            0.0, 49.2308, 0.0, 0.0, 0.0, 53.0769, 0.0, 0.0, 0.0, 56.9231, 0.0, 0.0, 0.0, 60.7692, 0.0,
            0.0, 0.0, 64.6154, 0.0, 0.0, 0.0, 68.4615, 0.0, 0.0, 0.0, 72.3077, 0.0, 0.0, 0.0, 76.1538,
            0.0, 0.0, 0.0, 80.0, 0.0, 0.0, 0.0, 88.5385, 0.0, 0.0, 0.0, 97.0769, 0.0, 0.0, 0.0, 105.615,
            0.0, 0.0, 0.0, 114.154, 0.0, 0.0, 0.0, 122.692, 0.0, 0.0, 0.0, 131.231, 0.0, 0.0, 0.0,
            139.769, 0.0, 0.0, 0.0, 148.308, 0.0, 0.0, 0.0, 156.846, 0.0, 0.0, 0.0, 165.385, 0.0, 0.0,
            0.0, 173.923, 0.0, 0.0, 0.0, 182.462, 0.0, 0.0, 0.0, 191.0, 0.0, 0.0, 0.0, 193.846, 0.0, 0.0,
            0.0, 196.692, 0.0, 0.0, 0.0, 199.538, 0.0, 0.0, 0.0, 202.385, 0.0, 0.0, 0.0, 205.231, 0.0,
            0.0, 0.0, 208.077, 0.0, 0.0, 0.0, 210.923, 0.0, 0.0, 0.0, 213.769, 0.0, 0.0, 0.0, 216.615,
            0.0, 0.0, 0.0, 219.462, 0.0, 0.0, 0.0, 222.308, 0.0, 0.0, 0.0, 225.154, 0.0, 0.0, 0.0, 228.0,
            0.0, 0.0, 0.0, 229.182, 0.0, 0.0, 0.0, 230.364, 0.0, 0.0, 0.0, 231.545, 0.0, 0.0, 0.0,
            232.727, 0.0, 0.0, 0.0, 233.909, 0.0, 0.0, 0.0, 235.091, 0.0, 0.0, 0.0, 236.273, 0.0, 0.0,
            0.0, 237.455, 0.0, 0.0, 0.0, 238.636, 0.0, 0.0, 0.0, 239.818, 0.0, 0.0, 0.0, 241.0, 0.0, 0.0,
            0.0, 241.0, 0.0, 0.0, 0.0, 241.364, 0.0, 0.0, 0.0, 241.727, 0.0, 0.0, 0.0, 242.091, 0.0, 0.0,
            0.0, 242.455, 0.0, 0.0, 0.0, 242.818, 0.0, 0.0, 0.0, 243.182, 0.0, 0.0, 0.0, 243.545, 0.0,
            0.0, 0.0, 243.909, 0.0, 0.0, 0.0, 244.273, 0.0, 0.0, 0.0, 244.636, 0.0, 0.0, 0.0, 245.0, 0.0,
            0.0, 0.0, 245.231, 0.0, 0.0, 0.0, 245.462, 0.0, 0.0, 0.0, 245.692, 0.0, 0.0, 0.0, 245.923,
            0.0, 0.0, 0.0, 246.154, 0.0, 0.0, 0.0, 246.385, 0.0, 0.0, 0.0, 246.615, 0.0, 0.0, 0.0,
            246.846, 0.0, 0.0, 0.0, 247.077, 0.0, 0.0, 0.0, 247.308, 0.0, 0.0, 0.0, 247.538, 0.0, 0.0,
            0.0, 247.769, 0.0, 0.0, 0.0, 248.0, 0.0, 0.0, 0.0, 248.146, 0.0, 0.0, 0.0, 248.292, 0.0, 0.0,
            0.0, 248.438, 0.0, 0.0, 0.0, 248.585, 0.0, 0.0, 0.0, 248.731, 0.0, 0.0, 0.0, 248.877, 0.0,
            0.0, 0.0, 249.023, 0.0, 0.0, 0.0, 249.169, 0.0, 0.0, 0.0, 249.315, 0.0, 0.0, 0.0, 249.462,
            0.0, 0.0, 0.0, 249.608, 0.0, 0.0, 0.0, 249.754, 0.0, 0.0, 0.0, 249.9, 0.0, 0.0, 0.0, 249.312,
            0.0, 0.0, 0.0, 248.723, 0.0, 0.0, 0.0, 248.135, 0.0, 0.0, 0.0, 247.546, 0.0, 0.0, 0.0,
            246.958, 0.0, 0.0, 0.0, 246.369, 0.0, 0.0, 0.0, 245.781, 0.0, 0.0, 0.0, 245.192, 0.0, 0.0,
            0.0, 244.604, 0.0, 0.0, 0.0, 244.015, 0.0, 0.0, 0.0, 243.427, 0.0, 0.0, 0.0, 242.838, 0.0,
            0.0, 0.0, 242.25, 0.0, 0.0, 0.0, 239.308, 0.0, 0.0, 0.0, 236.365, 0.0, 0.0, 0.0, 233.423, 0.0,
            0.0, 0.0, 230.481, 0.0, 0.0, 0.0, 227.538, 0.0, 0.0, 0.0, 224.596, 0.0, 0.0, 0.0, 221.654,
            0.0, 0.0, 0.0, 218.712, 0.0, 0.0, 0.0, 215.769, 0.0, 0.0, 0.0, 212.827, 0.0, 0.0, 0.0,
            209.885, 0.0, 0.0, 0.0, 206.942, 0.0, 0.0, 0.0, 204.0, 0.0, 0.0, 0.0, 201.0, 0.0, 0.0, 0.0,
            198.0, 0.0, 0.0, 0.0, 195.0, 0.0, 0.0, 0.0, 192.0, 0.0, 0.0, 0.0, 189.0, 0.0, 0.0, 0.0, 186.0,
            0.0, 0.0, 0.0, 183.0, 0.0, 0.0, 0.0, 180.0, 0.0, 0.0, 0.0, 177.0, 0.0, 0.0, 0.0, 174.0, 0.0,
            0.0, 0.0, 171.0, 0.0, 0.0, 0.0, 168.0, 0.0, 0.0, 0.0, 165.0, 0.0, 0.0, 0.0, 161.077, 0.0, 0.0,
            0.0, 157.154, 0.0, 0.0, 0.0, 153.231, 0.0, 0.0, 0.0, 149.308, 0.0, 0.0, 0.0, 145.385, 0.0,
            0.0, 0.0, 141.462, 0.0, 0.0, 0.0, 137.538, 0.0, 0.0, 0.0, 133.615, 0.0, 0.0, 0.0, 129.692,
            0.0, 0.0, 0.0, 125.769, 0.0, 0.0, 0.0, 121.846, 0.0, 0.0, 0.0, 117.923, 0.0, 0.0, 0.0, 114.0,
            0.0, 0.0, 0.0, 115.038, 0.0, 0.0, 0.0, 116.077, 0.0, 0.0, 0.0, 117.115, 0.0, 0.0, 0.0,
            118.154, 0.0, 0.0, 0.0, 119.192, 0.0, 0.0, 0.0, 120.231, 0.0, 0.0, 0.0, 121.269, 0.0, 0.0,
            0.0, 122.308, 0.0, 0.0, 0.0, 123.346, 0.0, 0.0, 0.0, 124.385, 0.0, 0.0, 0.0, 125.423, 0.0,
            0.0, 0.0, 126.462, 0.0, 0.0, 0.0, 127.5, 0.0, 0.0, 0.0, 131.423, 0.0, 0.0, 0.0, 135.346, 0.0,
            0.0, 0.0, 139.269, 0.0, 0.0, 0.0, 143.192, 0.0, 0.0, 0.0, 147.115, 0.0, 0.0, 0.0, 151.038,
            0.0, 0.0, 0.0, 154.962, 0.0, 0.0, 0.0, 158.885, 0.0, 0.0, 0.0, 162.808, 0.0, 0.0, 0.0,
            166.731, 0.0, 0.0, 0.0, 170.654, 0.0, 0.0, 0.0, 174.577, 0.0, 0.0, 0.0, 178.5, 0.0, 0.0, 0.0,
            180.462, 0.0, 0.0, 0.0, 182.423, 0.0, 0.0, 0.0, 184.385, 0.0, 0.0, 0.0, 186.346, 0.0, 0.0,
            0.0, 188.308, 0.0, 0.0, 0.0, 190.269, 0.0, 0.0, 0.0, 192.231, 0.0, 0.0, 0.0, 194.192, 0.0,
            0.0, 0.0, 196.154, 0.0, 0.0, 0.0, 198.115, 0.0, 0.0, 0.0, 200.077, 0.0, 0.0, 0.0, 202.038,
            0.0, 0.0, 0.0, 204.0, 0.0, 0.0, 0.0, 205.962, 0.0, 0.0, 0.0, 207.923, 0.0, 0.0, 0.0, 209.885,
            0.0, 0.0, 0.0, 211.846, 0.0, 0.0, 0.0, 213.808, 0.0, 0.0, 0.0, 215.769, 0.0, 0.0, 0.0,
            217.731, 0.0, 0.0, 0.0, 219.692, 0.0, 0.0, 0.0, 221.654, 0.0, 0.0, 0.0, 223.615, 0.0, 0.0,
            0.0, 225.577, 0.0, 0.0, 0.0, 227.538, 0.0, 0.0, 0.0, 229.5, 0.0, 0.0, 0.0, 230.481, 0.0, 0.0,
            0.0, 231.462, 0.0, 0.0, 0.0, 232.442, 0.0, 0.0, 0.0, 233.423, 0.0, 0.0, 0.0, 234.404, 0.0,
            0.0, 0.0, 235.385, 0.0, 0.0, 0.0, 236.365, 0.0, 0.0, 0.0, 237.346, 0.0, 0.0, 0.0, 238.327,
            0.0, 0.0, 0.0, 239.308, 0.0, 0.0, 0.0, 240.288, 0.0, 0.0, 0.0, 241.269, 0.0, 0.0, 0.0, 242.25,
            0.0, 0.0, 0.0, 242.642, 0.0, 0.0, 0.0, 243.035, 0.0, 0.0, 0.0, 243.427, 0.0, 0.0, 0.0,
            243.819, 0.0, 0.0, 0.0, 244.212, 0.0, 0.0, 0.0, 244.604, 0.0, 0.0, 0.0, 244.996, 0.0, 0.0,
            0.0, 245.388, 0.0, 0.0, 0.0, 245.781, 0.0, 0.0, 0.0, 246.173, 0.0, 0.0, 0.0, 246.565, 0.0,
            0.0, 0.0, 246.958, 0.0, 0.0, 0.0, 247.35, 0.0, 0.0, 0.0, 247.814, 0.0, 0.0, 0.0, 248.277, 0.0,
            0.0, 0.0, 248.741, 0.0, 0.0, 0.0, 249.205, 0.0, 0.0, 0.0, 249.668, 0.0, 0.0, 0.0, 250.132,
            0.0, 0.0, 0.0, 250.595, 0.0, 0.0, 0.0, 251.059, 0.0, 0.0, 0.0, 251.523, 0.0, 0.0, 0.0,
            251.986, 0.0, 0.0, 0.0, 252.45, 0.0, 0.0, 0.0
        ]),
        g: new Float32Array([
            0.0, 0.0, 0.0, 0.0, 1.53846, 0.0, 0.0, 0.0, 3.07692, 0.0, 0.0, 0.0, 4.61538, 0.0, 0.0, 0.0,
            6.15385, 0.0, 0.0, 0.0, 7.69231, 0.0, 0.0, 0.0, 9.23077, 0.0, 0.0, 0.0, 10.7692, 0.0, 0.0,
            0.0, 12.3077, 0.0, 0.0, 0.0, 13.8462, 0.0, 0.0, 0.0, 15.3846, 0.0, 0.0, 0.0, 16.9231, 0.0,
            0.0, 0.0, 18.4615, 0.0, 0.0, 0.0, 20.0, 0.0, 0.0, 0.0, 32.6154, 0.0, 0.0, 0.0, 45.2308, 0.0,
            0.0, 0.0, 57.8462, 0.0, 0.0, 0.0, 70.4615, 0.0, 0.0, 0.0, 83.0769, 0.0, 0.0, 0.0, 95.6923,
            0.0, 0.0, 0.0, 108.308, 0.0, 0.0, 0.0, 120.923, 0.0, 0.0, 0.0, 133.538, 0.0, 0.0, 0.0,
            146.154, 0.0, 0.0, 0.0, 158.769, 0.0, 0.0, 0.0, 171.385, 0.0, 0.0, 0.0, 184.0, 0.0, 0.0, 0.0,
            187.923, 0.0, 0.0, 0.0, 191.846, 0.0, 0.0, 0.0, 195.769, 0.0, 0.0, 0.0, 199.692, 0.0, 0.0,
            0.0, 203.615, 0.0, 0.0, 0.0, 207.538, 0.0, 0.0, 0.0, 211.462, 0.0, 0.0, 0.0, 215.385, 0.0,
            0.0, 0.0, 219.308, 0.0, 0.0, 0.0, 223.231, 0.0, 0.0, 0.0, 227.154, 0.0, 0.0, 0.0, 231.077,
            0.0, 0.0, 0.0, 235.0, 0.0, 0.0, 0.0, 235.308, 0.0, 0.0, 0.0, 235.615, 0.0, 0.0, 0.0, 235.923,
            0.0, 0.0, 0.0, 236.231, 0.0, 0.0, 0.0, 236.538, 0.0, 0.0, 0.0, 236.846, 0.0, 0.0, 0.0,
            237.154, 0.0, 0.0, 0.0, 237.462, 0.0, 0.0, 0.0, 237.769, 0.0, 0.0, 0.0, 238.077, 0.0, 0.0,
            0.0, 238.385, 0.0, 0.0, 0.0, 238.692, 0.0, 0.0, 0.0, 239.0, 0.0, 0.0, 0.0, 239.077, 0.0, 0.0,
            0.0, 239.154, 0.0, 0.0, 0.0, 239.231, 0.0, 0.0, 0.0, 239.308, 0.0, 0.0, 0.0, 239.385, 0.0,
            0.0, 0.0, 239.462, 0.0, 0.0, 0.0, 239.538, 0.0, 0.0, 0.0, 239.615, 0.0, 0.0, 0.0, 239.692,
            0.0, 0.0, 0.0, 239.769, 0.0, 0.0, 0.0, 239.846, 0.0, 0.0, 0.0, 239.923, 0.0, 0.0, 0.0, 240.0,
            0.0, 0.0, 0.0, 240.091, 0.0, 0.0, 0.0, 240.182, 0.0, 0.0, 0.0, 240.273, 0.0, 0.0, 0.0,
            240.364, 0.0, 0.0, 0.0, 240.455, 0.0, 0.0, 0.0, 240.545, 0.0, 0.0, 0.0, 240.636, 0.0, 0.0,
            0.0, 240.727, 0.0, 0.0, 0.0, 240.818, 0.0, 0.0, 0.0, 240.909, 0.0, 0.0, 0.0, 241.0, 0.0, 0.0,
            0.0, 241.0, 0.0, 0.0, 0.0, 240.909, 0.0, 0.0, 0.0, 240.818, 0.0, 0.0, 0.0, 240.727, 0.0, 0.0,
            0.0, 240.636, 0.0, 0.0, 0.0, 240.545, 0.0, 0.0, 0.0, 240.455, 0.0, 0.0, 0.0, 240.364, 0.0,
            0.0, 0.0, 240.273, 0.0, 0.0, 0.0, 240.182, 0.0, 0.0, 0.0, 240.091, 0.0, 0.0, 0.0, 240.0, 0.0,
            0.0, 0.0, 239.615, 0.0, 0.0, 0.0, 239.231, 0.0, 0.0, 0.0, 238.846, 0.0, 0.0, 0.0, 238.462,
            0.0, 0.0, 0.0, 238.077, 0.0, 0.0, 0.0, 237.692, 0.0, 0.0, 0.0, 237.308, 0.0, 0.0, 0.0,
            236.923, 0.0, 0.0, 0.0, 236.538, 0.0, 0.0, 0.0, 236.154, 0.0, 0.0, 0.0, 235.769, 0.0, 0.0,
            0.0, 235.385, 0.0, 0.0, 0.0, 235.0, 0.0, 0.0, 0.0, 232.615, 0.0, 0.0, 0.0, 230.231, 0.0, 0.0,
            0.0, 227.846, 0.0, 0.0, 0.0, 225.462, 0.0, 0.0, 0.0, 223.077, 0.0, 0.0, 0.0, 220.692, 0.0,
            0.0, 0.0, 218.308, 0.0, 0.0, 0.0, 215.923, 0.0, 0.0, 0.0, 213.538, 0.0, 0.0, 0.0, 211.154,
            0.0, 0.0, 0.0, 208.769, 0.0, 0.0, 0.0, 206.385, 0.0, 0.0, 0.0, 204.0, 0.0, 0.0, 0.0, 200.077,
            0.0, 0.0, 0.0, 196.154, 0.0, 0.0, 0.0, 192.231, 0.0, 0.0, 0.0, 188.308, 0.0, 0.0, 0.0,
            184.385, 0.0, 0.0, 0.0, 180.462, 0.0, 0.0, 0.0, 176.538, 0.0, 0.0, 0.0, 172.615, 0.0, 0.0,
            0.0, 168.692, 0.0, 0.0, 0.0, 164.769, 0.0, 0.0, 0.0, 160.846, 0.0, 0.0, 0.0, 156.923, 0.0,
            0.0, 0.0, 153.0, 0.0, 0.0, 0.0, 147.115, 0.0, 0.0, 0.0, 141.231, 0.0, 0.0, 0.0, 135.346, 0.0,
            0.0, 0.0, 129.462, 0.0, 0.0, 0.0, 123.577, 0.0, 0.0, 0.0, 117.692, 0.0, 0.0, 0.0, 111.808,
            0.0, 0.0, 0.0, 105.923, 0.0, 0.0, 0.0, 100.038, 0.0, 0.0, 0.0, 94.1538, 0.0, 0.0, 0.0,
            88.2692, 0.0, 0.0, 0.0, 82.3846, 0.0, 0.0, 0.0, 76.5, 0.0, 0.0, 0.0, 73.0769, 0.0, 0.0, 0.0,
            69.6538, 0.0, 0.0, 0.0, 66.2308, 0.0, 0.0, 0.0, 62.8077, 0.0, 0.0, 0.0, 59.3846, 0.0, 0.0,
            0.0, 55.9615, 0.0, 0.0, 0.0, 52.5385, 0.0, 0.0, 0.0, 49.1154, 0.0, 0.0, 0.0, 45.6923, 0.0,
            0.0, 0.0, 42.2692, 0.0, 0.0, 0.0, 38.8462, 0.0, 0.0, 0.0, 35.4231, 0.0, 0.0, 0.0, 32.0, 0.0,
            0.0, 0.0, 29.5385, 0.0, 0.0, 0.0, 27.0769, 0.0, 0.0, 0.0, 24.6154, 0.0, 0.0, 0.0, 22.1538,
            0.0, 0.0, 0.0, 19.6923, 0.0, 0.0, 0.0, 17.2308, 0.0, 0.0, 0.0, 14.7692, 0.0, 0.0, 0.0,
            12.3077, 0.0, 0.0, 0.0, 9.84615, 0.0, 0.0, 0.0, 7.38462, 0.0, 0.0, 0.0, 4.92308, 0.0, 0.0,
            0.0, 2.46154, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 9.80769, 0.0, 0.0, 0.0, 19.6154, 0.0, 0.0,
            0.0, 29.4231, 0.0, 0.0, 0.0, 39.2308, 0.0, 0.0, 0.0, 49.0385, 0.0, 0.0, 0.0, 58.8462, 0.0,
            0.0, 0.0, 68.6538, 0.0, 0.0, 0.0, 78.4615, 0.0, 0.0, 0.0, 88.2692, 0.0, 0.0, 0.0, 98.0769,
            0.0, 0.0, 0.0, 107.885, 0.0, 0.0, 0.0, 117.692, 0.0, 0.0, 0.0, 127.5, 0.0, 0.0, 0.0, 131.423,
            0.0, 0.0, 0.0, 135.346, 0.0, 0.0, 0.0, 139.269, 0.0, 0.0, 0.0, 143.192, 0.0, 0.0, 0.0,
            147.115, 0.0, 0.0, 0.0, 151.038, 0.0, 0.0, 0.0, 154.962, 0.0, 0.0, 0.0, 158.885, 0.0, 0.0,
            0.0, 162.808, 0.0, 0.0, 0.0, 166.731, 0.0, 0.0, 0.0, 170.654, 0.0, 0.0, 0.0, 174.577, 0.0,
            0.0, 0.0, 178.5, 0.0, 0.0, 0.0, 180.462, 0.0, 0.0, 0.0, 182.423, 0.0, 0.0, 0.0, 184.385, 0.0,
            0.0, 0.0, 186.346, 0.0, 0.0, 0.0, 188.308, 0.0, 0.0, 0.0, 190.269, 0.0, 0.0, 0.0, 192.231,
            0.0, 0.0, 0.0, 194.192, 0.0, 0.0, 0.0, 196.154, 0.0, 0.0, 0.0, 198.115, 0.0, 0.0, 0.0,
            200.077, 0.0, 0.0, 0.0, 202.038, 0.0, 0.0, 0.0, 204.0, 0.0, 0.0, 0.0, 205.962, 0.0, 0.0, 0.0,
            207.923, 0.0, 0.0, 0.0, 209.885, 0.0, 0.0, 0.0, 211.846, 0.0, 0.0, 0.0, 213.808, 0.0, 0.0,
            0.0, 215.769, 0.0, 0.0, 0.0, 217.731, 0.0, 0.0, 0.0, 219.692, 0.0, 0.0, 0.0, 221.654, 0.0,
            0.0, 0.0, 223.615, 0.0, 0.0, 0.0, 225.577, 0.0, 0.0, 0.0, 227.538, 0.0, 0.0, 0.0, 229.5, 0.0,
            0.0, 0.0, 230.481, 0.0, 0.0, 0.0, 231.462, 0.0, 0.0, 0.0, 232.442, 0.0, 0.0, 0.0, 233.423,
            0.0, 0.0, 0.0, 234.404, 0.0, 0.0, 0.0, 235.385, 0.0, 0.0, 0.0, 236.365, 0.0, 0.0, 0.0,
            237.346, 0.0, 0.0, 0.0, 238.327, 0.0, 0.0, 0.0, 239.308, 0.0, 0.0, 0.0, 240.288, 0.0, 0.0,
            0.0, 241.269, 0.0, 0.0, 0.0, 242.25, 0.0, 0.0, 0.0, 242.642, 0.0, 0.0, 0.0, 243.035, 0.0, 0.0,
            0.0, 243.427, 0.0, 0.0, 0.0, 243.819, 0.0, 0.0, 0.0, 244.212, 0.0, 0.0, 0.0, 244.604, 0.0,
            0.0, 0.0, 244.996, 0.0, 0.0, 0.0, 245.388, 0.0, 0.0, 0.0, 245.781, 0.0, 0.0, 0.0, 246.173,
            0.0, 0.0, 0.0, 246.565, 0.0, 0.0, 0.0, 246.958, 0.0, 0.0, 0.0, 247.35, 0.0, 0.0, 0.0, 247.814,
            0.0, 0.0, 0.0, 248.277, 0.0, 0.0, 0.0, 248.741, 0.0, 0.0, 0.0, 249.205, 0.0, 0.0, 0.0,
            249.668, 0.0, 0.0, 0.0, 250.132, 0.0, 0.0, 0.0, 250.595, 0.0, 0.0, 0.0, 251.059, 0.0, 0.0,
            0.0, 251.523, 0.0, 0.0, 0.0, 251.986, 0.0, 0.0, 0.0, 252.45, 0.0, 0.0, 0.0
        ]),
        b: new Float32Array([
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 254.615, 0.0, 0.0, 0.0, 254.231, 0.0, 0.0, 0.0, 253.846,
            0.0, 0.0, 0.0, 253.462, 0.0, 0.0, 0.0, 253.077, 0.0, 0.0, 0.0, 252.692, 0.0, 0.0, 0.0,
            252.308, 0.0, 0.0, 0.0, 251.923, 0.0, 0.0, 0.0, 251.538, 0.0, 0.0, 0.0, 251.154, 0.0, 0.0,
            0.0, 250.769, 0.0, 0.0, 0.0, 250.385, 0.0, 0.0, 0.0, 250.0, 0.0, 0.0, 0.0, 249.615, 0.0, 0.0,
            0.0, 249.231, 0.0, 0.0, 0.0, 248.846, 0.0, 0.0, 0.0, 248.462, 0.0, 0.0, 0.0, 248.077, 0.0,
            0.0, 0.0, 247.692, 0.0, 0.0, 0.0, 247.308, 0.0, 0.0, 0.0, 246.923, 0.0, 0.0, 0.0, 246.538,
            0.0, 0.0, 0.0, 246.154, 0.0, 0.0, 0.0, 245.769, 0.0, 0.0, 0.0, 245.385, 0.0, 0.0, 0.0, 245.0,
            0.0, 0.0, 0.0, 242.0, 0.0, 0.0, 0.0, 239.0, 0.0, 0.0, 0.0, 236.0, 0.0, 0.0, 0.0, 233.0, 0.0,
            0.0, 0.0, 230.0, 0.0, 0.0, 0.0, 227.0, 0.0, 0.0, 0.0, 224.0, 0.0, 0.0, 0.0, 221.0, 0.0, 0.0,
            0.0, 218.0, 0.0, 0.0, 0.0, 215.0, 0.0, 0.0, 0.0, 212.0, 0.0, 0.0, 0.0, 212.0, 0.0, 0.0, 0.0,
            208.636, 0.0, 0.0, 0.0, 205.273, 0.0, 0.0, 0.0, 201.909, 0.0, 0.0, 0.0, 198.545, 0.0, 0.0,
            0.0, 195.182, 0.0, 0.0, 0.0, 191.818, 0.0, 0.0, 0.0, 188.455, 0.0, 0.0, 0.0, 185.091, 0.0,
            0.0, 0.0, 181.727, 0.0, 0.0, 0.0, 178.364, 0.0, 0.0, 0.0, 175.0, 0.0, 0.0, 0.0, 171.538, 0.0,
            0.0, 0.0, 168.077, 0.0, 0.0, 0.0, 164.615, 0.0, 0.0, 0.0, 161.154, 0.0, 0.0, 0.0, 157.692,
            0.0, 0.0, 0.0, 154.231, 0.0, 0.0, 0.0, 150.769, 0.0, 0.0, 0.0, 147.308, 0.0, 0.0, 0.0,
            143.846, 0.0, 0.0, 0.0, 140.385, 0.0, 0.0, 0.0, 136.923, 0.0, 0.0, 0.0, 133.462, 0.0, 0.0,
            0.0, 130.0, 0.0, 0.0, 0.0, 122.942, 0.0, 0.0, 0.0, 115.885, 0.0, 0.0, 0.0, 108.827, 0.0, 0.0,
            0.0, 101.769, 0.0, 0.0, 0.0, 94.7115, 0.0, 0.0, 0.0, 87.6539, 0.0, 0.0, 0.0, 80.5962, 0.0,
            0.0, 0.0, 73.5385, 0.0, 0.0, 0.0, 66.4808, 0.0, 0.0, 0.0, 59.4231, 0.0, 0.0, 0.0, 52.3654,
            0.0, 0.0, 0.0, 45.3077, 0.0, 0.0, 0.0, 38.25, 0.0, 0.0, 0.0, 36.2885, 0.0, 0.0, 0.0, 34.3269,
            0.0, 0.0, 0.0, 32.3654, 0.0, 0.0, 0.0, 30.4038, 0.0, 0.0, 0.0, 28.4423, 0.0, 0.0, 0.0,
            26.4808, 0.0, 0.0, 0.0, 24.5192, 0.0, 0.0, 0.0, 22.5577, 0.0, 0.0, 0.0, 20.5962, 0.0, 0.0,
            0.0, 18.6346, 0.0, 0.0, 0.0, 16.6731, 0.0, 0.0, 0.0, 14.7115, 0.0, 0.0, 0.0, 12.75, 0.0, 0.0,
            0.0, 11.7692, 0.0, 0.0, 0.0, 10.7885, 0.0, 0.0, 0.0, 9.80769, 0.0, 0.0, 0.0, 8.82692, 0.0,
            0.0, 0.0, 7.84615, 0.0, 0.0, 0.0, 6.86539, 0.0, 0.0, 0.0, 5.88461, 0.0, 0.0, 0.0, 4.90385,
            0.0, 0.0, 0.0, 3.92308, 0.0, 0.0, 0.0, 2.94231, 0.0, 0.0, 0.0, 1.96154, 0.0, 0.0, 0.0,
            0.980769, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 2.46154, 0.0, 0.0, 0.0, 4.92308, 0.0, 0.0, 0.0,
            7.38462, 0.0, 0.0, 0.0, 9.84616, 0.0, 0.0, 0.0, 12.3077, 0.0, 0.0, 0.0, 14.7692, 0.0, 0.0,
            0.0, 17.2308, 0.0, 0.0, 0.0, 19.6923, 0.0, 0.0, 0.0, 22.1538, 0.0, 0.0, 0.0, 24.6154, 0.0,
            0.0, 0.0, 27.0769, 0.0, 0.0, 0.0, 29.5385, 0.0, 0.0, 0.0, 32.0, 0.0, 0.0, 0.0, 32.0, 0.0, 0.0,
            0.0, 32.0, 0.0, 0.0, 0.0, 32.0, 0.0, 0.0, 0.0, 32.0, 0.0, 0.0, 0.0, 32.0, 0.0, 0.0, 0.0, 32.0,
            0.0, 0.0, 0.0, 32.0, 0.0, 0.0, 0.0, 32.0, 0.0, 0.0, 0.0, 32.0, 0.0, 0.0, 0.0, 32.0, 0.0, 0.0,
            0.0, 32.0, 0.0, 0.0, 0.0, 32.0, 0.0, 0.0, 0.0, 32.0, 0.0, 0.0, 0.0, 41.3077, 0.0, 0.0, 0.0,
            50.6154, 0.0, 0.0, 0.0, 59.9231, 0.0, 0.0, 0.0, 69.2308, 0.0, 0.0, 0.0, 78.5385, 0.0, 0.0,
            0.0, 87.8462, 0.0, 0.0, 0.0, 97.1539, 0.0, 0.0, 0.0, 106.462, 0.0, 0.0, 0.0, 115.769, 0.0,
            0.0, 0.0, 125.077, 0.0, 0.0, 0.0, 134.385, 0.0, 0.0, 0.0, 143.692, 0.0, 0.0, 0.0, 153.0, 0.0,
            0.0, 0.0, 156.923, 0.0, 0.0, 0.0, 160.846, 0.0, 0.0, 0.0, 164.769, 0.0, 0.0, 0.0, 168.692,
            0.0, 0.0, 0.0, 172.615, 0.0, 0.0, 0.0, 176.538, 0.0, 0.0, 0.0, 180.462, 0.0, 0.0, 0.0,
            184.385, 0.0, 0.0, 0.0, 188.308, 0.0, 0.0, 0.0, 192.231, 0.0, 0.0, 0.0, 196.154, 0.0, 0.0,
            0.0, 200.077, 0.0, 0.0, 0.0, 204.0, 0.0, 0.0, 0.0, 205.962, 0.0, 0.0, 0.0, 207.923, 0.0, 0.0,
            0.0, 209.885, 0.0, 0.0, 0.0, 211.846, 0.0, 0.0, 0.0, 213.808, 0.0, 0.0, 0.0, 215.769, 0.0,
            0.0, 0.0, 217.731, 0.0, 0.0, 0.0, 219.692, 0.0, 0.0, 0.0, 221.654, 0.0, 0.0, 0.0, 223.615,
            0.0, 0.0, 0.0, 225.577, 0.0, 0.0, 0.0, 227.538, 0.0, 0.0, 0.0, 229.5, 0.0, 0.0, 0.0, 230.481,
            0.0, 0.0, 0.0, 231.462, 0.0, 0.0, 0.0, 232.442, 0.0, 0.0, 0.0, 233.423, 0.0, 0.0, 0.0,
            234.404, 0.0, 0.0, 0.0, 235.385, 0.0, 0.0, 0.0, 236.365, 0.0, 0.0, 0.0, 237.346, 0.0, 0.0,
            0.0, 238.327, 0.0, 0.0, 0.0, 239.308, 0.0, 0.0, 0.0, 240.288, 0.0, 0.0, 0.0, 241.269, 0.0,
            0.0, 0.0, 242.25, 0.0, 0.0, 0.0, 242.838, 0.0, 0.0, 0.0, 243.427, 0.0, 0.0, 0.0, 244.015, 0.0,
            0.0, 0.0, 244.604, 0.0, 0.0, 0.0, 245.192, 0.0, 0.0, 0.0, 245.781, 0.0, 0.0, 0.0, 246.369,
            0.0, 0.0, 0.0, 246.958, 0.0, 0.0, 0.0, 247.546, 0.0, 0.0, 0.0, 248.135, 0.0, 0.0, 0.0,
            248.723, 0.0, 0.0, 0.0, 249.312, 0.0, 0.0, 0.0, 249.9, 0.0, 0.0, 0.0, 250.096, 0.0, 0.0, 0.0,
            250.292, 0.0, 0.0, 0.0, 250.488, 0.0, 0.0, 0.0, 250.685, 0.0, 0.0, 0.0, 250.881, 0.0, 0.0,
            0.0, 251.077, 0.0, 0.0, 0.0, 251.273, 0.0, 0.0, 0.0, 251.469, 0.0, 0.0, 0.0, 251.665, 0.0,
            0.0, 0.0, 251.862, 0.0, 0.0, 0.0, 252.058, 0.0, 0.0, 0.0, 252.254, 0.0, 0.0, 0.0, 252.45, 0.0,
            0.0, 0.0, 252.682, 0.0, 0.0, 0.0, 252.914, 0.0, 0.0, 0.0, 253.145, 0.0, 0.0, 0.0, 253.377,
            0.0, 0.0, 0.0, 253.609, 0.0, 0.0, 0.0, 253.841, 0.0, 0.0, 0.0, 254.073, 0.0, 0.0, 0.0,
            254.305, 0.0, 0.0, 0.0, 254.536, 0.0, 0.0, 0.0, 254.768, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0
        ])
    };
    RAINBOW = {
        r: new Float32Array([
            0.0, 0.0, 0.0, 0.0, 4.0, 0.0, 0.0, 0.0, 9.0, 0.0, 0.0, 0.0, 13.0, 0.0, 0.0, 0.0, 18.0, 0.0,
            0.0, 0.0, 22.0, 0.0, 0.0, 0.0, 27.0, 0.0, 0.0, 0.0, 31.0, 0.0, 0.0, 0.0, 36.0, 0.0, 0.0, 0.0,
            40.0, 0.0, 0.0, 0.0, 45.0, 0.0, 0.0, 0.0, 50.0, 0.0, 0.0, 0.0, 54.0, 0.0, 0.0, 0.0, 58.0, 0.0,
            0.0, 0.0, 61.0, 0.0, 0.0, 0.0, 64.0, 0.0, 0.0, 0.0, 68.0, 0.0, 0.0, 0.0, 69.0, 0.0, 0.0, 0.0,
            72.0, 0.0, 0.0, 0.0, 74.0, 0.0, 0.0, 0.0, 77.0, 0.0, 0.0, 0.0, 79.0, 0.0, 0.0, 0.0, 80.0, 0.0,
            0.0, 0.0, 82.0, 0.0, 0.0, 0.0, 83.0, 0.0, 0.0, 0.0, 85.0, 0.0, 0.0, 0.0, 84.0, 0.0, 0.0, 0.0,
            86.0, 0.0, 0.0, 0.0, 87.0, 0.0, 0.0, 0.0, 88.0, 0.0, 0.0, 0.0, 86.0, 0.0, 0.0, 0.0, 87.0, 0.0,
            0.0, 0.0, 87.0, 0.0, 0.0, 0.0, 87.0, 0.0, 0.0, 0.0, 85.0, 0.0, 0.0, 0.0, 84.0, 0.0, 0.0, 0.0,
            84.0, 0.0, 0.0, 0.0, 84.0, 0.0, 0.0, 0.0, 83.0, 0.0, 0.0, 0.0, 79.0, 0.0, 0.0, 0.0, 78.0, 0.0,
            0.0, 0.0, 77.0, 0.0, 0.0, 0.0, 76.0, 0.0, 0.0, 0.0, 71.0, 0.0, 0.0, 0.0, 70.0, 0.0, 0.0, 0.0,
            68.0, 0.0, 0.0, 0.0, 66.0, 0.0, 0.0, 0.0, 60.0, 0.0, 0.0, 0.0, 58.0, 0.0, 0.0, 0.0, 55.0, 0.0,
            0.0, 0.0, 53.0, 0.0, 0.0, 0.0, 46.0, 0.0, 0.0, 0.0, 43.0, 0.0, 0.0, 0.0, 40.0, 0.0, 0.0, 0.0,
            36.0, 0.0, 0.0, 0.0, 33.0, 0.0, 0.0, 0.0, 25.0, 0.0, 0.0, 0.0, 21.0, 0.0, 0.0, 0.0, 16.0, 0.0,
            0.0, 0.0, 12.0, 0.0, 0.0, 0.0, 4.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 4.0, 0.0, 0.0, 0.0, 8.0, 0.0, 0.0, 0.0, 12.0, 0.0, 0.0, 0.0, 21.0, 0.0,
            0.0, 0.0, 25.0, 0.0, 0.0, 0.0, 29.0, 0.0, 0.0, 0.0, 33.0, 0.0, 0.0, 0.0, 42.0, 0.0, 0.0, 0.0,
            46.0, 0.0, 0.0, 0.0, 51.0, 0.0, 0.0, 0.0, 55.0, 0.0, 0.0, 0.0, 63.0, 0.0, 0.0, 0.0, 67.0, 0.0,
            0.0, 0.0, 72.0, 0.0, 0.0, 0.0, 76.0, 0.0, 0.0, 0.0, 80.0, 0.0, 0.0, 0.0, 89.0, 0.0, 0.0, 0.0,
            93.0, 0.0, 0.0, 0.0, 97.0, 0.0, 0.0, 0.0, 101.0, 0.0, 0.0, 0.0, 110.0, 0.0, 0.0, 0.0, 114.0,
            0.0, 0.0, 0.0, 119.0, 0.0, 0.0, 0.0, 123.0, 0.0, 0.0, 0.0, 131.0, 0.0, 0.0, 0.0, 135.0, 0.0,
            0.0, 0.0, 140.0, 0.0, 0.0, 0.0, 144.0, 0.0, 0.0, 0.0, 153.0, 0.0, 0.0, 0.0, 157.0, 0.0, 0.0,
            0.0, 161.0, 0.0, 0.0, 0.0, 165.0, 0.0, 0.0, 0.0, 169.0, 0.0, 0.0, 0.0, 178.0, 0.0, 0.0, 0.0,
            182.0, 0.0, 0.0, 0.0, 187.0, 0.0, 0.0, 0.0, 191.0, 0.0, 0.0, 0.0, 199.0, 0.0, 0.0, 0.0, 203.0,
            0.0, 0.0, 0.0, 208.0, 0.0, 0.0, 0.0, 212.0, 0.0, 0.0, 0.0, 221.0, 0.0, 0.0, 0.0, 225.0, 0.0,
            0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 233.0, 0.0, 0.0, 0.0, 242.0, 0.0, 0.0, 0.0, 246.0, 0.0, 0.0,
            0.0, 250.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0
        ]),
        g: new Float32Array([
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 4.0, 0.0, 0.0, 0.0, 8.0, 0.0, 0.0, 0.0, 16.0, 0.0, 0.0, 0.0, 21.0, 0.0, 0.0, 0.0, 25.0,
            0.0, 0.0, 0.0, 29.0, 0.0, 0.0, 0.0, 38.0, 0.0, 0.0, 0.0, 42.0, 0.0, 0.0, 0.0, 46.0, 0.0, 0.0,
            0.0, 51.0, 0.0, 0.0, 0.0, 55.0, 0.0, 0.0, 0.0, 63.0, 0.0, 0.0, 0.0, 67.0, 0.0, 0.0, 0.0, 72.0,
            0.0, 0.0, 0.0, 76.0, 0.0, 0.0, 0.0, 84.0, 0.0, 0.0, 0.0, 89.0, 0.0, 0.0, 0.0, 93.0, 0.0, 0.0,
            0.0, 97.0, 0.0, 0.0, 0.0, 106.0, 0.0, 0.0, 0.0, 110.0, 0.0, 0.0, 0.0, 114.0, 0.0, 0.0, 0.0,
            119.0, 0.0, 0.0, 0.0, 127.0, 0.0, 0.0, 0.0, 131.0, 0.0, 0.0, 0.0, 135.0, 0.0, 0.0, 0.0, 140.0,
            0.0, 0.0, 0.0, 144.0, 0.0, 0.0, 0.0, 152.0, 0.0, 0.0, 0.0, 157.0, 0.0, 0.0, 0.0, 161.0, 0.0,
            0.0, 0.0, 165.0, 0.0, 0.0, 0.0, 174.0, 0.0, 0.0, 0.0, 178.0, 0.0, 0.0, 0.0, 182.0, 0.0, 0.0,
            0.0, 187.0, 0.0, 0.0, 0.0, 195.0, 0.0, 0.0, 0.0, 199.0, 0.0, 0.0, 0.0, 203.0, 0.0, 0.0, 0.0,
            208.0, 0.0, 0.0, 0.0, 216.0, 0.0, 0.0, 0.0, 220.0, 0.0, 0.0, 0.0, 225.0, 0.0, 0.0, 0.0, 229.0,
            0.0, 0.0, 0.0, 233.0, 0.0, 0.0, 0.0, 242.0, 0.0, 0.0, 0.0, 246.0, 0.0, 0.0, 0.0, 250.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 250.0, 0.0, 0.0, 0.0, 242.0, 0.0, 0.0, 0.0, 238.0, 0.0, 0.0, 0.0, 233.0, 0.0,
            0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 221.0, 0.0, 0.0, 0.0, 216.0, 0.0, 0.0, 0.0, 212.0, 0.0, 0.0,
            0.0, 208.0, 0.0, 0.0, 0.0, 199.0, 0.0, 0.0, 0.0, 195.0, 0.0, 0.0, 0.0, 191.0, 0.0, 0.0, 0.0,
            187.0, 0.0, 0.0, 0.0, 178.0, 0.0, 0.0, 0.0, 174.0, 0.0, 0.0, 0.0, 170.0, 0.0, 0.0, 0.0, 165.0,
            0.0, 0.0, 0.0, 161.0, 0.0, 0.0, 0.0, 153.0, 0.0, 0.0, 0.0, 148.0, 0.0, 0.0, 0.0, 144.0, 0.0,
            0.0, 0.0, 140.0, 0.0, 0.0, 0.0, 131.0, 0.0, 0.0, 0.0, 127.0, 0.0, 0.0, 0.0, 123.0, 0.0, 0.0,
            0.0, 119.0, 0.0, 0.0, 0.0, 110.0, 0.0, 0.0, 0.0, 106.0, 0.0, 0.0, 0.0, 102.0, 0.0, 0.0, 0.0,
            97.0, 0.0, 0.0, 0.0, 89.0, 0.0, 0.0, 0.0, 85.0, 0.0, 0.0, 0.0, 80.0, 0.0, 0.0, 0.0, 76.0, 0.0,
            0.0, 0.0, 72.0, 0.0, 0.0, 0.0, 63.0, 0.0, 0.0, 0.0, 59.0, 0.0, 0.0, 0.0, 55.0, 0.0, 0.0, 0.0,
            51.0, 0.0, 0.0, 0.0, 42.0, 0.0, 0.0, 0.0, 38.0, 0.0, 0.0, 0.0, 34.0, 0.0, 0.0, 0.0, 29.0, 0.0,
            0.0, 0.0, 21.0, 0.0, 0.0, 0.0, 17.0, 0.0, 0.0, 0.0, 12.0, 0.0, 0.0, 0.0, 8.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0
        ]),
        b: new Float32Array([
            0.0, 0.0, 0.0, 0.0, 3.0, 0.0, 0.0, 0.0, 7.0, 0.0, 0.0, 0.0, 10.0, 0.0, 0.0, 0.0, 14.0, 0.0,
            0.0, 0.0, 19.0, 0.0, 0.0, 0.0, 23.0, 0.0, 0.0, 0.0, 28.0, 0.0, 0.0, 0.0, 32.0, 0.0, 0.0, 0.0,
            38.0, 0.0, 0.0, 0.0, 43.0, 0.0, 0.0, 0.0, 48.0, 0.0, 0.0, 0.0, 53.0, 0.0, 0.0, 0.0, 59.0, 0.0,
            0.0, 0.0, 63.0, 0.0, 0.0, 0.0, 68.0, 0.0, 0.0, 0.0, 72.0, 0.0, 0.0, 0.0, 77.0, 0.0, 0.0, 0.0,
            81.0, 0.0, 0.0, 0.0, 86.0, 0.0, 0.0, 0.0, 91.0, 0.0, 0.0, 0.0, 95.0, 0.0, 0.0, 0.0, 100.0,
            0.0, 0.0, 0.0, 104.0, 0.0, 0.0, 0.0, 109.0, 0.0, 0.0, 0.0, 113.0, 0.0, 0.0, 0.0, 118.0, 0.0,
            0.0, 0.0, 122.0, 0.0, 0.0, 0.0, 127.0, 0.0, 0.0, 0.0, 132.0, 0.0, 0.0, 0.0, 136.0, 0.0, 0.0,
            0.0, 141.0, 0.0, 0.0, 0.0, 145.0, 0.0, 0.0, 0.0, 150.0, 0.0, 0.0, 0.0, 154.0, 0.0, 0.0, 0.0,
            159.0, 0.0, 0.0, 0.0, 163.0, 0.0, 0.0, 0.0, 168.0, 0.0, 0.0, 0.0, 173.0, 0.0, 0.0, 0.0, 177.0,
            0.0, 0.0, 0.0, 182.0, 0.0, 0.0, 0.0, 186.0, 0.0, 0.0, 0.0, 191.0, 0.0, 0.0, 0.0, 195.0, 0.0,
            0.0, 0.0, 200.0, 0.0, 0.0, 0.0, 204.0, 0.0, 0.0, 0.0, 209.0, 0.0, 0.0, 0.0, 214.0, 0.0, 0.0,
            0.0, 218.0, 0.0, 0.0, 0.0, 223.0, 0.0, 0.0, 0.0, 227.0, 0.0, 0.0, 0.0, 232.0, 0.0, 0.0, 0.0,
            236.0, 0.0, 0.0, 0.0, 241.0, 0.0, 0.0, 0.0, 245.0, 0.0, 0.0, 0.0, 250.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 246.0, 0.0,
            0.0, 0.0, 242.0, 0.0, 0.0, 0.0, 238.0, 0.0, 0.0, 0.0, 233.0, 0.0, 0.0, 0.0, 225.0, 0.0, 0.0,
            0.0, 220.0, 0.0, 0.0, 0.0, 216.0, 0.0, 0.0, 0.0, 212.0, 0.0, 0.0, 0.0, 203.0, 0.0, 0.0, 0.0,
            199.0, 0.0, 0.0, 0.0, 195.0, 0.0, 0.0, 0.0, 191.0, 0.0, 0.0, 0.0, 187.0, 0.0, 0.0, 0.0, 178.0,
            0.0, 0.0, 0.0, 174.0, 0.0, 0.0, 0.0, 170.0, 0.0, 0.0, 0.0, 165.0, 0.0, 0.0, 0.0, 157.0, 0.0,
            0.0, 0.0, 152.0, 0.0, 0.0, 0.0, 148.0, 0.0, 0.0, 0.0, 144.0, 0.0, 0.0, 0.0, 135.0, 0.0, 0.0,
            0.0, 131.0, 0.0, 0.0, 0.0, 127.0, 0.0, 0.0, 0.0, 123.0, 0.0, 0.0, 0.0, 114.0, 0.0, 0.0, 0.0,
            110.0, 0.0, 0.0, 0.0, 106.0, 0.0, 0.0, 0.0, 102.0, 0.0, 0.0, 0.0, 97.0, 0.0, 0.0, 0.0, 89.0,
            0.0, 0.0, 0.0, 84.0, 0.0, 0.0, 0.0, 80.0, 0.0, 0.0, 0.0, 76.0, 0.0, 0.0, 0.0, 67.0, 0.0, 0.0,
            0.0, 63.0, 0.0, 0.0, 0.0, 59.0, 0.0, 0.0, 0.0, 55.0, 0.0, 0.0, 0.0, 46.0, 0.0, 0.0, 0.0, 42.0,
            0.0, 0.0, 0.0, 38.0, 0.0, 0.0, 0.0, 34.0, 0.0, 0.0, 0.0, 25.0, 0.0, 0.0, 0.0, 21.0, 0.0, 0.0,
            0.0, 16.0, 0.0, 0.0, 0.0, 12.0, 0.0, 0.0, 0.0, 8.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0
        ])
    };
    CMB = {
        // "r": new Float32Array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 6.0, 12.0, 18.0, 24.0, 30.0, 36.0, 42.0, 48.0, 54.0, 60.0, 66.0, 72.0, 78.0, 85.0, 91.0, 97.0, 103.0, 109.0, 115.0, 121.0, 127.0, 133.0, 139.0, 145.0, 151.0, 157.0, 163.0, 170.0, 176.0, 182.0, 188.0, 194.0, 200.0, 206.0, 212.0, 218.0, 224.0, 230.0, 236.0, 242.0, 248.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 251.0, 247.0, 244.0, 240.0, 236.0, 233.0, 229.0, 226.0, 222.0, 218.0, 215.0, 211.0, 208.0, 204.0, 200.0, 197.0, 193.0, 190.0, 186.0, 182.0, 179.0, 175.0, 172.0, 168.0, 164.0, 161.0, 157.0, 154.0, 150.0, 146.0, 143.0, 139.0, 136.0, 132.0, 128.0, 125.0, 121.0, 118.0, 114.0, 110.0, 107.0, 103.0, 100.0]),
        // "g": new Float32Array([0.0, 2.0, 5.0, 8.0, 10.0, 13.0, 16.0, 18.0, 21.0, 24.0, 26.0, 29.0, 32.0, 34.0, 37.0, 40.0, 42.0, 45.0, 48.0, 50.0, 53.0, 56.0, 58.0, 61.0, 64.0, 66.0, 69.0, 72.0, 74.0, 77.0, 80.0, 82.0, 85.0, 88.0, 90.0, 93.0, 96.0, 98.0, 101.0, 104.0, 106.0, 109.0, 112.0, 114.0, 117.0, 119.0, 122.0, 124.0, 127.0, 129.0, 132.0, 134.0, 137.0, 139.0, 142.0, 144.0, 147.0, 150.0, 152.0, 155.0, 157.0, 160.0, 162.0, 165.0, 167.0, 170.0, 172.0, 175.0, 177.0, 180.0, 182.0, 185.0, 188.0, 190.0, 193.0, 195.0, 198.0, 200.0, 203.0, 205.0, 208.0, 210.0, 213.0, 215.0, 218.0, 221.0, 221.0, 221.0, 222.0, 222.0, 222.0, 223.0, 223.0, 224.0, 224.0, 224.0, 225.0, 225.0, 225.0, 226.0, 226.0, 227.0, 227.0, 227.0, 228.0, 228.0, 229.0, 229.0, 229.0, 230.0, 230.0, 230.0, 231.0, 231.0, 232.0, 232.0, 232.0, 233.0, 233.0, 233.0, 234.0, 234.0, 235.0, 235.0, 235.0, 236.0, 236.0, 237.0, 235.0, 234.0, 233.0, 231.0, 230.0, 229.0, 227.0, 226.0, 225.0, 223.0, 222.0, 221.0, 219.0, 218.0, 217.0, 215.0, 214.0, 213.0, 211.0, 210.0, 209.0, 207.0, 206.0, 205.0, 203.0, 202.0, 201.0, 199.0, 198.0, 197.0, 195.0, 194.0, 193.0, 191.0, 190.0, 189.0, 187.0, 186.0, 185.0, 183.0, 182.0, 181.0, 180.0, 177.0, 175.0, 172.0, 170.0, 167.0, 165.0, 162.0, 160.0, 157.0, 155.0, 152.0, 150.0, 147.0, 145.0, 142.0, 140.0, 137.0, 135.0, 132.0, 130.0, 127.0, 125.0, 122.0, 120.0, 117.0, 115.0, 112.0, 110.0, 107.0, 105.0, 102.0, 100.0, 97.0, 95.0, 92.0, 90.0, 87.0, 85.0, 82.0, 80.0, 77.0, 75.0, 73.0, 71.0, 69.0, 68.0, 66.0, 64.0, 62.0, 61.0, 59.0, 57.0, 55.0, 54.0, 52.0, 50.0, 48.0, 47.0, 45.0, 43.0, 41.0, 40.0, 38.0, 36.0, 34.0, 33.0, 31.0, 29.0, 27.0, 26.0, 24.0, 22.0, 20.0, 19.0, 17.0, 15.0, 13.0, 12.0, 10.0, 8.0, 6.0, 5.0, 3.0, 1.0, 0.0]),
        // "b": new Float32Array([255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 254.0, 253.0, 252.0, 251.0, 250.0, 249.0, 248.0, 247.0, 246.0, 245.0, 245.0, 244.0, 243.0, 242.0, 241.0, 240.0, 239.0, 238.0, 237.0, 236.0, 236.0, 235.0, 234.0, 233.0, 232.0, 231.0, 230.0, 229.0, 228.0, 227.0, 226.0, 226.0, 225.0, 224.0, 223.0, 222.0, 221.0, 220.0, 219.0, 218.0, 217.0, 217.0, 211.0, 206.0, 201.0, 196.0, 191.0, 186.0, 181.0, 176.0, 171.0, 166.0, 161.0, 156.0, 151.0, 146.0, 141.0, 136.0, 131.0, 126.0, 121.0, 116.0, 111.0, 105.0, 100.0, 95.0, 90.0, 85.0, 80.0, 75.0, 70.0, 65.0, 60.0, 55.0, 50.0, 45.0, 40.0, 35.0, 30.0, 25.0, 20.0, 15.0, 10.0, 5.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0])
        r: new Float32Array([
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 6.0, 0.0, 0.0, 0.0, 12.0, 0.0, 0.0, 0.0, 18.0, 0.0, 0.0, 0.0, 24.0, 0.0, 0.0, 0.0,
            30.0, 0.0, 0.0, 0.0, 36.0, 0.0, 0.0, 0.0, 42.0, 0.0, 0.0, 0.0, 48.0, 0.0, 0.0, 0.0, 54.0, 0.0,
            0.0, 0.0, 60.0, 0.0, 0.0, 0.0, 66.0, 0.0, 0.0, 0.0, 72.0, 0.0, 0.0, 0.0, 78.0, 0.0, 0.0, 0.0,
            85.0, 0.0, 0.0, 0.0, 91.0, 0.0, 0.0, 0.0, 97.0, 0.0, 0.0, 0.0, 103.0, 0.0, 0.0, 0.0, 109.0,
            0.0, 0.0, 0.0, 115.0, 0.0, 0.0, 0.0, 121.0, 0.0, 0.0, 0.0, 127.0, 0.0, 0.0, 0.0, 133.0, 0.0,
            0.0, 0.0, 139.0, 0.0, 0.0, 0.0, 145.0, 0.0, 0.0, 0.0, 151.0, 0.0, 0.0, 0.0, 157.0, 0.0, 0.0,
            0.0, 163.0, 0.0, 0.0, 0.0, 170.0, 0.0, 0.0, 0.0, 176.0, 0.0, 0.0, 0.0, 182.0, 0.0, 0.0, 0.0,
            188.0, 0.0, 0.0, 0.0, 194.0, 0.0, 0.0, 0.0, 200.0, 0.0, 0.0, 0.0, 206.0, 0.0, 0.0, 0.0, 212.0,
            0.0, 0.0, 0.0, 218.0, 0.0, 0.0, 0.0, 224.0, 0.0, 0.0, 0.0, 230.0, 0.0, 0.0, 0.0, 236.0, 0.0,
            0.0, 0.0, 242.0, 0.0, 0.0, 0.0, 248.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 251.0, 0.0, 0.0,
            0.0, 247.0, 0.0, 0.0, 0.0, 244.0, 0.0, 0.0, 0.0, 240.0, 0.0, 0.0, 0.0, 236.0, 0.0, 0.0, 0.0,
            233.0, 0.0, 0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 226.0, 0.0, 0.0, 0.0, 222.0, 0.0, 0.0, 0.0, 218.0,
            0.0, 0.0, 0.0, 215.0, 0.0, 0.0, 0.0, 211.0, 0.0, 0.0, 0.0, 208.0, 0.0, 0.0, 0.0, 204.0, 0.0,
            0.0, 0.0, 200.0, 0.0, 0.0, 0.0, 197.0, 0.0, 0.0, 0.0, 193.0, 0.0, 0.0, 0.0, 190.0, 0.0, 0.0,
            0.0, 186.0, 0.0, 0.0, 0.0, 182.0, 0.0, 0.0, 0.0, 179.0, 0.0, 0.0, 0.0, 175.0, 0.0, 0.0, 0.0,
            172.0, 0.0, 0.0, 0.0, 168.0, 0.0, 0.0, 0.0, 164.0, 0.0, 0.0, 0.0, 161.0, 0.0, 0.0, 0.0, 157.0,
            0.0, 0.0, 0.0, 154.0, 0.0, 0.0, 0.0, 150.0, 0.0, 0.0, 0.0, 146.0, 0.0, 0.0, 0.0, 143.0, 0.0,
            0.0, 0.0, 139.0, 0.0, 0.0, 0.0, 136.0, 0.0, 0.0, 0.0, 132.0, 0.0, 0.0, 0.0, 128.0, 0.0, 0.0,
            0.0, 125.0, 0.0, 0.0, 0.0, 121.0, 0.0, 0.0, 0.0, 118.0, 0.0, 0.0, 0.0, 114.0, 0.0, 0.0, 0.0,
            110.0, 0.0, 0.0, 0.0, 107.0, 0.0, 0.0, 0.0, 103.0, 0.0, 0.0, 0.0, 100.0, 0.0, 0.0, 0.0
        ]),
        g: new Float32Array([
            0.0, 0.0, 0.0, 0.0, 2.0, 0.0, 0.0, 0.0, 5.0, 0.0, 0.0, 0.0, 8.0, 0.0, 0.0, 0.0, 10.0, 0.0,
            0.0, 0.0, 13.0, 0.0, 0.0, 0.0, 16.0, 0.0, 0.0, 0.0, 18.0, 0.0, 0.0, 0.0, 21.0, 0.0, 0.0, 0.0,
            24.0, 0.0, 0.0, 0.0, 26.0, 0.0, 0.0, 0.0, 29.0, 0.0, 0.0, 0.0, 32.0, 0.0, 0.0, 0.0, 34.0, 0.0,
            0.0, 0.0, 37.0, 0.0, 0.0, 0.0, 40.0, 0.0, 0.0, 0.0, 42.0, 0.0, 0.0, 0.0, 45.0, 0.0, 0.0, 0.0,
            48.0, 0.0, 0.0, 0.0, 50.0, 0.0, 0.0, 0.0, 53.0, 0.0, 0.0, 0.0, 56.0, 0.0, 0.0, 0.0, 58.0, 0.0,
            0.0, 0.0, 61.0, 0.0, 0.0, 0.0, 64.0, 0.0, 0.0, 0.0, 66.0, 0.0, 0.0, 0.0, 69.0, 0.0, 0.0, 0.0,
            72.0, 0.0, 0.0, 0.0, 74.0, 0.0, 0.0, 0.0, 77.0, 0.0, 0.0, 0.0, 80.0, 0.0, 0.0, 0.0, 82.0, 0.0,
            0.0, 0.0, 85.0, 0.0, 0.0, 0.0, 88.0, 0.0, 0.0, 0.0, 90.0, 0.0, 0.0, 0.0, 93.0, 0.0, 0.0, 0.0,
            96.0, 0.0, 0.0, 0.0, 98.0, 0.0, 0.0, 0.0, 101.0, 0.0, 0.0, 0.0, 104.0, 0.0, 0.0, 0.0, 106.0,
            0.0, 0.0, 0.0, 109.0, 0.0, 0.0, 0.0, 112.0, 0.0, 0.0, 0.0, 114.0, 0.0, 0.0, 0.0, 117.0, 0.0,
            0.0, 0.0, 119.0, 0.0, 0.0, 0.0, 122.0, 0.0, 0.0, 0.0, 124.0, 0.0, 0.0, 0.0, 127.0, 0.0, 0.0,
            0.0, 129.0, 0.0, 0.0, 0.0, 132.0, 0.0, 0.0, 0.0, 134.0, 0.0, 0.0, 0.0, 137.0, 0.0, 0.0, 0.0,
            139.0, 0.0, 0.0, 0.0, 142.0, 0.0, 0.0, 0.0, 144.0, 0.0, 0.0, 0.0, 147.0, 0.0, 0.0, 0.0, 150.0,
            0.0, 0.0, 0.0, 152.0, 0.0, 0.0, 0.0, 155.0, 0.0, 0.0, 0.0, 157.0, 0.0, 0.0, 0.0, 160.0, 0.0,
            0.0, 0.0, 162.0, 0.0, 0.0, 0.0, 165.0, 0.0, 0.0, 0.0, 167.0, 0.0, 0.0, 0.0, 170.0, 0.0, 0.0,
            0.0, 172.0, 0.0, 0.0, 0.0, 175.0, 0.0, 0.0, 0.0, 177.0, 0.0, 0.0, 0.0, 180.0, 0.0, 0.0, 0.0,
            182.0, 0.0, 0.0, 0.0, 185.0, 0.0, 0.0, 0.0, 188.0, 0.0, 0.0, 0.0, 190.0, 0.0, 0.0, 0.0, 193.0,
            0.0, 0.0, 0.0, 195.0, 0.0, 0.0, 0.0, 198.0, 0.0, 0.0, 0.0, 200.0, 0.0, 0.0, 0.0, 203.0, 0.0,
            0.0, 0.0, 205.0, 0.0, 0.0, 0.0, 208.0, 0.0, 0.0, 0.0, 210.0, 0.0, 0.0, 0.0, 213.0, 0.0, 0.0,
            0.0, 215.0, 0.0, 0.0, 0.0, 218.0, 0.0, 0.0, 0.0, 221.0, 0.0, 0.0, 0.0, 221.0, 0.0, 0.0, 0.0,
            221.0, 0.0, 0.0, 0.0, 222.0, 0.0, 0.0, 0.0, 222.0, 0.0, 0.0, 0.0, 222.0, 0.0, 0.0, 0.0, 223.0,
            0.0, 0.0, 0.0, 223.0, 0.0, 0.0, 0.0, 224.0, 0.0, 0.0, 0.0, 224.0, 0.0, 0.0, 0.0, 224.0, 0.0,
            0.0, 0.0, 225.0, 0.0, 0.0, 0.0, 225.0, 0.0, 0.0, 0.0, 225.0, 0.0, 0.0, 0.0, 226.0, 0.0, 0.0,
            0.0, 226.0, 0.0, 0.0, 0.0, 227.0, 0.0, 0.0, 0.0, 227.0, 0.0, 0.0, 0.0, 227.0, 0.0, 0.0, 0.0,
            228.0, 0.0, 0.0, 0.0, 228.0, 0.0, 0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 229.0,
            0.0, 0.0, 0.0, 230.0, 0.0, 0.0, 0.0, 230.0, 0.0, 0.0, 0.0, 230.0, 0.0, 0.0, 0.0, 231.0, 0.0,
            0.0, 0.0, 231.0, 0.0, 0.0, 0.0, 232.0, 0.0, 0.0, 0.0, 232.0, 0.0, 0.0, 0.0, 232.0, 0.0, 0.0,
            0.0, 233.0, 0.0, 0.0, 0.0, 233.0, 0.0, 0.0, 0.0, 233.0, 0.0, 0.0, 0.0, 234.0, 0.0, 0.0, 0.0,
            234.0, 0.0, 0.0, 0.0, 235.0, 0.0, 0.0, 0.0, 235.0, 0.0, 0.0, 0.0, 235.0, 0.0, 0.0, 0.0, 236.0,
            0.0, 0.0, 0.0, 236.0, 0.0, 0.0, 0.0, 237.0, 0.0, 0.0, 0.0, 235.0, 0.0, 0.0, 0.0, 234.0, 0.0,
            0.0, 0.0, 233.0, 0.0, 0.0, 0.0, 231.0, 0.0, 0.0, 0.0, 230.0, 0.0, 0.0, 0.0, 229.0, 0.0, 0.0,
            0.0, 227.0, 0.0, 0.0, 0.0, 226.0, 0.0, 0.0, 0.0, 225.0, 0.0, 0.0, 0.0, 223.0, 0.0, 0.0, 0.0,
            222.0, 0.0, 0.0, 0.0, 221.0, 0.0, 0.0, 0.0, 219.0, 0.0, 0.0, 0.0, 218.0, 0.0, 0.0, 0.0, 217.0,
            0.0, 0.0, 0.0, 215.0, 0.0, 0.0, 0.0, 214.0, 0.0, 0.0, 0.0, 213.0, 0.0, 0.0, 0.0, 211.0, 0.0,
            0.0, 0.0, 210.0, 0.0, 0.0, 0.0, 209.0, 0.0, 0.0, 0.0, 207.0, 0.0, 0.0, 0.0, 206.0, 0.0, 0.0,
            0.0, 205.0, 0.0, 0.0, 0.0, 203.0, 0.0, 0.0, 0.0, 202.0, 0.0, 0.0, 0.0, 201.0, 0.0, 0.0, 0.0,
            199.0, 0.0, 0.0, 0.0, 198.0, 0.0, 0.0, 0.0, 197.0, 0.0, 0.0, 0.0, 195.0, 0.0, 0.0, 0.0, 194.0,
            0.0, 0.0, 0.0, 193.0, 0.0, 0.0, 0.0, 191.0, 0.0, 0.0, 0.0, 190.0, 0.0, 0.0, 0.0, 189.0, 0.0,
            0.0, 0.0, 187.0, 0.0, 0.0, 0.0, 186.0, 0.0, 0.0, 0.0, 185.0, 0.0, 0.0, 0.0, 183.0, 0.0, 0.0,
            0.0, 182.0, 0.0, 0.0, 0.0, 181.0, 0.0, 0.0, 0.0, 180.0, 0.0, 0.0, 0.0, 177.0, 0.0, 0.0, 0.0,
            175.0, 0.0, 0.0, 0.0, 172.0, 0.0, 0.0, 0.0, 170.0, 0.0, 0.0, 0.0, 167.0, 0.0, 0.0, 0.0, 165.0,
            0.0, 0.0, 0.0, 162.0, 0.0, 0.0, 0.0, 160.0, 0.0, 0.0, 0.0, 157.0, 0.0, 0.0, 0.0, 155.0, 0.0,
            0.0, 0.0, 152.0, 0.0, 0.0, 0.0, 150.0, 0.0, 0.0, 0.0, 147.0, 0.0, 0.0, 0.0, 145.0, 0.0, 0.0,
            0.0, 142.0, 0.0, 0.0, 0.0, 140.0, 0.0, 0.0, 0.0, 137.0, 0.0, 0.0, 0.0, 135.0, 0.0, 0.0, 0.0,
            132.0, 0.0, 0.0, 0.0, 130.0, 0.0, 0.0, 0.0, 127.0, 0.0, 0.0, 0.0, 125.0, 0.0, 0.0, 0.0, 122.0,
            0.0, 0.0, 0.0, 120.0, 0.0, 0.0, 0.0, 117.0, 0.0, 0.0, 0.0, 115.0, 0.0, 0.0, 0.0, 112.0, 0.0,
            0.0, 0.0, 110.0, 0.0, 0.0, 0.0, 107.0, 0.0, 0.0, 0.0, 105.0, 0.0, 0.0, 0.0, 102.0, 0.0, 0.0,
            0.0, 100.0, 0.0, 0.0, 0.0, 97.0, 0.0, 0.0, 0.0, 95.0, 0.0, 0.0, 0.0, 92.0, 0.0, 0.0, 0.0,
            90.0, 0.0, 0.0, 0.0, 87.0, 0.0, 0.0, 0.0, 85.0, 0.0, 0.0, 0.0, 82.0, 0.0, 0.0, 0.0, 80.0, 0.0,
            0.0, 0.0, 77.0, 0.0, 0.0, 0.0, 75.0, 0.0, 0.0, 0.0, 73.0, 0.0, 0.0, 0.0, 71.0, 0.0, 0.0, 0.0,
            69.0, 0.0, 0.0, 0.0, 68.0, 0.0, 0.0, 0.0, 66.0, 0.0, 0.0, 0.0, 64.0, 0.0, 0.0, 0.0, 62.0, 0.0,
            0.0, 0.0, 61.0, 0.0, 0.0, 0.0, 59.0, 0.0, 0.0, 0.0, 57.0, 0.0, 0.0, 0.0, 55.0, 0.0, 0.0, 0.0,
            54.0, 0.0, 0.0, 0.0, 52.0, 0.0, 0.0, 0.0, 50.0, 0.0, 0.0, 0.0, 48.0, 0.0, 0.0, 0.0, 47.0, 0.0,
            0.0, 0.0, 45.0, 0.0, 0.0, 0.0, 43.0, 0.0, 0.0, 0.0, 41.0, 0.0, 0.0, 0.0, 40.0, 0.0, 0.0, 0.0,
            38.0, 0.0, 0.0, 0.0, 36.0, 0.0, 0.0, 0.0, 34.0, 0.0, 0.0, 0.0, 33.0, 0.0, 0.0, 0.0, 31.0, 0.0,
            0.0, 0.0, 29.0, 0.0, 0.0, 0.0, 27.0, 0.0, 0.0, 0.0, 26.0, 0.0, 0.0, 0.0, 24.0, 0.0, 0.0, 0.0,
            22.0, 0.0, 0.0, 0.0, 20.0, 0.0, 0.0, 0.0, 19.0, 0.0, 0.0, 0.0, 17.0, 0.0, 0.0, 0.0, 15.0, 0.0,
            0.0, 0.0, 13.0, 0.0, 0.0, 0.0, 12.0, 0.0, 0.0, 0.0, 10.0, 0.0, 0.0, 0.0, 8.0, 0.0, 0.0, 0.0,
            6.0, 0.0, 0.0, 0.0, 5.0, 0.0, 0.0, 0.0, 3.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0
        ]),
        b: new Float32Array([
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 254.0, 0.0, 0.0, 0.0, 253.0, 0.0, 0.0, 0.0, 252.0, 0.0, 0.0, 0.0, 251.0,
            0.0, 0.0, 0.0, 250.0, 0.0, 0.0, 0.0, 249.0, 0.0, 0.0, 0.0, 248.0, 0.0, 0.0, 0.0, 247.0, 0.0,
            0.0, 0.0, 246.0, 0.0, 0.0, 0.0, 245.0, 0.0, 0.0, 0.0, 245.0, 0.0, 0.0, 0.0, 244.0, 0.0, 0.0,
            0.0, 243.0, 0.0, 0.0, 0.0, 242.0, 0.0, 0.0, 0.0, 241.0, 0.0, 0.0, 0.0, 240.0, 0.0, 0.0, 0.0,
            239.0, 0.0, 0.0, 0.0, 238.0, 0.0, 0.0, 0.0, 237.0, 0.0, 0.0, 0.0, 236.0, 0.0, 0.0, 0.0, 236.0,
            0.0, 0.0, 0.0, 235.0, 0.0, 0.0, 0.0, 234.0, 0.0, 0.0, 0.0, 233.0, 0.0, 0.0, 0.0, 232.0, 0.0,
            0.0, 0.0, 231.0, 0.0, 0.0, 0.0, 230.0, 0.0, 0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 228.0, 0.0, 0.0,
            0.0, 227.0, 0.0, 0.0, 0.0, 226.0, 0.0, 0.0, 0.0, 226.0, 0.0, 0.0, 0.0, 225.0, 0.0, 0.0, 0.0,
            224.0, 0.0, 0.0, 0.0, 223.0, 0.0, 0.0, 0.0, 222.0, 0.0, 0.0, 0.0, 221.0, 0.0, 0.0, 0.0, 220.0,
            0.0, 0.0, 0.0, 219.0, 0.0, 0.0, 0.0, 218.0, 0.0, 0.0, 0.0, 217.0, 0.0, 0.0, 0.0, 217.0, 0.0,
            0.0, 0.0, 211.0, 0.0, 0.0, 0.0, 206.0, 0.0, 0.0, 0.0, 201.0, 0.0, 0.0, 0.0, 196.0, 0.0, 0.0,
            0.0, 191.0, 0.0, 0.0, 0.0, 186.0, 0.0, 0.0, 0.0, 181.0, 0.0, 0.0, 0.0, 176.0, 0.0, 0.0, 0.0,
            171.0, 0.0, 0.0, 0.0, 166.0, 0.0, 0.0, 0.0, 161.0, 0.0, 0.0, 0.0, 156.0, 0.0, 0.0, 0.0, 151.0,
            0.0, 0.0, 0.0, 146.0, 0.0, 0.0, 0.0, 141.0, 0.0, 0.0, 0.0, 136.0, 0.0, 0.0, 0.0, 131.0, 0.0,
            0.0, 0.0, 126.0, 0.0, 0.0, 0.0, 121.0, 0.0, 0.0, 0.0, 116.0, 0.0, 0.0, 0.0, 111.0, 0.0, 0.0,
            0.0, 105.0, 0.0, 0.0, 0.0, 100.0, 0.0, 0.0, 0.0, 95.0, 0.0, 0.0, 0.0, 90.0, 0.0, 0.0, 0.0,
            85.0, 0.0, 0.0, 0.0, 80.0, 0.0, 0.0, 0.0, 75.0, 0.0, 0.0, 0.0, 70.0, 0.0, 0.0, 0.0, 65.0, 0.0,
            0.0, 0.0, 60.0, 0.0, 0.0, 0.0, 55.0, 0.0, 0.0, 0.0, 50.0, 0.0, 0.0, 0.0, 45.0, 0.0, 0.0, 0.0,
            40.0, 0.0, 0.0, 0.0, 35.0, 0.0, 0.0, 0.0, 30.0, 0.0, 0.0, 0.0, 25.0, 0.0, 0.0, 0.0, 20.0, 0.0,
            0.0, 0.0, 15.0, 0.0, 0.0, 0.0, 10.0, 0.0, 0.0, 0.0, 5.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0
        ])
    };
    CUBEHELIX = {
        r: new Float32Array([
            0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 3.0, 0.0, 0.0, 0.0, 4.0, 0.0, 0.0, 0.0, 6.0, 0.0, 0.0,
            0.0, 8.0, 0.0, 0.0, 0.0, 9.0, 0.0, 0.0, 0.0, 10.0, 0.0, 0.0, 0.0, 12.0, 0.0, 0.0, 0.0, 13.0,
            0.0, 0.0, 0.0, 14.0, 0.0, 0.0, 0.0, 15.0, 0.0, 0.0, 0.0, 17.0, 0.0, 0.0, 0.0, 18.0, 0.0, 0.0,
            0.0, 19.0, 0.0, 0.0, 0.0, 20.0, 0.0, 0.0, 0.0, 20.0, 0.0, 0.0, 0.0, 21.0, 0.0, 0.0, 0.0, 22.0,
            0.0, 0.0, 0.0, 23.0, 0.0, 0.0, 0.0, 23.0, 0.0, 0.0, 0.0, 24.0, 0.0, 0.0, 0.0, 24.0, 0.0, 0.0,
            0.0, 25.0, 0.0, 0.0, 0.0, 25.0, 0.0, 0.0, 0.0, 25.0, 0.0, 0.0, 0.0, 26.0, 0.0, 0.0, 0.0, 26.0,
            0.0, 0.0, 0.0, 26.0, 0.0, 0.0, 0.0, 26.0, 0.0, 0.0, 0.0, 26.0, 0.0, 0.0, 0.0, 26.0, 0.0, 0.0,
            0.0, 26.0, 0.0, 0.0, 0.0, 26.0, 0.0, 0.0, 0.0, 26.0, 0.0, 0.0, 0.0, 26.0, 0.0, 0.0, 0.0, 26.0,
            0.0, 0.0, 0.0, 25.0, 0.0, 0.0, 0.0, 25.0, 0.0, 0.0, 0.0, 25.0, 0.0, 0.0, 0.0, 25.0, 0.0, 0.0,
            0.0, 24.0, 0.0, 0.0, 0.0, 24.0, 0.0, 0.0, 0.0, 24.0, 0.0, 0.0, 0.0, 23.0, 0.0, 0.0, 0.0, 23.0,
            0.0, 0.0, 0.0, 23.0, 0.0, 0.0, 0.0, 23.0, 0.0, 0.0, 0.0, 22.0, 0.0, 0.0, 0.0, 22.0, 0.0, 0.0,
            0.0, 22.0, 0.0, 0.0, 0.0, 21.0, 0.0, 0.0, 0.0, 21.0, 0.0, 0.0, 0.0, 21.0, 0.0, 0.0, 0.0, 21.0,
            0.0, 0.0, 0.0, 21.0, 0.0, 0.0, 0.0, 21.0, 0.0, 0.0, 0.0, 20.0, 0.0, 0.0, 0.0, 20.0, 0.0, 0.0,
            0.0, 20.0, 0.0, 0.0, 0.0, 21.0, 0.0, 0.0, 0.0, 21.0, 0.0, 0.0, 0.0, 21.0, 0.0, 0.0, 0.0, 21.0,
            0.0, 0.0, 0.0, 21.0, 0.0, 0.0, 0.0, 22.0, 0.0, 0.0, 0.0, 22.0, 0.0, 0.0, 0.0, 22.0, 0.0, 0.0,
            0.0, 23.0, 0.0, 0.0, 0.0, 23.0, 0.0, 0.0, 0.0, 24.0, 0.0, 0.0, 0.0, 25.0, 0.0, 0.0, 0.0, 26.0,
            0.0, 0.0, 0.0, 27.0, 0.0, 0.0, 0.0, 27.0, 0.0, 0.0, 0.0, 28.0, 0.0, 0.0, 0.0, 30.0, 0.0, 0.0,
            0.0, 31.0, 0.0, 0.0, 0.0, 32.0, 0.0, 0.0, 0.0, 33.0, 0.0, 0.0, 0.0, 35.0, 0.0, 0.0, 0.0, 36.0,
            0.0, 0.0, 0.0, 38.0, 0.0, 0.0, 0.0, 39.0, 0.0, 0.0, 0.0, 41.0, 0.0, 0.0, 0.0, 43.0, 0.0, 0.0,
            0.0, 45.0, 0.0, 0.0, 0.0, 47.0, 0.0, 0.0, 0.0, 49.0, 0.0, 0.0, 0.0, 51.0, 0.0, 0.0, 0.0, 53.0,
            0.0, 0.0, 0.0, 55.0, 0.0, 0.0, 0.0, 57.0, 0.0, 0.0, 0.0, 60.0, 0.0, 0.0, 0.0, 62.0, 0.0, 0.0,
            0.0, 65.0, 0.0, 0.0, 0.0, 67.0, 0.0, 0.0, 0.0, 70.0, 0.0, 0.0, 0.0, 72.0, 0.0, 0.0, 0.0, 75.0,
            0.0, 0.0, 0.0, 78.0, 0.0, 0.0, 0.0, 81.0, 0.0, 0.0, 0.0, 83.0, 0.0, 0.0, 0.0, 86.0, 0.0, 0.0,
            0.0, 89.0, 0.0, 0.0, 0.0, 92.0, 0.0, 0.0, 0.0, 95.0, 0.0, 0.0, 0.0, 98.0, 0.0, 0.0, 0.0,
            101.0, 0.0, 0.0, 0.0, 104.0, 0.0, 0.0, 0.0, 107.0, 0.0, 0.0, 0.0, 110.0, 0.0, 0.0, 0.0, 113.0,
            0.0, 0.0, 0.0, 116.0, 0.0, 0.0, 0.0, 120.0, 0.0, 0.0, 0.0, 123.0, 0.0, 0.0, 0.0, 126.0, 0.0,
            0.0, 0.0, 129.0, 0.0, 0.0, 0.0, 132.0, 0.0, 0.0, 0.0, 135.0, 0.0, 0.0, 0.0, 138.0, 0.0, 0.0,
            0.0, 141.0, 0.0, 0.0, 0.0, 144.0, 0.0, 0.0, 0.0, 147.0, 0.0, 0.0, 0.0, 150.0, 0.0, 0.0, 0.0,
            153.0, 0.0, 0.0, 0.0, 155.0, 0.0, 0.0, 0.0, 158.0, 0.0, 0.0, 0.0, 161.0, 0.0, 0.0, 0.0, 164.0,
            0.0, 0.0, 0.0, 166.0, 0.0, 0.0, 0.0, 169.0, 0.0, 0.0, 0.0, 171.0, 0.0, 0.0, 0.0, 174.0, 0.0,
            0.0, 0.0, 176.0, 0.0, 0.0, 0.0, 178.0, 0.0, 0.0, 0.0, 181.0, 0.0, 0.0, 0.0, 183.0, 0.0, 0.0,
            0.0, 185.0, 0.0, 0.0, 0.0, 187.0, 0.0, 0.0, 0.0, 189.0, 0.0, 0.0, 0.0, 191.0, 0.0, 0.0, 0.0,
            193.0, 0.0, 0.0, 0.0, 194.0, 0.0, 0.0, 0.0, 196.0, 0.0, 0.0, 0.0, 198.0, 0.0, 0.0, 0.0, 199.0,
            0.0, 0.0, 0.0, 201.0, 0.0, 0.0, 0.0, 202.0, 0.0, 0.0, 0.0, 203.0, 0.0, 0.0, 0.0, 204.0, 0.0,
            0.0, 0.0, 205.0, 0.0, 0.0, 0.0, 206.0, 0.0, 0.0, 0.0, 207.0, 0.0, 0.0, 0.0, 208.0, 0.0, 0.0,
            0.0, 209.0, 0.0, 0.0, 0.0, 209.0, 0.0, 0.0, 0.0, 210.0, 0.0, 0.0, 0.0, 211.0, 0.0, 0.0, 0.0,
            211.0, 0.0, 0.0, 0.0, 211.0, 0.0, 0.0, 0.0, 212.0, 0.0, 0.0, 0.0, 212.0, 0.0, 0.0, 0.0, 212.0,
            0.0, 0.0, 0.0, 212.0, 0.0, 0.0, 0.0, 212.0, 0.0, 0.0, 0.0, 212.0, 0.0, 0.0, 0.0, 212.0, 0.0,
            0.0, 0.0, 212.0, 0.0, 0.0, 0.0, 211.0, 0.0, 0.0, 0.0, 211.0, 0.0, 0.0, 0.0, 211.0, 0.0, 0.0,
            0.0, 210.0, 0.0, 0.0, 0.0, 210.0, 0.0, 0.0, 0.0, 210.0, 0.0, 0.0, 0.0, 209.0, 0.0, 0.0, 0.0,
            208.0, 0.0, 0.0, 0.0, 208.0, 0.0, 0.0, 0.0, 207.0, 0.0, 0.0, 0.0, 207.0, 0.0, 0.0, 0.0, 206.0,
            0.0, 0.0, 0.0, 205.0, 0.0, 0.0, 0.0, 205.0, 0.0, 0.0, 0.0, 204.0, 0.0, 0.0, 0.0, 203.0, 0.0,
            0.0, 0.0, 203.0, 0.0, 0.0, 0.0, 202.0, 0.0, 0.0, 0.0, 201.0, 0.0, 0.0, 0.0, 201.0, 0.0, 0.0,
            0.0, 200.0, 0.0, 0.0, 0.0, 199.0, 0.0, 0.0, 0.0, 199.0, 0.0, 0.0, 0.0, 198.0, 0.0, 0.0, 0.0,
            197.0, 0.0, 0.0, 0.0, 197.0, 0.0, 0.0, 0.0, 196.0, 0.0, 0.0, 0.0, 196.0, 0.0, 0.0, 0.0, 195.0,
            0.0, 0.0, 0.0, 195.0, 0.0, 0.0, 0.0, 194.0, 0.0, 0.0, 0.0, 194.0, 0.0, 0.0, 0.0, 194.0, 0.0,
            0.0, 0.0, 193.0, 0.0, 0.0, 0.0, 193.0, 0.0, 0.0, 0.0, 193.0, 0.0, 0.0, 0.0, 193.0, 0.0, 0.0,
            0.0, 193.0, 0.0, 0.0, 0.0, 193.0, 0.0, 0.0, 0.0, 193.0, 0.0, 0.0, 0.0, 193.0, 0.0, 0.0, 0.0,
            193.0, 0.0, 0.0, 0.0, 193.0, 0.0, 0.0, 0.0, 194.0, 0.0, 0.0, 0.0, 194.0, 0.0, 0.0, 0.0, 195.0,
            0.0, 0.0, 0.0, 195.0, 0.0, 0.0, 0.0, 196.0, 0.0, 0.0, 0.0, 196.0, 0.0, 0.0, 0.0, 197.0, 0.0,
            0.0, 0.0, 198.0, 0.0, 0.0, 0.0, 199.0, 0.0, 0.0, 0.0, 200.0, 0.0, 0.0, 0.0, 200.0, 0.0, 0.0,
            0.0, 202.0, 0.0, 0.0, 0.0, 203.0, 0.0, 0.0, 0.0, 204.0, 0.0, 0.0, 0.0, 205.0, 0.0, 0.0, 0.0,
            206.0, 0.0, 0.0, 0.0, 208.0, 0.0, 0.0, 0.0, 209.0, 0.0, 0.0, 0.0, 210.0, 0.0, 0.0, 0.0, 212.0,
            0.0, 0.0, 0.0, 213.0, 0.0, 0.0, 0.0, 215.0, 0.0, 0.0, 0.0, 217.0, 0.0, 0.0, 0.0, 218.0, 0.0,
            0.0, 0.0, 220.0, 0.0, 0.0, 0.0, 222.0, 0.0, 0.0, 0.0, 223.0, 0.0, 0.0, 0.0, 225.0, 0.0, 0.0,
            0.0, 227.0, 0.0, 0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 231.0, 0.0, 0.0, 0.0, 232.0, 0.0, 0.0, 0.0,
            234.0, 0.0, 0.0, 0.0, 236.0, 0.0, 0.0, 0.0, 238.0, 0.0, 0.0, 0.0, 240.0, 0.0, 0.0, 0.0, 242.0,
            0.0, 0.0, 0.0, 244.0, 0.0, 0.0, 0.0, 245.0, 0.0, 0.0, 0.0, 247.0, 0.0, 0.0, 0.0, 249.0, 0.0,
            0.0, 0.0, 251.0, 0.0, 0.0, 0.0, 253.0, 0.0, 0.0, 0.0, 255.0
        ]),
        g: new Float32Array([
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 2.0, 0.0, 0.0,
            0.0, 2.0, 0.0, 0.0, 0.0, 3.0, 0.0, 0.0, 0.0, 4.0, 0.0, 0.0, 0.0, 4.0, 0.0, 0.0, 0.0, 5.0, 0.0,
            0.0, 0.0, 6.0, 0.0, 0.0, 0.0, 6.0, 0.0, 0.0, 0.0, 7.0, 0.0, 0.0, 0.0, 8.0, 0.0, 0.0, 0.0, 9.0,
            0.0, 0.0, 0.0, 10.0, 0.0, 0.0, 0.0, 11.0, 0.0, 0.0, 0.0, 11.0, 0.0, 0.0, 0.0, 12.0, 0.0, 0.0,
            0.0, 13.0, 0.0, 0.0, 0.0, 14.0, 0.0, 0.0, 0.0, 15.0, 0.0, 0.0, 0.0, 17.0, 0.0, 0.0, 0.0, 18.0,
            0.0, 0.0, 0.0, 19.0, 0.0, 0.0, 0.0, 20.0, 0.0, 0.0, 0.0, 21.0, 0.0, 0.0, 0.0, 22.0, 0.0, 0.0,
            0.0, 24.0, 0.0, 0.0, 0.0, 25.0, 0.0, 0.0, 0.0, 26.0, 0.0, 0.0, 0.0, 28.0, 0.0, 0.0, 0.0, 29.0,
            0.0, 0.0, 0.0, 31.0, 0.0, 0.0, 0.0, 32.0, 0.0, 0.0, 0.0, 34.0, 0.0, 0.0, 0.0, 35.0, 0.0, 0.0,
            0.0, 37.0, 0.0, 0.0, 0.0, 38.0, 0.0, 0.0, 0.0, 40.0, 0.0, 0.0, 0.0, 41.0, 0.0, 0.0, 0.0, 43.0,
            0.0, 0.0, 0.0, 45.0, 0.0, 0.0, 0.0, 46.0, 0.0, 0.0, 0.0, 48.0, 0.0, 0.0, 0.0, 50.0, 0.0, 0.0,
            0.0, 52.0, 0.0, 0.0, 0.0, 53.0, 0.0, 0.0, 0.0, 55.0, 0.0, 0.0, 0.0, 57.0, 0.0, 0.0, 0.0, 58.0,
            0.0, 0.0, 0.0, 60.0, 0.0, 0.0, 0.0, 62.0, 0.0, 0.0, 0.0, 64.0, 0.0, 0.0, 0.0, 66.0, 0.0, 0.0,
            0.0, 67.0, 0.0, 0.0, 0.0, 69.0, 0.0, 0.0, 0.0, 71.0, 0.0, 0.0, 0.0, 73.0, 0.0, 0.0, 0.0, 74.0,
            0.0, 0.0, 0.0, 76.0, 0.0, 0.0, 0.0, 78.0, 0.0, 0.0, 0.0, 79.0, 0.0, 0.0, 0.0, 81.0, 0.0, 0.0,
            0.0, 83.0, 0.0, 0.0, 0.0, 84.0, 0.0, 0.0, 0.0, 86.0, 0.0, 0.0, 0.0, 88.0, 0.0, 0.0, 0.0, 89.0,
            0.0, 0.0, 0.0, 91.0, 0.0, 0.0, 0.0, 92.0, 0.0, 0.0, 0.0, 94.0, 0.0, 0.0, 0.0, 95.0, 0.0, 0.0,
            0.0, 97.0, 0.0, 0.0, 0.0, 98.0, 0.0, 0.0, 0.0, 99.0, 0.0, 0.0, 0.0, 101.0, 0.0, 0.0, 0.0,
            102.0, 0.0, 0.0, 0.0, 103.0, 0.0, 0.0, 0.0, 104.0, 0.0, 0.0, 0.0, 106.0, 0.0, 0.0, 0.0, 107.0,
            0.0, 0.0, 0.0, 108.0, 0.0, 0.0, 0.0, 109.0, 0.0, 0.0, 0.0, 110.0, 0.0, 0.0, 0.0, 111.0, 0.0,
            0.0, 0.0, 112.0, 0.0, 0.0, 0.0, 113.0, 0.0, 0.0, 0.0, 114.0, 0.0, 0.0, 0.0, 114.0, 0.0, 0.0,
            0.0, 115.0, 0.0, 0.0, 0.0, 116.0, 0.0, 0.0, 0.0, 116.0, 0.0, 0.0, 0.0, 117.0, 0.0, 0.0, 0.0,
            118.0, 0.0, 0.0, 0.0, 118.0, 0.0, 0.0, 0.0, 119.0, 0.0, 0.0, 0.0, 119.0, 0.0, 0.0, 0.0, 120.0,
            0.0, 0.0, 0.0, 120.0, 0.0, 0.0, 0.0, 120.0, 0.0, 0.0, 0.0, 121.0, 0.0, 0.0, 0.0, 121.0, 0.0,
            0.0, 0.0, 121.0, 0.0, 0.0, 0.0, 121.0, 0.0, 0.0, 0.0, 122.0, 0.0, 0.0, 0.0, 122.0, 0.0, 0.0,
            0.0, 122.0, 0.0, 0.0, 0.0, 122.0, 0.0, 0.0, 0.0, 122.0, 0.0, 0.0, 0.0, 122.0, 0.0, 0.0, 0.0,
            122.0, 0.0, 0.0, 0.0, 122.0, 0.0, 0.0, 0.0, 122.0, 0.0, 0.0, 0.0, 122.0, 0.0, 0.0, 0.0, 122.0,
            0.0, 0.0, 0.0, 122.0, 0.0, 0.0, 0.0, 122.0, 0.0, 0.0, 0.0, 122.0, 0.0, 0.0, 0.0, 122.0, 0.0,
            0.0, 0.0, 121.0, 0.0, 0.0, 0.0, 121.0, 0.0, 0.0, 0.0, 121.0, 0.0, 0.0, 0.0, 121.0, 0.0, 0.0,
            0.0, 121.0, 0.0, 0.0, 0.0, 121.0, 0.0, 0.0, 0.0, 121.0, 0.0, 0.0, 0.0, 121.0, 0.0, 0.0, 0.0,
            121.0, 0.0, 0.0, 0.0, 120.0, 0.0, 0.0, 0.0, 120.0, 0.0, 0.0, 0.0, 120.0, 0.0, 0.0, 0.0, 120.0,
            0.0, 0.0, 0.0, 120.0, 0.0, 0.0, 0.0, 120.0, 0.0, 0.0, 0.0, 120.0, 0.0, 0.0, 0.0, 120.0, 0.0,
            0.0, 0.0, 120.0, 0.0, 0.0, 0.0, 120.0, 0.0, 0.0, 0.0, 121.0, 0.0, 0.0, 0.0, 121.0, 0.0, 0.0,
            0.0, 121.0, 0.0, 0.0, 0.0, 121.0, 0.0, 0.0, 0.0, 121.0, 0.0, 0.0, 0.0, 122.0, 0.0, 0.0, 0.0,
            122.0, 0.0, 0.0, 0.0, 122.0, 0.0, 0.0, 0.0, 123.0, 0.0, 0.0, 0.0, 123.0, 0.0, 0.0, 0.0, 124.0,
            0.0, 0.0, 0.0, 124.0, 0.0, 0.0, 0.0, 125.0, 0.0, 0.0, 0.0, 125.0, 0.0, 0.0, 0.0, 126.0, 0.0,
            0.0, 0.0, 127.0, 0.0, 0.0, 0.0, 127.0, 0.0, 0.0, 0.0, 128.0, 0.0, 0.0, 0.0, 129.0, 0.0, 0.0,
            0.0, 130.0, 0.0, 0.0, 0.0, 131.0, 0.0, 0.0, 0.0, 131.0, 0.0, 0.0, 0.0, 132.0, 0.0, 0.0, 0.0,
            133.0, 0.0, 0.0, 0.0, 135.0, 0.0, 0.0, 0.0, 136.0, 0.0, 0.0, 0.0, 137.0, 0.0, 0.0, 0.0, 138.0,
            0.0, 0.0, 0.0, 139.0, 0.0, 0.0, 0.0, 140.0, 0.0, 0.0, 0.0, 142.0, 0.0, 0.0, 0.0, 143.0, 0.0,
            0.0, 0.0, 144.0, 0.0, 0.0, 0.0, 146.0, 0.0, 0.0, 0.0, 147.0, 0.0, 0.0, 0.0, 149.0, 0.0, 0.0,
            0.0, 150.0, 0.0, 0.0, 0.0, 152.0, 0.0, 0.0, 0.0, 154.0, 0.0, 0.0, 0.0, 155.0, 0.0, 0.0, 0.0,
            157.0, 0.0, 0.0, 0.0, 158.0, 0.0, 0.0, 0.0, 160.0, 0.0, 0.0, 0.0, 162.0, 0.0, 0.0, 0.0, 164.0,
            0.0, 0.0, 0.0, 165.0, 0.0, 0.0, 0.0, 167.0, 0.0, 0.0, 0.0, 169.0, 0.0, 0.0, 0.0, 171.0, 0.0,
            0.0, 0.0, 172.0, 0.0, 0.0, 0.0, 174.0, 0.0, 0.0, 0.0, 176.0, 0.0, 0.0, 0.0, 178.0, 0.0, 0.0,
            0.0, 180.0, 0.0, 0.0, 0.0, 182.0, 0.0, 0.0, 0.0, 183.0, 0.0, 0.0, 0.0, 185.0, 0.0, 0.0, 0.0,
            187.0, 0.0, 0.0, 0.0, 189.0, 0.0, 0.0, 0.0, 191.0, 0.0, 0.0, 0.0, 193.0, 0.0, 0.0, 0.0, 194.0,
            0.0, 0.0, 0.0, 196.0, 0.0, 0.0, 0.0, 198.0, 0.0, 0.0, 0.0, 200.0, 0.0, 0.0, 0.0, 202.0, 0.0,
            0.0, 0.0, 203.0, 0.0, 0.0, 0.0, 205.0, 0.0, 0.0, 0.0, 207.0, 0.0, 0.0, 0.0, 208.0, 0.0, 0.0,
            0.0, 210.0, 0.0, 0.0, 0.0, 212.0, 0.0, 0.0, 0.0, 213.0, 0.0, 0.0, 0.0, 215.0, 0.0, 0.0, 0.0,
            216.0, 0.0, 0.0, 0.0, 218.0, 0.0, 0.0, 0.0, 219.0, 0.0, 0.0, 0.0, 221.0, 0.0, 0.0, 0.0, 222.0,
            0.0, 0.0, 0.0, 224.0, 0.0, 0.0, 0.0, 225.0, 0.0, 0.0, 0.0, 226.0, 0.0, 0.0, 0.0, 228.0, 0.0,
            0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 230.0, 0.0, 0.0, 0.0, 231.0, 0.0, 0.0, 0.0, 232.0, 0.0, 0.0,
            0.0, 233.0, 0.0, 0.0, 0.0, 235.0, 0.0, 0.0, 0.0, 236.0, 0.0, 0.0, 0.0, 237.0, 0.0, 0.0, 0.0,
            238.0, 0.0, 0.0, 0.0, 239.0, 0.0, 0.0, 0.0, 240.0, 0.0, 0.0, 0.0, 240.0, 0.0, 0.0, 0.0, 241.0,
            0.0, 0.0, 0.0, 242.0, 0.0, 0.0, 0.0, 243.0, 0.0, 0.0, 0.0, 244.0, 0.0, 0.0, 0.0, 244.0, 0.0,
            0.0, 0.0, 245.0, 0.0, 0.0, 0.0, 246.0, 0.0, 0.0, 0.0, 247.0, 0.0, 0.0, 0.0, 247.0, 0.0, 0.0,
            0.0, 248.0, 0.0, 0.0, 0.0, 248.0, 0.0, 0.0, 0.0, 249.0, 0.0, 0.0, 0.0, 250.0, 0.0, 0.0, 0.0,
            250.0, 0.0, 0.0, 0.0, 251.0, 0.0, 0.0, 0.0, 251.0, 0.0, 0.0, 0.0, 252.0, 0.0, 0.0, 0.0, 252.0,
            0.0, 0.0, 0.0, 253.0, 0.0, 0.0, 0.0, 253.0, 0.0, 0.0, 0.0, 254.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0
        ]),
        b: new Float32Array([
            0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 3.0, 0.0, 0.0, 0.0, 4.0, 0.0, 0.0, 0.0, 6.0, 0.0, 0.0,
            0.0, 8.0, 0.0, 0.0, 0.0, 9.0, 0.0, 0.0, 0.0, 11.0, 0.0, 0.0, 0.0, 13.0, 0.0, 0.0, 0.0, 15.0,
            0.0, 0.0, 0.0, 17.0, 0.0, 0.0, 0.0, 19.0, 0.0, 0.0, 0.0, 21.0, 0.0, 0.0, 0.0, 23.0, 0.0, 0.0,
            0.0, 25.0, 0.0, 0.0, 0.0, 27.0, 0.0, 0.0, 0.0, 29.0, 0.0, 0.0, 0.0, 31.0, 0.0, 0.0, 0.0, 33.0,
            0.0, 0.0, 0.0, 35.0, 0.0, 0.0, 0.0, 37.0, 0.0, 0.0, 0.0, 39.0, 0.0, 0.0, 0.0, 41.0, 0.0, 0.0,
            0.0, 43.0, 0.0, 0.0, 0.0, 45.0, 0.0, 0.0, 0.0, 47.0, 0.0, 0.0, 0.0, 48.0, 0.0, 0.0, 0.0, 50.0,
            0.0, 0.0, 0.0, 52.0, 0.0, 0.0, 0.0, 54.0, 0.0, 0.0, 0.0, 56.0, 0.0, 0.0, 0.0, 57.0, 0.0, 0.0,
            0.0, 59.0, 0.0, 0.0, 0.0, 60.0, 0.0, 0.0, 0.0, 62.0, 0.0, 0.0, 0.0, 63.0, 0.0, 0.0, 0.0, 65.0,
            0.0, 0.0, 0.0, 66.0, 0.0, 0.0, 0.0, 67.0, 0.0, 0.0, 0.0, 69.0, 0.0, 0.0, 0.0, 70.0, 0.0, 0.0,
            0.0, 71.0, 0.0, 0.0, 0.0, 72.0, 0.0, 0.0, 0.0, 73.0, 0.0, 0.0, 0.0, 74.0, 0.0, 0.0, 0.0, 74.0,
            0.0, 0.0, 0.0, 75.0, 0.0, 0.0, 0.0, 76.0, 0.0, 0.0, 0.0, 76.0, 0.0, 0.0, 0.0, 77.0, 0.0, 0.0,
            0.0, 77.0, 0.0, 0.0, 0.0, 77.0, 0.0, 0.0, 0.0, 78.0, 0.0, 0.0, 0.0, 78.0, 0.0, 0.0, 0.0, 78.0,
            0.0, 0.0, 0.0, 78.0, 0.0, 0.0, 0.0, 78.0, 0.0, 0.0, 0.0, 78.0, 0.0, 0.0, 0.0, 78.0, 0.0, 0.0,
            0.0, 77.0, 0.0, 0.0, 0.0, 77.0, 0.0, 0.0, 0.0, 77.0, 0.0, 0.0, 0.0, 76.0, 0.0, 0.0, 0.0, 76.0,
            0.0, 0.0, 0.0, 75.0, 0.0, 0.0, 0.0, 75.0, 0.0, 0.0, 0.0, 74.0, 0.0, 0.0, 0.0, 73.0, 0.0, 0.0,
            0.0, 73.0, 0.0, 0.0, 0.0, 72.0, 0.0, 0.0, 0.0, 71.0, 0.0, 0.0, 0.0, 70.0, 0.0, 0.0, 0.0, 69.0,
            0.0, 0.0, 0.0, 68.0, 0.0, 0.0, 0.0, 67.0, 0.0, 0.0, 0.0, 66.0, 0.0, 0.0, 0.0, 66.0, 0.0, 0.0,
            0.0, 65.0, 0.0, 0.0, 0.0, 64.0, 0.0, 0.0, 0.0, 63.0, 0.0, 0.0, 0.0, 61.0, 0.0, 0.0, 0.0, 60.0,
            0.0, 0.0, 0.0, 59.0, 0.0, 0.0, 0.0, 58.0, 0.0, 0.0, 0.0, 58.0, 0.0, 0.0, 0.0, 57.0, 0.0, 0.0,
            0.0, 56.0, 0.0, 0.0, 0.0, 55.0, 0.0, 0.0, 0.0, 54.0, 0.0, 0.0, 0.0, 53.0, 0.0, 0.0, 0.0, 52.0,
            0.0, 0.0, 0.0, 51.0, 0.0, 0.0, 0.0, 51.0, 0.0, 0.0, 0.0, 50.0, 0.0, 0.0, 0.0, 49.0, 0.0, 0.0,
            0.0, 49.0, 0.0, 0.0, 0.0, 48.0, 0.0, 0.0, 0.0, 48.0, 0.0, 0.0, 0.0, 47.0, 0.0, 0.0, 0.0, 47.0,
            0.0, 0.0, 0.0, 47.0, 0.0, 0.0, 0.0, 46.0, 0.0, 0.0, 0.0, 46.0, 0.0, 0.0, 0.0, 46.0, 0.0, 0.0,
            0.0, 46.0, 0.0, 0.0, 0.0, 46.0, 0.0, 0.0, 0.0, 47.0, 0.0, 0.0, 0.0, 47.0, 0.0, 0.0, 0.0, 47.0,
            0.0, 0.0, 0.0, 48.0, 0.0, 0.0, 0.0, 48.0, 0.0, 0.0, 0.0, 49.0, 0.0, 0.0, 0.0, 50.0, 0.0, 0.0,
            0.0, 50.0, 0.0, 0.0, 0.0, 51.0, 0.0, 0.0, 0.0, 52.0, 0.0, 0.0, 0.0, 53.0, 0.0, 0.0, 0.0, 55.0,
            0.0, 0.0, 0.0, 56.0, 0.0, 0.0, 0.0, 57.0, 0.0, 0.0, 0.0, 59.0, 0.0, 0.0, 0.0, 60.0, 0.0, 0.0,
            0.0, 62.0, 0.0, 0.0, 0.0, 64.0, 0.0, 0.0, 0.0, 65.0, 0.0, 0.0, 0.0, 67.0, 0.0, 0.0, 0.0, 69.0,
            0.0, 0.0, 0.0, 71.0, 0.0, 0.0, 0.0, 74.0, 0.0, 0.0, 0.0, 76.0, 0.0, 0.0, 0.0, 78.0, 0.0, 0.0,
            0.0, 81.0, 0.0, 0.0, 0.0, 83.0, 0.0, 0.0, 0.0, 86.0, 0.0, 0.0, 0.0, 88.0, 0.0, 0.0, 0.0, 91.0,
            0.0, 0.0, 0.0, 94.0, 0.0, 0.0, 0.0, 96.0, 0.0, 0.0, 0.0, 99.0, 0.0, 0.0, 0.0, 102.0, 0.0, 0.0,
            0.0, 105.0, 0.0, 0.0, 0.0, 108.0, 0.0, 0.0, 0.0, 111.0, 0.0, 0.0, 0.0, 114.0, 0.0, 0.0, 0.0,
            117.0, 0.0, 0.0, 0.0, 120.0, 0.0, 0.0, 0.0, 124.0, 0.0, 0.0, 0.0, 127.0, 0.0, 0.0, 0.0, 130.0,
            0.0, 0.0, 0.0, 133.0, 0.0, 0.0, 0.0, 136.0, 0.0, 0.0, 0.0, 140.0, 0.0, 0.0, 0.0, 143.0, 0.0,
            0.0, 0.0, 146.0, 0.0, 0.0, 0.0, 149.0, 0.0, 0.0, 0.0, 153.0, 0.0, 0.0, 0.0, 156.0, 0.0, 0.0,
            0.0, 159.0, 0.0, 0.0, 0.0, 162.0, 0.0, 0.0, 0.0, 165.0, 0.0, 0.0, 0.0, 169.0, 0.0, 0.0, 0.0,
            172.0, 0.0, 0.0, 0.0, 175.0, 0.0, 0.0, 0.0, 178.0, 0.0, 0.0, 0.0, 181.0, 0.0, 0.0, 0.0, 184.0,
            0.0, 0.0, 0.0, 186.0, 0.0, 0.0, 0.0, 189.0, 0.0, 0.0, 0.0, 192.0, 0.0, 0.0, 0.0, 195.0, 0.0,
            0.0, 0.0, 197.0, 0.0, 0.0, 0.0, 200.0, 0.0, 0.0, 0.0, 203.0, 0.0, 0.0, 0.0, 205.0, 0.0, 0.0,
            0.0, 207.0, 0.0, 0.0, 0.0, 210.0, 0.0, 0.0, 0.0, 212.0, 0.0, 0.0, 0.0, 214.0, 0.0, 0.0, 0.0,
            216.0, 0.0, 0.0, 0.0, 218.0, 0.0, 0.0, 0.0, 220.0, 0.0, 0.0, 0.0, 222.0, 0.0, 0.0, 0.0, 224.0,
            0.0, 0.0, 0.0, 226.0, 0.0, 0.0, 0.0, 227.0, 0.0, 0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 230.0, 0.0,
            0.0, 0.0, 231.0, 0.0, 0.0, 0.0, 233.0, 0.0, 0.0, 0.0, 234.0, 0.0, 0.0, 0.0, 235.0, 0.0, 0.0,
            0.0, 236.0, 0.0, 0.0, 0.0, 237.0, 0.0, 0.0, 0.0, 238.0, 0.0, 0.0, 0.0, 239.0, 0.0, 0.0, 0.0,
            239.0, 0.0, 0.0, 0.0, 240.0, 0.0, 0.0, 0.0, 241.0, 0.0, 0.0, 0.0, 241.0, 0.0, 0.0, 0.0, 242.0,
            0.0, 0.0, 0.0, 242.0, 0.0, 0.0, 0.0, 242.0, 0.0, 0.0, 0.0, 243.0, 0.0, 0.0, 0.0, 243.0, 0.0,
            0.0, 0.0, 243.0, 0.0, 0.0, 0.0, 243.0, 0.0, 0.0, 0.0, 243.0, 0.0, 0.0, 0.0, 243.0, 0.0, 0.0,
            0.0, 243.0, 0.0, 0.0, 0.0, 243.0, 0.0, 0.0, 0.0, 243.0, 0.0, 0.0, 0.0, 243.0, 0.0, 0.0, 0.0,
            242.0, 0.0, 0.0, 0.0, 242.0, 0.0, 0.0, 0.0, 242.0, 0.0, 0.0, 0.0, 242.0, 0.0, 0.0, 0.0, 241.0,
            0.0, 0.0, 0.0, 241.0, 0.0, 0.0, 0.0, 241.0, 0.0, 0.0, 0.0, 241.0, 0.0, 0.0, 0.0, 240.0, 0.0,
            0.0, 0.0, 240.0, 0.0, 0.0, 0.0, 240.0, 0.0, 0.0, 0.0, 239.0, 0.0, 0.0, 0.0, 239.0, 0.0, 0.0,
            0.0, 239.0, 0.0, 0.0, 0.0, 239.0, 0.0, 0.0, 0.0, 239.0, 0.0, 0.0, 0.0, 238.0, 0.0, 0.0, 0.0,
            238.0, 0.0, 0.0, 0.0, 238.0, 0.0, 0.0, 0.0, 238.0, 0.0, 0.0, 0.0, 238.0, 0.0, 0.0, 0.0, 238.0,
            0.0, 0.0, 0.0, 238.0, 0.0, 0.0, 0.0, 238.0, 0.0, 0.0, 0.0, 239.0, 0.0, 0.0, 0.0, 239.0, 0.0,
            0.0, 0.0, 239.0, 0.0, 0.0, 0.0, 240.0, 0.0, 0.0, 0.0, 240.0, 0.0, 0.0, 0.0, 240.0, 0.0, 0.0,
            0.0, 241.0, 0.0, 0.0, 0.0, 242.0, 0.0, 0.0, 0.0, 242.0, 0.0, 0.0, 0.0, 243.0, 0.0, 0.0, 0.0,
            244.0, 0.0, 0.0, 0.0, 245.0, 0.0, 0.0, 0.0, 246.0, 0.0, 0.0, 0.0, 247.0, 0.0, 0.0, 0.0, 248.0,
            0.0, 0.0, 0.0, 249.0, 0.0, 0.0, 0.0, 250.0, 0.0, 0.0, 0.0, 252.0, 0.0, 0.0, 0.0, 253.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0
        ])
    };
    EOSB = {
        r: new Float32Array([
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 9.0, 0.0, 0.0, 0.0, 18.0,
            0.0, 0.0, 0.0, 27.0, 0.0, 0.0, 0.0, 36.0, 0.0, 0.0, 0.0, 45.0, 0.0, 0.0, 0.0, 49.0, 0.0, 0.0,
            0.0, 57.0, 0.0, 0.0, 0.0, 72.0, 0.0, 0.0, 0.0, 81.0, 0.0, 0.0, 0.0, 91.0, 0.0, 0.0, 0.0,
            100.0, 0.0, 0.0, 0.0, 109.0, 0.0, 0.0, 0.0, 118.0, 0.0, 0.0, 0.0, 127.0, 0.0, 0.0, 0.0, 136.0,
            0.0, 0.0, 0.0, 131.0, 0.0, 0.0, 0.0, 139.0, 0.0, 0.0, 0.0, 163.0, 0.0, 0.0, 0.0, 173.0, 0.0,
            0.0, 0.0, 182.0, 0.0, 0.0, 0.0, 191.0, 0.0, 0.0, 0.0, 200.0, 0.0, 0.0, 0.0, 209.0, 0.0, 0.0,
            0.0, 218.0, 0.0, 0.0, 0.0, 227.0, 0.0, 0.0, 0.0, 213.0, 0.0, 0.0, 0.0, 221.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 229.0, 0.0,
            0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 229.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 229.0,
            0.0, 0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 229.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            229.0, 0.0, 0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 229.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 253.0, 0.0, 0.0, 0.0, 251.0, 0.0, 0.0, 0.0, 249.0, 0.0,
            0.0, 0.0, 247.0, 0.0, 0.0, 0.0, 245.0, 0.0, 0.0, 0.0, 243.0, 0.0, 0.0, 0.0, 241.0, 0.0, 0.0,
            0.0, 215.0, 0.0, 0.0, 0.0, 214.0, 0.0, 0.0, 0.0, 235.0, 0.0, 0.0, 0.0, 234.0, 0.0, 0.0, 0.0,
            232.0, 0.0, 0.0, 0.0, 230.0, 0.0, 0.0, 0.0, 228.0, 0.0, 0.0, 0.0, 226.0, 0.0, 0.0, 0.0, 224.0,
            0.0, 0.0, 0.0, 222.0, 0.0, 0.0, 0.0, 198.0, 0.0, 0.0, 0.0, 196.0, 0.0, 0.0, 0.0, 216.0, 0.0,
            0.0, 0.0, 215.0, 0.0, 0.0, 0.0, 213.0, 0.0, 0.0, 0.0, 211.0, 0.0, 0.0, 0.0, 209.0, 0.0, 0.0,
            0.0, 207.0, 0.0, 0.0, 0.0, 205.0, 0.0, 0.0, 0.0, 203.0, 0.0, 0.0, 0.0, 181.0, 0.0, 0.0, 0.0,
            179.0, 0.0, 0.0, 0.0, 197.0, 0.0, 0.0, 0.0, 196.0, 0.0, 0.0, 0.0, 194.0, 0.0, 0.0, 0.0, 192.0,
            0.0, 0.0, 0.0, 190.0, 0.0, 0.0, 0.0, 188.0, 0.0, 0.0, 0.0, 186.0, 0.0, 0.0, 0.0, 184.0, 0.0,
            0.0, 0.0, 164.0, 0.0, 0.0, 0.0, 162.0, 0.0, 0.0, 0.0, 178.0, 0.0, 0.0, 0.0, 176.0, 0.0, 0.0,
            0.0, 175.0, 0.0, 0.0, 0.0, 173.0, 0.0, 0.0, 0.0, 171.0, 0.0, 0.0, 0.0, 169.0, 0.0, 0.0, 0.0,
            167.0, 0.0, 0.0, 0.0, 165.0, 0.0, 0.0, 0.0, 147.0, 0.0, 0.0, 0.0, 145.0, 0.0, 0.0, 0.0, 159.0,
            0.0, 0.0, 0.0, 157.0, 0.0, 0.0, 0.0, 156.0, 0.0, 0.0, 0.0, 154.0, 0.0, 0.0, 0.0, 152.0, 0.0,
            0.0, 0.0, 150.0, 0.0, 0.0, 0.0, 148.0, 0.0, 0.0, 0.0, 146.0, 0.0, 0.0, 0.0, 130.0, 0.0, 0.0,
            0.0, 128.0, 0.0, 0.0, 0.0, 140.0, 0.0, 0.0, 0.0, 138.0, 0.0, 0.0, 0.0, 137.0, 0.0, 0.0, 0.0,
            135.0, 0.0, 0.0, 0.0, 133.0, 0.0, 0.0, 0.0, 131.0, 0.0, 0.0, 0.0, 129.0, 0.0, 0.0, 0.0, 127.0,
            0.0, 0.0, 0.0, 113.0, 0.0, 0.0, 0.0, 111.0, 0.0, 0.0, 0.0, 121.0, 0.0, 0.0, 0.0, 119.0, 0.0,
            0.0, 0.0, 117.0, 0.0, 0.0, 0.0, 117.0, 0.0, 0.0, 0.0
        ]),
        g: new Float32Array([
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 7.0,
            0.0, 0.0, 0.0, 15.0, 0.0, 0.0, 0.0, 23.0, 0.0, 0.0, 0.0, 31.0, 0.0, 0.0, 0.0, 39.0, 0.0, 0.0,
            0.0, 47.0, 0.0, 0.0, 0.0, 55.0, 0.0, 0.0, 0.0, 57.0, 0.0, 0.0, 0.0, 64.0, 0.0, 0.0, 0.0, 79.0,
            0.0, 0.0, 0.0, 87.0, 0.0, 0.0, 0.0, 95.0, 0.0, 0.0, 0.0, 103.0, 0.0, 0.0, 0.0, 111.0, 0.0,
            0.0, 0.0, 119.0, 0.0, 0.0, 0.0, 127.0, 0.0, 0.0, 0.0, 135.0, 0.0, 0.0, 0.0, 129.0, 0.0, 0.0,
            0.0, 136.0, 0.0, 0.0, 0.0, 159.0, 0.0, 0.0, 0.0, 167.0, 0.0, 0.0, 0.0, 175.0, 0.0, 0.0, 0.0,
            183.0, 0.0, 0.0, 0.0, 191.0, 0.0, 0.0, 0.0, 199.0, 0.0, 0.0, 0.0, 207.0, 0.0, 0.0, 0.0, 215.0,
            0.0, 0.0, 0.0, 200.0, 0.0, 0.0, 0.0, 207.0, 0.0, 0.0, 0.0, 239.0, 0.0, 0.0, 0.0, 247.0, 0.0,
            0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 229.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0,
            0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 229.0, 0.0,
            0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0,
            0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0,
            255.0, 0.0, 0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 250.0,
            0.0, 0.0, 0.0, 246.0, 0.0, 0.0, 0.0, 242.0, 0.0, 0.0, 0.0, 238.0, 0.0, 0.0, 0.0, 233.0, 0.0,
            0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 225.0, 0.0, 0.0, 0.0, 198.0, 0.0, 0.0, 0.0, 195.0, 0.0, 0.0,
            0.0, 212.0, 0.0, 0.0, 0.0, 208.0, 0.0, 0.0, 0.0, 204.0, 0.0, 0.0, 0.0, 199.0, 0.0, 0.0, 0.0,
            195.0, 0.0, 0.0, 0.0, 191.0, 0.0, 0.0, 0.0, 187.0, 0.0, 0.0, 0.0, 182.0, 0.0, 0.0, 0.0, 160.0,
            0.0, 0.0, 0.0, 156.0, 0.0, 0.0, 0.0, 169.0, 0.0, 0.0, 0.0, 165.0, 0.0, 0.0, 0.0, 161.0, 0.0,
            0.0, 0.0, 157.0, 0.0, 0.0, 0.0, 153.0, 0.0, 0.0, 0.0, 148.0, 0.0, 0.0, 0.0, 144.0, 0.0, 0.0,
            0.0, 140.0, 0.0, 0.0, 0.0, 122.0, 0.0, 0.0, 0.0, 118.0, 0.0, 0.0, 0.0, 127.0, 0.0, 0.0, 0.0,
            125.0, 0.0, 0.0, 0.0, 123.0, 0.0, 0.0, 0.0, 121.0, 0.0, 0.0, 0.0, 119.0, 0.0, 0.0, 0.0, 116.0,
            0.0, 0.0, 0.0, 114.0, 0.0, 0.0, 0.0, 112.0, 0.0, 0.0, 0.0, 99.0, 0.0, 0.0, 0.0, 97.0, 0.0,
            0.0, 0.0, 106.0, 0.0, 0.0, 0.0, 104.0, 0.0, 0.0, 0.0, 102.0, 0.0, 0.0, 0.0, 99.0, 0.0, 0.0,
            0.0, 97.0, 0.0, 0.0, 0.0, 95.0, 0.0, 0.0, 0.0, 93.0, 0.0, 0.0, 0.0, 91.0, 0.0, 0.0, 0.0, 80.0,
            0.0, 0.0, 0.0, 78.0, 0.0, 0.0, 0.0, 84.0, 0.0, 0.0, 0.0, 82.0, 0.0, 0.0, 0.0, 80.0, 0.0, 0.0,
            0.0, 78.0, 0.0, 0.0, 0.0, 76.0, 0.0, 0.0, 0.0, 74.0, 0.0, 0.0, 0.0, 72.0, 0.0, 0.0, 0.0, 70.0,
            0.0, 0.0, 0.0, 61.0, 0.0, 0.0, 0.0, 59.0, 0.0, 0.0, 0.0, 63.0, 0.0, 0.0, 0.0, 61.0, 0.0, 0.0,
            0.0, 59.0, 0.0, 0.0, 0.0, 57.0, 0.0, 0.0, 0.0, 55.0, 0.0, 0.0, 0.0, 53.0, 0.0, 0.0, 0.0, 50.0,
            0.0, 0.0, 0.0, 48.0, 0.0, 0.0, 0.0, 42.0, 0.0, 0.0, 0.0, 40.0, 0.0, 0.0, 0.0, 42.0, 0.0, 0.0,
            0.0, 40.0, 0.0, 0.0, 0.0, 38.0, 0.0, 0.0, 0.0, 36.0, 0.0, 0.0, 0.0, 33.0, 0.0, 0.0, 0.0, 31.0,
            0.0, 0.0, 0.0, 29.0, 0.0, 0.0, 0.0, 27.0, 0.0, 0.0, 0.0, 22.0, 0.0, 0.0, 0.0, 21.0, 0.0, 0.0,
            0.0, 21.0, 0.0, 0.0, 0.0, 19.0, 0.0, 0.0, 0.0, 16.0, 0.0, 0.0, 0.0, 14.0, 0.0, 0.0, 0.0, 12.0,
            0.0, 0.0, 0.0, 13.0, 0.0, 0.0, 0.0, 8.0, 0.0, 0.0, 0.0, 6.0, 0.0, 0.0, 0.0, 3.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0
        ]),
        b: new Float32Array([
            116.0, 0.0, 0.0, 0.0, 121.0, 0.0, 0.0, 0.0, 127.0, 0.0, 0.0, 0.0, 131.0, 0.0, 0.0, 0.0, 136.0,
            0.0, 0.0, 0.0, 140.0, 0.0, 0.0, 0.0, 144.0, 0.0, 0.0, 0.0, 148.0, 0.0, 0.0, 0.0, 153.0, 0.0,
            0.0, 0.0, 157.0, 0.0, 0.0, 0.0, 145.0, 0.0, 0.0, 0.0, 149.0, 0.0, 0.0, 0.0, 170.0, 0.0, 0.0,
            0.0, 174.0, 0.0, 0.0, 0.0, 178.0, 0.0, 0.0, 0.0, 182.0, 0.0, 0.0, 0.0, 187.0, 0.0, 0.0, 0.0,
            191.0, 0.0, 0.0, 0.0, 195.0, 0.0, 0.0, 0.0, 199.0, 0.0, 0.0, 0.0, 183.0, 0.0, 0.0, 0.0, 187.0,
            0.0, 0.0, 0.0, 212.0, 0.0, 0.0, 0.0, 216.0, 0.0, 0.0, 0.0, 221.0, 0.0, 0.0, 0.0, 225.0, 0.0,
            0.0, 0.0, 229.0, 0.0, 0.0, 0.0, 233.0, 0.0, 0.0, 0.0, 238.0, 0.0, 0.0, 0.0, 242.0, 0.0, 0.0,
            0.0, 221.0, 0.0, 0.0, 0.0, 225.0, 0.0, 0.0, 0.0, 255.0, 0.0, 0.0, 0.0, 247.0, 0.0, 0.0, 0.0,
            239.0, 0.0, 0.0, 0.0, 231.0, 0.0, 0.0, 0.0, 223.0, 0.0, 0.0, 0.0, 215.0, 0.0, 0.0, 0.0, 207.0,
            0.0, 0.0, 0.0, 199.0, 0.0, 0.0, 0.0, 172.0, 0.0, 0.0, 0.0, 164.0, 0.0, 0.0, 0.0, 175.0, 0.0,
            0.0, 0.0, 167.0, 0.0, 0.0, 0.0, 159.0, 0.0, 0.0, 0.0, 151.0, 0.0, 0.0, 0.0, 143.0, 0.0, 0.0,
            0.0, 135.0, 0.0, 0.0, 0.0, 127.0, 0.0, 0.0, 0.0, 119.0, 0.0, 0.0, 0.0, 100.0, 0.0, 0.0, 0.0,
            93.0, 0.0, 0.0, 0.0, 95.0, 0.0, 0.0, 0.0, 87.0, 0.0, 0.0, 0.0, 79.0, 0.0, 0.0, 0.0, 71.0, 0.0,
            0.0, 0.0, 63.0, 0.0, 0.0, 0.0, 55.0, 0.0, 0.0, 0.0, 47.0, 0.0, 0.0, 0.0, 39.0, 0.0, 0.0, 0.0,
            28.0, 0.0, 0.0, 0.0, 21.0, 0.0, 0.0, 0.0, 15.0, 0.0, 0.0, 0.0, 7.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0
        ])
    };
}
const colorMap = new ColorMap();

;// ./src/shader/HiPSShaderProgram.ts
// HiPSShaderProgram.ts



class HiPSShaderProgram {
    _shaderProgram;
    _vertexShader;
    _fragmentShader;
    _UBO_colorMapBuffer = null;
    _UBO_colorMapVariableInfo = {
        r_palette: { index: 0, offset: 0 },
        g_palette: { index: 0, offset: 0 },
        b_palette: { index: 0, offset: 0 }
    };
    gl_uniforms;
    gl_attributes;
    locations;
    constructor() {
        this.gl_uniforms = {
            sampler: 'uSampler0',
            factor: 'uFactor0',
            m_perspective: 'uPMatrix',
            m_model: 'uMMatrix',
            m_view: 'uVMatrix',
            colormapIdx: 'cmapIdx',
            colormap_red: 'r',
            colormap_green: 'g',
            colormap_blue: 'b'
        };
        this.gl_attributes = {
            vertex_pos: 'aVertexPosition',
            text_coords: 'aTextureCoord'
        };
        this.locations = {
            pMatrix: null,
            mMatrix: null,
            vMatrix: null,
            sampler: null,
            textureAlpha: null,
            clorMapIdx: null,
            vertexPositionAttribute: -1,
            textureCoordAttribute: -1
        };
    }
    get shaderProgram() {
        if (!this._shaderProgram) {
            const gl = src_Global.gl;
            this._shaderProgram = gl.createProgram();
            this.initShaders();
        }
        ;
        src_Global.gl.useProgram(this._shaderProgram);
        return this._shaderProgram;
    }
    initShaders() {
        const gl = src_Global.gl;
        const fragmentShaderStr = ShaderManager.hipsNativeFS();
        this._fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(this._fragmentShader, fragmentShaderStr);
        gl.compileShader(this._fragmentShader);
        if (!gl.getShaderParameter(this._fragmentShader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(this._fragmentShader) || 'Fragment shader compile error');
            return;
        }
        const vertexShaderStr = ShaderManager.hipsVS();
        this._vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(this._vertexShader, vertexShaderStr);
        gl.compileShader(this._vertexShader);
        if (!gl.getShaderParameter(this._vertexShader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(this._vertexShader) || 'Vertex shader compile error');
            return;
        }
        gl.attachShader(this._shaderProgram, this._vertexShader);
        gl.attachShader(this._shaderProgram, this._fragmentShader);
        gl.linkProgram(this._shaderProgram);
        if (!gl.getProgramParameter(this._shaderProgram, gl.LINK_STATUS)) {
            alert('Could not initialise shaders');
        }
    }
    enableProgram() {
        ;
        src_Global.gl.useProgram(this._shaderProgram);
    }
    setGrayscaleShader() {
        const gl = src_Global.gl;
        gl.detachShader(this._shaderProgram, this._fragmentShader);
        const fragmentShaderStr = ShaderManager.hipsGrayscaleFS();
        this.changeFSShader(fragmentShaderStr);
    }
    setNativeShader() {
        const gl = src_Global.gl;
        gl.detachShader(this._shaderProgram, this._fragmentShader);
        const fragmentShaderStr = ShaderManager.hipsNativeFS();
        this.changeFSShader(fragmentShaderStr);
    }
    setColorMapShader() {
        const gl = src_Global.gl;
        gl.detachShader(this._shaderProgram, this._fragmentShader);
        const fragmentShaderStr = ShaderManager.hipsColorMapFS();
        this.changeFSShader(fragmentShaderStr);
        // UBO discovery
        const blockIndex = gl.getUniformBlockIndex(this._shaderProgram, 'colormap');
        const blockSize = gl.getActiveUniformBlockParameter(this._shaderProgram, blockIndex, gl.UNIFORM_BLOCK_DATA_SIZE);
        const uboVariableNames = ['r_palette', 'g_palette', 'b_palette'];
        const uboVariableIndices = gl.getUniformIndices(this._shaderProgram, uboVariableNames);
        const uboVariableOffsets = gl.getActiveUniforms(this._shaderProgram, uboVariableIndices, gl.UNIFORM_OFFSET);
        this._UBO_colorMapBuffer = gl.createBuffer();
        gl.bindBuffer(gl.UNIFORM_BUFFER, this._UBO_colorMapBuffer);
        // std140 layout: 256 floats each padded to 16 bytes => 4096 bytes per palette, total 12288
        const BYTES = 12288;
        gl.bufferData(gl.UNIFORM_BUFFER, BYTES, gl.STATIC_DRAW);
        gl.bindBuffer(gl.UNIFORM_BUFFER, null);
        gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, this._UBO_colorMapBuffer);
        uboVariableNames.forEach((name, index) => {
            this._UBO_colorMapVariableInfo[name] = {
                index: uboVariableIndices[index],
                offset: uboVariableOffsets[index]
            };
        });
    }
    changeFSShader(fragmentShaderStr) {
        const gl = src_Global.gl;
        this._fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(this._fragmentShader, fragmentShaderStr);
        gl.compileShader(this._fragmentShader);
        if (!gl.getShaderParameter(this._fragmentShader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(this._fragmentShader) || 'Fragment shader compile error');
            return;
        }
        gl.attachShader(this._shaderProgram, this._fragmentShader);
        gl.linkProgram(this._shaderProgram);
        if (!gl.getProgramParameter(this._shaderProgram, gl.LINK_STATUS)) {
            alert('Could not initialise shaders');
        }
        gl.useProgram(this._shaderProgram);
    }
    enableShaders(pMatrix, vMatrix, mMatrix, colorMapIdx) {
        const gl = src_Global.gl;
        gl.useProgram(this._shaderProgram);
        this.locations.pMatrix = gl.getUniformLocation(this._shaderProgram, this.gl_uniforms.m_perspective);
        this.locations.mMatrix = gl.getUniformLocation(this._shaderProgram, this.gl_uniforms.m_model);
        this.locations.vMatrix = gl.getUniformLocation(this._shaderProgram, this.gl_uniforms.m_view);
        this.locations.sampler = gl.getUniformLocation(this._shaderProgram, this.gl_uniforms.sampler);
        this.locations.textureAlpha = gl.getUniformLocation(this._shaderProgram, this.gl_uniforms.factor);
        this.locations.clorMapIdx = gl.getUniformLocation(this._shaderProgram, this.gl_uniforms.colormapIdx);
        this.locations.vertexPositionAttribute = gl.getAttribLocation(this._shaderProgram, this.gl_attributes.vertex_pos);
        this.locations.textureCoordAttribute = gl.getAttribLocation(this._shaderProgram, this.gl_attributes.text_coords);
        if (colorMapIdx >= 2) {
            const index = gl.getUniformBlockIndex(this._shaderProgram, 'colormap');
            gl.uniformBlockBinding(this._shaderProgram, index, 0);
            gl.bindBuffer(gl.UNIFORM_BUFFER, this._UBO_colorMapBuffer);
            let currentColorMap;
            if (colorMapIdx === 2)
                currentColorMap = colorMap.PLANCK;
            else if (colorMapIdx === 3)
                currentColorMap = colorMap.CMB;
            else if (colorMapIdx === 4)
                currentColorMap = colorMap.RAINBOW;
            else if (colorMapIdx === 5)
                currentColorMap = colorMap.EOSB;
            else if (colorMapIdx === 6)
                currentColorMap = colorMap.CUBEHELIX;
            if (currentColorMap) {
                // Offsets match std140 padded arrays (0, 4096, 8192)
                gl.bufferSubData(gl.UNIFORM_BUFFER, 0, currentColorMap.r, 0);
                gl.bufferSubData(gl.UNIFORM_BUFFER, 4096, currentColorMap.g, 0);
                gl.bufferSubData(gl.UNIFORM_BUFFER, 8192, currentColorMap.b, 0);
            }
            gl.bindBuffer(gl.UNIFORM_BUFFER, null);
        }
        gl.uniformMatrix4fv(this.locations.mMatrix, false, mMatrix);
        gl.uniformMatrix4fv(this.locations.pMatrix, false, pMatrix);
        gl.uniformMatrix4fv(this.locations.vMatrix, false, vMatrix);
    }
}
const hipsShaderProgram = new HiPSShaderProgram();

;// ./src/model/hips/Tile.ts
// Tile.ts





// ------------------------------------------------------------------------
class Tile {
    _hips;
    _tileno;
    _baseurl;
    _order;
    _format;
    _maxorder;
    _isGalacticHips;
    _ready = false;
    _abort = false;
    _image;
    _textureLoaded = false;
    _texture;
    _texurl = '';
    _hipsShaderIndex = 0;
    _cacheTime0;
    _inView = true;
    _amIStillInFoV_requsetID;
    // geometry buffers
    vertexPosition = [];
    vertexPositionBuffer = [];
    vertexIndices = new Uint16Array();
    vertexIndexBuffer;
    opacity = 1.0;
    constructor(tileno, order, hips) {
        this._hips = hips;
        this._tileno = tileno;
        this._format = hips.format;
        this._baseurl = hips.baseURL;
        this._maxorder = hips.maxOrder;
        this._isGalacticHips = hips.isGalacticHips;
        this._order = order;
        this._amIStillInFoV_requsetID = window.setInterval(() => {
            this.amIStillInFoV();
        }, 5000);
        this.initImage();
    }
    destroyIntervals() {
        window.clearInterval(this._amIStillInFoV_requsetID);
    }
    getReadyState() {
        return this._ready;
    }
    get cacheTime0() {
        return this._cacheTime0;
    }
    resetCacheTime0() {
        this._cacheTime0 = undefined;
    }
    setCacheTime0() {
        this._cacheTime0 = new Date().getTime();
    }
    initImage() {
        this._image = new Image();
        const dirnumber = Math.floor(this._tileno / 10000) * 10000;
        this._texurl = `${this._baseurl}/Norder${this._order}/Dir${dirnumber}/Npix${this._tileno}.${this._format}`;
        this._image.onload = () => this.imageLoaded();
        this._image.onerror = () => {
            console.error('File not found?', this._texurl);
            this._ready = false;
            this._abort = true;
            this.destroyIntervals();
        };
        this._image.crossOrigin = 'anonymous';
        this._image.src = this._texurl;
    }
    imageLoaded() {
        this.textureLoaded();
        this.initModelBuffer();
        const gl = src_Global.gl;
        gl.activeTexture(gl.TEXTURE0 + this._hipsShaderIndex);
        gl.bindTexture(gl.TEXTURE_2D, this._texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._image);
        this._textureLoaded = true;
        if (this._textureLoaded)
            this._ready = true;
    }
    textureLoaded() {
        const gl = src_Global.gl;
        hipsShaderProgram.enableProgram();
        this._texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + this._hipsShaderIndex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.bindTexture(gl.TEXTURE_2D, this._texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        // FIX: use the sampler location we fetched in enableShaders()
        gl.uniform1i(hipsShaderProgram.locations.sampler, this._hipsShaderIndex);
        if (!gl.isTexture(this._texture)) {
            console.warn('Texture creation failed');
        }
    }
    initModelBuffer() {
        const gl = src_Global.gl;
        this.vertexPosition = [];
        this.vertexPositionBuffer = [];
        this.vertexIndices = new Uint16Array();
        const reforder = fovHelper.getRefOrder(this._order);
        const orighealpix = src_Global.getHealpix(this._order);
        const origxyf = orighealpix.nest2xyf(this._tileno);
        const orderjump = reforder - this._order;
        const dxmin = origxyf.ix << orderjump;
        const dxmax = (origxyf.ix << orderjump) + (1 << orderjump);
        const dymin = origxyf.iy << orderjump;
        const dymax = (origxyf.iy << orderjump) + (1 << orderjump);
        const healpix = src_Global.getHealpix(reforder);
        this.setupPositionAndTexture4Quadrant2(dxmin, dxmin + (dxmax - dxmin) / 2, dymin, dymin + (dymax - dymin) / 2, 0, healpix, orderjump, origxyf);
        this.setupPositionAndTexture4Quadrant2(dxmin + (dxmax - dxmin) / 2, dxmax, dymin, dymin + (dymax - dymin) / 2, 1, healpix, orderjump, origxyf);
        this.setupPositionAndTexture4Quadrant2(dxmin, dxmin + (dxmax - dxmin) / 2, dymin + (dymax - dymin) / 2, dymax, 2, healpix, orderjump, origxyf);
        this.setupPositionAndTexture4Quadrant2(dxmin + (dxmax - dxmin) / 2, dxmax, dymin + (dymax - dymin) / 2, dymax, 3, healpix, orderjump, origxyf);
        const pixelsXQuadrant = this.vertexPosition[0].length / 20;
        const idx = this.computeVertexIndices(pixelsXQuadrant);
        // If large, upgrade to Uint32 indices
        if (idx.length > 65535) {
            // Optional: require OES_element_index_uint if you’re still on WebGL1
            this.vertexIndices = new Uint32Array(idx);
        }
        else {
            this.vertexIndices = new Uint16Array(idx);
        }
        this.vertexIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndices, gl.STATIC_DRAW);
    }
    computeVertexIndices(pixelsXQuadrant) {
        const vertexIndices = new Uint32Array(6 * pixelsXQuadrant);
        let baseFaceIndex = 0;
        for (let j = 0; j < pixelsXQuadrant; j++) {
            const b = baseFaceIndex;
            vertexIndices[6 * j] = b;
            vertexIndices[6 * j + 1] = b + 1;
            vertexIndices[6 * j + 2] = b + 2;
            vertexIndices[6 * j + 3] = b + 2;
            vertexIndices[6 * j + 4] = b + 3;
            vertexIndices[6 * j + 5] = b;
            baseFaceIndex += 4;
        }
        return vertexIndices;
    }
    setupPositionAndTexture4Quadrant2(dxmin, dxmax, dymin, dymax, qidx, healpix, orderjump, origxyf) {
        const gl = src_Global.gl;
        this.vertexPosition[qidx] = new Float32Array(20 * (dxmax - dxmin) * (dymax - dymin));
        const step = 1 / (1 << orderjump);
        let p = 0;
        const s_pixel_size = 0;
        const t_pixel_size = 0;
        for (let dx = dxmin; dx < dxmax; dx++) {
            for (let dy = dymin; dy < dymax; dy++) {
                const facesVec3Array = healpix.getPointsForXyfNoStep(dx, dy, origxyf.face);
                const uindex = dy - (origxyf.iy << orderjump);
                const vindex = dx - (origxyf.ix << orderjump);
                // v0
                this.vertexPosition[qidx][20 * p] = facesVec3Array[0].x;
                this.vertexPosition[qidx][20 * p + 1] = facesVec3Array[0].y;
                this.vertexPosition[qidx][20 * p + 2] = facesVec3Array[0].z;
                this.vertexPosition[qidx][20 * p + 3] = step + step * uindex + s_pixel_size;
                this.vertexPosition[qidx][20 * p + 4] = 1 - (step + step * vindex) - t_pixel_size;
                // v1
                this.vertexPosition[qidx][20 * p + 5] = facesVec3Array[1].x;
                this.vertexPosition[qidx][20 * p + 6] = facesVec3Array[1].y;
                this.vertexPosition[qidx][20 * p + 7] = facesVec3Array[1].z;
                this.vertexPosition[qidx][20 * p + 8] = step + step * uindex + s_pixel_size;
                this.vertexPosition[qidx][20 * p + 9] = 1 - step * vindex + t_pixel_size;
                // v2
                this.vertexPosition[qidx][20 * p + 10] = facesVec3Array[2].x;
                this.vertexPosition[qidx][20 * p + 11] = facesVec3Array[2].y;
                this.vertexPosition[qidx][20 * p + 12] = facesVec3Array[2].z;
                this.vertexPosition[qidx][20 * p + 13] = step * uindex - s_pixel_size;
                this.vertexPosition[qidx][20 * p + 14] = 1 - step * vindex + t_pixel_size;
                // v3
                this.vertexPosition[qidx][20 * p + 15] = facesVec3Array[3].x;
                this.vertexPosition[qidx][20 * p + 16] = facesVec3Array[3].y;
                this.vertexPosition[qidx][20 * p + 17] = facesVec3Array[3].z;
                this.vertexPosition[qidx][20 * p + 18] = step * uindex - s_pixel_size;
                this.vertexPosition[qidx][20 * p + 19] = 1 - (step + step * vindex) - t_pixel_size;
                p++;
            }
        }
        this.vertexPositionBuffer[qidx] = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer[qidx]);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertexPosition[qidx], gl.STATIC_DRAW);
    }
    get inView() {
        return this._inView;
    }
    moveToCache() {
        newTileBuffer.moveTileToCache(this._tileno, this._order, this._hips);
        this._inView = false;
        this.destroyIntervals();
    }
    amIStillInFoV() {
        if (this._textureLoaded)
            this._ready = true;
        if (this._isGalacticHips) {
            if (visibleTilesManager.galAncestorsMap.has(this._order)) {
                if (!visibleTilesManager.galAncestorsMap.get(this._order).includes(this._tileno)) {
                    this.moveToCache();
                }
                else {
                    this._inView = true;
                }
            }
            if (this._order == visibleTilesManager.visibleOrder) {
                if (!visibleTilesManager.galVisibleTilesByOrder.pixels.includes(this._tileno)) {
                    this.moveToCache();
                }
                else {
                    this._inView = true;
                }
            }
        }
        else {
            if (visibleTilesManager.ancestorsMap.has(this._order)) {
                if (!visibleTilesManager.ancestorsMap.get(this._order).includes(this._tileno)) {
                    this.moveToCache();
                }
                else {
                    this._inView = true;
                }
            }
            if (this._order == visibleTilesManager.visibleOrder) {
                if (!visibleTilesManager.visibleTilesByOrder.pixels.includes(this._tileno)) {
                    this.moveToCache();
                }
                else {
                    this._inView = true;
                }
            }
        }
    }
    draw(visibleOrder, visibleTilesMap, pMatrix, vMatrix, mMatrix, colorMapIdx) {
        if (!this._ready || this._abort)
            return;
        let quadrantsToDraw = new Set([0, 1, 2, 3]);
        if (visibleOrder > this._order && this._order < this._maxorder) {
            const kids = this.drawChildren(visibleOrder, visibleTilesMap, pMatrix, vMatrix, mMatrix, colorMapIdx);
            if (kids)
                quadrantsToDraw = kids;
        }
        const gl = src_Global.gl;
        hipsShaderProgram.enableShaders(pMatrix, vMatrix, mMatrix, colorMapIdx);
        // Enable attributes (these locations are retrieved in enableShaders)
        gl.enableVertexAttribArray(hipsShaderProgram.locations.vertexPositionAttribute);
        gl.enableVertexAttribArray(hipsShaderProgram.locations.textureCoordAttribute);
        gl.activeTexture(gl.TEXTURE0 + this._hipsShaderIndex);
        gl.bindTexture(gl.TEXTURE_2D, this._texture);
        gl.uniform1f(hipsShaderProgram.locations.textureAlpha, this.opacity);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
        const elemno = this.vertexIndices.length;
        const indexType = this.vertexIndices instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
        quadrantsToDraw.forEach((qidx) => {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer[qidx]);
            gl.vertexAttribPointer(hipsShaderProgram.locations.vertexPositionAttribute, 3, gl.FLOAT, false, 5 * 4, 0);
            gl.vertexAttribPointer(hipsShaderProgram.locations.textureCoordAttribute, 2, gl.FLOAT, false, 5 * 4, 3 * 4);
            gl.drawElements(gl.TRIANGLES, elemno, indexType, 0);
        });
        gl.disableVertexAttribArray(hipsShaderProgram.locations.vertexPositionAttribute);
        gl.disableVertexAttribArray(hipsShaderProgram.locations.textureCoordAttribute);
    }
    drawChildren(visibleOrder, visibleTilesMap, pMatrix, vMatrix, mMatrix, colorMapIdx) {
        const quadrantsToDraw = new Set([0, 1, 2, 3]);
        const childrenOrder = this._order + 1;
        if (!visibleTilesMap.has(childrenOrder))
            return;
        for (let c = 0; c < 4; c++) {
            const childTileNo = (this._tileno << 2) + c;
            const list = visibleTilesMap.get(childrenOrder);
            if (list.includes(childTileNo)) {
                const childTile = this._isGalacticHips
                    ? newTileBuffer.getGalTile(childTileNo, childrenOrder, this._hips)
                    : newTileBuffer.getTile(childTileNo, childrenOrder, this._hips);
                childTile.draw(visibleOrder, visibleTilesMap, pMatrix, vMatrix, mMatrix, colorMapIdx);
                if (childTile._ready) {
                    quadrantsToDraw.delete(childTileNo - (this._tileno << 2));
                }
            }
        }
        return quadrantsToDraw;
    }
}

;// ./src/model/hips/TileBuffer.ts
// TileBuffer.ts
 // adjust if your file is named differently
class TileBuffer {
    // Equatorial
    _tiles;
    _cachedTiles;
    _activeHiPS;
    // Galactic
    _galTiles;
    _galCachedTiles;
    _galActiveHiPS;
    _cacheAliveMilliSeconds;
    _cleanerId;
    constructor(minutesToLiveInCache = 1) {
        this._tiles = new Map();
        this._cachedTiles = new Map();
        this._activeHiPS = new Map();
        this._galTiles = new Map();
        this._galCachedTiles = new Map();
        this._galActiveHiPS = new Map();
        this._cacheAliveMilliSeconds = minutesToLiveInCache * 60 * 1000;
        this._cleanerId = window.setInterval(() => {
            this.cacheCleaner();
        }, 10_000);
    }
    /** Register an equatorial HiPS into the buffer. */
    addHiPS(hips) {
        if (this._activeHiPS.has(hips)) {
            console.error('HiPS already present in TileBuffer');
            return;
        }
        this._activeHiPS.set(hips, new Map());
    }
    /** Register a galactic HiPS into the buffer. */
    addGalHiPS(hips) {
        if (this._galActiveHiPS.has(hips)) {
            console.error('HiPS already present in TileBuffer');
            return;
        }
        this._galActiveHiPS.set(hips, new Map());
    }
    /** Preload/add tile for every registered equatorial HiPS. */
    addTile(order, tileno) {
        for (const hips of this._activeHiPS.keys()) {
            this.getTile(tileno, order, hips);
        }
    }
    /** Preload/add tile for every registered galactic HiPS. */
    addGalTile(order, tileno) {
        for (const hips of this._galActiveHiPS.keys()) {
            this.getGalTile(tileno, order, hips);
        }
    }
    /** Fetch (or create) an equatorial tile, reviving from cache if present. */
    getTile(tileno, order, hips) {
        const tileKey = this.key(order, tileno, hips.baseURL);
        if (!this._tiles.has(tileKey)) {
            if (this._cachedTiles.has(tileKey)) {
                const tile = this._cachedTiles.get(tileKey);
                this._tiles.set(tileKey, tile);
                this._cachedTiles.delete(tileKey);
                tile.resetCacheTime0();
            }
            else {
                const tile = new Tile(tileno, order, hips);
                this._tiles.set(tileKey, tile);
            }
        }
        return this._tiles.get(tileKey);
    }
    /** Fetch (or create) a galactic tile, reviving from cache if present. */
    getGalTile(tileno, order, hips) {
        const tileKey = this.key(order, tileno, hips.baseURL);
        if (!this._galTiles.has(tileKey)) {
            if (this._galCachedTiles.has(tileKey)) {
                const tile = this._galCachedTiles.get(tileKey);
                this._galTiles.set(tileKey, tile);
                this._galCachedTiles.delete(tileKey);
                tile.resetCacheTime0();
            }
            else {
                const tile = new Tile(tileno, order, hips);
                this._galTiles.set(tileKey, tile);
            }
        }
        return this._galTiles.get(tileKey);
    }
    /** Move a tile (equatorial or galactic) into cache. */
    moveTileToCache(tileno, order, hips) {
        const tileKey = this.key(order, tileno, hips.baseURL);
        if (this._tiles.has(tileKey)) {
            const tile = this._tiles.get(tileKey);
            tile.setCacheTime0();
            this._cachedTiles.set(tileKey, tile);
            this._tiles.delete(tileKey);
        }
        if (this._galTiles.has(tileKey)) {
            const tile = this._galTiles.get(tileKey);
            tile.setCacheTime0();
            this._galCachedTiles.set(tileKey, tile);
            this._galTiles.delete(tileKey);
        }
    }
    /** Periodically purge stale cached tiles. */
    cacheCleaner() {
        const now = Date.now();
        for (const [tileKey, tile] of this._cachedTiles) {
            const t0 = tile.cacheTime0;
            if (!tile.inView && t0 !== undefined && now - t0 > this._cacheAliveMilliSeconds) {
                tile.destroyIntervals();
                this._cachedTiles.delete(tileKey);
            }
        }
        for (const [tileKey, tile] of this._galCachedTiles) {
            const t0 = tile.cacheTime0;
            if (!tile.inView && t0 !== undefined && now - t0 > this._cacheAliveMilliSeconds) {
                tile.destroyIntervals();
                this._galCachedTiles.delete(tileKey);
            }
        }
    }
    /** Compose a stable key for maps. */
    key(order, tileno, baseURL) {
        return `${order}#${tileno}#${baseURL}`;
    }
    /** Optional: call to stop internal timers if you dispose this buffer. */
    dispose() {
        window.clearInterval(this._cleanerId);
    }
}
// Singleton (kept for compatibility with your original export)
const newTileBuffer = new TileBuffer();

;// ./src/model/hips/VisibleTilesManager.ts







class VisibleTilesManager {
    _visibleTilesByOrder;
    _ancestorsMap;
    initialised;
    _galVisibleTilesByOrder;
    _galAncestorsMap;
    _galacticMatrixInverted;
    _galacticMatrix;
    insideSphere = bootSetup.insideSphere;
    constructor() {
        this._visibleTilesByOrder = { pixels: [], order: 0 };
        this._ancestorsMap = new Map();
        this.initialised = false;
        this._galVisibleTilesByOrder = { pixels: [], order: 0 };
        this._galAncestorsMap = new Map();
        // Matrices for galactic <-> equatorial
        this._galacticMatrixInverted = mat4_create();
        this._galacticMatrix = mat4_create();
        // From https://observablehq.com/@fil/galactic-rotations (single-precision friendly)
        // This matrix is (galactic -> equatorial); we store its inverse too.
        mat4_set(this._galacticMatrixInverted, -0.054876, -0.873437, -0.483835, 0, 0.494109, -0.44483, 0.746982, -0, -0.867666, -0.198076, 0.455984, 0, 0, 0, 0, 1);
        invert(this._galacticMatrix, this._galacticMatrixInverted);
    }
    init(insideSphere) {
        this.initialised = true;
        this.insideSphere = insideSphere;
        this.computeVisiblePixels();
        // Consider debouncing/throttling in real-time UIs
        setInterval(() => this.computeVisiblePixels(), 500);
    }
    getVisibleOrder() {
        return grid_HealpixGridSingleton.visibleorder;
    }
    // toggleInsideSphere(){
    //   this.insideSphere = !this.insideSphere
    //   this.computeVisiblePixels();
    // }
    computeVisiblePixels() {
        if (!this.initialised)
            return;
        let order = grid_HealpixGridSingleton.visibleorder;
        if (src_Global.insideSphere && order < 3) {
            order = 3;
        }
        this._ancestorsMap.set(order, []);
        this._galAncestorsMap.set(order, []);
        let pixels = [];
        let galTiles = [];
        if (order === 0) {
            const geomhealpix = src_Global.getHealpix(0);
            const npix = geomhealpix.getNPix();
            for (let i = 0; i < npix; i++) {
                pixels.push(i);
                this._ancestorsMap.get(order).push(i);
                galTiles.push(i);
                this._galAncestorsMap.get(order).push(i);
            }
        }
        else {
            const geomhealpix = src_Global.getHealpix(order);
            const maxX = src_Global.gl.canvas.width;
            const maxY = src_Global.gl.canvas.height;
            // Sample a grid of screen points, project to the sphere, then to galactic
            for (let i = 0; i <= maxX; i += maxX / 30) {
                for (let j = 0; j <= maxY; j += maxY / 30) {
                    const hit = utils_RayPickingUtils.getIntersectionPointWithSingleModel(i, j);
                    if (hit.length > 0) {
                        // Equatorial -> Galactic (use _galacticMatrix)
                        const galVec = vec4_create();
                        vec4_transformMat4(galVec, [hit[0], hit[1], hit[2], 1], this._galacticMatrix);
                        // Index in galactic HEALPix
                        const galPoint = new Pointing(new Vec3(galVec[0], galVec[1], galVec[2]));
                        const galTileNo = geomhealpix.ang2pix(galPoint);
                        // Index in equatorial HEALPix
                        const curPoint = new Pointing(new Vec3(hit[0], hit[1], hit[2]));
                        const currPixNo = geomhealpix.ang2pix(curPoint);
                        if (!pixels.includes(currPixNo)) {
                            pixels.push(currPixNo);
                            this._ancestorsMap.get(order).push(currPixNo);
                            newTileBuffer.addTile(order, currPixNo);
                        }
                        if (!galTiles.includes(galTileNo)) {
                            galTiles.push(galTileNo);
                            this._galAncestorsMap.get(order).push(galTileNo);
                            newTileBuffer.addGalTile(order, galTileNo);
                        }
                    }
                }
            }
        }
        this._visibleTilesByOrder = { pixels: pixels, order: order };
        this._galVisibleTilesByOrder = { pixels: galTiles, order: order };
        // Build ancestor pyramids down to order 0
        for (let o = 1; o < order; o++) {
            const tgtOrder = order - o;
            const list = this._ancestorsMap.get(tgtOrder) ?? [];
            this._ancestorsMap.set(tgtOrder, list);
            for (let p = 0; p < pixels.length; p++) {
                const parent = pixels[p] >> (2 * o);
                if (!list.includes(parent)) {
                    list.push(parent);
                    newTileBuffer.addTile(tgtOrder, parent);
                }
            }
        }
        for (let o = 1; o < order; o++) {
            const tgtOrder = order - o;
            const list = this._galAncestorsMap.get(tgtOrder) ?? [];
            this._galAncestorsMap.set(tgtOrder, list);
            for (let p = 0; p < galTiles.length; p++) {
                const parent = galTiles[p] >> (2 * o);
                if (!list.includes(parent)) {
                    list.push(parent);
                    newTileBuffer.addGalTile(tgtOrder, parent);
                }
            }
        }
    }
    get visibleTilesByOrder() {
        return this._visibleTilesByOrder;
    }
    get ancestorsMap() {
        return this._ancestorsMap;
    }
    get galVisibleTilesByOrder() {
        return this._galVisibleTilesByOrder;
    }
    get galAncestorsMap() {
        return this._galAncestorsMap;
    }
    get visibleOrder() {
        return this._visibleTilesByOrder.order;
    }
}
const visibleTilesManager = new VisibleTilesManager();

;// ./src/model/grid/HealpixGridSingleton.ts















class HealpixGridSingleton extends model_AbstractSkyEntity {
    static ELEM_SIZE = 3;
    static BYTES_X_ELEM = new Float32Array().BYTES_PER_ELEMENT;
    _visibleorder = 0;
    showGrid = false;
    _shaderProgram;
    fragmentShader;
    vertexShader;
    defaultColor = '#ec0acaff';
    gridText = new grid_GridTextHelper();
    _attribLocations = {
        position: 0,
        selected: 1,
        pointSize: 2,
        color: 3,
    };
    _nPrimitiveFlags = 0;
    _vertexCataloguePositionBuffer;
    _indexBuffer;
    _vertexCataloguePosition = new Float32Array(0);
    _indexes = new Uint32Array(0);
    fovObj;
    static INITIAL_FOV = 180;
    static RADIUS = 1;
    static INITIAL_POSITION = [0.0, 0.0, 0.0];
    static INITIAL_PhiRad = 0;
    static INITIAL_ThetaRad = 0;
    constructor() {
        super(HealpixGridSingleton.RADIUS, HealpixGridSingleton.INITIAL_POSITION, HealpixGridSingleton.INITIAL_PhiRad, HealpixGridSingleton.INITIAL_ThetaRad, 'healpix-grid');
    }
    init() {
        console.log('HealpixGridSingleton.init()');
        this.initGL(src_Global.gl);
        this._shaderProgram = src_Global.gl.createProgram();
        this.initShaders();
        const order = fovHelper.getHiPSNorder(HealpixGridSingleton.INITIAL_FOV);
        this._visibleorder = order;
        this._nPrimitiveFlags = 0;
        this._vertexCataloguePositionBuffer = src_Global.gl.createBuffer();
        this._indexBuffer = src_Global.gl.createBuffer();
        this._vertexCataloguePosition = new Float32Array(0);
        this.fovObj = new FoV();
    }
    get RADIUS() {
        return HealpixGridSingleton.RADIUS;
    }
    get INITIAL_POSITION() {
        return HealpixGridSingleton.INITIAL_POSITION;
    }
    get INITIAL_PhiRad() {
        return HealpixGridSingleton.INITIAL_PhiRad;
    }
    get INITIAL_ThetaRad() {
        return HealpixGridSingleton.INITIAL_ThetaRad;
    }
    refreshFoV() {
        return this.fovObj.getFoV(src_Global.insideSphere);
    }
    getFoV() {
        return this.fovObj;
    }
    getMinFoV() {
        return this.fovObj.minFoV;
    }
    initShaders() {
        const gl = src_Global.gl;
        const fragmentShaderStr = shader_GridShaderManager.healpixGridFS();
        this.fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(this.fragmentShader, fragmentShaderStr);
        gl.compileShader(this.fragmentShader);
        if (!gl.getShaderParameter(this.fragmentShader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(this.fragmentShader) || 'Fragment shader compile error');
            return;
        }
        const vertexShaderStr = shader_GridShaderManager.healpixGridVS();
        this.vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(this.vertexShader, vertexShaderStr);
        gl.compileShader(this.vertexShader);
        if (!gl.getShaderParameter(this.vertexShader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(this.vertexShader) || 'Vertex shader compile error');
            return;
        }
        gl.attachShader(this._shaderProgram, this.vertexShader);
        gl.attachShader(this._shaderProgram, this.fragmentShader);
        gl.linkProgram(this._shaderProgram);
        if (!gl.getProgramParameter(this._shaderProgram, gl.LINK_STATUS)) {
            alert('Could not initialise shaders');
        }
        gl.useProgram(this._shaderProgram);
    }
    initBuffers(pixels, order) {
        this._nPrimitiveFlags = 0;
        const healpix = src_Global.getHealpix(order);
        const subhpx = src_Global.getHealpix(order + 1);
        const subsubhpx = src_Global.getHealpix(order + 2);
        let positionIndex = 0;
        let vIdx = 0;
        const R = 1.0;
        const MAX_UINT = 0xffffffff;
        this._indexes = new Uint32Array(17 * pixels.length);
        this._vertexCataloguePosition = new Float32Array(3 * 16 * pixels.length);
        for (let p = 0; p < pixels.length; p++) {
            const vecs = healpix.getBoundaries(pixels[p]);
            const cpix0 = pixels[p] << 2;
            const cpix1 = cpix0 + 1;
            const cpix2 = cpix0 + 2;
            const cpix3 = cpix0 + 3;
            const cp0vecs = subhpx.getBoundaries(cpix0);
            const cp3vecs = subhpx.getBoundaries(cpix3);
            // helper to push a vertex
            const pushV = (v) => {
                this._vertexCataloguePosition[positionIndex] = R * v.x;
                this._vertexCataloguePosition[positionIndex + 1] = R * v.y;
                this._vertexCataloguePosition[positionIndex + 2] = R * v.z;
                this._indexes[vIdx] = Math.floor(positionIndex / 3);
                vIdx += 1;
                positionIndex += 3;
            };
            // v0(3/0)
            pushV(vecs[0]);
            // v1(15/2)
            let subcpix3 = cpix3 << 2;
            let subcpix3_3 = subcpix3 + 3;
            let tmp = subsubhpx.getBoundaries(subcpix3_3);
            pushV(tmp[1]);
            // v1(3/1)
            pushV(cp3vecs[1]);
            // v0(2/2)
            let subcpix2 = cpix2 << 2;
            let subcpix2_2 = subcpix2 + 2;
            tmp = subsubhpx.getBoundaries(subcpix2_2);
            pushV(tmp[0]);
            // v1(0/0)
            pushV(vecs[1]);
            // v2(2/2)
            pushV(tmp[2]);
            // v1(0/1)
            pushV(cp0vecs[1]);
            // v1(0/2)
            let subcpix0 = cpix0 << 2;
            let subcpix0_2 = subcpix0;
            tmp = subsubhpx.getBoundaries(subcpix0_2);
            pushV(tmp[1]);
            // v2(0/0)
            pushV(vecs[2]);
            // v3(0/2)
            pushV(tmp[3]);
            // v3(0/1)
            pushV(cp0vecs[3]);
            // v2(5/2)
            let subcpix1 = cpix1 << 2;
            let subcpix1_1 = subcpix1 + 1;
            tmp = subsubhpx.getBoundaries(subcpix1_1);
            pushV(tmp[2]);
            // v3(0/0)
            pushV(vecs[3]);
            // v0(5/2)
            pushV(tmp[0]);
            // v3(3/1)
            pushV(cp3vecs[3]);
            tmp = subsubhpx.getBoundaries(subcpix3_3);
            pushV(tmp[3]);
            // primitive restart
            this._indexes[vIdx] = MAX_UINT;
            this._nPrimitiveFlags += 1;
            vIdx += 1;
        }
    }
    // updateTiles(pixels: number[], order: number) {
    //   return (this as any)._tileBuffer.updateTiles(pixels, order);
    // }
    refresh() {
        this.refreshFoV();
        const fov = this.getMinFoV();
        // expose to global (legacy)
        // (global as any).hipsFoV = fov;
        // global.order = fovHelper.getHiPSNorder(fov);
        // this._visibleorder = global.order;
        this._visibleorder = fovHelper.getHiPSNorder(fov);
    }
    enableShader(in_mMatrix, pMatrix) {
        const gl = src_Global.gl;
        gl.useProgram(this._shaderProgram);
        // TODO move locations retrieval elsewhere
        // Uniform locations
        const uMV = gl.getUniformLocation(this._shaderProgram, 'uMVMatrix');
        const uP = gl.getUniformLocation(this._shaderProgram, 'uPMatrix');
        const uColor = src_Global.gl.getUniformLocation(this._shaderProgram, 'u_fragcolor');
        // Attribute locations
        this._attribLocations.position = gl.getAttribLocation(this._shaderProgram, 'aCatPosition');
        let mvMatrix = mat4_create();
        mvMatrix = mat4_multiply(mvMatrix, src_Global.camera.getCameraMatrix(), in_mMatrix);
        if (uMV)
            gl.uniformMatrix4fv(uMV, false, mvMatrix);
        if (uP)
            gl.uniformMatrix4fv(uP, false, pMatrix);
        if (uColor) {
            const rgb = colorHex2RGB(this.defaultColor);
            gl.uniform4f(uColor, rgb[0], rgb[1], rgb[2], 1.0);
        }
    }
    isVisible() {
        return this.showGrid;
    }
    toggleShowGrid() {
        this.showGrid = !this.showGrid;
    }
    draw() {
        const gl = src_Global.gl;
        const mMatrix = this.getModelMatrix();
        this.refresh();
        if (!this.showGrid) {
            // gridTextHelper.resetDivSets();
            this.gridText.resetDivSets();
            return;
        }
        const visibleTiles = visibleTilesManager.visibleTilesByOrder;
        const pixels = visibleTiles.pixels;
        const order = visibleTiles.order;
        this.initBuffers(pixels, order);
        const pMatrix = ComputePerspectiveMatrix.pMatrix;
        this.enableShader(mMatrix, pMatrix);
        // Upload positions
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexCataloguePositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this._vertexCataloguePosition, gl.STATIC_DRAW);
        gl.vertexAttribPointer(this._attribLocations.position, HealpixGridSingleton.ELEM_SIZE, gl.FLOAT, false, HealpixGridSingleton.BYTES_X_ELEM * HealpixGridSingleton.ELEM_SIZE, 0);
        gl.enableVertexAttribArray(this._attribLocations.position);
        // Index buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this._indexes, gl.STATIC_DRAW);
        gl.drawElements(gl.LINE_LOOP, this._vertexCataloguePosition.length / 3 + this._nPrimitiveFlags, gl.UNSIGNED_INT, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        // Project and label pixel centers that are inside current FoV
        let mvMatrix = mat4_create();
        mvMatrix = mat4_multiply(mvMatrix, src_Global.camera.getCameraMatrix(), mMatrix);
        let mvpMatrix = mat4_create();
        mvpMatrix = mat4_multiply(mvpMatrix, pMatrix, mvMatrix);
        // FIX: pass model & pMatrix to match FoVUtils TS signature
        const center = utils_FoVUtils.getCenterJ2000(gl.canvas);
        const fovMin = (this.getMinFoV() * Math.PI) / 180 / 2;
        for (let p = 0; p < pixels.length; p++) {
            const pixCenter = src_Global.getHealpix(this._visibleorder).pix2vec(pixels[p]);
            // const pixCenter = (global.getHealpix(global.order).pix2vec(pixels[p]) as BoundVec);
            const point = new model_Point({ x: pixCenter.x, y: pixCenter.y, z: pixCenter.z }, utils_CoordsType.CARTESIAN);
            const distance = utils_GeomUtils.orthodromicDistance(center, point);
            if (distance < fovMin) {
                const vertex = [pixCenter.x, pixCenter.y, pixCenter.z, 1];
                const clipspace = vec4_create();
                vec4_transformMat4(clipspace, vertex, mvpMatrix);
                // NDC divide
                clipspace[0] /= clipspace[3];
                clipspace[1] /= clipspace[3];
                // clip → pixels
                const pixelX = (clipspace[0] * 0.5 + 0.5) * gl.canvas.width;
                const pixelY = (clipspace[1] * -0.5 + 0.5) * gl.canvas.height;
                this.gridText.addHPXDivSet(this._visibleorder + '/' + pixels[p], pixelX, pixelY);
                // gridTextHelper.addHPXDivSet(this._visibleorder + '/' + pixels[p], pixelX, pixelY);
            }
        }
        // gridTextHelper.resetDivSets();
        this.gridText.resetDivSets();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }
    get visibleorder() {
        return this._visibleorder;
    }
}
const healpixGridSingleton = new HealpixGridSingleton();
/* harmony default export */ const grid_HealpixGridSingleton = (healpixGridSingleton);

;// ./src/utils/RayPickingUtils.ts
/**
 * @author Fabrizio Giordano (Fab)
 */





class RayPickingUtils {
    static lastNearestVisibleObjectIdx = -1;
    /** Get index of the last object found under the mouse (if any). */
    static getNearestVisibleObjectIdx() {
        return this.lastNearestVisibleObjectIdx;
    }
    /**
     * Builds a world-space ray from mouse coords.
     * @param mouseX ClientX (page pixels)
     * @param mouseY ClientY (page pixels)
     * @param pMatrix Projection matrix
     * @returns World-space direction (normalized) as a vec3
     */
    static getRayFromMouse(mouseX, mouseY, pMatrix) {
        if (!src_Global.camera) {
            throw new Error("Camera is not initialized.");
        }
        const vMatrix = src_Global.camera.getCameraMatrix();
        const gl = src_Global.gl;
        const rect = gl.canvas.getBoundingClientRect();
        const canvasMX = mouseX - rect.left;
        const canvasMY = mouseY - rect.top;
        // viewport → NDC
        const x = (2.0 * canvasMX) / gl.canvas.clientWidth - 1.0;
        const y = 1.0 - (2.0 * canvasMY) / gl.canvas.clientHeight;
        const z = -1.0;
        // NDC → clip
        const rayClip = [x, y, z, 1.0];
        // clip → eye
        const pInv = mat4_create();
        invert(pInv, pMatrix);
        const rayEye4 = [0, 0, 0, 0];
        RayPickingUtils.mat4MultiplyVec4(pInv, rayClip, rayEye4);
        // direction in eye space (z = -1, w = 0)
        const rayEye = [rayEye4[0], rayEye4[1], -1.0, 0.0];
        // eye → world
        const vInv = mat4_create();
        invert(vInv, vMatrix);
        const rayWorld4 = [0, 0, 0, 0];
        RayPickingUtils.mat4MultiplyVec4(vInv, rayEye, rayWorld4);
        const rayWorld = fromValues(rayWorld4[0], rayWorld4[1], rayWorld4[2]);
        normalize(rayWorld, rayWorld);
        return rayWorld;
    }
    /** a*b (4x4 * vec4) → vec4 (in `out`) */
    static mat4MultiplyVec4(a, b, out) {
        const d = b[0], e = b[1], g = b[2], w = b[3];
        out[0] = a[0] * d + a[4] * e + a[8] * g + a[12] * w;
        out[1] = a[1] * d + a[5] * e + a[9] * g + a[13] * w;
        out[2] = a[2] * d + a[6] * e + a[10] * g + a[14] * w;
        out[3] = a[3] * d + a[7] * e + a[11] * g + a[15] * w;
        return out;
    }
    /**
     * Ray–sphere intersection (world space).
     * @returns distance `t` along the ray to the first hit, or `-1` if no hit.
     */
    static raySphere(rayOrigWorld, rayDirectionWorld) {
        let intersectionDistance = -1;
        const L = create();
        subtract(L, rayOrigWorld, grid_HealpixGridSingleton.center);
        const b = vec3_dot(rayDirectionWorld, L);
        const c = vec3_dot(L, L) - grid_HealpixGridSingleton.radius * grid_HealpixGridSingleton.radius;
        const disc = b * b - c;
        if (disc > 0.0) {
            const s = Math.sqrt(disc);
            const ta = -b + s;
            const tb = -b - s;
            if (ta < 0.0 && tb < 0.0) {
                // behind camera
            }
            else if (tb < 0.0) {
                intersectionDistance = ta;
            }
            else {
                intersectionDistance = Math.min(ta, tb);
            }
        }
        else if (disc === 0.0) {
            const t = -b; // tangent
            if (t >= 0.0) {
                intersectionDistance = t;
            }
        }
        return intersectionDistance;
    }
    /**
     * Compute intersection with a single model (defaults to the Healpix grid).
     * @returns model-space intersection point (vec3) if hit, otherwise empty array; and the picked model.
     */
    static getIntersectionPointWithSingleModel(mouseX, mouseY) {
        const pMatrix = ComputePerspectiveMatrix.pMatrix;
        const camera = src_Global.camera;
        if (!camera) {
            throw new Error("Camera is not initialized.");
        }
        const rayWorld = RayPickingUtils.getRayFromMouse(mouseX, mouseY, pMatrix);
        const t = RayPickingUtils.raySphere(camera.getCameraPosition(), rayWorld);
        let intersectionModelPoint = [];
        if (t >= 0) {
            // world intersection
            const worldHit = create();
            scale(worldHit, rayWorld, t);
            add(worldHit, camera.getCameraPosition(), worldHit);
            // world → model
            const worldHit4 = [worldHit[0], worldHit[1], worldHit[2], 1.0];
            const modelHit4 = [0, 0, 0, 0];
            RayPickingUtils.mat4MultiplyVec4(grid_HealpixGridSingleton.getModelMatrixInverse(), worldHit4, modelHit4);
            intersectionModelPoint = [modelHit4[0], modelHit4[1], modelHit4[2]];
        }
        return intersectionModelPoint;
    }
}
/* harmony default export */ const utils_RayPickingUtils = (RayPickingUtils);

;// ./src/utils/MouseHelper.ts
/**
 * @author Fabrizio Giordano (Fab)
 */




function toVec3(p) {
    return Array.isArray(p) ? fromValues(p[0], p[1], p[2]) : p;
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
        const hp = src_Global.getHealpix(src_Global.nsideForSelection);
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
/* harmony default export */ const utils_MouseHelper = (MouseHelper);

;// ./src/model/ColorMaps.ts
const ColorMaps = {
    grayscale: {
        name: 'grayscale',
        r: [],
        g: [],
        b: [],
    },
    native: {
        name: 'native',
        r: [],
        g: [],
        b: [],
    },
    planck: {
        name: 'planck',
        r: [
            0.0, 0.769231, 1.53846, 2.30769, 3.07692, 3.84615, 4.61538, 5.38462, 6.15385, 6.92308, 7.69231,
            8.46154, 9.23077, 10.0, 11.5385, 13.0769, 14.6154, 16.1538, 17.6923, 19.2308, 20.7692, 22.3077,
            23.8462, 25.3846, 26.9231, 28.4615, 30.0, 33.8462, 37.6923, 41.5385, 45.3846, 49.2308, 53.0769,
            56.9231, 60.7692, 64.6154, 68.4615, 72.3077, 76.1538, 80.0, 88.5385, 97.0769, 105.615, 114.154,
            122.692, 131.231, 139.769, 148.308, 156.846, 165.385, 173.923, 182.462, 191.0, 193.846, 196.692,
            199.538, 202.385, 205.231, 208.077, 210.923, 213.769, 216.615, 219.462, 222.308, 225.154, 228.0,
            229.182, 230.364, 231.545, 232.727, 233.909, 235.091, 236.273, 237.455, 238.636, 239.818, 241.0,
            241.0, 241.364, 241.727, 242.091, 242.455, 242.818, 243.182, 243.545, 243.909, 244.273, 244.636,
            245.0, 245.231, 245.462, 245.692, 245.923, 246.154, 246.385, 246.615, 246.846, 247.077, 247.308,
            247.538, 247.769, 248.0, 248.146, 248.292, 248.438, 248.585, 248.731, 248.877, 249.023, 249.169,
            249.315, 249.462, 249.608, 249.754, 249.9, 249.312, 248.723, 248.135, 247.546, 246.958, 246.369,
            245.781, 245.192, 244.604, 244.015, 243.427, 242.838, 242.25, 239.308, 236.365, 233.423,
            230.481, 227.538, 224.596, 221.654, 218.712, 215.769, 212.827, 209.885, 206.942, 204.0, 201.0,
            198.0, 195.0, 192.0, 189.0, 186.0, 183.0, 180.0, 177.0, 174.0, 171.0, 168.0, 165.0, 161.077,
            157.154, 153.231, 149.308, 145.385, 141.462, 137.538, 133.615, 129.692, 125.769, 121.846,
            117.923, 114.0, 115.038, 116.077, 117.115, 118.154, 119.192, 120.231, 121.269, 122.308, 123.346,
            124.385, 125.423, 126.462, 127.5, 131.423, 135.346, 139.269, 143.192, 147.115, 151.038, 154.962,
            158.885, 162.808, 166.731, 170.654, 174.577, 178.5, 180.462, 182.423, 184.385, 186.346, 188.308,
            190.269, 192.231, 194.192, 196.154, 198.115, 200.077, 202.038, 204.0, 205.962, 207.923, 209.885,
            211.846, 213.808, 215.769, 217.731, 219.692, 221.654, 223.615, 225.577, 227.538, 229.5, 230.481,
            231.462, 232.442, 233.423, 234.404, 235.385, 236.365, 237.346, 238.327, 239.308, 240.288,
            241.269, 242.25, 242.642, 243.035, 243.427, 243.819, 244.212, 244.604, 244.996, 245.388,
            245.781, 246.173, 246.565, 246.958, 247.35, 247.814, 248.277, 248.741, 249.205, 249.668,
            250.132, 250.595, 251.059, 251.523, 251.986, 252.45
        ],
        g: [
            0.0, 1.53846, 3.07692, 4.61538, 6.15385, 7.69231, 9.23077, 10.7692, 12.3077, 13.8462, 15.3846,
            16.9231, 18.4615, 20.0, 32.6154, 45.2308, 57.8462, 70.4615, 83.0769, 95.6923, 108.308, 120.923,
            133.538, 146.154, 158.769, 171.385, 184.0, 187.923, 191.846, 195.769, 199.692, 203.615, 207.538,
            211.462, 215.385, 219.308, 223.231, 227.154, 231.077, 235.0, 235.308, 235.615, 235.923, 236.231,
            236.538, 236.846, 237.154, 237.462, 237.769, 238.077, 238.385, 238.692, 239.0, 239.077, 239.154,
            239.231, 239.308, 239.385, 239.462, 239.538, 239.615, 239.692, 239.769, 239.846, 239.923, 240.0,
            240.091, 240.182, 240.273, 240.364, 240.455, 240.545, 240.636, 240.727, 240.818, 240.909, 241.0,
            241.0, 240.909, 240.818, 240.727, 240.636, 240.545, 240.455, 240.364, 240.273, 240.182, 240.091,
            240.0, 239.615, 239.231, 238.846, 238.462, 238.077, 237.692, 237.308, 236.923, 236.538, 236.154,
            235.769, 235.385, 235.0, 232.615, 230.231, 227.846, 225.462, 223.077, 220.692, 218.308, 215.923,
            213.538, 211.154, 208.769, 206.385, 204.0, 200.077, 196.154, 192.231, 188.308, 184.385, 180.462,
            176.538, 172.615, 168.692, 164.769, 160.846, 156.923, 153.0, 147.115, 141.231, 135.346, 129.462,
            123.577, 117.692, 111.808, 105.923, 100.038, 94.1538, 88.2692, 82.3846, 76.5, 73.0769, 69.6538,
            66.2308, 62.8077, 59.3846, 55.9615, 52.5385, 49.1154, 45.6923, 42.2692, 38.8462, 35.4231, 32.0,
            29.5385, 27.0769, 24.6154, 22.1538, 19.6923, 17.2308, 14.7692, 12.3077, 9.84615, 7.38462,
            4.92308, 2.46154, 0.0, 9.80769, 19.6154, 29.4231, 39.2308, 49.0385, 58.8462, 68.6538, 78.4615,
            88.2692, 98.0769, 107.885, 117.692, 127.5, 131.423, 135.346, 139.269, 143.192, 147.115, 151.038,
            154.962, 158.885, 162.808, 166.731, 170.654, 174.577, 178.5, 180.462, 182.423, 184.385, 186.346,
            188.308, 190.269, 192.231, 194.192, 196.154, 198.115, 200.077, 202.038, 204.0, 205.962, 207.923,
            209.885, 211.846, 213.808, 215.769, 217.731, 219.692, 221.654, 223.615, 225.577, 227.538, 229.5,
            230.481, 231.462, 232.442, 233.423, 234.404, 235.385, 236.365, 237.346, 238.327, 239.308,
            240.288, 241.269, 242.25, 242.642, 243.035, 243.427, 243.819, 244.212, 244.604, 244.996,
            245.388, 245.781, 246.173, 246.565, 246.958, 247.35, 247.814, 248.277, 248.741, 249.205,
            249.668, 250.132, 250.595, 251.059, 251.523, 251.986, 252.45
        ],
        b: [
            255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0,
            255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0,
            255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0,
            255.0, 254.615, 254.231, 253.846, 253.462, 253.077, 252.692, 252.308, 251.923, 251.538, 251.154,
            250.769, 250.385, 250.0, 249.615, 249.231, 248.846, 248.462, 248.077, 247.692, 247.308, 246.923,
            246.538, 246.154, 245.769, 245.385, 245.0, 242.0, 239.0, 236.0, 233.0, 230.0, 227.0, 224.0,
            221.0, 218.0, 215.0, 212.0, 212.0, 208.636, 205.273, 201.909, 198.545, 195.182, 191.818,
            188.455, 185.091, 181.727, 178.364, 175.0, 171.538, 168.077, 164.615, 161.154, 157.692, 154.231,
            150.769, 147.308, 143.846, 140.385, 136.923, 133.462, 130.0, 122.942, 115.885, 108.827, 101.769,
            94.7115, 87.6539, 80.5962, 73.5385, 66.4808, 59.4231, 52.3654, 45.3077, 38.25, 36.2885, 34.3269,
            32.3654, 30.4038, 28.4423, 26.4808, 24.5192, 22.5577, 20.5962, 18.6346, 16.6731, 14.7115, 12.75,
            11.7692, 10.7885, 9.80769, 8.82692, 7.84615, 6.86539, 5.88461, 4.90385, 3.92308, 2.94231,
            1.96154, 0.980769, 0.0, 2.46154, 4.92308, 7.38462, 9.84616, 12.3077, 14.7692, 17.2308, 19.6923,
            22.1538, 24.6154, 27.0769, 29.5385, 32.0, 32.0, 32.0, 32.0, 32.0, 32.0, 32.0, 32.0, 32.0, 32.0,
            32.0, 32.0, 32.0, 32.0, 41.3077, 50.6154, 59.9231, 69.2308, 78.5385, 87.8462, 97.1539, 106.462,
            115.769, 125.077, 134.385, 143.692, 153.0, 156.923, 160.846, 164.769, 168.692, 172.615, 176.538,
            180.462, 184.385, 188.308, 192.231, 196.154, 200.077, 204.0, 205.962, 207.923, 209.885, 211.846,
            213.808, 215.769, 217.731, 219.692, 221.654, 223.615, 225.577, 227.538, 229.5, 230.481, 231.462,
            232.442, 233.423, 234.404, 235.385, 236.365, 237.346, 238.327, 239.308, 240.288, 241.269,
            242.25, 242.838, 243.427, 244.015, 244.604, 245.192, 245.781, 246.369, 246.958, 247.546,
            248.135, 248.723, 249.312, 249.9, 250.096, 250.292, 250.488, 250.685, 250.881, 251.077, 251.273,
            251.469, 251.665, 251.862, 252.058, 252.254, 252.45, 252.682, 252.914, 253.145, 253.377,
            253.609, 253.841, 254.073, 254.305, 254.536, 254.768, 255.0
        ],
    },
    cmb: {
        name: 'cmb',
        r: [
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 12, 18, 24, 30, 36, 42, 48,
            54, 60, 66, 72, 78, 85, 91, 97, 103, 109, 115, 121, 127, 133, 139, 145, 151, 157, 163, 170, 176,
            182, 188, 194, 200, 206, 212, 218, 224, 230, 236, 242, 248, 255, 255, 255, 255, 255, 255, 255,
            255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
            255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
            255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
            255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 251, 247, 244, 240, 236, 233, 229, 226, 222, 218, 215, 211, 208, 204, 200, 197,
            193, 190, 186, 182, 179, 175, 172, 168, 164, 161, 157, 154, 150, 146, 143, 139, 136, 132, 128,
            125, 121, 118, 114, 110, 107, 103, 100
        ],
        g: [
            0, 2, 5, 8, 10, 13, 16, 18, 21, 24, 26, 29, 32, 34, 37, 40, 42, 45, 48, 50, 53, 56, 58, 61, 64,
            66, 69, 72, 74, 77, 80, 82, 85, 88, 90, 93, 96, 98, 101, 104, 106, 109, 112, 114, 117, 119, 122,
            124, 127, 129, 132, 134, 137, 139, 142, 144, 147, 150, 152, 155, 157, 160, 162, 165, 167, 170,
            172, 175, 177, 180, 182, 185, 188, 190, 193, 195, 198, 200, 203, 205, 208, 210, 213, 215, 218,
            221, 221, 221, 222, 222, 222, 223, 223, 224, 224, 224, 225, 225, 225, 226, 226, 227, 227, 227,
            228, 228, 229, 229, 229, 230, 230, 230, 231, 231, 232, 232, 232, 233, 233, 233, 234, 234, 235,
            235, 235, 236, 236, 237, 235, 234, 233, 231, 230, 229, 227, 226, 225, 223, 222, 221, 219, 218,
            217, 215, 214, 213, 211, 210, 209, 207, 206, 205, 203, 202, 201, 199, 198, 197, 195, 194, 193,
            191, 190, 189, 187, 186, 185, 183, 182, 181, 180, 177, 175, 172, 170, 167, 165, 162, 160, 157,
            155, 152, 150, 147, 145, 142, 140, 137, 135, 132, 130, 127, 125, 122, 120, 117, 115, 112, 110,
            107, 105, 102, 100, 97, 95, 92, 90, 87, 85, 82, 80, 77, 75, 73, 71, 69, 68, 66, 64, 62, 61, 59,
            57, 55, 54, 52, 50, 48, 47, 45, 43, 41, 40, 38, 36, 34, 33, 31, 29, 27, 26, 24, 22, 20, 19, 17,
            15, 13, 12, 10, 8, 6, 5, 3, 1, 0
        ],
        b: [
            255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
            255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
            255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
            255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
            255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 254, 253, 252, 251, 250, 249, 248, 247, 246,
            245, 245, 244, 243, 242, 241, 240, 239, 238, 237, 236, 236, 235, 234, 233, 232, 231, 230, 229,
            228, 227, 226, 226, 225, 224, 223, 222, 221, 220, 219, 218, 217, 217, 211, 206, 201, 196, 191,
            186, 181, 176, 171, 166, 161, 156, 151, 146, 141, 136, 131, 126, 121, 116, 111, 105, 100, 95,
            90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
        ],
    },
    rainbow: {
        name: 'rainbow',
        r: [
            0, 4, 9, 13, 18, 22, 27, 31, 36, 40, 45, 50, 54, 58, 61, 64, 68, 69, 72, 74, 77, 79, 80, 82, 83,
            85, 84, 86, 87, 88, 86, 87, 87, 87, 85, 84, 84, 84, 83, 79, 78, 77, 76, 71, 70, 68, 66, 60, 58,
            55, 53, 46, 43, 40, 36, 33, 25, 21, 16, 12, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 8, 12, 21, 25, 29, 33, 42, 46, 51, 55,
            63, 67, 72, 76, 80, 89, 93, 97, 101, 110, 114, 119, 123, 131, 135, 140, 144, 153, 157, 161, 165,
            169, 178, 182, 187, 191, 199, 203, 208, 212, 221, 225, 229, 233, 242, 246, 250, 255, 255, 255,
            255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
            255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
            255, 255, 255, 255, 255, 255, 255, 255
        ],
        g: [
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 8,
            16, 21, 25, 29, 38, 42, 46, 51, 55, 63, 67, 72, 76, 84, 89, 93, 97, 106, 110, 114, 119, 127,
            131, 135, 140, 144, 152, 157, 161, 165, 174, 178, 182, 187, 195, 199, 203, 208, 216, 220, 225,
            229, 233, 242, 246, 250, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
            255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
            255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
            255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
            255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
            255, 255, 255, 255, 255, 255, 255, 255, 250, 242, 238, 233, 229, 221, 216, 212, 208, 199, 195,
            191, 187, 178, 174, 170, 165, 161, 153, 148, 144, 140, 131, 127, 123, 119, 110, 106, 102, 97,
            89, 85, 80, 76, 72, 63, 59, 55, 51, 42, 38, 34, 29, 21, 17, 12, 8, 0
        ],
        b: [
            0, 3, 7, 10, 14, 19, 23, 28, 32, 38, 43, 48, 53, 59, 63, 68, 72, 77, 81, 86, 91, 95, 100, 104,
            109, 113, 118, 122, 127, 132, 136, 141, 145, 150, 154, 159, 163, 168, 173, 177, 182, 186, 191,
            195, 200, 204, 209, 214, 218, 223, 227, 232, 236, 241, 245, 250, 255, 255, 255, 255, 255, 255,
            255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
            255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
            255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 246, 242, 238, 233, 225, 220, 216, 212,
            203, 199, 195, 191, 187, 178, 174, 170, 165, 157, 152, 148, 144, 135, 131, 127, 123, 114, 110,
            106, 102, 97, 89, 84, 80, 76, 67, 63, 59, 55, 46, 42, 38, 34, 25, 21, 16, 12, 8, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
        ],
    },
    eosb: {
        name: 'eosb',
        r: [
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 9, 18, 27, 36, 45, 49, 57, 72, 81, 91, 100, 109, 118, 127, 136, 131, 139, 163, 173, 182, 191,
            200, 209, 218, 227, 213, 221, 255, 255, 255, 255, 255, 255, 255, 255, 229, 229, 255, 255, 255,
            255, 255, 255, 255, 255, 229, 229, 255, 255, 255, 255, 255, 255, 255, 255, 229, 229, 255, 255,
            255, 255, 255, 255, 255, 255, 229, 229, 255, 255, 255, 255, 255, 255, 255, 255, 229, 229, 255,
            255, 255, 255, 255, 255, 255, 255, 229, 229, 255, 255, 255, 255, 255, 255, 255, 255, 229, 229,
            255, 255, 255, 255, 255, 255, 255, 255, 229, 229, 255, 255, 255, 255, 255, 255, 255, 255, 229,
            229, 255, 253, 251, 249, 247, 245, 243, 241, 215, 214, 235, 234, 232, 230, 228, 226, 224, 222,
            198, 196, 216, 215, 213, 211, 209, 207, 205, 203, 181, 179, 197, 196, 194, 192, 190, 188, 186,
            184, 164, 162, 178, 176, 175, 173, 171, 169, 167, 165, 147, 145, 159, 157, 156, 154, 152, 150,
            148, 146, 130, 128, 140, 138, 137, 135, 133, 131, 129, 127, 113, 111, 121, 119, 117, 117
        ],
        g: [
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 7, 15, 23, 31, 39, 47, 55, 57, 64, 79, 87, 95, 103, 111, 119, 127, 135, 129, 136, 159, 167,
            175, 183, 191, 199, 207, 215, 200, 207, 239, 247, 255, 255, 255, 255, 255, 255, 229, 229, 255,
            255, 255, 255, 255, 255, 255, 255, 229, 229, 255, 255, 255, 255, 255, 255, 255, 255, 229, 229,
            255, 250, 246, 242, 238, 233, 229, 225, 198, 195, 212, 208, 204, 199, 195, 191, 187, 182, 160,
            156, 169, 165, 161, 157, 153, 148, 144, 140, 122, 118, 127, 125, 123, 121, 119, 116, 114, 112,
            99, 97, 106, 104, 102, 99, 97, 95, 93, 91, 80, 78, 84, 82, 80, 78, 76, 74, 72, 70, 61, 59, 63,
            61, 59, 57, 55, 53, 50, 48, 42, 40, 42, 40, 38, 36, 33, 31, 29, 27, 22, 21, 21, 19, 16, 14, 12,
            13, 8, 6, 3, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
        ],
        b: [
            116, 121, 127, 131, 136, 140, 144, 148, 153, 157, 145, 149, 170, 174, 178, 182, 187, 191, 195,
            199, 183, 187, 212, 216, 221, 225, 229, 233, 238, 242, 221, 225, 255, 247, 239, 231, 223, 215,
            207, 199, 172, 164, 175, 167, 159, 151, 143, 135, 127, 119, 100, 93, 95, 87, 79, 71, 63, 55, 47,
            39, 28, 21, 15, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0
        ],
    },
    cubehelix: {
        name: 'cubehelix',
        r: [
            0, 1, 3, 4, 6, 8, 9, 10, 12, 13, 14, 15, 17, 18, 19, 20, 20, 21, 22, 23, 23, 24, 24, 25, 25, 25,
            26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 25, 25, 25, 25, 24, 24, 24, 23, 23, 23, 23, 22, 22,
            22, 21, 21, 21, 21, 21, 21, 20, 20, 20, 21, 21, 21, 21, 21, 22, 22, 22, 23, 23, 24, 25, 26, 27,
            27, 28, 30, 31, 32, 33, 35, 36, 38, 39, 41, 43, 45, 47, 49, 51, 53, 55, 57, 60, 62, 65, 67, 70,
            72, 75, 78, 81, 83, 86, 89, 92, 95, 98, 101, 104, 107, 110, 113, 116, 120, 123, 126, 129, 132,
            135, 138, 141, 144, 147, 150, 153, 155, 158, 161, 164, 166, 169, 171, 174, 176, 178, 181, 183,
            185, 187, 189, 191, 193, 194, 196, 198, 199, 201, 202, 203, 204, 205, 206, 207, 208, 209, 209,
            210, 211, 211, 211, 212, 212, 212, 212, 212, 212, 212, 212, 211, 211, 211, 210, 210, 210, 209,
            208, 208, 207, 207, 206, 205, 205, 204, 203, 203, 202, 201, 201, 200, 199, 199, 198, 197, 197,
            196, 196, 195, 195, 194, 194, 194, 193, 193, 193, 193, 193, 193, 193, 193, 193, 193, 194, 194,
            195, 195, 196, 196, 197, 198, 199, 200, 200, 202, 203, 204, 205, 206, 208, 209, 210, 212, 213,
            215, 217, 218, 220, 222, 223, 225, 227, 229, 231, 232, 234, 236, 238, 240, 242, 244, 245, 247,
            249, 251, 253, 255
        ],
        g: [
            0, 0, 1, 1, 2, 2, 3, 4, 4, 5, 6, 6, 7, 8, 9, 10, 11, 11, 12, 13, 14, 15, 17, 18, 19, 20, 21, 22,
            24, 25, 26, 28, 29, 31, 32, 34, 35, 37, 38, 40, 41, 43, 45, 46, 48, 50, 52, 53, 55, 57, 58, 60,
            62, 64, 66, 67, 69, 71, 73, 74, 76, 78, 79, 81, 83, 84, 86, 88, 89, 91, 92, 94, 95, 97, 98, 99,
            101, 102, 103, 104, 106, 107, 108, 109, 110, 111, 112, 113, 114, 114, 115, 116, 116, 117, 118,
            118, 119, 119, 120, 120, 120, 121, 121, 121, 121, 122, 122, 122, 122, 122, 122, 122, 122, 122,
            122, 122, 122, 122, 122, 122, 121, 121, 121, 121, 121, 121, 121, 121, 121, 120, 120, 120, 120,
            120, 120, 120, 120, 120, 120, 121, 121, 121, 121, 121, 122, 122, 122, 123, 123, 124, 124, 125,
            125, 126, 127, 127, 128, 129, 130, 131, 131, 132, 133, 135, 136, 137, 138, 139, 140, 142, 143,
            144, 146, 147, 149, 150, 152, 154, 155, 157, 158, 160, 162, 164, 165, 167, 169, 171, 172, 174,
            176, 178, 180, 182, 183, 185, 187, 189, 191, 193, 194, 196, 198, 200, 202, 203, 205, 207, 208,
            210, 212, 213, 215, 216, 218, 219, 221, 222, 224, 225, 226, 228, 229, 230, 231, 232, 233, 235,
            236, 237, 238, 239, 240, 240, 241, 242, 243, 244, 244, 245, 246, 247, 247, 248, 248, 249, 250,
            250, 251, 251, 252, 252, 253, 253, 254, 255
        ],
        b: [
            0, 1, 3, 4, 6, 8, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39, 41, 43, 45, 47,
            48, 50, 52, 54, 56, 57, 59, 60, 62, 63, 65, 66, 67, 69, 70, 71, 72, 73, 74, 74, 75, 76, 76, 77,
            77, 77, 78, 78, 78, 78, 78, 78, 78, 77, 77, 77, 76, 76, 75, 75, 74, 73, 73, 72, 71, 70, 69, 68,
            67, 66, 66, 65, 64, 63, 61, 60, 59, 58, 58, 57, 56, 55, 54, 53, 52, 51, 51, 50, 49, 49, 48, 48,
            47, 47, 47, 46, 46, 46, 46, 46, 47, 47, 47, 48, 48, 49, 50, 50, 51, 52, 53, 55, 56, 57, 59, 60,
            62, 64, 65, 67, 69, 71, 74, 76, 78, 81, 83, 86, 88, 91, 94, 96, 99, 102, 105, 108, 111, 114,
            117, 120, 124, 127, 130, 133, 136, 140, 143, 146, 149, 153, 156, 159, 162, 165, 169, 172, 175,
            178, 181, 184, 186, 189, 192, 195, 197, 200, 203, 205, 207, 210, 212, 214, 216, 218, 220, 222,
            224, 226, 227, 229, 230, 231, 233, 234, 235, 236, 237, 238, 239, 239, 240, 241, 241, 242, 242,
            242, 243, 243, 243, 243, 243, 243, 243, 243, 243, 243, 242, 242, 242, 242, 241, 241, 241, 241,
            240, 240, 240, 239, 239, 239, 239, 239, 238, 238, 238, 238, 238, 238, 238, 238, 239, 239, 239,
            240, 240, 240, 241, 242, 242, 243, 244, 245, 246, 247, 248, 249, 250, 252, 253, 255
        ]
    },
    hot: {
        name: 'hot',
        r: [
            0.0, 4.0, 8.0, 12.0, 16.0, 20.0, 24.0, 28.0, 32.0, 36.0, 40.0, 44.0, 48.0, 52.0, 56.0, 60.0,
            64.0, 68.0, 72.0, 76.0, 80.0, 84.0, 88.0, 92.0, 96.0, 100.0, 104.0, 108.0, 112.0, 116.0,
            120.0, 124.0, 128.0, 132.0, 136.0, 140.0, 144.0, 148.0, 152.0, 156.0, 160.0, 164.0, 168.0,
            172.0, 176.0, 180.0, 184.0, 188.0, 192.0, 196.0, 200.0, 204.0, 208.0, 212.0, 216.0, 220.0,
            224.0, 228.0, 232.0, 236.0, 240.0, 244.0, 248.0, 252.0, 255.0, 255.0, 255.0, 255.0, 255.0,
            255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0,
            255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0,
            255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0,
            255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0,
            255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0,
            255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0,
            255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0
        ],
        g: [
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 2.30769,
            4.61538, 6.92308, 9.23077, 11.5385, 13.8462, 16.1538, 18.4615, 20.7692, 23.0769, 25.3846, 27.6923,
            30.0, 32.3077, 34.6154, 36.9231, 39.2308, 41.5385, 43.8462, 46.1538, 48.4615, 50.7692, 53.0769,
            55.3846, 57.6923, 60.0, 62.3077, 64.6154, 66.9231, 69.2308, 71.5385, 73.8462, 76.1538, 78.4615,
            80.7692, 83.0769, 85.3846, 87.6923, 90.0, 92.3077, 94.6154, 96.9231, 99.2308, 101.538, 103.846, 106.154,
            108.462, 110.769, 113.077, 115.385, 117.692, 120.0, 122.308, 124.615, 126.923, 129.231, 131.538,
            133.846, 136.154, 138.462, 140.769, 143.077, 145.385, 147.692, 150.0, 152.308, 154.615, 156.923,
            159.231, 161.538, 163.846, 166.154, 168.462, 170.769, 173.077, 175.385, 177.692, 180.0, 182.308,
            184.615, 186.923, 189.231, 191.538, 193.846, 196.154, 198.462, 200.769, 203.077, 205.385,
            207.692, 210.0, 212.308, 214.615, 216.923, 219.231, 221.538, 223.846, 226.154, 228.462, 230.769,
            233.077, 235.385, 237.692, 240.0, 242.308, 244.615, 246.923, 249.231, 251.538, 253.846, 255.0,
            255.0, 255.0, 255.0, 255.0, 255.0, 255.0
        ],
        b: [
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.980769,
            1.96154, 2.94231, 3.92308, 4.90385, 5.88461, 6.86539, 7.84615, 8.82692, 9.80769, 10.7885, 11.7692, 12.75,
            13.7308, 14.7115, 15.6923, 16.6731, 17.6538, 18.6346, 19.6154, 20.5962, 21.5769, 22.5577, 23.5385,
            24.5192, 25.5, 26.4808, 27.4615, 28.4423, 29.4231, 30.4038, 31.3846, 32.3654, 33.3462, 34.3269,
            35.3077, 36.2885, 37.2692, 38.25, 39.2308, 40.2115, 41.1923, 42.1731, 43.1538, 44.1346, 45.1154, 46.0962,
            47.0769, 48.0577, 49.0385, 50.0192, 51.0, 51.9808, 52.9615, 53.9423, 54.9231, 55.9038, 56.8846,
            57.8654, 58.8462, 59.8269, 60.8077, 61.7885, 62.7692, 63.75, 64.7308, 65.7115, 66.6923, 67.6731,
            68.6538, 69.6346, 70.6154, 71.5962, 72.5769, 73.5577, 74.5385, 75.5192, 76.5, 77.4808, 78.4615, 79.4423,
            80.4231, 81.4038, 82.3846, 83.3654, 84.3462, 85.3269, 86.3077, 87.2885, 88.2692, 89.25, 90.2308,
            91.2115, 92.1923, 93.1731, 94.1538, 95.1346, 96.1154, 97.0962, 98.0769, 99.0577, 100.038,
            101.019, 102.0, 102.981, 103.962, 104.942, 105.923, 106.904, 107.885, 108.865, 109.846, 110.827,
            111.808, 112.788, 113.769, 114.75, 115.731, 116.711, 117.692, 118.673, 119.654, 120.634,
            121.615, 122.596, 123.577, 124.557, 125.538, 126.519, 127.5
        ]
    },
    gray: {
        name: 'gray',
        r: [
            0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
            25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46,
            47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66,
            67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88,
            89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107,
            108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123,
            124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138,
            139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152,
            153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164,
            165, 166, 167, 168, 169, 170, 171, 172,
            173, 174, 175, 176, 177,
            178, 179,
            180,
            181,
            182,
            183,
            184,
            185,
            186,
            187,
            188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200,
            201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212,
            213, 214, 215, 216, 217, 218, 219, 220,
            221, 222,
            223,
            224,
            225,
            226,
            227,
            228,
            229,
            230,
            231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242,
            243, 244, 245, 246, 247, 248, 249, 250,
            251,
            252,
            253,
            254,
            255
        ],
        g: [
            0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
            25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45,
            46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56,
            57,
            58,
            59,
            60,
            61,
            62,
            63,
            64,
            65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82,
            83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94,
            95,
            96,
            97,
            98,
            99,
            100,
            101,
            102,
            103,
            104,
            105, 106, 107, 108, 109, 110, 111, 112, 113, 114,
            115,
            116,
            117,
            118,
            119,
            120,
            121,
            122,
            123,
            124,
            125, 126, 127, 128, 129, 130, 131, 132, 133, 134,
            135,
            136,
            137,
            138,
            139,
            140,
            141,
            142,
            143,
            144,
            145, 146, 147, 148, 149, 150, 151, 152, 153, 154,
            155,
            156,
            157,
            158,
            159,
            160,
            161,
            162,
            163,
            164,
            165, 166, 167, 168, 169, 170, 171, 172, 173, 174,
            175,
            176,
            177,
            178,
            179,
            180,
            181,
            182,
            183,
            184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196,
            197, 198, 199, 200, 201, 202, 203, 204, 205, 206,
            207,
            208,
            209,
            210,
            211,
            212,
            213,
            214,
            215,
            216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227,
            228, 229, 230, 231, 232, 233, 234, 235, 236, 237,
            238,
            239,
            240,
            241,
            242,
            243,
            244,
            245,
            246,
            247, 248, 249, 250,
            251,
            252,
            253,
            254,
            255
        ],
        b: [
            0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58,
            59,
            60,
            61,
            62,
            63,
            64,
            65,
            66,
            67,
            68,
            69,
            70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88,
            89,
            90,
            91,
            92,
            93,
            94,
            95,
            96,
            97,
            98,
            99,
            100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116,
            117,
            118,
            119,
            120,
            121,
            122,
            123,
            124,
            125,
            126,
            127,
            128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144,
            145,
            146,
            147,
            148,
            149,
            150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164,
            165,
            166,
            167,
            168,
            169,
            170,
            171,
            172,
            173,
            174,
            175,
            176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192,
            193,
            194,
            195,
            196,
            197,
            198,
            199,
            200,
            201,
            202,
            203,
            204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220,
            221,
            222,
            223,
            224,
            225,
            226,
            227,
            228,
            229,
            230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240,
            241,
            242,
            243,
            244,
            245,
            246,
            247,
            248,
            249,
            250,
            251,
            252,
            253,
            254,
            255
        ]
    },
};
/* harmony default export */ const model_ColorMaps = (ColorMaps);

;// ./src/model/hips/AncestorTile.ts





class AncestorTile {
    _hips;
    _tileno;
    _baseurl;
    _order;
    _ready = false;
    _format;
    _isGalacticHips;
    opacity = 1.0;
    _hipsShaderIndex = 0;
    _pixels = [];
    _texture = null;
    _image;
    _texurl = '';
    vertexPosition;
    vertexPositionBuffer;
    vertexIndices;
    vertexIndexBuffer;
    constructor(tileno, order, hips) {
        this._hips = hips;
        this._tileno = tileno;
        this._format = hips.format;
        this._baseurl = hips.baseURL;
        this._isGalacticHips = hips.isGalacticHips;
        this._order = order;
        this.initImage();
    }
    // Kept for API parity; there is no interval created in this class.
    destroyIntervals() {
        // no-op
    }
    initImage() {
        const dirnumber = Math.floor(this._tileno / 10000) * 10000;
        this._texurl = `${this._baseurl}/Norder${this._order}/Dir${dirnumber}/Npix${this._tileno}.${this._format}`;
        this._image = new Image();
        this._image.onload = () => this.imageLoaded();
        this._image.onerror = () => {
            console.error('File not found? %s', this._texurl);
        };
        this._image.crossOrigin = 'anonymous';
        // If you ever need FITS handling, call this.loadImage() instead.
        this._image.src = this._texurl;
    }
    imageLoaded() {
        this.textureLoaded();
        this.initModelBuffer();
        const gl = src_Global.gl;
        gl.activeTexture(gl.TEXTURE0 + this._hipsShaderIndex);
        gl.bindTexture(gl.TEXTURE_2D, this._texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._image);
        this._ready = true;
    }
    textureLoaded() {
        hipsShaderProgram.enableProgram();
        const gl = src_Global.gl;
        this._texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + this._hipsShaderIndex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.bindTexture(gl.TEXTURE_2D, this._texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.uniform1i(hipsShaderProgram.shaderProgram.samplerUniform, this._hipsShaderIndex);
        if (!gl.isTexture(this._texture)) {
            console.log('error in texture');
        }
    }
    initModelBuffer() {
        const gl = src_Global.gl;
        this.vertexPosition = [];
        this.vertexPositionBuffer = [];
        this.vertexIndices = new Uint16Array();
        // this.vertexIndexBuffer created later
        const reforder = fovHelper.getRefOrder(this._order);
        const orighealpix = src_Global.getHealpix(this._order);
        const origxyf = orighealpix.nest2xyf(this._tileno);
        const orderjump = reforder - this._order;
        const dxmin = origxyf.ix << orderjump;
        const dxmax = (origxyf.ix << orderjump) + (1 << orderjump);
        const dymin = origxyf.iy << orderjump;
        const dymax = (origxyf.iy << orderjump) + (1 << orderjump);
        const healpix = src_Global.getHealpix(reforder);
        this._pixels = [];
        // Using getBoundaries (like the JS source)
        this.setupPositionAndTexture4Quadrant(dxmin, dxmax / 2, dymin, dymax / 2, 0, healpix, orderjump, origxyf);
        this.setupPositionAndTexture4Quadrant(dxmax / 2, dxmax, dymin, dymax / 2, 1, healpix, orderjump, origxyf);
        this.setupPositionAndTexture4Quadrant(dxmin, dxmax / 2, dymax / 2, dymax, 2, healpix, orderjump, origxyf);
        this.setupPositionAndTexture4Quadrant(dxmax / 2, dxmax, dymax / 2, dymax, 3, healpix, orderjump, origxyf);
        const pixelsXQuadrant = this.vertexPosition[0].length / 20;
        this.vertexIndices = this.computeVertexIndices(pixelsXQuadrant);
        this.vertexIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndices, gl.STATIC_DRAW);
    }
    computeVertexIndices(pixelsXQuadrant) {
        const vertexIndices = new Uint16Array(6 * pixelsXQuadrant);
        let baseFaceIndex = 0;
        for (let j = 0; j < pixelsXQuadrant; j++) {
            vertexIndices[6 * j] = baseFaceIndex;
            vertexIndices[6 * j + 1] = baseFaceIndex + 1;
            vertexIndices[6 * j + 2] = baseFaceIndex + 2;
            vertexIndices[6 * j + 3] = baseFaceIndex + 2;
            vertexIndices[6 * j + 4] = baseFaceIndex + 3;
            vertexIndices[6 * j + 5] = baseFaceIndex;
            baseFaceIndex += 4;
        }
        return vertexIndices;
    }
    // Version that uses getPointsForXyfNoStep (kept for reference; not used in this class)
    setupPositionAndTexture4Quadrant2(dxmin, dxmax, dymin, dymax, qidx, healpix, orderjump, origxyf) {
        const gl = src_Global.gl;
        this.vertexPosition[qidx] = new Float32Array(20 * (dxmax - dxmin) * (dymax - dymin));
        const step = 1 / (1 << orderjump);
        let p = 0;
        for (let dx = dxmin; dx < dxmax; dx++) {
            for (let dy = dymin; dy < dymax; dy++) {
                const facesVec3Array = healpix.getPointsForXyfNoStep(dx, dy, origxyf.face);
                const uindex = dy - (origxyf.iy << orderjump);
                const vindex = dx - (origxyf.ix << orderjump);
                this.vertexPosition[qidx][20 * p] = facesVec3Array[0].x;
                this.vertexPosition[qidx][20 * p + 1] = facesVec3Array[0].y;
                this.vertexPosition[qidx][20 * p + 2] = facesVec3Array[0].z;
                this.vertexPosition[qidx][20 * p + 3] = step + step * uindex;
                this.vertexPosition[qidx][20 * p + 4] = 1 - (step + step * vindex);
                this.vertexPosition[qidx][20 * p + 5] = facesVec3Array[1].x;
                this.vertexPosition[qidx][20 * p + 6] = facesVec3Array[1].y;
                this.vertexPosition[qidx][20 * p + 7] = facesVec3Array[1].z;
                this.vertexPosition[qidx][20 * p + 8] = step + step * uindex;
                this.vertexPosition[qidx][20 * p + 9] = 1 - step * vindex;
                this.vertexPosition[qidx][20 * p + 10] = facesVec3Array[2].x;
                this.vertexPosition[qidx][20 * p + 11] = facesVec3Array[2].y;
                this.vertexPosition[qidx][20 * p + 12] = facesVec3Array[2].z;
                this.vertexPosition[qidx][20 * p + 13] = step * uindex;
                this.vertexPosition[qidx][20 * p + 14] = 1 - step * vindex;
                this.vertexPosition[qidx][20 * p + 15] = facesVec3Array[3].x;
                this.vertexPosition[qidx][20 * p + 16] = facesVec3Array[3].y;
                this.vertexPosition[qidx][20 * p + 17] = facesVec3Array[3].z;
                this.vertexPosition[qidx][20 * p + 18] = step * uindex;
                this.vertexPosition[qidx][20 * p + 19] = 1 - (step + step * vindex);
                p++;
            }
        }
        this.vertexPositionBuffer[qidx] = src_Global.gl.createBuffer();
        src_Global.gl.bindBuffer(src_Global.gl.ARRAY_BUFFER, this.vertexPositionBuffer[qidx]);
        src_Global.gl.bufferData(src_Global.gl.ARRAY_BUFFER, this.vertexPosition[qidx], src_Global.gl.STATIC_DRAW);
    }
    // Version used by the original JS, collecting _pixels via xyf2nest + getBoundaries
    setupPositionAndTexture4Quadrant(dxmin, dxmax, dymin, dymax, qidx, healpix, orderjump, origxyf) {
        const gl = src_Global.gl;
        this.vertexPosition[qidx] = new Float32Array(20 * (dxmax - dxmin) * (dymax - dymin));
        const step = 1 / (1 << orderjump);
        let p = 0;
        for (let dx = dxmin; dx < dxmax; dx++) {
            for (let dy = dymin; dy < dymax; dy++) {
                const ipix3 = healpix.xyf2nest(dx, dy, origxyf.face);
                this._pixels.push(ipix3);
                const facesVec3Array = healpix.getBoundaries(ipix3);
                const uindex = dy - (origxyf.iy << orderjump);
                const vindex = dx - (origxyf.ix << orderjump);
                this.vertexPosition[qidx][20 * p] = facesVec3Array[0].x;
                this.vertexPosition[qidx][20 * p + 1] = facesVec3Array[0].y;
                this.vertexPosition[qidx][20 * p + 2] = facesVec3Array[0].z;
                this.vertexPosition[qidx][20 * p + 3] = step + step * uindex;
                this.vertexPosition[qidx][20 * p + 4] = 1 - (step + step * vindex);
                this.vertexPosition[qidx][20 * p + 5] = facesVec3Array[1].x;
                this.vertexPosition[qidx][20 * p + 6] = facesVec3Array[1].y;
                this.vertexPosition[qidx][20 * p + 7] = facesVec3Array[1].z;
                this.vertexPosition[qidx][20 * p + 8] = step + step * uindex;
                this.vertexPosition[qidx][20 * p + 9] = 1 - step * vindex;
                this.vertexPosition[qidx][20 * p + 10] = facesVec3Array[2].x;
                this.vertexPosition[qidx][20 * p + 11] = facesVec3Array[2].y;
                this.vertexPosition[qidx][20 * p + 12] = facesVec3Array[2].z;
                this.vertexPosition[qidx][20 * p + 13] = step * uindex;
                this.vertexPosition[qidx][20 * p + 14] = 1 - step * vindex;
                this.vertexPosition[qidx][20 * p + 15] = facesVec3Array[3].x;
                this.vertexPosition[qidx][20 * p + 16] = facesVec3Array[3].y;
                this.vertexPosition[qidx][20 * p + 17] = facesVec3Array[3].z;
                this.vertexPosition[qidx][20 * p + 18] = step * uindex;
                this.vertexPosition[qidx][20 * p + 19] = 1 - (step + step * vindex);
                p++;
            }
        }
        this.vertexPositionBuffer[qidx] = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer[qidx]);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertexPosition[qidx], gl.STATIC_DRAW);
    }
    draw(visibleOrder, visibleTilesMap, pMatrix, vMatrix, mMatrix, colorMapIdx) {
        if (!this._ready)
            return false;
        let quadrantsToDraw = new Set([0, 1, 2, 3]);
        if (visibleOrder > this._order) {
            const q = this.drawChildren(visibleOrder, visibleTilesMap, pMatrix, vMatrix, mMatrix, colorMapIdx);
            if (q)
                quadrantsToDraw = q;
        }
        hipsShaderProgram.enableShaders(pMatrix, vMatrix, mMatrix, colorMapIdx);
        const gl = src_Global.gl;
        gl.enableVertexAttribArray(hipsShaderProgram.locations.vertexPositionAttribute);
        gl.enableVertexAttribArray(hipsShaderProgram.locations.textureCoordAttribute);
        gl.activeTexture(gl.TEXTURE0 + this._hipsShaderIndex);
        gl.bindTexture(gl.TEXTURE_2D, this._texture);
        gl.uniform1f(hipsShaderProgram.locations.textureAlpha, this.opacity);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
        const elemno = this.vertexIndices.length;
        quadrantsToDraw.forEach((qidx) => {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer[qidx]);
            gl.vertexAttribPointer(hipsShaderProgram.locations.vertexPositionAttribute, 3, gl.FLOAT, false, 5 * 4, 0);
            gl.vertexAttribPointer(hipsShaderProgram.locations.textureCoordAttribute, 2, gl.FLOAT, false, 5 * 4, 3 * 4);
            gl.drawElements(gl.TRIANGLES, elemno, gl.UNSIGNED_SHORT, 0);
        });
        gl.disableVertexAttribArray(hipsShaderProgram.locations.vertexPositionAttribute);
        gl.disableVertexAttribArray(hipsShaderProgram.locations.textureCoordAttribute);
        return true;
    }
    drawChildren(visibleOrder, visibleTilesMap, pMatrix, vMatrix, mMatrix, colorMapIdx) {
        const quadrantsToDraw = new Set([0, 1, 2, 3]);
        const childrenOrder = this._order + 1;
        if (!visibleTilesMap.has(childrenOrder))
            return;
        for (let c = 0; c < 4; c++) {
            const childTileNo = (this._tileno << 2) + c;
            const visibleChildren = visibleTilesMap.get(childrenOrder);
            if (visibleChildren.includes(childTileNo)) {
                const childTile = this._isGalacticHips
                    ? newTileBuffer.getGalTile(childTileNo, childrenOrder, this._hips)
                    : newTileBuffer.getTile(childTileNo, childrenOrder, this._hips);
                childTile.draw(visibleOrder, visibleTilesMap, pMatrix, vMatrix, mMatrix, colorMapIdx);
                if (childTile._ready) {
                    quadrantsToDraw.delete(childTile._tileno - (this._tileno << 2));
                }
            }
        }
        return quadrantsToDraw;
    }
}
/* harmony default export */ const hips_AncestorTile = (AncestorTile);

;// ./src/model/hips/AllSky.ts




class AllSky {
    _ready = false;
    _hips;
    _format;
    _baseurl;
    _isGalacticHips;
    _order = 3;
    opacity = 1.0;
    _hipsShaderIndex = 0;
    _texture = null;
    _image;
    _texurl;
    _textureLoaded = false;
    _maxTiles = 0;
    _numFacesXTile = 0;
    _numFaces = 0;
    vertexPosition;
    vertexPositionBuffer;
    vertexIndexBuffer;
    vidx = 0;
    constructor(hips) {
        this._hips = hips;
        this._format = hips.format;
        this._baseurl = hips.baseURL;
        this._isGalacticHips = hips.isGalacticHips;
        this.initImage();
    }
    initImage() {
        this._image = new Image();
        this._texurl = `${this._baseurl}/Norder3/Allsky.${this._format}`;
        this._image.onload = () => this.imageLoaded();
        this._image.onerror = () => {
            console.error('File not found? %s', this._texurl);
        };
        this._image.setAttribute('crossorigin', 'anonymous');
        this._image.src = this._texurl;
    }
    imageLoaded() {
        this.textureLoaded();
        this.initModelBuffer();
        this._textureLoaded = true;
        this._ready = true;
    }
    textureLoaded() {
        hipsShaderProgram.enableProgram();
        const gl = src_Global.gl;
        this._texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + this._hipsShaderIndex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.bindTexture(gl.TEXTURE_2D, this._texture);
        // gl.uniform1i(hipsShaderProgram.shaderProgram.samplerUniform, this._hipsShaderIndex)
        if (!gl.isTexture(this._texture)) {
            console.log('error in texture');
        }
        gl.activeTexture(gl.TEXTURE0 + this._hipsShaderIndex);
        gl.bindTexture(gl.TEXTURE_2D, this._texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        const useMipmaps = true;
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, useMipmaps ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
        // MAG filter: ONLY NEAREST or LINEAR are valid
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR_MIPMAP_LINEAR)
        // gl.generateMipmap(gl.TEXTURE_2D)
        if (useMipmaps)
            gl.generateMipmap(gl.TEXTURE_2D);
    }
    initModelBuffer() {
        const gl = src_Global.gl;
        const hpx = src_Global.getHealpix(this._order);
        this._maxTiles = hpx.getNPix();
        const orderjump = 1;
        const tgtHpxOrder = this._order + orderjump;
        const healpix = src_Global.getHealpix(this._order);
        const tgtHealpix = src_Global.getHealpix(tgtHpxOrder);
        this._numFacesXTile = 4 ** orderjump; // used in gl.draw
        this._numFaces = this._numFacesXTile * this._maxTiles;
        this.vertexPosition = new Float32Array(20 * this._numFaces);
        let sindex = 0;
        let tindex = 0;
        this.vidx = 0;
        for (let t = 0; t < this._maxTiles; t++) {
            const xyf = healpix.nest2xyf(t);
            const dxmin = xyf.ix << orderjump;
            const dxmax = (xyf.ix << orderjump) + (1 << orderjump);
            const dymin = xyf.iy << orderjump;
            const dymax = (xyf.iy << orderjump) + (1 << orderjump);
            this.setupPositionAndTexture4Quadrant(sindex, tindex, dxmin, dxmin + (dxmax - dxmin) / 2, dymin, dymin + (dymax - dymin) / 2, tgtHealpix, xyf, 0, 0);
            this.setupPositionAndTexture4Quadrant(sindex, tindex, dxmin + (dxmax - dxmin) / 2, dxmax, dymin, dymin + (dymax - dymin) / 2, tgtHealpix, xyf, 0, 1);
            this.setupPositionAndTexture4Quadrant(sindex, tindex, dxmin, dxmin + (dxmax - dxmin) / 2, dymin + (dymax - dymin) / 2, dymax, tgtHealpix, xyf, 1, 0);
            this.setupPositionAndTexture4Quadrant(sindex, tindex, dxmin + (dxmax - dxmin) / 2, dxmax, dymin + (dymax - dymin) / 2, dymax, tgtHealpix, xyf, 1, 1);
            sindex++;
            if (sindex === 27) {
                tindex++;
                sindex = 0;
            }
        }
        const vertexIndices = new Uint16Array(6 * this._numFaces);
        let baseFaceIndex = 0;
        for (let i = 0; i < this._numFaces; i++) {
            vertexIndices[6 * i] = baseFaceIndex;
            vertexIndices[6 * i + 1] = baseFaceIndex + 1;
            vertexIndices[6 * i + 2] = baseFaceIndex + 3;
            vertexIndices[6 * i + 3] = baseFaceIndex + 1;
            vertexIndices[6 * i + 4] = baseFaceIndex + 2;
            vertexIndices[6 * i + 5] = baseFaceIndex + 3;
            baseFaceIndex += 4;
        }
        this.vertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertexPosition, gl.STATIC_DRAW);
        this.vertexIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, vertexIndices, gl.STATIC_DRAW);
    }
    setupPositionAndTexture4Quadrant(sindex, tindex, dxmin, dxmax, dymin, dymax, tgthealpix, xyf, qx, qy) {
        let facesVec3Array = [];
        const factor = 2 ** (tgthealpix.order - 3);
        const s_step = 1 / (27 * factor); // 0.037037037...
        const t_step = 1 / (29 * factor); // 0.034482759...
        const s_pixel_size = s_step / 64;
        const t_pixel_size = t_step / 64;
        const base_s = factor * s_step * sindex + s_step * qx;
        const base_t = factor * t_step * tindex + t_step * qy;
        for (let dx = dxmin; dx < dxmax; dx++) {
            for (let dy = dymin; dy < dymax; dy++) {
                facesVec3Array = tgthealpix.getPointsForXyfNoStep(dx, dy, xyf.face);
                // bottom right
                this.vertexPosition[20 * this.vidx] = facesVec3Array[0].x;
                this.vertexPosition[20 * this.vidx + 1] = facesVec3Array[0].y;
                this.vertexPosition[20 * this.vidx + 2] = facesVec3Array[0].z;
                this.vertexPosition[20 * this.vidx + 3] = s_step + base_s - s_pixel_size;
                this.vertexPosition[20 * this.vidx + 4] = 1 - (t_step + base_t) + t_pixel_size;
                // top right
                this.vertexPosition[20 * this.vidx + 5] = facesVec3Array[1].x;
                this.vertexPosition[20 * this.vidx + 6] = facesVec3Array[1].y;
                this.vertexPosition[20 * this.vidx + 7] = facesVec3Array[1].z;
                this.vertexPosition[20 * this.vidx + 8] = s_step + base_s - s_pixel_size;
                this.vertexPosition[20 * this.vidx + 9] = 1 - base_t - t_pixel_size;
                // top left
                this.vertexPosition[20 * this.vidx + 10] = facesVec3Array[2].x;
                this.vertexPosition[20 * this.vidx + 11] = facesVec3Array[2].y;
                this.vertexPosition[20 * this.vidx + 12] = facesVec3Array[2].z;
                this.vertexPosition[20 * this.vidx + 13] = base_s + s_pixel_size;
                this.vertexPosition[20 * this.vidx + 14] = 1 - base_t - t_pixel_size;
                // bottom left
                this.vertexPosition[20 * this.vidx + 15] = facesVec3Array[3].x;
                this.vertexPosition[20 * this.vidx + 16] = facesVec3Array[3].y;
                this.vertexPosition[20 * this.vidx + 17] = facesVec3Array[3].z;
                this.vertexPosition[20 * this.vidx + 18] = base_s + s_pixel_size;
                this.vertexPosition[20 * this.vidx + 19] = 1 - (t_step + base_t) + t_pixel_size;
                this.vidx++;
            }
        }
    }
    /**
     * Renders the all-sky layer and, when available, delegates to higher-resolution child tiles.
     * Returns `true` if it attempted to draw (ready), `false` if still not ready.
     */
    draw(visibleOrder, visibleTilesMap, pMatrix, vMatrix, mMatrix, colorMapIdx) {
        if (!this._ready)
            return false;
        let allSkyTiles2Skip = [];
        if (visibleOrder >= this._order) {
            const skipped = this.drawChildren(visibleOrder, visibleTilesMap, pMatrix, vMatrix, mMatrix, colorMapIdx);
            if (skipped)
                allSkyTiles2Skip = skipped;
        }
        const gl = src_Global.gl;
        hipsShaderProgram.enableShaders(pMatrix, vMatrix, mMatrix, colorMapIdx);
        gl.enableVertexAttribArray(hipsShaderProgram.locations.vertexPositionAttribute);
        gl.enableVertexAttribArray(hipsShaderProgram.locations.textureCoordAttribute);
        gl.activeTexture(gl.TEXTURE0 + this._hipsShaderIndex);
        gl.bindTexture(gl.TEXTURE_2D, this._texture);
        gl.uniform1f(hipsShaderProgram.locations.textureAlpha, this.opacity);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
        gl.vertexAttribPointer(hipsShaderProgram.locations.vertexPositionAttribute, 3, gl.FLOAT, false, 5 * 4, 0);
        gl.vertexAttribPointer(hipsShaderProgram.locations.textureCoordAttribute, 2, gl.FLOAT, false, 5 * 4, 3 * 4);
        for (let t = 0; t < this._maxTiles; t++) {
            if (!allSkyTiles2Skip.includes(t)) {
                gl.drawElements(gl.TRIANGLES, 6 * this._numFacesXTile, gl.UNSIGNED_SHORT, 12 * t * this._numFacesXTile);
            }
        }
        gl.disableVertexAttribArray(hipsShaderProgram.locations.vertexPositionAttribute);
        gl.disableVertexAttribArray(hipsShaderProgram.locations.textureCoordAttribute);
        return true;
    }
    drawChildren(visibleOrder, visibleTilesMap, pMatrix, vMatrix, mMatrix, colorMapIdx) {
        const childrenOrder = this._order;
        if (!visibleTilesMap.has(childrenOrder))
            return;
        const visibleTiles = visibleTilesMap.get(childrenOrder);
        const allSkyTiles2Skip = [];
        for (let i = 0; i < visibleTiles.length; i++) {
            const tileno = visibleTiles[i];
            const childTile = this._isGalacticHips
                ? newTileBuffer.getGalTile(tileno, childrenOrder, this._hips)
                : newTileBuffer.getTile(tileno, childrenOrder, this._hips);
            childTile.draw(visibleOrder, visibleTilesMap, pMatrix, vMatrix, mMatrix, colorMapIdx);
            if (childTile.getReadyState()) {
                allSkyTiles2Skip.push(tileno);
            }
        }
        return allSkyTiles2Skip;
    }
}

;// ./src/model/hips/HiPS.ts

/**
 * @author Fabrizio Giordano (Fab77)
 */











class HiPS extends model_AbstractSkyEntity {
    _ancestorTiles;
    _allSkyTile;
    _format;
    _baseurl;
    _maxorder;
    _minorder;
    _visibleorder = 3;
    _allSky = true;
    samplerIdx = 0;
    colorMapIdx = 0;
    colorMap = model_ColorMaps['native'];
    // exposed read-only helpers
    get maxOrder() { return this._maxorder; }
    get minOrder() { return this._minorder; }
    get baseURL() { return this._baseurl; }
    get format() { return this._format; }
    constructor(radius, position, xrad, yrad, descriptor) {
        super(radius, position, xrad, yrad, descriptor.surveyName, descriptor.isGalactic);
        this.initGL(src_Global.gl);
        newTileBuffer.addHiPS(this);
        // DEBUG logs kept from JS (optional)
        // eslint-disable-next-line no-console
        console.log('HiPS frame ' + descriptor.hipsFrame);
        // eslint-disable-next-line no-console
        console.log('HiPS minOrder ' + descriptor.minOrder);
        this._format = descriptor.imgFormats[0];
        this._baseurl = descriptor.url;
        this._maxorder = descriptor.maxOrder;
        this._minorder = descriptor.minOrder;
        this.initShaders();
        // pick initial order from a starting FoV
        const fov = 180;
        let order = fovHelper.getHiPSNorder(fov);
        this._visibleorder = Math.min(order, this._maxorder);
        this._ancestorTiles = [];
        this._allSkyTile = null;
        // auto-detect all-sky: original code forces true
        this._allSky = true;
        if (this._allSky) {
            this._allSkyTile = new AllSky(this);
        }
        else {
            for (let t = 0; t < 12; t++) {
                this._ancestorTiles.push(new hips_AncestorTile(t, 0, this));
            }
        }
    }
    changeFormat(format) {
        this._format = format;
        // original code referenced _tileBuffer; if you have one, wire it back.
        // Keeping calls no-op to avoid breaking at runtime if _tileBuffer is undefined.
        // (newVisibleTilesManager + TileBuffer drive the actual tile lifecycle)
        // @ts-ignore
        if (this._tileBuffer?.clearAll)
            this._tileBuffer.clearAll();
        // @ts-ignore
        if (this._tileBuffer)
            this._tileBuffer._format = this._format;
        const pixelByOrder = this.isGalacticHips
            ? visibleTilesManager.galVisibleTilesByOrder
            : visibleTilesManager.visibleTilesByOrder;
        // @ts-ignore
        if (this._tileBuffer?.updateTiles)
            this._tileBuffer.updateTiles(pixelByOrder.pixels, pixelByOrder.order);
    }
    /**
     * Shader colormap switcher
     * 0 -> native
     * 1 -> grayscale
     * 2 -> planck
     * 3 -> cmb
     * 4 -> rainbow
     * 5 -> eosb
     * 6 -> cubehelix
     */
    changeColorMap(colorMap) {
        this.colorMap = colorMap;
        switch (colorMap.name) {
            case 'grayscale':
                this.colorMapIdx = 1;
                hipsShaderProgram.setGrayscaleShader();
                break;
            case 'planck':
                this.colorMapIdx = 2;
                hipsShaderProgram.setColorMapShader();
                break;
            case 'cmb':
                this.colorMapIdx = 3;
                hipsShaderProgram.setColorMapShader();
                break;
            case 'rainbow':
                this.colorMapIdx = 4;
                hipsShaderProgram.setColorMapShader();
                break;
            case 'eosb':
                this.colorMapIdx = 5;
                hipsShaderProgram.setColorMapShader();
                break;
            case 'cubehelix':
                this.colorMapIdx = 6;
                hipsShaderProgram.setColorMapShader();
                break;
            default:
                this.colorMapIdx = 0;
                hipsShaderProgram.setNativeShader();
        }
    }
    initShaders() {
        hipsShaderProgram.enableProgram();
        this.shaderProgram = hipsShaderProgram.shaderProgram;
    }
    getCurrentHealpixOrder() {
        return this._visibleorder;
    }
    refresh() {
        const fov = grid_HealpixGridSingleton.getMinFoV();
        this._visibleorder = Math.min(fovHelper.getHiPSNorder(fov), this._maxorder);
    }
    draw() {
        if (!src_Global.camera || src_Global.camera.getCameraMatrix() === undefined)
            return;
        this.refresh();
        const vMatrix = src_Global.camera.getCameraMatrix();
        const pMatrix = ComputePerspectiveMatrix.pMatrix;
        const mMatrix = this.getModelMatrix();
        if (this._allSky && this._allSkyTile) {
            if (this.isGalacticHips) {
                this._allSkyTile.draw(visibleTilesManager.galVisibleTilesByOrder.order, visibleTilesManager.galAncestorsMap, pMatrix, vMatrix, mMatrix, this.colorMapIdx);
            }
            else {
                this._allSkyTile.draw(visibleTilesManager.visibleTilesByOrder.order, visibleTilesManager.ancestorsMap, pMatrix, vMatrix, mMatrix, this.colorMapIdx);
            }
            return;
        }
        // Non all-sky path
        const order = this.isGalacticHips
            ? visibleTilesManager.galVisibleTilesByOrder.order
            : visibleTilesManager.visibleTilesByOrder.order;
        const map = this.isGalacticHips
            ? visibleTilesManager.galAncestorsMap
            : visibleTilesManager.ancestorsMap;
        this._ancestorTiles.forEach((ancestor) => {
            ancestor.draw(order, map, pMatrix, vMatrix, mMatrix, this.colorMapIdx);
        });
    }
}
/* harmony default export */ const hips_HiPS = (HiPS);

;// ./src/model/tap/TapMetadata.ts

/**
 * @author Fabrizio Giordano (Fab77)
 */
class TapMetadata {
    _name;
    _description;
    _unit;
    _dataType;
    _ucd;
    _uType;
    _index;
    /**
     *
     * @param name - column name
     * @param description - column description
     * @param unit - physical unit
     * @param datatype - ADQL datatype
     * @param ucd - Unified Content Descriptor
     * @param utype - ObsCore / STC-S type
     */
    constructor(name, description, unit, datatype, ucd, utype) {
        this._name = name;
        this._description = description;
        this._unit = unit;
        this._dataType = datatype;
        this._ucd = ucd;
        this._uType = utype;
    }
    get name() {
        return this._name;
    }
    get description() {
        return this._description;
    }
    get unit() {
        return this._unit;
    }
    get datatype() {
        return this._dataType;
    }
    get ucd() {
        return this._ucd;
    }
    get uType() {
        return this._uType;
    }
    get index() {
        return this._index;
    }
    set index(idx) {
        this._index = idx;
    }
}
/* harmony default export */ const tap_TapMetadata = (TapMetadata);

;// ./src/model/tap/TapMetadataList.ts

class TapMetadataList {
    _posEqRAMetaColumns; // ucd.includes('pos.eq.ra')
    _posEqDecMetaColumns; // ucd.includes('pos.eq.dec')
    _sRegionMetaColumns; // STC-S / s_region candidates
    _pgSphereMetaColumns; // ucd.includes('pos.outline.meta.pgsphere')
    _metadataList;
    constructor() {
        this._metadataList = [];
        this._posEqRAMetaColumns = [];
        this._posEqDecMetaColumns = [];
        this._sRegionMetaColumns = [];
        this._pgSphereMetaColumns = [];
    }
    /**
     * Add a TapMetadata entry and classify it into relevant groups
     */
    addMetadata(tapMetadata) {
        const length = this._metadataList.push(tapMetadata);
        const idx = length - 1;
        tapMetadata.index = idx;
        if (tapMetadata.ucd?.includes('pos.eq.ra')) {
            this._posEqRAMetaColumns.push(tapMetadata);
        }
        else if (tapMetadata.ucd?.includes('pos.eq.dec')) {
            this._posEqDecMetaColumns.push(tapMetadata);
        }
        if (tapMetadata.ucd?.includes('pos.outline;meta.pgsphere')) {
            this._pgSphereMetaColumns.push(tapMetadata);
        }
        if (tapMetadata.uType?.includes('Char.SpatialAxis.Coverage.Support.Area') ||
            tapMetadata.datatype?.includes('adql:REGION') ||
            tapMetadata.ucd?.includes('pos.outline;obs.field') ||
            tapMetadata.name === 'stc_s' // for ESASky
        ) {
            this._sRegionMetaColumns.push(tapMetadata);
        }
    }
    get metadataList() {
        return this._metadataList;
    }
    set metadataList(metadataList) {
        this._metadataList = metadataList;
    }
    get pgSphereMetaColumns() {
        return this._pgSphereMetaColumns;
    }
    get sRegionMetaColumns() {
        return this._sRegionMetaColumns;
    }
    get posEqRAMetaColumns() {
        return this._posEqRAMetaColumns;
    }
    get posEqDecMetaColumns() {
        return this._posEqDecMetaColumns;
    }
}
/* harmony default export */ const tap_TapMetadataList = (TapMetadataList);

;// ./src/model/tap/TapRepo.ts
class TapRepo {
    _adqlFunctionList;
    _cataloguesList;
    _observationsList;
    _notClassified;
    _activeObservations;
    _activeCatalogues;
    _tapBaseURL;
    constructor(tapUrl) {
        this._tapBaseURL = tapUrl;
        this._cataloguesList = [];
        this._observationsList = [];
        this._notClassified = [];
        this._activeObservations = [];
        this._activeCatalogues = [];
        this._adqlFunctionList = [];
    }
    get tapBaseUrl() {
        return this._tapBaseURL;
    }
    setCataloguesList(cataloguesList) {
        this._cataloguesList = cataloguesList;
    }
    setObservationsList(observationList) {
        this._observationsList = observationList;
    }
    setNotClassifiedList(notClassifiedList) {
        this._notClassified = notClassifiedList;
    }
    setCatalogueActive(catalogue) {
        this._activeCatalogues.push(catalogue);
    }
    setObservationActive(observation) {
        this._activeObservations.push(observation);
    }
    get cataloguesList() {
        return this._cataloguesList;
    }
    get observationsList() {
        return this._observationsList;
    }
    set adqlFunctionList(adqlFunctionList) {
        if (adqlFunctionList !== undefined) {
            this._adqlFunctionList = adqlFunctionList;
        }
    }
    get adqlFunctionList() {
        return this._adqlFunctionList;
    }
}

;// ./src/model/catalogues/CatalogueProps.ts
function colName(col) {
    return col?.name ?? col?.name;
}
function sameName(a, name) {
    if (!a || !name)
        return false;
    return colName(a) === name;
}
class CatalogueProps {
    static STANDARD_SIZE = "STANDARD_SIZE";
    raColumn;
    decColumn;
    nameColumn;
    /** Optional: numeric/size-mapped column */
    shapeSizeColumn;
    /** Optional: hue/category-mapped column */
    shapeHueColumn;
    /** Base color (hex string like #RRGGBB) */
    shapeColor;
    /** Full metadata list reference (kept in sync by updateColumnsIndex) */
    tapMetadataList;
    constructor(tapMetadataList, color) {
        this.raColumn = this.setRAColumns(tapMetadataList);
        this.decColumn = this.setDecColumns(tapMetadataList);
        this.nameColumn = this.setNameColumn(tapMetadataList);
        this.shapeSizeColumn = undefined;
        this.shapeHueColumn = undefined;
        this.shapeColor = color;
        this.tapMetadataList = tapMetadataList;
    }
    /** Rebinds saved column references to the new metadata objects (preserves indices, etc.). */
    updateColumnsIndex(metadataList) {
        for (const col of metadataList) {
            if (sameName(this.raColumn, colName(col)))
                this.raColumn = col;
            else if (sameName(this.decColumn, colName(col)))
                this.decColumn = col;
            else if (this.shapeHueColumn && sameName(this.shapeHueColumn, colName(col)))
                this.shapeHueColumn = col;
            else if (this.shapeSizeColumn && sameName(this.shapeSizeColumn, colName(col)))
                this.shapeSizeColumn = col;
            else if (this.nameColumn && sameName(this.nameColumn, colName(col)))
                this.nameColumn = col;
        }
        // Keep the container reference up to date if needed elsewhere.
        this.tapMetadataList.metadataList = metadataList;
    }
    setRAColumns(tapMetadataList) {
        let column;
        for (const tapMetadata of tapMetadataList.posEqRAMetaColumns) {
            const u = tapMetadata.ucd;
            if (u && u.includes('pos.eq.ra')) {
                if (u.includes('meta.main')) {
                    column = tapMetadata; // prefer the main one
                    break;
                }
                if (!column)
                    column = tapMetadata; // fallback to first valid one
            }
        }
        if (!column) {
            throw new Error('No RA column found (UCD pos.eq.ra) in _posEqRAMetaColumns');
        }
        return column;
    }
    setDecColumns(tapMetadataList) {
        let column;
        for (const tapMetadata of tapMetadataList.posEqDecMetaColumns) {
            const u = tapMetadata.ucd;
            if (u && u.includes('pos.eq.dec')) {
                if (u.includes('meta.main')) {
                    column = tapMetadata; // prefer the main one
                    break;
                }
                if (!column)
                    column = tapMetadata; // fallback to first valid one
            }
        }
        if (!column) {
            throw new Error('No Dec column found (UCD pos.eq.dec) in _posEqDecMetaColumns');
        }
        return column;
    }
    setNameColumn(tapMetadataList) {
        let column;
        for (const tapMetadata of tapMetadataList.metadataList) {
            const u = tapMetadata.ucd;
            if (u && u.includes('meta.id') && u.includes('meta.main')) {
                column = tapMetadata; // prefer id+main
            }
        }
        // It’s okay if there’s no strong "name" column; methods below handle undefined.
        return column;
    }
    changeColor(color) {
        this.shapeColor = color;
    }
    changeMetaName(metacolumnName) {
        if (this.nameColumn && colName(this.nameColumn) === metacolumnName)
            return;
        for (const column of this.tapMetadataList.metadataList) {
            if (colName(column) === metacolumnName) {
                this.nameColumn = column;
                break;
            }
        }
    }
    /** Returns true to indicate a refresh-by-FoV is needed (preserves original behavior). */
    changeCatalogueMetaRA(metacolumnName) {
        if (colName(this.raColumn) !== metacolumnName) {
            for (const column of this.tapMetadataList.metadataList) {
                if (colName(column) === metacolumnName) {
                    this.raColumn = column;
                    break;
                }
            }
        }
        return true;
    }
    /** Returns true to indicate a refresh-by-FoV is needed (preserves original behavior). */
    changeCatalogueMetaDec(metacolumnName) {
        if (colName(this.decColumn) !== metacolumnName) {
            for (const column of this.tapMetadataList.metadataList) {
                if (colName(column) === metacolumnName) {
                    this.decColumn = column;
                    break;
                }
            }
        }
        return true;
    }
    resetCatalogueMetaShapeSize() {
        this.shapeSizeColumn = undefined;
    }
    changeCatalogueMetaShapeSize(metacolumnName) {
        if (!this.shapeSizeColumn || colName(this.shapeSizeColumn) !== metacolumnName) {
            for (const column of this.tapMetadataList.metadataList) {
                if (colName(column) === metacolumnName) {
                    this.shapeSizeColumn = column;
                    break;
                }
            }
        }
    }
    resetCatalogueMetaShapeHue() {
        this.shapeHueColumn = undefined;
    }
    changeCatalogueMetaShapeHue(metacolumnName) {
        if (!this.shapeHueColumn || colName(this.shapeHueColumn) !== metacolumnName) {
            for (const column of this.tapMetadataList.metadataList) {
                if (colName(column) === metacolumnName) {
                    this.shapeHueColumn = column;
                    break;
                }
            }
        }
    }
}

;// ./src/model/Source.ts



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
        return this._details[index];
    }
    get details() {
        return this._details;
    }
    computeHealpixPixel() {
        // Get Healpix instance from global
        const healpix = src_Global.getHealpix(src_Global.nsideForSelection);
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
/* harmony default export */ const model_Source = (Source);

;// ./src/shader/CatalogueShaderProgram.ts
// HiPSShaderProgram.ts



class CatalogueShaderProgram {
    _shaderProgram;
    _vertexShader;
    _fragmentShader;
    gl_uniforms;
    gl_attributes;
    locations;
    constructor() {
        this.gl_uniforms = {
            vertex_color: 'u_fragcolor',
            m_perspective: 'uPMatrix',
            m_model_view: 'uMVMatrix'
        };
        this.gl_attributes = {
            vertex_pos: 'aCatPosition',
            vertex_selected: 'a_selected',
            point_size: 'a_pointsize',
            point_hue: 'a_brightness'
        };
        this.locations = {
            pMatrix: null,
            mvMatrix: null,
            color: null,
            position: -1,
            hovered: -1,
            pointSize: -1,
            brightness: -1
        };
    }
    get shaderProgram() {
        if (!this._shaderProgram) {
            const gl = src_Global.gl;
            this._shaderProgram = gl.createProgram();
            this.initShaders();
        }
        return this._shaderProgram;
    }
    initShaders() {
        const gl = src_Global.gl;
        const fragmentShaderStr = ShaderManager.catalogueFS();
        this._fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(this._fragmentShader, fragmentShaderStr);
        gl.compileShader(this._fragmentShader);
        console.log('FS log:', gl.getShaderInfoLog(this._fragmentShader) || 'ok');
        if (!gl.getShaderParameter(this._fragmentShader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(this._fragmentShader) || 'Fragment shader compile error');
            return;
        }
        const vertexShaderStr = ShaderManager.catalogueVS();
        this._vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(this._vertexShader, vertexShaderStr);
        gl.compileShader(this._vertexShader);
        console.log('VS log:', gl.getShaderInfoLog(this._vertexShader) || 'ok');
        if (!gl.getShaderParameter(this._vertexShader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(this._vertexShader) || 'Vertex shader compile error');
            return;
        }
        gl.attachShader(this.shaderProgram, this._vertexShader);
        gl.attachShader(this.shaderProgram, this._fragmentShader);
        gl.linkProgram(this.shaderProgram);
        if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
            alert('Could not initialise shaders');
        }
        // shaderUtility.useProgram(this.shaderProgram)
        gl.useProgram(this.shaderProgram);
        this.locations.position = gl.getAttribLocation(this.shaderProgram, this.gl_attributes.vertex_pos);
        this.locations.hovered = gl.getAttribLocation(this.shaderProgram, this.gl_attributes.vertex_selected);
        this.locations.pointSize = gl.getAttribLocation(this.shaderProgram, this.gl_attributes.point_size);
        this.locations.brightness = gl.getAttribLocation(this.shaderProgram, this.gl_attributes.point_hue);
        this.locations.color = gl.getUniformLocation(this.shaderProgram, this.gl_uniforms.vertex_color);
    }
    enableShaders(pMatrix, modelMatrix, viewMatrix) {
        const gl = src_Global.gl;
        // shaderUtility.useProgram(this.shaderProgram)
        gl.useProgram(this.shaderProgram);
        this.locations.pMatrix = gl.getUniformLocation(this.shaderProgram, this.gl_uniforms.m_perspective);
        this.locations.mvMatrix = gl.getUniformLocation(this.shaderProgram, this.gl_uniforms.m_model_view);
        let mvMatrix = mat4_create();
        mvMatrix = mat4_multiply(mvMatrix, viewMatrix, modelMatrix);
        gl.uniformMatrix4fv(this.locations.pMatrix, false, pMatrix);
        gl.uniformMatrix4fv(this.locations.mvMatrix, false, mvMatrix);
    }
}
const catalogueShaderProgram = new CatalogueShaderProgram();

;// ./src/model/catalogues/CatalogueGL.ts









// `Source` is assumed to expose at least these:
class CatalogueGL {
    static ELEM_SIZE;
    static BYTES_X_ELEM;
    static STANDARD_SHAPE_SIZE = 8.0;
    static STANDARD_SHAPE_HUE = 3.0;
    // Core state
    ready;
    catalogueProps;
    name;
    description;
    tapRepo;
    // Data
    sources;
    gl;
    // shaderProgram: WebGLProgram;
    // Buffers & arrays
    vertexCataloguePositionBuffer;
    vertexhoveredCataloguePositionBuffer;
    vertexCataloguePosition;
    // Index/selection bookkeeping
    hoveredIndexes;
    selectedIndexes;
    extHoveredIndexes;
    oldMouseCoords;
    _isVisible = true;
    // Healpix pixel => indices map
    healpixDensityMap;
    /**
     * @param tablename - String
     * @param tabledesc - String
     * @param tapRepo   - Object with `_tapBaseURL`
     * @param tapMetadataList - TapMetadataList (as used by CatalogueProps)
     */
    constructor(tablename, tabledesc, provider, tapMetadataList) {
        this.ready = false;
        this.TYPE = 'SOURCE_CATALOGUE';
        CatalogueGL.ELEM_SIZE = 6; // x,y,z, hoveredFlag, size, brightness
        CatalogueGL.BYTES_X_ELEM = new Float32Array().BYTES_PER_ELEMENT;
        this.name = tablename;
        this.description = tabledesc;
        this.tapRepo = provider;
        this.sources = [];
        // GL init
        this.gl = src_Global.gl;
        this.vertexCataloguePositionBuffer = this.gl.createBuffer();
        this.vertexhoveredCataloguePositionBuffer = this.gl.createBuffer();
        this.vertexCataloguePosition = new Float32Array(0);
        this.hoveredIndexes = [];
        this.selectedIndexes = [];
        this.extHoveredIndexes = [];
        this.oldMouseCoords = null;
        this.healpixDensityMap = new Map();
        const defaultColor = '#8F00FF';
        this.catalogueProps = new CatalogueProps(tapMetadataList, defaultColor);
        // call catalogueShaderProgram to init shaders if they are not yet initialised 
        catalogueShaderProgram.shaderProgram;
        this._isVisible = true;
    }
    setIsVisible(visibility) {
        this._isVisible = visibility;
    }
    get isVisible() {
        return this._isVisible;
    }
    minMax(columnindex) {
        if (!this.sources.length)
            return { min: 0, max: 0 };
        let min = this.sources[0].details[columnindex];
        if (isNaN(Number(min))) {
            // console.warn(`${this.catalogueProps.tapMetadataList.metadataList[columnindex].name} doesn't contain number only values`)
            console.warn(`${this.catalogueProps.tapMetadataList.metadataList[columnindex].name} doesn't contain only number values`);
            return { min: 0, max: 0 };
        }
        let max = min;
        for (const source of this.sources) {
            const v = source.details[columnindex];
            if (isNaN(Number(v))) {
                console.warn(`${this.catalogueProps.tapMetadataList.metadataList[columnindex].name} doesn't contain number only values`);
                return { min: 0, max: 0 };
            }
            if (v < min)
                min = v;
            if (v > max)
                max = v;
        }
        return {
            min: Number(min),
            max: Number(max)
        };
    }
    changeCatalogueMetaShapeSize(metacolumnName) {
        if (metacolumnName == CatalogueProps.STANDARD_SIZE) {
            this.catalogueProps.resetCatalogueMetaShapeSize();
            for (const source of this.sources) {
                const size = CatalogueGL.STANDARD_SHAPE_SIZE;
                source.shapeSize = size;
            }
            this.initBuffer();
            return;
        }
        const oldShapeSizeName = this.catalogueProps.shapeSizeColumn?.name;
        this.catalogueProps.changeCatalogueMetaShapeSize(metacolumnName);
        const idx = this.catalogueProps.shapeSizeColumn?.index ?? this.catalogueProps.shapeSizeColumn?.index;
        if (idx == null) {
            if (oldShapeSizeName)
                this.catalogueProps.changeCatalogueMetaShapeSize(oldShapeSizeName);
            return;
        }
        const minmax = this.minMax(idx);
        if (minmax.min == minmax.max) {
            console.warn(`${minmax} min and max are equals. No resizing will be applied.`);
            return;
        }
        for (const source of this.sources) {
            const raw = Number(source.getDetailByindex(idx));
            const min = Number(minmax.min);
            const max = Number(minmax.max);
            const norm = (raw - min) / Math.max(1e-12, (max - min));
            const size = norm * (20 - 8) + 8;
            source.shapeSize = size;
        }
        this.initBuffer();
    }
    changeCatalogueMetaShapeHue(metacolumnName) {
        if (metacolumnName == CatalogueProps.STANDARD_SIZE) {
            this.catalogueProps.resetCatalogueMetaShapeHue();
            for (const source of this.sources) {
                const hue = CatalogueGL.STANDARD_SHAPE_HUE;
                source.brightnessFactor = hue;
            }
            this.initBuffer();
            return;
        }
        const oldHueSizeName = this.catalogueProps.shapeHueColumn?.name;
        this.catalogueProps.changeCatalogueMetaShapeHue(metacolumnName);
        const idx = this.catalogueProps.shapeHueColumn?.index ?? this.catalogueProps.shapeHueColumn?.index;
        if (idx == null) {
            if (oldHueSizeName)
                this.catalogueProps.changeCatalogueMetaShapeHue(oldHueSizeName);
            return;
        }
        const minmax = this.minMax(idx);
        if (minmax.min == minmax.max) {
            console.warn(`${minmax} min and max are equals. No resizing will be applied.`);
            return;
        }
        for (const source of this.sources) {
            const raw = Number(source.getDetailByindex(idx));
            const min = Number(minmax.min);
            const max = Number(minmax.max);
            const norm = (raw - min) / Math.max(1e-12, (max - min));
            // map [0,1] -> [1,-1]
            source.brightnessFactor = -(norm * 2 - 1);
        }
        this.initBuffer();
    }
    addSource(source) {
        this.sources.push(source);
    }
    /**
     * @param in_data Rows of TAP results
     * @param columnsmeta TapMetadataList (unused here because `CatalogueProps` already holds indices)
     */
    addSources(in_data, columnsmeta) {
        this.ready = false;
        this.sources = [];
        const raDataIndex = this.catalogueProps.raColumn.index ?? this.catalogueProps.raColumn._index;
        const decDataIndex = this.catalogueProps.decColumn.index ?? this.catalogueProps.decColumn._index;
        for (let j = 0; j < in_data.length; j++) {
            const point = new model_Point({
                raDeg: in_data[j][raDataIndex],
                decDeg: in_data[j][decDataIndex]
            }, utils_CoordsType.ASTRO);
            const source = new model_Source(point, in_data[j]);
            // Ensure optional fields exist
            source.shapeSize = source.shapeSize ?? CatalogueGL.STANDARD_SHAPE_SIZE;
            source.brightnessFactor = 3;
            this.addSource(source);
        }
        this.initBuffer();
        this.ready = true;
    }
    clearSources() {
        this.sources = [];
        this.hoveredIndexes = [];
        this.healpixDensityMap.clear();
        this.vertexCataloguePosition = new Float32Array(0);
    }
    extHighlightSource(source, highlighted) {
        const sIdx = this.sources.indexOf(source);
        if (sIdx < 0)
            return;
        if (highlighted) {
            if (!this.extHoveredIndexes.includes(sIdx)) {
                this.extHoveredIndexes.push(sIdx);
            }
        }
        else {
            const i = this.extHoveredIndexes.indexOf(sIdx);
            if (i >= 0)
                this.extHoveredIndexes.splice(i, 1);
        }
    }
    extAddSources2Selected(sources) {
        for (const s of sources) {
            const sIdx = this.sources.indexOf(s);
            if (sIdx >= 0 && !this.selectedIndexes.includes(sIdx)) {
                this.selectedIndexes.push(sIdx);
            }
        }
    }
    extRemoveSourceFromSelection(source) {
        const indexOfObject = this.sources.indexOf(source);
        if (indexOfObject < 0)
            return;
        const sidx = this.selectedIndexes.indexOf(indexOfObject);
        if (sidx >= 0)
            this.selectedIndexes.splice(sidx, 1);
        const eidx = this.extHoveredIndexes.indexOf(indexOfObject);
        if (eidx >= 0)
            this.extHoveredIndexes.splice(eidx, 1);
        // Clear hovered flag in buffer view (if present)
        if (this.vertexCataloguePosition.length >= (indexOfObject + 1) * CatalogueGL.ELEM_SIZE) {
            this.vertexCataloguePosition[indexOfObject * CatalogueGL.ELEM_SIZE + 3] = 0.0;
        }
    }
    initBuffer() {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexCataloguePositionBuffer);
        const nSources = this.sources.length;
        this.vertexCataloguePosition = new Float32Array(nSources * CatalogueGL.ELEM_SIZE);
        let positionIndex = 0;
        for (let j = 0; j < nSources; j++) {
            const currSource = this.sources[j];
            const currPix = currSource.healpixPixel;
            // density map
            const bucket = this.healpixDensityMap.get(currPix);
            if (bucket) {
                if (!bucket.includes(j))
                    bucket.push(j);
            }
            else {
                this.healpixDensityMap.set(currPix, [j]);
            }
            // position
            this.vertexCataloguePosition[positionIndex + 0] = currSource.point.x;
            this.vertexCataloguePosition[positionIndex + 1] = currSource.point.y;
            this.vertexCataloguePosition[positionIndex + 2] = currSource.point.z;
            // hovered flag
            this.vertexCataloguePosition[positionIndex + 3] = 0.0;
            // size
            this.vertexCataloguePosition[positionIndex + 4] = currSource.shapeSize ?? CatalogueGL.STANDARD_SHAPE_SIZE;
            // brightness
            this.vertexCataloguePosition[positionIndex + 5] = currSource.brightnessFactor ?? 0.0;
            positionIndex += CatalogueGL.ELEM_SIZE;
        }
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertexCataloguePosition, this.gl.STATIC_DRAW);
    }
    getSelectionRadius() {
        const order = visibleTilesManager.getVisibleOrder();
        switch (order) {
            case 0:
            case 1:
            case 2:
                return 0.005;
            case 3:
                return 0.001;
            case 4:
                return 0.0009;
            case 5:
                return 0.0005;
            case 6:
                return 0.0001;
            case 7:
                return 0.00009;
            case 8:
                return 0.00005;
            case 9:
                return 0.00001;
            default:
                return 0.000005;
        }
    }
    checkSelection(in_mouseHelper) {
        if (in_mouseHelper.x == null || in_mouseHelper.y == null || in_mouseHelper.z == null) {
            console.log('CatalogueGL.checkSelection: missing mouse coords');
            return [];
        }
        const hoveredIndexes = [];
        const sourcesHovered = [];
        const mousePix = in_mouseHelper.computeNpix();
        if (mousePix != null && this.healpixDensityMap.has(mousePix)) {
            const candidates = this.healpixDensityMap.get(mousePix);
            const selR = this.getSelectionRadius();
            for (let i = 0; i < candidates.length; i++) {
                const sourceIdx = candidates[i];
                const source = this.sources[sourceIdx];
                if (!source)
                    continue;
                const dx = source.point.x - in_mouseHelper.x;
                const dy = source.point.y - in_mouseHelper.y;
                const dz = source.point.z - in_mouseHelper.z;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                if (dist <= selR) {
                    hoveredIndexes.push(sourceIdx);
                    sourcesHovered.push(source);
                }
            }
        }
        // session.updateHoveredSources(this, sourcesHovered);
        return hoveredIndexes;
    }
    /**
     * @param in_mMatrix Model matrix the current catalogue is associated to (e.g. HiPS matrix)
     */
    draw(in_mMatrix, in_mouseHelper) {
        if (!this.isVisible)
            return;
        if (!this.ready)
            return;
        if (!src_Global.camera)
            return;
        catalogueShaderProgram.enableShaders(ComputePerspectiveMatrix.pMatrix, in_mMatrix, src_Global.camera.getCameraMatrix());
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexCataloguePositionBuffer);
        // positions
        this.gl.vertexAttribPointer(catalogueShaderProgram.locations.position, 3, this.gl.FLOAT, false, CatalogueGL.BYTES_X_ELEM * CatalogueGL.ELEM_SIZE, 0);
        this.gl.enableVertexAttribArray(catalogueShaderProgram.locations.position);
        // hovered flag
        this.gl.vertexAttribPointer(catalogueShaderProgram.locations.hovered, 1, this.gl.FLOAT, false, CatalogueGL.BYTES_X_ELEM * CatalogueGL.ELEM_SIZE, CatalogueGL.BYTES_X_ELEM * 3);
        this.gl.enableVertexAttribArray(catalogueShaderProgram.locations.hovered);
        // point size
        this.gl.vertexAttribPointer(catalogueShaderProgram.locations.pointSize, 1, this.gl.FLOAT, false, CatalogueGL.BYTES_X_ELEM * CatalogueGL.ELEM_SIZE, CatalogueGL.BYTES_X_ELEM * 4);
        this.gl.enableVertexAttribArray(catalogueShaderProgram.locations.pointSize);
        // brightness
        this.gl.vertexAttribPointer(catalogueShaderProgram.locations.brightness, 1, this.gl.FLOAT, false, CatalogueGL.BYTES_X_ELEM * CatalogueGL.ELEM_SIZE, CatalogueGL.BYTES_X_ELEM * 5);
        this.gl.enableVertexAttribArray(catalogueShaderProgram.locations.brightness);
        // color
        const rgb = colorHex2RGB(this.catalogueProps.shapeColor);
        if (catalogueShaderProgram.locations.color) {
            this.gl.uniform4f(catalogueShaderProgram.locations.color, rgb[0], rgb[1], rgb[2], 1.0);
        }
        // Hover logic on mouse move
        if (in_mouseHelper != null && in_mouseHelper.xyz !== this.oldMouseCoords) {
            // clear old hovered
            for (let k = 0; k < this.hoveredIndexes.length; k++) {
                const base = this.hoveredIndexes[k] * CatalogueGL.ELEM_SIZE;
                this.vertexCataloguePosition[base + 3] = 0.0; // not hovered
                this.vertexCataloguePosition[base + 4] = this.sources[this.hoveredIndexes[k]].shapeSize; // size
            }
            this.hoveredIndexes = this.checkSelection(in_mouseHelper);
            // new hovered
            for (let i = 0; i < this.hoveredIndexes.length; i++) {
                const idx = this.hoveredIndexes[i];
                const base = idx * CatalogueGL.ELEM_SIZE;
                this.vertexCataloguePosition[base + 3] = 1.0; // hovered
                this.vertexCataloguePosition[base + 4] = this.sources[idx].shapeSize; // size
            }
        }
        // selected flags
        for (let s = 0; s < this.selectedIndexes.length; s++) {
            const idx = this.selectedIndexes[s];
            const base = idx * CatalogueGL.ELEM_SIZE;
            this.vertexCataloguePosition[base + 3] = 2.0; // selected
            this.vertexCataloguePosition[base + 4] = this.sources[idx].shapeSize; // size
        }
        // external hovered
        for (let e = 0; e < this.extHoveredIndexes.length; e++) {
            const idx = this.extHoveredIndexes[e];
            const base = idx * CatalogueGL.ELEM_SIZE;
            this.vertexCataloguePosition[base + 3] = 1.0; // hovered
            this.vertexCataloguePosition[base + 4] = this.sources[idx].shapeSize; // size
        }
        // upload buffer
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertexCataloguePosition, this.gl.STATIC_DRAW);
        // draw
        const numItems = this.vertexCataloguePosition.length / CatalogueGL.ELEM_SIZE;
        this.gl.drawArrays(this.gl.POINTS, 0, numItems);
        this.oldMouseCoords = in_mouseHelper.xyz;
    }
}
/* harmony default export */ const catalogues_CatalogueGL = (CatalogueGL);

;// ./src/utils/STCSParser.ts
/**
 * @author Fabrizio Giordano (Fab77)
 */



class STCSParser {
    static parseSTCS(stcs) {
        const stcsParsed = STCSParser.cleanStcs(stcs);
        let totPoints = 0;
        const polygons = [];
        if (stcsParsed.includes("POLYGON")) {
            return STCSParser.parsePolygon(stcsParsed);
        }
        else if (stcsParsed.includes("CIRCLE")) {
            return STCSParser.parseCircle(stcsParsed);
        }
        else {
            console.warn("STCS not recognised");
        }
        return { totpoints: totPoints, polygons };
    }
    static cleanStcs(stcs) {
        // Uppercase once
        let s = stcs.toUpperCase();
        // Remove tokens
        s = s
            .replace(/'ICRS'/g, '')
            .replace(/\bICRS\b/g, '')
            .replace(/\bJ2000\b/g, '')
            .replace(/\bUNION\b/g, '')
            .replace(/\bTOPOCENTER\b/g, '');
        // Remove parentheses
        s = s.replace(/[()]/g, '');
        // Collapse extra spaces and trim
        s = s.replace(/ {2,}/g, ' ').trim();
        return s;
    }
    static parsePolygon(stcs) {
        let totPoints = 0;
        const polygons = [];
        const MAX_DECIMALS = src_Global.MAX_DECIMALS ?? 12;
        const polys = stcs.split("POLYGON ");
        for (let i = 1; i < polys.length; i++) {
            const currPoly = [];
            const points = polys[i].trim().split(" ");
            // If first point is repeated as last, remove the duplicate
            const p0 = Number(parseFloat(points[0]).toFixed(MAX_DECIMALS));
            const p1 = Number(parseFloat(points[1]).toFixed(MAX_DECIMALS));
            const plast0 = Number(parseFloat(points[points.length - 2]).toFixed(MAX_DECIMALS));
            const plast1 = Number(parseFloat(points[points.length - 1]).toFixed(MAX_DECIMALS));
            if (p0 === plast0 && p1 === plast1) {
                points.splice(points.length - 2, 2);
            }
            if (points.length > 2) {
                for (let p = 0; p < points.length - 1; p += 2) {
                    const raDeg = Number(parseFloat(points[p]).toFixed(MAX_DECIMALS));
                    const decDeg = Number(parseFloat(points[p + 1]).toFixed(MAX_DECIMALS));
                    const point = new model_Point({ raDeg, decDeg }, utils_CoordsType.ASTRO);
                    currPoly.push(point);
                    totPoints += 1;
                }
                polygons.push(currPoly);
            }
        }
        return { totpoints: totPoints, polygons };
    }
    // Example format: "CIRCLE ICRS 8.739685 4.38147 0.027833"
    static parseCircle(stcs) {
        let totPoints = 0;
        const polygons = [];
        const polys = stcs.split("CIRCLE ");
        for (let i = 1; i < polys.length; i++) {
            const currPoly = [];
            const tokens = polys[i].trim().split(" ");
            const ra = Number(tokens[0]);
            const dec = Number(tokens[1]);
            const radius = Number(tokens[2]);
            const POINTS_PER_QUADRANT = 6;
            const npoints = POINTS_PER_QUADRANT * 4;
            const alpha = (2 * Math.PI) / npoints;
            // Generate points around the circle
            for (let p = npoints; p > 0; p--) {
                const curra = radius * Math.cos(p * alpha) + ra;
                const curdec = radius * Math.sin(p * alpha) + dec;
                const point = new model_Point({ raDeg: curra, decDeg: curdec }, utils_CoordsType.ASTRO);
                currPoly.push(point);
                totPoints += 1;
            }
            polygons.push(currPoly);
        }
        return { totpoints: totPoints, polygons };
    }
}
/* harmony default export */ const utils_STCSParser = (STCSParser);

;// ./src/model/footprints/Footprint.ts

/**
 * @author Fabrizio Giordano (Fab)
 */
// import { Pointing, Healpix } from 'healpixjs';
// import { degToRad } from '../../utils/Utils.js';

// import global from '../../Global.js';

// export interface ParsedSTCS {
//   polygons: Point[][]; // array of polygons (each polygon is array of Point objects)
//   totpoints: number;
// }
class Footprint {
    _polygons = []; // array of polygons (-> array of points)
    _convexPolygons = []; // convex polygons
    _stcs; // STC-S string
    _valid = false;
    _details;
    _totPoints = 0;
    _totConvexPoints = 0;
    _npix256;
    _footprintsPointsOrder;
    _selectionObj;
    _identifier;
    _center; // could be typed if you have a Point type
    /**
     * @param in_stcs STC-S representation of the footprint
     * @param in_details optional metadata
     * @param footprintsPointsOrder 1-> clockwise, -1 counter clockwise
     */
    constructor(in_stcs, in_details = [], footprintsPointsOrder) {
        if (in_stcs) {
            this._stcs = in_stcs.toUpperCase();
            this._details = in_details;
            this._totPoints = 0;
            this._totConvexPoints = 0;
            this._footprintsPointsOrder = footprintsPointsOrder;
            this.computePoints();
            this._selectionObj = this.computeSelectionObject();
            this._valid = true;
        }
        else {
            this._details = [];
        }
    }
    computeSelectionObject() {
        return utils_GeomUtils.computeSelectionObject(this._polygons);
    }
    // /**
    //  * Return array of HEALPix pixels covering the footprint
    //  * NOTE: despite the name, nside is not fixed at 256. It comes from Global.js
    //  */
    // private computeNpix256(): number[] {
    //   const healpix256 = new Healpix(global.nsideForSelection);
    //   const points: Pointing[] = [];
    //   for (const poly of this._convexPolygons) {
    //     for (const currPoint of poly) {
    //       const phiTheta = currPoint.computeHealpixPhiTheta();
    //       const phiRad = degToRad(phiTheta.phi);
    //       const thetaRad = degToRad(phiTheta.theta);
    //       points.push(new Pointing(null, false, thetaRad, phiRad));
    //     }
    //   }
    //   const rangeSet = healpix256.queryPolygonInclusive(points, 32);
    //   return Array.from(rangeSet.r);
    // }
    computePoints() {
        const res = utils_STCSParser.parseSTCS(this._stcs);
        this._polygons = res.polygons;
        this._totPoints = res.totpoints;
    }
    get valid() {
        return this._valid;
    }
    get totPoints() {
        return this._totPoints;
    }
    get totConvexPoints() {
        return this._totConvexPoints;
    }
    get polygons() {
        return this._polygons;
    }
    get convexPolygons() {
        return this._convexPolygons;
    }
    get identifier() {
        return this._identifier;
    }
    get center() {
        return this._center;
    }
    get pixels() {
        return this._npix256;
    }
    get details() {
        return this._details;
    }
    get selectionObj() {
        return this._selectionObj;
    }
}
/* harmony default export */ const footprints_Footprint = (Footprint);

;// ./src/model/footprints/FootprintProps.ts
class FootprintProps {
    // resolved columns
    pgSphereColumn;
    geomColumn;
    raColumn;
    decColumn;
    nameColumn;
    shapeColor;
    tapMetadataList;
    constructor(tapMetadataList, color) {
        this.tapMetadataList = tapMetadataList;
        this.shapeColor = color;
        this.setPositionColumns(tapMetadataList);
        this.nameColumn = this.setNameColumn(tapMetadataList);
    }
    setPositionColumns(tapMetadataList) {
        // pgSphere
        for (const meta of tapMetadataList.pgSphereMetaColumns) {
            this.pgSphereColumn = meta;
        }
        // s_region (choose the 'pos.outline;obs.field' if available; otherwise first)
        for (const meta of tapMetadataList.sRegionMetaColumns) {
            if (meta.ucd && meta.ucd.includes('pos.outline;obs.field')) {
                this.geomColumn = meta;
                break;
            }
            if (!this.geomColumn) {
                this.geomColumn = meta;
            }
        }
        // RA (prefer meta.main)
        for (const meta of tapMetadataList.posEqRAMetaColumns) {
            if (meta.ucd && meta.ucd.includes('meta.main')) {
                this.raColumn = meta;
                break;
            }
            if (!this.raColumn) {
                this.raColumn = meta;
            }
        }
        // DEC (prefer meta.main) – supports both posEqDecMetaColumns and _posEqDecMetaColumns
        const decList = tapMetadataList.posEqDecMetaColumns?.length
            ? tapMetadataList.posEqDecMetaColumns
            : tapMetadataList.posEqDecMetaColumns ?? [];
        for (const meta of decList) {
            if (meta.ucd && meta.ucd.includes('meta.main')) {
                this.decColumn = meta;
                break;
            }
            if (!this.decColumn) {
                this.decColumn = meta;
            }
        }
    }
    setNameColumn(tapMetadataList) {
        let nameColumn;
        for (const meta of tapMetadataList.metadataList) {
            if (meta.ucd?.includes('meta.id') && meta.ucd?.includes('meta.main')) {
                nameColumn = meta;
            }
        }
        return nameColumn;
    }
    changeColor(color) {
        this.shapeColor = color;
    }
    changeMetaName(metacolumnName) {
        const currentName = this.getMetaName(this.nameColumn);
        if (currentName !== metacolumnName) {
            for (const column of this.tapMetadataList.metadataList) {
                if (this.getMetaName(column) === metacolumnName) {
                    this.nameColumn = column;
                    break;
                }
            }
        }
    }
    // helper to normalize `name` / `_name`
    getMetaName(meta) {
        return meta?.name ?? meta?.name;
    }
}

;// ./src/shader/FootprintShaderProgram.ts
// HiPSShaderProgram.ts



class FootprintShaderProgram {
    _shaderProgram;
    _vertexShader;
    _fragmentShader;
    gl_uniforms;
    gl_attributes;
    locations;
    constructor() {
        this.gl_uniforms = {
            vertex_color: 'u_fragcolor',
            m_perspective: 'uPMatrix',
            m_model_view: 'uMVMatrix',
            point_size: 'u_pointsize'
        };
        this.gl_attributes = {
            vertex_pos: 'aCatPosition'
        };
        this.locations = {
            pMatrix: null,
            mvMatrix: null,
            color: null,
            position: -1,
            pointSize: -1
        };
    }
    get shaderProgram() {
        if (!this._shaderProgram) {
            const gl = src_Global.gl;
            this._shaderProgram = gl.createProgram();
            this.initShaders();
        }
        return this._shaderProgram;
    }
    initShaders() {
        const gl = src_Global.gl;
        const fragmentShaderStr = ShaderManager.footprintFS();
        this._fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(this._fragmentShader, fragmentShaderStr);
        gl.compileShader(this._fragmentShader);
        console.log('FS log:', gl.getShaderInfoLog(this._fragmentShader) || 'ok');
        if (!gl.getShaderParameter(this._fragmentShader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(this._fragmentShader) || 'Fragment shader compile error');
            return;
        }
        const vertexShaderStr = ShaderManager.footprintVS();
        this._vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(this._vertexShader, vertexShaderStr);
        gl.compileShader(this._vertexShader);
        console.log('VS log:', gl.getShaderInfoLog(this._vertexShader) || 'ok');
        if (!gl.getShaderParameter(this._vertexShader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(this._vertexShader) || 'Vertex shader compile error');
            return;
        }
        gl.attachShader(this.shaderProgram, this._vertexShader);
        gl.attachShader(this.shaderProgram, this._fragmentShader);
        gl.linkProgram(this.shaderProgram);
        if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
            alert('Could not initialise shaders');
        }
        gl.useProgram(this.shaderProgram);
        this.locations.position = gl.getAttribLocation(this.shaderProgram, this.gl_attributes.vertex_pos);
        this.locations.pointSize = gl.getUniformLocation(this.shaderProgram, this.gl_uniforms.point_size);
        this.locations.color = gl.getUniformLocation(this.shaderProgram, this.gl_uniforms.vertex_color);
    }
    enableShaders(pMatrix, modelMatrix, viewMatrix) {
        const gl = src_Global.gl;
        gl.useProgram(this.shaderProgram);
        this.locations.pMatrix = gl.getUniformLocation(this.shaderProgram, this.gl_uniforms.m_perspective);
        this.locations.mvMatrix = gl.getUniformLocation(this.shaderProgram, this.gl_uniforms.m_model_view);
        let mvMatrix = mat4_create();
        mvMatrix = mat4_multiply(mvMatrix, viewMatrix, modelMatrix);
        gl.uniformMatrix4fv(this.locations.pMatrix, false, pMatrix);
        gl.uniformMatrix4fv(this.locations.mvMatrix, false, mvMatrix);
    }
}
const footprintShaderProgram = new FootprintShaderProgram();

;// ./src/model/footprints/FootprintSetGL.ts









class FootprintSetGL {
    static ELEM_SIZE = 3;
    static BYTES_X_ELEM = new Float32Array().BYTES_PER_ELEMENT;
    static CONVEXPOLY_ELEM_SIZE = 3;
    ready;
    footprintsetProps;
    name;
    description;
    tapRepo;
    extHoveredIndexes;
    oldMouseCoords;
    healpixDensityMap;
    totConvexPoints;
    // footprintsInPix256: Map<number, Footprint[]>
    gl;
    // shaderProgram: WebGLProgram
    vertexCataloguePositionBuffer;
    indexBuffer;
    hoveredVertexPositionBuffer;
    hoveredIndexBuffer;
    selectedVertexPositionBuffer;
    selectedIndexBuffer;
    indexes;
    footprintPolygons = [];
    vertexCataloguePosition;
    totPoints;
    nPrimitiveFlags = 0;
    hoveredIndexes;
    _hoveredFootprints = [];
    hoveredVertexPosition;
    totHoveredPoints;
    nHoveredPrimitiveFlags = 0;
    selectedIndexes;
    _selectedFootprints = [];
    selectedVertexPosition;
    totSelectedPoints;
    nSlectedPrimitiveFlags = 0;
    _isVisible = true;
    constructor(tablename, tabledesc, tapRepo, tapMetadataList) {
        this.ready = false;
        this.TYPE = 'FOOTPRINT_SET';
        this.name = tablename;
        this.description = tabledesc;
        this.tapRepo = tapRepo;
        // this.footprintsInPix256 = new Map()
        this.initFootprintArrays();
        if (!src_Global.gl) {
            throw new Error('WebGL2RenderingContext is not initialized (global.gl is null)');
        }
        this.gl = src_Global.gl;
        this.initGLBuffers();
        this.oldMouseCoords = null;
        const defaultColor = '#00fff2ff';
        this.footprintsetProps = new FootprintProps(tapMetadataList, defaultColor);
        footprintShaderProgram.shaderProgram;
    }
    initFootprintArrays() {
        this.footprintPolygons = [];
        this.indexes = new Uint32Array();
        this.vertexCataloguePosition = new Float32Array();
        this.totPoints = 0;
        this.totConvexPoints = 0;
        this.extHoveredIndexes = new Uint32Array;
        this._hoveredFootprints = [];
        this.hoveredVertexPosition = new Float32Array();
        this.totHoveredPoints = 0;
        this.hoveredIndexes = new Uint32Array;
        this._selectedFootprints = [];
        this.selectedVertexPosition = new Float32Array();
        this.totSelectedPoints = 0;
        this.selectedIndexes = new Uint32Array;
    }
    initGLBuffers() {
        this.vertexCataloguePositionBuffer = this.gl.createBuffer();
        this.indexBuffer = this.gl.createBuffer();
        this.hoveredVertexPositionBuffer = this.gl.createBuffer();
        this.hoveredIndexBuffer = this.gl.createBuffer();
        this.selectedVertexPositionBuffer = this.gl.createBuffer();
        this.selectedIndexBuffer = this.gl.createBuffer();
    }
    setIsVisible(visibility) {
        this._isVisible = visibility;
    }
    get isVisible() {
        return this._isVisible;
    }
    addFootprint(in_footprint) {
        this.footprintPolygons.push(in_footprint);
    }
    addFootprints(in_data, columnsmeta) {
        this.ready = false;
        const geomDataIndex = this.footprintsetProps.geomColumn?.index;
        if (geomDataIndex === undefined) {
            throw new Error('geomColumn or its index is undefined in footprintsetProps');
        }
        for (let j = 0; j < in_data.length; j++) {
            if (in_data[j][0] !== null) {
                const footprint = new footprints_Footprint(in_data[j][geomDataIndex], in_data[j]);
                if (footprint._valid) {
                    this.addFootprint(footprint);
                    this.totPoints += footprint.totPoints;
                    this.totConvexPoints += footprint.totConvexPoints;
                }
            }
        }
        this.initBuffer();
        this.ready = true;
    }
    clearFootprints() {
        this.initFootprintArrays();
    }
    initBuffer() {
        const nFootprints = this.footprintPolygons.length;
        let npolygons = nFootprints - 1;
        for (let j = 0; j < nFootprints; j++) {
            npolygons += this.footprintPolygons[j].polygons.length - 1;
        }
        this.indexes = new Uint32Array(this.totPoints + npolygons + 1);
        const MAX_UNSIGNED_INT = 0xffffffff;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexCataloguePositionBuffer);
        this.vertexCataloguePosition = new Float32Array(3 * this.totPoints);
        let positionIndex = 0;
        let vIdx = 0;
        const R = 1.0;
        this.nPrimitiveFlags = 0;
        for (let j = 0; j < nFootprints; j++) {
            const footprint = this.footprintPolygons[j];
            const footprintPoly = footprint.polygons;
            if (j > 0) {
                this.indexes[vIdx++] = MAX_UNSIGNED_INT;
                this.nPrimitiveFlags++;
            }
            for (const poly of footprintPoly) {
                if (poly !== footprintPoly[0]) {
                    this.indexes[vIdx++] = MAX_UNSIGNED_INT;
                    this.nPrimitiveFlags++;
                }
                for (const point of poly) {
                    this.vertexCataloguePosition[positionIndex++] = R * point.x;
                    this.vertexCataloguePosition[positionIndex++] = R * point.y;
                    this.vertexCataloguePosition[positionIndex++] = R * point.z;
                    this.indexes[vIdx++] = Math.floor((positionIndex - 1) / 3);
                }
            }
        }
        this.indexes[this.indexes.length - 1] = MAX_UNSIGNED_INT;
        console.log('Buffer initialized');
    }
    checkSelection(mouseHelper) {
        if (!mouseHelper.x || !mouseHelper.y || !mouseHelper.z)
            return;
        let mousePix = mouseHelper.computeNpix();
        if (!mousePix)
            return;
        this._hoveredFootprints = [];
        this.totHoveredPoints = 0;
        const mousePoint = new model_Point({ x: mouseHelper.x, y: mouseHelper.y, z: mouseHelper.z }, utils_CoordsType.CARTESIAN);
        for (let i = 0; i < this.footprintPolygons.length; i++) {
            const footprint = this.footprintPolygons[i];
            if (!footprint.selectionObj)
                continue;
            if (utils_GeomUtils.checkPointInsidePolygon5(footprint.selectionObj, mousePoint)) {
                const details = [...footprint.details];
                const geomDataIndex = this.footprintsetProps.geomColumn?.index;
                if (geomDataIndex === undefined)
                    continue;
                details.splice(geomDataIndex, 1);
                this._hoveredFootprints.push(footprint);
                this.totHoveredPoints += footprint.totPoints;
            }
        }
        this.initHoveringBuffer();
    }
    get hoveredFootprints() {
        return {
            metadata: this.footprintsetProps.tapMetadataList,
            footprints: this._hoveredFootprints,
            tableName: this.name,
            description: this.description,
            provider: this.tapRepo.tapBaseUrl
        };
    }
    get selectedFootprints() {
        return this._selectedFootprints;
    }
    highlightFootprint(footprint, highlighted) {
        if (highlighted) {
            this._hoveredFootprints.push(footprint);
            this.totHoveredPoints += footprint.totPoints;
        }
        else {
            const indexOfFootprint = this._hoveredFootprints.indexOf(footprint);
            this._hoveredFootprints.splice(indexOfFootprint, 1);
            this.totHoveredPoints -= footprint.totPoints;
        }
        this.initHoveringBuffer();
    }
    /**
     *
     * @param {Footprint[]} footprints
     */
    addFootprint2Selected(footprints) {
        let refreshBuffer = false;
        for (let f of footprints) {
            if (!this._selectedFootprints.includes(f)) {
                this._selectedFootprints.push(f);
                this.totSelectedPoints += f.totPoints;
                refreshBuffer = true;
            }
        }
        if (refreshBuffer) {
            this.initSelectionBuffer();
        }
    }
    /**
     *
     * @param {Footprint} footprint
     */
    removeFootprintFromSelection(footprint) {
        const indexOfObject = this._selectedFootprints.indexOf(footprint);
        if (indexOfObject >= 0) {
            this._selectedFootprints.splice(indexOfObject, 1);
            this.totSelectedPoints -= footprint.totPoints;
            if (this._selectedFootprints.length > 0) {
                this.initSelectionBuffer();
            }
        }
    }
    initHoveringBuffer() {
        /*
                TODO better approach. when creating the indexbuffer of footprints,
                add 1 extra position for the selection (set to 0 == not selected),
                and save the position "positionIndex" in an array (selectionIndexes).
                When checking the selection, I get the index of the footprint, which
                matches with the index in the selectionIndexes to retrieve the position
                of the flag to be set to 1 in the vertexposition
                This will ease checking the selection in the vertex/fragment shader and
                set the pointsize and shape color.
                */
        if (this._hoveredFootprints.length == 0) {
            return;
        }
        let nFootprints = this._hoveredFootprints.length;
        let npolygons = nFootprints - 1;
        for (let j = 0; j < nFootprints; j++) {
            npolygons += this._hoveredFootprints[j].polygons.length - 1;
        }
        // this._selectedIndex = new Uint16Array(this._totSelectedPoints + npolygons);
        // let MAX_UNSIGNED_SHORT = 65535; // this is used to enable and disable GL_PRIMITIVE_RESTART_FIXED_INDEX
        this.hoveredIndexes = new Uint32Array(this.totHoveredPoints + npolygons);
        const MAX_UNSIGNED_INT = 0xffffffff; // this is used to enable and disable GL_PRIMITIVE_RESTART_FIXED_INDEX
        // let MAX_UNSIGNED_SHORT = Number.MAX_SAFE_INTEGER;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.hoveredVertexPositionBuffer);
        this.hoveredVertexPosition = new Float32Array(3 * this.totHoveredPoints);
        let positionIndex = 0;
        let vIdx = 0;
        let R = 1.0;
        this.nHoveredPrimitiveFlags = 0;
        for (let j = 0; j < nFootprints; j++) {
            let hoveredFootprintPoly = this._hoveredFootprints[j].polygons;
            if (j > 0) {
                this.hoveredIndexes[vIdx] = MAX_UNSIGNED_INT;
                this.nHoveredPrimitiveFlags += 1;
                vIdx += 1;
            }
            for (let polyIdx = 0; polyIdx < hoveredFootprintPoly.length; polyIdx++) {
                if (polyIdx > 0) {
                    this.hoveredIndexes[vIdx] = MAX_UNSIGNED_INT;
                    this.nHoveredPrimitiveFlags += 1;
                    vIdx += 1;
                }
                const poly = hoveredFootprintPoly[polyIdx];
                for (let pointIdx = 0; pointIdx < poly.length; pointIdx++) {
                    const p = poly[pointIdx];
                    this.hoveredVertexPosition[positionIndex] = R * p.x;
                    this.hoveredVertexPosition[positionIndex + 1] = R * p.y;
                    this.hoveredVertexPosition[positionIndex + 2] = R * p.z;
                    this.hoveredIndexes[vIdx] = Math.floor(positionIndex / 3);
                    vIdx += 1;
                    positionIndex += 3;
                }
            }
        }
    }
    initSelectionBuffer() {
        /*
                TODO better approach. when creating the indexbuffer of footprints,
                add 1 extra position for the selection (set to 0 == not selected),
                and save the position "positionIndex" in an array (selectionIndexes).
                When checking the selection, I get the index of the footprint, which
                matches with the index in the selectionIndexes to retrieve the position
                of the flag to be set to 1 in the vertexposition
                This will ease checking the selection in the vertex/fragment shader and
                set the pointsize and shape color.
                */
        let nFootprints = this._selectedFootprints.length;
        let npolygons = nFootprints - 1;
        for (let j = 0; j < nFootprints; j++) {
            npolygons += this._selectedFootprints[j].polygons.length - 1;
        }
        // this._selectedIndex = new Uint16Array(this._totSelectedPoints + npolygons);
        // let MAX_UNSIGNED_SHORT = 65535; // this is used to enable and disable GL_PRIMITIVE_RESTART_FIXED_INDEX
        this.selectedIndexes = new Uint32Array(this.totSelectedPoints + npolygons);
        const MAX_UNSIGNED_INT = 0xffffffff; // this is used to enable and disable GL_PRIMITIVE_RESTART_FIXED_INDEX
        // let MAX_UNSIGNED_SHORT = Number.MAX_SAFE_INTEGER;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.selectedVertexPositionBuffer);
        this.selectedVertexPosition = new Float32Array(3 * this.totSelectedPoints);
        let positionIndex = 0;
        let vIdx = 0;
        let R = 1.0;
        this.nSlectedPrimitiveFlags = 0;
        for (let j = 0; j < nFootprints; j++) {
            let footprintPoly = this._selectedFootprints[j].polygons;
            if (j > 0) {
                this.selectedIndexes[vIdx] = MAX_UNSIGNED_INT;
                this.nSlectedPrimitiveFlags += 1;
                vIdx += 1;
            }
            for (let polyIdx = 0; polyIdx < footprintPoly.length; polyIdx++) {
                if (polyIdx > 0) {
                    this.selectedIndexes[vIdx] = MAX_UNSIGNED_INT;
                    this.nSlectedPrimitiveFlags += 1;
                    vIdx += 1;
                }
                const poly = footprintPoly[polyIdx];
                for (let pointIdx = 0; pointIdx < poly.length; pointIdx++) {
                    const p = poly[pointIdx];
                    this.selectedVertexPosition[positionIndex] = R * p.x;
                    this.selectedVertexPosition[positionIndex + 1] = R * p.y;
                    this.selectedVertexPosition[positionIndex + 2] = R * p.z;
                    this.selectedIndexes[vIdx] = Math.floor(positionIndex / 3);
                    vIdx += 1;
                    positionIndex += 3;
                }
            }
        }
    }
    draw(in_mMatrix, in_mouseHelper) {
        if (!this.isVisible)
            return;
        if (!this.ready)
            return;
        if (!src_Global.camera)
            return;
        footprintShaderProgram.enableShaders(ComputePerspectiveMatrix.pMatrix, in_mMatrix, src_Global.camera.getCameraMatrix());
        if (in_mouseHelper != null && in_mouseHelper.xyz != this.oldMouseCoords) {
            this.checkSelection(in_mouseHelper);
        }
        if (this._hoveredFootprints.length > 0) {
            // TODO POINT_SIZE doesn't have any effect on line thickness!! it only applies to points
            const rgb = colorHex2RGB('#00FF00');
            const alpha = 1.0;
            this.gl.uniform4f(footprintShaderProgram.locations.color, rgb[0], rgb[1], rgb[2], alpha);
            this.gl.uniform1f(footprintShaderProgram.locations.pointSize, 14.0); // <--- POINT_SIZE in LINE_LOOP is not applicable
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.hoveredVertexPositionBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, this.hoveredVertexPosition, this.gl.STATIC_DRAW);
            // setting footprint position
            this.gl.vertexAttribPointer(footprintShaderProgram.locations.position, FootprintSetGL.ELEM_SIZE, this.gl.FLOAT, false, FootprintSetGL.BYTES_X_ELEM * FootprintSetGL.ELEM_SIZE, 0);
            this.gl.enableVertexAttribArray(footprintShaderProgram.locations.position);
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.hoveredIndexBuffer);
            this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.hoveredIndexes, this.gl.STATIC_DRAW);
            // this._gl.drawElements (this._gl.LINE_LOOP, this._selectedVertexPosition.length / 3 + this._nSlectedPrimitiveFlags,this._gl.UNSIGNED_SHORT, 0);
            this.gl.drawElements(this.gl.LINE_LOOP, this.hoveredVertexPosition.length / 3 + this.nHoveredPrimitiveFlags, this.gl.UNSIGNED_INT, 0);
        }
        if (this._selectedFootprints.length > 0) {
            const rgb = colorHex2RGB('#ECB462');
            const alpha = 1.0;
            this.gl.uniform4f(footprintShaderProgram.locations.color, rgb[0], rgb[1], rgb[2], alpha);
            this.gl.uniform1f(footprintShaderProgram.locations.pointSize, 14.0); // <--- POINT_SIZE in LINE_LOOP is not applicable
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.selectedVertexPositionBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, this.selectedVertexPosition, this.gl.STATIC_DRAW);
            // setting footprint position
            this.gl.vertexAttribPointer(footprintShaderProgram.locations.position, FootprintSetGL.ELEM_SIZE, this.gl.FLOAT, false, FootprintSetGL.BYTES_X_ELEM * FootprintSetGL.ELEM_SIZE, 0);
            this.gl.enableVertexAttribArray(footprintShaderProgram.locations.position);
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.selectedIndexBuffer);
            this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.selectedIndexes, this.gl.STATIC_DRAW);
            // this._gl.drawElements (this._gl.LINE_LOOP, this._selectedVertexPosition.length / 3 + this._nSlectedPrimitiveFlags,this._gl.UNSIGNED_SHORT, 0);
            this.gl.drawElements(this.gl.LINE_LOOP, this.selectedVertexPosition.length / 3 + this.nSlectedPrimitiveFlags, this.gl.UNSIGNED_INT, 0);
        }
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexCataloguePositionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertexCataloguePosition, this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(footprintShaderProgram.locations.position, FootprintSetGL.ELEM_SIZE, this.gl.FLOAT, false, FootprintSetGL.BYTES_X_ELEM * FootprintSetGL.ELEM_SIZE, 0);
        this.gl.enableVertexAttribArray(footprintShaderProgram.locations.position);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.indexes, this.gl.STATIC_DRAW);
        const shapeColor = [...colorHex2RGB(this.footprintsetProps.shapeColor), 1.0];
        this.gl.uniform4f(footprintShaderProgram.locations.color, ...shapeColor);
        this.gl.drawElements(this.gl.LINE_LOOP, this.indexes.length, this.gl.UNSIGNED_INT, 0);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
        this.oldMouseCoords = in_mouseHelper.xyz;
    }
}
/* harmony default export */ const footprints_FootprintSetGL = (FootprintSetGL);

;// ./src/services/tapRepoService.ts
// addTAPRepo.ts






let catId = 1;
let obsId = 1;
/**
 * Initialize a TapRepo and populate capabilities + datasets.
 */
async function addTAPRepo(repoUrl) {
    const tapRepo = new TapRepo(repoUrl);
    tapRepo.adqlFunctionList = await loadCapabilities(repoUrl);
    const datasets = await loadTables(repoUrl, tapRepo);
    tapRepo.setCataloguesList(datasets.catalogueList);
    tapRepo.setObservationsList(datasets.obsList);
    tapRepo.setNotClassifiedList(datasets.notClassifiedList);
    return tapRepo;
}
async function queryAsync(tapRepo, adql, TAP_QUERY_TIMEOUT_MS) {
    const base = src_Global.corsProxyUrl.replace(/\/?$/, '/'); // ensure trailing /
    const url = new URL('adql', base);
    url.searchParams.set('tapurl', tapRepo.tapBaseUrl);
    url.searchParams.set('query', adql);
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), TAP_QUERY_TIMEOUT_MS || 30000);
    try {
        const response = await fetch(url.toString(), {
            method: 'GET',
            mode: 'cors',
            signal: ac.signal,
            headers: { Accept: 'application/json' }
        });
        if (!response.ok) {
            const text = await response.text().catch(() => '');
            throw new Error(`HTTP ${response.status} ${response.statusText} – ${text}`);
        }
        return await response.json(); // return type is 'any'
    }
    catch (err) {
        console.error('queryAsync error:', err?.message || err);
        return null;
    }
    finally {
        clearTimeout(t);
    }
}
/**
 * Fetch and parse tables from a TAP service.
 */
const loadTables = async (tapUrl, tapRepo) => {
    const tablesUrl = `${tapUrl}/tables`;
    const requestUrl = `${src_Global.corsProxyUrl}exturl?url=${encodeURIComponent(tablesUrl)}`;
    const result = { obsList: [], catalogueList: [], notClassifiedList: [] };
    try {
        const response = await fetch(requestUrl, { method: 'GET', mode: 'cors' });
        const raw = await response.text();
        const data = raw.replace(/\n\t|\t|\n/g, '');
        const parser = new DOMParser();
        const doc = parser.parseFromString(data, 'application/xml');
        const root = doc.firstElementChild;
        if (!root)
            throw new Error('Error parsing TAP XML. Missing root element.');
        if (!/tableset$/i.test(root.nodeName)) {
            throw new Error(`Error parsing TAP XML. ${root.nodeName} not recognised`);
        }
        const catalogueList = [];
        const obsList = [];
        const notClassifiedList = [];
        // schemas
        for (const schema of Array.from(root.children)) {
            if (schema.nodeName !== 'schema')
                continue;
            for (const table of Array.from(schema.children)) {
                if (table.nodeName !== 'table')
                    continue;
                const dataset = parseTable(table, tablesUrl, tapRepo);
                if (!dataset)
                    continue;
                if (dataset.catalogue) {
                    ;
                    dataset.catalogue.id = catId++; // keep parity with existing code
                    catalogueList.push(dataset.catalogue);
                }
                if (dataset.footprint) {
                    ;
                    dataset.footprint.id = obsId++;
                    obsList.push(dataset.footprint);
                }
                if (dataset.notClassified) {
                    notClassifiedList.push(dataset.notClassified);
                }
            }
        }
        return { catalogueList, obsList, notClassifiedList };
    }
    catch (err) {
        console.error(err?.message ?? err);
        return result;
    }
};
/**
 * Fetch and parse TAP capabilities to extract ADQL functions.
 */
const loadCapabilities = async (repoUrl) => {
    const capabilitiesUrl = `${repoUrl}/capabilities`;
    const requestUrl = `${src_Global.corsProxyUrl}exturl?url=${encodeURIComponent(capabilitiesUrl)}`;
    let capabilities = [];
    try {
        const response = await fetch(requestUrl, { method: 'GET', mode: 'cors' });
        const raw = await response.text();
        const data = raw.replace(/\n\t|\t|\n/g, '');
        const parser = new DOMParser();
        const doc = parser.parseFromString(data, 'application/xml');
        const root = doc.firstElementChild;
        if (!root)
            throw new Error('Error parsing TAP XML. Missing root element.');
        if (!/capabilities$/i.test(root.nodeName)) {
            throw new Error(`Error parsing TAP XML. ${root.nodeName} not recognised`);
        }
        for (const capability of Array.from(root.children)) {
            if (capability.nodeName !== 'capability')
                continue;
            for (const child of Array.from(capability.children)) {
                if (child.nodeName === 'language') {
                    capabilities = parseCapabilities(child);
                }
            }
        }
        return capabilities;
    }
    catch (err) {
        console.error(err?.message ?? err);
        return capabilities;
    }
};
/**
 * Parse the <language> node to extract ADQL functions.
 */
const parseCapabilities = (languageNode) => {
    const out = [];
    const featuresContainers = languageNode.getElementsByTagName('languageFeatures');
    if (!featuresContainers.length)
        return out;
    const featureNodeList = featuresContainers[0].getElementsByTagName('feature');
    for (const feature of Array.from(featureNodeList)) {
        const formNode = feature.getElementsByTagName('form')[0];
        if (formNode?.textContent)
            out.push(formNode.textContent);
    }
    return out;
};
/**
 * Parse a <table> node and build dataset wrappers.
 */
const parseTable = (tableNode, tablesUrl, tapRepo) => {
    const nameNode = tableNode.getElementsByTagName('name')[0];
    if (!nameNode?.textContent) {
        return { catalogue: null, footprint: null, notClassified: 'Missing table name' };
    }
    const tableName = nameNode.textContent;
    const tableDesc = tableNode.getElementsByTagName('description')[0]?.textContent ?? null;
    const metaColumns = tableNode.getElementsByTagName('column');
    const tapMetas = new tap_TapMetadataList();
    for (const col of Array.from(metaColumns)) {
        const name = col.getElementsByTagName('name')[0]?.textContent ?? '';
        const description = col.getElementsByTagName('description')[0]?.textContent ?? undefined;
        const unit = col.getElementsByTagName('unit')[0]?.textContent ?? undefined;
        const dataType = col.getElementsByTagName('dataType')[0]?.textContent ?? undefined;
        const ucd = col.getElementsByTagName('ucd')[0]?.textContent ?? undefined;
        const utype = col.getElementsByTagName('utype')[0]?.textContent ?? undefined;
        const tapMeta = new tap_TapMetadata(name, description, unit, dataType, ucd, utype);
        tapMetas.addMetadata(tapMeta);
    }
    let catalogue = null;
    let footprint = null;
    let notClassified = null;
    if (tapMetas.pgSphereMetaColumns.length > 0 || tapMetas.sRegionMetaColumns.length > 0) {
        footprint = new footprints_FootprintSetGL(tableName, tableDesc, tapRepo, tapMetas);
    }
    else if (tapMetas.posEqRAMetaColumns.length > 0 && tapMetas.posEqDecMetaColumns.length > 0) {
        catalogue = new catalogues_CatalogueGL(tableName, tableDesc, tapRepo, tapMetas);
    }
    else {
        notClassified = `TODO: create NC entity for ${tablesUrl}#${tableName}`;
    }
    return { catalogue, footprint, notClassified };
};

;// ./src/services/queryCatalogueByFoV.ts



// Optional timeout; adjust or remove if you don’t use timeouts.
const TAP_QUERY_TIMEOUT_MS = 60_000;
// Small helpers to be robust with slightly different metadata shapes
function getColName(col) {
    if (!col)
        return '';
    return (col.name ?? col.name ?? '').toString();
}
async function queryCatalogueByFoV(catalogue, polygonAdql) {
    try {
        // Resolve RA/Dec column names (CatalogueProps already picked them from metadata)
        const raCol = getColName(catalogue.catalogueProps.raColumn);
        const decCol = getColName(catalogue.catalogueProps.decColumn);
        const tapTable = catalogue.name;
        if (!raCol || !decCol) {
            console.warn('[queryCatalogueByFoV] RA/Dec columns were not resolved from metadata.');
            return;
        }
        const adql = `SELECT * FROM ${tapTable} WHERE 1 = CONTAINS(POINT('ICRS', ${raCol}, ${decCol}), POLYGON('ICRS',${polygonAdql}))`;
        // Fire the TAP query
        const rows = await queryAsync(catalogue.tapRepo, adql, TAP_QUERY_TIMEOUT_MS);
        console.log(rows);
        if (rows && rows.data.length > 0) {
            const metadata = rows.metadata;
            const data = rows.data;
            console.log(data.length);
            let tapMetadataList = new tap_TapMetadataList();
            for (const element of metadata) {
                const name = element.name;
                const description = element.description !== undefined ? element.description : undefined;
                const unit = element.unit !== undefined ? element.unit : undefined;
                const datatype = element.datatype !== undefined ? element.datatype : undefined;
                const ucd = element.ucd !== undefined ? element.ucd : undefined;
                const utype = element.utype !== undefined ? element.utype : undefined;
                const tapMeta = new tap_TapMetadata(name, description, unit, datatype, ucd, utype);
                tapMetadataList.addMetadata(tapMeta);
            }
            catalogue.addSources(data, tapMetadataList.metadataList);
            return catalogue;
        }
        else {
            console.log('[queryCatalogueByFoV] No results found.');
            return;
        }
    }
    catch (err) {
        console.error('[queryCatalogueByFoV] Error:', err?.message ?? err);
        return;
    }
}

;// ./src/services/queryFootprintSetByFov.ts




// Optional timeout; adjust or remove if you don’t use timeouts.
const queryFootprintSetByFov_TAP_QUERY_TIMEOUT_MS = 60_000;
// --- Function ---
// Small helpers to be robust with slightly different metadata shapes
function queryFootprintSetByFov_getColName(col) {
    if (!col)
        return '';
    return (col.name ?? col.name ?? '').toString();
}
function prepareADQL(tapTable, tapRa, tapDec, polygonAdql, tapRepo, centralPoint) {
    let adql = "";
    if (tapRepo.adqlFunctionList.includes('POLYGON')) {
        adql =
            'select * from ' +
                tapTable +
                ' where 1=CONTAINS(POINT(\'ICRS\',' +
                tapRa +
                ',' +
                tapDec +
                '), POLYGON(\'ICRS\', ' +
                polygonAdql +
                '))';
    }
    else {
        const radius = grid_HealpixGridSingleton.getMinFoV() / 2;
        adql =
            'select * from ' +
                tapTable +
                ' where 1=CONTAINS(POINT(\'ICRS\',' +
                tapRa +
                ',' +
                tapDec +
                '), CIRCLE(\'ICRS\', ' +
                centralPoint.raDeg +
                ', ' +
                centralPoint.decDeg +
                ', ' +
                radius +
                '))';
    }
    return adql;
}
/**
 * Builds an ADQL query from current FoV and fetches footprints.
 * Returns the enriched FootprintSet (if any rows were found), otherwise undefined.
 */
async function queryFootprintSetByFov(footprintSet, polygonAdql, centralPoint) {
    try {
        // Resolve RA/Dec column names (CatalogueProps already picked them from metadata)
        const raCol = queryFootprintSetByFov_getColName(footprintSet.footprintsetProps.raColumn);
        const decCol = queryFootprintSetByFov_getColName(footprintSet.footprintsetProps.decColumn);
        const tapTable = footprintSet.name;
        if (!raCol || !decCol) {
            console.warn('[queryCatalogueByFoV] RA/Dec columns were not resolved from metadata.');
            return;
        }
        const adql = prepareADQL(tapTable, raCol, decCol, polygonAdql, footprintSet.tapRepo, centralPoint);
        const rows = await queryAsync(footprintSet.tapRepo, adql, queryFootprintSetByFov_TAP_QUERY_TIMEOUT_MS);
        console.log(rows);
        // if (rows && rows.data.length > 0) {
        // const metadata = rows.metadata
        // const data = rows.data
        if (typeof rows === 'object' &&
            rows !== null &&
            Array.isArray(rows.metadata) &&
            Array.isArray(rows.data)) {
            const { metadata, data } = rows;
            const tapMetadataList = new tap_TapMetadataList();
            for (const m of metadata) {
                const tapMeta = new tap_TapMetadata(m.name, m.description ?? undefined, m.unit ?? undefined, m.datatype ?? undefined, m.ucd ?? undefined, m.utype ?? undefined);
                tapMetadataList.addMetadata(tapMeta);
            }
            if (data.length > 0) {
                footprintSet.addFootprints(data, tapMetadataList.metadataList);
                return footprintSet;
            }
            else {
                console.log('No results found');
            }
            // }
        }
        else {
            console.log('[queryFootprintSetByFov] No results found.');
            return;
        }
    }
    catch (err) {
        console.error('[queryFootprintSetByFov] Error:', err?.message ?? err);
        return;
    }
}

;// ./src/model/grid/EquatorialGrid.ts
/* eslint-disable @typescript-eslint/no-non-null-assertion */













/** Equatorial grid rendered as RA/Dec great-circle line loops */
class EquatorialGrid extends model_AbstractSkyEntity {
    static ELEM_SIZE = 3;
    static BYTES_X_ELEM = new Float32Array().BYTES_PER_ELEMENT;
    showGrid = true;
    // private _gl: GL;
    _shaderProgram;
    _vertexShader;
    _fragmentShader;
    defaultColor = '#41d421';
    gridText = new grid_GridTextHelper();
    _attribLocations = {
        position: 0,
        selected: 1,
        pointSize: 2,
        color: 3,
    };
    _phiVertexPositionBuffer;
    _thetaVertexPositionBuffer;
    _fov;
    // Step sizes (degrees + radians) and label caches
    _phiStep = 0;
    _phiStepRad = 0;
    _thetaStep = 0;
    _thetaStepRad = 0;
    _phiArray = [];
    _thetaArray = [];
    // For placing text labels near current view center:
    //  - _dec4Labels: key = RA(deg), value = points along that RA ring (for Dec labels)
    //  - _ra4Labels : key = Dec(deg), value = points along that Dec ring (for RA labels)
    _dec4Labels = new Map();
    _ra4Labels = new Map();
    /**
     * @param radius Not used by current implementation (sphere is unit-radius)
     * @param fov    Field of view in degrees
     */
    constructor() {
        super(grid_HealpixGridSingleton.RADIUS, grid_HealpixGridSingleton.INITIAL_POSITION, grid_HealpixGridSingleton.INITIAL_PhiRad, grid_HealpixGridSingleton.INITIAL_ThetaRad, 'equatorial-grid');
    }
    init(fov) {
        this._fov = fov;
        this.initGL(src_Global.gl);
        // Program & buffers
        this._shaderProgram = src_Global.gl.createProgram();
        this.initShaders();
        this._phiVertexPositionBuffer = src_Global.gl.createBuffer();
        this._thetaVertexPositionBuffer = src_Global.gl.createBuffer();
        // Build initial RA/Dec line buffers
        this.initBuffers(this._fov);
    }
    /** Compile/link shaders and fetch uniform/attribute locations */
    initShaders() {
        // Fragment
        const fsSource = shader_GridShaderManager.healpixGridFS();
        this._fragmentShader = src_Global.gl.createShader(src_Global.gl.FRAGMENT_SHADER);
        src_Global.gl.shaderSource(this._fragmentShader, fsSource);
        src_Global.gl.compileShader(this._fragmentShader);
        if (!src_Global.gl.getShaderParameter(this._fragmentShader, src_Global.gl.COMPILE_STATUS)) {
            // Keep identical behavior (alert) but surface errors in console too
            const log = src_Global.gl.getShaderInfoLog(this._fragmentShader) || 'Unknown fragment shader error';
            console.error(log);
            alert(log);
            return;
        }
        // Vertex
        const vsSource = shader_GridShaderManager.healpixGridVS();
        this._vertexShader = src_Global.gl.createShader(src_Global.gl.VERTEX_SHADER);
        src_Global.gl.shaderSource(this._vertexShader, vsSource);
        src_Global.gl.compileShader(this._vertexShader);
        if (!src_Global.gl.getShaderParameter(this._vertexShader, src_Global.gl.COMPILE_STATUS)) {
            const log = src_Global.gl.getShaderInfoLog(this._vertexShader) || 'Unknown vertex shader error';
            console.error(log);
            alert(log);
            return;
        }
        // Link
        src_Global.gl.attachShader(this._shaderProgram, this._vertexShader);
        src_Global.gl.attachShader(this._shaderProgram, this._fragmentShader);
        src_Global.gl.linkProgram(this._shaderProgram);
        if (!src_Global.gl.getProgramParameter(this._shaderProgram, src_Global.gl.LINK_STATUS)) {
            alert('Could not initialise shaders');
        }
        src_Global.gl.useProgram(this._shaderProgram);
    }
    /** Build RA/Dec line vertex arrays based on FoV step helper */
    initBuffers(fovDeg) {
        const R = 1.0;
        const steps = fovHelper.getRADegSteps(fovDeg);
        const phiStep = steps.raStep; // RA step (deg)
        const thetaStep = steps.decStep; // Dec step (deg)
        this._phiStep = phiStep;
        this._phiStepRad = degToRad(phiStep);
        this._thetaStep = thetaStep;
        this._thetaStepRad = degToRad(thetaStep);
        this._ra4Labels = new Map();
        this._dec4Labels = new Map();
        this._phiArray = [];
        this._thetaArray = [];
        // Lines of constant Dec (varying RA): for each Dec, a ring with vertices every phiStep°
        for (let theta = thetaStep; theta < 180; theta += thetaStep) {
            const phiVertexPosition = new Float32Array((360 / phiStep) * 3);
            const thetaRad = degToRad(theta);
            for (let phi = 0; phi < 360; phi += phiStep) {
                const phiRad = degToRad(phi);
                const x = R * Math.sin(thetaRad) * Math.cos(phiRad);
                const y = R * Math.sin(thetaRad) * Math.sin(phiRad);
                const z = R * Math.cos(thetaRad);
                const idx = Math.floor(phi / phiStep);
                phiVertexPosition[3 * idx + 0] = x;
                phiVertexPosition[3 * idx + 1] = y;
                phiVertexPosition[3 * idx + 2] = z;
                if (!this._dec4Labels.has(phi))
                    this._dec4Labels.set(phi, []);
                this._dec4Labels.get(phi).push([x, y, z]);
            }
            this._phiArray.push(phiVertexPosition);
        }
        // Lines of constant RA (varying Dec): for each RA, a ring with vertices every thetaStep°
        for (let phi = 0; phi < 360; phi += phiStep) {
            const thetaVertexPosition = new Float32Array((360 / thetaStep) * 3);
            const phiRad = degToRad(phi);
            for (let theta = 0; theta < 360; theta += thetaStep) {
                const thetaRad = degToRad(theta);
                const x = R * Math.sin(thetaRad) * Math.cos(phiRad);
                const y = R * Math.sin(thetaRad) * Math.sin(phiRad);
                const z = R * Math.cos(thetaRad);
                const idx = Math.floor(theta / thetaStep);
                thetaVertexPosition[3 * idx + 0] = x;
                thetaVertexPosition[3 * idx + 1] = y;
                thetaVertexPosition[3 * idx + 2] = z;
                const decKey = 90 - theta; // original code’s keying for RA labels
                if (!this._ra4Labels.has(decKey))
                    this._ra4Labels.set(decKey, []);
                this._ra4Labels.get(decKey).push([x, y, z]);
            }
            this._thetaArray.push(thetaVertexPosition);
        }
    }
    /** Update buffers when FoV (in degrees) changes */
    refresh() {
        const fovDeg = grid_HealpixGridSingleton.getMinFoV();
        if (this._fov !== fovDeg) {
            this._fov = fovDeg;
            this.initBuffers(this._fov);
        }
    }
    vectorDistance(p1, p2) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dz = p1.z - p2.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    enableShader(mMatrix, pMatrix) {
        const gl = src_Global.gl;
        gl.useProgram(this._shaderProgram);
        // uMVMatrix = camera * model
        const mvMatrix = mat4_create();
        mat4_multiply(mvMatrix, src_Global.camera.getCameraMatrix(), mMatrix);
        // TODO move locations retrieval elsewhere
        // Uniform locations
        const uMVMatrixLoc = gl.getUniformLocation(this._shaderProgram, 'uMVMatrix');
        const uPMatrixLoc = gl.getUniformLocation(this._shaderProgram, 'uPMatrix');
        const uColor = gl.getUniformLocation(this._shaderProgram, 'u_fragcolor');
        // Attribute locations
        this._attribLocations.position = gl.getAttribLocation(this._shaderProgram, 'aCatPosition');
        if (uMVMatrixLoc)
            gl.uniformMatrix4fv(uMVMatrixLoc, false, mvMatrix);
        if (uPMatrixLoc)
            gl.uniformMatrix4fv(uPMatrixLoc, false, pMatrix);
        if (uColor) {
            const rgb = colorHex2RGB(this.defaultColor);
            gl.uniform4f(uColor, rgb[0], rgb[1], rgb[2], 1.0);
        }
    }
    isVisible() {
        return this.showGrid;
    }
    toggleShowGrid() {
        this.showGrid = !this.showGrid;
    }
    /**
     * @param mMatrix model matrix associated with current HiPS (or scene) transform
     * @param fovObj  current field-of-view (degrees). If your FoV type differs,
     *                pass the numeric value here; this signature matches original usage.
     */
    draw() {
        const gl = src_Global.gl;
        const mMatrix = this.getModelMatrix();
        if (this._thetaArray.length === 0)
            return;
        this.refresh();
        if (!this.showGrid) {
            // gridTextHelper.resetDivSets();
            this.gridText.resetDivSets();
            return;
        }
        const pMatrix = ComputePerspectiveMatrix.pMatrix;
        this.enableShader(mMatrix, pMatrix);
        // Draw Dec rings
        for (let i = 0; i < this._phiArray.length; i++) {
            src_Global.gl.bindBuffer(src_Global.gl.ARRAY_BUFFER, this._phiVertexPositionBuffer);
            src_Global.gl.bufferData(src_Global.gl.ARRAY_BUFFER, this._phiArray[i], src_Global.gl.STATIC_DRAW);
            src_Global.gl.vertexAttribPointer(this._attribLocations.position, 3, src_Global.gl.FLOAT, false, 0, 0);
            src_Global.gl.enableVertexAttribArray(this._attribLocations.position);
            src_Global.gl.drawArrays(src_Global.gl.LINE_LOOP, 0, 360 / this._phiStep);
        }
        // Draw RA rings
        for (let j = 0; j < this._thetaArray.length; j++) {
            src_Global.gl.bindBuffer(src_Global.gl.ARRAY_BUFFER, this._thetaVertexPositionBuffer);
            src_Global.gl.bufferData(src_Global.gl.ARRAY_BUFFER, this._thetaArray[j], src_Global.gl.STATIC_DRAW);
            src_Global.gl.vertexAttribPointer(this._attribLocations.position, 3, src_Global.gl.FLOAT, false, 0, 0);
            src_Global.gl.enableVertexAttribArray(this._attribLocations.position);
            src_Global.gl.drawArrays(src_Global.gl.LINE_LOOP, 0, 360 / this._thetaStep);
        }
        // Label layout (HTML overlay)
        const center = utils_FoVUtils.getCenterJ2000(gl.canvas);
        // MVP = P * V * M
        const mvMatrix = mat4_create();
        mat4_multiply(mvMatrix, src_Global.camera.getCameraMatrix(), mMatrix);
        const mvpMatrix = mat4_create();
        mat4_multiply(mvpMatrix, pMatrix, mvMatrix);
        // Dec labels (loop over RA keys)
        for (const [raDegKey, points] of this._dec4Labels.entries()) {
            if (Math.abs(raDegKey - center.raDeg) <= this._phiStep) {
                for (let p = 0; p < points.length; p++) {
                    const [x, y, z] = points[p];
                    const phiPoint = [x, y, z, 1];
                    const point = new model_Point({ x, y, z }, utils_CoordsType.CARTESIAN);
                    const decDeg = point.decDeg;
                    if (Math.abs(decDeg - center.decDeg) < 60) {
                        const clipspace = vec4_create();
                        vec4_transformMat4(clipspace, phiPoint, mvpMatrix);
                        // perspective divide
                        clipspace[0] /= clipspace[3];
                        clipspace[1] /= clipspace[3];
                        // clip->pixel
                        const pixelX = (clipspace[0] * 0.5 + 0.5) * src_Global.gl.canvas.width;
                        const pixelY = (clipspace[1] * -0.5 + 0.5) * src_Global.gl.canvas.height;
                        this.gridText.addEqDivSet(decDeg.toFixed(2), pixelX, pixelY, 'dec');
                        // gridTextHelper.addEqDivSet(decDeg.toFixed(2), pixelX, pixelY, 'dec');
                    }
                }
            }
        }
        // RA labels (loop over Dec keys)
        for (const [decDegKey, points] of this._ra4Labels.entries()) {
            if (Math.abs(decDegKey - center.decDeg) <= this._thetaStep) {
                for (let p = 0; p < points.length; p++) {
                    const [x, y, z] = points[p];
                    const phiPoint = [x, y, z, 1];
                    const point = new model_Point({ x, y, z }, utils_CoordsType.CARTESIAN);
                    const d = this.vectorDistance(point, center);
                    const raDeg = point.raDeg;
                    if (d < degToRad(50)) {
                        const clipspace = vec4_create();
                        vec4_transformMat4(clipspace, phiPoint, mvpMatrix);
                        clipspace[0] /= clipspace[3];
                        clipspace[1] /= clipspace[3];
                        const pixelX = (clipspace[0] * 0.5 + 0.5) * src_Global.gl.canvas.width;
                        const pixelY = (clipspace[1] * -0.5 + 0.5) * src_Global.gl.canvas.height;
                        // gridTextHelper.addEqDivSet(raDeg.toFixed(2), pixelX, pixelY, 'ra');
                        this.gridText.addEqDivSet(raDeg.toFixed(2), pixelX, pixelY, 'ra');
                    }
                }
            }
        }
        this.gridText.resetDivSets();
        // gridTextHelper.resetDivSets();
        // Cleanup
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }
}
const equatorialGridSingleton = new EquatorialGrid();
/* harmony default export */ const grid_EquatorialGrid = (equatorialGridSingleton);

;// ./src/AstroSphere.ts
// AstroSphere.ts














/**
 * AstroSphere — main WebGL scene controller (TS port)
 */
class AstroSphere {
    camera;
    centralPoinCoords;
    mousePointCoords;
    canvas;
    showHPXGrid = false;
    mouseHelper;
    mouseDown = false;
    lastMouseX = null;
    lastMouseY = null;
    inertiaX = 0.0;
    inertiaY = 0.0;
    zoomInertia = 0.0;
    activeHiPS = null;
    startup = true;
    // private insideSphere: boolean
    fov;
    activeCatalogues = [];
    activeFootprintSets = [];
    constructor(canvas, webgl) {
        // Keep global GL context (as in original JS)
        src_Global.gl = webgl;
        this.mouseHelper = new utils_MouseHelper();
        this.canvas = canvas;
        // this.insideSphere = bootSetup.insideSphere
        src_Global.insideSphere = bootSetup.insideSphere;
        this.init(canvas);
        this.fov = grid_HealpixGridSingleton.refreshFoV();
    }
    updateCentralPoint() {
        // const sphericalCoords = cartesianToSpherical(this.camera.getCameraPosition())
        const sphericalCoords = this.getPhiThetaDeg(this.canvas);
        const astroCoords = sphericalToAstroDeg(sphericalCoords.phi, sphericalCoords.theta);
        const raHMS = raDegToHMS(astroCoords.ra);
        const decDMS = decDegToDMS(astroCoords.dec);
        this.centralPoinCoords = {
            astroDeg: astroCoords,
            sphericalDeg: sphericalCoords,
            raHMS: raHMS,
            decDMS: decDMS
        };
        return this.centralPoinCoords;
    }
    updateLastMousePoint() {
        const sphericalCoords = { phi: this.mouseHelper.phi, theta: this.mouseHelper.theta };
        const astroCoords = { ra: this.mouseHelper.ra, dec: this.mouseHelper.dec };
        const raHMS = this.mouseHelper.raHMS;
        const decDMS = this.mouseHelper.decDMS;
        this.mousePointCoords = {
            astroDeg: astroCoords,
            sphericalDeg: sphericalCoords,
            raHMS: raHMS,
            decDMS: decDMS
        };
        return this.mousePointCoords;
    }
    getCentralPointCoordinates() {
        return this.centralPoinCoords;
    }
    getLastMousePointCoordinates() {
        return this.mousePointCoords;
    }
    init(canvas) {
        this.initCamera();
        grid_HealpixGridSingleton.init();
        ComputePerspectiveMatrix.computePerspectiveMatrix(canvas, this.camera, bootSetup.camera_fov_deg, bootSetup.camera_near_plane, bootSetup.insideSphere);
        visibleTilesManager.init(bootSetup.insideSphere);
        grid_EquatorialGrid.init(grid_HealpixGridSingleton.getMinFoV());
        this.updateCentralPoint();
        this.startup = true;
        this.addEventListeners(canvas);
    }
    initCamera() {
        if (bootSetup.insideSphere) {
            this.camera = new src_Camera([0.0, 0.0, -0.005], true);
        }
        else {
            this.camera = new src_Camera([0.0, 0.0, 4.0], false);
        }
        src_Global.camera = this.camera;
    }
    addEventListeners(canvas) {
        if (src_Global.debug) {
            console.log('[AstroSphere::addEventListeners]');
        }
        const handleMouseDown = (event) => {
            canvas.setPointerCapture(event.pointerId);
            this.mouseDown = true;
            // this.lastMouseX = event.pageX
            // this.lastMouseY = event.pageY
            this.lastMouseX = event.clientX;
            this.lastMouseY = event.clientY;
            // session.clearHoveredFootprints()
            event.preventDefault();
            return false;
        };
        const handleMouseUp = (event) => {
            canvas.releasePointerCapture(event.pointerId);
            this.mouseDown = false;
            document.body.style.cursor = 'auto';
            this.lastMouseX = event.clientX;
            this.lastMouseY = event.clientY;
        };
        const handleMouseMove = (event) => {
            const newX = event.clientX;
            const newY = event.clientY;
            if (!grid_HealpixGridSingleton)
                return;
            if (this.mouseDown) {
                document.body.style.cursor = 'grab';
                const deltaX = ((newX - (this.lastMouseX ?? newX)) * Math.PI) / canvas.width;
                const deltaY = ((newY - (this.lastMouseY ?? newY)) * Math.PI) / canvas.height;
                this.inertiaX += 0.1 * deltaX;
                this.inertiaY += 0.1 * deltaY;
            }
            else {
                const mousePoint = utils_RayPickingUtils.getIntersectionPointWithSingleModel(newX, newY);
                if (mousePoint && mousePoint.length > 0) {
                    this.mouseHelper.update(mousePoint);
                    this.updateLastMousePoint();
                }
            }
            this.updateCentralPoint();
            this.lastMouseX = newX;
            this.lastMouseY = newY;
            event.preventDefault();
        };
        const handleMouseWheel = (event) => {
            if (event.deltaY < 0) {
                this.zoomInertia -= 0.001;
            }
            else {
                this.zoomInertia += 0.001;
            }
            event.preventDefault();
        };
        canvas.onpointerdown = handleMouseDown;
        canvas.onpointerup = handleMouseUp;
        canvas.onpointermove = handleMouseMove;
        // canvas.onwheel = handleMouseWheel
        canvas.addEventListener('wheel', handleMouseWheel, { passive: false });
    }
    // REVIEW THIS METHOD AND MOVE IT
    getPhiThetaDeg(canvas) {
        const maxX = canvas.width;
        const maxY = canvas.height;
        const pickerPoint = utils_RayPickingUtils.getIntersectionPointWithSingleModel(maxX / 2, maxY / 2);
        return cartesianToSpherical(pickerPoint);
    }
    activateHiPS(hipsDescriptor) {
        this.activeHiPS = new hips_HiPS(1, [0.0, 0.0, 0.0], 0, 0, hipsDescriptor);
    }
    // Catalogue section
    async showCatalogue(catalogue) {
        const fovPolyAstro = utils_FoVUtils.getFoVPolygon(this.camera, this.canvas, grid_HealpixGridSingleton);
        const polygonAdql = utils_FoVUtils.getAstroFoVPolygon(fovPolyAstro); // -> "POLYGON('ICRS', ra1, dec1, ...)"
        const cat = await queryCatalogueByFoV(catalogue, polygonAdql);
        console.log(cat);
        if (cat)
            this.activeCatalogues.push(cat);
        return cat;
    }
    deleteCatalogue(catalogue) {
        this.activeCatalogues = this.activeCatalogues.filter(c => c !== catalogue);
    }
    // End Catalogue section
    // Footprint section
    async showFootprintSet(footprintSet) {
        const fovPolyAstro = utils_FoVUtils.getFoVPolygon(this.camera, this.canvas, grid_HealpixGridSingleton);
        const polygonAdql = utils_FoVUtils.getAstroFoVPolygon(fovPolyAstro); // -> "POLYGON('ICRS', ra1, dec1, ...)"
        const centralPoint = utils_FoVUtils.getCenterJ2000(this.canvas);
        const fset = await queryFootprintSetByFov(footprintSet, polygonAdql, centralPoint);
        console.log(fset);
        if (fset)
            this.activeFootprintSets.push(fset);
        return fset;
    }
    deleteFootprintSet(footprintSet) {
        this.activeFootprintSets = this.activeFootprintSets.filter(fst => fst !== footprintSet);
    }
    getHoveredFootprints() {
        let footprintsHovered = [];
        this.activeFootprintSets.forEach(fset => {
            footprintsHovered.push(fset.hoveredFootprints);
        });
        return footprintsHovered;
    }
    // End Footprint section
    goTo(raDeg, decDeg) {
        this.camera.goTo(raDeg, decDeg);
    }
    getFoV() {
        return this.fov;
    }
    getFoVPolygon() {
        return utils_FoVUtils.getFoVPolygon(this.camera, this.canvas, grid_HealpixGridSingleton);
    }
    changeFoV(deg) {
        // throw new Error("not Implemented")
        const distance = grid_HealpixGridSingleton.getFoV().computeDistanceFromAngle(deg);
        // this.camera.moveAlongView(distance)
        this.camera.translate(distance);
        grid_HealpixGridSingleton.refreshFoV();
    }
    changeFoV2(deg) {
        // throw new Error("not Implemented")
        const newCameraPos = grid_HealpixGridSingleton.getFoV().computeCameraPositionForFoV(deg);
        this.camera.setCameraPosition(newCameraPos);
        // this.camera.moveAlongView(distance)
        // this.camera.translate(distance)
    }
    changeFoV3(deg) {
        const newPos = grid_HealpixGridSingleton.getFoV().computeCameraPositionForAngularDiameter(deg);
        this.camera.setCameraPosition(newPos);
        // Recompute projection after moving the camera
        ComputePerspectiveMatrix.computePerspectiveMatrix(this.canvas, this.camera, bootSetup.camera_fov_deg, bootSetup.camera_near_plane, false);
    }
    getInsideSphere() {
        return src_Global.insideSphere;
    }
    toggleInsideSphere() {
        // this.insideSphere = !this.insideSphere
        src_Global.insideSphere = !src_Global.insideSphere;
        console.log(src_Global.insideSphere);
        this.camera.toggleInsideSphere();
        // visibleTilesManager.toggleInsideSphere()
    }
    draw(canvas) {
        if (!src_Global.gl)
            return;
        if (!this.activeHiPS)
            return;
        if (!grid_HealpixGridSingleton || Object.keys(grid_HealpixGridSingleton).length === 0)
            return;
        if (grid_HealpixGridSingleton.fovObj === undefined)
            return;
        // In WebGL2, OES_element_index_uint is core, no need to fetch the extension each frame.
        // global.gl.getExtension('OES_element_index_uint')
        // global.gl.clear(global.gl.COLOR_BUFFER_BIT | global.gl.DEPTH_BUFFER_BIT)
        ComputePerspectiveMatrix.computePerspectiveMatrix(canvas, this.camera, bootSetup.camera_fov_deg, bootSetup.camera_near_plane, src_Global.insideSphere);
        let cameraRotated = false;
        let THETA = 0;
        let PHI = 0;
        src_Global.gl.viewport(0, 0, src_Global.gl.drawingBufferWidth, src_Global.gl.drawingBufferHeight);
        src_Global.gl.clear(src_Global.gl.COLOR_BUFFER_BIT | src_Global.gl.DEPTH_BUFFER_BIT);
        // Zoom inertia
        if (grid_HealpixGridSingleton.fovObj.minFoV > 0.1 || this.zoomInertia > 0) {
            if (Math.abs(this.zoomInertia) > 0.0001) {
                this.camera.zoom(this.zoomInertia);
                this.zoomInertia *= 0.95;
                this.fov = grid_HealpixGridSingleton.refreshFoV();
            }
        }
        // Rotation inertia
        if (this.mouseDown || Math.abs(this.inertiaX) > 0.02 || Math.abs(this.inertiaY) > 0.02) {
            cameraRotated = true;
            THETA = this.inertiaY;
            PHI = this.inertiaX;
            this.inertiaX *= 0.95;
            this.inertiaY *= 0.95;
            this.camera.rotate(PHI, THETA);
            ComputePerspectiveMatrix.computePerspectiveMatrix(canvas, this.camera, bootSetup.camera_fov_deg, bootSetup.camera_near_plane, src_Global.insideSphere);
        }
        else {
            this.inertiaY = 0;
            this.inertiaX = 0;
        }
        // GL state
        src_Global.gl.disable(src_Global.gl.DEPTH_TEST);
        src_Global.gl.enable(src_Global.gl.BLEND);
        src_Global.gl.enable(src_Global.gl.CULL_FACE);
        src_Global.gl.cullFace(src_Global.insideSphere ? src_Global.gl.BACK : src_Global.gl.FRONT);
        src_Global.gl.blendFunc(src_Global.gl.SRC_ALPHA, src_Global.gl.ONE_MINUS_SRC_ALPHA);
        // DRAW HiPS
        this.activeHiPS.draw();
        grid_HealpixGridSingleton.draw();
        grid_EquatorialGrid.draw();
        src_Global.gl.enable(src_Global.gl.DEPTH_TEST);
        src_Global.gl.disable(src_Global.gl.CULL_FACE);
        if (this.startup) {
            this.startup = false;
            const phiTheta = this.getPhiThetaDeg(canvas);
            const raDecDeg = sphericalToAstroDeg(phiTheta.phi, phiTheta.theta);
            const raHMS = raDegToHMS(raDecDeg.ra);
            const decDMS = decDegToDMS(raDecDeg.dec);
            console.log('(startup coords)', {
                raDeg: raDecDeg.ra,
                decDeg: raDecDeg.dec,
                raHMS,
                decDMS,
            });
        }
        this.activeCatalogues.forEach(cat => {
            if (this.activeHiPS) {
                cat.draw(this.activeHiPS.getModelMatrix(), this.mouseHelper);
            }
        });
        this.activeFootprintSets.forEach(fst => {
            if (this.activeHiPS) {
                fst.draw(this.activeHiPS.getModelMatrix(), this.mouseHelper);
            }
        });
    }
}
/* harmony default export */ const src_AstroSphere = (AstroSphere);

;// ./src/AstroViewer.ts





class AstroViewer {
    astroSphere;
    canvas;
    webgl;
    rafId = null;
    // API
    run() {
        return this.tick();
    }
    // CATALOGUES
    showCatalogue(catalogue) {
        this.astroSphere.showCatalogue(catalogue);
    }
    hideCatalogue(catalogue, isVisible) {
        catalogue.setIsVisible(isVisible);
    }
    deleteCatalogue(catalogue) {
        this.astroSphere.deleteCatalogue(catalogue);
    }
    changeCatalogueColor(catalogue, hexColor) {
        catalogue.catalogueProps.changeColor(hexColor);
    }
    setCatalogueShapeHue(catalogue, metadataColumnName) {
        catalogue.changeCatalogueMetaShapeHue(metadataColumnName);
    }
    setCatalogueShapeSize(catalogue, metadataColumnName) {
        catalogue.changeCatalogueMetaShapeSize(metadataColumnName);
    }
    //FOOTPRINT
    showFootprintSet(footprintSet) {
        this.astroSphere.showFootprintSet(footprintSet);
    }
    hideFootprintSet(footprintSet, isVisible) {
        footprintSet.setIsVisible(isVisible);
    }
    deleteFootprintSet(footprintSet) {
        this.astroSphere.deleteFootprintSet(footprintSet);
    }
    changeFootprintSetColor(footprintSet, hexColor) {
        footprintSet.footprintsetProps.changeColor(hexColor);
    }
    getHoveredFootprints() {
        return this.astroSphere.getHoveredFootprints();
    }
    // HIPS
    getDefaultHiPSURL() {
        return bootSetup.defaultHipsUrl;
    }
    activateHiPS(hipsDescriptor) {
        this.astroSphere.activateHiPS(hipsDescriptor);
    }
    // GOTOs and COORDS
    goTo(raDeg, decDeg) {
        this.astroSphere.goTo(raDeg, decDeg);
    }
    getCenterCoordinates() {
        return this.astroSphere.getCentralPointCoordinates();
    }
    getCoordinatesFromMouse() {
        return this.astroSphere.getLastMousePointCoordinates();
    }
    // GRIDs
    toggleHealpixGrid() {
        grid_HealpixGridSingleton.toggleShowGrid();
    }
    isHealpixGridVisible() {
        return grid_HealpixGridSingleton.isVisible();
    }
    toggleEquatorialGrid() {
        grid_EquatorialGrid.toggleShowGrid();
    }
    isEquatorialGridVisible() {
        return grid_EquatorialGrid.isVisible();
    }
    // FOV
    getFoV() {
        return this.astroSphere.getFoV();
    }
    getFoVPolygon() {
        return this.astroSphere.getFoVPolygon();
    }
    changeFoV(deg) {
        this, this.astroSphere.changeFoV(deg);
    }
    changeFoV2(deg) {
        this, this.astroSphere.changeFoV2(deg);
    }
    changeFoV3(deg) {
        this, this.astroSphere.changeFoV3(deg);
    }
    getInsideSphere() {
        return this.astroSphere.getInsideSphere();
    }
    toggleInsideSphere() {
        this.astroSphere.toggleInsideSphere();
    }
    // Internal
    constructor() {
        this.init();
    }
    init() {
        console.log('init webgl');
        const c = document.getElementById('astrocanvas');
        if (!(c instanceof HTMLCanvasElement)) {
            throw new Error("Element with id 'canvas-ab' is not a canvas.");
        }
        this.canvas = c;
        const gl = this.canvas.getContext('webgl2', { alpha: false });
        if (!gl) {
            alert('Could not initialise WebGL, sorry :-(');
            throw new Error('WebGL2 not available');
        }
        // Extend with custom fields used elsewhere
        this.webgl = gl;
        this.webgl.viewportWidth = this.canvas.width;
        this.webgl.viewportHeight = this.canvas.height;
        try {
            // 1/255 = 0.00392156862
            this.webgl.clearColor(0 * 0.00392156862, 16 * 0.00392156862, 50 * 0.00392156862, 0.7);
        }
        catch (e) {
            console.log('Error instantiating WebGL context');
        }
        this.initListeners();
        src_Global.gl = this.webgl;
        this.astroSphere = new src_AstroSphere(this.canvas, this.webgl);
    }
    initListeners() {
        console.log('inside initListeners');
        const resizeCanvas = () => {
            console.log('[resizeCanvas]');
            const newWidth = window.innerWidth - 3;
            const newHeight = window.innerHeight - 3;
            this.canvas.width = newWidth;
            this.canvas.height = newHeight;
            this.webgl.viewportWidth = this.canvas.width;
            this.webgl.viewportHeight = this.canvas.height;
            this.webgl.viewport(0, 0, this.canvas.width, this.canvas.height);
        };
        const handleContextLost = (event) => {
            console.log('[handleContextLost]');
            event.preventDefault();
            if (this.rafId !== null) {
                cancelAnimationFrame(this.rafId);
                this.rafId = null;
            }
        };
        const handleContextRestored = (_event) => {
            console.log('[handleContextRestored]');
            this.webgl.viewportWidth = this.canvas.width;
            this.webgl.viewportHeight = this.canvas.height;
            this.webgl.clearColor(0 * 0.00392156862, 16 * 0.00392156862, 50 * 0.00392156862, 0.7);
            this.webgl.enable(this.webgl.DEPTH_TEST);
            this.rafId = requestAnimationFrame(() => this.tick());
        };
        window.addEventListener('resize', resizeCanvas);
        this.canvas.addEventListener('webglcontextlost', handleContextLost, false);
        this.canvas.addEventListener('webglcontextrestored', handleContextRestored, false);
        resizeCanvas();
    }
    tick() {
        this.drawScene();
        this.rafId = requestAnimationFrame(() => this.tick());
        return this.rafId;
    }
    drawScene() {
        this.astroSphere.draw(this.canvas);
    }
}

;// ./src/model/hips/HiPSDescriptor.ts
// HiPSDescriptor.ts

class HiPSDescriptor {
    _minOrder = 3;
    _imgformats = [];
    _datarange = { min: undefined, max: undefined };
    _maxOrder;
    _tilewidth;
    _hipsFrame;
    _hipsName = 'NONAME';
    _hipsurl;
    _emMin;
    _emMax;
    _isGalctic = false;
    constructor(hipsproperties, hipsurl) {
        this._hipsurl = hipsurl;
        const lines = hipsproperties.split(/\r\n|\n/);
        for (const raw of lines) {
            const line = raw.trim();
            if (!line || line.startsWith('#'))
                continue;
            if (line.startsWith('hips_tile_format') || line.startsWith('format')) {
                // normalize jpeg→jpg
                const list = this.getValue(line)?.replace(/jpeg/gi, 'jpg') ?? '';
                this._imgformats = list.split(/\s+/).filter(Boolean);
            }
            else if (line.startsWith('hips_data_range')) {
                const v = this.getValue(line);
                if (v) {
                    const [minStr, maxStr] = v.split(/\s+/);
                    this._datarange.min = parseFloat(minStr);
                    this._datarange.max = parseFloat(maxStr);
                }
            }
            else if (line.startsWith('hips_tile_width')) {
                const n = Number(this.getValue(line));
                this._tilewidth = Number.isFinite(n) ? n : undefined;
            }
            else if (line.startsWith('hips_order_min')) {
                const n = Number(this.getValue(line));
                this._minOrder = Number.isFinite(n) ? n : this._minOrder;
            }
            else if (line.startsWith('hips_order') || line.startsWith('maxOrder')) {
                const n = Number(this.getValue(line));
                this._maxOrder = Number.isFinite(n) ? n : this._maxOrder;
            }
            else if (line.startsWith('hips_frame') || line.startsWith('frame')) {
                this._hipsFrame = this.getValue(line);
            }
            else if (line.startsWith('obs_collection') || line.startsWith('label')) {
                this._hipsName = this.getValue(line) ?? this._hipsName;
            }
            else if (line.startsWith('em_min')) {
                const n = Number(this.getValue(line));
                this._emMin = Number.isFinite(n) ? n : undefined;
            }
            else if (line.startsWith('em_max')) {
                const n = Number(this.getValue(line));
                this._emMax = Number.isFinite(n) ? n : undefined;
            }
        }
        if (!this._hipsName) {
            console.warn(`[HiPSDescriptor] hipsName not defined in properties of ${this._hipsurl}. Defaulting to 'NONAME'.`);
        }
        if (!this._hipsFrame) {
            console.warn(`[HiPSDescriptor] hips_frame not defined in properties of ${this._hipsurl}. Defaulting to 'equatorial'.`);
            this._hipsFrame = 'equatorial';
        }
        this._isGalctic = this._hipsFrame.toLowerCase().includes('gal');
        if (this._maxOrder === undefined || this._imgformats.length === 0) {
            throw new Error(`[HiPSDescriptor] Invalid properties for ${this._hipsurl}. maxOrder=${this._maxOrder}, imgFormats.length=${this._imgformats.length}`);
        }
    }
    getValue(line) {
        const idx = line.indexOf('=');
        if (idx < 0)
            return undefined;
        return line.slice(idx + 1).trim();
    }
    // --- Getters ---
    get surveyName() {
        return this._hipsName;
    }
    get url() {
        return this._hipsurl;
    }
    get maxOrder() {
        return this._maxOrder;
    }
    get minOrder() {
        return this._minOrder;
    }
    get imgFormats() {
        return this._imgformats;
    }
    get hipsFrame() {
        return this._hipsFrame;
    }
    get isGalactic() {
        return this._isGalctic;
    }
    get emMin() {
        return this._emMin;
    }
    get emMax() {
        return this._emMax;
    }
    get tileWidth() {
        return this._tilewidth;
    }
    get dataRange() {
        return this._datarange;
    }
}

;// ./src/index.ts





console.log('astroviewer UMD loaded');

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=astroviewer.cjs.map