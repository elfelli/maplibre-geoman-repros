import * as ml from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Geoman } from '@geoman-io/maplibre-geoman-free';
import '@geoman-io/maplibre-geoman-free/dist/maplibre-geoman.css';

ml.setWorkerUrl(workerUrl);

// An octagon centred on [0, 0].
const RADIUS = 0.01;
const ring = [];
for (let i = 0; i < 8; i += 1) {
  const angle = (2 * Math.PI * i) / 8;
  ring.push([RADIUS * Math.cos(angle), RADIUS * Math.sin(angle)]);
}
ring.push(ring[0]);

const map = new ml.Map({
  container: 'map',
  style: { version: 8, sources: {}, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#eef2f0' } }] },
  center: [0, 0],
  zoom: 13,
  fadeDuration: 0,
});
window.map = map;

// Default options: Geoman's own controls are shown.
const gm = new Geoman(map, {});
window.gm = gm;

map.on('gm:loaded', async () => {
  await gm.features.importGeoJson({
    type: 'FeatureCollection',
    features: [{ type: 'Feature', id: 'octagon', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } }],
  });
  await gm.enableMode('edit', 'change');
  map.once('idle', () => { window.__ready = true; });
});
