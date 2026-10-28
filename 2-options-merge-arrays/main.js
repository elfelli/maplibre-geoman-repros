import * as ml from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Geoman } from '@geoman-io/maplibre-geoman-pro';
import '@geoman-io/maplibre-geoman-pro/dist/maplibre-geoman.css';

const logEl = document.getElementById('log');
const log = (...a) => { logEl.textContent += a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ') + '\n'; };

const createMap = (container) => new ml.Map({
  container,
  style: { version: 8, sources: {}, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#eef2f0' } }] },
  center: [0, 0],
  zoom: 3,
  fadeDuration: 0,
});

// `deleteSelected: []` and `deleteSelected: ['F20']` can't be in the same config,
// so the second case runs on a second map.
const cases = [
  { container: 'map-a', bindings: { deleteSelected: [], finishShape: [], nudge: [], cancel: [], redo: ['F20'] } },
  { container: 'map-b', bindings: { deleteSelected: ['F20'] } },
];

let loaded = 0;
cases.forEach(({ container, bindings }) => {
  const map = createMap(container);
  console.log(`creating Geoman on #${container}`);
  const gm = new Geoman(map, { settings: { keyboard: { enabled: true, bindings } } });
  map.on('gm:loaded', () => {
    const effective = gm.options.settings.keyboard.bindings;
    log(`#${container}`);
    Object.entries(bindings).forEach(([action, requested]) => {
      log(`  ${action}: requested ${JSON.stringify(requested)} -> effective ${JSON.stringify(effective[action])}`);
    });
    loaded += 1;
    if (loaded === cases.length) window.__ready = true;
  });
});
