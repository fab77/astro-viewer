import global from './Global.js'
import AstroSphere from './AstroSphere.js'

class AstroBrowser {
  astroSphere
  canvas
  webgl

  constructor(emit) {
    global.init()
    
    this.init(emit)
  }

  setEmit(emit) {
    this.astroSphere.setEmit(emit)
  }

  // Catalogue
  activateCatalogue(catalogueId){
    this.astroSphere.activateCatalogue(catalogueId)
  }

  addCatalogueList(catalogueList){
    this.astroSphere.addCatalogueList(catalogueList)
  }
  
  getCatalogueList() {
    return this.astroSphere.getCatalogueList()
  }

  deActivateCatalogue(catalogueObj) {
    this.astroSphere.deActivateCatalogue(catalogueObj)
  }

  changeCatalogueColor(id, color) {
    this.astroSphere.changeCatalogueColor(id, color)
  }

  changeCatalogueMetaName(id, metacolumnName) {
    this.astroSphere.changeCatalogueRA(id, metacolumnName)
  }
  changeCatalogueMetaRA(id, metacolumnName) {
    this.astroSphere.changeCatalogueMetaRA(id, metacolumnName)
  }
  changeCatalogueMetaDec(id, metacolumnName) {
    this.astroSphere.changeCatalogueMetaDec(id, metacolumnName)
  }
  changeCatalogueMetaShapeSize(id, metacolumnName) {
    this.astroSphere.changeCatalogueMetaShapeSize(id, metacolumnName)
  }
  changeCatalogueMetaShapeHue(id, metacolumnName) {
    this.astroSphere.changeCatalogueMetaShapeHue(id, metacolumnName)
  }

  // Footprints sets
  activateFootprintSet(fsetId){
    this.astroSphere.activateFootprintSet(fsetId)
  }
  
  addFootprintSetList(footprintSetList){
    this.astroSphere.addFootprintSetList(footprintSetList)
  }

  getFootprintSetList() {
    return this.astroSphere.getFootprintSetList()
  }

  deActivateFootprintSet(fsetObj) {
    this.astroSphere.deActivateFootprintSet(fsetObj)
  }

  changeFootprintSetColor(id, color) {
    this.astroSphere.changeFootprintSetColor(id, color)
  }

  changeFootprintSetMetaName(id, metacolumnName) {
    this.astroSphere.changeFootprintSetMetaName(id, metacolumnName)
  }

  // HiPS
  activateDefaultHiPS(descriptor){
    this.astroSphere.activateDefaultHiPS(descriptor)
  }
  activateHiPS(hipsId){
    this.astroSphere.activateHiPS(hipsId)
  }
  deActivateHiPS(hipsObj) {
    this.astroSphere.deActivateHiPS(hipsObj)
  }
  addHiPSList(hipsList){
    this.astroSphere.addHiPSList(hipsList)
  }

  getActiveHiPSStack() {
    return this.astroSphere.activeHiPS
  }

  getFirstHiPSInHiPSStack() {
    return this.astroSphere.getFirstHiPSInHiPSStack()
  }

  // General features
  gotoRaDec(ra, dec) {
    this.astroSphere.gotoRaDec(ra, dec)
  }

  toggleInsideSphere() {
    this.astroSphere.toggleInsideSphere()
  }
  
  toggleHealpixGrid() {
    this.astroSphere.toggleHealpixGrid()
  }

  testEmit(emit) {
    console.log(emit)
    this.astroSphere.testEmit(emit)
  }
  init(emit) {
    console.log('init webgl')

    this.canvas = document.getElementById('canvas-ab')
    this.webgl = this.canvas.getContext('webgl2', { alpha: false })
    this.webgl.viewportWidth = this.canvas.width
    this.webgl.viewportHeight = this.canvas.height

    try {
      if (!this.webgl) {
        alert('Could not initialise WebGL, sorry :-(')
      }
      // this.webgl.clearColor(0.0, 0.0, 0.0, 0.7);
      // 1/255 = 0.00392156862
      this.webgl.clearColor(0 * 0.00392156862, 16 * 0.00392156862, 50 * 0.00392156862, 0.7)
      // this.webgl.clearColor(0.05, 0.05, 0.05, 0.7)
    } catch (e) {
      console.log('Error instansiating WebGL context')
    }

    this.initListeners()
    global.gl = this.webgl
    this.astroSphere = new AstroSphere(this.canvas, this.webgl, emit)
  }

  initListeners() {
    console.log('inside initListeners')
    const resizeCanvas = () => {
      console.log('[resizeCanvas]')

      const newWidth = window.innerWidth - 3
      const newHeight = window.innerHeight - 3

      this.canvas.width = newWidth
      this.canvas.height = newHeight

      this.webgl.viewportWidth = this.canvas.width
      this.webgl.viewportHeight = this.canvas.height
    }

    function handleContextLost(event) {
      console.log('[handleContextLost]')
      event.preventDefault()
      cancelRequestAnimFrame(this.abId)
    }

    const handleContextRestored = (event) => {
      console.log('[handleContextRestored]')
      // const canvas = document.getElementById("fabviewer_canvas");
      this.webgl.viewportWidth = this.canvas.width
      this.webgl.viewportHeight = this.canvas.height

      this.webgl.clearColor(0 * 0.00392156862, 16 * 0.00392156862, 50 * 0.00392156862, 0.7)
      // this.webgl.clearColorrgbrgb(0.60,	0.62,	0.42, 0.7)
      // this.webgl.clearColorrgbrgb(0.86, 0.86, 0.86, 0.7)
      this.webgl.enable(this.webgl.DEPTH_TEST)
      this.abId = requestAnimFrame(this.tick, this.canvas)
    }

    window.addEventListener('resize', resizeCanvas)
    this.canvas.addEventListener('webglcontextlost', handleContextLost, false)
    this.canvas.addEventListener('webglcontextrestored', handleContextRestored, false)
    resizeCanvas()
  }

  run() {
    return this.tick()
  }

  tick() {
    this.drawScene()
    let self = this
    return requestAnimationFrame(() => self.tick())
  }

  drawScene() {
    this.astroSphere.draw(this.canvas)
  }

  getFov() {
    return this.astroSphere.getFoV()
  }

  getCentralCoords() {
    return this.astroSphere.getCentralCoords()
  }
}

export default AstroBrowser
