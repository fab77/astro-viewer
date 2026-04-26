'use strict';
/**
 * @author Fabrizio Giordano (Fab77)
 */
import { AbstractSkyEntity } from '../AbstractSkyEntity.js';
import { fovHelper } from './FoVHelper.js';
import ColorMaps from '../ColorMaps.js';
// import { hipsShaderProgram } from '../../shader/HiPSShaderProgram.js'
// import { HiPSShaderProgram } from '../../shader/HiPSShaderProgram.js'
import AncestorTile from './AncestorTile.js';
import AllSky from './AllSky.js';
export class HiPS extends AbstractSkyEntity {
    _ancestorTiles;
    _allSkyTile;
    _descriptor;
    _format;
    _baseurl;
    _maxorder;
    _minorder;
    _visibleorder = 3;
    _allSky = true;
    samplerIdx = 0;
    colorMapIdx = 0;
    colorMap = ColorMaps['native'];
    _healpixGrid;
    // exposed read-only helpers
    get maxOrder() { return this._maxorder; }
    get minOrder() { return this._minorder; }
    get baseURL() { return this._baseurl; }
    get format() { return this._format; }
    get propertiesRawText() { return this._descriptor.propertiesRawText; }
    get properties() { return this._descriptor.properties; }
    constructor(radius, position, xrad, yrad, descriptor, webgl, healpixGrid) {
        super(radius, position, xrad, yrad, descriptor.surveyName, webgl, descriptor.isGalactic);
        this._descriptor = descriptor;
        // this.initGL((global as any).gl as WebGL2RenderingContext)
        this.initGL(webgl);
        this._healpixGrid = healpixGrid;
        // newTileBuffer.addHiPS(this)
        this._healpixGrid.visibleTilesManager.tileBuffer.addHiPS(this);
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
            this._allSkyTile = new AllSky(this, this._webgl, this._healpixGrid.visibleTilesManager.tileBuffer, super.hipsShaderProgram);
        }
        else {
            for (let t = 0; t < 12; t++) {
                this._ancestorTiles.push(new AncestorTile(t, 0, this, this._healpixGrid.visibleTilesManager.tileBuffer, super.hipsShaderProgram, this._webgl));
            }
        }
    }
    getProperty(key) {
        return this._descriptor.getProperty(key);
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
            ? this._healpixGrid.visibleTilesManager.galVisibleTilesByOrder
            : this._healpixGrid.visibleTilesManager.visibleTilesByOrder;
        // const pixelByOrder =
        //   this.isGalacticHips
        //     ? visibleTilesManager.galVisibleTilesByOrder
        //     : visibleTilesManager.visibleTilesByOrder
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
        console.log('HiPS.changeColorMap -> shaderProgram', super.hipsShaderProgram.shaderProgram);
        this.colorMap = colorMap;
        switch (colorMap.name) {
            case 'grayscale':
                this.colorMapIdx = 1;
                // hipsShaderProgram.setGrayscaleShader()
                this.colorMap = ColorMaps['grayscale'];
                super.hipsShaderProgram.setGrayscaleShader();
                break;
            case 'planck':
                this.colorMapIdx = 2;
                this.colorMap = ColorMaps['planck'];
                // hipsShaderProgram.setColorMapShader()
                super.hipsShaderProgram.setColorMapShader();
                break;
            case 'cmb':
                this.colorMapIdx = 3;
                this.colorMap = ColorMaps['cmb'];
                // hipsShaderProgram.setColorMapShader()
                super.hipsShaderProgram.setColorMapShader();
                break;
            case 'rainbow':
                this.colorMapIdx = 4;
                this.colorMap = ColorMaps['rainbow'];
                // hipsShaderProgram.setColorMapShader()
                super.hipsShaderProgram.setColorMapShader();
                break;
            case 'eosb':
                this.colorMapIdx = 5;
                this.colorMap = ColorMaps['eosb'];
                super.hipsShaderProgram.setColorMapShader();
                // hipsShaderProgram.setColorMapShader()
                break;
            case 'cubehelix':
                this.colorMapIdx = 6;
                this.colorMap = ColorMaps['cubehelix'];
                super.hipsShaderProgram.setColorMapShader();
                // hipsShaderProgram.setColorMapShader()
                break;
            case 'hot':
                this.colorMapIdx = 7;
                this.colorMap = ColorMaps['hot'];
                super.hipsShaderProgram.setColorMapShader();
                // hipsShaderProgram.setColorMapShader()
                break;
            case 'gray':
                this.colorMapIdx = 8;
                this.colorMap = ColorMaps['gray'];
                super.hipsShaderProgram.setColorMapShader();
                // hipsShaderProgram.setColorMapShader()
                break;
            case 'native':
                this.colorMapIdx = 0;
                this.colorMap = ColorMaps['native'];
                super.hipsShaderProgram.setNativeShader();
                break;
            default:
                this.colorMapIdx = 9;
                this.colorMap = colorMap;
                super.hipsShaderProgram.setColorMapShader();
        }
    }
    initShaders() {
        super.hipsShaderProgram.enableProgram();
        // hipsShaderProgram.enableProgram()
        // this.shaderProgram = super.hipsShaderProgram.shaderProgram
        // this.shaderProgram = hipsShaderProgram.shaderProgram
    }
    getCurrentHealpixOrder() {
        return this._visibleorder;
    }
    refresh() {
        // const fov = healpixGridSingleton.getMinFoV()
        const fov = this._healpixGrid.getMinFoV();
        this._visibleorder = Math.min(fovHelper.getHiPSNorder(fov), this._maxorder);
    }
    draw(input) {
        const vMatrix = input.camera.getCameraMatrix();
        if (!vMatrix)
            return;
        const pMatrix = input.pMatrix;
        if (!pMatrix)
            return;
        this.refresh();
        // const pMatrix = computePerspectiveMatrixSingleton.pMatrix as Float32Array
        const mMatrix = this.getModelMatrix();
        super.hipsShaderProgram.setRuntimeColorMap(this.colorMap);
        if (this._allSky && this._allSkyTile) {
            if (this.isGalacticHips) {
                this._allSkyTile.draw(this._healpixGrid.visibleTilesManager.galVisibleTilesByOrder.order, this._healpixGrid.visibleTilesManager.galAncestorsMap, 
                // visibleTilesManager.galVisibleTilesByOrder.order,
                // visibleTilesManager.galAncestorsMap,
                pMatrix, vMatrix, mMatrix, this.colorMapIdx);
            }
            else {
                this._allSkyTile.draw(this._healpixGrid.visibleTilesManager.visibleTilesByOrder.order, this._healpixGrid.visibleTilesManager.ancestorsMap, 
                // visibleTilesManager.visibleTilesByOrder.order,
                // visibleTilesManager.ancestorsMap,
                pMatrix, vMatrix, mMatrix, this.colorMapIdx);
            }
            return;
        }
        // Non all-sky path
        const order = this.isGalacticHips
            ? this._healpixGrid.visibleTilesManager.galVisibleTilesByOrder.order
            : this._healpixGrid.visibleTilesManager.visibleTilesByOrder.order;
        // ? visibleTilesManager.galVisibleTilesByOrder.order
        // : visibleTilesManager.visibleTilesByOrder.order
        const map = this.isGalacticHips
            ? this._healpixGrid.visibleTilesManager.galAncestorsMap
            : this._healpixGrid.visibleTilesManager.ancestorsMap;
        // ? visibleTilesManager.galAncestorsMap
        // : visibleTilesManager.ancestorsMap
        this._ancestorTiles.forEach((ancestor) => {
            ancestor.draw(order, map, pMatrix, vMatrix, mMatrix, this.colorMapIdx);
        });
    }
}
