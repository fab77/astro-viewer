import global from '../../Global';
import { Pointing, Vec3, Healpix } from 'healpixjs';
import RayPickingUtils from '../../utils/RayPickingUtils';
import { newTileBuffer } from './TileBuffer';
import { vec4, mat4, ReadonlyMat4 } from 'gl-matrix';
import computePerspectiveMatrixSingleton from '../../utils/ComputePerspectiveMatrix';
import healpixGridSingleton from '../grid/HealpixGridSingleton';
type GL = WebGLRenderingContext | WebGL2RenderingContext;

interface VisibleTiles {
  pixels: number[];
  order: number;
}


class VisibleTilesManager {
  private _visibleTilesByOrder: VisibleTiles;
  private _ancestorsMap: Map<number, number[]>;

  private initialised: boolean;

  private _galVisibleTilesByOrder: VisibleTiles;
  private _galAncestorsMap: Map<number, number[]>;
  private _galacticMatrixInverted: mat4;
  private _galacticMatrix: mat4;

  constructor() {
    this._visibleTilesByOrder = { pixels: [], order: 0 };
    this._ancestorsMap = new Map();
    this.initialised = false;

    this._galVisibleTilesByOrder = { pixels: [], order: 0 };
    this._galAncestorsMap = new Map();

    // Matrices for galactic <-> equatorial
    this._galacticMatrixInverted = mat4.create();
    this._galacticMatrix = mat4.create();

    // From https://observablehq.com/@fil/galactic-rotations (single-precision friendly)
    // This matrix is (galactic -> equatorial); we store its inverse too.
    mat4.set(
      this._galacticMatrixInverted,
      -0.054876, -0.873437, -0.483835, 0, 
      0.494109, -0.44483, 0.746982, -0, 
      -0.867666, -0.198076, 0.455984, 0, 
      0, 0, 0, 1
    )
    mat4.invert(this._galacticMatrix, this._galacticMatrixInverted);
    this.init()
  }

  init(): void {
    this.initialised = true;
    this.computeVisiblePixels();
    // Consider debouncing/throttling in real-time UIs
    setInterval(() => this.computeVisiblePixels(), 500);
  }

  getVisibleOrder(): number {
    return healpixGridSingleton.visibleorder;
  }

  computeVisiblePixels(): void {
    if (!this.initialised) return;

    // Keep in case you want it; current RayPickingUtils TS doesn’t need pMatrix
    const pMatrix = computePerspectiveMatrixSingleton.pMatrix as ReadonlyMat4;

    let order = healpixGridSingleton.visibleorder;
    if (global.insideSphere && order < 3) {
      order = 3;
    }

    this._ancestorsMap.set(order, []);
    this._galAncestorsMap.set(order, []);

    let pixels: number[] = [];
    let galTiles: number[] = [];

    if (order === 0) {
      const geomhealpix: Healpix = global.getHealpix(0);
      const npix = geomhealpix.getNPix();
      for (let i = 0; i < npix; i++) {
        pixels.push(i);
        this._ancestorsMap.get(order)!.push(i);
        galTiles.push(i);
        this._galAncestorsMap.get(order)!.push(i);
      }
    } else {
      const geomhealpix: Healpix = global.getHealpix(order);
      const maxX = (global.gl as GL).canvas.width;
      const maxY = (global.gl as GL).canvas.height;

      // Sample a grid of screen points, project to the sphere, then to galactic
      for (let i = 0; i <= maxX; i += maxX / 30) {
        for (let j = 0; j <= maxY; j += maxY / 30) {
          const hit = RayPickingUtils.getIntersectionPointWithSingleModel(
            i,
            j
          );

          if (hit.length > 0) {
            // Equatorial -> Galactic (use _galacticMatrix)
            const galVec = vec4.create();
            vec4.transformMat4(galVec, [hit[0], hit[1], hit[2], 1], this._galacticMatrix);

            // Index in galactic HEALPix
            const galPoint = new Pointing(new Vec3(galVec[0], galVec[1], galVec[2]));
            const galTileNo = geomhealpix.ang2pix(galPoint);

            // Index in equatorial HEALPix
            const curPoint = new Pointing(new Vec3(hit[0], hit[1], hit[2]));
            const currPixNo = geomhealpix.ang2pix(curPoint);

            if (!pixels.includes(currPixNo)) {
              pixels.push(currPixNo);
              this._ancestorsMap.get(order)!.push(currPixNo);
              newTileBuffer.addTile(order, currPixNo);
            }

            if (!galTiles.includes(galTileNo)) {
              galTiles.push(galTileNo);
              this._galAncestorsMap.get(order)!.push(galTileNo);
              newTileBuffer.addGalTile(order, galTileNo);
            }
          }
        }
      }
    }

    this._visibleTilesByOrder = { pixels: pixels, order: order };
    this._galVisibleTilesByOrder = { pixels: galTiles, order: order };

    // Build ancestor pyramids down to order 0
    for (let o = 1; o < order; o++) {
      const tgtOrder = order - o;
      const list = this._ancestorsMap.get(tgtOrder) ?? [];
      this._ancestorsMap.set(tgtOrder, list);

      for (let p = 0; p < pixels.length; p++) {
        const parent = pixels[p] >> (2 * o);
        if (!list.includes(parent)) {
          list.push(parent);
          newTileBuffer.addTile(tgtOrder, parent);
        }
      }
    }

    for (let o = 1; o < order; o++) {
      const tgtOrder = order - o;
      const list = this._galAncestorsMap.get(tgtOrder) ?? [];
      this._galAncestorsMap.set(tgtOrder, list);

      for (let p = 0; p < galTiles.length; p++) {
        const parent = galTiles[p] >> (2 * o);
        if (!list.includes(parent)) {
          list.push(parent);
          newTileBuffer.addGalTile(tgtOrder, parent);
        }
      }
    }
  }

  get visibleTilesByOrder(): VisibleTiles {
    return this._visibleTilesByOrder;
  }

  get ancestorsMap(): Map<number, number[]> {
    return this._ancestorsMap;
  }

  get galVisibleTilesByOrder(): VisibleTiles {
    return this._galVisibleTilesByOrder;
  }

  get galAncestorsMap(): Map<number, number[]> {
    return this._galAncestorsMap;
  }

  get visibleOrder(): number {
    return this._visibleTilesByOrder.order;
  }
}

export const newVisibleTilesManager = new VisibleTilesManager();