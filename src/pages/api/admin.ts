/**
 * POST /api/admin – every write of the service admin, one action per request. Needs the EmDash login.
 * GET  /api/admin?export=signups&event=<slug>&datum=<date> | export=subscribers | export=reservations&datum=<date> → CSV
 */
import type { APIRoute } from 'astro';
import { getDb, locked } from '../../lib/db';
import { forbidden, staff } from '../../lib/auth';
import { int, isEmail, json, readBody, str } from '../../lib/api';
import { getEvents } from '../../lib/cms';
import { seatsTaken } from '../../lib/service';
import { isDate, isTime } from '../../lib/booking';

const RES_STATUS = ['angefragt', 'bestaetigt', 'angekommen', 'storniert', 'no-show'];

export const POST: APIRoute = async ({ request, locals }) => {
  if (!staff(locals)) return forbidden();
  const b = await readBody(request);
  const db = getDb();
  const id = int(b.id);
  switch (str(b.action)) {
    case 'res.status': {
      const s = str(b.status);
      if (!RES_STATUS.includes(s)) return json({ message: 'Unbekannter Status.' }, 400);
      db.prepare('UPDATE reservations SET status = ? WHERE id = ?').run(s, id);
      return json({ ok: true });
    }
    case 'res.table': {
      db.prepare('UPDATE reservations SET table_no = ? WHERE id = ?').run(str(b.table, 20), id);
      return json({ ok: true });
    }
    case 'res.create': {
      const date = str(b.datum, 10);
      const time = str(b.zeit, 5);
      const party = int(b.personen);
      const name = str(b.name, 120);
      if (!isDate(date) || !isTime(time) || !(party > 0) || name.length < 2)
        return json({ message: 'Datum, Uhrzeit, Personen und Name ausfüllen.' }, 400);
      const r = db
        .prepare(
          `INSERT INTO reservations (date,time,party,name,phone,email,room,note,table_no,status,source) VALUES (?,?,?,?,?,?,?,?,?,'bestaetigt','telefon')`,
        )
        .run(
          date,
          time,
          party,
          name,
          str(b.telefon, 40),
          str(b.email, 160),
          str(b.raum, 60) || 'ohne Präferenz',
          str(b.notiz, 1000),
          str(b.tisch, 20),
        );
      return json({ ok: true, id: Number(r.lastInsertRowid) });
    }
    case 'res.delete': {
      db.prepare('DELETE FROM reservations WHERE id = ?').run(id);
      return json({ ok: true });
    }
    case 'sign.create': {
      const slug = str(b.event, 200);
      const date = str(b.datum, 10);
      const persons = int(b.personen);
      const name = str(b.name, 160);
      const ev = (await getEvents()).find((e) => e.slug === slug && e.date === date);
      if (!ev) return json({ message: 'Veranstaltung nicht gefunden.' }, 400);
      if (!(persons > 0) || name.length < 2) return json({ message: 'Name und Personen ausfüllen.' }, 400);
      const [first, ...rest] = name.split(' ');
      const err = locked((d) => {
        const free = ev.seats - seatsTaken(ev.slug, ev.date);
        if (ev.seats && persons > free && !b.force) return `Nur noch ${free} Plätze frei.`;
        d.prepare(
          `INSERT INTO signups (event_slug,event_title,event_date,first_name,last_name,phone,email,persons,note,source) VALUES (?,?,?,?,?,?,?,?,?,'telefon')`,
        ).run(
          ev.slug,
          ev.title,
          ev.date,
          first,
          rest.join(' ') || '–',
          str(b.telefon, 40),
          str(b.email, 160),
          persons,
          str(b.notiz, 600),
        );
        return null;
      });
      return err ? json({ message: err }, 409) : json({ ok: true });
    }
    case 'sign.status': {
      const s = str(b.status) === 'storniert' ? 'storniert' : 'angemeldet';
      db.prepare('UPDATE signups SET status = ? WHERE id = ?').run(s, id);
      return json({ ok: true });
    }
    case 'enq.status': {
      db.prepare('UPDATE enquiries SET status = ? WHERE id = ?').run(
        str(b.status) === 'erledigt' ? 'erledigt' : 'neu',
        id,
      );
      return json({ ok: true });
    }
    case 'sub.add': {
      const email = str(b.email, 160).toLowerCase();
      if (!isEmail(email)) return json({ message: 'E-Mail prüfen.' }, 400);
      db.prepare(`INSERT OR IGNORE INTO subscribers (email,name,source) VALUES (?,?,'admin')`).run(
        email,
        str(b.name, 80),
      );
      return json({ ok: true });
    }
    case 'sub.delete': {
      db.prepare('DELETE FROM subscribers WHERE id = ?').run(id);
      return json({ ok: true });
    }
  }
  return json({ message: 'Unbekannte Aktion.' }, 400);
};

const csv = (rows: Record<string, unknown>[], cols: [string, string][]) =>
  '﻿' +
  [
    cols.map((c) => c[1]).join(';'),
    ...rows.map((r) => cols.map(([k]) => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(';')),
  ].join('\r\n');
const file = (body: string, name: string) =>
  new Response(body, {
    headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="${name}"` },
  });

export const GET: APIRoute = async ({ url, locals }) => {
  if (!staff(locals)) return forbidden();
  const db = getDb();
  const kind = url.searchParams.get('export');
  if (kind === 'signups') {
    const slug = url.searchParams.get('event') || '';
    const date = url.searchParams.get('datum') || '';
    const rows = db
      .prepare(`SELECT * FROM signups WHERE event_slug = ? AND event_date = ? ORDER BY last_name, first_name`)
      .all(slug, date) as Record<string, unknown>[];
    return file(
      csv(rows, [
        ['last_name', 'Nachname'],
        ['first_name', 'Vorname'],
        ['persons', 'Personen'],
        ['phone', 'Telefon'],
        ['email', 'E-Mail'],
        ['note', 'Nachricht'],
        ['status', 'Status'],
        ['source', 'Quelle'],
        ['created_at', 'Angemeldet am'],
      ]),
      `anmeldungen-${slug}-${date}.csv`,
    );
  }
  if (kind === 'reservations') {
    const date = url.searchParams.get('datum') || '';
    const rows = db.prepare(`SELECT * FROM reservations WHERE date = ? ORDER BY time`).all(date) as Record<
      string,
      unknown
    >[];
    return file(
      csv(rows, [
        ['time', 'Uhrzeit'],
        ['party', 'Personen'],
        ['name', 'Name'],
        ['table_no', 'Tisch'],
        ['room', 'Platz'],
        ['phone', 'Telefon'],
        ['note', 'Notiz'],
        ['status', 'Status'],
      ]),
      `reservierungen-${date}.csv`,
    );
  }
  if (kind === 'subscribers') {
    const rows = db.prepare(`SELECT * FROM subscribers ORDER BY created_at`).all() as Record<string, unknown>[];
    return file(
      csv(rows, [
        ['email', 'E-Mail'],
        ['name', 'Name'],
        ['source', 'Quelle'],
        ['created_at', 'Angemeldet am'],
      ]),
      'deichpost.csv',
    );
  }
  return json({ message: 'Unbekannter Export.' }, 400);
};
