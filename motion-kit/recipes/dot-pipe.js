// recipes/dot-pipe.js (Web Motion Kit)
// A pinned list of steps beside a field of dots that redraws itself for each step
// (Velmax's "pipeline"). As the section arrives the loose field gathers into the first
// symbol; while it is pinned, scrolling moves through the steps, the active step opens
// up in the list, and the dots flow from one symbol into the next. Each symbol holds
// for a while before the next flow begins, so every value gets read.
//
// Markup hooks:
//   [data-pipe]          the section. The recipe makes it taller while it runs.
//   [data-pipe-stage]    what stays on screen (sticky).
//   [data-pipe-step]     each step, in order, with data-glyph naming its symbol.
//   [data-pipe-canvas]   the canvas for the dots. Dot colour is the canvas's CSS color.
//   [data-pipe-big]      optional, shows the active step's numeral.
//   [data-pipe-bar]      optional progress line (scaleY 0..1).
//
// Without scripts or with reduced motion, CSS shows the list with every step open
// and no dots.

import { gsap, ScrollTrigger } from '../core/core.js';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// Symbols drawn on a 24-unit grid, the same language as the site's line icons.
const GLYPHS = {
  excellence: ['M12 1.5 22.5 12 12 22.5 1.5 12Z', 'M12 7.2 16.8 12 12 16.8 7.2 12Z'],
  discretion: [
    'M5.5 10.5h13a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-7.5a2 2 0 0 1 2-2Z',
    'M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5',
    'M12 15v3',
  ],
  integrity: ['M2.5 8.5 12 2.5l9.5 6Z', 'M5 9.5v9.5', 'M9.7 9.5v9.5', 'M14.3 9.5v9.5', 'M19 9.5v9.5', 'M2.5 21.5h19', 'M4 19.5h16'],
  innovation: [
    'M12 2.5a6.5 6.5 0 0 0-3.8 11.8c.5.4.8 1 .8 1.6V17h6v-1.1c0-.6.3-1.2.8-1.6A6.5 6.5 0 0 0 12 2.5Z',
    'M9.5 19.5h5',
    'M10.5 22h3',
    'M12 7v4',
  ],
};

/** Sample `count` points along a symbol's strokes. Returns coordinates in -0.5..0.5. */
function sample(name, count) {
  const paths = GLYPHS[name] || GLYPHS.excellence;
  const S = 240;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.scale(S / 24, S / 24);
  g.lineWidth = 1.15;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.strokeStyle = '#fff';
  for (const d of paths) g.stroke(new Path2D(d));
  const data = g.getImageData(0, 0, S, S).data;
  const hits = [];
  for (let y = 0; y < S; y += 2) {
    for (let x = 0; x < S; x += 2) if (data[(y * S + x) * 4 + 3] > 128) hits.push([x / S - 0.5, y / S - 0.5]);
  }
  // Even spread: shuffle once, then cycle through with a little jitter.
  for (let i = hits.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [hits[i], hits[j]] = [hits[j], hits[i]];
  }
  const out = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    const h = hits[i % hits.length] || [0, 0];
    out[i * 2] = h[0] + (Math.random() - 0.5) * 0.006;
    out[i * 2 + 1] = h[1] + (Math.random() - 0.5) * 0.006;
  }
  return out;
}

/** A loose field, wider than tall, thinning towards its edge. */
function field(count) {
  const out = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * 0.62;
    out[i * 2] = Math.cos(a) * r * 1.15;
    out[i * 2 + 1] = Math.sin(a) * r * 0.85;
  }
  return out;
}

/**
 * @param {Element} scope  the [data-pipe] section
 * @param {import('../core/core.js').MotionEnv} env
 * @param {{ step?: number }} [options]  step: scroll per step, in svh. Default 70.
 */
export function dotPipe(scope, env, options = {}) {
  const section = /** @type {HTMLElement} */ (scope);
  const stage = section.querySelector('[data-pipe-stage]');
  const steps = Array.from(section.querySelectorAll('[data-pipe-step]'));
  const canvas = /** @type {HTMLCanvasElement | null} */ (section.querySelector('[data-pipe-canvas]'));
  if (!stage || !canvas || steps.length < 2) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const big = section.querySelector('[data-pipe-big]');
  const bar = section.querySelector('[data-pipe-bar]');
  const n = steps.length;
  const step = options.step ?? 70;

  // 1. Running layout.
  section.classList.add('is-piping');
  section.style.height = `calc(100svh + ${(n - 1) * step + 40}svh)`;

  // 2. Points: a loose field, then one target set per step.
  const small = window.matchMedia('(max-width: 767px)').matches;
  const COUNT = small ? 700 : 1300;
  const loose = field(COUNT);
  const targets = steps.map((s) => sample(s.dataset.glyph, COUNT));
  const phase = new Float32Array(COUNT);
  const depth = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    phase[i] = Math.random() * Math.PI * 2;
    depth[i] = 0.55 + Math.random() * 0.45;
  }

  // 3. State, written by the scroll triggers, read by the renderer.
  const state = { gather: 0, c: 0 };
  let active = -1;
  const setActive = (i) => {
    if (i === active) return;
    active = i;
    steps.forEach((s, j) => {
      s.classList.toggle('is-active', j === i);
      s.classList.toggle('is-past', j < i);
    });
    if (big) big.textContent = ROMAN[i] || String(i + 1);
  };
  setActive(0);

  // 4. Drawing.
  let w = 0;
  let h = 0;
  let ratio = 1;
  let color = '#c9a84c';
  const size = () => {
    const box = canvas.getBoundingClientRect();
    ratio = Math.min(window.devicePixelRatio || 1, 2);
    w = box.width;
    h = box.height;
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);
    color = getComputedStyle(canvas).color || color;
  };
  const draw = (time) => {
    if (!w || !h) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = color;
    const scale = Math.min(w, h) * 0.86;
    const cx = w / 2;
    const cy = h / 2;
    const c = clamp(state.c, 0, n - 1);
    const i0 = Math.min(n - 2, Math.floor(c));
    // Hold each symbol, flow in the middle stretch between two of them.
    const t = smooth(0.3, 0.7, c - i0);
    const A = targets[i0];
    const B = targets[i0 + 1];
    const gather = state.gather;
    const loosen = 1 - Math.abs(t - 0.5) * 2; // 0 at rest, 1 mid-flow
    const s = time * 0.0006;
    for (let k = 0; k < COUNT; k++) {
      const x2 = k * 2;
      let x = A[x2] + (B[x2] - A[x2]) * t;
      let y = A[x2 + 1] + (B[x2 + 1] - A[x2 + 1]) * t;
      // Mid-flow the dots swirl a little, so the change reads as movement, not a fade.
      const sw = loosen * 0.05 * depth[k];
      x += Math.sin(phase[k] + s * 2) * sw;
      y += Math.cos(phase[k] * 1.3 + s * 2) * sw;
      // Arriving: from the loose field to the first symbol.
      x = loose[x2] + (x - loose[x2]) * gather;
      y = loose[x2 + 1] + (y - loose[x2 + 1]) * gather;
      // A slow shimmer that never stops, so the field feels alive.
      x += Math.sin(phase[k] + s) * 0.0025;
      y += Math.cos(phase[k] + s * 1.2) * 0.0025;
      const d = depth[k];
      ctx.globalAlpha = 0.35 + 0.65 * d * (0.55 + 0.45 * gather);
      const r = 0.9 + d * 1.1;
      ctx.fillRect(cx + x * scale - r / 2, cy + y * scale - r / 2, r, r);
    }
    ctx.globalAlpha = 1;
  };

  // Only animate while the section is anywhere near the screen.
  let running = false;
  const tick = (time) => draw(time * 1000);
  const run = (on) => {
    if (on === running) return;
    running = on;
    if (on) gsap.ticker.add(tick);
    else gsap.ticker.remove(tick);
  };

  // 5. Scroll. Arriving gathers the field; once stuck, progress walks the steps.
  ScrollTrigger.create({
    trigger: section,
    start: 'top 85%',
    end: 'top top',
    scrub: 0.6,
    onUpdate: (self) => (state.gather = smooth(0, 1, self.progress)),
    onRefresh: (self) => (state.gather = smooth(0, 1, self.progress)),
  });
  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.6,
    onUpdate: (self) => {
      // The last 10% of the scroll holds the final symbol.
      state.c = clamp(self.progress / 0.9) * (n - 1);
      setActive(Math.round(state.c));
      if (bar) bar.style.transform = `scaleY(${clamp(self.progress / 0.9).toFixed(4)})`;
    },
    onRefresh: (self) => {
      size();
      state.c = clamp(self.progress / 0.9) * (n - 1);
      setActive(Math.round(state.c));
    },
  });
  ScrollTrigger.create({
    trigger: section,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => run(self.isActive),
  });

  size();
  draw(0);

  env.onCleanup(() => {
    run(false);
    section.classList.remove('is-piping');
    section.style.height = '';
    steps.forEach((s) => s.classList.remove('is-active', 'is-past'));
    if (bar) bar.style.transform = '';
    if (big) big.textContent = ROMAN[0];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });
}
