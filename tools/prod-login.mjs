// Local production preview only: finish EmDash setup with a virtual passkey and save the session for captures.
// The passkey exists only inside this Playwright run (fine for .data-prod; never do this on a real site).
import { chromium } from 'playwright';
const base = process.argv[2] || 'http://127.0.0.1:4461';
const out = process.argv[3] || 'review/session.json';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const p = await ctx.newPage();
const cdp = await ctx.newCDPSession(p);
await cdp.send('WebAuthn.enable');
await cdp.send('WebAuthn.addVirtualAuthenticator', {
  options: { protocol: 'ctap2', transport: 'internal', hasResidentKey: true, hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true },
});
const dump = async (tag) => {
  await p.waitForTimeout(1500);
  console.log('---', tag, p.url());
  console.log(await p.evaluate(() => [...document.querySelectorAll('input,button,h1,h2,[role=alert]')].map((e) => `${e.tagName} ${e.getAttribute('name') || ''} ${e.getAttribute('type') || ''} ${(e.textContent || '').trim().slice(0, 60)}`).join('\n')));
};
await p.goto(base + '/_emdash/admin', { waitUntil: 'networkidle' });
if (p.url().includes('/setup')) {
  const inputs = p.locator('input[type=text]');
  await inputs.nth(0).fill('Mein Ziel Bongsiel');
  await p.locator('label', { hasText: 'Empty site' }).click();
  await p.getByRole('button', { name: /Continue/ }).click();
  await dump('step2');
  for (let i = 0; i < 4 && p.url().includes('/setup'); i++) {
    const email = p.locator('input[type=email]');
    if (await email.count()) await email.first().fill('service@example.com');
    const name = p.locator('input[type=text]');
    if (await name.count()) await name.first().fill('Service Test');
    const btn = p.locator('button[type=submit], button:has-text("passkey"), button:has-text("Continue"), button:has-text("Create")').first();
    if (await btn.count()) await btn.click();
    p.on('console', (m) => m.type() === 'error' && console.log('console:', m.text()));
    await dump('step' + (i + 3));
  }
}
await p.goto(base + '/admin/', { waitUntil: 'networkidle' });
console.log('admin url', p.url());
await ctx.storageState({ path: out });
await b.close();
