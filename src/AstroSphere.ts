// AstroSphere.ts
import { bootSetup } from './Config.js'
import Camera from './Camera.js'
import RayPickingUtils from './utils/RayPickingUtils.js'
import global from './Global.js'
import { visibleTilesManager } from './model/hips/VisibleTilesManager.js'
import MouseHelper from './utils/MouseHelper.js'

import {
  cartesianToSpherical,
  sphericalToAstroDeg,
  raDegToHMS,
  decDegToDMS,
  AstroCoords,
  HMS,
  SphericalCoords,
  DMS,
} from './utils/Utils.js'


import healpixGridSingleton from './model/grid/HealpixGridSingleton.js'
import HiPS from './model/hips/HiPS.js'
import { HiPSDescriptor } from './model/hips/HiPSDescriptor.js'
import computePerspectiveMatrixSingleton from './utils/ComputePerspectiveMatrix.js'
import { FoV } from './model/FoV.js'
import Point from './model/Point.js'
import FoVUtils from './utils/FoVUtils.js'
import queryCatalogueByFoV from './services/queryCatalogueByFoV.js'
import CatalogueGL from './model/catalogues/CatalogueGL.js'
import FootprintSetGL from './model/footprints/FootprintSetGL.js'
import queryFootprintSetByFov from './services/queryFootprintSetByFov.js'

export type PointCoordinates = {
  astroDeg: AstroCoords
  raHMS: HMS
  decDMS: DMS
  sphericalDeg: SphericalCoords
}

/**
 * AstroSphere — main WebGL scene controller (TS port)
 */
class AstroSphere {
  private camera!: Camera

  private centralPoinCoords: PointCoordinates | undefined
  private mousePointCoords: PointCoordinates | undefined

  private canvas: HTMLCanvasElement
  private showHPXGrid = false
  private mouseHelper: MouseHelper

  private mouseDown = false
  private lastMouseX: number | null = null
  private lastMouseY: number | null = null
  private inertiaX = 0.0
  private inertiaY = 0.0
  private zoomInertia = 0.0

  private activeHiPS: HiPS | null = null

  private startup = true

  // private insideSphere: boolean
  private fov: FoV

  private activeCatalogues: CatalogueGL[] = []
  private activeFootprintSets: FootprintSetGL[] = []

  constructor(canvas: HTMLCanvasElement, webgl: WebGL2RenderingContext) {
    // Keep global GL context (as in original JS)
    global.gl = webgl
    this.mouseHelper = new MouseHelper()
    this.canvas = canvas
    // this.insideSphere = bootSetup.insideSphere
    global.insideSphere = bootSetup.insideSphere
    this.init(canvas)
    this.fov = healpixGridSingleton.refreshFoV()
  }

  private updateCentralPoint(): PointCoordinates {

    // const sphericalCoords = cartesianToSpherical(this.camera.getCameraPosition())
    const sphericalCoords = this.getPhiThetaDeg(this.canvas)
    const astroCoords = sphericalToAstroDeg(sphericalCoords.phi, sphericalCoords.theta)
    const raHMS = raDegToHMS(astroCoords.ra)
    const decDMS = decDegToDMS(astroCoords.dec)
    this.centralPoinCoords = {
      astroDeg: astroCoords,
      sphericalDeg: sphericalCoords,
      raHMS: raHMS,
      decDMS: decDMS
    }
    return this.centralPoinCoords
  }


  private updateLastMousePoint(): PointCoordinates {

    const sphericalCoords = { phi: this.mouseHelper.phi, theta: this.mouseHelper.theta } as SphericalCoords
    const astroCoords = { ra: this.mouseHelper.ra, dec: this.mouseHelper.dec } as AstroCoords
    const raHMS = this.mouseHelper.raHMS as HMS
    const decDMS = this.mouseHelper.decDMS as DMS
    this.mousePointCoords = {
      astroDeg: astroCoords,
      sphericalDeg: sphericalCoords,
      raHMS: raHMS,
      decDMS: decDMS
    }
    return this.mousePointCoords
  }

  getCentralPointCoordinates(): PointCoordinates | undefined {
    return this.centralPoinCoords
  }

  getLastMousePointCoordinates(): PointCoordinates | undefined {
    return this.mousePointCoords
  }

  private init(canvas: HTMLCanvasElement) {
    this.initCamera()

    healpixGridSingleton.init()
    computePerspectiveMatrixSingleton.computePerspectiveMatrix(canvas, this.camera, bootSetup.camera_fov_deg, bootSetup.camera_near_plane, bootSetup.insideSphere)
    visibleTilesManager.init(bootSetup.insideSphere)

    this.updateCentralPoint()

    this.startup = true

    this.addEventListeners(canvas)
  }

  private initCamera() {
    if (bootSetup.insideSphere) {
      this.camera = new Camera([0.0, 0.0, -0.005], true)
    } else {
      this.camera = new Camera([0.0, 0.0, 4.0], false)
    }
    global.camera = this.camera
  }

  private addEventListeners(canvas: HTMLCanvasElement) {
    if (global.debug) {
      console.log('[AstroSphere::addEventListeners]')
    }

    const handleMouseDown = (event: PointerEvent) => {
      canvas.setPointerCapture(event.pointerId)
      this.mouseDown = true
      // this.lastMouseX = event.pageX
      // this.lastMouseY = event.pageY
      this.lastMouseX = event.clientX
      this.lastMouseY = event.clientY

      // session.clearHoveredFootprints()
      event.preventDefault()
      return false
    }

    const handleMouseUp = (event: PointerEvent) => {
      canvas.releasePointerCapture(event.pointerId)
      this.mouseDown = false
      document.body.style.cursor = 'auto'
      this.lastMouseX = event.clientX
      this.lastMouseY = event.clientY

    }

    const handleMouseMove = (event: PointerEvent) => {
      const newX = event.clientX
      const newY = event.clientY

      if (!healpixGridSingleton) return

      if (this.mouseDown) {
        document.body.style.cursor = 'grab'

        const deltaX = ((newX - (this.lastMouseX ?? newX)) * Math.PI) / canvas.width
        const deltaY = ((newY - (this.lastMouseY ?? newY)) * Math.PI) / canvas.height

        this.inertiaX += 0.1 * deltaX
        this.inertiaY += 0.1 * deltaY
      } else {
        const mousePoint = RayPickingUtils.getIntersectionPointWithSingleModel(
          newX,
          newY
        )

        if (mousePoint && mousePoint.length > 0) {
          this.mouseHelper.update(mousePoint)
          console.log('EMIT HERE')
          // this.emit('coordsUpdate', {
          //   raDeg: this.mouseHelper.raDecDeg.ra,
          //   decDeg: this.mouseHelper.raDecDeg.dec,
          //   raHMS: this.mouseHelper.raHMS,
          //   decDMS: this.mouseHelper.decDMS,
          // })

          this.updateLastMousePoint()
        }
      }
      this.updateCentralPoint()

      this.lastMouseX = newX
      this.lastMouseY = newY
      event.preventDefault()
    }

    const handleMouseWheel = (event: WheelEvent) => {
      if (event.deltaY < 0) {
        this.zoomInertia -= 0.001
      } else {
        this.zoomInertia += 0.001
      }
      event.preventDefault()
    }

    canvas.onpointerdown = handleMouseDown
    canvas.onpointerup = handleMouseUp
    canvas.onpointermove = handleMouseMove
    // canvas.onwheel = handleMouseWheel
    canvas.addEventListener('wheel', handleMouseWheel, { passive: false })
  }

  // REVIEW THIS METHOD AND MOVE IT
  getPhiThetaDeg(canvas: HTMLCanvasElement) {
    const maxX = canvas.width
    const maxY = canvas.height
    const pickerPoint = RayPickingUtils.getIntersectionPointWithSingleModel(
      maxX / 2,
      maxY / 2
    )

    return cartesianToSpherical(pickerPoint)
  }

  activateHiPS(hipsDescriptor: HiPSDescriptor) {

    this.activeHiPS = new HiPS(
      1,
      [0.0, 0.0, 0.0],
      0,
      0,
      hipsDescriptor
    )
  }

  // Catalogue section
  async showCatalogue(catalogue: CatalogueGL) {
    const fovPolyAstro = FoVUtils.getFoVPolygon(this.camera, this.canvas, healpixGridSingleton)
    const polygonAdql = FoVUtils.getAstroFoVPolygon(fovPolyAstro) // -> "POLYGON('ICRS', ra1, dec1, ...)"
    const cat = await queryCatalogueByFoV(catalogue, polygonAdql)
    console.log(cat)
    if (cat) this.activeCatalogues.push(cat)
    return cat
  }

  hideCatalogue(catalogue: CatalogueGL, isVisible: boolean) {
    catalogue.setIsVisible(isVisible)
  }

  deleteCatalogue(catalogue: CatalogueGL) {
    this.activeCatalogues = this.activeCatalogues.filter(c => c !== catalogue);
  }

  changeCatalogueColor(catalogue: CatalogueGL, hexColor: string) {
    catalogue.catalogueProps.changeColor(hexColor)
  }

  setCatalogueShapeHue(catalogue: CatalogueGL, metadataColumnName: string) {
    catalogue.changeCatalogueMetaShapeHue(metadataColumnName)
  }

  setCatalogueShapeSize(catalogue: CatalogueGL, metadataColumnName: string) {
    catalogue.changeCatalogueMetaShapeSize(metadataColumnName)
  }
  // End Catalogue section

  // Footprint section
  async showFootprintSet(footprintSet: FootprintSetGL) {
    const fovPolyAstro = FoVUtils.getFoVPolygon(this.camera, this.canvas, healpixGridSingleton)
    const polygonAdql = FoVUtils.getAstroFoVPolygon(fovPolyAstro) // -> "POLYGON('ICRS', ra1, dec1, ...)"
    const centralPoint = FoVUtils.getCenterJ2000(this.canvas)

    const fset = await queryFootprintSetByFov(footprintSet, polygonAdql, centralPoint)
    console.log(fset)
    if (fset) this.activeFootprintSets.push(fset)
    return fset
  }

  hideFootprintSet(footprintSet: FootprintSetGL, isVisible: boolean) {
    footprintSet.setIsVisible(isVisible)
  }

  deleteFootprintSet(footprintSet: FootprintSetGL) {
    this.activeFootprintSets = this.activeFootprintSets.filter(fst => fst !== footprintSet);
  }

  changeFootprintSetColor(footprintSet: FootprintSetGL, hexColor: string) {
    footprintSet.footprintsetProps.changeColor(hexColor)
  }
  // End Footprint section


  goTo(raDeg: number, decDeg: number): void {
    this.camera.goTo(raDeg, decDeg)
  }

  getFoV(): FoV {
    return this.fov
  }

  getFoVPolygon(): Point[] {
    return FoVUtils.getFoVPolygon(this.camera, this.canvas, healpixGridSingleton)
  }

  changeFoV(deg: number) {
    // throw new Error("not Implemented")
    const distance = healpixGridSingleton.getFoV().computeDistanceFromAngle(deg)
    // this.camera.moveAlongView(distance)
    this.camera.translate(distance)
    healpixGridSingleton.refreshFoV()
  }
  
  changeFoV2(deg: number) {
    // throw new Error("not Implemented")
    const newCameraPos = healpixGridSingleton.getFoV().computeCameraPositionForFoV(deg)
    this.camera.setCameraPosition(newCameraPos)
    // this.camera.moveAlongView(distance)
    // this.camera.translate(distance)
  }
  changeFoV3(deg: number) {
    const newPos = healpixGridSingleton.getFoV().computeCameraPositionForAngularDiameter(deg);
    this.camera.setCameraPosition(newPos);


    // Recompute projection after moving the camera
    computePerspectiveMatrixSingleton.computePerspectiveMatrix(
      this.canvas,
      this.camera,
      bootSetup.camera_fov_deg,
      bootSetup.camera_near_plane, false
    );
  }

  getInsideSphere(): boolean {
    return global.insideSphere
  }

  toggleInsideSphere() {
    // this.insideSphere = !this.insideSphere
    global.insideSphere = !global.insideSphere
    console.log(global.insideSphere)
    this.camera.toggleInsideSphere()
    // visibleTilesManager.toggleInsideSphere()
  }

  draw(canvas: HTMLCanvasElement) {

    if (!global.gl) return
    if (!this.activeHiPS) return
    if (!healpixGridSingleton || Object.keys(healpixGridSingleton).length === 0) return
    if ((healpixGridSingleton as any).fovObj === undefined) return

    // In WebGL2, OES_element_index_uint is core, no need to fetch the extension each frame.
    // global.gl.getExtension('OES_element_index_uint')
    // global.gl.clear(global.gl.COLOR_BUFFER_BIT | global.gl.DEPTH_BUFFER_BIT)

    computePerspectiveMatrixSingleton.computePerspectiveMatrix(canvas, this.camera, bootSetup.camera_fov_deg, bootSetup.camera_near_plane, global.insideSphere)

    let cameraRotated = false
    let THETA = 0
    let PHI = 0

    global.gl.viewport(0, 0, global.gl.drawingBufferWidth, global.gl.drawingBufferHeight);
    global.gl.clear(global.gl.COLOR_BUFFER_BIT | global.gl.DEPTH_BUFFER_BIT)

    // Zoom inertia
    if ((healpixGridSingleton as any).fovObj.minFoV > 0.1 || this.zoomInertia > 0) {
      if (Math.abs(this.zoomInertia) > 0.0001) {
        this.camera.zoom(this.zoomInertia)
        this.zoomInertia *= 0.95
        // console.log('EMIT HERE (fovUpdate)')
        this.fov = healpixGridSingleton.refreshFoV()
        // this.getFoV()
      }
    }

    // Rotation inertia
    if (this.mouseDown || Math.abs(this.inertiaX) > 0.02 || Math.abs(this.inertiaY) > 0.02) {
      cameraRotated = true
      THETA = this.inertiaY
      PHI = this.inertiaX
      this.inertiaX *= 0.95
      this.inertiaY *= 0.95
      this.camera.rotate(PHI, THETA)
      computePerspectiveMatrixSingleton.computePerspectiveMatrix(canvas, this.camera, bootSetup.camera_fov_deg, bootSetup.camera_near_plane, global.insideSphere)

    } else {
      this.inertiaY = 0
      this.inertiaX = 0
    }

    // GL state
    global.gl.disable(global.gl.DEPTH_TEST)
    global.gl.enable(global.gl.BLEND)
    global.gl.enable(global.gl.CULL_FACE)
    global.gl.cullFace(global.insideSphere ? global.gl.BACK : global.gl.FRONT)
    global.gl.blendFunc(global.gl.SRC_ALPHA, global.gl.ONE_MINUS_SRC_ALPHA)

    // DRAW HiPS

    this.activeHiPS.draw()
    healpixGridSingleton.draw()

    global.gl.enable(global.gl.DEPTH_TEST)
    global.gl.disable(global.gl.CULL_FACE)






    if (this.startup) {
      this.startup = false
      const phiTheta = this.getPhiThetaDeg(canvas)
      const raDecDeg = sphericalToAstroDeg(phiTheta.phi, phiTheta.theta)
      const raHMS = raDegToHMS(raDecDeg.ra)
      const decDMS = decDegToDMS(raDecDeg.dec)
      console.log('EMIT HERE (startup coords)', {
        raDeg: raDecDeg.ra,
        decDeg: raDecDeg.dec,
        raHMS,
        decDMS,
      })
    }


    this.activeCatalogues.forEach(cat => {
      if (this.activeHiPS) {
        cat.draw(this.activeHiPS.getModelMatrix() as Float32Array, this.mouseHelper)
      }
    })
    this.activeFootprintSets.forEach(fst => {
      if (this.activeHiPS) {
        fst.draw(this.activeHiPS.getModelMatrix() as Float32Array, this.mouseHelper)
      }
    })


  }
}



export default AstroSphere
