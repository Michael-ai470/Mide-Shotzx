// recipes/side-rail.js (Web Motion Kit)
// A row of panels that slides sideways while the section is pinned. Scroll down and the
// panels move in from the right; scroll up and they go back. Runs on every screen size.
// Inside each panel the image drifts against the movement and the big outline numeral
// lags behind, so the panels read as layers rather than one flat strip.
//
// Markup hooks:
//   [data-rail]          the section. The recipe makes it taller while it runs.
//   [data-rail-stage]    what stays on screen (sticky).
//   [data-rail-track]    the row that moves; [data-rail-panel] children.
//   .rail-fig img        optional, drifts inside its frame.
//   .rail-num            optional, the outline numeral behind a panel.
//   [data-rail-idx]      optional "01" counter.
//   [data-rail-caption]  optional caption, takes each panel's data-rail-label.
//   [data-rail-bar]      optional progress line (scaleX 0..1).
//
// Without scripts or with reduced motion, CSS leaves the panels in a swipe row.

import { gsap, ScrollTrigger } from '../core/core.js';
import { getLenis } from '../core/smooth-scroll.js';

const pad = (n) => String(n).padStart(2, '0');

/**
 * @param {Element} scope  the [data-rail] section
 * @param {import('../core/core.js').MotionEnv} env
 * @param {{ step?: number, hold?: number }} [options]
 *   step: scroll per panel, in svh. Default 75.
 *   hold: share of the scroll that holds the last panel before the page moves on. Default 0.08.
 */
export function sideRail(scope, env, options = {}) {
  const section = /** @type {HTMLElement} */ (scope);
  const stage = section.querySelector('[data-rail-stage]');
  const track = section.querySelector('[data-rail-track]');
  const panels = Array.from(section.querySelectorAll('[data-rail-panel]'));
  if (!stage || !track || panels.length < 2) return;

  const n = panels.length;
  const step = options.step ?? 75;
  const hold = options.hold ?? 0.08;
  const imgs = panels.map((p) => p.querySelector('.rail-fig img'));
  const nums = panels.map((p) => p.querySelector('.rail-num'));
  const idx = section.querySelector('[data-rail-idx]');
  const caption = section.querySelector('[data-rail-caption]');
  const bar = section.querySelector('[data-rail-bar]');

  // 1. Running layout. CSS keys off .is-railing; the height lives in an inline style.
  const before = section.getAttribute('style');
  section.classList.add('is-railing');
  section.style.height = `calc(100svh + ${(n - 1) * step}svh)`;

  // Lazy images in panels that start off to the side would wait until the reader is
  // already looking at them. They are near, so load them now.
  imgs.forEach((img) => img && (img.loading = 'eager'));

  // How far the row has to travel so the last panel ends where the first one began.
  let travel = 0;
  const measure = () => {
    section.style.setProperty('--rail-avail', `${Math.max(160, track.clientHeight - 8)}px`);
    const last = panels[n - 1];
    travel = Math.max(0, last.offsetLeft - panels[0].offsetLeft);
  };
  measure();

  // 2. Per-frame setters. Everything below is transform or opacity, nothing that lays out.
  const setX = gsap.quickSetter(track, 'x', 'px');
  const imgX = imgs.map((img) => (img ? gsap.quickSetter(img, 'xPercent') : null));
  const numX = nums.map((num) => (num ? gsap.quickSetter(num, 'x', 'px') : null));
  const setBar = bar ? gsap.quickSetter(bar, 'scaleX') : null;

  let active = -1;
  let swap = null;
  const show = (i) => {
    if (i === active) return;
    active = i;
    if (idx) idx.textContent = pad(i + 1);
    panels.forEach((p, k) => p.toggleAttribute('data-active', k === i));
    if (caption) {
      const label = panels[i].getAttribute('data-rail-label') || '';
      caption.classList.add('is-swap');
      swap?.kill();
      swap = gsap.delayedCall(0.18, () => {
        caption.textContent = label;
        caption.classList.remove('is-swap');
      });
    }
  };

  const render = (progress) => {
    const t = Math.min(1, progress / (1 - hold)); // 0..1 across the travel
    const x = -travel * t;
    setX(x);
    const c = t * (n - 1); // 0 .. n-1, the panel under the reader
    for (let i = 0; i < n; i++) {
      const d = Math.max(-1.5, Math.min(1.5, i - c)); // where panel i sits: <0 gone left, >0 waiting right
      imgX[i]?.(-Math.max(-1, Math.min(1, d)) * 5); // the image is scaled 1.12, so 5% never shows an edge
      numX[i]?.(d * stage.clientWidth * 0.18);
    }
    setBar?.(progress);
    show(Math.round(c));
  };

  // 3. Scroll. Lenis already smooths the scroll, so the scrub only takes the edge off.
  const trigger = ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    scrub: false,
    invalidateOnRefresh: true,
    onRefreshInit: () => setX(0),
    onRefresh: (self) => {
      measure();
      render(self.progress);
    },
    onUpdate: (self) => render(self.progress),
  });
  render(trigger.progress);

  // 4. Keyboard. Tabbing to a link in a panel off to the side must not scroll the
  //    clipped stage sideways (that would break the layout); move the page instead.
  const onFocus = (event) => {
    const panel = /** @type {Element} */ (event.target).closest?.('[data-rail-panel]');
    stage.scrollLeft = 0;
    if (!panel) return;
    const i = panels.indexOf(panel);
    if (i < 0 || i === active) return;
    const at = trigger.start + (trigger.end - trigger.start) * (1 - hold) * (i / (n - 1));
    const lenis = getLenis();
    lenis ? lenis.scrollTo(at, { immediate: true }) : window.scrollTo(0, at);
  };
  stage.addEventListener('focusin', onFocus);

  // The track size changes with the viewport; panels' widths come from CSS.
  const observer = new ResizeObserver(() => {
    measure();
    render(trigger.progress);
  });
  observer.observe(track);

  env.onCleanup(() => {
    swap?.kill();
    observer.disconnect();
    stage.removeEventListener('focusin', onFocus);
    trigger.kill();
    section.classList.remove('is-railing');
    before === null ? section.removeAttribute('style') : section.setAttribute('style', before);
    gsap.set([track, ...imgs.filter(Boolean), ...nums.filter(Boolean)], { clearProps: 'transform' });
    if (bar) gsap.set(bar, { clearProps: 'transform' });
    panels.forEach((p) => p.removeAttribute('data-active'));
  });
}
