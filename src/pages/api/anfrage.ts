/** POST /api/anfrage – room or celebration enquiry. */
import type { APIRoute } from 'astro';
import { getDb } from '../../lib/db';
import { int, isEmail, isPhone, json, rateLimited, readBody, str, truthy } from '../../lib/api';
import { RESTAURANT, send } from '../../lib/mail';
import { isDate } from '../../lib/booking';

export const POST: APIRoute = async ({ request }) => {
  if (rateLimited(request, 'ask')) return json({ message: 'Zu viele Anfragen. Bitte später erneut versuchen.' }, 429);
  const b = await readBody(request);
  if (str(b.website)) return json({ message: 'Danke!' });
  const kind = str(b.art) === 'zimmer' ? 'zimmer' : 'feier';
  const name = str(b.name, 120);
  const phone = str(b.telefon, 40);
  const email = str(b.email, 160);
  const from = str(b.von, 10);
  const to = str(b.bis, 10);
  const persons = int(b.personen);
  const topic = str(b.thema, 120);
  const message = str(b.nachricht, 2000);
  if (name.length < 2) return json({ message: 'Bitte deinen Namen angeben.' }, 400);
  if (!isEmail(email)) return json({ message: 'Bitte eine gültige E-Mail-Adresse angeben.' }, 400);
  if (phone && !isPhone(phone)) return json({ message: 'Die Telefonnummer sieht nicht richtig aus.' }, 400);
  if (!isDate(from))
    return json(
      { message: kind === 'zimmer' ? 'Bitte das Anreisedatum wählen.' : 'Bitte das Datum der Feier wählen.' },
      400,
    );
  if (kind === 'zimmer' && (!isDate(to) || to <= from))
    return json({ message: 'Bitte ein Abreisedatum nach der Anreise wählen.' }, 400);
  if (!truthy(b.consent)) return json({ message: 'Bitte die Datenschutzerklärung bestätigen.' }, 400);
  getDb()
    .prepare(
      `INSERT INTO enquiries (kind,name,phone,email,date_from,date_to,persons,topic,message) VALUES (?,?,?,?,?,?,?,?,?)`,
    )
    .run(
      kind,
      name,
      phone,
      email,
      from,
      kind === 'zimmer' ? to : null,
      Number.isInteger(persons) ? persons : null,
      topic,
      message,
    );
  const subject =
    kind === 'zimmer' ? `Zimmeranfrage ${from} – ${to}` : `Anfrage Feier ${from}${topic ? ` (${topic})` : ''}`;
  await send(
    RESTAURANT,
    `${subject} – ${name}`,
    `${name} · ${phone} · ${email}\nPersonen: ${persons || '–'}\n\n${message}`,
    email,
  );
  await send(
    email,
    'Eure Anfrage bei Mein Ziel Bongsiel',
    `Moin ${name},\n\ndanke für eure Anfrage (${subject}). Wir melden uns so schnell wie möglich.\n\nEuer Team Bongsiel`,
  );
  return json({ message: 'Danke! Eure Anfrage ist bei uns – wir melden uns so schnell wie möglich.' });
};
