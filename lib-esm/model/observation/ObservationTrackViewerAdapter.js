import GeoJSONParser from '../../utils/GeoJSONParser.js';
import { ColumnType, MetadataColumn } from '../MetadataColumn.js';
import { MetadataManager } from '../MetadataManager.js';
import { createObservationTrackTimeline, footprintToRing, } from './ObservationTrackTimeline.js';
const DEFAULT_VISUALISATION = {
    showSatelliteModel: true,
    showGroundTrack: true,
    showFootprint: true,
    showSensorCone: true,
    showCurrentFootprintOnly: false,
    showAllFootprints: true,
};
const DEFAULT_COLORS = {
    groundTrack: '#ffe066',
    footprints: '#00fff2',
    currentFootprint: '#ff4d4d',
    marker: '#ff4d4d',
    satelliteObject: [1.0, 0.84, 0.22, 1.0],
    sensorCone: [0.0, 1.0, 0.95, 0.68],
    target: '#ffb347',
};
export class ObservationTrackViewerAdapter {
    activeHandle = null;
    viewer;
    metadataManagerFactory;
    colors;
    onFrame;
    constructor(options) {
        this.viewer = options.viewer;
        this.metadataManagerFactory = options.metadataManagerFactory ?? (() => new MetadataManager([]));
        this.colors = {
            ...DEFAULT_COLORS,
            ...options.colors,
        };
        this.onFrame = options.onFrame;
    }
    load(track) {
        this.clear();
        const handle = new InternalObservationTrackViewerHandle(this.viewer, track, this.metadataManagerFactory, this.colors, this.onFrame);
        this.activeHandle = handle;
        return handle;
    }
    clear() {
        this.activeHandle?.dispose();
        this.activeHandle = null;
    }
}
class InternalObservationTrackViewerHandle {
    viewer;
    track;
    metadataManagerFactory;
    colors;
    onFrame;
    timeline;
    objects = {
        target: null,
        groundTrack: null,
        footprints: null,
        currentFootprint: null,
        marker: null,
        satelliteObject: null,
        sensorCone: null,
    };
    visualisation;
    currentFootprintIndex = -1;
    disposed = false;
    constructor(viewer, track, metadataManagerFactory, colors, onFrame) {
        this.viewer = viewer;
        this.track = track;
        this.metadataManagerFactory = metadataManagerFactory;
        this.colors = colors;
        this.onFrame = onFrame;
        validateTrack(track);
        this.visualisation = {
            ...DEFAULT_VISUALISATION,
            ...track.visualisation,
        };
        this.createStaticObjects();
        this.timeline = createObservationTrackTimeline({
            samples: track.samples,
            playbackRate: 1,
            onFrame: (frame) => this.updateFrame(frame),
        });
        this.applyVisualisation();
    }
    play() {
        this.timeline.play();
    }
    pause() {
        this.timeline.pause();
    }
    seek(progress01) {
        this.timeline.seek(progress01);
    }
    setVisualisation(config) {
        this.visualisation = {
            ...this.visualisation,
            ...config,
        };
        this.applyVisualisation();
    }
    dispose() {
        if (this.disposed)
            return;
        this.disposed = true;
        this.timeline.destroy();
        this.deleteObjects();
    }
    createStaticObjects() {
        this.objects.target = this.createTargetOverlay();
        this.objects.footprints = this.createAllFootprintsOverlay();
        this.objects.groundTrack = this.createGroundTrackOverlay();
        this.objects.marker = this.createMarkerOverlay();
        this.objects.satelliteObject = this.createSatelliteObject();
        this.objects.sensorCone = this.createSensorCone();
    }
    createTargetOverlay() {
        const geojson = this.track.target?.geojson;
        if (!geojson)
            return null;
        const set = this.viewer.createTerraFootprintSet(this.track.target?.name ?? 'Observation target', 'ObservationTrack target GeoJSON', this.track.target?.geojsonUrl ?? 'ObservationTrack', this.metadataManagerFactory());
        set.addGeoJSONFeatures(GeoJSONParser.parseGeoJSON(geojson));
        this.viewer.changeFootprintSetColor(set, this.colors.target);
        this.viewer.showTerraFootprintSet(set);
        return set;
    }
    createAllFootprintsOverlay() {
        const featureCollection = {
            type: 'FeatureCollection',
            features: this.track.samples.map((sample, index) => footprintFeature(sample, index)),
        };
        const set = this.viewer.createTerraFootprintSet(`${this.track.satellite?.name ?? 'Satellite'} footprints`, 'ObservationTrack sampled sensor footprints', this.track.id ?? 'ObservationTrack', this.metadataManagerFactory());
        set.addGeoJSONFeatures(GeoJSONParser.parseGeoJSON(featureCollection));
        this.viewer.changeFootprintSetColor(set, this.colors.footprints);
        this.viewer.showTerraFootprintSet(set);
        return set;
    }
    createGroundTrackOverlay() {
        const set = this.viewer.createTerraPolylineSet(`${this.track.satellite?.name ?? 'Satellite'} ground track`, 'ObservationTrack GroundTrackPoint[]', this.track.id ?? 'ObservationTrack', this.metadataManagerFactory());
        set.addGroundTrack(this.track.samples.map((sample) => ({
            ...sample.groundTrackPoint,
            timestamp: sample.timestamp,
        })), { name: `${this.track.satellite?.name ?? 'Satellite'} ground track` });
        this.viewer.changeTerraPolylineSetColor(set, this.colors.groundTrack);
        this.viewer.showTerraPolylineSet(set);
        return set;
    }
    createMarkerOverlay() {
        const set = this.viewer.createTerraPointSet(`${this.track.satellite?.name ?? 'Satellite'} marker`, 'ObservationTrack interpolated satellite marker', this.track.id ?? 'ObservationTrack', new MetadataManager(createMarkerColumns()));
        this.viewer.changeCatalogueColor(set, this.colors.marker);
        this.viewer.showTerraPointSet(set);
        return set;
    }
    createSatelliteObject() {
        const objUrl = this.track.satellite?.model?.objUrl;
        if (!objUrl)
            return null;
        const object = this.viewer.createSatelliteObject({
            name: `${this.track.satellite?.name ?? 'Satellite'} object`,
            objUrl,
            color: this.colors.satelliteObject,
            scale: this.track.satellite?.model?.visualScale,
        });
        this.viewer.showSatelliteObject(object);
        return object;
    }
    createSensorCone() {
        const cone = this.viewer.createSensorCone({
            name: `${this.track.sensor?.name ?? 'Sensor'} cone`,
            color: this.colors.sensorCone,
            wireframe: true,
            filled: false,
        });
        this.viewer.showSensorCone(cone);
        return cone;
    }
    updateFrame(frame) {
        if (this.disposed)
            return;
        this.updateMarker(frame.currentGroundPoint);
        this.updateSatelliteObject(frame);
        this.updateSensorCone(frame);
        this.updateCurrentFootprint(frame);
        this.onFrame?.(frame);
    }
    updateMarker(point) {
        const marker = this.objects.marker;
        if (!marker)
            return;
        marker.clearSources();
        marker.addSources([[
                point.longitudeDeg,
                point.latitudeDeg,
                String(point.timestamp ?? ''),
                point.altitudeKm,
            ]], createMarkerColumns());
    }
    updateSatelliteObject(frame) {
        const satelliteObject = this.objects.satelliteObject;
        if (!satelliteObject)
            return;
        satelliteObject.setPosition(frame.currentGroundPoint, frame.previousSample?.groundTrackPoint ?? null, frame.nextSample?.groundTrackPoint ?? null);
    }
    updateSensorCone(frame) {
        const sensorCone = this.objects.sensorCone;
        if (!sensorCone)
            return;
        sensorCone.setGeometry(frame.currentGroundPoint, frame.currentFootprint);
    }
    updateCurrentFootprint(frame) {
        if (frame.nearestSampleIndex === this.currentFootprintIndex)
            return;
        if (this.objects.currentFootprint) {
            this.viewer.deleteTerraFootprintSet(this.objects.currentFootprint);
        }
        this.objects.currentFootprint = this.createCurrentFootprintOverlay(frame.nearestSample);
        this.currentFootprintIndex = frame.nearestSampleIndex;
        this.applyVisualisation();
    }
    createCurrentFootprintOverlay(sample) {
        const featureCollection = {
            type: 'FeatureCollection',
            features: [footprintFeature(sample, sample.index, 'Current footprint')],
        };
        const set = this.viewer.createTerraFootprintSet(`${this.track.satellite?.name ?? 'Satellite'} current footprint`, 'ObservationTrack nearest sampled footprint', this.track.id ?? 'ObservationTrack', this.metadataManagerFactory());
        set.addGeoJSONFeatures(GeoJSONParser.parseGeoJSON(featureCollection));
        this.viewer.changeFootprintSetColor(set, this.colors.currentFootprint);
        this.viewer.showTerraFootprintSet(set);
        return set;
    }
    applyVisualisation() {
        const showFootprint = Boolean(this.visualisation.showFootprint);
        const showAllFootprints = showFootprint
            && Boolean(this.visualisation.showAllFootprints)
            && !this.visualisation.showCurrentFootprintOnly;
        const showCurrentFootprint = showFootprint
            && (Boolean(this.visualisation.showCurrentFootprintOnly) || !showAllFootprints);
        if (this.objects.target)
            this.viewer.hideTerraFootprintSet(this.objects.target, true);
        if (this.objects.groundTrack) {
            this.viewer.hideTerraPolylineSet(this.objects.groundTrack, Boolean(this.visualisation.showGroundTrack));
        }
        if (this.objects.footprints) {
            this.viewer.hideTerraFootprintSet(this.objects.footprints, showAllFootprints);
        }
        if (this.objects.currentFootprint) {
            this.viewer.hideTerraFootprintSet(this.objects.currentFootprint, showCurrentFootprint);
        }
        if (this.objects.marker)
            this.viewer.hideTerraPointSet(this.objects.marker, true);
        if (this.objects.satelliteObject) {
            this.viewer.hideSatelliteObject(this.objects.satelliteObject, Boolean(this.visualisation.showSatelliteModel));
        }
        if (this.objects.sensorCone) {
            this.viewer.hideSensorCone(this.objects.sensorCone, Boolean(this.visualisation.showSensorCone));
        }
    }
    deleteObjects() {
        if (this.objects.target)
            this.viewer.deleteTerraFootprintSet(this.objects.target);
        if (this.objects.groundTrack)
            this.viewer.deleteTerraPolylineSet(this.objects.groundTrack);
        if (this.objects.footprints)
            this.viewer.deleteTerraFootprintSet(this.objects.footprints);
        if (this.objects.currentFootprint)
            this.viewer.deleteTerraFootprintSet(this.objects.currentFootprint);
        if (this.objects.marker)
            this.viewer.deleteTerraPointSet(this.objects.marker);
        if (this.objects.satelliteObject)
            this.viewer.deleteSatelliteObject(this.objects.satelliteObject);
        if (this.objects.sensorCone)
            this.viewer.deleteSensorCone(this.objects.sensorCone);
        this.objects.target = null;
        this.objects.groundTrack = null;
        this.objects.footprints = null;
        this.objects.currentFootprint = null;
        this.objects.marker = null;
        this.objects.satelliteObject = null;
        this.objects.sensorCone = null;
    }
}
function validateTrack(track) {
    if (!track.samples || track.samples.length === 0) {
        throw new Error('ObservationTrackViewerAdapter requires at least one sample.');
    }
}
function footprintFeature(sample, index, name = `Footprint ${index + 1}`) {
    return {
        type: 'Feature',
        properties: {
            name,
            timestamp: String(sample.timestamp),
            intersectsTarget: String(Boolean(sample.intersectsTarget ?? sample.intersects)),
        },
        geometry: footprintToGeoJSONGeometry(sample.footprint),
    };
}
function footprintToGeoJSONGeometry(footprint) {
    if (!Array.isArray(footprint) && 'polygons' in footprint) {
        return {
            type: 'MultiPolygon',
            coordinates: footprint.polygons.map((polygon) => [ringToGeoJSON(footprintToRing(polygon))]),
        };
    }
    return {
        type: 'Polygon',
        coordinates: [ringToGeoJSON(footprintToRing(footprint))],
    };
}
function ringToGeoJSON(ring) {
    if (ring.length === 0)
        return ring;
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (Math.abs(first[0] - last[0]) < 1e-9 && Math.abs(first[1] - last[1]) < 1e-9) {
        return ring;
    }
    return [...ring, [first[0], first[1]]];
}
function createMarkerColumns() {
    return [
        new MetadataColumn({ index: 0, name: 'longitudeDeg', columnType: ColumnType.GEOM_RA, unit: 'deg' }),
        new MetadataColumn({ index: 1, name: 'latitudeDeg', columnType: ColumnType.GEOM_DEC, unit: 'deg' }),
        new MetadataColumn({ index: 2, name: 'timestamp', columnType: ColumnType.MAIN_NAME, unit: '' }),
        new MetadataColumn({ index: 3, name: 'altitudeKm', columnType: ColumnType.NUMBER, unit: 'km' }),
    ];
}
