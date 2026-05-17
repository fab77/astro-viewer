/*
 * AstroViewer
 * Copyright (C) Fabrizio Giordano
 * SPDX-License-Identifier: LicenseRef-AstroViewer-Dual-License
 *
 * This file is part of AstroViewer.
 * AstroViewer is distributed under a dual-license model.
 * Commercial use requires a separate commercial license.
 * Non-commercial use is governed by LICENSE-NONCOMMERCIAL.md.
 *
 * See LICENSE.md, LICENSE-COMMERCIAL.md, and LICENSE-NONCOMMERCIAL.md for details.
 */

type GridLabelLayer = 'healpix' | 'equatorial' | 'lonlat';
type GridLabelKind = 'hpx' | 'ra' | 'dec' | 'lon' | 'lat';

type DivSet = {
  div: HTMLDivElement;
  textNode: Text;
  style: CSSStyleDeclaration;
};

type LayerState = {
  container: HTMLElement | null;
  divSets: DivSet[];
  divSetNdx: number;
};

class GridTextHelper {
  private static layers: Map<GridLabelLayer, LayerState> = new Map();
  private layer: GridLabelLayer;

  constructor(layer: GridLabelLayer = 'equatorial') {
    this.layer = layer;
    GridTextHelper.getLayerState(layer);
  }

  initHtml(): void {
    GridTextHelper.getLayerState(this.layer);
  }

  resetDivSets(layer: GridLabelLayer = this.layer): void {
    const state = GridTextHelper.getLayerState(layer);
    for (; state.divSetNdx < state.divSets.length; ++state.divSetNdx) {
      state.divSets[state.divSetNdx].style.display = 'none';
    }
    state.divSetNdx = 0;
  }

  addHPXDivSet(msg: string, x: number, y: number): void {
    this.addLabel('healpix', msg, x + 25, y, 'hpx');
  }

  addEqDivSet(msg: string, x: number, y: number, type: 'ra' | 'dec'): void {
    this.addLabel('equatorial', msg, type === 'ra' ? x + 25 : x, type === 'ra' ? y : y + 25, type);
  }

  addLonLatDivSet(msg: string, x: number, y: number, type: 'lon' | 'lat'): void {
    this.addLabel('lonlat', msg, type === 'lon' ? x + 25 : x, type === 'lon' ? y : y + 25, type);
  }

  private addLabel(
    layer: GridLabelLayer,
    msg: string,
    x: number,
    y: number,
    kind: GridLabelKind,
  ): void {
    const state = GridTextHelper.getLayerState(layer);
    if (!state.container) return;

    let divSet = state.divSets[state.divSetNdx++];
    if (!divSet) {
      const div = document.createElement('div');
      const textNode = document.createTextNode('');
      div.appendChild(textNode);
      state.container.appendChild(div);

      divSet = { div, textNode, style: div.style };
      state.divSets.push(divSet);
    }

    divSet.div.className = this.classNameForKind(kind);
    divSet.style.display = 'block';
    divSet.style.left = `${Math.floor(x)}px`;
    divSet.style.top = `${Math.floor(y)}px`;
    divSet.textNode.nodeValue = msg;
  }

  private classNameForKind(kind: GridLabelKind): string {
    switch (kind) {
      case 'dec':
        return 'floating-div-dec';
      case 'lat':
        return 'floating-div-lat';
      case 'lon':
        return 'floating-div-lon';
      case 'hpx':
      case 'ra':
      default:
        return 'floating-div-ra';
    }
  }

  private static getLayerState(layer: GridLabelLayer): LayerState {
    const current = GridTextHelper.layers.get(layer);
    if (current) {
      if (!current.container) current.container = GridTextHelper.resolveContainer(layer);
      return current;
    }

    const state: LayerState = {
      container: GridTextHelper.resolveContainer(layer),
      divSets: [],
      divSetNdx: 0,
    };
    GridTextHelper.layers.set(layer, state);
    return state;
  }

  private static resolveContainer(layer: GridLabelLayer): HTMLElement | null {
    if (layer === 'healpix') {
      return document.querySelector<HTMLElement>('#gridhpx');
    }
    return document.querySelector<HTMLElement>('#gridcoords');
  }
}

export default GridTextHelper;
