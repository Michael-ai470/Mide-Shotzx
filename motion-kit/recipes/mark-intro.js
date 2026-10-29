// recipes/mark-intro.js (Web Motion Kit)
// The 1% hero: the page's mark drawn as its loader, then the hero.
//   full:  "The 1%" is drawn in gold line glyph by glyph, then fills; the curtain lifts off
//          the photo while the mark glides down into the hero's eyebrow, where the same
//          lettering sits. A click, scroll or key skips straight to that handover.
//   quick: the mark is already written; the curtain lifts and it glides into place.
//   none:  no curtain; the hero copy simply plays in.
// The inline script in <head> picks the mode before the first paint (html[data-mark]):
// full on a first visit and on a reload, quick when the page is reached again in the same
// visit, none on Back/Forward and with reduced motion.
// After the handover the copy arrives: the heading by the gold-leaf sweep, the description
// written on line by line, the pills rising. On scroll the photo dollies in and the copy
// recedes.
//
// Markup hooks, inside the hero:
//   [data-mark-overlay]  the fixed curtain, holding .op-mark-curtain and .op-mark-ink (the
//                        drawn <svg>, .mark-glyph paths with pathLength="1").
//   [data-mark-target]   the eyebrow mark the drawing glides into (same <svg>).
//   [data-sweep]         the heading. [data-ink-lines] the description. [data-rise] the
//                        pills (their children rise). All three and the target carry
//                        data-motion-hide.
//   [data-hero-copy]     wraps the copy; only it recedes on scroll.
//   [data-hero-photo]    the photo; only its scale moves on scroll.

import { gsap, MOTION, getSplitText } from '../core/core.js';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const SEEN = 'op-mark';

/** @param {Element} scope  the hero  @param {import('../core/core.js').MotionEnv} env */
export function markIntro(scope, env) {
  const hero = /** @type {HTMLElement} */ (scope);
  const overlay = hero.querySelector('[data-mark-overlay]');
  const ink = overlay?.querySelector('.op-mark-ink');
  const curtain = overlay?.querySelector('.op-mark-curtain');
  const glyphs = overlay ? Array.from(overlay.querySelectorAll('.mark-glyph')) : [];
  const skipHint = overlay?.querySelector('.op-mark-skip');
  const target = hero.querySelector('[data-mark-target]');
  const heading = hero.querySelector('[data-sweep]');
  const lines = hero.querySelector('[data-ink-lines]');
  const rise = hero.querySelector('[data-rise]');
  const copy = hero.querySelector('[data-hero-copy]');
  const photo = hero.querySelector('[data-hero-photo]');

  let mode = document.documentElement.dataset.mark || 'none';
  if (overlay) {
    // If the CSS failsafe has already cleared the curtain (scripts arrived late), never
    // bring it back mid-page: play the hero without it.
    const failsafe = overlay.getAnimations?.()[0];
    if (!env.intro || (failsafe && (failsafe.currentTime ?? 0) >= 2100)) mode = 'none';
    overlay.style.animation = 'none'; // motion has it now
    if (mode === 'none') overlay.style.display = 'none';
    env.onCleanup(() => {
      overlay.style.animation = '';
      overlay.style.display = '';
    });
  }
  const playMark = mode === 'full' || mode === 'quick';

  // 1. Intro, once.
  if (env.intro) {
    const parts = [target, heading, lines, rise].filter(Boolean);
    gsap.set(parts, { autoAlpha: 0, lazy: false });
    let alive = true;
    let timeline = null; // the mark: starts at once, it is SVG and needs no fonts
    let copyline = null; // the copy: built at the handover, once the fonts are in too
    const splits = [];
    const offs = [];
    env.onCleanup(() => {
      alive = false;
      offs.splice(0).forEach((off) => off());
      timeline?.revert();
      copyline?.revert();
      splits.forEach((split) => split.revert());
    });

    let handedOver;
    const handover = new Promise((resolve) => (handedOver = resolve));
    timeline = gsap.timeline({ defaults: { ease: MOTION.ease.reveal } });

    if (playMark && ink && target) {
      try {
        sessionStorage.setItem(SEEN, '1');
      } catch {
        /* private mode: the mark simply plays in full next time too */
      }
      let at = 0.05;
      const glide = mode === 'full' ? 0.95 : 0.75; // the quick version stays under a second
      if (mode === 'full') {
        // Draw in real outline lengths: the CSS hides the strokes with pathLength="1", but
        // GSAP rounds a 1-to-0 dash to whole pixels, so it would jump instead of draw.
        glyphs.forEach((glyph) => {
          glyph.removeAttribute('pathLength');
          const length = glyph.getTotalLength();
          glyph.style.strokeDasharray = `${length}`;
          glyph.style.strokeDashoffset = `${length}`;
        });
        timeline.to(glyphs, { strokeDashoffset: 0, duration: 0.8, stagger: 0.12, ease: 'power2.inOut' }, 0.1);
        timeline.to(glyphs, {
          fill: (i, el) => (el.classList.contains('is-strong') ? 'rgba(201, 168, 76, 1)' : 'rgba(255, 255, 255, 1)'),
          duration: 0.4,
          stagger: 0.04,
          ease: 'power1.out',
        }, 1.0);
        timeline.to(glyphs, { strokeOpacity: 0, duration: 0.3 }, 1.3);
        at = 1.5;
      }
      timeline.addLabel('handover', at);
      // Glide: measured when the glide starts, so it lands on the eyebrow wherever the
      // layout has put it. If the eyebrow is off screen (a reload restored the reader
      // further down the page), the mark fades where it is instead of flying away.
      let flip = null;
      const measure = () => {
        const a = ink.getBoundingClientRect();
        const b = target.getBoundingClientRect();
        const away = b.bottom < 0 || b.top > window.innerHeight;
        flip = away ? { x: 0, y: 0, s: 1, away } : { x: b.left - a.left, y: b.top - a.top, s: b.width / a.width, away };
        return flip;
      };
      timeline.to(ink, { x: () => measure().x, y: () => flip.y, scale: () => flip.s, autoAlpha: () => (flip.away ? 0 : 1), duration: glide, ease: MOTION.ease.inOut }, at);
      if (curtain) timeline.to(curtain, { yPercent: -100, duration: glide, ease: MOTION.ease.inOut }, at + 0.05);
      if (skipHint) timeline.to(skipHint, { autoAlpha: 0, duration: 0.3 }, at);
      timeline.set(target, { autoAlpha: 1 }, at + glide);
      timeline.set(overlay, { autoAlpha: 0 }, at + glide + 0.02);
      // The copy starts as the curtain clears the top of the screen.
      timeline.call(() => handedOver(), null, at + glide - 0.1);

      // Skipping: any click, scroll or key during the drawing jumps to the handover. Until
      // then the page underneath does not scroll.
      if (mode === 'full') {
        const skip = (event) => {
          if (event.type !== 'pointerdown' && event.cancelable) event.preventDefault();
          if (timeline.time() < timeline.labels.handover) timeline.seek('handover');
          off();
        };
        const events = ['pointerdown', 'wheel', 'touchmove', 'keydown'];
        const off = () => events.forEach((type) => window.removeEventListener(type, skip));
        events.forEach((type) => window.addEventListener(type, skip, { passive: false }));
        offs.push(off);
        timeline.call(off, null, at);
      }
    } else {
      if (target) timeline.fromTo(target, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.8 }, 0.1);
      timeline.call(() => handedOver(), null, 0.3);
    }

    // The copy: the heading's gold-leaf sweep, the description written on line by line,
    // the pills rising. Its line breaks need the fonts, so it waits for them as well (never
    // more than a second and a half).
    Promise.all([handover, Promise.race([document.fonts?.ready, wait(1500)])]).then(() => {
      if (!alive) return;
      copyline = gsap.timeline({
        defaults: { ease: MOTION.ease.reveal },
        onComplete: () => splits.splice(0).forEach((split) => split.revert()),
      });
      let at = 0;
      if (heading) {
        copyline.set(heading, { autoAlpha: 1 }, at);
        copyline.fromTo(heading, { '--sweep': 0 }, { '--sweep': 1, duration: 1.4, ease: 'power2.inOut' }, at);
        at += 0.5;
      }
      const SplitText = getSplitText();
      if (lines && SplitText) {
        const split = SplitText.create(lines, { type: 'lines' });
        splits.push(split);
        split.lines.forEach((line) => (line.style.clipPath = 'inset(-20% calc((1 - var(--ink, 1)) * 100%) -20% 0)'));
        copyline.set(lines, { autoAlpha: 1 }, at);
        copyline.fromTo(split.lines, { '--ink': 0 }, { '--ink': 1, duration: 0.85, stagger: 0.16, ease: 'power2.out' }, at);
        at += 0.3 + split.lines.length * 0.16;
      } else if (lines) {
        copyline.fromTo(lines, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.9 }, at);
        at += 0.3;
      }
      if (rise) {
        copyline.set(rise, { autoAlpha: 1 }, at);
        copyline.from(rise.children, { yPercent: 120, autoAlpha: 0, duration: 0.7, stagger: 0.07 }, at);
      }
    });
  }

  // 2. Scroll: the photo dollies in, the copy recedes.
  const leaving = { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 };
  if (photo) gsap.to(photo, { scale: 1.22, ease: 'none', scrollTrigger: leaving });
  if (copy) gsap.to(copy, { y: -70, autoAlpha: 0, ease: 'none', scrollTrigger: { ...leaving, end: '60% top' } });
}
