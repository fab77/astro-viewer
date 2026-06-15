/*
 * AstroViewer
 * Copyright (C) Fabrizio Giordano
 * SPDX-License-Identifier: LicenseRef-AstroViewer-Dual-License
 */

import { mat4, vec3 } from 'gl-matrix'
import { MeshHiPSShaderProgram } from '../../shader/MeshHiPSShaderProgram.js'
import { OBJMeshParser } from '../meships/OBJMeshParser.js'
import type { MeshHiPSGpuMesh, MeshHiPSMesh } from '../meships/MeshHiPSTypes.js'
import { Point } from '../Point.js'
import { CoordsType } from '../../utils/CoordsType.js'

export interface SatelliteObjectOptions {
  readonly name: string
  readonly objUrl: string
  readonly color?: [number, number, number, number]
  readonly scale?: number
}

export interface SatelliteObjectPosition {
  readonly longitudeDeg: number
  readonly latitudeDeg: number
  readonly altitudeKm?: number
}

export class SatelliteObjectGL {
  static readonly EARTH_RADIUS_KM = 6371

  _kind: string = 'SatelliteObjectGL'
  private _gpuMesh: MeshHiPSGpuMesh | null = null
  private _shaderProgram: MeshHiPSShaderProgram
  private _modelMatrix = mat4.create()
  private _isVisible = true
  private _ready = false
  private _loading = false
  private _failed = false
  private _color: [number, number, number, number]
  private _scale: number

  constructor(
    private _options: SatelliteObjectOptions,
    private _webgl: WebGL2RenderingContext,
  ) {
    this._shaderProgram = new MeshHiPSShaderProgram(this._webgl, {
      twoSidedLighting: true,
      markerLighting: true,
    })
    this._color = _options.color ?? [1.0, 0.85, 0.25, 1.0]
    this._scale = _options.scale ?? 0.025
    void this.load()
  }

  get ready(): boolean {
    return this._ready
  }

  get loading(): boolean {
    return this._loading
  }

  get failed(): boolean {
    return this._failed
  }

  async load(): Promise<void> {
    if (this._loading || this._ready) return

    this._loading = true
    try {
      const response = await fetch(this._options.objUrl)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} fetching ${this._options.objUrl}`)
      }

      const mesh = OBJMeshParser.parse(await response.text(), {
        preferFileNormals: true,
        generatedNormals: 'flat',
      })
      this._gpuMesh = this.uploadMesh(mesh)
      this._ready = true
      this._failed = false
    } catch (error) {
      console.warn('[SatelliteObjectGL] load failed', this._options.objUrl, error)
      this._ready = false
      this._failed = true
    } finally {
      this._loading = false
    }
  }

  setIsVisible(isVisible: boolean): void {
    this._isVisible = isVisible
  }

  setColor(color: [number, number, number, number]): void {
    this._color = color
  }

  setScale(scale: number): void {
    if (Number.isFinite(scale) && scale > 0) {
      this._scale = scale
    }
  }

  setPosition(
    position: SatelliteObjectPosition,
    previous?: SatelliteObjectPosition | null,
    next?: SatelliteObjectPosition | null,
  ): void {
    if (!isValidPosition(position)) return

    const worldPosition = lonLatAltToWorld(position)
    const up = vec3.normalize(vec3.create(), worldPosition)
    const forward = this.computeForward(position, worldPosition, up, previous, next)
    const right = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), forward, up))

    if (vec3.length(right) < 1e-6) {
      this.setFallbackMatrix(worldPosition, up)
      return
    }

    const correctedForward = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), up, right))
    this.setMatrixFromBasis(worldPosition, right, correctedForward, up)
  }

  draw(pMatrix: Float32Array, vMatrix: Float32Array, baseModelMatrix: Float32Array): void {
    if (!this._isVisible || !this._ready || !this._gpuMesh) return

    const gl = this._webgl
    const modelMatrix = mat4.multiply(mat4.create(), baseModelMatrix, this._modelMatrix)

    this._shaderProgram.enableShaders(pMatrix, vMatrix, modelMatrix as Float32Array, this._color)

    gl.bindBuffer(gl.ARRAY_BUFFER, this._gpuMesh.positionBuffer)
    gl.vertexAttribPointer(
      this._shaderProgram.locations.vertexPositionAttribute,
      3,
      gl.FLOAT,
      false,
      0,
      0,
    )
    gl.enableVertexAttribArray(this._shaderProgram.locations.vertexPositionAttribute)

    if (this._shaderProgram.locations.vertexNormalAttribute >= 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this._gpuMesh.normalBuffer)
      gl.vertexAttribPointer(
        this._shaderProgram.locations.vertexNormalAttribute,
        3,
        gl.FLOAT,
        false,
        0,
        0,
      )
      gl.enableVertexAttribArray(this._shaderProgram.locations.vertexNormalAttribute)
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._gpuMesh.indexBuffer)
    gl.drawElements(gl.TRIANGLES, this._gpuMesh.indexCount, this._gpuMesh.indexType, 0)

    gl.disableVertexAttribArray(this._shaderProgram.locations.vertexPositionAttribute)
    if (this._shaderProgram.locations.vertexNormalAttribute >= 0) {
      gl.disableVertexAttribArray(this._shaderProgram.locations.vertexNormalAttribute)
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)
  }

  dispose(): void {
    const gl = this._webgl
    if (this._gpuMesh?.positionBuffer) gl.deleteBuffer(this._gpuMesh.positionBuffer)
    if (this._gpuMesh?.normalBuffer) gl.deleteBuffer(this._gpuMesh.normalBuffer)
    if (this._gpuMesh?.indexBuffer) gl.deleteBuffer(this._gpuMesh.indexBuffer)
    if (this._gpuMesh?.lineIndexBuffer) gl.deleteBuffer(this._gpuMesh.lineIndexBuffer)
    this._gpuMesh = null
    this._ready = false
    this._loading = false
  }

  private computeForward(
    position: SatelliteObjectPosition,
    worldPosition: vec3,
    up: vec3,
    previous?: SatelliteObjectPosition | null,
    next?: SatelliteObjectPosition | null,
  ): vec3 {
    const before = previous && isValidPosition(previous) ? lonLatAltToWorld(previous) : null
    const after = next && isValidPosition(next) ? lonLatAltToWorld(next) : null
    let forward = vec3.create()

    if (before && after) {
      vec3.subtract(forward, after, before)
    } else if (after) {
      vec3.subtract(forward, after, worldPosition)
    } else if (before) {
      vec3.subtract(forward, worldPosition, before)
    } else {
      return this.localEastFallback(position, up)
    }

    const radialComponent = vec3.scale(vec3.create(), up, vec3.dot(forward, up))
    vec3.subtract(forward, forward, radialComponent)
    if (vec3.length(forward) < 1e-6) {
      return this.localEastFallback(position, up)
    }
    return vec3.normalize(forward, forward)
  }

  private localEastFallback(position: SatelliteObjectPosition, up: vec3): vec3 {
    const nearby = lonLatAltToWorld({
      ...position,
      longitudeDeg: position.longitudeDeg + 0.01,
    })
    const tangent = vec3.subtract(vec3.create(), nearby, lonLatAltToWorld(position))
    const radialComponent = vec3.scale(vec3.create(), up, vec3.dot(tangent, up))
    vec3.subtract(tangent, tangent, radialComponent)
    return vec3.normalize(tangent, tangent)
  }

  private setFallbackMatrix(worldPosition: vec3, up: vec3): void {
    const reference = Math.abs(up[2]) > 0.9
      ? vec3.fromValues(1, 0, 0)
      : vec3.fromValues(0, 0, 1)
    const right = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), reference, up))
    const forward = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), up, right))
    this.setMatrixFromBasis(worldPosition, right, forward, up)
  }

  private setMatrixFromBasis(worldPosition: vec3, right: vec3, forward: vec3, up: vec3): void {
    const scale = this._scale
    this._modelMatrix = mat4.fromValues(
      right[0] * scale,
      right[1] * scale,
      right[2] * scale,
      0,
      forward[0] * scale,
      forward[1] * scale,
      forward[2] * scale,
      0,
      up[0] * scale,
      up[1] * scale,
      up[2] * scale,
      0,
      worldPosition[0],
      worldPosition[1],
      worldPosition[2],
      1,
    )
  }

  private uploadMesh(mesh: MeshHiPSMesh): MeshHiPSGpuMesh {
    const gl = this._webgl
    const positionBuffer = gl.createBuffer()
    const normalBuffer = gl.createBuffer()
    const indexBuffer = gl.createBuffer()

    if (!positionBuffer || !normalBuffer || !indexBuffer) {
      throw new Error(`Could not create SatelliteObjectGL buffers for ${this._options.name}`)
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, mesh.positions, gl.STATIC_DRAW)

    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, mesh.normals, gl.STATIC_DRAW)

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW)

    return {
      positionBuffer,
      normalBuffer,
      indexBuffer,
      lineIndexBuffer: null,
      indexCount: mesh.indices.length,
      lineIndexCount: 0,
      indexType: gl.UNSIGNED_INT,
    }
  }
}

function lonLatAltToWorld(position: SatelliteObjectPosition): vec3 {
  const point = new Point(
    {
      lonDeg: normalizeLongitudeDeg(position.longitudeDeg),
      latDeg: position.latitudeDeg,
    },
    CoordsType.GEOGRAPHIC,
  )
  const radialScale = 1 + Math.max(0, position.altitudeKm ?? 0) / SatelliteObjectGL.EARTH_RADIUS_KM
  return vec3.fromValues(
    point.x * radialScale,
    point.y * radialScale,
    point.z * radialScale,
  )
}

function isValidPosition(position: SatelliteObjectPosition): boolean {
  return Number.isFinite(position.longitudeDeg)
    && Number.isFinite(position.latitudeDeg)
    && position.latitudeDeg >= -90
    && position.latitudeDeg <= 90
}

function normalizeLongitudeDeg(longitudeDeg: number): number {
  const normalized = ((((longitudeDeg + 180) % 360) + 360) % 360) - 180
  return Object.is(normalized, -0) ? 0 : normalized
}
