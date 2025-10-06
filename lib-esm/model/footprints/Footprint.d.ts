export interface FootprintDetail {
    key: string;
    value: string | number;
    valueType?: string;
    unit?: string;
}
declare class Footprint {
    private _polygons;
    private _convexPolygons;
    private _stcs?;
    private _valid;
    private _details;
    private _totPoints;
    private _totConvexPoints;
    private _npix256?;
    private _footprintsPointsOrder?;
    private _selectionObj?;
    private _identifier?;
    private _center?;
    /**
     * @param in_stcs STC-S representation of the footprint
     * @param in_details optional metadata
     * @param footprintsPointsOrder 1-> clockwise, -1 counter clockwise
     */
    constructor(in_stcs?: string, in_details?: FootprintDetail[], footprintsPointsOrder?: 1 | -1);
    private computeSelectionObject;
    /**
     * Return array of HEALPix pixels covering the footprint
     * NOTE: despite the name, nside is not fixed at 256. It comes from Global.js
     */
    private computeNpix256;
    private computePoints;
    get valid(): boolean;
    get totPoints(): number;
    get totConvexPoints(): number;
    get polygons(): any[][];
    get convexPolygons(): any[][];
    get identifier(): string | undefined;
    get center(): unknown;
    get pixels(): number[] | undefined;
    get details(): FootprintDetail[];
}
export default Footprint;
//# sourceMappingURL=Footprint.d.ts.map