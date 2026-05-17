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
import XYZRayPickingUtils from '../../utils/XYZRayPickingUtils.js';
export class XYZVisibleTilesManager {
    _ancestorsMap = new Map();
    _visibleTilesMap = new Map();
    _visibleTiles = [];
    _selection = {
        key: '0:',
        currentZoom: 0,
        visibleTiles: [],
        visibleTilesMap: new Map(),
        ancestorsMap: new Map(),
    };
    get ancestorsMap() {
        return this._ancestorsMap;
    }
    get visibleTiles() {
        return this._visibleTiles;
    }
    get visibleTilesMap() {
        return this._visibleTilesMap;
    }
    get selection() {
        return this._selection;
    }
    computeVisibleTiles(z, xyzModel, webgl, camera, pMatrix, sampleCount = 9, padding = 2) {
        this._visibleTiles = XYZRayPickingUtils.getVisibleTilesFromViewport(z, xyzModel, webgl, camera, pMatrix, sampleCount, padding);
        this._visibleTilesMap = this.buildTileMap(this._visibleTiles);
        this.refreshAncestorsMap(this._visibleTiles);
        this._selection = {
            key: this.buildSelectionKey(z, this._visibleTiles),
            currentZoom: z,
            visibleTiles: this._visibleTiles,
            visibleTilesMap: this._visibleTilesMap,
            ancestorsMap: this._ancestorsMap,
        };
        return this._selection;
    }
    refreshAncestorsMap(visibleTiles) {
        this._ancestorsMap.clear();
        for (const tile of visibleTiles) {
            for (let z = tile.z - 1; z >= 0; z--) {
                const dz = tile.z - z;
                const ancestor = {
                    z,
                    x: tile.x >> dz,
                    y: tile.y >> dz,
                };
                this._ancestorsMap.set(`${ancestor.z}/${ancestor.x}/${ancestor.y}`, ancestor);
            }
        }
    }
    buildTileMap(tiles) {
        const map = new Map();
        for (const tile of tiles) {
            map.set(this.key(tile), tile);
        }
        return map;
    }
    buildSelectionKey(z, tiles) {
        return `${z}:${tiles.map((tile) => `${tile.x}/${tile.y}`).join('|')}`;
    }
    key(tile) {
        return `${tile.z}/${tile.x}/${tile.y}`;
    }
}
