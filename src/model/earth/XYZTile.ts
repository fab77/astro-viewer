import { XYZShaderProgram } from '../../shader/XYZShaderProgram.js'
import type { XYZTileCoord, XYZTileMesh } from './types.js'
import { xyzTileRequestScheduler, XYZTileRequestError } from './XYZTileRequestScheduler.js'

export class XYZTile {
  private _coord: XYZTileCoord
  private _url: string
  private _webgl: WebGL2RenderingContext
  private _shaderProgram: XYZShaderProgram
  private _positionBuffer: WebGLBuffer | null
  private _uvBuffer: WebGLBuffer | null
  private _indexBuffer: WebGLBuffer | null
  private _texture: WebGLTexture | null = null
  private _indices: Uint16Array | Uint32Array
  private _indexType: number
  private _ready = false
  private _aborted = false
  private _loading = false
  private _failedUntil = 0
  private _image?: HTMLImageElement
  private _objectUrl: string | null = null

  constructor(
    coord: XYZTileCoord,
    url: string,
    mesh: XYZTileMesh,
    webgl: WebGL2RenderingContext,
    shaderProgram: XYZShaderProgram,
  ) {
    this._coord = coord
    this._url = url
    this._webgl = webgl
    this._shaderProgram = shaderProgram
    this._positionBuffer = webgl.createBuffer()
    this._uvBuffer = webgl.createBuffer()
    this._indexBuffer = webgl.createBuffer()
    this._indices = mesh.indices
    this._indexType = mesh.indices instanceof Uint32Array ? webgl.UNSIGNED_INT : webgl.UNSIGNED_SHORT

    webgl.bindBuffer(webgl.ARRAY_BUFFER, this._positionBuffer)
    webgl.bufferData(webgl.ARRAY_BUFFER, mesh.positions, webgl.STATIC_DRAW)

    webgl.bindBuffer(webgl.ARRAY_BUFFER, this._uvBuffer)
    webgl.bufferData(webgl.ARRAY_BUFFER, mesh.uvs, webgl.STATIC_DRAW)

    webgl.bindBuffer(webgl.ELEMENT_ARRAY_BUFFER, this._indexBuffer)
    webgl.bufferData(webgl.ELEMENT_ARRAY_BUFFER, mesh.indices, webgl.STATIC_DRAW)

    this.loadTexture()
  }

  get ready(): boolean {
    return this._ready
  }

  get coord(): XYZTileCoord {
    return this._coord
  }

  get failedUntil(): number {
    return this._failedUntil
  }

  private loadTexture(): void {
    if (this._loading || this._ready || this._aborted) {
      return
    }

    const now = Date.now()
    if (this._failedUntil > now) {
      return
    }

    this._loading = true
    xyzTileRequestScheduler.load(this._url)
      .then((blob) => this.loadImageFromBlob(blob))
      .catch((error) => {
        this._loading = false
        this._ready = false
        const cooldownMs =
          error instanceof XYZTileRequestError ? error.cooldownMs : 10000
        this._failedUntil = Date.now() + cooldownMs
      })
  }

  private loadImageFromBlob(blob: Blob): void {
    const image = new Image()
    this._image = image
    this._objectUrl = URL.createObjectURL(blob)
    image.onload = () => this.onImageLoaded()
    image.onerror = () => {
      this._loading = false
      this._ready = false
      this._failedUntil = Date.now() + 10000
      this.revokeObjectUrl()
    }
    image.src = this._objectUrl
  }

  private onImageLoaded(): void {
    if (!this._image || this._aborted) {
      return
    }

    const gl = this._webgl
    const texture = gl.createTexture()
    if (!texture) {
      throw new Error('Could not create XYZ texture')
    }

    this._texture = texture
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._image)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

    this._loading = false
    this._failedUntil = 0
    this._ready = true
    this.revokeObjectUrl()
  }

  draw(pMatrix: Float32Array, vMatrix: Float32Array, mMatrix: Float32Array): void {
    if (!this._ready) {
      this.loadTexture()
    }
    if (!this._ready || !this._texture) {
      return
    }

    const gl = this._webgl
    this._shaderProgram.enableShaders(pMatrix, vMatrix, mMatrix)

    gl.bindBuffer(gl.ARRAY_BUFFER, this._positionBuffer)
    gl.vertexAttribPointer(
      this._shaderProgram.locations.vertexPositionAttribute,
      3,
      gl.FLOAT,
      false,
      0,
      0,
    )
    gl.enableVertexAttribArray(this._shaderProgram.locations.vertexPositionAttribute)

    gl.bindBuffer(gl.ARRAY_BUFFER, this._uvBuffer)
    gl.vertexAttribPointer(
      this._shaderProgram.locations.textureCoordAttribute,
      2,
      gl.FLOAT,
      false,
      0,
      0,
    )
    gl.enableVertexAttribArray(this._shaderProgram.locations.textureCoordAttribute)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this._texture)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer)
    gl.drawElements(gl.TRIANGLES, this._indices.length, this._indexType, 0)

    gl.disableVertexAttribArray(this._shaderProgram.locations.vertexPositionAttribute)
    gl.disableVertexAttribArray(this._shaderProgram.locations.textureCoordAttribute)
  }

  dispose(): void {
    const gl = this._webgl
    if (this._texture) {
      gl.deleteTexture(this._texture)
      this._texture = null
    }
    if (this._positionBuffer) {
      gl.deleteBuffer(this._positionBuffer)
      this._positionBuffer = null
    }
    if (this._uvBuffer) {
      gl.deleteBuffer(this._uvBuffer)
      this._uvBuffer = null
    }
    if (this._indexBuffer) {
      gl.deleteBuffer(this._indexBuffer)
      this._indexBuffer = null
    }
    this._image = undefined
    this.revokeObjectUrl()
    this._loading = false
    this._ready = false
  }

  private revokeObjectUrl(): void {
    if (this._objectUrl) {
      URL.revokeObjectURL(this._objectUrl)
      this._objectUrl = null
    }
  }
}
