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
import { XYZLayer } from './model/earth/XYZLayer.js';
import { xyzTileRequestScheduler } from './model/earth/XYZTileRequestScheduler.js';
import { WMTSAdapter } from './model/earth/wmts/WMTSAdapter.js';
import { XYZMapDescriptor } from './model/earth2/XYZMapDescriptor.js';
import { XYZMap } from './model/earth2/XYZMap.js';
import { mat4, vec3, vec4 } from 'gl-matrix';
/**
 * AstroSphere — main WebGL scene controller (TS port)
 */
class AstroSphere {
    static MIN_WHEEL_SCALE = 0.85;
    static MAX_WHEEL_SCALE = 1.8;
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
    pointerDownX = null;
    pointerDownY = null;
    pointerDownAt = 0;
    _activeHiPS = null;
    _activeXYZ = null;
    _activeXYZ2 = null;
    _activeBaseLayer = null;
    startup = true;
    fov;
    activeCatalogues = [];
    activeFootprintSets = [];
    _webgl;
    _selectedColorMap;
    _cameraStatusChanged = false;
    lastHoveredSource = null;
    lastHoveredCatalogue = null;
    zoomSensitivity = 1.0;
    lockedEastWestRaDeg = null;
    lockedNorthSouthDecDeg = null;
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
        this._camera.refreshFoV(this.fov.minFoV);
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
    setCameraRotationSensitivity(value) {
        this._camera.setRotationSensitivity(value);
    }
    getCameraRotationSensitivity() {
        return this._camera.getRotationSensitivity();
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
    clearLastMousePoint() {
        this.mousePointCoords = undefined;
    }
    // This should call FoVUtils.getJ200Centre(this.canvas)
    getCentralPointCoordinates() {
        return this.centralPoinCoords;
    }
    getLastMousePointCoordinates() {
        return this.mousePointCoords;
    }
    clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }
    computeZoomStep(currentFov, deltaY) {
        const direction = deltaY < 0 ? -1 : 1;
        const wheelScale = this.clamp(Math.abs(deltaY) / 120, AstroSphere.MIN_WHEEL_SCALE, AstroSphere.MAX_WHEEL_SCALE);
        // Continuous wheel response:
        // - broad FoV stays responsive without large jumps
        // - narrow FoV keeps a usable floor to avoid the 0.1 -> 0.02 deg stall
        const baseMagnitude = this.clamp(0.0012 + 0.0025 * Math.sqrt(Math.max(currentFov, 0)), 0.0012, 0.04);
        return direction * baseMagnitude * wheelScale * this.zoomSensitivity;
    }
    setZoomSensitivity(value) {
        this.zoomSensitivity = this.clamp(value, 0.2, 3);
    }
    getZoomSensitivity() {
        return this.zoomSensitivity;
    }
    filterRotationDeltaByAstroLocks(deltaX, deltaY) {
        const lockEastWest = this._camera.isRotationLockedY();
        const lockNorthSouth = this._camera.isRotationLockedX();
        if (!lockEastWest && !lockNorthSouth) {
            return { deltaX, deltaY };
        }
        const center = RayPickingUtils.getIntersectionPointWithSingleModel(this.canvas.clientWidth / 2, this.canvas.clientHeight / 2, this._healpixGrid, this._webgl, this._camera, this._perspectiveMatrixManager.pMatrix);
        if (!center || center.length < 3) {
            return { deltaX, deltaY };
        }
        const centerVec = vec3.normalize(vec3.create(), vec3.fromValues(center[0], center[1], center[2]));
        const northAxis = vec3.fromValues(0, 0, 1);
        const eastVec = vec3.cross(vec3.create(), northAxis, centerVec);
        if (vec3.length(eastVec) < 1e-6) {
            vec3.set(eastVec, 1, 0, 0);
        }
        else {
            vec3.normalize(eastVec, eastVec);
        }
        const northProjection = vec3.scale(vec3.create(), centerVec, vec3.dot(northAxis, centerVec));
        const northVec = vec3.subtract(vec3.create(), northAxis, northProjection);
        if (vec3.length(northVec) < 1e-6) {
            vec3.cross(northVec, centerVec, eastVec);
        }
        vec3.normalize(northVec, northVec);
        const eastScreen = this.projectModelDirectionToScreen(centerVec, eastVec);
        const northScreen = this.projectModelDirectionToScreen(centerVec, northVec);
        if (!eastScreen || !northScreen) {
            return { deltaX, deltaY };
        }
        let nextDeltaX = deltaX;
        let nextDeltaY = deltaY;
        if (lockEastWest) {
            const amount = nextDeltaX * eastScreen.x + nextDeltaY * eastScreen.y;
            nextDeltaX -= amount * eastScreen.x;
            nextDeltaY -= amount * eastScreen.y;
        }
        if (lockNorthSouth) {
            const amount = nextDeltaX * northScreen.x + nextDeltaY * northScreen.y;
            nextDeltaX -= amount * northScreen.x;
            nextDeltaY -= amount * northScreen.y;
        }
        return {
            deltaX: nextDeltaX,
            deltaY: nextDeltaY,
        };
    }
    projectModelDirectionToScreen(centerModel, directionModel) {
        const offsetModel = vec3.scaleAndAdd(vec3.create(), centerModel, directionModel, 0.01);
        const centerScreen = this.projectModelPointToScreen(centerModel);
        const offsetScreen = this.projectModelPointToScreen(offsetModel);
        if (!centerScreen || !offsetScreen) {
            return null;
        }
        const x = offsetScreen.x - centerScreen.x;
        const y = offsetScreen.y - centerScreen.y;
        const len = Math.hypot(x, y);
        if (len < 1e-6) {
            return null;
        }
        return { x: x / len, y: y / len };
    }
    projectModelPointToScreen(pointModel) {
        const vMatrix = this._camera.getCameraMatrix();
        const mMatrix = this._healpixGrid.getModelMatrix();
        const mvMatrix = mat4.create();
        const mvpMatrix = mat4.create();
        mat4.multiply(mvMatrix, vMatrix, mMatrix);
        mat4.multiply(mvpMatrix, this._perspectiveMatrixManager.pMatrix, mvMatrix);
        const clip = vec4.fromValues(pointModel[0], pointModel[1], pointModel[2], 1);
        vec4.transformMat4(clip, clip, mvpMatrix);
        if (Math.abs(clip[3]) < 1e-6) {
            return null;
        }
        return {
            x: clip[0] / clip[3],
            y: -(clip[1] / clip[3]),
        };
    }
    enforceAstronomicalRotationLocks() {
        if (this.lockedEastWestRaDeg == null && this.lockedNorthSouthDecDeg == null) {
            return false;
        }
        const center = this.updateCentralPoint();
        if (!center) {
            return false;
        }
        const nextRa = this.lockedEastWestRaDeg ?? center.astroDeg.ra;
        const nextDec = this.lockedNorthSouthDecDeg ?? center.astroDeg.dec;
        const needsCorrection = Math.abs(nextRa - center.astroDeg.ra) > 1e-6 ||
            Math.abs(nextDec - center.astroDeg.dec) > 1e-6;
        if (!needsCorrection) {
            return false;
        }
        this._camera.goTo(nextRa, nextDec);
        this._perspectiveMatrixManager.computePerspectiveMatrix(this.canvas, this._camera, bootSetup.camera_fov_deg, bootSetup.camera_near_plane, global.insideSphere);
        this.updateCentralPoint();
        return true;
    }
    emitCameraChanged(reason) {
        // avoid dispatch before scene is ready
        if (!this._activeHiPS)
            return;
        if (!this._healpixGrid?.fovObj)
            return;
        const detail = this.getCurrentStatus();
        if (!detail)
            return;
        // optional debug
        // console.log('[AstroSphere] emit camera-changed:', reason);
        this.canvas.dispatchEvent(new CustomEvent('camera-changed', {
            detail,
            bubbles: true,
            composed: true,
        }));
    }
    addEventListeners(canvas) {
        if (global.debug) {
            console.log('[AstroSphere::addEventListeners]');
        }
        const CLICK_MAX_DISTANCE_PX = 4;
        const CLICK_MAX_DURATION_MS = 250;
        const rect = canvas.getBoundingClientRect();
        this.lastMouseX = rect.left; // locale al canvas
        this.lastMouseY = rect.top;
        const handleMouseDown = (event) => {
            canvas.setPointerCapture(event.pointerId);
            this.mouseDown = true;
            const rect = canvas.getBoundingClientRect();
            this.lastMouseX = event.clientX - rect.left; // locale al canvas
            this.lastMouseY = event.clientY - rect.top; // locale al canvas
            this.pointerDownX = this.lastMouseX;
            this.pointerDownY = this.lastMouseY;
            this.pointerDownAt = Date.now();
            const mousePoint = RayPickingUtils.getIntersectionPointWithSingleModel(this.lastMouseX, this.lastMouseY, this._healpixGrid, this._webgl, this._camera, this._perspectiveMatrixManager.pMatrix);
            if (mousePoint && mousePoint.length > 0) {
                this.mouseHelper.update(mousePoint);
                this.updateLastMousePoint();
            }
            else {
                this.clearLastMousePoint();
            }
            event.preventDefault();
            return false;
        };
        const handleMouseUp = (event) => {
            canvas.releasePointerCapture(event.pointerId);
            this.mouseDown = false;
            document.body.style.cursor = 'auto';
            if (event.button !== 0) {
                event.preventDefault();
                return false;
            }
            const rect = canvas.getBoundingClientRect();
            const localX = event.clientX - rect.left;
            const localY = event.clientY - rect.top;
            this.lastMouseX = localX;
            this.lastMouseY = localY;
            const moveDist = Math.hypot(localX - (this.pointerDownX ?? localX), localY - (this.pointerDownY ?? localY));
            const elapsedMs = Date.now() - this.pointerDownAt;
            const isClick = moveDist <= CLICK_MAX_DISTANCE_PX && elapsedMs <= CLICK_MAX_DURATION_MS;
            if (isClick) {
                const mousePoint = RayPickingUtils.getIntersectionPointWithSingleModel(localX, localY, this._healpixGrid, this._webgl, this._camera, this._perspectiveMatrixManager.pMatrix);
                if (mousePoint && mousePoint.length > 0) {
                    this.mouseHelper.update(mousePoint);
                    this.updateLastMousePoint();
                    for (const cat of this.activeCatalogues) {
                        const clickResult = cat.selectPrimarySourceFromClick(this.mouseHelper);
                        if (!clickResult?.sources.length)
                            continue;
                        this._webgl.canvas.dispatchEvent(new CustomEvent('source-clicked', {
                            detail: {
                                source: clickResult.sources,
                                selectionState: clickResult.selectionState,
                                catalogue: cat,
                            },
                            bubbles: true,
                            composed: true,
                        }));
                    }
                    for (const fset of this.activeFootprintSets) {
                        const clickResult = fset.selectPrimaryFootprintFromClick(this.mouseHelper);
                        if (!clickResult?.footprints.length)
                            continue;
                        this._webgl.canvas.dispatchEvent(new CustomEvent('footprint-clicked', {
                            detail: {
                                footprint: clickResult.footprints,
                                selectionState: clickResult.selectionState,
                                footprintSet: fset,
                            },
                            bubbles: true,
                            composed: true,
                        }));
                    }
                }
            }
            else {
                this.clearLastMousePoint();
            }
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
            if (this.mouseDown) {
                document.body.style.cursor = 'grab';
                // Rotation deltas – either use client-space or local-space, but be consistent
                const deltaX = ((newX - (this.lastMouseX ?? newX)) * Math.PI) / canvas.width;
                const deltaY = ((newY - (this.lastMouseY ?? newY)) * Math.PI) / canvas.height;
                const filteredDelta = this.filterRotationDeltaByAstroLocks(deltaX, deltaY);
                this.inertiaX += 0.1 * filteredDelta.deltaX;
                this.inertiaY += 0.1 * filteredDelta.deltaY;
                this.updateCentralPoint();
            }
            else {
                // Use canvas-local coords for picking
                const mousePoint = RayPickingUtils.getIntersectionPointWithSingleModel(localX, localY, this._healpixGrid, this._webgl, this._camera, this._perspectiveMatrixManager.pMatrix);
                if (mousePoint && mousePoint.length > 0) {
                    this.mouseHelper.update(mousePoint);
                    this.updateLastMousePoint();
                }
                else {
                    this.clearLastMousePoint();
                }
            }
            if (!this.centralPoinCoords) {
                this.updateCentralPoint();
            }
            this.lastMouseX = newX;
            this.lastMouseY = newY;
            // During drag, camera rotation is applied in the render loop via inertia.
            // Defer the camera-changed event to that loop so coordinates reflect the
            // actual updated camera state instead of the pre-rotation state.
            this._cameraStatusChanged = true;
            event.preventDefault();
        };
        const handleMouseWheel = (event) => {
            const currentFov = this._healpixGrid.getMinFoV();
            const zoomStep = this.computeZoomStep(currentFov, event.deltaY);
            // Apply wheel zoom immediately and discard any queued inertia so reversing
            // direction feels responsive instead of "buffered".
            this.zoomInertia = 0;
            this._camera.zoom(zoomStep);
            this.fov = this._healpixGrid.refreshFoV(this._camera, this._perspectiveMatrixManager.pMatrix);
            this._camera.refreshFoV(this.fov.minFoV);
            this._cameraStatusChanged = true;
            this.emitCameraChanged('wheel');
            event.preventDefault();
        };
        const handleContextMenu = (event) => {
            event.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const localX = event.clientX - rect.left;
            const localY = event.clientY - rect.top;
            const mousePoint = RayPickingUtils.getIntersectionPointWithSingleModel(localX, localY, this._healpixGrid, this._webgl, this._camera, this._perspectiveMatrixManager.pMatrix);
            if (!mousePoint || mousePoint.length === 0) {
                return false;
            }
            this.mouseHelper.update(mousePoint);
            this.updateLastMousePoint();
            for (const cat of this.activeCatalogues) {
                const pickResult = cat.getSourcesFromPointer(this.mouseHelper);
                if (!pickResult?.sources.length)
                    continue;
                this._webgl.canvas.dispatchEvent(new CustomEvent('source-contextmenu', {
                    detail: {
                        source: pickResult.sources,
                        catalogue: cat,
                        clientX: event.clientX,
                        clientY: event.clientY,
                    },
                    bubbles: true,
                    composed: true,
                }));
                break;
            }
            for (const fset of this.activeFootprintSets) {
                const pickResult = fset.getFootprintsFromPointer(this.mouseHelper);
                if (!pickResult?.footprints.length)
                    continue;
                this._webgl.canvas.dispatchEvent(new CustomEvent('footprint-contextmenu', {
                    detail: {
                        footprint: pickResult.footprints,
                        footprintSet: fset,
                        clientX: event.clientX,
                        clientY: event.clientY,
                    },
                    bubbles: true,
                    composed: true,
                }));
                break;
            }
            return false;
        };
        const onKeyDown = (evt) => {
            if (!evt.ctrlKey) {
                return;
            }
            // console.log('[AstroSphere::onKeyDown] key=', evt.key)
            switch (evt.key) {
                case '1':
                    // Free camera
                    this._camera.clearRotationLock();
                    break;
                case '2':
                    // Lock X axis rotation
                    this._camera.setRotationLock({ x: true, y: false, z: false });
                    break;
                case '3':
                    // Lock Y axis rotation
                    this._camera.setRotationLock({ x: false, y: true, z: false });
                    break;
                case '4':
                    // Lock Z axis rotation
                    this._camera.setRotationLock({ x: false, y: false, z: true });
                    break;
            }
        };
        console.log('[AstroSphere] registering pointer and wheel listeners on canvas');
        canvas.onpointerdown = handleMouseDown;
        canvas.onpointerup = handleMouseUp;
        canvas.onpointermove = handleMouseMove;
        canvas.onpointerleave = () => {
            this.clearLastMousePoint();
            this._cameraStatusChanged = true;
            this.emitCameraChanged('pointerleave');
        };
        console.log('[AstroSphere] adding wheel event listener with passive: false');
        canvas.addEventListener('wheel', handleMouseWheel, { passive: false });
        canvas.addEventListener('contextmenu', handleContextMenu);
        console.log('[AstroSphere] registering global keydown listener on document');
        document.addEventListener('keydown', onKeyDown, { capture: true });
    }
    // REVIEW THIS METHOD AND MOVE IT 
    getPhiThetaDeg(canvas) {
        const rect = canvas.getBoundingClientRect();
        const maxX = rect.width;
        const maxY = rect.height;
        const pickerPoint = RayPickingUtils.getIntersectionPointWithSingleModel(maxX / 2, maxY / 2, this._healpixGrid, this._webgl, this._camera, this._perspectiveMatrixManager.pMatrix);
        return cartesianToSpherical(pickerPoint);
    }
    collectViewportSphericalSamples(sampleCount = 5) {
        const rect = this.canvas.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const samples = [];
        for (let ix = 0; ix < sampleCount; ix++) {
            const x = sampleCount === 1 ? width / 2 : (ix / (sampleCount - 1)) * width;
            for (let iy = 0; iy < sampleCount; iy++) {
                const y = sampleCount === 1 ? height / 2 : (iy / (sampleCount - 1)) * height;
                const hit = RayPickingUtils.getIntersectionPointWithSingleModel(x, y, this._healpixGrid, this._webgl, this._camera, this._perspectiveMatrixManager.pMatrix);
                if (hit && hit.length > 0) {
                    samples.push(cartesianToSpherical(hit));
                }
            }
        }
        return samples;
    }
    activateHiPS(hipsDescriptor) {
        this._activeHiPS = new HiPS(1, [0.0, 0.0, 0.0], 0, 0, hipsDescriptor, this._webgl, this._healpixGrid);
        this._activeBaseLayer = 'hips';
    }
    activateXYZ(config) {
        this._activeXYZ = new XYZLayer(config, this._webgl);
        this._activeXYZ2 = null;
        this._activeBaseLayer = 'xyz';
    }
    activateXYZ2(config) {
        this._activeXYZ2 = new XYZMap(1, [0.0, 0.0, 0.0], 0, 0, config, this._webgl);
        this._activeXYZ = null;
        this._activeBaseLayer = 'xyz';
    }
    activateWMTS(config) {
        const adapter = new WMTSAdapter(config);
        const xyzConfig = adapter.toXYZLayerConfig();
        this._activeXYZ2 = new XYZMap(1, [0.0, 0.0, 0.0], 0, 0, new XYZMapDescriptor(config.layer ? `WMTS ${config.layer}` : 'WMTS Earth2 Layer', xyzConfig.urlTemplate, xyzConfig.minZoom ?? 0, xyzConfig.maxZoom ?? 8, xyzConfig.segmentsPerSide ?? 48, xyzConfig.maxCachedTiles ?? 384, 8, xyzConfig.urlResolver), this._webgl);
        this._activeXYZ = null;
        this._activeBaseLayer = 'xyz';
    }
    // Catalogue section
    async showCatalogue(cat) {
        // console.log(cat)
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
        // console.log(fset)
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
    resetAxesOrientation() {
        const center = this.updateCentralPoint();
        if (!center)
            return;
        this.inertiaX = 0;
        this.inertiaY = 0;
        this._camera.goTo(center.astroDeg.ra, center.astroDeg.dec);
        this._perspectiveMatrixManager.computePerspectiveMatrix(this.canvas, this._camera, bootSetup.camera_fov_deg, bootSetup.camera_near_plane, global.insideSphere);
        this.updateCentralPoint();
        this._cameraStatusChanged = true;
    }
    getFoV() {
        if (this._activeBaseLayer === 'xyz' && this._activeXYZ2) {
            return this._activeXYZ2.getFoV();
        }
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
        this.fov = this._healpixGrid.refreshFoV(this._camera, this._perspectiveMatrixManager.pMatrix);
        this._camera.refreshFoV(this.fov.minFoV);
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
        // console.log(global.insideSphere)
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
        this.updateCentralPoint();
        const centralradeg = this.centralPoinCoords?.astroDeg.ra;
        const centraldecdeg = this.centralPoinCoords?.astroDeg.dec;
        // if (!centraldecdeg || !centralradeg) {
        if (centralradeg == null || centraldecdeg == null) {
            return null;
        }
        // if (this._rotating && centraldecdeg && centralradeg) {
        const detail = {
            fovDeg: this.fov.minFoV,
            fovXDeg: this.fov.xFoV,
            fovYDeg: this.fov.yFoV,
            position: this._camera.getCameraPosition(),
            vMatrix: this._camera.getCameraMatrix(),
            pMatrix: this._perspectiveMatrixManager.pMatrix,
            mMatrix: this._healpixGrid.getModelMatrix(),
            camera: this._camera,
            timestamp: performance.now(),
            centralPoint: new Point({ raDeg: centralradeg, decDeg: centraldecdeg }, CoordsType.ASTRO),
            mouseHoverPoint: this.mousePointCoords,
            colorMap: this._selectedColorMap,
            getFoVPolygon: this.getFoVPolygon(),
        };
        return detail;
        // }
        // return null
    }
    changeColorMap(cm) {
        if (!this._activeHiPS && !this._activeXYZ2)
            return;
        this._selectedColorMap = cm;
        this._activeHiPS?.changeColorMap(cm);
        this._activeXYZ2?.changeColorMap(cm);
    }
    prevFov = 0;
    prevCentralRaDeg = null;
    prevCentralDecDeg = null;
    get activeHiPS() {
        return this._activeHiPS;
    }
    get activeXYZ() {
        return this._activeXYZ;
    }
    isLonLatGridVisible() {
        return this._activeXYZ2?.isLonLatGridVisible() ?? false;
    }
    toggleLonLatGrid() {
        return this._activeXYZ2?.toggleLonLatGrid() ?? false;
    }
    setEastWestRotationLocked(locked) {
        this._camera.setRotationLock({ y: locked });
        if (locked)
            this.inertiaX = 0;
        this.lockedEastWestRaDeg = locked ? this.updateCentralPoint()?.astroDeg.ra ?? null : null;
    }
    isEastWestRotationLocked() {
        return this._camera.isRotationLockedY();
    }
    setNorthSouthRotationLocked(locked) {
        this._camera.setRotationLock({ x: locked });
        if (locked)
            this.inertiaY = 0;
        this.lockedNorthSouthDecDeg = locked ? this.updateCentralPoint()?.astroDeg.dec ?? null : null;
    }
    isNorthSouthRotationLocked() {
        return this._camera.isRotationLockedX();
    }
    getXYZDebugStats() {
        return {
            activeBaseLayer: this._activeBaseLayer,
            layer: this._activeXYZ2?.getDebugStats() ?? this._activeXYZ?.getDebugStats() ?? null,
            requests: xyzTileRequestScheduler.getDebugStats(),
        };
    }
    draw(canvas) {
        if (this._refreshingStatus)
            return;
        if (!this._webgl)
            return;
        if (!this._activeHiPS && !this._activeXYZ && !this._activeXYZ2)
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
        if (this.zoomInertia !== 0) {
            if (Math.abs(this.zoomInertia) > 0.0001) {
                this._camera.zoom(this.zoomInertia);
                this.zoomInertia *= 0.95;
                this.fov = this._healpixGrid.refreshFoV(this._camera, this._perspectiveMatrixManager.pMatrix);
                this._camera.refreshFoV(this.fov.minFoV);
                if (this.prevFov !== this.fov.minFoV) {
                    if (!this.centralPoinCoords) {
                        this.centralPoinCoords = this.updateCentralPoint();
                    }
                    this.prevFov = this.fov.minFoV;
                }
            }
            else {
                this.zoomInertia = 0;
            }
            this._cameraStatusChanged = true;
        }
        // Rotation inertia
        if (this.mouseDown || Math.abs(this.inertiaX) > 0.02 || Math.abs(this.inertiaY) > 0.02) {
            cameraRotated = true;
            const filteredInertia = this.filterRotationDeltaByAstroLocks(this.inertiaX, this.inertiaY);
            PHI = filteredInertia.deltaX;
            THETA = filteredInertia.deltaY;
            this.inertiaX = filteredInertia.deltaX * 0.95;
            this.inertiaY = filteredInertia.deltaY * 0.95;
            this._camera.rotate(PHI, THETA);
            this._perspectiveMatrixManager.computePerspectiveMatrix(canvas, this._camera, bootSetup.camera_fov_deg, bootSetup.camera_near_plane, global.insideSphere);
            this.enforceAstronomicalRotationLocks();
        }
        else {
            this.inertiaY = 0;
            this.inertiaX = 0;
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
                this.prevCentralRaDeg = centralRaDeg;
                this.prevCentralDecDeg = centralDecDeg;
            }
        }
        if (this._cameraStatusChanged) {
            const detail = this.getCurrentStatus();
            if (detail) {
                // console.log('[AstroSphere::draw] emitting camera-changed event due to camera status change', detail)
                // console.log('[AstroSphere::draw] inertia', this.zoomInertia, this.inertiaX, this.inertiaY)
                this.canvas.dispatchEvent(new CustomEvent('camera-changed', {
                    detail,
                    bubbles: true, composed: true,
                }));
            }
            if (!this.startup) {
                this._cameraStatusChanged = false;
            }
        }
        // GL state
        this._webgl.disable(this._webgl.DEPTH_TEST);
        this._webgl.enable(this._webgl.BLEND);
        this._webgl.enable(this._webgl.CULL_FACE);
        this._webgl.cullFace(global.insideSphere ? this._webgl.FRONT : this._webgl.BACK);
        this._webgl.blendFunc(this._webgl.SRC_ALPHA, this._webgl.ONE_MINUS_SRC_ALPHA);
        if (this._activeBaseLayer === 'hips' && this._activeHiPS) {
            const visibleOrder = Math.min(this._healpixGrid.visibleorder, this._activeHiPS.maxOrder);
            this._healpixGrid.visibleTilesManager.computeVisiblePixels(visibleOrder, this._webgl, this._camera, this._perspectiveMatrixManager.pMatrix);
        }
        // DRAW HiPS
        const skyEntityDrawInput = {
            fovDeg: this._healpixGrid.getMinFoV(),
            camera: this._camera,
            pMatrix: this._perspectiveMatrixManager.pMatrix,
            centerSphericalDeg: this.updateCentralPoint().sphericalDeg,
            fovPolygon: this._activeBaseLayer === 'xyz' ? this.getFoVPolygon() : undefined,
            viewportSphericalSamples: this._activeBaseLayer === 'xyz' ? this.collectViewportSphericalSamples(7) : undefined,
        };
        if (this._activeBaseLayer === 'hips') {
            this._activeHiPS?.draw(skyEntityDrawInput);
        }
        if (this._activeBaseLayer === 'xyz') {
            this._activeXYZ?.draw(skyEntityDrawInput);
            this._activeXYZ2?.draw(skyEntityDrawInput);
        }
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
            this._cameraStatusChanged = true;
            console.log('(startup coords)', {
                raDeg: raDecDeg.ra,
                decDeg: raDecDeg.dec,
                raHMS,
                decDMS,
            });
        }
        this.activeCatalogues.forEach(cat => {
            const activeModelMatrix = this._activeHiPS?.getModelMatrix() ?? this._activeXYZ?.getModelMatrix() ?? this._activeXYZ2?.getModelMatrix();
            if (activeModelMatrix) {
                cat.draw(activeModelMatrix, this.mouseHelper, this._camera.getCameraMatrix(), this._perspectiveMatrixManager.pMatrix);
            }
        });
        this.emitHoveredSourceIfChanged();
        this.activeFootprintSets.forEach(fst => {
            const activeModelMatrix = this._activeHiPS?.getModelMatrix() ?? this._activeXYZ?.getModelMatrix() ?? this._activeXYZ2?.getModelMatrix();
            if (activeModelMatrix) {
                fst.draw(activeModelMatrix, this.mouseHelper, this._camera.getCameraMatrix(), this._perspectiveMatrixManager.pMatrix);
            }
        });
    }
    emitHoveredSourceIfChanged() {
        let nextHoveredSource = null;
        let nextHoveredCatalogue = null;
        for (const cat of this.activeCatalogues) {
            const hovered = cat.getPrimaryHoveredSource();
            if (!hovered)
                continue;
            nextHoveredSource = hovered;
            nextHoveredCatalogue = cat;
            break;
        }
        const unchanged = nextHoveredSource === this.lastHoveredSource
            && nextHoveredCatalogue === this.lastHoveredCatalogue;
        if (unchanged)
            return;
        this.lastHoveredSource = nextHoveredSource;
        this.lastHoveredCatalogue = nextHoveredCatalogue;
        this._webgl.canvas.dispatchEvent(new CustomEvent('source-hovered', {
            detail: { source: nextHoveredSource, catalogue: nextHoveredCatalogue },
            bubbles: true,
            composed: true,
        }));
    }
}
export default AstroSphere;
