// recipes/stack.js (Web Motion Kit)
// The process as a stack of deal papers (wide screens). The layout is CSS (css/elrock.css):
// the header holds on the left, and on the right each step is sticky a little lower than
// the one before, so the next step slides up over it. stack() adds the motion and .is-stack
// (which shows the meter): a covered step settles back (smaller, shaded), the meter fills
// with the scroll and counts the step in front. Nothing is pinned by GSAP.
//
// stepsRise() is the narrow-screen version: the steps rise in turn, nothing sticks.
// closingStamp() (all screens): a "Closed" stamp lands on the last step when it arrives.
// Call it after stack() or stepsRise() in the same motion block, so it finds the markers.
//
// Markup, inside the section:
//   [data-stack-grid] > [data-stack-step] (each with .er-step-shade)
//   [data-stack-fill]  the meter bar      [data-stack-count]  the "01" in "Step 01 / 04"
//   [data-stamp]       the stamp on the last step

import { gsap, ScrollTrigger, MOTION } from '../core/core.js';

/**
 * Run with { when: '(min-width: 1025px)' }.
 * @param {Element} scope  the section
 * @param {import('../core/core.js').MotionEnv} env
 */
export function stack(scope, env) {
  const grid = scope.querySelector('[data-stack-grid]');
  const steps = Array.from(scope.querySelectorAll('[data-stack-step]'));
  if (!grid || steps.length < 2) return;
  const fill = scope.querySelector('[data-stack-fill]');
  const count = scope.querySelector('[data-stack-count]');

  scope.classList.add('is-stack');
  // Triggers are measured on markers that stay in the flow just above each step: a stuck
  // step reports where it is stuck, not where it sits, which would throw a reload part-way
  // down off.
  const marks = steps.map((step) => {
    const mark = document.createElement('i');
    mark.className = 'er-stack-mark';
    mark.setAttribute('aria-hidden', 'true');
    step.before(mark);
    return mark;
  });
  env.onCleanup(() => {
    scope.classList.remove('is-stack');
    marks.forEach((mark) => mark.remove());
    if (count) count.textContent = '01';
  });

  // Each step settles back as the next one slides over it.
  steps.slice(0, -1).forEach((step, i) => {
    const next = steps[i + 1];
    const shade = step.querySelector('.er-step-shade');
    const under = () => ({
      trigger: marks[i + 1],
      start: 'top bottom',
      end: () => `top ${stickTop(next)}px`,
      scrub: 0.5,
      invalidateOnRefresh: true,
    });
    gsap.fromTo(step, { scale: 1 }, { scale: 0.93, ease: MOTION.ease.scrub, scrollTrigger: under() });
    if (shade) gsap.fromTo(shade, { opacity: 0 }, { opacity: 0.55, ease: MOTION.ease.scrub, scrollTrigger: under() });
  });

  // The meter: fills from the first step arriving to the last one settling.
  const last = steps.length - 1;
  if (fill) {
    gsap.fromTo(
      fill,
      { scaleX: 0 },
      {
        scaleX: 1,
        ease: MOTION.ease.scrub,
        scrollTrigger: {
          trigger: marks[0],
          start: 'top 75%',
          endTrigger: marks[last],
          end: () => `top ${stickTop(steps[last])}px`,
          scrub: 0.5,
          invalidateOnRefresh: true,
        },
      },
    );
  }
  if (count) {
    steps.forEach((step, i) => {
      ScrollTrigger.create({
        trigger: marks[i],
        start: () => `top ${stickTop(step) + 140}px`,
        invalidateOnRefresh: true,
        onEnter: () => (count.textContent = String(i + 1).padStart(2, '0')),
        onLeaveBack: () => (count.textContent = String(Math.max(1, i)).padStart(2, '0')),
      });
    });
  }
}

/** The sticky top of a step, in px, read from its computed style. */
function stickTop(step) {
  return parseFloat(getComputedStyle(step).top) || 0;
}

/**
 * Below the stack breakpoint: the steps rise in turn as they enter.
 * @param {Element} scope
 */
export function stepsRise(scope) {
  const steps = Array.from(scope.querySelectorAll('[data-stack-step]'));
  if (!steps.length) return;
  gsap.set(steps, { autoAlpha: 0, y: 40, lazy: false });
  ScrollTrigger.batch(steps, {
    start: 'top 90%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        autoAlpha: 1,
        y: 0,
        duration: MOTION.duration.reveal,
        ease: MOTION.ease.reveal,
        stagger: MOTION.stagger.loose,
        overwrite: true,
      }),
  });
}

/**
 * The "Closed" stamp: slams down on the last step when it arrives, lifts if you scroll back.
 * @param {Element} scope
 */
export function closingStamp(scope) {
  const stamp = scope.querySelector('[data-stamp]');
  const step = stamp?.closest('[data-stack-step]');
  if (!stamp || !step) return;
  const slam = gsap
    .timeline({ paused: true })
    .fromTo(
      stamp,
      { autoAlpha: 0, scale: 2.6, rotation: -22 },
      { autoAlpha: 1, scale: 1, rotation: -8, duration: 0.32, ease: 'power4.in' },
    )
    .fromTo(step, { x: 0 }, { keyframes: { x: [0, -5, 4, -2, 0] }, duration: 0.3, ease: 'none' }, '>-0.02');
  // In the stack, measure on the step's flow marker (see stack()).
  const mark = step.previousElementSibling?.classList.contains('er-stack-mark') ? step.previousElementSibling : null;
  ScrollTrigger.create({
    trigger: mark || step,
    start: () => (mark ? `top ${stickTop(step) + 2}px` : 'top 55%'),
    invalidateOnRefresh: true,
    onEnter: () => slam.restart(),
    onLeaveBack: () => slam.pause(0),
  });
}
