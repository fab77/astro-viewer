'use strict'

// import eventBus from '../events/EventBus.js'
// import HiPSSelectedEvent from '../events/HiPSSelectedEvent.js'
import Catalogue from '../model/Catalogue.js'
import Source from '../model/Source.js'

class Session {
  _tapRepoList
  _activeFootprintsCatalogues
  _activeSourceCatalogues
  _activeHiPS
  _hoveredFootprints
  _hoveredSources

  constructor() {
    this._tapRepoList = []
    this._activeSourceCatalogues = []
    this._activeFootprintsCatalogues = []
    this._activeHiPS = []
    this._hoveredFootprints = new Map()
    this._hoveredSources = new Map()
  }

  get tapRepoList() {
    return this._tapRepoList
  }

  /**
   *
   * @param {Catalogue} catalogue
   * @param {Source} sources
   */
  updateHoveredSources(catalogue, sources) {
    this._hoveredSources.set(catalogue, sources)
  }

  get hoveredSources() {
    return this._hoveredSources
  }

  clearHoveredSources() {
    this._hoveredSources = new Map()
  }

  /**
   * @param {Footprint[]} footprints
   * @param {FootprintSet} footprintSetName
   */
  updateHoveredFootprints(footprintSet, footprints) {
    this._hoveredFootprints.set(footprintSet, footprints)
  }

  get hoveredFootprints() {
    return this._hoveredFootprints
  }

  clearHoveredFootprints() {
    this._hoveredFootprints = new Map()
  }

  addTapRepo(tapRepo) {
    this._tapRepoList.push(tapRepo)
  }

  clearTapRepoList() {
    this._tapRepoList = []
  }

  activateCatalogue(catalogue) {
    this._activeSourceCatalogues.push(catalogue)
  }

  deactivateCatalogue(catalogue) {
    for (let i = 0; i < this._activeSourceCatalogues.length; i++) {
      if (this._activeSourceCatalogues[i] == catalogue) {
        this._activeSourceCatalogues[i].clearSources()
        this._activeSourceCatalogues.splice(i, 1)
        break
      }
    }
  }

  activateFootprintSet(fset) {
    this._activeFootprintsCatalogues.push(fset)
  }

  deactivateFootprintSet(fset) {
    for (let i = 0; i < this._activeFootprintsCatalogues.length; i++) {
      if (this._activeFootprintsCatalogues[i] == fset) {
        this._activeFootprintsCatalogues[i].clearFootprints()
        this._activeFootprintsCatalogues.splice(i, 1)
        break
      }
    }
  }

  // activateHiPS(hips) {
  //   this._activeHiPS.push(hips)
  //   eventBus.fireEvent(new HiPSSelectedEvent(hips))
  // }

  // deactivateHiPS(hips) {
  //   for (let i = 0; i < this._activeHiPS.length; i++) {
  //     if (this._activeHiPS[i] == hips) {
  //       this._activeHiPS.splice(i, 1)
  //       break
  //     }
  //   }
  // }

  get activeFSets() {
    return this._activeFootprintsCatalogues
  }

  get activeCatSets() {
    return this._activeSourceCatalogues
  }

  get activeHiPS() {
    return this._activeHiPS
  }
}

export const session = new Session()
