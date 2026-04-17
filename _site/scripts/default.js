/* ============================================================
   vjiaoblack.github.io — default.js

   Three IIFEs, each guarded so non-home pages don't crash:
     1. Width-lock reactive headline words (measure at max state, pin min-width)
     2. Cursor-reactive typography + portrait follow (rAF-coalesced)
     3. Bio expand toggle (Vol. III dateline + "More" button in lede)

   Frame-rate disciplined:
     - rAF coalescing, no per-mousemove DOM writes beyond --prox
     - CSS custom props only (no style recalc on layout properties)
     - Deactivates on pointer-leave of reactive region
     - Respects prefers-reduced-motion
   ============================================================ */

// --- 1. Width-lock reactive words (runs first, so geometry is stable) ---
(() => {
  const words = document.querySelectorAll('.hero h1 .w');
  if (!words.length) return;

  const lockWidths = () => {
    words.forEach(w => {
      w.style.minWidth = '';
      const originalTransform = w.style.transform;
      w.style.fontVariationSettings = '"opsz" 144, "wght" 540, "SOFT" 100';
      w.style.transform = 'none';
      const naturalMax = w.getBoundingClientRect().width;
      w.style.minWidth = (Math.ceil(naturalMax) + 1) + 'px';
      w.style.fontVariationSettings = '';
      w.style.transform = originalTransform;
    });
  };

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(lockWidths);
  } else {
    lockWidths();
  }
  let t;
  addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(lockWidths, 120);
  });
})();

// --- 2. Cursor-reactive typography + portrait follow ---
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  const region = document.querySelector('.hero');
  const reactives = Array.from(document.querySelectorAll('.hero h1 .w, .topnav a, .cta'));
  if (!reactives.length) return;

  const root = document.documentElement;

  let mx = 0, my = 0;
  let active = false;
  let rafId = 0;

  let targets = [];
  const remeasure = () => {
    targets = reactives.map((el) => {
      const r = el.getBoundingClientRect();
      return { el, cx: r.left + r.width / 2, cy: r.top + r.height / 2, radius: 240 };
    });
  };
  remeasure();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(remeasure);
  }
  addEventListener('resize', remeasure);
  addEventListener('scroll', remeasure, { passive: true });

  const tick = () => {
    rafId = 0;

    if (region) {
      const r = region.getBoundingClientRect();
      const hx = (mx - (r.left + r.width / 2)) / (r.width / 2);
      const hy = (my - (r.top + r.height / 2)) / (r.height / 2);
      root.style.setProperty('--cursor-x', Math.max(-1, Math.min(1, hx)).toFixed(3));
      root.style.setProperty('--cursor-y', Math.max(-1, Math.min(1, hy)).toFixed(3));
      root.style.setProperty('--cursor-in', active ? '1' : '0');
    }

    for (const t of targets) {
      const dx = mx - t.cx;
      const dy = my - t.cy;
      const d = Math.hypot(dx, dy);
      const prox = active ? Math.max(0, 1 - d / t.radius) : 0;
      const eased = prox * prox * (3 - 2 * prox);
      t.el.style.setProperty('--prox', eased.toFixed(3));
    }
  };
  const schedule = () => { if (!rafId) rafId = requestAnimationFrame(tick); };

  addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; schedule(); }, { passive: true });
  addEventListener('pointerdown', (e) => { mx = e.clientX; my = e.clientY; schedule(); }, { passive: true });

  if (region) {
    region.addEventListener('pointerenter', () => { active = true; schedule(); });
    region.addEventListener('pointerleave', () => {
      active = false;
      schedule();
      setTimeout(schedule, 200);
    });
  } else {
    // No hero region on this page — keep nav reactive, activate globally.
    active = true;
    schedule();
  }
})();

// --- 3. Bio expand toggle (home page only) ---
(() => {
  const expand = document.getElementById('bio-expand');
  const toggle = document.getElementById('bio-toggle');
  const volLink = document.querySelector('.dateline-link');
  if (!expand || !toggle) return;

  const setOpen = (open) => {
    expand.dataset.open = open ? 'true' : 'false';
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    const label = toggle.querySelector('.more-label');
    if (label) label.textContent = open ? 'Less' : 'More';
    if (volLink) volLink.dataset.open = open ? 'true' : 'false';
  };
  const isOpen = () => expand.dataset.open === 'true';

  toggle.addEventListener('click', () => setOpen(!isOpen()));

  if (volLink) {
    volLink.addEventListener('click', (e) => {
      e.preventDefault();
      setOpen(!isOpen());
      if (!isOpen()) return;
      requestAnimationFrame(() => {
        expand.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    });
  }
})();
