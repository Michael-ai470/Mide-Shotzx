// recipes/doors.js (Web Motion Kit)
// Each step sits behind a door that swings open on its left hinge as the step scrolls in,
// and fades as it passes square to the page so it never covers the step beside it.
// Doors in the same row open one after another. Scrubbed, so they close on the way back.
//
// Markup hooks: [data-doors] the grid, [data-door-card] each step, with a .door inside it
// (aria-hidden; CSS shows it only while .is-doors is on). Only the door's transform and
// opacity move.

import { gsap } from '../core/core.js';

/** @param {Element} scope  the [data-doors] grid  @param {import('../core/core.js').MotionEnv} env */
export function doors(scope, env) {
  const grid = /** @type {HTMLElement} */ (scope);
  const cards = Array.from(grid.querySelectorAll('[data-door-card]'));
  if (!cards.length) return;
  grid.classList.add('is-doors');
  env.onCleanup(() => grid.classList.remove('is-doors'));

  const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length || 1;
  cards.forEach((card, i) => {
    const door = card.querySelector('.door');
    if (!door) return;
    const lag = (i % cols) * 7; // later columns open a little later
    gsap.fromTo(
      door,
      { rotationY: 0, autoAlpha: 1 },
      {
        keyframes: { '0%': { rotationY: 0, autoAlpha: 1 }, '72%': { autoAlpha: 1 }, '100%': { rotationY: -104, autoAlpha: 0 } },
        ease: 'none',
        scrollTrigger: { trigger: card, start: `top ${82 - lag}%`, end: `top ${38 - lag}%`, scrub: 0.6 },
      },
    );
  });
}
