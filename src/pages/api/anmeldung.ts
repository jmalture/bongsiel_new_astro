/** POST /api/anmeldung – sign-up for an event with limited seats (brunch, buffet). */
import type { APIRoute } from 'astro';
import { getEvents, getSite } from '../../lib/cms';
import { formatDate, isDate, nowBerlin, toMin } from '../../lib/booking';
import { locked, cleanupIfDue } from '../../lib/db';
import { seatsTaken } from '../../lib/service';
import { int, isEmail, isPhone, json, rateLimited, readBody, str, truthy } from '../../lib/api';
import { RESTAURANT, send } from '../../lib/mail';

export const POST: APIRoute = async ({ request }) => {
  if (rateLimited(request, 'sign')) return json({ message: 'Zu viele Anfragen. Bitte später erneut versuchen.' }, 429);
  const b = await readBody(request);
  if (str(b.website)) return json({ message: 'Danke!' });
  const slug = str(b.event, 200);
  const date = str(b.datum, 10);
  const first = str(b.vorname, 80);
  const last = str(b.nachname, 80);
  const phone = str(b.telefon, 40);
  const email = str(b.email, 160);
  const persons = int(b.personen);
  const note = str(b.notiz, 600);
  if (!first || !last) return json({ message: 'Bitte Vor- und Nachnamen angeben.' }, 400);
  if (!isPhone(phone)) return json({ message: 'Bitte eine Telefonnummer angeben.' }, 400);
  if (!isEmail(email)) return json({ message: 'Bitte eine gültige E-Mail-Adresse angeben.' }, 400);
  if (!Number.isInteger(persons) || persons < 1 || persons > 10)
    return json({ message: 'Bitte 1 bis 10 Personen wählen – mehr gern telefonisch.' }, 400);
  if (!truthy(b.consent)) return json({ message: 'Bitte die Datenschutzerklärung bestätigen.' }, 400);

  const events = await getEvents();
  const ev = events.find((e) => (e.occurrenceOf ?? e.slug) === slug && (!isDate(date) || e.date === date)) ?? null;
  if (!ev || !ev.seats || ev.isPrivate)
    return json({ message: 'Für diese Veranstaltung gibt es keine Online-Anmeldung.' }, 400);
  const now = nowBerlin();
  cleanupIfDue(now.date);
  if (ev.date < now.date || (ev.date === now.date && ev.start && toMin(ev.start) <= now.minutes))
    return json({ message: 'Die Anmeldung ist geschlossen – die Veranstaltung hat schon begonnen.' }, 409);

  let free = 0;
  try {
    const err = locked((db) => {
      free = ev.seats - seatsTaken(ev.slug, ev.date);
      if (persons > free) return free > 0 ? `Leider sind nur noch ${free} Plätze frei.` : 'Leider ausgebucht.';
      db.prepare(
        `INSERT INTO signups (event_slug,event_title,event_date,first_name,last_name,phone,email,persons,note) VALUES (?,?,?,?,?,?,?,?,?)`,
      ).run(ev.slug, ev.title, ev.date, first, last, phone, email, persons, note);
      free -= persons;
      return null;
    });
    if (err) return json({ message: err, free }, 409);
  } catch (e) {
    console.error('[anmeldung]', e);
    return json({ message: 'Das hat leider nicht geklappt. Bitte ruf uns an.' }, 500);
  }
  const site = await getSite();
  const when = `${formatDate(ev.date)}${ev.start ? ` um ${ev.start} Uhr` : ''}`;
  const mail = [
    `Moin ${first},`,
    '',
    `ihr seid angemeldet: ${ev.title}, ${when}, ${persons} ${persons === 1 ? 'Person' : 'Personen'}.`,
    ev.price ? `Preis: ${ev.price}` : '',
    site.payment,
    '',
    site.noShow,
    '',
    'Bis bald in Bongsiel!',
    `Dat swarte Peerd · ${site.address.join(' · ')} · ${site.phone}`,
  ].filter((l, i, a) => l !== '' || a[i - 1] !== '');
  await Promise.all([
    send(email, `Anmeldung bestätigt: ${ev.title}`, mail.join('\n')),
    send(
      RESTAURANT,
      `Neue Anmeldung: ${ev.title} – ${persons} Pers.`,
      `${first} ${last} · ${phone} · ${email}\n${note}\nNoch frei: ${free}`,
      email,
    ),
  ]);
  return json({
    free,
    message: `Danke, ${first}! Ihr seid für ${ev.title} am ${formatDate(ev.date)} angemeldet. Die Bestätigung kommt per E-Mail.`,
  });
};
