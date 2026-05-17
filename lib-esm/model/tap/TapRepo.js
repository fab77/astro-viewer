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
export class TapRepo {
    _adqlFunctionList;
    _cataloguesList;
    _observationsList;
    _notClassified;
    // private _activeObservations: FootprintSetGL[]
    // private _activeCatalogues: CatalogueGL[]
    _tapBaseURL;
    constructor(tapUrl) {
        this._tapBaseURL = tapUrl;
        this._cataloguesList = [];
        this._observationsList = [];
        this._notClassified = [];
        // this._activeObservations = []
        // this._activeCatalogues = []
        this._adqlFunctionList = [];
    }
    get tapBaseUrl() {
        return this._tapBaseURL;
    }
    setCataloguesList(cataloguesList) {
        this._cataloguesList = cataloguesList;
    }
    setObservationsList(observationList) {
        this._observationsList = observationList;
    }
    setNotClassifiedList(notClassifiedList) {
        this._notClassified = notClassifiedList;
    }
    // setCatalogueActive(catalogue: CatalogueGL): void {
    //   this._activeCatalogues.push(catalogue)
    // }
    // setObservationActive(observation: FootprintSetGL): void {
    //   this._activeObservations.push(observation)
    // }
    get cataloguesList() {
        return this._cataloguesList;
    }
    get observationsList() {
        return this._observationsList;
    }
    set adqlFunctionList(adqlFunctionList) {
        if (adqlFunctionList !== undefined) {
            this._adqlFunctionList = adqlFunctionList;
        }
    }
    get adqlFunctionList() {
        return this._adqlFunctionList;
    }
}
