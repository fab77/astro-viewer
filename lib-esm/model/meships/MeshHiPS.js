/*
 * AstroViewer
 * Copyright (C) Fabrizio Giordano
 * SPDX-License-Identifier: LicenseRef-AstroViewer-Dual-License
 */
import { AbstractSkyEntity } from '../AbstractSkyEntity.js';
import { fovHelper } from '../hips/FoVHelper.js';
import { MeshHiPSShaderProgram } from '../../shader/MeshHiPSShaderProgram.js';
import { MeshHiPSTile } from './MeshHiPSTile.js';
export class MeshHiPS extends AbstractSkyEntity {
    _descriptor;
    _healpixGrid;
    _shaderProgram;
    _tiles = new Map();
    _currentOrder;
    _visibleTiles = [];
    _coverageTiles = [];
    constructor(radius, position, xrad, yrad, _descriptor, webgl, _healpixGrid) {
        super(radius, position, xrad, yrad, _descriptor.name, webgl, false);
        this._descriptor = _descriptor;
        this._healpixGrid = _healpixGrid;
        this.initGL(webgl);
        this._shaderProgram = new MeshHiPSShaderProgram(webgl);
        this._shaderProgram.enableProgram();
        this._currentOrder = _descriptor.selectedOrder;
    }
    get currentOrder() {
        return this._currentOrder;
    }
    get maxOrder() {
        return this._descriptor.maxOrder;
    }
    get minOrder() {
        return this._descriptor.minOrder;
    }
    get baseURL() {
        return this._descriptor.baseUrl;
    }
    get propertiesRawText() {
        return this._descriptor.propertiesRawText;
    }
    get properties() {
        return this._descriptor.properties;
    }
    getProperty(key) {
        return this._descriptor.getProperty(key);
    }
    refreshOrder(fovDeg) {
        if (this._descriptor.fixedOrder) {
            this._currentOrder = this._descriptor.selectedOrder;
            return this._currentOrder;
        }
        const fov = Number.isFinite(fovDeg) && fovDeg > 0
            ? fovDeg
            : this._healpixGrid.getMinFoV();
        const safeFov = Number.isFinite(fov) && fov > 0 ? fov : 1e-6;
        const order = fovHelper.getHiPSNorder(safeFov, this._currentOrder);
        this._currentOrder = Math.max(this._descriptor.minOrder, Math.min(this._descriptor.maxOrder, order));
        return this._currentOrder;
    }
    draw(input) {
        const vMatrix = input.camera.getCameraMatrix();
        if (!vMatrix || !input.pMatrix)
            return;
        this.refreshOrder(input.fovDeg);
        this._visibleTiles = this.resolveVisibleTiles();
        this._coverageTiles = this.resolveCoverageTiles(this._visibleTiles);
        this.ensureTiles(this._coverageTiles);
        this.evictCached();
        const gl = this._webgl;
        const pMatrix = input.pMatrix;
        const mMatrix = this.getModelMatrix();
        const wasCullFace = gl.isEnabled(gl.CULL_FACE);
        const wasDepthTest = gl.isEnabled(gl.DEPTH_TEST);
        const wasDepthMask = gl.getParameter(gl.DEPTH_WRITEMASK);
        const previousDepthFunc = gl.getParameter(gl.DEPTH_FUNC);
        gl.enable(gl.DEPTH_TEST);
        gl.depthMask(true);
        gl.depthFunc(gl.LEQUAL);
        gl.disable(gl.CULL_FACE);
        const byOrder = this.groupTilesByOrder(this._coverageTiles);
        const orders = Array.from(byOrder.keys()).sort((a, b) => a - b);
        for (const order of orders) {
            for (const coord of byOrder.get(order) ?? []) {
                this._tiles.get(this.tileKey(coord))?.draw(pMatrix, vMatrix, mMatrix, this._descriptor.color, this._descriptor.wireframe);
            }
        }
        if (wasCullFace)
            gl.enable(gl.CULL_FACE);
        if (!wasDepthTest)
            gl.disable(gl.DEPTH_TEST);
        gl.depthFunc(previousDepthFunc);
        gl.depthMask(wasDepthMask);
    }
    getDebugStats() {
        const tiles = Array.from(this._tiles.values());
        return {
            activeBaseLayer: 'meships',
            meshHiPSName: this._descriptor.name,
            meshHiPSUrl: this._descriptor.baseUrl,
            currentOrder: this._currentOrder,
            visibleTileCount: this._visibleTiles.length,
            coverageTileCount: this._coverageTiles.length,
            cacheSize: this._tiles.size,
            readyTileCount: tiles.filter((tile) => tile.ready).length,
            loadingTileCount: tiles.filter((tile) => tile.loading).length,
            failedTileCount: tiles.filter((tile) => tile.failed).length,
        };
    }
    resolveVisibleTiles() {
        const manager = this._healpixGrid.visibleTilesManager;
        const byOrder = manager?.visibleTilesByOrder;
        const pixels = byOrder?.order === this._currentOrder && Array.isArray(byOrder.pixels)
            ? byOrder.pixels
            : [];
        if (pixels.length > 0) {
            return pixels.map((ipix) => ({ order: this._currentOrder, ipix }));
        }
        const tileCount = 12 * 4 ** this._currentOrder;
        return Array.from({ length: tileCount }, (_, ipix) => ({ order: this._currentOrder, ipix }));
    }
    resolveCoverageTiles(visibleTiles) {
        const tiles = new Map();
        const add = (coord) => {
            if (coord.order < this._descriptor.minOrder || coord.order > this._descriptor.maxOrder)
                return;
            tiles.set(this.tileKey(coord), coord);
        };
        for (const coord of visibleTiles) {
            add(coord);
            for (let order = coord.order - 1; order >= this._descriptor.minOrder; order--) {
                const shift = 2 * (coord.order - order);
                add({ order, ipix: coord.ipix >> shift });
            }
        }
        const manager = this._healpixGrid.visibleTilesManager;
        const ancestorsMap = manager?.ancestorsMap;
        if (ancestorsMap) {
            for (const [order, ipixes] of ancestorsMap) {
                if (order < this._descriptor.minOrder || order > this._descriptor.maxOrder)
                    continue;
                for (const ipix of ipixes)
                    add({ order, ipix });
            }
        }
        return Array.from(tiles.values());
    }
    groupTilesByOrder(coords) {
        const byOrder = new Map();
        for (const coord of coords) {
            const list = byOrder.get(coord.order) ?? [];
            list.push(coord);
            byOrder.set(coord.order, list);
        }
        return byOrder;
    }
    ensureTiles(coords) {
        for (const coord of coords) {
            const key = this.tileKey(coord);
            if (this._tiles.has(key))
                continue;
            this._tiles.set(key, new MeshHiPSTile(coord, this._descriptor.getTileUrl(coord.order, coord.ipix), this._webgl, this._shaderProgram));
        }
    }
    evictCached() {
        const maxCached = this._descriptor.maxCachedTiles;
        if (this._tiles.size <= maxCached)
            return;
        const visibleKeys = new Set(this._coverageTiles.map((coord) => this.tileKey(coord)));
        const evictable = Array.from(this._tiles.entries())
            .filter(([key]) => !visibleKeys.has(key))
            .sort((a, b) => a[1].lastUsedAt - b[1].lastUsedAt);
        while (this._tiles.size > maxCached && evictable.length > 0) {
            const [key, tile] = evictable.shift();
            tile.dispose();
            this._tiles.delete(key);
        }
    }
    tileKey(coord) {
        return `${coord.order}/${coord.ipix}`;
    }
}
