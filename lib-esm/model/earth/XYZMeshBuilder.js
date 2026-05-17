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
import { sphericalToCartesian } from '../../utils/Utils.js';
const MAX_MERCATOR_LAT = 85.0511287798066;
function mercatorYToLatDeg(yNormalized) {
    const mercator = Math.PI * (1 - 2 * yNormalized);
    return (Math.atan(Math.sinh(mercator)) * 180) / Math.PI;
}
function wrapLonToPhi(lonDeg) {
    return lonDeg < 0 ? lonDeg + 360 : lonDeg;
}
export class XYZMeshBuilder {
    buildTileMesh(tile, segmentsPerSide = 16) {
        const segments = Math.max(1, Math.floor(segmentsPerSide));
        const gridSize = segments + 1;
        const vertexCount = gridSize * gridSize;
        const positions = new Float32Array(vertexCount * 3);
        const uvs = new Float32Array(vertexCount * 2);
        const tileCount = 2 ** tile.z;
        let p = 0;
        let uv = 0;
        for (let row = 0; row <= segments; row++) {
            const v = row / segments;
            const yNormalized = (tile.y + v) / tileCount;
            const latDeg = Math.max(-MAX_MERCATOR_LAT, Math.min(MAX_MERCATOR_LAT, mercatorYToLatDeg(yNormalized)));
            const thetaDeg = 90 - latDeg;
            for (let col = 0; col <= segments; col++) {
                const u = col / segments;
                const xNormalized = (tile.x + u) / tileCount;
                const lonDeg = xNormalized * 360 - 180;
                const phiDeg = wrapLonToPhi(lonDeg);
                const [x, y, z] = sphericalToCartesian(phiDeg, thetaDeg, 1);
                positions[p++] = x;
                positions[p++] = y;
                positions[p++] = z;
                uvs[uv++] = u;
                uvs[uv++] = 1 - v;
            }
        }
        const rawIndices = new Uint32Array(segments * segments * 2 * 3);
        let i = 0;
        for (let row = 0; row < segments; row++) {
            for (let col = 0; col < segments; col++) {
                const topLeft = row * gridSize + col;
                const topRight = topLeft + 1;
                const bottomLeft = topLeft + gridSize;
                const bottomRight = bottomLeft + 1;
                rawIndices[i++] = topLeft;
                rawIndices[i++] = bottomLeft;
                rawIndices[i++] = topRight;
                rawIndices[i++] = topRight;
                rawIndices[i++] = bottomLeft;
                rawIndices[i++] = bottomRight;
            }
        }
        const indices = rawIndices.length > 65535 ? rawIndices : new Uint16Array(rawIndices);
        return { positions, uvs, indices };
    }
    buildAncestorMesh(targetTile, ancestorTile, segmentsPerSide = 16) {
        const baseMesh = this.buildTileMesh(targetTile, segmentsPerSide);
        const dz = targetTile.z - ancestorTile.z;
        const scale = 2 ** dz;
        const subTileX = targetTile.x - (ancestorTile.x << dz);
        const subTileY = targetTile.y - (ancestorTile.y << dz);
        const uvs = new Float32Array(baseMesh.uvs.length);
        for (let i = 0; i < baseMesh.uvs.length; i += 2) {
            const u = baseMesh.uvs[i] ?? 0;
            const baseV = baseMesh.uvs[i + 1] ?? 0;
            const v = 1 - baseV;
            uvs[i] = (subTileX + u) / scale;
            uvs[i + 1] = 1 - (subTileY + v) / scale;
        }
        return {
            positions: baseMesh.positions,
            uvs,
            indices: baseMesh.indices,
        };
    }
    uploadMesh(mesh, webgl) {
        const positionBuffer = webgl.createBuffer();
        const uvBuffer = webgl.createBuffer();
        const indexBuffer = webgl.createBuffer();
        const indexType = mesh.indices instanceof Uint32Array ? webgl.UNSIGNED_INT : webgl.UNSIGNED_SHORT;
        webgl.bindBuffer(webgl.ARRAY_BUFFER, positionBuffer);
        webgl.bufferData(webgl.ARRAY_BUFFER, mesh.positions, webgl.STATIC_DRAW);
        webgl.bindBuffer(webgl.ARRAY_BUFFER, uvBuffer);
        webgl.bufferData(webgl.ARRAY_BUFFER, mesh.uvs, webgl.STATIC_DRAW);
        webgl.bindBuffer(webgl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        webgl.bufferData(webgl.ELEMENT_ARRAY_BUFFER, mesh.indices, webgl.STATIC_DRAW);
        return {
            positionBuffer,
            uvBuffer,
            indexBuffer,
            indexCount: mesh.indices.length,
            indexType,
        };
    }
}
