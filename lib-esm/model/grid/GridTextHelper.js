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
class GridTextHelper {
    layer;
    state;
    containers;
    constructor(layer = 'equatorial', containers) {
        this.layer = layer;
        this.containers = containers;
        this.state = {
            container: this.resolveContainer(layer),
            divSets: [],
            divSetNdx: 0,
        };
    }
    initHtml() {
        this.refreshContainer(this.layer, this.state);
    }
    resetDivSets(layer = this.layer) {
        const state = layer === this.layer ? this.state : {
            container: this.resolveContainer(layer),
            divSets: [],
            divSetNdx: 0,
        };
        this.refreshContainer(layer, state);
        for (; state.divSetNdx < state.divSets.length; ++state.divSetNdx) {
            state.divSets[state.divSetNdx].style.display = 'none';
        }
        state.divSetNdx = 0;
    }
    addHPXDivSet(msg, x, y) {
        this.addLabel('healpix', msg, x + 25, y, 'hpx');
    }
    addEqDivSet(msg, x, y, type) {
        this.addLabel('equatorial', msg, type === 'ra' ? x + 25 : x, type === 'ra' ? y : y + 25, type);
    }
    addLonLatDivSet(msg, x, y, type) {
        this.addLabel('lonlat', msg, type === 'lon' ? x + 25 : x, type === 'lon' ? y : y + 25, type);
    }
    addLabel(layer, msg, x, y, kind) {
        const state = layer === this.layer ? this.state : {
            container: this.resolveContainer(layer),
            divSets: [],
            divSetNdx: 0,
        };
        this.refreshContainer(layer, state);
        if (!state.container)
            return;
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
        divSet.style.position = 'absolute';
        divSet.style.zIndex = '2';
        divSet.style.pointerEvents = 'none';
        divSet.style.font = '12px/1.2 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
        divSet.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.7)';
        divSet.style.color = this.colorForKind(kind);
        const containerRect = state.container.getBoundingClientRect();
        divSet.style.left = `${Math.floor(x - containerRect.left)}px`;
        divSet.style.top = `${Math.floor(y - containerRect.top)}px`;
        divSet.textNode.nodeValue = msg;
    }
    colorForKind(kind) {
        switch (kind) {
            case 'dec':
                return '#3fd35f';
            case 'lat':
                return '#f6d35b';
            case 'lon':
                return '#40c8ff';
            case 'hpx':
            case 'ra':
            default:
                return '#5b7cff';
        }
    }
    classNameForKind(kind) {
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
    resolveContainer(layer) {
        if (layer === 'healpix') {
            const resolved = this.containers?.resolveHealpix?.();
            if (resolved)
                return resolved;
            if (this.containers?.healpix)
                return this.containers.healpix;
            return document.querySelector('#gridhpx');
        }
        const resolved = this.containers?.resolveCoords?.();
        if (resolved)
            return resolved;
        if (this.containers?.coords)
            return this.containers.coords;
        return document.querySelector('#gridcoords');
    }
    refreshContainer(layer, state) {
        const next = this.resolveContainer(layer);
        if (next === state.container)
            return;
        for (const divSet of state.divSets) {
            divSet.div.remove();
        }
        state.container = next;
        state.divSets = [];
        state.divSetNdx = 0;
    }
}
export default GridTextHelper;
