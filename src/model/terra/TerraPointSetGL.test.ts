import { describe, expect, it, jest } from '@jest/globals'
import { ColumnType, MetadataColumn } from '../MetadataColumn.js'
import { MetadataManager } from '../MetadataManager.js'
import { TerraPointSetGL } from './TerraPointSetGL.js'

function createMockWebGL(): WebGL2RenderingContext {
  const gl = {
    ARRAY_BUFFER: 0x8892,
    STATIC_DRAW: 0x88e4,
    FLOAT: 0x1406,
    POINTS: 0x0000,
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
    vertexAttribPointer: jest.fn(),
    enableVertexAttribArray: jest.fn(),
    uniform4f: jest.fn(),
    uniformMatrix4fv: jest.fn(),
    drawArrays: jest.fn(),
  }

  return gl as unknown as WebGL2RenderingContext
}

function createMarkerColumns(): MetadataColumn[] {
  return [
    new MetadataColumn({ index: 0, name: 'longitudeDeg', columnType: ColumnType.GEOM_RA, unit: 'deg' }),
    new MetadataColumn({ index: 1, name: 'latitudeDeg', columnType: ColumnType.GEOM_DEC, unit: 'deg' }),
    new MetadataColumn({ index: 2, name: 'timestamp', columnType: ColumnType.MAIN_NAME, unit: '' }),
    new MetadataColumn({ index: 3, name: 'altitudeKm', columnType: ColumnType.NUMBER, unit: 'km' }),
  ]
}

function createSubject(): TerraPointSetGL {
  return new TerraPointSetGL(
    'ISS marker',
    'EO marker',
    'test',
    new MetadataManager([]),
    createMockWebGL(),
    {} as never,
  )
}

describe('TerraPointSetGL', () => {
  it('loads geographic marker points without astronomical Healpix selection', () => {
    const subject = createSubject()

    expect(() => subject.addSources([[
      -17.469501,
      25.933956,
      '2019-06-24T06:16:00.000Z',
      410.401,
    ]], createMarkerColumns())).not.toThrow()

    expect(subject.sources).toHaveLength(1)
    expect(subject.sources[0].point.lonDeg).toBeCloseTo(-17.469501)
    expect(subject.sources[0].point.latDeg).toBeCloseTo(25.933956)
  })

  it('does not run inherited hover picking while drawing EO markers', () => {
    const subject = createSubject()
    subject.addSources([[
      -17.469501,
      25.933956,
      '2019-06-24T06:16:00.000Z',
      410.401,
    ]], createMarkerColumns())

    const mouseHelper = {
      xyz: [1, 0, 0],
      computeNpix: jest.fn(() => 0),
    }

    subject.draw(
      new Float32Array(16),
      mouseHelper as never,
      new Float32Array(16),
      new Float32Array(16),
    )

    expect(mouseHelper.computeNpix).not.toHaveBeenCalled()
  })
})
