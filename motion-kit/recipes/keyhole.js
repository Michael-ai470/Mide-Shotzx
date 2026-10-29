// recipes/keyhole.js (Web Motion Kit)
// A keyhole onto a photo. The band shows a darkened copy; a circle of the vivid photo opens
// in the middle as the band scrolls into view.
//   keyhole:       the circle opens with the scroll. With { full: true } it keeps growing
//                  until the whole photo shows (touch screens, where nothing can steer it).
//   keyholeFollow: on hover screens the circle follows the cursor round the band and
//                  drifts back to the middle when the cursor leaves. Run it with
//                  { when: 'hover' } alongside keyhole.
//
// Markup hooks: [data-keyhole] the band, holding the base <img>, a .keyhole-view with the
// vivid copy (aria-hidden) and a .keyhole-ring. CSS reads --kr (radius), --kx and --ky.

import { gsap } from '../core/core.js';

/**
 * @param {Element} scope  the [data-keyhole] band
 * @param {import('../core/core.js').MotionEnv} env
 * @param {{ full?: boolean }} [options]
 */
export function keyhole(scope, env, options = {}) {
  const band = /** @type {HTMLElement} */ (scope);
  band.classList.add('is-keyhole');
  band.style.setProperty('--kx', `${band.offsetWidth / 2}px`);
  band.style.setProperty('--ky', `${band.offsetHeight / 2}px`);
  env.onCleanup(() => {
    band.classList.remove('is-keyhole');
    ['--kr', '--kx', '--ky'].forEach((p) => band.style.removeProperty(p));
  });

  const open = () => `${band.offsetHeight * 0.4}px`;
  const all = () => `${Math.hypot(band.offsetWidth, band.offsetHeight) / 2 + 8}px`;
  const timeline = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: band,
      start: 'top 88%',
      end: options.full ? 'bottom 35%' : 'center 50%',
      scrub: 0.6,
      invalidateOnRefresh: true,
    },
  });
  timeline.fromTo(band, { '--kr': '0px' }, { '--kr': open, duration: 1 });
  if (options.full) timeline.to(band, { '--kr': all, duration: 1 });
}

/** @param {Element} scope  the [data-keyhole] band  @param {import('../core/core.js').MotionEnv} env */
export function keyholeFollow(scope, env) {
  const band = /** @type {HTMLElement} */ (scope);
  const pos = { x: band.offsetWidth / 2, y: band.offsetHeight / 2 };
  const apply = () => {
    band.style.setProperty('--kx', `${pos.x}px`);
    band.style.setProperty('--ky', `${pos.y}px`);
  };
  const xTo = gsap.quickTo(pos, 'x', { duration: 0.6, ease: 'power3', onUpdate: apply });
  const yTo = gsap.quickTo(pos, 'y', { duration: 0.6, ease: 'power3', onUpdate: apply });
  const onMove = (event) => {
    const r = band.getBoundingClientRect();
    xTo(event.clientX - r.left);
    yTo(event.clientY - r.top);
  };
  const onLeave = () => {
    xTo(band.offsetWidth / 2);
    yTo(band.offsetHeight / 2);
  };
  band.addEventListener('mousemove', onMove);
  band.addEventListener('mouseleave', onLeave);
  env.onCleanup(() => {
    band.removeEventListener('mousemove', onMove);
    band.removeEventListener('mouseleave', onLeave);
  });
}
