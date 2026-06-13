import type { MetadataManager } from '../MetadataManager.js'
import type { AstroViewer } from '../../AstroViewer.js'

export interface GroundTrackPointLike {
  readonly timestamp?: Date | string
  readonly latitudeDeg: number
  readonly longitudeDeg: number
  readonly altitudeKm: number
}

export interface FootprintGeoPositionLike {
  readonly latitudeDeg: number
  readonly longitudeDeg: number
}

export interface FootprintPolygonLike {
  readonly timestamp?: Date | string
  readonly coordinates: readonly FootprintGeoPositionLike[]
}

export interface FootprintMultiPolygonLike {
  readonly timestamp?: Date | string
  readonly polygons: readonly FootprintPolygonLike[]
}

export type FootprintGeometryLike =
  | FootprintPolygonLike
  | FootprintMultiPolygonLike
  | readonly (readonly [longitudeDeg: number, latitudeDeg: number])[]

export interface ObservationSampleLike {
  readonly timestamp: Date | string
  readonly groundTrackPoint: GroundTrackPointLike
  readonly footprint: FootprintGeometryLike
  readonly intersectsTarget?: boolean
  readonly intersects?: boolean
}

export interface SatelliteModelConfigLike {
  readonly objUrl?: string
  readonly visualScale?: number
}

export interface SatelliteConfigLike {
  readonly id?: string
  readonly name?: string
  readonly tleName?: string
  readonly model?: SatelliteModelConfigLike
}

export interface SensorConfigLike {
  readonly id?: string
  readonly name?: string
  readonly type?: string
  readonly pointingMode?: string
  readonly fieldOfViewDeg?: number
}

export interface ObservationTargetLike {
  readonly id?: string
  readonly name?: string
  readonly geojson?: unknown
  readonly geojsonUrl?: string
}

export interface ObservationVisualisationLike {
  readonly showSatelliteModel?: boolean
  readonly showGroundTrack?: boolean
  readonly showFootprint?: boolean
  readonly showSensorCone?: boolean
  readonly showCurrentFootprintOnly?: boolean
  readonly showAllFootprints?: boolean
}

export interface ObservationTrackLike {
  readonly id?: string
  readonly satellite?: SatelliteConfigLike
  readonly sensor?: SensorConfigLike
  readonly sensorId?: string
  readonly target?: ObservationTargetLike
  readonly visualisation?: ObservationVisualisationLike
  readonly samples: readonly ObservationSampleLike[]
  readonly intersectsTarget?: boolean
}

export interface ObservationTrackFrame {
  readonly currentMs: number
  readonly progress01: number
  readonly markerPoint: GroundTrackPointLike
  readonly currentGroundPoint: GroundTrackPointLike
  readonly currentFootprint: readonly (readonly [longitudeDeg: number, latitudeDeg: number])[]
  readonly interpolationT: number
  readonly previousSample: ObservationTimelineSample
  readonly nextSample: ObservationTimelineSample
  readonly nearestSample: ObservationTimelineSample
  readonly nearestSampleIndex: number
}

export interface ObservationTimelineSample extends ObservationSampleLike {
  readonly index: number
  readonly timeMs: number
}

export interface ObservationTrackTimelineState {
  readonly startMs: number
  readonly endMs: number
  readonly currentMs: number
  readonly progress01: number
  readonly playing: boolean
}

export interface ObservationTrackTimelineOptions {
  readonly samples: readonly ObservationSampleLike[]
  readonly onFrame?: (frame: ObservationTrackFrame) => void
  readonly onStop?: (state: ObservationTrackTimelineState) => void
  readonly playbackRate?: number
}

export interface ObservationTrackTimelineController {
  play(): void
  pause(): void
  seek(progress01: number): void
  destroy(): void
  getState(): ObservationTrackTimelineState
}

export interface ObservationTrackViewerColors {
  readonly groundTrack?: string
  readonly footprints?: string
  readonly currentFootprint?: string
  readonly marker?: string
  readonly satelliteObject?: [number, number, number, number]
  readonly sensorCone?: [number, number, number, number]
  readonly target?: string
}

export interface ObservationTrackViewerAdapterOptions {
  readonly viewer: AstroViewer
  readonly metadataManagerFactory?: () => MetadataManager
  readonly colors?: ObservationTrackViewerColors
  readonly onFrame?: (frame: ObservationTrackFrame) => void
}

export interface ObservationTrackViewerHandle {
  readonly track: ObservationTrackLike
  readonly timeline: ObservationTrackTimelineController
  play(): void
  pause(): void
  seek(progress01: number): void
  setVisualisation(config: Partial<ObservationVisualisationLike>): void
  dispose(): void
}
