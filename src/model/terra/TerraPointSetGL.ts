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

import { CatalogueGL } from '../catalogues/CatalogueGL.js'
import { MetadataColumn } from '../MetadataColumn.js'
import { MetadataManager } from '../MetadataManager.js'
import { Point } from '../Point.js'
import { CoordsType } from '../../utils/CoordsType.js'
import MouseHelper from '../../utils/MouseHelper.js'

type TerraPointSource = {
  point: Point
  details: any[]
  healpixPixel: number
  shapeSize: number
  brightnessFactor: number
  getDetailByindex(index: number): string | number | undefined
}

type CatalogueRuntimeState = {
  _metadataManager: MetadataManager
  _bufferInitialised: boolean
}

export class TerraPointSetGL extends CatalogueGL {
  _kind: string = 'TerraPointSetGL'

  addSources(inData: any[][], columnsMeta: MetadataColumn[]) {
    this._ready = false
    this._sources = []
    const metadataManager = new MetadataManager(columnsMeta)
    ;(this as unknown as CatalogueRuntimeState)._metadataManager = metadataManager

    const lonDataIndex = metadataManager.selectedRaColumn?.index ?? -1
    const latDataIndex = metadataManager.selectedDecColumn?.index ?? -1

    if (lonDataIndex < 0 || latDataIndex < 0) {
      throw new Error(`(lon, lat) idx not defined (${lonDataIndex}, ${latDataIndex}) `)
    }

    for (const row of inData) {
      const point = new Point(
        {
          lonDeg: Number(row[lonDataIndex]),
          latDeg: Number(row[latDataIndex]),
        },
        CoordsType.GEOGRAPHIC,
      )

      this.addSource({
        point,
        details: row,
        healpixPixel: 0,
        shapeSize: CatalogueGL.STANDARD_SHAPE_SIZE,
        brightnessFactor: 3,
        getDetailByindex(index: number): string | number | undefined {
          return index < 0 || index >= row.length ? undefined : row[index]
        },
      } as TerraPointSource as never)
    }

    this._ready = true
    ;(this as unknown as CatalogueRuntimeState)._bufferInitialised = false
  }

  draw(
    inMatrix: Float32Array,
    inMouseHelper: MouseHelper,
    viewMatrix: Float32Array,
    projectionMatrix: Float32Array,
  ) {
    this._oldMouseCoords = inMouseHelper?.xyz ?? null
    super.draw(inMatrix, inMouseHelper, viewMatrix, projectionMatrix)
  }
}
