import { HiPSDescriptor } from './model/hips/HiPSDescriptor.js';
import { FoV } from './model/FoV.js';
import Point from './model/Point.js';
import CatalogueGL from './model/catalogues/CatalogueGL.js';
import type { PointCoordinates } from './AstroSphere.js';
export declare class AstroCore {
    private astroSphere;
    private canvas;
    private webgl;
    private rafId;
    run(): number;
    showCatalogue(catalogue: CatalogueGL): void;
    hideCatalogue(catalogue: CatalogueGL, isVisible: boolean): void;
    deleteCatalogue(catalogue: CatalogueGL): void;
    changeCatalogueColor(catalogue: CatalogueGL, hexColor: string): void;
    setCatalogueShapeHue(catalogue: CatalogueGL, metadataColumnName: string): void;
    setCatalogueShapeSize(catalogue: CatalogueGL, metadataColumnName: string): void;
    activateHiPS(hipsDescriptor: HiPSDescriptor): void;
    goTo(raDeg: number, decDeg: number): void;
    getCenterCoordinates(): PointCoordinates | undefined;
    getCoordinatesFromMouse(): PointCoordinates | undefined;
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