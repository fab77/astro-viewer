'use strict'

/**
 * @author Fabrizio Giordano (Fab77)
 */
import {TapMetadata} from './TapMetadata.js'

export class TapMetadataList {
  private _posEqRAMetaColumns: TapMetadata[] // ucd.includes('pos.eq.ra')
  private _posEqDecMetaColumns: TapMetadata[] // ucd.includes('pos.eq.dec')
  private _sRegionMetaColumns: TapMetadata[]  // STC-S / s_region candidates
  private _pgSphereMetaColumns: TapMetadata[] // ucd.includes('pos.outline.meta.pgsphere')
  private _metadataList: TapMetadata[]

  constructor() {
    this._metadataList = []
    this._posEqRAMetaColumns = []
    this._posEqDecMetaColumns = []
    this._sRegionMetaColumns = []
    this._pgSphereMetaColumns = []
  }

  /**
   * Add a TapMetadata entry and classify it into relevant groups
   */
  addMetadata(tapMetadata: TapMetadata): void {
    const length = this._metadataList.push(tapMetadata)
    const idx = length - 1
    tapMetadata.index = idx

    if (tapMetadata.ucd?.includes('pos.eq.ra')) {
      this._posEqRAMetaColumns.push(tapMetadata)
    } else if (tapMetadata.ucd?.includes('pos.eq.dec')) {
      this._posEqDecMetaColumns.push(tapMetadata)
    }

    if (tapMetadata.ucd?.includes('pos.outline;meta.pgsphere')) {
      this._pgSphereMetaColumns.push(tapMetadata)
    }

    if (
      tapMetadata.uType?.includes('Char.SpatialAxis.Coverage.Support.Area') ||
      tapMetadata.datatype?.includes('adql:REGION') ||
      tapMetadata.ucd?.includes('pos.outline;obs.field') ||
      tapMetadata.name === 'stc_s' // for ESASky
    ) {
      this._sRegionMetaColumns.push(tapMetadata)
    }
  }

  get metadataList(): TapMetadata[] {
    return this._metadataList
  }

  set metadataList(metadataList: TapMetadata[]) {
    this._metadataList = metadataList
  }

  get pgSphereMetaColumns(): TapMetadata[] {
    return this._pgSphereMetaColumns
  }

  get sRegionMetaColumns(): TapMetadata[] {
    return this._sRegionMetaColumns
  }

  get posEqRAMetaColumns(): TapMetadata[] {
    return this._posEqRAMetaColumns
  }

  get posEqDecMetaColumns(): TapMetadata[] {
    return this._posEqDecMetaColumns
  }
}

// export default TapMetadataList