type GridLabelLayer = 'healpix' | 'equatorial' | 'lonlat';
export type GridLabelContainers = {
    coords?: HTMLElement | null;
    healpix?: HTMLElement | null;
    resolveCoords?: () => HTMLElement | null | undefined;
    resolveHealpix?: () => HTMLElement | null | undefined;
};
declare class GridTextHelper {
    private layer;
    private state;
    private containers?;
    constructor(layer?: GridLabelLayer, containers?: GridLabelContainers);
    initHtml(): void;
    resetDivSets(layer?: GridLabelLayer): void;
    addHPXDivSet(msg: string, x: number, y: number): void;
    addEqDivSet(msg: string, x: number, y: number, type: 'ra' | 'dec'): void;
    addLonLatDivSet(msg: string, x: number, y: number, type: 'lon' | 'lat'): void;
    private addLabel;
    private colorForKind;
    private classNameForKind;
    private resolveContainer;
    private refreshContainer;
}
export default GridTextHelper;
