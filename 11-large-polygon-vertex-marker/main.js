import * as ml from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Geoman } from '@geoman-io/maplibre-geoman-free';
import '@geoman-io/maplibre-geoman-free/dist/maplibre-geoman.css';

ml.setWorkerUrl(workerUrl);

// A rectangle whose bottom edge has `n` vertices (`?n=600`, default 600); the two top corners stay isolated.
const n = Number(new URLSearchParams(location.search).get('n') ?? 600);
const W = 0.02;
const H = 0.012;
const bottom = Array.from({ length: n }, (_, k) => [-W + (2 * W * k) / (n - 1), -H]);
const ring = [...bottom, [W, H], [-W, H], bottom[0]];
window.ring = ring;

const map = new ml.Map({
  container: 'map',
  style: { version: 8, sources: {}, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#eef2f0' } }] },
  center: [0, 0],
  zoom: 13,
  fadeDuration: 0,
});
window.map = map;

const gm = new Geoman(map, {});
window.gm = gm;

map.on('gm:loaded', async () => {
  await gm.features.importGeoJson({
    type: 'FeatureCollection',
    features: [{ type: 'Feature', id: 'rectangle', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } }],
  });
  await gm.enableMode('edit', 'change');
  map.once('idle', () => { window.__ready = true; });
});
