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

// import global from "../Global.js";
// // import ShaderManager from "../shader/ShaderManager.js";

// // type GL = WebGLRenderingContext | WebGL2RenderingContext;

// class ShaderUtility {
//   private lastUsedProgram: WebGLProgram | null = null;

//   /** Bind a WebGL program only if it's not already bound. */
//   // useProgram(program: WebGLProgram, webgl: WebGL2RenderingContext): void {
//   useProgram(program: WebGLProgram): void {
//     const gl = global.gl;
//     // const gl = webgl;
//     if (!gl) {
//       throw new Error("WebGL context is not initialized.");
//     }
//     if (this.lastUsedProgram !== program) {
//       gl.useProgram(program);
//       this.lastUsedProgram = program;
//     }
//   }
// }

// export const shaderUtility = new ShaderUtility();
// export default ShaderUtility;