'use strict';
import { Healpix } from 'healpixjs';
import { bootSetup } from './Config.js';
class Global {
    // --- cached / runtime state ---
    _camera;
    _gl;
    _healpix;
    // --- config/state flags ---
    _selectionnside;
    // private _healpix4footprints: boolean;
    _useCORSProxy;
    _corsProxyUrl;
    _maxDecimals;
    _debug;
    _insideSphere;
    _version;
    constructor() {
        this._useCORSProxy = bootSetup.useCORSProxy;
        this._corsProxyUrl = bootSetup.corsProxyUrl;
        this._maxDecimals = bootSetup.maxDecimals;
        this._debug = bootSetup.debug;
        this._insideSphere = bootSetup.insideView;
        this._version = bootSetup.version;
        this._camera = null;
        this._gl = null;
        this._healpix = {};
        this._selectionnside = 32;
        // this._healpix4footprints = false;
    }
    init() {
        console.log('Global.init()');
    }
    // --- getters/setters ---
    get version() { return this._version; }
    set corsProxyUrl(url) { this._corsProxyUrl = url; }
    get corsProxyUrl() { return this._corsProxyUrl; }
    get useCORSProxy() { return this._useCORSProxy; }
    set useCORSProxy(enabled) { this._useCORSProxy = enabled; }
    get debug() { return this._debug; }
    getHealpix(order) {
        if (this._healpix[order] === undefined) {
            // order is HEALPix "order" ⇒ nside = 2^order
            this._healpix[order] = new Healpix(Math.pow(2, order));
        }
        return this._healpix[order];
    }
    get MAX_DECIMALS() { return this._maxDecimals; }
    get camera() { return this._camera; }
    set camera(in_camera) { this._camera = in_camera; }
    get gl() { return this._gl; }
    set gl(in_gl) { this._gl = in_gl; }
    set insideSphere(v) { this._insideSphere = v; }
    get insideSphere() { return this._insideSphere; }
    get nsideForSelection() { return this._selectionnside; }
}
const global = new Global();
export default global;
//# sourceMappingURL=Global.js.map