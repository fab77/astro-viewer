// ShaderManager.ts

export type GLSLSource = string;

export default class ShaderManager {
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

    uniform sampler2D uSampler0;
    uniform sampler2D uSampler1;
    uniform sampler2D uSampler2;
    uniform sampler2D uSampler3;
    uniform sampler2D uSampler4;
    uniform sampler2D uSampler5;
    uniform sampler2D uSampler6;
    uniform sampler2D uSampler7;

    uniform float uFactor0;
    uniform float uFactor1;
    uniform float uFactor2;
    uniform float uFactor3;
    uniform float uFactor4;
    uniform float uFactor5;
    uniform float uFactor6;
    uniform float uFactor7;

    out vec4 fragColor;

    void main() {
      vec3 finalColor = vec3(0.0);

      if (uFactor0 >= 0.0){
        vec4 mycolor;
        #if __VERSION__ > 120
          vec4 color0 = texture(uSampler0, vTextureCoord);
        #else
          vec4 color0 = texture2D(uSampler0, vTextureCoord);
        #endif
        mycolor = color0;
        finalColor += mycolor.rgb * uFactor0;
      } else if (uFactor7 >= 0.0){
        finalColor = vec3(1.0, 0.0, 0.0);
      }
      fragColor = vec4(finalColor, 1.0);
    }`;
  }

  static hipsGrayscaleFS(): GLSLSource {
    return `#version 300 es
    precision mediump float;

    in vec2 vTextureCoord;

    uniform sampler2D uSampler0;
    uniform sampler2D uSampler1;
    uniform sampler2D uSampler2;
    uniform sampler2D uSampler3;
    uniform sampler2D uSampler4;
    uniform sampler2D uSampler5;
    uniform sampler2D uSampler6;
    uniform sampler2D uSampler7;

    uniform float uFactor0;
    uniform float uFactor1;
    uniform float uFactor2;
    uniform float uFactor3;
    uniform float uFactor4;
    uniform float uFactor5;
    uniform float uFactor6;
    uniform float uFactor7;

    out vec4 fragColor;

    void main() {
      vec3 finalColor = vec3(0.0);

      if (uFactor0 >= 0.0){
        #if __VERSION__ > 120
          vec4 color0 = texture(uSampler0, vTextureCoord);
        #else
          vec4 color0 = texture2D(uSampler0, vTextureCoord);
        #endif
        float gray = 0.21 * color0.r + 0.71 * color0.g + 0.07 * color0.b;
        finalColor = color0.rgb * (1.0 - uFactor0) + vec3(gray) * uFactor0;
      }
      if (uFactor1 >= 0.0){
        #if __VERSION__ > 120
          vec4 color1 = texture(uSampler1, vTextureCoord);
        #else
          vec4 color1 = texture2D(uSampler1, vTextureCoord);
        #endif
        finalColor += color1.rgb * uFactor1;
      }
      if (uFactor2 >= 0.0){
        #if __VERSION__ > 120
          vec4 color2 = texture(uSampler2, vTextureCoord);
        #else
          vec4 color2 = texture2D(uSampler2, vTextureCoord);
        #endif
        finalColor += color2.rgb * uFactor2;
      }
      if (uFactor3 >= 0.0){
        #if __VERSION__ > 120
          vec4 color3 = texture(uSampler3, vTextureCoord);
        #else
          vec4 color3 = texture2D(uSampler3, vTextureCoord);
        #endif
        finalColor += color3.rgb * uFactor3;
      }
      if (uFactor4 >= 0.0){
        #if __VERSION__ > 120
          vec4 color4 = texture(uSampler4, vTextureCoord);
        #else
          vec4 color4 = texture2D(uSampler4, vTextureCoord);
        #endif
        finalColor += color4.rgb * uFactor4;
      }
      if (uFactor5 >= 0.0){
        #if __VERSION__ > 120
          vec4 color5 = texture(uSampler5, vTextureCoord);
        #else
          vec4 color5 = texture2D(uSampler5, vTextureCoord);
        #endif
        finalColor += color5.rgb * uFactor5;
      }
      if (uFactor6 >= 0.0){
        #if __VERSION__ > 120
          vec4 color6 = texture(uSampler6, vTextureCoord);
        #else
          vec4 color6 = texture2D(uSampler6, vTextureCoord);
        #endif
        finalColor += color6.rgb * uFactor6;
      }
      if (uFactor7 >= 0.0){
        #if __VERSION__ > 120
          vec4 color7 = texture(uSampler7, vTextureCoord);
        #else
          vec4 color7 = texture2D(uSampler7, vTextureCoord);
        #endif
        finalColor += color7.rgb * uFactor7;
      }
      fragColor = vec4(finalColor, 1.0);
    }`;
  }

  static hipsColorMapFS(): GLSLSource {
    return `#version 300 es
    precision mediump float;

    in vec2 vTextureCoord;

    // UBO
    layout (std140) uniform colormap {
      float r_palette[256];
      float g_palette[256];
      float b_palette[256];
    };

    uniform sampler2D uSampler0;
    uniform float uFactor0;

    out vec4 fragColor;

    void main() {
      #if __VERSION__ > 120
        vec4 color0 = texture(uSampler0, vTextureCoord);
      #else
        vec4 color0 = texture2D(uSampler0, vTextureCoord);
      #endif

      int x = int(color0.r * 255.0);
      float px = r_palette[x] / 256.0;

      int y = int(color0.g * 255.0);
      float py = g_palette[y] / 256.0;

      int z = int(color0.b * 255.0);
      float pz = b_palette[z] / 256.0;

      // uFactor0 reserved for future blending if needed
      fragColor = vec4(px, py, pz, 1.0);
    }`;
  }
}