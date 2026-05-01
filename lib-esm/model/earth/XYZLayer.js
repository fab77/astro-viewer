import { AbstractSkyEntity } from '../AbstractSkyEntity.js';
import { XYZShaderProgram } from '../../shader/XYZShaderProgram.js';
import { XYZMeshBuilder } from './XYZMeshBuilder.js';
import { XYZTile } from './XYZTile.js';
import { XYZTileProvider } from './XYZTileProvider.js';
import { XYZVisibleTilesManager } from './XYZVisibleTilesManager.js';
export class XYZLayer extends AbstractSkyEntity {
    static DEFAULT_MAX_CACHED_TILES = 384;
    _config;
    _provider;
    _visibleTilesManager;
    _meshBuilder;
    _xyzShaderProgram;
    _tileCache = new Map();
    _visibleTileKeys = [];
    _tileSelectionKey = null;
    constructor(config, webgl) {
        super(1, [0, 0, 0], 0, 0, 'XYZ Earth Layer', webgl, false);
        this._config = config;
        this._provider = new XYZTileProvider(config);
        this._visibleTilesManager = new XYZVisibleTilesManager(this._provider);
        this._meshBuilder = new XYZMeshBuilder();
        this._xyzShaderProgram = new XYZShaderProgram(webgl);
        this.initGL(webgl);
        this.bootstrapTiles(180, null, null);
    }
    get config() {
        return this._config;
    }
    getDebugStats() {
        let readyTileCount = 0;
        let loadingTileCount = 0;
        let coolingDownTileCount = 0;
        const now = Date.now();
        for (const tile of this._tileCache.values()) {
            if (tile.ready) {
                readyTileCount += 1;
            }
            if (tile.loading) {
                loadingTileCount += 1;
            }
            if (tile.failedUntil > now) {
                coolingDownTileCount += 1;
            }
        }
        const currentZoom = this._visibleTileKeys.reduce((maxZoom, tileKey) => {
            const zoom = Number.parseInt(tileKey.split('/')[0] ?? '', 10);
            if (!Number.isFinite(zoom)) {
                return maxZoom;
            }
            return maxZoom == null ? zoom : Math.max(maxZoom, zoom);
        }, null);
        return {
            cacheSize: this._tileCache.size,
            visibleTileCount: this._visibleTileKeys.length,
            readyTileCount,
            loadingTileCount,
            coolingDownTileCount,
            currentZoom,
            tileSelectionKey: this._tileSelectionKey,
        };
    }
    bootstrapTiles(fovDeg, camera, centerSphericalDeg, fovPolygon = null, viewportSphericalSamples = null) {
        const selection = camera
            ? this._visibleTilesManager.selectTiles({
                fovDeg,
                camera,
                pMatrix: new Float32Array(),
                centerSphericalDeg: centerSphericalDeg ?? undefined,
                fovPolygon: fovPolygon ?? undefined,
                viewportSphericalSamples: viewportSphericalSamples ?? undefined,
            })
            : {
                key: 'initial',
                currentTiles: this._provider.getInitialTiles(),
                fallbackTiles: [],
            };
        if (selection.key === this._tileSelectionKey) {
            return;
        }
        this._tileSelectionKey = selection.key;
        const segments = this._config.segmentsPerSide ?? 16;
        const requestedTiles = [...selection.currentTiles, ...selection.fallbackTiles];
        this._visibleTileKeys = requestedTiles
            .sort((a, b) => a.z - b.z)
            .map((tileCoord) => this.getTileKey(tileCoord));
        for (const tileCoord of requestedTiles) {
            const tileKey = this.getTileKey(tileCoord);
            const existingTile = this._tileCache.get(tileKey);
            if (existingTile) {
                existingTile.touch();
                continue;
            }
            const mesh = this._meshBuilder.buildTileMesh(tileCoord, segments);
            const url = this._provider.getTileUrl(tileCoord);
            const tile = new XYZTile(tileCoord, url, mesh, this._webgl, this._xyzShaderProgram);
            tile.touch();
            this._tileCache.set(tileKey, tile);
        }
        this.evictCache();
    }
    draw(input) {
        const vMatrix = input.camera.getCameraMatrix();
        if (!vMatrix)
            return;
        this.bootstrapTiles(input.fovDeg ?? 180, input.camera, input.centerSphericalDeg ?? null, input.fovPolygon ?? null, input.viewportSphericalSamples ?? null);
        const pMatrix = input.pMatrix;
        const mMatrix = this.getModelMatrix();
        for (const tileKey of this._visibleTileKeys) {
            const tile = this._tileCache.get(tileKey);
            if (!tile)
                continue;
            tile.draw(pMatrix, vMatrix, mMatrix);
        }
    }
    evictCache() {
        const maxCachedTiles = this._config.maxCachedTiles ?? XYZLayer.DEFAULT_MAX_CACHED_TILES;
        if (this._tileCache.size <= maxCachedTiles) {
            return;
        }
        const visibleKeySet = new Set(this._visibleTileKeys);
        const candidates = Array.from(this._tileCache.entries())
            .filter(([tileKey]) => !visibleKeySet.has(tileKey))
            .sort((a, b) => {
            const scoreA = Math.min(a[1].lastUsedAt || a[1].createdAt, a[1].createdAt);
            const scoreB = Math.min(b[1].lastUsedAt || b[1].createdAt, b[1].createdAt);
            return scoreA - scoreB;
        });
        for (const [tileKey, tile] of candidates) {
            if (this._tileCache.size <= maxCachedTiles) {
                break;
            }
            if (tile.loading) {
                continue;
            }
            tile.dispose();
            this._tileCache.delete(tileKey);
        }
    }
    disposeTiles() {
        for (const tile of this._tileCache.values()) {
            tile.dispose();
        }
        this._tileCache.clear();
        this._visibleTileKeys = [];
    }
    getTileKey(tileCoord) {
        return `${tileCoord.z}/${tileCoord.x}/${tileCoord.y}`;
    }
}
