// recipes/ledger-type.js (Web Motion Kit)
// Ledger lines typed out. Each [data-type] line (a short record, like a verification entry)
// is cleared and typed character by character with a caret when its card comes into view;
// then the caret goes and a [data-type-check] beside it ticks in. Once only.
// With scripts off, or reduced motion, the line and the tick simply sit there.
//
// Markup: [data-type-card] > ... [data-type] and, optionally, [data-type-check].

import { gsap, ScrollTrigger } from '../core/core.js';

/**
 * @param {Element} scope
 * @param {import('../core/core.js').MotionEnv} env
 */
export function ledgerType(scope, env) {
  const cards = Array.from(scope.querySelectorAll('[data-type-card]'));
  cards.forEach((card, n) => {
    const line = /** @type {HTMLElement | null} */ (card.querySelector('[data-type]'));
    if (!line) return;
    const check = card.querySelector('[data-type-check]');
    const text = line.textContent || '';
    line.setAttribute('aria-label', text);
    line.textContent = '';
    line.classList.add('is-typing');
    if (check) gsap.set(check, { autoAlpha: 0, scale: 0.4, lazy: false });
    env.onCleanup(() => {
      line.textContent = text;
      line.removeAttribute('aria-label');
      line.classList.remove('is-typing');
    });

    const state = { n: 0 };
    const tl = gsap.timeline({ paused: true, delay: n * 0.25 });
    tl.to(state, {
      n: text.length,
      duration: text.length * 0.035,
      ease: 'none',
      onUpdate: () => (line.textContent = text.slice(0, Math.round(state.n))),
    });
    tl.call(() => {
      line.classList.remove('is-typing');
      line.removeAttribute('aria-label');
    });
    if (check) tl.to(check, { autoAlpha: 1, scale: 1, duration: 0.45, ease: 'back.out(2.4)' });
    ScrollTrigger.create({ trigger: card, start: 'top 80%', once: true, onEnter: () => tl.play() });
  });
}
