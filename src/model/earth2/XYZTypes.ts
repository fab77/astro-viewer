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
