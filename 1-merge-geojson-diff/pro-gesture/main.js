import * as ml from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as G from '@geoman-io/maplibre-geoman-pro';
import '@geoman-io/maplibre-geoman-pro/dist/maplibre-geoman.css';

const params = new URLSearchParams(location.search);
const VERTICES = Number(params.get('n') || 19000);
const renderSelection = params.get('renderSelection') !== 'false';
const applyFix = params.get('fix') === '1';

const logEl = document.getElementById('log');
const log = (...a) => { logEl.textContent += a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ') + '\n'; };

const syntheticRing = (count, radiusDegrees) => {
  const ring = [];
  for (let i = 0; i < count; i += 1) {
    const angle = (2 * Math.PI * i) / count;
    const radius = radiusDegrees * (1 + 0.05 * Math.sin(37 * angle));
    ring.push([radius * Math.cos(angle), radius * Math.sin(angle)]);
  }
  ring.push(ring[0]);
  return ring;
};

const map = new ml.Map({
  container: 'map',
  style: { version: 8, sources: {}, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#eef2f0' } }] },
  center: [0, 0],
  zoom: 3,
  fadeDuration: 0,
});
window.map = map;

const gm = new G.Geoman(map, { settings: { renderSelection } });
window.gm = gm;

// ?fix=1 replaces mergeGeoJsonDiff with the suggested fix (only the final loop differs).
if (applyFix) {
  const updateManager = gm.features.updateManager;
  updateManager.mergeGeoJsonDiff = function mergeGeoJsonDiffFixed(prev, next) {
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
  };
}

if (params.get('probe') === '1') {
  const updateManager = gm.features.updateManager;
  const merge = updateManager.mergeGeoJsonDiff;
  window.__probe = { maxAddsWithRemovePending: 0, removeIds: [] };
  updateManager.mergeGeoJsonDiff = function probed(prev, next) {
    if (prev.remove?.size && (prev.add?.size ?? 0) > window.__probe.maxAddsWithRemovePending) {
      window.__probe.maxAddsWithRemovePending = prev.add.size;
      window.__probe.source = Object.entries(this.updateStorage).find(([, v]) => v.diff === prev)?.[0];
      window.__probe.removeIds = [...prev.remove].slice(0, 3);
    }
    return merge.call(this, prev, next);
  };
}

map.on('gm:loaded', async () => {
  const ring = syntheticRing(VERTICES, 0.004);
  await gm.features.importGeoJson({
    type: 'FeatureCollection',
    features: [{ type: 'Feature', id: 'big', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } }],
  });
  map.jumpTo({ center: ring[0], zoom: 18 });
  await new Promise((resolve) => setTimeout(resolve, 1500));

  window.__longTasks = [];
  new PerformanceObserver((list) => list.getEntries().forEach((e) => window.__longTasks.push(Math.round(e.duration))))
    .observe({ entryTypes: ['longtask'] });

  await gm.enableMode('edit', 'change');
  gm.features.setSelection(['big']);
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const vertex = map.project(ring[0]);
  window.__vertexScreen = [vertex.x, vertex.y];
  log(`${VERTICES} vertices, renderSelection: ${renderSelection}, fix: ${applyFix}`);
  log('Press on the vertex at the centre of the map and drag it by a few pixels.');
  log('Long tasks are collected in window.__longTasks (ms).');
  window.__ready = true;
});
