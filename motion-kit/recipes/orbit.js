// recipes/orbit.js (Web Motion Kit)
// The ecosystem as an orbit: the five division cards ride a ring round the firm's emblem
// (the layout is CSS, css/about.css; each card's place is its --a plus the ring's --spin).
// orbit() turns the ring slowly while it is on screen and a little faster while the page
// scrolls; pointing at (or focusing) a division pauses it, rings that card in gold and shows
// its name, line and description in the centre. The cards stay links.
// The cards drift in to their places from the centre the first time the section is seen.
//
// Markup: [data-orbit] (the grid of .eco-card links) with an .ab-orbit-core holding
// [data-orbit-name], [data-orbit-sub], [data-orbit-desc].

import { gsap, ScrollTrigger, MOTION } from '../core/core.js';

const TURN = 90; // seconds a full turn takes

/**
 * Run with { when: '(min-width: 1025px)' } (the CSS layout's breakpoint).
 * @param {Element} scope
 * @param {import('../core/core.js').MotionEnv} env
 */
export function orbit(scope, env) {
  const ring = /** @type {HTMLElement | null} */ (scope.matches('[data-orbit]') ? scope : scope.querySelector('[data-orbit]'));
  // The orbit layout (css/about.css) marks itself with --orbit: on; without it, do nothing.
  if (!ring || getComputedStyle(ring).getPropertyValue('--orbit').trim() !== 'on') return;
  const cards = /** @type {HTMLElement[]} */ (Array.from(ring.querySelectorAll('.eco-card')));
  const out = {
    name: ring.querySelector('[data-orbit-name]'),
    sub: ring.querySelector('[data-orbit-sub]'),
    desc: ring.querySelector('[data-orbit-desc]'),
  };
  const rest = { name: out.name?.textContent, sub: out.sub?.textContent, desc: out.desc?.textContent };
  const core = ring.querySelector('.ab-orbit-core');

  // One angle on the ring: the steady turn plus the arrival's sweep.
  const spin = { deg: 0 };
  const sweep = { deg: 0 };
  const render = () => ring.style.setProperty('--spin', `${(spin.deg + sweep.deg).toFixed(2)}deg`);
  const turn = gsap.to(spin, { deg: 360, duration: TURN, ease: 'none', repeat: -1, paused: true, onUpdate: render });
  env.onCleanup(() => ring.style.removeProperty('--spin'));
  let held = false;
  ScrollTrigger.create({
    trigger: ring,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => (self.isActive && !held ? turn.play() : turn.pause()),
    onRefresh: (self) => (self.isActive && !held ? turn.play() : turn.pause()),
    onUpdate: (self) => {
      if (held) return;
      const boost = gsap.utils.clamp(1, 6, 1 + Math.abs(self.getVelocity()) / 300);
      gsap.to(turn, { timeScale: boost, duration: 0.25, overwrite: true });
      gsap.to(turn, { timeScale: 1, duration: 1.2, delay: 0.25 });
    },
  });

  const show = (card) => {
    cards.forEach((c) => c.classList.toggle('is-on', c === card));
    const text = card
      ? { name: card.querySelector('h4')?.textContent, sub: card.querySelector('.eco-card-sub')?.textContent, desc: card.querySelector('p')?.textContent }
      : rest;
    if (core) {
      gsap.fromTo(core, { autoAlpha: 0.2 }, { autoAlpha: 1, duration: 0.35, overwrite: true });
    }
    if (out.name) out.name.textContent = text.name || '';
    if (out.sub) out.sub.textContent = text.sub || '';
    if (out.desc) out.desc.textContent = text.desc || '';
  };
  cards.forEach((card) => {
    const enter = () => {
      held = true;
      turn.pause();
      show(card);
    };
    const leave = () => {
      held = false;
      turn.play();
      show(null);
    };
    card.addEventListener('pointerenter', enter);
    card.addEventListener('pointerleave', leave);
    card.addEventListener('focus', enter);
    card.addEventListener('blur', leave);
    env.onCleanup(() => {
      card.removeEventListener('pointerenter', enter);
      card.removeEventListener('pointerleave', leave);
      card.removeEventListener('focus', enter);
      card.removeEventListener('blur', leave);
    });
  });
  env.onCleanup(() => show(null));

  // Arrival: the cards drift out from the centre to their places on the ring.
  const ins = cards.map((card) => card.querySelector('.eco-card-image'));
  gsap.set(cards, { autoAlpha: 0, lazy: false });
  gsap.set(ins, { scale: 0.4, lazy: false });
  ScrollTrigger.create({
    trigger: ring,
    start: 'top 75%',
    once: true,
    onEnter: () => {
      gsap.to(cards, { autoAlpha: 1, duration: 0.8, stagger: 0.12, ease: 'power2.out' });
      gsap.to(ins, { scale: 1, duration: 1.2, stagger: 0.12, ease: MOTION.ease.reveal });
      gsap.fromTo(sweep, { deg: -60 }, { deg: 0, duration: 1.8, ease: MOTION.ease.reveal, onUpdate: render });
    },
  });
}
