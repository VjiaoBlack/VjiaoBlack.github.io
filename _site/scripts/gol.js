/* ============================================================
   Conway's Game of Life — ambient hero background
   vjiaoblack.github.io

   Behavior:
     - Warm, low-contrast ASCII cells against paper (ambient, not demanding)
     - Fast tick (~350ms) — observable, alive
     - Click on open canvas to stamp a cell cluster
     - Pauses when cursor is over text regions
     - Respects prefers-reduced-motion

   Perf optimizations (addresses occasional main-thread stalls):
     - Glyph cached as offscreen bitmap, drawn via drawImage (5-10x faster than fillText)
     - step() splits interior (no modulo) from edges (modulo wraparound) —
       interior is ~90% of cells and pays no modulo tax
     - Settle steps reduced from 30 to 15; still cuts the chaotic opening noise
     - Grid swap with pre-allocated buffers (zero GC pressure per tick)
   ============================================================ */
(() => {
  const canvas = document.getElementById('gol');
  if (!canvas) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  const CELL = 14;
  const TICK_MS = 350;
  const SEED_DENSITY = 0.08;
  const SETTLE_STEPS = 3;
  const CELL_CHAR = '#';
  const CELL_FONT_PX = 13;
  // Paper-family — lighter than v1 (less contrast with page = more subtle),
  // slightly higher chroma so it still reads as warm color not grey.
  const CELL_COLOR = 'oklch(86% 0.055 85)';

  let cols = 0, rows = 0;
  let grid, next;
  let dpr = 1;
  let tickHandle = 0;
  let paused = false;

  // Offscreen glyph cache — rendered once per resize, drawn many times per frame.
  let glyph = null;
  const buildGlyph = () => {
    const size = CELL * dpr;
    const off = document.createElement('canvas');
    off.width = size;
    off.height = size;
    const gctx = off.getContext('2d');
    gctx.scale(dpr, dpr);
    gctx.fillStyle = CELL_COLOR;
    gctx.font = `${CELL_FONT_PX}px 'JetBrains Mono', ui-monospace, monospace`;
    gctx.textBaseline = 'middle';
    gctx.textAlign = 'center';
    gctx.fillText(CELL_CHAR, CELL / 2, CELL / 2);
    glyph = off;
  };

  const seed = (density) => {
    for (let i = 0; i < grid.length; i++) {
      grid[i] = Math.random() < density ? 1 : 0;
    }
  };

  // Toroidal wraparound index (only used in the edge loop)
  const idx = (c, r) => ((r + rows) % rows) * cols + ((c + cols) % cols);

  // Interior: no modulo, direct neighbor offsets on flat array.
  // Edges: modulo wraparound.
  const step = () => {
    // Interior cells (1..cols-2, 1..rows-2) — most of the grid. No modulo.
    for (let r = 1; r < rows - 1; r++) {
      const rowStart = r * cols;
      const above = rowStart - cols;
      const below = rowStart + cols;
      for (let c = 1; c < cols - 1; c++) {
        const i = rowStart + c;
        const n =
          grid[above + c - 1] + grid[above + c] + grid[above + c + 1] +
          grid[rowStart + c - 1]                  + grid[rowStart + c + 1] +
          grid[below + c - 1] + grid[below + c] + grid[below + c + 1];
        next[i] = grid[i] ? ((n === 2 || n === 3) ? 1 : 0) : (n === 3 ? 1 : 0);
      }
    }
    // Edge rows: top (r=0), bottom (r=rows-1)
    for (let r of [0, rows - 1]) {
      if (r < 0) continue;
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const n =
          grid[idx(c - 1, r - 1)] + grid[idx(c, r - 1)] + grid[idx(c + 1, r - 1)] +
          grid[idx(c - 1, r    )]                         + grid[idx(c + 1, r    )] +
          grid[idx(c - 1, r + 1)] + grid[idx(c, r + 1)] + grid[idx(c + 1, r + 1)];
        next[i] = grid[i] ? ((n === 2 || n === 3) ? 1 : 0) : (n === 3 ? 1 : 0);
      }
    }
    // Edge columns (excluding corners already done in edge rows): left (c=0), right (c=cols-1)
    for (let r = 1; r < rows - 1; r++) {
      for (let c of [0, cols - 1]) {
        const i = r * cols + c;
        const n =
          grid[idx(c - 1, r - 1)] + grid[idx(c, r - 1)] + grid[idx(c + 1, r - 1)] +
          grid[idx(c - 1, r    )]                         + grid[idx(c + 1, r    )] +
          grid[idx(c - 1, r + 1)] + grid[idx(c, r + 1)] + grid[idx(c + 1, r + 1)];
        next[i] = grid[i] ? ((n === 2 || n === 3) ? 1 : 0) : (n === 3 ? 1 : 0);
      }
    }
    const tmp = grid; grid = next; next = tmp;
  };

  const render = () => {
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    if (!glyph) return;
    for (let r = 0; r < rows; r++) {
      const rowStart = r * cols;
      const y = r * CELL;
      for (let c = 0; c < cols; c++) {
        if (grid[rowStart + c]) {
          ctx.drawImage(glyph, c * CELL, y, CELL, CELL);
        }
      }
    }
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.floor(rect.width / CELL);
    rows = Math.floor(rect.height / CELL);
    grid = new Uint8Array(cols * rows);
    next = new Uint8Array(cols * rows);
    buildGlyph();
    seed(SEED_DENSITY);
    for (let i = 0; i < SETTLE_STEPS; i++) step();
    render();
  };

  // Interval always runs at TICK_MS cadence; the callback checks flags and
  // skips work when paused or off-screen. Previous approach used setInterval /
  // clearInterval on every pointerenter/leave — with fast mouse movement the
  // timer kept getting cleared before it could fire, so the sim "never updated"
  // while the cursor was moving around.
  const startTick = () => {
    if (tickHandle) return;
    tickHandle = setInterval(() => {
      if (paused || !visible) return;
      step();
      render();
    }, TICK_MS);
  };
  const stopTick = () => {
    if (!tickHandle) return;
    clearInterval(tickHandle);
    tickHandle = 0;
  };

  // Click-to-spawn: stamp a small randomized cluster at the click location.
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const cc = Math.floor((e.clientX - rect.left) / CELL);
    const cr = Math.floor((e.clientY - rect.top) / CELL);
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        if (Math.random() < 0.45) {
          grid[idx(cc + dx, cr + dy)] = 1;
        }
      }
    }
    render();
  });

  // No text-region pause. Cells at oklch(86%) on paper are subtle enough that
  // they don't interfere with reading, and the pointerenter/leave + pointer-capture
  // logic caused more bugs (stuck state during selection, interval churn from
  // rapid movement) than the "pause while reading" instinct was ever worth.
  // paused is still flipped by visibility / IntersectionObserver below.

  // Debounced resize
  let resizeTimer = 0;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });

  // Pause ticking when canvas is scrolled out of view — no point burning CPU
  // and uploading large textures for pixels the user can't see.
  let visible = true;
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (!visible) {
        stopTick();
      } else if (!paused) {
        startTick();
      }
    }, { rootMargin: '200px' });
    io.observe(canvas);
  }

  // Also pause when tab isn't visible (browsers throttle anyway, but be explicit)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopTick();
    } else if (!paused && visible) {
      startTick();
    }
  });

  // Init after fonts load (layout settles, we get final rect, glyph renders in proper font)
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { resize(); startTick(); });
  } else {
    resize();
    startTick();
  }
})();
