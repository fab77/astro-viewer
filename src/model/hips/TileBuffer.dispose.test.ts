import { jest } from "@jest/globals";
import { TileBuffer } from "./TileBuffer.js";

describe("TileBuffer disposal", () => {
  it("does not acquire detailed tiles for zero-opacity HiPS layers", () => {
    const hidden = {
      opacity: 0,
      maxOrder: 10,
      intersectsCoverage: jest.fn(() => true),
    };
    const visible = {
      opacity: 0.5,
      maxOrder: 10,
      intersectsCoverage: jest.fn(() => true),
    };
    const getTile = jest.fn();
    const subject = Object.create(TileBuffer.prototype) as TileBuffer &
      Record<string, unknown>;

    Object.assign(subject, {
      _tileAcquisitionEnabled: true,
      _activeHiPS: new Map([
        [hidden, new Map()],
        [visible, new Map()],
      ]),
      getTile,
    });

    subject.addTile(4, 12);

    expect(hidden.intersectsCoverage).not.toHaveBeenCalled();
    expect(visible.intersectsCoverage).toHaveBeenCalledWith(4, 12);
    expect(getTile).toHaveBeenCalledTimes(1);
    expect(getTile).toHaveBeenCalledWith(12, 4, visible);
  });

  it("checks active tile visibility from the central cache timer", () => {
    const equatorial = { amIStillInFoV: jest.fn() };
    const galactic = { amIStillInFoV: jest.fn() };
    const subject = Object.create(TileBuffer.prototype) as TileBuffer &
      Record<string, unknown>;

    Object.assign(subject, {
      _tiles: new Map([["equatorial", equatorial]]),
      _cachedTiles: new Map(),
      _galTiles: new Map([["galactic", galactic]]),
      _galCachedTiles: new Map(),
      _cacheAliveMilliSeconds: 60_000,
    });

    (subject as any).cacheCleaner();

    expect(equatorial.amIStillInFoV).toHaveBeenCalledTimes(1);
    expect(galactic.amIStillInFoV).toHaveBeenCalledTimes(1);
  });

  it("disposes every active and cached tile belonging to a removed HiPS", () => {
    const activeTile = { dispose: jest.fn() };
    const cachedTile = { dispose: jest.fn() };
    const galacticTile = { dispose: jest.fn() };
    const galacticCachedTile = { dispose: jest.fn() };
    const unrelatedTile = { dispose: jest.fn() };
    const subject = Object.create(TileBuffer.prototype) as TileBuffer &
      Record<string, unknown>;

    Object.assign(subject, {
      _tiles: new Map([
        ["5#1#https://example.test/target#jpg", activeTile],
        ["5#2#https://example.test/other#jpg", unrelatedTile],
      ]),
      _cachedTiles: new Map([
        ["5#3#https://example.test/target#jpg", cachedTile],
      ]),
      _galTiles: new Map([
        ["5#4#https://example.test/target#jpg", galacticTile],
      ]),
      _galCachedTiles: new Map([
        ["5#5#https://example.test/target#jpg", galacticCachedTile],
      ]),
    });

    subject.invalidateHiPS({
      baseURL: "https://example.test/target",
    } as never);

    expect(activeTile.dispose).toHaveBeenCalledTimes(1);
    expect(cachedTile.dispose).toHaveBeenCalledTimes(1);
    expect(galacticTile.dispose).toHaveBeenCalledTimes(1);
    expect(galacticCachedTile.dispose).toHaveBeenCalledTimes(1);
    expect(unrelatedTile.dispose).not.toHaveBeenCalled();
  });
});
