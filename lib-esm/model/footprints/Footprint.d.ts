/**
 * @author Fabrizio Giordano (Fab)
 */
import { SelectionObj } from '../../utils/GeomUtils.js';
import { Point } from '../Point.js';
export interface FootprintDetail {
    key: string;
    value: string | number;
    valueType?: string;
    unit?: string;
}
export declare class Footprint {
    private _polygons;
    private _convexPolygons;
    private _stcs?;
    private _valid;
    private _details;
    private _totPoints;
    private _totConvexPoints;
    private _npix256?;
    private _footprintsPointsOrder?;
    private _selectionObj;
    private _identifier?;
    private _center?;
    /**
     * @param in_stcs STC-S representation of the footprint
     * @param in_details optional metadata
     * @param footprintsPointsOrder 1-> clockwise, -1 counter clockwise
     */
    constructor(in_stcs?: string, in_details?: FootprintDetail[], footprintsPointsOrder?: 1 | -1);
    private computeSelectionObject;
    private computePoints;
    get valid(): boolean;
    get totPoints(): number;
    get totConvexPoints(): number;
    get polygons(): Point[][];
    get convexPolygons(): Point[][];
    get identifier(): string | undefined;
    get center(): unknown;
    get pixels(): number[] | undefined;
    get details(): FootprintDetail[];
    get selectionObj(): SelectionObj | undefined;
}
