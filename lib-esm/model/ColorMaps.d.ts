export type ColorMapName = 'grayscale' | 'native' | 'planck' | 'cmb' | 'rainbow' | 'eosb' | 'cubehelix' | 'hot' | 'gray';
export interface ColorMap {
    name: ColorMapName;
    r: Float32Array;
    g: Float32Array;
    b: Float32Array;
}
export declare const ColorMaps: Record<ColorMapName, ColorMap>;
export default ColorMaps;
//# sourceMappingURL=ColorMaps.d.ts.map