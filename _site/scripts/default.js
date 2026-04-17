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
// Perf rewrite after trace analysis (2026-04-17):
//   - Region rect CACHED; no getBoundingClientRect in tick (was #1 layout thrash source)
//   - Cursor vars set on .portrait (narrow invalidation scope) instead of :root (wide cascade)
//   - mousemove listener only attached WHILE cursor is inside .hero — zero ticks elsewhere
//   - target loop skipped when idle (cursor outside region, no props to update)
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  const region = document.querySelector('.hero');
  const portrait = document.querySelector('.portrait');
  const reactives = Array.from(document.querySelectorAll('.hero h1 .w, .topnav a, .cta'));
  if (!reactives.length) return;

  let mx = 0, my = 0;
  let active = false;
  let rafId = 0;
  let dirty = false;
  let lastTickTime = 0;                     // throttle gate — browser can't keep up at 120Hz
  const TICK_MIN_MS = 33;                   // ~30fps cap

  // Cached geometry — refreshed on resize, scroll-end, fonts-ready.
  let targets = [];
  let regionCx = 0, regionCy = 0, regionHw = 1, regionHh = 1;

  const remeasure = () => {
    targets = reactives.map((el) => {
      const r = el.getBoundingClientRect();
      return { el, cx: r.left + r.width / 2, cy: r.top + r.height / 2, radius: 240 };
    });
    if (region) {
      const r = region.getBoundingClientRect();
      regionCx = r.left + r.width / 2;
      regionCy = r.top + r.height / 2;
      regionHw = r.width / 2 || 1;
      regionHh = r.height / 2 || 1;
    }
  };
  remeasure();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(remeasure);
  }
  addEventListener('resize', remeasure);
  let scrollTimer = 0;
  addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(remeasure, 150);
  }, { passive: true });

  const setVar = (el, name, v) => el.style.setProperty(name, v);

  const tick = () => {
    rafId = 0;

    // Throttle: ~30fps cap. At 120Hz the browser can't reshape variable-font
    // glyphs fast enough to keep up with every rAF, and we drop frames. At 30fps
    // reshape work is halved and frame budget comfortably holds.
    const now = performance.now();
    if (now - lastTickTime < TICK_MIN_MS) {
      if (active || dirty) schedule();
      return;
    }
    lastTickTime = now;

    if (portrait) {
      const hx = Math.max(-1, Math.min(1, (mx - regionCx) / regionHw));
      const hy = Math.max(-1, Math.min(1, (my - regionCy) / regionHh));
      setVar(portrait, '--cursor-x', hx.toFixed(2));
      setVar(portrait, '--cursor-y', hy.toFixed(2));
      setVar(portrait, '--cursor-in', active ? '1' : '0');
    }

    if (active || dirty) {
      let anyNonzero = false;
      for (const t of targets) {
        const dx = mx - t.cx;
        const dy = my - t.cy;
        const d = Math.hypot(dx, dy);
        const prox = active ? Math.max(0, 1 - d / t.radius) : 0;
        const eased = prox * prox * (3 - 2 * prox);
        // toFixed(2) quantizes to 100 discrete values — when cursor motion doesn't
        // cross a new 0.01 threshold, the string match lets the browser skip
        // reshape entirely. Visible effect is indistinguishable from toFixed(3).
        setVar(t.el, '--prox', eased.toFixed(2));
        if (eased > 0.005) anyNonzero = true;
      }
      dirty = anyNonzero;
    }
  };
  const schedule = () => { if (!rafId) rafId = requestAnimationFrame(tick); };

  // The global mousemove handler is expensive — only attach it while cursor
  // is over the hero. Everywhere else: zero ticks, zero work.
  const onMove = (e) => { mx = e.clientX; my = e.clientY; schedule(); };

  if (region) {
    region.addEventListener('pointerenter', () => {
      active = true;
      dirty = true;
      addEventListener('mousemove', onMove, { passive: true });
      schedule();
    });
    region.addEventListener('pointerleave', () => {
      active = false;
      removeEventListener('mousemove', onMove);
      dirty = true;                        // one final tick to decay values to 0
      schedule();
    });
    region.addEventListener('pointerdown', onMove, { passive: true });
  } else {
    // No hero region on this page — nothing to activate.
  }
})();

// --- Time-of-day label + tint ---
// Sets the "Afternoon / Dusk / Evening / ..." label in the dateline and
// paints a subtle colored layer (warm at dawn, cool at night) behind the
// page. Label is present on every page; tint applies site-wide.
(() => {
  const phases = [
    { until:  6, name: 'Night',     tint: 'oklch(22% 0.04 260 / 0.10)' },
    { until:  9, name: 'Dawn',      tint: 'oklch(88% 0.05 50 / 0.06)'  },
    { until: 12, name: 'Morning',   tint: 'oklch(95% 0.02 80 / 0.04)'  },
    { until: 17, name: 'Afternoon', tint: 'oklch(95% 0.015 85 / 0.02)' },
    { until: 20, name: 'Dusk',      tint: 'oklch(75% 0.08 40 / 0.09)'  },
    { until: 24, name: 'Evening',   tint: 'oklch(35% 0.05 260 / 0.10)' },
  ];
  const current = () => phases.find(p => new Date().getHours() < p.until);
  const apply = () => {
    const p = current();
    const label = document.getElementById('tod-label');
    if (label) label.textContent = p.name;
    const layer = document.getElementById('tod-layer');
    if (layer) layer.style.background = p.tint;
  };
  apply();
  // Refresh every minute so Dusk → Evening transitions don't need a reload.
  setInterval(apply, 60000);
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
