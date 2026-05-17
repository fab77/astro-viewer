/*
 * AstroViewer
 * Copyright (C) Fabrizio Giordano
 * SPDX-License-Identifier: LicenseRef-AstroViewer-Dual-License
 *
 * This file is part of AstroViewer.
 * AstroViewer is distributed under a dual-license model.
 * Commercial use requires a separate commercial license.
 * Non-commercial use is governed by LICENSE-NONCOMMERCIAL.md.
 *
 * See LICENSE.md, LICENSE-COMMERCIAL.md, and LICENSE-NONCOMMERCIAL.md for details.
 */
export {};
// import {FootprintSetGL} from '../model/footprints/FootprintSetGL.js'
// import healpixGridSingleton from '../model/grid/HealpixGridSingleton.js';
// import Point from '../model/Point.js';
// import {Metadata} from '../model/tap/TapMetadata.js'
// import {TapMetadataList} from '../model/tap/TapMetadataList.js'
// import { TapRepo } from '../model/tap/TapRepo.js';
// import { queryAsync } from './tapRepoService.js'
// interface ColumnLike {
//   _name: string;
// }
// // If your FoVUtils already has TS types, feel free to delete these:
// type FoVPolygonString = string; // "ra1,dec1, ra2,dec2, ..."
// interface J2000Center { _raDeg: number; _decDeg: number; }
// // Optional timeout; adjust or remove if you don’t use timeouts.
// const TAP_QUERY_TIMEOUT_MS = 60_000
// // --- Function ---
// // Small helpers to be robust with slightly different metadata shapes
// function getColName(col: Metadata | undefined): string {
//   if (!col) return ''
//   return (col.name ?? col.name ?? '').toString()
// }
// function prepareADQL(
//   tapTable: string,
//   tapRa: string | undefined,
//   tapDec: string | undefined,
//   polygonAdql: String, tapRepo: TapRepo,
//   centralPoint: Point): string {
//   let adql = ""
//   if (tapRepo.adqlFunctionList.includes('POLYGON')) {
//     adql =
//       'select * from ' +
//       tapTable +
//       ' where 1=CONTAINS(POINT(\'ICRS\',' +
//       tapRa +
//       ',' +
//       tapDec +
//       '), POLYGON(\'ICRS\', ' +
//       polygonAdql +
//       '))';
//   } else {
//     const radius = healpixGridSingleton.getMinFoV() / 2;
//     adql =
//       'select * from ' +
//       tapTable +
//       ' where 1=CONTAINS(POINT(\'ICRS\',' +
//       tapRa +
//       ',' +
//       tapDec +
//       '), CIRCLE(\'ICRS\', ' +
//       centralPoint.raDeg +
//       ', ' +
//       centralPoint.decDeg +
//       ', ' +
//       radius +
//       '))';
//   }
//   return adql
// }
// /**
//  * Builds an ADQL query from current FoV and fetches footprints.
//  * Returns the enriched FootprintSet (if any rows were found), otherwise undefined.
//  */
// export default async function queryFootprintSetByFov(
//   footprintSet: FootprintSetGL,
//   polygonAdql: String,
//   centralPoint: Point): Promise<FootprintSetGL | undefined> {
//   try {
//     // Resolve RA/Dec column names (CatalogueProps already picked them from metadata)
//     const raCol = getColName(footprintSet.footprintsetProps.raColumn)
//     const decCol = getColName(footprintSet.footprintsetProps.decColumn)
//     const tapTable = footprintSet._name
//     if (!raCol || !decCol) {
//       console.warn('[queryCatalogueByFoV] RA/Dec columns were not resolved from metadata.')
//       return
//     }
//     const adql = prepareADQL(tapTable, raCol, decCol, polygonAdql, footprintSet.tapRepo, centralPoint)
//     const rows = await queryAsync(footprintSet.tapRepo, adql, TAP_QUERY_TIMEOUT_MS)
//     console.log(rows)
//     // if (rows && rows.data.length > 0) {
//     // const metadata = rows.metadata
//     // const data = rows.data
//     if (
//       typeof rows === 'object' &&
//       rows !== null &&
//       Array.isArray((rows as any).metadata) &&
//       Array.isArray((rows as any).data)
//     ) {
//       const { metadata, data } = rows as {
//         metadata: Array<{
//           name: string;
//           description: string;
//           unit: string;
//           datatype: string;
//           ucd: string;
//           utype: string;
//         }>;
//         data: unknown[];
//       };
//       const tapMetadataList = new TapMetadataList();
//       for (const m of metadata) {
//         const tapMeta = new Metadata(
//           m.name,
//           m.description ?? undefined,
//           m.unit ?? undefined,
//           m.datatype ?? undefined,
//           m.ucd ?? undefined,
//           m.utype ?? undefined
//         );
//         tapMetadataList.addMetadata(tapMeta);
//       }
//       if (data.length > 0) {
//         footprintSet.addFootprints(data, tapMetadataList.metadataList);
//         return footprintSet;
//       } else {
//         console.log('No results found');
//       }
//       // }
//     } else {
//       console.log('[queryFootprintSetByFov] No results found.')
//       return
//     }
//   } catch (err: any) {
//     console.error('[queryFootprintSetByFov] Error:', err?.message ?? err)
//     return
//   }
// }
