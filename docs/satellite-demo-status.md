# Satellite Demo Status

## Cosa Mostra

La demo ISS Spain in `astro-viewer` visualizza un passaggio ISS sopra/near Spain usando dati hardcoded derivati da `astrospatial-core`.

Mostra:

- regioni della Spagna da GeoJSON
- ground track ISS come polilinea geografica
- footprint nadir campionati
- footprint corrente evidenziato
- marker punto fallback del satellite
- modello OBJ semplificato del satellite
- timeline play/pause/seek
- cono/frustum wireframe dal satellite al footprint corrente

## Componenti Usati

Componenti `astro-viewer`:

- `TerraFootprintSetGL` per Spain GeoJSON e footprint
- `TerraPolylineSetGL` per ground track
- `TerraPointSetGL` per marker fallback
- `SatelliteObjectGL` per modello OBJ
- `SensorConeGL` per frustum wireframe
- `satelliteTimelineController.js` per timeline e interpolazione
- `satelliteFootprintDemo.js` per fixture e wiring demo

Asset demo:

- `src/html/test-data/generation/spain_regions.geojson`
- `src/html/test-data/satellite/simple_satellite.obj`

## Demo-Only

Restano demo-only:

- TLE e propagazione non vengono eseguiti nel viewer
- observation samples sono hardcoded
- footprint e intersezioni sono fixture, non ricalcolati live
- interpolazione del footprint è solo visuale
- `SensorConeGL` visualizza dati già forniti, non calcola geometria sensore
- il modello satellite è un OBJ low-poly non fisico
- timeline e controlli sono solo nel pannello dev

Il viewer non deve diventare proprietario di propagazione, sensor modelling o analisi GeoJSON.

## Da Portare In astrobrowser-ui

Da portare/ricostruire in `astrobrowser-ui`:

- input TLE
- selezione intervallo temporale
- parametri sensore
- selezione target GeoJSON/country
- orchestrazione chiamate `astrospatial-core`
- gestione `ObservationTrack`
- timeline utente
- pannelli risultato e stato intersezione
- adattamento dei risultati verso `astro-viewer`

Flusso target:

```text
astrobrowser-ui
  -> astrospatial-core
  -> ObservationTrack samples
  -> astro-viewer render overlays
```

## Limiti Noti

- La demo usa dati hardcoded e può divergere da `astrospatial-core`.
- Il footprint corrente evidenziato resta nearest-sample, non interpolato.
- Il cono usa footprint interpolato visual-only tra sample adiacenti.
- L'interpolazione lon/lat non è robusta per antimeridian crossing.
- Le linee WebGL sono sottili perché `gl.LINE` è limitato dai browser.
- Non ci sono filled cone faces, hover, picking o tooltip.
- Il modello satellite non rappresenta asset/attitude reali.
- Non esiste ancora API production per ground-track timeline o satellite objects in `astrobrowser-ui`.
