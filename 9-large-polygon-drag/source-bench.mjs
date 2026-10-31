// Times MapLibre's updateData (polygon plus three point features) until the map is idle, in a test source that
// holds the ring alone, or the ring plus one point per vertex and per midpoint (what Geoman's temporary source holds
// while a vertex is dragged). Five updates per configuration.
import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const server = await createServer({ root: process.cwd(), logLevel: 'error' });
await server.listen();
const executablePath = process.env.CHROME_PATH;
const browser = await chromium.launch(executablePath ? { executablePath, headless: true } : { channel: 'chrome', headless: true });
for (const n of [100, 19000]) {
  for (const zoom of ['', '16']) {
    for (const withPoints of [false, true]) {
      const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
      await page.goto(`${server.resolvedUrls.local[0]}?n=${n}${zoom ? `&zoom=${zoom}` : ''}`);
      await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
      const times = await page.evaluate(async (withPoints) => {
        const ring = gm.features.exportGeoJson().features[0].geometry.coordinates[0];
        const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        const points = [];
        if (withPoints) {
          for (let i = 0; i < ring.length - 1; i += 1) {
            points.push({ type: 'Feature', id: `v${i}`, properties: {}, geometry: { type: 'Point', coordinates: ring[i] } });
            points.push({ type: 'Feature', id: `e${i}`, properties: {}, geometry: { type: 'Point', coordinates: mid(ring[i], ring[i + 1]) } });
          }
        }
        map.addSource('bench', { type: 'geojson', data: { type: 'FeatureCollection', features: [{ type: 'Feature', id: 'p', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } }, ...points] } });
        map.addLayer({ id: 'bench-line', type: 'line', source: 'bench' });
        map.addLayer({ id: 'bench-circle', type: 'circle', source: 'bench', paint: { 'circle-radius': 5 } });
        await new Promise((ok) => map.once('idle', ok));
        const source = map.getSource('bench');
        const result = [];
        const last = ring.length - 2;
        for (let k = 1; k <= 5; k += 1) {
          const moved = ring.map((c) => [...c]);
          const p0 = [ring[0][0] - 0.0001 * k, ring[0][1]];
          moved[0] = p0;
          moved[moved.length - 1] = p0;
          const update = [{ id: 'p', newGeometry: { type: 'Polygon', coordinates: [moved] } }];
          if (withPoints) {
            update.push({ id: 'v0', newGeometry: { type: 'Point', coordinates: p0 } });
            update.push({ id: 'e0', newGeometry: { type: 'Point', coordinates: mid(p0, ring[1]) } });
            update.push({ id: `e${last}`, newGeometry: { type: 'Point', coordinates: mid(ring[last], p0) } });
          }
          const t0 = performance.now();
          await source.updateData({ update }, true);
          await new Promise((ok) => map.once('idle', ok));
          result.push(Math.round(performance.now() - t0));
        }
        return result;
      }, withPoints);
      const content = withPoints ? `ring + ${2 * n} points` : 'ring alone';
      console.log(`${String(n).padStart(6)} vertices, ${(zoom ? `zoom ${zoom}` : 'whole ring').padEnd(10)}, ${content.padEnd(20)} -> updateData until idle: ${times.join(', ')} ms`);
      await page.close();
    }
  }
}
await browser.close();
await server.close();
