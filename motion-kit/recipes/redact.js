// recipes/redact.js (Web Motion Kit)
// Declassified copy: each paragraph marked [data-redact] is split into lines and every line
// starts under a solid bar, like a redacted document. As the paragraph scrolls up the bars
// draw back one after another and the words underneath are read. Scrubbed, so scrolling
// back covers them again.
//
// The bar is a pseudo-element on the split line (.er-redact-line::after in
// css/elrock.css) driven by one CSS variable, --redact (1 covered, 0 open). With scripts
// off there is no split and so no bar.
//
// Also: [data-redact-photo] opens from its top edge down as it scrolls in.

import { gsap, MOTION, getSplitText } from '../core/core.js';

/**
 * @param {Element} scope
 * @param {import('../core/core.js').MotionEnv} env
 */
export function redact(scope, env) {
  const SplitText = getSplitText();
  if (SplitText) {
    scope.querySelectorAll('[data-redact]').forEach((el) => {
      const split = SplitText.create(el, {
        type: 'lines',
        linesClass: 'er-redact-line',
        autoSplit: true,
        // Returning the tween lets SplitText carry its progress across a re-split.
        onSplit: (self) =>
          gsap.fromTo(
            self.lines,
            { '--redact': 1 },
            {
              '--redact': 0,
              ease: MOTION.ease.scrub,
              stagger: 0.35,
              lazy: false,
              scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 50%', scrub: 0.5 },
            },
          ),
      });
      env.onCleanup(() => split.revert());
    });
  }

  scope.querySelectorAll('[data-redact-photo]').forEach((photo) => {
    gsap.fromTo(
      photo,
      { clipPath: 'inset(0% 0% 100% 0%)' },
      {
        clipPath: 'inset(0% 0% 0% 0%)',
        ease: MOTION.ease.scrub,
        lazy: false,
        scrollTrigger: { trigger: photo, start: 'top 88%', end: 'top 35%', scrub: 0.6 },
      },
    );
  });
}
