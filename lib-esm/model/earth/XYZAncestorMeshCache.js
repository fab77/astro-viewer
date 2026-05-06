export class XYZAncestorMeshCache {
    _webgl;
    _meshBuilder;
    _meshes = new Map();
    constructor(webgl, meshBuilder) {
        this._webgl = webgl;
        this._meshBuilder = meshBuilder;
    }
    getMesh(targetTile, ancestorTile, segmentsPerSide) {
        const key = `${targetTile.z}/${targetTile.x}/${targetTile.y}->${ancestorTile.z}/${ancestorTile.x}/${ancestorTile.y}@${segmentsPerSide}`;
        const existing = this._meshes.get(key);
        if (existing) {
            return existing;
        }
        const mesh = this._meshBuilder.buildAncestorMesh(targetTile, ancestorTile, segmentsPerSide);
        const uploaded = this._meshBuilder.uploadMesh(mesh, this._webgl);
        this._meshes.set(key, uploaded);
        return uploaded;
    }
    dispose() {
        for (const mesh of this._meshes.values()) {
            if (mesh.positionBuffer)
                this._webgl.deleteBuffer(mesh.positionBuffer);
            if (mesh.uvBuffer)
                this._webgl.deleteBuffer(mesh.uvBuffer);
            if (mesh.indexBuffer)
                this._webgl.deleteBuffer(mesh.indexBuffer);
        }
        this._meshes.clear();
    }
}
