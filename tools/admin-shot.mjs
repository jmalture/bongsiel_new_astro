// Screens of the service admin via the EmDash dev bypass (dev server only).
import { chromium } from 'playwright';
const base = process.argv[2] || 'http://127.0.0.1:4460';
const out = process.argv[3] || 'review/admin';
const b = await chromium.launch();
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e)));
  p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await p.goto(`${base}/_emdash/api/setup/dev-bypass?redirect=/admin/`, { waitUntil: 'networkidle' });
  for (const r of ['/admin/?datum=2026-11-27', '/admin/anmeldungen/', '/admin/anfragen/', '/admin/deichpost/']) {
    await p.goto(base + r, { waitUntil: 'networkidle' });
    await p.screenshot({ path: `${out}-${w}-${r.replace(/\W+/g, '_')}.png`, fullPage: true });
  }
  if (w === 1440) {
    await p.goto(base + '/_emdash/admin/content/veranstaltungen', { waitUntil: 'networkidle' });
    await p.waitForTimeout(2500);
    await p.screenshot({ path: `${out}-emdash-list.png` });
    console.log('emdash url', p.url());
  }
  console.log(w, 'errors', errs.slice(0, 5));
  await ctx.close();
}
await b.close();
