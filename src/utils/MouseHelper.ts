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

/**
 * @author Fabrizio Giordano (Fab)
 */
import { vec3, ReadonlyVec3 } from "gl-matrix";
import { Vec3, Pointing, Healpix } from "healpixjs";
import global from "../Global.js";
import {
  cartesianToSpherical,
  sphericalToAstroDeg,
  raDegToHMS,
  decDegToDMS,
  type SphericalCoords,
  type AstroCoords,
  type HMS,
  type DMS,
} from "./Utils.js";

type XYZ = [number, number, number];

function toVec3(p: ReadonlyVec3 | XYZ): ReadonlyVec3 {
  return Array.isArray(p) ? (vec3.fromValues(p[0], p[1], p[2]) as ReadonlyVec3) : p;
}

class MouseHelper {
  private _xyz: XYZ | null = null;
  private _raDecDeg: AstroCoords | null = null;
  private _phiThetaDeg: SphericalCoords | null = null;

  raHMS?: HMS;
  decDMS?: DMS;

  /**
   * @param in_xyz [x, y, z]
   * @param in_raDecDeg { ra, dec } in degrees (ICRS/J2000)
   * @param in_phiThetaDeg { phi, theta } in degrees (spherical)
   */
  constructor(
    in_xyz?: XYZ | null,
    in_raDecDeg?: AstroCoords | null,
    in_phiThetaDeg?: SphericalCoords | null
  ) {
    if (in_xyz != null) this._xyz = in_xyz;
    if (in_raDecDeg != null) this._raDecDeg = in_raDecDeg;
    if (in_phiThetaDeg != null) this._phiThetaDeg = in_phiThetaDeg;

    if (this._raDecDeg) {
      this.raHMS = raDegToHMS(this._raDecDeg.ra);
      this.decDMS = decDegToDMS(this._raDecDeg.dec);
    }
  }

  /** (Formerly `computeNpix256`) Uses global.nsideForSelection. */
  computeNpix(): number | null {
    if (!this._xyz) return null;
    const hp: Healpix = global.getHealpix(global.nsideForSelection);
    const v = new Vec3(this._xyz[0], this._xyz[1], this._xyz[2]);
    const ptg = new Pointing(v, false);
    return hp.ang2pix(ptg, false);
  }

  /** Update helper state from a world-space 3D point on the unit sphere. */
  update(mousePoint: ReadonlyVec3 | XYZ): void {
    const mp = toVec3(mousePoint);
    const sph = cartesianToSpherical(mp);
    const radec = sphericalToAstroDeg(sph.phi, sph.theta);

    this._xyz = [mp[0], mp[1], mp[2]];
    this._phiThetaDeg = sph;
    this._raDecDeg = radec;
    this.raHMS = raDegToHMS(radec.ra);
    this.decDMS = decDegToDMS(radec.dec);
  }

  clear(): void {
    this._xyz = null;
    this._raDecDeg = null;
    this._phiThetaDeg = null;
    this.raHMS = undefined;
    this.decDMS = undefined;
  }

  // --- getters ---
  get xyz(): XYZ | null {
    return this._xyz;
  }
  get x(): number | null {
    return this._xyz ? this._xyz[0] : null;
  }
  get y(): number | null {
    return this._xyz ? this._xyz[1] : null;
  }
  get z(): number | null {
    return this._xyz ? this._xyz[2] : null;
  }

  get ra(): number | null {
    return this._raDecDeg ? this._raDecDeg.ra : null;
  }
  get dec(): number | null {
    return this._raDecDeg ? this._raDecDeg.dec : null;
  }

  get phi(): number | null {
    return this._phiThetaDeg ? this._phiThetaDeg.phi : null;
  }
  get theta(): number | null {
    return this._phiThetaDeg ? this._phiThetaDeg.theta : null;
  }

  get raDecDeg(): AstroCoords | null {
    return this._raDecDeg;
  }
  get phiThetaDeg(): SphericalCoords | null {
    return this._phiThetaDeg;
  }
}

export default MouseHelper;