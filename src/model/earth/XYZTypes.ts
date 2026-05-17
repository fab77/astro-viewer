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

export type XYZTileCoord = {
  z: number;
  x: number;
  y: number;
};

export type XYZVisibleTileSelection = {
  key: string;
  currentZoom: number;
  visibleTiles: XYZTileCoord[];
  visibleTilesMap: Map<string, XYZTileCoord>;
  ancestorsMap: Map<string, XYZTileCoord>;
};

export type XYZTileMesh = {
  positions: Float32Array;
  uvs: Float32Array;
  indices: Uint16Array | Uint32Array;
};

export type XYZTileGpuMesh = {
  positionBuffer: WebGLBuffer | null;
  uvBuffer: WebGLBuffer | null;
  indexBuffer: WebGLBuffer | null;
  indexCount: number;
  indexType: number;
};
