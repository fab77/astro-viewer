import { describe, expect, it, jest } from '@jest/globals'
import { MetadataManager } from '../MetadataManager.js'
import { Point } from '../Point.js'
import { CoordsType } from '../../utils/CoordsType.js'
import { TerraFootprintSetGL } from './TerraFootprintSetGL.js'

function createMockWebGL(): WebGL2RenderingContext {
  const gl = {
    ARRAY_BUFFER: 0x8892,
    ELEMENT_ARRAY_BUFFER: 0x8893,
    STATIC_DRAW: 0x88e4,
    FLOAT: 0x1406,
    FRAGMENT_SHADER: 0x8b30,
    VERTEX_SHADER: 0x8b31,
    COMPILE_STATUS: 0x8b81,
    LINK_STATUS: 0x8b82,
    createProgram: jest.fn(() => ({})),
    createShader: jest.fn(() => ({})),
    shaderSource: jest.fn(),
    compileShader: jest.fn(),
    getShaderInfoLog: jest.fn(() => ''),
    getShaderParameter: jest.fn(() => true),
    attachShader: jest.fn(),
    linkProgram: jest.fn(),
    getProgramParameter: jest.fn(() => true),
    useProgram: jest.fn(),
    getAttribLocation: jest.fn(() => 0),
    getUniformLocation: jest.fn(() => ({})),
    createBuffer: jest.fn(() => ({})),
    bindBuffer: jest.fn(),
    bufferData: jest.fn(),
  }

  return gl as unknown as WebGL2RenderingContext
}

function createSubject(): TerraFootprintSetGL {
  return new TerraFootprintSetGL(
    'ISS footprints',
    'EO footprints',
    'test',
    new MetadataManager([]),
    createMockWebGL(),
    {} as never,
  )
}

function geographicPoint(lonDeg: number, latDeg: number): Point {
  return new Point({ lonDeg, latDeg }, CoordsType.GEOGRAPHIC)
}

describe('TerraFootprintSetGL', () => {
  it('does not run astronomical Healpix selection while hovering EO footprints', () => {
    const subject = createSubject()
    subject.addGeoJSONFeatures([
      {
        geometryType: 'Polygon',
        properties: { name: 'sample footprint' },
        polygons: [[
          geographicPoint(-18, 25),
          geographicPoint(-17, 25),
          geographicPoint(-17, 26),
          geographicPoint(-18, 26),
        ]],
      },
    ])

    const mouseHelper = {
      x: 1,
      y: 0,
      z: 0,
      computeNpix: jest.fn(() => {
        throw new Error('astronomical picking must not run for EO footprints')
      }),
    }

    expect(() => subject.checkSelection(mouseHelper as never)).not.toThrow()
    expect(mouseHelper.computeNpix).not.toHaveBeenCalled()
  })
})
