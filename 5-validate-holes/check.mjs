import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const executablePath = process.env.CHROME_PATH;
const server = await createServer({ root: process.cwd(), logLevel: 'error' });
await server.listen();
const browser = await chromium.launch(executablePath ? { executablePath, headless: true } : { channel: 'chrome', headless: true });
const page = await browser.newPage();
page.on('console', (message) => console.log('console', message.type(), message.text()));
await page.goto(server.resolvedUrls.local[0]);
await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
console.log(await page.evaluate(() => document.getElementById('log').textContent));
await browser.close();
await server.close();
