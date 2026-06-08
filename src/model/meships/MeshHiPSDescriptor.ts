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
  private _fixedOrder = false
  private _maxCachedTiles = 384
  // default neutral color (contrasts with page background)
  private _color: [number, number, number, number] = [0.32, 0.34, 0.36, 1.0]
  private _wireframe = false
  private _propertiesRawText = ''
  private _propertiesMap: Map<string, string> = new Map()
  private _meshRadius: number | null = null

  constructor(config: MeshHiPSConfig, propertiesText = '') {
    this._baseUrl = this.normalizeBaseUrl(config.baseUrl)
    this._propertiesRawText = propertiesText
    this.parseProperties(propertiesText)

    this._name = config.name ?? this._propertiesMap.get('obs_collection') ?? this._propertiesMap.get('label') ?? this._name
    this._minOrder = config.minOrder ?? this.readNumber('hips_order_min', this._minOrder)
    this._maxOrder = config.maxOrder ?? this.readNumber('hips_order', this.readNumber('hips_order_max', this._maxOrder))
    this._fixedOrder = config.order !== undefined
    this._selectedOrder = config.order ?? this._minOrder
    this._maxCachedTiles = config.maxCachedTiles ?? this._maxCachedTiles
    // color: prefer explicit config, then properties.mesh_color, then default
    if (config.color) {
      this._color = config.color
    } else if (this._propertiesMap.has('mesh_color')) {
      const raw = this._propertiesMap.get('mesh_color') || ''
      const parts = raw.split(/[,\s]+/).map((v) => Number(v)).filter(Number.isFinite)
      if (parts.length >= 3) {
        let [r, g, b, a] = parts
        if (r > 1 || g > 1 || b > 1) {
          // assume 0-255 range
          r = r / 255
          g = g / 255
          b = b / 255
        }
        if (!Number.isFinite(a)) a = 1
        this._color = [r, g, b, a]
      }
    } else {
      this._color = this._color
    }
    this._wireframe = config.wireframe ?? this._wireframe

    this._selectedOrder = this.clampOrder(this._selectedOrder)
    // mesh radius: prefer explicit value from config, otherwise read mandatory property
    if (Number.isFinite((config as any).meshRadius)) {
      this._meshRadius = (config as any).meshRadius
    } else {
      const radiusFromProps = this.readNumber('mesh_radius', NaN)
      if (!Number.isFinite(radiusFromProps)) {
        throw new Error('Missing mandatory property "mesh_radius" in MeshHiPS properties')
      }
      this._meshRadius = radiusFromProps
    }
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

  get fixedOrder(): boolean {
    return this._fixedOrder
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

  get meshRadius(): number {
    return this._meshRadius as number
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
