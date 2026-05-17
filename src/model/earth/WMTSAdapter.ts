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

import type { WMTSLayerConfig, XYZLayerConfig } from './XYZConfig.js'
import type { XYZTileCoord } from './XYZTypes.js'

function replaceTokens(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replace(new RegExp(`\\{${key}\\}`, 'g'), value),
    template,
  )
}

export class WMTSAdapter {
  private _config: WMTSLayerConfig

  constructor(config: WMTSLayerConfig) {
    this._config = config
  }

  toXYZLayerConfig(): XYZLayerConfig {
    const inferredMaxZoom = this.getInferredMaxZoom()

    return {
      urlTemplate: this._config.urlTemplate ?? this._config.baseUrl,
      minZoom: this._config.minZoom,
      maxZoom: inferredMaxZoom,
      segmentsPerSide: this._config.segmentsPerSide,
      tileSize: this._config.tileSize,
      maxCachedTiles: this._config.maxCachedTiles,
      subdomains: this._config.subdomains,
      attribution: this._config.attribution,
      flipY: this._config.flipY,
      urlResolver: (tile) => this.getTileUrl(tile),
    }
  }

  private getInferredMaxZoom(): number | undefined {
    const matrixLabelCount = this._config.matrixLabels?.length ?? 0
    const maxFromLabels = matrixLabelCount > 0 ? matrixLabelCount - 1 : undefined

    if (maxFromLabels == null) {
      return this._config.maxZoom
    }

    if (this._config.maxZoom == null) {
      return maxFromLabels
    }

    return Math.min(this._config.maxZoom, maxFromLabels)
  }

  getTileUrl(tile: XYZTileCoord): string {
    return this._config.requestEncoding === 'rest'
      ? this.buildRestUrl(tile)
      : this.buildKvpUrl(tile)
  }

  private buildRestUrl(tile: XYZTileCoord): string {
    const template = this._config.urlTemplate ?? this._config.baseUrl
    const values = this.getCommonTokenValues(tile)
    const resolved = replaceTokens(template, values)
    return resolved.replace(/(?<!:)\/{2,}/g, '/')
  }

  private buildKvpUrl(tile: XYZTileCoord): string {
    const baseUrl = new URL(this._config.baseUrl)
    const values = this.getCommonTokenValues(tile)
    const params = baseUrl.searchParams

    params.set('SERVICE', 'WMTS')
    params.set('REQUEST', 'GetTile')
    params.set('VERSION', this._config.version ?? '1.0.0')
    params.set('LAYER', this._config.layer)
    params.set('STYLE', this._config.style ?? 'default')
    params.set('FORMAT', this._config.format ?? 'image/png')
    params.set('TILEMATRIXSET', this._config.tileMatrixSet)
    params.set('TILEMATRIX', values.TileMatrix)
    params.set('TILEROW', values.TileRow)
    params.set('TILECOL', values.TileCol)

    for (const [key, value] of Object.entries(this._config.dimensions ?? {})) {
      params.set(key, value)
    }

    return baseUrl.toString()
  }

  private getCommonTokenValues(tile: XYZTileCoord): Record<string, string> {
    const dim = 2 ** tile.z
    const effectiveY = this._config.flipY ? dim - 1 - tile.y : tile.y
    const matrixLabel = this._config.matrixLabels?.[tile.z] ?? String(tile.z)
    const tileFormat = this._config.format ?? 'image/png'
    const tileFormatExtension = tileFormat.replace(/^image\//, '')

    return {
      Layer: this._config.layer,
      Style: this._config.style ?? 'default',
      Time: this._config.time ?? '',
      TileMatrixSet: this._config.tileMatrixSet,
      TileMatrix: matrixLabel,
      TileRow: String(effectiveY),
      TileCol: String(tile.x),
      Format: tileFormatExtension,
      TileFormat: tileFormat,
      TileFormatExtension: tileFormatExtension,
      ...Object.fromEntries(Object.entries(this._config.dimensions ?? {}).map(([key, value]) => [key, value])),
    }
  }
}
