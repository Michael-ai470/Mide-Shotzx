// recipes/frost.js (Web Motion Kit)
//   unfrost:   a photo starts behind frosted glass (blurred, dimmed, slightly enlarged) and
//              comes clear as it scrolls into view. One large layer, so the filter is fine.
//   highlight: a phrase gets a gold highlighter stroke drawn under it as you read down.
// Both scrubbed, so they reverse on the way back up.
//
// Markup hooks: [data-frost] a figure with one <img> (only the image's filter and scale
// move); [data-highlight] an inline span whose background is the stroke (CSS draws it
// whole; only its background-size moves).

import { gsap } from '../core/core.js';

const each = (scope, sel) => [...(scope.matches?.(sel) ? [scope] : []), ...scope.querySelectorAll(sel)];

/** @param {Element} scope */
export function unfrost(scope) {
  each(scope, '[data-frost]').forEach((figure) => {
    const img = figure.querySelector('img');
    if (!img) return;
    gsap.fromTo(
      img,
      { filter: 'blur(18px) brightness(0.6) saturate(0.9)', scale: 1.14 },
      {
        filter: 'blur(0px) brightness(0.85) saturate(0.9)',
        scale: 1,
        ease: 'none',
        scrollTrigger: { trigger: figure, start: 'top 90%', end: 'center 64%', scrub: 0.6 },
      },
    );
  });
}

/** @param {Element} scope */
export function highlight(scope) {
  each(scope, '[data-highlight]').forEach((el) => {
    gsap.fromTo(
      el,
      { backgroundSize: '0% 100%' },
      { backgroundSize: '100% 100%', ease: 'none', scrollTrigger: { trigger: el, start: 'top 82%', end: 'top 58%', scrub: 0.6 } },
    );
  });
}
