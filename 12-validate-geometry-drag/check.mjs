// Drags the south-west corner of a square across the opposite side, in 10 pointer moves, so the
// ring crosses itself from about the 8th move on. Reports uncaught page errors per move, the
// `gm:operation_rejected` reasons and where the corner ends up, with validateGeometry on and off.
// Then calls `edit.setGeometry` with the same crossing ring for comparison.
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const version = JSON.parse(readFileSync('node_modules/@geoman-io/maplibre-geoman-pro/package.json', 'utf8')).version;
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

async function scenario(validate) {
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  const errors = [];
  let step = 'before the drag';
  page.on('pageerror', (e) => errors.push(`${step}: ${e.message.slice(0, 90)}`));
  await page.goto(`${server.resolvedUrls.local[0]}?validate=${validate ? 1 : 0}`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
  await page.waitForTimeout(300);

  const start = await screenPoint(page, [-0.02, -0.02]);
  const target = await screenPoint(page, [0.025, 0.01]); // beyond the east side
  await page.mouse.move(start[0], start[1]);
  await page.waitForTimeout(200);
  await page.mouse.down();
  for (let k = 1; k <= 10; k += 1) {
    step = `move ${k}`;
    await page.mouse.move(start[0] + ((target[0] - start[0]) * k) / 10, start[1] + ((target[1] - start[1]) * k) / 10);
    await page.waitForTimeout(50);
  }
  step = 'release';
  await page.mouse.up();
  await page.waitForTimeout(500);

  const corner = await page.evaluate(() => gm.features.exportGeoJson().features[0].geometry.coordinates[0][0]);
  const rejections = await page.evaluate(() => window.rejections);
  const setGeometry = await page.evaluate(async () => {
    const crossing = [[0.025, 0.01], [0.02, -0.02], [0.02, 0.02], [-0.02, 0.02], [0.025, 0.01]];
    try {
      const result = await gm.edit.setGeometry('square', { type: 'Polygon', coordinates: [crossing] });
      return `returned ${JSON.stringify({ ok: result?.ok, reason: result?.reason })}`;
    } catch (e) {
      return `threw ${String(e).slice(0, 90)}`;
    }
  });
  console.log(`validateGeometry: ${validate}`);
  console.log(`   uncaught page errors: ${errors.length}${errors.length ? `\n      ${errors.join('\n      ')}` : ''}`);
  console.log(`   gm:operation_rejected: ${JSON.stringify(rejections)}`);
  console.log(`   corner after release: [${corner.map((c) => c.toFixed(4)).join(', ')}] (start [-0.0200, -0.0200], pointer released at [0.0250, 0.0100])`);
  console.log(`   edit.setGeometry with a crossing ring: ${setGeometry}`);
  await page.close();
}

console.log(`maplibre-geoman-pro ${version}, maplibre-gl 6.14.0, Chrome headless:`);
await scenario(true);
await scenario(false);
await browser.close();
await server.close();
