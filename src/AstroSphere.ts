// AstroSphere.ts
import { bootSetup } from './Config.js'
import Camera from './Camera.js'
import RayPickingUtils from './utils/RayPickingUtils.js'
import global from './Global.js'
// import { visibleTilesManager } from './model/hips/VisibleTilesManager.js'
// import { VisibleTilesManager } from './model/hips/VisibleTilesManager.js'
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


// import healpixGridSingleton from './model/grid/HealpixGridSingleton.js'
import HiPS from './model/hips/HiPS.js'
import { HiPSDescriptor } from './model/hips/HiPSDescriptor.js'
import computePerspectiveMatrixSingleton from './utils/ComputePerspectiveMatrix.js'
import { FoV } from './model/FoV.js'
import { Point } from './model/Point.js'
import { FoVUtils } from './utils/FoVUtils.js'
// import queryCatalogueByFoV from './services/queryCatalogueByFoV.js'
import { CatalogueGL } from './model/catalogues/CatalogueGL.js'
import { FootprintSetGL, HoveredFootprintDetail } from './model/footprints/FootprintSetGL.js'
// import queryFootprintSetByFov from './services/queryFootprintSetByFov.js'

// import equatorialGridSingleton from './model/grid/EquatorialGrid.js'
import { EquatorialGrid } from './model/grid/EquatorialGrid.js'
import { HealpixGrid } from './model/grid/HealpixGrid.js'
import { TileBuffer } from './model/hips/TileBuffer.js'
import { SkyEntityDrawInput } from './model/AbstractSkyEntity.js'
import { CoordsType } from './utils/CoordsType.js'

export type PointCoordinates = {
  astroDeg: AstroCoords
  raHMS: HMS
  decDMS: DMS
  sphericalDeg: SphericalCoords
}

export type CameraChangedDetail = {
  fovDeg: number;
  position: [number, number, number];
  vMatrix: Float32Array;
  pMatrix: Float32Array;
  timestamp: number;
  centralPoint: Point,
  mouseHoverPoint: PointCoordinates | undefined,
};


/**
 * AstroSphere — main WebGL scene controller (TS port)
 */
class AstroSphere {
  private _camera!: Camera

  private centralPoinCoords: PointCoordinates | undefined
  private mousePointCoords: PointCoordinates | undefined

  private canvas: HTMLCanvasElement
  private _healpixGrid: HealpixGrid
  private _equatorialGrid: EquatorialGrid


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
  private _webgl: WebGL2RenderingContext
  // private _tileBuffer: TileBuffer

  constructor(canvas: HTMLCanvasElement, webgl: WebGL2RenderingContext) {
    console.log('[AstroSphere] new instance for canvas', canvas.id);
    // Keep global GL context (as in original JS)
    // global.gl = webgl
    this._webgl = webgl
    this.mouseHelper = new MouseHelper()
    this.canvas = canvas

    global.insideSphere = bootSetup.insideSphere

    this.initCamera()

    this._healpixGrid = new HealpixGrid(this._webgl)
    
    computePerspectiveMatrixSingleton.computePerspectiveMatrix(canvas, this._camera, bootSetup.camera_fov_deg, bootSetup.camera_near_plane, bootSetup.insideSphere)

    this._equatorialGrid = new EquatorialGrid(this._webgl, this._healpixGrid)
    // equatorialGridSingleton.init(healpixGridSingleton.getMinFoV())
    this._equatorialGrid.init(this._healpixGrid.getMinFoV())

    this.updateCentralPoint()
    this.startup = true
    this.addEventListeners(canvas)
    // this.fov = healpixGridSingleton.refreshFoV()
    this.fov = this._healpixGrid.refreshFoV(this._camera)
  }

  private initCamera() {
    if (bootSetup.insideSphere) {
      this._camera = new Camera([0.0, 0.0, -0.005], true)
    } else {
      this._camera = new Camera([0.0, 0.0, 4.0], false)
    }
    // global.camera = this.camera
  }

  get healpixGrid() {
    return this._healpixGrid
  }

  get equatorialGrid() {
    return this._equatorialGrid
  }

  // This is a lickely a duplication of FoVUtils.getCenterJ2000(this.canvas)
  private updateCentralPoint(): PointCoordinates {

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

  // This should call FoVUtils.getJ200Centre(this.canvas)
  getCentralPointCoordinates(): PointCoordinates | undefined {
    return this.centralPoinCoords
  }

  getLastMousePointCoordinates(): PointCoordinates | undefined {
    return this.mousePointCoords
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
      const rect = canvas.getBoundingClientRect();

      // 🔹 canvas-local coordinates
      const localX = event.clientX - rect.left;
      const localY = event.clientY - rect.top;

      // const newX = event.clientX;
      // const newY = event.clientY;
      const newX = localX;
      const newY = localY;

      // if (!healpixGridSingleton) return;
      if (!this._healpixGrid) return;

      let hit = false;

      if (this.mouseDown) {
        document.body.style.cursor = 'grab';

        // Rotation deltas – either use client-space or local-space, but be consistent
        const deltaX = ((newX - (this.lastMouseX ?? newX)) * Math.PI) / canvas.width;
        const deltaY = ((newY - (this.lastMouseY ?? newY)) * Math.PI) / canvas.height;

        this.inertiaX += 0.1 * deltaX;
        this.inertiaY += 0.1 * deltaY;

        this.updateCentralPoint();
        hit = true;
      } else {
        // 🔥 Use canvas-local coords for picking
        const mousePoint = RayPickingUtils.getIntersectionPointWithSingleModel(
          localX,
          localY,
          this._healpixGrid,
          this._webgl,
          this._camera
        );

        if (mousePoint && mousePoint.length > 0) {
          this.mouseHelper.update(mousePoint);

          this.updateLastMousePoint();
          hit = true;
        }
      }

      if (!this.centralPoinCoords) {
        this.updateCentralPoint();
        hit = true;
      }

      const centralradeg = this.centralPoinCoords?.astroDeg.ra
      const centraldecdeg = this.centralPoinCoords?.astroDeg.dec
      if (hit && centraldecdeg && centralradeg) {
        const detail: CameraChangedDetail = {
          fovDeg: this.fov.minFoV,
          position: this._camera.getCameraPosition(),
          vMatrix: this._camera.getCameraMatrix() as Float32Array,
          pMatrix: computePerspectiveMatrixSingleton.pMatrix as Float32Array,
          timestamp: performance.now(),
          // centralPoint: FoVUtils.getCenterJ2000(this.canvas, this._healpixGrid, this._webgl),
          centralPoint: new Point({raDeg: centralradeg, decDeg: centraldecdeg}, CoordsType.ASTRO),
          mouseHoverPoint: this.mousePointCoords
        };

        this.canvas.dispatchEvent(
          new CustomEvent<CameraChangedDetail>('cameraChanged', {
            detail,
            bubbles: false,
            composed: false
          })
        );
      }

      this.lastMouseX = newX;
      this.lastMouseY = newY;
      event.preventDefault();
      console.log(`central point: (${this.centralPoinCoords?.astroDeg.ra}, ${this.centralPoinCoords?.astroDeg.dec})`)
    };

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
      maxY / 2,
      this._healpixGrid,
      this._webgl,
      this._camera
    )

    return cartesianToSpherical(pickerPoint)
  }

  activateHiPS(hipsDescriptor: HiPSDescriptor) {

    this.activeHiPS = new HiPS(
      1,
      [0.0, 0.0, 0.0],
      0,
      0,
      hipsDescriptor,
      this._webgl,
      this._healpixGrid
    )
  }

  // Catalogue section
  async showCatalogue(cat: CatalogueGL) {
    console.log(cat)
    if (cat) this.activeCatalogues.push(cat)
    return cat
  }

  deleteCatalogue(catalogue: CatalogueGL) {
    this.activeCatalogues = this.activeCatalogues.filter(c => c !== catalogue);
  }
  // End Catalogue section

  // Footprint section
  async showFootprintSet(fset: FootprintSetGL) {
    console.log(fset)
    if (fset) this.activeFootprintSets.push(fset)
    return fset
  }

  deleteFootprintSet(footprintSet: FootprintSetGL) {
    this.activeFootprintSets = this.activeFootprintSets.filter(fst => fst !== footprintSet);
  }

  getHoveredFootprints(): HoveredFootprintDetail[] {
    let footprintsHovered: HoveredFootprintDetail[] = []
    this.activeFootprintSets.forEach(fset => {
      footprintsHovered.push(fset.hoveredFootprints)
    });
    return footprintsHovered
  }
  // End Footprint section


  goTo(raDeg: number, decDeg: number): void {
    this._camera.goTo(raDeg, decDeg)
  }

  getFoV(): FoV {
    return this.fov
  }

  getFoVPolygon(): Point[] {
    if (this.healpixGrid == null) throw new Error(`healpixGrid is ${this.healpixGrid}`)
    // return FoVUtils.getFoVPolygon(this.camera, this.canvas, healpixGridSingleton)
    return FoVUtils.getFoVPolygon(this._camera, this.canvas, this._healpixGrid,this._healpixGrid, this._webgl)
  }

  changeFoV(deg: number) {
    // const distance = healpixGridSingleton.getFoV().computeDistanceFromAngle(deg)
    const distance = this._healpixGrid.getFoV().computeDistanceFromAngle(deg)
    // this.camera.moveAlongView(distance)
    this._camera.translate(distance)
    // healpixGridSingleton.refreshFoV()
    this._healpixGrid.refreshFoV(this._camera)
  }

  changeFoV2(deg: number) {
    // throw new Error("not Implemented")
    // const newCameraPos = healpixGridSingleton.getFoV().computeCameraPositionForFoV(deg)
    const newCameraPos = this._healpixGrid.getFoV().computeCameraPositionForFoV(deg)
    this._camera.setCameraPosition(newCameraPos)
  }

  changeFoV3(deg: number) {
    // const newPos = healpixGridSingleton.getFoV().computeCameraPositionForAngularDiameter(deg);
    const newPos = this._healpixGrid.getFoV().computeCameraPositionForAngularDiameter(deg);
    this._camera.setCameraPosition(newPos);


    // Recompute projection after moving the camera
    computePerspectiveMatrixSingleton.computePerspectiveMatrix(
      this.canvas,
      this._camera,
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
    this._camera.toggleInsideSphere()
    // visibleTilesManager.toggleInsideSphere()
  }


  private prevFov: number = 0

  draw(canvas: HTMLCanvasElement) {

    // if (!global.gl) return
    if (!this._webgl) return
    if (!this.activeHiPS) return
    // if (!healpixGridSingleton || Object.keys(healpixGridSingleton).length === 0) return
    // if ((healpixGridSingleton as any).fovObj === undefined) return
    if (!this._healpixGrid || Object.keys(this._healpixGrid).length === 0) return
    if ((this._healpixGrid as any).fovObj === undefined) return

    // In WebGL2, OES_element_index_uint is core, no need to fetch the extension each frame.
    // global.gl.getExtension('OES_element_index_uint')
    // global.gl.clear(global.gl.COLOR_BUFFER_BIT | global.gl.DEPTH_BUFFER_BIT)

    computePerspectiveMatrixSingleton.computePerspectiveMatrix(canvas, this._camera, bootSetup.camera_fov_deg, bootSetup.camera_near_plane, global.insideSphere)

    let cameraRotated = false
    let THETA = 0
    let PHI = 0

    // global.gl.viewport(0, 0, global.gl.drawingBufferWidth, global.gl.drawingBufferHeight);
    // global.gl.clear(global.gl.COLOR_BUFFER_BIT | global.gl.DEPTH_BUFFER_BIT)
    this._webgl.viewport(0, 0, this._webgl.drawingBufferWidth, this._webgl.drawingBufferHeight);
    this._webgl.clear(this._webgl.COLOR_BUFFER_BIT | this._webgl.DEPTH_BUFFER_BIT)

    // Zoom inertia
    // if ((healpixGridSingleton as any).fovObj.minFoV > 0.1 || this.zoomInertia > 0) {
    if ((this._healpixGrid as any).fovObj.minFoV > 0.1 || this.zoomInertia > 0) {
      if (Math.abs(this.zoomInertia) > 0.0001) {
        this._camera.zoom(this.zoomInertia)
        this.zoomInertia *= 0.95

        // this.fov = healpixGridSingleton.refreshFoV()
        this.fov = this._healpixGrid.refreshFoV(this._camera)
        if (this.prevFov != this.fov.minFoV) {

          const detail: CameraChangedDetail = {
            fovDeg: this.fov.minFoV,
            position: this._camera.getCameraPosition(),
            vMatrix: this._camera.getCameraMatrix() as Float32Array,
            pMatrix: computePerspectiveMatrixSingleton.pMatrix as Float32Array,
            timestamp: performance.now(),
            centralPoint: FoVUtils.getCenterJ2000(this.canvas, this._healpixGrid, this._webgl, this._camera),
            mouseHoverPoint: this.mousePointCoords
          };

          this.canvas.dispatchEvent(new CustomEvent<CameraChangedDetail>(
            'cameraChanged',
            { detail, bubbles: false, composed: false }
          ));
          this.prevFov = this.fov.minFoV
        }
      }
    }

    // Rotation inertia
    if (this.mouseDown || Math.abs(this.inertiaX) > 0.02 || Math.abs(this.inertiaY) > 0.02) {
      cameraRotated = true
      THETA = this.inertiaY
      PHI = this.inertiaX
      this.inertiaX *= 0.95
      this.inertiaY *= 0.95
      this._camera.rotate(PHI, THETA)
      computePerspectiveMatrixSingleton.computePerspectiveMatrix(canvas, this._camera, bootSetup.camera_fov_deg, bootSetup.camera_near_plane, global.insideSphere)

    } else {
      this.inertiaY = 0
      this.inertiaX = 0
    }

    // GL state
    this._webgl.disable(this._webgl.DEPTH_TEST)
    this._webgl.enable(this._webgl.BLEND)
    this._webgl.enable(this._webgl.CULL_FACE)
    this._webgl.cullFace(global.insideSphere ? this._webgl.BACK : this._webgl.FRONT)
    this._webgl.blendFunc(this._webgl.SRC_ALPHA, this._webgl.ONE_MINUS_SRC_ALPHA)
    // global.gl.disable(global.gl.DEPTH_TEST)
    // global.gl.enable(global.gl.BLEND)
    // global.gl.enable(global.gl.CULL_FACE)
    // global.gl.cullFace(global.insideSphere ? global.gl.BACK : global.gl.FRONT)
    // global.gl.blendFunc(global.gl.SRC_ALPHA, global.gl.ONE_MINUS_SRC_ALPHA)



    this._healpixGrid.visibleTilesManager.computeVisiblePixels(this._healpixGrid.visibleorder, this._webgl, this._camera)
    
    // DRAW HiPS
    const skyEntityDrawInput: SkyEntityDrawInput = {
      fovDeg: this._healpixGrid.getMinFoV(), 
      // cameraMatrix: this.camera.getCameraMatrix() as Float32Array}
      camera: this._camera}
    this.activeHiPS.draw(skyEntityDrawInput)
    
    this._healpixGrid.draw(skyEntityDrawInput)
    this._equatorialGrid.draw(skyEntityDrawInput)

    this._webgl.enable(this._webgl.DEPTH_TEST)
    this._webgl.disable(this._webgl.CULL_FACE)

    if (this.startup) {
      this.startup = false
      const phiTheta = this.getPhiThetaDeg(canvas)
      const raDecDeg = sphericalToAstroDeg(phiTheta.phi, phiTheta.theta)
      const raHMS = raDegToHMS(raDecDeg.ra)
      const decDMS = decDegToDMS(raDecDeg.dec)
      // this.prevFov = healpixGridSingleton.getMinFoV()
      this.prevFov = this._healpixGrid.getMinFoV()
      console.log('(startup coords)', {
        raDeg: raDecDeg.ra,
        decDeg: raDecDeg.dec,
        raHMS,
        decDMS,
      })
    }


    this.activeCatalogues.forEach(cat => {
      if (this.activeHiPS) {
        cat.draw(this.activeHiPS.getModelMatrix() as Float32Array, this.mouseHelper, this._camera.getCameraMatrix() as Float32Array)
      }
    })
    this.activeFootprintSets.forEach(fst => {
      if (this.activeHiPS) {
        fst.draw(this.activeHiPS.getModelMatrix() as Float32Array, this.mouseHelper, this._camera.getCameraMatrix() as Float32Array)
      }
    })


  }
}
export default AstroSphere




