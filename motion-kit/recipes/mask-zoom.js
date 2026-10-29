// recipes/mask-zoom.js (Web Motion Kit)
// About's hero: the page opens on a black screen with a giant "1%" cut out of it, the photo
// showing through the numerals and a fine gold line round them. Then the camera dives
// through the "1": the cut-out scales up round the middle of its stem until it is wider than
// the screen, the photo eases back from a zoom behind it, and the heading's lines rise, the
// description and the chapter row follow. On scroll the copy lifts away.
//
// The overlay is an SVG (css/about.css shows it only with scripts on, hides it under reduced
// motion, and fades it by itself after 2.8 s if this never runs). Its "1%" is two text
// groups: [data-mask-type] inside the <mask> (the hole) and [data-mask-line] (the gold
// outline); both get the same scale.
//
// Markup hooks: [data-mask] (the svg), [data-mask-type], [data-mask-line], [data-mask-photo]
// (the img), [data-mask-copy] (wrapper the scroll lifts) with gated [data-mask-part]s, the
// heading [data-mask-title] (its [data-mask-line-rise] lines rise), [data-mask-index].

import { gsap, MOTION } from '../core/core.js';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * @param {Element} scope  the hero section
 * @param {import('../core/core.js').MotionEnv} env
 * @param {{ ready?: Promise<unknown> }} [options]  ready: wait for it (the preloader
 *   lifting) and the fonts, never more than 2.4 seconds.
 */
export function maskZoom(scope, env, options = {}) {
  const hero = /** @type {HTMLElement} */ (scope);
  const svg = /** @type {SVGSVGElement | null} */ (hero.querySelector('[data-mask]'));
  const groups = Array.from(hero.querySelectorAll('[data-mask-type], [data-mask-line]'));
  const photo = hero.querySelector('[data-mask-photo]');
  const copy = hero.querySelector('[data-mask-copy]');
  const index = hero.querySelector('[data-mask-index]');
  const lines = Array.from(hero.querySelectorAll('[data-mask-line-rise]'));
  const parts = Array.from(hero.querySelectorAll('[data-mask-part]'));
  const gated = Array.from(hero.querySelectorAll('[data-motion-hide]'));

  if (svg) {
    // From here on this recipe owns the overlay: no failsafe fade, and it goes when done.
    svg.style.animation = 'none';
    env.onCleanup(() => svg.style.removeProperty('animation'));
  }

  if (env.intro && svg && groups.length) {
    gsap.set(gated, { autoAlpha: 0, lazy: false });
    gsap.set(lines, { yPercent: 110, autoAlpha: 0, lazy: false });
    if (photo) gsap.set(photo, { scale: 1.3, lazy: false });
    let alive = true;
    let timeline = null;
    env.onCleanup(() => {
      alive = false;
      timeline?.revert();
    });
    const settled = Promise.all([document.fonts?.ready, options.ready]).catch(() => {});
    Promise.race([settled, wait(2400)]).then(() => {
      if (!alive) return;
      // Dive point: the middle of the "1", measured now the font is in.
      const text = /** @type {SVGTextElement | null} */ (svg.querySelector('[data-mask-type] text'));
      let origin = '50% 50%';
      let stem = 60;
      try {
        const one = text?.getExtentOfChar(0);
        if (one && one.width) {
          origin = `${one.x + one.width * 0.55} ${one.y + one.height * 0.52}`;
          stem = one.width * 0.3;
        }
      } catch {
        /* keep the centre */
      }
      // Far enough that the stem of the "1" is wider than the screen's diagonal.
      const far = Math.max(40, (Math.hypot(hero.clientWidth, hero.clientHeight) / stem) * 1.3);
      timeline = gsap.timeline({ defaults: { ease: MOTION.ease.reveal } });
      timeline
        .fromTo(groups, { scale: 0.92, svgOrigin: origin }, { scale: 1, svgOrigin: origin, duration: 0.9, ease: 'power2.out' }, 0)
        .to(groups, { scale: far, svgOrigin: origin, duration: 1.5, ease: 'expo.in' }, 0.75)
        .to(svg, { autoAlpha: 0, duration: 0.25, ease: 'none' }, 2.05);
      if (photo) timeline.to(photo, { scale: 1, duration: 2.2, ease: 'expo.out' }, 1.6);
      timeline.set(gated.filter((el) => !parts.includes(el)), { autoAlpha: 1 }, 1.95);
      if (lines.length) timeline.to(lines, { yPercent: 0, autoAlpha: 1, duration: MOTION.duration.reveal, stagger: 0.12 }, 2.0);
      let at = 2.45;
      for (const part of parts) {
        timeline.fromTo(part, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: MOTION.duration.base }, at);
        at += 0.14;
      }
      const items = index ? Array.from(index.querySelectorAll('li')) : [];
      if (items.length) timeline.from(items, { autoAlpha: 0, y: 14, duration: MOTION.duration.base, stagger: 0.07 }, at);
    });
  } else if (svg) {
    gsap.set(svg, { autoAlpha: 0 }); // the failsafe already showed the page: no overlay
  }

  // Scroll: the copy lifts away, the chapter row fades.
  const leave = { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6, invalidateOnRefresh: true };
  if (copy) gsap.to(copy, { y: () => -window.innerHeight * 0.28, autoAlpha: 0, ease: MOTION.ease.scrub, scrollTrigger: { ...leave, end: 'bottom 30%' } });
  if (index) gsap.to(index, { autoAlpha: 0, y: -24, ease: MOTION.ease.scrub, scrollTrigger: { ...leave, end: '30% top' } });
}
