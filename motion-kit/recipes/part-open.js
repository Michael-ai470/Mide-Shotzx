// recipes/part-open.js (Web Motion Kit)
// A heading that parts while a picture opens in the gap between its words (Lenval).
// The stage sticks to the screen; scrolling opens the picture from a small window to
// the full screen and pushes the two halves of the heading out to the edges. The lead
// paragraph arrives over the open picture at the end.
//
// Wide screens part the words left and right. Narrow screens stack the halves and part
// them up and down; CSS decides which by the title's flex-direction.
//
// Markup hooks:
//   [data-part]        the section. The recipe makes it taller while it runs.
//   [data-part-stage]  what stays on screen (sticky).
//   [data-part-media]  the picture. Full stage size; the recipe clips it.
//   [data-part-title]  the heading, a flex row (or column) of two halves:
//   [data-part-a] [data-part-b]
//   [data-part-lead]   optional, arrives at the end.
//
// Without scripts or with reduced motion, CSS lays it out as a heading, a picture
// and a paragraph, one after another.

import { gsap, MOTION } from '../core/core.js';

/**
 * @param {Element} scope  the [data-part] section
 * @param {import('../core/core.js').MotionEnv} env
 * @param {{ length?: number }} [options]  length: scroll the opening takes, in svh. Default 140.
 */
export function partOpen(scope, env, options = {}) {
  const section = /** @type {HTMLElement} */ (scope);
  const stage = section.querySelector('[data-part-stage]');
  const media = section.querySelector('[data-part-media]');
  const title = section.querySelector('[data-part-title]');
  const a = section.querySelector('[data-part-a]');
  const b = section.querySelector('[data-part-b]');
  if (!stage || !media || !title || !a || !b) return;
  const img = media.querySelector('img');
  const lead = section.querySelector('[data-part-lead]');
  const eyebrow = section.querySelector('[data-part-eyebrow]');
  const length = options.length ?? 140;

  section.classList.add('is-parting');
  section.style.height = `calc(100svh + ${length}svh)`;
  if (img) img.loading = 'eager';

  const stacked = () => getComputedStyle(title).flexDirection.startsWith('column');
  // The closed window: the gap the CSS leaves between the two halves.
  const win = () => {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    const narrow = stacked();
    const ww = narrow ? Math.min(w * 0.42, 190) : Math.min(Math.max(w * 0.13, 150), 230);
    const wh = narrow ? ww * 0.62 : ww * 1.28;
    return { x: (w - ww) / 2, y: (h - wh) / 2, r: Math.min(ww, wh) * 0.14 };
  };
  const pad = () => Math.max(16, Math.min(48, stage.clientWidth * 0.04));
  // Layout offsets, free of transforms, so refreshes measure the resting place.
  const span = (el) => ({
    left: title.offsetLeft + el.offsetLeft,
    top: title.offsetTop + el.offsetTop,
    w: el.offsetWidth,
    h: el.offsetHeight,
  });
  const outA = () => {
    const s = span(a);
    return stacked() ? { x: 0, y: pad() + 64 - s.top } : { x: pad() - s.left, y: 0 };
  };
  const outB = () => {
    const s = span(b);
    // Stacked, the lower half stops just above the lead paragraph.
    const floor = lead ? lead.offsetTop - 20 : stage.clientHeight - pad() - 24;
    return stacked()
      ? { x: 0, y: floor - (s.top + s.h) }
      : { x: stage.clientWidth - pad() - (s.left + s.w), y: 0 };
  };
  const closed = () => {
    const { x, y, r } = win();
    return `inset(${y}px ${x}px ${y}px ${x}px round ${r}px)`;
  };

  const tl = gsap.timeline({
    defaults: { ease: MOTION.ease.scrub },
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.8,
      invalidateOnRefresh: true,
    },
  });
  tl.fromTo(media, { clipPath: closed }, { clipPath: 'inset(0px 0px 0px 0px round 0px)', duration: 1 }, 0)
    .fromTo(a, { x: 0, y: 0 }, { x: () => outA().x, y: () => outA().y, duration: 1 }, 0)
    .fromTo(b, { x: 0, y: 0 }, { x: () => outB().x, y: () => outB().y, duration: 1 }, 0);
  if (img) tl.fromTo(img, { scale: 1.35 }, { scale: 1.04, duration: 1 }, 0);
  if (eyebrow) tl.to(eyebrow, { autoAlpha: 0, duration: 0.25 }, 0);
  const shade = section.querySelector('[data-part-shade]');
  if (shade) tl.fromTo(shade, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35 }, 0.7);
  if (lead) tl.fromTo(lead, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out' }, 0.78);
  // A short hold on the open picture before the page moves on.
  tl.to({}, { duration: 0.15 });

  env.onCleanup(() => {
    section.classList.remove('is-parting');
    section.style.height = '';
  });
}
