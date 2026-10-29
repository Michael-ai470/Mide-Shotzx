// recipes/diptych.js (Web Motion Kit)
// Two full-screen panels and a diagonal wipe. The section pins; the first panel fills the
// screen, then as you scroll a diagonal edge with a gold rim sweeps across and brings the
// second panel in over it. The first panel's picture pushes in and its copy slides away;
// the second's picture settles and its copy and tags arrive. Links elsewhere on the page to
// either panel's id scroll to that half of the move.
//
// Markup hooks:
//   [data-diptych]            the track. The recipe makes it taller while it runs.
//   [data-diptych-stage]      the full-screen stage (sticky).
//   [data-diptych-panel]      the two panels, in order. CSS clips the second one along a
//                             diagonal set by --wipe-top on the track, which is all that moves.
//   [data-diptych-photo]      inside each panel: the picture. Only its transform moves.
//   [data-diptych-copy]       inside each panel: the copy. Only its x and opacity move.
//   [data-diptych-edge]       the gold rim layer between the panels (clipped from --wipe-top too).
//   [data-diptych-count] b    the "01" in the "01 / 02" counter.
// Wide screens only (run it with a `when` query). Without it the panels are two cards.

import { gsap } from '../core/core.js';
import { getLenis } from '../core/smooth-scroll.js';

/**
 * @param {Element} scope  the [data-diptych] track
 * @param {import('../core/core.js').MotionEnv} env
 * @param {{ length?: number }} [options]  length: extra scroll in svh. Default 170.
 */
export function diptych(scope, env, options = {}) {
  const track = /** @type {HTMLElement} */ (scope);
  const stage = track.querySelector('[data-diptych-stage]');
  const panels = Array.from(track.querySelectorAll('[data-diptych-panel]'));
  if (!stage || panels.length !== 2) return;
  const [first, second] = panels;
  const photo = (panel) => panel.querySelector('[data-diptych-photo]');
  const copy = (panel) => panel.querySelector('[data-diptych-copy]');
  const count = track.querySelector('[data-diptych-count] b');
  const tags = Array.from(second.querySelectorAll('.hl-service-tag'));
  const length = options.length ?? 170;

  track.classList.add('is-diptych');
  track.style.height = `calc(100svh + ${length}svh)`;
  env.onCleanup(() => {
    track.classList.remove('is-diptych');
    track.style.height = '';
    track.style.removeProperty('--wipe-top');
    if (count) count.textContent = '01';
  });

  const timeline = gsap.timeline({
    defaults: { ease: 'none' },
    onUpdate() {
      if (count) count.textContent = this.progress() > 0.42 ? '02' : '01';
    },
    scrollTrigger: { trigger: track, start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true },
  });
  timeline.to({}, { duration: 1 }, 0);
  const sweep = { duration: 0.5, ease: 'power1.inOut' };
  // One number drives the diagonal edge of the second panel and of the gold rim (CSS
  // builds both polygons from --wipe-top), so the two always move together.
  timeline.fromTo(track, { '--wipe-top': '125%' }, { '--wipe-top': '-25%', ...sweep }, 0.18);
  if (photo(first)) timeline.to(photo(first), { scale: 1.14, xPercent: -5, duration: 0.5 }, 0.18);
  if (copy(first)) timeline.to(copy(first), { xPercent: -14, autoAlpha: 0, duration: 0.28, ease: 'power2.in' }, 0.18);
  if (photo(second)) timeline.fromTo(photo(second), { scale: 1.22, xPercent: 6 }, { scale: 1, xPercent: 0, duration: 0.6 }, 0.18);
  if (copy(second)) timeline.fromTo(copy(second), { xPercent: 12, autoAlpha: 0 }, { xPercent: 0, autoAlpha: 1, duration: 0.24, ease: 'power2.out' }, 0.56);
  if (tags.length) timeline.fromTo(tags, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.12, stagger: 0.03, ease: 'power2.out' }, 0.7);

  // Links to either panel scroll to its half of the move.
  const jump = (t) => {
    const st = timeline.scrollTrigger;
    if (!st) return;
    const y = st.start + (st.end - st.start) * t;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(y, { duration: 1.2 });
    else window.scrollTo({ top: y, behavior: 'smooth' });
  };
  const offs = [];
  [[first, 0.05], [second, 0.92]].forEach(([panel, t]) => {
    if (!panel.id) return;
    document.querySelectorAll(`a[href="#${CSS.escape(panel.id)}"]`).forEach((a) => {
      const onClick = (event) => {
        event.preventDefault();
        event.stopPropagation(); // Lenis's own anchor handler would land on the stacked panel
        jump(t);
      };
      a.addEventListener('click', onClick);
      offs.push(() => a.removeEventListener('click', onClick));
    });
  });
  env.onCleanup(() => offs.forEach((off) => off()));
}
