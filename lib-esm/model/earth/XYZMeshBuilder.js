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
        const triangleCount = segments * segments * 2;
        const rawIndices = new Uint32Array(triangleCount * 3);
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
}
