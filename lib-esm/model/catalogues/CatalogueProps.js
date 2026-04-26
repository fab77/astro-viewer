// // CatalogueProps.ts
// type UCD = string | undefined;
export {};
// import {Metadata} from "../tap/TapMetadata.js";
// import {TapMetadataList} from "../tap/TapMetadataList.js";
// function colName(col?: Metadata): string | undefined {
//   return col?.name ?? col?.name;
// }
// function sameName(a?: Metadata, name?: string): boolean {
//   if (!a || !name) return false;
//   return colName(a) === name;
// }
// export default class CatalogueProps {
//   static STANDARD_SIZE: string = "STANDARD_SIZE"
//   static STANDARD_HUE: string = "STANDARD_HUE"
//   raColumn!: Metadata;
//   decColumn!: Metadata;
//   nameColumn?: Metadata;
//   /** Optional: numeric/size-mapped column */
//   shapeSizeColumn?: Metadata;
//   /** Optional: hue/category-mapped column */
//   shapeHueColumn?: Metadata;
//   /** Base color (hex string like #RRGGBB) */
//   shapeColor: string;
//   /** Full metadata list reference (kept in sync by updateColumnsIndex) */
//   tapMetadataList: TapMetadataList;
//   constructor(tapMetadataList: TapMetadataList, color: string) {
//     this.raColumn = this.setRAColumns(tapMetadataList);
//     this.decColumn = this.setDecColumns(tapMetadataList);
//     this.nameColumn = this.setNameColumn(tapMetadataList);
//     this.shapeSizeColumn = undefined;
//     this.shapeHueColumn = undefined;
//     this.shapeColor = color;
//     this.tapMetadataList = tapMetadataList;
//   }
//   /** Rebinds saved column references to the new metadata objects (preserves indices, etc.). */
//   updateColumnsIndex(metadataList: TapMetadataList['_metadataList']): void {
//     for (const col of metadataList) {
//       if (sameName(this.raColumn, colName(col))) this.raColumn = col;
//       else if (sameName(this.decColumn, colName(col))) this.decColumn = col;
//       else if (this.shapeHueColumn && sameName(this.shapeHueColumn, colName(col))) this.shapeHueColumn = col;
//       else if (this.shapeSizeColumn && sameName(this.shapeSizeColumn, colName(col))) this.shapeSizeColumn = col;
//       else if (this.nameColumn && sameName(this.nameColumn, colName(col))) this.nameColumn = col;
//     }
//     // Keep the container reference up to date if needed elsewhere.
//     this.tapMetadataList.metadataList = metadataList;
//   }
//   private setRAColumns(tapMetadataList: TapMetadataList): Metadata {
//     let column: Metadata | undefined;
//     for (const tapMetadata of tapMetadataList.posEqRAMetaColumns) {
//       const u = tapMetadata.ucd;
//       if (u && u.includes('pos.eq.ra')) {
//         if (u.includes('meta.main')) {
//           column = tapMetadata; // prefer the main one
//           break;
//         }
//         if (!column) column = tapMetadata; // fallback to first valid one
//       }
//     }
//     if (!column) {
//       throw new Error('No RA column found (UCD pos.eq.ra) in _posEqRAMetaColumns');
//     }
//     return column;
//   }
//   private setDecColumns(tapMetadataList: TapMetadataList): Metadata {
//     let column: Metadata | undefined;
//     for (const tapMetadata of tapMetadataList.posEqDecMetaColumns) {
//       const u = tapMetadata.ucd;
//       if (u && u.includes('pos.eq.dec')) {
//         if (u.includes('meta.main')) {
//           column = tapMetadata; // prefer the main one
//           break;
//         }
//         if (!column) column = tapMetadata; // fallback to first valid one
//       }
//     }
//     if (!column) {
//       throw new Error('No Dec column found (UCD pos.eq.dec) in _posEqDecMetaColumns');
//     }
//     return column;
//   }
//   private setNameColumn(tapMetadataList: TapMetadataList): Metadata | undefined {
//     let column: Metadata | undefined;
//     for (const tapMetadata of tapMetadataList.metadataList) {
//       const u = tapMetadata.ucd;
//       if (u && u.includes('meta.id') && u.includes('meta.main')) {
//         column = tapMetadata; // prefer id+main
//       }
//     }
//     // It’s okay if there’s no strong "name" column; methods below handle undefined.
//     return column;
//   }
//   changeColor(color: string): void {
//     this.shapeColor = color;
//   }
//   changeMetaName(metacolumnName: string): void {
//     if (this.nameColumn && colName(this.nameColumn) === metacolumnName) return;
//     for (const column of this.tapMetadataList.metadataList) {
//       if (colName(column) === metacolumnName) {
//         this.nameColumn = column;
//         break;
//       }
//     }
//   }
//   /** Returns true to indicate a refresh-by-FoV is needed (preserves original behavior). */
//   changeCatalogueMetaRA(metacolumnName: string): boolean {
//     if (colName(this.raColumn) !== metacolumnName) {
//       for (const column of this.tapMetadataList.metadataList) {
//         if (colName(column) === metacolumnName) {
//           this.raColumn = column;
//           break;
//         }
//       }
//     }
//     return true;
//   }
//   /** Returns true to indicate a refresh-by-FoV is needed (preserves original behavior). */
//   changeCatalogueMetaDec(metacolumnName: string): boolean {
//     if (colName(this.decColumn) !== metacolumnName) {
//       for (const column of this.tapMetadataList.metadataList) {
//         if (colName(column) === metacolumnName) {
//           this.decColumn = column;
//           break;
//         }
//       }
//     }
//     return true;
//   }
//   resetCatalogueMetaShapeSize(): void {
//     this.shapeSizeColumn = undefined;
//   }
//   changeCatalogueMetaShapeSize(metacolumnName: string): void {
//     if (!this.shapeSizeColumn || colName(this.shapeSizeColumn) !== metacolumnName) {
//       for (const column of this.tapMetadataList.metadataList) {
//         if (colName(column) === metacolumnName) {
//           this.shapeSizeColumn = column;
//           break;
//         }
//       }
//     }
//   }
//   resetCatalogueMetaShapeHue() {
//     this.shapeHueColumn = undefined;
//   }
//   changeCatalogueMetaShapeHue(metacolumnName: string): void {
//     if (!this.shapeHueColumn || colName(this.shapeHueColumn) !== metacolumnName) {
//       for (const column of this.tapMetadataList.metadataList) {
//         if (colName(column) === metacolumnName) {
//           this.shapeHueColumn = column;
//           break;
//         }
//       }
//     }
//   }
// }
