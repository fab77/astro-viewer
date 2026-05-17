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
export class XYZMapDescriptor {
    _name;
    _url;
    _urlResolver;
    _minZoom;
    _maxZoom;
    _segmentsPerSide;
    _tileSize;
    _maxCachedTiles;
    _interactionDebounceMs;
    _subdomains;
    _attribution;
    _flipY;
    _maxConcurrentLoads;
    constructor(name, url, minZoom = 0, maxZoom = 8, segmentsPerSide = 16, maxCachedTiles = 384, maxConcurrentLoads = 8, urlResolver) {
        this._name = name;
        this._url = url;
        this._urlResolver = urlResolver;
        this._minZoom = minZoom;
        this._maxZoom = maxZoom;
        this._segmentsPerSide = segmentsPerSide;
        this._maxCachedTiles = maxCachedTiles;
        this._interactionDebounceMs = 100;
        this._subdomains = ['a', 'b', 'c'];
        this._attribution = '';
        this._flipY = false;
        this._maxConcurrentLoads = maxConcurrentLoads;
    }
    get url() {
        return this._url;
    }
    get urlResolver() {
        return this._urlResolver;
    }
    get name() {
        return this._name;
    }
    get minZoom() {
        return this._minZoom;
    }
    get maxZoom() {
        return this._maxZoom;
    }
    get segmentsPerSide() {
        return this._segmentsPerSide;
    }
    get maxCachedTiles() {
        return this._maxCachedTiles;
    }
    get interactionDebounceMs() {
        return this._interactionDebounceMs;
    }
    get subdomains() {
        return this._subdomains;
    }
    get attribution() {
        return this._attribution;
    }
    get flipY() {
        return this._flipY;
    }
    get maxConcurrentLoads() {
        return this._maxConcurrentLoads;
    }
}
