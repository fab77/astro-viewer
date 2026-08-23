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

// ShaderManager.ts

export type GLSLSource = string;

export default class ShaderManager {
  static catalogueVS(): GLSLSource {
    return `#version 300 es
    in vec4 aCatPosition;
    in float a_selected;
    in float a_pointsize;
    in float a_brightness;

    out float v_selected;
    out float v_brightness;
    out lowp vec4 vColor;  // not used

    uniform mat4 uPMatrix;
    uniform mat4 uMVMatrix;

    void main() {

      gl_Position = (uPMatrix * uMVMatrix * aCatPosition);
      gl_PointSize = a_pointsize;
      v_selected = a_selected;
      v_brightness = a_brightness;
    }`;
  }

  static catalogueFS(): GLSLSource {
    return `#version 300 es
    precision mediump float;
    
    #ifdef GL_OES_standard_derivatives
    #extension GL_OES_standard_derivatives : enable
    #endif

    // https://www.desultoryquest.com/blog/drawing-anti-aliased-circular-points-using-opengl-slash-webgl/

    // precision mediump float;

    in float v_selected;
    in float v_brightness;

    uniform vec4 u_fragcolor;

    out vec4 fragColor;

    // varying float v_selected;
    // varying float v_brightness;

    const float EPSILON = 1e-10;
    
    vec3 RGBtoHCV(in vec3 rgb) {
      // RGB [0..1] to Hue-Chroma-Value [0..1]
      // Based on work by Sam Hocevar and Emil Persson
      vec4 p = (rgb.g < rgb.b) ? vec4(rgb.bg, -1., 2. / 3.) : vec4(rgb.gb, 0., -1. / 3.);
      vec4 q = (rgb.r < p.x) ? vec4(p.xyw, rgb.r) : vec4(rgb.r, p.yzx);
      float c = q.x - min(q.w, q.y);
      float h = abs((q.w - q.y) / (6. * c + EPSILON) + q.z);
      return vec3(h, c, q.x);
    }

    vec3 RGBtoHSL(in vec3 rgb) {
      // RGB [0..1] to Hue-Saturation-Lightness [0..1]
      vec3 hcv = RGBtoHCV(rgb);
      //vec3 hcv = vec3(1., 1., 1.);
      float z = hcv.z - hcv.y * 0.5;
      float s = hcv.y / (1. - abs(z * 2. - 1.) + EPSILON);
      return vec3(hcv.x, s, z);
    }

    vec3 HUEtoRGB(in float hue){
      // Hue [0..1] to RGB [0..1]
      // See http://www.chilliant.com/rgb2hsv.html
      vec3 rgb = abs(hue * 6. - vec3(3, 2, 4)) * vec3(1, -1, -1) + vec3(-1, 2, 2);
      return clamp(rgb, 0., 1.);
    }

    vec3 HSLtoRGB(in vec3 hsl) {
      // Hue-Saturation-Lightness [0..1] to RGB [0..1]
      vec3 rgb = HUEtoRGB(hsl.x);
      float c = (1. - abs(2. * hsl.z - 1.)) * hsl.y;
      return (rgb - 0.5) * c + hsl.z;
    }
  
    void main() {

      float r = 0.0, delta = 0.0, alpha = 1.0;
      vec2 cxy = 2.0 * gl_PointCoord - 1.0;
      r = dot(cxy, cxy);
      if (r > 1.0) {
        discard;
      }

      #ifdef GL_OES_standard_derivatives
        delta = fwidth(r);
        alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);
      #endif

      if (v_selected == 1.0){
        // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0) * (alpha);
        fragColor = vec4(1.0, 0.0, 0.0, 1.0) * (alpha);
      } else if (v_selected == 2.0){
        // gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0) * (alpha);
        fragColor = vec4(1.0, 1.0, 0.0, 1.0) * (alpha);
      }else{
        if (r < 0.4) {
          discard;
        }
        if ( v_brightness >= -1.0 && v_brightness <= 1.0) {
          // Round-trip RGB->HSL->RGB with time-dependent lightness
          vec3 hsl = RGBtoHSL(vec3(u_fragcolor));
          //hsl.z = pow(hsl.z, sin(iTime) + 1.5);
          // hsl.z = pow(hsl.z, v_brightness + 1.5);
          hsl.z = pow(hsl.z, v_brightness + 1.5);
          vec3 hslcolor = HSLtoRGB(hsl);
          // gl_FragColor = vec4(hslcolor, u_fragcolor[3]) * (alpha);
          fragColor = vec4(hslcolor, u_fragcolor[3]) * (alpha);
        } else {
          // gl_FragColor = u_fragcolor * (alpha);
          fragColor = u_fragcolor * (alpha);
        }
      }
    }`;
  }

  static footprintVS(): GLSLSource {
    return `#version 300 es
    precision highp float;

    layout(location = 0) in vec4 aCatPosition;

    uniform float u_pointsize;
    uniform mat4 uMVMatrix;
    uniform mat4 uPMatrix;

    void main() {
      gl_Position = uPMatrix * uMVMatrix * aCatPosition;
      gl_PointSize = u_pointsize;   // Works in WebGL2
    }`;
  }

  static footprintFS(): GLSLSource {
    return `#version 300 es
    precision mediump float;

    uniform vec4 u_fragcolor;
    out vec4 fragColor;

    void main() {
      fragColor = u_fragcolor;
    }`;
  }

  static hipsVS(): GLSLSource {
    return `#version 300 es
    in vec3 aVertexPosition;
    in vec2 aTextureCoord;

    uniform mat4 uMMatrix;
    uniform mat4 uVMatrix;
    uniform mat4 uPMatrix;

    out vec2 vTextureCoord;

    void main() {
      gl_Position = uPMatrix * uVMatrix * uMMatrix * vec4(aVertexPosition, 1.0);
      vTextureCoord = aTextureCoord;
    }`;
  }

  static hipsNativeFS(): GLSLSource {
    return `#version 300 es
    precision mediump float;

    in vec2 vTextureCoord;

    uniform float uFactor0;
    uniform float uFactor1;
    uniform float uFactor2;
    uniform float uFactor3;
    uniform float uFactor4;
    uniform float uFactor5;
    uniform float uFactor6;
    uniform float uFactor7;

    ${ShaderManager.hipsSamplersGLSL()}

    out vec4 fragColor;

    void main() {
      vec3 finalColor = vec3(0.0);

      if (uFactor0 >= 0.0) {
        finalColor +=
          sampleHiPSTexture0(vTextureCoord).rgb * uFactor0;
      }

      if (uFactor1 >= 0.0) {
        finalColor +=
          sampleHiPSTexture1(vTextureCoord).rgb * uFactor1;
      }

      if (uFactor2 >= 0.0) {
        finalColor +=
          sampleHiPSTexture2(vTextureCoord).rgb * uFactor2;
      }

      if (uFactor3 >= 0.0) {
        finalColor +=
          sampleHiPSTexture3(vTextureCoord).rgb * uFactor3;
      }

      if (uFactor4 >= 0.0) {
        finalColor +=
          sampleHiPSTexture4(vTextureCoord).rgb * uFactor4;
      }

      if (uFactor5 >= 0.0) {
        finalColor +=
          sampleHiPSTexture5(vTextureCoord).rgb * uFactor5;
      }

      if (uFactor6 >= 0.0) {
        finalColor +=
          sampleHiPSTexture6(vTextureCoord).rgb * uFactor6;
      }

      if (uFactor7 >= 0.0) {
        finalColor +=
          sampleHiPSTexture7(vTextureCoord).rgb * uFactor7;
      }

      fragColor = vec4(finalColor, 1.0);
    }`;
  }

  static hipsGrayscaleFS(): GLSLSource {
    return `#version 300 es
    precision mediump float;

    in vec2 vTextureCoord;

    uniform float uFactor0;
    uniform float uFactor1;
    uniform float uFactor2;
    uniform float uFactor3;
    uniform float uFactor4;
    uniform float uFactor5;
    uniform float uFactor6;
    uniform float uFactor7;

    ${ShaderManager.hipsSamplersGLSL()}

    out vec4 fragColor;

    void main() {
      vec3 finalColor = vec3(0.0);

      if (uFactor0 >= 0.0) {
        vec4 color0 = sampleHiPSTexture0(vTextureCoord);

        float gray =
          0.21 * color0.r +
          0.71 * color0.g +
          0.07 * color0.b;

        finalColor =
          color0.rgb * (1.0 - uFactor0) +
          vec3(gray) * uFactor0;
      }

      if (uFactor1 >= 0.0) {
        vec4 color1 = sampleHiPSTexture1(vTextureCoord);
        finalColor += color1.rgb * uFactor1;
      }

      if (uFactor2 >= 0.0) {
        vec4 color2 = sampleHiPSTexture2(vTextureCoord);
        finalColor += color2.rgb * uFactor2;
      }

      if (uFactor3 >= 0.0) {
        vec4 color3 = sampleHiPSTexture3(vTextureCoord);
        finalColor += color3.rgb * uFactor3;
      }

      if (uFactor4 >= 0.0) {
        vec4 color4 = sampleHiPSTexture4(vTextureCoord);
        finalColor += color4.rgb * uFactor4;
      }

      if (uFactor5 >= 0.0) {
        vec4 color5 = sampleHiPSTexture5(vTextureCoord);
        finalColor += color5.rgb * uFactor5;
      }

      if (uFactor6 >= 0.0) {
        vec4 color6 = sampleHiPSTexture6(vTextureCoord);
        finalColor += color6.rgb * uFactor6;
      }

      if (uFactor7 >= 0.0) {
        vec4 color7 = sampleHiPSTexture7(vTextureCoord);
        finalColor += color7.rgb * uFactor7;
      }

      fragColor = vec4(finalColor, 1.0);
    }`;
  }

  static hipsColorMapFS(): GLSLSource {
    return `#version 300 es
    precision mediump float;

    in vec2 vTextureCoord;

    layout (std140) uniform colormap {
      float r_palette[256];
      float g_palette[256];
      float b_palette[256];
    };

    uniform float uFactor0;
    uniform float uFactor1;
    uniform float uFactor2;
    uniform float uFactor3;
    uniform float uFactor4;
    uniform float uFactor5;
    uniform float uFactor6;
    uniform float uFactor7;

    ${ShaderManager.hipsSamplersGLSL()}

    out vec4 fragColor;

    vec3 applyColorMap(vec4 color) {
      int x = int(clamp(color.r, 0.0, 1.0) * 255.0);
      int y = int(clamp(color.g, 0.0, 1.0) * 255.0);
      int z = int(clamp(color.b, 0.0, 1.0) * 255.0);

      float px = r_palette[x] / 256.0;
      float py = g_palette[y] / 256.0;
      float pz = b_palette[z] / 256.0;

      return vec3(px, py, pz);
    }

    void main() {
      vec3 finalColor = vec3(0.0);

      if (uFactor0 >= 0.0) {
        finalColor +=
          applyColorMap(
            sampleHiPSTexture0(vTextureCoord)
          ) * uFactor0;
      }

      if (uFactor1 >= 0.0) {
        finalColor +=
          applyColorMap(
            sampleHiPSTexture1(vTextureCoord)
          ) * uFactor1;
      }

      if (uFactor2 >= 0.0) {
        finalColor +=
          applyColorMap(
            sampleHiPSTexture2(vTextureCoord)
          ) * uFactor2;
      }

      if (uFactor3 >= 0.0) {
        finalColor +=
          applyColorMap(
            sampleHiPSTexture3(vTextureCoord)
          ) * uFactor3;
      }

      if (uFactor4 >= 0.0) {
        finalColor +=
          applyColorMap(
            sampleHiPSTexture4(vTextureCoord)
          ) * uFactor4;
      }

      if (uFactor5 >= 0.0) {
        finalColor +=
          applyColorMap(
            sampleHiPSTexture5(vTextureCoord)
          ) * uFactor5;
      }

      if (uFactor6 >= 0.0) {
        finalColor +=
          applyColorMap(
            sampleHiPSTexture6(vTextureCoord)
          ) * uFactor6;
      }

      if (uFactor7 >= 0.0) {
        finalColor +=
          applyColorMap(
            sampleHiPSTexture7(vTextureCoord)
          ) * uFactor7;
      }

      fragColor = vec4(finalColor, 1.0);
    }`;
  }

  private static hipsSamplerGLSL(index: number): GLSLSource {
    return `
    uniform sampler2D uSampler${index};
    uniform int uTextureMode${index};
    uniform float uDataMin${index};
    uniform float uDataMax${index};

    vec4 sampleHiPSTexture${index}(vec2 uv) {
      vec4 color = texture(uSampler${index}, uv);

      // JPG / PNG
      if (uTextureMode${index} == 0) {
        return color;
      }

      // FITS physical value stored in red channel
      float value = color.r;

      if (isnan(value)) {
        discard;
      }

      float normalized = clamp(
        (value - uDataMin${index}) /
        (uDataMax${index} - uDataMin${index}),
        0.0,
        1.0
      );

      return vec4(
        normalized,
        normalized,
        normalized,
        1.0
      );
    }
  `;
  }

  private static hipsSamplersGLSL(): GLSLSource {
    return Array.from({ length: 8 }, (_, index) =>
      ShaderManager.hipsSamplerGLSL(index),
    ).join("\n");
  }
}
