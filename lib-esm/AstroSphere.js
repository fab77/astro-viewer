// AstroSphere.ts
import { bootSetup } from './Config.js';
import Camera from './Camera.js';
import RayPickingUtils from './utils/RayPickingUtils.js';
import global from './Global.js';
import { visibleTilesManager } from './model/hips/VisibleTilesManager.js';
import MouseHelper from './utils/MouseHelper.js';
import { cartesianToSpherical, sphericalToAstroDeg, raDegToHMS, decDegToDMS, } from './utils/Utils.js';
import healpixGridSingleton from './model/grid/HealpixGridSingleton.js';
import HiPS from './model/hips/HiPS.js';
import computePerspectiveMatrixSingleton from './utils/ComputePerspectiveMatrix.js';
import FoVUtils from './utils/FoVUtils.js';
import queryCatalogueByFoV from './services/queryCatalogueByFoV.js';
/**
 * AstroSphere — main WebGL scene controller (TS port)
 */
class AstroSphere {
    camera;
    centralPoinCoords;
    mousePointCoords;
    canvas;
    showHPXGrid = false;
    mouseHelper;
    mouseDown = false;
    lastMouseX = null;
    lastMouseY = null;
    inertiaX = 0.0;
    inertiaY = 0.0;
    zoomInertia = 0.0;
    activeHiPS = null;
    startup = true;
    insideSphere;
    fov;
    activeCatalogues = [];
    constructor(canvas, webgl) {
        // Keep global GL context (as in original JS)
        global.gl = webgl;
        this.mouseHelper = new MouseHelper();
        this.canvas = canvas;
        this.init(canvas);
        this.insideSphere = bootSetup.insideSphere;
        this.fov = healpixGridSingleton.refreshFoV(this.insideSphere);
    }
    updateCentralPoint() {
        // const sphericalCoords = cartesianToSpherical(this.camera.getCameraPosition())
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
    getCentralPointCoordinates() {
        return this.centralPoinCoords;
    }
    getLastMousePointCoordinates() {
        return this.mousePointCoords;
    }
    init(canvas) {
        this.initCamera();
        healpixGridSingleton.init();
        visibleTilesManager.init(bootSetup.insideSphere);
        computePerspectiveMatrixSingleton.computePerspectiveMatrix(canvas, this.camera, bootSetup.camera_fov_deg, bootSetup.camera_near_plane, bootSetup.insideSphere);
        this.updateCentralPoint();
        this.startup = true;
        this.addEventListeners(canvas);
    }
    initCamera() {
        if (bootSetup.insideSphere) {
            this.camera = new Camera([0.0, 0.0, -0.005], true);
        }
        else {
            this.camera = new Camera([0.0, 0.0, 4.0], false);
        }
        global.camera = this.camera;
    }
    addEventListeners(canvas) {
        if (global.debug) {
            console.log('[AstroSphere::addEventListeners]');
        }
        const handleMouseDown = (event) => {
            canvas.setPointerCapture(event.pointerId);
            this.mouseDown = true;
            // this.lastMouseX = event.pageX
            // this.lastMouseY = event.pageY
            this.lastMouseX = event.clientX;
            this.lastMouseY = event.clientY;
            // session.clearHoveredFootprints()
            event.preventDefault();
            return false;
        };
        const handleMouseUp = (event) => {
            canvas.releasePointerCapture(event.pointerId);
            this.mouseDown = false;
            document.body.style.cursor = 'auto';
            this.lastMouseX = event.clientX;
            this.lastMouseY = event.clientY;
        };
        const handleMouseMove = (event) => {
            const newX = event.clientX;
            const newY = event.clientY;
            if (!healpixGridSingleton)
                return;
            if (this.mouseDown) {
                document.body.style.cursor = 'grab';
                const deltaX = ((newX - (this.lastMouseX ?? newX)) * Math.PI) / canvas.width;
                const deltaY = ((newY - (this.lastMouseY ?? newY)) * Math.PI) / canvas.height;
                this.inertiaX += 0.1 * deltaX;
                this.inertiaY += 0.1 * deltaY;
            }
            else {
                const mousePoint = RayPickingUtils.getIntersectionPointWithSingleModel(newX, newY);
                if (mousePoint && mousePoint.length > 0) {
                    this.mouseHelper.update(mousePoint);
                    console.log('EMIT HERE');
                    // this.emit('coordsUpdate', {
                    //   raDeg: this.mouseHelper.raDecDeg.ra,
                    //   decDeg: this.mouseHelper.raDecDeg.dec,
                    //   raHMS: this.mouseHelper.raHMS,
                    //   decDMS: this.mouseHelper.decDMS,
                    // })
                    this.updateLastMousePoint();
                }
            }
            this.updateCentralPoint();
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
        const pickerPoint = RayPickingUtils.getIntersectionPointWithSingleModel(maxX / 2, maxY / 2);
        return cartesianToSpherical(pickerPoint);
    }
    activateHiPS(hipsDescriptor, insideSphere) {
        this.activeHiPS = new HiPS(1, [0.0, 0.0, 0.0], 0, 0, hipsDescriptor, insideSphere);
    }
    async showCatalogue(catalogue) {
        const fovPolyAstro = FoVUtils.getFoVPolygon(this.camera, this.canvas, healpixGridSingleton);
        const polygonAdql = FoVUtils.getAstroFoVPolygon(fovPolyAstro); // -> "POLYGON('ICRS', ra1, dec1, ...)"
        const cat = await queryCatalogueByFoV(catalogue, polygonAdql);
        console.log(cat);
        if (cat)
            this.activeCatalogues.push(cat);
        return cat;
    }
    hideCatalogue(catalogue, isVisible) {
        catalogue.setIsVisible(isVisible);
    }
    deleteCatalogue(catalogue) {
        this.activeCatalogues = this.activeCatalogues.filter(c => c !== catalogue);
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
    goTo(raDeg, decDeg) {
        this.camera.goTo(raDeg, decDeg);
    }
    getFoV() {
        // console.log(healpixGridSingleton.refreshFoV(this.insideSphere))
        return this.fov;
    }
    getFoVPolygon() {
        return FoVUtils.getFoVPolygon(this.camera, this.canvas, healpixGridSingleton);
    }
    changeFoV(deg) {
        // throw new Error("not Implemented")
        const distance = healpixGridSingleton.getFoV().computeDistanceFromAngle(deg);
        // this.camera.moveAlongView(distance)
        this.camera.translate(distance);
        healpixGridSingleton.refreshFoV(this.insideSphere);
    }
    changeFoV2(deg) {
        // throw new Error("not Implemented")
        const newCameraPos = healpixGridSingleton.getFoV().computeCameraPositionForFoV(deg);
        this.camera.setCameraPosition(newCameraPos);
        // this.camera.moveAlongView(distance)
        // this.camera.translate(distance)
    }
    changeFoV3(deg) {
        const newPos = healpixGridSingleton.getFoV().computeCameraPositionForAngularDiameter(deg);
        this.camera.setCameraPosition(newPos);
        // Recompute projection after moving the camera
        computePerspectiveMatrixSingleton.computePerspectiveMatrix(this.canvas, this.camera, bootSetup.camera_fov_deg, bootSetup.camera_near_plane, false);
    }
    getInsideSphere() {
        return this.insideSphere;
    }
    toggleInsideSphere() {
        this.insideSphere = !this.insideSphere;
        visibleTilesManager.toggleInsideSphere();
    }
    draw(canvas) {
        if (!global.gl)
            return;
        if (!this.activeHiPS)
            return;
        if (!healpixGridSingleton || Object.keys(healpixGridSingleton).length === 0)
            return;
        if (healpixGridSingleton.fovObj === undefined)
            return;
        // In WebGL2, OES_element_index_uint is core, no need to fetch the extension each frame.
        // global.gl.getExtension('OES_element_index_uint')
        // global.gl.clear(global.gl.COLOR_BUFFER_BIT | global.gl.DEPTH_BUFFER_BIT)
        computePerspectiveMatrixSingleton.computePerspectiveMatrix(canvas, this.camera, bootSetup.camera_fov_deg, bootSetup.camera_near_plane, this.insideSphere);
        let cameraRotated = false;
        let THETA = 0;
        let PHI = 0;
        global.gl.viewport(0, 0, global.gl.drawingBufferWidth, global.gl.drawingBufferHeight);
        global.gl.clear(global.gl.COLOR_BUFFER_BIT | global.gl.DEPTH_BUFFER_BIT);
        // Zoom inertia
        if (healpixGridSingleton.fovObj.minFoV > 0.1 || this.zoomInertia > 0) {
            if (Math.abs(this.zoomInertia) > 0.0001) {
                this.camera.zoom(this.zoomInertia);
                this.zoomInertia *= 0.95;
                // console.log('EMIT HERE (fovUpdate)')
                this.fov = healpixGridSingleton.refreshFoV(this.insideSphere);
                // this.getFoV()
            }
        }
        // Rotation inertia
        if (this.mouseDown || Math.abs(this.inertiaX) > 0.02 || Math.abs(this.inertiaY) > 0.02) {
            cameraRotated = true;
            THETA = this.inertiaY;
            PHI = this.inertiaX;
            this.inertiaX *= 0.95;
            this.inertiaY *= 0.95;
            this.camera.rotate(PHI, THETA);
            computePerspectiveMatrixSingleton.computePerspectiveMatrix(canvas, this.camera, bootSetup.camera_fov_deg, bootSetup.camera_near_plane, this.insideSphere);
        }
        else {
            this.inertiaY = 0;
            this.inertiaX = 0;
        }
        // GL state
        global.gl.disable(global.gl.DEPTH_TEST);
        global.gl.enable(global.gl.BLEND);
        global.gl.enable(global.gl.CULL_FACE);
        global.gl.cullFace(this.insideSphere ? global.gl.BACK : global.gl.FRONT);
        global.gl.blendFunc(global.gl.SRC_ALPHA, global.gl.ONE_MINUS_SRC_ALPHA);
        // DRAW HiPS
        this.activeHiPS.draw(this.insideSphere);
        healpixGridSingleton.draw(this.insideSphere);
        global.gl.enable(global.gl.DEPTH_TEST);
        global.gl.disable(global.gl.CULL_FACE);
        if (this.startup) {
            this.startup = false;
            const phiTheta = this.getPhiThetaDeg(canvas);
            const raDecDeg = sphericalToAstroDeg(phiTheta.phi, phiTheta.theta);
            const raHMS = raDegToHMS(raDecDeg.ra);
            const decDMS = decDegToDMS(raDecDeg.dec);
            console.log('EMIT HERE (startup coords)', {
                raDeg: raDecDeg.ra,
                decDeg: raDecDeg.dec,
                raHMS,
                decDMS,
            });
        }
        this.activeCatalogues.forEach(cat => {
            if (this.activeHiPS) {
                // TODO test it using the healpixSingleton
                cat.draw(this.activeHiPS.getModelMatrix(), this.mouseHelper);
                // cat.draw(this.mouseHelper, this.activeHiPS.getModelMatrix() as Float32Array)
            }
        });
        // this.updateLastMousePoint()
        // this.updateCentralPoint()
    }
}
export default AstroSphere;
//# sourceMappingURL=AstroSphere.js.map