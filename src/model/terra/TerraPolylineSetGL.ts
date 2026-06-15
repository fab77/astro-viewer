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

import { FootprintShaderProgram } from '../../shader/FootprintShaderProgram.js'
import { CoordsType } from '../../utils/CoordsType.js'
import MouseHelper from '../../utils/MouseHelper.js'
import { colorHex2RGB } from '../../utils/Utils.js'
import { MetadataManager } from '../MetadataManager.js'
import { Point } from '../Point.js'
import { VisibleTilesManager } from '../hips/VisibleTilesManager.js'

export interface TerraPolylinePoint {
  readonly longitudeDeg: number
  readonly latitudeDeg: number
  readonly altitudeKm?: number
  readonly timestamp?: Date | string
}

export interface TerraPolylineMetadata {
  readonly name?: string
  readonly [key: string]: unknown
}

interface TerraPolylinePath {
  readonly points: readonly TerraPolylinePoint[]
  readonly metadata?: TerraPolylineMetadata
}

type RenderSegment = {
  vertices: Float32Array
  buffer: WebGLBuffer | null
}

export class TerraPolylineSetGL {
  static ELEM_SIZE = 3
  static BYTES_X_ELEM = new Float32Array().BYTES_PER_ELEMENT

  _kind: string = 'TerraPolylineSetGL'
  _isVisible: boolean = true
  _ready: boolean = true

  private _shapeColor = '#ffe066'
  private _bufferInitialised = false
  private paths: TerraPolylinePath[] = []
  private renderSegments: RenderSegment[] = []
  private _polylineShaderProgram: FootprintShaderProgram

  constructor(
    private _name: string,
    private _description: string,
    private _providerUrl: string,
    private _metadataManager: MetadataManager,
    private _webgl: WebGL2RenderingContext,
    private _visibleTilesManager: VisibleTilesManager,
  ) {
    this._polylineShaderProgram = new FootprintShaderProgram(this._webgl)
  }

  addPath(points: readonly TerraPolylinePoint[], metadata?: TerraPolylineMetadata): void {
    this.paths.push({ points: [...points], metadata })
    this._ready = true
    this._bufferInitialised = false
  }

  addGroundTrack(points: readonly TerraPolylinePoint[], metadata?: TerraPolylineMetadata): void {
    this.addPath(points, metadata)
  }

  clearPaths(): void {
    this.paths = []
    this.disposeBuffers()
    this.renderSegments = []
    this._bufferInitialised = false
  }

  setIsVisible(isVisible: boolean): void {
    this._isVisible = isVisible
  }

  get isVisible(): boolean {
    return this._isVisible
  }

  changeColor(color: string): void {
    this._shapeColor = color
  }

  dispose(): void {
    this.disposeBuffers()
    this.renderSegments = []
    this.paths = []
    this._bufferInitialised = false
  }

  draw(
    in_mMatrix: Float32Array,
    _in_mouseHelper: MouseHelper,
    vMatrix: Float32Array,
    pMatrix: Float32Array,
  ): void {
    if (!this._isVisible) return
    if (!this._ready) return
    if (!vMatrix) return
    if (!this._webgl) return
    if (!this._bufferInitialised) this.initBuffers()
    if (this.renderSegments.length === 0) return

    this._polylineShaderProgram.enableShaders(pMatrix, in_mMatrix, vMatrix)

    const rgb = colorHex2RGB(this._shapeColor)
    this._webgl.uniform4f(
      this._polylineShaderProgram.locations.color as WebGLUniformLocation,
      rgb[0],
      rgb[1],
      rgb[2],
      1.0,
    )

    for (const segment of this.renderSegments) {
      if (!segment.buffer || segment.vertices.length < TerraPolylineSetGL.ELEM_SIZE * 2) continue

      this._webgl.bindBuffer(this._webgl.ARRAY_BUFFER, segment.buffer)
      this._webgl.vertexAttribPointer(
        this._polylineShaderProgram.locations.position as number,
        TerraPolylineSetGL.ELEM_SIZE,
        this._webgl.FLOAT,
        false,
        TerraPolylineSetGL.BYTES_X_ELEM * TerraPolylineSetGL.ELEM_SIZE,
        0,
      )
      this._webgl.enableVertexAttribArray(this._polylineShaderProgram.locations.position as number)
      this._webgl.drawArrays(
        this._webgl.LINE_STRIP,
        0,
        segment.vertices.length / TerraPolylineSetGL.ELEM_SIZE,
      )
    }

    this._webgl.bindBuffer(this._webgl.ARRAY_BUFFER, null)
    this._webgl.bindBuffer(this._webgl.ELEMENT_ARRAY_BUFFER, null)
  }

  private initBuffers(): void {
    this.disposeBuffers()
    this.renderSegments = this.buildRenderSegments()

    for (const segment of this.renderSegments) {
      const buffer = this._webgl.createBuffer()
      segment.buffer = buffer
      this._webgl.bindBuffer(this._webgl.ARRAY_BUFFER, buffer)
      this._webgl.bufferData(this._webgl.ARRAY_BUFFER, segment.vertices, this._webgl.STATIC_DRAW)
    }

    this._webgl.bindBuffer(this._webgl.ARRAY_BUFFER, null)
    this._bufferInitialised = true
  }

  private buildRenderSegments(): RenderSegment[] {
    const segments: RenderSegment[] = []

    for (const path of this.paths) {
      for (const segment of this.splitPath(path.points)) {
        if (segment.length < 2) continue

        const vertices = new Float32Array(segment.length * TerraPolylineSetGL.ELEM_SIZE)
        let offset = 0

        for (const point of segment) {
          const geoPoint = new Point(
            {
              lonDeg: normalizeLongitudeDeg(point.longitudeDeg),
              latDeg: point.latitudeDeg,
            },
            CoordsType.GEOGRAPHIC,
          )

          vertices[offset] = geoPoint.x
          vertices[offset + 1] = geoPoint.y
          vertices[offset + 2] = geoPoint.z
          offset += TerraPolylineSetGL.ELEM_SIZE
        }

        segments.push({ vertices, buffer: null })
      }
    }

    return segments
  }

  private splitPath(points: readonly TerraPolylinePoint[]): TerraPolylinePoint[][] {
    const segments: TerraPolylinePoint[][] = []
    let current: TerraPolylinePoint[] = []
    let previous: TerraPolylinePoint | null = null

    for (const point of points) {
      if (!isValidPoint(point)) {
        if (current.length > 1) segments.push(current)
        current = []
        previous = null
        continue
      }

      if (previous && crossesAntimeridian(previous.longitudeDeg, point.longitudeDeg)) {
        if (current.length > 1) segments.push(current)
        current = []
      }

      current.push(point)
      previous = point
    }

    if (current.length > 1) segments.push(current)
    return segments
  }

  private disposeBuffers(): void {
    for (const segment of this.renderSegments) {
      if (segment.buffer) {
        this._webgl.deleteBuffer(segment.buffer)
        segment.buffer = null
      }
    }
  }
}

function isValidPoint(point: TerraPolylinePoint): boolean {
  return Number.isFinite(point.longitudeDeg)
    && Number.isFinite(point.latitudeDeg)
    && point.latitudeDeg >= -90
    && point.latitudeDeg <= 90
}

function crossesAntimeridian(leftLongitudeDeg: number, rightLongitudeDeg: number): boolean {
  return Math.abs(normalizeLongitudeDeg(rightLongitudeDeg) - normalizeLongitudeDeg(leftLongitudeDeg)) > 180
}

function normalizeLongitudeDeg(longitudeDeg: number): number {
  const normalized = ((((longitudeDeg + 180) % 360) + 360) % 360) - 180
  return Object.is(normalized, -0) ? 0 : normalized
}
