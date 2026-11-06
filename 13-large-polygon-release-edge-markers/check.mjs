// Drags the top-right corner of a rectangle 40 px up and counts the marker features Geoman sends to MapLibre
// (internal source `updateData`) when the button is released, with and without panning the map beforehand.
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

async function scenario(n, pan) {
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  page.on('pageerror', (e) => console.log('pageerror:', e.message.slice(0, 200)));
  await page.goto(`${server.resolvedUrls.local[0]}?n=${n}`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
  if (pan) await page.evaluate(() => new Promise((ok) => { map.once('idle', ok); map.panBy([50, 0], { animate: false }); }));
  await page.waitForTimeout(300);

  // Record what reaches the marker source from now on.
  await page.evaluate(() => {
    const name = Object.keys(map.getStyle().sources).find((s) => s.includes('internal'));
    const source = map.getSource(name);
    const updateData = source.updateData.bind(source);
    window.__sent = [];
    source.updateData = (diff, ...rest) => {
      window.__sent.push({ phase: window.__phase, add: diff?.add?.length ?? 0, update: diff?.update?.length ?? 0, remove: diff?.remove?.length ?? 0, bytes: JSON.stringify(diff).length });
      return updateData(diff, ...rest);
    };
  });

  const corner = n; // top-right corner
  const start = await screenPoint(page, await page.evaluate((i) => ring[i], corner));
  await page.mouse.move(start[0], start[1]);
  await page.waitForTimeout(200);
  await page.evaluate(() => { window.__phase = 'drag'; });
  await page.mouse.down();
  await page.mouse.move(start[0], start[1] - 40, { steps: 10 });
  await page.evaluate(() => { window.__phase = 'release'; });
  const t0 = Date.now();
  await page.mouse.up();
  await page.evaluate(() => new Promise((ok) => { map.once('idle', ok); setTimeout(ok, 5000); }));
  const releaseMs = Date.now() - t0;
  await page.waitForTimeout(500);

  const after = await page.evaluate(() => gm.features.exportGeoJson().features[0].geometry.coordinates[0]);
  const changed = await page.evaluate((a) => a.filter((c, i) => c[0] !== ring[i][0] || c[1] !== ring[i][1]).length, after);
  const sent = await page.evaluate(() => window.__sent);
  const sum = (phase) => sent.filter((s) => s.phase === phase).reduce((t, s) => ({ updated: t.updated + s.update, kb: t.kb + s.bytes / 1000 }), { updated: 0, kb: 0 });
  const drag = sum('drag');
  const release = sum('release');
  console.log(`${after.length} positions, ${pan ? 'map panned 50 px before the drag' : 'map not moved'}`);
  console.log(`   positions changed: ${changed}`);
  console.log(`   marker features updated during the drag: ${drag.updated}; at release: ${release.updated} (${Math.round(release.kb)} kB); release to idle: ${releaseMs} ms`);
  await page.close();
}

console.log(`maplibre-geoman-free ${version}, maplibre-gl 6.14.0, Chrome headless:`);
for (const n of [600, 20000]) {
  await scenario(n, false);
  await scenario(n, true);
}
await browser.close();
await server.close();
