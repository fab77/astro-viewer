export type XYZLayerConfig = {
    urlTemplate: string;
    minZoom?: number;
    maxZoom?: number;
    segmentsPerSide?: number;
    tileSize?: number;
    maxCachedTiles?: number;
};
export type XYZLayerDebugStats = {
    cacheSize: number;
    visibleTileCount: number;
    readyTileCount: number;
    loadingTileCount: number;
    coolingDownTileCount: number;
    currentZoom: number | null;
    tileSelectionKey: string | null;
};
export type XYZRequestBackoffDebugEntry = {
    host: string;
    cooldownMs: number;
    consecutiveFailures: number;
};
export type XYZRequestSchedulerDebugStats = {
    activeRequests: number;
    queuedRequests: number;
    inflightRequests: number;
    maxConcurrentRequests: number;
    hostsInBackoff: XYZRequestBackoffDebugEntry[];
};
export type XYZDebugStats = {
    activeBaseLayer: 'hips' | 'xyz' | null;
    layer: XYZLayerDebugStats | null;
    requests: XYZRequestSchedulerDebugStats;
};
export type XYZTileCoord = {
    z: number;
    x: number;
    y: number;
};
export type XYZTileMesh = {
    positions: Float32Array;
    uvs: Float32Array;
    indices: Uint16Array | Uint32Array;
};
