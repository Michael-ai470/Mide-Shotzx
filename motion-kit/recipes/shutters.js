// recipes/shutters.js (Web Motion Kit)
// A photo that opens like window shutters: horizontal slats, each showing its band of the
// photo, swing down from closed one after another as the photo scrolls into view.
// Scrubbed, so they close again on the way back up.
//
// Markup hooks: [data-shutters] a figure holding one <img>. The recipe lays the slats over
// it (aria-hidden copies of the same picture, so it is fetched once) and hides the original
// while they are there; the original <img> keeps the alt text. Without the recipe the
// photo is simply there.

import { gsap } from '../core/core.js';

/**
 * @param {Element} scope  a container with one or more [data-shutters] figures
 * @param {import('../core/core.js').MotionEnv} env
 * @param {{ slats?: number }} [options]  slats: how many. Default 7.
 */
export function shutters(scope, env, options = {}) {
  const count = options.slats ?? 7;
  const figures = [...(scope.matches?.('[data-shutters]') ? [scope] : []), ...scope.querySelectorAll('[data-shutters]')];
  figures.forEach((figure) => {
    const img = figure.querySelector('img');
    if (!img) return;
    let alive = true;
    let tween = null;
    let wrap = null;

    const build = () => {
      if (!alive || wrap) return;
      wrap = document.createElement('div');
      wrap.className = 'shutter-slats';
      wrap.setAttribute('aria-hidden', 'true');
      const slats = [];
      for (let i = 0; i < count; i++) {
        const slat = document.createElement('div');
        slat.className = 'shutter-slat';
        const copy = document.createElement('img');
        copy.src = img.currentSrc || img.src;
        copy.alt = '';
        copy.style.top = `${-i * 100}%`;
        copy.style.height = `${count * 100}%`;
        slat.appendChild(copy);
        wrap.appendChild(slat);
        slats.push(slat);
      }
      figure.appendChild(wrap);
      figure.classList.add('is-shutters');
      // Created after the image loads, so outside the motion context: cleaned up below.
      tween = gsap.fromTo(
        slats,
        { rotationX: -92 },
        {
          rotationX: 0,
          ease: 'none',
          stagger: 0.14,
          scrollTrigger: { trigger: figure, start: 'top 88%', end: 'center 60%', scrub: 0.7 },
        },
      );
    };

    if (img.complete && img.naturalWidth) build();
    else img.addEventListener('load', build, { once: true });

    env.onCleanup(() => {
      alive = false;
      img.removeEventListener('load', build);
      tween?.scrollTrigger?.kill();
      tween?.revert();
      wrap?.remove();
      figure.classList.remove('is-shutters');
    });
  });
}
