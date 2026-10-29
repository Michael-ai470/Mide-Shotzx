// recipes/type-hero.js (Web Motion Kit)
// The Enquire hero: the heading types itself out, letter by letter, with a caret leading
// it, like a message being written. The caret blinks twice at the end and goes; then a gold
// pen stroke draws under the key word. The description and the chapter row follow. On
// scroll the copy lifts away.
//
// Markup hooks, inside the hero: [data-type-title] (gated heading), [data-type-stroke] (the
// underline path, inside an svg under the key word), [data-type-copy] (wrapper the scroll
// lifts), [data-type-part] (gated parts after the heading), [data-type-index] (chapter row).

import { gsap, MOTION, getSplitText } from '../core/core.js';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * @param {Element} scope  the hero section
 * @param {import('../core/core.js').MotionEnv} env
 * @param {{ ready?: Promise<unknown> }} [options]  ready: wait for it (the preloader
 *   lifting) and the fonts, never more than 3 seconds.
 */
export function typeHero(scope, env, options = {}) {
  const hero = /** @type {HTMLElement} */ (scope);
  const title = hero.querySelector('[data-type-title]');
  const stroke = /** @type {SVGPathElement | null} */ (hero.querySelector('[data-type-stroke]'));
  const copy = hero.querySelector('[data-type-copy]');
  const index = hero.querySelector('[data-type-index]');
  const parts = Array.from(hero.querySelectorAll('[data-type-part]'));
  const gated = Array.from(hero.querySelectorAll('[data-motion-hide]'));

  // The stroke draws with its real length (a 0..1 dash on pathLength rounds to whole pixels).
  const length = stroke?.getTotalLength?.() || 0;
  if (stroke && length) gsap.set(stroke, { strokeDasharray: length, strokeDashoffset: length, lazy: false });

  if (env.intro && title) {
    gsap.set(gated, { autoAlpha: 0, lazy: false });
    let alive = true;
    let timeline = null;
    let split = null;
    const caret = document.createElement('span');
    caret.className = 'ct-caret';
    caret.setAttribute('aria-hidden', 'true');
    env.onCleanup(() => {
      alive = false;
      timeline?.revert();
      caret.remove();
      split?.revert();
    });
    const settled = Promise.all([document.fonts?.ready, options.ready]).catch(() => {});
    Promise.race([settled, wait(3000)]).then(() => {
      if (!alive) return;
      const SplitText = getSplitText();
      if (!SplitText) return gsap.set(gated, { autoAlpha: 1 });
      split = SplitText.create(title, { type: 'chars,words' });
      const chars = /** @type {HTMLElement[]} */ (split.chars);
      gsap.set(chars, { autoAlpha: 0 });
      title.appendChild(caret);
      const place = (i) => {
        const at = chars[i];
        if (at) at.after(caret);
      };
      chars[0]?.before(caret);
      timeline = gsap.timeline({
        defaults: { ease: MOTION.ease.reveal },
        onComplete: () => {
          caret.remove();
          split?.revert();
          split = null;
          // The revert restores the heading's markup as it was when split, underline undrawn:
          // leave the new copy of the stroke drawn.
          const drawn = /** @type {SVGPathElement | null} */ (hero.querySelector('[data-type-stroke]'));
          if (drawn) drawn.style.strokeDashoffset = '0';
        },
      });
      timeline.set(title, { autoAlpha: 1 }, 0);
      // Typed at a human pace: a little slower after a space, like a thought between words.
      let at = 0.25;
      chars.forEach((ch, i) => {
        timeline.set(ch, { autoAlpha: 1 }, at).call(place, [i], at);
        const next = chars[i + 1];
        const pause = next && ch.parentElement !== next.parentElement ? 0.11 : 0;
        at += 0.045 + Math.random() * 0.025 + pause;
      });
      at += 0.6; // two blinks of the caret
      timeline.to(caret, { autoAlpha: 0, duration: 0.2 }, at);
      if (stroke && length) timeline.to(stroke, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' }, at - 0.2);
      at += 0.2;
      for (const part of parts) {
        timeline.fromTo(part, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: MOTION.duration.base }, at);
        at += 0.14;
      }
      const items = index ? Array.from(index.querySelectorAll('li')) : [];
      if (index) timeline.set(index.querySelector('[data-motion-hide]') || index, { autoAlpha: 1 }, at);
      if (items.length) timeline.from(items, { autoAlpha: 0, y: 14, duration: MOTION.duration.base, stagger: 0.08 }, at);
    });
  } else if (stroke && length) {
    gsap.set(stroke, { strokeDashoffset: 0 }); // already shown: the underline is simply there
  }

  // Scroll: the copy lifts away, the chapter row fades.
  const leave = { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6, invalidateOnRefresh: true };
  if (copy) gsap.to(copy, { y: () => -window.innerHeight * 0.28, autoAlpha: 0, ease: MOTION.ease.scrub, scrollTrigger: { ...leave, end: 'bottom 30%' } });
  if (index) gsap.to(index, { autoAlpha: 0, y: -24, ease: MOTION.ease.scrub, scrollTrigger: { ...leave, end: '30% top' } });
}
