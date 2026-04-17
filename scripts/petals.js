/* ============================================================
   Petals — ambient hero background for the "living" direction.
   vjiaoblack.github.io

   Behavior:
     - ~50 ellipses drift upward with gentle horizontal sway
     - Cursor within ~140px pushes petals away (cheap repulsion)
     - Off-screen petals respawn at bottom
     - Pauses when direction != "living" (canvas hidden via CSS opacity)
     - Respects prefers-reduced-motion

   First-pass particle sim — explicitly a placeholder for a future FLIP
   or SPH pass. Keep the interface simple so the upgrade is drop-in.
   ============================================================ */
(() => {
  const canvas = document.getElementById('petals');
  if (!canvas) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  const N = 50;

  let W = 0, H = 0, dpr = 1;
  let pts = [];
  let running = false;
  let rafHandle = 0;
  let mx = -9999, my = -9999, mActive = 0;

  const seedPetals = () => {
    pts = Array.from({ length: N }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -Math.random() * 0.4 - 0.05,
      s:  2 + Math.random() * 3,
      r:  Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.02,
      hue: 20 + Math.random() * 20,                // warm-red to warm-orange
    }));
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width  = Math.max(1, Math.floor(rect.width  * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    W = rect.width;
    H = rect.height;
    seedPetals();
  };

  const step = () => {
    ctx.clearRect(0, 0, W, H);
    for (const p of pts) {
      // Cursor repulsion — cheap radial push, only inside 140px.
      if (mActive > 0.1) {
        const dx = p.x - mx;
        const dy = p.y - my;
        const d  = Math.hypot(dx, dy) + 1;
        if (d < 140) {
          p.vx += (dx / d) * 0.15 * mActive;
          p.vy += (dy / d) * 0.15 * mActive;
        }
      }
      p.vx *= 0.97;
      p.vy *= 0.97;
      p.x  += p.vx;
      p.y  += p.vy - 0.1;                          // persistent upward drift
      p.r  += p.vr;

      // Wrap off the top back to bottom with a fresh x; horizontal wraps too.
      if (p.y < -20) { p.y = H + 20; p.x = Math.random() * W; }
      if (p.x < -20) p.x = W + 20;
      if (p.x > W + 20) p.x = -20;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = `oklch(60% 0.14 ${p.hue} / 0.35)`;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.s * 2, p.s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };

  const loop = () => {
    rafHandle = 0;
    if (!running) return;
    step();
    rafHandle = requestAnimationFrame(loop);
  };

  const start = () => {
    if (running) return;
    running = true;
    if (!rafHandle) rafHandle = requestAnimationFrame(loop);
  };
  const stop = () => {
    running = false;
    if (rafHandle) { cancelAnimationFrame(rafHandle); rafHandle = 0; }
    ctx.clearRect(0, 0, W, H);
  };

  const syncToDirection = () => {
    if (document.body.dataset.direction === 'living') start();
    else stop();
  };

  // Cursor — tracked at the hero level so petals only react when the user
  // is in the neighborhood. No global listener.
  const hero = canvas.closest('.hero');
  if (hero) {
    hero.addEventListener('pointermove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mx = e.clientX - rect.left;
      my = e.clientY - rect.top;
      mActive = 1;
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { mActive = 0; });
  }

  // Pause when tab isn't visible (no point burning rAF on a background tab).
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else syncToDirection();
  });

  let resizeTimer = 0;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });

  new MutationObserver(syncToDirection)
    .observe(document.body, { attributes: true, attributeFilter: ['data-direction'] });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { resize(); syncToDirection(); });
  } else {
    resize();
    syncToDirection();
  }
})();
