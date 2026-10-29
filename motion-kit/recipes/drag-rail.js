// recipes/drag-rail.js (Web Motion Kit)
// A row of cards you can grab and throw. dragRail() (wide screens) puts the cards
// [data-rail] in one row inside a clipping view, then follows the pointer: drag to move it,
// let go and it glides on with the throw and settles on the nearest card. The cards lean
// with the speed of the drag. Arrow buttons and focus (Tab into a card) move it too, and a
// bar tracks how far along it is. The row slides in once when first seen.
// Below the breakpoint the row is CSS: a native horizontal swipe (css/about.css).
//
// Markup: [data-rail-view] > [data-rail] > cards; [data-rail-prev], [data-rail-next],
// [data-rail-fill] (the bar) in a .ab-rail-bar the section shows with .is-rail-on.

import { gsap, ScrollTrigger, MOTION } from '../core/core.js';

/**
 * Run with { when: '(min-width: 769px)' }.
 * @param {Element} scope  the section
 * @param {import('../core/core.js').MotionEnv} env
 */
export function dragRail(scope, env) {
  const view = /** @type {HTMLElement | null} */ (scope.querySelector('[data-rail-view]'));
  const rail = /** @type {HTMLElement | null} */ (scope.querySelector('[data-rail]'));
  if (!view || !rail) return;
  const cards = /** @type {HTMLElement[]} */ (Array.from(rail.children));
  const prev = /** @type {HTMLButtonElement | null} */ (scope.querySelector('[data-rail-prev]'));
  const next = /** @type {HTMLButtonElement | null} */ (scope.querySelector('[data-rail-next]'));
  const fill = scope.querySelector('[data-rail-fill]');

  rail.classList.add('is-rail');
  scope.classList.add('is-rail-on');
  env.onCleanup(() => {
    rail.classList.remove('is-rail', 'is-dragging');
    scope.classList.remove('is-rail-on');
  });

  // Measured from the cards' layout boxes: scrollWidth would count their lean and slide-in.
  const length = () => {
    const last = cards[cards.length - 1];
    return last ? last.offsetLeft + last.offsetWidth - cards[0].offsetLeft : 0;
  };
  const max = () => Math.max(0, length() - view.clientWidth);
  // Card positions within the rail (offsetLeft counts from the nearest positioned ancestor).
  const stops = () => cards.map((card) => Math.min(max(), card.offsetLeft - cards[0].offsetLeft));
  const setX = gsap.quickSetter(rail, 'x', 'px');
  const lean = cards.map((card) => gsap.quickTo(card, 'skewX', { duration: 0.5, ease: 'power3.out' }));
  const state = { x: 0 };
  let glide = null;

  const render = () => {
    setX(-state.x);
    const m = max();
    if (fill) gsap.set(fill, { scaleX: m ? 0.2 + 0.8 * (state.x / m) : 1 });
    if (prev) prev.disabled = state.x <= 1;
    if (next) next.disabled = state.x >= m - 1;
  };
  const nearest = (x) => stops().reduce((best, s) => (Math.abs(s - x) < Math.abs(best - x) ? s : best), 0);
  const goTo = (x, duration = 0.9) => {
    glide?.kill();
    glide = gsap.to(state, { x: gsap.utils.clamp(0, max(), x), duration, ease: 'power3.out', onUpdate: render });
  };

  // Drag and throw.
  let drag = null;
  let dragged = false;
  const down = (e) => {
    if (e.button !== 0) return;
    glide?.kill();
    drag = { start: e.clientX, from: state.x, lastX: e.clientX, lastT: performance.now(), v: 0, moved: false };
    rail.setPointerCapture(e.pointerId);
  };
  const move = (e) => {
    if (!drag) return;
    const now = performance.now();
    const dx = e.clientX - drag.start;
    if (Math.abs(dx) > 4 && !drag.moved) {
      drag.moved = true;
      rail.classList.add('is-dragging');
    }
    const dt = Math.max(1, now - drag.lastT);
    drag.v = (e.clientX - drag.lastX) / dt; // px per ms
    drag.lastX = e.clientX;
    drag.lastT = now;
    let x = drag.from - dx;
    const m = max();
    if (x < 0) x *= 0.35; // a little give at the ends
    if (x > m) x = m + (x - m) * 0.35;
    state.x = x;
    render();
    const skew = gsap.utils.clamp(-8, 8, drag.v * -4);
    lean.forEach((to) => to(skew));
  };
  const up = () => {
    if (!drag) return;
    const thrown = state.x - drag.v * 380; // carry on with the throw
    rail.classList.remove('is-dragging');
    lean.forEach((to) => to(0));
    goTo(nearest(thrown), 1.1);
    dragged = drag.moved;
    setTimeout(() => (dragged = false), 0); // only the click that ends this drag
    drag = null;
  };
  // A drag is not a click on whatever was under the pointer.
  const click = (e) => {
    if (!dragged) return;
    e.preventDefault();
    e.stopPropagation();
  };
  rail.addEventListener('pointerdown', down);
  rail.addEventListener('pointermove', move);
  rail.addEventListener('pointerup', up);
  rail.addEventListener('pointercancel', up);
  rail.addEventListener('click', click, true);

  const step = (dir) => {
    const s = stops();
    const i = s.findIndex((v) => v > state.x + 2);
    const target = dir > 0 ? (i < 0 ? max() : s[i]) : [...s].reverse().find((v) => v < state.x - 2) ?? 0;
    goTo(target);
  };
  const onPrev = () => step(-1);
  const onNext = () => step(1);
  prev?.addEventListener('click', onPrev);
  next?.addEventListener('click', onNext);
  // Keyboard: a focused card is brought into view.
  const focus = (e) => {
    const card = cards.find((c) => c.contains(/** @type {Node} */ (e.target)));
    if (!card) return;
    view.scrollLeft = 0; // focus may have scrolled the clipping view; the rail moves instead
    const at = card.offsetLeft - cards[0].offsetLeft;
    const left = at - state.x;
    if (left < 0 || left + card.offsetWidth > view.clientWidth) goTo(nearest(at), 0.6);
  };
  rail.addEventListener('focusin', focus);
  const onResize = () => goTo(nearest(state.x), 0.3);
  window.addEventListener('resize', onResize);
  env.onCleanup(() => {
    glide?.kill();
    rail.removeEventListener('pointerdown', down);
    rail.removeEventListener('pointermove', move);
    rail.removeEventListener('pointerup', up);
    rail.removeEventListener('pointercancel', up);
    rail.removeEventListener('click', click, true);
    prev?.removeEventListener('click', onPrev);
    next?.removeEventListener('click', onNext);
    rail.removeEventListener('focusin', focus);
    window.removeEventListener('resize', onResize);
    gsap.set(cards, { clearProps: 'skewX' });
  });
  render();

  // Arrival: the row slides in from the right, the cards following one another.
  gsap.set(cards, { xPercent: 40, autoAlpha: 0, lazy: false });
  ScrollTrigger.create({
    trigger: view,
    start: 'top 85%',
    once: true,
    onEnter: () => gsap.to(cards, { xPercent: 0, autoAlpha: 1, duration: 1.2, ease: MOTION.ease.reveal, stagger: 0.07 }),
  });
}
