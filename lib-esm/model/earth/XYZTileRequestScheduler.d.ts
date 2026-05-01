export declare class XYZTileRequestError extends Error {
    cooldownMs: number;
    constructor(message: string, cooldownMs: number);
}
export declare class XYZTileRequestScheduler {
    private _maxConcurrent;
    private _activeCount;
    private _queue;
    private _inflight;
    private _hostBackoff;
    constructor(maxConcurrent?: number);
    setMaxConcurrent(maxConcurrent: number): void;
    getMaxConcurrent(): number;
    load(url: string): Promise<Blob>;
    private pump;
    private fetchBlob;
    private getHostCooldown;
    private registerSuccess;
    private registerFailure;
}
export declare const xyzTileRequestScheduler: XYZTileRequestScheduler;
