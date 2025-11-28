export { AstroViewer } from './AstroViewer.js';
export { HiPSDescriptor } from './model/hips/HiPSDescriptor.js';
export { FoV } from './model/FoV.js'
// export { TapRepo } from './model/tap/TapRepo.js'
// export { addTAPRepo } from './services/tapRepoService.js'
export type { PointCoordinates, CameraChangedDetail } from './AstroSphere.js';
export { HoveredFootprintDetail, FootprintSetGL } from './model/footprints/FootprintSetGL.js'
export { CatalogueGL } from './model/catalogues/CatalogueGL.js'
// export {TapMetadata as TapMetadata} from './model/tap/TapMetadata.js'
// export {TapMetadataList} from './model/tap/TapMetadataList.js'
export { MetadataManager } from './model/MetadataManager.js'
export { MetadataColumn, ColumnType } from './model/MetadataColumn.js'
export { Point, SphericalOpts, AstroOpts, PointInitOpts, CartesianOpts } from './model/Point.js'
export { FoVUtils } from './utils/FoVUtils.js'
export { CoordsType } from './utils/CoordsType.js'
export { ColorMapName } from './model/ColorMaps.js';
export { HiPS } from './model/hips/HiPS.js'

console.log('astroviewer UMD loaded')