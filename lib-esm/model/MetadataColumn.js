'use strict';
export var ColumnType;
(function (ColumnType) {
    ColumnType["STRING"] = "STRING";
    ColumnType["NUMBER"] = "NUMBER";
    ColumnType["GEOM_RA"] = "GEOM_RA";
    ColumnType["GEOM_DEC"] = "GEOM_DEC";
    ColumnType["GEOM_FOOTPRINT"] = "GEOM_FOOTPRINT";
    ColumnType["MAIN_NAME"] = "MAIN_NAME";
})(ColumnType || (ColumnType = {}));
export class MetadataColumn {
    _index; // mandatory
    _name; // mandatory
    _description = ""; // mandatory default ""
    _columnType; // mandatory
    _unit; // mandatory
    _details = new Map();
    constructor(init) {
        if (!init.name)
            throw new Error(`No name column defined.`);
        this._name = init.name;
        if (init.index < 0 || isNaN(init.index))
            throw new Error(`No index column defined.`);
        this._index = init.index;
        this._columnType = init.columnType ?? ColumnType.STRING;
        this._unit = init.unit ?? "";
        this._description = init.description ?? "";
        if (init.details)
            this._details = new Map(init.details);
    }
    get details() {
        return new Map(this._details);
    }
    /** Get any detail; optional fallback. */
    getDetail(key, fallback) {
        return this._details.has(key) ? this._details.get(key) : fallback;
    }
    /** Type-leaning getters with fallbacks. */
    getString(key, fallback = "") {
        const v = this._details.get(key);
        return typeof v === "string" ? v : fallback;
    }
    getNumber(key, fallback = NaN) {
        const v = this._details.get(key);
        return typeof v === "number" ? v : fallback;
    }
    /** Set or update a detail. */
    setDetail(key, value) {
        this._details.set(key, value);
    }
    /** Add many details at once. */
    setDetails(details) {
        const entries = details instanceof Map ? details.entries() : Object.entries(details);
        for (const [k, v] of entries)
            this._details.set(k, v);
    }
    /** Keys, values, entries (as arrays). */
    detailKeys() {
        return Array.from(this._details.keys());
    }
    detailValues() {
        return Array.from(this._details.values());
    }
    detailEntries() {
        return Array.from(this._details.entries());
    }
    // ---------- core getters/setters ----------
    get name() {
        return this._name;
    }
    get description() {
        return this._description;
    }
    get columnType() {
        return this._columnType;
    }
    get index() {
        return this._index;
    }
    get unit() {
        return this._unit;
    }
    // ---------- serialisation ----------
    toJSON() {
        return {
            name: this._name,
            description: this._description,
            columnType: this._columnType,
            index: this._index,
            unit: this._unit,
            details: Object.fromEntries(this._details),
        };
    }
}
//# sourceMappingURL=MetadataColumn.js.map