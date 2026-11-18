/*
 * AstroViewer
 * Copyright (C) Fabrizio Giordano
 * SPDX-License-Identifier: LicenseRef-AstroViewer-Dual-License
 */

import { MeshHiPSShaderProgram } from '../../shader/MeshHiPSShaderProgram.js'
import { OBJMeshParser } from './OBJMeshParser.js'
import { GLBMeshParser } from './GLBMeshParser.js'
import type { MeshHiPSGpuMesh, MeshHiPSMesh, MeshHiPSTileCoord } from './MeshHiPSTypes.js'

type Mat4 = Float32Array

export class MeshHiPSTile {
  private _gpuMesh: MeshHiPSGpuMesh | null = null
  private _ready = false
  private _loading = false
  private _failed = false
  private _disposed = false
  private _abortController: AbortController | null = null
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
    quadrants?: ReadonlySet<number>,
  ): boolean {
    if (this._disposed) return false
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

    if (quadrants) {
      for (const quadrantIndex of quadrants) {
        const quadrant = this._gpuMesh.quadrants?.[quadrantIndex]
        if (!quadrant) continue
        gl.bindBuffer(
          gl.ELEMENT_ARRAY_BUFFER,
          wireframe ? quadrant.lineIndexBuffer : quadrant.indexBuffer,
        )
        gl.drawElements(
          wireframe ? gl.LINES : gl.TRIANGLES,
          wireframe ? quadrant.lineIndexCount : quadrant.indexCount,
          this._gpuMesh.indexType,
          0,
        )
      }
    } else {
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
    }

    gl.disableVertexAttribArray(this._shaderProgram.locations.vertexPositionAttribute)
    if (this._shaderProgram.locations.vertexNormalAttribute >= 0) {
      gl.disableVertexAttribArray(this._shaderProgram.locations.vertexNormalAttribute)
    }
    return true
  }

  dispose(): void {
    if (this._disposed) return
    this._disposed = true
    this._abortController?.abort()
    this._abortController = null
    const gl = this._webgl
    if (this._gpuMesh?.positionBuffer) gl.deleteBuffer(this._gpuMesh.positionBuffer)
    if (this._gpuMesh?.normalBuffer) gl.deleteBuffer(this._gpuMesh.normalBuffer)
    if (this._gpuMesh?.indexBuffer) gl.deleteBuffer(this._gpuMesh.indexBuffer)
    if (this._gpuMesh?.lineIndexBuffer) gl.deleteBuffer(this._gpuMesh.lineIndexBuffer)
    for (const quadrant of this._gpuMesh?.quadrants ?? []) {
      gl.deleteBuffer(quadrant.indexBuffer)
      gl.deleteBuffer(quadrant.lineIndexBuffer)
    }
    this._gpuMesh = null
    this._ready = false
    this._loading = false
    this._failed = false
  }

  private async load(): Promise<void> {
    if (this._disposed || this._loading || this._ready) return

    const controller = new AbortController()
    this._abortController = controller
    this._loading = true
    try {
      const resp = await fetch(this._url, { signal: controller.signal })
      if (this._disposed) return
      if (!resp.ok) throw new Error(`HTTP ${resp.status} fetching ${this._url}`)

      const data = this._url.toLowerCase().endsWith('.glb')
        ? await resp.arrayBuffer()
        : await resp.text()
      if (this._disposed) return

      const mesh = typeof data === 'string'
        ? OBJMeshParser.parse(data)
        : await GLBMeshParser.parse(data)
      if (this._disposed) return

      this._gpuMesh = this.uploadMesh(mesh)
      this._ready = true
      this._failed = false
    } catch (error) {
      if (!this._disposed && !controller.signal.aborted) {
        console.warn('[MeshHiPSTile] load failed', this._url, error)
        this._failed = true
        this._ready = false
      }
    } finally {
      if (this._abortController === controller) this._abortController = null
      this._loading = false
    }
  }

  private uploadMesh(mesh: MeshHiPSMesh): MeshHiPSGpuMesh {
    const gl = this._webgl
    const allocatedBuffers: WebGLBuffer[] = []
    const createBuffer = (): WebGLBuffer => {
      const buffer = gl.createBuffer()
      if (!buffer) throw new Error(`Could not create MeshHiPS buffer for ${this.key}`)
      allocatedBuffers.push(buffer)
      return buffer
    }

    try {
      const positionBuffer = createBuffer()
      const normalBuffer = createBuffer()
      const indexBuffer = createBuffer()
      const lineIndexBuffer = createBuffer()
      const lineIndices = this.buildLineIndices(mesh.indices)
      const quadrantIndices = this.buildQuadrantIndices(mesh)

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, mesh.positions, gl.STATIC_DRAW)

      gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, mesh.normals, gl.STATIC_DRAW)

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW)

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lineIndexBuffer)
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, lineIndices, gl.STATIC_DRAW)

      const quadrants = quadrantIndices.map((indices) => {
        const quadrantIndexBuffer = createBuffer()
        const quadrantLineIndexBuffer = createBuffer()
        const quadrantLines = this.buildLineIndices(indices)
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadrantIndexBuffer)
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadrantLineIndexBuffer)
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, quadrantLines, gl.STATIC_DRAW)
        return {
          indexBuffer: quadrantIndexBuffer,
          lineIndexBuffer: quadrantLineIndexBuffer,
          indexCount: indices.length,
          lineIndexCount: quadrantLines.length,
        }
      })

      return {
        positionBuffer,
        normalBuffer,
        indexBuffer,
        lineIndexBuffer,
        indexCount: mesh.indices.length,
        lineIndexCount: lineIndices.length,
        indexType: gl.UNSIGNED_INT,
        quadrants,
      }
    } catch (error) {
      for (const buffer of allocatedBuffers) gl.deleteBuffer(buffer)
      throw error
    }
  }

  private buildQuadrantIndices(mesh: MeshHiPSMesh): Uint32Array[] {
    const verticesPerSide = Math.sqrt(mesh.positions.length / 3)
    const grid = verticesPerSide - 1
    if (!Number.isInteger(verticesPerSide) || grid < 2 || grid % 2 !== 0) {
      throw new Error(`MeshHiPS tile ${this.key} must contain an even square grid`)
    }

    const half = grid / 2
    return [0, 1, 2, 3].map((quadrant) => {
      const startColumn = quadrant % 2 === 0 ? 0 : half
      const startRow = quadrant < 2 ? 0 : half
      const indices = new Uint32Array(half * half * 6)
      let output = 0

      for (let row = startRow; row < startRow + half; row++) {
        for (let column = startColumn; column < startColumn + half; column++) {
          const topLeft = row * verticesPerSide + column
          const topRight = topLeft + 1
          const bottomLeft = topLeft + verticesPerSide
          const bottomRight = bottomLeft + 1
          indices[output++] = topLeft
          indices[output++] = topRight
          indices[output++] = bottomRight
          indices[output++] = topLeft
          indices[output++] = bottomRight
          indices[output++] = bottomLeft
        }
      }
      return indices
    })
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
