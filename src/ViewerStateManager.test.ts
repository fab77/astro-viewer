import { describe, expect, it, jest } from "@jest/globals";
import ViewerStateManager, {
  type ViewerRuntimeState,
} from "./ViewerStateManager.js";

describe("ViewerStateManager Earth states", () => {
  it("saves and restores a named Earth runtime state", async () => {
    const state = {
      version: 1,
      domain: "earth",
      camera: {},
      baseMap: null,
      rasterOverlays: [],
      pointSets: [],
      footprintSets: [],
      grids: { lonLatVisible: false },
    } as unknown as ViewerRuntimeState;
    const sphere = {
      captureRuntimeState: jest.fn(() => state),
      getLiveRuntimeResources: jest.fn(() => ({
        catalogues: [],
        footprintSets: [],
      })),
      restoreRuntimeState: jest.fn(async () => undefined),
    };
    const manager = new ViewerStateManager(sphere as any);

    manager.saveState("earth-view");
    await manager.restoreState("earth-view");

    expect(manager.getStateNames()).toEqual(["earth-view"]);
    expect(sphere.restoreRuntimeState).toHaveBeenCalledWith(state);
  });
});
