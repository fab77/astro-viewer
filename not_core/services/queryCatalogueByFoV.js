import FoVUtils from '@/core/utils/FoVUtils'
import global from '@/core/Global'
import TapMetadata from '@/services/tap/TapMetadata'
import TapMetadataList from '@/services/tap/TapMetadataList'
import { useAstroBrowserStore } from '@/store/astroBrowserStore'

 // NOT NEEDED HERE. use it directly in FoVUtils
import healpixGridSingleton from '@/core/model/grid/HealpixGridSingleton.js'

const queryCatalogueByFoV = async (tapRepo, catalogue) => {

  const astroBrowserStore = useAstroBrowserStore()
  const tapTable = catalogue.name
  const tapRa = catalogue.catalogueProps.raColumn
  const tapDec = catalogue.catalogueProps.decColumn

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
  const fovPolyAstro = FoVUtils.getAstroFoVPolygon(fovPolyCartesian)
  let adqlQuery = undefined

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
    let center = FoVUtils.getCenterJ2000(global.gl.canvas)
    // let minFoV = global.getSelectedHiPS().getMinFoV()
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
  } else {
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
  }

  const queryencoded = encodeURI(adqlQuery)

  let tapUrl = tapRepo.tapBaseUrl
  let adql = queryencoded
  let u = global.corsProxyUrl + 'adql?tapurl=' + tapUrl + '&query=' + adql

  // const msgId = model._name + '_' + new Date().getTime()

  try {
    let response = await fetch(u, {
      method: 'GET',
      mode: 'cors'
    })
    let json = await response.json()
    let metadata = json.metadata
    let data = json.data

    console.log(data.length)
    let tapMetadataList = new TapMetadataList()
    for (const element of metadata) {
      let name = element.name
      let description = element.description !== undefined ? element.description : undefined
      let unit = element.unit !== undefined ? element.unit : undefined
      let datatype = element.datatype !== undefined ? element.datatype : undefined
      let ucd = element.ucd !== undefined ? element.ucd : undefined
      let utype = element.utype !== undefined ? element.utype : undefined

      let tapMeta = new TapMetadata(name, description, unit, datatype, ucd, utype)
      tapMetadataList.addMetadata(tapMeta)
    }

    if (data.length > 0) {
      catalogue.addSources(data, tapMetadataList.metadataList)
      return catalogue
      // astrobrowserAPI.value.addCatalogue(model)
    } else {
      console.log('No results found')
    }
  } catch (err) {
    console.log(err.message)
  }
}

export default queryCatalogueByFoV
