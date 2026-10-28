import * as ml from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Geoman } from '@geoman-io/maplibre-geoman-pro';
import '@geoman-io/maplibre-geoman-pro/dist/maplibre-geoman.css';

ml.setWorkerUrl(workerUrl);

const params = new URLSearchParams(location.search);
const withGeofencing = params.has('geofencing');

const logEl = document.getElementById('log');
const log = (...a) => { logEl.textContent += a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ') + '\n'; };
const map = new ml.Map({
  container: 'map',
  style: { version: 8, sources: {}, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#eef2f0' } }] },
  center: [0, 0],
  zoom: 14,
  fadeDuration: 0,
});

const gm = new Geoman(map, { settings: { validateGeometry: !withGeofencing } });
window.gm = gm;
window.events = [];
gm.setGlobalEventsListener((event) => window.events.push(event.name.startsWith('_gm:') ? `${event.name} (${event.action})` : `${event.name}${event.action ? ` (${event.action})` : ''}`));

const keepOut = {
  type: 'Feature',
  properties: { shape: 'polygon' },
  geometry: { type: 'Polygon', coordinates: [[[-0.0005, -0.0005], [0.0005, -0.0005], [0.0005, 0.0005], [-0.0005, 0.0005], [-0.0005, -0.0005]]] },
};

map.on('gm:loaded', async () => {
  map.on('gm:create', (e) => log('gm:create', e.feature.getGeoJson().geometry.type));
  map.on('gm:geofencing_violation', (e) => log('gm:geofencing_violation', e.action));
  if (withGeofencing) {
    const keepOutFeature = await gm.features.importGeoJsonFeature(keepOut);
    window.keepOutId = keepOutFeature.id;
    await gm.geofencing.setIntersectionRestriction([keepOutFeature.id]);
    log('Keep-out square at the map center (intersection restriction).');
    log('E) triangle around it: (200,600) (800,600) (500,150) -> close on the first vertex, the last vertex, or press Enter');
  } else {
    log('validateGeometry: true. Click the points, then close on the first vertex or press Enter:');
    log('A) bow-tie:   (300,300) (500,500) (500,300) (300,500)');
    log('B) square:    (300,300) (500,300) (500,500) (300,500)');
    log('C) collinear: (300,300) (400,300) (500,300)');
    log('D) 2 points:  (300,300) (500,300)');
  }
  await gm.enableMode('draw', 'polygon');
  window.__ready = true;
});
