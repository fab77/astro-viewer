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

import { XYZShaderProgram } from '../../shader/XYZShaderProgram.js';
import { XYZMeshBuilder } from './XYZMeshBuilder.js';
import { XYZTile } from './XYZTile.js';
import type { XYZTileCoord, XYZTileGpuMesh } from './XYZTypes.js';

type Mat4 = Float32Array;

export class XYZAnchestorTile extends XYZTile {
  private _ancestorMeshBuilder: XYZMeshBuilder;
  private _ancestorWebgl: WebGL2RenderingContext;
  private _segmentsPerSide: number;
  private _meshCache = new Map<string, XYZTileGpuMesh>();

  constructor(
    coord: XYZTileCoord,
    url: string,
    webgl: WebGL2RenderingContext,
    shaderProgram: XYZShaderProgram,
    meshBuilder = new XYZMeshBuilder(),
    segmentsPerSide = 16,
  ) {
    super(coord, url, webgl, shaderProgram, meshBuilder, segmentsPerSide);
    this._ancestorMeshBuilder = meshBuilder;
    this._ancestorWebgl = webgl;
    this._segmentsPerSide = segmentsPerSide;
  }

  override draw(
    pMatrixOrVisibleZoom: Mat4 | number,
    vMatrixOrVisibleTiles: Mat4 | XYZTileCoord[],
    mMatrixOrAncestorsMap: Mat4 | Map<string, XYZTileCoord>,
    colorMapIdxOrPMatrix: number | Mat4,
    vMatrix?: Mat4,
    mMatrix?: Mat4,
    colorMapIdx?: number,
  ): boolean {
    if (typeof pMatrixOrVisibleZoom !== 'number') {
      return super.draw(
        pMatrixOrVisibleZoom,
        vMatrixOrVisibleTiles as Mat4,
        mMatrixOrAncestorsMap as Mat4,
        colorMapIdxOrPMatrix as number,
      );
    }

    if (!vMatrix || !mMatrix || colorMapIdx === undefined) {
      return false;
    }

    const visibleZoom = pMatrixOrVisibleZoom;
    const visibleTiles = vMatrixOrVisibleTiles as XYZTileCoord[];
    const ancestorsMap = mMatrixOrAncestorsMap as Map<string, XYZTileCoord>;
    const pMatrix = colorMapIdxOrPMatrix as Mat4;
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

  override dispose(): void {
    for (const mesh of this._meshCache.values()) {
      if (mesh.positionBuffer) this._ancestorWebgl.deleteBuffer(mesh.positionBuffer);
      if (mesh.uvBuffer) this._ancestorWebgl.deleteBuffer(mesh.uvBuffer);
      if (mesh.indexBuffer) this._ancestorWebgl.deleteBuffer(mesh.indexBuffer);
    }
    this._meshCache.clear();
    super.dispose();
  }

  private getRemappedMesh(targetTile: XYZTileCoord): XYZTileGpuMesh {
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

  private isAncestorOf(targetTile: XYZTileCoord): boolean {
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
