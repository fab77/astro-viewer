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

// GridShaderManager.ts
'use strict'

class GridShaderManager {
  static healpixGridVS(): string {
    return `#version 300 es
        in vec4 aCatPosition;
        uniform mat4 uMVMatrix;
        uniform mat4 uPMatrix;

        void main() {
            gl_Position = uPMatrix * uMVMatrix * aCatPosition;
            gl_PointSize = 7.0;
        }`
  }

  static healpixGridFS(): string {
    return `#version 300 es
        precision mediump float;

        uniform vec4 u_fragcolor;
        out vec4 fragColor;

        void main() {
            // fragColor = vec4(1.0, 0.0, 0.0, 1.0);
            fragColor = u_fragcolor;
        }`
  }
}

export default GridShaderManager