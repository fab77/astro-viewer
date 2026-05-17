import { AbstractSkyEntity, SkyEntityDrawInput } from "../AbstractSkyEntity.js";
import { XYZMapDescriptor } from "./XYZMapDescriptor.js";
import { ColorMap } from "../ColorMaps.js";
export declare class XYZMap extends AbstractSkyEntity {
    private _xyzShaderProgram;
    private _descriptor;
    private _visibleTilesManager;
    private _tileBuffer;
    private _meshBuilder;
    private _baseurl;
    private _zoom;
    private _latLonGrid;
    private _colorMapIdx;
    private _colorMap;
    constructor(radius: number, position: [number, number, number], xrad: number, yrad: number, descriptor: XYZMapDescriptor, webgl: WebGL2RenderingContext);
    changeColorMap(colorMap: ColorMap): void;
    private initShaders;
    isLonLatGridVisible(): boolean;
    toggleLonLatGrid(): boolean;
    private refresh;
    draw(input: SkyEntityDrawInput): void;
    private createTile;
    private getTilesToEnsure;
    private findBestAvailableAncestor;
    private resolveTileUrl;
    private tileKey;
}
