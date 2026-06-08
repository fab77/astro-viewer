/*
 * AstroViewer
 * Copyright (C) Fabrizio Giordano
 * SPDX-License-Identifier: LicenseRef-AstroViewer-Dual-License
 */
export class OBJMeshParser {
    static parse(text) {
        const vertices = [];
        const indices = [];
        const normals = [];
        const lines = text.split(/\r\n|\n/);
        for (const raw of lines) {
            const line = raw.trim();
            if (!line || line.startsWith('#'))
                continue;
            if (line.startsWith('v ')) {
                const parts = line.split(/\s+/);
                if (parts.length < 4)
                    continue;
                vertices.push(Number(parts[1]), Number(parts[2]), Number(parts[3]));
                normals.push(0, 0, 0);
                continue;
            }
            if (line.startsWith('f ')) {
                const face = line
                    .slice(2)
                    .trim()
                    .split(/\s+/)
                    .map((part) => Number(part.split('/')[0]))
                    .filter((idx) => Number.isInteger(idx) && idx !== 0);
                if (face.length < 3)
                    continue;
                const first = OBJMeshParser.resolveIndex(face[0], vertices.length / 3);
                for (let i = 1; i < face.length - 1; i++) {
                    indices.push(first, OBJMeshParser.resolveIndex(face[i], vertices.length / 3), OBJMeshParser.resolveIndex(face[i + 1], vertices.length / 3));
                }
            }
        }
        OBJMeshParser.computeVertexNormals(vertices, indices, normals);
        return {
            positions: new Float32Array(vertices),
            normals: new Float32Array(normals),
            indices: new Uint32Array(indices),
        };
    }
    static computeVertexNormals(vertices, indices, normals) {
        for (let i = 0; i < indices.length; i += 3) {
            const ia = indices[i];
            const ib = indices[i + 1];
            const ic = indices[i + 2];
            const ax = vertices[ia * 3];
            const ay = vertices[ia * 3 + 1];
            const az = vertices[ia * 3 + 2];
            const bx = vertices[ib * 3];
            const by = vertices[ib * 3 + 1];
            const bz = vertices[ib * 3 + 2];
            const cx = vertices[ic * 3];
            const cy = vertices[ic * 3 + 1];
            const cz = vertices[ic * 3 + 2];
            const abx = bx - ax;
            const aby = by - ay;
            const abz = bz - az;
            const acx = cx - ax;
            const acy = cy - ay;
            const acz = cz - az;
            const nx = aby * acz - abz * acy;
            const ny = abz * acx - abx * acz;
            const nz = abx * acy - aby * acx;
            normals[ia * 3] += nx;
            normals[ia * 3 + 1] += ny;
            normals[ia * 3 + 2] += nz;
            normals[ib * 3] += nx;
            normals[ib * 3 + 1] += ny;
            normals[ib * 3 + 2] += nz;
            normals[ic * 3] += nx;
            normals[ic * 3 + 1] += ny;
            normals[ic * 3 + 2] += nz;
        }
        for (let i = 0; i < normals.length; i += 3) {
            const nx = normals[i];
            const ny = normals[i + 1];
            const nz = normals[i + 2];
            const len = Math.hypot(nx, ny, nz) || 1;
            normals[i] = nx / len;
            normals[i + 1] = ny / len;
            normals[i + 2] = nz / len;
        }
    }
    static resolveIndex(objIndex, vertexCount) {
        return objIndex > 0 ? objIndex - 1 : vertexCount + objIndex;
    }
}
