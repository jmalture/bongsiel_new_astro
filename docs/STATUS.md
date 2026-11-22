# Status – bongsiel-web (2026-11-21)

Astro 7 + EmDash 1.5 rebuild of mein-ziel-bongsiel.de. Runs locally; not deployed. German only.

## Done (round 1, extended 2026-11-22)
- 2026-11-22: hero carousel (6 slides, first = daylight facade from the 360 tour) and stitched "Als Nächstes" event stamp; event type icons/labels/colours on cards and detail page (optional EmDash field rt, otherwise guessed from title/teaser; add it to live databases with 
px emdash schema add-field); event facts redesigned (icon tiles, price pills, seats bar); new pages Aktivitäten, Erlebniswelt, 360°-Rundgang (tour loads on click) with nav "Erleben" and footer links.
- Pages: Home, Gaststätte, Speisekarte (`/speisen/`), Speisekarten overview + each card (print view), Veranstaltungen
  list + detail with sign-up, Reservierung, Feiern (`/eventlocation/`), Übernachten, Impressum, Datenschutz, 404.
- Booking engine (`src/lib/booking.ts`): weekly hours with last reservation time, closed days / special hours,
  event day types (Geschlossene Gesellschaft closes the day; Kein à la carte / Eingeschränkte Karte / Veranstaltung
  shown in the calendar), 15-min slots, 30 min lead time, max 10 online, 105 min table time, max 13 reservations /
  40 guests overlapping, auto-confirm up to 6 (bigger = "Anfrage"), Europe/Berlin time (fixes the old +1 h bug).
- Event sign-up with seat limit (replaces REBB): free seats live, lock against overbooking, closes at start,
  guest + restaurant mail, phone sign-ups in the admin, CSV for Excel, deletion 30 days after the event.
- Recurring events: weekly, every 2 weeks, monthly on the same weekday ("1. Sonntag" – fixes the old date-copy bug).
- Double submit guard: same date, time and e-mail or phone (still active) is refused with a friendly message.
- Enquiries (Feier, Zimmer), Deichpost sign-up (also from the reservation form), CSV export.
- Service admin `/admin/` (EmDash login, role ≥ Contributor): day view with week strip, KPIs, status in one tap
  (Bestätigen / Da / Storno / No-Show), table numbers, allergy notes highlighted, phone reservations, print,
  auto refresh every 60 s; Anmeldungen; Anfragen; Deichpost.
- EmDash content: Veranstaltungen, Speisekarten, Neuigkeiten, Schließtage & Sonderzeiten, Zimmer, Seitentexte,
  Öffnungszeiten & Kontakt. Seeded with the live content of 21.11.2026 (`tools/build-seed.mjs`).

## New copy (needs client approval)
- Home hero: "Moin aus Bongsiel." · "Draußen Deich, Schafe und weiter Himmel. Drinnen Kachelstube, Kerzenlicht und
  regionale Küche im Dat swarte Peerd."
- Home story: "Wenn die Sonne über dem Bongsieler Kanal sinkt …", "Licht im Fenster, das schwarze Pferd an der Tür.",
  "Kachelwand, Kerzenschein und frisch Gekochtes aus der Küche."
- Section titles: "Was bei uns als Nächstes los ist", "Regional, frisch gekocht", "Ein Haus, viele gute Plätze"
  (+ lead "Über 120 Jahre Gaststätte am alten Fähranleger zu den Halligen …"), "Euer Tisch wartet schon", house tiles
  captions, footer "Bis bald am Deich.", 404 "Hier ist nur Deich.".
- Reservation and sign-up form labels, confirmation mails, admin labels.
- Eventlocation: "Platz für eure Feier", room captions ("Für kleinere Runden"), "Erzählt uns von eurer Feier".

## To confirm with the client
- Facade photo for hero slide 1 is a still from the client's Tourmkr 360 tour (the only daylight shot); a real daylight photo would be sharper. Google Street View image of the inn was NOT used (rights).
- Burger Weekend card: "Rinder-Patty**" – the ** footnote has no explanation on the old page either.
- Homepage news (Deichpost text of 06.11.): still lists "Am 15. November: Überraschungs-Brunch" (past). Update or remove in Neuigkeiten; the client decides the new wording.
- Last reservation times: evenings 20:00 (Five Star), Sunday lunch **13:00** (Five Star allowed 11–14, kitchen to 13:30).
- Closed days seeded: 25.12., 31.12. (Silvester-Buffet only), 01.01.; 29.11. tables only 17–20 (brunch). 26.12.?
- Phone on the site 04674 82 739 82 vs Impressum 04667 – 9511066; postcode 25842 only on flyers.
- Gaststätte text is the client's (one duplicated paragraph removed); it still says 2016 fire / 2024 reopening with
  chef Lars Wilhelm Thamsen – outdated since Boris Schulte in den Bäumen (Nov 2026).
- Saal seating: the old site lists 120 Personen for every layout (Reihe, Bankett, Gala, Parlamentarisch).
- Partyfass vs "GastroFass (6 Pers.)" on the reservation form – name and size.
- Ferienwohnungen Dagebüll: no link known; Ferienwohnungen Bongsiel → booking.com Reetdachhaus.
- Room photos: real photos used (old WooCommerce products showed stock bedrooms).

## Known placeholders / limits
- Local preview database `.data-prod` holds test bookings from `tools/flows.mjs` (`@example.com`, removed after each run) and a test admin made with a virtual passkey (`tools/prod-login.mjs`). Never run that script against a real site.
- Chef photo is 552×736 (shown small). Night entrance photo (story step 2) is 1600 px wide: slightly upscaled on wide screens. Flyers in CMS are 1600×2266.
- Mails print to the server log until SMTP env vars are set.
- Newsletter sending stays in the old tool; this app only collects sign-ups (CSV).
- Rooms: enquiry only, no availability calendar.
- EmDash admin follows the browser language (German for German browsers); field labels are German.
- Default EmDash taxonomies "Categories/Tags" show in the EmDash sidebar (unused).

## Open (next rounds)
- Deploy (Hostinger Node app, DATA_DIR outside the app, SMTP, first admin login + invites for staff).
- Import from WordPress: future Five Star reservations, REBB sign-ups, ~448 newsletter subscribers.
- Not rebuilt yet: /xmas (seasonal thank-you page). Aktivitäten, Erlebniswelt and Rundgang are done (copy taken from the old pages; links per item mapped by order, please check).
- Link to the service admin from inside the EmDash admin (needs a small plugin).
- EN/DA, domain switch + 301s from old URLs (/veranstaltung/<slug>/ → /veranstaltungen/<slug>/).
