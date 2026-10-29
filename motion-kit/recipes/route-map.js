// recipes/route-map.js (Web Motion Kit)
// A dotted world map that comes alive once (Paragon's self-drawing line, Velmax's dot
// field). The dots sweep in from the west, the two offices light up, routes draw out
// to the partner cities one after another, and each city pin lands as its route
// arrives. After that a soft light keeps travelling along the routes while the map
// is on screen.
//
// Markup hooks:
//   [data-map]         the wrapper.
//   [data-map-dots]    the dot layer (an <img> of the dotted map).
//   [data-map-route]   each route, an SVG path, in drawing order.
//   [data-map-pin]     each pin group. Offices carry .is-hq and land first.
//
// Without scripts or with reduced motion the map is drawn complete and still.

import { gsap, ScrollTrigger, MOTION } from '../core/core.js';

/**
 * @param {Element} scope  the [data-map] wrapper
 * @param {import('../core/core.js').MotionEnv} env
 */
export function routeMap(scope, env) {
  const wrap = /** @type {HTMLElement} */ (scope);
  const dots = wrap.querySelector('[data-map-dots]');
  const routes = Array.from(wrap.querySelectorAll('[data-map-route]'));
  const pins = Array.from(wrap.querySelectorAll('[data-map-pin]'));
  if (!dots || !routes.length) return;
  const hq = pins.filter((p) => p.classList.contains('is-hq'));
  const others = pins.filter((p) => !p.classList.contains('is-hq'));

  // Comets: a short bright dash that runs along a copy of each route.
  const comets = routes.map((r) => {
    const c = /** @type {SVGPathElement} */ (r.cloneNode());
    c.removeAttribute('data-map-route');
    c.setAttribute('class', 'route-comet');
    c.setAttribute('aria-hidden', 'true');
    r.after(c);
    return c;
  });
  env.onCleanup(() => comets.forEach((c) => c.remove()));
  const lens = routes.map((r) => r.getTotalLength());
  // Where each pin sits, read before GSAP takes over the transform attribute.
  const at = new Map(
    pins.map((p) => {
      const m = p.getAttribute('transform')?.match(/translate\(([-\d.]+)[ ,]+([-\d.]+)\)/);
      return [p, m ? { x: +m[1], y: +m[2] } : null];
    }),
  );

  gsap.set(dots, { clipPath: 'inset(0% 100% 0% 0%)' });
  routes.forEach((r, i) => gsap.set(r, { strokeDasharray: lens[i], strokeDashoffset: lens[i] }));
  comets.forEach((c, i) => gsap.set(c, { strokeDasharray: `14 ${lens[i]}`, strokeDashoffset: 14, autoAlpha: 0 }));
  // Pins grow from their own centre (svgOrigin is in the map's coordinates).
  pins.forEach((p) => {
    const pos = at.get(p);
    gsap.set(p, { scale: 0, svgOrigin: pos ? `${pos.x} ${pos.y}` : '0 0' });
  });
  const labels = pins.map((p) => p.querySelector('text')).filter(Boolean);
  gsap.set(labels, { autoAlpha: 0 });

  const tl = gsap.timeline({ paused: true });
  tl.to(dots, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.8, ease: MOTION.ease.inOut }, 0)
    .to(hq, { scale: 1, duration: 0.9, ease: 'back.out(2.2)', stagger: 0.15 }, 0.7)
    .to(hq.map((p) => p.querySelector('text')).filter(Boolean), { autoAlpha: 1, duration: 0.6 }, 0.9);
  // Each route draws, and the pin at its far end lands as it arrives.
  const landed = new Set(hq);
  routes.forEach((r, i) => {
    const t0 = 1.2 + i * 0.22;
    tl.to(r, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' }, t0);
    const end = r.getPointAtLength(lens[i]);
    const pin = others.find((p) => {
      const pos = at.get(p);
      return !landed.has(p) && pos && Math.hypot(pos.x - end.x, pos.y - end.y) < 4;
    });
    if (pin) {
      landed.add(pin);
      tl.to(pin, { scale: 1, duration: 0.8, ease: 'back.out(2.4)' }, t0 + 0.9);
      const t = pin.querySelector('text');
      if (t) tl.to(t, { autoAlpha: 1, duration: 0.5 }, t0 + 1);
    }
  });
  // Anything not reached by a route still lands.
  const rest = others.filter((p) => !landed.has(p));
  if (rest.length) tl.to(rest, { scale: 1, duration: 0.8, ease: 'back.out(2.4)', stagger: 0.1 }, 1.6);
  rest.forEach((p) => {
    const t = p.querySelector('text');
    if (t) tl.to(t, { autoAlpha: 1, duration: 0.5 }, 1.8);
  });

  // The travelling lights, only while the map is on screen.
  const loop = gsap.timeline({ paused: true, repeat: -1 });
  comets.forEach((c, i) => {
    loop.fromTo(
      c,
      { strokeDashoffset: 14, autoAlpha: 1 },
      { strokeDashoffset: -lens[i], duration: Math.max(1.6, lens[i] / 260), ease: 'none' },
      i * 0.7,
    );
    loop.set(c, { autoAlpha: 0 });
  });
  tl.call(() => {
    if (ScrollTrigger.isInViewport(wrap)) loop.play();
  });

  ScrollTrigger.create({
    trigger: wrap,
    start: 'top 75%',
    once: true,
    onEnter: () => tl.play(),
  });
  ScrollTrigger.create({
    trigger: wrap,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => {
      if (tl.progress() < 1) return;
      if (self.isActive) loop.play();
      else loop.pause();
    },
  });
}
