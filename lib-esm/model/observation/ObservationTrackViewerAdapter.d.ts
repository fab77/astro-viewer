import type { ObservationTrackLike, ObservationTrackViewerAdapterOptions, ObservationTrackViewerHandle } from './ObservationTrackTypes.js';
export declare class ObservationTrackViewerAdapter {
    private activeHandle;
    private readonly viewer;
    private readonly metadataManagerFactory;
    private readonly colors;
    private readonly onFrame?;
    constructor(options: ObservationTrackViewerAdapterOptions);
    load(track: ObservationTrackLike): ObservationTrackViewerHandle;
    clear(): void;
}
