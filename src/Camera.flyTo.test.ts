import { describe, expect, it } from "@jest/globals";
import { vec3 } from "gl-matrix";
import Camera from "./Camera.js";

describe("Camera directional animation", () => {
  it("reports its active lifecycle through the final frame", () => {
    const camera = new Camera(vec3.fromValues(0, 0, 2), false);

    camera.flyTo(90, 15, 100);
    expect(camera.isFlyToActive()).toBe(true);

    const updated = camera.updateFlyTo(performance.now() + 200);

    expect(updated).toBe(true);
    expect(camera.isFlyToActive()).toBe(false);
  });

  it("stops an active animation when cancelled", () => {
    const camera = new Camera(vec3.fromValues(0, 0, 2), false);

    camera.flyTo(90, 15, 100);
    camera.cancelFlyTo();

    expect(camera.isFlyToActive()).toBe(false);
    expect(camera.updateFlyTo(performance.now() + 200)).toBe(false);
  });
});
