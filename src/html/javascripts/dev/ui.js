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

let loadingReadyTimer = null;

const DEFAULT_SECTIONS = {
  astronomy: "navigate",
  earth: "navigate",
  mesh: "navigate",
};

const activeSections = { ...DEFAULT_SECTIONS };
let activeDomain = "astronomy";
let sectionNavigationWired = false;

function setSectionPanelVisible(panel, visible) {
  panel.hidden = !visible;

  if (visible && panel.tagName === "DETAILS") {
    panel.open = true;
  }
}

function activateSection(domain, section) {
  activeSections[domain] = section;

  document
    .querySelectorAll(`[data-ui-domain="${domain}"][data-ui-section]`)
    .forEach((button) => {
      const active = button.dataset.uiSection === section;
      button.classList.toggle("active", active);
      button.setAttribute("aria-current", active ? "page" : "false");
    });

  document
    .querySelectorAll(`[data-ui-panel^="${domain}:"]`)
    .forEach((panel) => {
      setSectionPanelVisible(
        panel,
        panel.dataset.uiPanel === `${domain}:${section}`,
      );
    });

  const overlayDemo = el("astronomyOverlayDemo");
  if (overlayDemo) {
    overlayDemo.classList.toggle(
      "ui-section-visible",
      domain === "astronomy" && section === "overlays",
    );
  }

  document.querySelectorAll("[data-ui-shared-panel]").forEach((panel) => {
    setSectionPanelVisible(
      panel,
      domain === activeDomain && panel.dataset.uiSharedPanel === section,
    );
  });
}

function wireSectionNavigation() {
  if (sectionNavigationWired) {
    return;
  }

  sectionNavigationWired = true;

  document.querySelectorAll("[data-ui-domain][data-ui-section]").forEach((button) => {
    button.addEventListener("click", () => {
      activateSection(button.dataset.uiDomain, button.dataset.uiSection);
    });
  });

  Object.entries(DEFAULT_SECTIONS).forEach(([domain, section]) => {
    activateSection(domain, section);
  });
}

export function showLoading(message = "Loading…") {
  const indicator = el("loadingIndicator");
  const spinner = el("loadingSpinner");
  const icon = el("loadingIcon");
  const messageElement = el("loadingMessage");
  if (!indicator || !messageElement) {
    return;
  }
  if (loadingReadyTimer) {
    window.clearTimeout(loadingReadyTimer);
    loadingReadyTimer = null;
  }
  messageElement.textContent = message;
  if (spinner) {
    spinner.hidden = false;
  }
  if (icon) {
    icon.hidden = true;
  }
  indicator.hidden = false;
}

export function showReady() {
  const indicator = el("loadingIndicator");
  const spinner = el("loadingSpinner");
  const icon = el("loadingIcon");
  const messageElement = el("loadingMessage");
  if (!indicator || !messageElement) {
    return;
  }
  if (loadingReadyTimer) {
    window.clearTimeout(loadingReadyTimer);
  }
  if (spinner) {
    spinner.hidden = true;
  }
  if (icon) {
    icon.hidden = false;
  }
  messageElement.textContent = "Ready";
  indicator.hidden = false;
  loadingReadyTimer = window.setTimeout(() => {
    indicator.hidden = true;
    loadingReadyTimer = null;
  }, 800);
}

export function hideLoading() {
  const indicator = el("loadingIndicator");
  if (loadingReadyTimer) {
    window.clearTimeout(loadingReadyTimer);
    loadingReadyTimer = null;
  }
  if (indicator) {
    indicator.hidden = true;
  }
}

export function wireDevTabs(onDomainChange) {
  const tabs = el("devTabs");

  if (!tabs) {
    return;
  }

  const tabButtons = Array.from(tabs.querySelectorAll("[data-dev-tab]"));

  const tabPanels = Array.from(
    document.querySelectorAll("[data-dev-tab-panel]"),
  );

  wireSectionNavigation();

  const activate = (tabName, notify = true) => {
    activeDomain = tabName;

    tabButtons.forEach((tab) => {
      const active = tab.dataset.devTab === tabName;

      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });

    tabPanels.forEach((panel) => {
      panel.hidden = panel.dataset.devTabPanel !== tabName;
    });

    activateSection(tabName, activeSections[tabName] || DEFAULT_SECTIONS[tabName]);

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
  const restoreButton = el("restoreBtn");

  if (!panel) {
    return;
  }

  panel.dataset.min = "1";
  panel.hidden = true;
  document.body.classList.add("sidebar-collapsed");

  if (restoreButton) {
    restoreButton.style.display = "inline-flex";
    restoreButton.style.alignItems = "center";
    restoreButton.style.justifyContent = "center";
  }
}

export function restorePanel() {
  const panel = el("devpanel");
  const restoreButton = el("restoreBtn");

  if (!panel) {
    return;
  }

  panel.dataset.min = "0";
  panel.hidden = false;
  document.body.classList.remove("sidebar-collapsed");

  if (restoreButton) {
    restoreButton.style.display = "none";
  }
}
