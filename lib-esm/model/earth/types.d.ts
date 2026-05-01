export type XYZLayerConfig = {
    urlTemplate: string;
    minZoom?: number;
    maxZoom?: number;
    segmentsPerSide?: number;
    tileSize?: number;
};
export type XYZTileCoord = {
    z: number;
    x: number;
    y: number;
};
export type XYZTileMesh = {
    positions: Float32Array;
    uvs: Float32Array;
    indices: Uint16Array | Uint32Array;
};
