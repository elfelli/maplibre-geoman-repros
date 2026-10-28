// Compares the published mergeGeoJsonDiff with the two fix variants from the issue on random diff sequences.
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
const server = await createServer({ root: process.cwd(), logLevel: 'error' });
await server.listen();
const executablePath = process.env.CHROME_PATH;
const browser = await chromium.launch(executablePath ? { executablePath, headless: true } : { channel: 'chrome', headless: true });
const page = await browser.newPage();
await page.goto(server.resolvedUrls.local[0]);
await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
console.log(await page.evaluate(() => {
  const um = gm.features.updateManager;
  const C = um.constructor;
  const tail = (prev, next) => {
    C.resolveMergeConflicts(prev, next);
    if (prev.removeAll || next.removeAll) prev.removeAll = true;
    if (next.remove && !prev.remove) prev.remove = new Set();
    next.remove?.forEach((v) => prev.remove?.add(v));
    if (next.update && !prev.update) prev.update = new Map();
    next.update?.forEach((v, k) => prev.update?.set(k, v));
  };
  const fixA = (prev, next) => {
    tail(prev, next);
    if (next.add && !prev.add) prev.add = new Map();
    next.add?.forEach((v, k) => prev.add?.set(k, v));
    if (prev.remove?.size && next.add?.size) for (const id of next.add.keys()) prev.remove.delete(id);
  };
  const fixB = (prev, next) => {
    tail(prev, next);
    if (next.add && !prev.add) prev.add = new Map();
    next.add?.forEach((v, k) => { prev.add?.set(k, v); prev.remove?.delete(k); });
  };
  const withoutCleanup = (prev, next) => {
    tail(prev, next);
    if (next.add && !prev.add) prev.add = new Map();
    next.add?.forEach((v, k) => prev.add?.set(k, v));
  };
  const R = (n) => Math.floor(Math.random() * n);
  const ids = () => Array.from({ length: R(4) }, () => 'f' + R(8));
  const feat = (id) => ({ type: 'Feature', id, properties: { v: Math.random() }, geometry: { type: 'Point', coordinates: [0, 0] } });
  const rnd = () => { const d = {};
    if (Math.random() < .6) d.add = new Map(ids().map((i) => [i, feat(i)]));
    if (Math.random() < .5) d.remove = new Set(ids());
    if (Math.random() < .4) d.update = new Map(ids().map((i) => [i, { id: i, addOrUpdateProperties: [{ key: 'k' + R(3), value: R(9) }], removeProperties: Math.random() < .3 ? ['k' + R(3)] : undefined }]));
    if (Math.random() < .03) d.removeAll = true; return d; };
  const clone = (d) => structuredClone(d);
  const ser = (d) => JSON.stringify({ ra: !!d.removeAll, a: [...(d.add || [])].sort(), r: [...(d.remove || [])].sort(), u: [...(d.update || [])].sort() });
  let badA = 0, badB = 0, badMutant = 0, merges = 0;
  for (let s = 0; s < 5000; s++) {
    const o = {}, a = {}, b = {}, m = {};
    for (let k = 0; k < 40; k++) { const n = rnd(); um.mergeGeoJsonDiff(o, clone(n)); fixA(a, clone(n)); fixB(b, clone(n)); withoutCleanup(m, clone(n)); merges++; }
    if (ser(o) !== ser(a)) badA++; if (ser(o) !== ser(b)) badB++; if (ser(o) !== ser(m)) badMutant++;
  }
  return { sequences: 5000, merges, mismatchesFix: badA, mismatchesShortFix: badB, mismatchesWithoutCleanup: badMutant };
}));
await browser.close(); await server.close();
