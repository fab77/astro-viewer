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

import { XYZShaderProgram } from '../../shader/XYZShaderProgram.js';
import type { XYZBufferedTile } from './XYZTileBuffer.js';
import { XYZMeshBuilder } from './XYZMeshBuilder.js';
import type { XYZTileCoord, XYZTileGpuMesh, XYZTileMesh } from './XYZTypes.js';

type Mat4 = Float32Array;

export class XYZTile implements XYZBufferedTile {
  private _coord: XYZTileCoord;
  private _url: string;
  private _webgl: WebGL2RenderingContext;
  private _shaderProgram: XYZShaderProgram;
  private _meshBuilder: XYZMeshBuilder;
  private _gpuMesh: XYZTileGpuMesh;
  private _texture: WebGLTexture | null = null;
  private _image?: HTMLImageElement;
  private _ready = false;
  private _loading = false;
  private _aborted = false;
  private _failedUntil = 0;
  private _lastUsedAt = 0;
  private _createdAt = Date.now();

  constructor(
    coord: XYZTileCoord,
    url: string,
    webgl: WebGL2RenderingContext,
    shaderProgram: XYZShaderProgram,
    meshBuilder = new XYZMeshBuilder(),
    segmentsPerSide = 16,
  ) {
    this._coord = coord;
    this._url = url;
    this._webgl = webgl;
    this._shaderProgram = shaderProgram;
    this._meshBuilder = meshBuilder;

    const mesh = this._meshBuilder.buildTileMesh(coord, segmentsPerSide);
    this._gpuMesh = this._meshBuilder.uploadMesh(mesh, this._webgl);
    this.initImage();
  }

  get coord(): XYZTileCoord {
    return this._coord;
  }

  get ready(): boolean {
    return this._ready;
  }

  get loading(): boolean {
    return this._loading;
  }

  get failedUntil(): number {
    return this._failedUntil;
  }

  get lastUsedAt(): number {
    return this._lastUsedAt;
  }

  get createdAt(): number {
    return this._createdAt;
  }

  touch(): void {
    this._lastUsedAt = Date.now();
  }

  private initImage(): void {
    if (this._loading || this._ready || this._aborted) {
      return;
    }

    const now = Date.now();
    if (this._failedUntil > now) {
      return;
    }

    this._loading = true;
    const image = new Image();
    this._image = image;
    image.crossOrigin = 'anonymous';
    image.onload = () => this.imageLoaded();
    image.onerror = () => {
      this._ready = false;
      this._loading = false;
      this._failedUntil = Date.now() + 30_000;
    };
    image.src = this._url;
  }

  private imageLoaded(): void {
    if (!this._image || this._aborted) {
      return;
    }

    this.textureLoaded(this._image);
    this._loading = false;
    this._failedUntil = 0;
    this._ready = true;
  }

  private textureLoaded(image: HTMLImageElement): void {
    const gl = this._webgl;
    this._shaderProgram.enableProgram();

    const texture = gl.createTexture();
    if (!texture) {
      throw new Error(`Could not create XYZ texture for ${this.key}`);
    }

    this._texture = texture;
    gl.activeTexture(gl.TEXTURE0);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }

  draw(
    pMatrix: Mat4,
    vMatrix: Mat4,
    mMatrix: Mat4,
    colorMapIdx: number,
  ): boolean {
    this.touch();

    if (!this._ready || !this._texture || this._aborted) {
      return false;
    }

    this.drawWithGpuMesh(this._gpuMesh, pMatrix, vMatrix, mMatrix, colorMapIdx);
    return true;
  }

  drawRemapped(
    mesh: XYZTileGpuMesh,
    pMatrix: Mat4,
    vMatrix: Mat4,
    mMatrix: Mat4,
    colorMapIdx: number,
  ): boolean {
    this.touch();

    if (!this._ready || !this._texture || this._aborted) {
      return false;
    }

    this.drawWithGpuMesh(mesh, pMatrix, vMatrix, mMatrix, colorMapIdx);
    return true;
  }

  dispose(): void {
    const gl = this._webgl;

    if (this._texture) {
      gl.deleteTexture(this._texture);
      this._texture = null;
    }
    if (this._gpuMesh.positionBuffer) {
      gl.deleteBuffer(this._gpuMesh.positionBuffer);
      this._gpuMesh.positionBuffer = null;
    }
    if (this._gpuMesh.uvBuffer) {
      gl.deleteBuffer(this._gpuMesh.uvBuffer);
      this._gpuMesh.uvBuffer = null;
    }
    if (this._gpuMesh.indexBuffer) {
      gl.deleteBuffer(this._gpuMesh.indexBuffer);
      this._gpuMesh.indexBuffer = null;
    }

    this._image = undefined;
    this._ready = false;
    this._loading = false;
    this._aborted = true;
  }

  private drawWithGpuMesh(
    mesh: XYZTileGpuMesh,
    pMatrix: Mat4,
    vMatrix: Mat4,
    mMatrix: Mat4,
    colorMapIdx: number,
  ): void {
    if (!this._texture) {
      return;
    }

    const gl = this._webgl;
    this._shaderProgram.enableShaders(pMatrix, vMatrix, mMatrix, colorMapIdx);

    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.positionBuffer);
    gl.vertexAttribPointer(
      this._shaderProgram.locations.vertexPositionAttribute,
      3,
      gl.FLOAT,
      false,
      0,
      0,
    );
    gl.enableVertexAttribArray(this._shaderProgram.locations.vertexPositionAttribute);

    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.uvBuffer);
    gl.vertexAttribPointer(
      this._shaderProgram.locations.textureCoordAttribute,
      2,
      gl.FLOAT,
      false,
      0,
      0,
    );
    gl.enableVertexAttribArray(this._shaderProgram.locations.textureCoordAttribute);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._texture);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
    gl.drawElements(gl.TRIANGLES, mesh.indexCount, mesh.indexType, 0);

    gl.disableVertexAttribArray(this._shaderProgram.locations.vertexPositionAttribute);
    gl.disableVertexAttribArray(this._shaderProgram.locations.textureCoordAttribute);
  }

  private get key(): string {
    return `${this._coord.z}/${this._coord.x}/${this._coord.y}`;
  }
}
