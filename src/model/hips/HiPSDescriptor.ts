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

// HiPSDescriptor.ts
'use strict'

export interface HiPSDataRange {
  min: number | undefined
  max: number | undefined
}

export type HiPSFrame = 'equatorial' | 'galactic' | string

export class HiPSDescriptor {
  private _minOrder: number = 3
  private _imgformats: string[] = []
  private _datarange: HiPSDataRange = { min: undefined, max: undefined }
  private _maxOrder: number | undefined
  private _tilewidth: number | undefined
  private _hipsFrame: HiPSFrame | undefined
  private _hipsName: string = 'NONAME'
  private _hipsurl: string
  private _emMin: number | undefined
  private _emMax: number | undefined
  private _isGalctic: boolean = false
  private _propertiesRawText: string
  private _propertiesMap: Map<string, string> = new Map()

  constructor(hipsproperties: string, hipsurl: string) {
    this._hipsurl = hipsurl

    this._propertiesRawText = hipsproperties
    const lines = hipsproperties.split(/\r\n|\n/)
    for (const raw of lines) {
      const line = raw.trim()
      if (!line || line.startsWith('#')) continue

      const maybeKey = line.slice(0, line.indexOf('=')).trim()
      const maybeValue = this.getValue(line)
      if (maybeKey && maybeValue !== undefined) {
        this._propertiesMap.set(maybeKey, maybeValue)
      }

      if (line.startsWith('hips_tile_format') || line.startsWith('format')) {
        // normalize jpeg→jpg
        const list = this.getValue(line)?.replace(/jpeg/gi, 'jpg') ?? ''
        this._imgformats = list.split(/\s+/).filter(Boolean)
      } else if (line.startsWith('hips_data_range')) {
        const v = this.getValue(line)
        if (v) {
          const [minStr, maxStr] = v.split(/\s+/)
          this._datarange.min = parseFloat(minStr)
          this._datarange.max = parseFloat(maxStr)
        }
      } else if (line.startsWith('hips_tile_width')) {
        const n = Number(this.getValue(line))
        this._tilewidth = Number.isFinite(n) ? n : undefined
      } else if (line.startsWith('hips_order_min')) {
        const n = Number(this.getValue(line))
        this._minOrder = Number.isFinite(n) ? n : this._minOrder
      } else if (line.startsWith('hips_order') || line.startsWith('maxOrder')) {
        const n = Number(this.getValue(line))
        this._maxOrder = Number.isFinite(n) ? n : this._maxOrder
      } else if (line.startsWith('hips_frame') || line.startsWith('frame')) {
        this._hipsFrame = this.getValue(line) as HiPSFrame
      } else if (line.startsWith('obs_collection') || line.startsWith('label')) {
        this._hipsName = this.getValue(line) ?? this._hipsName
      } else if (line.startsWith('em_min')) {
        const n = Number(this.getValue(line))
        this._emMin = Number.isFinite(n) ? n : undefined
      } else if (line.startsWith('em_max')) {
        const n = Number(this.getValue(line))
        this._emMax = Number.isFinite(n) ? n : undefined
      }
      
    }

    if (!this._hipsName) {
      console.warn(`[HiPSDescriptor] hipsName not defined in properties of ${this._hipsurl}. Defaulting to 'NONAME'.`)
    }
    if (!this._hipsFrame) {
      console.warn(
        `[HiPSDescriptor] hips_frame not defined in properties of ${this._hipsurl}. Defaulting to 'equatorial'.`
      )
      this._hipsFrame = 'equatorial'
    }
    this._isGalctic = this._hipsFrame.toLowerCase().includes('gal')

    if (this._maxOrder === undefined || this._imgformats.length === 0) {
      throw new Error(
        `[HiPSDescriptor] Invalid properties for ${this._hipsurl}. maxOrder=${this._maxOrder}, imgFormats.length=${this._imgformats.length}`
      )
    }
  }

  private getValue(line: string): string | undefined {
    const idx = line.indexOf('=')
    if (idx < 0) return undefined
    return line.slice(idx + 1).trim()
  }

  // --- Getters ---
  get propertiesRawText(){
    return this._propertiesRawText
  }

  get properties(): ReadonlyMap<string, string> {
    return new Map(this._propertiesMap)
  }

  getProperty(key: string): string | undefined {
    return this._propertiesMap.get(key)
  }

  get surveyName(): string {
    return this._hipsName
  }

  get url(): string {
    return this._hipsurl
  }

  get maxOrder(): number {
    return this._maxOrder as number
  }

  get minOrder(): number {
    return this._minOrder
  }

  get imgFormats(): string[] {
    return this._imgformats
  }

  get hipsFrame(): HiPSFrame {
    return this._hipsFrame as HiPSFrame
  }

  get isGalactic(): boolean {
    return this._isGalctic
  }

  get emMin(): number | undefined {
    return this._emMin
  }

  get emMax(): number | undefined {
    return this._emMax
  }

  get tileWidth(): number | undefined {
    return this._tilewidth
  }

  get dataRange(): HiPSDataRange {
    return this._datarange
  }
}
