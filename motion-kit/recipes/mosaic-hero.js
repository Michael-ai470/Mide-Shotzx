// recipes/mosaic-hero.js (Web Motion Kit)
// Token-El's hero: a full-screen photo cut into a grid of tiles, one tile per "token". The
// grid turns through the four asset classes: every tile flips on its own delay (a diagonal
// wave with a little scatter) and lands on the next asset, catching a gold edge as it turns.
// On load the first asset is minted the same way out of black, and the heading's letters
// arrive in random order, like tokens assembling. On scroll the picture fractures: the gaps
// between tiles open and the tiles shrink back, while the copy lifts away.
//
// Drawn on one canvas over the poster image, so with scripts off, reduced motion or data
// saver the hero is the first asset's photo, still. The asset row along the bottom is the
// index: it names the four assets and links to their cards; on hover screens, pointing at
// one turns the mosaic to it.
//
// Markup hooks, inside the hero:
//   [data-mosaic-poster]   the first asset's <img> (gated: the canvas mints it in)
//   [data-mosaic-canvas]   the canvas (aria-hidden)
//   [data-mosaic-copy]     wrapper the scroll lifts; inside it
//     [data-mosaic-title]  the heading (gated); its letters assemble
//     [data-mosaic-part]   parts that fade up after it (gated)
//   [data-mosaic-index]    wrapper the scroll fades; inside it the gated list and
//     [data-mosaic-tab]    one per asset, in order, with data-src and data-focus ("x y"),
//                          and an [data-mosaic-bar] that fills while its asset holds

import { gsap, ScrollTrigger, MOTION, getSplitText } from '../core/core.js';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const HOLD = 5.2; // seconds each asset stays
const TURN = 1.5; // seconds a full wave of flips takes
const SPREAD = 0.55; // share of the turn the wave travels across the grid

/**
 * @param {Element} scope  the hero section
 * @param {import('../core/core.js').MotionEnv} env
 * @param {{ ready?: Promise<unknown> }} [options]  ready: the intro waits for it (the
 *   preloader lifting), the fonts and the first photo, never more than 3 seconds.
 */
export function mosaicHero(scope, env, options = {}) {
  const hero = /** @type {HTMLElement} */ (scope);
  const canvas = /** @type {HTMLCanvasElement | null} */ (hero.querySelector('[data-mosaic-canvas]'));
  const ctx = canvas?.getContext('2d');
  const poster = /** @type {HTMLImageElement | null} */ (hero.querySelector('[data-mosaic-poster]'));
  const tabs = Array.from(hero.querySelectorAll('[data-mosaic-tab]'));
  if (!canvas || !ctx || !poster || !tabs.length) return;
  if (/** @type {any} */ (navigator).connection?.saveData) return;

  const copy = hero.querySelector('[data-mosaic-copy]');
  const index = hero.querySelector('[data-mosaic-index]');
  const title = hero.querySelector('[data-mosaic-title]');
  const parts = Array.from(hero.querySelectorAll('[data-mosaic-part]'));
  const gated = Array.from(hero.querySelectorAll('[data-motion-hide]'));
  const bars = tabs.map((tab) => tab.querySelector('[data-mosaic-bar]'));

  // ── Images: the poster is asset 0; the rest load after the first turn starts.
  const assets = tabs.map((tab, i) => ({
    src: tab.dataset.src || '',
    focus: (tab.dataset.focus || '50 50').split(' ').map((v) => parseFloat(v) / 100),
    img: i === 0 ? poster : null,
  }));
  const load = (i) => {
    const a = assets[i];
    if (!a || a.img || a.loading) return a?.loading || Promise.resolve();
    const img = new Image();
    img.crossOrigin = 'anonymous'; // same as the poster: keeps the canvas readable
    img.decoding = 'async';
    a.loading = new Promise((done) => {
      img.onload = () => {
        if (alive) a.img = img;
        done();
      };
      img.onerror = () => done();
    });
    img.src = a.src;
    return a.loading;
  };

  // ── Grid and drawing.
  let alive = true;
  let cols = 0;
  let rows = 0;
  let order = []; // per tile: 0..1, when it turns within a wave
  const state = { from: -1, to: 0, t: 1, split: 0 };

  const layout = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(canvas.clientWidth * ratio);
    const h = Math.round(canvas.clientHeight * ratio);
    if (!w || !h) return;
    canvas.width = w;
    canvas.height = h;
    const size = canvas.clientWidth < 700 ? 78 : 112; // CSS px per tile
    cols = Math.max(4, Math.round(canvas.clientWidth / size));
    rows = Math.max(4, Math.round(canvas.clientHeight / size));
    order = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // A diagonal wave from the top left, with a little scatter so it reads as tokens.
        const diagonal = (c / (cols - 1) + r / (rows - 1)) / 2;
        order.push(Math.min(1, Math.max(0, diagonal * 0.85 + Math.random() * 0.15)));
      }
    }
    draw();
  };

  /** Source rect of the image that covers canvas cell (x, y, w, h). */
  const source = (asset, x, y, w, h) => {
    const img = asset.img;
    const scale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
    const dx = (canvas.width - img.naturalWidth * scale) * asset.focus[0];
    const dy = (canvas.height - img.naturalHeight * scale) * asset.focus[1];
    return [(x - dx) / scale, (y - dy) / scale, w / scale, h / scale];
  };

  const draw = () => {
    if (!cols) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, W, H);
    const tw = W / cols;
    const th = H / rows;
    const ratio = W / canvas.clientWidth;
    // At rest a hairline seam shows the grid; the scroll opens it and shrinks the tiles.
    const gap = (1 + state.split * 12) * ratio;
    const from = assets[state.from];
    const to = assets[state.to];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const k = r * cols + c;
        const d = order[k];
        // This tile's own progress through its flip.
        const p = Math.min(1, Math.max(0, (state.t - d * SPREAD) / (1 - SPREAD)));
        const asset = p < 0.5 ? from : to;
        const fold = Math.abs(Math.cos(Math.PI * p)); // 1 flat, 0 edge-on
        const shrink = 1 - state.split * (0.12 + 0.18 * Math.abs(0.5 - d));
        const x = c * tw;
        const y = r * th;
        const w = (tw - gap) * shrink;
        const h = (th - gap) * shrink * fold;
        const cx = x + (tw - w) / 2;
        const cy = y + (th - h) / 2;
        if (h < 0.5) continue;
        if (asset?.img?.naturalWidth) {
          const [sx, sy, sw, sh] = source(asset, x + gap / 2, y + gap / 2, tw - gap, th - gap);
          ctx.drawImage(asset.img, sx, sy, sw, sh, cx, cy, w, h);
        }
        // The turn catches the light: a gold wash at its steepest.
        const glint = Math.sin(Math.PI * p);
        if (glint > 0.02) {
          ctx.fillStyle = `rgba(201, 168, 76, ${(glint * 0.55).toFixed(3)})`;
          ctx.fillRect(cx, cy, w, h);
        }
      }
    }
  };

  const observer = new ResizeObserver(() => layout());
  observer.observe(canvas);
  env.onCleanup(() => {
    alive = false;
    observer.disconnect();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });

  // ── Turning between assets.
  let turning = null;
  let holding = null;
  let current = 0;
  let paused = false;
  let visible = true;

  const mark = (i) => {
    tabs.forEach((tab, n) => tab.classList.toggle('is-active', n === i));
    holding?.kill();
    bars.forEach((bar) => bar && gsap.set(bar, { scaleX: 0 }));
  };
  const hold = () => {
    holding?.kill();
    const bar = bars[current];
    if (!bar || paused || !visible) return;
    holding = gsap.to(bar, {
      scaleX: 1,
      duration: HOLD,
      ease: 'none',
      onComplete: () => go((current + 1) % assets.length),
    });
  };
  const go = (i, duration = TURN) => {
    if (i === current && !turning) return;
    load(i).then(() => {
      if (!alive) return;
      if (!assets[i].img?.naturalWidth) return; // a photo that failed to load is skipped
      turning?.kill();
      holding?.kill();
      state.from = current;
      state.to = i;
      state.t = 0;
      current = i;
      mark(i);
      turning = gsap.to(state, {
        t: 1,
        duration,
        ease: 'none',
        onUpdate: draw,
        onComplete: () => {
          turning = null;
          state.from = i;
          draw();
          hold();
          load((i + 1) % assets.length); // have the next one ready
        },
      });
    });
  };

  // Pause while the hero is off screen or the tab is hidden; resume where it was.
  const resume = () => {
    if (!turning && visible && !paused && !document.hidden) hold();
  };
  const onVisibility = () => (document.hidden ? holding?.pause() : resume());
  document.addEventListener('visibilitychange', onVisibility);
  env.onCleanup(() => document.removeEventListener('visibilitychange', onVisibility));
  ScrollTrigger.create({
    trigger: hero,
    start: 'top bottom',
    end: 'bottom top',
    // A reload part-way down starts with the hero off screen: hold still until it is back.
    onRefresh: (self) => {
      visible = self.isActive;
    },
    onToggle: (self) => {
      visible = self.isActive;
      if (visible) resume();
      else holding?.pause();
    },
  });

  // Hover screens: pointing at an asset turns the mosaic to it and holds it there.
  if (window.matchMedia(MOTION.query.hover).matches) {
    tabs.forEach((tab, i) => {
      const enter = () => {
        paused = true;
        holding?.kill();
        if (i !== current) go(i, TURN * 0.8);
      };
      const leave = () => {
        paused = false;
        resume();
      };
      tab.addEventListener('pointerenter', enter);
      tab.addEventListener('pointerleave', leave);
      tab.addEventListener('focus', enter);
      tab.addEventListener('blur', leave);
      env.onCleanup(() => {
        tab.removeEventListener('pointerenter', enter);
        tab.removeEventListener('pointerleave', leave);
        tab.removeEventListener('focus', enter);
        tab.removeEventListener('blur', leave);
      });
    });
  }
  env.onCleanup(() => {
    turning?.kill();
    holding?.kill();
    tabs.forEach((tab) => tab.classList.remove('is-active'));
  });

  // ── Intro, once: mint the first asset out of black, assemble the heading.
  gsap.set(poster, { autoAlpha: 0, lazy: false }); // the canvas draws it from here on
  // A slow first photo may land after the intro has started (or finished): draw it then.
  if (!poster.complete) {
    const landed = () => alive && draw();
    poster.addEventListener('load', landed, { once: true });
    env.onCleanup(() => poster.removeEventListener('load', landed));
  }
  layout();
  if (env.intro) {
    state.from = -1;
    state.t = 0;
    gsap.set(gated, { autoAlpha: 0, lazy: false });
    let timeline = null;
    let split = null;
    env.onCleanup(() => {
      timeline?.revert();
      split?.revert();
    });
    const decoded = poster.complete ? Promise.resolve() : new Promise((r) => poster.addEventListener('load', r, { once: true }));
    const settled = Promise.all([document.fonts?.ready, options.ready, decoded]).catch(() => {});
    Promise.race([settled, wait(3000)]).then(() => {
      if (!alive) return;
      const SplitText = getSplitText();
      timeline = gsap.timeline({
        defaults: { ease: MOTION.ease.reveal },
        onComplete: () => {
          split?.revert();
          split = null;
        },
      });
      timeline.to(state, { t: 1, duration: TURN + 0.4, ease: 'none', onUpdate: draw, onComplete: () => { state.from = 0; draw(); } }, 0);
      // The poster stays hidden: the canvas is the picture from here on.
      const shown = gated.filter((el) => !parts.includes(el) && el !== poster);
      timeline.set(shown, { autoAlpha: 1 }, 0.35);
      if (title && SplitText) {
        split = SplitText.create(title, { type: 'chars,words' });
        // Letters arrive in random order, each with a brief gold flash: tokens assembling.
        timeline.from(split.chars, {
          autoAlpha: 0,
          color: '#c9a84c',
          duration: 0.5,
          ease: 'power2.out',
          stagger: { each: 0.018, from: 'random' },
        }, 0.35);
      }
      let at = 1.15;
      for (const part of parts) {
        timeline.fromTo(part, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: MOTION.duration.base }, at);
        at += 0.14;
      }
      const items = index ? Array.from(index.querySelectorAll('li')) : [];
      if (items.length) timeline.from(items, { autoAlpha: 0, y: 16, duration: MOTION.duration.base, stagger: 0.08 }, at);
      timeline.call(() => {
        mark(0);
        hold();
        load(1);
      }, [], TURN + 0.4);
    });
  } else {
    state.from = 0;
    state.to = 0;
    draw();
    mark(0);
    hold();
    load(1);
  }

  // ── Scroll: the picture fractures into its tokens; the copy lifts, the index fades.
  const leave = { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6, invalidateOnRefresh: true };
  gsap.to(state, { split: 1, ease: MOTION.ease.scrub, onUpdate: draw, scrollTrigger: leave });
  if (copy) gsap.to(copy, { y: () => -window.innerHeight * 0.28, autoAlpha: 0, ease: MOTION.ease.scrub, scrollTrigger: { ...leave, end: 'bottom 30%' } });
  if (index) gsap.to(index, { autoAlpha: 0, y: -24, ease: MOTION.ease.scrub, scrollTrigger: { ...leave, end: '30% top' } });
}
