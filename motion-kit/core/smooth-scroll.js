// core/smooth-scroll.js (Web Motion Kit)
// One Lenis instance for the page, driven by GSAP's ticker.
// Plain-JS port of docs/web-motion-engine.md 5.4. Lenis is js/vendor/lenis.min.js,
// a deferred classic script, and its stylesheet is js/vendor/lenis.css.
import { gsap, ScrollTrigger, MOTION, registerMotion } from './core.js';

let lenis = null;
let media = null;
let users = 0;

/** The live instance, or null (reduced motion, or not started). */
export const getLenis = () => lenis;

/** Starts smooth scrolling. Returns a stop function. Safe to call from several places. */
export function startSmoothScroll(options = {}) {
  if (!registerMotion() || !window.Lenis) return () => {};
  users += 1;

  if (!media) {
    media = gsap.matchMedia();
    // Only smooth when the user has not asked for reduced motion. matchMedia tears
    // this down and rebuilds it if that setting changes while the page is open.
    media.add(MOTION.query.motion, () => {
      const instance = new window.Lenis({ lerp: 0.1, smoothWheel: true, anchors: true, ...options, autoRaf: false });
      const onScroll = () => ScrollTrigger.update();
      // Keep a reference: the function added to the ticker is the one that must be removed.
      const raf = (time) => instance.raf(time * 1000);

      instance.on('scroll', onScroll);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
      lenis = instance;

      return () => {
        gsap.ticker.remove(raf);
        gsap.ticker.lagSmoothing(500, 33); // GSAP's default
        instance.off('scroll', onScroll);
        instance.destroy();
        if (lenis === instance) lenis = null;
      };
    });
  }

  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    users -= 1;
    if (users === 0 && media) {
      media.revert();
      media = null;
    }
  };
}
