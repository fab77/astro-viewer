import { el, setStatus } from './ui.js';
import { state } from './state.js';
import { createSatelliteTimelineController } from './satelliteTimelineController.js';

const SPAIN_REGIONS_GEOJSON_URL = 'test-data/generation/spain_regions.geojson';
const SIMPLE_SATELLITE_OBJ_URL = 'test-data/satellite/simple_satellite.obj';

// Fixture generated from astrospatial-core/examples/real-tle-spain-observation.mjs.
// This keeps the AstroViewer dev demo independent from astrospatial-core packaging for now.
// Replace this fixture with a direct astrospatial-core call once the app-level package wiring exists.
const DEMO_OBSERVATIONS = [
  {
    timestamp: '2019-06-24T06:16:00.000Z',
    groundTrackPoint: { latitudeDeg: 25.933956, longitudeDeg: -17.469501, altitudeKm: 410.401 },
    intersects: false,
    footprint: [[-16.366807,24.933637],[-16.919132,24.938575],[-17.469501,24.940213],[-18.01987,24.938575],[-18.572194,24.933637],[-18.574756,25.437244],[-18.57872,25.938981],[-18.58411,26.44066],[-18.590974,26.944094],[-18.029227,26.945533],[-17.469501,26.94601],[-16.909774,26.945533],[-16.348027,26.944094],[-16.354891,26.44066],[-16.360282,25.938981],[-16.364245,25.437244],[-16.366807,24.933637]],
  },
  {
    timestamp: '2019-06-24T06:17:00.000Z',
    groundTrackPoint: { latitudeDeg: 28.728741, longitudeDeg: -14.670979, altitudeKm: 410.508 },
    intersects: true,
    footprint: [[-13.543628,27.730889],[-14.108297,27.736202],[-14.670979,27.737965],[-15.233661,27.736202],[-15.798331,27.730889],[-15.801544,28.233323],[-15.806196,28.73389],[-15.812315,29.234396],[-15.819956,29.736645],[-15.244436,29.738489],[-14.670979,29.7391],[-14.097522,29.738489],[-13.522003,29.736645],[-13.529643,29.234396],[-13.535763,28.73389],[-13.540414,28.233323],[-13.543628,27.730889]],
  },
  {
    timestamp: '2019-06-24T06:18:00.000Z',
    groundTrackPoint: { latitudeDeg: 31.450296, longitudeDeg: -11.708089, altitudeKm: 410.676 },
    intersects: false,
    footprint: [[-10.55282,30.454738],[-11.131467,30.460435],[-11.708089,30.462326],[-12.284711,30.460435],[-12.863359,30.454738],[-12.867274,30.956026],[-12.87267,31.45545],[-12.879582,31.954808],[-12.888069,32.455899],[-12.297024,32.458156],[-11.708089,32.458905],[-11.119155,32.458156],[-10.52811,32.455899],[-10.536597,31.954808],[-10.543509,31.45545],[-10.548904,30.956026],[-10.55282,30.454738]],
  },
  {
    timestamp: '2019-06-24T06:19:00.000Z',
    groundTrackPoint: { latitudeDeg: 34.085721, longitudeDeg: -8.557082, altitudeKm: 410.892 },
    intersects: false,
    footprint: [[-7.370673,33.092266],[-7.964911,33.098354],[-8.557082,33.100374],[-9.149253,33.098354],[-9.743491,33.092266],[-9.748165,33.592444],[-9.754368,34.090762],[-9.762141,34.58901],[-9.771552,35.08898],[-9.163235,35.09166],[-8.557082,35.092548],[-7.950928,35.09166],[-7.342611,35.08898],[-7.352022,34.58901],[-7.359796,34.090762],[-7.365999,33.592444],[-7.370673,33.092266]],
  },
  {
    timestamp: '2019-06-24T06:20:00.000Z',
    groundTrackPoint: { latitudeDeg: 36.620295, longitudeDeg: -5.193023, altitudeKm: 411.145 },
    intersects: true,
    footprint: [[-3.972382,35.628733],[-4.583759,35.635217],[-5.193023,35.637369],[-5.802287,35.635217],[-6.413664,35.628733],[-6.419157,36.127849],[-6.426235,36.625108],[-6.434944,37.122296],[-6.44536,37.621195],[-5.818081,37.624304],[-5.193023,37.625336],[-4.567965,37.624304],[-3.940686,37.621195],[-3.951102,37.122296],[-3.959811,36.625108],[-3.966888,36.127849],[-3.972382,35.628733]],
  },
  {
    timestamp: '2019-06-24T06:21:00.000Z',
    groundTrackPoint: { latitudeDeg: 39.037232, longitudeDeg: -1.590424, altitudeKm: 411.423 },
    intersects: true,
    footprint: [[-0.332721,38.047341],[-0.962653,38.054227],[-1.590424,38.056512],[-2.218194,38.054227],[-2.848127,38.047341],[-2.854502,38.545455],[-2.862522,39.041715],[-2.872242,39.5379],[-2.883746,40.03579],[-2.235944,40.039335],[-1.590424,40.040511],[-0.944903,40.039335],[-0.297102,40.03579],[-0.308605,39.5379],[-0.318326,39.041715],[-0.326346,38.545455],[-0.332721,38.047341]],
  },
  {
    timestamp: '2019-06-24T06:22:00.000Z',
    groundTrackPoint: { latitudeDeg: 41.317488, longitudeDeg: 2.27567, altitudeKm: 411.716 },
    intersects: true,
    footprint: [[3.572816,40.329039],[2.923136,40.336328],[2.27567,40.338746],[1.628203,40.336328],[0.978523,40.329039],[0.971207,40.826219],[0.962179,41.321549],[0.951375,41.816803],[0.938704,42.313753],[1.60836,42.317737],[2.27567,42.319058],[2.942979,42.317737],[3.612635,42.313753],[3.599964,41.816803],[3.58916,41.321549],[3.580132,40.826219],[3.572816,40.329039]],
  },
  {
    timestamp: '2019-06-24T06:23:00.000Z',
    groundTrackPoint: { latitudeDeg: 43.439656, longitudeDeg: 6.427973, altitudeKm: 412.011 },
    intersects: false,
    footprint: [[7.766254,42.45242],[7.09598,42.460108],[6.427973,42.462659],[5.759966,42.460108],[5.089692,42.45242],[5.081385,42.948746],[5.071293,43.443226],[5.059345,43.937628],[5.04544,44.433719],[5.737913,44.438138],[6.427973,44.439604],[7.118033,44.438138],[7.810506,44.433719],[7.7966,43.937628],[7.784653,43.443226],[7.774561,42.948746],[7.766254,42.45242]],
  },
  {
    timestamp: '2019-06-24T06:24:00.000Z',
    groundTrackPoint: { latitudeDeg: 45.380045, longitudeDeg: 10.884519, altitudeKm: 412.299 },
    intersects: false,
    footprint: [[12.264634,44.393796],[11.573416,44.401873],[10.884519,44.404554],[10.195621,44.401873],[9.504403,44.393796],[9.495072,44.889357],[9.483882,45.383076],[9.47075,45.876714],[9.455567,46.372036],[10.171282,46.376881],[10.884519,46.378489],[11.597755,46.376881],[12.31347,46.372036],[12.298287,45.876714],[12.285155,45.383076],[12.273965,44.889357],[12.264634,44.393796]],
  },
];

let loadedDemo = {
  country: null,
  footprints: null,
  currentFootprint: null,
  groundTrack: null,
  marker: null,
  satelliteObject: null,
  timeline: null,
  currentFootprintIndex: -1,
};

export function wireSatelliteFootprintDemo() {
  el('btnLoadSatelliteFootprintDemo')?.addEventListener('click', loadSatelliteFootprintDemo);
  el('btnSatelliteTimelinePlay')?.addEventListener('click', () => loadedDemo.timeline?.play());
  el('btnSatelliteTimelinePause')?.addEventListener('click', () => loadedDemo.timeline?.pause());
  el('satelliteTimelineSeek')?.addEventListener('input', (event) => {
    loadedDemo.timeline?.seek(Number(event.target.value) / 1000);
  });
  setTimelineControlsEnabled(false);
}

async function loadSatelliteFootprintDemo() {
  const api = state.AstroAPI;
  const viewer = window.astroviewer;
  if (!api || !viewer) {
    setStatus('Satellite footprint demo unavailable: AstroViewer API is not ready.');
    return;
  }

  try {
    removeExistingDemo(api);

    const spainRegionsGeoJSON = await loadSpainRegionsGeoJSON();
    loadedDemo.country = createCountryOverlay(api, viewer, spainRegionsGeoJSON);
    loadedDemo.footprints = createFootprintOverlay(api, viewer);
    loadedDemo.groundTrack = createGroundTrackOverlay(api, viewer);
    loadedDemo.marker = createSatelliteMarkerOverlay(api, viewer);
    loadedDemo.satelliteObject = createSatelliteObject(api);
    loadedDemo.timeline = createSatelliteTimelineController({
      samples: DEMO_OBSERVATIONS,
      playbackRate: 1,
      onFrame: (frame) => updateTimelineFrame(api, viewer, frame),
    });
    setTimelineControlsEnabled(true);

    if (typeof api.goTo === 'function') {
      api.goTo(-3.7, 40.4);
    }

    const hits = DEMO_OBSERVATIONS.filter((sample) => sample.intersects);
    setStatus(
      `Loaded ISS Spain footprint demo: ${DEMO_OBSERVATIONS.length} samples, `
      + `${hits.length} intersecting footprints. Use timeline controls to move the satellite marker.`
    );
  } catch (error) {
    console.error('[satelliteFootprintDemo] failed', error);
    setStatus(`Satellite footprint demo error: ${error.message || error}`);
  }
}

async function loadSpainRegionsGeoJSON() {
  const response = await fetch(SPAIN_REGIONS_GEOJSON_URL);
  if (!response.ok) {
    throw new Error(`Unable to load Spain regions GeoJSON: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

function createCountryOverlay(api, viewer, spainRegionsGeoJSON) {
  const set = api.createTerraFootprintSet(
    'Demo target: Spain regions GeoJSON',
    SPAIN_REGIONS_GEOJSON_URL,
    'astro-viewer test-data fixture',
    new viewer.MetadataManager([]),
  );
  set.addGeoJSONFeatures(viewer.GeoJSONParser.parseGeoJSON(spainRegionsGeoJSON));
  api.changeFootprintSetColor?.(set, '#ffb347');
  api.showTerraFootprintSet(set);
  return set;
}

function createFootprintOverlay(api, viewer) {
  const featureCollection = {
    type: 'FeatureCollection',
    features: DEMO_OBSERVATIONS.map((sample, index) => ({
      type: 'Feature',
      properties: {
        name: `ISS footprint ${index + 1}`,
        timestamp: sample.timestamp,
        intersects: sample.intersects ? 'true' : 'false',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [sample.footprint],
      },
    })),
  };
  const set = api.createTerraFootprintSet(
    'Demo ISS nadir footprints',
    'Hardcoded FootprintPolygon outputs from astrospatial-core',
    'astrospatial-core fixture',
    new viewer.MetadataManager([]),
  );
  set.addGeoJSONFeatures(viewer.GeoJSONParser.parseGeoJSON(featureCollection));
  api.changeFootprintSetColor?.(set, '#00fff2');
  api.showTerraFootprintSet(set);
  return set;
}

function createCurrentFootprintOverlay(api, viewer, sample) {
  const featureCollection = {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: {
        name: 'Current ISS footprint',
        timestamp: sample.timestamp,
        intersects: sample.intersects ? 'true' : 'false',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [sample.footprint],
      },
    }],
  };
  const set = api.createTerraFootprintSet(
    'Current ISS footprint',
    'Current timeline footprint sample',
    'astrospatial-core fixture',
    new viewer.MetadataManager([]),
  );
  set.addGeoJSONFeatures(viewer.GeoJSONParser.parseGeoJSON(featureCollection));
  api.changeFootprintSetColor?.(set, '#ff4d4d');
  api.showTerraFootprintSet(set);
  return set;
}

function createGroundTrackOverlay(api, viewer) {
  const set = api.createTerraPolylineSet(
    'Demo ISS ground track',
    'GroundTrackPoint[] rendered as an open geographic LINE_STRIP',
    'astrospatial-core fixture',
    new viewer.MetadataManager([]),
  );
  set.addGroundTrack(
    DEMO_OBSERVATIONS.map((sample) => ({
      ...sample.groundTrackPoint,
      timestamp: sample.timestamp,
    })),
    { name: 'ISS pass over Spain' },
  );
  api.changeTerraPolylineSetColor?.(set, '#ffe066');
  api.showTerraPolylineSet(set);
  return set;
}

function createSatelliteMarkerOverlay(api, viewer) {
  const set = api.createTerraPointSet(
    'Demo ISS moving marker',
    'Interpolated satellite marker along GroundTrackPoint[]',
    'astrospatial-core fixture',
    new viewer.MetadataManager(createMarkerColumns(viewer)),
  );
  api.changeCatalogueColor?.(set, '#ff4d4d');
  api.showTerraPointSet(set);
  return set;
}

function createSatelliteObject(api) {
  if (typeof api.createSatelliteObject !== 'function') return null;

  const object = api.createSatelliteObject({
    name: 'Demo ISS OBJ marker',
    objUrl: SIMPLE_SATELLITE_OBJ_URL,
    color: [1.0, 0.84, 0.22, 1.0],
    scale: 0.028,
  });
  api.showSatelliteObject?.(object);
  return object;
}

function updateTimelineFrame(api, viewer, frame) {
  updateTimelineControls(frame);
  updateSatelliteMarker(loadedDemo.marker, viewer, frame.markerPoint);
  updateSatelliteObject(loadedDemo.satelliteObject, frame);

  if (frame.nearestSampleIndex !== loadedDemo.currentFootprintIndex) {
    if (loadedDemo.currentFootprint) {
      api.deleteTerraFootprintSet?.(loadedDemo.currentFootprint);
    }
    loadedDemo.currentFootprint = createCurrentFootprintOverlay(api, viewer, frame.nearestSample);
    loadedDemo.currentFootprintIndex = frame.nearestSampleIndex;
  }
}

function updateSatelliteMarker(markerSet, viewer, point) {
  if (!markerSet) return;
  const columns = createMarkerColumns(viewer);
  markerSet.clearSources();
  markerSet.addSources([[
    point.longitudeDeg,
    point.latitudeDeg,
    point.timestamp,
    point.altitudeKm,
  ]], columns);
}

function updateSatelliteObject(satelliteObject, frame) {
  if (!satelliteObject || typeof satelliteObject.setPosition !== 'function') return;

  satelliteObject.setPosition(
    frame.markerPoint,
    frame.previousSample?.groundTrackPoint ?? null,
    frame.nextSample?.groundTrackPoint ?? null,
  );
}

function createMarkerColumns(viewer) {
  return [
    new viewer.MetadataColumn({ index: 0, name: 'longitudeDeg', columnType: viewer.ColumnType.GEOM_RA, unit: 'deg' }),
    new viewer.MetadataColumn({ index: 1, name: 'latitudeDeg', columnType: viewer.ColumnType.GEOM_DEC, unit: 'deg' }),
    new viewer.MetadataColumn({ index: 2, name: 'timestamp', columnType: viewer.ColumnType.MAIN_NAME, unit: '' }),
    new viewer.MetadataColumn({ index: 3, name: 'altitudeKm', columnType: viewer.ColumnType.NUMBER, unit: 'km' }),
  ];
}

function setTimelineControlsEnabled(enabled) {
  const play = el('btnSatelliteTimelinePlay');
  const pause = el('btnSatelliteTimelinePause');
  const seek = el('satelliteTimelineSeek');
  if (play) play.disabled = !enabled;
  if (pause) pause.disabled = !enabled;
  if (seek) seek.disabled = !enabled;
  if (!enabled) {
    if (seek) seek.value = '0';
    const label = el('satelliteTimelineTime');
    if (label) label.textContent = 'Timeline not loaded';
  }
}

function updateTimelineControls(frame) {
  const seek = el('satelliteTimelineSeek');
  if (seek) seek.value = String(Math.round(frame.progress01 * 1000));

  const label = el('satelliteTimelineTime');
  if (label) {
    label.textContent = `${new Date(frame.currentMs).toISOString()} `
      + `lon=${frame.markerPoint.longitudeDeg.toFixed(3)} `
      + `lat=${frame.markerPoint.latitudeDeg.toFixed(3)}`;
  }
}

function removeExistingDemo(api) {
  loadedDemo.timeline?.destroy();
  if (loadedDemo.country) api.deleteTerraFootprintSet?.(loadedDemo.country);
  if (loadedDemo.footprints) api.deleteTerraFootprintSet?.(loadedDemo.footprints);
  if (loadedDemo.currentFootprint) api.deleteTerraFootprintSet?.(loadedDemo.currentFootprint);
  if (loadedDemo.groundTrack) api.deleteTerraPolylineSet?.(loadedDemo.groundTrack);
  if (loadedDemo.marker) api.deleteTerraPointSet?.(loadedDemo.marker);
  if (loadedDemo.satelliteObject) api.deleteSatelliteObject?.(loadedDemo.satelliteObject);
  setTimelineControlsEnabled(false);

  loadedDemo = {
    country: null,
    footprints: null,
    currentFootprint: null,
    groundTrack: null,
    marker: null,
    satelliteObject: null,
    timeline: null,
    currentFootprintIndex: -1,
  };
}
