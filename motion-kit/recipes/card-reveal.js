// recipes/card-reveal.js (Web Motion Kit)
// Picture cards that open from the bottom edge as they scroll in, a few at a time,
// with their text rising after the picture. Used for the city cards.
//
// Markup hooks:
//   [data-city]   each card. The recipe animates its .city-card-bg (picture layer)
//                 and .city-card-content (text), never the card itself, which keeps
//                 its CSS hover transition.

import { gsap, ScrollTrigger, MOTION } from '../core/core.js';

export function cardReveal(scope) {
  const cards = Array.from(scope.querySelectorAll('[data-city]'));
  if (!cards.length) return;
  const bgs = cards.map((c) => c.querySelector('.city-card-bg')).filter(Boolean);
  const texts = cards.map((c) => c.querySelector('.city-card-content')).filter(Boolean);
  gsap.set(bgs, { clipPath: 'inset(100% 0% 0% 0%)' });
  gsap.set(texts, { autoAlpha: 0, y: 30 });
  ScrollTrigger.batch(cards, {
    start: 'top 88%',
    once: true,
    onEnter: (batch) => {
      const b = batch.map((c) => c.querySelector('.city-card-bg')).filter(Boolean);
      const t = batch.map((c) => c.querySelector('.city-card-content')).filter(Boolean);
      gsap.to(b, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: MOTION.ease.inOut, stagger: 0.12 });
      gsap.to(t, { autoAlpha: 1, y: 0, duration: 1.1, ease: MOTION.ease.reveal, stagger: 0.12, delay: 0.45 });
    },
  });
}
