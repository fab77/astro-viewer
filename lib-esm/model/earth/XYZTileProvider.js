export class XYZTileProvider {
    _config;
    constructor(config) {
        this._config = config;
    }
    get config() {
        return this._config;
    }
    getInitialTiles() {
        const z = Math.max(0, Math.floor(this._config.fixedZoom ?? 1));
        const dim = 2 ** z;
        const tiles = [];
        for (let x = 0; x < dim; x++) {
            for (let y = 0; y < dim; y++) {
                tiles.push({ z, x, y });
            }
        }
        return tiles;
    }
    getTileUrl(tile) {
        return this._config.urlTemplate
            .replace(/\{z\}/g, String(tile.z))
            .replace(/\{x\}/g, String(tile.x))
            .replace(/\{y\}/g, String(tile.y));
    }
}
