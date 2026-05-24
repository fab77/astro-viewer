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
import { CoordsType } from './CoordsType.js';
import { Point } from '../model/Point.js';
class GeoJSONParser {
    static isGeoJSON(value) {
        if (!value || typeof value !== 'object')
            return false;
        const type = value.type;
        return type === 'FeatureCollection'
            || type === 'Feature'
            || type === 'Polygon'
            || type === 'MultiPolygon'
            || type === 'GeometryCollection';
    }
    static parseGeoJSON(value) {
        if (!value || typeof value !== 'object') {
            throw new Error('GeoJSON root must be an object');
        }
        const obj = value;
        if (obj.type === 'FeatureCollection') {
            if (!Array.isArray(obj.features))
                throw new Error('GeoJSON FeatureCollection has no features array');
            return obj.features.flatMap((feature) => GeoJSONParser.parseFeature(feature));
        }
        if (obj.type === 'Feature')
            return GeoJSONParser.parseFeature(obj);
        if (obj.type === 'Polygon' || obj.type === 'MultiPolygon' || obj.type === 'GeometryCollection') {
            return GeoJSONParser.parseGeometry(obj, {});
        }
        throw new Error(`Unsupported GeoJSON type: ${obj.type ?? 'unknown'}`);
    }
    static parseFeature(value) {
        if (!value || typeof value !== 'object')
            throw new Error('GeoJSON feature must be an object');
        const feature = value;
        if (feature.type !== 'Feature')
            throw new Error('GeoJSON feature has invalid type');
        if (!feature.geometry)
            return [];
        return GeoJSONParser.parseGeometry(feature.geometry, feature.properties ?? {}, feature.id);
    }
    static parseGeometry(geometry, properties, id) {
        if (geometry.type === 'Polygon') {
            return [{
                    id,
                    geometryType: 'Polygon',
                    properties,
                    polygons: GeoJSONParser.parsePolygonCoordinates(geometry.coordinates),
                }];
        }
        if (geometry.type === 'MultiPolygon') {
            return [{
                    id,
                    geometryType: 'MultiPolygon',
                    properties,
                    polygons: GeoJSONParser.parseMultiPolygonCoordinates(geometry.coordinates),
                }];
        }
        if (geometry.type === 'GeometryCollection') {
            if (!Array.isArray(geometry.geometries))
                return [];
            return geometry.geometries.flatMap((child) => GeoJSONParser.parseGeometry(child, properties, id));
        }
        return [];
    }
    static parseMultiPolygonCoordinates(coordinates) {
        if (!Array.isArray(coordinates))
            throw new Error('GeoJSON MultiPolygon coordinates must be an array');
        return coordinates.flatMap((polygonCoordinates) => GeoJSONParser.parsePolygonCoordinates(polygonCoordinates));
    }
    static parsePolygonCoordinates(coordinates) {
        if (!Array.isArray(coordinates))
            throw new Error('GeoJSON Polygon coordinates must be an array');
        return coordinates
            .map((ring) => GeoJSONParser.parseLinearRing(ring))
            .filter((ring) => ring.length >= 3);
    }
    static parseLinearRing(ring) {
        if (!Array.isArray(ring))
            throw new Error('GeoJSON linear ring must be an array');
        const points = ring.map((position) => GeoJSONParser.parsePosition(position));
        if (points.length > 1) {
            const first = points[0];
            const last = points[points.length - 1];
            if (first.lonDeg === last.lonDeg && first.latDeg === last.latDeg)
                points.pop();
        }
        return points;
    }
    static parsePosition(position) {
        if (!Array.isArray(position) || position.length < 2) {
            throw new Error('GeoJSON position must be [longitude, latitude]');
        }
        const [lonDeg, latDeg] = position;
        if (!Number.isFinite(lonDeg) || !Number.isFinite(latDeg)) {
            throw new Error('GeoJSON position contains non-finite longitude/latitude');
        }
        return new Point({ lonDeg, latDeg }, CoordsType.GEOGRAPHIC);
    }
}
export default GeoJSONParser;
