// recipes/index-list.js (Web Motion Kit)
// A numbered index beside a picture that changes with it (Lenval's services list).
// Wide screens: the picture frame sticks beside the list, and whichever row is crossing
// the middle of the screen becomes the active one. Its picture wipes up over the last;
// going back, it wipes down again. Rows ahead stay quiet, the active row is bright,
// and a hairline draws across its top.
// Narrow screens: every row carries its own picture, which opens as it scrolls in.
//
// Markup hooks:
//   [data-index]         the section.
//   [data-index-row]     each row, in order. Optional [data-index-line] inside.
//   [data-index-img]     the pictures in the sticky frame, in the same order.
//   [data-index-idx]     optional "01" counter.
//   [data-index-fig]     each row's own picture, used on narrow screens.
//
// Without scripts or with reduced motion: every row is bright, the frame shows the
// first picture, and narrow screens show each row's picture as it is.

import { gsap, ScrollTrigger, MOTION } from '../core/core.js';

const pad = (n) => String(n).padStart(2, '0');

/** Wide screens. Run with { when: '(min-width: 900px)' }. */
export function indexList(scope, env) {
  const section = /** @type {HTMLElement} */ (scope);
  const rows = Array.from(section.querySelectorAll('[data-index-row]'));
  const imgs = Array.from(section.querySelectorAll('[data-index-img]'));
  if (rows.length < 2 || imgs.length !== rows.length) return;
  const idx = section.querySelector('[data-index-idx]');
  const lines = rows.map((r) => r.querySelector('[data-index-line]'));

  section.classList.add('is-indexing');
  imgs.forEach((img, i) => {
    img.loading = 'eager';
    img.style.zIndex = String(i + 1);
  });
  // Open or closed. Closed pictures sit clipped to nothing at their bottom edge.
  gsap.set(imgs.slice(1), { clipPath: 'inset(100% 0% 0% 0%)' });
  gsap.set(imgs[0], { clipPath: 'inset(0% 0% 0% 0%)' });
  gsap.set(lines, { scaleX: 0, transformOrigin: '0% 50%' });

  let active = -1;
  const setActive = (i) => {
    if (i === active) return;
    const from = active;
    active = i;
    rows.forEach((row, j) => row.classList.toggle('is-active', j === i));
    if (idx) idx.textContent = pad(i + 1);
    lines.forEach((line, j) => {
      if (!line) return;
      gsap.to(line, { scaleX: j <= i ? 1 : 0, duration: 0.9, ease: MOTION.ease.reveal, overwrite: true });
    });
    imgs.forEach((img, j) => {
      const open = j <= i;
      const wasOpen = j <= from;
      if (open === wasOpen && from !== -1) return;
      gsap.to(img, {
        clipPath: open ? 'inset(0% 0% 0% 0%)' : 'inset(100% 0% 0% 0%)',
        duration: 1.1,
        ease: MOTION.ease.inOut,
        overwrite: 'auto',
      });
      if (open && j === i) gsap.fromTo(img, { scale: 1.12 }, { scale: 1, duration: 1.4, ease: MOTION.ease.reveal, overwrite: 'auto' });
    });
  };

  rows.forEach((row, i) => {
    ScrollTrigger.create({
      trigger: row,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (self) => self.isActive && setActive(i),
      onRefresh: (self) => self.isActive && setActive(i),
    });
  });
  // Above the first row, the first one is the one in view.
  ScrollTrigger.create({
    trigger: rows[0],
    start: 'top 55%',
    onLeaveBack: () => setActive(0),
  });
  setActive(0);

  env.onCleanup(() => {
    section.classList.remove('is-indexing');
    rows.forEach((row) => row.classList.remove('is-active'));
    imgs.forEach((img) => {
      img.style.zIndex = '';
    });
    if (idx) idx.textContent = '01';
  });
}

/** Narrow screens. Run with { when: '(max-width: 899px)' }. */
export function indexFigures(scope) {
  const figs = Array.from(scope.querySelectorAll('[data-index-fig]'));
  figs.forEach((fig) => {
    const img = fig.querySelector('img');
    gsap
      .timeline({ scrollTrigger: { trigger: fig, start: 'top 88%', once: true } })
      .fromTo(fig, { clipPath: 'inset(18% 8% 18% 8% round 14px)' }, { clipPath: 'inset(0% 0% 0% 0% round 14px)', duration: 1.3, ease: MOTION.ease.reveal, lazy: false })
      .fromTo(img, { scale: 1.2 }, { scale: 1, duration: 1.6, ease: MOTION.ease.reveal, lazy: false }, 0);
  });
}
