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

/**
 * @author Fabrizio Giordano (Fab)
 */
import { vec3 } from "gl-matrix";

export interface SphericalCoords {
  phi: number; // longitude-like angle in degrees
  theta: number; // colatitude angle in degrees
}

export interface AstroCoords {
  ra: number; // right ascension in degrees
  dec: number; // declination in degrees
}

export interface HMS {
  h: number;
  m: number;
  s: number;
}

export interface DMS {
  d: number;
  m: number;
  s: number;
}

// results in degrees
export function cartesianToSpherical(xyz: vec3): SphericalCoords {
  const dotXYZ = vec3.dot(xyz, xyz);
  const r = Math.sqrt(dotXYZ);
  let theta = Math.acos(xyz[2] / r);
  theta = radToDeg(theta);

  // NB: in atan(y/x) is written with params switched atan2(x, y)
  let phi = Math.atan2(xyz[1], xyz[0]);
  phi = radToDeg(phi);

  if (phi < 0) {
    phi += 360;
  }

  return { phi, theta };
}

export function colorHex2RGB(hexColor: string): [number, number, number] {
  const hex1 = hexColor.substring(1, 3);
  const hex2 = hexColor.substring(3, 5);
  const hex3 = hexColor.substring(5, 7);

  const dec1 = parseInt(hex1, 16);
  const dec2 = parseInt(hex2, 16);
  const dec3 = parseInt(hex3, 16);

  const rgb1 = (dec1 / 255).toFixed(2);
  const rgb2 = (dec2 / 255).toFixed(2);
  const rgb3 = (dec3 / 255).toFixed(2);

  return [parseFloat(rgb1), parseFloat(rgb2), parseFloat(rgb3)];
}

export function degToRad(degrees: number): number {
  return (degrees / 180) * Math.PI;
}

export function radToDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}

export function sphericalToAstroDeg(
  phiDeg: number,
  thetaDeg: number,
): AstroCoords {
  let raDeg = phiDeg;
  if (raDeg < 0) {
    raDeg += 360;
  }
  const decDeg = 90 - thetaDeg;
  return { ra: raDeg, dec: decDeg };
}

export function sphericalToCartesian(
  phiDeg: number,
  thetaDeg: number,
  r: number = 1,
): [number, number, number] {
  const x = r * Math.sin(degToRad(thetaDeg)) * Math.cos(degToRad(phiDeg));
  const y = r * Math.sin(degToRad(thetaDeg)) * Math.sin(degToRad(phiDeg));
  const z = r * Math.cos(degToRad(thetaDeg));
  return [x, y, z];
}

export function astroDegToSpherical(
  raDeg: number,
  decDeg: number,
): SphericalCoords {
  let phiDeg = raDeg;
  if (phiDeg < 0) {
    phiDeg += 360;
  }
  const thetaDeg = 90 - decDeg;
  return { phi: phiDeg, theta: thetaDeg };
}

export function raDegToHMS(raDeg: number): HMS {
  const h = Math.floor(raDeg / 15);
  const m = Math.floor((raDeg / 15 - h) * 60);
  const s = (raDeg / 15 - h - m / 60) * 3600;
  return { h, m, s };
}

export function decDegToDMS(decDeg: number): DMS {
  let sign = 1;
  if (decDeg < 0) {
    sign = -1;
  }

  const decDegAbs = Math.abs(decDeg);
  let d = Math.trunc(decDegAbs);
  const m = Math.trunc((decDegAbs - d) * 60);
  const s = (decDegAbs - d - m / 60) * 3600;
  d = d * sign;

  return { d, m, s };
}

export function raHMSToDeg(hms: HMS): number {
  return 15 * (hms.h + hms.m / 60 + hms.s / 3600);
}

export function decDMSToDeg(dms: DMS): number {
  const sign = dms.d < 0 || Object.is(dms.d, -0) ? -1 : 1;
  return sign * (Math.abs(dms.d) + dms.m / 60 + dms.s / 3600);
}
