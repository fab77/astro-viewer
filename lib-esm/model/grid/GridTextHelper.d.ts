/**
 * @author Fabrizio Giordano (Fab)
 * @param in_radius - number
 * @param in_gl - GL context
 * @param in_position - array of double e.g. [0.0, 0.0, 0.0]
 */
declare class GridTextHelper {
    private _divEqContainerElement;
    private _divHPXContainerElement;
    private _divSets;
    private _divSetNdx;
    constructor();
    initHtml(): void;
    resetDivSets(): void;
    /**
     * Add / reuse a floating label for HPX coordinates
     */
    addHPXDivSet(msg: string, x: number, y: number): void;
    /**
     * Add / reuse a floating label for Equatorial coords
     * @param type 'ra' or 'dec'
     */
    addEqDivSet(msg: string, x: number, y: number, type: 'ra' | 'dec'): void;
}
export default GridTextHelper;
//# sourceMappingURL=GridTextHelper.d.ts.map