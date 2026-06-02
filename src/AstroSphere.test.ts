import { describe, expect, it, jest } from '@jest/globals';
import AstroSphere from './AstroSphere.js';
import { Point } from './model/Point.js';
import { CoordsType } from './utils/CoordsType.js';

function createStatusSubject(overrides: Record<string, unknown> = {}) {
  const subject = Object.create(AstroSphere.prototype) as AstroSphere & Record<string, unknown>;
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
    _selectedColorMap: 'native',
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

describe('AstroSphere.getCurrentStatus', () => {
  it('returns null when the central point is unavailable', () => {
    const subject = createStatusSubject({
      centralPoinCoords: undefined,
    });

    expect(subject.getCurrentStatus()).toBeNull();
  });

  it('includes the current FoV polygon in the camera snapshot', () => {
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

  it('keeps a valid camera snapshot with an empty polygon fallback when FoV polygon calculation fails', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const subject = createStatusSubject({
      getFoVPolygon: jest.fn(() => {
        throw new Error('FoV unavailable');
      }),
    });

    const status = subject.getCurrentStatus();

    expect(status).not.toBeNull();
    expect(status?.getFoVPolygon).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(
      '[AstroSphere] getCurrentStatus: FoV polygon is not available.',
      expect.any(Error),
    );

    warnSpy.mockRestore();
  });
});
