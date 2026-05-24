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

export type GeoJSONProperties = Record<string, unknown>;

export interface ParsedGeoJSONFeature {
  id?: string | number;
  geometryType: 'Polygon' | 'MultiPolygon';
  properties: GeoJSONProperties;
  polygons: Point[][];
}

type GeoJSONPosition = [number, number, ...number[]];

interface GeoJSONGeometry {
  type: string;
  coordinates?: unknown;
  geometries?: GeoJSONGeometry[];
}

interface GeoJSONFeature {
  type: 'Feature';
  id?: string | number;
  properties?: GeoJSONProperties | null;
  geometry?: GeoJSONGeometry | null;
}

class GeoJSONParser {
  static isGeoJSON(value: unknown): boolean {
    if (!value || typeof value !== 'object') return false;
    const type = (value as { type?: unknown }).type;
    return type === 'FeatureCollection'
      || type === 'Feature'
      || type === 'Polygon'
      || type === 'MultiPolygon'
      || type === 'GeometryCollection';
  }

  static parseGeoJSON(value: unknown): ParsedGeoJSONFeature[] {
    if (!value || typeof value !== 'object') {
      throw new Error('GeoJSON root must be an object');
    }

    const obj = value as { type?: string; features?: unknown[] };
    if (obj.type === 'FeatureCollection') {
      if (!Array.isArray(obj.features)) throw new Error('GeoJSON FeatureCollection has no features array');
      return obj.features.flatMap((feature) => GeoJSONParser.parseFeature(feature));
    }

    if (obj.type === 'Feature') return GeoJSONParser.parseFeature(obj);

    if (obj.type === 'Polygon' || obj.type === 'MultiPolygon' || obj.type === 'GeometryCollection') {
      return GeoJSONParser.parseGeometry(obj as GeoJSONGeometry, {});
    }

    throw new Error(`Unsupported GeoJSON type: ${obj.type ?? 'unknown'}`);
  }

  private static parseFeature(value: unknown): ParsedGeoJSONFeature[] {
    if (!value || typeof value !== 'object') throw new Error('GeoJSON feature must be an object');
    const feature = value as GeoJSONFeature;
    if (feature.type !== 'Feature') throw new Error('GeoJSON feature has invalid type');
    if (!feature.geometry) return [];

    return GeoJSONParser.parseGeometry(
      feature.geometry,
      feature.properties ?? {},
      feature.id,
    );
  }

  private static parseGeometry(
    geometry: GeoJSONGeometry,
    properties: GeoJSONProperties,
    id?: string | number,
  ): ParsedGeoJSONFeature[] {
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
      if (!Array.isArray(geometry.geometries)) return [];
      return geometry.geometries.flatMap((child) => GeoJSONParser.parseGeometry(child, properties, id));
    }

    return [];
  }

  private static parseMultiPolygonCoordinates(coordinates: unknown): Point[][] {
    if (!Array.isArray(coordinates)) throw new Error('GeoJSON MultiPolygon coordinates must be an array');
    return coordinates.flatMap((polygonCoordinates) => GeoJSONParser.parsePolygonCoordinates(polygonCoordinates));
  }

  private static parsePolygonCoordinates(coordinates: unknown): Point[][] {
    if (!Array.isArray(coordinates)) throw new Error('GeoJSON Polygon coordinates must be an array');
    return coordinates
      .map((ring) => GeoJSONParser.parseLinearRing(ring))
      .filter((ring) => ring.length >= 3);
  }

  private static parseLinearRing(ring: unknown): Point[] {
    if (!Array.isArray(ring)) throw new Error('GeoJSON linear ring must be an array');

    const points = ring.map((position) => GeoJSONParser.parsePosition(position));
    if (points.length > 1) {
      const first = points[0];
      const last = points[points.length - 1];
      if (first.lonDeg === last.lonDeg && first.latDeg === last.latDeg) points.pop();
    }

    return points;
  }

  private static parsePosition(position: unknown): Point {
    if (!Array.isArray(position) || position.length < 2) {
      throw new Error('GeoJSON position must be [longitude, latitude]');
    }

    const [lonDeg, latDeg] = position as GeoJSONPosition;
    if (!Number.isFinite(lonDeg) || !Number.isFinite(latDeg)) {
      throw new Error('GeoJSON position contains non-finite longitude/latitude');
    }

    return new Point({ lonDeg, latDeg }, CoordsType.GEOGRAPHIC);
  }
}

export default GeoJSONParser;
