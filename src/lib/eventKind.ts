/** Event types: a small icon, a label and an accent colour, so a card says what it is at a glance. */
export interface EventKind {
  key: string;
  label: string;
  color: string;
  icon: string; // SVG path data, 24x24 stroke icon
}

export const KINDS: EventKind[] = [
  {
    key: 'silvester',
    label: 'Silvester',
    color: '#2f5080',
    icon: 'M9 3h6l-.5 7a2.5 2.5 0 0 1-5 0L9 3zM12 12.5V19M9 19h6M18 4v3M16.5 5.5h3M5 5v2M4 6h2',
  },
  {
    key: 'brunch',
    label: 'Brunch',
    color: '#c9833f',
    icon: 'M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V9zM16 10h2a2.5 2.5 0 0 1 0 5h-2M8 3c0 1.5 1.5 1.5 1.5 3M12 3c0 1.5 1.5 1.5 1.5 3',
  },
  {
    key: 'advent',
    label: 'Advent',
    color: '#9a4a35',
    icon: 'M12 2.5c1.2 1.6 1.6 2.6 0 4-1.6-1.4-1.2-2.4 0-4zM9 9h6v11H9zM7 20h10',
  },
  {
    key: 'burger',
    label: 'Burger',
    color: '#c9833f',
    icon: 'M4 11a8 6 0 0 1 16 0H4zM4 14h16M5 17h14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z',
  },
  { key: 'wein', label: 'Wein', color: '#7a3050', icon: 'M7 3h10c0 5-1.5 8-5 8S7 8 7 3zM12 11v8M8 21h8' },
  {
    key: 'fisch',
    label: 'Fisch & Meer',
    color: '#2f5080',
    icon: 'M3 12c3-5 8-6 12-3l5-3v12l-5-3c-4 3-9 2-12-3zM7.5 11h.01',
  },
  { key: 'wild', label: 'Wild & Herbst', color: '#6b7a47', icon: 'M12 3l5 7h-3l4 6H6l4-6H7l5-7zM12 16v5' },
  {
    key: 'grill',
    label: 'Grill',
    color: '#9a4a35',
    icon: 'M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 2 2 2-1-3 0-6 1-8z',
  },
  {
    key: 'musik',
    label: 'Musik',
    color: '#2f5080',
    icon: 'M9 18V6l10-2v12M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM19 16a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z',
  },
  {
    key: 'lesung',
    label: 'Lesung & Bühne',
    color: '#7a3050',
    icon: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5zM8 7h7M8 11h7',
  },
  { key: 'watt', label: 'Watt & Natur', color: '#6b7a47', icon: 'M3 17c3-3 5 3 9 0s6-3 9 0M3 12c3-3 5 3 9 0s6-3 9 0' },
  { key: 'buffet', label: 'Buffet & Menü', color: '#9a4a35', icon: 'M3 18h18M5 18a7 7 0 0 1 14 0M12 8V6M10.5 6h3' },
  {
    key: 'event',
    label: 'Veranstaltung',
    color: '#6b7a47',
    icon: 'M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4l-5.3 3 1.2-6L3.4 9.3l6-.7L12 3z',
  },
];

// First match wins, so the specific words (Silvester) come before the general ones (Buffet).
const WORDS: [string, RegExp][] = [
  ['silvester', /silvester|neujahr/],
  ['brunch', /brunch|frühstück/],
  ['advent', /advent|weihnacht|nikolaus|xmas/],
  ['burger', /burger/],
  ['wein', /wein|sekt|champagner/],
  ['fisch', /fisch|muschel|aal\b|matjes|krabben|scholle|meeresfr/],
  ['wild', /wild|gans|ente\b|martins|kürbis|pilz/],
  ['grill', /grill|dexter|bbq|steak/],
  ['musik', /musik|konzert|live|band\b|chor/],
  ['lesung', /lesung|kabarett|comedy|theater|krimi|verbrechen|quiz/],
  ['watt', /watt|wanderung|halligflut/],
  ['buffet', /buffet|menü|menu/],
];

/** `art` is the editor's choice in EmDash (optional); otherwise the kind is guessed from the words in title and teaser. */
export function eventKind(art: unknown, title: string, teaser = ''): EventKind {
  const set = (k: string) => KINDS.find((x) => x.key === k || x.label === k);
  if (typeof art === 'string' && art && art !== 'Automatisch') {
    const k = set(art);
    if (k) return k;
  }
  const text = `${title} ${teaser}`.toLowerCase();
  for (const [key, re] of WORDS) if (re.test(text)) return set(key)!;
  return set('event')!;
}
