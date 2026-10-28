import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const executablePath = process.env.CHROME_PATH;
const server = await createServer({ root: process.cwd(), logLevel: 'error' });
await server.listen();
const browser = await chromium.launch(executablePath ? { executablePath, headless: true } : { channel: 'chrome', headless: true });
const open = async (query = '') => {
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  page.on('pageerror', (e) => console.log('pageerror:', e.message.slice(0, 200)));
  await page.goto(server.resolvedUrls.local[0] + query);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
  await page.evaluate(() => { window.events = []; });
  return page;
};
const click = async (page, x, y) => { await page.mouse.click(x, y); await page.waitForTimeout(250); };
const enter = async (page) => { await page.keyboard.press('Enter'); await page.waitForTimeout(250); };

// The drawing state is read from internal fields, for diagnosis only.
const report = async (page, name) => {
  const r = await page.evaluate(() => {
    const drawer = gm.actionInstances.draw__polygon?.lineDrawer;
    return {
      features: gm.features.exportGeoJson().features
        .filter((f) => f.id !== window.keepOutId)
        .map((f) => `${f.geometry.type}(${f.geometry.coordinates.length})`),
      events: [...new Set(window.events)].filter((n) => n.startsWith('gm:')),
      open: !!drawer?.featureData,
      vertices: drawer?.shapeLngLats?.length ?? 0,
    };
  });
  console.log(name);
  console.log('   created:', r.features.join(', ') || 'none');
  console.log('   public gm:* events:', r.events.join(', ') || 'none');
  console.log('   drawing still open:', r.open, r.open ? `(${r.vertices} vertices)` : '');
};

const cases = {
  'A bow-tie': [[300, 300], [500, 500], [500, 300], [300, 500]],
  'B square': [[300, 300], [500, 300], [500, 500], [300, 500]],
  'C collinear': [[300, 300], [400, 300], [500, 300]],
  'D two points': [[300, 300], [500, 300]],
};
console.log('--- validateGeometry: true');
for (const [name, points] of Object.entries(cases)) {
  for (const finish of ['first vertex', 'Enter']) {
    const page = await open();
    for (const [x, y] of points) await click(page, x, y);
    if (finish === 'Enter') await enter(page);
    else await click(page, ...points[0]);
    await report(page, `${name}, closed with ${finish}`);
    await page.close();
  }
}

console.log('--- geofencing: intersection restriction on a keep-out square at the map center');
const triangle = [[200, 600], [800, 600], [500, 150]];
const variants = {
  'E0 second vertex whose segment crosses the keep-out square': async (page) => { await click(page, 200, 600); await click(page, 800, 200); },
  'E1 triangle around the square, closed on the first vertex': async (page) => { for (const p of triangle) await click(page, ...p); await click(page, ...triangle[0]); },
  'E2 triangle around the square, closed on the last vertex': async (page) => { for (const p of triangle) await click(page, ...p); await click(page, ...triangle[2]); },
  'E3 triangle around the square, closed with Enter': async (page) => { for (const p of triangle) await click(page, ...p); await enter(page); },
};
for (const [name, run] of Object.entries(variants)) {
  const page = await open('?geofencing');
  await run(page);
  await report(page, name);
  await page.close();
}
await browser.close();
await server.close();
