/**
 * @author Fabrizio Giordano (Fab)
 * @param in_radius - number
 * @param in_gl - GL context
 * @param in_position - array of double e.g. [0.0, 0.0, 0.0]
 */

type DivSet = {
  div: HTMLDivElement;
  textNode: Text;
  style: CSSStyleDeclaration;
};

class GridTextHelper {
  private _divEqContainerElement: HTMLElement | null;
  private _divHPXContainerElement: HTMLElement | null;
  private _divSets: DivSet[];
  private _divSetNdx: number;

  constructor() {
    this._divEqContainerElement = document.querySelector<HTMLElement>('#gridcoords');
    this._divHPXContainerElement = document.querySelector<HTMLElement>('#gridhpx');
    this._divSetNdx = 0;
    this._divSets = [];
  }

  initHtml(): void {
    // Kept for API parity; nothing required here with current logic.
  }

  resetDivSets(): void {
    // Hide remaining divs and reset index
    for (; this._divSetNdx < this._divSets.length; ++this._divSetNdx) {
      this._divSets[this._divSetNdx].style.display = 'none';
    }
    this._divSetNdx = 0;
  }

  /**
   * Add / reuse a floating label for HPX coordinates
   */
  addHPXDivSet(msg: string, x: number, y: number): void {
    let divSet = this._divSets[this._divSetNdx++];

    // Create on demand
    if (!divSet) {
      const div = document.createElement('div');
      const textNode = document.createTextNode('');
      div.className = 'floating-div-ra'; // style like RA tags

      div.appendChild(textNode);

      if (!this._divHPXContainerElement) {
        this._divHPXContainerElement = document.querySelector<HTMLElement>('#gridhpx');
      }
      if (!this._divHPXContainerElement) {
        // If container is still missing, abort gracefully
        return;
      }
      this._divHPXContainerElement.appendChild(div);

      divSet = { div, textNode, style: div.style };
      this._divSets.push(divSet);
    }

    // Show & position
    divSet.style.display = 'block';
    divSet.style.left = `${Math.floor(x + 25)}px`;
    divSet.style.top = `${Math.floor(y)}px`;
    divSet.textNode.nodeValue = msg;
  }

  /**
   * Add / reuse a floating label for Equatorial coords
   * @param type 'ra' or 'dec'
   */
  addEqDivSet(msg: string, x: number, y: number, type: 'ra' | 'dec'): void {
    let divSet = this._divSets[this._divSetNdx++];

    if (!divSet) {
      const div = document.createElement('div');
      const textNode = document.createTextNode('');
      div.className = type === 'ra' ? 'floating-div-ra' : 'floating-div-dec';
      div.appendChild(textNode);

      if (!this._divEqContainerElement) {
        this._divEqContainerElement = document.querySelector<HTMLElement>('#gridcoords');
      }
      if (!this._divEqContainerElement) {
        // If container is still missing, abort gracefully
        return;
      }
      this._divEqContainerElement.appendChild(div);

      divSet = { div, textNode, style: div.style };
      this._divSets.push(divSet);
    }

    divSet.style.display = 'block';

    if (type === 'ra') {
      divSet.style.left = `${Math.floor(x + 25)}px`;
      divSet.style.top = `${Math.floor(y)}px`;
    } else {
      divSet.style.left = `${Math.floor(x)}px`;
      divSet.style.top = `${Math.floor(y + 25)}px`;
    }

    divSet.textNode.nodeValue = msg;
  }
}

export const gridTextHelper = new GridTextHelper();
export default GridTextHelper;