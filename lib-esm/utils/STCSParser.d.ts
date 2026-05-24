/**
 * @author Fabrizio Giordano (Fab77)
 */
import { Point } from "../model/Point.js";
import { CoordsType } from "./CoordsType.js";
export interface STCSParseResult {
    totpoints: number;
    polygons: Point[][];
}
export interface STCSParseOptions {
    coordsType?: CoordsType.ASTRO | CoordsType.GEOGRAPHIC;
}
declare class STCSParser {
    static parseSTCS(stcs: string, options?: STCSParseOptions): STCSParseResult;
    static cleanStcs(stcs: string): string;
    static parsePolygon(stcs: string, options?: STCSParseOptions): STCSParseResult;
    static parseCircle(stcs: string, options?: STCSParseOptions): STCSParseResult;
}
export default STCSParser;
