// Drags a vertex and releases the mouse button over the map, over an application toolbar laid
// over the map, and over a button of Geoman's own controls. After each release it reports whether
// the map can still be panned, which source holds the polygon, and whether the vertex keeps
// following the pointer with no button held.
import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const executablePath = process.env.CHROME_PATH;
const server = await createServer({ root: process.cwd(), logLevel: 'error' });
await server.listen();
const browser = await chromium.launch(executablePath ? { executablePath, headless: true } : { channel: 'chrome', headless: true });

// The polygon in whichever Geoman source holds it.
const locate = (page) =>
  page.evaluate(() => {
    for (const source of Object.keys(gm.features.sources ?? {})) {
      const feature = gm.features.get(source, 'octagon');
      if (feature) return { source, ring: feature.getGeoJson().geometry.coordinates[0] };
    }
    return { source: 'none', ring: null };
  });
const screenPoint = (page, lngLat) =>
  page.evaluate((c) => {
    const p = map.project(c);
    const r = map.getCanvas().getBoundingClientRect();
    return [p.x + r.left, p.y + r.top];
  }, lngLat);
const describe = (page, [x, y]) =>
  page.evaluate(([ex, ey]) => {
    const e = document.elementFromPoint(ex, ey);
    if (!e) return 'nothing';
    const cls = typeof e.className === 'string' && e.className ? `.${e.className.split(' ')[0]}` : '';
    return `${e.tagName.toLowerCase()}${e.id ? `#${e.id}` : ''}${cls}`;
  }, [x, y]);

async function scenario(name, releasePoint) {
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  page.on('pageerror', (e) => console.log('pageerror:', e.message.slice(0, 200)));
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
  await page.waitForTimeout(300);

  // Vertex 1 (north-east).
  const [x, y] = await screenPoint(page, (await locate(page)).ring[1]);
  const end = await releasePoint(page, x, y);
  const target = await describe(page, end);
  await page.mouse.move(x, y);
  await page.waitForTimeout(200);
  await page.mouse.down();
  for (let k = 1; k <= 12; k += 1) {
    await page.mouse.move(x + ((end[0] - x) * k) / 12, y + ((end[1] - y) * k) / 12);
    await page.waitForTimeout(16);
  }
  await page.mouse.up();
  await page.waitForTimeout(400);

  const dragPan = await page.evaluate(() => map.dragPan.isEnabled());
  const exported = await page.evaluate(() => gm.features.exportGeoJson().features.length);
  const afterRelease = await locate(page);
  // Button released: move the pointer over the map, away from any vertex.
  const [cx, cy] = await screenPoint(page, [0, -0.004]);
  await page.mouse.move(cx, cy, { steps: 8 });
  await page.waitForTimeout(400);
  const afterHover = await locate(page);
  const moved = afterHover.ring.some((c, i) => c[0] !== afterRelease.ring[i][0] || c[1] !== afterRelease.ring[i][1]);

  console.log(`${name}`);
  console.log(`   mouseup on: ${target}`);
  console.log(`   map.dragPan enabled: ${dragPan}; polygon in source: ${afterRelease.source}; exportGeoJson() features: ${exported}`);
  console.log(`   vertex follows the pointer with no button held: ${moved}`);
  await page.close();
}

console.log('maplibre-geoman-free 0.10.4, maplibre-gl 6.14.0, Chrome headless:');
await scenario('1. release over the map', async (page, x, y) => [x + 60, y - 60]);
await scenario('2. release over an app toolbar laid over the map', async (page) => {
  const b = await page.locator('#toolbar').boundingBox();
  return [b.x + b.width / 2, b.y + b.height / 2];
});
await scenario("3. release over a button of Geoman's own controls", async (page) => {
  const b = await page.locator('.maplibregl-control-container button, .maplibregl-control-container [class*="gm-control"]').first().boundingBox();
  return [b.x + b.width / 2, b.y + b.height / 2];
});
await browser.close();
await server.close();
