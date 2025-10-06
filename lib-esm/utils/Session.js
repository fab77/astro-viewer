'use strict';
// import TapRepo from '../services/tap/TapRepo.js'
// import { HiPSSelectedEvent } from '../events/HiPSSelectedEvent.js'
// import eventBus from '../events/EventBus.js'
/**
 * Session class to track active catalogues, footprints, HiPS, and TAP repositories.
 */
class Session {
    // private _tapRepoList: TapRepo[]
    // private _activeFootprintsCatalogues: FootprintSet[]
    // private _activeSourceCatalogues: Catalogue[]
    _activeHiPS;
    // private _hoveredFootprints: Map<FootprintSet, Footprint[]>
    // private _hoveredSources: Map<Catalogue, Source[]>
    constructor() {
        // this._tapRepoList = []
        // this._activeSourceCatalogues = []
        // this._activeFootprintsCatalogues = []
        this._activeHiPS = [];
        // this._hoveredFootprints = new Map()
        // this._hoveredSources = new Map()
    }
}
export const session = new Session();
export default Session;
//# sourceMappingURL=Session.js.map