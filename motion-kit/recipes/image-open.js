// recipes/image-open.js (Web Motion Kit)
// A picture that opens out of a narrow vertical slit as it scrolls into view, and settles
// from a slight zoom while it crosses the screen. Scrubbed, so it closes again on the way
// back up.
//
// Markup hooks: [data-open] the figure, [data-open-win] the window inside it (only its
// clip-path moves), with the <img> inside the window (only its scale moves).

import { gsap } from '../core/core.js';

/** @param {Element} scope  a container with one or more [data-open] figures */
export function imageOpen(scope) {
  const figures = [...(scope.matches?.('[data-open]') ? [scope] : []), ...scope.querySelectorAll('[data-open]')];
  figures.forEach((figure) => {
    const win = figure.querySelector('[data-open-win]');
    const img = win?.querySelector('img');
    if (!win) return;
    gsap.fromTo(
      win,
      { clipPath: 'inset(0% 44% 0% 44%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: figure, start: 'top 88%', end: 'top 32%', scrub: 0.6 } },
    );
    if (img) {
      gsap.fromTo(
        img,
        { scale: 1.3 },
        { scale: 1, ease: 'none', scrollTrigger: { trigger: figure, start: 'top bottom', end: 'bottom top', scrub: 0.6 } },
      );
    }
  });
}
