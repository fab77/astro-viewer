/*
 * AstroViewer
 * Copyright (C) Fabrizio Giordano
 * SPDX-License-Identifier: LicenseRef-AstroViewer-Dual-License
 */
export class OBJMeshParser {
    static parse(text) {
        const vertices = [];
        const indices = [];
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
        return {
            positions: new Float32Array(vertices),
            indices: new Uint32Array(indices),
        };
    }
    static resolveIndex(objIndex, vertexCount) {
        return objIndex > 0 ? objIndex - 1 : vertexCount + objIndex;
    }
}
