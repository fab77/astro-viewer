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

  it("rotates through a complete longitude turn without collapsing the path", () => {
    const camera = new Camera(vec3.fromValues(0, 0, 2), false);

    camera.goTo(12.5, 22);
    const startPosition = camera.getCameraPosition();
    camera.rotateLongitude(12.5, 22, 360, 1000);

    const now = performance.now();
    camera.updateFlyTo(now + 500);
    const halfwayPosition = camera.getCameraPosition();

    expect(halfwayPosition[0]).toBeCloseTo(-startPosition[0], 2);
    expect(halfwayPosition[1]).toBeCloseTo(-startPosition[1], 2);
    expect(halfwayPosition[2]).toBeCloseTo(startPosition[2], 2);
    expect(camera.isFlyToActive()).toBe(true);

    camera.updateFlyTo(now + 1100);
    const finalPosition = camera.getCameraPosition();

    expect(finalPosition[0]).toBeCloseTo(startPosition[0], 4);
    expect(finalPosition[1]).toBeCloseTo(startPosition[1], 4);
    expect(finalPosition[2]).toBeCloseTo(startPosition[2], 4);
    expect(camera.isFlyToActive()).toBe(false);
  });
});
