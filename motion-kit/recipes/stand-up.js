// recipes/stand-up.js (Web Motion Kit)
// Our Story. standUp(): the photo [data-stand] starts lying back on its bottom edge and
// stands up as it scrolls in (scrubbed). flipCount(): a number [data-flip] flips through
// the digits up to its own value, like a departure board, the first time it is seen.

import { gsap, ScrollTrigger } from '../core/core.js';

/** @param {Element} scope */
export function standUp(scope) {
  scope.querySelectorAll('[data-stand]').forEach((el) => {
    gsap.fromTo(
      el,
      { rotationX: 32, transformPerspective: 1100, transformOrigin: '50% 100%', y: 30 },
      {
        rotationX: 0,
        y: 0,
        ease: 'none',
        lazy: false,
        scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 40%', scrub: 0.6 },
      },
    );
  });
}

/**
 * @param {Element} scope
 * @param {import('../core/core.js').MotionEnv} env
 */
export function flipCount(scope, env) {
  scope.querySelectorAll('[data-flip]').forEach((el) => {
    const target = parseInt(el.textContent || '', 10);
    if (!Number.isFinite(target)) return;
    const original = el.innerHTML;
    el.setAttribute('aria-label', String(target));
    const face = document.createElement('span');
    face.className = 'ab-flap';
    face.setAttribute('aria-hidden', 'true');
    face.textContent = '0';
    el.replaceChildren(face);
    el.classList.add('has-flap');
    env.onCleanup(() => {
      el.classList.remove('has-flap');
      el.innerHTML = original;
      el.removeAttribute('aria-label');
    });
    const tl = gsap.timeline({ paused: true });
    for (let n = 1; n <= target; n++) {
      const last = n === target;
      tl.to(face, { rotationX: -90, duration: last ? 0.16 : 0.09, ease: 'power1.in', transformPerspective: 300 })
        .call(() => (face.textContent = String(n)))
        .fromTo(face, { rotationX: 90 }, { rotationX: 0, duration: last ? 0.45 : 0.09, ease: last ? 'back.out(2.5)' : 'power1.out' });
    }
    ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: () => tl.play() });
  });
}
