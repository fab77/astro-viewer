import { jest } from "@jest/globals";
import Tile from "./Tile.js";

describe("Tile disposal", () => {
  it("releases WebGL resources once and ignores repeated disposal", () => {
    const texture = {} as WebGLTexture;
    const vertexBuffer = {} as WebGLBuffer;
    const indexBuffer = {} as WebGLBuffer;
    const image = {
      onload: () => undefined,
      onerror: () => undefined,
      removeAttribute: jest.fn(),
    };
    const webgl = {
      deleteTexture: jest.fn(),
      deleteBuffer: jest.fn(),
    };
    const tile = Object.create(Tile.prototype) as Tile &
      Record<string, unknown>;

    Object.assign(tile, {
      _disposed: false,
      _abort: false,
      _ready: true,
      _image: image,
      _texture: texture,
      _webgl: webgl,
      _fitsTile: {},
      vertexPosition: [new Float32Array([1, 2, 3])],
      vertexPositionBuffer: [vertexBuffer],
      vertexIndexBuffer: indexBuffer,
    });

    tile.dispose();
    tile.dispose();

    expect(image.onload).toBeNull();
    expect(image.onerror).toBeNull();
    expect(image.removeAttribute).toHaveBeenCalledWith("src");
    expect(webgl.deleteTexture).toHaveBeenCalledTimes(1);
    expect(webgl.deleteTexture).toHaveBeenCalledWith(texture);
    expect(webgl.deleteBuffer).toHaveBeenCalledTimes(2);
    expect(webgl.deleteBuffer).toHaveBeenCalledWith(vertexBuffer);
    expect(webgl.deleteBuffer).toHaveBeenCalledWith(indexBuffer);
  });
});
