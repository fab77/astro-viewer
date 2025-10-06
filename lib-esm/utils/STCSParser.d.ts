/**
 * @author Fabrizio Giordano (Fab77)
 */
import Point from "../model/Point.js";
export interface STCSParseResult {
    totpoints: number;
    polygons: Point[][];
}
declare class STCSParser {
    static parseSTCS(stcs: string): STCSParseResult;
    static cleanStcs(stcs: string): string;
    static parsePolygon(stcs: string): STCSParseResult;
    static parseCircle(stcs: string): STCSParseResult;
}
export default STCSParser;
//# sourceMappingURL=STCSParser.d.ts.map