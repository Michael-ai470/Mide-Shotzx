// recipes/magnetic.js (Web Motion Kit)
// Engine 6.6, the magnetic button, in plain JS: the element leans toward the pointer while
// it is over it and settles back when it leaves. Run it with { when: 'hover' }: the effect
// is pointless and jittery on touch.
//
// Markup hook: [data-magnetic]. Put it on a plain wrapper round a button that has its own
// CSS transitions (.btn does), so the wrapper moves and the button never has two jobs.

import { gsap } from '../core/core.js';

/** @param {Element} scope  @param {import('../core/core.js').MotionEnv} env  @param {number} [strength] */
export function magnetic(scope, env, strength = 0.35) {
  scope.querySelectorAll('[data-magnetic]').forEach((el) => {
    // quickTo reuses one tween per axis instead of creating one per pointer event.
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
    let rect = el.getBoundingClientRect();

    const enter = () => {
      rect = el.getBoundingClientRect(); // measure at rest, not mid-offset
    };
    const move = (e) => {
      xTo((e.clientX - (rect.left + rect.width / 2)) * strength);
      yTo((e.clientY - (rect.top + rect.height / 2)) * strength);
    };
    const leave = () => {
      xTo(0);
      yTo(0);
    };

    el.addEventListener('pointerenter', enter);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    env.onCleanup(() => {
      el.removeEventListener('pointerenter', enter);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    });
  });
}
