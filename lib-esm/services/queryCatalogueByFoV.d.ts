import CatalogueGL from '../model/catalogues/CatalogueGL.js';
/**
 * Query a TAP table by the current Field-of-View and return a populated CatalogueGL
 * (or undefined if nothing found).
 *
 * @param tapRepo        TAP backend wrapper
 * @param tapTable       Fully qualified table name (e.g. schema.table)
 * @param tableDesc      Human description for UI
 * @param tapMetadata    Table metadata (UCDs etc.)
 */
export default function queryCatalogueByFoV(catalogue: CatalogueGL, polygonAdql: String): Promise<CatalogueGL | undefined>;
//# sourceMappingURL=queryCatalogueByFoV.d.ts.map