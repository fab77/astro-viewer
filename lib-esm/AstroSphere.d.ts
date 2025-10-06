import HiPSDescriptor from './model/hips/HiPSDescriptor.js';
/**
 * AstroSphere — main WebGL scene controller (TS port)
 */
declare class AstroSphere {
    private camera;
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
    constructor(canvas: HTMLCanvasElement, webgl: WebGL2RenderingContext);
    private init;
    private initCamera;
    refreshFoV(): void;
    getFoV(): void;
    private addEventListeners;
    getPhiThetaDeg(canvas: HTMLCanvasElement): import("./utils/Utils.js").SphericalCoords;
    activateHiPS(hipsDescriptor: HiPSDescriptor): void;
    setViewport(gl: WebGLRenderingContext): void;
    draw(canvas: HTMLCanvasElement): void;
}
export default AstroSphere;
//# sourceMappingURL=AstroSphere.d.ts.map