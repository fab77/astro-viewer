// 'use strict'
// /**
//  * FootprintSet.ts (TS port, chunked)
//  * Key fixes:
//  *  - Removed duplicate `_indexes`
//  *  - Uses computePerspectiveMatrixSingleton.pMatrix (not global.pMatrix)
//  *  - Caches OES_element_index_uint support
//  *  - Skips empty hovered/selected draws
//  *  - Clones _oldMouseCoords for comparison
//  */
export {};
// import { colorHex2RGB } from '../utils/Utils.js'
// import { mat4 } from 'gl-matrix'
// import global from '../Global.js'
// import Point from './Point.js'
// import CoordsType from '../utils/CoordsType.js'
// import Footprint from './Footprint.js'
// import { shaderUtility } from '../utils/ShaderUtility.js'
// import GeomUtils from '../utils/GeomUtils.js'
// import TapMetadataList from '../../services/tap/TapMetadataList.js'
// import { session } from '../utils/Session.js'
// import computePerspectiveMatrixSingleton from '../utils/ComputePerspectiveMatrix.js'
// type GL = WebGL2RenderingContext | WebGLRenderingContext
// type AttribLocations = {
//   position: number
//   selected: number
//   pointSize: number
//   color: WebGLUniformLocation | null
// }
// export default class FootprintSet {
//   static ELEM_SIZE: number
//   static CONVEXPOLY_ELEM_SIZE: number
//   static BYTES_X_ELEM: number
//   private _shaderProgram: WebGLProgram
//   private _gl: GL
//   private _vertexCataloguePositionBuffer: WebGLBuffer
//   private _indexBuffer: WebGLBuffer
//   private _indexes!: Uint32Array
//   private _vertexCataloguePosition!: Float32Array
//   private _footprints: Footprint[] = []
//   private _oldMouseCoords: number[] | null = null
//   private _attribLocations: AttribLocations = { position: 0, selected: 1, pointSize: 2, color: null }
//   private _totPoints = 0
//   private _footprintsInPix256: Map<number, Footprint[]> = new Map()
//   private _nPrimitiveFlags = 0
//   private _totConvexPoints = 0
//   private _ready = false
//   private _columns: any[]
//   private _name: string
//   private _geomColumn: any | undefined
//   private _nameColumn: any | undefined
//   private _raColumn: any | undefined
//   private _decColumn: any | undefined
//   private _hoveredFootprints: Footprint[] = []
//   private _hoveredVertexPositionBuffer: WebGLBuffer
//   private _hoveredIndexBuffer: WebGLBuffer
//   private _totHoveredPoints = 0
//   private _hoveredIndex!: Uint32Array
//   private _hoveredVertexPosition!: Float32Array
//   private _nHoveredPrimitiveFlags = 0
//   private _selectedFootprints: Footprint[] = []
//   private _selectedVertexPositionBuffer: WebGLBuffer
//   private _selectedIndexBuffer: WebGLBuffer
//   private _totSelectedPoints = 0
//   private _selectedIndex!: Uint32Array
//   private _selectedVertexPosition!: Float32Array
//   private _nSlectedPrimitiveFlags = 0
//   private _shapeColor = '#8F00FF'
//   private _hue: number
//   private _hasUintElementIndex: boolean
//   private _tableDescription: string | undefined
//   private _tableUrl: string | undefined
//   private _pgSphereColumn: any
//     /**
//      * FootprintSet.ts (TS port, chunked)
//      * Key fixes:
//      *  - Removed duplicate `_indexes`
//      *  - Uses computePerspectiveMatrixSingleton.pMatrix (not global.pMatrix)
//      *  - Caches OES_element_index_uint support
//      *  - Skips empty hovered/selected draws
//      *  - Clones _oldMouseCoords for comparison
//      */
//     | undefined
//   constructor(
//     columns: any[],
//     geomColumn: any,
//     nameColumn: any,
//     tablename: string,
//     tabledesc: string | undefined,
//     tablesurl: string | undefined,
//     tapMetadataList: TapMetadataList
//   ) {
//     FootprintSet.ELEM_SIZE = 3
//     FootprintSet.CONVEXPOLY_ELEM_SIZE = 3
//     FootprintSet.BYTES_X_ELEM = new Float32Array().BYTES_PER_ELEMENT
//     this._columns = columns
//     this._name = tablename
//     this._gl = global.gl as GL
//     this._shaderProgram = this._gl.createProgram() as WebGLProgram
//     // Buffers
//     this._vertexCataloguePositionBuffer = this._gl.createBuffer() as WebGLBuffer
//     this._indexBuffer = this._gl.createBuffer() as WebGLBuffer
//     this._hoveredVertexPositionBuffer = this._gl.createBuffer() as WebGLBuffer
//     this._hoveredIndexBuffer = this._gl.createBuffer() as WebGLBuffer
//     this._selectedVertexPositionBuffer = this._gl.createBuffer() as WebGLBuffer
//     this._selectedIndexBuffer = this._gl.createBuffer() as WebGLBuffer
//     // Metadata mapping
//     this.setPositionColumns(tapMetadataList)
//     this.setNameColumn(tapMetadataList)
//     if (nameColumn === undefined) this._nameColumn = 'NAME NOT SET'
//     this._tableDescription = tabledesc
//     this._tableUrl = tablesurl
//     // 32-bit index support
//     const isWebGL2 = typeof (this._gl as any).texStorage2D === 'function'
//     this._hasUintElementIndex = isWebGL2 || !!this._gl.getExtension('OES_element_index_uint')
//     this.initShaders()
//   }
//   get raColumn() { return this._raColumn }
//   get decColumn() { return this._decColumn }
//   get ready() { return this._ready }
//   set ready(v: boolean) { this._ready = v }
//   private setPositionColumns(tapMetadataList: TapMetadataList) {
//     for (const m of tapMetadataList.pgSphereMetaColumns) this._pgSphereColumn = m
//     if (tapMetadataList.pgSphereMetaColumns.length > 0) {
//       console.warn('multiple pg_sphere columns found, using the last one')
//     }
//     for (const m of tapMetadataList.sRegionMetaColumns) {
//       if (m.ucd?.includes('pos.outline;obs.field')) { this._geomColumn = m; break }
//       if (!this._geomColumn) this._geomColumn = m
//     }
//     for (const m of tapMetadataList._posEqRAMetaColumns) {
//       if (m.ucd?.includes('meta.main')) { this._raColumn = m; break }
//       if (!this._raColumn) this._raColumn = m
//     }
//     for (const m of tapMetadataList._posEqDecMetaColumns) {
//       if (m.ucd?.includes('meta.main')) { this._decColumn = m; break }
//       if (!this._decColumn) this._decColumn = m
//     }
//   }
//   private setNameColumn(tapMetadataList: TapMetadataList) {
//     for (const m of tapMetadataList._metadataList) {
//       if (m.ucd?.includes('meta.id') && m.ucd?.includes('meta.main')) this._nameColumn = m
//     }
//   }
//   private initShaders() {
//     const gl = this._gl
//     const fs = this.loadShaderFromDOM('fpcat-shader-fs')
//     const vs = this.loadShaderFromDOM('fpcat-shader-vs')
//     gl.attachShader(this._shaderProgram, vs)
//     gl.attachShader(this._shaderProgram, fs)
//     gl.linkProgram(this._shaderProgram)
//     if (!gl.getProgramParameter(this._shaderProgram, gl.LINK_STATUS)) {
//       throw new Error('Could not initialise shaders')
//     }
//     shaderUtility.useProgram(this._shaderProgram)
//   }
//   private loadShaderFromDOM(shaderId: string): WebGLShader {
//     const gl = this._gl
//     const script = document.getElementById(shaderId)
//     if (!script) throw new Error(`Shader DOM node not found: ${shaderId}`)
//     let src = ''
//     let node = script.firstChild
//     while (node) {
//       if (node.nodeType === 3) src += (node as any).textContent
//       node = node.nextSibling
//     }
//     const shader =
//       (script as any).type === 'x-shader/x-fragment'
//         ? gl.createShader(gl.FRAGMENT_SHADER)!
//         : gl.createShader(gl.VERTEX_SHADER)!
//     gl.shaderSource(shader, src)
//     gl.compileShader(shader)
//     if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
//       throw new Error(gl.getShaderInfoLog(shader) || 'Shader compile error')
//     }
//     return shader
//   }
//   get name() { return this._name }
//   get footprints() { return this._footprints }
//   addFootprint(fp: Footprint) { this._footprints.push(fp) }
//   addFootprints(rows: any[], columnsmeta: any[]) {
//     this._columns = columnsmeta
//     for (let j = 0; j < rows.length; j++) {
//       if (rows[j][0] == null) continue
//       const fp = new Footprint(rows[j][this._geomColumn._index], rows[j])
//       this.addFootprint(fp)
//       this._totPoints += fp.totPoints
//       this._totConvexPoints += fp.totConvexPoints
//     }
//     this.initBuffer()
//     this._ready = true
//   }
//   private initBuffer() {
//     const nFootprints = this._footprints.length
//     let npolygons = nFootprints - 1
//     for (let j = 0; j < nFootprints; j++) npolygons += this._footprints[j].polygons.length - 1
//     // one restart token per polygon chunk
//     this._indexes = new Uint32Array(this._totPoints + npolygons + 1)
//     const RESTART = 0xffffffff
//     const gl = this._gl
//     gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexCataloguePositionBuffer)
//     this._vertexCataloguePosition = new Float32Array(3 * this._totPoints)
//     let positionIndex = 0
//     let vIdx = 0
//     const R = 1.0
//     this._nPrimitiveFlags = 0
//     const footprintsInPix256 = this._footprintsInPix256
//     for (let j = 0; j < nFootprints; j++) {
//       const fp = this._footprints[j]
//       const polys = fp.polygons
//       const identifier = (fp as any).identifier
//       if (global.healpix4footprints) {
//         fp.pixels?.forEach((pix: number) => {
//           const curr = footprintsInPix256.get(pix) || []
//           if (!curr.includes(identifier)) curr.push(fp)
//           footprintsInPix256.set(pix, curr)
//         })
//       }
//       if (j > 0) { this._indexes[vIdx++] = RESTART; this._nPrimitiveFlags++ }
//       for (let pi = 0; pi < polys.length; pi++) {
//         if (pi > 0) { this._indexes[vIdx++] = RESTART; this._nPrimitiveFlags++ }
//         const poly = polys[pi]
//         for (let k = 0; k < poly.length; k++) {
//           const p = poly[k]
//           this._vertexCataloguePosition[positionIndex] = R * p.x
//           this._vertexCataloguePosition[positionIndex + 1] = R * p.y
//           this._vertexCataloguePosition[positionIndex + 2] = R * p.z
//           this._indexes[vIdx++] = Math.floor(positionIndex / 3)
//           positionIndex += 3
//         }
//       }
//     }
//     this._indexes[this._indexes.length - 1] = RESTART
//     this._footprintsInPix256 = footprintsInPix256
//   }
//   private initHoveringBuffer() {
//     if (this._hoveredFootprints.length === 0) return
//     const n = this._hoveredFootprints.length
//     let npolygons = n - 1
//     for (let j = 0; j < n; j++) npolygons += this._hoveredFootprints[j].polygons.length - 1
//     this._hoveredIndex = new Uint32Array(this._totHoveredPoints + npolygons)
//     const RESTART = 0xffffffff
//     const gl = this._gl
//     gl.bindBuffer(gl.ARRAY_BUFFER, this._hoveredVertexPositionBuffer)
//     this._hoveredVertexPosition = new Float32Array(3 * this._totHoveredPoints)
//     let positionIndex = 0
//     let vIdx = 0
//     const R = 1.0
//     this._nHoveredPrimitiveFlags = 0
//     for (let j = 0; j < n; j++) {
//       const polys = this._hoveredFootprints[j].polygons
//       if (j > 0) { this._hoveredIndex[vIdx++] = RESTART; this._nHoveredPrimitiveFlags++ }
//       for (let pi = 0; pi < polys.length; pi++) {
//         if (pi > 0) { this._hoveredIndex[vIdx++] = RESTART; this._nHoveredPrimitiveFlags++ }
//         const poly = polys[pi]
//         for (let k = 0; k < poly.length; k++) {
//           const p = poly[k]
//           this._hoveredVertexPosition[positionIndex] = R * p.x
//           this._hoveredVertexPosition[positionIndex + 1] = R * p.y
//           this._hoveredVertexPosition[positionIndex + 2] = R * p.z
//           this._hoveredIndex[vIdx++] = Math.floor(positionIndex / 3)
//           positionIndex += 3
//         }
//       }
//     }
//   }
//   private initSelectionBuffer() {
//     const n = this._selectedFootprints.length
//     let npolygons = n - 1
//     for (let j = 0; j < n; j++) npolygons += this._selectedFootprints[j].polygons.length - 1
//     this._selectedIndex = new Uint32Array(this._totSelectedPoints + npolygons)
//     const RESTART = 0xffffffff
//     const gl = this._gl
//     gl.bindBuffer(gl.ARRAY_BUFFER, this._selectedVertexPositionBuffer)
//     this._selectedVertexPosition = new Float32Array(3 * this._totSelectedPoints)
//     let positionIndex = 0
//     let vIdx = 0
//     const R = 1.0
//     this._nSlectedPrimitiveFlags = 0
//     for (let j = 0; j < n; j++) {
//       const polys = this._selectedFootprints[j].polygons
//       if (j > 0) { this._selectedIndex[vIdx++] = RESTART; this._nSlectedPrimitiveFlags++ }
//       for (let pi = 0; pi < polys.length; pi++) {
//         if (pi > 0) { this._selectedIndex[vIdx++] = RESTART; this._nSlectedPrimitiveFlags++ }
//         const poly = polys[pi]
//         for (let k = 0; k < poly.length; k++) {
//           const p = poly[k]
//           this._selectedVertexPosition[positionIndex] = R * p.x
//           this._selectedVertexPosition[positionIndex + 1] = R * p.y
//           this._selectedVertexPosition[positionIndex + 2] = R * p.z
//           this._selectedIndex[vIdx++] = Math.floor(positionIndex / 3)
//           positionIndex += 3
//         }
//       }
//     }
//   }
//   addFootprint2Selected(list: Footprint[]) {
//     let changed = false
//     for (const f of list) {
//       if (!this._selectedFootprints.includes(f)) {
//         this._selectedFootprints.push(f)
//         this._totSelectedPoints += f.totPoints
//         changed = true
//       }
//     }
//     if (changed) this.initSelectionBuffer()
//   }
//   removeFootprintFromSelection(fp: Footprint) {
//     const idx = this._selectedFootprints.indexOf(fp)
//     if (idx >= 0) {
//       this._selectedFootprints.splice(idx, 1)
//       this._totSelectedPoints -= fp.totPoints
//       if (this._selectedFootprints.length > 0) this.initSelectionBuffer()
//     }
//   }
//   highlightFootprint(fp: Footprint, highlighted: boolean) {
//     if (highlighted) {
//       this._hoveredFootprints.push(fp)
//       this._totHoveredPoints += fp.totPoints
//     } else {
//       const i = this._hoveredFootprints.indexOf(fp)
//       if (i >= 0) {
//         this._hoveredFootprints.splice(i, 1)
//         this._totHoveredPoints -= fp.totPoints
//       }
//     }
//     this.initHoveringBuffer()
//     session.updateHoveredFootprints(this, this._hoveredFootprints)
//   }
//   private checkSelection(mouseHelper: any) {
//     const mousePix = mouseHelper.computeNpix256()
//     if (mousePix === null) return
//     this._hoveredFootprints = []
//     this._totHoveredPoints = 0
//     const mousePoint = new Point(
//       { x: mouseHelper.x, y: mouseHelper.y, z: mouseHelper.z },
//       CoordsType.CARTESIAN
//     )
//     for (const fp of this._footprints) {
//       if (GeomUtils.checkPointInsidePolygon5(fp['_selectionObj'], mousePoint)) {
//         this._hoveredFootprints.push(fp)
//         this._totHoveredPoints += fp.totPoints
//       }
//     }
//     this.initHoveringBuffer()
//     session.updateHoveredFootprints(this, this._hoveredFootprints)
//   }
//   private enableShader(modelMatrix: mat4) {
//     const gl = this._gl
//     gl.useProgram(this._shaderProgram);
//     const catUniformMVMatrixLoc = gl.getUniformLocation(this._shaderProgram, 'uMVMatrix')
//     const catUniformProjMatrixLoc = gl.getUniformLocation(this._shaderProgram, 'uPMatrix')
//     const pointsize = gl.getUniformLocation(this._shaderProgram, 'u_pointsize')
//     this._attribLocations.position = gl.getAttribLocation(this._shaderProgram, 'aCatPosition')
//     this._attribLocations.color = gl.getUniformLocation(this._shaderProgram, 'u_fragcolor')
//     if (!global.camera) {
//       throw new Error('Camera is not initialized');
//     }
//     const mv = mat4.multiply(mat4.create(), global.camera.getCameraMatrix(), modelMatrix)
//     if (!mv) {
//       throw new Error('Model-View matrix is null');
//     }
//     if (!computePerspectiveMatrixSingleton.pMatrix) {
//       throw new Error('Projection matrix is null');
//     }
//     gl.uniformMatrix4fv(catUniformMVMatrixLoc, false, mv)
//     gl.uniformMatrix4fv(catUniformProjMatrixLoc, false, computePerspectiveMatrixSingleton.pMatrix)
//     gl.uniform1f(pointsize, 14.0)
//   }
//   /**
//    * @param modelMatrix: model matrix the current catalogue is associated to (e.g. HiPS matrix)
//    * @param mouseHelper
//    */
//   draw(modelMatrix: mat4, mouseHelper: any) {
//     const gl = this._gl
//     this.enableShader(modelMatrix)
//     // Mouse selection
//     const mxyz = mouseHelper?.xyz ? [...mouseHelper.xyz] : null
//     if (mouseHelper && (!this._oldMouseCoords || mxyz!.some((v, i) => v !== this._oldMouseCoords![i]))) {
//       this.checkSelection(mouseHelper)
//       this._oldMouseCoords = mxyz
//     }
//     // Hovered footprints
//     if (this._hoveredFootprints.length > 0) {
//       const alpha = [1.0];
//       let rgb = colorHex2RGB('#00FF00').concat(alpha);
//       gl.uniform4f(this._attribLocations.color, rgb[0], rgb[1], rgb[2], rgb[3])
//       gl.uniform1f((this._shaderProgram as any).pointsize, 14.0)
//       gl.bindBuffer(gl.ARRAY_BUFFER, this._hoveredVertexPositionBuffer)
//       gl.bufferData(gl.ARRAY_BUFFER, this._hoveredVertexPosition, gl.STATIC_DRAW)
//       gl.vertexAttribPointer(
//         this._attribLocations.position, FootprintSet.ELEM_SIZE, gl.FLOAT, false,
//         FootprintSet.BYTES_X_ELEM * FootprintSet.ELEM_SIZE, 0
//       )
//       gl.enableVertexAttribArray(this._attribLocations.position)
//       gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._hoveredIndexBuffer)
//       gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this._hoveredIndex, gl.STATIC_DRAW)
//       gl.drawElements(
//         gl.LINE_LOOP,
//         this._hoveredVertexPosition.length / 3 + this._nHoveredPrimitiveFlags,
//         gl.UNSIGNED_INT,
//         0
//       )
//     }
//     // Selected footprints
//     if (this._selectedFootprints.length > 0) {
//       const alpha = [1.0];
//       let rgb = colorHex2RGB('#ECB462').concat(alpha);
//       gl.uniform4f(this._attribLocations.color, rgb[0], rgb[1], rgb[2], rgb[3])
//       // gl.uniform1f(this._shaderProgram.pointsize, 14.0)
//       gl.bindBuffer(gl.ARRAY_BUFFER, this._selectedVertexPositionBuffer)
//       gl.bufferData(gl.ARRAY_BUFFER, this._selectedVertexPosition, gl.STATIC_DRAW)
//       gl.vertexAttribPointer(
//         this._attribLocations.position, FootprintSet.ELEM_SIZE, gl.FLOAT, false,
//         FootprintSet.BYTES_X_ELEM * FootprintSet.ELEM_SIZE, 0
//       )
//       gl.enableVertexAttribArray(this._attribLocations.position)
//       gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._selectedIndexBuffer)
//       gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this._selectedIndex, gl.STATIC_DRAW)
//       gl.drawElements(
//         gl.LINE_LOOP,
//         this._selectedVertexPosition.length / 3 + this._nSlectedPrimitiveFlags,
//         gl.UNSIGNED_INT,
//         0
//       )
//     }
//     // Main geometry
//     gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexCataloguePositionBuffer)
//     gl.bufferData(gl.ARRAY_BUFFER, this._vertexCataloguePosition, gl.STATIC_DRAW)
//     gl.vertexAttribPointer(
//       this._attribLocations.position, FootprintSet.ELEM_SIZE, gl.FLOAT, false,
//       FootprintSet.BYTES_X_ELEM * FootprintSet.ELEM_SIZE, 0
//     )
//     gl.enableVertexAttribArray(this._attribLocations.position)
//     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer)
//     gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this._indexes, gl.STATIC_DRAW)
//     const alpha = [1.0];
//     let rgb = colorHex2RGB(this._shapeColor).concat(alpha);
//     gl.uniform4f(this._attribLocations.color, rgb[0], rgb[1], rgb[2], rgb[3])
//     gl.uniform1f((this._shaderProgram as any).pointsize, 4.0)
//     // Draw
//     if (!this._hasUintElementIndex) throw new Error('32-bit index not supported in this context')
//     gl.drawElements(
//       gl.LINE_LOOP,
//       this._vertexCataloguePosition.length / 3 + this._nPrimitiveFlags,
//       gl.UNSIGNED_INT,
//       0
//     )
//     if (global.showPointsInPolygons) {
//       gl.drawElements(
//         gl.POINTS,
//         this._vertexCataloguePosition.length / 3 + 1,
//         gl.UNSIGNED_SHORT,
//         0
//       )
//     }
//     gl.bindBuffer(gl.ARRAY_BUFFER, null)
//     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)
//   }
// }
//# sourceMappingURL=FootprintSet.js.map