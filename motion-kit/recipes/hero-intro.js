// recipes/hero-intro.js (Web Motion Kit)
// A full-screen page hero. On load the copy arrives in order: small parts fade up, the
// heading and the line under it rise out of a mask line by line (engine 6.2), timed as one
// sequence. On scroll the whole copy block lifts and fades as the hero leaves (engine 6.1).
//
// Markup hooks, inside the hero:
//   [data-hero-copy]   the block that lifts away on scroll. Only its y and opacity move.
//   [data-hero-lines]  text that rises line by line (the heading, the subheading).
//   [data-hero-fade]   small parts that fade up (eyebrow, pills).
// Parts play in document order. Every [data-hero-lines] and [data-hero-fade] carries
// data-motion-hide and sits inside the [data-hero-copy] block, so the intro (children) and
// the scroll lift (the block) never animate the same element.

import { gsap, MOTION, getSplitText } from '../core/core.js';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * @param {Element} scope  the hero section
 * @param {import('../core/core.js').MotionEnv} env
 * @param {{ ready?: Promise<unknown> }} [options]  ready: the intro waits for it (the
 *   preloader lifting), and for the fonts, but never more than 3 seconds.
 */
export function heroIntro(scope, env, options = {}) {
  const hero = /** @type {HTMLElement} */ (scope);
  const copy = hero.querySelector('[data-hero-copy]');
  const parts = Array.from(hero.querySelectorAll('[data-hero-lines], [data-hero-fade]'));

  // 1. Intro, once. Parts are held invisible from the first frame, then split and played
  //    once the preloader is up and the fonts are in, so the line breaks are the real ones.
  if (env.intro && parts.length) {
    gsap.set(parts, { autoAlpha: 0, lazy: false });
    let alive = true;
    let timeline = null;
    const splits = [];
    env.onCleanup(() => {
      alive = false;
      timeline?.revert();
      splits.forEach((split) => split.revert());
    });

    const settled = Promise.all([document.fonts?.ready, options.ready]).catch(() => {});
    Promise.race([settled, wait(3000)]).then(() => {
      if (!alive) return;
      const SplitText = getSplitText();
      timeline = gsap.timeline({
        defaults: { ease: MOTION.ease.reveal },
        // Put the text back as plain text once it has landed, so it reflows on resize.
        onComplete: () => splits.splice(0).forEach((split) => split.revert()),
      });
      let at = 0.1;
      for (const part of parts) {
        if (part.hasAttribute('data-hero-lines') && SplitText) {
          const split = SplitText.create(part, { type: 'lines', mask: 'lines' });
          splits.push(split);
          timeline.set(part, { autoAlpha: 1 }, at);
          timeline.from(split.lines, { yPercent: 110, duration: MOTION.duration.reveal, stagger: MOTION.stagger.loose }, at);
          at += 0.18 + split.lines.length * MOTION.stagger.loose;
        } else {
          timeline.fromTo(part, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: MOTION.duration.base }, at);
          at += 0.14;
        }
      }
    });
  }

  // 2. Scroll: the copy lifts and fades while the hero scrolls away.
  if (copy) {
    gsap.to(copy, {
      yPercent: -14,
      autoAlpha: 0,
      ease: MOTION.ease.scrub,
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom 30%', scrub: 0.6, invalidateOnRefresh: true },
    });
  }
}
