import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const executablePath = process.env.CHROME_PATH;
const server = await createServer({ root: process.cwd(), logLevel: 'error' });
await server.listen();
const browser = await chromium.launch(executablePath ? { executablePath, headless: true } : { channel: 'chrome', headless: true });
const open = async (url = server.resolvedUrls.local[0]) => {
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  page.on('pageerror', (e) => console.log('pageerror:', e.message.slice(0, 200)));
  await page.goto(url);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
  return page;
};
const click = async (page, x, y, options = {}) => { await page.mouse.click(x, y, options); await page.waitForTimeout(200); };

const page = await open();
await page.waitForTimeout(500);
const before = await page.evaluate(() => ({ size: gm.features.exportGeoJson().features.length, count: window.__events.length }));
const [x, y] = await page.evaluate(() => { const p = map.project([0, 0.001]); return [p.x, p.y]; });
await page.mouse.move(x, y);
await page.waitForTimeout(200);
await click(page, x, y, { button: 'right' });
await page.waitForTimeout(500);
const after = await page.evaluate((from) => ({
  size: gm.features.exportGeoJson().features.length,
  events: window.__events.slice(from),
}), before.count);

console.log(`store size before right-click: ${before.size}`);
console.log('events after right-click:');
after.events.forEach((e) => console.log(`  ${e.kind.padEnd(8)} ${e.name} ${e.action} (store size: ${e.size})`));
console.log(`store size after right-click: ${after.size}`);
for (const name of ['gm:create', 'gm:remove', 'gm:edit', 'gm:editend']) {
  const fired = after.events.filter((e) => e.kind === 'public' && e.name === name);
  console.log(`${name}: ${fired.length ? `fired, store size ${fired.map((e) => e.size).join(', ')}` : 'not fired'}`);
}
await browser.close();
await server.close();
