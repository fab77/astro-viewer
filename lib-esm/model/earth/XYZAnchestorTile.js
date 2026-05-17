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
import { XYZMeshBuilder } from './XYZMeshBuilder.js';
import { XYZTile } from './XYZTile.js';
export class XYZAnchestorTile extends XYZTile {
    _ancestorMeshBuilder;
    _ancestorWebgl;
    _segmentsPerSide;
    _meshCache = new Map();
    constructor(coord, url, webgl, shaderProgram, meshBuilder = new XYZMeshBuilder(), segmentsPerSide = 16) {
        super(coord, url, webgl, shaderProgram, meshBuilder, segmentsPerSide);
        this._ancestorMeshBuilder = meshBuilder;
        this._ancestorWebgl = webgl;
        this._segmentsPerSide = segmentsPerSide;
    }
    draw(pMatrixOrVisibleZoom, vMatrixOrVisibleTiles, mMatrixOrAncestorsMap, colorMapIdxOrPMatrix, vMatrix, mMatrix, colorMapIdx) {
        if (typeof pMatrixOrVisibleZoom !== 'number') {
            return super.draw(pMatrixOrVisibleZoom, vMatrixOrVisibleTiles, mMatrixOrAncestorsMap, colorMapIdxOrPMatrix);
        }
        if (!vMatrix || !mMatrix || colorMapIdx === undefined) {
            return false;
        }
        const visibleZoom = pMatrixOrVisibleZoom;
        const visibleTiles = vMatrixOrVisibleTiles;
        const ancestorsMap = mMatrixOrAncestorsMap;
        const pMatrix = colorMapIdxOrPMatrix;
        let drawn = false;
        if (visibleZoom <= this.coord.z) {
            return super.draw(pMatrix, vMatrix, mMatrix, colorMapIdx);
        }
        for (const targetTile of visibleTiles) {
            if (!this.isAncestorOf(targetTile)) {
                continue;
            }
            const ancestorKey = `${this.coord.z}/${this.coord.x}/${this.coord.y}`;
            if (!ancestorsMap.has(ancestorKey)) {
                continue;
            }
            const mesh = this.getRemappedMesh(targetTile);
            drawn = super.drawRemapped(mesh, pMatrix, vMatrix, mMatrix, colorMapIdx) || drawn;
        }
        return drawn;
    }
    dispose() {
        for (const mesh of this._meshCache.values()) {
            if (mesh.positionBuffer)
                this._ancestorWebgl.deleteBuffer(mesh.positionBuffer);
            if (mesh.uvBuffer)
                this._ancestorWebgl.deleteBuffer(mesh.uvBuffer);
            if (mesh.indexBuffer)
                this._ancestorWebgl.deleteBuffer(mesh.indexBuffer);
        }
        this._meshCache.clear();
        super.dispose();
    }
    getRemappedMesh(targetTile) {
        const key = `${targetTile.z}/${targetTile.x}/${targetTile.y}->${this.coord.z}/${this.coord.x}/${this.coord.y}`;
        const existing = this._meshCache.get(key);
        if (existing) {
            return existing;
        }
        const mesh = this._ancestorMeshBuilder.buildAncestorMesh(targetTile, this.coord, this._segmentsPerSide);
        const uploaded = this._ancestorMeshBuilder.uploadMesh(mesh, this._ancestorWebgl);
        this._meshCache.set(key, uploaded);
        return uploaded;
    }
    isAncestorOf(targetTile) {
        if (targetTile.z <= this.coord.z) {
            return targetTile.z === this.coord.z
                && targetTile.x === this.coord.x
                && targetTile.y === this.coord.y;
        }
        const dz = targetTile.z - this.coord.z;
        return (targetTile.x >> dz) === this.coord.x && (targetTile.y >> dz) === this.coord.y;
    }
}
export { XYZAnchestorTile as XYZAncestorTile };
