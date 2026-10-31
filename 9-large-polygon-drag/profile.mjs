import { chromium } from 'playwright-core';
import { createServer } from 'vite';
// CPU profile of the main thread while dragging one vertex (10 awaited moves, zoom 16).
const n = Number(process.argv[2] || 19000);
const server = await createServer({ root: process.cwd(), logLevel: 'error' });
await server.listen();
const browser = await chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' }), headless: true });
const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
await page.goto(`${server.resolvedUrls.local[0]}?n=${n}&zoom=16`);
await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
await page.waitForTimeout(500);
const [x, y] = await page.evaluate(() => { const c = gm.features.exportGeoJson().features[0].geometry.coordinates[0][0]; const p = map.project(c); const r = map.getCanvas().getBoundingClientRect(); return [p.x + r.left, p.y + r.top]; });
await page.mouse.move(x, y); await page.waitForTimeout(300); await page.mouse.down(); await page.mouse.move(x - 2, y - 2); await page.waitForTimeout(500);
const cdp = await page.context().newCDPSession(page);
await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 }); await cdp.send('Profiler.start');
const t0 = Date.now();
for (let k = 1; k <= 10; k += 1) { await page.mouse.move(x - 8 * k, y - 6 * k); await page.waitForTimeout(16); }
const ms = Date.now() - t0;
const { profile } = await cdp.send('Profiler.stop');
await page.mouse.up();
const nodes = new Map(profile.nodes.map((nd) => [nd.id, nd]));
const dt = {}; profile.samples.forEach((id, i) => { dt[id] = (dt[id] || 0) + (profile.timeDeltas[i] || 0); });
const parent = new Map(); profile.nodes.forEach((nd) => (nd.children || []).forEach((c) => parent.set(c, nd.id)));
const name = (nd) => { const f = nd.callFrame; return `${f.functionName || '(anon)'} ${f.url.split('/').pop().split('?')[0]}:${f.lineNumber + 1}`; };
const self = {}, incl = {};
for (const [id, us] of Object.entries(dt)) {
  const nd = nodes.get(Number(id)); self[name(nd)] = (self[name(nd)] || 0) + us;
  const seen = new Set(); let cur = Number(id);
  while (cur) { const k = name(nodes.get(cur)); if (!seen.has(k)) { incl[k] = (incl[k] || 0) + us; seen.add(k); } cur = parent.get(cur); }
}
const top = (o, k) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, k).map(([f, us]) => `${String(Math.round(us / 1000)).padStart(6)} ms  ${f}`).join('\n');
console.log(`n=${n}, 10 moves in ${ms} ms\n-- self time --\n${top(self, 18)}\n-- inclusive --\n${top(incl, 30)}`);
await browser.close(); await server.close();
