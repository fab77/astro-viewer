'use strict';
import { Healpix } from 'healpixjs';
import { bootSetup } from './Config.js';
class Global {
    // --- cached / runtime state ---
    _pMatrix; // projection matrix (perspective)
    _mvMatrix; // model-view matrix (if used)
    _model;
    _camera;
    _gl;
    _rayPicker; // likely a helper; left as unknown
    _healpix;
    _order;
    // --- config/state flags ---
    _hipsStack;
    _baseUrl;
    _selectionnside;
    _healpix4footprints;
    _showConvexPolygons;
    _showPointsInPolygons;
    _defaultHips;
    _blendMode;
    _useCORSProxy;
    _corsProxyUrl;
    _maxDecimals;
    _debug;
    _insideSphere;
    _version;
    // public constant (kept as in JS)
    HIPS_REF_ORDER;
    constructor() {
        this.HIPS_REF_ORDER = 6;
        this._useCORSProxy = bootSetup.useCORSProxy;
        this._corsProxyUrl = bootSetup.corsProxyUrl;
        this._maxDecimals = bootSetup.maxDecimals;
        this._debug = bootSetup.debug;
        this._insideSphere = bootSetup.insideView;
        this._version = bootSetup.version;
        this._pMatrix = null;
        this._mvMatrix = null;
        this._model = null;
        this._camera = null;
        this._gl = null;
        this._rayPicker = null;
        this._healpix = {};
        this._order = 3;
        this._selectionnside = 32;
        this._baseUrl = 'http://skyint.esac.esa.int/esasky-tap/';
        this._healpix4footprints = false;
        this._showConvexPolygons = false;
        this._showPointsInPolygons = false;
        this._defaultHips = null;
        this._blendMode = false;
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
    get pMatrix() { return this._pMatrix; }
    set pMatrix(in_pMatrix) { this._pMatrix = in_pMatrix; }
    get mvMatrix() { return this._mvMatrix; }
    set mvMatrix(in_mvMatrix) { this._mvMatrix = in_mvMatrix; }
    get model() { return this._model; }
    set model(in_model) { this._model = in_model; }
    get camera() { return this._camera; }
    set camera(in_camera) { this._camera = in_camera; }
    get gl() { return this._gl; }
    set gl(in_gl) { this._gl = in_gl; }
    get rayPicker() { return this._rayPicker; }
    set rayPicker(in_rayPicker) { this._rayPicker = in_rayPicker; }
    set order(in_order) { this._order = in_order; }
    get order() { return this._order; }
    set insideSphere(v) { this._insideSphere = v; }
    get insideSphere() { return this._insideSphere; }
    get baseUrl() { return this._baseUrl; }
    get nsideForSelection() { return this._selectionnside; }
    get healpix4footprints() { return this._healpix4footprints; }
    get showConvexPolygons() { return this._showConvexPolygons; }
    get showPointsInPolygons() { return this._showPointsInPolygons; }
    get blendMode() { return this._blendMode; }
    // Config passthroughs
    getConfig_cameraFovDeg() { return bootSetup.camera_fov; }
    getConfig_nearPlane() { return bootSetup.camera_near_plane; }
    getConfig_cameraFarPlane() { return bootSetup.camera_far_plane; }
}
const global = new Global();
export default global;
//# sourceMappingURL=Global.js.map