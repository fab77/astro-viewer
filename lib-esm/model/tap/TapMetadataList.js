'use strict';
export class TapMetadataList {
    _posEqRAMetaColumns; // ucd.includes('pos.eq.ra')
    _posEqDecMetaColumns; // ucd.includes('pos.eq.dec')
    _sRegionMetaColumns; // STC-S / s_region candidates
    _pgSphereMetaColumns; // ucd.includes('pos.outline.meta.pgsphere')
    _metadataList;
    constructor() {
        this._metadataList = [];
        this._posEqRAMetaColumns = [];
        this._posEqDecMetaColumns = [];
        this._sRegionMetaColumns = [];
        this._pgSphereMetaColumns = [];
    }
    /**
     * Add a TapMetadata entry and classify it into relevant groups
     */
    addMetadata(tapMetadata) {
        const length = this._metadataList.push(tapMetadata);
        const idx = length - 1;
        tapMetadata.index = idx;
        if (tapMetadata.ucd?.includes('pos.eq.ra')) {
            this._posEqRAMetaColumns.push(tapMetadata);
        }
        else if (tapMetadata.ucd?.includes('pos.eq.dec')) {
            this._posEqDecMetaColumns.push(tapMetadata);
        }
        if (tapMetadata.ucd?.includes('pos.outline;meta.pgsphere')) {
            this._pgSphereMetaColumns.push(tapMetadata);
        }
        if (tapMetadata.uType?.includes('Char.SpatialAxis.Coverage.Support.Area') ||
            tapMetadata.datatype?.includes('adql:REGION') ||
            tapMetadata.ucd?.includes('pos.outline;obs.field') ||
            tapMetadata.name === 'stc_s' // for ESASky
        ) {
            this._sRegionMetaColumns.push(tapMetadata);
        }
    }
    get metadataList() {
        return this._metadataList;
    }
    set metadataList(metadataList) {
        this._metadataList = metadataList;
    }
    get pgSphereMetaColumns() {
        return this._pgSphereMetaColumns;
    }
    get sRegionMetaColumns() {
        return this._sRegionMetaColumns;
    }
    get posEqRAMetaColumns() {
        return this._posEqRAMetaColumns;
    }
    get posEqDecMetaColumns() {
        return this._posEqDecMetaColumns;
    }
}
//# sourceMappingURL=TapMetadataList.js.map