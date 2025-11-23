import { Healpix } from 'healpixjs';
declare class Global {
    private _healpix;
    private _selectionnside;
    private _useCORSProxy;
    private _corsProxyUrl;
    private _maxDecimals;
    private _debug;
    private _insideSphere;
    private _version;
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
    set insideSphere(v: boolean);
    get insideSphere(): boolean;
    get nsideForSelection(): number;
}
declare const global: Global;
export default global;
//# sourceMappingURL=Global.d.ts.map