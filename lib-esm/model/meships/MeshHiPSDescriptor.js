/*
 * AstroViewer
 * Copyright (C) Fabrizio Giordano
 * SPDX-License-Identifier: LicenseRef-AstroViewer-Dual-License
 */
export class MeshHiPSDescriptor {
    _name = 'MeshHiPS';
    _baseUrl;
    _minOrder = 0;
    _maxOrder = 0;
    _selectedOrder;
    _maxCachedTiles = 384;
    _color = [0.72, 0.86, 1.0, 1.0];
    _wireframe = false;
    _propertiesRawText = '';
    _propertiesMap = new Map();
    constructor(config, propertiesText = '') {
        this._baseUrl = this.normalizeBaseUrl(config.baseUrl);
        this._propertiesRawText = propertiesText;
        this.parseProperties(propertiesText);
        this._name = config.name ?? this._propertiesMap.get('obs_collection') ?? this._propertiesMap.get('label') ?? this._name;
        this._minOrder = config.minOrder ?? this.readNumber('hips_order_min', this._minOrder);
        this._maxOrder = config.maxOrder ?? this.readNumber('hips_order', this.readNumber('hips_order_max', this._maxOrder));
        this._selectedOrder = config.order ?? this._maxOrder;
        this._maxCachedTiles = config.maxCachedTiles ?? this._maxCachedTiles;
        this._color = config.color ?? this._color;
        this._wireframe = config.wireframe ?? this._wireframe;
        this._selectedOrder = this.clampOrder(this._selectedOrder);
    }
    get name() {
        return this._name;
    }
    get baseUrl() {
        return this._baseUrl;
    }
    get minOrder() {
        return this._minOrder;
    }
    get maxOrder() {
        return this._maxOrder;
    }
    get selectedOrder() {
        return this._selectedOrder;
    }
    get maxCachedTiles() {
        return this._maxCachedTiles;
    }
    get color() {
        return this._color;
    }
    get wireframe() {
        return this._wireframe;
    }
    get propertiesRawText() {
        return this._propertiesRawText;
    }
    get properties() {
        return new Map(this._propertiesMap);
    }
    getProperty(key) {
        return this._propertiesMap.get(key);
    }
    getTileUrl(order, ipix) {
        const dir = Math.floor(ipix / 10_000) * 10_000;
        return `${this._baseUrl}Norder${order}/Dir${dir}/Npix${ipix}.obj`;
    }
    parseProperties(propertiesText) {
        const lines = propertiesText.split(/\r\n|\n/);
        for (const raw of lines) {
            const line = raw.trim();
            if (!line || line.startsWith('#'))
                continue;
            const idx = line.indexOf('=');
            if (idx < 0)
                continue;
            this._propertiesMap.set(line.slice(0, idx).trim(), line.slice(idx + 1).trim());
        }
    }
    readNumber(key, fallback) {
        const parsed = Number(this._propertiesMap.get(key));
        return Number.isFinite(parsed) ? parsed : fallback;
    }
    clampOrder(order) {
        return Math.max(this._minOrder, Math.min(this._maxOrder, order));
    }
    normalizeBaseUrl(baseUrl) {
        return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    }
}
