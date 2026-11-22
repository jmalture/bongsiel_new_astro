/**
 * The service admin (/admin/) uses the EmDash login: EmDash's middleware puts the signed-in user on
 * Astro.locals.user for every route. Staff accounts need at least the Contributor role (20).
 */
export const MIN_ROLE = 20;

type Locals = {
  user?: { id: string; email?: string; name?: string | null; role: number; disabled?: boolean | number };
};

export function staff(locals: unknown) {
  const u = (locals as Locals)?.user;
  if (!u || u.disabled || u.role < MIN_ROLE) return null;
  return u;
}

export const loginUrl = (back: string) => `/_emdash/admin/login?redirect=${encodeURIComponent(back)}`;

export const forbidden = () =>
  new Response(JSON.stringify({ message: 'Bitte zuerst anmelden.' }), {
    status: 401,
    headers: { 'content-type': 'application/json' },
  });
