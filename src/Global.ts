'use strict';

import { Healpix } from 'healpixjs';
import { bootSetup } from './Config.js';
// import Camera from './Camera.js';

type GL = WebGLRenderingContext | WebGL2RenderingContext;

class Global {
  // --- cached / runtime state ---
  // private _camera: Camera | null;
  // private _gl: GL | null;
  private _healpix: Record<number, Healpix>;

  // --- config/state flags ---
  private _selectionnside: number;
  // private _healpix4footprints: boolean;

  private _useCORSProxy: boolean;
  private _corsProxyUrl: string;
  private _maxDecimals: number;
  private _debug: boolean;
  private _insideSphere: boolean;
  private _version: string;

  constructor() {

    this._useCORSProxy = bootSetup.useCORSProxy;
    this._corsProxyUrl = bootSetup.corsProxyUrl;
    this._maxDecimals = bootSetup.maxDecimals;
    this._debug = bootSetup.debug;
    this._insideSphere = bootSetup.insideView;
    this._version = bootSetup.version;

    this._healpix = {};

    this._selectionnside = 32;
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

  set insideSphere(v: boolean) { this._insideSphere = v; }
  get insideSphere(): boolean { return this._insideSphere; }

  get nsideForSelection(): number { return this._selectionnside; }
  
}

const global = new Global();
export default global;