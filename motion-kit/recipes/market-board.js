// recipes/market-board.js (Web Motion Kit)
// A destination board: a list of places in large rows.
//   marketBoard: the rows arrive in sequence as they scroll in, each drawing its rule line
//                from the left (once).
//   marketPeek:  on hover screens, a photo of the row under the cursor floats beside it and
//                follows the cursor with a little lag and lean; it changes as you move from
//                row to row. Run it with { when: 'hover' }.
//
// Markup hooks: [data-board] the list; [data-market] each row, with data-img (a photo URL)
// or data-code (letters shown instead, when there is no photo).

import { gsap, ScrollTrigger, MOTION } from '../core/core.js';

/** @param {Element} scope  the [data-board] list  @param {import('../core/core.js').MotionEnv} env */
export function marketBoard(scope, env) {
  const list = /** @type {HTMLElement} */ (scope);
  const rows = Array.from(list.querySelectorAll('[data-market]'));
  if (!rows.length) return;
  list.classList.add('is-board');
  const rules = rows.map((row) => {
    const rule = document.createElement('span');
    rule.className = 'market-rule';
    rule.setAttribute('aria-hidden', 'true');
    row.appendChild(rule);
    return rule;
  });
  env.onCleanup(() => {
    rules.forEach((rule) => rule.remove());
    list.classList.remove('is-board');
  });

  gsap.set(rows, { autoAlpha: 0, y: 32 });
  gsap.set(rules, { scaleX: 0 });
  ScrollTrigger.batch(rows, {
    start: 'top 90%',
    once: true,
    onEnter: (batch) => {
      gsap.to(batch, { autoAlpha: 1, y: 0, duration: MOTION.duration.reveal, ease: MOTION.ease.reveal, stagger: 0.09, overwrite: true });
      gsap.to(batch.map((row) => row.querySelector('.market-rule')), { scaleX: 1, duration: 1.4, ease: 'expo.out', stagger: 0.09 });
    },
  });
}

/** @param {Element} scope  the [data-board] list  @param {import('../core/core.js').MotionEnv} env */
export function marketPeek(scope, env) {
  const list = /** @type {HTMLElement} */ (scope);
  const rows = Array.from(list.querySelectorAll('[data-market]'));
  if (!rows.length) return;

  // The floating frame lives on <body>, so no section clips it.
  const peek = document.createElement('div');
  peek.className = 'market-peek is-on';
  peek.setAttribute('aria-hidden', 'true');
  const slides = rows.map((row) => {
    let slide;
    if (row.dataset.img) {
      slide = document.createElement('img');
      slide.alt = '';
      slide.decoding = 'async';
      slide.dataset.src = row.dataset.img; // fetched on first hover
    } else {
      slide = document.createElement('div');
      slide.className = 'market-peek-type';
      slide.textContent = row.dataset.code || '';
    }
    peek.appendChild(slide);
    return slide;
  });
  document.body.appendChild(peek);
  gsap.set(peek, { autoAlpha: 0, scale: 0.6, x: -999, y: -999 });

  const xTo = gsap.quickTo(peek, 'x', { duration: 0.65, ease: 'power3' });
  const yTo = gsap.quickTo(peek, 'y', { duration: 0.65, ease: 'power3' });
  const lean = gsap.quickTo(peek, 'rotation', { duration: 0.8, ease: 'power3' });
  let lastX = null;
  let shown = -1;
  const show = (i) => {
    if (i === shown) return;
    shown = i;
    const slide = slides[i];
    if (slide.dataset.src) {
      slide.src = slide.dataset.src;
      delete slide.dataset.src;
    }
    slides.forEach((s, k) => s.classList.toggle('is-shown', k === i));
  };

  const onMove = (event) => {
    if (lastX === null) gsap.set(peek, { x: event.clientX + 40, y: event.clientY });
    lean(Math.max(-8, Math.min(8, (event.clientX - (lastX ?? event.clientX)) * 0.6)));
    lastX = event.clientX;
    xTo(event.clientX + 40);
    yTo(event.clientY);
  };
  const onEnter = () => gsap.to(peek, { autoAlpha: 1, scale: 1, duration: 0.45, ease: 'power3.out', overwrite: 'auto' });
  const onLeave = () => {
    lastX = null;
    lean(0);
    gsap.to(peek, { autoAlpha: 0, scale: 0.6, duration: 0.35, ease: 'power3.in', overwrite: 'auto' });
  };
  const rowOffs = rows.map((row, i) => {
    const fn = () => show(i);
    row.addEventListener('mouseenter', fn);
    return () => row.removeEventListener('mouseenter', fn);
  });
  list.addEventListener('mousemove', onMove);
  list.addEventListener('mouseenter', onEnter);
  list.addEventListener('mouseleave', onLeave);
  env.onCleanup(() => {
    rowOffs.forEach((off) => off());
    list.removeEventListener('mousemove', onMove);
    list.removeEventListener('mouseenter', onEnter);
    list.removeEventListener('mouseleave', onLeave);
    peek.remove();
  });
}
