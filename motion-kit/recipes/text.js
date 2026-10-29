// recipes/text.js (Web Motion Kit)
// Text motion: line reveals, batch reveals, words that light up, words that gather,
// and numbers that roll. Every function takes a scope element and returns early when
// its hooks are missing, so one call can cover a whole page.
//
// Markup hooks:
//   [data-reveal-text]   heading or short statement. Lines rise out of a mask, once.
//   [data-reveal]        block. Fades and rises with its neighbours, once.
//   [data-word-light]    paragraph or quote. Words go from dim to full as you scroll.
//   [data-word-gather]   paragraph. Words start spread out and close up as you scroll.
//   [data-roll]          number. Digits roll into place, once.
//
// SplitText must be loaded (js/vendor/SplitText.min.js). Without it the split recipes
// do nothing and the text simply stays as it is.

import { gsap, ScrollTrigger, MOTION, getSplitText } from '../core/core.js';

const each = (scope, sel) => [
  ...(scope.matches?.(sel) ? [scope] : []),
  ...scope.querySelectorAll(sel),
];

/** 6.2: lines rise out of a mask the first time the element enters the viewport. */
export function textReveal(scope, env) {
  const SplitText = getSplitText();
  if (!SplitText) return;
  each(scope, '[data-reveal-text]').forEach((el) => {
    let tween;
    const split = SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      onSplit: (self) =>
        (tween = gsap.from(self.lines, {
          yPercent: 110,
          duration: MOTION.duration.reveal,
          ease: MOTION.ease.reveal,
          stagger: MOTION.stagger.loose,
          paused: true,
          lazy: false,
          // Once the lines have landed, put the heading back as plain text: the line masks
          // clip descenders (g, y) at the headings' tight line height, and plain text
          // reflows on resize.
          onComplete: () => split.revert(),
        })),
    });
    ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => tween?.play() });
    env.onCleanup(() => split.revert());
  });
}

/** 6.3: blocks fade and rise in sequence as they scroll into view. */
export function batchReveal(scope) {
  const items = each(scope, '[data-reveal]');
  if (!items.length) return;
  gsap.set(items, { autoAlpha: 0, y: 36 });
  ScrollTrigger.batch(items, {
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
 * Words light up one after another while the element crosses the screen (Lenval).
 * Scrubbed, so scrolling back dims them again. Colour stays in CSS; only opacity moves.
 */
export function wordLight(scope, env) {
  const SplitText = getSplitText();
  if (!SplitText) return;
  each(scope, '[data-word-light]').forEach((el) => {
    const split = SplitText.create(el, {
      type: 'words',
      autoSplit: true,
      onSplit: (self) =>
        gsap.fromTo(
          self.words,
          { opacity: 0.16 },
          {
            opacity: 1,
            ease: 'none',
            stagger: 0.1,
            scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 58%', scrub: 0.6 },
          },
        ),
    });
    env.onCleanup(() => split.revert());
  });
}

/**
 * Words start pushed away from the middle of their line and close up as the element
 * rises into view (The Design Society). Distance scales with how far a word sits from
 * the centre, so the paragraph reads as one shape pulling together.
 */
export function wordGather(scope, env) {
  const SplitText = getSplitText();
  if (!SplitText) return;
  each(scope, '[data-word-gather]').forEach((el) => {
    const spread = parseFloat(el.dataset.wordGather) || 0.6;
    const split = SplitText.create(el, {
      type: 'words',
      autoSplit: true,
      onSplit: (self) => {
        const box = el.getBoundingClientRect();
        const mid = box.left + box.width / 2;
        return gsap.fromTo(
          self.words,
          {
            x: (i, w) => {
              const r = w.getBoundingClientRect();
              return (r.left + r.width / 2 - mid) * spread;
            },
            opacity: 0.25,
          },
          {
            x: 0,
            opacity: 1,
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 50%', scrub: 0.8 },
          },
        );
      },
    });
    env.onCleanup(() => split.revert());
  });
}

/**
 * Digits roll up into place, like a mechanical counter, the first time the number is
 * seen. Letters and symbols fade in around them. The real text stays in aria-label.
 */
export function rollNumbers(scope, env) {
  each(scope, '[data-roll]').forEach((el, n) => {
    const text = el.textContent.trim();
    if (!/\d/.test(text)) return;
    const original = el.innerHTML;
    el.setAttribute('aria-label', text);
    const wrap = document.createElement('span');
    wrap.className = 'roll';
    wrap.setAttribute('aria-hidden', 'true');
    const cols = [];
    const marks = [];
    for (const ch of text) {
      if (/\d/.test(ch)) {
        const col = document.createElement('span');
        col.className = 'roll-col';
        const strip = document.createElement('span');
        strip.className = 'roll-strip';
        const target = Number(ch);
        // One full turn past zero, then on to the digit, so even a 1 travels.
        const seq = [];
        for (let i = 0; i <= 10 + target; i++) seq.push(i % 10);
        strip.innerHTML = seq.map((d) => `<span>${d}</span>`).join('');
        col.appendChild(strip);
        wrap.appendChild(col);
        cols.push({ strip, steps: seq.length - 1 });
      } else {
        const mark = document.createElement('span');
        mark.className = 'roll-mark';
        mark.textContent = ch;
        wrap.appendChild(mark);
        marks.push(mark);
      }
    }
    el.textContent = '';
    el.appendChild(wrap);
    env.onCleanup(() => {
      el.innerHTML = original;
      el.removeAttribute('aria-label');
    });

    const tl = gsap.timeline({ paused: true, delay: n * 0.08 });
    cols.forEach(({ strip, steps }, i) => {
      gsap.set(strip, { yPercent: 0 });
      tl.to(strip, { yPercent: (-100 * steps) / (steps + 1), duration: 1.6 + i * 0.25, ease: 'expo.out' }, i * 0.08);
    });
    if (marks.length) {
      gsap.set(marks, { autoAlpha: 0, y: 10 });
      tl.to(marks, { autoAlpha: 1, y: 0, duration: 0.8, ease: MOTION.ease.reveal, stagger: 0.05 }, 0.3);
    }
    ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => tl.play() });
  });
}
