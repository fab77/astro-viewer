/*
 * AstroViewer
 * Copyright (C) Fabrizio Giordano
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-AstroViewer-Commercial
 *
 * AstroViewer is dual-licensed under the GNU Affero General Public License
 * version 3 and a separate commercial license.
 *
 * See LICENSE.md, LICENSE-AGPL.md, and LICENSE-COMMERCIAL.md for details.
 */

import { bootSetup } from "./Config.js";
import Camera from "./Camera.js";
import RayPickingUtils from "./utils/RayPickingUtils.js";
import global from "./Global.js";
import MouseHelper from "./utils/MouseHelper.js";

import {
  cartesianToSpherical,
  sphericalToAstroDeg,
  raDegToHMS,
  decDegToDMS,
  AstroCoords,
  HMS,
  SphericalCoords,
  DMS,
} from "./utils/Utils.js";

import { HiPS } from "./model/hips/HiPS.js";
import type {
  HiPSFITSRangeMode,
  HiPSFITSScaleFunction,
  HiPSFITSStretch,
} from "./model/hips/HiPS.js";
import { HiPSDescriptor } from "./model/hips/HiPSDescriptor.js";
import { PerspectiveMatrixManager } from "./utils/PerspectiveMatrixManager.js";
import { SphereFoV } from "./model/SphereFoV.js";
import { Point } from "./model/Point.js";
import { FoVUtils } from "./utils/FoVUtils.js";
import { CatalogueGL } from "./model/catalogues/CatalogueGL.js";
import {
  FootprintSetGL,
  HoveredFootprintDetail,
} from "./model/footprints/FootprintSetGL.js";
import { Source } from "./model/Source.js";

import { EquatorialGrid } from "./model/grid/EquatorialGrid.js";
import { HealpixGrid } from "./model/grid/HealpixGrid.js";
import type { GridLabelContainers } from "./model/grid/GridTextHelper.js";
import { SkyEntityDrawInput } from "./model/AbstractSkyEntity.js";
import { CoordsType } from "./utils/CoordsType.js";
import ColorMaps, { ColorMapName, ColorMap } from "./model/ColorMaps.js";
import type {
  WMTSLayerConfig,
  XYZDebugStats,
  XYZLayerConfig,
} from "./model/earth/XYZConfig.js";
import type { HiPSDebugStats } from "./model/hips/HiPSConfig.js";
import { xyzTileRequestScheduler } from "./model/earth/XYZTileRequestScheduler.js";
import { WMTSAdapter } from "./model/earth/WMTSAdapter.js";
import { XYZMapDescriptor } from "./model/earth/XYZMapDescriptor.js";
import { XYZMap } from "./model/earth/XYZMap.js";
import { MeshHiPS } from "./model/meships/MeshHiPS.js";
import { MeshHiPSDescriptor } from "./model/meships/MeshHiPSDescriptor.js";
import type { MeshHiPSDebugStats } from "./model/meships/MeshHiPSTypes.js";
import { TerraPolylineSetGL } from "./model/terra/TerraPolylineSetGL.js";
import { SatelliteObjectGL } from "./model/terra/SatelliteObjectGL.js";
import { SensorConeGL } from "./model/terra/SensorConeGL.js";
import { mat4, vec3, vec4 } from "gl-matrix";

export type PointCoordinates = {
  astroDeg: AstroCoords;
  raHMS: HMS;
  decDMS: DMS;
  sphericalDeg: SphericalCoords;
};

export type CameraChangedDetail = {
  colorMap: ColorMap;
  fovDeg: number;
  fovXDeg: number;
  fovYDeg: number;
  position: [number, number, number];
  vMatrix: Float32Array;
  pMatrix: Float32Array;
  mMatrix: Float32Array;
  camera: Camera;
  timestamp: number;
  centralPoint: Point;
  mouseHoverPoint: PointCoordinates | undefined;
  getFoVPolygon: Point[];
};

export type AstroSphereOptions = {
  gridLabelContainers?: GridLabelContainers;
};

/**
 * AstroSphere — main WebGL scene controller (TS port)
 */
class AstroSphere {
  private static readonly MIN_WHEEL_SCALE = 0.85;
  private static readonly MAX_WHEEL_SCALE = 1.8;

  private _camera!: Camera;
  private _perspectiveMatrixManager: PerspectiveMatrixManager;

  private centralPoinCoords: PointCoordinates | undefined;
  private mousePointCoords: PointCoordinates | undefined;

  private canvas: HTMLCanvasElement;
  private _healpixGrid: HealpixGrid;
  private _equatorialGrid: EquatorialGrid;

  private mouseHelper: MouseHelper;

  private mouseDown = false;
  private lastMouseX: number | null = null;
  private lastMouseY: number | null = null;
  private inertiaX = 0.0;
  private inertiaY = 0.0;
  private zoomInertia = 0.0;
  private pointerDownX: number | null = null;
  private pointerDownY: number | null = null;
  private pointerDownAt = 0;

  private _activeHiPS: HiPS | null = null;
  private _activeHiPSLayers: HiPS[] = [];

  private _activeXYZ2: XYZMap | null = null;
  private _activeMeshHiPS: MeshHiPS | null = null;
  private _activeBaseLayer: "hips" | "xyz" | "meships" | null = null;

  private startup = true;

  private fov: SphereFoV;

  private activeCatalogues: CatalogueGL[] = [];
  private activeFootprintSets: FootprintSetGL[] = [];
  private activePolylineSets: TerraPolylineSetGL[] = [];
  private activeSensorCones: SensorConeGL[] = [];
  private activeSatelliteObjects: SatelliteObjectGL[] = [];
  private _webgl: WebGL2RenderingContext;
  private _selectedColorMap: any;
  private _cameraStatusChanged: boolean = false;
  private lastCameraChangedAt = 0;
  private lastCameraMotionAt = 0;
  private lastHoveredSource: Source | null = null;
  private lastHoveredCatalogue: CatalogueGL | null = null;
  private zoomSensitivity = 1.0;
  private lockedEastWestRaDeg: number | null = null;
  private lockedNorthSouthDecDeg: number | null = null;
  private keepCameraNorthUp = true;
  private gridLabelContainers?: GridLabelContainers;

  constructor(
    canvas: HTMLCanvasElement,
    webgl: WebGL2RenderingContext,
    options: AstroSphereOptions = {},
  ) {
    console.log("[AstroSphere] new instance for canvas", canvas.id);
    // Keep global GL context (as in original JS)
    this._webgl = webgl;
    this.mouseHelper = new MouseHelper();
    this.canvas = canvas;
    this.gridLabelContainers = options.gridLabelContainers;

    const nativeColorMap: ColorMapName = "native";
    this._selectedColorMap = ColorMaps[nativeColorMap];

    global.insideSphere = bootSetup.insideSphere;

    this.initCamera();

    this._healpixGrid = new HealpixGrid(this._webgl, this.gridLabelContainers);
    this._perspectiveMatrixManager = new PerspectiveMatrixManager(
      canvas,
      this._camera,
      bootSetup.camera_fov_deg,
      bootSetup.camera_near_plane,
      bootSetup.insideSphere,
    );
    this._perspectiveMatrixManager.computePerspectiveMatrix(
      canvas,
      this._camera,
      bootSetup.camera_fov_deg,
      bootSetup.camera_near_plane,
      bootSetup.insideSphere,
    );

    this._equatorialGrid = new EquatorialGrid(
      this._webgl,
      this._healpixGrid,
      this.gridLabelContainers,
    );
    this._equatorialGrid.init(this._healpixGrid.getMinFoV());

    this.updateCentralPoint();
    this.startup = true;
    this.addEventListeners(canvas);
    this.fov = this._healpixGrid.refreshFoV(
      this._camera,
      this._perspectiveMatrixManager.pMatrix,
    );
    this._camera.refreshFoV(this.fov.minFoV);
  }

  private initCamera() {
    if (bootSetup.insideSphere) {
      this._camera = new Camera([0.0, 0.0, -0.005], true);
    } else {
      this._camera = new Camera([0.0, 0.0, 4.0], false);
    }
  }

  setCamera(camera: Camera) {
    this._camera = camera;
  }

  setCameraRotationSensitivity(value: number): void {
    this._camera.setRotationSensitivity(value);
  }

  getCameraRotationSensitivity(): number {
    return this._camera.getRotationSensitivity();
  }

  get healpixGrid() {
    return this._healpixGrid;
  }

  get equatorialGrid() {
    return this._equatorialGrid;
  }

  // This is a lickely a duplication of FoVUtils.getCenterJ2000(this.canvas)
  private updateCentralPoint(): PointCoordinates {
    const sphericalCoords = this.getPhiThetaDeg(this.canvas);
    const astroCoords = sphericalToAstroDeg(
      sphericalCoords.phi,
      sphericalCoords.theta,
    );
    const raHMS = raDegToHMS(astroCoords.ra);
    const decDMS = decDegToDMS(astroCoords.dec);
    this.centralPoinCoords = {
      astroDeg: astroCoords,
      sphericalDeg: sphericalCoords,
      raHMS: raHMS,
      decDMS: decDMS,
    };
    return this.centralPoinCoords;
  }

  private updateLastMousePoint(): PointCoordinates {
    const sphericalCoords = {
      phi: this.mouseHelper.phi,
      theta: this.mouseHelper.theta,
    } as SphericalCoords;
    const astroCoords = {
      ra: this.mouseHelper.ra,
      dec: this.mouseHelper.dec,
    } as AstroCoords;
    const raHMS = this.mouseHelper.raHMS as HMS;
    const decDMS = this.mouseHelper.decDMS as DMS;
    this.mousePointCoords = {
      astroDeg: astroCoords,
      sphericalDeg: sphericalCoords,
      raHMS: raHMS,
      decDMS: decDMS,
    };
    return this.mousePointCoords;
  }

  private clearLastMousePoint(): void {
    this.mousePointCoords = undefined;
  }

  // This should call FoVUtils.getJ200Centre(this.canvas)
  getCentralPointCoordinates(): PointCoordinates | undefined {
    return this.centralPoinCoords;
  }

  getLastMousePointCoordinates(): PointCoordinates | undefined {
    return this.mousePointCoords;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  private computeZoomStep(currentFov: number, deltaY: number): number {
    const direction = deltaY < 0 ? -1 : 1;
    const wheelScale = this.clamp(
      Math.abs(deltaY) / 120,
      AstroSphere.MIN_WHEEL_SCALE,
      AstroSphere.MAX_WHEEL_SCALE,
    );

    const baseMagnitude = this.clamp(
      0.0012 + 0.0025 * Math.sqrt(Math.max(currentFov, 0)),
      0.0012,
      0.04,
    );

    return direction * baseMagnitude * wheelScale * this.zoomSensitivity;
  }

  setZoomSensitivity(value: number): void {
    this.zoomSensitivity = this.clamp(value, 0.2, 3);
  }

  getZoomSensitivity(): number {
    return this.zoomSensitivity;
  }

  private filterRotationDeltaByAstroLocks(
    deltaX: number,
    deltaY: number,
  ): { deltaX: number; deltaY: number } {
    const lockEastWest = this._camera.isRotationLockedY();
    const lockNorthSouth = this._camera.isRotationLockedX();
    if (!lockEastWest && !lockNorthSouth) {
      return { deltaX, deltaY };
    }

    const center = RayPickingUtils.getIntersectionPointWithSingleModel(
      this.canvas.clientWidth / 2,
      this.canvas.clientHeight / 2,
      this._healpixGrid,
      this._webgl,
      this._camera,
      this._perspectiveMatrixManager.pMatrix,
    );
    if (!center || center.length < 3) {
      return { deltaX, deltaY };
    }

    const centerVec = vec3.normalize(
      vec3.create(),
      vec3.fromValues(center[0], center[1], center[2]),
    );
    const northAxis = vec3.fromValues(0, 0, 1);
    const eastVec = vec3.cross(vec3.create(), northAxis, centerVec);
    if (vec3.length(eastVec) < 1e-6) {
      vec3.set(eastVec, 1, 0, 0);
    } else {
      vec3.normalize(eastVec, eastVec);
    }

    const northProjection = vec3.scale(
      vec3.create(),
      centerVec,
      vec3.dot(northAxis, centerVec),
    );
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

  private projectModelDirectionToScreen(
    centerModel: vec3,
    directionModel: vec3,
  ): { x: number; y: number } | null {
    const offsetModel = vec3.scaleAndAdd(
      vec3.create(),
      centerModel,
      directionModel,
      0.01,
    );
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

  private projectModelPointToScreen(
    pointModel: vec3,
  ): { x: number; y: number } | null {
    const vMatrix = this._camera.getCameraMatrix();
    const mMatrix = this._healpixGrid.getModelMatrix();
    const mvMatrix = mat4.create();
    const mvpMatrix = mat4.create();
    mat4.multiply(mvMatrix, vMatrix, mMatrix);
    mat4.multiply(mvpMatrix, this._perspectiveMatrixManager.pMatrix, mvMatrix);

    const clip = vec4.fromValues(
      pointModel[0],
      pointModel[1],
      pointModel[2],
      1,
    );
    vec4.transformMat4(clip, clip, mvpMatrix);
    if (Math.abs(clip[3]) < 1e-6) {
      return null;
    }

    return {
      x: clip[0] / clip[3],
      y: -(clip[1] / clip[3]),
    };
  }

  private enforceAstronomicalRotationLocks(): boolean {
    if (
      this.lockedEastWestRaDeg == null &&
      this.lockedNorthSouthDecDeg == null
    ) {
      return false;
    }

    const center = this.updateCentralPoint();
    if (!center) {
      return false;
    }

    const nextRa = this.lockedEastWestRaDeg ?? center.astroDeg.ra;
    const nextDec = this.lockedNorthSouthDecDeg ?? center.astroDeg.dec;
    const needsCorrection =
      Math.abs(nextRa - center.astroDeg.ra) > 1e-6 ||
      Math.abs(nextDec - center.astroDeg.dec) > 1e-6;

    if (!needsCorrection) {
      return false;
    }

    this._camera.goTo(nextRa, nextDec);
    this._perspectiveMatrixManager.computePerspectiveMatrix(
      this.canvas,
      this._camera,
      bootSetup.camera_fov_deg,
      bootSetup.camera_near_plane,
      global.insideSphere,
    );
    this.updateCentralPoint();
    return true;
  }

  private enforceCameraNorthUp(): boolean {
    if (!this.keepCameraNorthUp) {
      return false;
    }

    const center = this.updateCentralPoint();
    if (!center) {
      return false;
    }

    this._camera.goTo(center.astroDeg.ra, center.astroDeg.dec);
    this._perspectiveMatrixManager.computePerspectiveMatrix(
      this.canvas,
      this._camera,
      bootSetup.camera_fov_deg,
      bootSetup.camera_near_plane,
      global.insideSphere,
    );
    this.updateCentralPoint();
    return true;
  }

  private emitCameraChanged(reason: string) {
    // avoid dispatch before scene is ready
    if (!this._activeHiPS && !this._activeXYZ2 && !this._activeMeshHiPS) return;
    if (!(this._healpixGrid as any)?.fovObj) return;

    const detail = this.getCurrentStatus();
    if (!detail) return;

    // optional debug
    // console.log('[AstroSphere] emit camera-changed:', reason);

    this.canvas.dispatchEvent(
      new CustomEvent<CameraChangedDetail>("camera-changed", {
        detail,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private addEventListeners(canvas: HTMLCanvasElement) {
    if (global.debug) {
      console.log("[AstroSphere::addEventListeners]");
    }

    const CLICK_MAX_DISTANCE_PX = 4;
    const CLICK_MAX_DURATION_MS = 250;

    const rect = canvas.getBoundingClientRect();
    this.lastMouseX = rect.left; // locale al canvas
    this.lastMouseY = rect.top;

    const handleMouseDown = (event: PointerEvent) => {
      canvas.setPointerCapture(event.pointerId);
      this.mouseDown = true;

      const rect = canvas.getBoundingClientRect();
      this.lastMouseX = event.clientX - rect.left; // locale al canvas
      this.lastMouseY = event.clientY - rect.top; // locale al canvas
      this.pointerDownX = this.lastMouseX;
      this.pointerDownY = this.lastMouseY;
      this.pointerDownAt = Date.now();

      const mousePoint = RayPickingUtils.getIntersectionPointWithSingleModel(
        this.lastMouseX,
        this.lastMouseY,
        this._healpixGrid,
        this._webgl,
        this._camera,
        this._perspectiveMatrixManager.pMatrix,
      );

      if (mousePoint && mousePoint.length > 0) {
        this.mouseHelper.update(mousePoint);

        this.updateLastMousePoint();
      } else {
        this.clearLastMousePoint();
      }

      event.preventDefault();

      return false;
    };

    const handleMouseUp = (event: PointerEvent) => {
      canvas.releasePointerCapture(event.pointerId);
      this.mouseDown = false;
      document.body.style.cursor = "auto";

      if (event.button !== 0) {
        event.preventDefault();
        return false;
      }

      const rect = canvas.getBoundingClientRect();
      const localX = event.clientX - rect.left;
      const localY = event.clientY - rect.top;
      this.lastMouseX = localX;
      this.lastMouseY = localY;

      const moveDist = Math.hypot(
        localX - (this.pointerDownX ?? localX),
        localY - (this.pointerDownY ?? localY),
      );
      const elapsedMs = Date.now() - this.pointerDownAt;
      const isClick =
        moveDist <= CLICK_MAX_DISTANCE_PX && elapsedMs <= CLICK_MAX_DURATION_MS;

      if (isClick) {
        const mousePoint = RayPickingUtils.getIntersectionPointWithSingleModel(
          localX,
          localY,
          this._healpixGrid,
          this._webgl,
          this._camera,
          this._perspectiveMatrixManager.pMatrix,
        );

        if (mousePoint && mousePoint.length > 0) {
          this.mouseHelper.update(mousePoint);
          this.updateLastMousePoint();

          for (const cat of this.activeCatalogues) {
            const clickResult = cat.selectPrimarySourceFromClick(
              this.mouseHelper,
            );
            if (!clickResult?.sources.length) continue;
            this._webgl.canvas.dispatchEvent(
              new CustomEvent("source-clicked", {
                detail: {
                  source: clickResult.sources,
                  selectionState: clickResult.selectionState,
                  catalogue: cat,
                },
                bubbles: true,
                composed: true,
              }),
            );
          }

          for (const fset of this.activeFootprintSets) {
            const clickResult = fset.selectPrimaryFootprintFromClick(
              this.mouseHelper,
            );
            if (!clickResult?.footprints.length) continue;
            this._webgl.canvas.dispatchEvent(
              new CustomEvent("footprint-clicked", {
                detail: {
                  footprint: clickResult.footprints,
                  selectionState: clickResult.selectionState,
                  footprintSet: fset,
                },
                bubbles: true,
                composed: true,
              }),
            );
          }
        }
      } else {
        this.clearLastMousePoint();
      }
    };

    const handleMouseMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();

      // 🔹 canvas-local coordinates
      const localX = event.clientX - rect.left;
      const localY = event.clientY - rect.top;

      const newX = localX;
      const newY = localY;

      // if (!healpixGridSingleton) return;
      if (!this._healpixGrid) return;

      if (this.mouseDown) {
        document.body.style.cursor = "grab";
        const dragDirection = global.insideSphere ? -1 : 1;
        const dragSpeed = global.insideSphere ? 10.0 : 1;
        const deltaX =
          (dragDirection *
            dragSpeed *
            (newX - (this.lastMouseX ?? newX)) *
            Math.PI) /
          canvas.width;
        const deltaY =
          (dragDirection *
            dragSpeed *
            (newY - (this.lastMouseY ?? newY)) *
            Math.PI) /
          canvas.height;
        const filteredDelta = this.filterRotationDeltaByAstroLocks(
          deltaX,
          deltaY,
        );

        this.inertiaX += 0.1 * filteredDelta.deltaX;
        this.inertiaY += 0.1 * filteredDelta.deltaY;

        this.updateCentralPoint();
      } else {
        // Use canvas-local coords for picking
        const mousePoint = RayPickingUtils.getIntersectionPointWithSingleModel(
          localX,
          localY,
          this._healpixGrid,
          this._webgl,
          this._camera,
          this._perspectiveMatrixManager.pMatrix,
        );

        if (mousePoint && mousePoint.length > 0) {
          this.mouseHelper.update(mousePoint);

          this.updateLastMousePoint();
        } else {
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

    const handleMouseWheel = (event: WheelEvent) => {
      const currentFov = this._healpixGrid.getMinFoV();
      const zoomStep = this.computeZoomStep(currentFov, event.deltaY);

      // Apply wheel zoom immediately and discard any queued inertia so reversing
      // direction feels responsive instead of "buffered".
      this.zoomInertia = 0;
      this._camera.zoom(zoomStep);
      this.lastCameraMotionAt = performance.now();

      this.fov = this._healpixGrid.refreshFoV(
        this._camera,
        this._perspectiveMatrixManager.pMatrix,
      );
      this._camera.refreshFoV(this.fov.minFoV);

      this._cameraStatusChanged = true;
      this.emitCameraChanged("wheel");
      event.preventDefault();
    };

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();

      const rect = canvas.getBoundingClientRect();
      const localX = event.clientX - rect.left;
      const localY = event.clientY - rect.top;

      const mousePoint = RayPickingUtils.getIntersectionPointWithSingleModel(
        localX,
        localY,
        this._healpixGrid,
        this._webgl,
        this._camera,
        this._perspectiveMatrixManager.pMatrix,
      );

      if (!mousePoint || mousePoint.length === 0) {
        return false;
      }

      this.mouseHelper.update(mousePoint);
      this.updateLastMousePoint();

      for (const cat of this.activeCatalogues) {
        const pickResult = cat.getSourcesFromPointer(this.mouseHelper);
        if (!pickResult?.sources.length) continue;

        this._webgl.canvas.dispatchEvent(
          new CustomEvent("source-contextmenu", {
            detail: {
              source: pickResult.sources,
              catalogue: cat,
              clientX: event.clientX,
              clientY: event.clientY,
            },
            bubbles: true,
            composed: true,
          }),
        );
        break;
      }

      for (const fset of this.activeFootprintSets) {
        const pickResult = fset.getFootprintsFromPointer(this.mouseHelper);
        if (!pickResult?.footprints.length) continue;

        this._webgl.canvas.dispatchEvent(
          new CustomEvent("footprint-contextmenu", {
            detail: {
              footprint: pickResult.footprints,
              footprintSet: fset,
              clientX: event.clientX,
              clientY: event.clientY,
            },
            bubbles: true,
            composed: true,
          }),
        );
        break;
      }

      return false;
    };

    const onKeyDown = (evt: KeyboardEvent) => {
      if (!evt.ctrlKey) {
        return;
      }

      // console.log('[AstroSphere::onKeyDown] key=', evt.key)
      switch (evt.key) {
        case "1":
          // Free camera
          this._camera.clearRotationLock();
          break;

        case "2":
          // Lock X axis rotation
          this._camera.setRotationLock({ x: true, y: false, z: false });
          break;

        case "3":
          // Lock Y axis rotation
          this._camera.setRotationLock({ x: false, y: true, z: false });
          break;

        case "4":
          // Lock Z axis rotation
          this._camera.setRotationLock({ x: false, y: false, z: true });
          break;
      }
    };

    console.log(
      "[AstroSphere] registering pointer and wheel listeners on canvas",
    );
    canvas.onpointerdown = handleMouseDown;
    canvas.onpointerup = handleMouseUp;
    canvas.onpointermove = handleMouseMove;
    canvas.onpointerleave = () => {
      this.clearLastMousePoint();
      this._cameraStatusChanged = true;
      this.emitCameraChanged("pointerleave");
    };

    console.log(
      "[AstroSphere] adding wheel event listener with passive: false",
    );
    canvas.addEventListener("wheel", handleMouseWheel, { passive: false });
    canvas.addEventListener("contextmenu", handleContextMenu);

    console.log(
      "[AstroSphere] registering global keydown listener on document",
    );
    document.addEventListener("keydown", onKeyDown, { capture: true });
  }

  // REVIEW THIS METHOD AND MOVE IT
  getPhiThetaDeg(canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const maxX = rect.width;
    const maxY = rect.height;
    const pickerPoint = RayPickingUtils.getIntersectionPointWithSingleModel(
      maxX / 2,
      maxY / 2,
      this._healpixGrid,
      this._webgl,
      this._camera,
      this._perspectiveMatrixManager.pMatrix,
    );

    return cartesianToSpherical(pickerPoint);
  }

  changeHiPSFormat(format: string): void {
    if (!this._activeHiPS) {
      throw new Error("No active HiPS.");
    }

    this._activeHiPS.changeFormat(format);
  }

  setHiPSFITSScaleFunction(
    scaleFunction: HiPSFITSScaleFunction,
    scaleParam?: number,
  ): void {
    if (!this._activeHiPS) {
      throw new Error("No active HiPS.");
    }

    this._activeHiPS.setFITSScaleFunction(scaleFunction, scaleParam);
  }

  getActiveHiPSFITSStretch(): HiPSFITSStretch | null {
    return this._activeHiPS?.fitsStretch ?? null;
  }

  setHiPSFITSRangeMode(rangeMode: HiPSFITSRangeMode): void {
    if (!this._activeHiPS) {
      throw new Error("No active HiPS.");
    }

    this._activeHiPS.setFITSRangeMode(rangeMode);
  }

  private createHiPS(hipsDescriptor: HiPSDescriptor): HiPS {
    return new HiPS(
      1,
      [0.0, 0.0, 0.0],
      0,
      0,
      hipsDescriptor,
      this._webgl,
      this._healpixGrid,
    );
  }

  activateHiPS(hipsDescriptor: HiPSDescriptor): HiPS {
    const tileBuffer = this._healpixGrid.visibleTilesManager.tileBuffer;

    for (const hips of this._activeHiPSLayers) {
      tileBuffer.removeHiPS(hips);
    }

    this._activeHiPSLayers = [];

    const hips = this.createHiPS(hipsDescriptor);

    this._activeHiPSLayers.push(hips);
    this._activeHiPS = hips;
    this._activeBaseLayer = "hips";

    return hips;
  }

  setHiPSOpacity(hips: HiPS, opacity: number): void {
    if (!this._activeHiPSLayers.includes(hips)) {
      throw new Error("HiPS layer is not active in this AstroSphere.");
    }

    hips.setOpacity(opacity);
  }

  addHiPS(hipsDescriptor: HiPSDescriptor): HiPS {
    const normalizeURL = (url: string | URL): string =>
      String(url).replace(/\/+$/, "");

    const descriptorURL = normalizeURL(hipsDescriptor.url);

    const existing = this._activeHiPSLayers.find(
      (hips) => normalizeURL(hips.baseURL) === descriptorURL,
    );

    if (existing) {
      throw new Error(`HiPS already active: ${String(hipsDescriptor.url)}`);
    }

    const hips = this.createHiPS(hipsDescriptor);

    this._activeHiPSLayers.push(hips);
    this._activeHiPS = hips;
    this._activeBaseLayer = "hips";

    return hips;
  }

  removeHiPS(hips: HiPS): void {
    const index = this._activeHiPSLayers.indexOf(hips);

    if (index === -1) {
      return;
    }

    this._healpixGrid.visibleTilesManager.tileBuffer.removeHiPS(hips);
    this._activeHiPSLayers.splice(index, 1);

    if (this._activeHiPSLayers.length === 0) {
      this._activeHiPS = null;

      if (this._activeBaseLayer === "hips") {
        this._activeBaseLayer = null;
      }

      return;
    }

    if (this._activeHiPS === hips) {
      this._activeHiPS =
        this._activeHiPSLayers[this._activeHiPSLayers.length - 1];
    }
  }

  removeAllHiPS(): void {
    const tileBuffer = this._healpixGrid.visibleTilesManager.tileBuffer;

    for (const hips of this._activeHiPSLayers) {
      tileBuffer.removeHiPS(hips);
    }

    this._activeHiPSLayers = [];
    this._activeHiPS = null;

    if (this._activeBaseLayer === "hips") {
      this._activeBaseLayer = null;
    }
  }

  activateXYZ(config: XYZLayerConfig) {
    this.activateXYZ2(
      new XYZMapDescriptor(
        config.name ?? "XYZ Earth2 Layer",
        config.urlTemplate,
        config.minZoom ?? 0,
        config.maxZoom ?? 8,
        config.segmentsPerSide ?? 48,
        config.maxCachedTiles ?? 384,
        8,
        config.urlResolver,
      ),
    );
    this._activeBaseLayer = "xyz";
  }
  activateXYZ2(config: XYZMapDescriptor) {
    this._activeXYZ2 = new XYZMap(
      1,
      [0.0, 0.0, 0.0],
      0,
      0,
      config,
      this._webgl,
      this.gridLabelContainers,
    );
    this._activeBaseLayer = "xyz";
  }

  activateMeshHiPS(descriptor: MeshHiPSDescriptor) {
    this._activeMeshHiPS = new MeshHiPS(
      descriptor.meshRadius,
      [0.0, 0.0, 0.0],
      0,
      0,
      descriptor,
      this._webgl,
      this._healpixGrid,
    );
    this._activeBaseLayer = "meships";
  }

  activateWMTS(config: WMTSLayerConfig) {
    const adapter = new WMTSAdapter(config);
    const xyzConfig = adapter.toXYZLayerConfig();
    this._activeXYZ2 = new XYZMap(
      1,
      [0.0, 0.0, 0.0],
      0,
      0,
      new XYZMapDescriptor(
        config.layer ? `WMTS ${config.layer}` : "WMTS Earth2 Layer",
        xyzConfig.urlTemplate,
        xyzConfig.minZoom ?? 0,
        xyzConfig.maxZoom ?? 8,
        xyzConfig.segmentsPerSide ?? 48,
        xyzConfig.maxCachedTiles ?? 384,
        8,
        xyzConfig.urlResolver,
      ),
      this._webgl,
      this.gridLabelContainers,
    );
    this._activeBaseLayer = "xyz";
  }

  // Catalogue section
  async showCatalogue(cat: CatalogueGL) {
    // console.log(cat)
    if (cat) this.activeCatalogues.push(cat);
    return cat;
  }

  deleteCatalogue(catalogue: CatalogueGL) {
    this.activeCatalogues = this.activeCatalogues.filter(
      (c) => c !== catalogue,
    );
  }
  // End Catalogue section

  // Footprint section
  async showFootprintSet(fset: FootprintSetGL) {
    // console.log(fset)
    if (fset) this.activeFootprintSets.push(fset);
    return fset;
  }

  deleteFootprintSet(footprintSet: FootprintSetGL) {
    this.activeFootprintSets = this.activeFootprintSets.filter(
      (fst) => fst !== footprintSet,
    );
  }

  async showPolylineSet(polylineSet: TerraPolylineSetGL) {
    if (polylineSet) this.activePolylineSets.push(polylineSet);
    return polylineSet;
  }

  deletePolylineSet(polylineSet: TerraPolylineSetGL) {
    this.activePolylineSets = this.activePolylineSets.filter(
      (set) => set !== polylineSet,
    );
    polylineSet.dispose();
  }

  async showSensorCone(sensorCone: SensorConeGL) {
    if (sensorCone) this.activeSensorCones.push(sensorCone);
    return sensorCone;
  }

  deleteSensorCone(sensorCone: SensorConeGL) {
    this.activeSensorCones = this.activeSensorCones.filter(
      (cone) => cone !== sensorCone,
    );
    sensorCone.dispose();
  }

  async showSatelliteObject(satelliteObject: SatelliteObjectGL) {
    if (satelliteObject) this.activeSatelliteObjects.push(satelliteObject);
    return satelliteObject;
  }

  deleteSatelliteObject(satelliteObject: SatelliteObjectGL) {
    this.activeSatelliteObjects = this.activeSatelliteObjects.filter(
      (object) => object !== satelliteObject,
    );
    satelliteObject.dispose();
  }

  getHoveredFootprints(): HoveredFootprintDetail[] {
    let footprintsHovered: HoveredFootprintDetail[] = [];
    this.activeFootprintSets.forEach((fset) => {
      footprintsHovered.push(fset.hoveredFootprints);
    });
    return footprintsHovered;
  }
  // End Footprint section

  goTo(raDeg: number, decDeg: number): void {
    this._camera.goTo(raDeg, decDeg);
  }

  getActiveCoordinateMode(): "equatorial" | "galactic" | "lonlat" {
    if (this._activeBaseLayer === "xyz") {
      return "lonlat";
    }

    if (this._activeBaseLayer === "hips" && this._activeHiPS?.isGalacticHips) {
      return "galactic";
    }

    return "equatorial";
  }

  resetAxesOrientation(): void {
    const center = this.updateCentralPoint();
    if (!center) return;

    this.inertiaX = 0;
    this.inertiaY = 0;
    this._camera.goTo(center.astroDeg.ra, center.astroDeg.dec);
    this._perspectiveMatrixManager.computePerspectiveMatrix(
      this.canvas,
      this._camera,
      bootSetup.camera_fov_deg,
      bootSetup.camera_near_plane,
      global.insideSphere,
    );
    this.updateCentralPoint();
    this._cameraStatusChanged = true;
  }

  setKeepCameraNorthUp(enabled: boolean): void {
    this.keepCameraNorthUp = enabled;
    if (enabled) {
      this.resetAxesOrientation();
    }
  }

  isKeepCameraNorthUp(): boolean {
    return this.keepCameraNorthUp;
  }

  getFoV(): SphereFoV {
    if (this._activeBaseLayer === "xyz" && this._activeXYZ2) {
      return this._activeXYZ2.getFoV();
    }

    return this.fov;
  }

  getFoVPolygon(): Point[] {
    if (this.healpixGrid == null)
      throw new Error(`healpixGrid is ${this.healpixGrid}`);
    return FoVUtils.getFoVPolygon(
      this._camera,
      this.canvas,
      this._healpixGrid,
      this._healpixGrid,
      this._webgl,
      this._perspectiveMatrixManager.pMatrix,
    );
  }

  changeFoV(deg: number) {
    const distance = this._healpixGrid.getFoV().computeDistanceFromAngle(deg);
    this._camera.translate(distance);
    this.fov = this._healpixGrid.refreshFoV(
      this._camera,
      this._perspectiveMatrixManager.pMatrix,
    );
    this._camera.refreshFoV(this.fov.minFoV);
  }

  changeFoV2(deg: number) {
    const newCameraPos = this._healpixGrid
      .getFoV()
      .computeCameraPositionForFoV(deg);
    this._camera.setCameraPosition(newCameraPos);
  }

  changeFoV3(deg: number) {
    const newPos = this._healpixGrid
      .getFoV()
      .computeCameraPositionForAngularDiameter(deg);
    this._camera.setCameraPosition(newPos);

    // Recompute projection after moving the camera
    this._perspectiveMatrixManager.computePerspectiveMatrix(
      this.canvas,
      this._camera,
      bootSetup.camera_fov_deg,
      bootSetup.camera_near_plane,
      false,
    );
  }

  getInsideSphere(): boolean {
    return global.insideSphere;
  }

  toggleInsideSphere() {
    const centerBeforeToggle = this.updateCentralPoint();
    this.inertiaX = 0;
    this.inertiaY = 0;
    this.zoomInertia = 0;
    global.insideSphere = !global.insideSphere;
    // console.log(global.insideSphere)
    this._camera.toggleInsideSphere();
    this._camera.goTo(
      centerBeforeToggle.astroDeg.ra,
      centerBeforeToggle.astroDeg.dec,
    );
    this._perspectiveMatrixManager.computePerspectiveMatrix(
      this.canvas,
      this._camera,
      bootSetup.camera_fov_deg,
      bootSetup.camera_near_plane,
      global.insideSphere,
    );
    this.fov = this._healpixGrid.refreshFoV(
      this._camera,
      this._perspectiveMatrixManager.pMatrix,
    );
    this._camera.refreshFoV(this.fov.minFoV);
    this.updateCentralPoint();
    this.lastCameraMotionAt = performance.now();
    this._cameraStatusChanged = true;
    this.emitCameraChanged("inside-sphere-toggle");
    requestAnimationFrame(() => this.draw(this.canvas));
  }

  // imposta posizione camera
  public setCameraPosition(pos: [number, number, number]) {
    this._camera.setCameraPosition(pos);
    this._perspectiveMatrixManager.computePerspectiveMatrix(
      this.canvas,
      this._camera,
      bootSetup.camera_fov_deg,
      bootSetup.camera_near_plane,
      global.insideSphere,
    );
  }

  // imposta orientamento camera tramite view matrix
  public setCameraMatrix(viewMatrix: Float32Array) {
    this._camera.setCameraMatrix(viewMatrix);

    this._perspectiveMatrixManager.computePerspectiveMatrix(
      this.canvas,
      this._camera,
      bootSetup.camera_fov_deg,
      bootSetup.camera_near_plane,
      global.insideSphere,
    );
  }

  private _refreshingStatus: boolean = false;
  // set completo camera (pos + orientamento)
  public applyFullCameraState(
    detail: CameraChangedDetail,
    applyColor: boolean,
  ) {
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

  public getCurrentStatus(): CameraChangedDetail | null {
    this.updateCentralPoint();
    const centralradeg = this.centralPoinCoords?.astroDeg.ra;
    const centraldecdeg = this.centralPoinCoords?.astroDeg.dec;
    // if (!centraldecdeg || !centralradeg) {
    if (centralradeg == null || centraldecdeg == null) {
      return null;
    }
    let fovPolygon: Point[] = [];
    try {
      fovPolygon = this.getFoVPolygon();
    } catch (error) {
      console.warn(
        "[AstroSphere] getCurrentStatus: FoV polygon is not available.",
        error,
      );
    }
    // if (this._rotating && centraldecdeg && centralradeg) {
    const detail: CameraChangedDetail = {
      fovDeg: this.fov.minFoV,
      fovXDeg: this.fov.xFoV,
      fovYDeg: this.fov.yFoV,
      position: this._camera.getCameraPosition(),
      vMatrix: this._camera.getCameraMatrix() as Float32Array,
      pMatrix: this._perspectiveMatrixManager.pMatrix as Float32Array,
      mMatrix: this._healpixGrid.getModelMatrix() as Float32Array,
      camera: this._camera,
      timestamp: performance.now(),
      centralPoint: new Point(
        { raDeg: centralradeg, decDeg: centraldecdeg },
        CoordsType.ASTRO,
      ),
      mouseHoverPoint: this.mousePointCoords,
      colorMap: this._selectedColorMap,
      getFoVPolygon: fovPolygon,
    };
    return detail;
    // }
    // return null
  }

  changeColorMap(cm: ColorMap) {
    if (!this._activeHiPS && !this._activeXYZ2 && !this._activeMeshHiPS) return;
    this._selectedColorMap = cm;
    this._activeHiPS?.changeColorMap(cm);
    this._activeXYZ2?.changeColorMap(cm);
  }

  private prevFov: number = 0;
  private prevCentralRaDeg: number | null = null;
  private prevCentralDecDeg: number | null = null;

  get activeHiPS(): HiPS | null {
    return this._activeHiPS;
  }

  get activeHiPSLayers(): readonly HiPS[] {
    return this._activeHiPSLayers;
  }

  setActiveHiPS(hips: HiPS): void {
    if (!this._activeHiPSLayers.includes(hips)) {
      throw new Error("HiPS layer is not active in this AstroSphere.");
    }

    this._activeHiPS = hips;
    this._activeBaseLayer = "hips";
  }

  get activeXYZ(): XYZMap | null {
    return this._activeXYZ2;
  }

  get activeMeshHiPS(): MeshHiPS | null {
    return this._activeMeshHiPS;
  }

  isLonLatGridVisible(): boolean {
    return this._activeXYZ2?.isLonLatGridVisible() ?? false;
  }

  toggleLonLatGrid(): boolean {
    return this._activeXYZ2?.toggleLonLatGrid() ?? false;
  }

  setEastWestRotationLocked(locked: boolean): void {
    this._camera.setRotationLock({ y: locked });
    if (locked) this.inertiaX = 0;
    this.lockedEastWestRaDeg = locked
      ? (this.updateCentralPoint()?.astroDeg.ra ?? null)
      : null;
  }

  isEastWestRotationLocked(): boolean {
    return this._camera.isRotationLockedY();
  }

  setNorthSouthRotationLocked(locked: boolean): void {
    this._camera.setRotationLock({ x: locked });
    if (locked) this.inertiaY = 0;
    this.lockedNorthSouthDecDeg = locked
      ? (this.updateCentralPoint()?.astroDeg.dec ?? null)
      : null;
  }

  isNorthSouthRotationLocked(): boolean {
    return this._camera.isRotationLockedX();
  }

  getXYZDebugStats(): XYZDebugStats {
    return {
      activeBaseLayer: this._activeBaseLayer,
      layer: this._activeXYZ2?.getDebugStats() ?? null,
      requests: xyzTileRequestScheduler.getDebugStats(),
    };
  }

  getHiPSDebugStats(): HiPSDebugStats | null {
    if (!this._activeHiPS) return null;
    return this._activeHiPS.getDebugStats();
  }

  getMeshHiPSDebugStats(): MeshHiPSDebugStats | null {
    if (!this._activeMeshHiPS) return null;
    return this._activeMeshHiPS.getDebugStats();
  }

  draw(canvas: HTMLCanvasElement) {
    if (this._refreshingStatus) return;
    if (!this._webgl) return;
    if (!this._activeHiPS && !this._activeXYZ2 && !this._activeMeshHiPS) return;

    if (!this._healpixGrid || Object.keys(this._healpixGrid).length === 0)
      return;
    if ((this._healpixGrid as any).fovObj === undefined) return;

    // In WebGL2, OES_element_index_uint is core, no need to fetch the extension each frame.
    // global.gl.getExtension('OES_element_index_uint')
    // global.gl.clear(global.gl.COLOR_BUFFER_BIT | global.gl.DEPTH_BUFFER_BIT)

    this._perspectiveMatrixManager.computePerspectiveMatrix(
      canvas,
      this._camera,
      bootSetup.camera_fov_deg,
      bootSetup.camera_near_plane,
      global.insideSphere,
    );

    let cameraRotated = false;
    let THETA = 0;
    let PHI = 0;

    this._webgl.viewport(
      0,
      0,
      this._webgl.drawingBufferWidth,
      this._webgl.drawingBufferHeight,
    );
    this._webgl.clear(
      this._webgl.COLOR_BUFFER_BIT | this._webgl.DEPTH_BUFFER_BIT,
    );

    // Zoom inertia
    if (this.zoomInertia !== 0) {
      if (Math.abs(this.zoomInertia) > 0.0001) {
        this._camera.zoom(this.zoomInertia);
        this.zoomInertia *= 0.95;
        this.lastCameraMotionAt = performance.now();

        this.fov = this._healpixGrid.refreshFoV(
          this._camera,
          this._perspectiveMatrixManager.pMatrix,
        );
        this._camera.refreshFoV(this.fov.minFoV);
        if (this.prevFov !== this.fov.minFoV) {
          if (!this.centralPoinCoords) {
            this.centralPoinCoords = this.updateCentralPoint();
          }

          this.prevFov = this.fov.minFoV;
        }
      } else {
        this.zoomInertia = 0;
      }
      this._cameraStatusChanged = true;
    }

    // Rotation inertia
    if (
      this.mouseDown ||
      Math.abs(this.inertiaX) > 0.02 ||
      Math.abs(this.inertiaY) > 0.02
    ) {
      cameraRotated = true;
      const filteredInertia = this.filterRotationDeltaByAstroLocks(
        this.inertiaX,
        this.inertiaY,
      );
      PHI = filteredInertia.deltaX;
      THETA = filteredInertia.deltaY;
      this.inertiaX = filteredInertia.deltaX * 0.95;
      this.inertiaY = filteredInertia.deltaY * 0.95;
      this._camera.rotate(PHI, THETA);
      this.lastCameraMotionAt = performance.now();
      this._perspectiveMatrixManager.computePerspectiveMatrix(
        canvas,
        this._camera,
        bootSetup.camera_fov_deg,
        bootSetup.camera_near_plane,
        global.insideSphere,
      );
      const lockCorrected = this.enforceAstronomicalRotationLocks();
      if (!lockCorrected) {
        this.enforceCameraNorthUp();
      }
    } else {
      this.inertiaY = 0;
      this.inertiaX = 0;
    }

    const nextFoV = this._healpixGrid.refreshFoV(
      this._camera,
      this._perspectiveMatrixManager.pMatrix,
    );
    if (Number.isFinite(nextFoV.minFoV) && nextFoV.minFoV > 0) {
      this.fov = nextFoV;
      this._camera.refreshFoV(this.fov.minFoV);
      this.prevFov = this.fov.minFoV;
    }

    // Se la camera è ruotata (anche solo per inerzia), aggiorna punto centrale + emetti cameraChanged
    if (cameraRotated) {
      // Ricalcola il punto centrale
      const center = this.updateCentralPoint();
      const centralRaDeg = center.astroDeg.ra;
      const centralDecDeg = center.astroDeg.dec;

      // Evita spam: emetti solo se è cambiato abbastanza
      const raChanged =
        this.prevCentralRaDeg === null ||
        Math.abs(centralRaDeg - this.prevCentralRaDeg) > 1e-5;
      const decChanged =
        this.prevCentralDecDeg === null ||
        Math.abs(centralDecDeg - this.prevCentralDecDeg) > 1e-5;

      if (raChanged || decChanged) {
        this.prevCentralRaDeg = centralRaDeg;
        this.prevCentralDecDeg = centralDecDeg;
      }
    }

    if (this._cameraStatusChanged) {
      const now = performance.now();
      const shouldEmitCameraChanged =
        !this.mouseDown || now - this.lastCameraChangedAt > 100;
      const detail = shouldEmitCameraChanged ? this.getCurrentStatus() : null;
      if (detail) {
        // console.log('[AstroSphere::draw] emitting camera-changed event due to camera status change', detail)
        // console.log('[AstroSphere::draw] inertia', this.zoomInertia, this.inertiaX, this.inertiaY)
        this.canvas.dispatchEvent(
          new CustomEvent<CameraChangedDetail>("camera-changed", {
            detail,
            bubbles: true,
            composed: true,
          }),
        );
        this.lastCameraChangedAt = now;
      }
      if (!this.startup && shouldEmitCameraChanged) {
        this._cameraStatusChanged = false;
      }
    }

    // GL state
    this._webgl.disable(this._webgl.DEPTH_TEST);
    this._webgl.enable(this._webgl.BLEND);
    this._webgl.enable(this._webgl.CULL_FACE);
    this._webgl.cullFace(
      global.insideSphere ? this._webgl.FRONT : this._webgl.BACK,
    );
    this._webgl.blendFunc(
      this._webgl.SRC_ALPHA,
      this._webgl.ONE_MINUS_SRC_ALPHA,
    );

    if (this._activeBaseLayer === "hips" && this._activeHiPSLayers.length > 0) {
      const maxHiPSOrder = Math.max(
        ...this._activeHiPSLayers.map((hips) => hips.maxOrder),
      );

      const visibleOrder = Math.min(
        this._healpixGrid.visibleorder,
        maxHiPSOrder,
      );

      this._healpixGrid.visibleTilesManager.computeVisiblePixels(
        visibleOrder,
        this._webgl,
        this._camera,
        this._perspectiveMatrixManager.pMatrix,
      );
    }

    if (this._activeBaseLayer === "meships" && this._activeMeshHiPS) {
      const visibleOrder = this._activeMeshHiPS.refreshOrder(
        this.fov?.minFoV ?? this._healpixGrid.getMinFoV(),
      );
      this._healpixGrid.visibleTilesManager.computeVisiblePixels(
        visibleOrder,
        this._webgl,
        this._camera,
        this._perspectiveMatrixManager.pMatrix,
      );
    }

    // DRAW HiPS
    const stableFovDeg = this.fov?.minFoV ?? this._healpixGrid.getMinFoV();
    const nowForGrid = performance.now();
    const cameraMovingForGrid =
      this.mouseDown ||
      Math.abs(this.zoomInertia) > 0.0001 ||
      Math.abs(this.inertiaX) > 0.02 ||
      Math.abs(this.inertiaY) > 0.02 ||
      nowForGrid - this.lastCameraMotionAt < 220;

    const skyEntityDrawInput: SkyEntityDrawInput = {
      fovDeg: stableFovDeg,
      camera: this._camera,
      pMatrix: this._perspectiveMatrixManager.pMatrix,
      centerSphericalDeg: this.updateCentralPoint().sphericalDeg,
      fovPolygon: undefined,
      viewportSphericalSamples: undefined,
      cameraMoving: cameraMovingForGrid,
    };

    if (this._activeBaseLayer === "hips") {
      for (const hips of this._activeHiPSLayers) {
        if (hips !== this._activeHiPS) {
          hips.draw(skyEntityDrawInput);
        }
      }

      this._activeHiPS?.draw(skyEntityDrawInput);
    }

    if (this._activeBaseLayer === "xyz") {
      this._activeXYZ2?.draw(skyEntityDrawInput);
    }
    if (this._activeBaseLayer === "meships") {
      this._activeMeshHiPS?.draw(skyEntityDrawInput);
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
      // this.prevFov = this._healpixGrid.getMinFoV();
      this.prevFov = this.fov?.minFoV ?? this._healpixGrid.getMinFoV();
      this._cameraStatusChanged = true;
      console.log("(startup coords)", {
        raDeg: raDecDeg.ra,
        decDeg: raDecDeg.dec,
        raHMS,
        decDMS,
      });
    }

    this.activeCatalogues.forEach((cat) => {
      const activeModelMatrix =
        this._activeHiPS?.getModelMatrix() ??
        this._activeXYZ2?.getModelMatrix() ??
        this._activeMeshHiPS?.getModelMatrix();
      if (activeModelMatrix) {
        cat.draw(
          activeModelMatrix as Float32Array,
          this.mouseHelper,
          this._camera.getCameraMatrix() as Float32Array,
          this._perspectiveMatrixManager.pMatrix as Float32Array,
        );
      }
    });

    this.emitHoveredSourceIfChanged();

    this.activeFootprintSets.forEach((fst) => {
      const activeModelMatrix =
        this._activeHiPS?.getModelMatrix() ??
        this._activeXYZ2?.getModelMatrix() ??
        this._activeMeshHiPS?.getModelMatrix();
      if (activeModelMatrix) {
        fst.draw(
          activeModelMatrix as Float32Array,
          this.mouseHelper,
          this._camera.getCameraMatrix() as Float32Array,
          this._perspectiveMatrixManager.pMatrix as Float32Array,
        );
      }
    });

    this.activePolylineSets.forEach((polylineSet) => {
      const activeModelMatrix =
        this._activeHiPS?.getModelMatrix() ??
        this._activeXYZ2?.getModelMatrix() ??
        this._activeMeshHiPS?.getModelMatrix();
      if (activeModelMatrix) {
        polylineSet.draw(
          activeModelMatrix as Float32Array,
          this.mouseHelper,
          this._camera.getCameraMatrix() as Float32Array,
          this._perspectiveMatrixManager.pMatrix as Float32Array,
        );
      }
    });

    this.activeSensorCones.forEach((sensorCone) => {
      const activeModelMatrix =
        this._activeHiPS?.getModelMatrix() ??
        this._activeXYZ2?.getModelMatrix() ??
        this._activeMeshHiPS?.getModelMatrix();
      if (activeModelMatrix) {
        sensorCone.draw(
          this._perspectiveMatrixManager.pMatrix as Float32Array,
          this._camera.getCameraMatrix() as Float32Array,
          activeModelMatrix as Float32Array,
        );
      }
    });

    this.activeSatelliteObjects.forEach((satelliteObject) => {
      const activeModelMatrix =
        this._activeHiPS?.getModelMatrix() ??
        this._activeXYZ2?.getModelMatrix() ??
        this._activeMeshHiPS?.getModelMatrix();
      if (activeModelMatrix) {
        satelliteObject.draw(
          this._perspectiveMatrixManager.pMatrix as Float32Array,
          this._camera.getCameraMatrix() as Float32Array,
          activeModelMatrix as Float32Array,
        );
      }
    });
  }

  private emitHoveredSourceIfChanged() {
    let nextHoveredSource: Source | null = null;
    let nextHoveredCatalogue: CatalogueGL | null = null;

    for (const cat of this.activeCatalogues) {
      const hovered = cat.getPrimaryHoveredSource();
      if (!hovered) continue;
      nextHoveredSource = hovered;
      nextHoveredCatalogue = cat;
      break;
    }

    const unchanged =
      nextHoveredSource === this.lastHoveredSource &&
      nextHoveredCatalogue === this.lastHoveredCatalogue;
    if (unchanged) return;

    this.lastHoveredSource = nextHoveredSource;
    this.lastHoveredCatalogue = nextHoveredCatalogue;

    this._webgl.canvas.dispatchEvent(
      new CustomEvent("source-hovered", {
        detail: { source: nextHoveredSource, catalogue: nextHoveredCatalogue },
        bubbles: true,
        composed: true,
      }),
    );
  }
}
export default AstroSphere;
