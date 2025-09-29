/**
 * @author Fabrizio Giordano (Fab77)
 */
'use strict';

import { vec3 } from 'gl-matrix';
import {
  cartesianToSpherical,
  sphericalToCartesian,
  sphericalToAstroDeg,
  astroDegToSpherical,
  type SphericalCoords,
} from '../utils/Utils';
import CoordsType from '../utils/CoordsType';
import global from '../Global';

type CartesianOpts = { x: number; y: number; z: number };
type AstroOpts = { raDeg: number; decDeg: number };
type SphericalOpts = { phiDeg: number; thetaDeg: number };
type PointInitOpts = CartesianOpts | AstroOpts | SphericalOpts;

class Point {
  private _x!: number;
  private _y!: number;
  private _z!: number;
  private _xyz!: [number, number, number];

  private _raDeg!: number;
  private _decDeg!: number;
  private _raRad!: number;
  private _decRad!: number;
  private _raDecDeg!: [number, number];

  constructor(in_options: PointInitOpts, in_type: CoordsType) {
    this._xyz = [0, 0, 0];
    this._raDecDeg = [0, 0];

    // Prefer config value if present, fallback to 12
    const MAX_DECIMALS: number =
      (global as any).MAX_DECIMALS ?? (global as any).maxDecimals ?? 12;

    if (in_type === CoordsType.CARTESIAN) {
      const { x, y, z } = in_options as CartesianOpts;
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
    } else if (in_type === CoordsType.ASTRO) {
      const { raDeg, decDeg } = in_options as AstroOpts;
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
    } else if (in_type === CoordsType.SPHERICAL) {
      // Not implemented in original; keep behavior
      console.log(`${CoordsType.SPHERICAL} not implemented yet`);
      this._x = 0; this._y = 0; this._z = 0;
      this._raDeg = 0; this._decDeg = 0;
      this._raRad = 0; this._decRad = 0;
    } else {
      console.error('CoordsType ' + String(in_type) + ' not recognised.');
      // Initialize to zeroed state to keep object consistent
      this._x = 0; this._y = 0; this._z = 0;
      this._raDeg = 0; this._decDeg = 0;
      this._raRad = 0; this._decRad = 0;
    }
  }

  private computeAstroCoords(): [number, number] {
    const phiThetaDeg = cartesianToSpherical(
      vec3.fromValues(this._xyz[0], this._xyz[1], this._xyz[2])
    );
    const rad = sphericalToAstroDeg(phiThetaDeg.phi, phiThetaDeg.theta);
    return [rad.ra, rad.dec];
  }

  private computeCartesianCoords(): [number, number, number] {
    const phiThetaDeg = astroDegToSpherical(this._raDeg, this._decDeg);
    const [x, y, z] = sphericalToCartesian(phiThetaDeg.phi, phiThetaDeg.theta, 1);
    return [x, y, z];
  }

  /**
   * @return {phi, theta} (degrees)
   */
  computeHealpixPhiTheta(): SphericalCoords {
    return astroDegToSpherical(this._raDeg, this._decDeg);
  }

  /** Scale the vector by a given factor */
  scale(n: number): Point {
    return new Point({ x: this.x * n, y: this.y * n, z: this.z * n }, CoordsType.CARTESIAN);
  }

  dot(v: Point): number {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  cross(v: Point): Point {
    return new Point(
      {
        x: this.y * v.z - v.y * this.z,
        y: this.z * v.x - v.z * this.x,
        z: this.x * v.y - v.x * this.y,
      },
      CoordsType.CARTESIAN
    );
  }

  norm(): Point {
    const d = 1 / this.length();
    return new Point({ x: this.x * d, y: this.y * d, z: this.z * d }, CoordsType.CARTESIAN);
  }

  length(): number {
    return Math.sqrt(this.lengthSquared());
  }

  lengthSquared(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  subtract(v: Point): Point {
    return new Point(
      { x: this.x - v.x, y: this.y - v.y, z: this.z - v.z },
      CoordsType.CARTESIAN
    );
  }

  add(v: Point): Point {
    return new Point(
      { x: this.x + v.x, y: this.y + v.y, z: this.z + v.z },
      CoordsType.CARTESIAN
    );
  }

  get x(): number { return this._x; }
  get y(): number { return this._y; }
  get z(): number { return this._z; }
  get xyz(): [number, number, number] { return this._xyz; }

  get raDeg(): number { return this._raDeg; }
  get decDeg(): number { return this._decDeg; }
  get raDecDeg(): [number, number] { return this._raDecDeg; }

  toADQL(): string {
    return `${this._raDecDeg[0]},${this._raDecDeg[1]}`;
  }

  toString(): string {
    return `(raDeg, decDeg) => (${this._raDecDeg[0]},${this._raDecDeg[1]}) (x, y,z) => (${this._xyz[0]},${this._xyz[1]},${this._xyz[2]})`;
  }
}

export default Point;