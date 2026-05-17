import type { XYZTileCoord } from './XYZTypes.js'

export class XYZMapDescriptor {

    _name: string
    _url: string
    _urlResolver?: (tile: XYZTileCoord) => string
    _minZoom?: number
    _maxZoom?: number
    _segmentsPerSide?: number
    _tileSize?: number
    _maxCachedTiles?: number
    _interactionDebounceMs?: number
    _subdomains?: string[]
    _attribution?: string
    _flipY?: boolean
    _maxConcurrentLoads?: number


    constructor(
        name: string,
        url: string,
        minZoom: number = 0,
        maxZoom: number = 8,
        segmentsPerSide: number = 16,
        maxCachedTiles: number = 384,
        maxConcurrentLoads: number = 8,
        urlResolver?: (tile: XYZTileCoord) => string,
    ) {
        this._name = name
        this._url = url
        this._urlResolver = urlResolver
        this._minZoom = minZoom
        this._maxZoom = maxZoom
        this._segmentsPerSide = segmentsPerSide
        this._maxCachedTiles = maxCachedTiles
        this._interactionDebounceMs = 100
        this._subdomains = ['a', 'b', 'c']
        this._attribution = ''
        this._flipY = false
        this._maxConcurrentLoads = maxConcurrentLoads
    }

    get url(): string {
        return this._url
    }

    get urlResolver(): ((tile: XYZTileCoord) => string) | undefined {
        return this._urlResolver
    }

    get name(): string {
        return this._name
    }

    get minZoom(): number {
        return this._minZoom as number
    }

    get maxZoom(): number {
        return this._maxZoom as number
    }

    get segmentsPerSide(): number {
        return this._segmentsPerSide as number
    }

    get maxCachedTiles(): number {
        return this._maxCachedTiles as number
    }

    get interactionDebounceMs(): number {
        return this._interactionDebounceMs as number
    }

    get subdomains(): string[] {
        return this._subdomains as string[]
    }

    get attribution(): string {
        return this._attribution as string
    }

    get flipY(): boolean {
        return this._flipY as boolean
    }

    get maxConcurrentLoads(): number {
        return this._maxConcurrentLoads as number
    }
}
