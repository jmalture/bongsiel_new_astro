# Site inventory – mein-ziel-bongsiel.de (state 2026-11-21)

WordPress + Elementor Pro (Hello theme), The Events Calendar + Event Tickets, WooCommerce + WC Bookings, Five Star Restaurant Reservations, Newsletter (tnp), Slider Revolution, ElementsKit. 37 published pages, 0 blog posts, 25 events (since 2025-01-01), 2 WooCommerce room products, 249 media items.
Raw data: `raw/content/pages/<slug>.html|.txt`, `raw/content/menus.json`, `events.json`, `site.json`, `rooms.json`, `raw/media/manifest.json`.

## Global (header / footer / popups)

- **Header nav**: Dat swarte Peerd (/) · Speisekarte (/speisen/) · Gaststätte · Reservierung · Eventlocation · Eventsaal (→ /eventlocation/) · Veranstaltungen · Aktivitäten · Übernachten · Erlebniswelt · De Molen Koopmann (external shop in Dagebüll). Logo = inline SVG horse head.
- **Footer**: opening hours, phone, "Über Uns" links, buttons Speisekarte (/speisekarten/) · Tisch reservieren · Veranstaltungen, Impressum | Datenschutz, "© 2025 Mein Ziel Bongsiel", "Webdesign by Alture", Google Maps embed ("Gaststätte Bongsiel").
- **Hours** (footer): "Donnerstag – Samstag 17:00 – 22:00 Uhr (Küche bis 20:30 Uhr) · Sonntag 11:00 – 14:00 Uhr und 17:00 – 22:00 Uhr (Küche bis 13:30 bzw. 20:30 Uhr) · Montag – Mittwoch Geschlossen" (Thu–Sat 5–10 pm, Sun 11–2 and 5–10 pm, Mon–Wed closed). /gaststaette/ still says Sunday "10.00 – 14:00" – inconsistent.
- **Contact**: Dat swarte Peerd, Am Kanal 2, (25842) Ockholm · +49 (0)4674 82 739 82 "(Donnerstag bis Sonntag ab 16 Uhr persönlich)" · kontakt@mein-ziel-bongsiel.de. Impressum operator: De Molen Koopmann Gaststätte Bongsiel, Martin Blindow, Nordsestraße 12, 25899 Dagebüll-Hafen, Tel. 04667 – 9511066.
- **Popups**: #356 mobile menu; #3176 newsletter signup "Melde Dich für unseren Newsletter an!" (sign up for our newsletter) – Vorname, Nachname, E-Mail, Datenschutz checkbox (Newsletter plugin).
- **Social links**: none anywhere on the site.

## Pages

| Slug | Purpose | Key content | Features |
|------|---------|-------------|----------|
| `/` home | Landing | Deichpost box "Bleib immer auf dem Laufenden!" (stay up to date) + "Jetzt Anmelden"; announcement "Moin, wir sind wieder da!" – new chef Boris Schulte in den Bäumen since 01.11., brunch dates, new hours, Saal (bis 120 Personen), Kaminzimmer, Partyfass (bis 12 Personen); 360° teaser; "Dat swarte Peerd" + two Brataal notices (eel available / not available – toggled by hand); teasers Eventlocation, Grillhighlight (old: Dexter-Rind 09.08.), Aktivitäten, Erlebniswelt, Übernachten, De Molen Koopmann | newsletter popup, links to 3 event pages, 360 link, mailto |
| `/speisen/` | **Current menu** "Winterkarte" (nav target) | 8 sections, 44 items: Suppen, Salate & Mee(h)r · Fleisch aus "regionaler Aufzucht" · Pasta á la Boris / Vegetarisch – Vegan · Frischer Fisch vom Kutter aus Tönning · Für unsere kleinen Gäste · Unsere Winter-Highlights 2026 (Halbe Ente, Grünkohl) · … etwas Süßes zum Abschluß! | Elementor price list, accordion |
| `/daily-menu/` | Tageskarte (daily specials) | Currywurst, Grünkohl, Rehkeule, "Bongsieler Kanalplatte 49,80/Pers." (eel platter) … | price list |
| `/speisekarten/` | Menu hub (footer target) | Tiles: Außer Haus, Weihnachts-Menü, Sylvester Buffet, Buffet-Vorschläge, Tageskarte, HerbstlichesMenü, Muschel Buffet, MuschelMenü, Winterspeisekarte, Spargelkarte | **broken links**: /takeaway/ and /winterspeisekarte/ → 404 |
| `/speisekarte/` | Older full menu (Jun 2026), plain HTML | 124 items incl. the only **drinks list** (Bier vom Fass, Wein Margaretenhof/Martin/Austerfischer, Spirituosen, Heißgetränke), allergen legend, note on smaller portions "Liebe Gäste vom Swarten Peerd…" (beef +35 %, portions 150 g instead of 200 g) | not in nav |
| `/speisekarte-collapsable/` | Very old draft menu (2024) | generic dishes | accordion, unused |
| `/weihnachts-menue/` | Christmas menu | Vorspeise/Zwischengang/Hauptgang/Dessert with "Oder" choices; "3 Gang 49,50 / 4 Gang 54,50"; "Ihr könnt unser Weihnachts-Menü bereits ab dem 4. Dezember genießen." (available from 4 Dec) | price list, PDF link (points to Speisekarte-2025-08-07.pdf – wrong file) |
| `/sylvester-buffet/` | NYE buffet 2025 | Buffet list; "Preise: 58,00 (Kinder bis 12J & Senioren ab 70J nur € 38,00)" | price list, PDF link (wrong file) |
| `/buffet-vorschlaege/` | Group buffets "Vor Ort bei uns im Saal oder auch für Dein Fest zuhause" (in our hall or at your party at home) | Tabs Bongsiel Simple / Standard / Exclusive – **all three identical** (ab 20 Personen 48,00) | tabs, price list, PDF link |
| `/burger-weekend/` + `/burger-weekend-print/` | Burger Weekend menu + **print version** | Burgerkarte (half/full prices, e.g. "8,50 \| 15,80"), staff-named burgers | price list, print page |
| `/spargelkarte/` | Asparagus menu 2026 | "Spargel auf Bongsiel 2026", Desmercieres Hof | price list |
| `/wildkarte/` | Game menu Jahreswechsel 2024/25 | 6 game dishes + Räucheraal | price list, PDF (Wildkarte-2024-12-23.pdf) |
| `/muschel-buffet/` | Mussel buffet | 4 courses, "€ 32,50" | headings only, PDF link = Wildkarte (wrong) |
| `/muschelmenu/` | Mussel set menu | "€ 34,80 – ab 2 Personen nur € 29,80/Person" | same |
| `/herbstlichesmenue/` | Autumn set menu | Kürbiscremesuppe, Grünkohl/Steckrübenmus, Apfelcrumble, "€ 27,80" | same |
| `/muttertag/` | Mother's Day menu 11.05.2025 | same dishes as Herbstmenü, € 27,80 | same |
| `/gaststaette/` | The inn + history | Story: founded >120 years ago by an old ferry pier to the Halligen; landlord Laurits Thamsen's Plattdeutsch tall tale of a black horse; guests Emil Nolde, Helmut Schmidt (1979); fire 2016; reopened 2024 with cook Lars Wilhelm Thamsen; hours; Aal notice | photo gallery (~13 imgs) |
| `/reservierung/` | Table booking | Form: Personen 1–10, Datum, Zeit, Name, E-Mail, Telefon, Räumlichkeiten (Restaurant vorne / Kaminzimmer / Saal / Biergarten / GastroFass "6 Pers. ab 06/2026"), Notizen; "Der Tisch wird euch für 2h zur Verfügung stehen." (table for 2 h); no-show fee € 20,00 if not cancelled 24 h ahead | **reservation form** (Five Star / rtb) |
| `/eventlocation/` | Saal hire | "Ein großer Veranstaltungsraum von 160 m²…", 80–120 Personen; seating Reihe/Bankett/Gala/Parlamentarisch je 120; "Kommendes Event" teaser | gallery, seating icons, events widget |
| `/veranstaltungen/` | Events list (TEC archive) | see event list below | **events**, iCal/Google export |
| `/veranstaltung/<slug>/` | Single event | description, organizer, venue map; seat-limited registration via Alture booking bridge (rebb) | **event tickets/registration**; on live pages the shortcode `[emcp_snippet id="5858"]` shows as raw text (EMCP plugin disabled) |
| `/aktivitaeten/` | Things to do | Sehenswürdigkeiten (Uthlande Hafen Dagebüll, Leuchtturm Dagebüll, Naturkundemuseum Niebüll), Wanderwege (Deichwanderweg 6 km, Dagebüll-Runde 11,3 km, … komoot links), Wattwanderung, Kanu, NWS Föhr | external links, Google Maps links |
| `/erlebniswelt/` | On-site leisure | Outdoor: Schach, Boule, Streichelzoo "(kommt bald)"; Indoor: Souvenirshop, Billiard*, Darts*, Tischkicker* ("* gegen Gebühr" = for a fee) | icons |
| `/uebernachten/` | Stay | "Hotel mit Ferienzimmern" (sauna on roof terrace; "In Kürze finden Sie hier unsere Buchungsmöglichkeiten" = booking coming soon); 2 Gästehäuser with Reetdach between canal and fish ponds, SUP rental; partner "Mein Ziel Dagebüll" ~15 km | slider, links to Booking.com (Reetdachhaus Bongsiel) and room products |
| `/zimmerbuchung/` | Room booking | empty page | — |
| `/product/doppelzimmer-fiete/`, `…-copy/` | WooCommerce Bookings rooms | "Doppelzimmer Fiete (Doppelbett / Einzelbetten)", 89,90 EUR, "Gemütliches Doppelzimmer mit Doppelbett und eigenem Badezimmer für 2 Personen." (cosy double with own bathroom) – images are stock | **room booking** (WC Bookings) |
| `/easybooking/`, `/easybooking-booking/` | easybooking enquiry embed (test) | script only | 3rd-party booking widget |
| `/warenkorb/`, `/kasse/`, `/mein-konto/` | Woo cart/checkout/account | system | WooCommerce |
| `/tickets-checkout/`, `/tickets-order/` | Event Tickets checkout | system | Event Tickets (TC) |
| `/newsletter/` | Newsletter form | Vorname, Nachname, E-Mail, Datenschutz | **newsletter signup** |
| `/rundgang/` | 360° tour | "Gaststube, Saal, Partyfass, Ferienwohnungen und Garten – im 360°-Rundgang…" | **360 iframe `https://tourmkr.com/F1Dhi5B6nJ`**, "Im Vollbild öffnen" |
| `/xmas/`, `/xmas-neu-entwurf-webgl-hero/` | Christmas thank-you page (gift: magnets, code "DSPXMAS") + WebGL draft | scroll animation | custom JS / WebGL |
| `/impressum/`, `/datenschutz/` | Legal | see site.json | — |

**Print / PDF**: PDF menu cards in media – `Speisekarte-2024-12-23.pdf`, `Speisekarte-2025-08-04.pdf`, `Speisekarte-2025-08-07.pdf`, `Wildkarte-2024-12-23.pdf`, `DSP-Getraenke-Speisen-1.pdf`, `DSP-Biike-2025.pdf` (all in `raw/media/`). Menu pages' "…als PDF" buttons point to outdated PDFs.

## Event categories

- **Event** – normal operation, calendar only shows a hint.
- **Geschlossene Gesellschaft** (private function) – restaurant fully booked, day red and not bookable.
- **Kein à la Cart(e)** – tables bookable but only the event menu is served.

## Events (TEC REST, start ≥ 2025-01-01, 25)

| Date | Title | Category | Price text |
|------|-------|----------|-----------|
| 2025-02-03 18–22 | 200 Jahre Halligflut (ausgebucht) | – | flyer: 24,50 € p.P. zzgl. Getränke |
| 2025-02-21 | Biike 2025 | – | – (Grünkohl evening, PDF) |
| 2025-04-20 10–14 | Ostersonntag – Brunch | – | "Preis pro Person 34,50 EUR … Kinder bis 12 Jahre zahlen die Hälfte" (cost field "Kostenlos") |
| 2025-04-21 10–14 | Ostermontag – Brunch | – | same |
| 2025-05-24 / 25 17–22 | Bongsieler Burger Weekend | – | see burger menu |
| 2025-05-29 / 06-01 14–17:30 | Kuchenbuffet | – | – |
| 2025-07-05 17:30 | Watt'n Abend | – | "Der Preis für den ganzen Abend liegt bei 34,80€" |
| 2025-07-11 18:30 | Weinprobe | – | "inkl. Essen … 37,50€", "ohne Essen für 14,50€" |
| 2025-08-09 17:00 | Grill Highlight – Dexter Rind | – | "38,50€. Kinder bis 10 Jahre zahlen die Hälfte." |
| 2025-11-27 → 2026-01-06 | Weihnachts-Menü (an unseren Öffnungstagen bis zum 06.01.2026) | – | 3 Gang 49,50 / 4 Gang 54,50 (menu page) |
| 2025-12-31 17–23 | Sylvester Buffet | – | 58,00 / Kinder & Senioren 38,00 (menu page) |
| 2026-03-07 → 03-08 | Bongsieler Burger Weekend 7.03 – 08.03 | – | – |
| 2026-03-27 18–22 | Miesmuschelbuffet | – | "34,50€ pro Person" |
| 2026-04-03 17–22 | Fischbuffet | – | "39,50€ pro Person" |
| 2026-04-05 / 04-06 | Osterbrunch | – | "39,50€ pro Person" |
| 2026-04-17 17–22 | Schnitzelbuffet 17.04 | – | – (flyer) |
| 2026-05-14 15–22 | Grillbuffet 14.+15.05.2026 | Kein à la Cart | – (flyer) |
| 2026-07-25 | Geschlossene Gesellschaft | Geschlossene Gesellschaft | – |
| 2026-11-13 | Geschlossene Gesellschaft | Geschlossene Gesellschaft | – |
| 2026-11-15 10:30–14:30 | Großer Überraschungs-Brunch 15.11. | Kein à la Cart | "€ 34,50 / Kinder bis 12 Jahre € 17,50, alle Getränke inklusive" (drinks included) |
| 2026-11-29 10:30–14:00 | Adventsbrunch 29.11. | Kein à la Cart | "€ 29,50 pro Person / Kinder bis 12 Jahre € 14,50", "Nur 100 Plätze" |
| 2026-12-31 17:30–22:00 | Großes Silvester-Buffet 31.12. | Kein à la Cart | "€ 89,50 pro Person / Kinder bis 12 Jahre € 29,50" |

Notes: older events carry a copy-pasted TEC template in their description (stored verbatim in events.json). Event Tickets has 3 tickets: Ostersonntag- and Ostermontag-Brunch 2025 (capacity 105 each) and Überraschungs-Brunch 15.11.2026 (capacity 100, pay on site).

## Issues to fix in the rebuild

- Hub links /takeaway/ and /winterspeisekarte/ 404; PDF buttons point to old/wrong PDFs.
- Sunday hours differ between footer/home (11:00) and /gaststaette/ (10:00); phone numbers differ (04674 82 739 82 vs. Impressum 04667 9511066 vs. older 01520 2450078).
- Room products use stock bedroom photos; real rooms: `Zimmer01–03.jpeg`, `5132222xx.jpg`.
- `[emcp_snippet id="5858"]` printed as text on event pages.
- Buffet tiers identical; Brataal notices toggled manually; home "Grillhighlight" teaser is from Aug 2025.
