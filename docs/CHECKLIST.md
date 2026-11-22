# Project checklist – bongsiel-web

Read by the verify-loop checker next to the astro-site profile. One line per miss, with date and what happened.

## Content
- [ ] No leftover markup in seeded or CMS text (`###`, `**`, `&nbsp;`). Check `seed/seed.json` and the rendered text files. Seed content is never re-applied to an existing database: fix the seed and the live EmDash entry. (2026-11-21: 28x `###` on Impressum/Datenschutz)
- [ ] Past dates in client copy (news, events) are listed in `docs/STATUS.md` "To confirm" or removed. (2026-11-21: "Am 15. November: Überraschungs-Brunch" still in the home news)
- [ ] `€` stays with its number: non-breaking space in prices, also in CMS-driven text (event cards at 390). (2026-11-21)

## Layout
- [ ] Hero eyebrow is readable over the photo at 1440. (2026-11-21: it sat on the sheep)
- [ ] Calendar cells in a row have equal height; keep labels short ("Event-Menü"). (2026-11-21)

## Booking and admin
- [ ] Reservation guard: the same guest cannot book the same slot twice (409 with a German message). `tools/flows.mjs` uses fixed guest data, so a second run fails by design: use unique names per run.
- [ ] Public form endpoints are rate limited (6 per 10 min per IP, in memory): repeated test runs on one server hit 429. Restart the server or use another port.
- [ ] Event sign-up has no duplicate guard yet (same person can register several times): open decision.
- [ ] Verify the admin and the forms on the built server, not only dev: `node tools/prod-login.mjs http://localhost:4461`, then `node tools/flows.mjs http://localhost:4461 review/session.json`.

## Run notes
- Build and preview on `localhost` (passkeys need a hostname); run a second preview on another port so other servers stay untouched.
- Do not `pkill` node: other projects' servers may be running.