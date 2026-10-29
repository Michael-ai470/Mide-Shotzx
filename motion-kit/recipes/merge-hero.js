// recipes/merge-hero.js (Web Motion Kit)
// A full-screen hero that arrives as a merger: the photo is cut down the middle and the
// two halves slide together until they close on a gold seam, while the heading's first
// lines come in from opposite sides and meet (a line marked 0 rises instead), the
// description follows, then the deal index along the bottom draws its rule and its
// chapters rise. On scroll the copy lifts away and the index fades; the halves stay
// together (a gap between them reads as a broken photo).
//
// Markup hooks, inside the hero:
//   [data-merge-half="-1|1"]   the clipped half itself (left -1, right 1); the intro
//                              slides these. With scripts off they sit together.
//   [data-merge-seam]          the gold line where the halves meet (decorative)
//   [data-merge-copy]          wrapper the scroll lifts; holds the gated parts:
//     [data-merge-part="fade"]          fades up
//     [data-merge-part="lines"]         the heading; its [data-merge-from="-1|0|1"]
//                                       lines come from the left, below or the right
//     [data-merge-part="desc"]          rises
//   [data-merge-index]         wrapper the scroll fades; holds the gated index:
//     [data-merge-rule]                 draws across
//     [data-merge-item]                 rise in turn
// The intro animates halves, lines and items; the scroll animates the copy and index
// wrappers, so no element has two jobs.

import { gsap, MOTION } from '../core/core.js';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * @param {Element} scope  the hero section
 * @param {import('../core/core.js').MotionEnv} env
 * @param {{ ready?: Promise<unknown> }} [options]  ready: the intro waits for it (the
 *   preloader lifting), the fonts and the photo, never more than 3 seconds.
 */
export function mergeHero(scope, env, options = {}) {
  const hero = /** @type {HTMLElement} */ (scope);
  const all = (sel) => Array.from(hero.querySelectorAll(sel));
  const halves = all('[data-merge-half]');
  const seam = hero.querySelector('[data-merge-seam]');
  const copy = hero.querySelector('[data-merge-copy]');
  const index = hero.querySelector('[data-merge-index]');
  const parts = all('[data-merge-part]');
  const lines = all('[data-merge-from]');
  const rule = hero.querySelector('[data-merge-rule]');
  const items = all('[data-merge-item]');
  const gated = all('[data-motion-hide]');
  const side = (el, attr) => parseFloat(el.getAttribute(attr)) || 0;

  // 1. Intro, once.
  if (env.intro) {
    // Start states, held from the first frame. The halves open a gap down the middle.
    gsap.set(halves, { xPercent: (i, el) => side(el, 'data-merge-half') * 16, lazy: false });
    gsap.set(gated, { autoAlpha: 0, lazy: false });
    gsap.set(lines, {
      x: (i, el) => side(el, 'data-merge-from') * window.innerWidth * 0.35,
      yPercent: (i, el) => (side(el, 'data-merge-from') ? 0 : 60),
      autoAlpha: 0,
      lazy: false,
    });
    if (rule) gsap.set(rule, { scaleX: 0, lazy: false });
    gsap.set(items, { autoAlpha: 0, y: 18, lazy: false });

    let alive = true;
    let timeline = null;
    env.onCleanup(() => {
      alive = false;
      timeline?.revert();
    });

    // The merge needs the photo: wait for it to decode as well.
    const photo = hero.querySelector('[data-merge-half] img');
    const decoded = photo?.decode ? photo.decode().catch(() => {}) : null;
    const settled = Promise.all([document.fonts?.ready, options.ready, decoded]).catch(() => {});
    Promise.race([settled, wait(3000)]).then(() => {
      if (!alive) return;
      timeline = gsap.timeline({ defaults: { ease: MOTION.ease.reveal } });
      // Gated wrappers show at once; the parts that fade keep their own start state.
      timeline.set(gated.filter((el) => !['fade', 'desc'].includes(el.dataset.mergePart)), { autoAlpha: 1 }, 0);
      // The halves close in one confident move; the seam flares as they meet, then goes.
      timeline.to(halves, { xPercent: 0, duration: 1.5, ease: MOTION.ease.inOut }, 0);
      if (seam) {
        timeline.fromTo(seam, { opacity: 0, scaleY: 0.2 }, { opacity: 1, scaleY: 1, duration: 0.35, ease: 'power2.out' }, 1.25);
        timeline.to(seam, { opacity: 0, duration: 1.1, ease: 'power2.inOut' }, 1.75);
      }
      // "Mergers &" and "Acquisitions" travel in from either side and land with the halves.
      const meet = lines.filter((el) => side(el, 'data-merge-from'));
      const rise = lines.filter((el) => !side(el, 'data-merge-from'));
      timeline.to(meet, { x: 0, autoAlpha: 1, duration: 1.45, ease: MOTION.ease.inOut, stagger: 0.06 }, 0.1);
      if (rise.length) timeline.to(rise, { yPercent: 0, autoAlpha: 1, duration: MOTION.duration.reveal }, 1.25);
      let at = 0.3;
      for (const part of parts) {
        const kind = part.dataset.mergePart;
        if (kind === 'lines') continue;
        const when = kind === 'fade' ? at : 1.45;
        timeline.fromTo(part, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: MOTION.duration.base }, when);
        at += 0.12;
      }
      if (rule) timeline.to(rule, { scaleX: 1, duration: 1.2, ease: MOTION.ease.inOut }, 1.55);
      if (items.length) timeline.to(items, { autoAlpha: 1, y: 0, duration: MOTION.duration.base, stagger: 0.09 }, 1.8);
    });
  }

  // 2. Scroll: the copy lifts away and the index fades as the hero leaves.
  const leave = { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6, invalidateOnRefresh: true };
  if (copy) gsap.to(copy, { y: () => -window.innerHeight * 0.3, autoAlpha: 0, ease: MOTION.ease.scrub, scrollTrigger: { ...leave, end: 'bottom 30%' } });
  if (index) gsap.to(index, { autoAlpha: 0, y: -24, ease: MOTION.ease.scrub, scrollTrigger: { ...leave, end: '30% top' } });
}
