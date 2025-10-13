import { HiPSDescriptor } from './model/hips/HiPSDescriptor.js';
import { FoV } from './model/FoV.js';
import Point from './model/Point.js';
import CatalogueGL from './model/catalogues/CatalogueGL.js';
export declare class AstroCore {
    private astroSphere;
    private canvas;
    private webgl;
    private rafId;
    run(): number;
    showCatalogue(catalogue: CatalogueGL): void;
    activateHiPS(hipsDescriptor: HiPSDescriptor, insideSphere: boolean): void;
    goTo(raDeg: number, decDeg: number): void;
    getFoV(): FoV;
    getFoVPolygon(): Point[];
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