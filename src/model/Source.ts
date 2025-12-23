'use strict';

import { Healpix, Vec3, Pointing } from 'healpixjs';
import global from '../Global.js';
import {Point} from './Point.js';

export interface SourceDetail {
  key: string;
  value: string | number;
  valueType?: string;
  unit?: string;
}

export class Source {
  private _point: Point;
  private _name?: string;
  private _details: any[];
  private _h_pix!: number;
  private _shapesize: number;
  private _brightnessFactor: number;

  /**
   * @param in_point Point.js (Cartesian/RA-Dec wrapper)
   * @param in_details Optional array of key/value metadata
   */
  constructor(in_point: Point, in_details: any[] = []) {
    this._point = in_point;
    this._details = in_details;
    this._shapesize = 16.0;
    this._brightnessFactor = -99;

    this.computeHealpixPixel();
  }
  
  getDetailByindex(index: number): string | number | undefined {
    if (index < 0 || index >= this._details.length) {
      return undefined;
    }
    return this._details[index];
  }

  get details(): any[] {
    return this._details;
  }
  private computeHealpixPixel(): void {
    // Get Healpix instance from global
    const healpix: Healpix = global.getHealpix(global.nsideForSelection);
    const vec3 = new Vec3(this._point.x, this._point.y, this._point.z);
    const ptg = new Pointing(vec3, false);
    this._h_pix = healpix.ang2pix(ptg, false);
  }

  get point(): Point {
    return this._point;
  }

  get name(): string | undefined {
    return this._name;
  }

  get healpixPixel(): number {
    return this._h_pix;
  }

  get shapeSize(): number {
    return this._shapesize;
  }
  set shapeSize(size: number) {
    this._shapesize = size;
  }

  get brightnessFactor(): number {
    return this._brightnessFactor;
  }
  /**
   * @param factor Must be in [-1..1]
   */
  set brightnessFactor(factor: number) {
    this._brightnessFactor = factor;
  }
}