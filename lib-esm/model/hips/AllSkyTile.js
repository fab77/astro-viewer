// 'use strict'
export {};
// // import global from '../../Global.js'
// // import { hipsShaderProgram } from '../../shader/HiPSShaderProgram.js'
// import { HiPSShaderProgram } from '../../shader/HiPSShaderProgram.js'
// export interface HipsLike {
//   format: string
//   baseURL: string
//   maxOrder: number
//   minOrder: number
//   isGalacticHips: boolean
// }
// class AllSkyTile {
//   private _hips: HipsLike
//   private _tileno: number
//   private _baseurl: string
//   private _order: number
//   private _ready = false
//   private _abort = false
//   private _format: string
//   private _maxorder: number
//   private _minorder: number
//   private _isGalacticHips: boolean
//   public opacity = 1.0
//   private _hipsShaderIndex = 0 // used for multi-HiPS
//   private _pixels: number[] = []
//   private _texture: WebGLTexture | null = null
//   private _cacheTime0: number | undefined
//   private _inView = true
//   private _image: HTMLImageElement
//   private _imageLoaded = false
//   private _downloading = false
//   private _textureLoaded = false
//   private vertexPosition!: Float32Array[]
//   private vertexPositionBuffer!: WebGLBuffer[]
//   private vertexIndices!: Uint16Array
//   private vertexIndexBuffer!: WebGLBuffer
//   private _hipsShaderProgram 
//   private _webgl: WebGL2RenderingContext
//   constructor(tileno: number, order: number, hips: HipsLike, 
//     image: HTMLImageElement, webgl: WebGL2RenderingContext) {
//     this._hips = hips
//     this._tileno = tileno
//     this._format = hips.format
//     this._baseurl = hips.baseURL
//     this._maxorder = hips.maxOrder
//     this._minorder = hips.minOrder
//     this._isGalacticHips = hips.isGalacticHips
//     this._order = order
//     this._image = image
//     this._webgl = webgl
//     this._hipsShaderProgram = new HiPSShaderProgram(this._webgl)
//     this.imageLoaded()
//   }
//   get cacheTime0(): number | undefined {
//     return this._cacheTime0
//   }
//   resetCacheTime0(): void {
//     this._cacheTime0 = undefined
//   }
//   setCacheTime0(): void {
//     this._cacheTime0 = new Date().getTime()
//   }
//   private imageLoaded(): void {
//     this._imageLoaded = true
//     this._downloading = false
//     this.textureLoaded()
//     this.initModelBuffer()
//     // const gl = (global as any).gl as WebGL2RenderingContext
//     const gl = this._webgl as WebGL2RenderingContext
//     gl.activeTexture(gl.TEXTURE0 + this._hipsShaderIndex)
//     gl.bindTexture(gl.TEXTURE_2D, this._texture)
//     gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._image)
//     this._textureLoaded = true
//     if (this._textureLoaded) this._ready = true
//   }
//   private textureLoaded(): void {
//     // hipsShaderProgram.enableProgram()
//     this._hipsShaderProgram.enableProgram()
//     // const gl = (global as any).gl as WebGL2RenderingContext
//     const gl = this._webgl as WebGL2RenderingContext
//     this._texture = gl.createTexture()
//     gl.activeTexture(gl.TEXTURE0 + this._hipsShaderIndex)
//     gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
//     gl.bindTexture(gl.TEXTURE_2D, this._texture)
//     // wrapping / filtering
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
//     // TODO samplerUniform doesn't exist in shaderProgram!!!
//     // gl.uniform1i((hipsShaderProgram as any).shaderProgram.samplerUniform, this._hipsShaderIndex)
//     gl.uniform1i((this._hipsShaderProgram as any).shaderProgram.samplerUniform, this._hipsShaderIndex)
//     if (!gl.isTexture(this._texture)) {
//       console.log('error in texture')
//     }
//   }
//   private initModelBuffer(): void {
//     // const gl = (global as any).gl as WebGL2RenderingContext
//     const gl = this._webgl as WebGL2RenderingContext
//     this.vertexPosition = []
//     this.vertexPositionBuffer = []
//     // indices common to all quadrants
//     const reforder = 4
//     const orighealpix = (global as any).getHealpix(this._order)
//     const origxyf = orighealpix.nest2xyf(this._tileno)
//     const orderjump = reforder - this._order
//     const dxmin = origxyf.ix << orderjump
//     const dxmax = (origxyf.ix << orderjump) + (1 << orderjump)
//     const dymin = origxyf.iy << orderjump
//     const dymax = (origxyf.iy << orderjump) + (1 << orderjump)
//     const healpix = (global as any).getHealpix(reforder)
//     this._pixels = []
//     this.setupPositionAndTexture4Quadrant2(
//       dxmin,
//       dxmin + (dxmax - dxmin) / 2,
//       dymin,
//       dymin + (dymax - dymin) / 2,
//       0,
//       healpix,
//       orderjump,
//       origxyf
//     )
//     this.setupPositionAndTexture4Quadrant2(
//       dxmin + (dxmax - dxmin) / 2,
//       dxmax,
//       dymin,
//       dymin + (dymax - dymin) / 2,
//       1,
//       healpix,
//       orderjump,
//       origxyf
//     )
//     this.setupPositionAndTexture4Quadrant2(
//       dxmin,
//       dxmin + (dxmax - dxmin) / 2,
//       dymin + (dymax - dymin) / 2,
//       dymax,
//       2,
//       healpix,
//       orderjump,
//       origxyf
//     )
//     this.setupPositionAndTexture4Quadrant2(
//       dxmin + (dxmax - dxmin) / 2,
//       dxmax,
//       dymin + (dymax - dymin) / 2,
//       dymax,
//       3,
//       healpix,
//       orderjump,
//       origxyf
//     )
//     const pixelsXQuadrant = this.vertexPosition[0].length / 20
//     this.vertexIndices = this.computeVertexIndices(pixelsXQuadrant)
//     this.vertexIndexBuffer = gl.createBuffer() as WebGLBuffer
//     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer)
//     gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndices, gl.STATIC_DRAW)
//   }
//   private computeVertexIndices(pixelsXQuadrant: number): Uint16Array {
//     const vertexIndices = new Uint16Array(6 * pixelsXQuadrant)
//     let baseFaceIndex = 0
//     for (let j = 0; j < pixelsXQuadrant; j++) {
//       vertexIndices[6 * j] = baseFaceIndex
//       vertexIndices[6 * j + 1] = baseFaceIndex + 1
//       vertexIndices[6 * j + 2] = baseFaceIndex + 2
//       vertexIndices[6 * j + 3] = baseFaceIndex + 2
//       vertexIndices[6 * j + 4] = baseFaceIndex + 3
//       vertexIndices[6 * j + 5] = baseFaceIndex
//       baseFaceIndex += 4
//     }
//     return vertexIndices
//   }
//   private setupPositionAndTexture4Quadrant2(
//     dxmin: number,
//     dxmax: number,
//     dymin: number,
//     dymax: number,
//     qidx: number,
//     healpix: any,
//     orderjump: number,
//     origxyf: any
//   ): void {
//     // const gl = (global as any).gl as WebGL2RenderingContext
//     const gl = this._webgl as WebGL2RenderingContext
//     let facesVec3Array: Array<{ x: number; y: number; z: number }> = []
//     this.vertexPosition[qidx] = new Float32Array(20 * (dxmax - dxmin) * (dymax - dymin))
//     const step = 1 / (1 << orderjump)
//     let uindex = 0
//     let vindex = 0
//     let p = 0
//     for (let dx = dxmin; dx < dxmax; dx++) {
//       for (let dy = dymin; dy < dymax; dy++) {
//         facesVec3Array = healpix.getPointsForXyfNoStep(dx, dy, origxyf.face)
//         uindex = dy - (origxyf.iy << orderjump)
//         vindex = dx - (origxyf.ix << orderjump)
//         this.vertexPosition[qidx][20 * p] = facesVec3Array[0].x
//         this.vertexPosition[qidx][20 * p + 1] = facesVec3Array[0].y
//         this.vertexPosition[qidx][20 * p + 2] = facesVec3Array[0].z
//         this.vertexPosition[qidx][20 * p + 3] = step + step * uindex
//         this.vertexPosition[qidx][20 * p + 4] = 1 - (step + step * vindex)
//         this.vertexPosition[qidx][20 * p + 5] = facesVec3Array[1].x
//         this.vertexPosition[qidx][20 * p + 6] = facesVec3Array[1].y
//         this.vertexPosition[qidx][20 * p + 7] = facesVec3Array[1].z
//         this.vertexPosition[qidx][20 * p + 8] = step + step * uindex
//         this.vertexPosition[qidx][20 * p + 9] = 1 - step * vindex
//         this.vertexPosition[qidx][20 * p + 10] = facesVec3Array[2].x
//         this.vertexPosition[qidx][20 * p + 11] = facesVec3Array[2].y
//         this.vertexPosition[qidx][20 * p + 12] = facesVec3Array[2].z
//         this.vertexPosition[qidx][20 * p + 13] = step * uindex
//         this.vertexPosition[qidx][20 * p + 14] = 1 - step * vindex
//         this.vertexPosition[qidx][20 * p + 15] = facesVec3Array[3].x
//         this.vertexPosition[qidx][20 * p + 16] = facesVec3Array[3].y
//         this.vertexPosition[qidx][20 * p + 17] = facesVec3Array[3].z
//         this.vertexPosition[qidx][20 * p + 18] = step * uindex
//         this.vertexPosition[qidx][20 * p + 19] = 1 - (step + step * vindex)
//         p++
//       }
//     }
//     this.vertexPositionBuffer[qidx] = gl.createBuffer() as WebGLBuffer
//     gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer[qidx])
//     gl.bufferData(gl.ARRAY_BUFFER, this.vertexPosition[qidx], gl.STATIC_DRAW)
//   }
//   get inView(): boolean {
//     return this._inView
//   }
//   public draw(
//     visibleOrder: number, // unused here but kept for signature parity
//     visibleTilesMap: Map<number, number[]>, // unused
//     pMatrix: Float32Array, // unused in this tile (shader expects already set)
//     vMatrix: Float32Array, // unused
//     mMatrix: Float32Array, // unused
//     colorMapIdx: number // unused
//   ): void {
//     if (!this._ready || this._abort) return
//     // const gl = global.gl as WebGL2RenderingContext
//     const gl = this._webgl as WebGL2RenderingContext
//     const quadrantsToDraw = new Set<number>([0, 1, 2, 3])
//     gl.activeTexture(gl.TEXTURE0 + this._hipsShaderIndex)
//     gl.bindTexture(gl.TEXTURE_2D, this._texture)
//     // gl.uniform1f((hipsShaderProgram as any).locations.textureAlpha, this.opacity)
//     gl.uniform1f(this._hipsShaderProgram.locations.textureAlpha, this.opacity)
//     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer)
//     const elemno = this.vertexIndices.length
//     quadrantsToDraw.forEach((qidx) => {
//       gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer[qidx])
//       gl.vertexAttribPointer(
//         // (hipsShaderProgram as any).locations.vertexPositionAttribute,
//         this._hipsShaderProgram.locations.vertexPositionAttribute,
//         3,
//         gl.FLOAT,
//         false,
//         5 * 4,
//         0
//       )
//       gl.vertexAttribPointer(
//         // (hipsShaderProgram as any).locations.textureCoordAttribute,
//         this._hipsShaderProgram.locations.textureCoordAttribute,
//         2,
//         gl.FLOAT,
//         false,
//         5 * 4,
//         3 * 4
//       )
//       gl.drawElements(gl.TRIANGLES, elemno, gl.UNSIGNED_SHORT, 0)
//     })
//   }
// }
// export default AllSkyTile
//# sourceMappingURL=AllSkyTile.js.map