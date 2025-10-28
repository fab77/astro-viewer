import {CatalogueGL} from '../model/catalogues/CatalogueGL.js'
import {TapMetadata} from '../model/tap/TapMetadata.js'
import {TapMetadataList} from '../model/tap/TapMetadataList.js'
import { queryAsync } from './tapRepoService.js'

// Optional timeout; adjust or remove if you don’t use timeouts.
const TAP_QUERY_TIMEOUT_MS = 60_000

// Small helpers to be robust with slightly different metadata shapes
function getColName(col: TapMetadata | undefined): string {
    if (!col) return ''
    return (col.name ?? col.name ?? '').toString()
}

export default async function queryCatalogueByFoV(
    catalogue: CatalogueGL,
    polygonAdql: String
): Promise<CatalogueGL | undefined> {
    try {

        // Resolve RA/Dec column names (CatalogueProps already picked them from metadata)
        const raCol = getColName(catalogue.catalogueProps.raColumn)
        const decCol = getColName(catalogue.catalogueProps.decColumn)
        const tapTable = catalogue.name

        if (!raCol || !decCol) {
            console.warn('[queryCatalogueByFoV] RA/Dec columns were not resolved from metadata.')
            return
        }

        const adql = `SELECT * FROM ${tapTable} WHERE 1 = CONTAINS(POINT('ICRS', ${raCol}, ${decCol}), POLYGON('ICRS',${polygonAdql}))`
        
        // Fire the TAP query
        const rows = await queryAsync(catalogue.tapRepo, adql, TAP_QUERY_TIMEOUT_MS)
        console.log(rows)
    
        if (rows && rows.data.length  > 0) {
            const metadata = rows.metadata
            const data = rows.data

            console.log(data.length)
            let tapMetadataList = new TapMetadataList()
            for (const element of metadata) {
                const name = element.name
                const description = element.description !== undefined ? element.description : undefined
                const unit = element.unit !== undefined ? element.unit : undefined
                const datatype = element.datatype !== undefined ? element.datatype : undefined
                const ucd = element.ucd !== undefined ? element.ucd : undefined
                const utype = element.utype !== undefined ? element.utype : undefined
                const tapMeta = new TapMetadata(name, description, unit, datatype, ucd, utype)
                tapMetadataList.addMetadata(tapMeta)
            }
            catalogue.addSources(data, tapMetadataList.metadataList)
            return catalogue
        } else {
            console.log('[queryCatalogueByFoV] No results found.')
            return
        }
    } catch (err: any) {
        console.error('[queryCatalogueByFoV] Error:', err?.message ?? err)
        return
    }
}