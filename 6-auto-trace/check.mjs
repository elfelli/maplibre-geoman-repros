import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const server = await createServer({ root: process.cwd(), logLevel: 'error' });
await server.listen();
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH, headless: true } : { channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
page.on('console', (m) => { if (m.type() !== 'debug') console.log('console', m.type(), m.text().slice(0, 160)); });
await page.goto(server.resolvedUrls.local[0]);
await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
await page.waitForTimeout(800);

const ring = await page.evaluate(() => window.neighbourRing);
const px = (i) => page.evaluate((c) => { const p = window.map.project(c); return [p.x, p.y]; }, ring[i]);
const click = async (i) => { const [x, y] = await px(i); await page.mouse.move(x, y); await page.waitForTimeout(200); await page.mouse.click(x, y); await page.waitForTimeout(300); };

const order = [5, 16, 27, 5];
for (const i of order) await click(i);
await page.waitForTimeout(800);

const created = await page.evaluate(() => window.created);
const key = (c) => c.join(',');
const ringKeys = new Map(ring.slice(0, -1).map((c, i) => [key(c), i]));
console.log('neighbour ring:', ring.length - 1, 'distinct vertices; close pair at indexes 10 and 11 (~0.5 m apart)');
console.log('clicks on vertices', order.join(' -> '), '(then close)');
console.log('expected: every ring vertex once, i.e.', ring.length - 1, 'vertices');
for (const f of created) {
  const coords = f.geometry.type === 'Polygon' ? f.geometry.coordinates[0] : f.geometry.coordinates.flat(1)[0] ? f.geometry.coordinates[0][0] : [];
  const verts = coords.slice(0, -1);
  const idx = verts.map((c) => (ringKeys.has(key(c)) ? ringKeys.get(key(c)) : 'x'));
  const missing = [...ringKeys.values()].filter((i) => !idx.includes(i));
  console.log('created', f.geometry.type, verts.length, 'vertices; ring indexes:', idx.join(' '));
  console.log('missing ring vertices:', missing.join(' ') || 'none');
}
if (!created.length) console.log('no feature created');
await browser.close();
await server.close();
