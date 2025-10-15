import { shaderUtility } from '../../utils/ShaderUtility.js'
import Footprint from './Footprint.js'
import FootprintProps from './FootprintProps.js'
import { mat4 } from 'gl-matrix'
import global from '../../Global.js'
import { colorHex2RGB } from '../../utils/Utils.js'
import computePerspectiveMatrixSingleton from '../../utils/ComputePerspectiveMatrix.js'
import { TapRepo } from '../tap/TapRepo.js'
import TapMetadataList from '../tap/TapMetadataList.js'
import { footprintShaderProgram } from '../../shader/FootprintShaderProgram.js'
import TapMetadata from '../tap/TapMetadata.js'
import MouseHelper from '../../utils/MouseHelper.js'
import Point from '../Point.js'
import GeomUtils from '../../utils/GeomUtils.js'
import CoordsType from '../../utils/CoordsType.js'

type GL = WebGL2RenderingContext;

export interface HoveredFootprintDetail {
  metadata: TapMetadataList
  footprints: Footprint[]
  tableName: string
  description: string
  provider: string
}



class FootprintSetGL {
  static ELEM_SIZE = 3
  static BYTES_X_ELEM = new Float32Array().BYTES_PER_ELEMENT
  static CONVEXPOLY_ELEM_SIZE = 3

  ready: boolean
  footprintsetProps: FootprintProps
  name: string
  description: string
  tapRepo: TapRepo

  extHoveredIndexes!: Uint32Array

  oldMouseCoords: any
  healpixDensityMap: any



  totConvexPoints!: number

  // footprintsInPix256: Map<number, Footprint[]>

  gl: GL;

  // shaderProgram: WebGLProgram
  vertexCataloguePositionBuffer!: WebGLBuffer
  indexBuffer!: WebGLBuffer

  hoveredVertexPositionBuffer!: WebGLBuffer
  hoveredIndexBuffer!: WebGLBuffer

  selectedVertexPositionBuffer!: WebGLBuffer
  selectedIndexBuffer!: WebGLBuffer


  indexes!: Uint32Array
  footprintPolygons: Footprint[] = []
  vertexCataloguePosition!: Float32Array
  totPoints!: number
  nPrimitiveFlags: number = 0


  hoveredIndexes!: Uint32Array
  private _hoveredFootprints: Footprint[] = []
  hoveredVertexPosition!: Float32Array
  totHoveredPoints!: number
  nHoveredPrimitiveFlags: number = 0

  selectedIndexes!: Uint32Array
  private _selectedFootprints: Footprint[] = []
  selectedVertexPosition!: Float32Array
  totSelectedPoints!: number
  nSlectedPrimitiveFlags: number = 0


  _isVisible: boolean = true

  constructor(
    tablename: string,
    tabledesc: string,
    tapRepo: TapRepo,
    tapMetadataList: TapMetadataList) {

    this.ready = false;
    (this as any).TYPE = 'FOOTPRINT_SET';

    this.name = tablename
    this.description = tabledesc
    this.tapRepo = tapRepo

    // this.footprintsInPix256 = new Map()

    this.initFootprintArrays()
    if (!global.gl) {
      throw new Error('WebGL2RenderingContext is not initialized (global.gl is null)')
    }

    this.gl = global.gl as GL
    this.initGLBuffers()

    this.oldMouseCoords = null

    const defaultColor = '#00fff2ff'
    this.footprintsetProps = new FootprintProps(tapMetadataList, defaultColor)

    footprintShaderProgram.shaderProgram

  }

  private initFootprintArrays(): void {
    this.footprintPolygons = []
    this.indexes = new Uint32Array()
    this.vertexCataloguePosition = new Float32Array()
    this.totPoints = 0
    this.totConvexPoints = 0
    this.extHoveredIndexes = new Uint32Array

    this._hoveredFootprints = []
    this.hoveredVertexPosition = new Float32Array()
    this.totHoveredPoints = 0
    this.hoveredIndexes = new Uint32Array

    this._selectedFootprints = []
    this.selectedVertexPosition = new Float32Array()
    this.totSelectedPoints = 0
    this.selectedIndexes = new Uint32Array
  }

  private initGLBuffers(): void {

    this.vertexCataloguePositionBuffer = this.gl.createBuffer()
    this.indexBuffer = this.gl.createBuffer()

    this.hoveredVertexPositionBuffer = this.gl.createBuffer()
    this.hoveredIndexBuffer = this.gl.createBuffer()

    this.selectedVertexPositionBuffer = this.gl.createBuffer()
    this.selectedIndexBuffer = this.gl.createBuffer()

  }

  public setIsVisible(visibility: boolean) {
    this._isVisible = visibility
  }

  get isVisible() {
    return this._isVisible
  }

  addFootprint(in_footprint: Footprint): void {
    this.footprintPolygons.push(in_footprint)
  }

  addFootprints(in_data: any[], columnsmeta: TapMetadata[]): void {
    this.ready = false
    const geomDataIndex = this.footprintsetProps.geomColumn?.index
    if (geomDataIndex === undefined) {
      throw new Error('geomColumn or its index is undefined in footprintsetProps')
    }

    for (let j = 0; j < in_data.length; j++) {
      if (in_data[j][0] !== null) {
        const footprint = new Footprint(in_data[j][geomDataIndex], in_data[j])
        if ((footprint as any)._valid) {
          this.addFootprint(footprint)
          this.totPoints += footprint.totPoints
          this.totConvexPoints += footprint.totConvexPoints
        }
      }
    }

    this.initBuffer()
    this.ready = true
  }

  clearFootprints(): void {
    this.initFootprintArrays()
  }


  private initBuffer(): void {
    const nFootprints = this.footprintPolygons.length
    let npolygons = nFootprints - 1

    for (let j = 0; j < nFootprints; j++) {
      npolygons += this.footprintPolygons[j].polygons.length - 1
    }

    this.indexes = new Uint32Array(this.totPoints + npolygons + 1)
    const MAX_UNSIGNED_INT = 0xffffffff

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexCataloguePositionBuffer)
    this.vertexCataloguePosition = new Float32Array(3 * this.totPoints)

    let positionIndex = 0
    let vIdx = 0
    const R = 1.0
    this.nPrimitiveFlags = 0

    for (let j = 0; j < nFootprints; j++) {
      const footprint = this.footprintPolygons[j]
      const footprintPoly = footprint.polygons

      if (j > 0) {
        this.indexes[vIdx++] = MAX_UNSIGNED_INT
        this.nPrimitiveFlags++
      }

      for (const poly of footprintPoly) {
        if (poly !== footprintPoly[0]) {
          this.indexes[vIdx++] = MAX_UNSIGNED_INT
          this.nPrimitiveFlags++
        }

        for (const point of poly) {
          this.vertexCataloguePosition[positionIndex++] = R * point.x
          this.vertexCataloguePosition[positionIndex++] = R * point.y
          this.vertexCataloguePosition[positionIndex++] = R * point.z
          this.indexes[vIdx++] = Math.floor((positionIndex - 1) / 3)
        }
      }
    }

    this.indexes[this.indexes.length - 1] = MAX_UNSIGNED_INT
    console.log('Buffer initialized')
  }

  checkSelection(mouseHelper: MouseHelper) {

    if (!mouseHelper.x || !mouseHelper.y || !mouseHelper.z) return

    let mousePix = mouseHelper.computeNpix()
    if (!mousePix) return

    this._hoveredFootprints = []
    this.totHoveredPoints = 0

    const mousePoint = new Point(
      { x: mouseHelper.x, y: mouseHelper.y, z: mouseHelper.z },
      CoordsType.CARTESIAN
    )

    for (let i = 0; i < this.footprintPolygons.length; i++) {
      const footprint: Footprint = this.footprintPolygons[i]
      if (!footprint.selectionObj) continue

      if (GeomUtils.checkPointInsidePolygon5(footprint.selectionObj, mousePoint)) {
        const details = [...footprint.details]
        const geomDataIndex = this.footprintsetProps.geomColumn?.index

        if (geomDataIndex === undefined) continue;

        details.splice(geomDataIndex, 1)
        this._hoveredFootprints.push(footprint)
        this.totHoveredPoints += footprint.totPoints
      }
    }
    this.initHoveringBuffer()
  }

  get hoveredFootprints(): HoveredFootprintDetail {
    return {
      metadata: this.footprintsetProps.tapMetadataList,
      footprints: this._hoveredFootprints,
      tableName: this.name,
      description: this.description,
      provider: this.tapRepo.tapBaseUrl
    }
  }

  get selectedFootprints(): Footprint[] {
    return this._selectedFootprints
  }

  highlightFootprint(footprint: Footprint, highlighted: boolean) {
    if (highlighted) {
      this._hoveredFootprints.push(footprint)
      this.totHoveredPoints += footprint.totPoints
    } else {
      const indexOfFootprint = this._hoveredFootprints.indexOf(footprint)
      this._hoveredFootprints.splice(indexOfFootprint, 1)
      this.totHoveredPoints -= footprint.totPoints
    }
    this.initHoveringBuffer()
  }

  /**
   *
   * @param {Footprint[]} footprints
   */

  addFootprint2Selected(footprints: Footprint[]) {
    let refreshBuffer = false
    for (let f of footprints) {
      if (!this._selectedFootprints.includes(f)) {
        this._selectedFootprints.push(f)
        this.totSelectedPoints += f.totPoints
        refreshBuffer = true
      }
    }
    if (refreshBuffer) {
      this.initSelectionBuffer()
    }
  }

  /**
   *
   * @param {Footprint} footprint
   */
  removeFootprintFromSelection(footprint: Footprint) {
    const indexOfObject = this._selectedFootprints.indexOf(footprint)
    if (indexOfObject >= 0) {
      this._selectedFootprints.splice(indexOfObject, 1)
      this.totSelectedPoints -= footprint.totPoints
      if (this._selectedFootprints.length > 0) {
        this.initSelectionBuffer()
      }
    }

  }

  initHoveringBuffer() {
    /*
            TODO better approach. when creating the indexbuffer of footprints, 
            add 1 extra position for the selection (set to 0 == not selected), 
            and save the position "positionIndex" in an array (selectionIndexes).
            When checking the selection, I get the index of the footprint, which
            matches with the index in the selectionIndexes to retrieve the position 
            of the flag to be set to 1 in the vertexposition
            This will ease checking the selection in the vertex/fragment shader and
            set the pointsize and shape color.
            */

    if (this._hoveredFootprints.length == 0) {
      return
    }
    let nFootprints = this._hoveredFootprints.length

    let npolygons = nFootprints - 1
    for (let j = 0; j < nFootprints; j++) {
      npolygons += this._hoveredFootprints[j].polygons.length - 1
    }
    // this._selectedIndex = new Uint16Array(this._totSelectedPoints + npolygons);
    // let MAX_UNSIGNED_SHORT = 65535; // this is used to enable and disable GL_PRIMITIVE_RESTART_FIXED_INDEX

    this.hoveredIndexes = new Uint32Array(this.totHoveredPoints + npolygons)
    const MAX_UNSIGNED_INT = 0xffffffff // this is used to enable and disable GL_PRIMITIVE_RESTART_FIXED_INDEX
    // let MAX_UNSIGNED_SHORT = Number.MAX_SAFE_INTEGER;

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.hoveredVertexPositionBuffer)

    this.hoveredVertexPosition = new Float32Array(3 * this.totHoveredPoints)
    let positionIndex = 0
    let vIdx = 0

    let R = 1.0
    this.nHoveredPrimitiveFlags = 0

    for (let j = 0; j < nFootprints; j++) {
      let hoveredFootprintPoly = this._hoveredFootprints[j].polygons

      if (j > 0) {
        this.hoveredIndexes[vIdx] = MAX_UNSIGNED_INT
        this.nHoveredPrimitiveFlags += 1
        vIdx += 1
      }

      for (let polyIdx = 0; polyIdx < hoveredFootprintPoly.length; polyIdx++) {
        if (polyIdx > 0) {
          this.hoveredIndexes[vIdx] = MAX_UNSIGNED_INT;
          this.nHoveredPrimitiveFlags += 1;
          vIdx += 1;
        }
        const poly = hoveredFootprintPoly[polyIdx];
        for (let pointIdx = 0; pointIdx < poly.length; pointIdx++) {
          const p = poly[pointIdx];
          this.hoveredVertexPosition[positionIndex] = R * p.x;
          this.hoveredVertexPosition[positionIndex + 1] = R * p.y;
          this.hoveredVertexPosition[positionIndex + 2] = R * p.z;

          this.hoveredIndexes[vIdx] = Math.floor(positionIndex / 3);

          vIdx += 1;
          positionIndex += 3;
        }
      }
    }
  }

  initSelectionBuffer() {
    /*
            TODO better approach. when creating the indexbuffer of footprints, 
            add 1 extra position for the selection (set to 0 == not selected), 
            and save the position "positionIndex" in an array (selectionIndexes).
            When checking the selection, I get the index of the footprint, which
            matches with the index in the selectionIndexes to retrieve the position 
            of the flag to be set to 1 in the vertexposition
            This will ease checking the selection in the vertex/fragment shader and
            set the pointsize and shape color.
            */

    let nFootprints = this._selectedFootprints.length

    let npolygons = nFootprints - 1
    for (let j = 0; j < nFootprints; j++) {
      npolygons += this._selectedFootprints[j].polygons.length - 1
    }
    // this._selectedIndex = new Uint16Array(this._totSelectedPoints + npolygons);
    // let MAX_UNSIGNED_SHORT = 65535; // this is used to enable and disable GL_PRIMITIVE_RESTART_FIXED_INDEX

    this.selectedIndexes = new Uint32Array(this.totSelectedPoints + npolygons)
    const MAX_UNSIGNED_INT = 0xffffffff // this is used to enable and disable GL_PRIMITIVE_RESTART_FIXED_INDEX
    // let MAX_UNSIGNED_SHORT = Number.MAX_SAFE_INTEGER;

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.selectedVertexPositionBuffer)

    this.selectedVertexPosition = new Float32Array(3 * this.totSelectedPoints)
    let positionIndex = 0
    let vIdx = 0

    let R = 1.0
    this.nSlectedPrimitiveFlags = 0

    for (let j = 0; j < nFootprints; j++) {
      let footprintPoly = this._selectedFootprints[j].polygons

      if (j > 0) {
        this.selectedIndexes[vIdx] = MAX_UNSIGNED_INT
        this.nSlectedPrimitiveFlags += 1
        vIdx += 1
      }

      for (let polyIdx = 0; polyIdx < footprintPoly.length; polyIdx++) {
        if (polyIdx > 0) {
          this.selectedIndexes[vIdx] = MAX_UNSIGNED_INT;
          this.nSlectedPrimitiveFlags += 1;
          vIdx += 1;
        }
        const poly = footprintPoly[polyIdx];
        for (let pointIdx = 0; pointIdx < poly.length; pointIdx++) {
          const p = poly[pointIdx];
          this.selectedVertexPosition[positionIndex] = R * p.x;
          this.selectedVertexPosition[positionIndex + 1] = R * p.y;
          this.selectedVertexPosition[positionIndex + 2] = R * p.z;

          this.selectedIndexes[vIdx] = Math.floor(positionIndex / 3);

          vIdx += 1;
          positionIndex += 3;
        }
      }
    }
  }


  draw(in_mMatrix: mat4, in_mouseHelper: MouseHelper): void {
    if (!this.isVisible) return
    if (!this.ready) return
    if (!global.camera) return


    footprintShaderProgram.enableShaders(
      computePerspectiveMatrixSingleton.pMatrix as Float32Array,
      in_mMatrix as Float32Array,
      global.camera.getCameraMatrix() as Float32Array
    )

    if (in_mouseHelper != null && in_mouseHelper.xyz != this.oldMouseCoords) {
      this.checkSelection(in_mouseHelper);
    }


    if (this._hoveredFootprints.length > 0) {
      // TODO POINT_SIZE doesn't have any effect on line thickness!! it only applies to points
      const rgb = colorHex2RGB('#00FF00')
      const alpha = 1.0
      this.gl.uniform4f(footprintShaderProgram.locations.color, rgb[0], rgb[1], rgb[2], alpha)
      this.gl.uniform1f(footprintShaderProgram.locations.pointSize, 14.0) // <--- POINT_SIZE in LINE_LOOP is not applicable

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.hoveredVertexPositionBuffer)
      this.gl.bufferData(this.gl.ARRAY_BUFFER, this.hoveredVertexPosition, this.gl.STATIC_DRAW)

      // setting footprint position
      this.gl.vertexAttribPointer(
        footprintShaderProgram.locations.position,
        FootprintSetGL.ELEM_SIZE,
        this.gl.FLOAT,
        false,
        FootprintSetGL.BYTES_X_ELEM * FootprintSetGL.ELEM_SIZE,
        0
      )
      this.gl.enableVertexAttribArray(footprintShaderProgram.locations.position)

      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.hoveredIndexBuffer)
      this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.hoveredIndexes, this.gl.STATIC_DRAW)

      // this._gl.drawElements (this._gl.LINE_LOOP, this._selectedVertexPosition.length / 3 + this._nSlectedPrimitiveFlags,this._gl.UNSIGNED_SHORT, 0);
      this.gl.drawElements(
        this.gl.LINE_LOOP,
        this.hoveredVertexPosition.length / 3 + this.nHoveredPrimitiveFlags,
        this.gl.UNSIGNED_INT,
        0
      )
    }

    if (this._selectedFootprints.length > 0) {
      const rgb = colorHex2RGB('#ECB462')
      const alpha = 1.0
      this.gl.uniform4f(footprintShaderProgram.locations.color, rgb[0], rgb[1], rgb[2], alpha)
      this.gl.uniform1f(footprintShaderProgram.locations.pointSize, 14.0) // <--- POINT_SIZE in LINE_LOOP is not applicable

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.selectedVertexPositionBuffer)
      this.gl.bufferData(this.gl.ARRAY_BUFFER, this.selectedVertexPosition, this.gl.STATIC_DRAW)

      // setting footprint position
      this.gl.vertexAttribPointer(
        footprintShaderProgram.locations.position,
        FootprintSetGL.ELEM_SIZE,
        this.gl.FLOAT,
        false,
        FootprintSetGL.BYTES_X_ELEM * FootprintSetGL.ELEM_SIZE,
        0
      )
      this.gl.enableVertexAttribArray(footprintShaderProgram.locations.position)

      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.selectedIndexBuffer)
      this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.selectedIndexes, this.gl.STATIC_DRAW)

      // this._gl.drawElements (this._gl.LINE_LOOP, this._selectedVertexPosition.length / 3 + this._nSlectedPrimitiveFlags,this._gl.UNSIGNED_SHORT, 0);
      this.gl.drawElements(
        this.gl.LINE_LOOP,
        this.selectedVertexPosition.length / 3 + this.nSlectedPrimitiveFlags,
        this.gl.UNSIGNED_INT,
        0
      )
    }


    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexCataloguePositionBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertexCataloguePosition, this.gl.STATIC_DRAW)

    this.gl.vertexAttribPointer(
      footprintShaderProgram.locations.position as number,
      FootprintSetGL.ELEM_SIZE,
      this.gl.FLOAT,
      false,
      FootprintSetGL.BYTES_X_ELEM * FootprintSetGL.ELEM_SIZE,
      0
    )
    this.gl.enableVertexAttribArray(footprintShaderProgram.locations.position as number)

    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer)
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.indexes, this.gl.STATIC_DRAW)

    const shapeColor = [...colorHex2RGB(this.footprintsetProps.shapeColor), 1.0] as [number, number, number, number]
    this.gl.uniform4f(footprintShaderProgram.locations.color as WebGLUniformLocation, ...shapeColor)

    this.gl.drawElements(this.gl.LINE_LOOP, this.indexes.length, this.gl.UNSIGNED_INT, 0)

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null)
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null)
    this.oldMouseCoords = in_mouseHelper.xyz
  }
}

export default FootprintSetGL