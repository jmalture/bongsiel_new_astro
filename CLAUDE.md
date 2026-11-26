# bongsiel-web – handover

mein-ziel-bongsiel.de (Gaststätte "Dat swarte Peerd", Ockholm) rebuilt on **Astro 7 + EmDash 1.5**, replacing
WordPress/Elementor, Five Star reservations and Alture's REBB plugin. Client Martin Blindow via Patrick Keller
(project skill `bongsiel-website`, YouTrack BOW24). German only.

Read first: `docs/PLAN.md` (decisions), `docs/STATUS.md` (done / new copy / to confirm / open), `docs/BRAND.md`,
`docs/EMDASH-NOTES.md` (EmDash API facts), `docs/SITE-INVENTORY.md` + `docs/PHOTOS.md` (what the old site has).

## Run
```
npm install
npm run dev                      # http://127.0.0.1:4460, data in ./.data
node tools/seed.mjs              # first time: load content (schema is applied automatically on first request)
# admin: http://127.0.0.1:4460/_emdash/api/setup/dev-bypass?redirect=/admin/   (dev only)
```
Production-like locally: `ALLOW_LOCAL_DATA=1 DATA_DIR=$PWD/.data-prod EMDASH_SITE_URL=http://127.0.0.1:4461 npm run build`,
then `mkdir -p .data-prod/uploads` and `DATA_DIR=$PWD/.data-prod EMDASH_SITE_URL=http://127.0.0.1:4461 HOST=127.0.0.1 PORT=4461 node dist/server/entry.mjs`,
then `DATA_DIR=$PWD/.data-prod node tools/seed.mjs`.

## Architecture
- `output: 'server'`, `@astrojs/node` standalone, EmDash admin at `/_emdash/admin`. **No `trailingSlash` setting**
  (breaks EmDash setup). The database URL is baked in at build time from `DATA_DIR`: build and run with the same one.
- **Editorial content in EmDash** (`seed/schema.json` → `seed/seed.json` via `tools/build-seed.mjs`): veranstaltungen,
  speisekarten, neuigkeiten, schliesstage, zimmer, seiten, einstellungen (one entry: hours, contact, booking limits,
  no-show text). Everything is read through `src/lib/cms.ts`, which normalises and keeps real defaults
  (`SITE_DEFAULTS`, `DEFAULT_WEEK`), so an empty or half-filled database still renders a correct site.
- **Operational data in `${DATA_DIR}/service.db`** (`src/lib/db.ts`, Node's built-in `node:sqlite`, no native build):
  reservations, signups, enquiries, subscribers. Writes that can overbook run in `BEGIN IMMEDIATE` (`locked()`).
  `cleanupIfDue()` deletes guest data 30 days after the visit/event (enquiries after 180 days).
- **Booking rules** are pure functions in `src/lib/booking.ts` (server validation and the calendar use the same code).
  Event field "Reservierungen an dem Tag": Geschlossene Gesellschaft closes the day; the others only colour the
  calendar. Special table hours on event days are a "Schließtage & Sonderzeiten" entry (Art = Sonderzeiten).
- Public API: `/api/slots`, `/api/reservierung`, `/api/anmeldung`, `/api/anfrage`, `/api/newsletter` (honeypot
  `website`, in-memory rate limit, server validation, stored before mailing). Mail: `src/lib/mail.ts`, SMTP env;
  without SMTP mails are logged.
- **Service admin** `/admin/` (`src/pages/admin`, `src/layouts/Admin.astro`, `src/scripts/admin.ts`): EmDash login,
  role ≥ 20 (`src/lib/auth.ts`). All writes go to `POST /api/admin` with an `action`; CSV via `GET /api/admin?export=`.
  Lists refresh in place (`[data-live-list]`), confirmations are a second tap (no browser dialogs).
- Sections: `src/components/home/NN-*.astro`, each with its own `<style is:global>` (prefix `bs-`, admin `ad-`).
  Tokens/reveal/buttons in `src/styles/site.css`, behaviour in `src/scripts/site.ts`.
- Photos: `tools/images.mjs` → `public/img/<name>-<w>.webp` + `src/data/photos.json`; `<Photo name>` builds the
  srcset; `<CmsImage>` shows an EmDash image or a real photo as fallback.

- Hero (`home/01-Hero.astro`): 5-slide carousel (crossfade + zoom, dots, arrows, swipe, keys; first slide = `haus-tag`, a still
  cropped from the client's Tourmkr 360 tour) and the stitched "Als Nächstes" stamp (next event). Slides are a `slides` array.
- Event kinds (`src/lib/eventKind.ts`): icon, label and colour per event, from the optional EmDash select `art`, otherwise guessed
  from title/teaser keywords. Used by `EventCard`, the event detail header and the facts tiles (`.bs-fact*`).
- Pages for the surroundings: `aktivitaeten`, `erlebniswelt` (cards via `ui/ActCards.astro`, hand-drawn animated icons in
  `ui/ActIcon.astro`), `rundgang` (Tourmkr iframe loads on click). `ui/MoreLinks.astro` cross-links them.
- Header (`Header.astro`): mega menu (groups Gaststätte / Veranstaltungen / Erleben, direct link Übernachten). Edit the `nav` array;
  icons are SVG path data. Mobile drawer lists the same items flat.
- Forms: success shows a big thank-you card (`thanks()` in `scripts/site.ts`, also exposed as `window.bsThanks`; CSS `.bs-thanks`).
## Env (production)
`DATA_DIR` (absolute, outside the app – a Hostinger build wipes the app folder), `EMDASH_SITE_URL`,
`EMDASH_ENCRYPTION_KEY` (`npx emdash secrets generate`), `SMTP_HOST/PORT/USER/PASS`, `MAIL_FROM`,
`MAIL_TO_RESTAURANT` (comma list ok), `SITE_NOINDEX=1` for previews. Node ≥ 22.13.

## Gotchas
- Seed content is never re-applied to an existing database; schema changes on a live site via
  `npx emdash schema add-field …` **and** edit `seed/schema.json`.
- EmDash fields have no help text: labels carry the hint ("Bis (leer = nur ein Tag)").
- Datetimes come back as `Date`; always convert with `berlin()` in cms.ts.
- Hidden scroll-story layers would never lazy-load: the story script switches them to eager when near.
- Photo wipes slide a cover panel away; never clip the image itself (Chrome would not lazy-load it).
- Bash heredocs with long Astro files failed in this environment: write files with the editor tool.

## Verify
Passkeys need a hostname, so build and run the preview with `EMDASH_SITE_URL=http://localhost:4461` and open it as `localhost`.
Admin on the built server: `node tools/prod-login.mjs http://localhost:4461` (finishes setup with a virtual passkey, saves `review/session.json`; local preview only), then `node tools/flows.mjs http://localhost:4461 review/session.json` (reservation error/success, sign-up, admin screens → `review/flows/`).
`npm run build`, `npm run check:format`, preview, then the verify-loop capture (profile astro-site):
`MSYS_NO_PATHCONV=1 node "$USERPROFILE/.claude/skills/verify-loop/scripts/capture.mjs" http://127.0.0.1:4461 /,/reservierung/,/veranstaltungen/,/veranstaltungen/adventsbrunch-29-11/,/speisen/,/speisekarten/,/gaststaette/,/eventlocation/,/uebernachten/,/impressum/ review/round-N --full-routes /`

## Deploy (Hostinger preview, not done yet)
1. New Node.js site (Node 22), `SITE_NOINDEX=1` for a preview. Env before the first build: `DATA_DIR` (absolute, outside the app),
   `EMDASH_SITE_URL` (the preview URL), `EMDASH_ENCRYPTION_KEY`, SMTP vars.
2. Upload `git archive HEAD` as `app.zip`, wait for the upload to finish, then start the build (framework astro, output `dist`, entry `server/entry.mjs`).
3. Finish the EmDash setup at once (open to anyone until done), then `node tools/seed.mjs` against the live URL and invite staff.
4. Check with `tools/flows.mjs` ideas on a copy, never `tools/prod-login.mjs` (virtual passkey) on a real site.
Full notes: skill `astro-emdash-site`.