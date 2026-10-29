// recipes/hero-frame.js (Web Motion Kit)
// A full-screen page hero that arrives like a postcard opening out: the photo starts as a
// framed card in the middle and opens to full bleed, the heading's words flip up in 3D one
// after another, the subheading comes into focus line by line, and the small parts pop in.
// On scroll the copy parts in depth: each [data-hero-depth] block drifts up at its own speed
// and fades, so the heading leaves faster than the line under it.
//
// Markup hooks, inside the hero:
//   [data-hero-frame]              the photo. Only its clip-path moves.
//   [data-hero-part="fade|words|focus|pop"]
//                                  the copy, played in document order. "words" flips the
//                                  words up, "focus" brings the lines into focus, "pop"
//                                  pops the children in, "fade" fades the element up.
//                                  Every part carries data-motion-hide.
//   [data-hero-depth="0.5"]        a wrapper around parts that drifts on scroll; the number
//                                  is how far, as a share of the screen height.
// The intro animates the parts and their pieces; the scroll animates the wrappers, so no
// element has two jobs.

import { gsap, MOTION, getSplitText } from '../core/core.js';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const FRAMED = 'inset(17% 24% 17% 24% round 22px)';
const FULL = 'inset(0% 0% 0% 0% round 0px)';

/**
 * @param {Element} scope  the hero section
 * @param {import('../core/core.js').MotionEnv} env
 * @param {{ ready?: Promise<unknown> }} [options]  ready: the intro waits for it (the
 *   preloader lifting) and for the fonts, never more than 3 seconds.
 */
export function heroFrame(scope, env, options = {}) {
  const hero = /** @type {HTMLElement} */ (scope);
  const frame = hero.querySelector('[data-hero-frame]');
  const parts = Array.from(hero.querySelectorAll('[data-hero-part]'));
  const depths = Array.from(hero.querySelectorAll('[data-hero-depth]'));

  // 1. Intro, once.
  if (env.intro && (frame || parts.length)) {
    if (frame) gsap.set(frame, { clipPath: FRAMED });
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
        onComplete: () => splits.splice(0).forEach((split) => split.revert()),
      });
      if (frame) timeline.to(frame, { clipPath: FULL, duration: MOTION.duration.hero + 0.2, ease: MOTION.ease.inOut }, 0);
      let at = frame ? 0.55 : 0.1;
      for (const part of parts) {
        const kind = part.dataset.heroPart;
        timeline.set(part, { autoAlpha: 1 }, at);
        if (kind === 'words' && SplitText) {
          const split = SplitText.create(part, { type: 'words' });
          splits.push(split);
          timeline.from(split.words, {
            rotationX: -95,
            yPercent: 40,
            autoAlpha: 0,
            transformOrigin: '50% 100%',
            transformPerspective: 700,
            duration: 1.1,
            stagger: 0.09,
          }, at);
          at += 0.25 + split.words.length * 0.09;
        } else if (kind === 'focus' && SplitText) {
          const split = SplitText.create(part, { type: 'lines' });
          splits.push(split);
          timeline.from(split.lines, { autoAlpha: 0, filter: 'blur(12px)', y: 10, duration: 1.2, stagger: 0.14 }, at);
          at += 0.3 + split.lines.length * 0.14;
        } else if (kind === 'pop') {
          timeline.from(part.children, { autoAlpha: 0, scale: 0.7, y: 12, duration: 0.7, stagger: 0.08, ease: 'back.out(1.8)' }, at);
          at += 0.2;
        } else {
          timeline.fromTo(part, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: MOTION.duration.base }, at);
          at += 0.15;
        }
      }
    });
  }

  // 2. Scroll: the copy parts in depth as the hero leaves.
  depths.forEach((block) => {
    const far = parseFloat(block.dataset.heroDepth) || 0.3;
    gsap.to(block, {
      y: () => -window.innerHeight * far,
      autoAlpha: 0,
      ease: MOTION.ease.scrub,
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom 25%', scrub: 0.6, invalidateOnRefresh: true },
    });
  });
}
