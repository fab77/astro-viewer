/*
 * AstroViewer
 * Copyright (C) Fabrizio Giordano
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-AstroViewer-Commercial
 *
 * AstroViewer is dual-licensed under the GNU Affero General Public License
 * version 3 and a separate commercial license.
 *
 * See LICENSE.md, LICENSE-AGPL.md, and LICENSE-COMMERCIAL.md for details.
 */

import type { XYZRequestSchedulerDebugStats } from './XYZConfig.js'

type QueueItem = {
  url: string
  resolve: (blob: Blob) => void
  reject: (error: Error) => void
  priority: number
  sequence: number
}

type HostBackoffState = {
  cooldownUntil: number
  consecutiveFailures: number
}

export class XYZTileRequestError extends Error {
  cooldownMs: number
  retryable: boolean

  constructor(message: string, cooldownMs: number, retryable = true) {
    super(message)
    this.name = 'XYZTileRequestError'
    this.cooldownMs = cooldownMs
    this.retryable = retryable
  }
}

export class XYZTileRequestScheduler {
  private _maxConcurrent: number
  private _activeCount = 0
  private _queue: QueueItem[] = []
  private _inflight: Map<string, Promise<Blob>> = new Map()
  private _hostBackoff: Map<string, HostBackoffState> = new Map()
  private _sequence = 0

  constructor(maxConcurrent = 4) {
    this._maxConcurrent = maxConcurrent
  }

  setMaxConcurrent(maxConcurrent: number): void {
    this._maxConcurrent = Math.max(1, Math.floor(maxConcurrent))
    this.pump()
  }

  getMaxConcurrent(): number {
    return this._maxConcurrent
  }

  getDebugStats(): XYZRequestSchedulerDebugStats {
    const now = Date.now()
    const hostsInBackoff = Array.from(this._hostBackoff.entries())
      .map(([host, state]) => ({
        host,
        cooldownMs: Math.max(0, state.cooldownUntil - now),
        consecutiveFailures: state.consecutiveFailures,
      }))
      .filter((entry) => entry.cooldownMs > 0 || entry.consecutiveFailures > 0)
      .sort((a, b) => b.cooldownMs - a.cooldownMs)

    return {
      activeRequests: this._activeCount,
      queuedRequests: this._queue.length,
      inflightRequests: this._inflight.size,
      maxConcurrentRequests: this._maxConcurrent,
      highestQueuedPriority: this._queue[0]?.priority ?? null,
      hostsInBackoff,
    }
  }

  load(url: string, priority = 0): Promise<Blob> {
    const inflight = this._inflight.get(url)
    if (inflight) {
      return inflight
    }

    const hostCooldown = this.getHostCooldown(url)
    const now = Date.now()
    if (hostCooldown > now) {
      return Promise.reject(
        new XYZTileRequestError(
          `Cooldown active for ${new URL(url).host}`,
          hostCooldown - now,
        ),
      )
    }

    const promise = new Promise<Blob>((resolve, reject) => {
      this._queue.push({
        url,
        resolve,
        reject,
        priority,
        sequence: this._sequence++,
      })
      this._queue.sort((a, b) => b.priority - a.priority || a.sequence - b.sequence)
      this.pump()
    }).finally(() => {
      this._inflight.delete(url)
    })

    this._inflight.set(url, promise)
    return promise
  }

  private pump(): void {
    while (this._activeCount < this._maxConcurrent && this._queue.length > 0) {
      const item = this._queue.shift()
      if (!item) return

      const hostCooldown = this.getHostCooldown(item.url)
      const now = Date.now()
      if (hostCooldown > now) {
        item.reject(
          new XYZTileRequestError(
            `Cooldown active for ${new URL(item.url).host}`,
            hostCooldown - now,
          ),
        )
        continue
      }

      this._activeCount += 1
      this.fetchBlob(item)
        .then(item.resolve)
        .catch(item.reject)
        .finally(() => {
          this._activeCount -= 1
          this.pump()
        })
    }
  }

  private async fetchBlob(item: QueueItem): Promise<Blob> {
    try {
      const response = await fetch(item.url, {
        mode: 'cors',
        cache: 'force-cache',
      })

      if (!response.ok) {
        const isTransient = response.status === 429 || response.status >= 500
        const cooldownMs = this.registerFailure(item.url, isTransient)
        throw new XYZTileRequestError(
          `HTTP ${response.status} loading ${item.url}`,
          isTransient ? cooldownMs : 5 * 60 * 1000,
          isTransient,
        )
      }

      this.registerSuccess(item.url)
      return await response.blob()
    } catch (error) {
      if (error instanceof XYZTileRequestError) {
        throw error
      }

      const cooldownMs = this.registerFailure(item.url, false)
      throw new XYZTileRequestError(
        `Network/CORS failure loading ${item.url}`,
        cooldownMs,
        true,
      )
    }
  }

  private getHostCooldown(url: string): number {
    try {
      return this._hostBackoff.get(new URL(url).host)?.cooldownUntil ?? 0
    } catch {
      return 0
    }
  }

  private registerSuccess(url: string): void {
    try {
      const host = new URL(url).host
      this._hostBackoff.set(host, {
        cooldownUntil: 0,
        consecutiveFailures: 0,
      })
    } catch {
      // no-op
    }
  }

  private registerFailure(url: string, isRateLimited: boolean): number {
    if (!isRateLimited) {
      return 0
    }

    try {
      const host = new URL(url).host
      const previous = this._hostBackoff.get(host) ?? {
        cooldownUntil: 0,
        consecutiveFailures: 0,
      }
      const consecutiveFailures = previous.consecutiveFailures + 1
      const baseDelayMs = 4000
      const cooldownMs = Math.min(
        120000,
        baseDelayMs * (2 ** Math.min(consecutiveFailures - 1, 5)),
      )

      this._hostBackoff.set(host, {
        cooldownUntil: Date.now() + cooldownMs,
        consecutiveFailures,
      })

      return cooldownMs
    } catch {
      return 30000
    }
  }
}

export const xyzTileRequestScheduler = new XYZTileRequestScheduler()
