import { el, setStatus } from './ui.js';
import { state } from './state.js';

const SPAIN_LIKE_AREA = {
  type: 'Feature',
  properties: {
    name: 'Spain-like rectangle',
    source: 'astrospatial-core demo fixture',
  },
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [-10.0, 35.5],
      [4.5, 35.5],
      [4.5, 44.5],
      [-10.0, 44.5],
      [-10.0, 35.5],
    ]],
  },
};

// Fixture generated from astrospatial-core/examples/real-tle-spain-observation.mjs.
// This keeps the AstroViewer dev demo independent from astrospatial-core packaging for now.
// Replace this fixture with a direct astrospatial-core call once the app-level package wiring exists.
const DEMO_OBSERVATIONS = [
  {
    timestamp: '2019-06-24T06:16:00.000Z',
    groundTrackPoint: { latitudeDeg: 25.933956, longitudeDeg: -17.469501, altitudeKm: 410.401 },
    intersects: false,
    footprint: [[-10.246271, 24.78676], [-10.798595, 24.791676], [-11.348964, 24.793307], [-11.899333, 24.791676], [-12.451658, 24.78676], [-12.45422, 25.288209], [-12.458183, 25.787842], [-12.463574, 26.287464], [-12.470438, 26.788881], [-11.908691, 26.790314], [-11.348964, 26.79079], [-10.789238, 26.790314], [-10.227491, 26.788881], [-10.234355, 26.287464], [-10.239745, 25.787842], [-10.243709, 25.288209], [-10.246271, 24.78676]],
  },
  {
    timestamp: '2019-06-24T06:17:00.000Z',
    groundTrackPoint: { latitudeDeg: 28.728741, longitudeDeg: -14.670979, altitudeKm: 410.508 },
    intersects: false,
    footprint: [[-7.172406, 27.572618], [-7.737076, 27.577912], [-8.299758, 27.579668], [-8.86244, 27.577912], [-9.42711, 27.572618], [-9.430323, 28.073163], [-9.434975, 28.571896], [-9.441094, 29.070617], [-9.448735, 29.571126], [-8.873215, 29.572963], [-8.299758, 29.573573], [-7.726301, 29.572963], [-7.150782, 29.571126], [-7.158422, 29.070617], [-7.164542, 28.571896], [-7.169193, 28.073163], [-7.172406, 27.572618]],
  },
  {
    timestamp: '2019-06-24T06:18:00.000Z',
    groundTrackPoint: { latitudeDeg: 31.450296, longitudeDeg: -11.708089, altitudeKm: 410.676 },
    intersects: false,
    footprint: [[-3.930914, 30.286818], [-4.509562, 30.292497], [-5.086184, 30.294381], [-5.662806, 30.292497], [-6.241453, 30.286818], [-6.245369, 30.786493], [-6.250764, 31.284361], [-6.257676, 31.782215], [-6.266163, 32.28185], [-5.675118, 32.2841], [-5.086184, 32.284847], [-4.497249, 32.2841], [-3.906204, 32.28185], [-3.914691, 31.782215], [-3.921603, 31.284361], [-3.926999, 30.786493], [-3.930914, 30.286818]],
  },
  {
    timestamp: '2019-06-24T06:19:00.000Z',
    groundTrackPoint: { latitudeDeg: 34.085721, longitudeDeg: -8.557082, altitudeKm: 410.892 },
    intersects: false,
    footprint: [[-0.498082, 32.916444], [-1.09232, 32.922515], [-1.684491, 32.924529], [-2.276663, 32.922515], [-2.870901, 32.916444], [-2.875575, 33.415289], [-2.881777, 33.912332], [-2.889551, 34.40936], [-2.898962, 34.908161], [-2.290645, 34.910834], [-1.684491, 34.911721], [-1.078338, 34.910834], [-0.470021, 34.908161], [-0.479432, 34.40936], [-0.487206, 33.912332], [-0.493408, 33.415289], [-0.498082, 32.916444]],
  },
  {
    timestamp: '2019-06-24T06:20:00.000Z',
    groundTrackPoint: { latitudeDeg: 36.620295, longitudeDeg: -5.193023, altitudeKm: 411.145 },
    intersects: true,
    footprint: [[3.150893, 35.446712], [2.539516, 35.453183], [1.930252, 35.455329], [1.320987, 35.453183], [0.709611, 35.446712], [0.704117, 35.944775], [0.69704, 36.44104], [0.688331, 36.937288], [0.677915, 37.435302], [1.305193, 37.438406], [1.930252, 37.439435], [2.55531, 37.438406], [3.182588, 37.435302], [3.172173, 36.937288], [3.163463, 36.44104], [3.156386, 35.944775], [3.150893, 35.446712]],
  },
  {
    timestamp: '2019-06-24T06:21:00.000Z',
    groundTrackPoint: { latitudeDeg: 39.037232, longitudeDeg: -1.590424, altitudeKm: 411.423 },
    intersects: true,
    footprint: [[7.041238, 37.860736], [6.411306, 37.86761], [5.783535, 37.869891], [5.155765, 37.86761], [4.525832, 37.860736], [4.519457, 38.358068], [4.511437, 38.853607], [4.501717, 39.349128], [4.490213, 39.846407], [5.138015, 39.849948], [5.783535, 39.851123], [6.429056, 39.849948], [7.076858, 39.846407], [7.065354, 39.349128], [7.055633, 38.853607], [7.047613, 38.358068], [7.041238, 37.860736]],
  },
  {
    timestamp: '2019-06-24T06:22:00.000Z',
    groundTrackPoint: { latitudeDeg: 41.317488, longitudeDeg: 2.27567, altitudeKm: 411.716 },
    intersects: false,
    footprint: [[11.19746, 40.139325], [10.54778, 40.146605], [9.900313, 40.149021], [9.252847, 40.146605], [8.603166, 40.139325], [8.59585, 40.635986], [8.586822, 41.130857], [8.576019, 41.625708], [8.563348, 42.122311], [9.233004, 42.126292], [9.900313, 42.127612], [10.567623, 42.126292], [11.237279, 42.122311], [11.224608, 41.625708], [11.213804, 41.130857], [11.204776, 40.635986], [11.19746, 40.139325]],
  },
  {
    timestamp: '2019-06-24T06:23:00.000Z',
    groundTrackPoint: { latitudeDeg: 43.439656, longitudeDeg: 6.427973, altitudeKm: 412.011 },
    intersects: false,
    footprint: [[15.641582, 42.260891], [14.971308, 42.268575], [14.303301, 42.271124], [13.635294, 42.268575], [12.96502, 42.260891], [12.956713, 42.756945], [12.946621, 43.25121], [12.934673, 43.745455], [12.920768, 44.241445], [13.613241, 44.245864], [14.303301, 44.24733], [14.993361, 44.245864], [15.685833, 44.241445], [15.671928, 43.745455], [15.659981, 43.25121], [15.649889, 42.756945], [15.641582, 42.260891]],
  },
  {
    timestamp: '2019-06-24T06:24:00.000Z',
    groundTrackPoint: { latitudeDeg: 45.380045, longitudeDeg: 10.884519, altitudeKm: 412.299 },
    intersects: false,
    footprint: [[20.390646, 44.201529], [19.699429, 44.209605], [19.010531, 44.212285], [18.321633, 44.209605], [17.630416, 44.201529], [17.621085, 44.697043], [17.609894, 45.190771], [17.596763, 45.684477], [17.581579, 46.179924], [18.297295, 46.184771], [19.010531, 46.186379], [19.723767, 46.184771], [20.439483, 46.179924], [20.424299, 45.684477], [20.411168, 45.190771], [20.399977, 44.697043], [20.390646, 44.201529]],
  },
];

let loadedDemo = {
  country: null,
  footprints: null,
  groundTrack: null,
};

export function wireSatelliteFootprintDemo() {
  el('btnLoadSatelliteFootprintDemo')?.addEventListener('click', loadSatelliteFootprintDemo);
}

function loadSatelliteFootprintDemo() {
  const api = state.AstroAPI;
  const viewer = window.astroviewer;
  if (!api || !viewer) {
    setStatus('Satellite footprint demo unavailable: AstroViewer API is not ready.');
    return;
  }

  try {
    removeExistingDemo(api);

    loadedDemo.country = createCountryOverlay(api, viewer);
    loadedDemo.footprints = createFootprintOverlay(api, viewer);
    loadedDemo.groundTrack = createGroundTrackPointOverlay(api, viewer);

    if (typeof api.goTo === 'function') {
      api.goTo(-3.7, 40.4);
    }

    const hits = DEMO_OBSERVATIONS.filter((sample) => sample.intersects);
    setStatus(
      `Loaded ISS Spain footprint demo: ${DEMO_OBSERVATIONS.length} samples, `
      + `${hits.length} intersecting footprints. Ground track is point-only until TerraPolylineSetGL exists.`
    );
  } catch (error) {
    console.error('[satelliteFootprintDemo] failed', error);
    setStatus(`Satellite footprint demo error: ${error.message || error}`);
  }
}

function createCountryOverlay(api, viewer) {
  const set = api.createTerraFootprintSet(
    'Demo target: Spain-like GeoJSON',
    'Hardcoded country target for satellite footprint visual demo',
    'astrospatial-core fixture',
    new viewer.MetadataManager([]),
  );
  set.addGeoJSONFeatures(viewer.GeoJSONParser.parseGeoJSON(SPAIN_LIKE_AREA));
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

function createGroundTrackPointOverlay(api, viewer) {
  const columns = [
    new viewer.MetadataColumn({ index: 0, name: 'longitudeDeg', columnType: viewer.ColumnType.GEOM_RA, unit: 'deg' }),
    new viewer.MetadataColumn({ index: 1, name: 'latitudeDeg', columnType: viewer.ColumnType.GEOM_DEC, unit: 'deg' }),
    new viewer.MetadataColumn({ index: 2, name: 'timestamp', columnType: viewer.ColumnType.MAIN_NAME, unit: '' }),
    new viewer.MetadataColumn({ index: 3, name: 'altitudeKm', columnType: viewer.ColumnType.NUMBER, unit: 'km' }),
  ];
  const rows = DEMO_OBSERVATIONS.map((sample) => [
    sample.groundTrackPoint.longitudeDeg,
    sample.groundTrackPoint.latitudeDeg,
    sample.timestamp,
    sample.groundTrackPoint.altitudeKm,
  ]);
  const set = api.createTerraPointSet(
    'Demo ISS ground-track samples',
    'Temporary point fallback for GroundTrackPoint[] until TerraPolylineSetGL exists',
    'astrospatial-core fixture',
    new viewer.MetadataManager(columns),
  );
  set.addSources(rows, columns);
  api.changeCatalogueColor?.(set, '#ffe066');
  api.showTerraPointSet(set);
  return set;
}

function removeExistingDemo(api) {
  if (loadedDemo.country) api.deleteTerraFootprintSet?.(loadedDemo.country);
  if (loadedDemo.footprints) api.deleteTerraFootprintSet?.(loadedDemo.footprints);
  if (loadedDemo.groundTrack) api.deleteTerraPointSet?.(loadedDemo.groundTrack);

  loadedDemo = {
    country: null,
    footprints: null,
    groundTrack: null,
  };
}
