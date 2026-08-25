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

import { FootprintSetGL } from '../footprints/FootprintSetGL.js'
import { CoordsType } from '../../utils/CoordsType.js'
import { Footprint, FootprintDetail } from '../footprints/Footprint.js'
import { ParsedGeoJSONFeature } from '../../utils/GeoJSONParser.js'
import { MetadataColumn } from '../MetadataColumn.js'
import { MetadataManager } from '../MetadataManager.js'
import { ColumnType } from '../MetadataColumn.js'
import MouseHelper from '../../utils/MouseHelper.js'
import { Point } from '../Point.js'
import GeomUtils from '../../utils/GeomUtils.js'

type FootprintHoverState = {
  _hoveredFootprints: Footprint[]
}

export class TerraFootprintSetGL extends FootprintSetGL {
  _kind: string = 'TerraFootprintSetGL'
  protected _coordsType: CoordsType.GEOGRAPHIC = CoordsType.GEOGRAPHIC

  addGeoJSONFeatures(features: ParsedGeoJSONFeature[]): void {
    this._ready = false
    this.clearFootprints()
    this._metadataManager = new MetadataManager(this.createGeoJSONMetadataColumns(features))

    for (const feature of features) {
      const footprint = Footprint.fromPolygons(
        feature.polygons,
        this.createGeoJSONDetails(feature),
        CoordsType.GEOGRAPHIC,
      )

      if (footprint.valid) {
        this.addFootprint(footprint)
        this.totPoints += footprint.totPoints
        this.totConvexPoints += footprint.totConvexPoints
      }
    }

    this._ready = true
    this._bufferInitialised = false
  }

  checkSelection(mouseHelper: MouseHelper): void {
    if (mouseHelper.x == null || mouseHelper.y == null || mouseHelper.z == null) return

    const hoverState = this as unknown as FootprintHoverState
    hoverState._hoveredFootprints = []
    this.totHoveredPoints = 0

    const mousePoint = new Point(
      { x: mouseHelper.x, y: mouseHelper.y, z: mouseHelper.z },
      CoordsType.CARTESIAN,
    )

    for (const footprint of this.footprintPolygons) {
      if (!footprint.selectionObj) continue

      if (GeomUtils.checkPointInsidePolygon5(footprint.selectionObj, mousePoint)) {
        hoverState._hoveredFootprints.push(footprint)
        this.totHoveredPoints += footprint.totPoints
      }
    }

    this.initHoveringBuffer()
  }

  private createGeoJSONMetadataColumns(features: ParsedGeoJSONFeature[]): MetadataColumn[] {
    const names = new Set<string>()
    features.forEach(feature => Object.keys(feature.properties).forEach(name => names.add(name)))

    return Array.from(names).map((name, index) => {
      const values = features.map(feature => feature.properties[name]).filter(value => value !== null && value !== undefined && value !== '')
      const isNumber = values.length > 0 && values.every(value => typeof value === 'number' || !Number.isNaN(Number(value)))
      const isName = /^name$|nome|denominazione|label|title/i.test(name)

      return new MetadataColumn({
        index,
        name,
        columnType: isName ? ColumnType.MAIN_NAME : (isNumber ? ColumnType.NUMBER : ColumnType.STRING),
        unit: '',
      })
    })
  }

  private createGeoJSONDetails(feature: ParsedGeoJSONFeature): FootprintDetail[] {
    return Object.entries(feature.properties).map(([key, value]) => ({
      key,
      value: typeof value === 'number' ? value : String(value ?? ''),
    }))
  }
}
