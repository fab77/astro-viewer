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
} from './utils/Utils.js'


import healpixGridSingleton from './model/grid/HealpixGridSingleton.js'
import HiPS from './model/hips/HiPS.js'
import {HiPSDescriptor} from './model/hips/HiPSDescriptor.js'
import computePerspectiveMatrixSingleton from './utils/ComputePerspectiveMatrix.js'

/**
 * AstroSphere — main WebGL scene controller (TS port)
 */
class AstroSphere {
  private camera!: Camera

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

  constructor(canvas: HTMLCanvasElement, webgl: WebGL2RenderingContext) {
    // Keep global GL context (as in original JS)
    global.gl = webgl
    this.mouseHelper = new MouseHelper()
    this.init(canvas)
  }

  private init(canvas: HTMLCanvasElement) {
    this.initCamera()

    healpixGridSingleton.init()
    visibleTilesManager.init()
    computePerspectiveMatrixSingleton.computePerspectiveMatrix(canvas, this.camera, bootSetup.camera_fov_deg, bootSetup.camera_near_plane)

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


  refreshFoV() {
    healpixGridSingleton.refreshFoV(false)
    healpixGridSingleton.getMinFoV()
  }

  getFoV() {
    return healpixGridSingleton.refreshFoV(false)
  }

  private addEventListeners(canvas: HTMLCanvasElement) {
    if (global.debug) {
      console.log('[AstroSphere::addEventListeners]')
    }

    const handleMouseDown = (event: PointerEvent) => {
      canvas.setPointerCapture(event.pointerId)
      this.mouseDown = true
      this.lastMouseX = event.pageX
      this.lastMouseY = event.pageY

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
        const deltaY = ((newY - (this.lastMouseY ?? newY)) * Math.PI) / canvas.width

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
        }
      }

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
    }

    canvas.onpointerdown = handleMouseDown
    canvas.onpointerup = handleMouseUp
    canvas.onpointermove = handleMouseMove
    canvas.onwheel = handleMouseWheel
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

  setViewport(gl: WebGLRenderingContext) {
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  }

  draw(canvas: HTMLCanvasElement) {

    if (!global.gl) return
    if (!this.activeHiPS) return
    if (!healpixGridSingleton || Object.keys(healpixGridSingleton).length === 0) return
    if ((healpixGridSingleton as any).fovObj === undefined) return

    global.gl.getExtension('OES_element_index_uint')
    global.gl.clear(global.gl.COLOR_BUFFER_BIT | global.gl.DEPTH_BUFFER_BIT)


    
    computePerspectiveMatrixSingleton.computePerspectiveMatrix(canvas, this.camera, bootSetup.camera_fov_deg, bootSetup.camera_near_plane)

    let cameraRotated = false
    let THETA = 0
    let PHI = 0


    this.setViewport(global.gl) // move this outside the draw
    global.gl.clear(global.gl.COLOR_BUFFER_BIT | global.gl.DEPTH_BUFFER_BIT)

    // Zoom inertia
    if ((healpixGridSingleton as any).fovObj.minFoV > 0.1 || this.zoomInertia > 0) {
      if (Math.abs(this.zoomInertia) > 0.0001) {
        this.camera.zoom(this.zoomInertia)
        this.zoomInertia *= 0.95
        console.log('EMIT HERE (fovUpdate)')
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
      computePerspectiveMatrixSingleton.computePerspectiveMatrix(canvas, this.camera, bootSetup.camera_fov_deg, bootSetup.camera_near_plane)

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
    healpixGridSingleton.draw(this.showHPXGrid)

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
  }
}



export default AstroSphere
