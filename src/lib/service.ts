/** Read helpers over the service database used by public pages (free seats, booked slots). */
import { getDb } from './db';
import type { Booked } from './booking';

/** Persons signed up for one event date (cancelled ones excluded). */
export function seatsTaken(slug: string, date: string): number {
  const row = getDb()
    .prepare(
      `SELECT COALESCE(SUM(persons),0) AS n FROM signups WHERE event_slug = ? AND event_date = ? AND status != 'storniert'`,
    )
    .get(slug, date) as { n: number };
  return Number(row?.n ?? 0);
}

export function seatsFree(seats: number, slug: string, date: string) {
  return Math.max(0, seats - seatsTaken(slug, date));
}

/** Active reservations between two dates (inclusive), for slot capacity. */
export function bookedBetween(from: string, to: string): Booked[] {
  return getDb()
    .prepare(
      `SELECT date, time, party FROM reservations WHERE date BETWEEN ? AND ? AND status NOT IN ('storniert','no-show')`,
    )
    .all(from, to) as unknown as Booked[];
}
