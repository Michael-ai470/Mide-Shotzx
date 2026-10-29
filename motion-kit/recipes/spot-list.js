// recipes/spot-list.js (Web Motion Kit)
// A spotlight list. The item crossing the middle of the screen is lit and opens its text;
// the rest dim to their titles. Clicking (or Enter on) an item brings it to the middle.
// Nothing is pinned and GSAP animates nothing here: the recipe only moves classes, and
// CSS eases the opacity and the opening (css/jetel.css, .is-spot).
//
// Markup hooks: [data-spot] the list, [data-spot-item] each item, with its text inside a
// .spot-body wrapper. Without the recipe the list is whatever the plain CSS makes it.

import { ScrollTrigger } from '../core/core.js';
import { getLenis } from '../core/smooth-scroll.js';

/**
 * @param {Element} scope  the [data-spot] list
 * @param {import('../core/core.js').MotionEnv} env
 * @param {{ line?: number }} [options]  line: where "the middle" is, as a share of the
 *   screen height from the top. Default 0.55.
 */
export function spotList(scope, env, options = {}) {
  const list = /** @type {HTMLElement} */ (scope);
  const items = Array.from(list.querySelectorAll('[data-spot-item]'));
  if (items.length < 2) return;
  const line = options.line ?? 0.55;

  list.classList.add('is-spot');
  let active = -1;
  const set = (i) => {
    if (i === active) return;
    active = i;
    items.forEach((item, k) => {
      item.classList.toggle('is-on', k === i);
    });
  };
  // One item is always open, so the list keeps the same height as you scroll through it.
  set(0);

  const pick = () => {
    const y = window.innerHeight * line;
    let i = 0;
    items.forEach((item, k) => {
      if (item.getBoundingClientRect().top < y) i = k;
    });
    set(i);
  };
  ScrollTrigger.create({ trigger: list, start: 'top bottom', end: 'bottom top', onUpdate: pick, onRefresh: pick });

  const bring = (item) => {
    const y = window.scrollY + item.getBoundingClientRect().top - window.innerHeight * (line - 0.08);
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(y, { duration: 1 });
    else window.scrollTo({ top: y, behavior: 'smooth' });
  };
  const offs = items.map((item) => {
    item.tabIndex = 0;
    const onClick = () => bring(item);
    const onKey = (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        bring(item);
      }
    };
    item.addEventListener('click', onClick);
    item.addEventListener('keydown', onKey);
    return () => {
      item.removeEventListener('click', onClick);
      item.removeEventListener('keydown', onKey);
      item.removeAttribute('tabindex');
      item.classList.remove('is-on');
    };
  });

  env.onCleanup(() => {
    offs.forEach((off) => off());
    list.classList.remove('is-spot');
  });
}
