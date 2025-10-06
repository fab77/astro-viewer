// queryCatalogueByFoV.ts

import CatalogueGL from '../model/catalogues/CatalogueGL'
import FoVUtils from '../utils/FoVUtils'
import { session } from '../utils/Session'
import TapMetadata from './tap/TapMetadata'

// ---- Minimal types for TAP + metadata (adjust to your real types if you have them) ----
// export interface TapMetadata {
//   name?: string
//   _name?: string
//   index?: number
//   _index?: number
//   ucd?: string
// }

// export interface TapMetadataList {
//   // Your real object likely exposes these; use whatever you actually have.
//   _metadataList: TapMetadata[]
//   _posEqRAMetaColumns: TapMetadata[]
//   _posEqDecMetaColumns: TapMetadata[]
//   _sRegionMetaColumns?: TapMetadata[]
//   pgSphereMetaColumns?: TapMetadata[]
//   // Sometimes used as `metadataList` in your JS:
//   metadataList?: TapMetadata[]
// }

// export interface TapRepository {
//   _tapBaseURL: string
//   /**
//    * Execute an ADQL query and return rows (each row is an array matching column order).
//    * The second param is an optional timeout in ms.
//    */
//   queryAsync: (adql: string, timeoutMs?: number) => Promise<any[]>
// }

// Optional timeout; adjust or remove if you don’t use timeouts.
const TAP_QUERY_TIMEOUT_MS = 60_000

// Small helpers to be robust with slightly different metadata shapes
function getColName(col: TapMetadata | undefined): string {
  if (!col) return ''
  return (col.name ?? col.name ?? '').toString()
}

// Build a CONTAINS(.., POLYGON(..)) predicate using FoV polygon (ICRS)
function buildFoVWhereICRS(raCol: string, decCol: string): string {
  // Expect FoVUtils to give you the FoV polygon *in ICRS degrees* (RA/Dec pairs).
  // If your FoVUtils exposes a different method name, swap it here.
  const fovPolyAstro = FoVUtils.getFoVPolygon()
  const polygonAdql = FoVUtils.getPolygonByFoV(fovPolyAstro) // -> "POLYGON('ICRS', ra1, dec1, ...)"
  return `1 = CONTAINS(POINT('ICRS', ${raCol}, ${decCol}), ${polygonAdql})`
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
export default async function queryCatalogueByFoV(
  tapRepo: TapRepository,
  tapTable: string,
  tableDesc: string,
  tapMetadata: TapMetadataList
): Promise<CatalogueGL | undefined> {
  try {
    // Create the catalogue (this configures RA/Dec columns from metadata inside)
    const catalogue = new CatalogueGL(tapTable, tableDesc, tapRepo, tapMetadata)

    // Resolve RA/Dec column names (CatalogueProps already picked them from metadata)
    const raCol = getColName(catalogue.catalogueProps.raColumn)
    const decCol = getColName(catalogue.catalogueProps.decColumn)

    if (!raCol || !decCol) {
      console.warn('[queryCatalogueByFoV] RA/Dec columns were not resolved from metadata.')
      return
    }

    // Build ADQL WHERE using FoV polygon
    const whereFoV = buildFoVWhereICRS(raCol, decCol)

    // Keep it simple: query all columns. You can TOP/N limit here if needed.
    const adql = `SELECT * FROM ${tapTable} WHERE ${whereFoV}`

    // Fire the TAP query
    const rows = await tapRepo.queryAsync(adql, TAP_QUERY_TIMEOUT_MS)

    if (rows && rows.length > 0) {
      // Some pieces of your code pass `tapMetadata.metadataList`; CatalogueGL ignores the second arg anyway.
      catalogue.addSources(rows, tapMetadata.metadataList ?? tapMetadata._metadataList)
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