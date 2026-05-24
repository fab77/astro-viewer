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
import { ColumnType } from "./MetadataColumn.js";
export class MetadataManager {
    static STANDARD_SIZE = "STANDARD_SIZE";
    static STANDARD_HUE = "STANDARD_HUE";
    _outlineColumnList = [];
    _raColumnList = [];
    _decColumnList = [];
    _shapeColumnList = [];
    _hueColumnList = [];
    _selectedOutlineColumn;
    _selectedRaColumn;
    _selectedDecColumn;
    _selectedShapeColumn;
    _selectedHueColumn;
    _selectedNameColumn;
    _columns = [];
    constructor(metadataColumns) {
        metadataColumns.forEach(c => {
            if (c.columnType == ColumnType.NUMBER) {
                this.addHueColumn(c);
                this.addShapeColumn(c);
            }
            if (c.columnType == ColumnType.GEOM_RA) {
                this.addRaColumn(c);
            }
            if (c.columnType == ColumnType.GEOM_DEC) {
                this.addDecColumn(c);
            }
            if (c.columnType == ColumnType.GEOM_FOOTPRINT) {
                this.addOutlineColumn(c);
            }
            if (c.columnType == ColumnType.MAIN_NAME) {
                this._selectedNameColumn = c;
            }
            this._columns.push(c);
        });
        // if (!this._selectedNameColumn) {
        //     throw new Error("No name column found")
        // }
    }
    addOutlineColumn(outlineColumn) {
        this._outlineColumnList.push(outlineColumn);
        this._selectedOutlineColumn = outlineColumn;
    }
    addRaColumn(column) {
        this._selectedRaColumn = this._selectedRaColumn || column;
        this._raColumnList.push(column);
    }
    addDecColumn(column) {
        this._selectedDecColumn = this._selectedDecColumn || column;
        this._decColumnList.push(column);
    }
    addHueColumn(column) {
        this._hueColumnList.push(column);
    }
    addShapeColumn(column) {
        this._shapeColumnList.push(column);
    }
    get selectedRaColumn() {
        return this._selectedRaColumn;
    }
    get selectedDecColumn() {
        return this._selectedDecColumn;
    }
    get selectedHueColumn() {
        return this._selectedHueColumn;
    }
    get selectedShapeColumn() {
        return this._selectedShapeColumn;
    }
    get selectedOutlineColumn() {
        return this._selectedOutlineColumn;
    }
    get selectedNameColumn() {
        return this._selectedNameColumn;
    }
    get columns() {
        return this._columns;
    }
    get raColumnList() {
        return this._raColumnList;
    }
    get decColumnList() {
        return this._decColumnList;
    }
    get outlineColumnList() {
        return this._outlineColumnList;
    }
    get hueColumnList() {
        return this._hueColumnList;
    }
    get shapeColumnList() {
        return this._shapeColumnList;
    }
    set selectedRaColumn(columnName) {
        this._selectedRaColumn = this._raColumnList.find(c => c.name === columnName) || this._selectedRaColumn;
    }
    set selectedDecColumn(columnName) {
        this._selectedDecColumn = this._decColumnList.find(c => c.name === columnName) || this._selectedDecColumn;
    }
    set selectedOutlineColumn(columnName) {
        this._selectedOutlineColumn = this._outlineColumnList.find(c => c.name === columnName) || this._selectedOutlineColumn;
    }
    set selectedHueColumn(columnName) {
        this._selectedHueColumn = this._hueColumnList.find(c => c.name === columnName);
    }
    set selectedShapeColumn(columnName) {
        this._selectedShapeColumn = this._shapeColumnList.find(c => c.name === columnName);
    }
    set selectedNameColumn(columnName) {
        this._selectedNameColumn = this._columns.find(c => c.name === columnName);
    }
    resetShapeColumn() {
        this._selectedShapeColumn = undefined;
    }
    resetHueColumn() {
        this._selectedHueColumn = undefined;
    }
}
