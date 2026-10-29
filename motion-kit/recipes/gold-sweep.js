// recipes/gold-sweep.js (Web Motion Kit)
// The gold-leaf sweep: text revealed left to right by a soft-edged mask, as if a sheet of
// light were drawn across it. CSS builds the mask from --sweep (0 hidden, 1 whole, the
// default), so only that one number moves and the text is whole without scripts.
//
// Markup hooks: [data-sweep] (CSS mask; played by a page's intro), [data-sweep-enter]
// (also carries [data-sweep]; plays the first time it scrolls into view).

import { gsap } from '../core/core.js';

/** A paused-or-playing tween that sweeps `el` in. Add it to a timeline or let it play. */
export function sweepIn(el, vars = {}) {
  return gsap.fromTo(el, { '--sweep': 0 }, { '--sweep': 1, duration: 1.5, ease: 'power2.inOut', ...vars });
}

/** Sweeps each [data-sweep-enter] in the scope the first time it is seen. */
export function sweepOnEnter(scope) {
  const els = [...(scope.matches?.('[data-sweep-enter]') ? [scope] : []), ...scope.querySelectorAll('[data-sweep-enter]')];
  els.forEach((el) => {
    sweepIn(el, { scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' } });
  });
}
