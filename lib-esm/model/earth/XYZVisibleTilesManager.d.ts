import { ReadonlyMat4 } from 'gl-matrix';
import Camera from '../../Camera.js';
import { AbstractSkyEntity } from '../AbstractSkyEntity.js';
import type { XYZTileCoord, XYZVisibleTileSelection } from './XYZTypes.js';
export declare class XYZVisibleTilesManager {
    private _ancestorsMap;
    private _visibleTilesMap;
    private _visibleTiles;
    private _selection;
    get ancestorsMap(): Map<string, XYZTileCoord>;
    get visibleTiles(): XYZTileCoord[];
    get visibleTilesMap(): Map<string, XYZTileCoord>;
    get selection(): XYZVisibleTileSelection;
    computeVisibleTiles(z: number, xyzModel: AbstractSkyEntity, webgl: WebGL2RenderingContext, camera: Camera, pMatrix: ReadonlyMat4, sampleCount?: number, padding?: number): XYZVisibleTileSelection;
    private refreshAncestorsMap;
    private buildTileMap;
    private buildSelectionKey;
    private key;
}
