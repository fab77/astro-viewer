import global from './Global.js'
import AstroSphere from './AstroSphere.js'
import { HiPSDescriptor } from './model/hips/HiPSDescriptor.js'
import { FoV } from './model/FoV.js'
import Point from './model/Point.js'
import CatalogueGL from './model/catalogues/CatalogueGL.js'
import type { PointCoordinates } from './AstroSphere.js'
import FootprintSetGL, { HoveredFootprintDetail } from './model/footprints/FootprintSetGL.js'
import { bootSetup } from './Config.js'
import healpixGridSingleton from './model/grid/HealpixGridSingleton.js'
import equatorialGridSingleton from './model/grid/EquatorialGrid.js'
type GL2WithViewport = WebGL2RenderingContext & {
  viewportWidth: number
  viewportHeight: number
}

export class AstroViewer {
  private astroSphere!: AstroSphere
  private canvas!: HTMLCanvasElement
  private webgl!: GL2WithViewport
  private rafId: number | null = null



  // API
  run(): number {
    return this.tick()
  }

  // CATALOGUES
  showCatalogue(catalogue: CatalogueGL) {
    this.astroSphere.showCatalogue(catalogue)
  }
  hideCatalogue(catalogue: CatalogueGL, isVisible: boolean) {
    catalogue.setIsVisible(isVisible)
  }
  deleteCatalogue(catalogue: CatalogueGL) {
    this.astroSphere.deleteCatalogue(catalogue)
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

  //FOOTPRINT
  showFootprintSet(footprintSet: FootprintSetGL) {
    this.astroSphere.showFootprintSet(footprintSet)
  }

  hideFootprintSet(footprintSet: FootprintSetGL, isVisible: boolean) {
    footprintSet.setIsVisible(isVisible)
  }

  deleteFootprintSet(footprintSet: FootprintSetGL) {
    this.astroSphere.deleteFootprintSet(footprintSet)
  }

  changeFootprintSetColor(footprintSet: FootprintSetGL, hexColor: string) {
    footprintSet.footprintsetProps.changeColor(hexColor)
  }

  getHoveredFootprints(): HoveredFootprintDetail[]{
    return this.astroSphere.getHoveredFootprints()
  }

  // HIPS
  getDefaultHiPSURL(): string {
    return bootSetup.defaultHipsUrl
  }

  activateHiPS(hipsDescriptor: HiPSDescriptor): void {
    this.astroSphere.activateHiPS(hipsDescriptor)
  }

  // GOTOs and COORDS
  goTo(raDeg: number, decDeg: number): void {
    this.astroSphere.goTo(raDeg, decDeg)
  }
  getCenterCoordinates(): PointCoordinates | undefined {
    return this.astroSphere.getCentralPointCoordinates()
  }

  getCoordinatesFromMouse(): PointCoordinates | undefined {
    return this.astroSphere.getLastMousePointCoordinates()
  }

  // GRIDs
  toggleHealpixGrid() {
    healpixGridSingleton.toggleShowGrid()
  }

  isHealpixGridVisible(): boolean{
    return healpixGridSingleton.isVisible()
  }

  toggleEquatorialGrid() {
    equatorialGridSingleton.toggleShowGrid()
  }

  isEquatorialGridVisible(): boolean {
      return equatorialGridSingleton.isVisible()
  }

  // FOV
  getFoV(): FoV {
    return this.astroSphere.getFoV()
  }

  getFoVPolygon(): Point[] {
    return this.astroSphere.getFoVPolygon()
  }

  changeFoV(deg: number) {
    this, this.astroSphere.changeFoV(deg)
  }

  changeFoV2(deg: number) {
    this, this.astroSphere.changeFoV2(deg)
  }
  changeFoV3(deg: number) {
    this, this.astroSphere.changeFoV3(deg)
  }

  getInsideSphere(): boolean {
    return this.astroSphere.getInsideSphere()
  }

  toggleInsideSphere() {
    this.astroSphere.toggleInsideSphere()
  }

  // Internal
  constructor() {
    this.init()
  }

  private init(): void {
    console.log('init webgl')

    const c = document.getElementById('astrocanvas')
    if (!(c instanceof HTMLCanvasElement)) {
      throw new Error("Element with id 'canvas-ab' is not a canvas.")
    }
    this.canvas = c

    const gl = this.canvas.getContext('webgl2', { alpha: false })
    if (!gl) {
      alert('Could not initialise WebGL, sorry :-(')
      throw new Error('WebGL2 not available')
    }

    // Extend with custom fields used elsewhere
    this.webgl = gl as GL2WithViewport
    this.webgl.viewportWidth = this.canvas.width
    this.webgl.viewportHeight = this.canvas.height

    try {
      // 1/255 = 0.00392156862
      this.webgl.clearColor(0 * 0.00392156862, 16 * 0.00392156862, 50 * 0.00392156862, 0.7)
    } catch (e) {
      console.log('Error instantiating WebGL context')
    }

    this.initListeners()
      ; (global as any).gl = this.webgl
    this.astroSphere = new AstroSphere(this.canvas, this.webgl)
  }

  private initListeners(): void {
    console.log('inside initListeners')

    const resizeCanvas = () => {
      console.log('[resizeCanvas]')
      const newWidth = window.innerWidth - 3
      const newHeight = window.innerHeight - 3

      this.canvas.width = newWidth
      this.canvas.height = newHeight

      this.webgl.viewportWidth = this.canvas.width
      this.webgl.viewportHeight = this.canvas.height
      this.webgl.viewport(0, 0, this.canvas.width, this.canvas.height)
    }

    const handleContextLost = (event: Event) => {
      console.log('[handleContextLost]')
      event.preventDefault()
      if (this.rafId !== null) {
        cancelAnimationFrame(this.rafId)
        this.rafId = null
      }
    }

    const handleContextRestored = (_event: Event) => {
      console.log('[handleContextRestored]')
      this.webgl.viewportWidth = this.canvas.width
      this.webgl.viewportHeight = this.canvas.height
      this.webgl.clearColor(0 * 0.00392156862, 16 * 0.00392156862, 50 * 0.00392156862, 0.7)
      this.webgl.enable(this.webgl.DEPTH_TEST)
      this.rafId = requestAnimationFrame(() => this.tick())
    }

    window.addEventListener('resize', resizeCanvas)
    this.canvas.addEventListener('webglcontextlost', handleContextLost as EventListener, false)
    this.canvas.addEventListener('webglcontextrestored', handleContextRestored as EventListener, false)
    resizeCanvas()
  }


  private tick(): number {
    this.drawScene()
    this.rafId = requestAnimationFrame(() => this.tick())
    return this.rafId
  }

  private drawScene(): void {
    this.astroSphere.draw(this.canvas)
  }


}