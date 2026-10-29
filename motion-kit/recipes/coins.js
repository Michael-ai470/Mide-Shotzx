// recipes/coins.js (Web Motion Kit)
// The four asset classes as tokens with two faces. The front names the asset; the back
// gives its terms (minimum entry, target yield). coinFlip() is not motion: it adds .is-coins
// (the faces share one cell, css/token.css) and turns a card with a click, Enter or Space;
// with motion, coinsMotion() spins the cards in edge-on as they arrive, turns them with
// GSAP, and on hover screens turns a card over while the pointer is on it.
// With scripts off the two faces simply sit one above the other.
//
// Markup: [data-coin] (focusable) > [data-coin-inner] > .te-coin-front, .te-coin-back.

import { gsap, ScrollTrigger, MOTION } from '../core/core.js';

/**
 * @param {Element} scope
 * @returns {{ coins: HTMLElement[], turn: (coin: HTMLElement, back: boolean) => void, setTurner: (fn: (inner: HTMLElement, back: boolean) => void) => () => void } | null}
 */
export function coinFlip(scope) {
  const coins = /** @type {HTMLElement[]} */ (Array.from(scope.querySelectorAll('[data-coin]')));
  if (!coins.length) return null;
  scope.classList.add('is-coins');
  // Without motion the turn is a class swap; coinsMotion() replaces it with a tween.
  let turner = (inner, back) => inner.classList.toggle('is-back', back);
  const turn = (coin, back) => {
    const inner = coin.querySelector('[data-coin-inner]');
    if (!inner) return;
    coin.setAttribute('aria-pressed', String(back));
    coin.classList.toggle('is-turned', back);
    turner(/** @type {HTMLElement} */ (inner), back);
  };
  coins.forEach((coin) => {
    coin.setAttribute('role', 'button');
    coin.setAttribute('aria-pressed', 'false');
    coin.addEventListener('click', (e) => {
      if (/** @type {Element} */ (e.target).closest('a')) return; // links on the back still work
      turn(coin, !coin.classList.contains('is-turned'));
    });
    coin.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (/** @type {Element} */ (e.target).closest('a')) return;
      e.preventDefault();
      turn(coin, !coin.classList.contains('is-turned'));
    });
  });
  return {
    coins,
    turn,
    setTurner: (fn) => {
      const before = turner;
      turner = fn;
      return () => (turner = before);
    },
  };
}

/**
 * @param {Element} scope
 * @param {ReturnType<typeof coinFlip>} flip
 * @param {import('../core/core.js').MotionEnv} env
 */
export function coinsMotion(scope, flip, env) {
  if (!flip) return;
  const { coins, turn, setTurner } = flip;
  const inners = coins.map((coin) => coin.querySelector('[data-coin-inner]'));

  // Turning is a tween on the inner; the class keeps its meaning for CSS (no transition).
  env.onCleanup(
    setTurner((inner, back) => {
      inner.classList.toggle('is-back', back);
      gsap.to(inner, { rotationY: back ? 180 : 0, duration: 0.9, ease: 'power3.inOut', overwrite: true });
    }),
  );
  inners.forEach((inner) => inner && gsap.set(inner, { rotationY: inner.classList.contains('is-back') ? 180 : 0 }));

  // Arrival: each coin spins in from edge-on, in turn.
  gsap.set(coins, { rotationY: -90, autoAlpha: 0, transformPerspective: 1000, lazy: false });
  ScrollTrigger.batch(coins, {
    start: 'top 88%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        rotationY: 0,
        autoAlpha: 1,
        duration: 1.3,
        ease: MOTION.ease.reveal,
        stagger: 0.14,
        overwrite: true,
      }),
  });
  env.onCleanup(() => coins.forEach((coin) => coin.classList.contains('is-turned') && turn(coin, false)));
}

/**
 * Hover screens: a coin turns over while the pointer is on it. Run with { when: 'hover' }.
 * @param {ReturnType<typeof coinFlip>} flip
 * @param {import('../core/core.js').MotionEnv} env
 */
export function coinsHover(flip, env) {
  if (!flip) return;
  flip.coins.forEach((coin) => {
    const enter = () => flip.turn(coin, true);
    const leave = () => flip.turn(coin, false);
    coin.addEventListener('pointerenter', enter);
    coin.addEventListener('pointerleave', leave);
    env.onCleanup(() => {
      coin.removeEventListener('pointerenter', enter);
      coin.removeEventListener('pointerleave', leave);
    });
  });
}
