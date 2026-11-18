/*
 * AstroViewer
 * Copyright (C) Fabrizio Giordano
 * SPDX-License-Identifier: LicenseRef-AstroViewer-Dual-License
 */

import { jest } from '@jest/globals'
import { MeshHiPS } from './MeshHiPS.js'
import { MeshHiPSShaderProgram } from '../../shader/MeshHiPSShaderProgram.js'

describe('MeshHiPS layer lifecycle', () => {
  it('disposes every cached tile and all WebGL resources exactly once', () => {
    const tile1 = { dispose: jest.fn() }
    const tile2 = { dispose: jest.fn() }
    const meshProgram = { dispose: jest.fn() }
    const gl = { deleteBuffer: jest.fn(), deleteProgram: jest.fn() }
    const layer = Object.create(MeshHiPS.prototype) as MeshHiPS
    const internal = layer as unknown as Record<string, unknown>
    const buffers = [{}, {}, {}]
    const baseProgram = {}

    Object.assign(internal, {
      _disposed: false,
      _tiles: new Map([['0/0', tile1], ['1/0', tile2]]),
      _shaderProgram: meshProgram,
      _webgl: gl,
      _visibleTiles: [{ order: 0, ipix: 0 }],
      _requestedTiles: [{ order: 0, ipix: 0 }],
      _coverageTiles: [{ order: 0, ipix: 0 }],
      vertexTextureCoordBuffer: buffers[0],
      vertexPositionBuffer: buffers[1],
      vertexIndexBuffer: buffers[2],
      shaderProgram: baseProgram,
    })

    layer.dispose()
    layer.dispose()

    expect(tile1.dispose).toHaveBeenCalledTimes(1)
    expect(tile2.dispose).toHaveBeenCalledTimes(1)
    expect(meshProgram.dispose).toHaveBeenCalledTimes(1)
    expect(gl.deleteBuffer).toHaveBeenCalledTimes(3)
    expect(gl.deleteProgram).toHaveBeenCalledTimes(1)
    expect((internal._tiles as Map<string, unknown>).size).toBe(0)
    expect(internal._visibleTiles).toEqual([])
    expect(internal._requestedTiles).toEqual([])
    expect(internal._coverageTiles).toEqual([])
  })

  it('never draws or queues new tiles after disposal', () => {
    const layer = Object.create(MeshHiPS.prototype) as MeshHiPS
    const internal = layer as unknown as Record<string, unknown>
    const gl = { deleteBuffer: jest.fn(), deleteProgram: jest.fn() }
    Object.assign(internal, {
      _disposed: false,
      _tiles: new Map(),
      _shaderProgram: { dispose: jest.fn() },
      _webgl: gl,
      _visibleTiles: [],
      _requestedTiles: [],
      _coverageTiles: [],
    })
    layer.dispose()
    expect(() => layer.draw({} as Parameters<MeshHiPS['draw']>[0])).not.toThrow()
    expect((internal._tiles as Map<string, unknown>).size).toBe(0)
  })

  it('deletes the MeshHiPS shader program only once', () => {
    const program = {} as WebGLProgram
    const gl = { deleteProgram: jest.fn() }
    const shader = Object.create(MeshHiPSShaderProgram.prototype) as MeshHiPSShaderProgram
    Object.assign(shader, { _shaderProgram: program, _webgl: gl })

    shader.dispose()
    shader.dispose()

    expect(gl.deleteProgram).toHaveBeenCalledTimes(1)
    expect(gl.deleteProgram).toHaveBeenCalledWith(program)
  })
})
