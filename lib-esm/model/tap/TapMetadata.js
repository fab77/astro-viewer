'use strict';
/**
 * @author Fabrizio Giordano (Fab77)
 */
export class TapMetadata {
    _name;
    _description;
    _unit;
    _dataType;
    _ucd;
    _uType;
    _index;
    /**
     *
     * @param name - column name
     * @param description - column description
     * @param unit - physical unit
     * @param datatype - ADQL datatype
     * @param ucd - Unified Content Descriptor
     * @param utype - ObsCore / STC-S type
     */
    constructor(name, description, unit, datatype, ucd, utype) {
        this._name = name;
        this._description = description;
        this._unit = unit;
        this._dataType = datatype;
        this._ucd = ucd;
        this._uType = utype;
    }
    get name() {
        return this._name;
    }
    get description() {
        return this._description;
    }
    get unit() {
        return this._unit;
    }
    get datatype() {
        return this._dataType;
    }
    get ucd() {
        return this._ucd;
    }
    get uType() {
        return this._uType;
    }
    get index() {
        return this._index;
    }
    set index(idx) {
        this._index = idx;
    }
}
