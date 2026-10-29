// recipes/develop.js (Web Motion Kit)
// The founder's portrait develops like a darkroom print as it scrolls in: it starts washed
// out and warm (bright, sepia, soft) and comes up to full clarity; the gold rule under the
// name draws across as it lands. Scrubbed. The filter is on the frame [data-develop], not the
// photo, which keeps its own filter and hover zoom; [data-develop-rule] is the rule.

import { gsap } from '../core/core.js';

/** @param {Element} scope */
export function develop(scope) {
  const frame = scope.querySelector('[data-develop]');
  if (frame) {
    gsap.fromTo(
      frame,
      { filter: 'brightness(2.4) sepia(0.9) contrast(0.55) blur(7px)' },
      {
        filter: 'brightness(1) sepia(0) contrast(1) blur(0px)',
        ease: 'none',
        lazy: false,
        scrollTrigger: { trigger: frame, start: 'top 90%', end: 'center 50%', scrub: 0.8 },
      },
    );
  }
  const rule = scope.querySelector('[data-develop-rule]');
  if (rule) {
    gsap.fromTo(
      rule,
      { scaleX: 0 },
      { scaleX: 1, ease: 'none', lazy: false, scrollTrigger: { trigger: rule, start: 'top 85%', end: 'top 55%', scrub: 0.6 } },
    );
  }
}
