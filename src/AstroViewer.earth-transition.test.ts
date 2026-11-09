import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { AstroViewer } from "./AstroViewer.js";

describe("AstroViewer Earth raster transitions", () => {
  let callbacks: Map<number, FrameRequestCallback>;
  let nextFrameId: number;
  let originalRequestAnimationFrame: typeof requestAnimationFrame | undefined;
  let originalCancelAnimationFrame: typeof cancelAnimationFrame | undefined;

  beforeEach(() => {
    callbacks = new Map();
    nextFrameId = 1;
    originalRequestAnimationFrame = globalThis.requestAnimationFrame;
    originalCancelAnimationFrame = globalThis.cancelAnimationFrame;
    globalThis.requestAnimationFrame = ((callback: FrameRequestCallback) => {
      const id = nextFrameId++;
      callbacks.set(id, callback);
      return id;
    }) as typeof requestAnimationFrame;
    globalThis.cancelAnimationFrame = ((id: number) => {
      callbacks.delete(id);
    }) as typeof cancelAnimationFrame;
  });

  afterEach(() => {
    if (originalRequestAnimationFrame) {
      globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    } else {
      delete (globalThis as { requestAnimationFrame?: typeof requestAnimationFrame })
        .requestAnimationFrame;
    }
    if (originalCancelAnimationFrame) {
      globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
    } else {
      delete (globalThis as { cancelAnimationFrame?: typeof cancelAnimationFrame })
        .cancelAnimationFrame;
    }
  });

  function runFrame(now: number): void {
    const pending = [...callbacks.values()];
    callbacks.clear();
    for (const callback of pending) callback(now);
  }

  function createSubject(baseOpacity: number | null = 0.25) {
    const subject = Object.create(AstroViewer.prototype) as AstroViewer;
    const astroSphere = {
      getEarthBaseMapOpacity: jest.fn(() => baseOpacity),
      setEarthBaseMapOpacity: jest.fn(),
      getEarthRasterOverlays: jest.fn(() => []),
      setEarthRasterOverlayOpacity: jest.fn(),
    };
    Object.assign(subject, {
      astroSphere,
      earthFades: new Map(),
    });
    return { subject, astroSphere };
  }

  it("resolves a base-map fade on its final animation frame", async () => {
    const { subject, astroSphere } = createSubject();
    const fade = subject.fadeEarthBaseMapOpacity(1, 1000);

    runFrame(100);
    runFrame(1100);
    await fade;

    expect(astroSphere.setEarthBaseMapOpacity).toHaveBeenLastCalledWith(1);
  });

  it("rejects fades when no Earth base map is active", async () => {
    const { subject } = createSubject(null);

    await expect(subject.fadeEarthBaseMapOpacity(1, 1000)).rejects.toThrow(
      "No active Earth base map.",
    );
  });

  it("rejects unknown raster overlays", async () => {
    const { subject } = createSubject();

    await expect(
      subject.fadeEarthRasterOverlayOpacity("missing", 1, 1000),
    ).rejects.toThrow("Unknown Earth raster overlay: missing");
  });

  it("fades through black when changing the XYZ base map", async () => {
    const { subject } = createSubject(1);
    const fadeEarthBaseMapOpacity = jest
      .fn<(opacity: number, durationMs?: number) => Promise<void>>()
      .mockResolvedValue(undefined);
    const activateXYZ2 = jest.fn();
    const setEarthBaseMapOpacity = jest.fn();
    Object.assign(subject, {
      fadeEarthBaseMapOpacity,
      activateXYZ2,
      setEarthBaseMapOpacity,
    });
    const config = { urlTemplate: "https://example.test/{z}/{x}/{y}.png" };

    await subject.transitionToXYZ(config, { durationMs: 1200 });

    expect(fadeEarthBaseMapOpacity).toHaveBeenNthCalledWith(1, 0, 600);
    expect(activateXYZ2).toHaveBeenCalledWith(config);
    expect(setEarthBaseMapOpacity).toHaveBeenCalledWith(0);
    expect(fadeEarthBaseMapOpacity).toHaveBeenNthCalledWith(2, 1, 600);
    expect(fadeEarthBaseMapOpacity.mock.invocationCallOrder[0]).toBeLessThan(
      activateXYZ2.mock.invocationCallOrder[0],
    );
    expect(activateXYZ2.mock.invocationCallOrder[0]).toBeLessThan(
      fadeEarthBaseMapOpacity.mock.invocationCallOrder[1],
    );
  });
});
