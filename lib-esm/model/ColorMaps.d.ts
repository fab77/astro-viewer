export type ColorMapName = 'grayscale' | 'native' | 'planck' | 'cmb' | 'rainbow' | 'eosb' | 'cubehelix' | 'hot' | 'gray';
export interface ColorMap {
    name: ColorMapName;
    r: number[];
    g: number[];
    b: number[];
}
export declare const ColorMaps: Record<ColorMapName, ColorMap>;
export default ColorMaps;
//# sourceMappingURL=ColorMaps.d.ts.map