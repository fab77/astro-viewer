export class TapRepo {
    _adqlFunctionList;
    _cataloguesList;
    _observationsList;
    _notClassified;
    _activeObservations;
    _activeCatalogues;
    _tapBaseURL;
    constructor(tapUrl) {
        this._tapBaseURL = tapUrl;
        this._cataloguesList = [];
        this._observationsList = [];
        this._notClassified = [];
        this._activeObservations = [];
        this._activeCatalogues = [];
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
    setCatalogueActive(catalogue) {
        this._activeCatalogues.push(catalogue);
    }
    setObservationActive(observation) {
        this._activeObservations.push(observation);
    }
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
//# sourceMappingURL=TapRepo.js.map