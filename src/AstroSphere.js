import { bootSetup } from './Config.js'
import Camera from './Camera.js'
import RayPickingUtils from './utils/RayPickingUtils.js'
import global from './Global.js'
import { newVisibleTilesManager } from './model/hips/VisibleTilesManager.js'
import MouseHelper from './utils/MouseHelper.js'
import $ from "jquery";

import {
  cartesianToSpherical,
  sphericalToAstroDeg,
  raDegToHMS,
  decDegToDMS
} from './utils/Utils.js'
import { session } from './utils/Session.js'
import computePerspectiveMatrixSingleton from './utils/ComputePerspectiveMatrix.js'

import healpixGridSingleton from './model/grid/HealpixGridSingleton.js'
import HiPS from './model/hips/HiPS.js'

class AstroSphere {
  camera

  constructor(canvas, webgl, emit) {
    console.log('inside constructor of AstroBrowserMain')
    global.gl = webgl
    this.emit = emit
    this.init(canvas)
  }

  setEmit(emit) {
    this.emit = emit
  }

  init(canvas) {
    this.showHPXGrid = false
    this.availableCatalogues = [] // list of catalogues returned by TAP repos
    this.activeCataloguesIndexOfAvailableCatalogues = new Set() // indexOf catalogues overlayed in the this.availableCatalogues

    this.availableFootprintSets = [] // list of catalogues returned by TAP repos
    this.activeFootprintSetsIndexOfAvailableCatalogues = new Set() // indexOf catalogues overlayed in the this.availableCatalogues

    this.availableHiPS = []
    this.activeHiPS = new Map()

    this.mouseHelper = new MouseHelper()
    this.initCamera()

    this.fovDeg = bootSetup.camera_fov
    this.nearPlane = bootSetup.camera_near_plane
    this.farPlane = bootSetup.camera_far_plane
    this.aspectRatio = canvas.width / canvas.height

    this.mouseDown = false
    this.lastMouseX = null
    this.lastMouseY = null
    this.inertiaX = 0.0
    this.inertiaY = 0.0
    this.zoomInertia = 0.0

    this.nearestVisibleObjectIdx = 0

    let pMatrix = computePerspectiveMatrixSingleton.computePerspectiveMatrix(
      canvas,
      this.camera,
      this.fovDeg,
      this.aspectRatio,
      this.nearPlane
    )
    if (!pMatrix) {
      console.error('Perspective matrix not set')
      exit(-1)
    }

    const initialFoV = 180
    healpixGridSingleton.init(global.gl)
    newVisibleTilesManager.init(healpixGridSingleton)

    this.currentFoV = initialFoV
    this.startup = true

    // this.refreshFoV()
    // setInterval(() => this.refreshFoV(), 100, this.pMatrix)

    this.addEventListeners(canvas)
  }

  initCamera() {
    if (bootSetup.insideSphere) {
      this.camera = new Camera([0.0, 0.0, -0.005], true)
    } else {
      this.camera = new Camera([0.0, 0.0, 4.0], false)
    }
    global.camera = this.camera
  }

  print() {
    console.log('AstroBrowserMain -> print')
  }

  /**
   *
   * @param {*} ra : Right Ascension in degress
   * @param {*} dec : Declination in degrees
   */
  gotoRaDec(ra, dec) {
    this.camera.goTo(ra, dec)
    const raHMS = raDegToHMS(ra)
    const decDMS = decDegToDMS(dec)
    this.emit('coordsUpdate', { raDeg: ra, decDeg: dec, raHMS: raHMS, decDMS: decDMS })
  }

  toggleInsideSphere() {
    global.insideSphere = !global.insideSphere
    this.camera.setInsideSphere(global.insideSphere)
  }
  
  toggleHealpixGrid() {
    this.showHPXGrid = !this.showHPXGrid
  }


  refreshFoV() {
    let pMatrix = computePerspectiveMatrixSingleton.pMatrix
    this.fovObj = healpixGridSingleton.refreshFoV(false, pMatrix)
    this.currentFoV = healpixGridSingleton.getMinFoV()
  }

  getFoV() {
    return this.fovObj
  }

  addEventListeners(canvas) {
    if (global.debug) {
      console.log('[MainPresenter::addEventListeners]')
    }

    let self = this
    // this.view.metadataPanelButton.click(function () {
    // 	self.dataPanelPresenter.toggleView();
    // });

    const handleMouseDown = (event) => {
      canvas.setPointerCapture(event.pointerId)
      this.mouseDown = true

      this.lastMouseX = event.pageX
      this.lastMouseY = event.pageY

      session.clearHoveredFootprints()
      event.preventDefault()
      return false
    }

    const handleMouseUp = (event) => {
      canvas.releasePointerCapture(event.pointerId)
      this.mouseDown = false
      document.getElementsByTagName('body')[0].style.cursor = 'auto'
      this.lastMouseX = event.clientX
      this.lastMouseY = event.clientY

      const intersectionWithModel = RayPickingUtils.getIntersectionPointWithModel(
        this.lastMouseX,
        this.lastMouseY,
        healpixGridSingleton
      )

      if (intersectionWithModel.intersectionPoint.intersectionPoint === undefined) {
        return
      }
      // if (intersectionWithModel.intersectionPoint.intersectionPoint.length > 0) {
      //   const phiThetaDeg = cartesianToSpherical(
      //     intersectionWithModel.intersectionPoint.intersectionPoint
      //   )
      //   const raDecDeg = sphericalToAstroDeg(phiThetaDeg.phi, phiThetaDeg.theta)
      //   var raHMS = raDegToHMS(raDecDeg.ra)
      //   var decDMS = decDegToDMS(raDecDeg.dec)
      // } 
      this.nearestVisibleObjectIdx = intersectionWithModel.idx
    }

    const handleMouseMove = (event) => {
      const newX = event.clientX
      const newY = event.clientY

      // if (!this.hpGrid) return
      if (!healpixGridSingleton) return
      if (this.mouseDown) {
        document.getElementsByTagName('body')[0].style.cursor = 'grab'

        const deltaX = ((newX - this.lastMouseX) * Math.PI) / canvas.width
        const deltaY = ((newY - this.lastMouseY) * Math.PI) / canvas.width

        this.inertiaX += 0.1 * deltaX
        this.inertiaY += 0.1 * deltaY
      } else {
        // TODO
        /**
         * algo for source picking
         * do raypicking against the HiPS sphere each draw cycle with mouse coords converted into model coords
         * pass these coords to the fragment shader (catalogue fragment shader)
         * In the fragment shader, compute if the segment from mouse coords and source point is less than the point radius (gl_PointSize)
         *
         */
        // TODO THIS LOGIC should be moved into MouseHelper class
        // if (!this.hpGrid) {
        if (!healpixGridSingleton) {
          return
        }
        // const mousePicker = RayPickingUtils.getIntersectionPointWithSingleModel(newX, newY, this.hpGrid, this.pMatrix)
        const pMatrix = computePerspectiveMatrixSingleton.computePerspectiveMatrix(
          canvas,
          this.camera,
          this.fovDeg,
          this.aspectRatio,
          this.nearPlane
        )
        const mousePicker = RayPickingUtils.getIntersectionPointWithSingleModel(
          newX,
          newY,
          healpixGridSingleton,
          pMatrix
        )
        const mousePoint = mousePicker.intersectionPoint
        const mouseObjectPicked = mousePicker.pickedObject
        if (mousePoint !== undefined) {
          if (mousePoint.length > 0) {
            this.mouseHelper.update(mousePoint)
            this.emit('coordsUpdate', {
              raDeg: this.mouseHelper.raDecDeg.ra,
              decDeg: this.mouseHelper.raDecDeg.dec,
              raHMS: this.mouseHelper.raHMS,
              decDMS: this.mouseHelper.decDMS
            })
          }
        }
      }

      this.lastMouseX = newX
      this.lastMouseY = newY
      event.preventDefault()
    }

    this.zoomIn = false
    this.zoomOut = false
    this.Xrot = 0
    this.Yrot = 0
    this.XYrot = [0, 0]
    this.keyPressed = false

    const handleMouseWheel = (event) => {
      if (event.deltaY < 0) {
        // Zoom in
        this.zoomInertia -= 0.001
      } else {
        // Zoom out
        this.zoomInertia += 0.001
      }
    }

    canvas.onpointerdown = handleMouseDown
    canvas.onpointerup = handleMouseUp
    canvas.onpointermove = handleMouseMove
    canvas.onwheel = handleMouseWheel
  }

  // REVIEW THIS METHOD AND MOVE IT
  getPhiThetaDeg(inside, canvas) {
    let maxX = canvas.width
    let maxY = canvas.height

    const pMatrix = computePerspectiveMatrixSingleton.computePerspectiveMatrix(
      canvas,
      this.camera,
      this.fovDeg,
      this.aspectRatio,
      this.nearPlane
    )
    let point = RayPickingUtils.getIntersectionPointWithSingleModel(
      maxX / 2,
      maxY / 2,
      healpixGridSingleton,
      pMatrix
    ).intersectionPoint
    inside = inside !== undefined ? inside : global.insideSphere
    return cartesianToSpherical(point, !inside)
  }

  // Catalogues
  addCatalogueList(catalogueList) {
    this.availableCatalogues = catalogueList
  }

  getCatalogueList() {
    return this.availableCatalogues
  }

  activateCatalogue(catalogueId) {
    const catalogue = this.availableCatalogues.find((cat) => cat.id === catalogueId)
    if (catalogue) {
      this.activeCataloguesIndexOfAvailableCatalogues.add(
        this.availableCatalogues.indexOf(catalogue)
      )
    }
  }

  deActivateCatalogue(catalogueObj) {
    const idx = this.availableCatalogues.indexOf(catalogueObj)
    if (this.activeCataloguesIndexOfAvailableCatalogues.has(idx)) {
      this.activeCataloguesIndexOfAvailableCatalogues.delete(idx)
      this.availableCatalogues[idx].sources = []
    }
  }

  changeCatalogueColor(id, color) {
    let catalogue = this.availableCatalogues.find((cat) => cat.id === id)
    catalogue.catalogueProps.changeColor(color)
  }

  changeCatalogueMetaName(id, metacolumnName) {
    let catalogue = this.availableCatalogues.find((cat) => cat.id === id)
    catalogue.catalogueProps.changeMetaName(metacolumnName)
  }

  changeCatalogueMetaRA(id, metacolumnName) {
    let catalogue = this.availableCatalogues.find((cat) => cat.id === id)
    catalogue.catalogueProps.changeCatalogueMetaRA(metacolumnName)
  }

  changeCatalogueMetaDec(id, metacolumnName) {
    let catalogue = this.availableCatalogues.find((cat) => cat.id === id)
    catalogue.changeCatalogueMetaDec(metacolumnName)
  }

  changeCatalogueMetaShapeSize(id, metacolumnName) {
    let catalogue = this.availableCatalogues.find((cat) => cat.id === id)
    catalogue.changeCatalogueMetaShapeSize(metacolumnName)
  }

  changeCatalogueMetaShapeHue(id, metacolumnName) {
    let catalogue = this.availableCatalogues.find((cat) => cat.id === id)
    catalogue.changeCatalogueMetaShapeHue(metacolumnName)
  }

  // Footprint sets
  addFootprintSetList(footprintSetList) {
    this.availableFootprintSets = footprintSetList
  }

  getFootprintSetList() {
    return this.availableFootprintSets
  }

  activateFootprintSet(fsetId) {
    const footprintSet = this.availableFootprintSets.find((fset) => fset.id === fsetId)
    if (footprintSet) {
      this.activeFootprintSetsIndexOfAvailableCatalogues.add(
        this.availableFootprintSets.indexOf(footprintSet)
      )
    }
  }

  deActivateFootprintSet(fsetObj) {
    const idx = this.availableFootprintSets.indexOf(fsetObj)
    if (this.activeFootprintSetsIndexOfAvailableCatalogues.has(idx)) {
      this.activeFootprintSetsIndexOfAvailableCatalogues.delete(idx)
      this.availableFootprintSets[idx].footprintPolygons = []
    }
  }

  changeFootprintSetColor(id, color) {
    let footprintSet = this.availableFootprintSets.find((fset) => fset.id === id)
    footprintSet.footprintsetProps.changeColor(color)
  }

  changeFootprintSetMetaName(id, metacolumnName) {
    let footprintSet = this.availableFootprintSets.find((fset) => fset.id === id)
    footprintSet.footprintsetProps.changeMetaName(metacolumnName)
  }

  activateDefaultHiPS(hipsKey) {
    const hipsObj = this.availableHiPS.find((hips) => hips.key === hipsKey)
    this.activateHiPS(hipsObj.key)
  }
  getFirstHiPSInHiPSStack() {
    return this.activeHiPS.entries().next().value[1]
  }
  activateHiPS(hipsKey) {
    const hipsObj = this.availableHiPS.find((hips) => hips.key === hipsKey)
    if (hipsObj.hips == undefined || Object.keys(hipsObj.hips).length == 0) {
      const hips = new HiPS(
        1,
        [0.0, 0.0, 0.0],
        0,
        0,
        hipsObj.hipsDescriptor._hipsName,
        hipsObj.hipsDescriptor._hipsurl,
        hipsObj.hipsDescriptor._imgformats[0],
        hipsObj.hipsDescriptor._maxOrder,
        false,
        hipsObj.hipsDescriptor
      )
      hips.refreshModel(180)
      this.availableHiPS[this.availableHiPS.indexOf(hipsObj)].hips = hips
    }

    if (hipsObj) {
      this.activeHiPS.set(hipsObj.key, hipsObj.hips)
      this.emit('activeHiPS', { hips: hipsObj })
    }
    // this.defaultHiPS = null
  }

  deActivateHiPS(hipsKey) {
    if (this.activeHiPS.has(hipsKey)) {
      this.activeHiPS.delete(hipsKey)
    }
    const hipsObj = this.availableHiPS.find((hips) => hips.key === hipsKey)
    hipsObj.hips = {}
  }

  addHiPSList(hipsList) {
    this.availableHiPS = hipsList
  }

  draw(canvas) {
    if (Object.keys(healpixGridSingleton).length == 0) {
      return
    }

    this.aspectRatio = canvas.width / canvas.height

    if (healpixGridSingleton.fovObj === undefined) {
      return
    }
    const pMatrix = computePerspectiveMatrixSingleton.computePerspectiveMatrix(
      canvas,
      this.camera,
      this.fovDeg,
      this.aspectRatio,
      this.nearPlane
    )

    global.gl.getExtension('OES_element_index_uint')

    global.gl.clear(global.gl.COLOR_BUFFER_BIT | global.gl.DEPTH_BUFFER_BIT)

    var cameraRotated = false
    var THETA, PHI

    global.gl.viewport(0, 0, global.gl.viewportWidth, global.gl.viewportHeight)
    global.gl.clear(global.gl.COLOR_BUFFER_BIT | global.gl.DEPTH_BUFFER_BIT)

    // if (global.getSelectedHiPS() !== undefined) {
    if (healpixGridSingleton.fovObj.minFoV > 0.1 || this.zoomInertia > 0) {
      if (Math.abs(this.zoomInertia) > 0.0001) {
        this.camera.zoom(this.zoomInertia)
        this.zoomInertia *= 0.95
        this.emit('fovUpdate', {
          horizontal: healpixGridSingleton.fovObj.fovXDeg,
          vertical: healpixGridSingleton.fovObj.fovYDeg
        })
      }
    }
    if (this.mouseDown || Math.abs(this.inertiaX) > 0.02 || Math.abs(this.inertiaY) > 0.02) {
      cameraRotated = true
      THETA = this.inertiaY
      PHI = this.inertiaX
      this.inertiaX *= 0.95
      this.inertiaY *= 0.95
      this.camera.rotate(PHI, THETA)
    } else {
      this.inertiaY = 0
      this.inertiaX = 0
    }

    global.gl.disable(global.gl.DEPTH_TEST)
    global.gl.enable(global.gl.BLEND)
    global.gl.enable(global.gl.CULL_FACE)
    if (global.insideSphere) {
      global.gl.cullFace(global.gl.BACK)
    } else {
      global.gl.cullFace(global.gl.FRONT)
    }

    if (global.blendMode) {
      global.gl.blendFunc(global.gl.SRC_ALPHA, global.gl.ONE)
    } else {
      global.gl.blendFunc(global.gl.SRC_ALPHA, global.gl.ONE_MINUS_SRC_ALPHA)
    }

    global.gl.blendFunc(global.gl.SRC_ALPHA, global.gl.ONE_MINUS_SRC_ALPHA)

    // DRAW HiPS
    let visibleHips
    for (const [key, value] of this.activeHiPS) {
      let hips = value
      hips.draw(pMatrix, this.camera.getCameraMatrix(), cameraRotated)
      visibleHips = hips
    }

    // GRID    
    if (this.showHPXGrid) {
      $('#gridhpx').show()
    } else {
      $('#gridhpx').hide()
    }

    if (healpixGridSingleton !== undefined && visibleHips) {
      healpixGridSingleton.draw(this.showHPXGrid)
    }

    // if (this._showGrid) {
    // 	$("#gridcoords").show();
    // 	if (this.eqGrid == undefined && this.fovObj !== undefined) {
    // 		this.eqGrid = new EquatorialGrid(1.0, this.fovObj.minFoV);
    // 	}
    // 	if (this.eqGrid !== undefined) {
    // 		this.eqGrid.draw(j2000ModelMatrix, this.fovObj.minFoV);
    // 	}

    // } else {
    // 	$("#gridcoords").hide();
    // }

    global.gl.enable(global.gl.DEPTH_TEST)
    global.gl.disable(global.gl.CULL_FACE)

    // CATALOGUES
    for (let id of this.activeCataloguesIndexOfAvailableCatalogues) {
      let cat = this.availableCatalogues[id]
      // cat.draw(j2000ModelMatrix, this.mouseHelper)
      cat.draw(visibleHips.getModelMatrix(), this.mouseHelper)
    }

    // FOOTPRINTS
    for (let id of this.activeFootprintSetsIndexOfAvailableCatalogues) {
      let fset = this.availableFootprintSets[id]
      // fset.draw(j2000ModelMatrix, this.mouseHelper)
      fset.draw(visibleHips.getModelMatrix(), this.mouseHelper)
    }

    if (this.startup) {
      this.startup = false
      let phiTheta = this.getPhiThetaDeg(global.insideSphere, canvas)
      let raDecDeg = sphericalToAstroDeg(phiTheta.phi, phiTheta.theta)
      let raHMS = raDegToHMS(raDecDeg.ra)
      let decDMS = decDegToDMS(raDecDeg.dec)
      this.emit('coordsUpdate', {
        raDeg: raDecDeg.ra,
        decDeg: raDecDeg.dec,
        raHMS: raHMS,
        decDMS: decDMS
      })
    }
    // }

    //		this.xyzRefSystemObj.draw(this.pMatrix, this.camera.getCameraMatrix());
  }
}

export default AstroSphere
