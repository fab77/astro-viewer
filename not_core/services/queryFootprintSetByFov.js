import FoVUtils from '@/core/utils/FoVUtils'
import global from '@/core/Global'
import TapMetadata from '@/services/tap/TapMetadata'
import TapMetadataList from '@/services/tap/TapMetadataList'
import { useAstroBrowserStore } from '@/store/astroBrowserStore'

// NOT NEEDED HERE. use it directly in FoVUtils
import healpixGridSingleton from '@/core/model/grid/HealpixGridSingleton.js'

const queryFootprintSetByFov = async (tapRepo, footprintSet) => {
  const astroBrowserStore = useAstroBrowserStore()
  const tapTable = footprintSet.name
  const tapRa = footprintSet.footprintsetProps.raColumn
  const tapDec = footprintSet.footprintsetProps.decColumn

  // tapName = (model._nameColumn !== undefined ) ? model._nameColumn._name : undefined;

  const fovPolyCartesian = FoVUtils.getFoVPolygon(
    astroBrowserStore.astrobrowser.astroSphere.pMatrix,// NOT NEEDED HERE. use it directly in FoVUtils
    astroBrowserStore.astrobrowser.astroSphere.camera,
    astroBrowserStore.astrobrowser.canvas,
    healpixGridSingleton, // NOT NEEDED HERE. use it directly in FoVUtils
    global.rayPicker // NEEDED? Can it be used directly in FoVUtils?
  )
  // const fovPolyCartesian = FoVUtils.getFoVPolygon(
  //   astroBrowserStore.astrobrowser.astroSphere.pMatrix,
  //   astroBrowserStore.astrobrowser.astroSphere.camera,
  //   astroBrowserStore.astrobrowser.canvas,
  //   astroBrowserStore.astrobrowser.astroSphere.hpGrid,
  //   global.rayPicker
  // )
  // const fovPolyCartesian = FoVUtils.getFoVPolygon(
  //   global.pMatrix,
  //   global.camera,
  //   global.gl.canvas,
  //   global.defaultHips,
  //   global.rayPicker
  // )
  const fovPolyAstro = FoVUtils.getAstroFoVPolygon(fovPolyCartesian)
  let adqlQuery = undefined

  // not working anymore in esasky
  // if (tapPgSphere !== undefined && tapPgSphere !== null) {
  //     adqlQuery = "select * " +
  //         "from " + tapTable + " where " +
  //         "1=INTERSECTS(" + tapPgSphere + ", " +
  //         "POLYGON('ICRS', " + fovPolyAstro + "))";
  // } else {

  if (tapRepo.adqlFunctionList.includes('POLYGON')) {
    adqlQuery =
      'select * ' +
      'from ' +
      tapTable +
      ' where ' +
      "1=CONTAINS(POINT('ICRS'," +
      tapRa._name +
      ',' +
      tapDec._name +
      '), ' +
      "POLYGON('ICRS', " +
      fovPolyAstro +
      '))'
  } else if (tapRepo.adqlFunctionList.includes('CIRCLE')) {
    let center = FoVUtils.getCenterJ2000(astroBrowserStore.astrobrowser.canvas, 
      astroBrowserStore.astrobrowser.astroSphere.hpGrid,
      astroBrowserStore.astrobrowser.astroSphere.pMatrix)
    let minFoV = astroBrowserStore.astrobrowser.astroSphere.hpGrid.getMinFoV()
    // let center = FoVUtils.getCenterJ2000(global.gl.canvas)
    // let minFoV = global.getSelectedHiPS().getMinFoV()
    let radius = minFoV / 2
    adqlQuery =
      'select * ' +
      'from ' +
      tapTable +
      ' where ' +
      "1=CONTAINS(POINT('ICRS'," +
      tapRa._name +
      ',' +
      tapDec._name +
      '), ' +
      "CIRCLE('ICRS', " +
      center._raDeg +
      ', ' +
      center._decDeg +
      ', ' +
      radius +
      '))'
  } else {
    // for TAP repos with no capabilities exposed
    let center = FoVUtils.getCenterJ2000(astroBrowserStore.astrobrowser.canvas, 
      astroBrowserStore.astrobrowser.astroSphere.hpGrid,
      astroBrowserStore.astrobrowser.astroSphere.pMatrix)
    // let minFoV = astroBrowserStore.astrobrowser.astroSphere.hpGrid.getMinFoV()
    let minFoV = healpixGridSingleton.getMinFoV()
    let radius = minFoV / 2
    adqlQuery =
      'select * ' +
      'from ' +
      tapTable +
      ' where ' +
      "1=CONTAINS(POINT('ICRS'," +
      tapRa._name +
      ',' +
      tapDec._name +
      '), ' +
      "CIRCLE('ICRS', " +
      center._raDeg +
      ', ' +
      center._decDeg +
      ', ' +
      radius +
      '))'
  }

  const queryencoded = encodeURI(adqlQuery)

  let tapUrl = tapRepo.tapBaseUrl
  let adql = queryencoded
  let u = global.corsProxyUrl + 'adql?tapurl=' + tapUrl + '&query=' + adql

  // const msgId = footprintSet._name + '_' + new Date().getTime()
  // eventBus.fireEvent(new AddMessageToMsgBoxEvent(msgId, 'Loading data for ' + footprintSet._name))

  try {
    let response = await fetch(u, {
      method: 'GET',
      mode: 'cors'
    })
    let json = await response.json()
    
    const metadata = json.metadata
    const data = json.data

    console.log(data.length)

    let tapMetadataList = new TapMetadataList()
    for (let i = 0; i < metadata.length; i++) {
      let name = metadata[i].name
      let description = metadata[i].description !== undefined ? metadata[i].description : undefined
      let unit = metadata[i].unit !== undefined ? metadata[i].unit : undefined
      let datatype = metadata[i].datatype !== undefined ? metadata[i].datatype : undefined
      let ucd = metadata[i].ucd !== undefined ? metadata[i].ucd : undefined
      let utype = metadata[i].utype !== undefined ? metadata[i].utype : undefined

      let tapMeta = new TapMetadata(name, description, unit, datatype, ucd, utype)
      tapMetadataList.addMetadata(tapMeta)
    }

    if (data.length > 0) {
      footprintSet.addFootprints(data, tapMetadataList.metadataList)
      return footprintSet
    } else {
      console.log('No results found')
    }
  } catch (err) {
    console.log(err.message)
  }
}

export default queryFootprintSetByFov
