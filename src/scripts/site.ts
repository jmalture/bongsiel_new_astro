/**
 * Shared behaviour for every public page. Section scripts live next to their section.
 * Without JS everything is visible and usable; with reduced motion nothing moves (see site.css).
 */
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// 1. Reveal: [data-reveal], .bs-lines, .bs-photo[data-wipe], .bs-dike[data-draw] get .is-in / .is-drawn once visible.
//    After it played, [data-reveal] is removed so the element's own transitions work again.
function initReveal() {
  const sel = '[data-reveal], .bs-lines, .bs-photo[data-wipe], [data-draw]';
  const els = [...document.querySelectorAll<HTMLElement>(sel)];
  const finish = (el: HTMLElement) => {
    el.classList.add('is-in', 'is-drawn');
    if (el.hasAttribute('data-reveal')) {
      const i = Number(getComputedStyle(el).getPropertyValue('--i')) || 0;
      window.setTimeout(
        () => {
          el.removeAttribute('data-reveal');
        },
        i * 90 + 1200,
      );
    }
  };
  if (!('IntersectionObserver' in window) || reduceMotion) {
    els.forEach((el) => {
      el.classList.add('is-in', 'is-drawn');
      el.removeAttribute('data-reveal');
    });
    return;
  }
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        finish(e.target as HTMLElement);
      }),
    { rootMargin: '0px 0px -8% 0px', threshold: 0.06 },
  );
  els.forEach((el) => io.observe(el));
}

// 2. Header: solid once scrolled, hides on scroll down, returns on scroll up; mobile drawer.
function initHeader() {
  const hd = document.querySelector<HTMLElement>('[data-header]');
  if (!hd) return;
  let lastY = scrollY;
  let ticking = false;
  const update = () => {
    ticking = false;
    const y = scrollY;
    hd.classList.toggle('is-scrolled', y > 16);
    if (y > lastY + 4 && y > 480 && !hd.classList.contains('is-open')) hd.classList.add('is-hidden');
    else if (y < lastY - 4 || y < 480) hd.classList.remove('is-hidden');
    if (Math.abs(y - lastY) > 4) lastY = y;
  };
  addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  update();

  const burger = hd.querySelector<HTMLButtonElement>('[data-burger]');
  if (!burger) return;
  const set = (open: boolean) => {
    hd.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    document.documentElement.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => set(!hd.classList.contains('is-open')));
  hd.querySelectorAll('[data-drawer] a').forEach((a) => a.addEventListener('click', () => set(false)));
  addEventListener('keydown', (e) => e.key === 'Escape' && hd.classList.contains('is-open') && set(false));
  matchMedia('(min-width: 1081px)').addEventListener('change', (e) => e.matches && set(false));
}

// 3. Live elements ([data-live]) animate in CSS; pause them off screen.
function initLive() {
  const els = [...document.querySelectorAll<HTMLElement>('[data-live]')];
  if (!els.length || reduceMotion) return;
  const io = new IntersectionObserver((entries) =>
    entries.forEach((e) => e.target.classList.toggle('is-paused', !e.isIntersecting)),
  );
  els.forEach((f) => io.observe(f));
}

// 4. Count-up for real numbers: [data-count="42"].
function initCounters() {
  if (reduceMotion || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        const el = e.target as HTMLElement;
        const to = Number(el.dataset.count);
        const t0 = performance.now();
        const step = (now: number) => {
          const p = Math.min(1, (now - t0) / 1300);
          el.textContent = String(Math.round(to * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(step);
        };
        el.textContent = '0';
        requestAnimationFrame(step);
      }),
    { threshold: 0.6 },
  );
  document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => io.observe(el));
}

// 5. Scroll progress for sticky stories: [data-progress] gets --p from 0 to 1 while it scrolls past.
function initProgress() {
  const els = [...document.querySelectorAll<HTMLElement>('[data-progress]')];
  if (!els.length) return;
  if (reduceMotion) {
    els.forEach((el) => el.style.setProperty('--p', '1'));
    return;
  }
  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = innerHeight;
    els.forEach((el) => {
      const r = el.getBoundingClientRect();
      const total = r.height - vh;
      const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : r.top < vh / 2 ? 1 : 0;
      el.style.setProperty('--p', p.toFixed(4));
      el.dispatchEvent(new CustomEvent('progress', { detail: p }));
    });
  };
  addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  addEventListener('resize', update);
  update();
}

// 6. Small forms posting JSON: <form data-api="/api/x"> shows the answer in [data-msg].
function initApiForms() {
  document.querySelectorAll<HTMLFormElement>('form[data-api]').forEach((form) => {
    const msg = form.querySelector<HTMLElement>('[data-msg]');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector<HTMLButtonElement>('[type="submit"]');
      btn?.setAttribute('disabled', '');
      const data = Object.fromEntries(new FormData(form).entries());
      try {
        const res = await fetch(form.dataset.api!, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(data),
        });
        const out = await res.json().catch(() => ({}));
        if (msg) {
          msg.hidden = false;
          msg.className = `bs-msg ${res.ok ? 'bs-msg--ok' : 'bs-msg--err'}`;
          msg.textContent = out.message || (res.ok ? 'Danke!' : 'Das hat leider nicht geklappt.');
        }
        if (res.ok) {
          form.reset();
          form.dispatchEvent(new CustomEvent('sent', { detail: out }));
        }
      } catch {
        if (msg) {
          msg.hidden = false;
          msg.className = 'bs-msg bs-msg--err';
          msg.textContent = 'Keine Verbindung. Bitte später erneut versuchen oder anrufen.';
        }
      } finally {
        btn?.removeAttribute('disabled');
      }
    });
  });
}

initReveal();
initHeader();
initLive();
initCounters();
initProgress();
initApiForms();
