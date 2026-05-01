export class XYZVisibleTilesManager {
    _provider;
    constructor(provider) {
        this._provider = provider;
    }
    selectTiles(input) {
        const currentZoom = this._provider.resolveZoom(input.fovDeg ?? 180);
        const currentTiles = this._provider.getVisibleTilesAtZoom(currentZoom, input.centerSphericalDeg ?? null, input.fovPolygon ?? [], input.viewportSphericalSamples ?? [], 1);
        const fallbackMap = new Map();
        for (let z = currentZoom - 1; z >= this._provider.minZoom; z--) {
            const dz = currentZoom - z;
            for (const tile of currentTiles) {
                const fallback = {
                    z,
                    x: tile.x >> dz,
                    y: tile.y >> dz,
                };
                fallbackMap.set(`${fallback.z}/${fallback.x}/${fallback.y}`, fallback);
            }
        }
        const key = `${currentZoom}:${currentTiles.map((tile) => `${tile.x}/${tile.y}`).join('|')}`;
        return {
            key,
            currentTiles,
            fallbackTiles: Array.from(fallbackMap.values()),
        };
    }
}
