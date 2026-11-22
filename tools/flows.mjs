// End-to-end flows on the built server, screenshots to review/flows/:
// reservation (error + success), event sign-up, then the service admin with the saved session.
// node tools/flows.mjs http://localhost:4461 review/session.json
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const [base = 'http://localhost:4461', session = 'review/session.json'] = process.argv.slice(2);
const out = 'review/flows';
mkdirSync(out, { recursive: true });
const b = await chromium.launch();
const log = [];

async function page(w, storage) {
  const ctx = await b.newContext({ viewport: { width: w, height: w < 800 ? 844 : 900 }, isMobile: w < 800, ...(storage ? { storageState: storage } : {}) });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => log.push(`pageerror ${w}: ${e}`));
  p.on('console', (m) => m.type() === 'error' && log.push(`console ${w}: ${m.text()}`));
  return { ctx, p };
}

for (const w of [1440, 390]) {
  const { ctx, p } = await page(w);
  // Reservation: submit without a time → error message
  await p.goto(`${base}/reservierung/?datum=2026-11-27`, { waitUntil: 'networkidle' });
  await p.locator('[data-slots] [data-t]').first().waitFor();
  await p.fill('[name=name]', 'Erika Muster');
  await p.fill('[name=telefon]', '0170 1112223');
  await p.fill('[name=email]', 'erika@example.com');
  await p.click('[data-submit]');
  await p.locator('[data-msg]:not([hidden])').waitFor();
  await p.locator('[data-msg]').scrollIntoViewIfNeeded();
  await p.waitForTimeout(400);
  await p.screenshot({ path: `${out}/res-${w}-1-error.png` });
  // pick 3 persons, a time, a note → success
  await p.locator('.bs-chip', { hasText: /^3$/ }).click();
  await p.locator('[data-slots] [data-t="18:30"]').waitFor();
  await p.locator('[data-slots] [data-t="18:30"]').click();
  await p.fill('[name=notiz]', 'Ein Gast mit Nussallergie');
  await p.locator('[data-res-form] .bs-check').click();
  await p.screenshot({ path: `${out}/res-${w}-2-filled.png` });
  await p.click('[data-submit]');
  await p.waitForFunction(() => document.querySelector('[data-msg]')?.classList.contains('bs-msg--ok'));
  await p.locator('[data-msg]').scrollIntoViewIfNeeded();
  await p.waitForTimeout(400);
  await p.screenshot({ path: `${out}/res-${w}-3-done.png` });
  log.push(`res ${w}: ${await p.locator('[data-msg]').textContent()}`);

  // Event sign-up
  await p.goto(`${base}/veranstaltungen/adventsbrunch-29-11/`, { waitUntil: 'networkidle' });
  await p.fill('[name=vorname]', 'Jens');
  await p.fill('[name=nachname]', 'Hansen');
  await p.fill('[name=telefon]', '0170 4445556');
  await p.fill('[name=email]', 'jens@example.com');
  await p.selectOption('[name=personen]', '4');
  await p.locator('[data-signup] .bs-check').click();
  await p.locator('[data-signup] [type=submit]').scrollIntoViewIfNeeded();
  await p.screenshot({ path: `${out}/sign-${w}-1-filled.png` });
  await p.click('[data-signup] [type=submit]');
  await p.waitForFunction(() => document.querySelector('[data-signup] [data-msg]')?.classList.contains('bs-msg--ok'));
  await p.waitForTimeout(400);
  await p.locator('[data-signup] [data-msg]').scrollIntoViewIfNeeded();
  await p.screenshot({ path: `${out}/sign-${w}-2-done.png` });
  log.push(`sign ${w}: ${await p.locator('[data-signup] [data-msg]').textContent()} / free now ${await p.locator('[data-free]').textContent()}`);
  await ctx.close();
}

// Service admin on the built server
for (const w of [1440, 390]) {
  const { ctx, p } = await page(w, session);
  for (const r of ['/admin/?datum=2026-11-27', '/admin/anmeldungen/', '/admin/anfragen/', '/admin/deichpost/']) {
    await p.goto(base + r, { waitUntil: 'networkidle' });
    if (!p.url().includes('/admin/')) log.push(`NOT LOGGED IN at ${r}: ${p.url()}`);
    await p.screenshot({ path: `${out}/admin-${w}-${r.replace(/\W+/g, '_')}.png`, fullPage: true });
  }
  if (w === 1440) {
    await p.goto(`${base}/admin/?datum=2026-11-27`, { waitUntil: 'networkidle' });
    await p.locator('button', { hasText: /^Da$/ }).first().click();
    await p.waitForTimeout(700);
    await p.screenshot({ path: `${out}/admin-1440-after-da.png` });
    await p.goto(`${base}/_emdash/admin/content/veranstaltungen`, { waitUntil: 'networkidle' });
    await p.waitForTimeout(2000);
    await p.screenshot({ path: `${out}/emdash-veranstaltungen.png` });
  }
  await ctx.close();
}
await b.close();
console.log(log.join('\n'));
