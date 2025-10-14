/**
 * @author Fabrizio Giordano (Fab77)
 */
import AbstractSkyEntity from '../AbstractSkyEntity.js';
import { ColorMap } from '../ColorMaps.js';
import { HiPSDescriptor } from './HiPSDescriptor.js';
declare class HiPS extends AbstractSkyEntity {
    private _ancestorTiles;
    private _allSkyTile;
    private _format;
    private _baseurl;
    private _maxorder;
    private _minorder;
    private _visibleorder;
    private _allSky;
    samplerIdx: number;
    colorMapIdx: number;
    colorMap: ColorMap;
    get maxOrder(): number;
    get minOrder(): number;
    get baseURL(): string;
    get format(): string;
    constructor(radius: number, position: [number, number, number], xrad: number, yrad: number, descriptor: HiPSDescriptor);
    changeFormat(format: string): void;
    /**
     * Shader colormap switcher
     * 0 -> native
     * 1 -> grayscale
     * 2 -> planck
     * 3 -> cmb
     * 4 -> rainbow
     * 5 -> eosb
     * 6 -> cubehelix
     */
    changeColorMap(colorMap: ColorMap): void;
    private initShaders;
    getCurrentHealpixOrder(): number;
    private refresh;
    draw(): void;
}
export default HiPS;
//# sourceMappingURL=HiPS.d.ts.map