// 'use strict'
// /**
//  * @author Fabrizio Giordano (Fab77)
//  */
export {};
// import { colorHex2RGB } from '../utils/Utils.js'
// import { mat4 } from 'gl-matrix'
// import global from '../Global.js'
// import Point from './Point.js'
// import CoordsType from '../utils/CoordsType.js'
// import Source from './Source.js'
// import { shaderUtility } from '../utils/ShaderUtility.js'
// import TapMetadataList from '../services/tap/TapMetadataList.js'
// import TapMetadata from '../services/tap/TapMetadata.js'
// import { session } from '../utils/Session.js'
// import { newVisibleTilesManager } from './hips/VisibleTilesManager.js'
// type GL = WebGL2RenderingContext
// class Catalogue {
//   static ELEM_SIZE = 6
//   static BYTES_X_ELEM = new Float32Array().BYTES_PER_ELEMENT
//   private _TYPE: string = 'SOURCE_CATALOGUE'
//   private _name: string
//   private _shaderProgram: WebGLProgram
//   private _gl: GL
//   private _vertexCataloguePositionBuffer: WebGLBuffer
//   private _vertexhoveredCataloguePositionBuffer: WebGLBuffer
//   private _sources: Source[] = []
//   private _oldMouseCoords: number[] | null = null
//   private _vertexCataloguePosition: Float32Array = new Float32Array(0)
//   private _attribLocations: {
//     position: number
//     hovered: number
//     pointSize: number
//     color: WebGLUniformLocation | null
//     brightness: number
//   }
//   private _hoveredIndexes: number[] = []
//   private _selectedIndexes: number[] = []
//   private _extHoveredIndexes: number[] = []
//   private _columns: TapMetadata[] = []
//   private _tapMetadataList: TapMetadataList
//   private _raColumn!: TapMetadata
//   private _decColumn!: TapMetadata
//   private _nameColumn?: TapMetadata
//   private _shapeColumn?: TapMetadata
//   private _colorColumn?: TapMetadata
//   private _tableDescription: string
//   private _tableUrl: string
//   private _healpixDensityMap: Map<number, number[]> = new Map()
//   private _shapeColor = '#8F00FF'
//   private _ready = false
//   constructor(
//     columns: TapMetadata[],
//     raColumn: TapMetadata | undefined,
//     decColumn: TapMetadata | undefined,
//     nameColumn: TapMetadata | undefined,
//     tablename: string,
//     tabledesc: string,
//     tablesurl: string,
//     tapMetadataList: TapMetadataList
//   ) {
//     this._columns = columns
//     this._name = tablename
//     this._tableDescription = tabledesc
//     this._tableUrl = tablesurl
//     this._tapMetadataList = tapMetadataList
//     this._gl = global.gl as GL
//     this._shaderProgram = this._gl.createProgram() as WebGLProgram
//     this._vertexCataloguePositionBuffer = this._gl.createBuffer() as WebGLBuffer
//     this._vertexhoveredCataloguePositionBuffer = this._gl.createBuffer() as WebGLBuffer
//     // Attribute locations placeholders (actual values set in enableShader)
//     this._attribLocations = {
//       position: 0,
//       hovered: 0,
//       pointSize: 0,
//       color: null,
//       brightness: 0
//     }
//     // Pick columns (honor constructor hints if provided, else auto-detect)
//     this.setPositionColumns(this._tapMetadataList, raColumn, decColumn)
//     this.setNameColumn(this._tapMetadataList, nameColumn)
//     this.initShaders()
//   }
//   get ready(): boolean {
//     return this._ready
//   }
//   set ready(bool: boolean) {
//     this._ready = bool
//   }
//   get name(): string {
//     return this._name
//   }
//   get sources(): Source[] {
//     return this._sources
//   }
//   private setPositionColumns(
//     tapMetadataList: TapMetadataList,
//     raHint?: TapMetadata,
//     decHint?: TapMetadata
//   ): void {
//     // Use hints if valid
//     if (raHint?.ucd?.includes('pos.eq.ra')) this._raColumn = raHint
//     if (decHint?.ucd?.includes('pos.eq.dec')) this._decColumn = decHint
//     // Otherwise auto-pick RA
//     if (!this._raColumn) {
//       for (const tm of tapMetadataList.posEqRAMetaColumns) {
//         if (tm.ucd?.includes('pos.eq.ra') && tm.ucd?.includes('meta.main')) {
//           this._raColumn = tm
//           break
//         }
//         if (!this._raColumn) this._raColumn = tm
//       }
//     }
//     // Otherwise auto-pick Dec
//     if (!this._decColumn) {
//       for (const tm of tapMetadataList.posEqDecMetaColumns) {
//         if (tm.ucd?.includes('pos.eq.dec') && tm.ucd?.includes('meta.main')) {
//           this._decColumn = tm
//           break
//         }
//         if (!this._decColumn) this._decColumn = tm
//       }
//     }
//   }
//   private setNameColumn(tapMetadataList: TapMetadataList, nameHint?: TapMetadata): void {
//     if (nameHint) {
//       this._nameColumn = nameHint
//       return
//     }
//     for (const tm of tapMetadataList.metadataList) {
//       if (tm.ucd?.includes('meta.id') && tm.ucd?.includes('meta.main')) {
//         this._nameColumn = tm
//         break
//       }
//     }
//   }
//   private initShaders(): void {
//     const gl = this._gl
//     const shaderProgram = this._shaderProgram
//     const fragmentShader = this.loadShaderFromDOM('cat-shader-fs')
//     const vertexShader = this.loadShaderFromDOM('cat-shader-vs')
//     if (!fragmentShader || !vertexShader) {
//       throw new Error('Catalogue: shader elements not found in DOM.')
//     }
//     gl.attachShader(shaderProgram, vertexShader)
//     gl.attachShader(shaderProgram, fragmentShader)
//     gl.linkProgram(shaderProgram)
//     if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
//       throw new Error('Could not initialise shaders')
//     }
//     shaderUtility.useProgram(shaderProgram)
//   }
//   private loadShaderFromDOM(shaderId: string): WebGLShader | null {
//     const gl = this._gl
//     const shaderScript = document.getElementById(shaderId)
//     if (!shaderScript) return null
//     let shaderSource = ''
//     let currentChild = shaderScript.firstChild
//     while (currentChild) {
//       if (currentChild.nodeType === 3) shaderSource += currentChild.textContent ?? ''
//       currentChild = currentChild.nextSibling
//     }
//     let shader: WebGLShader | null = null
//     if (shaderScript.getAttribute('type') === 'x-shader/x-fragment') {
//       shader = gl.createShader(gl.FRAGMENT_SHADER)
//     } else if (shaderScript.getAttribute('type') === 'x-shader/x-vertex') {
//       shader = gl.createShader(gl.VERTEX_SHADER)
//     }
//     if (!shader) return null
//     gl.shaderSource(shader, shaderSource)
//     gl.compileShader(shader)
//     if (!gl.getShaderParameter(shader, gl. COMPILE_STATUS)) {
//       console.error(gl.getShaderInfoLog(shader) || 'Shader compile error')
//       return null
//     }
//     return shader
//   }
//   addSource(in_source: Source): void {
//     this._sources.push(in_source)
//   }
//   /**
//    * @param in_data - array of rows; each row is an array aligned to TapMetadata indices
//    * @param columnsmeta - TapMetadataList for the table
//    */
//   addSources(in_data: any[][], columnsmeta: TapMetadataList): void {
//     this._columns = columnsmeta.metadataList
//     // re-bind RA/DEC columns by name to actual instances in `columnsmeta`
//     for (const tm of columnsmeta.posEqRAMetaColumns) {
//       if (tm.name === this._raColumn.name) {
//         this._raColumn = tm
//         break
//       }
//     }
//     for (const tm of columnsmeta.posEqDecMetaColumns) {
//       if (tm.name === this._decColumn.name) {
//         this._decColumn = tm
//         break
//       }
//     }
//     for (let j = 0; j < in_data.length; j++) {
//       const row = in_data[j]
//       if (this._raColumn?.index === undefined || this._decColumn?.index === undefined) {
//         console.warn('RA or Dec column index is undefined. Skipping row:', row)
//         continue
//       }
//       const point = new Point(
//         {
//           raDeg: row[this._raColumn.index],
//           decDeg: row[this._decColumn.index]
//         },
//         CoordsType.ASTRO
//       )
//       const source = new Source(point, row)
//       this.addSource(source)
//     }
//     this.initBuffer()
//     this._ready = true
//   }
//   clearSources(): void {
//     this._sources = []
//     this._hoveredIndexes = []
//     this._selectedIndexes = []
//     this._extHoveredIndexes = []
//     this._vertexCataloguePosition = new Float32Array(0)
//     this._healpixDensityMap.clear()
//   }
//   extHighlightSource(source: Source, highlighted: boolean): void {
//     const sIdx = this._sources.indexOf(source)
//     if (sIdx < 0) return
//     if (highlighted) {
//       if (!this._extHoveredIndexes.includes(sIdx)) this._extHoveredIndexes.push(sIdx)
//     } else {
//       const i = this._extHoveredIndexes.indexOf(sIdx)
//       if (i >= 0) this._extHoveredIndexes.splice(i, 1)
//     }
//     const hoveredSources = this._extHoveredIndexes.map(i => this._sources[i])
//     session.updateHoveredSources(this, hoveredSources)
//   }
//   extAddSources2Selected(sources: Source[]): void {
//     for (const s of sources) {
//       const sIdx = this._sources.indexOf(s)
//       if (sIdx >= 0 && !this._selectedIndexes.includes(sIdx)) {
//         this._selectedIndexes.push(sIdx)
//       }
//     }
//   }
//   extRemoveSourceFromSelection(source: Source): void {
//     const idx = this._sources.indexOf(source)
//     if (idx < 0) return
//     const si = this._selectedIndexes.indexOf(idx)
//     if (si >= 0) this._selectedIndexes.splice(si, 1)
//     const hi = this._extHoveredIndexes.indexOf(idx)
//     if (hi >= 0) this._extHoveredIndexes.splice(hi, 1)
//     // not hovered
//     if (this._vertexCataloguePosition.length >= (idx + 1) * Catalogue.ELEM_SIZE) {
//       this._vertexCataloguePosition[idx * Catalogue.ELEM_SIZE + 3] = 0.0
//     }
//   }
//   changeColor(color: string): void {
//     this._shapeColor = color
//   }
//   changeMetaName(metacolumnName: string): void {
//     if (!this._nameColumn || this._nameColumn.name !== metacolumnName) {
//       for (const column of this._columns) {
//         if (column.name === metacolumnName) {
//           this._nameColumn = column
//           break
//         }
//       }
//     }
//   }
//   changeCatalogueMetaRA(metacolumnName: string): boolean {
//     if (this._raColumn.name !== metacolumnName) {
//       for (const column of this._columns) if (column.name === metacolumnName) this._raColumn = column
//     }
//     return true
//   }
//   changeCatalogueMetaDec(metacolumnName: string): boolean {
//     if (this._decColumn.name !== metacolumnName) {
//       for (const column of this._columns) if (column.name === metacolumnName) this._decColumn = column
//     }
//     return true
//   }
//   changeCatalogueMetaShapeSize(metacolumnName: string): void {
//     if (metacolumnName === '--') return
//     if (!this._shapeColumn || this._shapeColumn.name !== metacolumnName) {
//       for (const column of this._columns) {
//         if (column.name === metacolumnName) {
//           this._shapeColumn = column
//           break
//         }
//       }
//       if (!this._shapeColumn || this._shapeColumn.index === undefined) return
//       const mm = this.minMax(this._shapeColumn.index)
//       for (const source of this._sources) {
//         const raw = Number(source.getDetailByindex(this._shapeColumn.index))
//         const normsize = ((raw - mm.min) / (mm.max - mm.min)) * (20 - 8) + 8
//         source.shapeSize = normsize
//       }
//       this.initBuffer()
//     }
//   }
//   changeCatalogueMetaShapeHue(metacolumnName: string): void {
//     if (metacolumnName === '--') return
//     if (!this._colorColumn || this._colorColumn.name !== metacolumnName) {
//       for (const column of this._columns) {
//         if (column.name === metacolumnName) {
//           this._colorColumn = column
//           break
//         }
//       }
//     }
//     if (!this._colorColumn || this._colorColumn.index === undefined) return
//     const mm = this.minMax(this._colorColumn.index)
//     for (const source of this._sources) {
//       const raw = Number(source.getDetailByindex(this._colorColumn.index))
//       const norm = -(((raw - mm.min) / (mm.max - mm.min)) * 2 - 1)
//       source.brightnessFactor = norm
//     }
//     this.initBuffer()
//   }
//   updateColumnMappingByName(
//     raColName: string,
//     decColName: string,
//     nameColName: string,
//     sizeColName: string,
//     color: string,
//     hueColName: string
//   ): boolean {
//     this._shapeColor = color
//     let refreshQueryByFov = false
//     if (this._raColumn.name !== raColName || this._decColumn.name !== decColName) {
//       for (const column of this._columns) {
//         if (column.name === raColName) this._raColumn = column
//         if (column.name === decColName) this._decColumn = column
//       }
//       refreshQueryByFov = true
//     }
//     if (!this._nameColumn || this._nameColumn.name !== nameColName) {
//       for (const column of this._columns) {
//         if (column.name === nameColName) {
//           this._nameColumn = column
//           break
//         }
//       }
//     }
//     if (sizeColName !== '--') this.changeCatalogueMetaShapeSize(sizeColName)
//     if (hueColName !== '--') this.changeCatalogueMetaShapeHue(hueColName)
//     return refreshQueryByFov
//   }
//   private minMax(columnindex: number): { min: number; max: number } {
//     let min = Number.POSITIVE_INFINITY
//     let max = Number.NEGATIVE_INFINITY
//     for (const source of this._sources) {
//       const v = Number(source.getDetailByindex(columnindex))
//       if (v < min) min = v
//       if (v > max) max = v
//     }
//     // fallback if empty
//     if (!isFinite(min) || !isFinite(max)) return { min: 0, max: 1 }
//     return { min, max }
//   }
//   private initBuffer(): void {
//     const gl = this._gl
//     const sources = this._sources
//     const nSources = sources.length
//     gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexCataloguePositionBuffer)
//     this._vertexCataloguePosition = new Float32Array(nSources * Catalogue.ELEM_SIZE)
//     let positionIndex = 0
//     this._healpixDensityMap.clear()
//     for (let j = 0; j < nSources; j++) {
//       const currSource = sources[j]
//       const currPix = currSource.healpixPixel
//       // density map
//       const list = this._healpixDensityMap.get(currPix) ?? []
//       if (!list.includes(j)) list.push(j)
//       this._healpixDensityMap.set(currPix, list)
//       // position (x,y,z)
//       this._vertexCataloguePosition[positionIndex] = currSource.point.x
//       this._vertexCataloguePosition[positionIndex + 1] = currSource.point.y
//       this._vertexCataloguePosition[positionIndex + 2] = currSource.point.z
//       // hovered flag
//       this._vertexCataloguePosition[positionIndex + 3] = 0.0
//       // size
//       this._vertexCataloguePosition[positionIndex + 4] = currSource.shapeSize
//       // brightness factor
//       this._vertexCataloguePosition[positionIndex + 5] = currSource.brightnessFactor
//       positionIndex += Catalogue.ELEM_SIZE
//     }
//     gl.bufferData(gl.ARRAY_BUFFER, this._vertexCataloguePosition, gl.STATIC_DRAW)
//   }
//   private getSelectionRadius(): number {
//     const order = newVisibleTilesManager.getVisibleOrder()
//     switch (order) {
//       case 0:
//       case 1:
//       case 2:
//         return 0.005
//       case 3:
//         return 0.001
//       case 4:
//         return 0.0009
//       case 5:
//         return 0.0005
//       case 6:
//         return 0.0001
//       case 7:
//         return 0.00009
//       case 8:
//         return 0.00005
//       case 9:
//         return 0.00001
//       default:
//         return 0.000005
//     }
//   }
//   private checkSelection(in_mouseHelper: any): number[] {
//     const hoveredIndexes: number[] = []
//     const sourcesHovered: Source[] = []
//     const mousePix = in_mouseHelper.computeNpix256()
//     if (mousePix != null) {
//       const candidates = this._healpixDensityMap.get(mousePix) ?? []
//       const r = this.getSelectionRadius()
//       for (const idx of candidates) {
//         const source = this._sources[idx]
//         if (!source) continue
//         const dx = source.point.x - in_mouseHelper.x
//         const dy = source.point.y - in_mouseHelper.y
//         const dz = source.point.z - in_mouseHelper.z
//         const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
//         if (dist <= r) {
//           hoveredIndexes.push(idx)
//           sourcesHovered.push(source)
//         }
//       }
//     } else {
//       console.log('mousepix is null')
//     }
//     session.updateHoveredSources(this, sourcesHovered)
//     return hoveredIndexes
//   }
//   private enableShader(in_mMatrix: mat4): void {
//     const gl = this._gl
//     gl.useProgram(this._shaderProgram)
//     const uMV = gl.getUniformLocation(this._shaderProgram, 'uMVMatrix')
//     const uP = gl.getUniformLocation(this._shaderProgram, 'uPMatrix')
//     this._attribLocations.position = gl.getAttribLocation(this._shaderProgram, 'aCatPosition')
//     this._attribLocations.hovered = gl.getAttribLocation(this._shaderProgram, 'a_selected')
//     this._attribLocations.pointSize = gl.getAttribLocation(this._shaderProgram, 'a_pointsize')
//     this._attribLocations.color = gl.getUniformLocation(this._shaderProgram, 'u_fragcolor')
//     this._attribLocations.brightness = gl.getAttribLocation(this._shaderProgram, 'a_brightness')
//     let mvMatrix: mat4;
//     if (global.camera) {
//       mvMatrix = mat4.multiply(mat4.create(), global.camera.getCameraMatrix(), in_mMatrix);
//     } else {
//       mvMatrix = mat4.create(); // fallback to identity matrix if camera is null
//     }
//     if (uMV) gl.uniformMatrix4fv(uMV, false, mvMatrix)
//     if (uP) {
//       const pMatrix = global.pMatrix ?? mat4.create();
//       gl.uniformMatrix4fv(uP, false, pMatrix);
//     }
//   }
//   /**
//    * @param in_mMatrix - model matrix of the associated object (e.g. HiPS matrix)
//    */
//   draw(in_mMatrix: mat4, in_mouseHelper: any): void {
//     const gl = this._gl
//     this.enableShader(in_mMatrix)
//     gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexCataloguePositionBuffer)
//     // aCatPosition (vec3)
//     gl.vertexAttribPointer(
//       this._attribLocations.position,
//       3,
//       gl.FLOAT,
//       false,
//       Catalogue.BYTES_X_ELEM * Catalogue.ELEM_SIZE,
//       0
//     )
//     gl.enableVertexAttribArray(this._attribLocations.position)
//     // a_selected (float)
//     gl.vertexAttribPointer(
//       this._attribLocations.hovered,
//       1,
//       gl.FLOAT,
//       false,
//       Catalogue.BYTES_X_ELEM * Catalogue.ELEM_SIZE,
//       Catalogue.BYTES_X_ELEM * 3
//     )
//     gl.enableVertexAttribArray(this._attribLocations.hovered)
//     // a_pointsize (float)
//     gl.vertexAttribPointer(
//       this._attribLocations.pointSize,
//       1,
//       gl.FLOAT,
//       false,
//       Catalogue.BYTES_X_ELEM * Catalogue.ELEM_SIZE,
//       Catalogue.BYTES_X_ELEM * 4
//     )
//     gl.enableVertexAttribArray(this._attribLocations.pointSize)
//     // a_brightness (float)
//     gl.vertexAttribPointer(
//       this._attribLocations.brightness,
//       1,
//       gl.FLOAT,
//       false,
//       Catalogue.BYTES_X_ELEM * Catalogue.ELEM_SIZE,
//       Catalogue.BYTES_X_ELEM * 5
//     )
//     gl.enableVertexAttribArray(this._attribLocations.brightness)
//     // u_fragcolor
//     const rgb = colorHex2RGB(this._shapeColor)
//     const alpha = 1.0
//     if (this._attribLocations.color) {
//       gl.uniform4f(this._attribLocations.color, rgb[0], rgb[1], rgb[2], alpha)
//     }
//     // mouse hover update
//     if (in_mouseHelper != null && in_mouseHelper.xyz !== this._oldMouseCoords) {
//       // clear old hovered
//       for (const k of this._hoveredIndexes) {
//         this._vertexCataloguePosition[k * Catalogue.ELEM_SIZE + 3] = 0.0
//         this._vertexCataloguePosition[k * Catalogue.ELEM_SIZE + 4] =
//           this._sources[k].shapeSize
//       }
//       this._hoveredIndexes = this.checkSelection(in_mouseHelper)
//       // set new hovered
//       for (const i of this._hoveredIndexes) {
//         this._vertexCataloguePosition[i * Catalogue.ELEM_SIZE + 3] = 1.0
//         this._vertexCataloguePosition[i * Catalogue.ELEM_SIZE + 4] =
//           this._sources[i].shapeSize
//       }
//     }
//     // selected
//     for (const s of this._selectedIndexes) {
//       this._vertexCataloguePosition[s * Catalogue.ELEM_SIZE + 3] = 2.0
//       this._vertexCataloguePosition[s * Catalogue.ELEM_SIZE + 4] =
//         this._sources[s].shapeSize
//     }
//     // external hovered
//     for (const e of this._extHoveredIndexes) {
//       this._vertexCataloguePosition[e * Catalogue.ELEM_SIZE + 3] = 1.0
//       this._vertexCataloguePosition[e * Catalogue.ELEM_SIZE + 4] =
//         this._sources[e].shapeSize
//     }
//     gl.bufferData(gl.ARRAY_BUFFER, this._vertexCataloguePosition, gl.STATIC_DRAW)
//     const numItems = this._vertexCataloguePosition.length / Catalogue.ELEM_SIZE
//     gl.drawArrays(gl.POINTS, 0, numItems)
//     this._oldMouseCoords = in_mouseHelper?.xyz ?? null
//   }
// }
// export default Catalogue
//# sourceMappingURL=Catalogue.js.map