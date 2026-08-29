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

export const setStatus = (text) => {
  const status = el("status");

  if (status) {
    status.textContent = text || "";
  }
};

export function wireDevTabs(onDomainChange) {
  const tabs = el("devTabs");

  if (!tabs) {
    return;
  }

  const tabButtons = Array.from(tabs.querySelectorAll("[data-dev-tab]"));

  const tabPanels = Array.from(
    document.querySelectorAll("[data-dev-tab-panel]"),
  );

  const activate = (tabName, notify = true) => {
    tabButtons.forEach((tab) => {
      const active = tab.dataset.devTab === tabName;

      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });

    tabPanels.forEach((panel) => {
      panel.hidden = panel.dataset.devTabPanel !== tabName;
    });

    if (notify && typeof onDomainChange === "function") {
      onDomainChange(tabName);
    }
  };

  tabButtons.forEach((tab) => {
    tab.addEventListener("click", () => {
      activate(tab.dataset.devTab);
    });
  });

  /*
   * Astronomy is already the initial domain loaded by boot.js.
   * Do not notify here, otherwise its default layer would be
   * activated a second time during boot.
   */
  activate("astronomy", false);
}

export function minimisePanel() {
  const panel = el("devpanel");

  if (!panel) {
    return;
  }

  panel.dataset.min = "1";
  panel.style.height = "44px";
  panel.style.overflow = "hidden";
  panel.style.opacity = "0";

  const restoreButton = el("restoreBtn");

  if (restoreButton) {
    restoreButton.style.display = "inline-block";
  }
}

export function restorePanel() {
  const panel = el("devpanel");

  if (!panel) {
    return;
  }

  panel.dataset.min = "0";
  panel.style.height = "";
  panel.style.overflow = "";
  panel.style.opacity = "1";

  const restoreButton = el("restoreBtn");

  if (restoreButton) {
    restoreButton.style.display = "none";
  }
}
