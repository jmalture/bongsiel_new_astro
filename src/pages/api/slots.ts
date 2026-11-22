/** GET /api/slots?datum=YYYY-MM-DD&personen=N → the day's status and bookable times. */
import type { APIRoute } from 'astro';
import { getBookingContext } from '../../lib/cms';
import { dayInfo, isDate, nowBerlin, slots } from '../../lib/booking';
import { bookedBetween } from '../../lib/service';
import { json } from '../../lib/api';

export const GET: APIRoute = async ({ url }) => {
  const date = url.searchParams.get('datum') || '';
  const party = Math.max(1, Math.min(50, Number(url.searchParams.get('personen')) || 2));
  if (!isDate(date)) return json({ message: 'Datum fehlt.' }, 400);
  const ctx = await getBookingContext();
  const info = dayInfo(date, ctx.site.week, ctx.exceptions, ctx.days);
  const list = slots(info, ctx.site.booking, bookedBetween(date, date), party, nowBerlin());
  return new Response(
    JSON.stringify({
      date,
      open: info.open,
      note: info.note ?? null,
      type: info.type,
      events: info.events.map((e) => ({ title: e.title, slug: e.slug, start: e.start, type: e.type })),
      slots: list,
    }),
    { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } },
  );
};
