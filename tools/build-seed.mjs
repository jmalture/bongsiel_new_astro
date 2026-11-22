// Builds seed/seed.json = seed/schema.json + the current content of mein-ziel-bongsiel.de (raw/content, harvested
// 2026-11-21). Client texts are used verbatim. The seed is applied only to an EMPTY database (first start).
// Run: node tools/build-seed.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const schema = JSON.parse(readFileSync('seed/schema.json', 'utf8'));
const menusRaw = JSON.parse(readFileSync('raw/content/menus.json', 'utf8')).menus;
const eventsRaw = JSON.parse(readFileSync('raw/content/events.json', 'utf8')).events;
const page = (slug) => readFileSync(`raw/content/pages/${slug}.txt`, 'utf8');
const UP = 'https://mein-ziel-bongsiel.de/wp-content/uploads/';

let k = 0;
const key = () => `k${(++k).toString(36)}`;
const block = (text, style = 'normal') => ({
  _type: 'block',
  _key: key(),
  style,
  markDefs: [],
  children: [{ _type: 'span', _key: key(), text, marks: [] }],
});
const pt = (paras) => paras.filter(Boolean).map((p) => (typeof p === 'string' ? block(p) : block(p.text, p.style)));

/** Berlin local "YYYY-MM-DD HH:MM" → ISO UTC string. */
function berlinIso(local) {
  const [d, t = '00:00'] = local.split(/[ T]/);
  const guess = new Date(`${d}T${t.slice(0, 5)}:00Z`);
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit' });
  const p = Object.fromEntries(fmt.formatToParts(guess).map((x) => [x.type, x.value]));
  const shown = new Date(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:00Z`);
  return new Date(guess.getTime() - (shown - guess)).toISOString();
}

/** Plain text page → paragraphs, dropping the 3-line header and lines in `skip`. */
function pageParas(slug, { from, to, skip = [] } = {}) {
  const lines = page(slug).replace(/\r/g, '').split('\n').slice(4);
  let text = lines.join('\n');
  if (from) text = text.slice(text.indexOf(from));
  if (to && text.indexOf(to) > 0) text = text.slice(0, text.indexOf(to));
  return text
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    // Empty WordPress headings come through as bare "###" lines: drop them (also inside a paragraph).
    .map((s) => s.replace(/^#{2,}\s*$/gm, '').trim())
    .filter((s) => s && !skip.some((x) => s.includes(x)))
    .map((s) => (/^#{3,6} /.test(s) ? { text: s.replace(/^#+ /, ''), style: 'h3' } : s.startsWith('## ') ? { text: s.slice(3), style: 'h2' } :s.replace(/[ \t]*\n[ \t]*/g, '\n'))) // keep the client's line breaks (lists), shown with pre-line
    .filter((s) => (typeof s === 'string' ? s.length : s.text.length));
}

const media = (url, alt) => ({ $media: { url, alt } });

// ---------- Einstellungen ----------
const einstellungen = [
  {
    id: 'settings',
    slug: 'allgemein',
    status: 'published',
    data: {
      title: 'Dat swarte Peerd',
      oeffnungszeiten: [
        ...['Donnerstag', 'Freitag', 'Samstag'].map((tag) => ({ tag, von: '17:00', bis: '22:00', letzte: '20:00' })),
        { tag: 'Sonntag', von: '11:00', bis: '14:00', letzte: '13:00' },
        { tag: 'Sonntag', von: '17:00', bis: '22:00', letzte: '20:00' },
      ],
      telefon: '04674 82 739 82',
      email: 'kontakt@mein-ziel-bongsiel.de',
      adresse: 'Dat swarte Peerd\nAm Kanal 2\n25842 Ockholm',
      max_personen: 10,
      max_gaeste: 40,
      max_tische: 13,
      dauer: 105,
      sofort_bis: 6,
      storno_text:
        'Pläne können sich ändern, kein Problem – bitte sagt uns per Telefon, Email oder WhatsApp spätestens 24 Stunden vor der Buchung Bescheid. Fest gebuchte Plätze im Restaurant, die nicht abgesagt und nicht belegt werden, müssen wir ab sofort mit € 20,00 abrechnen. Das gilt auch, wenn sich die Personenanzahl um mehr als 1 Person verrechnet! Vielen Dank für euer Verständnis!',
      zahlung_text: 'Die Anmeldung ist kostenlos – bezahlt wird direkt vor Ort.',
    },
  },
];

// ---------- Veranstaltungen (upcoming from today) ----------
const flyers = {
  'adventsbrunch-29-11': UP + '2026/11/adventsbrunch-29-11-2026.jpg',
  'silvester-buffet-31-12': UP + '2026/11/silvester-buffet-31-12-2026.jpg',
};
const veranstaltungen = eventsRaw
  .filter((e) => e.start >= '2026-11-21')
  .map((e, i) => {
    const paras = e.description_text.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
    const price = paras.find((p) => /€/.test(p)) || '';
    const seats = /auf (\d+) begrenzt/.exec(e.description_text)?.[1];
    const cat = (e.categories || [])[0] || '';
    return {
      id: `ev${i}`,
      slug: e.slug,
      status: 'published',
      data: {
        title: e.title.replace(/\s*\d{1,2}\.\d{1,2}\.$/, ''),
        beginn: berlinIso(e.start),
        ende: e.end ? berlinIso(e.end) : undefined,
        kurztext: e.excerpt,
        inhalt: pt(paras),
        preis: price.replace(/^Nur /, ''),
        ...(flyers[e.slug] ? { bild: media(flyers[e.slug], `Plakat: ${e.title}`) } : {}),
        plaetze: seats ? Number(seats) : undefined,
        auswirkung: /Geschlossene/.test(cat) ? 'Geschlossene Gesellschaft' : /Kein/.test(cat) ? 'Kein à la carte' : 'Normal',
        startseite: true,
        privat: /Geschlossene/.test(cat),
        wiederholung: 'Keine',
      },
    };
  });

// ---------- Speisekarten ----------
const pick = {
  speisen: { title: 'Speisekarte', main: true, order: 1 },
  'daily-menu': { title: 'Tageskarte', order: 2 },
  'weihnachts-menue': { title: 'Weihnachts-Menü', order: 3 },
  'sylvester-buffet': { title: 'Silvester-Buffet', order: 4 },
  'buffet-vorschlaege': { title: 'Buffet-Vorschläge', order: 5 },
  wildkarte: { title: 'Wildkarte', order: 6 },
  spargelkarte: { title: 'Spargelkarte', order: 7 },
  'burger-weekend': { title: 'Burger Weekend', order: 8 },
};
const speisekarten = menusRaw
  .filter((m) => pick[m.slug])
  .map((m, i) => {
    const conf = pick[m.slug];
    const gerichte = [];
    let subtitle = '';
    for (const s of m.sections) {
      const items = (s.items || []).filter((it) => it.title);
      if (!items.length) {
        if (!subtitle && s.section) subtitle = s.section;
        continue;
      }
      items.forEach((it, j) =>
        gerichte.push({ abschnitt: j === 0 ? s.section || '' : '', name: it.title, beschreibung: it.description || '', preis: it.price || '' }),
      );
    }
    return {
      id: `menu${i}`,
      slug: m.slug === 'speisen' ? 'winterkarte' : m.slug,
      status: 'published',
      data: {
        title: conf.title,
        untertitel: subtitle && subtitle !== conf.title ? subtitle : '',
        hauptkarte: !!conf.main,
        reihenfolge: conf.order,
        gerichte,
        hinweis: (m.notes || []).join('\n') || undefined,
      },
    };
  })
  .filter((m) => m.data.gerichte.length);

// ---------- Neuigkeit (homepage intro, client text 06.11.2026) ----------
const home = pageParas('home', { from: '## Moin, wir sind wieder da!', to: '## 360° Rundgang' });
const neuigkeiten = [
  {
    id: 'news1',
    status: 'published',
    data: {
      title: 'Moin, wir sind wieder da!',
      text: pt(home.filter((p) => typeof p === 'string' && p !== 'Euer Team Bongsiel')),
      bild: media(UP + '2026/11/kuechenchef-boris-schulte-in-den-baeumen.jpg', 'Küchenchef Boris Schulte in den Bäumen'),
      button_text: 'Zur Speisekarte',
      button_link: '/speisen/',
      gruss: 'Euer Team Bongsiel',
      startseite: true,
    },
  },
];

// ---------- Schließtage (from the current Five Star exceptions + agreed feedback round) ----------
const day = (d) => berlinIso(`${d} 00:00`);
const schliesstage = [
  { id: 'c1', status: 'published', data: { title: 'Adventsbrunch – Tische nur abends', von: day('2026-11-29'), art: 'Sonderzeiten', zeiten: [{ von: '17:00', bis: '22:00', letzte: '20:00' }], hinweis_gaeste: 'Mittags Adventsbrunch (Anmeldung)' } },
  { id: 'c2', status: 'published', data: { title: '1. Weihnachtstag', von: day('2026-12-25'), art: 'Geschlossen', hinweis_gaeste: 'Weihnachten geschlossen' } },
  { id: 'c3', status: 'published', data: { title: 'Silvester', von: day('2026-12-31'), art: 'Geschlossen', hinweis_gaeste: 'Silvester-Buffet (Anmeldung)' } },
  { id: 'c4', status: 'published', data: { title: 'Neujahr', von: day('2027-01-01'), art: 'Geschlossen', hinweis_gaeste: 'Neujahr geschlossen' } },
];

// ---------- Zimmer ----------
const zimmer = [
  {
    id: 'r1',
    status: 'published',
    data: {
      title: 'Doppelzimmer „Fiete“',
      kurztext: 'In den neu erstellten „Hotelzimmern“ kann man es sich gut gehen lassen und auch Annehmlichkeiten wie die Sauna auf der Dachterrasse genießen.',
      personen: 2,
      preis: '€ 89,90 / Nacht',
      ausstattung: 'Doppelbett oder Einzelbetten\nSauna auf der Dachterrasse',
      reihenfolge: 1,
    },
  },
  {
    id: 'r2',
    status: 'published',
    data: {
      title: 'Ferienwohnungen Bongsiel',
      kurztext:
        'Angeschlossen zum Haupthaus haben wir auch noch 2 Gästehäuser mit traditionell nordischem Reetdach. Idyllisch zwischen Kanal und Fischteichen gelegen, bietet ein großzügiges Grundstück für Erholung und Freizeit.',
      ausstattung: 'Reetdach-Gästehaus\nSpielgeräte im Garten\nStand-up-Paddleboard zum Ausleihen',
      link: 'https://www.booking.com/hotel/de/reetdachhaus-bongsiel.de.html',
      reihenfolge: 2,
    },
  },
  {
    id: 'r3',
    status: 'published',
    data: {
      title: 'Ferienwohnungen Dagebüll',
      kurztext: 'Unser Partner „Mein Ziel Dagebüll“ in nur gerade mal ~ 15km Entfernung und direkter Lage am Meer bietet ebenfalls noch zahlreiche Ferienwohnungen an.',
      reihenfolge: 3,
    },
  },
];

// ---------- Seitentexte ----------
const gast = pageParas('gaststaette', { from: 'Das Restaurant Dat swarte Peerd', to: 'Tisch reservieren' });
const seen = new Set();
const gastUnique = gast.filter((p) => {
  const s = typeof p === 'string' ? p.replace(/^Der legendäre Wirt/, 'Der Wirt').slice(0, 60) : p.text;
  if (seen.has(s)) return false;
  seen.add(s);
  return true;
});
const seiten = [
  { id: 'p1', slug: 'gaststaette', status: 'published', data: { title: 'Traditionsgaststätte „Dat swarte Peerd“', inhalt: pt(gastUnique) } },
  {
    id: 'p2',
    slug: 'eventlocation',
    status: 'published',
    data: {
      title: 'Feiern in Bongsiel',
      einleitung: 'Ein großer Veranstaltungsraum von 160 m² bietet für nahezu jeden Wunsch die perfekten Räumlichkeiten.',
      inhalt: pt([
        'Für eure nächste Feier könnt ihr unseren Saal (bis 120 Personen), das gemütliche Kaminzimmer und ab sofort auch unser gemütliches Partyfass (bis 12 Personen) buchen! Unser Küchenchef steht euch gerne mit kreativen Vorschlägen für eure nächste Veranstaltung zur Verfügung.',
      ]),
    },
  },
  {
    id: 'p3',
    slug: 'uebernachten',
    status: 'published',
    data: { title: 'Übernachten in Bongsiel', einleitung: 'Neben Tradition bieten wir in Bongsiel auch noch ein modernes Leben an.' },
  },
  { id: 'p4', slug: 'impressum', status: 'published', data: { title: 'Impressum', inhalt: pt(pageParas('impressum', { from: '### Angaben' })) } },
  { id: 'p5', slug: 'datenschutz', status: 'published', data: { title: 'Datenschutzerklärung', inhalt: pt(pageParas('datenschutz', { skip: ['## Datenschutz\n'] }).slice(1)) } },
];

const seed = { ...schema, content: { einstellungen, veranstaltungen, speisekarten, neuigkeiten, schliesstage, zimmer, seiten } };
writeFileSync('seed/seed.json', JSON.stringify(seed, null, 1));
console.log(Object.fromEntries(Object.entries(seed.content).map(([c, v]) => [c, v.length])));
