/*
 * AstroViewer
 * Copyright (C) Fabrizio Giordano
 * SPDX-License-Identifier: LicenseRef-AstroViewer-Dual-License
 */

import { OBJMeshParser } from './OBJMeshParser.js'

describe('OBJMeshParser', () => {
  it('uses OBJ v//vn file normals', () => {
    const mesh = OBJMeshParser.parse(`
v 0 0 0
v 1 0 0
v 0 1 0
vn 0 0 -1
f 1//1 2//1 3//1
`)

    expect([...mesh.indices]).toEqual([0, 1, 2])
    expect(normals(mesh)).toEqual([
      [0, 0, -1],
      [0, 0, -1],
      [0, 0, -1],
    ])
  })

  it('uses OBJ v/vt/vn file normals and ignores texture coordinates', () => {
    const mesh = OBJMeshParser.parse(`
v 0 0 0
v 1 0 0
v 0 1 0
vt 0 0
vt 1 0
vt 0 1
vn 0 1 0
f 1/1/1 2/2/1 3/3/1
`)

    expect([...mesh.indices]).toEqual([0, 1, 2])
    expect(normals(mesh)).toEqual([
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
    ])
  })

  it('supports negative normal indices', () => {
    const mesh = OBJMeshParser.parse(`
v 0 0 0
v 1 0 0
v 0 1 0
vn 1 0 0
vn 0 -1 0
f 1//-1 2//-1 3//-1
`)

    expect(normals(mesh)).toEqual([
      [0, -1, 0],
      [0, -1, 0],
      [0, -1, 0],
    ])
  })

  it('duplicates vertices for flat generated normals on hard-edged faces', () => {
    const mesh = OBJMeshParser.parse(`
v 0 0 0
v 1 0 0
v 0 1 0
v 0 0 1
f 1 2 3
f 1 3 4
`, { generatedNormals: 'flat' })

    expect(mesh.positions.length).toBe(18)
    expect([...mesh.indices]).toEqual([0, 1, 2, 3, 4, 5])
    expect(normals(mesh).slice(0, 3)).toEqual([
      [0, 0, 1],
      [0, 0, 1],
      [0, 0, 1],
    ])
    expect(normals(mesh).slice(3, 6)).toEqual([
      [1, 0, 0],
      [1, 0, 0],
      [1, 0, 0],
    ])
  })

  it('preserves smooth generated normal compatibility by default', () => {
    const mesh = OBJMeshParser.parse(`
v 0 0 0
v 1 0 0
v 0 1 0
v 0 0 1
f 1 2 3
f 1 3 4
`)

    expect(mesh.positions.length).toBe(12)
    expect(mesh.normals.length).toBe(mesh.positions.length)
    expect([...mesh.indices]).toEqual([0, 1, 2, 0, 2, 3])
    for (const normal of normals(mesh)) {
      expect(vectorLength(normal)).toBeCloseTo(1, 6)
    }
  })

  it('does not produce zero normals for double-sided panels with file normals', () => {
    const mesh = OBJMeshParser.parse(`
v -1 -1 0
v 1 -1 0
v 1 1 0
v -1 1 0
vn 0 0 1
vn 0 0 -1
f 1//1 2//1 3//1 4//1
f 4//2 3//2 2//2 1//2
`)

    expect(mesh.positions.length).toBe(24)
    for (const normal of normals(mesh)) {
      expect(vectorLength(normal)).toBeCloseTo(1, 6)
    }
    expect(normals(mesh)).toContainEqual([0, 0, 1])
    expect(normals(mesh)).toContainEqual([0, 0, -1])
  })
})

function normals(mesh: { normals: Float32Array }): number[][] {
  const result: number[][] = []
  for (let i = 0; i < mesh.normals.length; i += 3) {
    result.push([
      round(mesh.normals[i]),
      round(mesh.normals[i + 1]),
      round(mesh.normals[i + 2]),
    ])
  }
  return result
}

function vectorLength(vector: readonly number[]): number {
  return Math.hypot(vector[0], vector[1], vector[2])
}

function round(value: number): number {
  return Object.is(value, -0) ? 0 : Number(value.toFixed(6))
}
