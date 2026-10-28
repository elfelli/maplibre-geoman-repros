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
  zoom: 3,
  fadeDuration: 0,
});

const gm = new Geoman(map, {});
window.gm = gm;

const pointFeature = (id) => ({ type: 'Feature', id, properties: {}, geometry: { type: 'Point', coordinates: [0, 0] } });

function mergeGeoJsonDiffFixed(prev, next) {
  this.constructor.resolveMergeConflicts(prev, next);
  if (prev.removeAll || next.removeAll) prev.removeAll = true;
  if (next.remove && !prev.remove) prev.remove = new Set();
  next.remove?.forEach((value) => prev.remove?.add(value));
  if (next.add && !prev.add) prev.add = new Map();
  next.add?.forEach((value, key) => prev.add?.set(key, value));
  if (next.update && !prev.update) prev.update = new Map();
  next.update?.forEach((value, key) => prev.update?.set(key, value));
  if (prev.remove?.size && next.add?.size) {
    for (const id of next.add.keys()) prev.remove.delete(id);
  }
}

function run(pendingAdds) {
  const updateManager = gm.features.updateManager;
  const prev = { remove: new Set(['halo-deleted-earlier']), add: new Map() };
  const start = performance.now();
  for (let i = 0; i < pendingAdds; i += 1) {
    updateManager.mergeGeoJsonDiff(prev, { add: new Map([[`marker-${i}`, pointFeature(`marker-${i}`)]]) });
  }
  const ms = Math.round(performance.now() - start);
  log('mergeGeoJsonDiff', String(pendingAdds).padStart(6), 'pending adds ->', String(ms).padStart(5), 'ms');
}

map.on('gm:loaded', () => {
  log('One pending "remove" in the diff, then N single-feature "add" merges (what a vertex press produces).');
  log('Cost should be linear in N; it is quadratic:');
  for (const n of [5000, 10000, 20000, 38000]) run(n);
  log('Same loop with the suggested fix (only the final loop of mergeGeoJsonDiff changed):');
  gm.features.updateManager.mergeGeoJsonDiff = mergeGeoJsonDiffFixed;
  for (const n of [5000, 10000, 20000, 38000]) run(n);
  window.__ready = true;
});
