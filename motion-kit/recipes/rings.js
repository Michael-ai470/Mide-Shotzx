// recipes/rings.js (Web Motion Kit)
// Progress rings: a gold ring draws itself round each step's number as the step scrolls in,
// and the step lights up when its ring closes. Rings in the same row close one after
// another. Scrubbed, so they unwind on the way back up.
//
// Markup hooks: [data-rings] the grid, [data-ring-step] each step, holding an SVG ring
// whose .op-ring-fill circle has pathLength="1" (so CSS draws it whole without scripts;
// the recipe swaps that for the real circumference). Only the fill's stroke-dashoffset moves;
// the .is-done class lights the step and CSS eases that.

import { gsap } from '../core/core.js';

/** @param {Element} scope  the [data-rings] grid  @param {import('../core/core.js').MotionEnv} env */
export function rings(scope, env) {
  const grid = /** @type {HTMLElement} */ (scope);
  const steps = Array.from(grid.querySelectorAll('[data-ring-step]'));
  if (!steps.length) return;
  grid.classList.add('is-rings');
  env.onCleanup(() => {
    grid.classList.remove('is-rings');
    steps.forEach((step) => step.classList.remove('is-done'));
  });

  const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length || 1;
  steps.forEach((step, i) => {
    const fill = step.querySelector('.op-ring-fill');
    if (!fill) return;
    const lag = (i % cols) * 6;
    // Real circumference, not pathLength="1": GSAP rounds a 1-to-0 dash to whole pixels.
    fill.removeAttribute('pathLength');
    const length = fill.getTotalLength();
    fill.style.strokeDasharray = `${length}`;
    env.onCleanup(() => {
      fill.setAttribute('pathLength', '1');
      fill.style.strokeDasharray = '';
    });
    gsap.fromTo(
      fill,
      { strokeDashoffset: length },
      {
        strokeDashoffset: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: step,
          start: `top ${86 - lag}%`,
          end: `top ${50 - lag}%`,
          scrub: 0.5,
          onUpdate: (self) => step.classList.toggle('is-done', self.progress > 0.97),
        },
      },
    );
  });
}
