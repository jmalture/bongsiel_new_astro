// Quick look: node tools/shot.mjs <url> <out-prefix> [width] — scrolls through, then viewport shots every screen.
import { chromium } from 'playwright';
const [url, out = 'review/shot', w = '1440'] = process.argv.slice(2);
const W = Number(w), H = W < 800 ? 844 : 900;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: W, height: H }, isMobile: W < 800 });
const errs = [];
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
p.on('pageerror', (e) => errs.push(String(e)));
await p.goto(url, { waitUntil: 'networkidle' });
await p.waitForTimeout(1200);
const total = await p.evaluate(() => document.documentElement.scrollHeight);
let i = 0;
for (let y = 0; y < total && i < 40; y += H * 0.9, i++) {
  await p.evaluate((y) => scrollTo(0, y), y);
  await p.waitForTimeout(900);
  await p.screenshot({ path: `${out}-${W}-${String(i).padStart(2, '0')}.png` });
}
console.log('shots', i, 'height', total, 'sw', await p.evaluate(() => document.documentElement.scrollWidth), 'errors', errs.slice(0, 5));
await b.close();
