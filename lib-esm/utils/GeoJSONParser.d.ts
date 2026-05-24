import { Point } from '../model/Point.js';
export type GeoJSONProperties = Record<string, unknown>;
export interface ParsedGeoJSONFeature {
    id?: string | number;
    geometryType: 'Polygon' | 'MultiPolygon';
    properties: GeoJSONProperties;
    polygons: Point[][];
}
declare class GeoJSONParser {
    static isGeoJSON(value: unknown): boolean;
    static parseGeoJSON(value: unknown): ParsedGeoJSONFeature[];
    private static parseFeature;
    private static parseGeometry;
    private static parseMultiPolygonCoordinates;
    private static parsePolygonCoordinates;
    private static parseLinearRing;
    private static parsePosition;
}
export default GeoJSONParser;
