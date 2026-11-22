/**
 * Service admin behaviour: every [data-act] button and [data-act-form] form posts to /api/admin and
 * reloads the list in place (no full page reload, scroll position kept).
 */
const toastEl = document.querySelector<HTMLElement>('[data-toast]');
let toastTimer = 0;
export function toast(text: string, err = false) {
  if (!toastEl) return;
  toastEl.textContent = text;
  toastEl.classList.toggle('is-err', err);
  toastEl.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastEl.classList.remove('is-on'), 2200);
}

async function post(data: Record<string, unknown>) {
  const res = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(data),
  });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(out.message || 'Fehler');
  return out;
}

/** Re-fetch this page and swap the [data-live-list] region, so the list updates without a jump. */
async function refresh() {
  const html = await (await fetch(location.href, { headers: { 'x-partial': '1' } })).text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  document.querySelectorAll<HTMLElement>('[data-live-list]').forEach((el) => {
    const next = doc.querySelector(`[data-live-list="${el.dataset.liveList}"]`);
    if (next) el.replaceWith(next);
  });
}

document.addEventListener('click', async (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-act]');
  if (!btn) return;
  e.preventDefault();
  if (btn.dataset.confirm && !btn.classList.contains('is-armed')) {
    // Two taps instead of a browser dialog: first tap arms, second confirms.
    btn.classList.add('is-armed');
    const label = btn.textContent;
    btn.textContent = btn.dataset.confirm;
    setTimeout(() => {
      btn.classList.remove('is-armed');
      btn.textContent = label;
    }, 2500);
    return;
  }
  btn.disabled = true;
  try {
    await post(JSON.parse(btn.dataset.act!));
    toast(btn.dataset.done || 'Gespeichert');
    await refresh();
  } catch (err) {
    toast((err as Error).message, true);
    btn.disabled = false;
  }
});

document.addEventListener('submit', async (e) => {
  const form = (e.target as HTMLElement).closest<HTMLFormElement>('form[data-act-form]');
  if (!form) return;
  e.preventDefault();
  const data = { action: form.dataset.actForm, ...Object.fromEntries(new FormData(form).entries()) };
  const btn = form.querySelector<HTMLButtonElement>('[type=submit]');
  if (btn) btn.disabled = true;
  try {
    await post(data);
    toast(form.dataset.done || 'Gespeichert');
    form.reset();
    form.closest('details')?.removeAttribute('open');
    await refresh();
  } catch (err) {
    toast((err as Error).message, true);
  } finally {
    if (btn) btn.disabled = false;
  }
});

// Table number: saved when the field loses focus or Enter is pressed.
document.addEventListener('change', async (e) => {
  const input = (e.target as HTMLElement).closest<HTMLInputElement>('[data-table]');
  if (!input) return;
  try {
    await post({ action: 'res.table', id: Number(input.dataset.table), table: input.value });
    toast('Tisch gespeichert');
  } catch (err) {
    toast((err as Error).message, true);
  }
});

// Date navigator: changing the date input reloads with ?datum=.
document.querySelector<HTMLInputElement>('[data-date-nav]')?.addEventListener('change', (e) => {
  const v = (e.target as HTMLInputElement).value;
  if (v) location.search = `?datum=${v}`;
});

// Auto refresh of today's list every 60 s (new online bookings appear on their own).
if (document.querySelector('[data-autorefresh]'))
  setInterval(() => document.visibilityState === 'visible' && refresh(), 60_000);
