/*
 * AstroViewer
 * Copyright (C) Fabrizio Giordano
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-AstroViewer-Commercial
 */
import type AstroSphere from "./AstroSphere.js";
import type { CameraViewState } from "./Camera.js";
import type { CatalogueGL } from "./model/catalogues/CatalogueGL.js";
import type { FootprintSetGL } from "./model/footprints/FootprintSetGL.js";
import type { HiPSFITSStretch } from "./model/hips/HiPS.js";
import type { ColorMapName } from "./model/ColorMaps.js";

export interface RuntimeCameraState {
  view: CameraViewState;
  fovDeg: number;
  insideSphere: boolean;
}

export interface RuntimeHiPSLayerState {
  url: string;
  propertiesRawText: string;
  opacity: number;
  format: string;
  colorMapName: ColorMapName;
  fitsStretch: HiPSFITSStretch;
}

export interface RuntimeHiPSState {
  mode: "none" | "base" | "stack";
  layers: RuntimeHiPSLayerState[];
  activeIndex: number;
}

export interface RuntimeCatalogueState {
  instance: CatalogueGL;
  visible: boolean;
  color: string;
  selectedIndexes: number[];
}

export interface RuntimeFootprintState {
  instance: FootprintSetGL;
  visible: boolean;
  color: string;
  selectedIndexes: number[];
}

export interface ViewerRuntimeState {
  version: 1;
  domain: "astronomy";
  camera: RuntimeCameraState;
  hips: RuntimeHiPSState;
  catalogues: RuntimeCatalogueState[];
  footprintSets: RuntimeFootprintState[];
  grids: { healpixVisible: boolean; equatorialVisible: boolean };
}

/** Named runtime snapshots. Scientific datasets are shared, HiPS tiles are not. */
export default class ViewerStateManager {
  private readonly states = new Map<string, ViewerRuntimeState>();
  private restoreSequence = 0;
  private readonly retainedCatalogues = new Set<CatalogueGL>();
  private readonly retainedFootprints = new Set<FootprintSetGL>();

  constructor(private readonly sphere: AstroSphere) {}

  saveState(name: string): void {
    this.checkName(name);
    const state = this.sphere.captureRuntimeState();
    if (state.domain !== "astronomy") {
      throw new Error("Only astronomy viewer states are supported.");
    }
    this.states.set(name, state);
    for (const item of state.catalogues) this.retainedCatalogues.add(item.instance);
    for (const item of state.footprintSets) this.retainedFootprints.add(item.instance);
    this.releaseUnusedResources();
  }

  getStateNames(): string[] {
    return [...this.states.keys()];
  }

  hasState(name: string): boolean {
    return this.states.has(name);
  }

  deleteState(name: string): boolean {
    const removed = this.states.delete(name);
    if (removed) this.releaseUnusedResources();
    return removed;
  }

  clearStates(): void {
    this.states.clear();
    this.releaseUnusedResources();
  }

  /** Called after a live catalogue or footprint is removed. */
  onSceneResourcesChanged(): void {
    this.releaseUnusedResources();
  }

  /** Dispose detached resources only after the last snapshot releases them. */
  private releaseUnusedResources(): void {
    const live = this.sphere.captureRuntimeState();
    const usedCatalogues = new Set(live.catalogues.map(item => item.instance));
    const usedFootprints = new Set(live.footprintSets.map(item => item.instance));
    for (const state of this.states.values()) {
      for (const item of state.catalogues) usedCatalogues.add(item.instance);
      for (const item of state.footprintSets) usedFootprints.add(item.instance);
    }
    for (const catalogue of this.retainedCatalogues) {
      if (!usedCatalogues.has(catalogue)) {
        catalogue.dispose();
        this.retainedCatalogues.delete(catalogue);
      }
    }
    for (const footprints of this.retainedFootprints) {
      if (!usedFootprints.has(footprints)) {
        footprints.dispose();
        this.retainedFootprints.delete(footprints);
      }
    }
  }

  async restoreState(name: string): Promise<void> {
    this.checkName(name);
    const state = this.states.get(name);
    if (!state) throw new Error(`Viewer state "${name}" not found.`);
    const sequence = ++this.restoreSequence;
    // Applying the snapshot is synchronous. HiPS tile acquisition continues
    // in the normal draw loop; it is not part of this Promise.
    await this.sphere.restoreRuntimeState(state);
    this.releaseUnusedResources();
    if (sequence !== this.restoreSequence) {
      throw new Error(`Viewer state restore "${name}" was superseded.`);
    }
  }

  private checkName(name: string): void {
    if (typeof name !== "string" || !name.trim()) {
      throw new Error("Viewer state name must be a non-empty string.");
    }
  }
}
