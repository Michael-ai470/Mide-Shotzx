// recipes/deal-cards.js (Web Motion Kit)
// Services as cards dealt onto the table. Each [data-deal] wrapper starts lying flat (tipped
// back on its bottom edge) and stands up as it enters, row by row; as a card lands, its
// title decodes like a trading terminal, characters cycling until they settle on the word.
// dealTilt (hover screens): the card leans toward the cursor and a soft light follows it.
//
// Markup: [data-deal] > .er-service-card > ... [data-decode] (the title) and .er-glare.
// The wrapper is dealt; the card tilts; the glare only reads two CSS variables.

import { gsap, ScrollTrigger, MOTION } from '../core/core.js';

const GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789$%#&';

/** Cycles the element's letters through random glyphs, settling left to right. */
function decode(el, duration = 0.9) {
  const text = el.dataset.decodeText || (el.dataset.decodeText = el.textContent);
  el.setAttribute('aria-label', text);
  const state = { p: 0 };
  return gsap.to(state, {
    p: 1,
    duration,
    ease: 'power1.out',
    onUpdate: () => {
      const fixed = Math.floor(state.p * text.length);
      let out = '';
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (i < fixed || !/[A-Za-z0-9]/.test(ch)) out += ch;
        else {
          const g = GLYPHS[(Math.random() * GLYPHS.length) | 0];
          out += ch === ch.toLowerCase() ? g.toLowerCase() : g;
        }
      }
      el.textContent = out;
    },
    onComplete: () => {
      el.textContent = text;
      el.removeAttribute('aria-label');
    },
  });
}

/**
 * @param {Element} scope
 * @param {import('../core/core.js').MotionEnv} env
 */
export function dealCards(scope, env) {
  const deals = Array.from(scope.querySelectorAll('[data-deal]'));
  if (!deals.length) return;
  const titles = deals.map((deal) => deal.querySelector('[data-decode]'));

  gsap.set(deals, {
    rotationX: 72,
    y: 70,
    autoAlpha: 0,
    transformOrigin: '50% 100%',
    transformPerspective: 1200,
    lazy: false,
  });
  ScrollTrigger.batch(deals, {
    start: 'top 90%',
    once: true,
    onEnter: (batch) =>
      batch.forEach((deal, i) => {
        gsap.to(deal, {
          rotationX: 0,
          y: 0,
          autoAlpha: 1,
          duration: 1.15,
          delay: i * 0.12,
          ease: MOTION.ease.reveal,
          overwrite: true,
        });
        const title = titles[deals.indexOf(deal)];
        if (title) gsap.delayedCall(0.35 + i * 0.12, () => decode(title));
      }),
  });
  env.onCleanup(() =>
    titles.forEach((title) => {
      if (!title?.dataset.decodeText) return;
      title.textContent = title.dataset.decodeText;
      title.removeAttribute('aria-label');
    }),
  );
}

/**
 * Run with { when: 'hover' }.
 * @param {Element} scope
 * @param {import('../core/core.js').MotionEnv} env
 */
export function dealTilt(scope, env, max = 7) {
  scope.querySelectorAll('[data-deal] .er-service-card').forEach((card) => {
    const el = /** @type {HTMLElement} */ (card);
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3.out' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3.out' });
    let rect = el.getBoundingClientRect();
    const enter = () => {
      rect = el.getBoundingClientRect();
    };
    const move = (e) => {
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      ry((x - 0.5) * 2 * max);
      rx((0.5 - y) * 2 * max);
      el.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
      el.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
    };
    const leave = () => {
      rx(0);
      ry(0);
    };
    el.addEventListener('pointerenter', enter);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    env.onCleanup(() => {
      el.removeEventListener('pointerenter', enter);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
      el.style.removeProperty('--gx');
      el.style.removeProperty('--gy');
    });
  });
}
