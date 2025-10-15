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