/*
 * AstroViewer
 * Copyright (C) Fabrizio Giordano
 * SPDX-License-Identifier: LicenseRef-AstroViewer-Dual-License
 */
import { jest } from '@jest/globals'
import { MeshHiPSTile } from './MeshHiPSTile.js'
import { GLBMeshParser } from './GLBMeshParser.js'
import type { MeshHiPSMesh } from './MeshHiPSTypes.js'
import type { MeshHiPSShaderProgram } from '../../shader/MeshHiPSShaderProgram.js'

const testMesh: MeshHiPSMesh = {
  positions: new Float32Array(3 * 9), // 3x3 vertices, two cells per side
  normals: new Float32Array(3 * 9),
  indices: new Uint32Array([0, 1, 4, 0, 4, 3, 1, 2, 5, 1, 5, 4, 3, 4, 7, 3, 7, 6, 4, 5, 8, 4, 8, 7]),
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: Error) => void
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

async function settleAsync(): Promise<void> {
  // Allow fetch, response decoding, GLB parsing and load() continuations to run.
  for (let i = 0; i < 10; i++) await Promise.resolve()
}

function fakeWebGL() {
  let nextBuffer = 0
  const gl = {
    ARRAY_BUFFER: 0x8892,
    ELEMENT_ARRAY_BUFFER: 0x8893,
    STATIC_DRAW: 0x88e4,
    UNSIGNED_INT: 0x1405,
    createBuffer: jest.fn(() => ({ number: ++nextBuffer }) as unknown as WebGLBuffer),
    deleteBuffer: jest.fn(),
    bindBuffer: jest.fn(),
    bufferData: jest.fn(),
  }
  return gl
}

const shader = {} as MeshHiPSShaderProgram
const coord = { order: 2, ipix: 1 }

describe('MeshHiPSTile lifecycle', () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
    jest.restoreAllMocks()
  })

  it('aborts an in-flight fetch and never allocates GPU buffers after disposal', async () => {
    const request = deferred<Response>()
    const fetchMock = jest.fn((_url: string, _options: RequestInit) => request.promise)
    globalThis.fetch = fetchMock as unknown as typeof fetch
    const gl = fakeWebGL()

    const tile = new MeshHiPSTile(coord, '/test.glb', gl as unknown as WebGL2RenderingContext, shader)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const signal = (fetchMock.mock.calls[0][1] as RequestInit).signal
    expect(signal?.aborted).toBe(false)

    tile.dispose()
    expect(signal?.aborted).toBe(true)
    request.resolve({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) } as Response)
    await settleAsync()

    expect(gl.createBuffer).not.toHaveBeenCalled()
    expect(tile.ready).toBe(false)
    expect(tile.loading).toBe(false)
    expect(tile.failed).toBe(false)
  })

  it('does not upload a mesh if disposed while GLB decoding is pending', async () => {
    const parsing = deferred<MeshHiPSMesh>()
    jest.spyOn(GLBMeshParser, 'parse').mockReturnValue(parsing.promise)
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    }) as unknown as typeof fetch
    const gl = fakeWebGL()

    const tile = new MeshHiPSTile(coord, '/test.glb', gl as unknown as WebGL2RenderingContext, shader)
    await settleAsync()
    expect(GLBMeshParser.parse).toHaveBeenCalledTimes(1)

    tile.dispose()
    parsing.resolve(testMesh)
    await settleAsync()

    expect(gl.createBuffer).not.toHaveBeenCalled()
    expect(tile.ready).toBe(false)
    expect(tile.failed).toBe(false)
  })

  it('releases every GPU buffer exactly once on repeated disposal', async () => {
    jest.spyOn(GLBMeshParser, 'parse').mockResolvedValue(testMesh)
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    }) as unknown as typeof fetch
    const gl = fakeWebGL()

    const tile = new MeshHiPSTile(coord, '/test.glb', gl as unknown as WebGL2RenderingContext, shader)
    await settleAsync()
    expect(tile.ready).toBe(true)
    const allocated = gl.createBuffer.mock.results.map((result) => result.value)
    expect(allocated).toHaveLength(12) // 4 main + 2 for each of 4 quadrants

    tile.dispose()
    tile.dispose()

    expect(gl.deleteBuffer).toHaveBeenCalledTimes(allocated.length)
    expect(gl.deleteBuffer.mock.calls.map((call) => call[0])).toEqual(allocated)
    expect(tile.ready).toBe(false)
  })

  it('releases allocated GPU buffers if an upload fails partway through', async () => {
    jest.spyOn(GLBMeshParser, 'parse').mockResolvedValue(testMesh)
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    }) as unknown as typeof fetch
    const gl = fakeWebGL()
    gl.bufferData.mockImplementationOnce(() => { throw new Error('GPU upload failed') })
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)

    const tile = new MeshHiPSTile(coord, '/test.glb', gl as unknown as WebGL2RenderingContext, shader)
    await settleAsync()

    expect(tile.ready).toBe(false)
    expect(tile.failed).toBe(true)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(gl.createBuffer).toHaveBeenCalledTimes(4)
    expect(gl.deleteBuffer).toHaveBeenCalledTimes(4)
    expect(gl.deleteBuffer.mock.calls.map((call) => call[0])).toEqual(
      gl.createBuffer.mock.results.map((result) => result.value),
    )
  })

  it('releases all buffers on failure to allocate a quadrant buffer', async () => {
    jest.spyOn(GLBMeshParser, 'parse').mockResolvedValue(testMesh)
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    }) as unknown as typeof fetch
    const gl = fakeWebGL()
    gl.createBuffer.mockImplementationOnce(() => ({ number: 1 }) as unknown as WebGLBuffer)
      .mockImplementationOnce(() => ({ number: 2 }) as unknown as WebGLBuffer)
      .mockImplementationOnce(() => ({ number: 3 }) as unknown as WebGLBuffer)
      .mockImplementationOnce(() => ({ number: 4 }) as unknown as WebGLBuffer)
      .mockImplementationOnce(() => null)
    jest.spyOn(console, 'warn').mockImplementation(() => undefined)

    const tile = new MeshHiPSTile(coord, '/test.glb', gl as unknown as WebGL2RenderingContext, shader)
    await settleAsync()

    expect(tile.failed).toBe(true)
    expect(gl.deleteBuffer).toHaveBeenCalledTimes(4)
  })
})
