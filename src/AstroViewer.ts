// import global from './Global.js'
import AstroSphere from './AstroSphere.js'
import { HiPSDescriptor } from './model/hips/HiPSDescriptor.js'
import { FoV } from './model/FoV.js'
import { Point } from './model/Point.js'
import { CatalogueGL } from './model/catalogues/CatalogueGL.js'
import type { CameraChangedDetail, PointCoordinates } from './AstroSphere.js'
import { FootprintSetGL, HoveredFootprintDetail } from './model/footprints/FootprintSetGL.js'
import { bootSetup } from './Config.js'
import { MetadataManager } from './model/MetadataManager.js'
import Camera from './Camera.js'
import { ReadonlyMat4 } from 'gl-matrix'
import ColorMaps, { ColorMap, ColorMapName } from './model/ColorMaps.js'
import {HiPS} from './model/hips/HiPS.js'
import { XYZLayer } from './model/earth/XYZLayer.js'
import type { WMTSLayerConfig, XYZDebugStats, XYZLayerConfig } from './model/earth/types.js'
import { xyzTileRequestScheduler } from './model/earth/XYZTileRequestScheduler.js'
import { XYZMapDescriptor } from './model/earth2/XYZMapDescriptor.js'
import { TerraPointSetGL } from './model/terra/TerraPointSetGL.js'
import { TerraFootprintSetGL } from './model/terra/TerraFootprintSetGL.js'
// import healpixGridSingleton from './model/grid/HealpixGridSingleton.js'
// import equatorialGridSingleton from './model/grid/EquatorialGrid.js'
type GL2WithViewport = WebGL2RenderingContext 
// & {
//   viewportWidth: number
//   viewportHeight: number
// }

export class AstroViewer {
  private astroSphere!: AstroSphere
  private canvas!: HTMLCanvasElement
  private webgl!: GL2WithViewport
  private rafId: number | null = null
  private webglContextList: Map<string, GL2WithViewport> = new Map<string, GL2WithViewport>()
  private viewfinderEl: HTMLDivElement | null = null
  private viewfinderVisible = bootSetup.showViewfinder
  private viewfinderColor = 'rgba(75,148,226,0.68)'



  // API
  run(): number {
    return this.tick()
  }

  // CATALOGUES
  createCatalogue(catalogueName: string,
    catalogueDescription: string,
    providerUrl: string,
    metadataManager: MetadataManager,
  ): CatalogueGL {
    return new CatalogueGL(catalogueName, catalogueDescription,
      providerUrl, metadataManager, this.webgl, this.astroSphere.healpixGrid.visibleTilesManager)
  }

  showCatalogue(catalogue: CatalogueGL) {
    this.astroSphere.showCatalogue(catalogue)
  }

  hideCatalogue(catalogue: CatalogueGL, isVisible: boolean) {
    catalogue.setIsVisible(isVisible)
  }

  deleteCatalogue(catalogue: CatalogueGL) {
    this.astroSphere.deleteCatalogue(catalogue)
  }

  changeCatalogueRA(catalogue: CatalogueGL, raColumnName: string): CatalogueGL {
    catalogue.changeMetaRA(raColumnName)
    // catalogue.catalogueProps.changeCatalogueMetaRA(raColumnName)
    return catalogue
  }

  changeCatalogueDec(catalogue: CatalogueGL, decColumnName: string): CatalogueGL {
    catalogue.changeMetaDec(decColumnName)
    // catalogue.catalogueProps.changeCatalogueMetaDec(decColumnName)
    return catalogue
  }

  changeCatalogueColor(catalogue: CatalogueGL, hexColor: string): CatalogueGL {
    catalogue.changeColor(hexColor)
    // catalogue.catalogueProps.changeColor(hexColor)
    return catalogue
  }

  setCatalogueShapeHue(catalogue: CatalogueGL, metadataColumnName: string): CatalogueGL {
    catalogue.changeMetaShapeHue(metadataColumnName)
    return catalogue
  }

  setCatalogueShapeSize(catalogue: CatalogueGL, metadataColumnName: string): CatalogueGL {
    catalogue.changeMetaShapeSize(metadataColumnName)
    return catalogue
  }

  //FOOTPRINT
createFootprintSet(footprintSetName: string,
    footprintSetDescription: string,
    providerUrl: string,
    metadataManager: MetadataManager,
  ): FootprintSetGL {
    return new FootprintSetGL(footprintSetName, footprintSetDescription,
      providerUrl, metadataManager, this.webgl, this.astroSphere.healpixGrid.visibleTilesManager)
  }

  showFootprintSet(footprintSet: FootprintSetGL) {
    this.astroSphere.showFootprintSet(footprintSet)
  }

  hideFootprintSet(footprintSet: FootprintSetGL, isVisible: boolean) {
    footprintSet.setIsVisible(isVisible)
  }

  deleteFootprintSet(footprintSet: FootprintSetGL) {
    this.astroSphere.deleteFootprintSet(footprintSet)
  }

  // TERRA OVERLAYS
  createTerraPointSet(
    pointSetName: string,
    pointSetDescription: string,
    providerUrl: string,
    metadataManager: MetadataManager,
  ): TerraPointSetGL {
    return new TerraPointSetGL(
      pointSetName,
      pointSetDescription,
      providerUrl,
      metadataManager,
      this.webgl,
      this.astroSphere.healpixGrid.visibleTilesManager,
    )
  }

  showTerraPointSet(pointSet: TerraPointSetGL) {
    this.astroSphere.showCatalogue(pointSet)
  }

  hideTerraPointSet(pointSet: TerraPointSetGL, isVisible: boolean) {
    pointSet.setIsVisible(isVisible)
  }

  deleteTerraPointSet(pointSet: TerraPointSetGL) {
    this.astroSphere.deleteCatalogue(pointSet)
  }

  createTerraFootprintSet(
    footprintSetName: string,
    footprintSetDescription: string,
    providerUrl: string,
    metadataManager: MetadataManager,
  ): TerraFootprintSetGL {
    return new TerraFootprintSetGL(
      footprintSetName,
      footprintSetDescription,
      providerUrl,
      metadataManager,
      this.webgl,
      this.astroSphere.healpixGrid.visibleTilesManager,
    )
  }

  showTerraFootprintSet(footprintSet: TerraFootprintSetGL) {
    this.astroSphere.showFootprintSet(footprintSet)
  }

  hideTerraFootprintSet(footprintSet: TerraFootprintSetGL, isVisible: boolean) {
    footprintSet.setIsVisible(isVisible)
  }

  deleteTerraFootprintSet(footprintSet: TerraFootprintSetGL) {
    this.astroSphere.deleteFootprintSet(footprintSet)
  }

  changeFootprintSetColor(footprintSet: FootprintSetGL, hexColor: string) {
    // footprintSet.footprintsetProps.changeColor(hexColor)
    footprintSet.changeColor(hexColor)
  }

  getHoveredFootprints(): HoveredFootprintDetail[] {
    return this.astroSphere.getHoveredFootprints()
  }

  // HIPS
  getDefaultHiPSURL(): string {
    return bootSetup.defaultHipsUrl
  }

  activateHiPS(hipsDescriptor: HiPSDescriptor): void {
    this.astroSphere.activateHiPS(hipsDescriptor)
  }

  activateXYZ(config: XYZLayerConfig): void {
    this.astroSphere.activateXYZ(config)
  }

  activateXYZ2(config: XYZLayerConfig & { name?: string }): void {
    const descriptor = new XYZMapDescriptor(
      config.name ?? 'XYZ Earth2 Layer',
      config.urlTemplate,
      config.minZoom ?? 0,
      config.maxZoom ?? 8,
      config.segmentsPerSide ?? 16,
      config.maxCachedTiles ?? 384,
    )
    this.astroSphere.activateXYZ2(descriptor)
  }

  activateWMTS(config: WMTSLayerConfig): void {
    this.astroSphere.activateWMTS(config)
  }

  setXYZMaxConcurrentRequests(value: number): void {
    xyzTileRequestScheduler.setMaxConcurrent(value)
  }

  getXYZMaxConcurrentRequests(): number {
    return xyzTileRequestScheduler.getMaxConcurrent()
  }

  getXYZDebugStats(): XYZDebugStats {
    return this.astroSphere.getXYZDebugStats()
  }

  async loadHiPS(baseUrl: string): Promise<string> {
    const hipsUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
    const resp = await fetch(hipsUrl + 'properties');
    if (!resp.ok) throw new Error(`HTTP ${resp.status} fetching properties`);
    const propsText = await resp.text();
    const desc = new HiPSDescriptor(propsText, hipsUrl);
    this.astroSphere.activateHiPS(desc)
    return desc.surveyName
    // this.activateHiPS(desc);
  }

  // changeColorMap(hips: HiPS, colorMapName: ColorMapName) {
  changeColorMap(colorMapName: ColorMapName) {
    const colorMap = ColorMaps[colorMapName]
    // hips.changeColorMap(colorMap)
    this.astroSphere.changeColorMap(colorMap)
  }

  changeCustomColorMap(colorMap: ColorMap) {
    this.astroSphere.changeColorMap(colorMap)
  }

  getActiveHiPS(): HiPS | null {
    return this.astroSphere.activeHiPS
  }

  getActiveXYZ(): XYZLayer | null {
    return this.astroSphere.activeXYZ
  }

  // Camera: GOTOs and COORDS
  setCamera(camera: Camera) {
    this.astroSphere.setCamera(camera)
  }

  setCameraPosition(pos: [number, number, number]){
    this.astroSphere.setCameraPosition(pos)
  }

  setCameraMatrix(viewMatrix: Float32Array){
    this.astroSphere.setCameraMatrix(viewMatrix)
  }

  restoreAstroViewerState(detail: CameraChangedDetail, applyColorMap: boolean) {
    this.astroSphere.applyFullCameraState(detail, applyColorMap)
  }

  getCurrentAstroViewerStatus(): CameraChangedDetail | null{
    return this.astroSphere.getCurrentStatus()
  }

  goTo(raDeg: number, decDeg: number): void {
    // console.log(`AstroViewer.goTo goto(${raDeg}, ${decDeg})`)
    this.astroSphere.goTo(raDeg, decDeg)
  }
  getCenterCoordinates(): PointCoordinates | undefined {
    return this.astroSphere.getCentralPointCoordinates()
  }

  getCoordinatesFromMouse(): PointCoordinates | undefined {
    return this.astroSphere.getLastMousePointCoordinates()
  }

  // GRIDs
  setModelMatrix(modelMatrix: ReadonlyMat4){
    this.astroSphere.healpixGrid.setModelMatrix(modelMatrix)
  }
  toggleHealpixGrid() {
    // healpixGridSingleton.toggleShowGrid()
    this.astroSphere.healpixGrid.toggleShowGrid()
  }

  isHealpixGridVisible(): boolean {
    // return healpixGridSingleton.isVisible()
    return this.astroSphere.healpixGrid.isVisible()
  }

  toggleEquatorialGrid() {
    // equatorialGridSingleton.toggleShowGrid()
    return this.astroSphere.equatorialGrid.toggleShowGrid()
  }

  isEquatorialGridVisible(): boolean {
    // return equatorialGridSingleton.isVisible()
    return this.astroSphere.equatorialGrid.isVisible()
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

  toggleViewfinder(): boolean {
    this.viewfinderVisible = !this.viewfinderVisible
    this.syncViewfinderVisibility()
    return this.viewfinderVisible
  }

  setViewfinderVisible(visible: boolean): void {
    this.viewfinderVisible = visible
    this.syncViewfinderVisibility()
  }

  isViewfinderVisible(): boolean {
    return this.viewfinderVisible
  }

  setViewfinderColor(color: string): void {
    this.viewfinderColor = color
    this.syncViewfinderColor()
  }

  getViewfinderColor(): string {
    return this.viewfinderColor
  }

  setRotationSensitivity(value: number): void {
    this.astroSphere.setCameraRotationSensitivity(value)
  }

  getRotationSensitivity(): number {
    return this.astroSphere.getCameraRotationSensitivity()
  }

  setZoomSensitivity(value: number): void {
    this.astroSphere.setZoomSensitivity(value)
  }

  getZoomSensitivity(): number {
    return this.astroSphere.getZoomSensitivity()
  }

  // Internal
  constructor(canvasEl: HTMLCanvasElement) {
    this.init(canvasEl)
    this.webglContextList = new Map<string, GL2WithViewport>()
  }

  private init(canvasEl: HTMLCanvasElement): void {
    console.log('init webgl')
    this.canvas = canvasEl
    this.initViewfinder()

    const gl = this.canvas.getContext('webgl2', { alpha: false })
    if (!gl) {
      alert('Could not initialise WebGL, sorry :-(')
      throw new Error('WebGL2 not available')
    }

    // Extend with custom fields used elsewhere
    this.webgl = gl as GL2WithViewport
    // this.webgl.viewportWidth = this.canvas.width
    // this.webgl.viewportHeight = this.canvas.height

    try {
      // 1/255 = 0.00392156862
      this.webgl.clearColor(0 * 0.00392156862, 16 * 0.00392156862, 50 * 0.00392156862, 0.7)
    } catch (e) {
      console.log('Error instantiating WebGL context')
    }

    this.initListeners()
      // ; (global as any).gl = this.webgl
    this.astroSphere = new AstroSphere(this.canvas, this.webgl)
  }

  private initViewfinder(): void {
    const parent = this.canvas.parentElement
    if (!parent) return

    if (window.getComputedStyle(parent).position === 'static') {
      parent.style.position = 'relative'
    }

    const viewfinder = document.createElement('div')
    viewfinder.setAttribute('data-astro-viewfinder', 'true')
    viewfinder.setAttribute('aria-hidden', 'true')
    viewfinder.style.position = 'absolute'
    viewfinder.style.left = '50%'
    viewfinder.style.top = '50%'
    viewfinder.style.width = '44px'
    viewfinder.style.height = '44px'
    viewfinder.style.transform = 'translate(-50%, -50%)'
    viewfinder.style.pointerEvents = 'none'
    viewfinder.style.zIndex = '1'
    viewfinder.style.boxSizing = 'border-box'

    const segments: Array<{
      left?: string;
      right?: string;
      top?: string;
      bottom?: string;
      width: string;
      height: string;
      transform: string;
    }> = [
      { left: '50%', top: '7px', width: '1px', height: '11px', transform: 'translateX(-50%)' },
      { left: '50%', bottom: '7px', width: '1px', height: '11px', transform: 'translateX(-50%)' },
      { left: '7px', top: '50%', width: '11px', height: '1px', transform: 'translateY(-50%)' },
      { right: '7px', top: '50%', width: '11px', height: '1px', transform: 'translateY(-50%)' },
    ]

    for (const segmentDef of segments) {
      const segment = document.createElement('div')
      segment.style.position = 'absolute'
      segment.style.left = segmentDef.left ?? 'auto'
      segment.style.right = segmentDef.right ?? 'auto'
      segment.style.top = segmentDef.top ?? 'auto'
      segment.style.bottom = segmentDef.bottom ?? 'auto'
      segment.style.width = segmentDef.width
      segment.style.height = segmentDef.height
      segment.style.transform = segmentDef.transform
      segment.style.background = 'currentColor'
      segment.style.borderRadius = '999px'
      segment.style.boxShadow = '0 0 0 1px rgba(0, 0, 0, 0.14)'
      viewfinder.appendChild(segment)
    }
    parent.appendChild(viewfinder)

    this.viewfinderEl = viewfinder
    this.syncViewfinderVisibility()
    this.syncViewfinderColor()
  }

  private syncViewfinderVisibility(): void {
    if (!this.viewfinderEl) return
    this.viewfinderEl.style.display = this.viewfinderVisible ? 'block' : 'none'
  }

  private syncViewfinderColor(): void {
    if (!this.viewfinderEl) return
    this.viewfinderEl.style.color = this.viewfinderColor
  }

  private initListeners(): void {
    console.log('inside initListeners')

    const resizeCanvas = () => {
      console.log('[resizeCanvas]')

      const rect = this.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const newWidth = Math.max(1, Math.floor(rect.width * dpr));
      const newHeight = Math.max(1, Math.floor(rect.height * dpr));

      if (this.canvas.width !== newWidth || this.canvas.height !== newHeight) {

        this.canvas.width = newWidth;
        this.canvas.height = newHeight;

        // this.webgl.viewportWidth = this.canvas.width
        // this.webgl.viewportHeight = this.canvas.height
        this.webgl.viewport(0, 0, this.canvas.width, this.canvas.height)
      }
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
      // this.webgl.viewportWidth = this.canvas.width
      // this.webgl.viewportHeight = this.canvas.height
      this.webgl.clearColor(0 * 0.00392156862, 16 * 0.00392156862, 50 * 0.00392156862, 0.7)
      this.webgl.enable(this.webgl.DEPTH_TEST)
      this.rafId = requestAnimationFrame(() => this.tick())
    }

    // 🔥 ResizeObserver per pannelli / split / layout dinamici
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(() => {
        resizeCanvas();
      });

      // Osserva il canvas o il suo parent (a tua scelta)
      ro.observe(this.canvas);
      
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
