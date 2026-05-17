class GridTextHelper {
    static layers = new Map();
    layer;
    constructor(layer = 'equatorial') {
        this.layer = layer;
        GridTextHelper.getLayerState(layer);
    }
    initHtml() {
        GridTextHelper.getLayerState(this.layer);
    }
    resetDivSets(layer = this.layer) {
        const state = GridTextHelper.getLayerState(layer);
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
        const state = GridTextHelper.getLayerState(layer);
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
        divSet.style.left = `${Math.floor(x)}px`;
        divSet.style.top = `${Math.floor(y)}px`;
        divSet.textNode.nodeValue = msg;
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
    static getLayerState(layer) {
        const current = GridTextHelper.layers.get(layer);
        if (current) {
            if (!current.container)
                current.container = GridTextHelper.resolveContainer(layer);
            return current;
        }
        const state = {
            container: GridTextHelper.resolveContainer(layer),
            divSets: [],
            divSetNdx: 0,
        };
        GridTextHelper.layers.set(layer, state);
        return state;
    }
    static resolveContainer(layer) {
        if (layer === 'healpix') {
            return document.querySelector('#gridhpx');
        }
        return document.querySelector('#gridcoords');
    }
}
export default GridTextHelper;
