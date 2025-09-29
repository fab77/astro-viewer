'use strict'

import Catalogue from '../model/catalogues/CatalogueGL.js'
import Source from '../model/Source.js'
// If you have concrete classes for footprints/sets, import them and swap the aliases below.
import FootprintSet from '../model/footprints/FootprintSetGL.js'
import Footprint from '../model/footprints/Footprint.js'
import HiPS from '../model/hips/HiPS.js'
import TapRepo from '../services/tap/TapRepo.js'
import global from '../Global.js'
// import { HiPSSelectedEvent } from '../events/HiPSSelectedEvent.js'
// import eventBus from '../events/EventBus.js'

/**
 * Session class to track active catalogues, footprints, HiPS, and TAP repositories.
 */
class Session {
  private _tapRepoList: TapRepo[]
  private _activeFootprintsCatalogues: FootprintSet[]
  private _activeSourceCatalogues: Catalogue[]
  private _activeHiPS: HiPS[]
  private _hoveredFootprints: Map<FootprintSet, Footprint[]>
  private _hoveredSources: Map<Catalogue, Source[]>

  constructor() {
    this._tapRepoList = []
    this._activeSourceCatalogues = []
    this._activeFootprintsCatalogues = []
    this._activeHiPS = []
    this._hoveredFootprints = new Map()
    this._hoveredSources = new Map()
  }

  get tapRepoList(): TapRepo[] {
    return this._tapRepoList
  }

  /**
   * Track hovered sources for a catalogue.
   */
  updateHoveredSources(catalogue: Catalogue, sources: Source[]): void {
    this._hoveredSources.set(catalogue, sources)
  }

  get hoveredSources(): Map<Catalogue, Source[]> {
    return this._hoveredSources
  }

  clearHoveredSources(): void {
    this._hoveredSources = new Map()
  }

  /**
   * Track hovered footprints for a footprint set.
   */
  updateHoveredFootprints(footprintSet: FootprintSet, footprints: Footprint[]): void {
    this._hoveredFootprints.set(footprintSet, footprints)
  }

  get hoveredFootprints(): Map<FootprintSet, Footprint[]> {
    return this._hoveredFootprints
  }

  clearHoveredFootprints(): void {
    this._hoveredFootprints = new Map()
  }

  addTapRepo(tapRepo: TapRepo): void {
    this._tapRepoList.push(tapRepo)
  }

  clearTapRepoList(): void {
    this._tapRepoList = []
  }

  activateCatalogue(catalogue: Catalogue): void {
    this._activeSourceCatalogues.push(catalogue)
  }

  deactivateCatalogue(catalogue: Catalogue): void {
    const i = this._activeSourceCatalogues.indexOf(catalogue)
    if (i >= 0) {
      this._activeSourceCatalogues[i].clearSources()
      this._activeSourceCatalogues.splice(i, 1)
    }
  }

  activateFootprintSet(fset: FootprintSet): void {
    this._activeFootprintsCatalogues.push(fset)
  }

  deactivateFootprintSet(fset: FootprintSet): void {
    const i = this._activeFootprintsCatalogues.indexOf(fset)
    if (i >= 0) {
      // assumes FootprintSet implements clearFootprints()
      this._activeFootprintsCatalogues[i].clearFootprints()
      this._activeFootprintsCatalogues.splice(i, 1)
    }
  }

  // activateHiPS(hips: HiPS): void {
  //   this._activeHiPS.push(hips)
  //   eventBus.fireEvent(new HiPSSelectedEvent(hips))
  // }

  // deactivateHiPS(hips: HiPS): void {
  //   const i = this._activeHiPS.indexOf(hips)
  //   if (i >= 0) this._activeHiPS.splice(i, 1)
  // }

  get activeFSets(): FootprintSet[] {
    return this._activeFootprintsCatalogues
  }

  get activeCatSets(): Catalogue[] {
    return this._activeSourceCatalogues
  }

  get activeHiPS(): HiPS[] {
    return this._activeHiPS
  }
}

export const session = new Session()
export default Session