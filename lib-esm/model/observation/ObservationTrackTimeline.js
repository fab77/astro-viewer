export function createObservationTrackTimeline(options) {
    return new ObservationTrackTimeline(options);
}
export class ObservationTrackTimeline {
    samples;
    startMs;
    endMs;
    currentMs;
    playing = false;
    rafId = null;
    lastFrameNowMs = null;
    playbackRate;
    onFrame;
    onStop;
    constructor(options) {
        this.samples = options.samples
            .map((sample, index) => ({
            ...sample,
            index,
            timeMs: Date.parse(String(sample.timestamp)),
        }))
            .filter((sample) => Number.isFinite(sample.timeMs))
            .sort((left, right) => left.timeMs - right.timeMs);
        if (this.samples.length === 0) {
            throw new Error('ObservationTrackTimeline requires at least one timestamped sample.');
        }
        this.startMs = this.samples[0].timeMs;
        this.endMs = this.samples[this.samples.length - 1].timeMs;
        this.currentMs = this.startMs;
        this.playbackRate = options.playbackRate ?? 1;
        this.onFrame = options.onFrame;
        this.onStop = options.onStop;
        this.emitFrame();
    }
    play() {
        if (this.playing)
            return;
        this.playing = true;
        this.lastFrameNowMs = null;
        this.rafId = requestAnimationFrame((nowMs) => this.tick(nowMs));
    }
    pause() {
        if (!this.playing)
            return;
        this.playing = false;
        this.cancelPendingFrame();
        this.onStop?.(this.getState());
    }
    seek(progress01) {
        const clampedProgress = clamp01(progress01);
        this.currentMs = this.startMs + (this.endMs - this.startMs) * clampedProgress;
        this.emitFrame();
    }
    destroy() {
        this.playing = false;
        this.cancelPendingFrame();
        this.onStop?.(this.getState());
    }
    getState() {
        return {
            startMs: this.startMs,
            endMs: this.endMs,
            currentMs: this.currentMs,
            progress01: this.getProgress(),
            playing: this.playing,
        };
    }
    tick(nowMs) {
        if (!this.playing)
            return;
        if (this.lastFrameNowMs === null) {
            this.lastFrameNowMs = nowMs;
        }
        const elapsedMs = nowMs - this.lastFrameNowMs;
        this.lastFrameNowMs = nowMs;
        this.currentMs += elapsedMs * this.playbackRate;
        if (this.currentMs >= this.endMs) {
            this.currentMs = this.endMs;
            this.emitFrame();
            this.pause();
            return;
        }
        this.emitFrame();
        this.rafId = requestAnimationFrame((nextNowMs) => this.tick(nextNowMs));
    }
    emitFrame() {
        const frame = computeFrame(this.samples, this.currentMs);
        this.onFrame?.({
            currentMs: this.currentMs,
            progress01: this.getProgress(),
            ...frame,
        });
    }
    getProgress() {
        if (this.endMs === this.startMs)
            return 0;
        return clamp01((this.currentMs - this.startMs) / (this.endMs - this.startMs));
    }
    cancelPendingFrame() {
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }
}
function computeFrame(samples, currentMs) {
    const first = samples[0];
    const last = samples[samples.length - 1];
    if (currentMs <= first.timeMs) {
        return frameFromSamples(first, first, 0);
    }
    if (currentMs >= last.timeMs) {
        return frameFromSamples(last, last, 0);
    }
    for (let index = 0; index < samples.length - 1; index++) {
        const previousSample = samples[index];
        const nextSample = samples[index + 1];
        if (currentMs >= previousSample.timeMs && currentMs <= nextSample.timeMs) {
            const t = (currentMs - previousSample.timeMs) / (nextSample.timeMs - previousSample.timeMs);
            return frameFromSamples(previousSample, nextSample, t);
        }
    }
    return frameFromSamples(last, last, 0);
}
function frameFromSamples(previousSample, nextSample, t) {
    const currentGroundPoint = interpolateGroundTrackPoint(previousSample, nextSample, t);
    const nearestSample = t < 0.5 ? previousSample : nextSample;
    const currentFootprint = interpolateFootprint(previousSample.footprint, nextSample.footprint, t, footprintToRing(nearestSample.footprint));
    return {
        markerPoint: currentGroundPoint,
        currentGroundPoint,
        currentFootprint,
        interpolationT: t,
        previousSample,
        nextSample,
        nearestSample,
        nearestSampleIndex: nearestSample.index,
    };
}
function interpolateGroundTrackPoint(previousSample, nextSample, t) {
    const previous = previousSample.groundTrackPoint;
    const next = nextSample.groundTrackPoint;
    const timeMs = lerp(previousSample.timeMs, nextSample.timeMs, t);
    return {
        timestamp: new Date(timeMs).toISOString(),
        longitudeDeg: interpolateLongitude(previous.longitudeDeg, next.longitudeDeg, t),
        latitudeDeg: lerp(previous.latitudeDeg, next.latitudeDeg, t),
        altitudeKm: lerp(previous.altitudeKm, next.altitudeKm, t),
    };
}
function interpolateFootprint(previousFootprint, nextFootprint, t, fallbackFootprint) {
    const previousRing = normalizeOpenRing(footprintToRing(previousFootprint));
    const nextRing = normalizeOpenRing(footprintToRing(nextFootprint));
    if (previousRing.length < 3
        || previousRing.length !== nextRing.length) {
        return fallbackFootprint;
    }
    const ring = previousRing.map(([previousLon, previousLat], index) => {
        const [nextLon, nextLat] = nextRing[index];
        return [
            interpolateLongitude(previousLon, nextLon, t),
            lerp(previousLat, nextLat, t),
        ];
    });
    return closeRing(ring);
}
export function footprintToRing(footprint) {
    if (isFootprintPolygon(footprint)) {
        return footprint.coordinates.map((coordinate) => [
            coordinate.longitudeDeg,
            coordinate.latitudeDeg,
        ]);
    }
    if (isFootprintMultiPolygon(footprint)) {
        const firstPolygon = footprint.polygons[0];
        return firstPolygon ? footprintToRing(firstPolygon) : [];
    }
    if (Array.isArray(footprint))
        return footprint;
    return [];
}
function isFootprintPolygon(footprint) {
    return !Array.isArray(footprint) && 'coordinates' in footprint;
}
function isFootprintMultiPolygon(footprint) {
    return !Array.isArray(footprint) && 'polygons' in footprint;
}
function normalizeOpenRing(footprint) {
    if (!Array.isArray(footprint))
        return [];
    const ring = [];
    for (const coordinate of footprint) {
        if (!Array.isArray(coordinate) || coordinate.length < 2)
            return [];
        const lon = Number(coordinate[0]);
        const lat = Number(coordinate[1]);
        if (!Number.isFinite(lon) || !Number.isFinite(lat) || lat < -90 || lat > 90) {
            return [];
        }
        ring.push([normalizeLongitudeDeg(lon), lat]);
    }
    while (ring.length > 1 && sameLonLat(ring[0], ring[ring.length - 1])) {
        ring.pop();
    }
    return ring;
}
function closeRing(ring) {
    if (ring.length === 0)
        return ring;
    const first = ring[0];
    const last = ring[ring.length - 1];
    return sameLonLat(first, last) ? ring : [...ring, [...first]];
}
function sameLonLat(left, right) {
    return Math.abs(left[0] - right[0]) < 1e-9
        && Math.abs(left[1] - right[1]) < 1e-9;
}
function interpolateLongitude(leftLongitudeDeg, rightLongitudeDeg, t) {
    const delta = normalizeLongitudeDeg(rightLongitudeDeg - leftLongitudeDeg);
    return normalizeLongitudeDeg(leftLongitudeDeg + delta * t);
}
function normalizeLongitudeDeg(longitudeDeg) {
    const normalized = ((((longitudeDeg + 180) % 360) + 360) % 360) - 180;
    return Object.is(normalized, -0) ? 0 : normalized;
}
function lerp(left, right, t) {
    return left + (right - left) * t;
}
function clamp01(value) {
    return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}
