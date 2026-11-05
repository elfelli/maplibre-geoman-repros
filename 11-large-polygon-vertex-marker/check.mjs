// Drags the top-right corner of a rectangle 40 px up, for a ring of 103 and of 603 positions.
// After the release it reports where the vertex is in the data and where its vertex marker is drawn.
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const version = JSON.parse(readFileSync('node_modules/@geoman-io/maplibre-geoman-free/package.json', 'utf8')).version;
const executablePath = process.env.CHROME_PATH;
const server = await createServer({ root: process.cwd(), logLevel: 'error' });
await server.listen();
const browser = await chromium.launch(executablePath ? { executablePath, headless: true } : { channel: 'chrome', headless: true });

const screenPoint = (page, lngLat) =>
  page.evaluate((c) => {
    const p = map.project(c);
    const r = map.getCanvas().getBoundingClientRect();
    return [p.x + r.left, p.y + r.top];
  }, lngLat);
// Distance in pixels from a screen point to the nearest vertex marker Geoman draws.
const nearestVertexMarker = (page, [x, y]) =>
  page.evaluate(async ([px, py]) => {
    const r = map.getCanvas().getBoundingClientRect();
    const name = Object.keys(map.getStyle().sources).find((s) => s.includes('internal'));
    const markers = (await map.getSource(name).getData()).features.filter((f) => f.properties?.__gm_shape === 'vertex_marker');
    return Math.round(Math.min(...markers.map((f) => {
      const p = map.project(f.geometry.coordinates);
      return Math.hypot(p.x + r.left - px, p.y + r.top - py);
    })));
  }, [x, y]);

async function scenario(n) {
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  page.on('pageerror', (e) => console.log('pageerror:', e.message.slice(0, 200)));
  await page.goto(`${server.resolvedUrls.local[0]}?n=${n}`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
  await page.waitForTimeout(300);

  const corner = n; // top-right corner
  const start = await screenPoint(page, await page.evaluate((i) => ring[i], corner));
  await page.mouse.move(start[0], start[1]);
  await page.waitForTimeout(200);
  await page.mouse.down();
  await page.mouse.move(start[0], start[1] - 40, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(1000);

  const after = await page.evaluate(() => gm.features.exportGeoJson().features[0].geometry.coordinates[0]);
  const changed = await page.evaluate((a) => a.filter((c, i) => c[0] !== ring[i][0] || c[1] !== ring[i][1]).length, after);
  const end = await screenPoint(page, after[corner]);
  console.log(`${after.length} positions`);
  console.log(`   positions changed: ${changed}; vertex moved by ${Math.round(Math.hypot(end[0] - start[0], end[1] - start[1]))} px`);
  console.log(`   nearest vertex marker to the moved vertex: ${await nearestVertexMarker(page, end)} px`);
  console.log(`   nearest vertex marker to the drag start: ${await nearestVertexMarker(page, start)} px`);
  await page.close();
}

console.log(`maplibre-geoman-free ${version}, maplibre-gl 6.14.0, Chrome headless:`);
await scenario(100);
await scenario(600);
await browser.close();
await server.close();
