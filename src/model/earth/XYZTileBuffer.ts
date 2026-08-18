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

import type { XYZTileCoord } from './XYZTypes.js';

export type XYZBufferedTile = {
  coord: XYZTileCoord;
  loading?: boolean;
  lastUsedAt?: number;
  createdAt?: number;
  touch?: () => void;
  dispose?: () => void;
};

export type XYZTileBufferEntry<TTile extends XYZBufferedTile = XYZBufferedTile> = {
  tile: TTile;
  cacheTime0?: number;
};

export type XYZTileFactory<TTile extends XYZBufferedTile = XYZBufferedTile> = (
  coord: XYZTileCoord,
) => TTile;

export class XYZTileBuffer<TTile extends XYZBufferedTile = XYZBufferedTile> {
  private _tiles: Map<string, XYZTileBufferEntry<TTile>> = new Map();
  private _cachedTiles: Map<string, XYZTileBufferEntry<TTile>> = new Map();
  private _cacheAliveMilliSeconds: number;
  private _cleanerId: number | undefined;

  constructor(minutesToLiveInCache = 1) {
    this._cacheAliveMilliSeconds = minutesToLiveInCache * 60 * 1000;

    if (typeof window !== 'undefined') {
      this._cleanerId = window.setInterval(() => {
        this.cacheCleaner();
      }, 10_000);
    }
  }

  get activeTiles(): Map<string, XYZTileBufferEntry<TTile>> {
    return this._tiles;
  }

  get cachedTiles(): Map<string, XYZTileBufferEntry<TTile>> {
    return this._cachedTiles;
  }

  get size(): number {
    return this._tiles.size + this._cachedTiles.size;
  }

  ensureTiles(
    visibleTiles: XYZTileCoord[],
    tileFactory: XYZTileFactory<TTile>,
  ): string[] {
    const visibleTileKeys: string[] = [];

    for (const tileCoord of visibleTiles) {
      const tile = this.getTile(tileCoord, tileFactory);
      this.touchTile(tile);
      visibleTileKeys.push(this.key(tileCoord));
    }

    this.syncVisibleTiles(visibleTileKeys);
    return visibleTileKeys;
  }

  getTile(
    tileCoord: XYZTileCoord,
    tileFactory: XYZTileFactory<TTile>,
  ): TTile {
    const tileKey = this.key(tileCoord);

    if (this._tiles.has(tileKey)) {
      return this._tiles.get(tileKey)!.tile;
    }

    if (this._cachedTiles.has(tileKey)) {
      const entry = this._cachedTiles.get(tileKey)!;
      entry.cacheTime0 = undefined;
      this._tiles.set(tileKey, entry);
      this._cachedTiles.delete(tileKey);
      return entry.tile;
    }

    const tile = tileFactory(tileCoord);
    this._tiles.set(tileKey, { tile });
    return tile;
  }

  getActiveTile(tileKey: string): TTile | null {
    return this._tiles.get(tileKey)?.tile ?? null;
  }

  getAnyTile(tileKey: string): TTile | null {
    return this._tiles.get(tileKey)?.tile ?? this._cachedTiles.get(tileKey)?.tile ?? null;
  }

  getActiveTiles(): TTile[] {
    return Array.from(this._tiles.values(), (entry) => entry.tile);
  }

  syncVisibleTiles(visibleTileKeys: string[]): void {
    const visibleKeySet = new Set(visibleTileKeys);

    for (const [tileKey, entry] of this._tiles) {
      if (visibleKeySet.has(tileKey)) {
        this.touchTile(entry.tile);
        continue;
      }

      entry.cacheTime0 = Date.now();
      this._cachedTiles.set(tileKey, entry);
      this._tiles.delete(tileKey);
    }
  }

  evictCached(maxCachedTiles: number): void {
    if (this.size <= maxCachedTiles) {
      return;
    }

    const candidates = Array.from(this._cachedTiles.entries()).sort((a, b) => {
      return this.getTileAgeScore(a[1].tile) - this.getTileAgeScore(b[1].tile);
    });

    for (const [tileKey, entry] of candidates) {
      if (this.size <= maxCachedTiles) {
        break;
      }
      if (entry.tile.loading) {
        continue;
      }

      entry.tile.dispose?.();
      this._cachedTiles.delete(tileKey);
    }
  }

  dispose(): void {
    if (this._cleanerId !== undefined && typeof window !== 'undefined') {
      window.clearInterval(this._cleanerId);
      this._cleanerId = undefined;
    }

    for (const entry of this._tiles.values()) {
      entry.tile.dispose?.();
    }
    for (const entry of this._cachedTiles.values()) {
      entry.tile.dispose?.();
    }

    this._tiles.clear();
    this._cachedTiles.clear();
  }

  key(tileCoord: XYZTileCoord): string {
    return XYZTileBuffer.key(tileCoord);
  }

  static key(tileCoord: XYZTileCoord): string {
    return `${tileCoord.z}/${tileCoord.x}/${tileCoord.y}`;
  }

  private cacheCleaner(): void {
    const now = Date.now();

    for (const [tileKey, entry] of this._cachedTiles) {
      const t0 = entry.cacheTime0;
      if (t0 === undefined || now - t0 <= this._cacheAliveMilliSeconds || entry.tile.loading) {
        continue;
      }

      entry.tile.dispose?.();
      this._cachedTiles.delete(tileKey);
    }
  }

  private touchTile(tile: TTile): void {
    tile.touch?.();
  }

  private getTileAgeScore(tile: TTile): number {
    const lastUsedAt = tile.lastUsedAt ?? 0;
    const createdAt = tile.createdAt ?? lastUsedAt;
    return Math.min(lastUsedAt || createdAt, createdAt);
  }
}
