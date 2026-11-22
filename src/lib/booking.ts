/**
 * Booking rules for table reservations (replaces Five Star + REBB).
 * Pure functions: the same code runs on the server (validation, API) and in the browser (date strip, slots).
 * All dates are local German dates "YYYY-MM-DD"; times "HH:MM". Time zone is always Europe/Berlin.
 */

export const TZ = 'Europe/Berlin';
export const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'] as const;
export const WEEKDAYS_LONG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'] as const;

export interface Window {
  from: string; // opening, e.g. 17:00
  to: string; // closing, e.g. 22:00
  last: string; // last reservation start, e.g. 20:00
}
export interface WeekRule extends Window {
  day: number; // 0 = Sunday … 6 = Saturday
}
/** A closed day / range, or special hours on those days. */
export interface Exception {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD (same as from for one day)
  kind: 'closed' | 'hours';
  windows?: Window[]; // for kind 'hours'
  note?: string; // shown to guests, e.g. "Betriebsferien"
}
export type DayType = 'closed' | 'kein-ala-carte' | 'eingeschraenkte-karte' | 'event';
export interface DayEvent {
  date: string;
  title: string;
  slug: string;
  type: DayType | 'none';
  start?: string;
  end?: string;
}
export interface BookingSettings {
  interval: number; // minutes between slots
  leadMinutes: number; // earliest booking ahead of time
  maxParty: number;
  duration: number; // minutes a table is occupied
  maxTables: number; // reservations overlapping one slot
  maxGuests: number; // guests overlapping one slot
  autoConfirm: number; // parties up to this size are confirmed at once
  daysAhead: number; // how far ahead guests may book
}
export const DEFAULT_SETTINGS: BookingSettings = {
  interval: 15,
  leadMinutes: 30,
  maxParty: 10,
  duration: 105,
  maxTables: 13,
  maxGuests: 40,
  autoConfirm: 6,
  daysAhead: 120,
};
/** Current rules on mein-ziel-bongsiel.de (Five Star, Nov 2026) as the fallback when the admin is empty. */
export const DEFAULT_WEEK: WeekRule[] = [
  { day: 4, from: '17:00', to: '22:00', last: '20:00' },
  { day: 5, from: '17:00', to: '22:00', last: '20:00' },
  { day: 6, from: '17:00', to: '22:00', last: '20:00' },
  { day: 0, from: '11:00', to: '14:00', last: '13:00' },
  { day: 0, from: '17:00', to: '22:00', last: '20:00' },
];

export interface Booked {
  date: string;
  time: string;
  party: number;
}

// ---------- time helpers ----------
export const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
};
export const toTime = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

/** Today's date and minutes in Berlin, independent of the server's zone. */
export function nowBerlin(d = new Date()) {
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
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute) };
}
export function addDays(date: string, n: number) {
  const d = new Date(date + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export const weekday = (date: string) => new Date(date + 'T12:00:00Z').getUTCDay();
export const isDate = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
export const isTime = (s: unknown): s is string => typeof s === 'string' && /^\d{2}:\d{2}$/.test(s);

export function formatDate(date: string, style: 'short' | 'long' | 'day' = 'long') {
  const d = new Date(date + 'T12:00:00Z');
  if (style === 'day') return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()}.${d.getUTCMonth() + 1}.`;
  return new Intl.DateTimeFormat('de-DE', {
    timeZone: 'UTC',
    weekday: style === 'long' ? 'long' : 'short',
    day: 'numeric',
    month: style === 'long' ? 'long' : '2-digit',
    ...(style === 'long' ? { year: 'numeric' } : {}),
  }).format(d);
}

// ---------- rules ----------
const PRIORITY: Record<string, number> = {
  closed: 4,
  'kein-ala-carte': 3,
  'eingeschraenkte-karte': 2,
  event: 1,
  none: 0,
};

export interface DayInfo {
  date: string;
  open: boolean;
  windows: Window[];
  note?: string; // reason when closed or special
  type: DayType | 'none'; // strongest event effect of the day
  events: DayEvent[];
}

export function dayInfo(date: string, week: WeekRule[], exceptions: Exception[], events: DayEvent[] = []): DayInfo {
  const dayEvents = events.filter((e) => e.date === date);
  const type = dayEvents.reduce<DayInfo['type']>(
    (best, e) => (PRIORITY[e.type] > PRIORITY[best] ? e.type : best),
    'none',
  );
  let windows: Window[] = week.filter((r) => r.day === weekday(date)).sort((a, b) => toMin(a.from) - toMin(b.from));
  let note: string | undefined;
  const ex = exceptions.filter((x) => x.from <= date && date <= (x.to || x.from));
  // A closed exception wins over special hours.
  const closed = ex.find((x) => x.kind === 'closed');
  const hours = ex.find((x) => x.kind === 'hours');
  if (closed) {
    windows = [];
    note = closed.note || 'Geschlossen';
  } else if (hours) {
    windows = hours.windows ?? [];
    note = hours.note;
  }
  if (type === 'closed') {
    windows = [];
    note = 'Geschlossene Gesellschaft';
  }
  return { date, open: windows.length > 0, windows, note, type, events: dayEvents };
}

/** All bookable start times of a day, minus slots that are full or too soon. */
export function slots(
  info: DayInfo,
  settings: BookingSettings,
  booked: Booked[],
  party: number,
  now = nowBerlin(),
): { time: string; free: boolean }[] {
  if (!info.open) return [];
  const out: { time: string; free: boolean }[] = [];
  const day = booked.filter((b) => b.date === info.date);
  for (const w of info.windows) {
    for (let m = toMin(w.from); m <= toMin(w.last); m += settings.interval) {
      if (info.date === now.date && m < now.minutes + settings.leadMinutes) continue;
      if (info.date < now.date) continue;
      const overlap = day.filter((b) => Math.abs(toMin(b.time) - m) < settings.duration);
      const free =
        overlap.length < settings.maxTables && overlap.reduce((s, b) => s + b.party, 0) + party <= settings.maxGuests;
      out.push({ time: toTime(m), free });
    }
  }
  return out;
}

/** Server-side check of one requested reservation. Returns an error text or null. */
export function checkRequest(
  req: { date: string; time: string; party: number },
  info: DayInfo,
  settings: BookingSettings,
  booked: Booked[],
  now = nowBerlin(),
): string | null {
  if (!Number.isInteger(req.party) || req.party < 1 || req.party > settings.maxParty)
    return `Online bis ${settings.maxParty} Personen – größere Gruppen bitte telefonisch.`;
  if (req.date > addDays(now.date, settings.daysAhead))
    return 'So weit im Voraus nehmen wir noch keine Reservierungen an.';
  if (!info.open) return 'An diesem Tag nehmen wir keine Reservierungen an.';
  const slot = slots(info, settings, booked, req.party, now).find((s) => s.time === req.time);
  if (!slot) return 'Diese Uhrzeit ist nicht buchbar.';
  if (!slot.free) return 'Zu dieser Uhrzeit sind wir leider ausgebucht.';
  return null;
}

/** Opening hours for display, grouped: "Do – Sa 17:00 – 22:00". */
export function hoursSummary(week: WeekRule[]) {
  const byDay = new Map<number, string>();
  for (const d of [1, 2, 3, 4, 5, 6, 0]) {
    const w = week.filter((r) => r.day === d).sort((a, b) => toMin(a.from) - toMin(b.from));
    if (w.length) byDay.set(d, w.map((x) => `${x.from} – ${x.to}`).join('\n'));
  }
  const rows: { days: string; hours: string }[] = [];
  let run: number[] = [];
  const order = [1, 2, 3, 4, 5, 6, 0];
  const flush = () => {
    if (!run.length) return;
    const label = run.length > 1 ? `${WEEKDAYS[run[0]]} – ${WEEKDAYS[run[run.length - 1]]}` : WEEKDAYS_LONG[run[0]];
    rows.push({ days: label, hours: byDay.get(run[0])! });
    run = [];
  };
  for (const d of order) {
    const h = byDay.get(d);
    if (h && run.length && byDay.get(run[0]) === h) run.push(d);
    else {
      flush();
      if (h) run = [d];
    }
  }
  flush();
  return rows;
}

/** "Heute geöffnet bis 22:00" / "Heute ab 17:00" / "Heute Ruhetag" for the header chip. */
export function statusLine(info: DayInfo, now = nowBerlin()) {
  if (!info.open) return { open: false, text: info.note && info.note !== 'Geschlossen' ? info.note : 'Heute Ruhetag' };
  const cur = info.windows.find((w) => now.minutes >= toMin(w.from) && now.minutes < toMin(w.to));
  if (cur) return { open: true, text: `Jetzt geöffnet bis ${cur.to}` };
  const next = info.windows.find((w) => now.minutes < toMin(w.from));
  if (next) return { open: false, text: `Heute ab ${next.from} geöffnet` };
  return { open: false, text: 'Heute geschlossen' };
}

/** Seating wishes offered on the form (same as the old Five Star field "Räumlichkeiten"). */
export const ROOMS = [
  'ohne Präferenz',
  'Restaurant (vorne)',
  'Restaurant (Kaminzimmer)',
  'Saal',
  'Biergarten',
  'GastroFass',
];
