import type { FootprintGeometryLike, ObservationTrackTimelineController, ObservationTrackTimelineOptions, ObservationTrackTimelineState } from './ObservationTrackTypes.js';
export declare function createObservationTrackTimeline(options: ObservationTrackTimelineOptions): ObservationTrackTimelineController;
export declare class ObservationTrackTimeline implements ObservationTrackTimelineController {
    private readonly samples;
    private readonly startMs;
    private readonly endMs;
    private currentMs;
    private playing;
    private rafId;
    private lastFrameNowMs;
    private readonly playbackRate;
    private readonly onFrame?;
    private readonly onStop?;
    constructor(options: ObservationTrackTimelineOptions);
    play(): void;
    pause(): void;
    seek(progress01: number): void;
    destroy(): void;
    getState(): ObservationTrackTimelineState;
    private tick;
    private emitFrame;
    private getProgress;
    private cancelPendingFrame;
}
export declare function footprintToRing(footprint: FootprintGeometryLike): readonly (readonly [longitudeDeg: number, latitudeDeg: number])[];
