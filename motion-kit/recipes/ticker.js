// recipes/ticker.js (Web Motion Kit)
// Engine 6.5 marquee: a seamless loop that only runs while it is on screen and speeds up
// with scroll velocity, like a market ticker. Adds .is-ticking to [data-marquee] while it
// runs; without it the items wrap and sit still (css/elrock.css).
//
// Markup: [data-marquee] > .er-ticker-row > [data-marquee-track] > items. Spacing lives on
// the items, not a flex gap, so the copy is identical.

import { gsap, ScrollTrigger } from '../core/core.js';

/**
 * @param {Element} scope
 * @param {import('../core/core.js').MotionEnv} env
 * @param {number} [speed]  px per second
 */
export function ticker(scope, env, speed = 60) {
  const el = scope.matches('[data-marquee]') ? scope : scope.querySelector('[data-marquee]');
  const track = el?.querySelector('[data-marquee-track]');
  if (!el || !track) return;
  el.classList.add('is-ticking');
  env.onCleanup(() => el.classList.remove('is-ticking'));
  if (!track.offsetWidth) return;

  // A second copy makes the loop seamless. Hidden from assistive tech.
  const clone = /** @type {HTMLElement} */ (track.cloneNode(true));
  clone.setAttribute('aria-hidden', 'true');
  clone.removeAttribute('data-marquee-track');
  track.after(clone);
  env.onCleanup(() => clone.remove());

  const loop = gsap.to([track, clone], {
    xPercent: -100,
    duration: track.offsetWidth / speed,
    ease: 'none',
    repeat: -1,
    paused: true,
  });
  const sync = (self) => (self.isActive ? loop.play() : loop.pause());

  ScrollTrigger.create({
    trigger: el,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: sync, // only animate while on screen
    onRefresh: sync,
    onUpdate: (self) => {
      // Speed up with scroll velocity, then settle back.
      const boost = gsap.utils.clamp(1, 3, 1 + Math.abs(self.getVelocity()) / 1200);
      gsap.to(loop, { timeScale: boost, duration: 0.2, overwrite: true });
      gsap.to(loop, { timeScale: 1, duration: 0.9, delay: 0.2 });
    },
  });
  env.onCleanup(() => gsap.killTweensOf(loop));
}
