// recipes/assemble.js (Web Motion Kit)
//   assemble:  cards come in scattered (offset, turned, smaller, faded) and settle into
//              their grid as the grid scrolls in. Scrubbed, so they scatter again on the way
//              back up. Every card has its own fixed scatter, so it is the same every visit.
//   spotlight: on hover screens, a soft gold light follows the cursor across the cards
//              (CSS reads --lx and --ly; .is-lit turns it on). Run it with { when: 'hover' }.
//
// Markup hooks: [data-assemble] on the grid, [data-assemble-card] on each card. Only the
// cards' transform and opacity move; the light is a ::before layer with its own fade.

import { gsap } from '../core/core.js';

const SCATTER = [
  { x: -90, y: 120, rotation: -9 },
  { x: 40, y: 190, rotation: 7 },
  { x: -30, y: 150, rotation: -5 },
  { x: 100, y: 110, rotation: 10 },
];

/** @param {Element} scope  the [data-assemble] grid */
export function assemble(scope) {
  const cards = Array.from(scope.querySelectorAll('[data-assemble-card]'));
  if (!cards.length) return;
  const narrow = window.matchMedia('(max-width: 768px)').matches;
  const s = (i) => SCATTER[i % SCATTER.length];
  gsap.fromTo(
    cards,
    {
      x: (i) => s(i).x * (narrow ? 0.4 : 1),
      y: (i) => s(i).y,
      rotation: (i) => s(i).rotation,
      scale: 0.86,
      autoAlpha: 0,
    },
    {
      x: 0,
      y: 0,
      rotation: 0,
      scale: 1,
      autoAlpha: 1,
      ease: 'none',
      stagger: 0.1,
      scrollTrigger: { trigger: scope, start: 'top 92%', end: narrow ? 'bottom 75%' : 'top 38%', scrub: 0.8 },
    },
  );
}

/** @param {Element} scope  the [data-assemble] grid  @param {import('../core/core.js').MotionEnv} env */
export function spotlight(scope, env) {
  const grid = /** @type {HTMLElement} */ (scope);
  const cards = Array.from(grid.querySelectorAll('[data-assemble-card]'));
  const onMove = (event) => {
    for (const card of cards) {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--lx', `${event.clientX - r.left}px`);
      card.style.setProperty('--ly', `${event.clientY - r.top}px`);
    }
  };
  const onEnter = () => grid.classList.add('is-lit');
  const onLeave = () => grid.classList.remove('is-lit');
  grid.addEventListener('mousemove', onMove);
  grid.addEventListener('mouseenter', onEnter);
  grid.addEventListener('mouseleave', onLeave);
  env.onCleanup(() => {
    grid.removeEventListener('mousemove', onMove);
    grid.removeEventListener('mouseenter', onEnter);
    grid.removeEventListener('mouseleave', onLeave);
    grid.classList.remove('is-lit');
    cards.forEach((card) => {
      card.style.removeProperty('--lx');
      card.style.removeProperty('--ly');
    });
  });
}
