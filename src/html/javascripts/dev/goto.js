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

import { setStatus, el } from "./ui.js";
import { state } from "./state.js";
import { refreshCenter } from "./coords.js";

function normalizeRa(value) {
  return ((value % 360) + 360) % 360;
}

function normalizeLongitude(value) {
  return ((((value + 180) % 360) + 360) % 360) - 180;
}

function clampLatitude(value) {
  return Math.max(-90, Math.min(90, value));
}

function wireNavigation({
  firstInputId,
  secondInputId,
  buttonId,
  domain,
  firstLabel,
  secondLabel,
  normalizeFirst,
}) {
  const firstInput = el(firstInputId);
  const secondInput = el(secondInputId);
  const button = el(buttonId);

  if (!button) return;

  const goTo = () => {
    const first = Number(firstInput?.value);
    const second = Number(secondInput?.value);

    if (!Number.isFinite(first) || !Number.isFinite(second)) {
      return setStatus(
        `Enter valid ${firstLabel} and ${secondLabel} in degrees.`,
      );
    }

    if (!state.AstroAPI?.goTo) {
      return setStatus("AstroAPI.goTo unavailable.");
    }

    const firstNormalized = normalizeFirst(first);
    const secondClamped = clampLatitude(second);

    try {
      state.AstroAPI.goTo(firstNormalized, secondClamped);

      setStatus(
        `➡️ ${domain}: ${firstLabel}=${firstNormalized.toFixed(5)}°, ` +
          `${secondLabel}=${secondClamped.toFixed(5)}°`,
      );

      refreshCenter();
    } catch (e) {
      setStatus("goTo error: " + (e.message || e));
    }
  };

  button.addEventListener("click", goTo);

  [firstInput, secondInput].forEach((input) => {
    input?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        goTo();
      }
    });
  });
}

export function wireGoto() {
  wireNavigation({
    firstInputId: "astronomyGoRa",
    secondInputId: "astronomyGoDec",
    buttonId: "btnAstronomyGoTo",
    domain: "Astronomy",
    firstLabel: "RA",
    secondLabel: "Dec",
    normalizeFirst: normalizeRa,
  });

  wireNavigation({
    firstInputId: "earthGoLon",
    secondInputId: "earthGoLat",
    buttonId: "btnEarthGoTo",
    domain: "Earth",
    firstLabel: "Lon",
    secondLabel: "Lat",
    normalizeFirst: normalizeLongitude,
  });

  wireNavigation({
    firstInputId: "meshGoLon",
    secondInputId: "meshGoLat",
    buttonId: "btnMeshGoTo",
    domain: "3D / Mesh",
    firstLabel: "Lon",
    secondLabel: "Lat",
    normalizeFirst: normalizeLongitude,
  });
}
