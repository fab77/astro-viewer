'use strict';
/**
 * @author Fabrizio Giordano (Fab77)
 */
import AbstractSkyEntity from '../AbstractSkyEntity.js';
import { fovHelper } from './FoVHelper.js';
import { newTileBuffer } from './TileBuffer.js';
import ColorMaps from '../ColorMaps.js';
import { hipsShaderProgram } from '../../shader/HiPSShaderProgram.js';
import AncestorTile from './AncestorTile.js';
import { visibleTilesManager } from './VisibleTilesManager.js';
import AllSky from './AllSky.js';
import healpixGridSingleton from '../grid/HealpixGridSingleton.js';
import global from '../../Global.js';
import computePerspectiveMatrixSingleton from '../../utils/ComputePerspectiveMatrix.js';
class HiPS extends AbstractSkyEntity {
    _ancestorTiles;
    _allSkyTile;
    _format;
    _baseurl;
    _maxorder;
    _minorder;
    _visibleorder = 3;
    _allSky = true;
    samplerIdx = 0;
    colorMapIdx = 0;
    colorMap = ColorMaps['native'];
    // exposed read-only helpers
    get maxOrder() { return this._maxorder; }
    get minOrder() { return this._minorder; }
    get baseURL() { return this._baseurl; }
    get format() { return this._format; }
    constructor(radius, position, xrad, yrad, descriptor) {
        super(radius, position, xrad, yrad, descriptor.surveyName, descriptor.isGalactic);
        this.initGL(global.gl);
        newTileBuffer.addHiPS(this);
        // DEBUG logs kept from JS (optional)
        // eslint-disable-next-line no-console
        console.log('HiPS frame ' + descriptor.hipsFrame);
        // eslint-disable-next-line no-console
        console.log('HiPS minOrder ' + descriptor.minOrder);
        this._format = descriptor.imgFormats[0];
        this._baseurl = descriptor.url;
        this._maxorder = descriptor.maxOrder;
        this._minorder = descriptor.minOrder;
        this.initShaders();
        // pick initial order from a starting FoV
        const fov = 180;
        let order = fovHelper.getHiPSNorder(fov);
        this._visibleorder = Math.min(order, this._maxorder);
        this._ancestorTiles = [];
        this._allSkyTile = null;
        // auto-detect all-sky: original code forces true
        this._allSky = true;
        if (this._allSky) {
            this._allSkyTile = new AllSky(this);
        }
        else {
            for (let t = 0; t < 12; t++) {
                this._ancestorTiles.push(new AncestorTile(t, 0, this));
            }
        }
    }
    changeFormat(format) {
        this._format = format;
        // original code referenced _tileBuffer; if you have one, wire it back.
        // Keeping calls no-op to avoid breaking at runtime if _tileBuffer is undefined.
        // (newVisibleTilesManager + TileBuffer drive the actual tile lifecycle)
        // @ts-ignore
        if (this._tileBuffer?.clearAll)
            this._tileBuffer.clearAll();
        // @ts-ignore
        if (this._tileBuffer)
            this._tileBuffer._format = this._format;
        const pixelByOrder = this.isGalacticHips
            ? visibleTilesManager.galVisibleTilesByOrder
            : visibleTilesManager.visibleTilesByOrder;
        // @ts-ignore
        if (this._tileBuffer?.updateTiles)
            this._tileBuffer.updateTiles(pixelByOrder.pixels, pixelByOrder.order);
    }
    /**
     * Shader colormap switcher
     * 0 -> native
     * 1 -> grayscale
     * 2 -> planck
     * 3 -> cmb
     * 4 -> rainbow
     * 5 -> eosb
     * 6 -> cubehelix
     */
    changeColorMap(colorMap) {
        this.colorMap = colorMap;
        switch (colorMap.name) {
            case 'grayscale':
                this.colorMapIdx = 1;
                hipsShaderProgram.setGrayscaleShader();
                break;
            case 'planck':
                this.colorMapIdx = 2;
                hipsShaderProgram.setColorMapShader();
                break;
            case 'cmb':
                this.colorMapIdx = 3;
                hipsShaderProgram.setColorMapShader();
                break;
            case 'rainbow':
                this.colorMapIdx = 4;
                hipsShaderProgram.setColorMapShader();
                break;
            case 'eosb':
                this.colorMapIdx = 5;
                hipsShaderProgram.setColorMapShader();
                break;
            case 'cubehelix':
                this.colorMapIdx = 6;
                hipsShaderProgram.setColorMapShader();
                break;
            default:
                this.colorMapIdx = 0;
                hipsShaderProgram.setNativeShader();
        }
    }
    initShaders() {
        hipsShaderProgram.enableProgram();
        this.shaderProgram = hipsShaderProgram.shaderProgram;
    }
    getCurrentHealpixOrder() {
        return this._visibleorder;
    }
    refresh() {
        const fov = healpixGridSingleton.getMinFoV();
        this._visibleorder = Math.min(fovHelper.getHiPSNorder(fov), this._maxorder);
    }
    draw() {
        if (!global.camera || global.camera.getCameraMatrix() === undefined)
            return;
        this.refresh();
        const vMatrix = global.camera.getCameraMatrix();
        const pMatrix = computePerspectiveMatrixSingleton.pMatrix;
        const mMatrix = this.getModelMatrix();
        if (this._allSky && this._allSkyTile) {
            if (this.isGalacticHips) {
                this._allSkyTile.draw(visibleTilesManager.galVisibleTilesByOrder.order, visibleTilesManager.galAncestorsMap, pMatrix, vMatrix, mMatrix, this.colorMapIdx);
            }
            else {
                this._allSkyTile.draw(visibleTilesManager.visibleTilesByOrder.order, visibleTilesManager.ancestorsMap, pMatrix, vMatrix, mMatrix, this.colorMapIdx);
            }
            return;
        }
        // Non all-sky path
        const order = this.isGalacticHips
            ? visibleTilesManager.galVisibleTilesByOrder.order
            : visibleTilesManager.visibleTilesByOrder.order;
        const map = this.isGalacticHips
            ? visibleTilesManager.galAncestorsMap
            : visibleTilesManager.ancestorsMap;
        this._ancestorTiles.forEach((ancestor) => {
            ancestor.draw(order, map, pMatrix, vMatrix, mMatrix, this.colorMapIdx);
        });
    }
}
export default HiPS;
//# sourceMappingURL=HiPS.js.map