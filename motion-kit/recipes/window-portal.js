// recipes/window-portal.js (Web Motion Kit)
// The page passes through an aircraft window into the next scene (Morpho's dive into
// the can). A small cabin window sits in the middle of a dark stage; scrolling widens
// it until the picture behind fills the screen, the window's bezel sweeps past, and the
// heading rises over the view. It answers the cabin windows at the end of the jet hero.
//
// Markup hooks:
//   [data-portal]         the section. The recipe makes it taller while it runs.
//   [data-portal-stage]   what stays on screen (sticky).
//   [data-portal-media]   the picture, full stage size. The recipe clips it.
//   [data-portal-bezel]   optional ring drawn around the closed window.
//   [data-portal-copy]    the heading block that arrives at the end.
//   [data-portal-hint]    optional line shown beside the closed window.
//
// Without scripts or with reduced motion, CSS shows the heading over the picture.

import { gsap, MOTION } from '../core/core.js';

/**
 * @param {Element} scope  the [data-portal] section
 * @param {import('../core/core.js').MotionEnv} env
 * @param {{ length?: number }} [options]  length: scroll the opening takes, in svh. Default 130.
 */
export function windowPortal(scope, env, options = {}) {
  const section = /** @type {HTMLElement} */ (scope);
  const stage = section.querySelector('[data-portal-stage]');
  const media = section.querySelector('[data-portal-media]');
  if (!stage || !media) return;
  const img = media.querySelector('img');
  const bezel = section.querySelector('[data-portal-bezel]');
  const copy = section.querySelector('[data-portal-copy]');
  const hint = section.querySelector('[data-portal-hint]');
  const length = options.length ?? 130;

  section.classList.add('is-portal');
  section.style.height = `calc(100svh + ${length}svh)`;
  if (img) img.loading = 'eager';

  // The closed window: an upright rounded oblong, like a cabin window.
  const win = () => {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    const ww = Math.min(Math.max(w * 0.16, 132), 240);
    const wh = Math.min(ww * 1.42, h * 0.56);
    return { w: ww, h: wh, x: (w - ww) / 2, y: (h - wh) / 2, r: ww * 0.48 };
  };
  const closed = () => {
    const { x, y, r } = win();
    return `inset(${y}px ${x}px ${y}px ${x}px round ${r}px)`;
  };
  const place = () => {
    if (!bezel) return;
    const { w, h, r } = win();
    bezel.style.width = `${w}px`;
    bezel.style.height = `${h}px`;
    bezel.style.borderRadius = `${r}px`;
  };
  place();
  const grow = () => {
    const { w, h } = win();
    return Math.max(stage.clientWidth / w, stage.clientHeight / h) * 1.25;
  };

  const tl = gsap.timeline({
    defaults: { ease: MOTION.ease.scrub },
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.8,
      invalidateOnRefresh: true,
      onRefresh: place,
    },
  });
  tl.fromTo(media, { clipPath: closed }, { clipPath: 'inset(0px 0px 0px 0px round 0px)', duration: 1 }, 0);
  if (img) tl.fromTo(img, { scale: 1.6 }, { scale: 1.05, duration: 1 }, 0);
  if (bezel) tl.fromTo(bezel, { scale: 1, autoAlpha: 1 }, { scale: grow, autoAlpha: 0, duration: 0.9 }, 0);
  if (hint) tl.to(hint, { autoAlpha: 0, y: -20, duration: 0.2 }, 0);
  if (copy) {
    tl.fromTo(copy, { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out' }, 0.72);
  }
  tl.to({}, { duration: 0.15 });

  env.onCleanup(() => {
    section.classList.remove('is-portal');
    section.style.height = '';
    if (bezel) bezel.removeAttribute('style');
  });
}
