// recipes/scroll-sequence.js (Web Motion Kit)
// Recipe 6.9: a camera move played by the scroll. Plain-JS port of
// docs/web-motion-engine.md 6.9, with two additions for this site, marked "Site:".

import { gsap, MOTION } from '../core/core.js';

/**
 * @typedef {object} SequenceSet
 * @property {(i: number) => string} src  URL of frame `i`. Frames are numbered from 1.
 * @property {number} count  How many frames the set has.
 */

/**
 * @typedef {SequenceSet & {
 *   small?: SequenceSet,
 *   length?: number,
 *   framesEnd?: number,
 *   focus?: [number, number],
 *   dim?: number,
 *   ready?: Promise<unknown>,
 * }} SequenceOptions
 * - small: a lighter set for narrow screens. Chosen once, at setup.
 * - length: section height in svh while the sequence runs. Taller means slower. Default 350.
 * - framesEnd: share of the scroll the frames take. The rest holds the last frame for the
 *   closing text. Default 0.85.
 * - focus: horizontal focus of the cover crop at the first and last frame. 0 is the left
 *   edge, 1 the right.
 * - dim: opacity the scrim deepens to behind the closing text. Default 0.5.
 * - ready: Site: the opening-line intro waits for this promise (the preloader lifting).
 */

const SMALL = '(max-width: 767px)';
const PARALLEL = 6;

/**
 * @param {Element} scope
 * @param {import('../core/core.js').MotionEnv} env
 * @param {SequenceOptions} options
 */
export function scrollSequence(scope, env, options) {
  const root = /** @type {HTMLElement} */ (scope);
  const stage = root.querySelector('[data-seq-stage]');
  const canvas = root.querySelector('[data-seq-canvas]');
  const ctx = canvas?.getContext('2d');
  if (!stage || !canvas || !ctx) return;

  // People who asked their browser to save data keep the still image.
  if (navigator.connection?.saveData) return;

  const { src, count } = options.small && window.matchMedia(SMALL).matches ? options.small : options;
  if (count < 2) return;
  const { length = 350, framesEnd = 0.85, focus = [0.5, 0.5], dim = 0.5 } = options;

  const out = root.querySelector('[data-seq-out]');
  const into = root.querySelector('[data-seq-in]');
  const scrim = root.querySelector('[data-seq-scrim]');
  const intro = Array.from(root.querySelectorAll('[data-seq-intro]'));

  // 1. Layout that only exists while the sequence runs. With scripts off or reduced
  //    motion the section keeps its normal height and both text blocks sit in the flow.
  const style = (el, prop, value) => {
    const before = el.style.getPropertyValue(prop);
    el.style.setProperty(prop, value);
    env.onCleanup(() => (before ? el.style.setProperty(prop, before) : el.style.removeProperty(prop)));
  };
  style(root, 'height', `${length}svh`);
  for (const el of [out, into]) if (el) style(el, 'grid-area', '1 / 1'); // stack them in one cell

  // 2. Frames. Decoded images are kept by index; a missing one falls back to its nearest neighbour.
  const frames = new Array(count);
  const loading = new Set();
  const state = { frame: 0 };
  let alive = true;
  let wanted = 0;
  let drawn = -1;

  const nearest = (i) => {
    for (let d = 0; d < count; d++) {
      if (frames[i - d]) return i - d;
      if (frames[i + d]) return i + d;
    }
    return -1;
  };

  const draw = (force = false) => {
    const i = nearest(wanted);
    if (i < 0 || (i === drawn && !force)) return;
    const img = frames[i];
    const scale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    const x = focus[0] + (focus[1] - focus[0]) * (wanted / (count - 1));
    ctx.drawImage(img, (canvas.width - w) * x, (canvas.height - h) / 2, w, h);
    if (drawn < 0) style(canvas, 'visibility', 'visible'); // the poster stays underneath until now
    drawn = i;
  };

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(stage.clientWidth * ratio);
    const h = Math.round(stage.clientHeight * ratio);
    if (!w || !h || (canvas.width === w && canvas.height === h)) return;
    canvas.width = w; // resizing a canvas clears it
    canvas.height = h;
    draw(true);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(stage);
  resize();

  // 3. Loading. A coarse pass first (every 16th frame, then 8th, 4th...), so the whole
  //    scroll has something to show within a few requests and sharpens as the rest arrives.
  const order = [];
  const queued = new Set();
  const queue = (i) => {
    if (i >= 0 && i < count && !queued.has(i)) {
      queued.add(i);
      order.push(i);
    }
  };
  queue(0);
  queue(count - 1);
  for (let step = 16; step >= 1; step /= 2) for (let i = 0; i < count; i += step) queue(i);

  const requested = new Set();
  const load = (i) =>
    new Promise((done) => {
      if (requested.has(i)) return done();
      requested.add(i);
      const img = new Image();
      const finish = (ok) => {
        loading.delete(img);
        if (alive && ok) {
          frames[i] = img;
          draw();
        }
        done();
      };
      img.decoding = 'async';
      // onload, not img.decode(): Chromium rejects decode() when many are in flight at once.
      img.onload = () => finish(true);
      img.onerror = () => finish(false); // a failed frame is skipped, its neighbour stands in
      loading.add(img);
      img.src = src(i + 1);
    });

  let cursor = 0;
  const worker = async () => {
    while (alive && cursor < order.length) await load(order[cursor++]);
  };
  env.onCleanup(() => {
    alive = false;
    observer.disconnect();
    for (const img of loading) img.src = '';
    loading.clear();
    frames.length = 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });

  // 4. Opening text, once on load. These are children of the block the scroll fades out,
  //    so the two animations never touch the same element.
  //    Site: the tween takes its start state now and plays once `ready` settles, so the
  //    intro is not spent behind the preloader.
  if (env.intro && intro.length) {
    const tween = gsap.from(intro, {
      autoAlpha: 0,
      y: 24,
      duration: MOTION.duration.reveal,
      ease: MOTION.ease.reveal,
      stagger: MOTION.stagger.loose,
      delay: 0.1,
      lazy: false,
      paused: !!options.ready,
    });
    options.ready?.then(
      () => alive && tween.play(),
      () => alive && tween.play(),
    );
  }

  // 5. One scrubbed timeline. The empty tween makes it exactly one unit long, so every
  //    position and duration below reads as a share of the scroll.
  const timeline = gsap.timeline({
    defaults: { ease: MOTION.ease.scrub },
    scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true },
  });
  timeline.to({}, { duration: 1 }, 0);
  timeline.to(
    state,
    {
      frame: count - 1,
      duration: framesEnd,
      onUpdate: () => {
        wanted = Math.round(state.frame);
        draw();
      },
    },
    0,
  );
  if (out) timeline.to(out, { autoAlpha: 0, yPercent: -30, duration: 0.14 }, 0.02);
  if (scrim) timeline.to(scrim, { opacity: dim, duration: 0.16 }, framesEnd - 0.1);
  // If the gate's failsafe already put the closing text on screen, leave it there.
  if (into && !window.__motionShown?.has(into)) {
    timeline.fromTo(into, { autoAlpha: 0, y: 32 }, { autoAlpha: 1, y: 0, duration: 0.12, lazy: false }, framesEnd - 0.04);
  }

  // 6. Start loading a beat later, so the poster and the rest of the first paint go out
  //    first. If the page opened part-way down, fetch the frame under the reader first.
  //    Site: also wait for the window load event. The preloader stays up until that
  //    event, and frames requested earlier would hold it back.
  const start = () => {
    if (!alive) return;
    const at = Math.min(1, (timeline.scrollTrigger?.progress ?? 0) / framesEnd);
    void load(Math.round(at * (count - 1)));
    for (let n = 0; n < PARALLEL; n++) void worker();
  };
  if (document.readyState === 'complete') {
    gsap.delayedCall(0.1, start);
  } else {
    const onLoad = () => gsap.delayedCall(0.1, start);
    window.addEventListener('load', onLoad, { once: true });
    env.onCleanup(() => window.removeEventListener('load', onLoad));
  }
}
