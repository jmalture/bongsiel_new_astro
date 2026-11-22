/** Helpers for the public form endpoints: JSON replies, honeypot, rate limit, field cleaning. */

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

const hits = new Map<string, number[]>();
/** At most `max` requests per IP in `windowMs` (relaxed in dev so repeated tests pass). */
export function rateLimited(request: Request, key: string, max = 6, windowMs = 10 * 60_000) {
  if (import.meta.env.DEV) max *= 20;
  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'local';
  const id = `${key}:${ip}`;
  const now = Date.now();
  const list = (hits.get(id) || []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(id, list);
  if (hits.size > 5000) hits.clear();
  return list.length > max;
}

export async function readBody(request: Request): Promise<Record<string, unknown>> {
  const type = request.headers.get('content-type') || '';
  try {
    if (type.includes('application/json')) return (await request.json()) as Record<string, unknown>;
    return Object.fromEntries((await request.formData()).entries());
  } catch {
    return {};
  }
}

export const str = (v: unknown, max = 200) =>
  String(v ?? '')
    .trim()
    .slice(0, max);
export const int = (v: unknown) => {
  const n = Number(v);
  return Number.isInteger(n) ? n : NaN;
};
export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
export const isPhone = (s: string) => /^[+\d][\d\s/()-]{5,}$/.test(s);
export const truthy = (v: unknown) => v === true || v === 'on' || v === '1' || v === 'true';
