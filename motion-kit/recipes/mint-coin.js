// recipes/mint-coin.js (Web Motion Kit)
// "One asset, a thousand tokens": a gold coin that turns to show, for each asset in turn,
// its imprint (an engraving of the jet, the yacht, the villa, the painting) on one face and
// the fraction a token buys (the asset's photo with one cell of a fine grid lit) on the
// other. Eight faces in all: jet imprint, jet fraction, yacht imprint, and so on.
//
// The coin has only two physical faces. Each holds all four variants, and the hidden face
// swaps to the next asset while it is turned away (front: the nearest whole turn; back: the
// half turn it is on), so the turn never shows a swap.
//
// mintCoin() is the controller and is not motion: it renders an angle, keeps the asset
// list, the side caption and the arrows in step, and turns the coin with the arrows, the
// list, a tap or a swipe. With motion allowed a turn is a tween; otherwise the face just
// changes. mintScrub() (wide screens, inside createMotion) hands the angle to the scroll
// while the section holds on screen (CSS sticky, css/token.css), resting on each face.
// mintTilt() (hover screens) leans the coin toward the pointer. mintIntro() raises it in.
//
// Markup: [data-mint] holding [data-mint-coin] (the turning disc) inside [data-mint-tilt]
// inside [data-mint-visual]; [data-mint-front="i"] and [data-mint-back="i"] variants;
// [data-mint-item="i"] buttons; [data-mint-side] caption; [data-mint-prev], [data-mint-next].

import { gsap, ScrollTrigger, MOTION } from '../core/core.js';
import { getLenis } from '../core/smooth-scroll.js';

const FACES = 8; // 4 assets × imprint and fraction
const LAST = FACES - 1;
const clamp = (min, max, v) => Math.min(max, Math.max(min, v));
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** @param {Element} scope */
export function mintCoin(scope) {
  const root = /** @type {HTMLElement | null} */ (scope.matches('[data-mint]') ? scope : scope.querySelector('[data-mint]'));
  const coin = /** @type {HTMLElement | null} */ (root?.querySelector('[data-mint-coin]'));
  if (!root || !coin) return null;
  const fronts = Array.from(root.querySelectorAll('[data-mint-front]'));
  const backs = Array.from(root.querySelectorAll('[data-mint-back]'));
  const items = Array.from(root.querySelectorAll('[data-mint-item]'));
  const side = root.querySelector('[data-mint-side]');
  const prev = /** @type {HTMLButtonElement | null} */ (root.querySelector('[data-mint-prev]'));
  const next = /** @type {HTMLButtonElement | null} */ (root.querySelector('[data-mint-next]'));
  const names = items.map((item) => item.querySelector('.te-mint-name')?.textContent || '');
  root.classList.add('is-live');

  let angle = 0;
  let face = -1;
  let tween = null;
  let driver = null; // set while the scroll drives the coin

  const render = (deg) => {
    angle = deg;
    coin.style.transform = `rotateY(${deg.toFixed(2)}deg)`;
    coin.style.setProperty('--shine', (((deg % 360) + 360) % 360 / 360).toFixed(3));
    const front = clamp(0, 3, Math.round(deg / 360));
    const back = clamp(0, 3, Math.floor(deg / 360));
    fronts.forEach((el, i) => el.classList.toggle('is-on', i === front));
    backs.forEach((el, i) => el.classList.toggle('is-on', i === back));
    const k = clamp(0, LAST, Math.round(deg / 180));
    if (k === face) return;
    face = k;
    const asset = k >> 1;
    items.forEach((item, i) => {
      item.classList.toggle('is-active', i === asset);
      item.setAttribute('aria-current', i === asset ? 'true' : 'false');
    });
    if (side) side.textContent = `${k % 2 ? 'Your fraction' : 'The imprint'} · ${names[asset]} · face ${k + 1} of ${FACES}`;
    if (prev) prev.disabled = k === 0;
    if (next) next.disabled = k === LAST;
  };

  /** Turns to face k: a tween when motion is on, otherwise at once. */
  const turnTo = (k) => {
    k = clamp(0, LAST, k);
    if (driver) return driver(k);
    tween?.kill();
    const to = k * 180;
    if (!gsap || reduced()) return render(to);
    const proxy = { a: angle };
    tween = gsap.to(proxy, {
      a: to,
      duration: 0.6 + Math.min(4, Math.abs(to - angle) / 180) * 0.25,
      ease: 'power3.inOut',
      onUpdate: () => render(proxy.a),
    });
  };
  const current = () => clamp(0, LAST, Math.round(angle / 180));

  prev?.addEventListener('click', () => turnTo(current() - 1));
  next?.addEventListener('click', () => turnTo(current() + 1));
  // An asset in the list turns to its imprint, or to its fraction if the imprint is showing.
  items.forEach((item, i) =>
    item.addEventListener('click', () => {
      turnTo(current() === i * 2 ? i * 2 + 1 : i * 2);
      // Narrow screens: the coin sits above the list; bring it back into view to watch it turn.
      const box = coin.getBoundingClientRect();
      if (!driver && (box.bottom < 80 || box.top > window.innerHeight)) {
        const y = window.scrollY + box.top - (window.innerHeight - box.height) / 2;
        const lenis = getLenis();
        if (lenis) lenis.scrollTo(y, { duration: 0.9 });
        else window.scrollTo({ top: y, behavior: reduced() ? 'auto' : 'smooth' });
      }
    }),
  );
  // Tap the coin for the next face; swipe it either way.
  let down = null;
  coin.parentElement?.addEventListener('pointerdown', (e) => (down = { x: e.clientX, y: e.clientY, t: performance.now() }));
  coin.parentElement?.addEventListener('pointerup', (e) => {
    if (!down || driver) return (down = null);
    const dx = e.clientX - down.x;
    const dy = e.clientY - down.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) turnTo(current() + (dx < 0 ? 1 : -1));
    else if (Math.abs(dx) < 8 && Math.abs(dy) < 8 && performance.now() - down.t < 500) turnTo(current() === LAST ? 0 : current() + 1);
    down = null;
  });

  render(0);
  return {
    root,
    coin,
    render,
    turnTo,
    current,
    /** While set, turnTo(k) is handed to fn (the scroll); returns a release function. */
    drive: (fn) => {
      tween?.kill();
      driver = fn;
      return () => (driver = null);
    },
  };
}

/** Rest on each face: the turn happens in the middle 55% of each step. */
const rest = (x) => {
  const k = Math.floor(x);
  const f = clamp(0, 1, (x - k - 0.225) / 0.55);
  return k + f * f * (3 - 2 * f);
};

/**
 * Wide screens: the scroll turns the coin while the section holds (CSS sticky).
 * Run with { when: '(min-width: 1025px)' }.
 * @param {ReturnType<typeof mintCoin>} api
 * @param {import('../core/core.js').MotionEnv} env
 */
export function mintScrub(api, env) {
  if (!api) return;
  const { root, render } = api;
  root.classList.add('is-scrubbed');
  env.onCleanup(() => root.classList.remove('is-scrubbed'));
  // Eight equal slots of scroll, one per face; each face rests in the middle of its slot.
  const show = (p) => render(rest(clamp(0, LAST, p * FACES - 0.5)) * 180);
  const proxy = { p: 0 };
  const tween = gsap.to(proxy, {
    p: 1,
    ease: 'none',
    onUpdate: () => show(proxy.p),
    scrollTrigger: {
      trigger: root,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.8,
      invalidateOnRefresh: true,
      // A refresh (a reload part-way down) sets the progress without an update: draw it.
      onRefresh: (self) => show(self.progress),
    },
  });
  // The list and arrows scroll to a face instead of turning the coin themselves.
  env.onCleanup(
    api.drive((k) => {
      const st = tween.scrollTrigger;
      if (!st) return;
      const y = st.start + ((k + 0.5) / FACES) * (st.end - st.start);
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(y, { duration: 1.2 });
      else window.scrollTo({ top: y, behavior: 'smooth' });
    }),
  );
}

/**
 * Hover screens: the coin leans toward the pointer. Run with { when: 'hover' }.
 * @param {Element} scope
 * @param {import('../core/core.js').MotionEnv} env
 */
export function mintTilt(scope, env) {
  const tilt = /** @type {HTMLElement | null} */ (scope.querySelector('[data-mint-tilt]'));
  const area = scope.querySelector('[data-mint-visual]');
  if (!tilt || !area) return;
  const rx = gsap.quickTo(tilt, 'rotationX', { duration: 0.8, ease: 'power3.out' });
  const ry = gsap.quickTo(tilt, 'rotationY', { duration: 0.8, ease: 'power3.out' });
  const move = (e) => {
    const box = area.getBoundingClientRect();
    rx(((box.top + box.height / 2 - e.clientY) / box.height) * 14);
    ry(((e.clientX - (box.left + box.width / 2)) / box.width) * 18);
  };
  const leave = () => {
    rx(0);
    ry(0);
  };
  area.addEventListener('pointermove', move);
  area.addEventListener('pointerleave', leave);
  env.onCleanup(() => {
    area.removeEventListener('pointermove', move);
    area.removeEventListener('pointerleave', leave);
  });
}

/**
 * The coin rises in, already turning a little, the first time the section is seen.
 * @param {Element} scope
 */
export function mintIntro(scope) {
  const visual = scope.querySelector('[data-mint-visual]');
  if (!visual) return;
  gsap.set(visual, { autoAlpha: 0, scale: 0.82, y: 40, lazy: false });
  ScrollTrigger.create({
    trigger: visual,
    start: 'top 85%',
    once: true,
    onEnter: () => gsap.to(visual, { autoAlpha: 1, scale: 1, y: 0, duration: 1.3, ease: MOTION.ease.reveal }),
  });
}
