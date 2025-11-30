import { bootSetup } from './Config.js';
import Camera from './Camera.js';
import RayPickingUtils from './utils/RayPickingUtils.js';
import global from './Global.js';
import MouseHelper from './utils/MouseHelper.js';
import { cartesianToSpherical, sphericalToAstroDeg, raDegToHMS, decDegToDMS, } from './utils/Utils.js';
import { HiPS } from './model/hips/HiPS.js';
import { PerspectiveMatrixManager } from './utils/PerspectiveMatrixManager.js';
import { Point } from './model/Point.js';
import { FoVUtils } from './utils/FoVUtils.js';
import { EquatorialGrid } from './model/grid/EquatorialGrid.js';
import { HealpixGrid } from './model/grid/HealpixGrid.js';
import { CoordsType } from './utils/CoordsType.js';
import ColorMaps from './model/ColorMaps.js';
/**
 * AstroSphere — main WebGL scene controller (TS port)
 */
class AstroSphere {
    _camera;
    _perspectiveMatrixManager;
    centralPoinCoords;
    mousePointCoords;
    canvas;
    _healpixGrid;
    _equatorialGrid;
    mouseHelper;
    mouseDown = false;
    lastMouseX = null;
    lastMouseY = null;
    inertiaX = 0.0;
    inertiaY = 0.0;
    zoomInertia = 0.0;
    _activeHiPS = null;
    startup = true;
    fov;
    activeCatalogues = [];
    activeFootprintSets = [];
    _webgl;
    _selectedColorMap;
    constructor(canvas, webgl) {
        console.log('[AstroSphere] new instance for canvas', canvas.id);
        // Keep global GL context (as in original JS)
        this._webgl = webgl;
        this.mouseHelper = new MouseHelper();
        this.canvas = canvas;
        const nativeColorMap = 'native';
        this._selectedColorMap = ColorMaps[nativeColorMap];
        global.insideSphere = bootSetup.insideSphere;
        this.initCamera();
        this._healpixGrid = new HealpixGrid(this._webgl);
        this._perspectiveMatrixManager = new PerspectiveMatrixManager(canvas, this._camera, bootSetup.camera_fov_deg, bootSetup.camera_near_plane, bootSetup.insideSphere);
        this._perspectiveMatrixManager.computePerspectiveMatrix(canvas, this._camera, bootSetup.camera_fov_deg, bootSetup.camera_near_plane, bootSetup.insideSphere);
        this._equatorialGrid = new EquatorialGrid(this._webgl, this._healpixGrid);
        this._equatorialGrid.init(this._healpixGrid.getMinFoV());
        this.updateCentralPoint();
        this.startup = true;
        this.addEventListeners(canvas);
        this.fov = this._healpixGrid.refreshFoV(this._camera, this._perspectiveMatrixManager.pMatrix);
    }
    initCamera() {
        if (bootSetup.insideSphere) {
            this._camera = new Camera([0.0, 0.0, -0.005], true);
        }
        else {
            this._camera = new Camera([0.0, 0.0, 4.0], false);
        }
    }
    setCamera(camera) {
        this._camera = camera;
    }
    get healpixGrid() {
        return this._healpixGrid;
    }
    get equatorialGrid() {
        return this._equatorialGrid;
    }
    // This is a lickely a duplication of FoVUtils.getCenterJ2000(this.canvas)
    updateCentralPoint() {
        const sphericalCoords = this.getPhiThetaDeg(this.canvas);
        const astroCoords = sphericalToAstroDeg(sphericalCoords.phi, sphericalCoords.theta);
        const raHMS = raDegToHMS(astroCoords.ra);
        const decDMS = decDegToDMS(astroCoords.dec);
        this.centralPoinCoords = {
            astroDeg: astroCoords,
            sphericalDeg: sphericalCoords,
            raHMS: raHMS,
            decDMS: decDMS
        };
        return this.centralPoinCoords;
    }
    updateLastMousePoint() {
        const sphericalCoords = { phi: this.mouseHelper.phi, theta: this.mouseHelper.theta };
        const astroCoords = { ra: this.mouseHelper.ra, dec: this.mouseHelper.dec };
        const raHMS = this.mouseHelper.raHMS;
        const decDMS = this.mouseHelper.decDMS;
        this.mousePointCoords = {
            astroDeg: astroCoords,
            sphericalDeg: sphericalCoords,
            raHMS: raHMS,
            decDMS: decDMS
        };
        return this.mousePointCoords;
    }
    // This should call FoVUtils.getJ200Centre(this.canvas)
    getCentralPointCoordinates() {
        return this.centralPoinCoords;
    }
    getLastMousePointCoordinates() {
        return this.mousePointCoords;
    }
    _rotating = false;
    addEventListeners(canvas) {
        if (global.debug) {
            console.log('[AstroSphere::addEventListeners]');
        }
        const handleMouseDown = (event) => {
            canvas.setPointerCapture(event.pointerId);
            this.mouseDown = true;
            const rect = canvas.getBoundingClientRect();
            this.lastMouseX = event.clientX - rect.left; // locale al canvas
            this.lastMouseY = event.clientY - rect.top; // locale al canvas
            // session.clearHoveredFootprints()
            event.preventDefault();
            return false;
        };
        const handleMouseUp = (event) => {
            canvas.releasePointerCapture(event.pointerId);
            this.mouseDown = false;
            document.body.style.cursor = 'auto';
            const rect = canvas.getBoundingClientRect();
            this.lastMouseX = event.clientX - rect.left;
            this.lastMouseY = event.clientY - rect.top;
        };
        const handleMouseMove = (event) => {
            const rect = canvas.getBoundingClientRect();
            // 🔹 canvas-local coordinates
            const localX = event.clientX - rect.left;
            const localY = event.clientY - rect.top;
            const newX = localX;
            const newY = localY;
            // if (!healpixGridSingleton) return;
            if (!this._healpixGrid)
                return;
            let hit = false;
            if (this.mouseDown) {
                this._rotating = true;
                document.body.style.cursor = 'grab';
                // Rotation deltas – either use client-space or local-space, but be consistent
                const deltaX = ((newX - (this.lastMouseX ?? newX)) * Math.PI) / canvas.width;
                const deltaY = ((newY - (this.lastMouseY ?? newY)) * Math.PI) / canvas.height;
                this.inertiaX += 0.1 * deltaX;
                this.inertiaY += 0.1 * deltaY;
                this.updateCentralPoint();
                hit = true;
            }
            else {
                // Use canvas-local coords for picking
                const mousePoint = RayPickingUtils.getIntersectionPointWithSingleModel(localX, localY, this._healpixGrid, this._webgl, this._camera, this._perspectiveMatrixManager.pMatrix);
                if (mousePoint && mousePoint.length > 0) {
                    this.mouseHelper.update(mousePoint);
                    this.updateLastMousePoint();
                    hit = true;
                    // console.log("hit")
                }
            }
            if (!this.centralPoinCoords) {
                this.updateCentralPoint();
                hit = true;
            }
            const centralradeg = this.centralPoinCoords?.astroDeg.ra;
            const centraldecdeg = this.centralPoinCoords?.astroDeg.dec;
            // if (this._rotating && centraldecdeg && centralradeg) {
            if (centraldecdeg !== undefined && centralradeg !== undefined) {
                const detail = {
                    fovDeg: this.fov.minFoV,
                    position: this._camera.getCameraPosition(),
                    vMatrix: this._camera.getCameraMatrix(),
                    pMatrix: this._perspectiveMatrixManager.pMatrix,
                    mMatrix: this._healpixGrid.getModelMatrix(),
                    camera: this._camera,
                    timestamp: performance.now(),
                    centralPoint: new Point({ raDeg: centralradeg, decDeg: centraldecdeg }, CoordsType.ASTRO),
                    mouseHoverPoint: this.mousePointCoords,
                    colorMap: this._selectedColorMap
                };
                // if (this._rotating) {
                this.canvas.dispatchEvent(new CustomEvent('camera-changed', {
                    detail,
                    // bubbles: false, composed: false
                    bubbles: true, composed: true,
                }));
                // }
            }
            this.lastMouseX = newX;
            this.lastMouseY = newY;
            event.preventDefault();
        };
        const handleMouseWheel = (event) => {
            if (event.deltaY < 0) {
                this.zoomInertia -= 0.001;
            }
            else {
                this.zoomInertia += 0.001;
            }
            event.preventDefault();
        };
        canvas.onpointerdown = handleMouseDown;
        canvas.onpointerup = handleMouseUp;
        canvas.onpointermove = handleMouseMove;
        // canvas.onwheel = handleMouseWheel
        canvas.addEventListener('wheel', handleMouseWheel, { passive: false });
    }
    // REVIEW THIS METHOD AND MOVE IT 
    getPhiThetaDeg(canvas) {
        const maxX = canvas.width;
        const maxY = canvas.height;
        const pickerPoint = RayPickingUtils.getIntersectionPointWithSingleModel(maxX / 2, maxY / 2, this._healpixGrid, this._webgl, this._camera, this._perspectiveMatrixManager.pMatrix);
        return cartesianToSpherical(pickerPoint);
    }
    activateHiPS(hipsDescriptor) {
        this._activeHiPS = new HiPS(1, [0.0, 0.0, 0.0], 0, 0, hipsDescriptor, this._webgl, this._healpixGrid);
    }
    // Catalogue section
    async showCatalogue(cat) {
        console.log(cat);
        if (cat)
            this.activeCatalogues.push(cat);
        return cat;
    }
    deleteCatalogue(catalogue) {
        this.activeCatalogues = this.activeCatalogues.filter(c => c !== catalogue);
    }
    // End Catalogue section
    // Footprint section
    async showFootprintSet(fset) {
        console.log(fset);
        if (fset)
            this.activeFootprintSets.push(fset);
        return fset;
    }
    deleteFootprintSet(footprintSet) {
        this.activeFootprintSets = this.activeFootprintSets.filter(fst => fst !== footprintSet);
    }
    getHoveredFootprints() {
        let footprintsHovered = [];
        this.activeFootprintSets.forEach(fset => {
            footprintsHovered.push(fset.hoveredFootprints);
        });
        return footprintsHovered;
    }
    // End Footprint section
    goTo(raDeg, decDeg) {
        this._camera.goTo(raDeg, decDeg);
    }
    getFoV() {
        return this.fov;
    }
    getFoVPolygon() {
        if (this.healpixGrid == null)
            throw new Error(`healpixGrid is ${this.healpixGrid}`);
        return FoVUtils.getFoVPolygon(this._camera, this.canvas, this._healpixGrid, this._healpixGrid, this._webgl, this._perspectiveMatrixManager.pMatrix);
    }
    changeFoV(deg) {
        const distance = this._healpixGrid.getFoV().computeDistanceFromAngle(deg);
        this._camera.translate(distance);
        this._healpixGrid.refreshFoV(this._camera, this._perspectiveMatrixManager.pMatrix);
    }
    changeFoV2(deg) {
        const newCameraPos = this._healpixGrid.getFoV().computeCameraPositionForFoV(deg);
        this._camera.setCameraPosition(newCameraPos);
    }
    changeFoV3(deg) {
        const newPos = this._healpixGrid.getFoV().computeCameraPositionForAngularDiameter(deg);
        this._camera.setCameraPosition(newPos);
        // Recompute projection after moving the camera
        this._perspectiveMatrixManager.computePerspectiveMatrix(this.canvas, this._camera, bootSetup.camera_fov_deg, bootSetup.camera_near_plane, false);
    }
    getInsideSphere() {
        return global.insideSphere;
    }
    toggleInsideSphere() {
        global.insideSphere = !global.insideSphere;
        console.log(global.insideSphere);
        this._camera.toggleInsideSphere();
    }
    // imposta posizione camera
    setCameraPosition(pos) {
        this._camera.setCameraPosition(pos);
        this._perspectiveMatrixManager.computePerspectiveMatrix(this.canvas, this._camera, bootSetup.camera_fov_deg, bootSetup.camera_near_plane, global.insideSphere);
    }
    // imposta orientamento camera tramite view matrix
    setCameraMatrix(viewMatrix) {
        this._camera.setCameraMatrix(viewMatrix);
        this._perspectiveMatrixManager.computePerspectiveMatrix(this.canvas, this._camera, bootSetup.camera_fov_deg, bootSetup.camera_near_plane, global.insideSphere);
    }
    _refreshingStatus = false;
    // set completo camera (pos + orientamento)
    applyFullCameraState(detail, applyColor) {
        this._refreshingStatus = true;
        this._camera = detail.camera;
        // this.goTo(detail.centralPoint.raDeg, detail.centralPoint.decDeg)
        this._healpixGrid.setModelMatrix(detail.mMatrix);
        this._perspectiveMatrixManager.pMatrix = detail.pMatrix;
        this.setCameraMatrix(detail.vMatrix);
        // this.goTo(detail.centralPoint.raDeg, detail.centralPoint.decDeg)
        if (applyColor) {
            this._activeHiPS?.changeColorMap(detail.colorMap);
        }
        this._refreshingStatus = false;
    }
    getCurrentStatus() {
        const centralradeg = this.centralPoinCoords?.astroDeg.ra;
        const centraldecdeg = this.centralPoinCoords?.astroDeg.dec;
        if (this._rotating && centraldecdeg && centralradeg) {
            const detail = {
                fovDeg: this.fov.minFoV,
                position: this._camera.getCameraPosition(),
                vMatrix: this._camera.getCameraMatrix(),
                pMatrix: this._perspectiveMatrixManager.pMatrix,
                mMatrix: this._healpixGrid.getModelMatrix(),
                camera: this._camera,
                timestamp: performance.now(),
                centralPoint: new Point({ raDeg: centralradeg, decDeg: centraldecdeg }, CoordsType.ASTRO),
                mouseHoverPoint: this.mousePointCoords,
                colorMap: this._selectedColorMap
            };
            return detail;
        }
        return null;
    }
    changeColorMap(cm) {
        if (!this._activeHiPS)
            return;
        this._selectedColorMap = cm;
        this._activeHiPS?.changeColorMap(cm);
    }
    prevFov = 0;
    prevCentralRaDeg = null;
    prevCentralDecDeg = null;
    get activeHiPS() {
        return this._activeHiPS;
    }
    draw(canvas) {
        if (this._refreshingStatus)
            return;
        if (!this._webgl)
            return;
        if (!this._activeHiPS)
            return;
        if (!this._healpixGrid || Object.keys(this._healpixGrid).length === 0)
            return;
        if (this._healpixGrid.fovObj === undefined)
            return;
        // In WebGL2, OES_element_index_uint is core, no need to fetch the extension each frame.
        // global.gl.getExtension('OES_element_index_uint')
        // global.gl.clear(global.gl.COLOR_BUFFER_BIT | global.gl.DEPTH_BUFFER_BIT)
        this._perspectiveMatrixManager.computePerspectiveMatrix(canvas, this._camera, bootSetup.camera_fov_deg, bootSetup.camera_near_plane, global.insideSphere);
        let cameraRotated = false;
        let THETA = 0;
        let PHI = 0;
        this._webgl.viewport(0, 0, this._webgl.drawingBufferWidth, this._webgl.drawingBufferHeight);
        this._webgl.clear(this._webgl.COLOR_BUFFER_BIT | this._webgl.DEPTH_BUFFER_BIT);
        // Zoom inertia
        if (this._healpixGrid.fovObj.minFoV > 0.1 || this.zoomInertia > 0) {
            if (Math.abs(this.zoomInertia) > 0.0001) {
                this._camera.zoom(this.zoomInertia);
                this.zoomInertia *= 0.95;
                this.fov = this._healpixGrid.refreshFoV(this._camera, this._perspectiveMatrixManager.pMatrix);
                if (this.prevFov != this.fov.minFoV) {
                    if (!this.centralPoinCoords) {
                        this.centralPoinCoords = this.updateCentralPoint();
                    }
                    // const detail: CameraChangedDetail = {
                    //   fovDeg: this.fov.minFoV,
                    //   position: this._camera.getCameraPosition(),
                    //   vMatrix: this._camera.getCameraMatrix() as Float32Array,
                    //   pMatrix: this._perspectiveMatrixManager.pMatrix as Float32Array,
                    //   mMatrix: this._healpixGrid.getModelMatrix() as Float32Array,
                    //   camera: this._camera,
                    //   timestamp: performance.now(),
                    //   centralPoint: new Point({ raDeg: this.centralPoinCoords.astroDeg.ra, decDeg: this.centralPoinCoords.astroDeg.dec }, CoordsType.ASTRO),
                    //   mouseHoverPoint: this.mousePointCoords,
                    //   colorMap: this._selectedColorMap
                    // };
                    // this.canvas.dispatchEvent(new CustomEvent<CameraChangedDetail>(
                    //   'camera-changed',
                    //   { detail, bubbles: true, composed: true }
                    // ));
                    this.prevFov = this.fov.minFoV;
                }
            }
        }
        // Rotation inertia
        if (this.mouseDown || Math.abs(this.inertiaX) > 0.02 || Math.abs(this.inertiaY) > 0.02) {
            this._rotating = true;
            cameraRotated = true;
            THETA = this.inertiaY;
            PHI = this.inertiaX;
            this.inertiaX *= 0.95;
            this.inertiaY *= 0.95;
            this._camera.rotate(PHI, THETA);
            this._perspectiveMatrixManager.computePerspectiveMatrix(canvas, this._camera, bootSetup.camera_fov_deg, bootSetup.camera_near_plane, global.insideSphere);
        }
        else {
            this.inertiaY = 0;
            this.inertiaX = 0;
            this._rotating = false;
        }
        // Se la camera è ruotata (anche solo per inerzia), aggiorna punto centrale + emetti cameraChanged
        if (cameraRotated) {
            // Ricalcola il punto centrale
            const center = this.updateCentralPoint();
            const centralRaDeg = center.astroDeg.ra;
            const centralDecDeg = center.astroDeg.dec;
            // Evita spam: emetti solo se è cambiato abbastanza
            const raChanged = this.prevCentralRaDeg === null ||
                Math.abs(centralRaDeg - this.prevCentralRaDeg) > 1e-5;
            const decChanged = this.prevCentralDecDeg === null ||
                Math.abs(centralDecDeg - this.prevCentralDecDeg) > 1e-5;
            if (raChanged || decChanged) {
                // const detail: CameraChangedDetail = {
                //   fovDeg: this.fov.minFoV,
                //   position: this._camera.getCameraPosition(),
                //   vMatrix: this._camera.getCameraMatrix() as Float32Array,
                //   pMatrix: this._perspectiveMatrixManager.pMatrix as Float32Array,
                //   mMatrix: this._healpixGrid.getModelMatrix() as Float32Array,
                //   camera: this._camera,
                //   timestamp: performance.now(),
                //   centralPoint: new Point(
                //     { raDeg: centralRaDeg, decDeg: centralDecDeg },
                //     CoordsType.ASTRO
                //   ),
                //   mouseHoverPoint: this.mousePointCoords,
                //   colorMap: this._selectedColorMap
                // };
                // this.canvas.dispatchEvent(
                //   new CustomEvent<CameraChangedDetail>('camera-changed', {
                //     detail,
                //     bubbles: true, composed: true,
                //   })
                // );
                this.prevCentralRaDeg = centralRaDeg;
                this.prevCentralDecDeg = centralDecDeg;
            }
        }
        // GL state
        this._webgl.disable(this._webgl.DEPTH_TEST);
        this._webgl.enable(this._webgl.BLEND);
        this._webgl.enable(this._webgl.CULL_FACE);
        this._webgl.cullFace(global.insideSphere ? this._webgl.BACK : this._webgl.FRONT);
        this._webgl.blendFunc(this._webgl.SRC_ALPHA, this._webgl.ONE_MINUS_SRC_ALPHA);
        this._healpixGrid.visibleTilesManager.computeVisiblePixels(this._healpixGrid.visibleorder, this._webgl, this._camera, this._perspectiveMatrixManager.pMatrix);
        // DRAW HiPS
        const skyEntityDrawInput = {
            fovDeg: this._healpixGrid.getMinFoV(),
            camera: this._camera,
            pMatrix: this._perspectiveMatrixManager.pMatrix
        };
        this._activeHiPS.draw(skyEntityDrawInput);
        this._healpixGrid.draw(skyEntityDrawInput);
        this._equatorialGrid.draw(skyEntityDrawInput);
        this._webgl.enable(this._webgl.DEPTH_TEST);
        this._webgl.disable(this._webgl.CULL_FACE);
        if (this.startup) {
            this.startup = false;
            const phiTheta = this.getPhiThetaDeg(canvas);
            const raDecDeg = sphericalToAstroDeg(phiTheta.phi, phiTheta.theta);
            const raHMS = raDegToHMS(raDecDeg.ra);
            const decDMS = decDegToDMS(raDecDeg.dec);
            this.prevFov = this._healpixGrid.getMinFoV();
            console.log('(startup coords)', {
                raDeg: raDecDeg.ra,
                decDeg: raDecDeg.dec,
                raHMS,
                decDMS,
            });
        }
        this.activeCatalogues.forEach(cat => {
            if (this._activeHiPS) {
                cat.draw(this._activeHiPS.getModelMatrix(), this.mouseHelper, this._camera.getCameraMatrix(), this._perspectiveMatrixManager.pMatrix);
            }
        });
        this.activeFootprintSets.forEach(fst => {
            if (this._activeHiPS) {
                fst.draw(this._activeHiPS.getModelMatrix(), this.mouseHelper, this._camera.getCameraMatrix(), this._perspectiveMatrixManager.pMatrix);
            }
        });
    }
}
export default AstroSphere;
//# sourceMappingURL=AstroSphere.js.map