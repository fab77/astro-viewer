import { Point } from './Point.js';
export interface SourceDetail {
    key: string;
    value: string | number;
    valueType?: string;
    unit?: string;
}
declare class Source {
    private _point;
    private _name?;
    private _details;
    private _h_pix;
    private _shapesize;
    private _brightnessFactor;
    /**
     * @param in_point Point.js (Cartesian/RA-Dec wrapper)
     * @param in_details Optional array of key/value metadata
     */
    constructor(in_point: Point, in_details?: any[]);
    getDetailByindex(index: number): string | number | undefined;
    get details(): any[];
    private computeHealpixPixel;
    get point(): Point;
    get name(): string | undefined;
    get healpixPixel(): number;
    get shapeSize(): number;
    set shapeSize(size: number);
    get brightnessFactor(): number;
    /**
     * @param factor Must be in [-1..1]
     */
    set brightnessFactor(factor: number);
}
export default Source;
//# sourceMappingURL=Source.d.ts.map