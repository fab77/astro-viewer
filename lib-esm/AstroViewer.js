import global from './Global.js';
import AstroSphere from './AstroSphere.js';
import { HiPSDescriptor } from './model/hips/HiPSDescriptor.js';
import { CatalogueGL } from './model/catalogues/CatalogueGL.js';
import { bootSetup } from './Config.js';
export class AstroViewer {
    astroSphere;
    canvas;
    webgl;
    rafId = null;
    // API
    run() {
        return this.tick();
    }
    // CATALOGUES
    createCatalogue(catalogueName, catalogueDescription, providerUrl, metadataManager) {
        return new CatalogueGL(catalogueName, catalogueDescription, providerUrl, metadataManager, this.webgl, this.astroSphere.healpixGrid.visibleTilesManager);
    }
    showCatalogue(catalogue) {
        this.astroSphere.showCatalogue(catalogue);
    }
    hideCatalogue(catalogue, isVisible) {
        catalogue.setIsVisible(isVisible);
    }
    deleteCatalogue(catalogue) {
        this.astroSphere.deleteCatalogue(catalogue);
    }
    changeCatalogueRA(catalogue, raColumnName) {
        catalogue.changeMetaRA(raColumnName);
        // catalogue.catalogueProps.changeCatalogueMetaRA(raColumnName)
        return catalogue;
    }
    changeCatalogueDec(catalogue, decColumnName) {
        catalogue.changeMetaDec(decColumnName);
        // catalogue.catalogueProps.changeCatalogueMetaDec(decColumnName)
        return catalogue;
    }
    changeCatalogueColor(catalogue, hexColor) {
        catalogue.changeColor(hexColor);
        // catalogue.catalogueProps.changeColor(hexColor)
        return catalogue;
    }
    setCatalogueShapeHue(catalogue, metadataColumnName) {
        catalogue.changeMetaShapeHue(metadataColumnName);
        return catalogue;
    }
    setCatalogueShapeSize(catalogue, metadataColumnName) {
        catalogue.changeMetaShapeSize(metadataColumnName);
        return catalogue;
    }
    //FOOTPRINT
    showFootprintSet(footprintSet) {
        this.astroSphere.showFootprintSet(footprintSet);
    }
    hideFootprintSet(footprintSet, isVisible) {
        footprintSet.setIsVisible(isVisible);
    }
    deleteFootprintSet(footprintSet) {
        this.astroSphere.deleteFootprintSet(footprintSet);
    }
    changeFootprintSetColor(footprintSet, hexColor) {
        // footprintSet.footprintsetProps.changeColor(hexColor)
        footprintSet.changeColor(hexColor);
    }
    getHoveredFootprints() {
        return this.astroSphere.getHoveredFootprints();
    }
    // HIPS
    getDefaultHiPSURL() {
        return bootSetup.defaultHipsUrl;
    }
    activateHiPS(hipsDescriptor) {
        this.astroSphere.activateHiPS(hipsDescriptor);
    }
    async loadHiPS(baseUrl) {
        const hipsUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
        const resp = await fetch(hipsUrl + 'properties');
        if (!resp.ok)
            throw new Error(`HTTP ${resp.status} fetching properties`);
        const propsText = await resp.text();
        const desc = new HiPSDescriptor(propsText, hipsUrl);
        this.activateHiPS(desc);
    }
    // GOTOs and COORDS
    goTo(raDeg, decDeg) {
        this.astroSphere.goTo(raDeg, decDeg);
    }
    getCenterCoordinates() {
        return this.astroSphere.getCentralPointCoordinates();
    }
    getCoordinatesFromMouse() {
        return this.astroSphere.getLastMousePointCoordinates();
    }
    // GRIDs
    toggleHealpixGrid() {
        // healpixGridSingleton.toggleShowGrid()
        this.astroSphere.healpixGrid.toggleShowGrid();
    }
    isHealpixGridVisible() {
        // return healpixGridSingleton.isVisible()
        return this.astroSphere.healpixGrid.isVisible();
    }
    toggleEquatorialGrid() {
        // equatorialGridSingleton.toggleShowGrid()
        return this.astroSphere.equatorialGrid.toggleShowGrid();
    }
    isEquatorialGridVisible() {
        // return equatorialGridSingleton.isVisible()
        return this.astroSphere.equatorialGrid.isVisible();
    }
    // FOV
    getFoV() {
        return this.astroSphere.getFoV();
    }
    getFoVPolygon() {
        return this.astroSphere.getFoVPolygon();
    }
    changeFoV(deg) {
        this, this.astroSphere.changeFoV(deg);
    }
    changeFoV2(deg) {
        this, this.astroSphere.changeFoV2(deg);
    }
    changeFoV3(deg) {
        this, this.astroSphere.changeFoV3(deg);
    }
    getInsideSphere() {
        return this.astroSphere.getInsideSphere();
    }
    toggleInsideSphere() {
        this.astroSphere.toggleInsideSphere();
    }
    // Internal
    // constructor(canvasDomId: string) {
    //   this.init(canvasDomId)
    // }
    constructor(canvasEl) {
        this.init(canvasEl);
    }
    // private init(canvasDomId: string): void {
    init(canvasEl) {
        console.log('init webgl');
        // const c = document.getElementById(canvasDomId)
        // if (!(c instanceof HTMLCanvasElement)) {
        //   throw new Error(`Element with id ${canvasDomId} is not a canvas.`)
        // }
        // this.canvas = c
        this.canvas = canvasEl;
        const gl = this.canvas.getContext('webgl2', { alpha: false });
        if (!gl) {
            alert('Could not initialise WebGL, sorry :-(');
            throw new Error('WebGL2 not available');
        }
        // Extend with custom fields used elsewhere
        this.webgl = gl;
        this.webgl.viewportWidth = this.canvas.width;
        this.webgl.viewportHeight = this.canvas.height;
        try {
            // 1/255 = 0.00392156862
            this.webgl.clearColor(0 * 0.00392156862, 16 * 0.00392156862, 50 * 0.00392156862, 0.7);
        }
        catch (e) {
            console.log('Error instantiating WebGL context');
        }
        this.initListeners();
        global.gl = this.webgl;
        this.astroSphere = new AstroSphere(this.canvas, this.webgl);
    }
    initListeners() {
        console.log('inside initListeners');
        const resizeCanvas = () => {
            console.log('[resizeCanvas]');
            const rect = this.canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            const newWidth = Math.max(1, Math.floor(rect.width * dpr));
            const newHeight = Math.max(1, Math.floor(rect.height * dpr));
            if (this.canvas.width !== newWidth || this.canvas.height !== newHeight) {
                this.canvas.width = newWidth;
                this.canvas.height = newHeight;
                this.webgl.viewportWidth = this.canvas.width;
                this.webgl.viewportHeight = this.canvas.height;
                this.webgl.viewport(0, 0, this.canvas.width, this.canvas.height);
            }
        };
        const handleContextLost = (event) => {
            console.log('[handleContextLost]');
            event.preventDefault();
            if (this.rafId !== null) {
                cancelAnimationFrame(this.rafId);
                this.rafId = null;
            }
        };
        const handleContextRestored = (_event) => {
            console.log('[handleContextRestored]');
            this.webgl.viewportWidth = this.canvas.width;
            this.webgl.viewportHeight = this.canvas.height;
            this.webgl.clearColor(0 * 0.00392156862, 16 * 0.00392156862, 50 * 0.00392156862, 0.7);
            this.webgl.enable(this.webgl.DEPTH_TEST);
            this.rafId = requestAnimationFrame(() => this.tick());
        };
        // 🔥 ResizeObserver per pannelli / split / layout dinamici
        if ('ResizeObserver' in window) {
            const ro = new ResizeObserver(() => {
                resizeCanvas();
            });
            // Osserva il canvas o il suo parent (a tua scelta)
            ro.observe(this.canvas);
            // Se preferisci il contenitore:
            // if (this.canvas.parentElement) ro.observe(this.canvas.parentElement);
        }
        window.addEventListener('resize', resizeCanvas);
        this.canvas.addEventListener('webglcontextlost', handleContextLost, false);
        this.canvas.addEventListener('webglcontextrestored', handleContextRestored, false);
        resizeCanvas();
    }
    tick() {
        this.drawScene();
        this.rafId = requestAnimationFrame(() => this.tick());
        return this.rafId;
    }
    drawScene() {
        this.astroSphere.draw(this.canvas);
    }
}
//# sourceMappingURL=AstroViewer.js.map