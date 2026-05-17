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