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
