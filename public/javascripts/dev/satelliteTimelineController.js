export function createSatelliteTimelineController({
  samples,
  onFrame,
  onStop,
  playbackRate = 1,
}) {
  const timelineSamples = samples
    .map((sample, index) => ({
      ...sample,
      index,
      timeMs: Date.parse(sample.timestamp),
    }))
    .filter((sample) => Number.isFinite(sample.timeMs))
    .sort((left, right) => left.timeMs - right.timeMs);

  if (timelineSamples.length === 0) {
    throw new Error('Satellite timeline requires at least one timestamped sample.');
  }

  const startMs = timelineSamples[0].timeMs;
  const endMs = timelineSamples[timelineSamples.length - 1].timeMs;
  let currentMs = startMs;
  let playing = false;
  let rafId = null;
  let lastFrameNowMs = null;

  function play() {
    if (playing) return;
    playing = true;
    lastFrameNowMs = null;
    rafId = requestAnimationFrame(tick);
  }

  function pause() {
    if (!playing) return;
    playing = false;
    cancelPendingFrame();
    onStop?.(getState());
  }

  function seek(progress01) {
    const clampedProgress = clamp01(progress01);
    currentMs = startMs + (endMs - startMs) * clampedProgress;
    emitFrame();
  }

  function destroy() {
    playing = false;
    cancelPendingFrame();
    onStop?.(getState());
  }

  function getState() {
    return {
      startMs,
      endMs,
      currentMs,
      progress01: getProgress(),
      playing,
    };
  }

  function tick(nowMs) {
    if (!playing) return;

    if (lastFrameNowMs === null) {
      lastFrameNowMs = nowMs;
    }

    const elapsedMs = nowMs - lastFrameNowMs;
    lastFrameNowMs = nowMs;
    currentMs += elapsedMs * playbackRate;

    if (currentMs >= endMs) {
      currentMs = endMs;
      emitFrame();
      pause();
      return;
    }

    emitFrame();
    rafId = requestAnimationFrame(tick);
  }

  function emitFrame() {
    const frame = computeFrame(timelineSamples, currentMs);
    onFrame?.({
      currentMs,
      progress01: getProgress(),
      ...frame,
    });
  }

  function getProgress() {
    if (endMs === startMs) return 0;
    return clamp01((currentMs - startMs) / (endMs - startMs));
  }

  function cancelPendingFrame() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  emitFrame();

  return {
    play,
    pause,
    seek,
    destroy,
    getState,
  };
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
  const markerPoint = interpolateGroundTrackPoint(previousSample, nextSample, t);
  const nearestSample = t < 0.5 ? previousSample : nextSample;

  return {
    markerPoint,
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
