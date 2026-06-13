/*
 * AstroViewer
 * Copyright (C) Fabrizio Giordano
 * SPDX-License-Identifier: LicenseRef-AstroViewer-Dual-License
 *
 * This file is part of AstroViewer.
 * AstroViewer is distributed under a dual-license model.
 * Commercial use requires a separate commercial license.
 * Non-commercial use is governed by LICENSE-NONCOMMERCIAL.md.
 *
 * See LICENSE.md, LICENSE-COMMERCIAL.md, and LICENSE-NONCOMMERCIAL.md for details.
 */
// import global from './Global.js'
import AstroSphere from './AstroSphere.js';
import { HiPSDescriptor } from './model/hips/HiPSDescriptor.js';
import { CatalogueGL } from './model/catalogues/CatalogueGL.js';
import { FootprintSetGL } from './model/footprints/FootprintSetGL.js';
import { bootSetup } from './Config.js';
import ColorMaps from './model/ColorMaps.js';
import { xyzTileRequestScheduler } from './model/earth/XYZTileRequestScheduler.js';
import { XYZMapDescriptor } from './model/earth/XYZMapDescriptor.js';
import { TerraPointSetGL } from './model/terra/TerraPointSetGL.js';
import { TerraFootprintSetGL } from './model/terra/TerraFootprintSetGL.js';
import { TerraPolylineSetGL } from './model/terra/TerraPolylineSetGL.js';
import { SatelliteObjectGL } from './model/terra/SatelliteObjectGL.js';
import { MeshHiPSDescriptor } from './model/meships/MeshHiPSDescriptor.js';
// & {
//   viewportWidth: number
//   viewportHeight: number
// }
export class AstroViewer {
    astroSphere;
    canvas;
    webgl;
    rafId = null;
    webglContextList = new Map();
    viewfinderEl = null;
    viewfinderVisible = bootSetup.showViewfinder;
    viewfinderColor = 'rgba(75,148,226,0.68)';
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
    createFootprintSet(footprintSetName, footprintSetDescription, providerUrl, metadataManager) {
        return new FootprintSetGL(footprintSetName, footprintSetDescription, providerUrl, metadataManager, this.webgl, this.astroSphere.healpixGrid.visibleTilesManager);
    }
    showFootprintSet(footprintSet) {
        this.astroSphere.showFootprintSet(footprintSet);
    }
    hideFootprintSet(footprintSet, isVisible) {
        footprintSet.setIsVisible(isVisible);
    }
    deleteFootprintSet(footprintSet) {
        this.astroSphere.deleteFootprintSet(footprintSet);
    }
    // TERRA OVERLAYS
    createTerraPointSet(pointSetName, pointSetDescription, providerUrl, metadataManager) {
        return new TerraPointSetGL(pointSetName, pointSetDescription, providerUrl, metadataManager, this.webgl, this.astroSphere.healpixGrid.visibleTilesManager);
    }
    showTerraPointSet(pointSet) {
        this.astroSphere.showCatalogue(pointSet);
    }
    hideTerraPointSet(pointSet, isVisible) {
        pointSet.setIsVisible(isVisible);
    }
    deleteTerraPointSet(pointSet) {
        this.astroSphere.deleteCatalogue(pointSet);
    }
    createTerraFootprintSet(footprintSetName, footprintSetDescription, providerUrl, metadataManager) {
        return new TerraFootprintSetGL(footprintSetName, footprintSetDescription, providerUrl, metadataManager, this.webgl, this.astroSphere.healpixGrid.visibleTilesManager);
    }
    showTerraFootprintSet(footprintSet) {
        this.astroSphere.showFootprintSet(footprintSet);
    }
    hideTerraFootprintSet(footprintSet, isVisible) {
        footprintSet.setIsVisible(isVisible);
    }
    deleteTerraFootprintSet(footprintSet) {
        this.astroSphere.deleteFootprintSet(footprintSet);
    }
    createTerraPolylineSet(polylineSetName, polylineSetDescription, providerUrl, metadataManager) {
        return new TerraPolylineSetGL(polylineSetName, polylineSetDescription, providerUrl, metadataManager, this.webgl, this.astroSphere.healpixGrid.visibleTilesManager);
    }
    showTerraPolylineSet(polylineSet) {
        this.astroSphere.showPolylineSet(polylineSet);
    }
    hideTerraPolylineSet(polylineSet, isVisible) {
        polylineSet.setIsVisible(isVisible);
    }
    deleteTerraPolylineSet(polylineSet) {
        this.astroSphere.deletePolylineSet(polylineSet);
    }
    changeTerraPolylineSetColor(polylineSet, hexColor) {
        polylineSet.changeColor(hexColor);
        return polylineSet;
    }
    createSatelliteObject(options) {
        return new SatelliteObjectGL(options, this.webgl);
    }
    showSatelliteObject(satelliteObject) {
        this.astroSphere.showSatelliteObject(satelliteObject);
    }
    hideSatelliteObject(satelliteObject, isVisible) {
        satelliteObject.setIsVisible(isVisible);
    }
    deleteSatelliteObject(satelliteObject) {
        this.astroSphere.deleteSatelliteObject(satelliteObject);
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
    activateXYZ(config) {
        this.astroSphere.activateXYZ(config);
    }
    activateXYZ2(config) {
        const descriptor = new XYZMapDescriptor(config.name ?? 'XYZ Earth2 Layer', config.urlTemplate, config.minZoom ?? 0, config.maxZoom ?? 8, config.segmentsPerSide ?? 48, config.maxCachedTiles ?? 384, 8, config.urlResolver);
        this.astroSphere.activateXYZ2(descriptor);
    }
    activateWMTS(config) {
        this.astroSphere.activateWMTS(config);
    }
    activateMeshHiPS(config) {
        this.astroSphere.activateMeshHiPS(new MeshHiPSDescriptor(config));
    }
    setXYZMaxConcurrentRequests(value) {
        xyzTileRequestScheduler.setMaxConcurrent(value);
    }
    getXYZMaxConcurrentRequests() {
        return xyzTileRequestScheduler.getMaxConcurrent();
    }
    getXYZDebugStats() {
        return this.astroSphere.getXYZDebugStats();
    }
    getHiPSDebugStats() {
        return this.astroSphere.getHiPSDebugStats();
    }
    getMeshHiPSDebugStats() {
        return this.astroSphere.getMeshHiPSDebugStats();
    }
    async loadHiPS(baseUrl) {
        const hipsUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
        const resp = await fetch(hipsUrl + 'properties');
        if (!resp.ok)
            throw new Error(`HTTP ${resp.status} fetching properties`);
        const propsText = await resp.text();
        const desc = new HiPSDescriptor(propsText, hipsUrl);
        this.astroSphere.activateHiPS(desc);
        return desc.surveyName;
        // this.activateHiPS(desc);
    }
    async loadMeshHiPS(baseUrl, config = {}) {
        const meshHiPSUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
        let propsText = '';
        const resp = await fetch(meshHiPSUrl + 'properties');
        if (resp.ok) {
            propsText = await resp.text();
        }
        else {
            const jsonResp = await fetch(meshHiPSUrl + 'properties.json');
            if (!jsonResp.ok)
                throw new Error(`HTTP ${jsonResp.status} fetching MeshHiPS properties`);
            const json = await jsonResp.json();
            propsText = Object.entries(json)
                .map(([key, value]) => `${key}=${String(value)}`)
                .join('\n');
        }
        const desc = new MeshHiPSDescriptor({ ...config, baseUrl: meshHiPSUrl }, propsText);
        this.astroSphere.activateMeshHiPS(desc);
        return desc.name;
    }
    // changeColorMap(hips: HiPS, colorMapName: ColorMapName) {
    changeColorMap(colorMapName) {
        const colorMap = ColorMaps[colorMapName];
        // hips.changeColorMap(colorMap)
        this.astroSphere.changeColorMap(colorMap);
    }
    changeCustomColorMap(colorMap) {
        this.astroSphere.changeColorMap(colorMap);
    }
    getActiveHiPS() {
        return this.astroSphere.activeHiPS;
    }
    getActiveXYZ() {
        return this.astroSphere.activeXYZ;
    }
    // Camera: GOTOs and COORDS
    setCamera(camera) {
        this.astroSphere.setCamera(camera);
    }
    setCameraPosition(pos) {
        this.astroSphere.setCameraPosition(pos);
    }
    setCameraMatrix(viewMatrix) {
        this.astroSphere.setCameraMatrix(viewMatrix);
    }
    restoreAstroViewerState(detail, applyColorMap) {
        this.astroSphere.applyFullCameraState(detail, applyColorMap);
    }
    getCurrentAstroViewerStatus() {
        return this.astroSphere.getCurrentStatus();
    }
    goTo(raDeg, decDeg) {
        // console.log(`AstroViewer.goTo goto(${raDeg}, ${decDeg})`)
        this.astroSphere.goTo(raDeg, decDeg);
    }
    getActiveCoordinateMode() {
        return this.astroSphere.getActiveCoordinateMode();
    }
    getCenterCoordinates() {
        return this.astroSphere.getCentralPointCoordinates();
    }
    getCoordinatesFromMouse() {
        return this.astroSphere.getLastMousePointCoordinates();
    }
    // GRIDs
    setModelMatrix(modelMatrix) {
        this.astroSphere.healpixGrid.setModelMatrix(modelMatrix);
    }
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
    toggleLonLatGrid() {
        return this.astroSphere.toggleLonLatGrid();
    }
    isLonLatGridVisible() {
        return this.astroSphere.isLonLatGridVisible();
    }
    setEastWestRotationLocked(locked) {
        this.astroSphere.setEastWestRotationLocked(locked);
    }
    isEastWestRotationLocked() {
        return this.astroSphere.isEastWestRotationLocked();
    }
    setNorthSouthRotationLocked(locked) {
        this.astroSphere.setNorthSouthRotationLocked(locked);
    }
    isNorthSouthRotationLocked() {
        return this.astroSphere.isNorthSouthRotationLocked();
    }
    resetAxesOrientation() {
        this.astroSphere.resetAxesOrientation();
    }
    setKeepCameraNorthUp(enabled) {
        this.astroSphere.setKeepCameraNorthUp(enabled);
    }
    isKeepCameraNorthUp() {
        return this.astroSphere.isKeepCameraNorthUp();
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
    toggleViewfinder() {
        this.viewfinderVisible = !this.viewfinderVisible;
        this.syncViewfinderVisibility();
        return this.viewfinderVisible;
    }
    setViewfinderVisible(visible) {
        this.viewfinderVisible = visible;
        this.syncViewfinderVisibility();
    }
    isViewfinderVisible() {
        return this.viewfinderVisible;
    }
    setViewfinderColor(color) {
        this.viewfinderColor = color;
        this.syncViewfinderColor();
    }
    getViewfinderColor() {
        return this.viewfinderColor;
    }
    setRotationSensitivity(value) {
        this.astroSphere.setCameraRotationSensitivity(value);
    }
    getRotationSensitivity() {
        return this.astroSphere.getCameraRotationSensitivity();
    }
    setZoomSensitivity(value) {
        this.astroSphere.setZoomSensitivity(value);
    }
    getZoomSensitivity() {
        return this.astroSphere.getZoomSensitivity();
    }
    // Internal
    constructor(canvasEl) {
        this.init(canvasEl);
        this.webglContextList = new Map();
    }
    init(canvasEl) {
        console.log('init webgl');
        this.canvas = canvasEl;
        this.initViewfinder();
        const gl = this.canvas.getContext('webgl2', { alpha: false });
        if (!gl) {
            alert('Could not initialise WebGL, sorry :-(');
            throw new Error('WebGL2 not available');
        }
        // Extend with custom fields used elsewhere
        this.webgl = gl;
        // this.webgl.viewportWidth = this.canvas.width
        // this.webgl.viewportHeight = this.canvas.height
        try {
            // 1/255 = 0.00392156862
            this.webgl.clearColor(0 * 0.00392156862, 16 * 0.00392156862, 50 * 0.00392156862, 0.7);
        }
        catch (e) {
            console.log('Error instantiating WebGL context');
        }
        this.initListeners();
        // ; (global as any).gl = this.webgl
        this.astroSphere = new AstroSphere(this.canvas, this.webgl);
    }
    initViewfinder() {
        const parent = this.canvas.parentElement;
        if (!parent)
            return;
        if (window.getComputedStyle(parent).position === 'static') {
            parent.style.position = 'relative';
        }
        const viewfinder = document.createElement('div');
        viewfinder.setAttribute('data-astro-viewfinder', 'true');
        viewfinder.setAttribute('aria-hidden', 'true');
        viewfinder.style.position = 'absolute';
        viewfinder.style.left = '50%';
        viewfinder.style.top = '50%';
        viewfinder.style.width = '44px';
        viewfinder.style.height = '44px';
        viewfinder.style.transform = 'translate(-50%, -50%)';
        viewfinder.style.pointerEvents = 'none';
        viewfinder.style.zIndex = '1';
        viewfinder.style.boxSizing = 'border-box';
        const segments = [
            { left: '50%', top: '7px', width: '1px', height: '11px', transform: 'translateX(-50%)' },
            { left: '50%', bottom: '7px', width: '1px', height: '11px', transform: 'translateX(-50%)' },
            { left: '7px', top: '50%', width: '11px', height: '1px', transform: 'translateY(-50%)' },
            { right: '7px', top: '50%', width: '11px', height: '1px', transform: 'translateY(-50%)' },
        ];
        for (const segmentDef of segments) {
            const segment = document.createElement('div');
            segment.style.position = 'absolute';
            segment.style.left = segmentDef.left ?? 'auto';
            segment.style.right = segmentDef.right ?? 'auto';
            segment.style.top = segmentDef.top ?? 'auto';
            segment.style.bottom = segmentDef.bottom ?? 'auto';
            segment.style.width = segmentDef.width;
            segment.style.height = segmentDef.height;
            segment.style.transform = segmentDef.transform;
            segment.style.background = 'currentColor';
            segment.style.borderRadius = '999px';
            segment.style.boxShadow = '0 0 0 1px rgba(0, 0, 0, 0.14)';
            viewfinder.appendChild(segment);
        }
        parent.appendChild(viewfinder);
        this.viewfinderEl = viewfinder;
        this.syncViewfinderVisibility();
        this.syncViewfinderColor();
    }
    syncViewfinderVisibility() {
        if (!this.viewfinderEl)
            return;
        this.viewfinderEl.style.display = this.viewfinderVisible ? 'block' : 'none';
    }
    syncViewfinderColor() {
        if (!this.viewfinderEl)
            return;
        this.viewfinderEl.style.color = this.viewfinderColor;
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
                // this.webgl.viewportWidth = this.canvas.width
                // this.webgl.viewportHeight = this.canvas.height
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
            // this.webgl.viewportWidth = this.canvas.width
            // this.webgl.viewportHeight = this.canvas.height
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
