// 'use strict'
// /**
//  * @author Fabrizio Giordano (Fab)
//  */

// import { Pointing, Healpix } from 'healpixjs'
// import { degToRad } from '../utils/Utils.js'
// import GeomUtils from '../utils/GeomUtils.js'
// import global from '../Global.js'
// import STCSParser from '../utils/STCSParser.js'
// import Point from '../model/Point.js'

// type FootprintDetail = {
//   key: string
//   value: unknown
//   valueType?: string
//   unit?: string
// }

// type SelectionObject = ReturnType<typeof GeomUtils.computeSelectionObject>

// class Footprint {
//   // array of polygons (each polygon is an array of Point)
//   private _polygons: Point[][] = []
//   // array of convex polygons (each polygon is an array of Point)
//   private _convexPolygons: Point[][] = []
//   // STC-S Space-Time Coordinate Metadata Linear String Implementation
//   private _stcs: string

//   private _details: FootprintDetail[]
//   private _totPoints = 0
//   private _totConvexPoints = 0
//   private _npix256?: number[]
//   // 1 -> clockwise, -1 -> counter-clockwise
//   private _footprintsPointsOrder?: 1 | -1

//   // selection helper (projection strategy + bbox), produced by GeomUtils
//   private _selectionObj!: SelectionObject

//   // Optional metadata the class referenced in getters
//   private _identifier?: string
//   private _center?: Point

//   /**
//    * @param in_stcs STC-S representation of the footprint
//    * @param in_details Array of detail records
//    * @param footprintsPointsOrder 1 (clockwise) or -1 (counter-clockwise)
//    */
//   constructor(in_stcs: string, in_details: FootprintDetail[] = [], footprintsPointsOrder?: 1 | -1) {
//     this._stcs = in_stcs.toUpperCase()
//     this._details = in_details
//     this._footprintsPointsOrder = footprintsPointsOrder

//     this.computePoints()
//     // If needed later:
//     // this._footprintsPointsOrder = GeomUtils.isPolyClockwise(this._polygons);
//     // this.computeConvexPoly();

//     this.computeSelectionObject()

//     if (global.healpix4footprints) {
//       this._npix256 = this.computeNpix256()
//     }
//   }

//   private computeSelectionObject(): void {
//     this._selectionObj = GeomUtils.computeSelectionObject(this._polygons)
//   }

  
//   /**
//    * @returns array of HEALPix pixels covering the footprint (nside from Global)
//    * NOTE: method name kept for backward compatibility.
//    */
//   private computeNpix256(): number[] {
//     // Ensure convex polygons are available if required by your pipeline:
//     // this.computeConvexPoly()

//     const healpix256 = new Healpix(global.nsideForSelection)

//     const points: Pointing[] = []
//     for (let i = 0; i < this._convexPolygons.length; i++) {
//       const poly = this._convexPolygons[i]
//       for (let j = 0; j < poly.length; j++) {
//         const currPoint = poly[j]
//         const phiTheta = currPoint.computeHealpixPhiTheta()
//         const phiRad = degToRad(phiTheta.phi)
//         const thetaRad = degToRad(phiTheta.theta)
//         const pointing = new Pointing(null, false, thetaRad, phiRad)
//         points.push(pointing)
//       }
//     }

//     const rangeSet = healpix256.queryPolygonInclusive(points, 32)
//     return Array.from(rangeSet.r)
//   }

//   private computePoints(): void {
//     const res = STCSParser.parseSTCS(this._stcs)
//     this._polygons = res.polygons as Point[][]
//     this._totPoints = res.totpoints
//   }

//   // --------- Getters ---------
//   get totPoints(): number {
//     return this._totPoints
//   }

//   get totConvexPoints(): number {
//     return this._totConvexPoints
//   }

//   get polygons(): Point[][] {
//     return this._polygons
//   }

//   get convexPolygons(): Point[][] {
//     return this._convexPolygons
//   }

//   get identifier(): string | undefined {
//     return this._identifier
//   }

//   get center(): Point | undefined {
//     return this._center
//   }

//   get pixels(): number[] | undefined {
//     return this._npix256
//   }

//   // Expose selection object if other modules read it
//   get selectionObject(): SelectionObject {
//     return this._selectionObj
//   }
// }

// export default Footprint