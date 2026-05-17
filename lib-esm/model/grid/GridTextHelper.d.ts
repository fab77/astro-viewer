type GridLabelLayer = 'healpix' | 'equatorial' | 'lonlat';
declare class GridTextHelper {
    private static layers;
    private layer;
    constructor(layer?: GridLabelLayer);
    initHtml(): void;
    resetDivSets(layer?: GridLabelLayer): void;
    addHPXDivSet(msg: string, x: number, y: number): void;
    addEqDivSet(msg: string, x: number, y: number, type: 'ra' | 'dec'): void;
    addLonLatDivSet(msg: string, x: number, y: number, type: 'lon' | 'lat'): void;
    private addLabel;
    private classNameForKind;
    private static getLayerState;
    private static resolveContainer;
}
export default GridTextHelper;
