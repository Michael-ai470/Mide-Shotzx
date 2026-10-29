// recipes/one-in-hundred.js (Web Motion Kit)
// One in a hundred: a 10 by 10 field of dots grows out from its centre as it scrolls in,
// then ninety-nine of them dim and one swells and glows gold. Scrubbed, so it plays back
// on the way up. Beside it, each reason in the list draws its gold rule and rises in, once.
//
// Markup hooks: [data-dots] the (empty, aria-hidden) field; [data-dots-item] each reason,
// with a .why-op-rule inside. Only the dots' and glow's transform and opacity move, and
// the reasons' opacity and y and their rules' scale.

import { gsap, ScrollTrigger, MOTION } from '../core/core.js';

/**
 * @param {Element} scope  the section
 * @param {import('../core/core.js').MotionEnv} env
 * @param {{ pick?: number }} [options]  pick: which dot is the one. Default 44.
 */
export function oneInHundred(scope, env, options = {}) {
  const section = /** @type {HTMLElement} */ (scope);
  const field = section.querySelector('[data-dots]');
  if (!field) return;
  const pick = options.pick ?? 44;
  section.classList.add('is-dots');

  const dots = [];
  for (let i = 0; i < 100; i++) {
    const dot = document.createElement('span');
    dot.className = i === pick ? 'op-dot is-one' : 'op-dot';
    if (i === pick) {
      const glow = document.createElement('span');
      glow.className = 'op-dot-glow';
      dot.appendChild(glow);
    }
    field.appendChild(dot);
    dots.push(dot);
  }
  env.onCleanup(() => {
    dots.forEach((dot) => dot.remove());
    section.classList.remove('is-dots');
  });
  const one = dots[pick];
  const others = dots.filter((d) => d !== one);
  const glow = one.querySelector('.op-dot-glow');

  const wide = window.matchMedia('(min-width: 900px)').matches;
  const timeline = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: field, start: 'top 88%', end: wide ? 'top 22%' : 'bottom 45%', scrub: 0.7 },
  });
  timeline.from(dots, { scale: 0, autoAlpha: 0, duration: 0.3, stagger: { grid: [10, 10], from: 'center', amount: 0.45 } }, 0);
  timeline.to(others, { opacity: 0.14, duration: 0.25, stagger: { amount: 0.3, from: 'random' } }, 0.7);
  timeline.to(one, { scale: 1.9, duration: 0.3 }, 0.85);
  if (glow) timeline.fromTo(glow, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1.2, duration: 0.3 }, 0.85);

  // The reasons: rule draws, copy rises, once each.
  const items = Array.from(section.querySelectorAll('[data-dots-item]'));
  const rules = items.map((item) => item.querySelector('.why-op-rule')).filter(Boolean);
  gsap.set(items, { autoAlpha: 0, y: 28 });
  gsap.set(rules, { scaleY: 0 });
  ScrollTrigger.batch(items, {
    start: 'top 85%',
    once: true,
    onEnter: (batch) => {
      gsap.to(batch, { autoAlpha: 1, y: 0, duration: MOTION.duration.reveal, ease: MOTION.ease.reveal, stagger: 0.12, overwrite: true });
      gsap.to(batch.map((item) => item.querySelector('.why-op-rule')).filter(Boolean), { scaleY: 1, duration: 1.2, ease: 'expo.out', stagger: 0.12, delay: 0.1 });
    },
  });
}
