// AstroCoreEntryPoint.ts
import global from './Global.js';
import AstroSphere from './AstroSphere.js';
import { bootSetup } from './Config.js';
import healpixGridSingleton from './model/grid/HealpixGridSingleton.js';
import equatorialGridSingleton from './model/grid/EquatorialGrid.js';
export class AstroCore {
    astroSphere;
    canvas;
    webgl;
    rafId = null;
    // API
    run() {
        return this.tick();
    }
    // CATALOGUES
    showCatalogue(catalogue) {
        this.astroSphere.showCatalogue(catalogue);
    }
    hideCatalogue(catalogue, isVisible) {
        catalogue.setIsVisible(isVisible);
    }
    deleteCatalogue(catalogue) {
        this.astroSphere.deleteCatalogue(catalogue);
    }
    changeCatalogueColor(catalogue, hexColor) {
        catalogue.catalogueProps.changeColor(hexColor);
    }
    setCatalogueShapeHue(catalogue, metadataColumnName) {
        catalogue.changeCatalogueMetaShapeHue(metadataColumnName);
    }
    setCatalogueShapeSize(catalogue, metadataColumnName) {
        catalogue.changeCatalogueMetaShapeSize(metadataColumnName);
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
        footprintSet.footprintsetProps.changeColor(hexColor);
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
        healpixGridSingleton.toggleShowGrid();
    }
    isHealpixGridVisible() {
        return healpixGridSingleton.isVisible();
    }
    toggleEquatorialGrid() {
        equatorialGridSingleton.toggleShowGrid();
    }
    isEquatorialGridVisible() {
        return equatorialGridSingleton.isVisible();
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
    constructor() {
        this.init();
    }
    init() {
        console.log('init webgl');
        const c = document.getElementById('astrocanvas');
        if (!(c instanceof HTMLCanvasElement)) {
            throw new Error("Element with id 'canvas-ab' is not a canvas.");
        }
        this.canvas = c;
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
            const newWidth = window.innerWidth - 3;
            const newHeight = window.innerHeight - 3;
            this.canvas.width = newWidth;
            this.canvas.height = newHeight;
            this.webgl.viewportWidth = this.canvas.width;
            this.webgl.viewportHeight = this.canvas.height;
            this.webgl.viewport(0, 0, this.canvas.width, this.canvas.height);
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
//# sourceMappingURL=AstroCore.js.map