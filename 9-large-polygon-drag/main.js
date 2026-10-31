import * as ml from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Geoman } from '@geoman-io/maplibre-geoman-free';
import '@geoman-io/maplibre-geoman-free/dist/maplibre-geoman.css';

ml.setWorkerUrl(workerUrl);

const params = new URLSearchParams(location.search);
const vertexCount = Number(params.get('n') ?? 19000);
const zoom = params.get('zoom');

// A wobbly ring about the size of a municipality (~6 km across), so that no
// three consecutive vertices are collinear. Vertex 0 (east) is kept 8° away from
// its neighbours, so that the midpoint markers of its two edges don't cover it.
const RADIUS = 0.03;
const GAP = (8 * Math.PI) / 180;
const ring = [];
for (let i = 0; i < vertexCount; i += 1) {
  const angle = i === 0 ? 0 : GAP + ((2 * Math.PI - 2 * GAP) * (i - 1)) / (vertexCount - 2);
  const r = RADIUS * (1 + 0.02 * Math.sin(angle * 37) + 0.01 * Math.sin(angle * 251));
  ring.push([r * Math.cos(angle), r * Math.sin(angle)]);
}
ring.push(ring[0]);

const map = new ml.Map({
  container: 'map',
  style: { version: 8, sources: {}, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#eef2f0' } }] },
  center: [0, 0],
  zoom: 12,
  fadeDuration: 0,
});
window.map = map;

const gm = new Geoman(map, {});
window.gm = gm;

map.on('gm:loaded', async () => {
  await gm.features.importGeoJson({
    type: 'FeatureCollection',
    features: [{ type: 'Feature', id: 'ring', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } }],
  });
  // The vertex at index 0 sits on the east side of the ring.
  if (zoom) map.jumpTo({ center: ring[0], zoom: Number(zoom) });
  else map.fitBounds([[-RADIUS * 1.1, -RADIUS * 1.1], [RADIUS * 1.1, RADIUS * 1.1]], { duration: 0 });
  await gm.enableMode('edit', 'change');
  map.once('idle', () => { window.__ready = true; });
});
