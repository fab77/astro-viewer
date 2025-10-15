'use strict';
/**
 * @author Fabrizio Giordano (Fab)
 */

// import { Pointing, Healpix } from 'healpixjs';
// import { degToRad } from '../../utils/Utils.js';
import GeomUtils, { SelectionObj } from '../../utils/GeomUtils.js';
// import global from '../../Global.js';
import STCSParser, { STCSParseResult } from '../../utils/STCSParser.js';
import Point from '../Point.js';

export interface FootprintDetail {
  key: string;
  value: string | number;
  valueType?: string;
  unit?: string;
}

// export interface ParsedSTCS {
//   polygons: Point[][]; // array of polygons (each polygon is array of Point objects)
//   totpoints: number;
// }

class Footprint {
  private _polygons: Point[][] = []; // array of polygons (-> array of points)
  private _convexPolygons: any[][] = []; // convex polygons
  private _stcs?: string; // STC-S string
  private _valid = false;
  private _details: FootprintDetail[];
  private _totPoints = 0;
  private _totConvexPoints = 0;
  private _npix256?: number[];
  private _footprintsPointsOrder?: 1 | -1;
  private _selectionObj: SelectionObj | undefined;

  private _identifier?: string;
  private _center?: unknown; // could be typed if you have a Point type

  /**
   * @param in_stcs STC-S representation of the footprint
   * @param in_details optional metadata
   * @param footprintsPointsOrder 1-> clockwise, -1 counter clockwise
   */
  constructor(
    in_stcs?: string,
    in_details: FootprintDetail[] = [],
    footprintsPointsOrder?: 1 | -1
  ) {
    if (in_stcs) {
      this._stcs = in_stcs.toUpperCase();
      this._details = in_details;
      this._totPoints = 0;
      this._totConvexPoints = 0;
      this._footprintsPointsOrder = footprintsPointsOrder;

      this.computePoints();
      this._selectionObj = this.computeSelectionObject();

      this._valid = true;
    } else {
      this._details = [];
    }
  }

  private computeSelectionObject(): SelectionObj {
    return GeomUtils.computeSelectionObject(this._polygons);
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

  private computePoints(): void {
    const res: STCSParseResult = STCSParser.parseSTCS(this._stcs!);
    this._polygons = res.polygons;
    this._totPoints = res.totpoints;
  }

  get valid(): boolean {
    return this._valid;
  }

  get totPoints(): number {
    return this._totPoints;
  }

  get totConvexPoints(): number {
    return this._totConvexPoints;
  }

  get polygons(): Point[][] {
    return this._polygons;
  }

  get convexPolygons(): Point[][] {
    return this._convexPolygons;
  }

  get identifier(): string | undefined {
    return this._identifier;
  }

  get center(): unknown {
    return this._center;
  }

  get pixels(): number[] | undefined {
    return this._npix256;
  }

  get details(): FootprintDetail[] {
    return this._details;
  }

  get selectionObj(): SelectionObj | undefined{
    return this._selectionObj
  }
}

export default Footprint;