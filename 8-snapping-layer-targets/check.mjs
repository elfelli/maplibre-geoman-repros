import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const executablePath = process.env.CHROME_PATH;
const server = await createServer({ root: process.cwd(), logLevel: 'error' });
await server.listen();
const baseUrl = server.resolvedUrls.local[0];
const browser = await chromium.launch(executablePath ? { executablePath, headless: true } : { channel: 'chrome', headless: true });

const runs = [];
for (const acquire of ['rendered', 'source']) for (const z of [13, 15, 17]) runs.push({ target: 'layer', acquire, z });
for (const target of ['feature', 'custom']) for (const z of [13, 15, 17]) runs.push({ target, z });

const format = (metres) => `${metres.toFixed(4)} m`;
for (const { target, acquire, z } of runs) {
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  await page.goto(`${baseUrl}?target=${target}&acquire=${acquire ?? ''}&z=${z}`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
  await page.waitForTimeout(800);
  const indexes = { 13: [0, 10, 20], 15: [0, 3, 6], 17: [0, 1, 2] }[z];
  const points = await page.evaluate((vertexIndexes) => vertexIndexes.map((i) => {
    const p = window.map.project(window.neighbourRing[i]);
    return [p.x + 5, p.y - 4];
  }), indexes);
  for (const [x, y] of [...points, points[0]]) {
    await page.mouse.move(x, y);
    await page.waitForTimeout(150);
    await page.mouse.click(x, y);
    await page.waitForTimeout(150);
  }
  await page.waitForTimeout(500);
  const report = await page.evaluate(() => window.snapReport());
  const distances = report.map((vertex) => vertex.metresToNearestNeighbourVertex);
  const label = target === 'layer' ? `layer target, acquire ${acquire}` : target === 'feature' ? 'Geoman feature (disableEdit)' : 'setCustomSnappingCoordinates';
  console.log(`${label.padEnd(32)} z${z}: ${report.filter((vertex) => vertex.exactCopy).length}/${report.length} exact copies, distance to nearest neighbour vertex min ${format(Math.min(...distances))}, max ${format(Math.max(...distances))}`);
  if (target === 'layer' && acquire === 'rendered') {
    console.log(`${''.padEnd(32)}      map.querySourceFeatures('neighbour'): ${JSON.stringify(await page.evaluate(() => window.sourceFeaturesReport()))}`);
  }
  await page.close();
}
await browser.close();
await server.close();
