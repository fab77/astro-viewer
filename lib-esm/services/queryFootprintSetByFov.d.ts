import FootprintSetGL from '../model/footprints/FootprintSetGL.js';
import Point from '../model/Point.js';
/**
 * Builds an ADQL query from current FoV and fetches footprints.
 * Returns the enriched FootprintSet (if any rows were found), otherwise undefined.
 */
export default function queryFootprintSetByFov(footprintSet: FootprintSetGL, polygonAdql: String, centralPoint: Point): Promise<FootprintSetGL | undefined>;
//# sourceMappingURL=queryFootprintSetByFov.d.ts.map