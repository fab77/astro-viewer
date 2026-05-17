import { AbstractSkyEntity } from "../AbstractSkyEntity.js";
import { XYZVisibleTilesManager } from "./XYZVisibleTilesManager.js";
import { xyzFovHelper } from "./XYZFoVHelper.js";
import { ColorMaps } from "../ColorMaps.js";
import { LatLonGrid } from "../grid/LonLatGrid.js";
import { XYZShaderProgram } from "../../shader/XYZShaderProgram.js";
import { XYZTileBuffer } from "./XYZTileBuffer.js";
import { XYZAnchestorTile } from "./XYZAnchestorTile.js";
import { XYZMeshBuilder } from "./XYZMeshBuilder.js";
export class XYZMap extends AbstractSkyEntity {
    _xyzShaderProgram;
    _descriptor;
    _visibleTilesManager;
    _tileBuffer;
    _meshBuilder;
    _baseurl;
    _zoom;
    _latLonGrid;
    _colorMapIdx = 0;
    _colorMap = ColorMaps['native'];
    constructor(radius, position, xrad, yrad, descriptor, webgl) {
        super(radius, position, xrad, yrad, descriptor.name, webgl, false);
        this._descriptor = descriptor;
        this._xyzShaderProgram = new XYZShaderProgram(webgl);
        this._meshBuilder = new XYZMeshBuilder();
        this._tileBuffer = new XYZTileBuffer(1);
        this.initGL(webgl);
        this._latLonGrid = new LatLonGrid(radius, position, xrad, yrad, 'LatLonGrid', this._webgl);
        this._visibleTilesManager = new XYZVisibleTilesManager();
        this._baseurl = descriptor.url;
        this.initShaders();
        const fov = 180;
        this._zoom = xyzFovHelper.getZoom(fov);
    }
    changeColorMap(colorMap) {
        this._colorMap = colorMap;
        switch (colorMap.name) {
            case 'grayscale':
                this._colorMapIdx = 1;
                this._colorMap = ColorMaps['grayscale'];
                break;
            case 'planck':
                this._colorMapIdx = 2;
                this._colorMap = ColorMaps['planck'];
                break;
            case 'cmb':
                this._colorMapIdx = 3;
                this._colorMap = ColorMaps['cmb'];
                break;
            case 'rainbow':
                this._colorMapIdx = 4;
                this._colorMap = ColorMaps['rainbow'];
                break;
            case 'eosb':
                this._colorMapIdx = 5;
                this._colorMap = ColorMaps['eosb'];
                break;
            case 'cubehelix':
                this._colorMapIdx = 6;
                this._colorMap = ColorMaps['cubehelix'];
                break;
            case 'hot':
                this._colorMapIdx = 7;
                this._colorMap = ColorMaps['hot'];
                break;
            case 'gray':
                this._colorMapIdx = 8;
                this._colorMap = ColorMaps['gray'];
                break;
            case 'native':
                this._colorMapIdx = 0;
                this._colorMap = ColorMaps['native'];
                break;
            default:
                this._colorMapIdx = 9;
                this._colorMap = colorMap;
        }
    }
    initShaders() {
        this._xyzShaderProgram.enableProgram();
    }
    refresh(input) {
        // const fov = healpixGridSingleton.getMinFoV()
        const fov = this._latLonGrid.refreshFoV(input);
        this._zoom = xyzFovHelper.getZoom(fov);
    }
    draw(input) {
        const vMatrix = input.camera.getCameraMatrix();
        if (!vMatrix)
            return;
        const pMatrix = input.pMatrix;
        if (!pMatrix)
            return;
        this.refresh(input);
        const mMatrix = this.getModelMatrix();
        this._xyzShaderProgram.setRuntimeColorMap(this._colorMap);
        const tileSelection = this._visibleTilesManager.computeVisibleTiles(this._zoom, this, this._webgl, input.camera, input.pMatrix);
        const visibleTiles = tileSelection.visibleTiles;
        const ancestorsMap = tileSelection.ancestorsMap;
        const tileKeys = this._tileBuffer.ensureTiles(this.getTilesToEnsure(visibleTiles, ancestorsMap), (coord) => this.createTile(coord));
        for (const tileKey of tileKeys) {
            const tile = this._tileBuffer.getActiveTile(tileKey);
            if (!tile || tile.coord.z !== tileSelection.currentZoom) {
                continue;
            }
            const drawn = tile.draw(pMatrix, vMatrix, mMatrix, this._colorMapIdx);
            if (drawn) {
                continue;
            }
            const ancestorTile = this.findBestAvailableAncestor(tile.coord);
            ancestorTile?.draw(tileSelection.currentZoom, [tile.coord], ancestorsMap, pMatrix, vMatrix, mMatrix, this._colorMapIdx);
        }
        this._latLonGrid.draw(input);
    }
    createTile(coord) {
        return new XYZAnchestorTile(coord, this.resolveTileUrl(coord), this._webgl, this._xyzShaderProgram, this._meshBuilder, this._descriptor.segmentsPerSide);
    }
    getTilesToEnsure(visibleTiles, ancestorsMap) {
        const tilesByKey = new Map();
        for (const tile of visibleTiles) {
            tilesByKey.set(this.tileKey(tile), tile);
        }
        for (const ancestor of ancestorsMap.values()) {
            tilesByKey.set(this.tileKey(ancestor), ancestor);
        }
        return Array.from(tilesByKey.values());
    }
    findBestAvailableAncestor(targetTile) {
        for (let z = targetTile.z - 1; z >= 0; z--) {
            const dz = targetTile.z - z;
            const ancestorCoord = {
                z,
                x: targetTile.x >> dz,
                y: targetTile.y >> dz,
            };
            const ancestorTile = this._tileBuffer.getAnyTile(this.tileKey(ancestorCoord));
            if (ancestorTile?.ready) {
                return ancestorTile;
            }
        }
        return null;
    }
    resolveTileUrl(tile) {
        const dim = 2 ** tile.z;
        const y = this._descriptor.flipY ? dim - 1 - tile.y : tile.y;
        const subdomains = this._descriptor.subdomains;
        const subdomain = subdomains.length > 0
            ? subdomains[Math.abs(tile.x + tile.y + tile.z) % subdomains.length]
            : '';
        return this._baseurl
            .replace(/\{z\}/g, String(tile.z))
            .replace(/\{x\}/g, String(tile.x))
            .replace(/\{y\}/g, String(y))
            .replace(/\{s\}/g, subdomain ?? '');
    }
    tileKey(tile) {
        return `${tile.z}/${tile.x}/${tile.y}`;
    }
}
