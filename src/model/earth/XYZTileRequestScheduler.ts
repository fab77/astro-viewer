type QueueItem = {
  url: string
  resolve: (blob: Blob) => void
  reject: (error: Error) => void
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
  private _hostCooldownUntil: Map<string, number> = new Map()

  constructor(maxConcurrent = 4) {
    this._maxConcurrent = maxConcurrent
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
        const cooldownMs = response.status === 429 ? 30000 : 10000
        this.setHostCooldown(item.url, cooldownMs)
        throw new XYZTileRequestError(
          `HTTP ${response.status} loading ${item.url}`,
          cooldownMs,
        )
      }

      return await response.blob()
    } catch (error) {
      if (error instanceof XYZTileRequestError) {
        throw error
      }

      const cooldownMs = 10000
      this.setHostCooldown(item.url, cooldownMs)
      throw new XYZTileRequestError(
        `Network/CORS failure loading ${item.url}`,
        cooldownMs,
      )
    }
  }

  private getHostCooldown(url: string): number {
    try {
      return this._hostCooldownUntil.get(new URL(url).host) ?? 0
    } catch {
      return 0
    }
  }

  private setHostCooldown(url: string, cooldownMs: number): void {
    try {
      this._hostCooldownUntil.set(new URL(url).host, Date.now() + cooldownMs)
    } catch {
      // no-op
    }
  }
}

export const xyzTileRequestScheduler = new XYZTileRequestScheduler()
