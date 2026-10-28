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
  zoom: 16,
  fadeDuration: 0,
});

const gm = new Geoman(map, {});
window.gm = gm;
window.map = map;

const storeSize = () => gm.features.exportGeoJson().features.length;
window.__events = [];
const record = (kind, name, action = '') => {
  const size = storeSize();
  window.__events.push({ kind, name, action, size });
  log(kind.padEnd(8), name, action, 'store size:', size);
};

const triangle = {
  type: 'Feature',
  properties: {},
  geometry: { type: 'Polygon', coordinates: [[[0, 0.001], [0.001, -0.001], [-0.001, -0.001], [0, 0.001]]] },
};

map.on('gm:loaded', async () => {
  gm.setGlobalEventsListener((event) => {
    if (event?.name?.startsWith('_gm:')) record('internal', event.name, event.action ?? '');
  });
  ['gm:create', 'gm:remove', 'gm:edit', 'gm:editend'].forEach((name) =>
    map.on(name, () => record('public', name)));

  await gm.features.importGeoJson({ type: 'FeatureCollection', features: [triangle] });
  await gm.enableMode('edit', 'change');
  log('Triangle imported, edit/change mode on, store size:', storeSize());
  log('Right-click a vertex of the triangle.');
  window.__ready = true;
});
