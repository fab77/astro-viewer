'use strict';

import { Healpix } from 'healpixjs';
import { bootSetup } from './Config';
import type { mat4 } from 'gl-matrix';
import Camera from './Camera';

type GL = WebGLRenderingContext | WebGL2RenderingContext;

class Global {
  // --- cached / runtime state ---
  private _pMatrix: mat4 | null;          // projection matrix (perspective)
  private _mvMatrix: mat4 | null;         // model-view matrix (if used)
  private _model: unknown;
  private _camera: Camera | null;
  private _gl: GL | null;
  private _rayPicker: unknown;             // likely a helper; left as unknown
  private _healpix: Record<number, Healpix>;
  private _order: number;

  // --- config/state flags ---
  private _hipsStack?: unknown;
  private _baseUrl: string;
  private _selectionnside: number;
  private _healpix4footprints: boolean;
  private _showConvexPolygons: boolean;
  private _showPointsInPolygons: boolean;
  private _defaultHips: unknown | null;
  private _blendMode: boolean;

  private _useCORSProxy: boolean;
  private _corsProxyUrl: string;
  private _maxDecimals: number;
  private _debug: boolean;
  private _insideSphere: boolean;
  private _version: string;

  // public constant (kept as in JS)
  public HIPS_REF_ORDER: number;

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

  init(): void {
    console.log('Global.init()');
  }

  // --- getters/setters ---

  get version(): string { return this._version; }

  set corsProxyUrl(url: string) { this._corsProxyUrl = url; }
  get corsProxyUrl(): string { return this._corsProxyUrl; }

  get useCORSProxy(): boolean { return this._useCORSProxy; }
  set useCORSProxy(enabled: boolean) { this._useCORSProxy = enabled; }

  get debug(): boolean { return this._debug; }

  getHealpix(order: number): Healpix {
    if (this._healpix[order] === undefined) {
      // order is HEALPix "order" ⇒ nside = 2^order
      this._healpix[order] = new Healpix(Math.pow(2, order));
    }
    return this._healpix[order];
  }

  get MAX_DECIMALS(): number { return this._maxDecimals; }

  get pMatrix(): mat4 | null { return this._pMatrix; }
  set pMatrix(in_pMatrix: mat4 | null) { this._pMatrix = in_pMatrix; }

  get mvMatrix(): mat4 | null { return this._mvMatrix; }
  set mvMatrix(in_mvMatrix: mat4 | null) { this._mvMatrix = in_mvMatrix; }

  get model(): unknown { return this._model; }
  set model(in_model: unknown) { this._model = in_model; }

  get camera(): Camera | null { return this._camera; }
  set camera(in_camera: Camera | null) { this._camera = in_camera; }

  get gl(): GL | null { return this._gl; }
  set gl(in_gl: GL | null) { this._gl = in_gl; }

  get rayPicker(): unknown { return this._rayPicker; }
  set rayPicker(in_rayPicker: unknown) { this._rayPicker = in_rayPicker; }

  set order(in_order: number) { this._order = in_order; }
  get order(): number { return this._order; }

  set insideSphere(v: boolean) { this._insideSphere = v; }
  get insideSphere(): boolean { return this._insideSphere; }

  get baseUrl(): string { return this._baseUrl; }
  get nsideForSelection(): number { return this._selectionnside; }
  get healpix4footprints(): boolean { return this._healpix4footprints; }
  get showConvexPolygons(): boolean { return this._showConvexPolygons; }
  get showPointsInPolygons(): boolean { return this._showPointsInPolygons; }
  get blendMode(): boolean { return this._blendMode; }

  // Config passthroughs
  getConfig_cameraFovDeg(): number { return bootSetup.camera_fov; }
  getConfig_nearPlane(): number { return bootSetup.camera_near_plane; }
  getConfig_cameraFarPlane(): number { return bootSetup.camera_far_plane; }
}

const global = new Global();
export default global;