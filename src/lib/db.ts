/**
 * Operational data (not editorial content): reservations, event sign-ups, enquiries, newsletter sign-ups.
 * Lives in its own SQLite file next to the EmDash database: `${DATA_DIR}/service.db`.
 * Uses Node's built-in `node:sqlite` (Node >= 22.13), so there is no native dependency to build on Hostinger.
 */
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dataDir } from './paths';

let db: DatabaseSync | null = null;

export function getDb() {
  if (db) return db;
  const dir = dataDir();
  mkdirSync(dir, { recursive: true });
  db = new DatabaseSync(`${dir}/service.db`);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 4000;
    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL, time TEXT NOT NULL, party INTEGER NOT NULL,
      name TEXT NOT NULL, phone TEXT, email TEXT,
      room TEXT, note TEXT, table_no TEXT,
      status TEXT NOT NULL DEFAULT 'bestaetigt', -- angefragt | bestaetigt | angekommen | storniert | no-show
      source TEXT NOT NULL DEFAULT 'online',      -- online | telefon
      newsletter INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_res_date ON reservations(date);
    CREATE TABLE IF NOT EXISTS signups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_slug TEXT NOT NULL, event_title TEXT NOT NULL, event_date TEXT NOT NULL,
      first_name TEXT NOT NULL, last_name TEXT NOT NULL, phone TEXT, email TEXT,
      persons INTEGER NOT NULL, note TEXT,
      status TEXT NOT NULL DEFAULT 'angemeldet', -- angemeldet | storniert
      source TEXT NOT NULL DEFAULT 'online',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_sign_event ON signups(event_slug);
    CREATE TABLE IF NOT EXISTS enquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT NOT NULL,          -- zimmer | feier
      name TEXT NOT NULL, phone TEXT, email TEXT,
      date_from TEXT, date_to TEXT, persons INTEGER, topic TEXT, message TEXT,
      status TEXT NOT NULL DEFAULT 'neu', -- neu | erledigt
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE, name TEXT,
      source TEXT NOT NULL DEFAULT 'website',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return db;
}

/** Run fn inside an IMMEDIATE transaction: the write lock is taken first, so two guests cannot take the last seat. */
export function locked<T>(fn: (db: DatabaseSync) => T): T {
  const d = getDb();
  d.exec('BEGIN IMMEDIATE');
  try {
    const out = fn(d);
    d.exec('COMMIT');
    return out;
  } catch (e) {
    d.exec('ROLLBACK');
    throw e;
  }
}

/** GDPR: guest data is deleted 30 days after the visit / event. Runs at most once a day, from normal requests. */
let lastCleanup = '';
export function cleanupIfDue(today: string) {
  if (lastCleanup === today) return;
  lastCleanup = today;
  const d = getDb();
  d.prepare(`DELETE FROM reservations WHERE date < date(?, '-30 days')`).run(today);
  d.prepare(`DELETE FROM signups WHERE event_date < date(?, '-30 days')`).run(today);
  d.prepare(`DELETE FROM enquiries WHERE created_at < date(?, '-180 days')`).run(today);
}
