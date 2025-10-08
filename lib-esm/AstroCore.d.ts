import { HiPSDescriptor } from './model/hips/HiPSDescriptor.js';
import { FoV } from './model/FoV.js';
export declare class AstroCore {
    private astroSphere;
    private canvas;
    private webgl;
    private rafId;
    run(): number;
    activateHiPS(hipsDescriptor: HiPSDescriptor, insideSphere: boolean): void;
    getFoV(): FoV;
    changeFoV(deg: number): void;
    getInsideSphere(): boolean;
    toggleInsideSphere(): void;
    constructor();
    private init;
    private initListeners;
    private tick;
    private drawScene;
}
//# sourceMappingURL=AstroCore.d.ts.map