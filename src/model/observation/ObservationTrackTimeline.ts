import type {
  FootprintGeometryLike,
  FootprintMultiPolygonLike,
  FootprintPolygonLike,
  GroundTrackPointLike,
  ObservationSampleLike,
  ObservationTimelineSample,
  ObservationTrackFrame,
  ObservationTrackTimelineController,
  ObservationTrackTimelineOptions,
  ObservationTrackTimelineState,
} from './ObservationTrackTypes.js'

export function createObservationTrackTimeline(
  options: ObservationTrackTimelineOptions,
): ObservationTrackTimelineController {
  return new ObservationTrackTimeline(options)
}

export class ObservationTrackTimeline implements ObservationTrackTimelineController {
  private readonly samples: ObservationTimelineSample[]
  private readonly startMs: number
  private readonly endMs: number
  private currentMs: number
  private playing = false
  private rafId: number | null = null
  private lastFrameNowMs: number | null = null
  private readonly playbackRate: number
  private readonly onFrame?: (frame: ObservationTrackFrame) => void
  private readonly onStop?: (state: ObservationTrackTimelineState) => void

  constructor(options: ObservationTrackTimelineOptions) {
    this.samples = options.samples
      .map((sample, index) => ({
        ...sample,
        index,
        timeMs: Date.parse(String(sample.timestamp)),
      }))
      .filter((sample) => Number.isFinite(sample.timeMs))
      .sort((left, right) => left.timeMs - right.timeMs)

    if (this.samples.length === 0) {
      throw new Error('ObservationTrackTimeline requires at least one timestamped sample.')
    }

    this.startMs = this.samples[0].timeMs
    this.endMs = this.samples[this.samples.length - 1].timeMs
    this.currentMs = this.startMs
    this.playbackRate = options.playbackRate ?? 1
    this.onFrame = options.onFrame
    this.onStop = options.onStop
    this.emitFrame()
  }

  play(): void {
    if (this.playing) return
    this.playing = true
    this.lastFrameNowMs = null
    this.rafId = requestAnimationFrame((nowMs) => this.tick(nowMs))
  }

  pause(): void {
    if (!this.playing) return
    this.playing = false
    this.cancelPendingFrame()
    this.onStop?.(this.getState())
  }

  seek(progress01: number): void {
    const clampedProgress = clamp01(progress01)
    this.currentMs = this.startMs + (this.endMs - this.startMs) * clampedProgress
    this.emitFrame()
  }

  destroy(): void {
    this.playing = false
    this.cancelPendingFrame()
    this.onStop?.(this.getState())
  }

  getState(): ObservationTrackTimelineState {
    return {
      startMs: this.startMs,
      endMs: this.endMs,
      currentMs: this.currentMs,
      progress01: this.getProgress(),
      playing: this.playing,
    }
  }

  private tick(nowMs: number): void {
    if (!this.playing) return

    if (this.lastFrameNowMs === null) {
      this.lastFrameNowMs = nowMs
    }

    const elapsedMs = nowMs - this.lastFrameNowMs
    this.lastFrameNowMs = nowMs
    this.currentMs += elapsedMs * this.playbackRate

    if (this.currentMs >= this.endMs) {
      this.currentMs = this.endMs
      this.emitFrame()
      this.pause()
      return
    }

    this.emitFrame()
    this.rafId = requestAnimationFrame((nextNowMs) => this.tick(nextNowMs))
  }

  private emitFrame(): void {
    const frame = computeFrame(this.samples, this.currentMs)
    this.onFrame?.({
      currentMs: this.currentMs,
      progress01: this.getProgress(),
      ...frame,
    })
  }

  private getProgress(): number {
    if (this.endMs === this.startMs) return 0
    return clamp01((this.currentMs - this.startMs) / (this.endMs - this.startMs))
  }

  private cancelPendingFrame(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }
}

function computeFrame(samples: readonly ObservationTimelineSample[], currentMs: number): Omit<ObservationTrackFrame, 'currentMs' | 'progress01'> {
  const first = samples[0]
  const last = samples[samples.length - 1]

  if (currentMs <= first.timeMs) {
    return frameFromSamples(first, first, 0)
  }

  if (currentMs >= last.timeMs) {
    return frameFromSamples(last, last, 0)
  }

  for (let index = 0; index < samples.length - 1; index++) {
    const previousSample = samples[index]
    const nextSample = samples[index + 1]
    if (currentMs >= previousSample.timeMs && currentMs <= nextSample.timeMs) {
      const t = (currentMs - previousSample.timeMs) / (nextSample.timeMs - previousSample.timeMs)
      return frameFromSamples(previousSample, nextSample, t)
    }
  }

  return frameFromSamples(last, last, 0)
}

function frameFromSamples(
  previousSample: ObservationTimelineSample,
  nextSample: ObservationTimelineSample,
  t: number,
): Omit<ObservationTrackFrame, 'currentMs' | 'progress01'> {
  const currentGroundPoint = interpolateGroundTrackPoint(previousSample, nextSample, t)
  const nearestSample = t < 0.5 ? previousSample : nextSample
  const currentFootprint = interpolateFootprint(
    previousSample.footprint,
    nextSample.footprint,
    t,
    footprintToRing(nearestSample.footprint),
  )

  return {
    markerPoint: currentGroundPoint,
    currentGroundPoint,
    currentFootprint,
    interpolationT: t,
    previousSample,
    nextSample,
    nearestSample,
    nearestSampleIndex: nearestSample.index,
  }
}

function interpolateGroundTrackPoint(
  previousSample: ObservationTimelineSample,
  nextSample: ObservationTimelineSample,
  t: number,
): GroundTrackPointLike {
  const previous = previousSample.groundTrackPoint
  const next = nextSample.groundTrackPoint
  const timeMs = lerp(previousSample.timeMs, nextSample.timeMs, t)

  return {
    timestamp: new Date(timeMs).toISOString(),
    longitudeDeg: interpolateLongitude(previous.longitudeDeg, next.longitudeDeg, t),
    latitudeDeg: lerp(previous.latitudeDeg, next.latitudeDeg, t),
    altitudeKm: lerp(previous.altitudeKm, next.altitudeKm, t),
  }
}

function interpolateFootprint(
  previousFootprint: FootprintGeometryLike,
  nextFootprint: FootprintGeometryLike,
  t: number,
  fallbackFootprint: readonly (readonly [number, number])[],
): readonly (readonly [number, number])[] {
  const previousRing = normalizeOpenRing(footprintToRing(previousFootprint))
  const nextRing = normalizeOpenRing(footprintToRing(nextFootprint))

  if (
    previousRing.length < 3
    || previousRing.length !== nextRing.length
  ) {
    return fallbackFootprint
  }

  const ring = previousRing.map(([previousLon, previousLat], index) => {
    const [nextLon, nextLat] = nextRing[index]
    return [
      interpolateLongitude(previousLon, nextLon, t),
      lerp(previousLat, nextLat, t),
    ] as const
  })

  return closeRing(ring)
}

export function footprintToRing(
  footprint: FootprintGeometryLike,
): readonly (readonly [longitudeDeg: number, latitudeDeg: number])[] {
  if (isFootprintPolygon(footprint)) {
    return footprint.coordinates.map((coordinate) => [
      coordinate.longitudeDeg,
      coordinate.latitudeDeg,
    ] as const)
  }
  if (isFootprintMultiPolygon(footprint)) {
    const firstPolygon = footprint.polygons[0]
    return firstPolygon ? footprintToRing(firstPolygon) : []
  }
  if (Array.isArray(footprint)) return footprint
  return []
}

function isFootprintPolygon(footprint: FootprintGeometryLike): footprint is FootprintPolygonLike {
  return !Array.isArray(footprint) && 'coordinates' in footprint
}

function isFootprintMultiPolygon(footprint: FootprintGeometryLike): footprint is FootprintMultiPolygonLike {
  return !Array.isArray(footprint) && 'polygons' in footprint
}

function normalizeOpenRing(
  footprint: readonly (readonly [number, number])[],
): readonly (readonly [number, number])[] {
  if (!Array.isArray(footprint)) return []

  const ring: (readonly [number, number])[] = []
  for (const coordinate of footprint) {
    if (!Array.isArray(coordinate) || coordinate.length < 2) return []
    const lon = Number(coordinate[0])
    const lat = Number(coordinate[1])
    if (!Number.isFinite(lon) || !Number.isFinite(lat) || lat < -90 || lat > 90) {
      return []
    }
    ring.push([normalizeLongitudeDeg(lon), lat])
  }

  while (ring.length > 1 && sameLonLat(ring[0], ring[ring.length - 1])) {
    ring.pop()
  }

  return ring
}

function closeRing(
  ring: readonly (readonly [number, number])[],
): readonly (readonly [number, number])[] {
  if (ring.length === 0) return ring
  const first = ring[0]
  const last = ring[ring.length - 1]
  return sameLonLat(first, last) ? ring : [...ring, [...first] as const]
}

function sameLonLat(left: readonly [number, number], right: readonly [number, number]): boolean {
  return Math.abs(left[0] - right[0]) < 1e-9
    && Math.abs(left[1] - right[1]) < 1e-9
}

function interpolateLongitude(leftLongitudeDeg: number, rightLongitudeDeg: number, t: number): number {
  const delta = normalizeLongitudeDeg(rightLongitudeDeg - leftLongitudeDeg)
  return normalizeLongitudeDeg(leftLongitudeDeg + delta * t)
}

function normalizeLongitudeDeg(longitudeDeg: number): number {
  const normalized = ((((longitudeDeg + 180) % 360) + 360) % 360) - 180
  return Object.is(normalized, -0) ? 0 : normalized
}

function lerp(left: number, right: number, t: number): number {
  return left + (right - left) * t
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))
}
