/*
 * AstroViewer
 * Copyright (C) Fabrizio Giordano
 * SPDX-License-Identifier: LicenseRef-AstroViewer-Dual-License
 */

import type { MeshHiPSConfig } from './MeshHiPSTypes.js'

export class MeshHiPSDescriptor {
  private _name = 'MeshHiPS'
  private _baseUrl: string
  private _minOrder = 0
  private _maxOrder = 0
  private _selectedOrder: number
  private _maxCachedTiles = 384
  private _color: [number, number, number, number] = [0.72, 0.86, 1.0, 1.0]
  private _wireframe = false
  private _propertiesRawText = ''
  private _propertiesMap: Map<string, string> = new Map()

  constructor(config: MeshHiPSConfig, propertiesText = '') {
    this._baseUrl = this.normalizeBaseUrl(config.baseUrl)
    this._propertiesRawText = propertiesText
    this.parseProperties(propertiesText)

    this._name = config.name ?? this._propertiesMap.get('obs_collection') ?? this._propertiesMap.get('label') ?? this._name
    this._minOrder = config.minOrder ?? this.readNumber('hips_order_min', this._minOrder)
    this._maxOrder = config.maxOrder ?? this.readNumber('hips_order', this.readNumber('hips_order_max', this._maxOrder))
    this._selectedOrder = config.order ?? this._maxOrder
    this._maxCachedTiles = config.maxCachedTiles ?? this._maxCachedTiles
    this._color = config.color ?? this._color
    this._wireframe = config.wireframe ?? this._wireframe

    this._selectedOrder = this.clampOrder(this._selectedOrder)
  }

  get name(): string {
    return this._name
  }

  get baseUrl(): string {
    return this._baseUrl
  }

  get minOrder(): number {
    return this._minOrder
  }

  get maxOrder(): number {
    return this._maxOrder
  }

  get selectedOrder(): number {
    return this._selectedOrder
  }

  get maxCachedTiles(): number {
    return this._maxCachedTiles
  }

  get color(): [number, number, number, number] {
    return this._color
  }

  get wireframe(): boolean {
    return this._wireframe
  }

  get propertiesRawText(): string {
    return this._propertiesRawText
  }

  get properties(): ReadonlyMap<string, string> {
    return new Map(this._propertiesMap)
  }

  getProperty(key: string): string | undefined {
    return this._propertiesMap.get(key)
  }

  getTileUrl(order: number, ipix: number): string {
    const dir = Math.floor(ipix / 10_000) * 10_000
    return `${this._baseUrl}Norder${order}/Dir${dir}/Npix${ipix}.obj`
  }

  private parseProperties(propertiesText: string): void {
    const lines = propertiesText.split(/\r\n|\n/)
    for (const raw of lines) {
      const line = raw.trim()
      if (!line || line.startsWith('#')) continue
      const idx = line.indexOf('=')
      if (idx < 0) continue
      this._propertiesMap.set(line.slice(0, idx).trim(), line.slice(idx + 1).trim())
    }
  }

  private readNumber(key: string, fallback: number): number {
    const parsed = Number(this._propertiesMap.get(key))
    return Number.isFinite(parsed) ? parsed : fallback
  }

  private clampOrder(order: number): number {
    return Math.max(this._minOrder, Math.min(this._maxOrder, order))
  }

  private normalizeBaseUrl(baseUrl: string): string {
    return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  }
}
