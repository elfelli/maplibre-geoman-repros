import * as ml from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as G from '@geoman-io/maplibre-geoman-pro';
import '@geoman-io/maplibre-geoman-pro/dist/maplibre-geoman.css';

const COUNT = 40;
const RADIUS = 0.002;
const ring = [];
for (let i = 0; i < COUNT; i += 1) {
  const angle = (2 * Math.PI * i) / COUNT;
  ring.push([RADIUS * Math.cos(angle), RADIUS * Math.sin(angle)]);
  if (i === 10) ring.push([ring.at(-1)[0] + 0.000004, ring.at(-1)[1] + 0.000003]);
}
ring.push(ring[0]);
window.neighbourRing = ring;

const map = new ml.Map({
  container: 'map',
  style: { version: 8, sources: {}, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#eef2f0' } }] },
  center: [0, 0],
  zoom: 16.2,
  fadeDuration: 0,
});
window.map = map;
await new Promise((resolve) => map.once('load', resolve));

const gm = new G.Geoman(map, {});
window.gm = gm;
window.created = [];
map.on('gm:loaded', async () => {
  map.on('gm:create', (e) => window.created.push(e.feature.getGeoJson()));
  await gm.features.importGeoJson({ type: 'FeatureCollection', features: [
    { type: 'Feature', id: 'neighbour', properties: { disableEdit: true }, geometry: { type: 'Polygon', coordinates: [ring] } },
  ] });
  await gm.enableMode('helper', 'snapping');
  await gm.enableMode('helper', 'auto_trace');
  await gm.enableMode('draw', 'polygon');
  window.__ready = true;
});
