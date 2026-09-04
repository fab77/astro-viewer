import { describe, expect, it, jest } from "@jest/globals";
import AstroSphere from "./AstroSphere.js";
import { Point } from "./model/Point.js";
import { CoordsType } from "./utils/CoordsType.js";

function createMockHiPS(baseURL: string) {
  let opacity = 1;

  return {
    baseURL,

    get opacity() {
      return opacity;
    },

    setOpacity(value: number) {
      opacity = Math.min(1, Math.max(0, value));
    },
  };
}

function createStatusSubject(overrides: Record<string, unknown> = {}) {
  const subject = Object.create(AstroSphere.prototype) as AstroSphere &
    Record<string, unknown>;
  Object.assign(subject, {
    updateCentralPoint: jest.fn(),
    centralPoinCoords: {
      astroDeg: {
        ra: 12.5,
        dec: -8.25,
      },
    },
    fov: {
      minFoV: 1.5,
      xFoV: 2,
      yFoV: 1.5,
    },
    _camera: {
      getCameraPosition: jest.fn(() => [1, 2, 3]),
      getCameraMatrix: jest.fn(() => new Float32Array(16)),
    },
    _perspectiveMatrixManager: {
      pMatrix: new Float32Array(16),
    },
    _healpixGrid: {
      getModelMatrix: jest.fn(() => new Float32Array(16)),
    },
    mousePointCoords: undefined,
    _selectedColorMap: "native",
    getFoVPolygon: jest.fn(() => [
      new Point({ raDeg: 10, decDeg: -10 }, CoordsType.ASTRO),
      new Point({ raDeg: 11, decDeg: -10 }, CoordsType.ASTRO),
      new Point({ raDeg: 11, decDeg: -9 }, CoordsType.ASTRO),
      new Point({ raDeg: 10, decDeg: -9 }, CoordsType.ASTRO),
    ]),
    ...overrides,
  });
  return subject;
}
function createHiPSDescriptor(url: string) {
  return {
    url,
  } as any;
}

function createHiPSLayersSubject() {
  const tileBuffer = {
    removeHiPS: jest.fn(),
  };

  const subject = Object.create(AstroSphere.prototype) as AstroSphere &
    Record<string, unknown>;

  Object.assign(subject, {
    _activeHiPS: null,
    _activeHiPSLayers: [],
    _activeBaseLayer: null,

    _healpixGrid: {
      visibleTilesManager: {
        tileBuffer,
      },
    },

    createHiPS: jest.fn((descriptor: { url: string }) =>
      createMockHiPS(descriptor.url),
    ),
  });

  return subject;
}

describe("AstroSphere.getCurrentStatus", () => {
  it("returns null when the central point is unavailable", () => {
    const subject = createStatusSubject({
      centralPoinCoords: undefined,
    });

    expect(subject.getCurrentStatus()).toBeNull();
  });

  it("includes the current FoV polygon in the camera snapshot", () => {
    const fovPolygon = [
      new Point({ raDeg: 1, decDeg: 2 }, CoordsType.ASTRO),
      new Point({ raDeg: 3, decDeg: 4 }, CoordsType.ASTRO),
      new Point({ raDeg: 5, decDeg: 6 }, CoordsType.ASTRO),
    ];
    const getFoVPolygon = jest.fn(() => fovPolygon);
    const subject = createStatusSubject({ getFoVPolygon });

    const status = subject.getCurrentStatus();

    expect(getFoVPolygon).toHaveBeenCalledTimes(1);
    expect(status?.getFoVPolygon).toBe(fovPolygon);
    expect(status?.getFoVPolygon).toHaveLength(3);
  });

  it("keeps a valid camera snapshot with an empty polygon fallback when FoV polygon calculation fails", () => {
    const warnSpy = jest
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    const subject = createStatusSubject({
      getFoVPolygon: jest.fn(() => {
        throw new Error("FoV unavailable");
      }),
    });

    const status = subject.getCurrentStatus();

    expect(status).not.toBeNull();
    expect(status?.getFoVPolygon).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(
      "[AstroSphere] getCurrentStatus: FoV polygon is not available.",
      expect.any(Error),
    );

    warnSpy.mockRestore();
  });
});

describe("AstroSphere HiPS layers", () => {
  it("does not allow duplicate HiPS URLs", () => {
    const firstHiPS = {
      baseURL: "https://example.org/hips/",
    };

    const subject = Object.create(AstroSphere.prototype) as AstroSphere &
      Record<string, unknown>;

    Object.assign(subject, {
      _activeHiPS: null,
      _activeHiPSLayers: [],
      _activeBaseLayer: null,
      createHiPS: jest.fn(() => firstHiPS),
    });

    const descriptor = {
      url: "https://example.org/hips/",
    };

    subject.addHiPS(descriptor as any);

    expect(() => subject.addHiPS(descriptor as any)).toThrow(
      "HiPS already active: https://example.org/hips/",
    );

    expect(
      (subject as unknown as { activeHiPSLayers: readonly unknown[] })
        .activeHiPSLayers,
    ).toHaveLength(1);
  });

  it("treats HiPS URLs with and without trailing slash as duplicates", () => {
    const firstHiPS = {
      baseURL: "https://example.org/hips/",
    };

    const subject = Object.create(AstroSphere.prototype) as AstroSphere &
      Record<string, unknown>;

    Object.assign(subject, {
      _activeHiPS: null,
      _activeHiPSLayers: [],
      _activeBaseLayer: null,
      createHiPS: jest.fn(() => firstHiPS),
    });

    subject.addHiPS({
      url: "https://example.org/hips/",
    } as any);

    expect(() =>
      subject.addHiPS({
        url: "https://example.org/hips",
      } as any),
    ).toThrow("HiPS already active");
  });

  it("adds multiple HiPS layers preserving insertion order", () => {
    const tileBuffer = {
      removeHiPS: jest.fn(),
    };

    const subject = Object.create(AstroSphere.prototype) as AstroSphere &
      Record<string, unknown>;

    const hipsA = { baseURL: "https://example.org/a/" };
    const hipsB = { baseURL: "https://example.org/b/" };
    const hipsC = { baseURL: "https://example.org/c/" };

    const createHiPS = jest
      .fn()
      .mockReturnValueOnce(hipsA)
      .mockReturnValueOnce(hipsB)
      .mockReturnValueOnce(hipsC);

    Object.assign(subject, {
      _activeHiPS: null,
      _activeHiPSLayers: [],
      _activeBaseLayer: null,
      _healpixGrid: {
        visibleTilesManager: {
          tileBuffer,
        },
      },
      createHiPS,
    });

    const descA = { url: "https://example.org/a/" };
    const descB = { url: "https://example.org/b/" };
    const descC = { url: "https://example.org/c/" };

    const a = subject.addHiPS(descA as never);
    const b = subject.addHiPS(descB as never);
    const c = subject.addHiPS(descC as never);

    expect(a).toBe(hipsA);
    expect(b).toBe(hipsB);
    expect(c).toBe(hipsC);

    expect(subject.activeHiPSLayers).toEqual([hipsA, hipsB, hipsC]);
    expect(subject.activeHiPS).toBe(hipsC);
  });

  it("removes a HiPS layer without affecting the remaining layers", () => {
    const hipsA = { baseURL: "https://example.org/a/" };
    const hipsB = { baseURL: "https://example.org/b/" };
    const hipsC = { baseURL: "https://example.org/c/" };

    const tileBuffer = {
      removeHiPS: jest.fn(),
    };

    const subject = Object.create(AstroSphere.prototype) as AstroSphere &
      Record<string, unknown>;

    Object.assign(subject, {
      _activeHiPS: hipsC,
      _activeHiPSLayers: [hipsA, hipsB, hipsC],
      _activeBaseLayer: "hips",
      _healpixGrid: {
        visibleTilesManager: {
          tileBuffer,
        },
      },
    });

    subject.removeHiPS(hipsB as never);

    expect(tileBuffer.removeHiPS).toHaveBeenCalledTimes(1);
    expect(tileBuffer.removeHiPS).toHaveBeenCalledWith(hipsB);

    expect(subject.activeHiPSLayers).toEqual([hipsA, hipsC]);
    expect(subject.activeHiPS).toBe(hipsC);
  });

  it("falls back to the previous HiPS when the active HiPS is removed", () => {
    const hipsA = { baseURL: "https://example.org/a/" };
    const hipsB = { baseURL: "https://example.org/b/" };
    const hipsC = { baseURL: "https://example.org/c/" };

    const tileBuffer = {
      removeHiPS: jest.fn(),
    };

    const subject = Object.create(AstroSphere.prototype) as AstroSphere &
      Record<string, unknown>;

    Object.assign(subject, {
      _activeHiPS: hipsC,
      _activeHiPSLayers: [hipsA, hipsB, hipsC],
      _activeBaseLayer: "hips",
      _healpixGrid: {
        visibleTilesManager: {
          tileBuffer,
        },
      },
    });

    subject.removeHiPS(hipsC as never);

    expect(tileBuffer.removeHiPS).toHaveBeenCalledWith(hipsC);
    expect(subject.activeHiPSLayers).toEqual([hipsA, hipsB]);
    expect(subject.activeHiPS).toBe(hipsB);
  });

  it("clears the HiPS base layer when the last HiPS is removed", () => {
    const hips = { baseURL: "https://example.org/hips/" };

    const tileBuffer = {
      removeHiPS: jest.fn(),
    };

    const subject = Object.create(AstroSphere.prototype) as AstroSphere &
      Record<string, unknown>;

    Object.assign(subject, {
      _activeHiPS: hips,
      _activeHiPSLayers: [hips],
      _activeBaseLayer: "hips",
      _healpixGrid: {
        visibleTilesManager: {
          tileBuffer,
        },
      },
    });

    subject.removeHiPS(hips as never);

    expect(tileBuffer.removeHiPS).toHaveBeenCalledWith(hips);
    expect(subject.activeHiPSLayers).toEqual([]);
    expect(subject.activeHiPS).toBeNull();
    expect((subject as any)._activeBaseLayer).toBeNull();
  });

  it("removes all HiPS layers", () => {
    const hipsA = { baseURL: "https://example.org/a/" };
    const hipsB = { baseURL: "https://example.org/b/" };

    const tileBuffer = {
      removeHiPS: jest.fn(),
    };

    const subject = Object.create(AstroSphere.prototype) as AstroSphere &
      Record<string, unknown>;

    Object.assign(subject, {
      _activeHiPS: hipsB,
      _activeHiPSLayers: [hipsA, hipsB],
      _activeBaseLayer: "hips",
      _healpixGrid: {
        visibleTilesManager: {
          tileBuffer,
        },
      },
    });

    subject.removeAllHiPS();

    expect(tileBuffer.removeHiPS).toHaveBeenCalledTimes(2);
    expect(tileBuffer.removeHiPS).toHaveBeenNthCalledWith(1, hipsA);
    expect(tileBuffer.removeHiPS).toHaveBeenNthCalledWith(2, hipsB);

    expect(subject.activeHiPSLayers).toEqual([]);
    expect(subject.activeHiPS).toBeNull();
  });

  it("loads a standalone HiPS without adding it to the stack", () => {
    const subject = createHiPSLayersSubject();
    const descriptor = createHiPSDescriptor("https://example.test/base/");

    const base = subject.activateHiPS(descriptor);

    expect(subject.activeHiPS).toBe(base);
    expect(subject.activeHiPSLayers).toEqual([]);
  });

  it("does not allow loading a base HiPS while stacked layers are active", () => {
    const subject = createHiPSLayersSubject();
    subject.addHiPS(createHiPSDescriptor("https://example.test/stack/"));

    expect(() =>
      subject.activateHiPS(createHiPSDescriptor("https://example.test/base/")),
    ).toThrow("Cannot load a HiPS base layer while stacked layers are active.");
  });

  it("discards the standalone base HiPS when entering stack mode", () => {
    const subject = createHiPSLayersSubject();
    const base = subject.activateHiPS(
      createHiPSDescriptor("https://example.test/base/"),
    );

    const stacked = subject.addHiPS(
      createHiPSDescriptor("https://example.test/stack/"),
    );

    const tileBuffer = (subject as unknown as {
      _healpixGrid: { visibleTilesManager: { tileBuffer: { removeHiPS: jest.Mock } } };
    })._healpixGrid.visibleTilesManager.tileBuffer;

    expect(tileBuffer.removeHiPS).toHaveBeenCalledWith(base);
    expect(subject.activeHiPSLayers).toEqual([stacked]);
    expect(subject.activeHiPS).toBe(stacked);
  });

  it("changes the active HiPS without changing layer order", () => {
    const subject = createHiPSLayersSubject();

    const hips1 = subject.addHiPS(
      createHiPSDescriptor("https://example.test/hips1/"),
    );
    const hips2 = subject.addHiPS(
      createHiPSDescriptor("https://example.test/hips2/"),
    );
    const hips3 = subject.addHiPS(
      createHiPSDescriptor("https://example.test/hips3/"),
    );

    subject.setActiveHiPS(hips1);

    expect(subject.activeHiPS).toBe(hips1);
    expect(subject.activeHiPSLayers).toEqual([hips1, hips2, hips3]);
  });

  it("does not allow selecting a HiPS that is not part of the active layers", () => {
    const subject = createHiPSLayersSubject();

    const hips1 = subject.addHiPS(
      createHiPSDescriptor("https://example.test/hips1/"),
    );

    subject.removeHiPS(hips1);

    expect(() => subject.setActiveHiPS(hips1)).toThrow(
      "HiPS layer is not active in this AstroSphere.",
    );
  });

  it("changes opacity independently for each HiPS layer", () => {
    const subject = createHiPSLayersSubject();

    const hips1 = subject.addHiPS(
      createHiPSDescriptor("https://example.test/hips1/"),
    );

    const hips2 = subject.addHiPS(
      createHiPSDescriptor("https://example.test/hips2/"),
    );

    subject.setHiPSOpacity(hips1, 0.35);

    expect(hips1.opacity).toBeCloseTo(0.35);
    expect(hips2.opacity).toBe(1);
  });
});
