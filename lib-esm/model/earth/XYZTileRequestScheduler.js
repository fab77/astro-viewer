export class XYZTileRequestError extends Error {
    cooldownMs;
    constructor(message, cooldownMs) {
        super(message);
        this.name = 'XYZTileRequestError';
        this.cooldownMs = cooldownMs;
    }
}
export class XYZTileRequestScheduler {
    _maxConcurrent;
    _activeCount = 0;
    _queue = [];
    _inflight = new Map();
    _hostCooldownUntil = new Map();
    constructor(maxConcurrent = 4) {
        this._maxConcurrent = maxConcurrent;
    }
    load(url) {
        const inflight = this._inflight.get(url);
        if (inflight) {
            return inflight;
        }
        const hostCooldown = this.getHostCooldown(url);
        const now = Date.now();
        if (hostCooldown > now) {
            return Promise.reject(new XYZTileRequestError(`Cooldown active for ${new URL(url).host}`, hostCooldown - now));
        }
        const promise = new Promise((resolve, reject) => {
            this._queue.push({ url, resolve, reject });
            this.pump();
        }).finally(() => {
            this._inflight.delete(url);
        });
        this._inflight.set(url, promise);
        return promise;
    }
    pump() {
        while (this._activeCount < this._maxConcurrent && this._queue.length > 0) {
            const item = this._queue.shift();
            if (!item) {
                return;
            }
            const hostCooldown = this.getHostCooldown(item.url);
            const now = Date.now();
            if (hostCooldown > now) {
                item.reject(new XYZTileRequestError(`Cooldown active for ${new URL(item.url).host}`, hostCooldown - now));
                continue;
            }
            this._activeCount += 1;
            this.fetchBlob(item)
                .then(item.resolve)
                .catch(item.reject)
                .finally(() => {
                this._activeCount -= 1;
                this.pump();
            });
        }
    }
    async fetchBlob(item) {
        try {
            const response = await fetch(item.url, {
                mode: 'cors',
                cache: 'force-cache',
            });
            if (!response.ok) {
                const cooldownMs = response.status === 429 ? 30000 : 10000;
                this.setHostCooldown(item.url, cooldownMs);
                throw new XYZTileRequestError(`HTTP ${response.status} loading ${item.url}`, cooldownMs);
            }
            return await response.blob();
        }
        catch (error) {
            if (error instanceof XYZTileRequestError) {
                throw error;
            }
            const cooldownMs = 10000;
            this.setHostCooldown(item.url, cooldownMs);
            throw new XYZTileRequestError(`Network/CORS failure loading ${item.url}`, cooldownMs);
        }
    }
    getHostCooldown(url) {
        try {
            return this._hostCooldownUntil.get(new URL(url).host) ?? 0;
        }
        catch {
            return 0;
        }
    }
    setHostCooldown(url, cooldownMs) {
        try {
            this._hostCooldownUntil.set(new URL(url).host, Date.now() + cooldownMs);
        }
        catch {
            // no-op
        }
    }
}
export const xyzTileRequestScheduler = new XYZTileRequestScheduler();
