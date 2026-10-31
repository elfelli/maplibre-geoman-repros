// Drags one vertex of rings of 100, 5,000 and 19,000 vertices and measures how long the
// rendered map keeps changing after the pointer has stopped (button still held).
import { createHash } from 'node:crypto';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const SIZES = [100, 5000, 19000];
const VIEWS = [null, 14, 16, 18];
const RUNS = 2;

const executablePath = process.env.CHROME_PATH;
const server = await createServer({ root: process.cwd(), logLevel: 'error' });
await server.listen();
const browser = await chromium.launch(executablePath ? { executablePath, headless: true } : { channel: 'chrome', headless: true });

async function measure(n, zoom) {
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  page.on('pageerror', (e) => console.log('pageerror:', e.message.slice(0, 200)));
  await page.goto(`${server.resolvedUrls.local[0]}?n=${n}${zoom ? `&zoom=${zoom}` : ''}`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
  await page.waitForTimeout(500);

  const before = await page.evaluate(() => gm.features.exportGeoJson().features[0].geometry.coordinates[0]);
  const [x, y] = await page.evaluate((c) => {
    const p = map.project(c);
    const r = map.getCanvas().getBoundingClientRect();
    return [p.x + r.left, p.y + r.top];
  }, before[0]);

  await page.mouse.move(x, y);
  await page.waitForTimeout(300);
  await page.mouse.down();
  const moveStart = Date.now();
  for (let k = 1; k <= 10; k += 1) {
    await page.mouse.move(x - 8 * k, y - 6 * k);
    await page.waitForTimeout(16);
  }
  const pointerMs = Date.now() - moveStart;

  // Button still held: sample the area around the dragged vertex until it stops changing.
  const clip = { x: Math.max(0, x - 250), y: Math.max(0, y - 200), width: 400, height: 320 };
  const frames = [];
  const stopped = Date.now();
  while (Date.now() - stopped < 4000) {
    const image = await page.screenshot({ clip });
    frames.push({ ms: Date.now() - stopped, hash: createHash('md5').update(image).digest('hex') });
  }
  const last = frames.at(-1).hash;
  const settled = frames.find((f, i) => frames.slice(i).every((g) => g.hash === last));
  await page.mouse.up();
  await page.waitForTimeout(800);

  const after = await page.evaluate(() => gm.features.exportGeoJson().features[0].geometry.coordinates[0]);
  const same = (a, b) => a[0] === b[0] && a[1] === b[1];
  // The closing position duplicates vertex 0: compare the open rings.
  let changed = 0;
  if (after.length === before.length) after.slice(0, -1).forEach((c, i) => { if (!same(c, before[i])) changed += 1; });
  await page.close();
  return {
    pointerMs,
    settledMs: settled.ms,
    edit: after.length === before.length ? `${changed} vertex moved${same(after[0], before[0]) ? '' : ' (vertex 0)'}` : `${after.length - before.length} vertex inserted`,
  };
}

console.log('Time for the rendered map to catch up once the pointer stops (button held), free 0.10.4, Chrome headless:');
for (const n of SIZES) {
  for (const zoom of VIEWS) {
    const runs = [];
    for (let r = 0; r < RUNS; r += 1) runs.push(await measure(n, zoom));
    const view = zoom ? `zoom ${zoom}` : 'whole ring';
    console.log(`${String(n).padStart(6)} vertices, ${view.padEnd(10)} -> catch-up ${runs.map((m) => `${m.settledMs} ms`).join(', ').padEnd(16)} pointer moves ${runs.map((m) => m.pointerMs).join(', ')} ms; ${[...new Set(runs.map((m) => m.edit))].join(' / ')}`);
  }
}
await browser.close();
await server.close();
