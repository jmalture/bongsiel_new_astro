# Bongsiel – Astro + EmDash rebuild: plan

Decided with Honza (2026-11-21): the new app runs reservations, event sign-ups and closing days itself
(replaces Five Star + REBB); German only; round 1 = homepage + core pages + admin; rooms and newsletter as
simple versions (request/sign-up into the admin, sending stays external).

## 1. Direction: "Deich draußen, Feuer drinnen"
The visitor stands on the dike at the North Frisian coast, a few kilometres short of Denmark, wind in the
grass, flat light – and then steps into a warm, timbered Gaststube. The site plays that contrast:

- **Day → evening.** Light linen pages (cream #F3F3EC) for the coast; deep peat/olive (#1d1f17 / #3A3C2F) for
  the evening inside, lit by a warm ember accent. A sticky scroll scene turns the homepage from daylight to
  window-glow evening.
- **Kept identity:** sage #879760, olive #3A3C2F, cream #F3F3EC, Syncopate headings (wide, uppercase), Onest text,
  pill buttons, the Bongsiel logo. **New:** ember #C9833F (candle/firelight, small doses), dike line motif (one
  long horizon line that draws itself and recurs as dividers), wind-grass strokes, paper grain.
- **Photography first:** the real house, food and people, large, with slow light (Ken Burns, light sweeps),
  clip wipes on loaded photos. No stock where real photos exist.
- **Motion:** calm, precise, layered (line masks, sequenced cards, drawn icons, count-ups only for real
  numbers such as free seats). No bounce, no cursor gimmicks, full reduced-motion fallback.
- Quality bar: jenomics.de / sdx-app.com (Alture Astro stack), Lighthouse ≥ 95.

## 2. What the current site does (to be replaced)
See `docs/SITE-INVENTORY.md` (pages, events, menus) and the `bongsiel-website` skill. Functions:

| Today (WordPress) | New app |
|---|---|
| Five Star table reservations: weekly rules, exceptions, slots 15 min, party 1–10, max 13 tables / 40 guests per slot, auto-confirm ≤ 6, no-show text, emails | `/reservierung/` form + rules engine + service admin (list per day, status, table, phone bookings) |
| REBB event day types: Geschlossene Gesellschaft (day closed), Kein à la Carte, Eingeschränkte Karte, Event (info) – colours + info in the datepicker | Event field "Auswirkung auf Reservierungen" drives the date picker directly |
| REBB seat-limited sign-up (Brunch, Buffet): N von M Plätzen frei, form, phone sign-ups, CSV, 30-day deletion | Event field "Plätze" + sign-up form on the event page + Anmeldungen in admin (CSV, phone entry, auto-delete) |
| REBB recurrence (weekly/monthly) | Event "Wiederholung" (weekly / every 2 weeks / monthly by weekday e.g. "1. Sonntag") – fixes the old date-copy bug |
| The Events Calendar list + event pages | `/veranstaltungen/` + `/veranstaltungen/<slug>/` |
| Speisekarte + themed menu pages, print CSS | Collection "Speisekarten" (sections → dishes → price), print stylesheet |
| Homepage "Störer" + Deichpost badge | Collection "Neuigkeiten" (newest pinned one shows on the homepage) |
| Footer opening hours (manual, often out of sync) | One source: opening hours in settings feed footer, header status ("Heute 17–22") and the booking rules |
| Newsletter plugin (Deichpost) | Sign-up list in admin + CSV export (sending stays in the old tool for now) |
| WooCommerce room booking | Room pages + booking request into admin |
| 360° tour (tourmkr iframe) | Kept, loaded on click |

## 3. Architecture
- Astro 7, `output: 'server'`, Node adapter standalone, **EmDash** (admin at `/_emdash/admin`) on SQLite,
  `DATA_DIR` outside the app folder on Hostinger. No `trailingSlash` setting (breaks EmDash setup).
- **Editorial content in EmDash** (editors use the EmDash admin): Veranstaltungen, Speisekarten, Neuigkeiten,
  Räume/Zimmer, Seiten-Texte, Einstellungen (Öffnungszeiten, Kontakt, Buchungsregeln), Schließtage.
- **Operational data in the app's own tables** (reservations, sign-ups, room requests, subscribers): written
  by public forms through our API routes (honeypot, rate limit, server-side validation, lock per slot/event
  against overbooking), shown in the **Service-Admin** `/admin/` (login = EmDash login), simple and fast on a
  tablet at the bar: Heute, Reservierungen, Anmeldungen, Anfragen, Deichpost.
- Mail: nodemailer via SMTP env (guest confirmation + restaurant notice); every submission stored before mailing.
- Folder: `src/pages` routes, `src/components/<area>/NN-name.astro` sections (prefix `bs-`),
  `src/lib` (cms normalising with real defaults, booking rules, db), `seed/seed.json` schema, `tools/` scripts.

## 4. Pages, round 1
1. **Home**: hero (dike horizon, MOIN, Tisch reservieren), live status (heute geöffnet …), Neuigkeit (Boris),
   day→evening scroll story, next events with free seats, Speisekarte teaser, house bento (Gaststube, Saal,
   Kaminzimmer, Garten, Übernachten, 360°), quick reservation strip (next 7 days open/closed), Deichpost
   sign-up, De Molen Koopmann, footer.
2. Gaststätte + Speisekarte (`/gaststaette/`, `/speisen/`, `/speisekarten/<slug>/` with print view).
3. Veranstaltungen list + detail with sign-up.
4. Reservierung (date strip with event colours + legend, slots, party, room wish, notes, no-show text).
5. Eventlocation (Saal, Kaminzimmer, Partyfass; enquiry form), Übernachten (rooms, request; Ferienwohnungen links).
6. Impressum, Datenschutz (texts from the current site), 404.

Later rounds: all seasonal menu pages, Aktivitäten/Erlebniswelt, newsletter sending, EN/DA, data import
from WordPress (events, subscribers), domain switch.

## 5. Admin principles
Short German labels, one-line hints only where a wrong entry hurts, sensible defaults, no duplicated
fields. Service admin: big tap targets, today first, status in one tap, print list.

## 6. Steps
1. Research (EmDash API, site inventory + photos) → `docs/EMDASH-NOTES.md`, `docs/SITE-INVENTORY.md`, `docs/PHOTOS.md`.
2. Scaffold app + schema + seed with real current content.
3. Design system (`docs/BRAND.md`), base layout, header/footer.
4. Homepage at full quality, then core pages.
5. Booking engine + APIs + service admin.
6. Docs (CLAUDE.md, README, STATUS with new copy for approval), build, preview, verify-loop capture, fix.
