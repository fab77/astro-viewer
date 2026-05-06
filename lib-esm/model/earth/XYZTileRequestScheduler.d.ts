import type { XYZRequestSchedulerDebugStats } from './types.js';
export declare class XYZTileRequestError extends Error {
    cooldownMs: number;
    retryable: boolean;
    constructor(message: string, cooldownMs: number, retryable?: boolean);
}
export declare class XYZTileRequestScheduler {
    private _maxConcurrent;
    private _activeCount;
    private _queue;
    private _inflight;
    private _hostBackoff;
    private _sequence;
    constructor(maxConcurrent?: number);
    setMaxConcurrent(maxConcurrent: number): void;
    getMaxConcurrent(): number;
    getDebugStats(): XYZRequestSchedulerDebugStats;
    load(url: string, priority?: number): Promise<Blob>;
    private pump;
    private fetchBlob;
    private getHostCooldown;
    private registerSuccess;
    private registerFailure;
}
export declare const xyzTileRequestScheduler: XYZTileRequestScheduler;
