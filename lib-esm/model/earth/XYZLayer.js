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
    _tileSelectionKey = null;
    constructor(config, webgl) {
        super(1, [0, 0, 0], 0, 0, 'XYZ Earth Layer', webgl, false);
        this._config = config;
        this._provider = new XYZTileProvider(config);
        this._meshBuilder = new XYZMeshBuilder();
        this._xyzShaderProgram = new XYZShaderProgram(webgl);
        this.initGL(webgl);
        this.bootstrapTiles(180, null, null);
    }
    get config() {
        return this._config;
    }
    bootstrapTiles(fovDeg, camera, centerSphericalDeg) {
        const selection = camera
            ? this._provider.getTilesForCamera(fovDeg, camera, centerSphericalDeg ?? null)
            : { key: 'initial', tiles: this._provider.getInitialTiles() };
        if (selection.key === this._tileSelectionKey) {
            return;
        }
        this.disposeTiles();
        this._tileSelectionKey = selection.key;
        const segments = this._config.segmentsPerSide ?? 16;
        this._tiles = selection.tiles.map((tileCoord) => {
            const mesh = this._meshBuilder.buildTileMesh(tileCoord, segments);
            const url = this._provider.getTileUrl(tileCoord);
            return new XYZTile(tileCoord, url, mesh, this._webgl, this._xyzShaderProgram);
        });
    }
    draw(input) {
        const vMatrix = input.camera.getCameraMatrix();
        if (!vMatrix)
            return;
        this.bootstrapTiles(input.fovDeg ?? 180, input.camera, input.centerSphericalDeg ?? null);
        const pMatrix = input.pMatrix;
        const mMatrix = this.getModelMatrix();
        for (const tile of this._tiles) {
            tile.draw(pMatrix, vMatrix, mMatrix);
        }
    }
    disposeTiles() {
        for (const tile of this._tiles) {
            tile.dispose();
        }
        this._tiles = [];
    }
}
