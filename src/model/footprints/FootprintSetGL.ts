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

type GL = WebGL2RenderingContext;

class FootprintSetGL {
  static ELEM_SIZE = 3
  static BYTES_X_ELEM = new Float32Array().BYTES_PER_ELEMENT
  static CONVEXPOLY_ELEM_SIZE = 3

  ready: boolean
  footprintsetProps: FootprintProps
  name: string
  description: string
  tapRepo: TapRepo

  footprintPolygons: Footprint[] = []
  indexes!: Uint32Array
  totPoints!: number
  totConvexPoints!: number

  footprintsInPix256: Map<number, Footprint[]>

  // attribLocations!: {
  //   position: number | WebGLUniformLocation
  //   selected: number
  //   pointSize: number
  //   color: number[] | WebGLUniformLocation
  // }
  gl: GL;

  // shaderProgram: WebGLProgram
  vertexCataloguePositionBuffer!: WebGLBuffer
  vertexhoveredCataloguePositionBuffer!: WebGLBuffer
  indexBuffer!: WebGLBuffer
  hoveredVertexPositionBuffer!: WebGLBuffer
  hoveredIndexBuffer!: WebGLBuffer
  selectedVertexPositionBuffer!: WebGLBuffer
  selectedIndexBuffer!: WebGLBuffer
  vertexCataloguePosition!: Float32Array
  nPrimitiveFlags: number

  hoveredIndexes!: number[]
  selectedIndexes!: number[]
  extHoveredIndexes!: number[]

  oldMouseCoords: any
  healpixDensityMap: any
  hoveredFootprints: never[] = []
  hoveredIndex: never[] = []
  hoveredVertexPosition: never[] = []
  totHoveredPoints!: number
  selectedFootprints: never[] = []
  selectedIndex: never[] = []
  selectedVertexPosition: never[] = []
  totSelectedPoints!: number

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

    this.footprintsInPix256 = new Map()

    this.initFootprintArrays()
    if (!global.gl) {
      throw new Error('WebGL2RenderingContext is not initialized (global.gl is null)')
    }

    this.gl = global.gl as GL
    this.initGLBuffers()

    // this.shaderProgram = this.gl.createProgram() as WebGLProgram
    this.nPrimitiveFlags = 0
    this.oldMouseCoords = null

    const defaultColor = '#00fff2ff'
    this.footprintsetProps = new FootprintProps(tapMetadataList, defaultColor)

    footprintShaderProgram.shaderProgram
    // this.initShaders()
  }

  private initFootprintArrays(): void {
    this.footprintPolygons = []
    this.indexes = new Uint32Array()
    this.vertexCataloguePosition = new Float32Array()
    this.totPoints = 0
    this.totConvexPoints = 0
    this.extHoveredIndexes = []

    this.hoveredFootprints = []
    this.hoveredIndex = []
    this.hoveredVertexPosition = []
    this.totHoveredPoints = 0
    this.hoveredIndexes = []

    this.selectedFootprints = []
    this.selectedIndex = []
    this.selectedVertexPosition = []
    this.totSelectedPoints = 0
    this.selectedIndexes = []
  }

  private initGLBuffers(): void {
    this.vertexCataloguePositionBuffer = this.gl.createBuffer()
    this.vertexhoveredCataloguePositionBuffer = this.gl.createBuffer()
    this.indexBuffer = this.gl.createBuffer()

    this.hoveredVertexPositionBuffer = this.gl.createBuffer()
    this.hoveredIndexBuffer = this.gl.createBuffer()

    this.selectedVertexPositionBuffer = this.gl.createBuffer()
    this.selectedIndexBuffer = this.gl.createBuffer()

    // this.attribLocations = {
    //   position: 0,
    //   selected: 1,
    //   pointSize: 2,
    //   color: [0.0, 1.0, 0.0, 1.0]
    // }
  }

  // private initShaders(): void {
  //   const fragmentShader = this.loadShaderFromDOM('fpcat-shader-fs')
  //   const vertexShader = this.loadShaderFromDOM('fpcat-shader-vs')

  //   if (!fragmentShader || !vertexShader) {
  //     throw new Error('Shader sources not found in DOM')
  //   }

  //   this.gl.attachShader(this.shaderProgram, vertexShader)
  //   this.gl.attachShader(this.shaderProgram, fragmentShader)
  //   this.gl.linkProgram(this.shaderProgram)

  //   if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
  //     throw new Error('Could not initialise shaders')
  //   }

  //   shaderUtility.useProgram(this.shaderProgram)
  // }


  // private loadShaderFromDOM(shaderId: string): WebGLShader | null {
  //   const shaderScript = document.getElementById(shaderId) as HTMLScriptElement
  //   if (!shaderScript) return null

  //   let shaderSource = ''
  //   let currentChild = shaderScript.firstChild
  //   while (currentChild) {
  //     if (currentChild.nodeType === Node.TEXT_NODE) {
  //       shaderSource += currentChild.textContent
  //     }
  //     currentChild = currentChild.nextSibling
  //   }

  //   let shader: WebGLShader | null = null
  //   if (shaderScript.type === 'x-shader/x-fragment') {
  //     shader = this.gl.createShader(this.gl.FRAGMENT_SHADER)
  //   } else if (shaderScript.type === 'x-shader/x-vertex') {
  //     shader = this.gl.createShader(this.gl.VERTEX_SHADER)
  //   }
  //   if (!shader) return null

  //   this.gl.shaderSource(shader, shaderSource)
  //   this.gl.compileShader(shader)

  //   if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
  //     console.error(this.gl.getShaderInfoLog(shader))
  //     return null
  //   }
  //   return shader
  // }
  
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
      const identifier = footprint.identifier

      if (global.healpix4footprints) {
        if (footprint.pixels) {
          footprint.pixels.forEach((pix: number) => {
            if (this.footprintsInPix256.has(pix)) {
              const curr = this.footprintsInPix256.get(pix)!
              if (!curr.includes(footprint)) {
                curr.push(footprint)
              }
            } else {
              this.footprintsInPix256.set(pix, [footprint])
            }
          })
        }
      }

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

  // private enableShader(in_mMatrix: mat4): void {
  //   this.gl.useProgram(this.shaderProgram)

  //   const catUniformMVMatrixLoc = this.gl.getUniformLocation(
  //     this.shaderProgram,
  //     'uMVMatrix'
  //   )
  //   const catUniformProjMatrixLoc = this.gl.getUniformLocation(
  //     this.shaderProgram,
  //     'uPMatrix'
  //   )
  //   const pointsize = this.gl.getUniformLocation(this.shaderProgram, 'u_pointsize')

  //   this.attribLocations.position = this.gl.getAttribLocation(this.shaderProgram, 'aCatPosition')
  //   this.attribLocations.color = this.gl.getUniformLocation(this.shaderProgram, 'u_fragcolor')!

  //   const pMatrix = computePerspectiveMatrixSingleton.pMatrix
  //   let mvMatrix = mat4.create()
  //   if (!global.camera) {
  //     throw new Error('Camera is not initialized (global.camera is null)')
  //   }
  //   mvMatrix = mat4.multiply(mvMatrix, global.camera.getCameraMatrix(), in_mMatrix)

  //   this.gl.uniformMatrix4fv(catUniformMVMatrixLoc, false, mvMatrix as Float32Array)
  //   this.gl.uniformMatrix4fv(catUniformProjMatrixLoc, false, pMatrix as Float32Array)
  //   this.gl.uniform1f(pointsize, 14.0)
  // }

  draw(in_mMatrix: mat4, in_mouseHelper: any): void {
    if (!this.isVisible) return
    if (!this.ready) return
    if (!global.camera) return

    footprintShaderProgram.enableShaders(
      computePerspectiveMatrixSingleton.pMatrix as Float32Array,
      in_mMatrix as Float32Array,
      global.camera.getCameraMatrix() as Float32Array
    )
    // this.enableShader(in_mMatrix)

    // TODO: integrate checkSelection, hovered & selected drawing logic here (similar to JS version)

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
    // this.gl.vertexAttribPointer(
    //   this.attribLocations.position as number,
    //   FootprintSetGL.ELEM_SIZE,
    //   this.gl.FLOAT,
    //   false,
    //   FootprintSetGL.BYTES_X_ELEM * FootprintSetGL.ELEM_SIZE,
    //   0
    // )
    // this.gl.enableVertexAttribArray(this.attribLocations.position as number)

    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer)
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.indexes, this.gl.STATIC_DRAW)

    const shapeColor = [...colorHex2RGB(this.footprintsetProps.shapeColor), 1.0] as [number, number, number, number]
    this.gl.uniform4f(footprintShaderProgram.locations.color as WebGLUniformLocation, ...shapeColor)
    // this.gl.uniform4f(this.attribLocations.color as WebGLUniformLocation, ...shapeColor)

    this.gl.drawElements(this.gl.LINE_LOOP, this.indexes.length, this.gl.UNSIGNED_INT, 0)

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null)
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null)
    this.oldMouseCoords = in_mouseHelper.xyz
  }
}

export default FootprintSetGL