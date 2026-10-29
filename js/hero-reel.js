// js/hero-reel.js
// The home hero: four photographs edge to edge, full screen, like a contact sheet held
// up to the light. Written to the Web Motion Kit's recipe shape (motion-kit/ENGINE.md 3).
//
// Load:   each panel wipes up from its bottom edge in turn while its photo settles from a
//         slight zoom; then the headline's lines rise and the rest arrives.
// Time:   every few seconds one panel cross-fades to its second frame, in turn. Pauses off
//         screen and in a hidden tab.
// Scroll: the panels drift at different speeds and the copy lifts away.
//
// Markup hooks (one job per element):
//   [data-reel-panel]   the panel. Only its clip-path moves (intro).
//   [data-reel-drift]   inside it, taller than the panel. Only its y moves (scroll).
//   [data-reel-zoom]    inside that. Only its scale moves (intro).
//   img + img[data-reel-alt]   the two frames. Only the second one's opacity moves (time).
//   [data-reel-title]   the headline (lines rise). [data-reel-part] the other copy (fade).
//   [data-reel-copy]    wrapper round the copy. Only it moves on scroll.
// Panels, title and parts carry data-motion-hide. Without scripts or with reduced motion
// everything sits in place, first frames showing.

import { gsap, ScrollTrigger, MOTION, getSplitText } from '../motion-kit/core/core.js';

const HOLD = 5.2; // seconds between cross-fades
const DRIFT = [0.5, 1, 0.3, 0.8]; // share of each panel's overscan it drifts through
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** @param {Element} scope  @param {import('../motion-kit/core/core.js').MotionEnv} env */
export function heroReel(scope, env) {
  const hero = /** @type {HTMLElement} */ (scope);
  const panels = Array.from(hero.querySelectorAll('[data-reel-panel]'));
  if (!panels.length) return;
  const shown = () => panels.filter((p) => p.offsetWidth > 0);
  const title = hero.querySelector('[data-reel-title]');
  const parts = Array.from(hero.querySelectorAll('[data-reel-part]'));
  const copy = hero.querySelector('[data-reel-copy]');

  // 1. Intro, once.
  if (env.intro) {
    const visible = shown();
    const zooms = visible.map((p) => p.querySelector('[data-reel-zoom]'));
    gsap.set(visible, { clipPath: 'inset(100% 0% 0% 0%)', lazy: false });
    gsap.set(zooms, { scale: 1.28, lazy: false });
    gsap.set([title, ...parts], { autoAlpha: 0, lazy: false });

    let alive = true;
    let tl = null;
    let split = null;
    env.onCleanup(() => {
      alive = false;
      tl?.revert();
      split?.revert();
    });

    Promise.race([document.fonts?.ready, wait(1500)]).then(() => {
      if (!alive) return;
      tl = gsap.timeline({ defaults: { ease: MOTION.ease.reveal } });
      tl.to(visible, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: MOTION.ease.inOut, stagger: 0.12 }, 0);
      tl.to(zooms, { scale: 1, duration: 2.4, stagger: 0.12 }, 0);
      const SplitText = getSplitText();
      tl.set(title, { autoAlpha: 1 }, 0.9);
      if (SplitText && title) {
        split = SplitText.create(title, { type: 'lines', mask: 'lines' });
        tl.from(split.lines, { yPercent: 110, duration: 1.3, stagger: 0.1, onComplete: () => split?.revert() }, 0.9);
      }
      tl.fromTo(parts, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.1 }, 1.35);
    });
  }

  // 2. Scroll: panels drift at their own speeds, the copy lifts away.
  panels.forEach((panel, i) => {
    const drift = panel.querySelector('[data-reel-drift]');
    if (!drift) return;
    gsap.fromTo(
      drift,
      { y: 0 },
      {
        // The drift layer overhangs the panel top and bottom (CSS); it never moves further
        // than that overhang, so no edge shows. Phones have no overhang, so no drift.
        y: () => ((drift.offsetHeight - panel.offsetHeight) / 2) * DRIFT[i % DRIFT.length],
        ease: MOTION.ease.scrub,
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6, invalidateOnRefresh: true },
      },
    );
  });
  if (copy) {
    gsap.to(copy, {
      yPercent: -35,
      autoAlpha: 0,
      ease: MOTION.ease.scrub,
      scrollTrigger: { trigger: hero, start: 'top top', end: '70% top', scrub: 0.6 },
    });
  }

  // 3. Time: one panel at a time turns to its second frame, and back on its next turn.
  let turn = 0;
  let call = null;
  let onScreen = true;
  const next = () => {
    call = gsap.delayedCall(HOLD, () => {
      const visible = shown();
      if (onScreen && !document.hidden && visible.length) {
        const panel = visible[turn % visible.length];
        const alt = panel.querySelector('[data-reel-alt]');
        if (alt && alt.complete && alt.naturalWidth) {
          const on = Number(gsap.getProperty(alt, 'opacity')) < 0.5;
          gsap.to(alt, { opacity: on ? 1 : 0, duration: 1.8, ease: MOTION.ease.inOut });
        }
        turn += 1;
      }
      next();
    });
  };
  next();
  ScrollTrigger.create({ trigger: hero, start: 'top bottom', end: 'bottom top', onToggle: (self) => (onScreen = self.isActive) });
  env.onCleanup(() => {
    call?.kill();
    gsap.set(hero.querySelectorAll('[data-reel-alt]'), { clearProps: 'opacity' });
  });
}
