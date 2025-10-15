import { Healpix } from 'healpixjs';
import Camera from './Camera.js';
type GL = WebGLRenderingContext | WebGL2RenderingContext;
declare class Global {
    private _camera;
    private _gl;
    private _healpix;
    private _selectionnside;
    private _healpix4footprints;
    private _useCORSProxy;
    private _corsProxyUrl;
    private _maxDecimals;
    private _debug;
    private _insideSphere;
    private _version;
    HIPS_REF_ORDER: number;
    constructor();
    init(): void;
    get version(): string;
    set corsProxyUrl(url: string);
    get corsProxyUrl(): string;
    get useCORSProxy(): boolean;
    set useCORSProxy(enabled: boolean);
    get debug(): boolean;
    getHealpix(order: number): Healpix;
    get MAX_DECIMALS(): number;
    get camera(): Camera | null;
    set camera(in_camera: Camera | null);
    get gl(): GL | null;
    set gl(in_gl: GL | null);
    set insideSphere(v: boolean);
    get insideSphere(): boolean;
    get nsideForSelection(): number;
    get healpix4footprints(): boolean;
}
declare const global: Global;
export default global;
//# sourceMappingURL=Global.d.ts.map