import Camera from './Camera.js';
import { AstroCoords, HMS, SphericalCoords, DMS } from './utils/Utils.js';
import { HiPSDescriptor } from './model/hips/HiPSDescriptor.js';
import { FoV } from './model/FoV.js';
import { Point } from './model/Point.js';
import { CatalogueGL } from './model/catalogues/CatalogueGL.js';
import { FootprintSetGL, HoveredFootprintDetail } from './model/footprints/FootprintSetGL.js';
import { EquatorialGrid } from './model/grid/EquatorialGrid.js';
import { HealpixGrid } from './model/grid/HealpixGrid.js';
export type PointCoordinates = {
    astroDeg: AstroCoords;
    raHMS: HMS;
    decDMS: DMS;
    sphericalDeg: SphericalCoords;
};
export type CameraChangedDetail = {
    fovDeg: number;
    position: [number, number, number];
    vMatrix: Float32Array;
    pMatrix: Float32Array;
    mMatrix: Float32Array;
    camera: Camera;
    timestamp: number;
    centralPoint: Point;
    mouseHoverPoint: PointCoordinates | undefined;
};
/**
 * AstroSphere — main WebGL scene controller (TS port)
 */
declare class AstroSphere {
    private _camera;
    private _perspectiveMatrixManager;
    private centralPoinCoords;
    private mousePointCoords;
    private canvas;
    private _healpixGrid;
    private _equatorialGrid;
    private mouseHelper;
    private mouseDown;
    private lastMouseX;
    private lastMouseY;
    private inertiaX;
    private inertiaY;
    private zoomInertia;
    private activeHiPS;
    private startup;
    private fov;
    private activeCatalogues;
    private activeFootprintSets;
    private _webgl;
    constructor(canvas: HTMLCanvasElement, webgl: WebGL2RenderingContext);
    private initCamera;
    setCamera(camera: Camera): void;
    get healpixGrid(): HealpixGrid;
    get equatorialGrid(): EquatorialGrid;
    private updateCentralPoint;
    private updateLastMousePoint;
    getCentralPointCoordinates(): PointCoordinates | undefined;
    getLastMousePointCoordinates(): PointCoordinates | undefined;
    private _rotating;
    private addEventListeners;
    getPhiThetaDeg(canvas: HTMLCanvasElement): SphericalCoords;
    activateHiPS(hipsDescriptor: HiPSDescriptor): void;
    showCatalogue(cat: CatalogueGL): Promise<CatalogueGL>;
    deleteCatalogue(catalogue: CatalogueGL): void;
    showFootprintSet(fset: FootprintSetGL): Promise<FootprintSetGL>;
    deleteFootprintSet(footprintSet: FootprintSetGL): void;
    getHoveredFootprints(): HoveredFootprintDetail[];
    goTo(raDeg: number, decDeg: number): void;
    getFoV(): FoV;
    getFoVPolygon(): Point[];
    changeFoV(deg: number): void;
    changeFoV2(deg: number): void;
    changeFoV3(deg: number): void;
    getInsideSphere(): boolean;
    toggleInsideSphere(): void;
    setCameraPosition(pos: [number, number, number]): void;
    setCameraMatrix(viewMatrix: Float32Array): void;
    applyFullCameraState(detail: CameraChangedDetail): void;
    private prevFov;
    private prevCentralRaDeg;
    private prevCentralDecDeg;
    draw(canvas: HTMLCanvasElement): void;
}
export default AstroSphere;
//# sourceMappingURL=AstroSphere.d.ts.map