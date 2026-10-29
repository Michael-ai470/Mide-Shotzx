// recipes/block-wipe.js (Web Motion Kit)
// Pictures revealed by a block of colour: a gold block sweeps across each [data-wipe] card
// from the left, the picture and words appear behind it, and the block leaves to the right.
// Cards entering together go one after another. Once. The block is made here
// (.ct-block, css/contact.css), so with scripts off there is none.

import { gsap, ScrollTrigger } from '../core/core.js';

/**
 * @param {Element} scope
 * @param {import('../core/core.js').MotionEnv} env
 */
export function blockWipe(scope, env) {
  const cards = Array.from(scope.querySelectorAll('[data-wipe]'));
  if (!cards.length) return;
  const made = cards.map((card) => {
    const block = document.createElement('span');
    block.className = 'ct-block';
    block.setAttribute('aria-hidden', 'true');
    card.appendChild(block);
    const inner = Array.from(card.children).filter((c) => c !== block);
    gsap.set(inner, { autoAlpha: 0, lazy: false });
    return { card, block, inner };
  });
  env.onCleanup(() => made.forEach(({ block }) => block.remove()));

  ScrollTrigger.batch(cards, {
    start: 'top 85%',
    once: true,
    onEnter: (batch) =>
      batch.forEach((card, i) => {
        const it = made.find((m) => m.card === card);
        if (!it) return;
        gsap
          .timeline({ delay: i * 0.12 })
          .fromTo(it.block, { scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: 1, duration: 0.45, ease: 'power3.in' })
          .set(it.inner, { autoAlpha: 1 })
          .set(it.block, { transformOrigin: '100% 50%' })
          .to(it.block, { scaleX: 0, duration: 0.55, ease: 'power3.out' });
      }),
  });
}
