// recipes/flight-path.js (Web Motion Kit)
// A flight line through a row (or column) of steps. As the steps scroll past, the line
// draws itself with a small jet riding its tip, and each step lights up as the jet reaches
// it. Scrubbed, not pinned, so scrolling back takes the jet home again.
//
// Markup hooks:
//   [data-flight]        the steps' container. The recipe adds .is-flight (and .is-vertical).
//   [data-flight-rail]   the rail, inside it; [data-flight-line] the line that draws;
//   [data-flight-jet]    the jet. Line and jet are moved by GSAP and carry no transition.
//   [data-flight-step]   each step. Only its .is-lit class changes; CSS eases the light.

import { gsap } from '../core/core.js';

/**
 * @param {Element} scope  the [data-flight] container
 * @param {import('../core/core.js').MotionEnv} env
 * @param {{ axis?: 'x' | 'y' }} [options]  x: across the top (wide screens), y: down the side.
 */
export function flightPath(scope, env, options = {}) {
  const grid = /** @type {HTMLElement} */ (scope);
  const rail = grid.querySelector('[data-flight-rail]');
  const line = grid.querySelector('[data-flight-line]');
  const jet = grid.querySelector('[data-flight-jet]');
  const steps = Array.from(grid.querySelectorAll('[data-flight-step]'));
  if (!rail || !line || !jet || !steps.length) return;
  const across = (options.axis ?? 'x') === 'x';

  grid.classList.add('is-flight');
  if (!across) grid.classList.add('is-vertical');
  env.onCleanup(() => {
    grid.classList.remove('is-flight', 'is-vertical');
    steps.forEach((step) => step.classList.remove('is-lit'));
  });

  // Where along the rail each step begins, as a share of the rail.
  const length = () => (across ? rail.offsetWidth : rail.offsetHeight);
  let marks = [];
  const measure = () => {
    const r = rail.getBoundingClientRect();
    marks = steps.map((step) => {
      const s = step.getBoundingClientRect();
      const along = across ? s.left - r.left : s.top - r.top;
      return Math.max(0, along / (across ? r.width : r.height)) + 0.02;
    });
  };
  const light = (progress) => steps.forEach((step, i) => step.classList.toggle('is-lit', progress >= marks[i]));

  const scale = across ? 'scaleX' : 'scaleY';
  const move = across ? 'x' : 'y';
  const timeline = gsap.timeline({
    defaults: { ease: 'none' },
    onUpdate() {
      light(this.progress());
    },
    scrollTrigger: {
      trigger: grid,
      start: across ? 'top 78%' : 'top 62%',
      end: across ? 'bottom 42%' : 'bottom 62%',
      scrub: 0.6,
      invalidateOnRefresh: true,
      onRefresh: measure,
    },
  });
  timeline.fromTo(line, { [scale]: 0 }, { [scale]: 1, duration: 1 }, 0);
  timeline.fromTo(jet, { [move]: 0 }, { [move]: () => length(), duration: 1 }, 0);
  measure();
  light(0);
}
