import * as ml from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as G from '@geoman-io/maplibre-geoman-pro';
import '@geoman-io/maplibre-geoman-pro/dist/maplibre-geoman.css';

const params = new URLSearchParams(location.search);
const TARGET = params.get('target') || 'layer';
const ACQUIRE = params.get('acquire') || 'rendered';
const ZOOM = Number(params.get('z') || 15);

const logEl = document.getElementById('log');
const log = (...a) => { logEl.textContent += a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ') + '\n'; };

const irregularRing = (count) => {
  const ring = [];
  let seed = 12345;
  const random = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  for (let i = 0; i < count; i += 1) {
    const angle = (2 * Math.PI * i) / count;
    const radius = 0.02 * (1 + 0.1 * random());
    ring.push([radius * Math.cos(angle), radius * Math.sin(angle)]);
  }
  ring.push(ring[0]);
  return ring;
};
const neighbourRing = irregularRing(400);
const neighbour = { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [neighbourRing] } };

const metres = (a, b) => Math.hypot((a[0] - b[0]) * 111320, (a[1] - b[1]) * 110540);
const nearestNeighbourVertex = (vertex) => Math.min(...neighbourRing.map((candidate) => metres(vertex, candidate)));
const isNeighbourVertex = (vertex) => neighbourRing.some((candidate) => candidate[0] === vertex[0] && candidate[1] === vertex[1]);

const map = new ml.Map({
  container: 'map',
  style: { version: 8, sources: {}, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#eef2f0' } }] },
  center: neighbourRing[0],
  zoom: ZOOM,
  fadeDuration: 0,
});
window.map = map;
window.neighbourRing = neighbourRing;

await new Promise((resolve) => map.once('load', resolve));
if (TARGET !== 'feature') {
  map.addSource('neighbour', { type: 'geojson', data: { type: 'FeatureCollection', features: [neighbour] } });
  map.addLayer({ id: 'neighbour-fill', type: 'fill', source: 'neighbour', paint: { 'fill-color': '#9cc', 'fill-opacity': 0.25 } });
  map.addLayer({ id: 'neighbour-line', type: 'line', source: 'neighbour', paint: { 'line-color': '#066', 'line-width': 1 } });
}

const snapping = TARGET === 'layer'
  ? { targets: [{ source: 'neighbour', layers: ['neighbour-line', 'neighbour-fill'], vertices: true, edges: true }], acquire: ACQUIRE, maxCandidates: 200 }
  : undefined;
const gm = new G.Geoman(map, { settings: { snapDistance: 18, ...(snapping ? { snapping } : {}) } });
window.gm = gm;

let neighbourFeatureId = null;
map.on('gm:loaded', async () => {
  if (TARGET === 'feature') {
    const imported = await gm.features.importGeoJsonFeature({ ...neighbour, properties: { __gm_disableEdit: true } });
    neighbourFeatureId = imported?.id ?? null;
  }
  await gm.enableMode('helper', 'snapping');
  if (TARGET === 'custom') {
    gm.actionInstances.helper__snapping.setCustomSnappingCoordinates('neighbour', neighbourRing.slice(0, -1));
  }
  await gm.enableMode('draw', 'polygon');
  if (TARGET !== 'feature') await new Promise((resolve) => (map.loaded() ? resolve() : map.once('idle', resolve)));
  log(`target: ${TARGET}${TARGET === 'layer' ? `, acquire: ${ACQUIRE}` : ''}, zoom ${ZOOM}`);
  log('Click about 5 px away from three vertices of the neighbour outline, then close the polygon.');
  log('window.snapReport() compares each drawn vertex with the neighbour vertices.');
  window.__ready = true;
});

window.snapReport = () => {
  const drawnFeature = gm.features.exportGeoJson().features.filter((feature) => feature.id !== neighbourFeatureId).at(-1);
  const { type, coordinates } = drawnFeature.geometry;
  const drawn = (type === 'MultiPolygon' ? coordinates[0][0] : coordinates[0]).slice(0, -1);
  return drawn.map((vertex) => ({
    exactCopy: isNeighbourVertex(vertex),
    metresToNearestNeighbourVertex: nearestNeighbourVertex(vertex),
  }));
};

window.sourceFeaturesReport = () => {
  const vertices = map.querySourceFeatures('neighbour').flatMap((feature) => feature.geometry.coordinates.flat(feature.geometry.type === 'MultiPolygon' ? 2 : 1));
  return { returnedVertices: vertices.length, exactCopiesOfANeighbourVertex: vertices.filter(isNeighbourVertex).length };
};
