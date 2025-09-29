/**
 * @author Fabrizio Giordano (Fab77)
 */
import CatalogueGL from '../../model/catalogues/CatalogueGL.js'
import FootprintSetGL from '../../model/footprints/FootprintSetGL.js'

export type ADQLFunction = string | { name: string; signature?: string; doc?: string }

export default class TapRepo {
  private _adqlFunctionList: ADQLFunction[]

  private _cataloguesList: CatalogueGL[]
  private _observationsList: FootprintSetGL[]
  private _notClassified: unknown[]

  private _activeObservations: FootprintSetGL[]
  private _activeCatalogues: CatalogueGL[]

  private _tapBaseURL: string

  constructor(tapUrl: string) {
    this._tapBaseURL = tapUrl

    this._cataloguesList = []
    this._observationsList = []
    this._notClassified = []

    this._activeObservations = []
    this._activeCatalogues = []

    this._adqlFunctionList = []
  }

  get tapBaseUrl(): string {
    return this._tapBaseURL
  }

  setCataloguesList(cataloguesList: CatalogueGL[]): void {
    this._cataloguesList = cataloguesList
  }

  setObservationsList(observationList: FootprintSetGL[]): void {
    this._observationsList = observationList
  }

  setNotClassifiedList(notClassifiedList: unknown[]): void {
    this._notClassified = notClassifiedList
  }

  setCatalogueActive(catalogue: CatalogueGL): void {
    this._activeCatalogues.push(catalogue)
  }

  setObservationActive(observation: FootprintSetGL): void {
    this._activeObservations.push(observation)
  }

  get cataloguesList(): CatalogueGL[] {
    return this._cataloguesList
  }

  get observationsList(): FootprintSetGL[] {
    return this._observationsList
  }

  set adqlFunctionList(adqlFunctionList: ADQLFunction[] | undefined) {
    if (adqlFunctionList !== undefined) {
      this._adqlFunctionList = adqlFunctionList
    }
  }

  get adqlFunctionList(): ADQLFunction[] {
    return this._adqlFunctionList
  }
}