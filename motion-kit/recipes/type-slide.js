// recipes/type-slide.js (Web Motion Kit)
// Values in big type. Each [data-slide-row] slides its name [data-slide-name] in from the
// side (rows alternate left and right) as it scrolls up the screen, its numeral
// [data-slide-num] travels the other way, and its text [data-slide-text] comes into focus.
// Scrubbed, so scrolling back sends them out again. The section clips the overflow.

import { gsap } from '../core/core.js';

/** @param {Element} scope */
export function typeSlide(scope) {
  scope.querySelectorAll('[data-slide-row]').forEach((row, i) => {
    const dir = i % 2 ? 1 : -1;
    const name = row.querySelector('[data-slide-name]');
    const num = row.querySelector('[data-slide-num]');
    const text = row.querySelector('[data-slide-text]');
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: row, start: 'top bottom', end: 'top 45%', scrub: 0.7 },
    });
    if (name) tl.fromTo(name, { xPercent: dir * 60, autoAlpha: 0.15 }, { xPercent: 0, autoAlpha: 1, lazy: false }, 0);
    if (num) tl.fromTo(num, { xPercent: dir * -120, autoAlpha: 0 }, { xPercent: 0, autoAlpha: 1, lazy: false }, 0.1);
    if (text) tl.fromTo(text, { autoAlpha: 0, filter: 'blur(8px)', y: 20 }, { autoAlpha: 1, filter: 'blur(0px)', y: 0, lazy: false }, 0.35);
  });
}
