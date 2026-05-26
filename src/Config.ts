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

export const hipsNodes: string[] = [
  "https://skies.esac.esa.int/",
  "https://alasky.cds.unistra.fr/",
];

// If you want to re-enable multiple TAP repos, just uncomment and extend the array
// export const tapRepos: string[] = [
//   "https://archive.eso.org/tap_cat/",
//   "https://archive.eso.org/tap_obs/",
//   "https://sky.esa.int/esasky-tap/tap/",
//   "https://ws.cadc-ccda.hia-iha.nrc-cnrc.gc.ca/argus",
// ];

export const tapRepos: string[] = [
  "https://sky.esa.int/esasky-tap/tap/",
];

export interface BootSetup {
  insideSphere: boolean;
  defaultHips: string;
  camera_fov_deg: number;
  camera_fov_rad: number;
  inside_camera_fov_deg: number;
  inside_camera_fov_rad: number;
  camera_near_plane: number;
  camera_far_plane: number;
  corsProxyUrl: string;
  useCORSProxy: boolean;
  maxDecimals: number;
  defaultHipsUrl: string;
  version: string;
  debug: boolean;
  insideView: boolean;
  showViewfinder: boolean;
}

export const bootSetup: BootSetup = {
  insideSphere: false,
  defaultHips: "",
  camera_fov_deg: 34,
  camera_fov_rad: 34 * Math.PI / 180.0,
  inside_camera_fov_deg: 60,
  inside_camera_fov_rad: 60 * Math.PI / 180.0,
  camera_near_plane: 0.00001,
  camera_far_plane: 2.5,
  corsProxyUrl: "http://localhost:4000/",
  useCORSProxy: false,
  maxDecimals: 15,
  // defaultHipsUrl: "//alasky.u-strasbg.fr/DSS/DSSColor/",
  defaultHipsUrl: "https://cdn.skies.esac.esa.int/DSSColor/",
  version: "Astrobrowser v1.0.0",
  debug: false,
  insideView: false,
  showViewfinder: true,
};
