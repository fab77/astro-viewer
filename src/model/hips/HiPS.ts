'use strict'
/**
 * @author Fabrizio Giordano (Fab77)
 */

import {AbstractSkyEntity, SkyEntityDrawInput} from '../AbstractSkyEntity.js'
import { fovHelper } from './FoVHelper.js'
import ColorMaps, { ColorMap } from '../ColorMaps.js'
// import { hipsShaderProgram } from '../../shader/HiPSShaderProgram.js'
// import { HiPSShaderProgram } from '../../shader/HiPSShaderProgram.js'
import AncestorTile from './AncestorTile.js'
import AllSky from './AllSky.js'
// import global from '../../Global.js'
import {HiPSDescriptor} from './HiPSDescriptor.js'
import computePerspectiveMatrixSingleton from '../../utils/ComputePerspectiveMatrix.js'
import { HealpixGrid } from '../grid/HealpixGrid.js'
import { ReadonlyMat4 } from 'gl-matrix'


class HiPS extends AbstractSkyEntity {
  
  private _ancestorTiles: AncestorTile[]
  private _allSkyTile: AllSky | null

  private _format: string
  private _baseurl: string
  private _maxorder: number
  private _minorder: number

  private _visibleorder = 3
  private _allSky = true

  public samplerIdx = 0
  public colorMapIdx = 0
  public colorMap = ColorMaps['native']
  private _healpixGrid: HealpixGrid

  // exposed read-only helpers
  get maxOrder(): number { return this._maxorder }
  get minOrder(): number { return this._minorder }
  get baseURL(): string { return this._baseurl }
  get format(): string { return this._format }

  constructor(
    radius: number,
    position: [number, number, number],
    xrad: number,
    yrad: number,
    descriptor: HiPSDescriptor,
    webgl: WebGL2RenderingContext,
    healpixGrid: HealpixGrid
  ) {
    super(radius, position, xrad, yrad, descriptor.surveyName, webgl, descriptor.isGalactic)
    // this.initGL((global as any).gl as WebGL2RenderingContext)
    this.initGL(webgl as WebGL2RenderingContext)
    this._healpixGrid = healpixGrid
    
    // newTileBuffer.addHiPS(this)
    this._healpixGrid.visibleTilesManager.tileBuffer.addHiPS(this)

    // DEBUG logs kept from JS (optional)
    // eslint-disable-next-line no-console
    console.log('HiPS frame ' + descriptor.hipsFrame)
    // eslint-disable-next-line no-console
    console.log('HiPS minOrder ' + descriptor.minOrder)

    this._format = descriptor.imgFormats[0]
    this._baseurl = descriptor.url
    this._maxorder = descriptor.maxOrder
    this._minorder = descriptor.minOrder

    this.initShaders()

    // pick initial order from a starting FoV
    const fov = 180
    let order = fovHelper.getHiPSNorder(fov)
    this._visibleorder = Math.min(order, this._maxorder)

    this._ancestorTiles = []
    this._allSkyTile = null

    // auto-detect all-sky: original code forces true
    this._allSky = true
    if (this._allSky) {
      this._allSkyTile = new AllSky(this, this._webgl, this._healpixGrid.visibleTilesManager.tileBuffer, super.hipsShaderProgram)
    } else {
      for (let t = 0; t < 12; t++) {
        this._ancestorTiles.push(new AncestorTile(t, 0, this, this._healpixGrid.visibleTilesManager.tileBuffer, super.hipsShaderProgram))
      }
    }
  }

  changeFormat(format: string): void {
    this._format = format
    // original code referenced _tileBuffer; if you have one, wire it back.
    // Keeping calls no-op to avoid breaking at runtime if _tileBuffer is undefined.
    // (newVisibleTilesManager + TileBuffer drive the actual tile lifecycle)
    // @ts-ignore
    if (this._tileBuffer?.clearAll) this._tileBuffer.clearAll()
    // @ts-ignore
    if (this._tileBuffer) this._tileBuffer._format = this._format
    const pixelByOrder =
      this.isGalacticHips
        ? this._healpixGrid.visibleTilesManager.galVisibleTilesByOrder
        : this._healpixGrid.visibleTilesManager.visibleTilesByOrder
    // const pixelByOrder =
    //   this.isGalacticHips
    //     ? visibleTilesManager.galVisibleTilesByOrder
    //     : visibleTilesManager.visibleTilesByOrder
    // @ts-ignore
    if (this._tileBuffer?.updateTiles) this._tileBuffer.updateTiles(pixelByOrder.pixels, pixelByOrder.order)
  }

  /**
   * Shader colormap switcher
   * 0 -> native
   * 1 -> grayscale
   * 2 -> planck
   * 3 -> cmb
   * 4 -> rainbow
   * 5 -> eosb
   * 6 -> cubehelix
   */
  changeColorMap(colorMap: ColorMap): void {
    this.colorMap = colorMap
    switch (colorMap.name) {
      case 'grayscale':
        this.colorMapIdx = 1
        // hipsShaderProgram.setGrayscaleShader()
        super.hipsShaderProgram.setGrayscaleShader()
        break
      case 'planck':
        this.colorMapIdx = 2
        // hipsShaderProgram.setColorMapShader()
        super.hipsShaderProgram.setColorMapShader()
        break
      case 'cmb':
        this.colorMapIdx = 3
        // hipsShaderProgram.setColorMapShader()
        super.hipsShaderProgram.setColorMapShader()
        break
      case 'rainbow':
        this.colorMapIdx = 4
        // hipsShaderProgram.setColorMapShader()
        super.hipsShaderProgram.setColorMapShader()
        break
      case 'eosb':
        this.colorMapIdx = 5
        super.hipsShaderProgram.setColorMapShader()
        // hipsShaderProgram.setColorMapShader()
        break
      case 'cubehelix':
        this.colorMapIdx = 6
        super.hipsShaderProgram.setColorMapShader()
        // hipsShaderProgram.setColorMapShader()
        break
      default:
        this.colorMapIdx = 0
        super.hipsShaderProgram.setNativeShader()
        // hipsShaderProgram.setNativeShader()
    }
  }

  private initShaders(): void {
    super.hipsShaderProgram.enableProgram()
    // hipsShaderProgram.enableProgram()
    // this.shaderProgram = super.hipsShaderProgram.shaderProgram
    // this.shaderProgram = hipsShaderProgram.shaderProgram
  }

  getCurrentHealpixOrder(): number {
    return this._visibleorder
  }

  private refresh(): void {
    // const fov = healpixGridSingleton.getMinFoV()
    const fov = this._healpixGrid.getMinFoV()
    this._visibleorder = Math.min(fovHelper.getHiPSNorder(fov), this._maxorder)
  }

  draw(input: SkyEntityDrawInput): void {
    
    // const cameraMatrix = input.cameraMatrix
    // const camera = input.camera
    const vMatrix = input.camera.getCameraMatrix() as Float32Array

    // if (!global.camera || global.camera.getCameraMatrix() === undefined) return
    if (!vMatrix) return
    this.refresh()
    
    // const vMatrix = global.camera.getCameraMatrix() as Float32Array
    // const vMatrix = cameraMatrix
    const pMatrix = computePerspectiveMatrixSingleton.pMatrix as Float32Array
    const mMatrix = this.getModelMatrix() as Float32Array

    if (this._allSky && this._allSkyTile) {
      if (this.isGalacticHips) {
        this._allSkyTile.draw(
          this._healpixGrid.visibleTilesManager.galVisibleTilesByOrder.order,
          this._healpixGrid.visibleTilesManager.galAncestorsMap,
          // visibleTilesManager.galVisibleTilesByOrder.order,
          // visibleTilesManager.galAncestorsMap,
          pMatrix,
          vMatrix,
          mMatrix,
          this.colorMapIdx
        )
      } else {
        this._allSkyTile.draw(
          this._healpixGrid.visibleTilesManager.visibleTilesByOrder.order,
          this._healpixGrid.visibleTilesManager.ancestorsMap,
          // visibleTilesManager.visibleTilesByOrder.order,
          // visibleTilesManager.ancestorsMap,
          pMatrix,
          vMatrix,
          mMatrix,
          this.colorMapIdx
        )
      }
      return
    }

    // Non all-sky path
    const order = this.isGalacticHips
      ? this._healpixGrid.visibleTilesManager.galVisibleTilesByOrder.order
      : this._healpixGrid.visibleTilesManager.visibleTilesByOrder.order
      // ? visibleTilesManager.galVisibleTilesByOrder.order
      // : visibleTilesManager.visibleTilesByOrder.order
    const map = this.isGalacticHips
      ? this._healpixGrid.visibleTilesManager.galAncestorsMap
      : this._healpixGrid.visibleTilesManager.ancestorsMap
      // ? visibleTilesManager.galAncestorsMap
      // : visibleTilesManager.ancestorsMap

    this._ancestorTiles.forEach((ancestor) => {
      ancestor.draw(order, map, pMatrix, vMatrix, mMatrix, this.colorMapIdx)
    })
  }
}

export default HiPS