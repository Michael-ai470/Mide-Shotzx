// recipes/chain-mine.js (Web Motion Kit)
// The blockchain strip, mined. When it comes into view the blocks are confirmed one after
// another: each block's hash churns through random hex, locks on its real value and the
// block lights; the link to the next block draws, and the next one starts. Once the chain
// is built, a light runs along it now and then while it is on screen (wide screens, where
// the chain sits on one row: chainPulse, run with a `when`).
//
// Markup: [data-chain] > [data-block] (each with a [data-hash]) and [data-link] between them.
// The block's lit state is a class (.is-mined, css/token.css), so its colours can ease in CSS.

import { gsap, ScrollTrigger } from '../core/core.js';

const HEX = '0123456789abcdef';
// Every hex digit after the 0x prefix churns; the prefix and the ellipsis stay.
const churn = (text) => text.replace(/^0x|[0-9a-f]/gi, (m) => (m.toLowerCase() === '0x' ? m : HEX[(Math.random() * 16) | 0]));

/**
 * @param {Element} scope
 * @param {import('../core/core.js').MotionEnv} env
 */
export function chainMine(scope, env) {
  const chain = scope.matches('[data-chain]') ? scope : scope.querySelector('[data-chain]');
  const blocks = chain ? Array.from(chain.querySelectorAll('[data-block]')) : [];
  if (!chain || !blocks.length) return;
  const links = Array.from(chain.querySelectorAll('[data-link]'));
  const hashes = blocks.map((block) => block.querySelector('[data-hash]'));
  const real = hashes.map((h) => h?.textContent || '');

  gsap.set(links, { scaleX: 0, transformOrigin: '0 50%', lazy: false });
  gsap.set(blocks, { autoAlpha: 0.35, lazy: false });

  const tl = gsap.timeline({ paused: true });
  blocks.forEach((block, i) => {
    const hash = hashes[i];
    const at = i * 0.75;
    tl.to(block, { autoAlpha: 1, duration: 0.3 }, at);
    if (hash) {
      const state = { p: 0 };
      tl.to(state, {
        p: 1,
        duration: 0.6,
        ease: 'none',
        onUpdate: () => (hash.textContent = state.p < 1 ? churn(real[i]) : real[i]),
        onComplete: () => (hash.textContent = real[i]),
        onReverseComplete: () => (hash.textContent = real[i]),
      }, at);
    }
    tl.call(() => block.classList.add('is-mined'), [], at + 0.6);
    if (links[i]) tl.to(links[i], { scaleX: 1, duration: 0.35, ease: 'power2.inOut' }, at + 0.6);
  });
  ScrollTrigger.create({ trigger: chain, start: 'top 80%', once: true, onEnter: () => tl.play() });
  env.onCleanup(() => {
    blocks.forEach((block) => block.classList.remove('is-mined'));
    hashes.forEach((h, i) => h && (h.textContent = real[i]));
  });
}

/**
 * A light runs along the built chain every few seconds while it is on screen.
 * @param {Element} scope
 * @param {import('../core/core.js').MotionEnv} env
 */
export function chainPulse(scope, env) {
  const chain = /** @type {HTMLElement | null} */ (scope.matches('[data-chain]') ? scope : scope.querySelector('[data-chain]'));
  if (!chain) return;
  const light = document.createElement('span');
  light.className = 'te-chain-light';
  light.setAttribute('aria-hidden', 'true');
  chain.appendChild(light);
  env.onCleanup(() => light.remove());

  const run = gsap.timeline({ repeat: -1, repeatDelay: 2.6, paused: true, delay: 3.2 });
  run
    .fromTo(light, { x: 0, autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 }, 0)
    .to(light, { x: () => chain.clientWidth, duration: 2.2, ease: 'power1.inOut' }, 0)
    .to(light, { autoAlpha: 0, duration: 0.3 }, 1.95);
  ScrollTrigger.create({
    trigger: chain,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => (self.isActive ? run.play() : run.pause()),
    onRefresh: (self) => (self.isActive ? run.play() : run.pause()),
  });
  env.onCleanup(() => run.kill());
}
