import { AstroCoords, HMS, SphericalCoords, DMS } from './utils/Utils.js';
import { HiPSDescriptor } from './model/hips/HiPSDescriptor.js';
import { FoV } from './model/FoV.js';
import Point from './model/Point.js';
import CatalogueGL from './model/catalogues/CatalogueGL.js';
export type PointCoordinates = {
    astroDeg: AstroCoords;
    raHMS: HMS;
    decDMS: DMS;
    sphericalDeg: SphericalCoords;
};
/**
 * AstroSphere — main WebGL scene controller (TS port)
 */
declare class AstroSphere {
    private camera;
    private centralPoinCoords;
    private mousePointCoords;
    private canvas;
    private showHPXGrid;
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
    constructor(canvas: HTMLCanvasElement, webgl: WebGL2RenderingContext);
    private updateCentralPoint;
    private updateLastMousePoint;
    getCentralPointCoordinates(): PointCoordinates | undefined;
    getLastMousePointCoordinates(): PointCoordinates | undefined;
    private init;
    private initCamera;
    private addEventListeners;
    getPhiThetaDeg(canvas: HTMLCanvasElement): SphericalCoords;
    activateHiPS(hipsDescriptor: HiPSDescriptor): void;
    showCatalogue(catalogue: CatalogueGL): Promise<CatalogueGL | undefined>;
    hideCatalogue(catalogue: CatalogueGL, isVisible: boolean): void;
    deleteCatalogue(catalogue: CatalogueGL): void;
    changeCatalogueColor(catalogue: CatalogueGL, hexColor: string): void;
    setCatalogueShapeHue(catalogue: CatalogueGL, metadataColumnName: string): void;
    setCatalogueShapeSize(catalogue: CatalogueGL, metadataColumnName: string): void;
    goTo(raDeg: number, decDeg: number): void;
    getFoV(): FoV;
    getFoVPolygon(): Point[];
    changeFoV(deg: number): void;
    changeFoV2(deg: number): void;
    changeFoV3(deg: number): void;
    getInsideSphere(): boolean;
    toggleInsideSphere(): void;
    draw(canvas: HTMLCanvasElement): void;
}
export default AstroSphere;
//# sourceMappingURL=AstroSphere.d.ts.map