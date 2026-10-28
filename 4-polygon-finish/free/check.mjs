import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const executablePath = process.env.CHROME_PATH;
const server = await createServer({ root: process.cwd(), logLevel: 'error' });
await server.listen();
const browser = await chromium.launch(executablePath ? { executablePath, headless: true } : { channel: 'chrome', headless: true });
const open = async () => {
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  page.on('pageerror', (e) => console.log('pageerror:', e.message.slice(0, 200)));
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
  await page.evaluate(() => { window.events = []; });
  return page;
};
const click = async (page, x, y) => { await page.mouse.click(x, y); await page.waitForTimeout(200); };

const cases = {
  'A bow-tie': [[300, 300], [500, 500], [500, 300], [300, 500], [300, 300]],
  'B square': [[300, 300], [500, 300], [500, 500], [300, 500], [300, 300]],
  'C collinear': [[300, 300], [400, 300], [500, 300], [300, 300]],
  'D two points': [[300, 300], [500, 300], [300, 300]],
};
for (const [name, points] of Object.entries(cases)) {
  const page = await open();
  for (const [x, y] of points) await click(page, x, y);
  const result = await page.evaluate(() => ({
    features: gm.features.exportGeoJson().features.map((f) => ({ type: f.geometry.type, parts: f.geometry.coordinates.length, coordinates: f.geometry.coordinates })),
    events: [...new Set(window.events)],
  }));
  const publicEvents = result.events.filter((n) => n.startsWith('gm:'));
  const internalEvents = result.events.filter((n) => n.startsWith('_gm:'));
  console.log(name);
  console.log('   features:', result.features.length ? JSON.stringify(result.features.map(({ type, parts }) => ({ type, parts }))) : 'none');
  console.log('   public gm:* events:', publicEvents.length ? publicEvents.join(', ') : 'none');
  console.log('   internal _gm:* events:', internalEvents.join(', ') || 'none');
  if (name === 'C collinear') console.log('   ring:', JSON.stringify(result.features[0].coordinates));
  await page.close();
}
await browser.close();
await server.close();
