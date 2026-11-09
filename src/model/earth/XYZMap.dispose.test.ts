import { XYZMap } from "./XYZMap.js";

describe("XYZMap disposal", () => {
  it("releases tiles, grid labels and shader resources once", () => {
    const subject = Object.create(XYZMap.prototype) as XYZMap &
      Record<string, unknown>;
    const tileBuffer = { dispose: jest.fn() };
    const lonLatGrid = { dispose: jest.fn() };
    const shaderProgram = { dispose: jest.fn() };

    Object.assign(subject, {
      _tileBuffer: tileBuffer,
      _latLonGrid: lonLatGrid,
      _xyzShaderProgram: shaderProgram,
      _disposed: false,
    });

    subject.dispose();
    subject.dispose();

    expect(tileBuffer.dispose).toHaveBeenCalledTimes(1);
    expect(lonLatGrid.dispose).toHaveBeenCalledTimes(1);
    expect(shaderProgram.dispose).toHaveBeenCalledTimes(1);
  });
});
import { jest } from "@jest/globals";

