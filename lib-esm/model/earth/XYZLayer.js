import { AbstractSkyEntity } from '../AbstractSkyEntity.js';
import { XYZShaderProgram } from '../../shader/XYZShaderProgram.js';
import { XYZMeshBuilder } from './XYZMeshBuilder.js';
import { XYZTile } from './XYZTile.js';
import { XYZTileProvider } from './XYZTileProvider.js';
export class XYZLayer extends AbstractSkyEntity {
    _config;
    _provider;
    _meshBuilder;
    _xyzShaderProgram;
    _tiles = [];
    constructor(config, webgl) {
        super(1, [0, 0, 0], 0, 0, 'XYZ Earth Layer', webgl, false);
        this._config = config;
        this._provider = new XYZTileProvider(config);
        this._meshBuilder = new XYZMeshBuilder();
        this._xyzShaderProgram = new XYZShaderProgram(webgl);
        this.initGL(webgl);
        this.bootstrapTiles();
    }
    get config() {
        return this._config;
    }
    bootstrapTiles() {
        const tiles = this._provider.getInitialTiles();
        const segments = this._config.segmentsPerSide ?? 16;
        this._tiles = tiles.map((tileCoord) => {
            const mesh = this._meshBuilder.buildTileMesh(tileCoord, segments);
            const url = this._provider.getTileUrl(tileCoord);
            return new XYZTile(tileCoord, url, mesh, this._webgl, this._xyzShaderProgram);
        });
    }
    draw(input) {
        const vMatrix = input.camera.getCameraMatrix();
        if (!vMatrix)
            return;
        const pMatrix = input.pMatrix;
        const mMatrix = this.getModelMatrix();
        for (const tile of this._tiles) {
            tile.draw(pMatrix, vMatrix, mMatrix);
        }
    }
}
