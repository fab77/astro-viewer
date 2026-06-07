/*
 * AstroViewer
 * Copyright (C) Fabrizio Giordano
 * SPDX-License-Identifier: LicenseRef-AstroViewer-Dual-License
 */

import { MeshHiPSShaderProgram } from '../../shader/MeshHiPSShaderProgram.js'
import { OBJMeshParser } from './OBJMeshParser.js'
import type { MeshHiPSGpuMesh, MeshHiPSMesh, MeshHiPSTileCoord } from './MeshHiPSTypes.js'

type Mat4 = Float32Array

export class MeshHiPSTile {
  private _gpuMesh: MeshHiPSGpuMesh | null = null
  private _ready = false
  private _loading = false
  private _failed = false
  private _lastUsedAt = 0
  private _createdAt = Date.now()

  constructor(
    readonly coord: MeshHiPSTileCoord,
    private _url: string,
    private _webgl: WebGL2RenderingContext,
    private _shaderProgram: MeshHiPSShaderProgram,
  ) {
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

  get lastUsedAt(): number {
    return this._lastUsedAt
  }

  get createdAt(): number {
    return this._createdAt
  }

  touch(): void {
    this._lastUsedAt = Date.now()
  }

  draw(
    pMatrix: Mat4,
    vMatrix: Mat4,
    mMatrix: Mat4,
    color: [number, number, number, number],
    wireframe: boolean,
  ): boolean {
    this.touch()
    if (!this._ready || !this._gpuMesh) return false

    const gl = this._webgl
    this._shaderProgram.enableShaders(pMatrix, vMatrix, mMatrix, color)

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

    gl.bindBuffer(
      gl.ELEMENT_ARRAY_BUFFER,
      wireframe ? this._gpuMesh.lineIndexBuffer : this._gpuMesh.indexBuffer,
    )
    gl.drawElements(
      wireframe ? gl.LINES : gl.TRIANGLES,
      wireframe ? this._gpuMesh.lineIndexCount : this._gpuMesh.indexCount,
      this._gpuMesh.indexType,
      0,
    )

    gl.disableVertexAttribArray(this._shaderProgram.locations.vertexPositionAttribute)
    return true
  }

  dispose(): void {
    const gl = this._webgl
    if (this._gpuMesh?.positionBuffer) gl.deleteBuffer(this._gpuMesh.positionBuffer)
    if (this._gpuMesh?.indexBuffer) gl.deleteBuffer(this._gpuMesh.indexBuffer)
    if (this._gpuMesh?.lineIndexBuffer) gl.deleteBuffer(this._gpuMesh.lineIndexBuffer)
    this._gpuMesh = null
    this._ready = false
    this._loading = false
  }

  private async load(): Promise<void> {
    if (this._loading || this._ready) return

    this._loading = true
    try {
      const resp = await fetch(this._url)
      if (!resp.ok) throw new Error(`HTTP ${resp.status} fetching ${this._url}`)
      const mesh = OBJMeshParser.parse(await resp.text())
      this._gpuMesh = this.uploadMesh(mesh)
      this._ready = true
      this._failed = false
    } catch (error) {
      console.warn('[MeshHiPSTile] load failed', this._url, error)
      this._failed = true
      this._ready = false
    } finally {
      this._loading = false
    }
  }

  private uploadMesh(mesh: MeshHiPSMesh): MeshHiPSGpuMesh {
    const gl = this._webgl
    const positionBuffer = gl.createBuffer()
    const indexBuffer = gl.createBuffer()
    const lineIndexBuffer = gl.createBuffer()

    if (!positionBuffer || !indexBuffer || !lineIndexBuffer) {
      throw new Error(`Could not create MeshHiPS buffers for ${this.key}`)
    }
    const lineIndices = this.buildLineIndices(mesh.indices)

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, mesh.positions, gl.STATIC_DRAW)

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW)

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lineIndexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, lineIndices, gl.STATIC_DRAW)

    return {
      positionBuffer,
      indexBuffer,
      lineIndexBuffer,
      indexCount: mesh.indices.length,
      lineIndexCount: lineIndices.length,
      indexType: gl.UNSIGNED_INT,
    }
  }

  private buildLineIndices(indices: Uint32Array): Uint32Array {
    const lines = new Uint32Array(indices.length * 2)
    let out = 0
    for (let i = 0; i < indices.length; i += 3) {
      const a = indices[i]
      const b = indices[i + 1]
      const c = indices[i + 2]
      lines[out++] = a
      lines[out++] = b
      lines[out++] = b
      lines[out++] = c
      lines[out++] = c
      lines[out++] = a
    }
    return lines
  }

  private get key(): string {
    return `${this.coord.order}/${this.coord.ipix}`
  }
}
