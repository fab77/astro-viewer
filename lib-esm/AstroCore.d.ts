import { HiPSDescriptor } from './model/hips/HiPSDescriptor.js';
export declare class AstroCore {
    private astroSphere;
    private canvas;
    private webgl;
    private rafId;
    constructor();
    activateHiPS(hipsDescriptor: HiPSDescriptor): void;
    init(): void;
    private initListeners;
    run(): number;
    private tick;
    private drawScene;
}
//# sourceMappingURL=AstroCore.d.ts.map