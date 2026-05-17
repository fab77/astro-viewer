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


// import {Metadata} from '../tap/TapMetadata.js';
// import {TapMetadataList} from '../tap/TapMetadataList.js';

// export default class FootprintProps {
//   // resolved columns
//   pgSphereColumn?: Metadata;
//   geomColumn?: Metadata;
//   raColumn?: Metadata;
//   decColumn?: Metadata;
//   nameColumn?: Metadata;

//   shapeColor: string;
//   tapMetadataList: TapMetadataList;

//   constructor(tapMetadataList: TapMetadataList, color: string) {
//     this.tapMetadataList = tapMetadataList;
//     this.shapeColor = color;

//     this.setPositionColumns(tapMetadataList);
//     this.nameColumn = this.setNameColumn(tapMetadataList);
//   }

//   private setPositionColumns(tapMetadataList: TapMetadataList): void {
//     // pgSphere
//     for (const meta of tapMetadataList.pgSphereMetaColumns) {
//       this.pgSphereColumn = meta;
//     }

//     // s_region (choose the 'pos.outline;obs.field' if available; otherwise first)
//     for (const meta of tapMetadataList.sRegionMetaColumns) {
//       if (meta.ucd && meta.ucd.includes('pos.outline;obs.field')) {
//         this.geomColumn = meta;
//         break;
//       }
//       if (!this.geomColumn) {
//         this.geomColumn = meta;
//       }
//     }

//     // RA (prefer meta.main)
//     for (const meta of tapMetadataList.posEqRAMetaColumns) {
//       if (meta.ucd && meta.ucd.includes('meta.main')) {
//         this.raColumn = meta;
//         break;
//       }
//       if (!this.raColumn) {
//         this.raColumn = meta;
//       }
//     }

//     // DEC (prefer meta.main) – supports both posEqDecMetaColumns and _posEqDecMetaColumns
//     const decList =
//       tapMetadataList.posEqDecMetaColumns?.length
//         ? tapMetadataList.posEqDecMetaColumns
//         : tapMetadataList.posEqDecMetaColumns ?? [];

//     for (const meta of decList) {
//       if (meta.ucd && meta.ucd.includes('meta.main')) {
//         this.decColumn = meta;
//         break;
//       }
//       if (!this.decColumn) {
//         this.decColumn = meta;
//       }
//     }
//   }

//   private setNameColumn(tapMetadataList: TapMetadataList): Metadata | undefined {
//     let nameColumn: Metadata | undefined;
//     for (const meta of tapMetadataList.metadataList) {
//       if (meta.ucd?.includes('meta.id') && meta.ucd?.includes('meta.main')) {
//         nameColumn = meta;
//       }
//     }
//     return nameColumn;
//   }

//   changeColor(color: string): void {
//     this.shapeColor = color;
//   }

//   changeMetaName(metacolumnName: string): void {
//     const currentName = this.getMetaName(this.nameColumn);
//     if (currentName !== metacolumnName) {
//       for (const column of this.tapMetadataList.metadataList) {
//         if (this.getMetaName(column) === metacolumnName) {
//           this.nameColumn = column;
//           break;
//         }
//       }
//     }
//   }

//   // helper to normalize `name` / `_name`
//   private getMetaName(meta?: Metadata): string | undefined {
//     return meta?.name ?? meta?.name;
//   }
// }