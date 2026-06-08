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
    _fixedOrder = false;
    _maxCachedTiles = 384;
    // default neutral color (contrasts with page background)
    _color = [0.32, 0.34, 0.36, 1.0];
    _wireframe = false;
    _propertiesRawText = '';
    _propertiesMap = new Map();
    _meshRadius = null;
    constructor(config, propertiesText = '') {
        this._baseUrl = this.normalizeBaseUrl(config.baseUrl);
        this._propertiesRawText = propertiesText;
        this.parseProperties(propertiesText);
        this._name = config.name ?? this._propertiesMap.get('obs_collection') ?? this._propertiesMap.get('label') ?? this._name;
        this._minOrder = config.minOrder ?? this.readNumber('hips_order_min', this._minOrder);
        this._maxOrder = config.maxOrder ?? this.readNumber('hips_order', this.readNumber('hips_order_max', this._maxOrder));
        this._fixedOrder = config.order !== undefined;
        this._selectedOrder = config.order ?? this._minOrder;
        this._maxCachedTiles = config.maxCachedTiles ?? this._maxCachedTiles;
        // color: prefer explicit config, then properties.mesh_color, then default
        if (config.color) {
            this._color = config.color;
        }
        else if (this._propertiesMap.has('mesh_color')) {
            const raw = this._propertiesMap.get('mesh_color') || '';
            const parts = raw.split(/[,\s]+/).map((v) => Number(v)).filter(Number.isFinite);
            if (parts.length >= 3) {
                let [r, g, b, a] = parts;
                if (r > 1 || g > 1 || b > 1) {
                    // assume 0-255 range
                    r = r / 255;
                    g = g / 255;
                    b = b / 255;
                }
                if (!Number.isFinite(a))
                    a = 1;
                this._color = [r, g, b, a];
            }
        }
        else {
            this._color = this._color;
        }
        this._wireframe = config.wireframe ?? this._wireframe;
        this._selectedOrder = this.clampOrder(this._selectedOrder);
        // mesh radius: prefer explicit value from config, otherwise read mandatory property
        if (Number.isFinite(config.meshRadius)) {
            this._meshRadius = config.meshRadius;
        }
        else {
            const radiusFromProps = this.readNumber('mesh_radius', NaN);
            if (!Number.isFinite(radiusFromProps)) {
                throw new Error('Missing mandatory property "mesh_radius" in MeshHiPS properties');
            }
            this._meshRadius = radiusFromProps;
        }
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
    get fixedOrder() {
        return this._fixedOrder;
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
    get meshRadius() {
        return this._meshRadius;
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
