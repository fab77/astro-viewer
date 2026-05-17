/*
 * AstroViewer
 * Copyright (C) Fabrizio Giordano
 * SPDX-License-Identifier: LicenseRef-AstroViewer-Dual-License
 *
 * This file is part of AstroViewer.
 * AstroViewer is distributed under a dual-license model.
 * Commercial use requires a separate commercial license.
 * Non-commercial use is governed by LICENSE-NONCOMMERCIAL.md.
 *
 * See LICENSE.md, LICENSE-COMMERCIAL.md, and LICENSE-NONCOMMERCIAL.md for details.
 */
export class XYZTileRequestError extends Error {
    cooldownMs;
    retryable;
    constructor(message, cooldownMs, retryable = true) {
        super(message);
        this.name = 'XYZTileRequestError';
        this.cooldownMs = cooldownMs;
        this.retryable = retryable;
    }
}
export class XYZTileRequestScheduler {
    _maxConcurrent;
    _activeCount = 0;
    _queue = [];
    _inflight = new Map();
    _hostBackoff = new Map();
    _sequence = 0;
    constructor(maxConcurrent = 4) {
        this._maxConcurrent = maxConcurrent;
    }
    setMaxConcurrent(maxConcurrent) {
        this._maxConcurrent = Math.max(1, Math.floor(maxConcurrent));
        this.pump();
    }
    getMaxConcurrent() {
        return this._maxConcurrent;
    }
    getDebugStats() {
        const now = Date.now();
        const hostsInBackoff = Array.from(this._hostBackoff.entries())
            .map(([host, state]) => ({
            host,
            cooldownMs: Math.max(0, state.cooldownUntil - now),
            consecutiveFailures: state.consecutiveFailures,
        }))
            .filter((entry) => entry.cooldownMs > 0 || entry.consecutiveFailures > 0)
            .sort((a, b) => b.cooldownMs - a.cooldownMs);
        return {
            activeRequests: this._activeCount,
            queuedRequests: this._queue.length,
            inflightRequests: this._inflight.size,
            maxConcurrentRequests: this._maxConcurrent,
            highestQueuedPriority: this._queue[0]?.priority ?? null,
            hostsInBackoff,
        };
    }
    load(url, priority = 0) {
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
            this._queue.push({
                url,
                resolve,
                reject,
                priority,
                sequence: this._sequence++,
            });
            this._queue.sort((a, b) => b.priority - a.priority || a.sequence - b.sequence);
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
            if (!item)
                return;
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
                const isTransient = response.status === 429 || response.status >= 500;
                const cooldownMs = this.registerFailure(item.url, isTransient);
                throw new XYZTileRequestError(`HTTP ${response.status} loading ${item.url}`, isTransient ? cooldownMs : 5 * 60 * 1000, isTransient);
            }
            this.registerSuccess(item.url);
            return await response.blob();
        }
        catch (error) {
            if (error instanceof XYZTileRequestError) {
                throw error;
            }
            const cooldownMs = this.registerFailure(item.url, false);
            throw new XYZTileRequestError(`Network/CORS failure loading ${item.url}`, cooldownMs, true);
        }
    }
    getHostCooldown(url) {
        try {
            return this._hostBackoff.get(new URL(url).host)?.cooldownUntil ?? 0;
        }
        catch {
            return 0;
        }
    }
    registerSuccess(url) {
        try {
            const host = new URL(url).host;
            this._hostBackoff.set(host, {
                cooldownUntil: 0,
                consecutiveFailures: 0,
            });
        }
        catch {
            // no-op
        }
    }
    registerFailure(url, isRateLimited) {
        if (!isRateLimited) {
            return 0;
        }
        try {
            const host = new URL(url).host;
            const previous = this._hostBackoff.get(host) ?? {
                cooldownUntil: 0,
                consecutiveFailures: 0,
            };
            const consecutiveFailures = previous.consecutiveFailures + 1;
            const baseDelayMs = 4000;
            const cooldownMs = Math.min(120000, baseDelayMs * (2 ** Math.min(consecutiveFailures - 1, 5)));
            this._hostBackoff.set(host, {
                cooldownUntil: Date.now() + cooldownMs,
                consecutiveFailures,
            });
            return cooldownMs;
        }
        catch {
            return 30000;
        }
    }
}
export const xyzTileRequestScheduler = new XYZTileRequestScheduler();
