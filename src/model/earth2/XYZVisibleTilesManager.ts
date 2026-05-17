
import { ReadonlyMat4 } from 'gl-matrix';

import Camera from '../../Camera.js';
import XYZRayPickingUtils from '../../utils/XYZRayPickingUtils.js';
import { AbstractSkyEntity } from '../AbstractSkyEntity.js';
import type { XYZTileCoord, XYZVisibleTileSelection } from './XYZTypes.js';

export class XYZVisibleTilesManager {
  private _ancestorsMap: Map<string, XYZTileCoord> = new Map();
  private _visibleTilesMap: Map<string, XYZTileCoord> = new Map();
  private _visibleTiles: XYZTileCoord[] = [];
  private _selection: XYZVisibleTileSelection = {
    key: '0:',
    currentZoom: 0,
    visibleTiles: [],
    visibleTilesMap: new Map(),
    ancestorsMap: new Map(),
  };

  get ancestorsMap(): Map<string, XYZTileCoord> {
    return this._ancestorsMap;
  }

  get visibleTiles(): XYZTileCoord[] {
    return this._visibleTiles;
  }

  get visibleTilesMap(): Map<string, XYZTileCoord> {
    return this._visibleTilesMap;
  }

  get selection(): XYZVisibleTileSelection {
    return this._selection;
  }

  computeVisibleTiles(
    z: number,
    xyzModel: AbstractSkyEntity,
    webgl: WebGL2RenderingContext,
    camera: Camera,
    pMatrix: ReadonlyMat4,
    sampleCount = 7,
    padding = 1,
  ): XYZVisibleTileSelection {
    this._visibleTiles = XYZRayPickingUtils.getVisibleTilesFromViewport(
      z,
      xyzModel,
      webgl,
      camera,
      pMatrix,
      sampleCount,
      padding,
    );

    this._visibleTilesMap = this.buildTileMap(this._visibleTiles);
    this.refreshAncestorsMap(this._visibleTiles);

    this._selection = {
      key: this.buildSelectionKey(z, this._visibleTiles),
      currentZoom: z,
      visibleTiles: this._visibleTiles,
      visibleTilesMap: this._visibleTilesMap,
      ancestorsMap: this._ancestorsMap,
    };

    return this._selection;
  }

  private refreshAncestorsMap(visibleTiles: XYZTileCoord[]): void {
    this._ancestorsMap.clear();

    for (const tile of visibleTiles) {
      for (let z = tile.z - 1; z >= 0; z--) {
        const dz = tile.z - z;
        const ancestor = {
          z,
          x: tile.x >> dz,
          y: tile.y >> dz,
        };
        this._ancestorsMap.set(`${ancestor.z}/${ancestor.x}/${ancestor.y}`, ancestor);
      }
    }
  }

  private buildTileMap(tiles: XYZTileCoord[]): Map<string, XYZTileCoord> {
    const map = new Map<string, XYZTileCoord>();
    for (const tile of tiles) {
      map.set(this.key(tile), tile);
    }
    return map;
  }

  private buildSelectionKey(z: number, tiles: XYZTileCoord[]): string {
    return `${z}:${tiles.map((tile) => `${tile.x}/${tile.y}`).join('|')}`;
  }

  private key(tile: XYZTileCoord): string {
    return `${tile.z}/${tile.x}/${tile.y}`;
  }
}
