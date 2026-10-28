import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const executablePath = process.env.CHROME_PATH;
const server = await createServer({ root: process.cwd(), logLevel: 'error' });
await server.listen();
const browser = await chromium.launch(executablePath ? { executablePath, headless: true } : { channel: 'chrome', headless: true });

const runs = process.argv.slice(2).length ? process.argv.slice(2) : ['renderSelection=true', 'renderSelection=true&fix=1', 'renderSelection=false'];
for (const query of runs) {
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  await page.goto(`${server.resolvedUrls.local[0]}?${query}`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
  const [x, y] = await page.evaluate(() => window.__vertexScreen);
  await page.mouse.move(x, y);
  await page.waitForTimeout(300);
  await page.evaluate(() => { window.__longTasks.length = 0; });
  const start = Date.now();
  await page.mouse.down();
  await page.mouse.move(x + 5, y + 5, { steps: 3 });
  await page.mouse.move(x + 10, y + 10, { steps: 3 });
  const elapsed = Date.now() - start;
  await page.mouse.up();
  await page.waitForTimeout(500);
  console.log(`${query} -> press + drag ${elapsed} ms, long tasks`, await page.evaluate(() => window.__longTasks));
  const probe = await page.evaluate(() => window.__probe);
  if (probe) console.log('  probe', JSON.stringify(probe));
  await page.close();
}
await browser.close();
await server.close();
