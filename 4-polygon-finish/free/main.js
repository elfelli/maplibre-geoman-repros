import * as ml from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Geoman } from '@geoman-io/maplibre-geoman-free';
import '@geoman-io/maplibre-geoman-free/dist/maplibre-geoman.css';

ml.setWorkerUrl(workerUrl);

const logEl = document.getElementById('log');
const log = (...a) => { logEl.textContent += a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ') + '\n'; };
const map = new ml.Map({
  container: 'map',
  style: { version: 8, sources: {}, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#eef2f0' } }] },
  center: [0, 0],
  zoom: 14,
  fadeDuration: 0,
});

const gm = new Geoman(map, {});
window.gm = gm;
window.events = [];
gm.setGlobalEventsListener((event) => window.events.push(event.name.startsWith('_gm:') ? `${event.name} (${event.action})` : event.name));

const describe = (feature) => {
  const { type, coordinates } = feature.geometry;
  return { type, parts: type === 'MultiPolygon' ? coordinates.length : 1 };
};

map.on('gm:loaded', async () => {
  map.on('gm:create', (e) => log('gm:create', describe(e.feature.getGeoJson())));
  await gm.enableMode('draw', 'polygon');
  log('Draw mode "polygon" is on. Click the points below, then click the first vertex to close:');
  log('A) bow-tie:   (300,300) (500,500) (500,300) (300,500) -> close');
  log('B) square:    (300,300) (500,300) (500,500) (300,500) -> close');
  log('C) collinear: (300,300) (400,300) (500,300)           -> close');
  log('D) 2 points:  (300,300) (500,300)                     -> close');
  window.__ready = true;
});
