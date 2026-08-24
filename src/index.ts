/*
 * AstroViewer
 * Copyright (C) Fabrizio Giordano
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-AstroViewer-Commercial
 *
 * AstroViewer is dual-licensed under the GNU Affero General Public License
 * version 3 and a separate commercial license.
 *
 * See LICENSE.md, LICENSE-AGPL.md, and LICENSE-COMMERCIAL.md for details.
 */

export { AstroViewer } from './AstroViewer.js';
export type { AstroViewerOptions } from './AstroViewer.js';
export { HiPSDescriptor } from './model/hips/HiPSDescriptor.js';
export { SphereFoV as FoV } from './model/SphereFoV.js'
export { SphereFoV } from './model/SphereFoV.js'

export type { PointCoordinates, CameraChangedDetail } from './AstroSphere.js';
export { HoveredFootprintDetail, FootprintSetGL } from './model/footprints/FootprintSetGL.js'
export { CatalogueGL } from './model/catalogues/CatalogueGL.js'
export { TerraPointSetGL } from './model/terra/TerraPointSetGL.js'
export { TerraFootprintSetGL } from './model/terra/TerraFootprintSetGL.js'
export { TerraPolylineSetGL } from './model/terra/TerraPolylineSetGL.js'
export type { TerraPolylineMetadata, TerraPolylinePoint } from './model/terra/TerraPolylineSetGL.js'
export { SatelliteObjectGL } from './model/terra/SatelliteObjectGL.js'
export type { SatelliteObjectOptions, SatelliteObjectPosition } from './model/terra/SatelliteObjectGL.js'
export { SensorConeGL } from './model/terra/SensorConeGL.js'
export type { SensorConeFootprintPosition, SensorConeOptions, SensorConePoint } from './model/terra/SensorConeGL.js'
export {
  createObservationTrackTimeline,
  footprintToRing,
  ObservationTrackTimeline,
  ObservationTrackViewerAdapter,
} from './model/observation/index.js'
export type {
  FootprintGeometryLike,
  FootprintGeoPositionLike,
  FootprintMultiPolygonLike,
  FootprintPolygonLike,
  GroundTrackPointLike,
  ObservationSampleLike,
  ObservationTargetLike,
  ObservationTimelineSample,
  ObservationTrackFrame,
  ObservationTrackLike,
  ObservationTrackTimelineController,
  ObservationTrackTimelineOptions,
  ObservationTrackTimelineState,
  ObservationTrackViewerAdapterOptions,
  ObservationTrackViewerColors,
  ObservationTrackViewerHandle,
  ObservationVisualisationLike,
  SatelliteConfigLike,
  SatelliteModelConfigLike,
  SensorConfigLike,
} from './model/observation/index.js'

export { MetadataManager } from './model/MetadataManager.js'
export { MetadataColumn, MetadataInit, ColumnType } from './model/MetadataColumn.js'
export { Point, SphericalOpts, AstroOpts, PointInitOpts, CartesianOpts } from './model/Point.js'
export { FoVUtils } from './utils/FoVUtils.js'
export { CoordsType } from './utils/CoordsType.js'
export { default as GeoJSONParser } from './utils/GeoJSONParser.js'
export type { ParsedGeoJSONFeature, GeoJSONProperties } from './utils/GeoJSONParser.js'
export { ColorMaps, COLOR_MAP_SAMPLE_COUNT, createColorMapFromSamples } from './model/ColorMaps.js';
export type { ColorMap, ColorMapName } from './model/ColorMaps.js';
export { HiPS } from './model/hips/HiPS.js'
export type { HiPSFITSRangeMode, HiPSFITSScaleFunction, HiPSFITSStretch } from './model/hips/HiPS.js'
export { XYZMap } from './model/earth/XYZMap.js'
export { WMTSAdapter } from './model/earth/WMTSAdapter.js'
export { MeshHiPS } from './model/meships/MeshHiPS.js'
export { MeshHiPSDescriptor } from './model/meships/MeshHiPSDescriptor.js'
export type { XYZLayerConfig, WMTSLayerConfig, WMTSRequestEncoding } from './model/earth/XYZConfig.js'
export type { XYZTileCoord, XYZTileMesh } from './model/earth/XYZTypes.js'
export type { GridLabelContainers } from './model/grid/GridTextHelper.js'
export type { MeshHiPSConfig, MeshHiPSDebugStats, MeshHiPSTileCoord } from './model/meships/MeshHiPSTypes.js'

export {Source} from './model/Source.js'
export {Footprint} from './model/footprints/Footprint.js'
