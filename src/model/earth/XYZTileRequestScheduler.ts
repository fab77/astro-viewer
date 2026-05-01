type QueueItem = {
  url: string
  resolve: (blob: Blob) => void
  reject: (error: Error) => void
}

type HostBackoffState = {
  cooldownUntil: number
  consecutiveFailures: number
}

export class XYZTileRequestError extends Error {
  cooldownMs: number

  constructor(message: string, cooldownMs: number) {
    super(message)
    this.name = 'XYZTileRequestError'
    this.cooldownMs = cooldownMs
  }
}

export class XYZTileRequestScheduler {
  private _maxConcurrent: number
  private _activeCount = 0
  private _queue: QueueItem[] = []
  private _inflight: Map<string, Promise<Blob>> = new Map()
  private _hostBackoff: Map<string, HostBackoffState> = new Map()

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

  load(url: string): Promise<Blob> {
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
      this._queue.push({ url, resolve, reject })
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
      if (!item) {
        return
      }

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
        const cooldownMs = this.registerFailure(item.url, response.status === 429)
        throw new XYZTileRequestError(
          `HTTP ${response.status} loading ${item.url}`,
          cooldownMs,
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
    try {
      const host = new URL(url).host
      const previous = this._hostBackoff.get(host) ?? {
        cooldownUntil: 0,
        consecutiveFailures: 0,
      }
      const consecutiveFailures = previous.consecutiveFailures + 1
      const baseDelayMs = isRateLimited ? 4000 : 1500
      const cooldownMs = Math.min(
        isRateLimited ? 120000 : 30000,
        baseDelayMs * (2 ** Math.min(consecutiveFailures - 1, 5)),
      )

      this._hostBackoff.set(host, {
        cooldownUntil: Date.now() + cooldownMs,
        consecutiveFailures,
      })

      return cooldownMs
    } catch {
      return isRateLimited ? 30000 : 10000
    }
  }
}

export const xyzTileRequestScheduler = new XYZTileRequestScheduler()
