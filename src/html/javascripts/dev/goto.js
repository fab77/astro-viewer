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

const FLY_DURATION_MS = 1200;

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
  flyButtonId,
  domain,
  firstLabel,
  secondLabel,
  normalizeFirst,
}) {
  const firstInput = el(firstInputId);
  const secondInput = el(secondInputId);
  const button = el(buttonId);
  const flyButton = el(flyButtonId);

  if (!button) return;

  const readCoordinates = () => {
    const first = Number(firstInput?.value);
    const second = Number(secondInput?.value);

    if (!Number.isFinite(first) || !Number.isFinite(second)) {
      setStatus(`Enter valid ${firstLabel} and ${secondLabel} in degrees.`);
      return null;
    }

    return {
      first: normalizeFirst(first),
      second: clampLatitude(second),
    };
  };

  const goTo = () => {
    const coords = readCoordinates();
    if (!coords) return;

    if (!state.AstroAPI?.goTo) {
      return setStatus("AstroAPI.goTo unavailable.");
    }

    try {
      state.AstroAPI.goTo(coords.first, coords.second);

      setStatus(
        `➡️ ${domain}: ${firstLabel}=${coords.first.toFixed(5)}°, ` +
          `${secondLabel}=${coords.second.toFixed(5)}°`,
      );

      refreshCenter();
    } catch (e) {
      setStatus("goTo error: " + (e.message || e));
    }
  };

  const flyTo = () => {
    const coords = readCoordinates();
    if (!coords) return;

    if (!state.AstroAPI?.flyTo) {
      return setStatus("AstroAPI.flyTo unavailable.");
    }

    try {
      state.AstroAPI.flyTo(coords.first, coords.second, FLY_DURATION_MS);

      setStatus(
        `✈️ ${domain}: ${firstLabel}=${coords.first.toFixed(5)}°, ` +
          `${secondLabel}=${coords.second.toFixed(5)}°`,
      );
    } catch (e) {
      setStatus("flyTo error: " + (e.message || e));
    }
  };

  button.addEventListener("click", goTo);

  flyButton?.addEventListener("click", flyTo);

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
    flyButtonId: "btnAstronomyFlyTo",
    domain: "Astronomy",
    firstLabel: "RA",
    secondLabel: "Dec",
    normalizeFirst: normalizeRa,
  });

  wireNavigation({
    firstInputId: "earthGoLon",
    secondInputId: "earthGoLat",
    buttonId: "btnEarthGoTo",
    flyButtonId: "btnEarthFlyTo",
    domain: "Earth",
    firstLabel: "Lon",
    secondLabel: "Lat",
    normalizeFirst: normalizeLongitude,
  });

  wireNavigation({
    firstInputId: "meshGoLon",
    secondInputId: "meshGoLat",
    buttonId: "btnMeshGoTo",
    flyButtonId: "btnMeshFlyTo",
    domain: "3D / Mesh",
    firstLabel: "Lon",
    secondLabel: "Lat",
    normalizeFirst: normalizeLongitude,
  });
}
