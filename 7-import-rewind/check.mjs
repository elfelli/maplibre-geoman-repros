import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const executablePath = process.env.CHROME_PATH;
const server = await createServer({ root: process.cwd(), logLevel: 'error' });
await server.listen();
const browser = await chromium.launch(executablePath ? { executablePath, headless: true } : { channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
page.on('pageerror', (e) => console.log('pageerror:', e.message.slice(0, 200)));
await page.goto(server.resolvedUrls.local[0]);
await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });

const outputs = await page.evaluate(() => window.__outputs);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const reversed = (coords) => (typeof coords[0][0] === 'number' ? [...coords].reverse() : coords.map((ring) => [...ring].reverse()));
for (const [key, coordinates] of Object.entries(outputs)) {
  const [step, name] = key.split(' ');
  let verdict = '';
  if (step !== 'input') {
    const input = outputs[`input ${name}`];
    verdict = same(coordinates, input) ? 'order kept' : same(coordinates, reversed(input)) ? 'reversed' : 'changed';
  }
  console.log(`${step.padEnd(20)} ${name.padEnd(10)} ${JSON.stringify(coordinates)} ${verdict}`);
}
await browser.close();
await server.close();
