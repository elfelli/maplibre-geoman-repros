import * as ml from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Geoman } from '@geoman-io/maplibre-geoman-pro';
import '@geoman-io/maplibre-geoman-pro/dist/maplibre-geoman.css';

ml.setWorkerUrl(workerUrl);

// `?validate=1` (default) or `?validate=0`.
const validateGeometry = new URLSearchParams(location.search).get('validate') !== '0';
const D = 0.02;
const ring = [[-D, -D], [D, -D], [D, D], [-D, D], [-D, -D]];
window.ring = ring;

const map = new ml.Map({
  container: 'map',
  style: { version: 8, sources: {}, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#eef2f0' } }] },
  center: [0, 0],
  zoom: 12,
  fadeDuration: 0,
});
window.map = map;

const gm = new Geoman(map, { settings: { validateGeometry } });
window.gm = gm;
window.rejections = [];
map.on('gm:operation_rejected', (e) => window.rejections.push(e.reason));

map.on('gm:loaded', async () => {
  await gm.features.importGeoJson({
    type: 'FeatureCollection',
    features: [{ type: 'Feature', id: 'square', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } }],
  });
  await gm.enableMode('edit', 'change');
  map.once('idle', () => { window.__ready = true; });
});
