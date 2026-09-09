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

import { el, setStatus } from './ui.js';
import { state } from './state.js';

export const WMTS_PRESETS = {
  gibsBlueMarble: {
    label: 'NASA GIBS Blue Marble',
    capabilitiesUrl: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/1.0.0/WMTSCapabilities.xml',
    baseUrl: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/',
    preferredLayer: 'BlueMarble_ShadedRelief_Bathymetry',
    tileMatrixSet: 'GoogleMapsCompatible_Level8',
    style: 'default',
    format: 'image/jpeg',
    requestEncoding: 'rest',
    minZoom: 0,
    maxZoom: 8,
    urlTemplate: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/{Layer}/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.{TileFormatExtension}',
  },
  esriWorldImagery: {
    label: 'Esri World Imagery',
    capabilitiesUrl: 'https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/WMTS/1.0.0/WMTSCapabilities.xml',
    baseUrl: 'https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/WMTS/',
    preferredLayer: 'World_Imagery',
    tileMatrixSet: 'default028mm',
    style: 'default',
    format: 'image/jpeg',
    requestEncoding: 'kvp',
    minZoom: 0,
    maxZoom: 8,
    urlTemplate: '',
  },
};

function firstByLocalName(parent, name) {
  return Array.from(parent?.children || []).find((node) => node.localName === name) || null;
}

function childrenByLocalName(parent, name) {
  return Array.from(parent?.children || []).filter((node) => node.localName === name);
}

function textOf(parent, name) {
  return firstByLocalName(parent, name)?.textContent?.trim() || '';
}

function pickPreferredMatrixSet(tileMatrixSets, identifiers = []) {
  for (const identifier of identifiers) {
    const match = tileMatrixSets.get(identifier);
    if (match) return match;
  }

  for (const matrixSet of tileMatrixSets.values()) {
    if (/3857|GoogleMapsCompatible|default028mm/i.test(matrixSet.identifier)) {
      return matrixSet;
    }
  }

  return tileMatrixSets.values().next().value || null;
}

function parseCapabilities(xmlText, preferredLayerIdentifier = '') {
  const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
  const exception = doc.querySelector('parsererror');
  if (exception) {
    throw new Error('Invalid WMTS capabilities XML.');
  }

  const tileMatrixSets = new Map();
  for (const node of Array.from(doc.getElementsByTagNameNS('*', 'TileMatrixSet'))) {
    const identifier = textOf(node, 'Identifier');
    if (!identifier) continue;
    const matrixLabels = childrenByLocalName(node, 'TileMatrix')
      .map((matrixNode) => textOf(matrixNode, 'Identifier'))
      .filter(Boolean);
    tileMatrixSets.set(identifier, {
      identifier,
      matrixLabels,
    });
  }

  const layers = Array.from(doc.getElementsByTagNameNS('*', 'Layer'))
    .filter((node) => node.parentElement?.localName === 'Contents')
    .map((layerNode) => {
      const identifier = textOf(layerNode, 'Identifier');
      const title = textOf(layerNode, 'Title') || identifier;
      const styles = childrenByLocalName(layerNode, 'Style').map((styleNode) => ({
        identifier: textOf(styleNode, 'Identifier'),
        isDefault: styleNode.getAttribute('isDefault') === 'true',
      })).filter((style) => style.identifier);
      const formats = childrenByLocalName(layerNode, 'Format').map((node) => node.textContent?.trim()).filter(Boolean);
      const dimensions = childrenByLocalName(layerNode, 'Dimension').map((dimensionNode) => ({
        identifier: textOf(dimensionNode, 'Identifier'),
        defaultValue: textOf(dimensionNode, 'Default'),
      })).filter((dimension) => dimension.identifier);
      const resourceUrls = childrenByLocalName(layerNode, 'ResourceURL')
        .map((resourceNode) => ({
          resourceType: resourceNode.getAttribute('resourceType') || '',
          template: resourceNode.getAttribute('template') || '',
          format: resourceNode.getAttribute('format') || '',
        }))
        .filter((resource) => resource.template);
      const tileMatrixSetLinks = childrenByLocalName(layerNode, 'TileMatrixSetLink')
        .map((linkNode) => textOf(linkNode, 'TileMatrixSet'))
        .filter(Boolean);

      return {
        identifier,
        title,
        styles,
        formats,
        dimensions,
        resourceUrls,
        tileMatrixSetLinks,
      };
    });

  const layer =
    layers.find((entry) => entry.identifier === preferredLayerIdentifier)
    || layers[0];

  if (!layer) {
    throw new Error('No WMTS layers found in capabilities.');
  }

  const matrixSet = pickPreferredMatrixSet(tileMatrixSets, layer.tileMatrixSetLinks);
  if (!matrixSet) {
    throw new Error('No WMTS TileMatrixSet found in capabilities.');
  }

  const restResource = layer.resourceUrls.find((resource) => resource.resourceType === 'tile') || null;
  const style = layer.styles.find((entry) => entry.isDefault)?.identifier || layer.styles[0]?.identifier || 'default';
  const format = restResource?.format || layer.formats[0] || 'image/png';
  const dimensionDefaults = Object.fromEntries(
    layer.dimensions
      .filter((dimension) => dimension.defaultValue)
      .map((dimension) => [dimension.identifier, dimension.defaultValue]),
  );

  return {
    layerIdentifier: layer.identifier,
    layerTitle: layer.title,
    style,
    format,
    urlTemplate: restResource?.template || '',
    requestEncoding: restResource ? 'rest' : 'kvp',
    tileMatrixSet: matrixSet.identifier,
    matrixLabels: matrixSet.matrixLabels,
    minZoom: 0,
    maxZoom: Math.max(0, matrixSet.matrixLabels.length - 1),
    dimensions: dimensionDefaults,
    time: dimensionDefaults.Time || '',
  };
}

function applyCapabilitiesToForm(capabilitiesUrl, capabilities) {
  const baseUrl =
    capabilities.requestEncoding === 'kvp'
      ? capabilitiesUrl.replace(/\/1\.0\.0\/WMTSCapabilities\.xml.*$/i, '/WMTS')
      : capabilitiesUrl.replace(/\/1\.0\.0\/WMTSCapabilities\.xml.*$/i, '/');
  el('wmtsBaseUrl').value = baseUrl;
  el('wmtsLayer').value = capabilities.layerIdentifier;
  el('wmtsTileMatrixSet').value = capabilities.tileMatrixSet;
  el('wmtsStyle').value = capabilities.style;
  el('wmtsTime').value = capabilities.time || '';
  el('wmtsFormat').value = capabilities.format;
  el('wmtsEncoding').value = capabilities.requestEncoding;
  el('wmtsUrlTemplate').value = capabilities.urlTemplate || '';
  el('wmtsDimensions').value = JSON.stringify(capabilities.dimensions || {});
  el('xyzMinZoom').value = String(capabilities.minZoom ?? 0);
  el('xyzMaxZoom').value = String(capabilities.maxZoom ?? 8);
}

export async function loadWMTSCapabilities(capabilitiesUrl, preferredLayerIdentifier = '') {
  const response = await fetch(capabilitiesUrl, { mode: 'cors' });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} loading WMTS capabilities`);
  }

  const xmlText = await response.text();
  const capabilities = parseCapabilities(xmlText, preferredLayerIdentifier);
  state.WMTS_CAPABILITIES = capabilities;
  applyCapabilitiesToForm(capabilitiesUrl, capabilities);
  setStatus(`🧭 WMTS capabilities loaded: ${capabilities.layerIdentifier} · ${capabilities.tileMatrixSet} · zoom 0-${capabilities.maxZoom}`);
  return capabilities;
}

export function applyWMTSPreset(presetKey) {
  const preset = WMTS_PRESETS[presetKey];
  if (!preset) {
    return;
  }

  el('wmtsCapabilitiesUrl').value = preset.capabilitiesUrl;
  el('wmtsBaseUrl').value = preset.baseUrl;
  el('wmtsLayer').value = preset.preferredLayer;
  el('wmtsTileMatrixSet').value = preset.tileMatrixSet || '';
  el('wmtsStyle').value = preset.style || 'default';
  el('wmtsTime').value = '';
  el('wmtsFormat').value = preset.format || 'image/png';
  el('wmtsEncoding').value = preset.requestEncoding || 'kvp';
  el('wmtsUrlTemplate').value = preset.urlTemplate || '';
  el('wmtsDimensions').value = '{}';
  state.WMTS_CAPABILITIES = undefined;
}
