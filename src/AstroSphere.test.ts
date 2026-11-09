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

    const hipsA = { baseURL: "https://example.org/a/", dispose: jest.fn() };
    const hipsB = { baseURL: "https://example.org/b/", dispose: jest.fn() };
    const hipsC = { baseURL: "https://example.org/c/", dispose: jest.fn() };

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
    const hipsA = { baseURL: "https://example.org/a/", dispose: jest.fn() };
    const hipsB = { baseURL: "https://example.org/b/", dispose: jest.fn() };
    const hipsC = { baseURL: "https://example.org/c/", dispose: jest.fn() };

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
    expect(hipsB.dispose).toHaveBeenCalledTimes(1);

    expect(subject.activeHiPSLayers).toEqual([hipsA, hipsC]);
    expect(subject.activeHiPS).toBe(hipsC);
  });

  it("falls back to the previous HiPS when the active HiPS is removed", () => {
    const hipsA = { baseURL: "https://example.org/a/", dispose: jest.fn() };
    const hipsB = { baseURL: "https://example.org/b/", dispose: jest.fn() };
    const hipsC = { baseURL: "https://example.org/c/", dispose: jest.fn() };

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
    expect(hipsC.dispose).toHaveBeenCalledTimes(1);
    expect(subject.activeHiPSLayers).toEqual([hipsA, hipsB]);
    expect(subject.activeHiPS).toBe(hipsB);
  });

  it("clears the HiPS base layer when the last HiPS is removed", () => {
    const hips = {
      baseURL: "https://example.org/hips/",
      dispose: jest.fn(),
    };

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
    expect(hips.dispose).toHaveBeenCalledTimes(1);
    expect(subject.activeHiPSLayers).toEqual([]);
    expect(subject.activeHiPS).toBeNull();
    expect((subject as any)._activeBaseLayer).toBeNull();
  });

  it("removes all HiPS layers", () => {
    const hipsA = { baseURL: "https://example.org/a/", dispose: jest.fn() };
    const hipsB = { baseURL: "https://example.org/b/", dispose: jest.fn() };

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
    expect(hipsA.dispose).toHaveBeenCalledTimes(1);
    expect(hipsB.dispose).toHaveBeenCalledTimes(1);

    expect(subject.activeHiPSLayers).toEqual([]);
    expect(subject.activeHiPS).toBeNull();
  });

  it("skips hidden HiPS layers unless they are the active preload target", () => {
    const hidden = { opacity: 0 };
    const visible = { opacity: 0.5 };
    const activeHidden = { opacity: 0 };
    const subject = Object.create(AstroSphere.prototype) as AstroSphere &
      Record<string, unknown>;

    Object.assign(subject, { _activeHiPS: activeHidden });

    expect((subject as any).shouldDrawHiPS(hidden)).toBe(false);
    expect((subject as any).shouldDrawHiPS(visible)).toBe(true);
    expect((subject as any).shouldDrawHiPS(activeHidden)).toBe(true);
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
    base.dispose = jest.fn();

    const stacked = subject.addHiPS(
      createHiPSDescriptor("https://example.test/stack/"),
    );

    const tileBuffer = (subject as unknown as {
      _healpixGrid: { visibleTilesManager: { tileBuffer: { removeHiPS: jest.Mock } } };
    })._healpixGrid.visibleTilesManager.tileBuffer;

    expect(tileBuffer.removeHiPS).toHaveBeenCalledWith(base);
    expect(base.dispose).toHaveBeenCalledTimes(1);
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
    hips1.dispose = jest.fn();

    subject.removeHiPS(hips1);

    expect(hips1.dispose).toHaveBeenCalledTimes(1);
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

describe("Earth raster overlays", () => {
  function createEarthRasterSubject() {
    const firstMap = { setOpacity: jest.fn(), dispose: jest.fn() };
    const secondMap = { setOpacity: jest.fn(), dispose: jest.fn() };
    const subject = Object.create(AstroSphere.prototype) as AstroSphere &
      Record<string, any>;

    Object.assign(subject, {
      _earthRasterOverlays: [
        {
          id: "earth-raster-1",
          name: "Overlay one",
          sourceType: "xyz",
          visible: true,
          opacity: 0.65,
          map: firstMap,
        },
        {
          id: "earth-raster-2",
          name: "Overlay two",
          sourceType: "wmts",
          visible: true,
          opacity: 0.65,
          map: secondMap,
        },
      ],
    });

    return { subject, firstMap, secondMap };
  }

  it("returns overlay metadata without exposing the renderer", () => {
    const { subject } = createEarthRasterSubject();

    expect(subject.getEarthRasterOverlays()).toEqual([
      {
        id: "earth-raster-1",
        name: "Overlay one",
        sourceType: "xyz",
        visible: true,
        opacity: 0.65,
      },
      {
        id: "earth-raster-2",
        name: "Overlay two",
        sourceType: "wmts",
        visible: true,
        opacity: 0.65,
      },
    ]);
  });

  it("updates overlay visibility and clamps opacity", () => {
    const { subject, firstMap } = createEarthRasterSubject();

    subject.setEarthRasterOverlayVisible("earth-raster-1", false);
    subject.setEarthRasterOverlayOpacity("earth-raster-1", 1.5);

    expect(subject.getEarthRasterOverlays()[0]).toMatchObject({
      visible: false,
      opacity: 1,
    });
    expect(firstMap.setOpacity).toHaveBeenCalledWith(1);
  });

  it("removes one or all overlays", () => {
    const { subject, firstMap, secondMap } = createEarthRasterSubject();

    subject.removeEarthRasterOverlay("earth-raster-1");
    expect(subject.getEarthRasterOverlays().map((overlay) => overlay.id)).toEqual([
      "earth-raster-2",
    ]);
    expect(firstMap.dispose).toHaveBeenCalledTimes(1);
    expect(secondMap.dispose).not.toHaveBeenCalled();

    subject.removeAllEarthRasterOverlays();
    expect(subject.getEarthRasterOverlays()).toEqual([]);
    expect(firstMap.dispose).toHaveBeenCalledTimes(1);
    expect(secondMap.dispose).toHaveBeenCalledTimes(1);
  });
});

describe("AstroSphere domain ownership", () => {
  function createDomainSubject() {
    const subject = Object.create(AstroSphere.prototype) as AstroSphere &
      Record<string, unknown>;

    Object.assign(subject, {
      _activeDomain: "astronomy",
      _activeBaseLayer: "hips",
      _activeHiPS: { getModelMatrix: jest.fn() },
      _activeXYZ2: { getModelMatrix: jest.fn() },
      _activeMeshHiPS: { getModelMatrix: jest.fn() },
      _camera: {
        getViewState: jest.fn(() => ({ domain: (subject as any)._activeDomain })),
        restoreViewState: jest.fn(),
      },
      domainCameraStates: {},
      inertiaX: 0,
      inertiaY: 0,
      zoomInertia: 0,
      astronomyCatalogues: [],
      earthPointSets: [],
      astronomyFootprintSets: [],
      earthFootprintSets: [],
      lastHoveredSource: null,
      lastHoveredCatalogue: null,
      _webgl: { clearColor: jest.fn() },
    });

    return subject;
  }

  it("restores the existing base-layer kind when switching domains", () => {
    const subject = createDomainSubject();

    subject.setActiveDomain("earth");
    expect((subject as any)._activeBaseLayer).toBe("xyz");

    subject.setActiveDomain("mesh");
    expect((subject as any)._activeBaseLayer).toBe("meships");

    subject.setActiveDomain("astronomy");
    expect((subject as any)._activeBaseLayer).toBe("hips");
  });

  it("uses a black background for Earth and restores Astronomy blue", () => {
    const subject = createDomainSubject();
    const webgl = (subject as any)._webgl;

    subject.setActiveDomain("earth");
    expect(webgl.clearColor).toHaveBeenLastCalledWith(0, 0, 0, 1);

    subject.setActiveDomain("astronomy");
    expect(webgl.clearColor).toHaveBeenLastCalledWith(
      0,
      16 / 255,
      50 / 255,
      0.7,
    );
  });

  it("preserves grid visibility and disposes the replaced Earth base map", () => {
    const subject = createDomainSubject();
    const previousMap = {
      isLonLatGridVisible: jest.fn(() => true),
      clearLonLatGridLabels: jest.fn(),
      dispose: jest.fn(),
    };
    const nextMap = {
      isLonLatGridVisible: jest.fn(() => false),
      toggleLonLatGrid: jest.fn(() => true),
      dispose: jest.fn(),
    };

    Object.assign(subject, {
      _activeDomain: "earth",
      _activeBaseLayer: "xyz",
      _activeXYZ2: previousMap,
    });

    (subject as any).replaceEarthBaseMap(nextMap);

    expect(previousMap.clearLonLatGridLabels).toHaveBeenCalledTimes(1);
    expect(previousMap.dispose).toHaveBeenCalledTimes(1);
    expect(nextMap.toggleLonLatGrid).toHaveBeenCalledTimes(1);
    expect((subject as any)._activeXYZ2).toBe(nextMap);
    expect((subject as any)._activeBaseLayer).toBe("xyz");
  });

  it("restores the camera view saved for each domain", () => {
    const subject = createDomainSubject();
    const camera = (subject as any)._camera;

    subject.setActiveDomain("earth");
    expect((subject as any).domainCameraStates.astronomy).toEqual({
      domain: "astronomy",
    });
    expect(camera.restoreViewState).not.toHaveBeenCalled();

    subject.setActiveDomain("astronomy");
    expect((subject as any).domainCameraStates.earth).toEqual({ domain: "earth" });
    expect(camera.restoreViewState).toHaveBeenCalledWith({ domain: "astronomy" });
  });

  it("keeps Astronomy and Earth point ownership separate", async () => {
    const subject = createDomainSubject();
    const astronomyCatalogue = {} as any;
    const earthPointSet = {} as any;

    await subject.showCatalogue(astronomyCatalogue);
    await subject.showTerraPointSet(earthPointSet);

    expect((subject as any).astronomyCatalogues).toEqual([astronomyCatalogue]);
    expect((subject as any).earthPointSets).toEqual([earthPointSet]);
  });

  it("returns hovered footprints only from the active domain", async () => {
    const subject = createDomainSubject();
    const astronomyFootprintSet = { hoveredFootprints: { domain: "astronomy" } } as any;
    const earthFootprintSet = { hoveredFootprints: { domain: "earth" } } as any;

    await subject.showFootprintSet(astronomyFootprintSet);
    await subject.showTerraFootprintSet(earthFootprintSet);

    subject.setActiveDomain("astronomy");
    expect(subject.getHoveredFootprints()).toEqual([{ domain: "astronomy" }]);

    subject.setActiveDomain("earth");
    expect(subject.getHoveredFootprints()).toEqual([{ domain: "earth" }]);
  });
});

describe("AstroSphere awaitable navigation", () => {
  function createNavigationSubject() {
    const subject = Object.create(AstroSphere.prototype) as AstroSphere &
      Record<string, unknown>;
    const camera = {
      cancelFlyTo: jest.fn(),
      flyTo: jest.fn(),
      rotateLongitude: jest.fn(),
      goTo: jest.fn(),
    };

    Object.assign(subject, {
      _camera: camera,
      inertiaX: 1,
      inertiaY: 1,
      flyToAnimationResolve: null,
      lastCameraMotionAt: 0,
      _cameraStatusChanged: false,
      _activeDomain: "earth",
      updateCentralPoint: jest.fn(() => ({
        astroDeg: { ra: 12.5, dec: 22 },
      })),
    });

    return { subject, camera };
  }

  it("resolves when the directional animation finishes", async () => {
    const { subject, camera } = createNavigationSubject();
    let resolved = false;

    const flight = subject.flyTo(12, 34, 500).then(() => {
      resolved = true;
    });

    await Promise.resolve();
    expect(resolved).toBe(false);
    expect(camera.flyTo).toHaveBeenCalledWith(12, 34, 500);
    expect((subject as any).inertiaX).toBe(0);
    expect((subject as any).inertiaY).toBe(0);

    (subject as any).finishFlyToAnimation();
    await flight;
    expect(resolved).toBe(true);
  });

  it("settles the previous flight when a new one replaces it", async () => {
    const { subject } = createNavigationSubject();
    let firstResolved = false;

    const firstFlight = subject.flyTo(10, 20, 500).then(() => {
      firstResolved = true;
    });
    const secondFlight = subject.flyTo(30, 40, 500);

    await firstFlight;
    expect(firstResolved).toBe(true);

    (subject as any).finishFlyToAnimation();
    await secondFlight;
  });

  it("applies zero-duration navigation immediately", async () => {
    const { subject, camera } = createNavigationSubject();

    await subject.flyTo(15, -25, 0);

    expect(camera.goTo).toHaveBeenCalledWith(15, -25);
    expect(camera.flyTo).not.toHaveBeenCalled();
  });

  it("rejects invalid animation durations", async () => {
    const { subject } = createNavigationSubject();

    await expect(subject.flyTo(0, 0, -1)).rejects.toThrow(
      "Camera animation duration must be >= 0 ms.",
    );
  });

  it("starts an awaitable full Earth longitude rotation", async () => {
    const { subject, camera } = createNavigationSubject();
    let resolved = false;

    const rotation = subject.rotateEarthLongitude(360, 12000).then(() => {
      resolved = true;
    });

    await Promise.resolve();
    expect(resolved).toBe(false);
    expect(camera.rotateLongitude).toHaveBeenCalledWith(
      12.5,
      22,
      360,
      12000,
    );

    (subject as any).finishFlyToAnimation();
    await rotation;
    expect(resolved).toBe(true);
  });

  it("rejects Earth longitude rotation outside the Earth domain", async () => {
    const { subject, camera } = createNavigationSubject();
    (subject as any)._activeDomain = "astronomy";

    await expect(subject.rotateEarthLongitude(360, 12000)).rejects.toThrow(
      "Earth longitude rotation requires the Earth domain to be active.",
    );
    expect(camera.rotateLongitude).not.toHaveBeenCalled();
  });
});

describe("AstroSphere Earth runtime state", () => {
  it("captures the Earth map stack, grid and scientific overlays", () => {
    const subject = Object.create(AstroSphere.prototype) as AstroSphere &
      Record<string, unknown>;
    const baseDescriptor = { name: "base" };
    const overlayDescriptor = { name: "overlay" };
    const pointSet = {
      isVisible: true,
      shapeColor: "#112233",
      selectedIndexes: [1],
    };
    const footprintSet = {
      isVisible: false,
      shapeColor: "#445566",
      selectedIndexes: [2],
    };
    Object.assign(subject, {
      _activeDomain: "earth",
      _camera: { getViewState: jest.fn(() => ({ position: [0, 0, 2] })) },
      fov: { minFoV: 12 },
      _activeXYZ2: { descriptor: baseDescriptor, opacity: 0.8 },
      _earthRasterOverlays: [{
        id: "earth-raster-1",
        name: "overlay",
        sourceType: "xyz",
        opacity: 0.4,
        visible: false,
        map: { descriptor: overlayDescriptor },
      }],
      earthPointSets: [pointSet],
      earthFootprintSets: [footprintSet],
      isLonLatGridVisible: jest.fn(() => true),
    });

    const state = subject.captureRuntimeState();

    expect(state).toMatchObject({
      domain: "earth",
      camera: { fovDeg: 12 },
      baseMap: { descriptor: baseDescriptor, opacity: 0.8 },
      rasterOverlays: [{
        name: "overlay",
        sourceType: "xyz",
        descriptor: overlayDescriptor,
        opacity: 0.4,
        visible: false,
      }],
      grids: { lonLatVisible: true },
    });
    if (state.domain !== "earth") throw new Error("Expected Earth state");
    expect(state.pointSets[0].instance).toBe(pointSet);
    expect(state.footprintSets[0].instance).toBe(footprintSet);
  });

  it("restores Earth camera, base map opacity and grid state", async () => {
    const subject = Object.create(AstroSphere.prototype) as AstroSphere &
      Record<string, unknown>;
    const descriptor = { name: "saved base" };
    const camera = {
      restoreViewState: jest.fn(),
      refreshFoV: jest.fn(),
    };
    const activateXYZ2 = jest.fn();
    const setEarthBaseMapOpacity = jest.fn();
    const toggleLonLatGrid = jest.fn();
    Object.assign(subject, {
      _activeDomain: "earth",
      _camera: camera,
      _activeXYZ2: {},
      _activeBaseLayer: "xyz",
      _earthRasterOverlays: [],
      earthPointSets: [],
      earthFootprintSets: [],
      inertiaX: 0,
      inertiaY: 0,
      zoomInertia: 0,
      canvas: {},
      _perspectiveMatrixManager: {
        pMatrix: new Float32Array(16),
        computePerspectiveMatrix: jest.fn(),
      },
      _healpixGrid: {
        refreshFoV: jest.fn(() => ({ minFoV: 9 })),
      },
      cancelFoVAnimation: jest.fn(),
      cancelFlyToAnimation: jest.fn(),
      setFoV: jest.fn(),
      updateCentralPoint: jest.fn(),
      activateXYZ2,
      setEarthBaseMapOpacity,
      removeAllEarthRasterOverlays: jest.fn(),
      isLonLatGridVisible: jest.fn(() => false),
      toggleLonLatGrid,
    });
    const state = {
      version: 1,
      domain: "earth",
      camera: {
        view: { position: [0, 0, 2] },
        fovDeg: 9,
        insideSphere: false,
      },
      baseMap: { descriptor, opacity: 0.7 },
      rasterOverlays: [],
      pointSets: [],
      footprintSets: [],
      grids: { lonLatVisible: true },
    } as any;

    await subject.restoreRuntimeState(state);

    expect(activateXYZ2).toHaveBeenCalledWith(descriptor);
    expect(setEarthBaseMapOpacity).toHaveBeenCalledWith(0.7);
    expect(camera.restoreViewState).toHaveBeenCalledWith(state.camera.view);
    expect(toggleLonLatGrid).toHaveBeenCalledTimes(1);
  });
});
