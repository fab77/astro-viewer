// queryCatalogueByFoV.ts
import TapMetadata from '../model/tap/TapMetadata.js';
import TapMetadataList from '../model/tap/TapMetadataList.js';
import { queryAsync } from './tapRepoService.js';
// export interface TapRepository {
//   _tapBaseURL: string
//   /**
//    * Execute an ADQL query and return rows (each row is an array matching column order).
//    * The second param is an optional timeout in ms.
//    */
//   queryAsync: (adql: string, timeoutMs?: number) => Promise<any[]>
// }
// Optional timeout; adjust or remove if you don’t use timeouts.
const TAP_QUERY_TIMEOUT_MS = 60_000;
// Small helpers to be robust with slightly different metadata shapes
function getColName(col) {
    if (!col)
        return '';
    return (col.name ?? col.name ?? '').toString();
}
/**
 * Query a TAP table by the current Field-of-View and return a populated CatalogueGL
 * (or undefined if nothing found).
 *
 * @param tapRepo        TAP backend wrapper
 * @param tapTable       Fully qualified table name (e.g. schema.table)
 * @param tableDesc      Human description for UI
 * @param tapMetadata    Table metadata (UCDs etc.)
 */
// export default async function queryCatalogueByFoV(
//     tapRepo: TapRepo,
//     tapTable: string,
//     tableDesc: string,
//     tapMetadata: TapMetadataList
// ): Promise<CatalogueGL | undefined> {
export default async function queryCatalogueByFoV(catalogue, polygonAdql) {
    try {
        // Resolve RA/Dec column names (CatalogueProps already picked them from metadata)
        const raCol = getColName(catalogue.catalogueProps.raColumn);
        const decCol = getColName(catalogue.catalogueProps.decColumn);
        const tapTable = catalogue.name;
        if (!raCol || !decCol) {
            console.warn('[queryCatalogueByFoV] RA/Dec columns were not resolved from metadata.');
            return;
        }
        // const adql = `SELECT TOP 200 * FROM ${tapTable} WHERE 1 = CONTAINS(POINT('ICRS', ${raCol}, ${decCol}), POLYGON('ICRS',${polygonAdql}))`
        const adql = `SELECT * FROM ${tapTable} WHERE 1 = CONTAINS(POINT('ICRS', ${raCol}, ${decCol}), POLYGON('ICRS',${polygonAdql}))`;
        // Keep it simple: query all columns. You can TOP/N limit here if needed.
        // const adql = `SELECT * FROM ${tapTable} WHERE ${whereFoV}`
        // Fire the TAP query
        const rows = await queryAsync(catalogue.tapRepo, adql, TAP_QUERY_TIMEOUT_MS);
        console.log(rows);
        if (rows && rows.data.length > 0) {
            const metadata = rows.metadata;
            const data = rows.data;
            console.log(data.length);
            let tapMetadataList = new TapMetadataList();
            for (const element of metadata) {
                const name = element.name;
                const description = element.description !== undefined ? element.description : undefined;
                const unit = element.unit !== undefined ? element.unit : undefined;
                const datatype = element.datatype !== undefined ? element.datatype : undefined;
                const ucd = element.ucd !== undefined ? element.ucd : undefined;
                const utype = element.utype !== undefined ? element.utype : undefined;
                const tapMeta = new TapMetadata(name, description, unit, datatype, ucd, utype);
                tapMetadataList.addMetadata(tapMeta);
            }
            catalogue.addSources(data, tapMetadataList.metadataList);
            return catalogue;
        }
        else {
            console.log('[queryCatalogueByFoV] No results found.');
            return;
        }
    }
    catch (err) {
        console.error('[queryCatalogueByFoV] Error:', err?.message ?? err);
        return;
    }
}
//# sourceMappingURL=queryCatalogueByFoV.js.map