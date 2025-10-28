
import {TapMetadata} from '../tap/TapMetadata.js';
import {TapMetadataList} from '../tap/TapMetadataList.js';

export default class FootprintProps {
  // resolved columns
  pgSphereColumn?: TapMetadata;
  geomColumn?: TapMetadata;
  raColumn?: TapMetadata;
  decColumn?: TapMetadata;
  nameColumn?: TapMetadata;

  shapeColor: string;
  tapMetadataList: TapMetadataList;

  constructor(tapMetadataList: TapMetadataList, color: string) {
    this.tapMetadataList = tapMetadataList;
    this.shapeColor = color;

    this.setPositionColumns(tapMetadataList);
    this.nameColumn = this.setNameColumn(tapMetadataList);
  }

  private setPositionColumns(tapMetadataList: TapMetadataList): void {
    // pgSphere
    for (const meta of tapMetadataList.pgSphereMetaColumns) {
      this.pgSphereColumn = meta;
    }

    // s_region (choose the 'pos.outline;obs.field' if available; otherwise first)
    for (const meta of tapMetadataList.sRegionMetaColumns) {
      if (meta.ucd && meta.ucd.includes('pos.outline;obs.field')) {
        this.geomColumn = meta;
        break;
      }
      if (!this.geomColumn) {
        this.geomColumn = meta;
      }
    }

    // RA (prefer meta.main)
    for (const meta of tapMetadataList.posEqRAMetaColumns) {
      if (meta.ucd && meta.ucd.includes('meta.main')) {
        this.raColumn = meta;
        break;
      }
      if (!this.raColumn) {
        this.raColumn = meta;
      }
    }

    // DEC (prefer meta.main) – supports both posEqDecMetaColumns and _posEqDecMetaColumns
    const decList =
      tapMetadataList.posEqDecMetaColumns?.length
        ? tapMetadataList.posEqDecMetaColumns
        : tapMetadataList.posEqDecMetaColumns ?? [];

    for (const meta of decList) {
      if (meta.ucd && meta.ucd.includes('meta.main')) {
        this.decColumn = meta;
        break;
      }
      if (!this.decColumn) {
        this.decColumn = meta;
      }
    }
  }

  private setNameColumn(tapMetadataList: TapMetadataList): TapMetadata | undefined {
    let nameColumn: TapMetadata | undefined;
    for (const meta of tapMetadataList.metadataList) {
      if (meta.ucd?.includes('meta.id') && meta.ucd?.includes('meta.main')) {
        nameColumn = meta;
      }
    }
    return nameColumn;
  }

  changeColor(color: string): void {
    this.shapeColor = color;
  }

  changeMetaName(metacolumnName: string): void {
    const currentName = this.getMetaName(this.nameColumn);
    if (currentName !== metacolumnName) {
      for (const column of this.tapMetadataList.metadataList) {
        if (this.getMetaName(column) === metacolumnName) {
          this.nameColumn = column;
          break;
        }
      }
    }
  }

  // helper to normalize `name` / `_name`
  private getMetaName(meta?: TapMetadata): string | undefined {
    return meta?.name ?? meta?.name;
  }
}