/*
 * AstroViewer
 * Copyright (C) Fabrizio Giordano
 * SPDX-License-Identifier: LicenseRef-AstroViewer-Dual-License
 */

import type { MeshHiPSMesh } from './MeshHiPSTypes.js'

export type OBJGeneratedNormalsMode = 'smooth' | 'flat'

export interface OBJMeshParserOptions {
  readonly preferFileNormals?: boolean
  readonly generatedNormals?: OBJGeneratedNormalsMode
}

type OBJFaceVertex = {
  readonly positionIndex: number
  readonly normalIndex?: number
}

export class OBJMeshParser {
  static parse(text: string, options: OBJMeshParserOptions = {}): MeshHiPSMesh {
    const preferFileNormals = options.preferFileNormals ?? true
    const generatedNormals = options.generatedNormals ?? 'smooth'
    const sourcePositions: number[] = []
    const sourceNormals: number[] = []
    const faces: OBJFaceVertex[][] = []
    const lines = text.split(/\r\n|\n/)

    for (const raw of lines) {
      const line = raw.trim()
      if (!line || line.startsWith('#')) continue

      if (line.startsWith('v ')) {
        const parts = line.split(/\s+/)
        if (parts.length < 4) continue
        const x = Number(parts[1])
        const y = Number(parts[2])
        const z = Number(parts[3])
        if (![x, y, z].every(Number.isFinite)) continue
        sourcePositions.push(x, y, z)
        continue
      }

      if (line.startsWith('vn ')) {
        const parts = line.split(/\s+/)
        if (parts.length < 4) continue
        const x = Number(parts[1])
        const y = Number(parts[2])
        const z = Number(parts[3])
        if (![x, y, z].every(Number.isFinite)) continue
        const len = Math.hypot(x, y, z) || 1
        sourceNormals.push(x / len, y / len, z / len)
        continue
      }

      if (line.startsWith('f ')) {
        const face = line
          .slice(2)
          .trim()
          .split(/\s+/)
          .map((part) => OBJMeshParser.parseFaceToken(
            part,
            sourcePositions.length / 3,
            sourceNormals.length / 3,
          ))
          .filter((vertex): vertex is OBJFaceVertex => vertex !== null)

        if (face.length >= 3) faces.push(face)
      }
    }

    const triangles = OBJMeshParser.triangulateFaces(faces)
    const canUseFileNormals = preferFileNormals
      && triangles.length > 0
      && triangles.every((vertex) => vertex.normalIndex !== undefined)

    if (canUseFileNormals) {
      return OBJMeshParser.buildMeshWithFileNormals(sourcePositions, sourceNormals, triangles)
    }

    if (generatedNormals === 'flat') {
      return OBJMeshParser.buildMeshWithFlatNormals(sourcePositions, triangles)
    }

    return OBJMeshParser.buildMeshWithSmoothNormals(sourcePositions, triangles)
  }

  private static parseFaceToken(
    token: string,
    positionCount: number,
    normalCount: number,
  ): OBJFaceVertex | null {
    const parts = token.split('/')
    const positionIndex = OBJMeshParser.parseIndex(parts[0], positionCount)
    if (positionIndex === null) return null

    const normalPart = parts.length >= 3 ? parts[2] : undefined
    const normalIndex = normalPart
      ? OBJMeshParser.parseIndex(normalPart, normalCount)
      : null

    return {
      positionIndex,
      normalIndex: normalIndex ?? undefined,
    }
  }

  private static parseIndex(raw: string | undefined, count: number): number | null {
    if (!raw) return null
    const index = Number(raw)
    if (!Number.isInteger(index) || index === 0) return null
    const resolved = index > 0 ? index - 1 : count + index
    return resolved >= 0 && resolved < count ? resolved : null
  }

  private static triangulateFaces(faces: readonly OBJFaceVertex[][]): OBJFaceVertex[] {
    const triangles: OBJFaceVertex[] = []
    for (const face of faces) {
      const first = face[0]
      for (let i = 1; i < face.length - 1; i++) {
        triangles.push(first, face[i], face[i + 1])
      }
    }
    return triangles
  }

  private static buildMeshWithFileNormals(
    sourcePositions: readonly number[],
    sourceNormals: readonly number[],
    triangles: readonly OBJFaceVertex[],
  ): MeshHiPSMesh {
    const positions: number[] = []
    const normals: number[] = []
    const indices: number[] = []
    const vertexMap = new Map<string, number>()

    for (const vertex of triangles) {
      const normalIndex = vertex.normalIndex as number
      const key = `${vertex.positionIndex}/${normalIndex}`
      let outputIndex = vertexMap.get(key)

      if (outputIndex === undefined) {
        outputIndex = positions.length / 3
        vertexMap.set(key, outputIndex)
        positions.push(
          sourcePositions[vertex.positionIndex * 3],
          sourcePositions[vertex.positionIndex * 3 + 1],
          sourcePositions[vertex.positionIndex * 3 + 2],
        )
        normals.push(
          sourceNormals[normalIndex * 3],
          sourceNormals[normalIndex * 3 + 1],
          sourceNormals[normalIndex * 3 + 2],
        )
      }

      indices.push(outputIndex)
    }

    return {
      positions: new Float32Array(positions),
      normals: new Float32Array(normals),
      indices: new Uint32Array(indices),
    }
  }

  private static buildMeshWithSmoothNormals(
    sourcePositions: readonly number[],
    triangles: readonly OBJFaceVertex[],
  ): MeshHiPSMesh {
    const positions = [...sourcePositions]
    const normals = new Array(positions.length).fill(0) as number[]
    const indices = triangles.map((vertex) => vertex.positionIndex)

    OBJMeshParser.computeVertexNormals(positions, indices, normals)

    return {
      positions: new Float32Array(positions),
      normals: new Float32Array(normals),
      indices: new Uint32Array(indices),
    }
  }

  private static buildMeshWithFlatNormals(
    sourcePositions: readonly number[],
    triangles: readonly OBJFaceVertex[],
  ): MeshHiPSMesh {
    const positions: number[] = []
    const normals: number[] = []
    const indices: number[] = []

    for (let i = 0; i < triangles.length; i += 3) {
      const a = triangles[i]
      const b = triangles[i + 1]
      const c = triangles[i + 2]
      if (!a || !b || !c) continue

      const normal = OBJMeshParser.computeFaceNormal(
        sourcePositions,
        a.positionIndex,
        b.positionIndex,
        c.positionIndex,
      )

      for (const vertex of [a, b, c]) {
        positions.push(
          sourcePositions[vertex.positionIndex * 3],
          sourcePositions[vertex.positionIndex * 3 + 1],
          sourcePositions[vertex.positionIndex * 3 + 2],
        )
        normals.push(normal[0], normal[1], normal[2])
        indices.push(indices.length)
      }
    }

    return {
      positions: new Float32Array(positions),
      normals: new Float32Array(normals),
      indices: new Uint32Array(indices),
    }
  }

  private static computeVertexNormals(
    vertices: readonly number[],
    indices: readonly number[],
    normals: number[],
  ): void {
    for (let i = 0; i < indices.length; i += 3) {
      const ia = indices[i]
      const ib = indices[i + 1]
      const ic = indices[i + 2]
      const normal = OBJMeshParser.computeRawFaceNormal(vertices, ia, ib, ic)

      normals[ia * 3] += normal[0]
      normals[ia * 3 + 1] += normal[1]
      normals[ia * 3 + 2] += normal[2]
      normals[ib * 3] += normal[0]
      normals[ib * 3 + 1] += normal[1]
      normals[ib * 3 + 2] += normal[2]
      normals[ic * 3] += normal[0]
      normals[ic * 3 + 1] += normal[1]
      normals[ic * 3 + 2] += normal[2]
    }

    for (let i = 0; i < normals.length; i += 3) {
      const nx = normals[i]
      const ny = normals[i + 1]
      const nz = normals[i + 2]
      const len = Math.hypot(nx, ny, nz) || 1
      normals[i] = nx / len
      normals[i + 1] = ny / len
      normals[i + 2] = nz / len
    }
  }

  private static computeFaceNormal(
    vertices: readonly number[],
    ia: number,
    ib: number,
    ic: number,
  ): [number, number, number] {
    const [nx, ny, nz] = OBJMeshParser.computeRawFaceNormal(vertices, ia, ib, ic)
    const len = Math.hypot(nx, ny, nz) || 1
    return [nx / len, ny / len, nz / len]
  }

  private static computeRawFaceNormal(
    vertices: readonly number[],
    ia: number,
    ib: number,
    ic: number,
  ): [number, number, number] {
    const ax = vertices[ia * 3]
    const ay = vertices[ia * 3 + 1]
    const az = vertices[ia * 3 + 2]
    const bx = vertices[ib * 3]
    const by = vertices[ib * 3 + 1]
    const bz = vertices[ib * 3 + 2]
    const cx = vertices[ic * 3]
    const cy = vertices[ic * 3 + 1]
    const cz = vertices[ic * 3 + 2]

    const abx = bx - ax
    const aby = by - ay
    const abz = bz - az
    const acx = cx - ax
    const acy = cy - ay
    const acz = cz - az

    const nx = aby * acz - abz * acy
    const ny = abz * acx - abx * acz
    const nz = abx * acy - aby * acx
    return [nx, ny, nz]
  }
}
