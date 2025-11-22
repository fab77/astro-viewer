'use strict'

import global from '../../Global.js'
// import { hipsShaderProgram } from '../../shader/HiPSShaderProgram.js'
import { HiPSShaderProgram } from '../../shader/HiPSShaderProgram.js'
// import { newTileBuffer } from './TileBuffer.js'
import { TileBuffer } from './TileBuffer.js'
import { fovHelper } from './FoVHelper.js'
import HiPS from './HiPS.js'

interface Vec3 { x: number; y: number; z: number }
interface Xyf { ix: number; iy: number; face: number }
interface HealpixLike {
  order: number
  nest2xyf(nest: number): Xyf
  xyf2nest(x: number, y: number, face: number): number
  getBoundaries(nest: number): Vec3[]
  getPointsForXyfNoStep(x: number, y: number, face: number): Vec3[]
}

class AncestorTile {
  private _hips: HiPS
  private _tileno: number
  private _baseurl: string
  private _order: number

  private _ready = false
  private _format: string
  
  private _isGalacticHips: boolean

  public opacity = 1.0
  private _hipsShaderIndex = 0
  private _pixels: number[] = []

  private _texture: WebGLTexture | null = null
  private _image!: HTMLImageElement
  private _texurl = ''


  private vertexPosition!: Float32Array[]
  private vertexPositionBuffer!: WebGLBuffer[]
  private vertexIndices!: Uint16Array
  private vertexIndexBuffer!: WebGLBuffer
  private _tileBuffer: TileBuffer
  private _hipsShaderProgram: HiPSShaderProgram

  constructor(tileno: number, order: number, hips: HiPS, tileBuffer: TileBuffer, hipsShaderProgram: HiPSShaderProgram) {

    this._hipsShaderProgram = hipsShaderProgram
    this._tileBuffer = tileBuffer
    this._hips = hips
    this._tileno = tileno

    this._format = hips.format
    this._baseurl = hips.baseURL

    this._isGalacticHips = hips.isGalacticHips

    this._order = order
    this.initImage()
  }

  // Kept for API parity; there is no interval created in this class.
  destroyIntervals(): void {
    // no-op
  }

  private initImage(): void {
    const dirnumber = Math.floor(this._tileno / 10000) * 10000
    this._texurl = `${this._baseurl}/Norder${this._order}/Dir${dirnumber}/Npix${this._tileno}.${this._format}`

    this._image = new Image()
    this._image.onload = () => this.imageLoaded()
    this._image.onerror = () => {
      console.error('File not found? %s', this._texurl)
    }
    this._image.crossOrigin = 'anonymous'
    // If you ever need FITS handling, call this.loadImage() instead.
    this._image.src = this._texurl
  }

  private imageLoaded(): void {
    this.textureLoaded()
    this.initModelBuffer()

    const gl = (global as any).gl as WebGL2RenderingContext
    gl.activeTexture(gl.TEXTURE0 + this._hipsShaderIndex)
    gl.bindTexture(gl.TEXTURE_2D, this._texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._image)

    this._ready = true
  }

  private textureLoaded(): void {
    // hipsShaderProgram.enableProgram()
    this._hipsShaderProgram.enableProgram()

    const gl = (global as any).gl as WebGL2RenderingContext
    this._texture = gl.createTexture()
    gl.activeTexture(gl.TEXTURE0 + this._hipsShaderIndex)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    gl.bindTexture(gl.TEXTURE_2D, this._texture)

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

    // gl.uniform1i((hipsShaderProgram as any).shaderProgram.samplerUniform, this._hipsShaderIndex)
    // gl.uniform1i(this._hipsShaderProgram.shaderProgram.samplerUniform, this._hipsShaderIndex)

    if (!gl.isTexture(this._texture)) {
      console.log('error in texture')
    }
  }

  private initModelBuffer(): void {
    const gl = (global as any).gl as WebGL2RenderingContext
    this.vertexPosition = []
    this.vertexPositionBuffer = []
    this.vertexIndices = new Uint16Array()
    // this.vertexIndexBuffer created later

    const reforder = fovHelper.getRefOrder(this._order)
    const orighealpix = (global as any).getHealpix(this._order) as HealpixLike
    const origxyf = orighealpix.nest2xyf(this._tileno)

    const orderjump = reforder - this._order

    const dxmin = origxyf.ix << orderjump
    const dxmax = (origxyf.ix << orderjump) + (1 << orderjump)
    const dymin = origxyf.iy << orderjump
    const dymax = (origxyf.iy << orderjump) + (1 << orderjump)

    const healpix = (global as any).getHealpix(reforder) as HealpixLike

    this._pixels = []

    // Using getBoundaries (like the JS source)
    this.setupPositionAndTexture4Quadrant(dxmin, dxmax / 2, dymin, dymax / 2, 0, healpix, orderjump, origxyf)
    this.setupPositionAndTexture4Quadrant(dxmax / 2, dxmax, dymin, dymax / 2, 1, healpix, orderjump, origxyf)
    this.setupPositionAndTexture4Quadrant(dxmin, dxmax / 2, dymax / 2, dymax, 2, healpix, orderjump, origxyf)
    this.setupPositionAndTexture4Quadrant(dxmax / 2, dxmax, dymax / 2, dymax, 3, healpix, orderjump, origxyf)

    const pixelsXQuadrant = this.vertexPosition[0].length / 20
    this.vertexIndices = this.computeVertexIndices(pixelsXQuadrant)

    this.vertexIndexBuffer = gl.createBuffer() as WebGLBuffer
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndices, gl.STATIC_DRAW)
  }

  private computeVertexIndices(pixelsXQuadrant: number): Uint16Array {
    const vertexIndices = new Uint16Array(6 * pixelsXQuadrant)
    let baseFaceIndex = 0
    for (let j = 0; j < pixelsXQuadrant; j++) {
      vertexIndices[6 * j] = baseFaceIndex
      vertexIndices[6 * j + 1] = baseFaceIndex + 1
      vertexIndices[6 * j + 2] = baseFaceIndex + 2

      vertexIndices[6 * j + 3] = baseFaceIndex + 2
      vertexIndices[6 * j + 4] = baseFaceIndex + 3
      vertexIndices[6 * j + 5] = baseFaceIndex

      baseFaceIndex += 4
    }
    return vertexIndices
  }

  // Version that uses getPointsForXyfNoStep (kept for reference; not used in this class)
  private setupPositionAndTexture4Quadrant2(
    dxmin: number,
    dxmax: number,
    dymin: number,
    dymax: number,
    qidx: number,
    healpix: HealpixLike,
    orderjump: number,
    origxyf: Xyf
  ): void {
    const gl = (global as any).gl as WebGL2RenderingContext
    this.vertexPosition[qidx] = new Float32Array(20 * (dxmax - dxmin) * (dymax - dymin))

    const step = 1 / (1 << orderjump)
    let p = 0

    for (let dx = dxmin; dx < dxmax; dx++) {
      for (let dy = dymin; dy < dymax; dy++) {
        const facesVec3Array = healpix.getPointsForXyfNoStep(dx, dy, origxyf.face)
        const uindex = dy - (origxyf.iy << orderjump)
        const vindex = dx - (origxyf.ix << orderjump)

        this.vertexPosition[qidx][20 * p] = facesVec3Array[0].x
        this.vertexPosition[qidx][20 * p + 1] = facesVec3Array[0].y
        this.vertexPosition[qidx][20 * p + 2] = facesVec3Array[0].z
        this.vertexPosition[qidx][20 * p + 3] = step + step * uindex
        this.vertexPosition[qidx][20 * p + 4] = 1 - (step + step * vindex)

        this.vertexPosition[qidx][20 * p + 5] = facesVec3Array[1].x
        this.vertexPosition[qidx][20 * p + 6] = facesVec3Array[1].y
        this.vertexPosition[qidx][20 * p + 7] = facesVec3Array[1].z
        this.vertexPosition[qidx][20 * p + 8] = step + step * uindex
        this.vertexPosition[qidx][20 * p + 9] = 1 - step * vindex

        this.vertexPosition[qidx][20 * p + 10] = facesVec3Array[2].x
        this.vertexPosition[qidx][20 * p + 11] = facesVec3Array[2].y
        this.vertexPosition[qidx][20 * p + 12] = facesVec3Array[2].z
        this.vertexPosition[qidx][20 * p + 13] = step * uindex
        this.vertexPosition[qidx][20 * p + 14] = 1 - step * vindex

        this.vertexPosition[qidx][20 * p + 15] = facesVec3Array[3].x
        this.vertexPosition[qidx][20 * p + 16] = facesVec3Array[3].y
        this.vertexPosition[qidx][20 * p + 17] = facesVec3Array[3].z
        this.vertexPosition[qidx][20 * p + 18] = step * uindex
        this.vertexPosition[qidx][20 * p + 19] = 1 - (step + step * vindex)
        p++
      }
    }

    this.vertexPositionBuffer[qidx] = (global as any).gl.createBuffer()
    ;(global as any).gl.bindBuffer((global as any).gl.ARRAY_BUFFER, this.vertexPositionBuffer[qidx])
    ;(global as any).gl.bufferData(
      (global as any).gl.ARRAY_BUFFER,
      this.vertexPosition[qidx],
      (global as any).gl.STATIC_DRAW
    )
  }

  // Version used by the original JS, collecting _pixels via xyf2nest + getBoundaries
  private setupPositionAndTexture4Quadrant(
    dxmin: number,
    dxmax: number,
    dymin: number,
    dymax: number,
    qidx: number,
    healpix: HealpixLike,
    orderjump: number,
    origxyf: Xyf
  ): void {
    const gl = (global as any).gl as WebGL2RenderingContext
    this.vertexPosition[qidx] = new Float32Array(20 * (dxmax - dxmin) * (dymax - dymin))

    const step = 1 / (1 << orderjump)
    let p = 0

    for (let dx = dxmin; dx < dxmax; dx++) {
      for (let dy = dymin; dy < dymax; dy++) {
        const ipix3 = healpix.xyf2nest(dx, dy, origxyf.face)
        this._pixels.push(ipix3)

        const facesVec3Array = healpix.getBoundaries(ipix3)
        const uindex = dy - (origxyf.iy << orderjump)
        const vindex = dx - (origxyf.ix << orderjump)

        this.vertexPosition[qidx][20 * p] = facesVec3Array[0].x
        this.vertexPosition[qidx][20 * p + 1] = facesVec3Array[0].y
        this.vertexPosition[qidx][20 * p + 2] = facesVec3Array[0].z
        this.vertexPosition[qidx][20 * p + 3] = step + step * uindex
        this.vertexPosition[qidx][20 * p + 4] = 1 - (step + step * vindex)

        this.vertexPosition[qidx][20 * p + 5] = facesVec3Array[1].x
        this.vertexPosition[qidx][20 * p + 6] = facesVec3Array[1].y
        this.vertexPosition[qidx][20 * p + 7] = facesVec3Array[1].z
        this.vertexPosition[qidx][20 * p + 8] = step + step * uindex
        this.vertexPosition[qidx][20 * p + 9] = 1 - step * vindex

        this.vertexPosition[qidx][20 * p + 10] = facesVec3Array[2].x
        this.vertexPosition[qidx][20 * p + 11] = facesVec3Array[2].y
        this.vertexPosition[qidx][20 * p + 12] = facesVec3Array[2].z
        this.vertexPosition[qidx][20 * p + 13] = step * uindex
        this.vertexPosition[qidx][20 * p + 14] = 1 - step * vindex

        this.vertexPosition[qidx][20 * p + 15] = facesVec3Array[3].x
        this.vertexPosition[qidx][20 * p + 16] = facesVec3Array[3].y
        this.vertexPosition[qidx][20 * p + 17] = facesVec3Array[3].z
        this.vertexPosition[qidx][20 * p + 18] = step * uindex
        this.vertexPosition[qidx][20 * p + 19] = 1 - (step + step * vindex)
        p++
      }
    }

    this.vertexPositionBuffer[qidx] = gl.createBuffer() as WebGLBuffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer[qidx])
    gl.bufferData(gl.ARRAY_BUFFER, this.vertexPosition[qidx], gl.STATIC_DRAW)
  }

  public draw(
    visibleOrder: number,
    visibleTilesMap: Map<number, number[]>,
    pMatrix: Float32Array,
    vMatrix: Float32Array,
    mMatrix: Float32Array,
    colorMapIdx: number
  ): boolean {
    if (!this._ready) return false

    let quadrantsToDraw: Set<number> = new Set([0, 1, 2, 3])
    if (visibleOrder > this._order) {
      const q = this.drawChildren(visibleOrder, visibleTilesMap, pMatrix, vMatrix, mMatrix, colorMapIdx)
      if (q) quadrantsToDraw = q
    }

    // hipsShaderProgram.enableShaders(pMatrix, vMatrix, mMatrix, colorMapIdx)
    this._hipsShaderProgram.enableShaders(pMatrix, vMatrix, mMatrix, colorMapIdx)

    const gl = (global as any).gl as WebGL2RenderingContext
    gl.enableVertexAttribArray(this._hipsShaderProgram.locations.vertexPositionAttribute)
    gl.enableVertexAttribArray(this._hipsShaderProgram.locations.textureCoordAttribute)
    // gl.enableVertexAttribArray((hipsShaderProgram as any).locations.vertexPositionAttribute)
    // gl.enableVertexAttribArray((hipsShaderProgram as any).locations.textureCoordAttribute)

    gl.activeTexture(gl.TEXTURE0 + this._hipsShaderIndex)
    gl.bindTexture(gl.TEXTURE_2D, this._texture)
    // gl.uniform1f((hipsShaderProgram as any).locations.textureAlpha, this.opacity)
    gl.uniform1f(this._hipsShaderProgram.locations.textureAlpha, this.opacity)

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer)
    const elemno = this.vertexIndices.length

    quadrantsToDraw.forEach((qidx) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer[qidx])

      gl.vertexAttribPointer(
        // (hipsShaderProgram as any).locations.vertexPositionAttribute,
        this._hipsShaderProgram.locations.vertexPositionAttribute,
        3,
        gl.FLOAT,
        false,
        5 * 4,
        0
      )
      gl.vertexAttribPointer(
        // (hipsShaderProgram as any).locations.textureCoordAttribute,
        this._hipsShaderProgram.locations.textureCoordAttribute,
        2,
        gl.FLOAT,
        false,
        5 * 4,
        3 * 4
      )

      gl.drawElements(gl.TRIANGLES, elemno, gl.UNSIGNED_SHORT, 0)
    })

    gl.disableVertexAttribArray(this._hipsShaderProgram.locations.vertexPositionAttribute)
    gl.disableVertexAttribArray(this._hipsShaderProgram.locations.textureCoordAttribute)
    // gl.disableVertexAttribArray((hipsShaderProgram as any).locations.vertexPositionAttribute)
    // gl.disableVertexAttribArray((hipsShaderProgram as any).locations.textureCoordAttribute)

    return true
  }

  private drawChildren(
    visibleOrder: number,
    visibleTilesMap: Map<number, number[]>,
    pMatrix: Float32Array,
    vMatrix: Float32Array,
    mMatrix: Float32Array,
    colorMapIdx: number
  ): Set<number> | undefined {
    const quadrantsToDraw = new Set<number>([0, 1, 2, 3])
    const childrenOrder = this._order + 1
    if (!visibleTilesMap.has(childrenOrder)) return

    for (let c = 0; c < 4; c++) {
      const childTileNo = (this._tileno << 2) + c
      const visibleChildren = visibleTilesMap.get(childrenOrder)!
      if (visibleChildren.includes(childTileNo)) {
        const childTile = this._isGalacticHips
          ? this._tileBuffer.getGalTile(childTileNo, childrenOrder, this._hips)
          : this._tileBuffer.getTile(childTileNo, childrenOrder, this._hips)
        // const childTile = this._isGalacticHips
        //   ? newTileBuffer.getGalTile(childTileNo, childrenOrder, this._hips)
        //   : newTileBuffer.getTile(childTileNo, childrenOrder, this._hips)

        childTile.draw(visibleOrder, visibleTilesMap, pMatrix, vMatrix, mMatrix, colorMapIdx)
        if ((childTile as any)._ready) {
          quadrantsToDraw.delete((childTile as any)._tileno - (this._tileno << 2))
        }
      }
    }
    return quadrantsToDraw
  }
}

export default AncestorTile