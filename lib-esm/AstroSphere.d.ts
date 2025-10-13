import { HiPSDescriptor } from './model/hips/HiPSDescriptor.js';
import { FoV } from './model/FoV.js';
import Point from './model/Point.js';
import CatalogueGL from './model/catalogues/CatalogueGL.js';
/**
 * AstroSphere — main WebGL scene controller (TS port)
 */
declare class AstroSphere {
    private camera;
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
    private insideSphere;
    private fov;
    constructor(canvas: HTMLCanvasElement, webgl: WebGL2RenderingContext);
    private init;
    private initCamera;
    private addEventListeners;
    getPhiThetaDeg(canvas: HTMLCanvasElement): import("./utils/Utils.js").SphericalCoords;
    activateHiPS(hipsDescriptor: HiPSDescriptor, insideSphere: boolean): void;
    private activeCatalogues;
    showCatalogue(catalogue: CatalogueGL): Promise<CatalogueGL | undefined>;
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