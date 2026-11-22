/** POST /api/newsletter – Deichpost sign-up (list exported from the admin; sending stays external for now). */
import type { APIRoute } from 'astro';
import { getDb } from '../../lib/db';
import { isEmail, json, rateLimited, readBody, str, truthy } from '../../lib/api';

export const POST: APIRoute = async ({ request }) => {
  if (rateLimited(request, 'news')) return json({ message: 'Zu viele Anfragen. Bitte später erneut versuchen.' }, 429);
  const b = await readBody(request);
  if (str(b.website)) return json({ message: 'Danke!' });
  const email = str(b.email, 160).toLowerCase();
  if (!isEmail(email)) return json({ message: 'Bitte eine gültige E-Mail-Adresse angeben.' }, 400);
  if (!truthy(b.consent)) return json({ message: 'Bitte die Einwilligung bestätigen.' }, 400);
  getDb()
    .prepare(`INSERT OR IGNORE INTO subscribers (email,name,source) VALUES (?,?,'website')`)
    .run(email, str(b.name, 80));
  return json({ message: 'Danke! Du bist für die Deichpost angemeldet.' });
};
