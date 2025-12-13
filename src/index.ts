export { AstroViewer } from './AstroViewer.js';
export { HiPSDescriptor } from './model/hips/HiPSDescriptor.js';
export { FoV } from './model/FoV.js'

export type { PointCoordinates, CameraChangedDetail } from './AstroSphere.js';
export { HoveredFootprintDetail, FootprintSetGL } from './model/footprints/FootprintSetGL.js'
export { CatalogueGL } from './model/catalogues/CatalogueGL.js'

export { MetadataManager } from './model/MetadataManager.js'
export { MetadataColumn, MetadataInit, ColumnType } from './model/MetadataColumn.js'
export { Point, SphericalOpts, AstroOpts, PointInitOpts, CartesianOpts } from './model/Point.js'
export { FoVUtils } from './utils/FoVUtils.js'
export { CoordsType } from './utils/CoordsType.js'
export { ColorMapName } from './model/ColorMaps.js';
export { HiPS } from './model/hips/HiPS.js'

export {Source} from './model/Source.js'
export {Footprint} from './model/footprints/Footprint.js'


console.log('astroviewer UMD loaded')