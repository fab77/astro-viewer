/*
 * AstroViewer
 * Copyright (C) Fabrizio Giordano
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-AstroViewer-Commercial
 *
 * AstroViewer is dual-licensed under the GNU Affero General Public License
 * version 3 and a separate commercial license.
 *
 * See LICENSE.md, LICENSE-AGPL.md, and LICENSE-COMMERCIAL.md for details.
 */

// ui.js
export const el = (id) => document.getElementById(id);
export const setStatus = (t) => { const s = el('status'); if (s) s.textContent = t || ''; };

function appendIfFound(parent, id) {
  const node = el(id);
  if (parent && node) parent.appendChild(node);
  return node;
}

function moveLabelForInput(parent, inputId) {
  const input = el(inputId);
  const label = input?.closest('label');
  if (parent && label) parent.appendChild(label);
}

function makeDetails(id, summaryText, open = false) {
  let details = el(id);
  if (details) return details;
  details = document.createElement('details');
  details.id = id;
  details.className = 'nested';
  details.open = open;
  const summary = document.createElement('summary');
  summary.textContent = summaryText;
  details.appendChild(summary);
  const stack = document.createElement('div');
  stack.className = 'stack';
  stack.style.marginTop = '8px';
  details.appendChild(stack);
  return details;
}

export function wireDevTabs() {
  const panel = el('devpanel');
  if (!panel || el('devTabs')) return;

  const controlPanel = el('controlPanel');
  const tabs = document.createElement('div');
  tabs.id = 'devTabs';
  tabs.className = 'dev-tabs';
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', 'Dev panel domains');
  tabs.innerHTML = `
    <button class="dev-tab active" type="button" role="tab" aria-selected="true" data-dev-tab="astronomy">Astronomy</button>
    <button class="dev-tab" type="button" role="tab" aria-selected="false" data-dev-tab="earth">Earth Observation</button>
    <button class="dev-tab" type="button" role="tab" aria-selected="false" data-dev-tab="mesh">3D / Mesh</button>
  `;

  const astronomy = document.createElement('section');
  astronomy.className = 'tab-panel';
  astronomy.dataset.devTabPanel = 'astronomy';
  const earth = document.createElement('section');
  earth.className = 'tab-panel';
  earth.dataset.devTabPanel = 'earth';
  earth.hidden = true;
  const mesh = document.createElement('section');
  mesh.className = 'tab-panel';
  mesh.dataset.devTabPanel = 'mesh';
  mesh.hidden = true;

  if (controlPanel) {
    controlPanel.querySelector('summary').textContent = 'Camera / navigation';
    const resetButton = el('btnResetAxesOrientation');
    if (resetButton && !el('btnCamInfo')) {
      const camButton = document.createElement('button');
      camButton.id = 'btnCamInfo';
      camButton.className = 'secondary';
      camButton.type = 'button';
      camButton.textContent = 'Camera info';
      resetButton.insertAdjacentElement('afterend', camButton);
    }
    panel.insertBefore(controlPanel, el('astroPanel'));
    controlPanel.insertAdjacentElement('afterend', tabs);
  } else {
    panel.insertBefore(tabs, el('astroPanel'));
  }
  tabs.insertAdjacentElement('afterend', astronomy);
  astronomy.insertAdjacentElement('afterend', earth);
  earth.insertAdjacentElement('afterend', mesh);

  appendIfFound(astronomy, 'astroPanel');
  appendIfFound(earth, 'earthPanel');
  appendIfFound(earth, 'importPanel');
  appendIfFound(astronomy, 'hoverPanel');

  const meshPanel = appendIfFound(mesh, 'meshHipsPanel');
  if (meshPanel) {
    meshPanel.open = true;
    meshPanel.classList.add('nested');
  }

  const gridPanel = el('gridPanel');
  if (gridPanel) {
    const astroGrid = makeDetails('astroGridPanel', 'Astronomy grids');
    const astroStack = astroGrid.querySelector('.stack');
    moveLabelForInput(astroStack, 'healpixGridChk');
    moveLabelForInput(astroStack, 'equatorialGridChk');
    astronomy.insertBefore(astroGrid, el('hoverPanel'));

    const earthGrid = makeDetails('earthGridPanel', 'Earth grids');
    moveLabelForInput(earthGrid.querySelector('.stack'), 'lonLatGridChk');
    earth.appendChild(earthGrid);
    gridPanel.remove();
  }

  const importer = el('importPanel');
  if (importer) {
    importer.querySelector('summary').textContent = 'GeoJSON / CSV importer and satellite demo';
  }

  const tabsButtons = Array.from(tabs.querySelectorAll('[data-dev-tab]'));
  const panels = [astronomy, earth, mesh];
  const activate = (tabName) => {
    tabsButtons.forEach((tab) => {
      const active = tab.dataset.devTab === tabName;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    panels.forEach((tabPanel) => {
      tabPanel.hidden = tabPanel.dataset.devTabPanel !== tabName;
    });
  };
  tabsButtons.forEach((tab) => tab.addEventListener('click', () => activate(tab.dataset.devTab)));
  activate('astronomy');
}

export function minimisePanel() {
  const panel = el('devpanel');
  if (!panel) return;
  panel.dataset.min = "1";
  panel.style.height = "44px";
  panel.style.overflow = "hidden";
  panel.style.opacity = "0";
  const rb = el('restoreBtn');
  if (rb) rb.style.display = "inline-block";
}

export function restorePanel() {
  const panel = el('devpanel');
  if (!panel) return;
  panel.dataset.min = "0";
  panel.style.height = "";
  panel.style.overflow = "";
  panel.style.opacity = "1";
  const rb = el('restoreBtn');
  if (rb) rb.style.display = "none";
}
