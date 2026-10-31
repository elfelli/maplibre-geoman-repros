import * as ml from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as G from '@geoman-io/maplibre-geoman-pro';
import '@geoman-io/maplibre-geoman-pro/dist/maplibre-geoman.css';

const logEl = document.getElementById('log');
const log = (...a) => { logEl.textContent += a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ') + '\n'; };
const map = new ml.Map({
  container: 'map',
  style: { version: 8, sources: {}, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#eef2f0' } }] },
  center: [0, 0],
  zoom: 12,
  fadeDuration: 0,
});

const square = (d) => [[-d, -d], [d, -d], [d, d], [-d, d], [-d, -d]];
const hole = square(0.005).reverse();
const withoutHole = { type: 'Polygon', coordinates: [square(0.02)] };
const withHole = { type: 'Polygon', coordinates: [square(0.02), hole] };

log('validateFeatureGeometry, no hole:', G.validateFeatureGeometry(withoutHole));
log('validateFeatureGeometry, one hole:', G.validateFeatureGeometry(withHole));
log('repairFeatureGeometry, one hole:', G.repairFeatureGeometry(withHole));

const gm = new G.Geoman(map, { settings: { validateGeometry: true } });

map.on('gm:loaded', async () => {
  const imported = await gm.features.importGeoJson({
    type: 'FeatureCollection',
    features: [{ type: 'Feature', properties: {}, geometry: withHole }],
  });
  log('importGeoJson, one hole:', imported.stats);

  const plain = await gm.features.importGeoJson({
    type: 'FeatureCollection',
    features: [{ type: 'Feature', properties: {}, geometry: withoutHole }],
  });
  log('importGeoJson, no hole:', plain.stats);
  const id = plain.addedFeatures[0].id;
  try {
    const result = await gm.edit.addHole(id, hole);
    log('edit.addHole resolved:', { ok: result.ok, reason: result.reason });
  } catch (error) {
    log('edit.addHole rejected:', error.message);
  }
  window.__ready = true;
});
