/*
 * AstroViewer
 * Copyright (C) Fabrizio Giordano
 * SPDX-License-Identifier: LicenseRef-AstroViewer-Dual-License
 */

import type { MeshHiPSMesh } from './MeshHiPSTypes.js'
import { MeshoptDecoder } from 'meshoptimizer/decoder'

const GLB_MAGIC = 0x46546c67
const GLB_VERSION = 2
const JSON_CHUNK = 0x4e4f534a
const BIN_CHUNK = 0x004e4942

export class GLBMeshParser {
  static async parse(source: ArrayBuffer): Promise<MeshHiPSMesh> {
    const view = new DataView(source)
    if (view.getUint32(0, true) !== GLB_MAGIC || view.getUint32(4, true) !== GLB_VERSION) {
      throw new Error('MeshHiPS tile is not a GLB 2.0 file')
    }

    const jsonLength = view.getUint32(12, true)
    if (view.getUint32(16, true) !== JSON_CHUNK) {
      throw new Error('MeshHiPS GLB has no JSON chunk')
    }

    const jsonBytes = new Uint8Array(source, 20, jsonLength)
    const gltf = JSON.parse(new TextDecoder().decode(jsonBytes).trim())
    const binaryHeader = 20 + jsonLength
    if (view.getUint32(binaryHeader + 4, true) !== BIN_CHUNK) {
      throw new Error('MeshHiPS GLB has no binary chunk')
    }
    const binaryStart = binaryHeader + 8
    const readBufferView = async (bufferView: any): Promise<{ view: DataView, offset: number }> => {
      const extension = bufferView.extensions?.EXT_meshopt_compression
      if (!extension) {
        return { view, offset: binaryStart + (bufferView.byteOffset ?? 0) }
      }

      await MeshoptDecoder.ready
      const compressed = new Uint8Array(
        source,
        binaryStart + (extension.byteOffset ?? 0),
        extension.byteLength,
      )
      const decoded = await MeshoptDecoder.decodeGltfBufferAsync(
        extension.count,
        extension.byteStride,
        compressed,
        extension.mode,
        extension.filter,
      )
      return {
        view: new DataView(decoded.buffer, decoded.byteOffset, decoded.byteLength),
        offset: 0,
      }
    }

    const primitive = gltf.meshes?.[0]?.primitives?.[0]
    if (!primitive || primitive.mode !== 4) {
      throw new Error('MeshHiPS GLB must contain one triangle primitive')
    }

    const positionAccessor = gltf.accessors[primitive.attributes.POSITION]
    const positionView = gltf.bufferViews[positionAccessor.bufferView]
    if (positionAccessor.componentType !== 5126 || positionAccessor.type !== 'VEC3') {
      throw new Error('MeshHiPS GLB positions must be FLOAT VEC3')
    }

    const positionBuffer = await readBufferView(positionView)
    const positionOffset = positionBuffer.offset + (positionAccessor.byteOffset ?? 0)
    const positionStride = positionView.byteStride ?? 12
    const positions = new Float32Array(positionAccessor.count * 3)
    for (let index = 0; index < positionAccessor.count; index++) {
      const offset = positionOffset + index * positionStride
      positions[index * 3] = positionBuffer.view.getFloat32(offset, true)
      positions[index * 3 + 1] = positionBuffer.view.getFloat32(offset + 4, true)
      positions[index * 3 + 2] = positionBuffer.view.getFloat32(offset + 8, true)
    }

    const indexAccessor = gltf.accessors[primitive.indices]
    const indexView = gltf.bufferViews[indexAccessor.bufferView]
    if (indexAccessor.type !== 'SCALAR' || ![5123, 5125].includes(indexAccessor.componentType)) {
      throw new Error('MeshHiPS GLB indices must be UNSIGNED_SHORT or UNSIGNED_INT')
    }

    const indexBuffer = await readBufferView(indexView)
    const indexOffset = indexBuffer.offset + (indexAccessor.byteOffset ?? 0)
    const bytesPerIndex = indexAccessor.componentType === 5123 ? 2 : 4
    const indices = new Uint32Array(indexAccessor.count)
    for (let index = 0; index < indexAccessor.count; index++) {
      const offset = indexOffset + index * bytesPerIndex
      indices[index] = bytesPerIndex === 2
        ? indexBuffer.view.getUint16(offset, true)
        : indexBuffer.view.getUint32(offset, true)
    }

    const normals = new Float32Array(positions.length)
    if (primitive.attributes.NORMAL !== undefined) {
      const normalAccessor = gltf.accessors[primitive.attributes.NORMAL]
      const normalView = gltf.bufferViews[normalAccessor.bufferView]
      if (normalAccessor.componentType !== 5126 || normalAccessor.type !== 'VEC3') {
        throw new Error('MeshHiPS GLB normals must be FLOAT VEC3')
      }
      if (normalAccessor.count !== positionAccessor.count) {
        throw new Error('MeshHiPS GLB positions and normals have different counts')
      }

      const normalBuffer = await readBufferView(normalView)
      const normalOffset = normalBuffer.offset + (normalAccessor.byteOffset ?? 0)
      const normalStride = normalView.byteStride ?? 12
      for (let index = 0; index < normalAccessor.count; index++) {
        const offset = normalOffset + index * normalStride
        normals[index * 3] = normalBuffer.view.getFloat32(offset, true)
        normals[index * 3 + 1] = normalBuffer.view.getFloat32(offset + 4, true)
        normals[index * 3 + 2] = normalBuffer.view.getFloat32(offset + 8, true)
      }
    } else {
      for (let index = 0; index < indices.length; index += 3) {
        const a = indices[index] * 3
        const b = indices[index + 1] * 3
        const c = indices[index + 2] * 3
        const abx = positions[b] - positions[a]
        const aby = positions[b + 1] - positions[a + 1]
        const abz = positions[b + 2] - positions[a + 2]
        const acx = positions[c] - positions[a]
        const acy = positions[c + 1] - positions[a + 1]
        const acz = positions[c + 2] - positions[a + 2]
        const nx = aby * acz - abz * acy
        const ny = abz * acx - abx * acz
        const nz = abx * acy - aby * acx

        for (const vertex of [a, b, c]) {
          normals[vertex] += nx
          normals[vertex + 1] += ny
          normals[vertex + 2] += nz
        }
      }

      for (let index = 0; index < normals.length; index += 3) {
        const length = Math.hypot(normals[index], normals[index + 1], normals[index + 2]) || 1
        normals[index] /= length
        normals[index + 1] /= length
        normals[index + 2] /= length
      }
    }

    return { positions, normals, indices }
  }
}
