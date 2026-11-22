/** POST /api/reservierung – a guest books a table. Stored first, then mailed. */
import type { APIRoute } from 'astro';
import { getBookingContext } from '../../lib/cms';
import { ROOMS, checkRequest, dayInfo, formatDate, isDate, isTime, nowBerlin } from '../../lib/booking';
import { bookedBetween } from '../../lib/service';
import { locked, cleanupIfDue } from '../../lib/db';
import { int, isEmail, isPhone, json, rateLimited, readBody, str, truthy } from '../../lib/api';
import { RESTAURANT, send } from '../../lib/mail';

export const POST: APIRoute = async ({ request }) => {
  if (rateLimited(request, 'res')) return json({ message: 'Zu viele Anfragen. Bitte später erneut versuchen.' }, 429);
  const b = await readBody(request);
  if (str(b.website)) return json({ message: 'Danke!' }); // honeypot
  const date = str(b.datum, 10);
  const time = str(b.zeit, 5);
  const party = int(b.personen);
  const name = str(b.name, 120);
  const phone = str(b.telefon, 40);
  const email = str(b.email, 160);
  const room = ROOMS.includes(str(b.raum)) ? str(b.raum) : 'ohne Präferenz';
  const note = str(b.notiz, 1000);
  if (!isDate(date) || !isTime(time)) return json({ message: 'Bitte Datum und Uhrzeit wählen.' }, 400);
  if (name.length < 2) return json({ message: 'Bitte deinen Namen angeben.' }, 400);
  if (!isEmail(email)) return json({ message: 'Bitte eine gültige E-Mail-Adresse angeben.' }, 400);
  if (!isPhone(phone)) return json({ message: 'Bitte eine Telefonnummer angeben.' }, 400);

  const ctx = await getBookingContext();
  const now = nowBerlin();
  cleanupIfDue(now.date);
  const info = dayInfo(date, ctx.site.week, ctx.exceptions, ctx.days);
  let id = 0;
  let status = 'bestaetigt';
  try {
    const err = locked((db) => {
      const e = checkRequest({ date, time, party }, info, ctx.site.booking, bookedBetween(date, date), now);
      if (e) return e;
      // Same guest, same day and time, still active: almost always a double submit.
      const dup = db
        .prepare(
          `SELECT id FROM reservations WHERE date = ? AND time = ? AND status NOT IN ('storniert','no-show') AND (lower(email) = lower(?) OR replace(phone,' ','') = replace(?,' ',''))`,
        )
        .get(date, time, email, phone);
      if (dup) return 'Für diese Uhrzeit habt ihr schon einen Tisch reserviert. Änderungen gern telefonisch.';
      status = party <= ctx.site.booking.autoConfirm ? 'bestaetigt' : 'angefragt';
      const r = db
        .prepare(
          `INSERT INTO reservations (date,time,party,name,phone,email,room,note,status,source,newsletter) VALUES (?,?,?,?,?,?,?,?,?,'online',?)`,
        )
        .run(date, time, party, name, phone, email, room, note, status, truthy(b.newsletter) ? 1 : 0);
      id = Number(r.lastInsertRowid);
      if (truthy(b.newsletter))
        db.prepare(`INSERT OR IGNORE INTO subscribers (email,name,source) VALUES (?,?,'reservierung')`).run(
          email,
          name,
        );
      return null;
    });
    if (err) return json({ message: err }, 409);
  } catch (e) {
    console.error('[reservierung]', e);
    return json({ message: 'Das hat leider nicht geklappt. Bitte ruf uns an.' }, 500);
  }

  const when = `${formatDate(date)} um ${time} Uhr`;
  const confirmed = status === 'bestaetigt';
  const lines = [
    `Moin ${name},`,
    '',
    confirmed
      ? `eure Reservierung ist bestätigt: ${when}, ${party} ${party === 1 ? 'Person' : 'Personen'}.`
      : `danke für eure Anfrage: ${when}, ${party} Personen. Wir melden uns kurz, sobald der Tisch bestätigt ist.`,
    room !== 'ohne Präferenz' ? `Platzwunsch: ${room} (wird bei freien Kapazitäten berücksichtigt).` : '',
    note ? `Eure Nachricht: ${note}` : '',
    '',
    ctx.site.noShow,
    '',
    `Bis bald in Bongsiel!`,
    `Dat swarte Peerd · ${ctx.site.address.join(' · ')} · ${ctx.site.phone}`,
  ].filter((l, i, a) => l !== '' || a[i - 1] !== '');
  await Promise.all([
    send(email, confirmed ? `Reservierung bestätigt: ${when}` : `Reservierungsanfrage: ${when}`, lines.join('\n')),
    send(
      RESTAURANT,
      `${confirmed ? 'Neue Reservierung' : 'ANFRAGE'}: ${formatDate(date, 'day')} ${time} – ${party} Pers. – ${name}`,
      [
        `${when}`,
        `${party} Personen`,
        `${name} · ${phone} · ${email}`,
        `Platz: ${room}`,
        note && `Notiz: ${note}`,
        '',
        `Liste: /admin/?datum=${date}`,
      ]
        .filter(Boolean)
        .join('\n'),
      email,
    ),
  ]);
  return json({
    id,
    status,
    message: confirmed
      ? `Danke, ${name.split(' ')[0]}! Euer Tisch am ${when} ist reserviert. Die Bestätigung kommt per E-Mail.`
      : `Danke! Eure Anfrage für ${when} ist bei uns. Bei ${party} Personen bestätigen wir kurz persönlich.`,
  });
};
