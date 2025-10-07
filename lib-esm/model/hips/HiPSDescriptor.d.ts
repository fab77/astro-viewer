export interface HiPSDataRange {
    min: number | undefined;
    max: number | undefined;
}
export type HiPSFrame = 'equatorial' | 'galactic' | string;
export declare class HiPSDescriptor {
    private _minOrder;
    private _imgformats;
    private _datarange;
    private _maxOrder;
    private _tilewidth;
    private _hipsFrame;
    private _hipsName;
    private _hipsurl;
    private _emMin;
    private _emMax;
    private _isGalctic;
    constructor(hipsproperties: string, hipsurl: string);
    private getValue;
    get surveyName(): string;
    get url(): string;
    get maxOrder(): number;
    get minOrder(): number;
    get imgFormats(): string[];
    get hipsFrame(): HiPSFrame;
    get isGalactic(): boolean;
    get emMin(): number | undefined;
    get emMax(): number | undefined;
    get tileWidth(): number | undefined;
    get dataRange(): HiPSDataRange;
}
//# sourceMappingURL=HiPSDescriptor.d.ts.map