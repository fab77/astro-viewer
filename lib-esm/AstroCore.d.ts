import { HiPSDescriptor } from './model/hips/HiPSDescriptor.js';
import { FoV } from './model/FoV.js';
export declare class AstroCore {
    private astroSphere;
    private canvas;
    private webgl;
    private rafId;
    run(): number;
    activateHiPS(hipsDescriptor: HiPSDescriptor, insideSphere: boolean): void;
    goTo(raDeg: number, decDeg: number): void;
    getFoV(): FoV;
    changeFoV(deg: number): void;
    changeFoV2(deg: number): void;
    changeFoV3(deg: number): void;
    getInsideSphere(): boolean;
    toggleInsideSphere(): void;
    constructor();
    private init;
    private initListeners;
    private tick;
    private drawScene;
}
//# sourceMappingURL=AstroCore.d.ts.map