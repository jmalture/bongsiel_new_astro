import { eventKind, type EventKind } from './eventKind';
/**
 * Everything the templates read from EmDash goes through here and comes out normalised, with real defaults:
 * an empty or half-filled database still gives a complete, correct site (editors can delete entries).
 */
import { getEmDashCollection, getEmDashEntry } from 'emdash';
import {
  DEFAULT_SETTINGS,
  DEFAULT_WEEK,
  addDays,
  type BookingSettings,
  type DayEvent,
  type DayType,
  type Exception,
  type WeekRule,
  type Window,
  isTime,
  nowBerlin,
  TZ,
} from './booking';

type Any = Record<string, any>;

// ---------- dates ----------
/** Date (or ISO string) → Berlin local { date: 'YYYY-MM-DD', time: 'HH:MM' }. */
export function berlin(v: unknown): { date: string; time: string } | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(String(v));
  if (Number.isNaN(d.getTime())) return null;
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  );
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

/** Keep "€ 14,50" / "14,50 €" together on one line (also in CMS text). */
export const tidy = (s: unknown): string =>
  String(s ?? '')
    .replace(/€\s+(?=\d)/g, '€ ')
    .replace(/(\d)\s+€/g, '$1 €');
/** Same for every span of a Portable Text value. */
function tidyPT(v: unknown): unknown {
  if (!Array.isArray(v)) return v;
  return v.map((b: Any) =>
    Array.isArray(b?.children)
      ? { ...b, children: b.children.map((c: Any) => (typeof c?.text === 'string' ? { ...c, text: tidy(c.text) } : c)) }
      : b,
  );
}

async function list(collection: string, opts: Any = {}): Promise<Any[]> {
  try {
    const { entries } = await getEmDashCollection(collection as never, { limit: 100, ...opts } as never);
    return (entries ?? []) as Any[];
  } catch (e) {
    console.error(`[cms] ${collection}`, e);
    return [];
  }
}

// ---------- settings ----------
const DAY_INDEX: Record<string, number> = {
  Sonntag: 0,
  Montag: 1,
  Dienstag: 2,
  Mittwoch: 3,
  Donnerstag: 4,
  Freitag: 5,
  Samstag: 6,
};

export interface Site {
  name: string;
  phone: string;
  phoneHref: string;
  email: string;
  address: string[];
  mapsUrl: string;
  week: WeekRule[];
  booking: BookingSettings;
  noShow: string;
  payment: string;
  instagram: string;
  facebook: string;
}

export const SITE_DEFAULTS: Site = {
  name: 'Dat swarte Peerd',
  phone: '04674 82 739 82',
  phoneHref: '+4946748273982',
  email: 'kontakt@mein-ziel-bongsiel.de',
  address: ['Mein Ziel Bongsiel', 'Am Kanal 2', '25842 Ockholm'],
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Gastst%C3%A4tte+Bongsiel+Am+Kanal+2+Ockholm',
  week: DEFAULT_WEEK,
  booking: DEFAULT_SETTINGS,
  noShow:
    'Pläne können sich ändern – bitte sagt uns bis 24 Stunden vorher Bescheid, wenn ihr nicht kommen könnt. Bei Nichterscheinen oder kurzfristiger Absage berechnen wir € 20,00 pro reserviertem Platz.',
  payment: 'Die Anmeldung ist kostenlos – bezahlt wird direkt vor Ort.',
  instagram: '',
  facebook: '',
};

let siteCache: { at: number; value: Site } | null = null;
export async function getSite(): Promise<Site> {
  if (siteCache && Date.now() - siteCache.at < 5_000) return siteCache.value;
  const [e] = await list('einstellungen', { limit: 1 });
  const d: Any = e?.data ?? {};
  const rows: Any[] = Array.isArray(d.oeffnungszeiten) ? d.oeffnungszeiten : [];
  const week: WeekRule[] = rows
    .filter((r) => r && r.tag in DAY_INDEX && isTime(r.von) && isTime(r.bis))
    .map((r) => ({ day: DAY_INDEX[r.tag], from: r.von, to: r.bis, last: isTime(r.letzte) ? r.letzte : r.bis }));
  const num = (v: unknown, def: number) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : def);
  const phone = (d.telefon || SITE_DEFAULTS.phone).trim();
  const value: Site = {
    ...SITE_DEFAULTS,
    phone,
    phoneHref: phone.replace(/[^\d+]/g, '').replace(/^0/, '+49'),
    email: d.email || SITE_DEFAULTS.email,
    address: d.adresse
      ? String(d.adresse)
          .split(/\n+/)
          .map((s: string) => s.trim())
          .filter(Boolean)
      : SITE_DEFAULTS.address,
    week: week.length ? week : DEFAULT_WEEK,
    booking: {
      ...DEFAULT_SETTINGS,
      maxParty: num(d.max_personen, DEFAULT_SETTINGS.maxParty),
      maxGuests: num(d.max_gaeste, DEFAULT_SETTINGS.maxGuests),
      maxTables: num(d.max_tische, DEFAULT_SETTINGS.maxTables),
      duration: num(d.dauer, DEFAULT_SETTINGS.duration),
      autoConfirm: num(d.sofort_bis, DEFAULT_SETTINGS.autoConfirm),
    },
    noShow: d.storno_text || SITE_DEFAULTS.noShow,
    payment: d.zahlung_text || SITE_DEFAULTS.payment,
    instagram: d.instagram || '',
    facebook: d.facebook || '',
  };
  siteCache = { at: Date.now(), value };
  return value;
}

// ---------- closures ----------
export async function getExceptions(): Promise<Exception[]> {
  const rows = await list('schliesstage', { limit: 100, orderBy: { von: 'asc' } });
  const out: Exception[] = [];
  for (const e of rows) {
    const d = e.data ?? {};
    const from = berlin(d.von)?.date;
    if (!from) continue;
    const to = berlin(d.bis)?.date ?? from;
    const windows: Window[] = (Array.isArray(d.zeiten) ? d.zeiten : [])
      .filter((z: Any) => isTime(z?.von) && isTime(z?.bis))
      .map((z: Any) => ({ from: z.von, to: z.bis, last: isTime(z.letzte) ? z.letzte : z.bis }));
    out.push({
      from,
      to: to < from ? from : to,
      kind: d.art === 'Sonderzeiten' ? 'hours' : 'closed',
      windows,
      note: d.hinweis_gaeste || d.title || undefined,
    });
  }
  return out;
}

// ---------- events ----------
const TYPE: Record<string, DayType | 'none'> = {
  Normal: 'none',
  'Eingeschränkte Karte': 'eingeschraenkte-karte',
  'Kein à la carte': 'kein-ala-carte',
  'Geschlossene Gesellschaft': 'closed',
};

export interface EventItem {
  id: string; // database id (stable key for sign-ups)
  slug: string;
  title: string;
  date: string;
  start: string;
  end: string;
  teaser: string;
  body: unknown;
  price: string;
  image: unknown;
  seats: number; // 0 = no sign-up
  type: DayType | 'none';
  home: boolean;
  isPrivate: boolean;
  kind: EventKind;
  occurrenceOf?: string; // set on repeated dates
}

function expand(base: EventItem, rule: string, until: string | null): EventItem[] {
  if (!rule || rule === 'Keine' || !until) return [base];
  const out = [base];
  const step = rule === 'Wöchentlich' ? 7 : rule === 'Alle 2 Wochen' ? 14 : 0;
  let date = base.date;
  for (let i = 0; i < 60; i++) {
    if (step) date = addDays(date, step);
    else {
      // Monthly on the same weekday of the month (e.g. 1st Sunday) – the old plugin copied the date number instead.
      const d = new Date(base.date + 'T12:00:00Z');
      const nth = Math.floor((d.getUTCDate() - 1) / 7);
      const m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + i + 1, 1, 12));
      const shift = (d.getUTCDay() - m.getUTCDay() + 7) % 7;
      m.setUTCDate(1 + shift + nth * 7);
      if (m.getUTCMonth() !== (d.getUTCMonth() + i + 1) % 12) continue; // no 5th weekday this month
      date = m.toISOString().slice(0, 10);
    }
    if (date > until) break;
    out.push({ ...base, date, occurrenceOf: base.slug });
  }
  return out;
}

let eventCache: { at: number; value: EventItem[] } | null = null;
/** All events incl. repeated dates, sorted by date. Includes private ones (filter with publicEvents()). */
export async function getEvents(): Promise<EventItem[]> {
  if (eventCache && Date.now() - eventCache.at < 5_000) return eventCache.value;
  const rows = await list('veranstaltungen', { limit: 100, orderBy: { beginn: 'asc' } });
  const out: EventItem[] = [];
  for (const e of rows) {
    const d = e.data ?? {};
    const b = berlin(d.beginn);
    if (!b || !d.title) continue;
    const end = berlin(d.ende);
    const base: EventItem = {
      id: String(d.id ?? e.id),
      slug: String(e.id),
      title: String(d.title),
      date: b.date,
      start: b.time,
      end: end?.time ?? '',
      teaser: tidy(d.kurztext),
      body: tidyPT(d.inhalt),
      price: tidy(d.preis),
      image: d.bild,
      seats: Number(d.plaetze) > 0 ? Number(d.plaetze) : 0,
      type: TYPE[d.auswirkung] ?? 'none',
      home: d.startseite !== false,
      isPrivate: d.privat === true,
      kind: eventKind(d.art, String(d.title), tidy(d.kurztext)),
    };
    out.push(...expand(base, d.wiederholung, berlin(d.wiederholung_bis)?.date ?? null));
  }
  out.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  eventCache = { at: Date.now(), value: out };
  return out;
}

export const upcoming = (events: EventItem[], today = nowBerlin().date) =>
  events.filter((e) => !e.isPrivate && e.date >= today);

export function dayEvents(events: EventItem[]): DayEvent[] {
  return events
    .filter((e) => e.type !== 'none' || !e.isPrivate)
    .map((e) => ({
      date: e.date,
      title: e.isPrivate ? 'Geschlossene Gesellschaft' : e.title,
      slug: e.isPrivate ? '' : e.slug,
      type: e.type === 'none' ? 'event' : e.type,
      start: e.start,
      end: e.end,
    }));
}

export async function getEvent(slug: string) {
  const all = await getEvents();
  return all.find((e) => e.slug === slug && !e.occurrenceOf) ?? null;
}

// ---------- menus ----------
export interface Dish {
  name: string;
  text: string;
  price: string;
}
export interface MenuCard {
  slug: string;
  title: string;
  subtitle: string;
  valid: string;
  main: boolean;
  order: number;
  image: unknown;
  intro: string;
  note: string;
  sections: { title: string; dishes: Dish[] }[];
}
export async function getMenus(): Promise<MenuCard[]> {
  const rows = await list('speisekarten', { limit: 100 });
  return rows
    .map((e) => {
      const d = e.data ?? {};
      const sections: MenuCard['sections'] = [];
      for (const r of Array.isArray(d.gerichte) ? d.gerichte : []) {
        if (!r?.name) continue;
        if (r.abschnitt || !sections.length) sections.push({ title: r.abschnitt || '', dishes: [] });
        sections[sections.length - 1].dishes.push({
          name: tidy(r.name),
          text: tidy(r.beschreibung),
          price: tidy(r.preis),
        });
      }
      return {
        slug: String(e.id),
        title: String(d.title || ''),
        subtitle: d.untertitel || '',
        valid: d.gueltig || '',
        main: d.hauptkarte === true,
        order: Number(d.reihenfolge) || 10,
        image: d.bild,
        intro: d.einleitung || '',
        note: d.hinweis || '',
        sections,
      };
    })
    .filter((m) => m.title)
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

// ---------- news, rooms, page texts ----------
export async function getNews() {
  const rows = await list('neuigkeiten', { limit: 10, orderBy: { updated_at: 'desc' } });
  const e = rows.find((r) => r.data?.startseite !== false);
  if (!e) return null;
  const d = e.data;
  return {
    title: String(d.title),
    body: tidyPT(d.text),
    image: d.bild,
    buttonText: d.button_text || '',
    buttonLink: d.button_link || '',
    sign: d.gruss ?? 'Euer Team Bongsiel',
  };
}

export async function getRooms() {
  const rows = await list('zimmer', { limit: 50 });
  return rows
    .map((e) => ({
      slug: String(e.id),
      title: String(e.data?.title || ''),
      text: e.data?.kurztext || '',
      image: e.data?.bild,
      persons: Number(e.data?.personen) || 0,
      price: e.data?.preis || '',
      features: String(e.data?.ausstattung || '')
        .split(/\n+/)
        .map((s) => s.trim())
        .filter(Boolean),
      link: e.data?.link || '',
      order: Number(e.data?.reihenfolge) || 10,
    }))
    .filter((r) => r.title)
    .sort((a, b) => a.order - b.order);
}

export async function getPageText(slug: string) {
  try {
    const { entry } = await getEmDashEntry('seiten' as never, slug);
    if (!entry) return null;
    const d = (entry as Any).data;
    return { title: String(d.title || ''), intro: tidy(d.einleitung), body: tidyPT(d.inhalt), image: d.bild };
  } catch {
    return null;
  }
}

/** Plain text from Portable Text (for meta descriptions, mails). */
export function ptText(v: unknown): string {
  if (!Array.isArray(v)) return typeof v === 'string' ? v : '';
  return v
    .map((b: Any) => (Array.isArray(b?.children) ? b.children.map((c: Any) => c?.text ?? '').join('') : ''))
    .join('\n\n')
    .trim();
}
export const hasPT = (v: unknown) => ptText(v).length > 0;

// ---------- one call for everything the booking rules need ----------
export async function getBookingContext() {
  const [site, exceptions, events] = await Promise.all([getSite(), getExceptions(), getEvents()]);
  return { site, exceptions, events, days: dayEvents(events) };
}
