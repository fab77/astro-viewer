// AstroCoreEntryPoint.ts
import global from './Global.js';
import AstroSphere from './AstroSphere.js';
export class AstroCore {
    astroSphere;
    canvas;
    webgl;
    rafId = null;
    constructor() {
        this.init();
    }
    activateHiPS(hipsDescriptor) {
        this.astroSphere.activateHiPS(hipsDescriptor);
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
    run() {
        return this.tick();
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