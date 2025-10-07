interface VisibleTiles {
    pixels: number[];
    order: number;
}
declare class VisibleTilesManager {
    private _visibleTilesByOrder;
    private _ancestorsMap;
    private initialised;
    private _galVisibleTilesByOrder;
    private _galAncestorsMap;
    private _galacticMatrixInverted;
    private _galacticMatrix;
    constructor();
    init(): void;
    getVisibleOrder(): number;
    computeVisiblePixels(): void;
    get visibleTilesByOrder(): VisibleTiles;
    get ancestorsMap(): Map<number, number[]>;
    get galVisibleTilesByOrder(): VisibleTiles;
    get galAncestorsMap(): Map<number, number[]>;
    get visibleOrder(): number;
}
export declare const visibleTilesManager: VisibleTilesManager;
export {};
//# sourceMappingURL=VisibleTilesManager.d.ts.map