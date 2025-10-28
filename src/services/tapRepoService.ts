// addTAPRepo.ts
import { TapRepo } from '../model/tap/TapRepo.js'
import {TapMetadata} from '../model/tap/TapMetadata.js'
import {TapMetadataList} from '../model/tap/TapMetadataList.js'
import global from '../Global.js'

import {CatalogueGL} from '../model/catalogues/CatalogueGL.js'
import {FootprintSetGL} from '../model/footprints/FootprintSetGL.js'

let catId = 1
let obsId = 1

export interface TapDatasets {
  obsList: FootprintSetGL[]
  catalogueList: CatalogueGL[]
  notClassifiedList: string[]
}

/**
 * Initialize a TapRepo and populate capabilities + datasets.
 */
export async function addTAPRepo(repoUrl: string): Promise<TapRepo> {
  const tapRepo = new TapRepo(repoUrl)
  tapRepo.adqlFunctionList = await loadCapabilities(repoUrl)

  const datasets = await loadTables(repoUrl, tapRepo)
  tapRepo.setCataloguesList(datasets.catalogueList)
  tapRepo.setObservationsList(datasets.obsList)
  tapRepo.setNotClassifiedList(datasets.notClassifiedList)

  return tapRepo
}

export async function queryAsync(
  tapRepo: TapRepo,
  adql: string,
  TAP_QUERY_TIMEOUT_MS: number
): Promise<any | null> {
  const base = global.corsProxyUrl.replace(/\/?$/, '/'); // ensure trailing /
  const url = new URL('adql', base);
  url.searchParams.set('tapurl', tapRepo.tapBaseUrl);
  url.searchParams.set('query', adql);

  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), TAP_QUERY_TIMEOUT_MS || 30000);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      mode: 'cors',
      signal: ac.signal,
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`HTTP ${response.status} ${response.statusText} – ${text}`);
    }
    return await response.json(); // return type is 'any'
  } catch (err: any) {
    console.error('queryAsync error:', err?.message || err);
    return null;
  } finally {
    clearTimeout(t);
  }
}


/**
 * Fetch and parse tables from a TAP service.
 */
const loadTables = async (tapUrl: string, tapRepo: TapRepo): Promise<TapDatasets> => {
  const tablesUrl = `${tapUrl}/tables`
  const requestUrl = `${global.corsProxyUrl}exturl?url=${encodeURIComponent(tablesUrl)}`
  const result: TapDatasets = { obsList: [], catalogueList: [], notClassifiedList: [] }

  try {
    const response = await fetch(requestUrl, { method: 'GET', mode: 'cors' })
    const raw = await response.text()
    const data = raw.replace(/\n\t|\t|\n/g, '')

    const parser = new DOMParser()
    const doc = parser.parseFromString(data, 'application/xml')
    const root = doc.firstElementChild

    if (!root) throw new Error('Error parsing TAP XML. Missing root element.')
    if (!/tableset$/i.test(root.nodeName)) {
      throw new Error(`Error parsing TAP XML. ${root.nodeName} not recognised`)
    }

    const catalogueList: CatalogueGL[] = []
    const obsList: FootprintSetGL[] = []
    const notClassifiedList: string[] = []

    // schemas
    for (const schema of Array.from(root.children)) {
      if (schema.nodeName !== 'schema') continue

      for (const table of Array.from(schema.children)) {
        if (table.nodeName !== 'table') continue

        const dataset = parseTable(table as Element, tablesUrl, tapRepo)
        if (!dataset) continue

        if (dataset.catalogue) {
          ; (dataset.catalogue as any).id = catId++ // keep parity with existing code
          catalogueList.push(dataset.catalogue)
        }
        if (dataset.footprint) {
          ; (dataset.footprint as any).id = obsId++
          obsList.push(dataset.footprint)
        }
        if (dataset.notClassified) {
          notClassifiedList.push(dataset.notClassified)
        }
      }
    }

    return { catalogueList, obsList, notClassifiedList }
  } catch (err: any) {
    console.error(err?.message ?? err)
    return result
  }
}

/**
 * Fetch and parse TAP capabilities to extract ADQL functions.
 */
const loadCapabilities = async (repoUrl: string): Promise<string[]> => {
  const capabilitiesUrl = `${repoUrl}/capabilities`
  const requestUrl = `${global.corsProxyUrl}exturl?url=${encodeURIComponent(capabilitiesUrl)}`
  let capabilities: string[] = []

  try {
    const response = await fetch(requestUrl, { method: 'GET', mode: 'cors' })
    const raw = await response.text()
    const data = raw.replace(/\n\t|\t|\n/g, '')

    const parser = new DOMParser()
    const doc = parser.parseFromString(data, 'application/xml')
    const root = doc.firstElementChild

    if (!root) throw new Error('Error parsing TAP XML. Missing root element.')
    if (!/capabilities$/i.test(root.nodeName)) {
      throw new Error(`Error parsing TAP XML. ${root.nodeName} not recognised`)
    }

    for (const capability of Array.from(root.children)) {
      if (capability.nodeName !== 'capability') continue

      for (const child of Array.from(capability.children)) {
        if (child.nodeName === 'language') {
          capabilities = parseCapabilities(child as Element)
        }
      }
    }

    return capabilities
  } catch (err: any) {
    console.error(err?.message ?? err)
    return capabilities
  }
}

/**
 * Parse the <language> node to extract ADQL functions.
 */
const parseCapabilities = (languageNode: Element): string[] => {
  const out: string[] = []
  const featuresContainers = languageNode.getElementsByTagName('languageFeatures')
  if (!featuresContainers.length) return out

  const featureNodeList = featuresContainers[0].getElementsByTagName('feature')
  for (const feature of Array.from(featureNodeList)) {
    const formNode = feature.getElementsByTagName('form')[0]
    if (formNode?.textContent) out.push(formNode.textContent)
  }
  return out
}

type TableParseResult = {
  catalogue: CatalogueGL | null
  footprint: FootprintSetGL | null
  notClassified: string | null
}

/**
 * Parse a <table> node and build dataset wrappers.
 */
const parseTable = (tableNode: Element, tablesUrl: string, tapRepo: TapRepo): TableParseResult => {
  const nameNode = tableNode.getElementsByTagName('name')[0]
  if (!nameNode?.textContent) {
    return { catalogue: null, footprint: null, notClassified: 'Missing table name' }
  }

  const tableName = nameNode.textContent
  const tableDesc = tableNode.getElementsByTagName('description')[0]?.textContent ?? null

  const metaColumns = tableNode.getElementsByTagName('column')
  const tapMetas = new TapMetadataList()

  for (const col of Array.from(metaColumns)) {
    const name = col.getElementsByTagName('name')[0]?.textContent ?? ''
    const description = col.getElementsByTagName('description')[0]?.textContent ?? undefined
    const unit = col.getElementsByTagName('unit')[0]?.textContent ?? undefined
    const dataType = col.getElementsByTagName('dataType')[0]?.textContent ?? undefined
    const ucd = col.getElementsByTagName('ucd')[0]?.textContent ?? undefined
    const utype = col.getElementsByTagName('utype')[0]?.textContent ?? undefined

    const tapMeta = new TapMetadata(name, description, unit, dataType, ucd, utype)
    tapMetas.addMetadata(tapMeta)
  }

  let catalogue: CatalogueGL | null = null
  let footprint: FootprintSetGL | null = null
  let notClassified: string | null = null

  if (tapMetas.pgSphereMetaColumns.length > 0 || tapMetas.sRegionMetaColumns.length > 0) {
    footprint = new FootprintSetGL(tableName, tableDesc, tapRepo, tapMetas)
  } else if (tapMetas.posEqRAMetaColumns.length > 0 && tapMetas.posEqDecMetaColumns.length > 0) {
    catalogue = new CatalogueGL(tableName, tableDesc, tapRepo, tapMetas)
  } else {
    notClassified = `TODO: create NC entity for ${tablesUrl}#${tableName}`
  }

  return { catalogue, footprint, notClassified }
}