// recipes/fraction.js (Web Motion Kit)
// "Own a fraction": a photo of an example property cut into a 10 by 10 grid, each cell a
// hundredth of it. A slider sets the stake; the cells it buys light gold from the top left
// (the last one partly, by height), and the readout gives the tokens, the share of the
// property and the yearly target yield.
//
// fraction() is not motion: it wires the slider for everyone, reduced motion included.
// fractionMotion() (inside createMotion) adds the motion: newly lit cells pop in, and the
// first time the panel is seen the stake sweeps up from nothing to its starting value.
//
// Markup: [data-fraction] with data-price (property value, USD), data-token (token price),
// data-yield="low high" (percent a year); inside it [data-fraction-grid] (aria-hidden,
// cells are made here), input[data-fraction-input] (range), and the readouts
// [data-fraction-amount], [data-fraction-tokens], [data-fraction-share],
// [data-fraction-yield].

import { gsap, ScrollTrigger } from '../core/core.js';

const CELLS = 100;
const usd = (v) => `$${Math.round(v).toLocaleString('en-US')}`;

/**
 * Wires the slider. Returns a setter other code can drive, or null when the markup is missing.
 * @param {Element} scope
 */
export function fraction(scope) {
  const root = scope.matches('[data-fraction]') ? scope : scope.querySelector('[data-fraction]');
  const input = /** @type {HTMLInputElement | null} */ (root?.querySelector('[data-fraction-input]'));
  const grid = root?.querySelector('[data-fraction-grid]');
  if (!root || !input || !grid) return null;
  const q = (sel) => root.querySelector(sel);
  const out = {
    amount: q('[data-fraction-amount]'),
    tokens: q('[data-fraction-tokens]'),
    share: q('[data-fraction-share]'),
    yield: q('[data-fraction-yield]'),
  };
  const price = Number(root.dataset.price) || 1000000;
  const token = Number(root.dataset.token) || 1000;
  const [low, high] = (root.dataset.yield || '6 10').split(' ').map(Number);

  // The grid is decoration: made here, so with scripts off there is none.
  if (!grid.children.length) {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < CELLS; i++) {
      const cell = document.createElement('span');
      cell.className = 'te-cell';
      frag.appendChild(cell);
    }
    grid.appendChild(frag);
  }
  const cells = Array.from(grid.children);
  root.classList.add('is-live');

  let lit = -1;
  const listeners = new Set();
  const set = (amount) => {
    const share = amount / price; // 0..1
    const whole = Math.floor(share * CELLS + 1e-9);
    const part = share * CELLS - whole;
    cells.forEach((cell, i) => {
      const fill = i < whole ? 1 : i === whole ? part : 0;
      cell.style.setProperty('--fill', fill.toFixed(3));
      cell.classList.toggle('is-lit', fill > 0);
    });
    if (out.amount) out.amount.textContent = usd(amount);
    if (out.tokens) out.tokens.textContent = Math.floor(amount / token).toLocaleString('en-US');
    if (out.share) out.share.textContent = `${(share * 100).toFixed(share < 0.01 ? 2 : 1)}%`;
    if (out.yield) out.yield.textContent = `${usd((amount * low) / 100)} – ${usd((amount * high) / 100)}`;
    const count = whole + (part > 0 ? 1 : 0);
    if (count !== lit) {
      listeners.forEach((fn) => fn(lit, count, cells));
      lit = count;
    }
  };
  input.addEventListener('input', () => set(Number(input.value)));
  set(Number(input.value));
  return {
    root,
    input,
    set,
    /** @param {(before: number, after: number, cells: Element[]) => void} fn */
    onChange: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

/**
 * Motion for a slider made by fraction(): cells pop as they light, and a sweep up to the
 * starting stake the first time it is seen.
 * @param {ReturnType<typeof fraction>} slider
 * @param {import('../core/core.js').MotionEnv} env
 */
export function fractionMotion(slider, env) {
  if (!slider) return;
  const { root, input, set, onChange } = slider;
  env.onCleanup(
    onChange((before, after, cells) => {
      if (after <= before) return;
      gsap.fromTo(
        cells.slice(Math.max(0, before), after),
        { scale: 0.4 },
        { scale: 1, duration: 0.5, ease: 'back.out(2.2)', stagger: 0.025, overwrite: true },
      );
    }),
  );

  const start = Number(input.value);
  let touched = false;
  const mark = () => (touched = true);
  input.addEventListener('pointerdown', mark);
  input.addEventListener('keydown', mark);
  env.onCleanup(() => {
    input.removeEventListener('pointerdown', mark);
    input.removeEventListener('keydown', mark);
  });
  // The thumb moves with the sweep, so slider and readout always agree.
  const show = (v) => {
    input.value = String(v);
    set(v);
  };
  show(Number(input.min) || 0);
  const sweep = { v: Number(input.min) || 0 };
  ScrollTrigger.create({
    trigger: root,
    start: 'top 70%',
    once: true,
    onEnter: () =>
      gsap.to(sweep, {
        v: start,
        duration: 1.6,
        ease: 'power2.inOut',
        onUpdate: () => {
          if (touched) return; // the visitor has taken over
          show(Math.round(sweep.v / 1000) * 1000);
        },
        onComplete: () => {
          if (!touched) show(start);
        },
      }),
  });
  env.onCleanup(() => {
    if (!touched) show(start);
  });
}
