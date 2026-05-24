import { FootprintSetGL } from '../footprints/FootprintSetGL.js';
import { CoordsType } from '../../utils/CoordsType.js';
import { ParsedGeoJSONFeature } from '../../utils/GeoJSONParser.js';
export declare class TerraFootprintSetGL extends FootprintSetGL {
    _kind: string;
    protected _coordsType: CoordsType.GEOGRAPHIC;
    addGeoJSONFeatures(features: ParsedGeoJSONFeature[]): void;
    private createGeoJSONMetadataColumns;
    private createGeoJSONDetails;
}
