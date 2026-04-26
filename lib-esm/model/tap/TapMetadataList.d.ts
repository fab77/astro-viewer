/**
 * @author Fabrizio Giordano (Fab77)
 */
import { TapMetadata } from './TapMetadata.js';
export declare class TapMetadataList {
    private _posEqRAMetaColumns;
    private _posEqDecMetaColumns;
    private _sRegionMetaColumns;
    private _pgSphereMetaColumns;
    private _metadataList;
    constructor();
    /**
     * Add a TapMetadata entry and classify it into relevant groups
     */
    addMetadata(tapMetadata: TapMetadata): void;
    get metadataList(): TapMetadata[];
    set metadataList(metadataList: TapMetadata[]);
    get pgSphereMetaColumns(): TapMetadata[];
    get sRegionMetaColumns(): TapMetadata[];
    get posEqRAMetaColumns(): TapMetadata[];
    get posEqDecMetaColumns(): TapMetadata[];
}
