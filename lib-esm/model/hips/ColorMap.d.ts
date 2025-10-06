/**
 * @author Fabrizio Giordano (Fab77)
 * Enum for coordinate types.
 * @readonly
 * @enum {{name: string, hex: string}}
 */
declare class ColorMap {
    PLANCK: {
        r: Float32Array<ArrayBuffer>;
        g: Float32Array<ArrayBuffer>;
        b: Float32Array<ArrayBuffer>;
    };
    RAINBOW: {
        r: Float32Array<ArrayBuffer>;
        g: Float32Array<ArrayBuffer>;
        b: Float32Array<ArrayBuffer>;
    };
    CMB: {
        r: Float32Array<ArrayBuffer>;
        g: Float32Array<ArrayBuffer>;
        b: Float32Array<ArrayBuffer>;
    };
    CUBEHELIX: {
        r: Float32Array<ArrayBuffer>;
        g: Float32Array<ArrayBuffer>;
        b: Float32Array<ArrayBuffer>;
    };
    EOSB: {
        r: Float32Array<ArrayBuffer>;
        g: Float32Array<ArrayBuffer>;
        b: Float32Array<ArrayBuffer>;
    };
}
export declare const colorMap: ColorMap;
export {};
//# sourceMappingURL=ColorMap.d.ts.map