export type ColorMapName = 'grayscale' | 'native' | 'planck' | 'cmb' | 'rainbow' | 'eosb' | 'cubehelix' | 'hot' | 'gray';
export interface ColorMap {
    name: string;
    r: Float32Array;
    g: Float32Array;
    b: Float32Array;
}
export declare const COLOR_MAP_SAMPLE_COUNT = 256;
type ColorChannelSamples = {
    r: number[];
    g: number[];
    b: number[];
};
export declare function createColorMapFromSamples(name: string, channels: ColorChannelSamples): ColorMap;
export declare const ColorMaps: Record<ColorMapName, ColorMap>;
export default ColorMaps;
