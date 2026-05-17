import { ReadonlyMat4, ReadonlyVec3, vec3 } from 'gl-matrix';
import Camera from '../Camera.js';
import { AbstractSkyEntity } from '../model/AbstractSkyEntity.js';
import type { XYZTileCoord } from '../model/earth/XYZTypes.js';
export type XYZLonLat = {
    lonDeg: number;
    latDeg: number;
};
declare class XYZRayPickingUtils {
    static getRayFromMouse(mouseX: number, mouseY: number, pMatrix: ReadonlyMat4, webgl: WebGL2RenderingContext, vMatrix: ReadonlyMat4): vec3;
    static raySphere(rayOrigWorld: ReadonlyVec3, rayDirectionWorld: ReadonlyVec3, sphere: Pick<AbstractSkyEntity, 'center' | 'radius'>): number;
    static getIntersectionPointWithModel(mouseX: number, mouseY: number, xyzModel: AbstractSkyEntity, webgl: WebGL2RenderingContext, camera: Camera, pMatrix: ReadonlyMat4): [number, number, number] | null;
    static getLonLatFromMouse(mouseX: number, mouseY: number, xyzModel: AbstractSkyEntity, webgl: WebGL2RenderingContext, camera: Camera, pMatrix: ReadonlyMat4): XYZLonLat | null;
    static getTileFromMouse(mouseX: number, mouseY: number, z: number, xyzModel: AbstractSkyEntity, webgl: WebGL2RenderingContext, camera: Camera, pMatrix: ReadonlyMat4): XYZTileCoord | null;
    static getVisibleTilesFromViewport(z: number, xyzModel: AbstractSkyEntity, webgl: WebGL2RenderingContext, camera: Camera, pMatrix: ReadonlyMat4, sampleCount?: number, padding?: number): XYZTileCoord[];
    static modelPointToLonLat(point: Readonly<[number, number, number]>): XYZLonLat;
    static lonLatToTile(lonDeg: number, latDeg: number, z: number): XYZTileCoord;
    static getNeighborTiles(tile: XYZTileCoord, ring?: number): XYZTileCoord[];
    static deduplicateTiles(tiles: XYZTileCoord[]): XYZTileCoord[];
    private static fillSmallTileGaps;
    private static latToTileY;
    private static isMercatorLatitude;
    private static wrapTileX;
    private static clampTileY;
    private static mat4MultiplyVec4;
}
export default XYZRayPickingUtils;
