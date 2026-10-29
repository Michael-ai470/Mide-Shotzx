// core/core.js (Web Motion Kit)
// Tokens, one-time plugin registration, the visibility gate, and createMotion().
// Plain-JS port of docs/web-motion-engine.md 5.3. Every recipe goes through this file.
//
// gsap, ScrollTrigger and CustomEase are the prebuilt files in js/vendor/, loaded as
// deferred classic scripts before any module, so here they are globals. If one failed
// to load, registerMotion() returns false and the page stays static.
// SplitText (js/vendor/SplitText.min.js) is optional: pages that use the text recipes
// load it, and registerMotion() registers it when it is there (rule 11).
export const { gsap, ScrollTrigger, CustomEase } = window;
/** SplitText, or undefined on pages that do not load it. Read at call time. */
export const getSplitText = () => window.SplitText;

export const MOTION = {
  ease: { reveal: 'luxe', inOut: 'luxeInOut', soft: 'expo.out', scrub: 'none' },
  duration: { micro: 0.3, base: 0.9, reveal: 1.2, hero: 1.6 },
  stagger: { tight: 0.02, base: 0.06, loose: 0.1 },
  query: {
    reduce: '(prefers-reduced-motion: reduce)',
    motion: '(prefers-reduced-motion: no-preference)',
    desktop: '(min-width: 1024px)',
    hover: '(hover: hover) and (pointer: fine)',
  },
};

/** Registers plugins and global behaviour once. Returns false on failure. */
export function registerMotion() {
  if (typeof window === 'undefined') return false;
  if (window.__motionReady !== undefined) return window.__motionReady;
  try {
    if (!gsap || !ScrollTrigger || !CustomEase) throw new Error('gsap did not load (check the vendor scripts)');
    gsap.registerPlugin(ScrollTrigger, CustomEase);
    if (window.SplitText) gsap.registerPlugin(window.SplitText);
    // Cubic-bezier values. x1 and x2 must stay inside 0..1 or time runs backwards.
    CustomEase.create('luxe', '0.16, 1, 0.3, 1');
    CustomEase.create('luxeInOut', '0.76, 0, 0.24, 1');
    ScrollTrigger.config({ ignoreMobileResize: true });

    // Triggers must be measured top to bottom, or a pin higher up shifts everything
    // below it. Creation order is not reliable (lazy content, breakpoint rebuilds).
    ScrollTrigger.addEventListener('refreshInit', () => ScrollTrigger.sort());

    // Trigger positions go stale when fonts, lazy images or late content change the
    // page height. Re-measure when that happens, and only then.
    let measured = 0;
    let timer = 0;
    const height = () => document.documentElement.scrollHeight;
    const check = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (Math.abs(height() - measured) > 1) ScrollTrigger.refresh();
      }, 200);
    };
    ScrollTrigger.addEventListener('refresh', () => {
      measured = height();
    });
    document.fonts?.ready.then(check).catch(() => {});
    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(check);
      for (const el of [document.documentElement, document.body]) if (el) observer.observe(el);
    }
    window.__motionReady = true;
  } catch (error) {
    console.warn('[motion] could not start, the page stays static.', error);
    window.__motionReady = false;
  }
  return window.__motionReady;
}

const GATED = '[data-motion-hide]';
const gatedIn = (scope) => [
  ...(scope.matches(GATED) ? [scope] : []),
  ...Array.from(scope.querySelectorAll(GATED)),
];

/** True when the failsafe has already shown this scope's gated elements to the user. */
function shownByFailsafe(scope) {
  const shown = window.__motionShown;
  return !!shown && gatedIn(scope).some((el) => shown.has(el));
}

/** Hands gated elements over to GSAP. Safe to call more than once. */
export function releaseGate() {
  if (typeof document === 'undefined') return;
  window.clearTimeout(window.__motionFailsafe);
  document.documentElement.classList.remove('motion-pending');
}

/**
 * @typedef {object} MotionEnv
 * @property {boolean} intro  Play load-in animations? True only on the first run, and only
 *   if the failsafe has not already shown these elements. When false, leave content as it is.
 * @property {(fn: () => void) => void} onCleanup  Register teardown for anything GSAP does
 *   not track: DOM listeners, clones, timers.
 */

/**
 * Runs `setup` against `scope` and returns a cleanup function.
 * - Reduced motion: `setup` is skipped, so content stays in its natural, visible state.
 * - Any error in `setup`: everything it created is reverted and content stays visible.
 * - Selector strings passed to GSAP inside `setup` are scoped to `scope`.
 *
 * @param {Element | null | undefined} scope
 * @param {(env: MotionEnv) => void} setup
 * @param {{ when?: string, reduced?: (env: MotionEnv) => void }} [options]
 *   `when`: only run while this also matches (a key of MOTION.query, or any media query).
 *   `reduced`: optional opacity-only variant for people who asked for reduced motion.
 * @returns {() => void}
 */
export function createMotion(scope, setup, options = {}) {
  if (!scope) return () => {};
  if (!registerMotion()) {
    releaseGate(); // motion is unavailable, so nothing may stay hidden
    return () => {};
  }
  const gated = gatedIn(scope).length > 0;
  const late = shownByFailsafe(scope);
  const mm = gsap.matchMedia(scope);
  let first = true;

  const guard = (run) => (ctx) => {
    const cleanups = [];
    const teardown = () => {
      for (const fn of cleanups.splice(0)) {
        try {
          fn();
        } catch {
          /* a failing cleanup must not block the others */
        }
      }
    };
    // The try/catch must live inside this callback. An error that escapes it
    // leaves GSAP's internal context pointer set, and later tweens leak into it.
    try {
      run({ intro: first && !late, onCleanup: (fn) => cleanups.push(fn) });
    } catch (error) {
      console.warn('[motion] setup failed, showing static content instead.', error);
      teardown();
      ctx.revert();
    }
    first = false;
    return teardown;
  };

  const { motion, reduce } = MOTION.query;
  const extra = options.when ? (MOTION.query[options.when] ?? options.when) : '';
  mm.add(extra ? `${motion} and ${extra}` : motion, guard(setup));
  if (options.reduced) mm.add(reduce, guard(options.reduced));

  if (gated) releaseGate();
  return () => mm.revert();
}
