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
  zoom: 1,
  fadeDuration: 0,
});

const gm = new Geoman(map, {});
window.gm = gm;

const inputs = {
  ring: { type: 'Polygon', coordinates: [[[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]]] },
  line: { type: 'LineString', coordinates: [[30, 10], [20, 5], [10, 0]] },
  westAt45N: { type: 'LineString', coordinates: [[10, 45], [0, 45]] },
  eastAt45N: { type: 'LineString', coordinates: [[0, 45], [10, 45]] },
  westAt45S: { type: 'LineString', coordinates: [[10, -45], [0, -45]] },
};
const feature = (name) => ({ type: 'Feature', properties: { name }, geometry: inputs[name] });

const exported = () => {
  const byName = {};
  gm.features.exportGeoJson().features.forEach((f) => { byName[f.properties.name] = f.geometry.coordinates; });
  return byName;
};
const outputs = {};
const report = (step, name, coordinates) => {
  outputs[`${step} ${name}`] = coordinates;
  log(`${step.padEnd(20)} ${name.padEnd(10)}`, coordinates);
};

map.on('gm:loaded', async () => {
  Object.entries(inputs).forEach(([name, geometry]) => report('input', name, geometry.coordinates));

  const result = await gm.features.importGeoJson({
    type: 'FeatureCollection',
    features: Object.keys(inputs).map(feature),
  });
  let current = exported();
  Object.keys(inputs).forEach((name) => report('importGeoJson', name, current[name]));

  const line = result.addedFeatures.find((fd) => fd.getGeoJson().properties.name === 'line');
  await line.updateGeometry(inputs.line);
  report('updateGeometry', 'line', exported().line);

  await gm.features.deleteAll();
  await gm.features.importGeoJsonFeature(feature('line'));
  report('importGeoJsonFeature', 'line', exported().line);

  window.__outputs = outputs;
  window.__ready = true;
});
