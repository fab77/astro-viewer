// HiPSDescriptor.ts
'use strict';
export class HiPSDescriptor {
    _minOrder = 3;
    _imgformats = [];
    _datarange = { min: undefined, max: undefined };
    _maxOrder;
    _tilewidth;
    _hipsFrame;
    _hipsName = 'NONAME';
    _hipsurl;
    _emMin;
    _emMax;
    _isGalctic = false;
    _propertiesRawText;
    constructor(hipsproperties, hipsurl) {
        this._hipsurl = hipsurl;
        this._propertiesRawText = hipsproperties;
        const lines = hipsproperties.split(/\r\n|\n/);
        for (const raw of lines) {
            const line = raw.trim();
            if (!line || line.startsWith('#'))
                continue;
            if (line.startsWith('hips_tile_format') || line.startsWith('format')) {
                // normalize jpeg→jpg
                const list = this.getValue(line)?.replace(/jpeg/gi, 'jpg') ?? '';
                this._imgformats = list.split(/\s+/).filter(Boolean);
            }
            else if (line.startsWith('hips_data_range')) {
                const v = this.getValue(line);
                if (v) {
                    const [minStr, maxStr] = v.split(/\s+/);
                    this._datarange.min = parseFloat(minStr);
                    this._datarange.max = parseFloat(maxStr);
                }
            }
            else if (line.startsWith('hips_tile_width')) {
                const n = Number(this.getValue(line));
                this._tilewidth = Number.isFinite(n) ? n : undefined;
            }
            else if (line.startsWith('hips_order_min')) {
                const n = Number(this.getValue(line));
                this._minOrder = Number.isFinite(n) ? n : this._minOrder;
            }
            else if (line.startsWith('hips_order') || line.startsWith('maxOrder')) {
                const n = Number(this.getValue(line));
                this._maxOrder = Number.isFinite(n) ? n : this._maxOrder;
            }
            else if (line.startsWith('hips_frame') || line.startsWith('frame')) {
                this._hipsFrame = this.getValue(line);
            }
            else if (line.startsWith('obs_collection') || line.startsWith('label')) {
                this._hipsName = this.getValue(line) ?? this._hipsName;
            }
            else if (line.startsWith('em_min')) {
                const n = Number(this.getValue(line));
                this._emMin = Number.isFinite(n) ? n : undefined;
            }
            else if (line.startsWith('em_max')) {
                const n = Number(this.getValue(line));
                this._emMax = Number.isFinite(n) ? n : undefined;
            }
        }
        if (!this._hipsName) {
            console.warn(`[HiPSDescriptor] hipsName not defined in properties of ${this._hipsurl}. Defaulting to 'NONAME'.`);
        }
        if (!this._hipsFrame) {
            console.warn(`[HiPSDescriptor] hips_frame not defined in properties of ${this._hipsurl}. Defaulting to 'equatorial'.`);
            this._hipsFrame = 'equatorial';
        }
        this._isGalctic = this._hipsFrame.toLowerCase().includes('gal');
        if (this._maxOrder === undefined || this._imgformats.length === 0) {
            throw new Error(`[HiPSDescriptor] Invalid properties for ${this._hipsurl}. maxOrder=${this._maxOrder}, imgFormats.length=${this._imgformats.length}`);
        }
    }
    getValue(line) {
        const idx = line.indexOf('=');
        if (idx < 0)
            return undefined;
        return line.slice(idx + 1).trim();
    }
    // --- Getters ---
    get propertiesRawText() {
        return this._propertiesRawText;
    }
    get surveyName() {
        return this._hipsName;
    }
    get url() {
        return this._hipsurl;
    }
    get maxOrder() {
        return this._maxOrder;
    }
    get minOrder() {
        return this._minOrder;
    }
    get imgFormats() {
        return this._imgformats;
    }
    get hipsFrame() {
        return this._hipsFrame;
    }
    get isGalactic() {
        return this._isGalctic;
    }
    get emMin() {
        return this._emMin;
    }
    get emMax() {
        return this._emMax;
    }
    get tileWidth() {
        return this._tilewidth;
    }
    get dataRange() {
        return this._datarange;
    }
}
//# sourceMappingURL=HiPSDescriptor.js.map