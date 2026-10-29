// js/site.js
// What every page shares: the navbar, the mobile menu, smooth scrolling and the quiet
// reveals. Page modules run their hero intro first, then call initSite() (the hero's
// createMotion must come before any scope that contains it; motion-kit/README.md).

import { createMotion, gsap, ScrollTrigger, getSplitText } from '../motion-kit/core/core.js';
import { startSmoothScroll, getLenis } from '../motion-kit/core/smooth-scroll.js';
import { textReveal, batchReveal, wordLight, rollNumbers } from '../motion-kit/recipes/text.js';
import { magnetic } from '../motion-kit/recipes/magnetic.js';
import { ticker } from '../motion-kit/recipes/ticker.js';

/** Solid bar once the page moves; slides away while reading down, back on the way up. */
function navbar() {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  let last = window.scrollY;
  let queued = false;
  const update = () => {
    queued = false;
    const y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 24);
    const open = document.body.classList.contains('menu-open');
    if (Math.abs(y - last) > 6) {
      nav.classList.toggle('is-hidden', !open && y > last && y > 480);
      last = y;
    }
  };
  window.addEventListener('scroll', () => {
    if (!queued) requestAnimationFrame(update);
    queued = true;
  }, { passive: true });
  // Keyboard users must always reach the bar.
  nav.addEventListener('focusin', () => nav.classList.remove('is-hidden'));
  update();
}

/** Full-screen menu on narrow screens. Not motion, so it runs for everyone. */
function menu() {
  const button = document.querySelector('[data-menu-toggle]');
  const panel = document.getElementById('menu');
  if (!button || !panel) return;
  panel.inert = true;
  const set = (open) => {
    button.setAttribute('aria-expanded', String(open));
    button.querySelector('[data-menu-label]').textContent = open ? 'Close' : 'Menu';
    document.body.classList.toggle('menu-open', open);
    panel.inert = !open;
    const lenis = getLenis();
    if (open) {
      lenis?.stop();
      document.documentElement.style.overflow = 'hidden';
      panel.querySelector('a')?.focus({ preventScroll: true });
    } else {
      lenis?.start();
      document.documentElement.style.overflow = '';
    }
  };
  button.addEventListener('click', () => set(button.getAttribute('aria-expanded') !== 'true'));
  panel.addEventListener('click', (e) => e.target.closest('a') && set(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
      set(false);
      button.focus();
    }
  });
  window.matchMedia('(min-width: 960px)').addEventListener('change', (e) => e.matches && set(false));
}

/** Back to top, through Lenis when it runs. */
function toTop() {
  document.querySelectorAll('[data-to-top]').forEach((link) =>
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const lenis = getLenis();
      lenis ? lenis.scrollTo(0, { duration: 1.6 }) : window.scrollTo({ top: 0, behavior: 'smooth' });
    }),
  );
}

/**
 * The footer wordmark types itself out, letter by letter, the first time it is seen, with a
 * caret that follows the last letter, blinks a few times and goes. Letters keep their space
 * while hidden, so nothing reflows.
 */
function typeMark(scope, env) {
  const mark = scope.querySelector('[data-type-mark]');
  const SplitText = getSplitText();
  if (!mark || !SplitText) return;
  const split = SplitText.create(mark, { type: 'chars' });
  const chars = split.chars;
  const caret = document.createElement('span');
  caret.className = 'type-caret';
  mark.appendChild(caret);
  gsap.set(chars, { autoAlpha: 0 });
  const place = (char) => {
    caret.style.left = `${char.offsetLeft + char.offsetWidth}px`;
    caret.style.top = `${char.offsetTop}px`;
    caret.style.height = `${char.offsetHeight}px`;
  };
  place(chars[0]);
  caret.style.left = `${chars[0].offsetLeft}px`;
  const tl = gsap.timeline({ paused: true, onComplete: () => caret.classList.add('is-done') });
  chars.forEach((char, i) => {
    // A slightly uneven rhythm reads as typing rather than a metronome.
    const at = 0.25 + i * 0.16 + (i % 3 === 1 ? 0.04 : 0) + (i >= 4 ? 0.12 : 0); // a beat at the space
    tl.set(char, { autoAlpha: 1, onComplete: () => place(char) }, at);
  });
  ScrollTrigger.create({ trigger: mark, start: 'top 88%', once: true, onEnter: () => tl.play() });
  env.onCleanup(() => {
    tl.kill();
    caret.remove();
    split.revert();
  });
}

export function initSite() {
  navbar();
  menu();
  toTop();
  document.querySelectorAll('[data-year]').forEach((el) => (el.textContent = String(new Date().getFullYear())));

  startSmoothScroll({ anchors: { offset: -96 } });

  // Every section heading rises line by line unless it runs its own motion.
  const main = document.querySelector('main');
  const footer = document.querySelector('.footer');
  [main, footer].forEach((scope) =>
    scope?.querySelectorAll('h2:not([data-own-motion])').forEach((h) => h.setAttribute('data-reveal-text', '')),
  );
  createMotion(main, (env) => {
    textReveal(main, env);
    batchReveal(main);
    wordLight(main, env);
    rollNumbers(main, env);
  });
  createMotion(footer, (env) => {
    textReveal(footer, env);
    batchReveal(footer);
    typeMark(footer, env);
  });

  document.querySelectorAll('[data-marquee]').forEach((el) => createMotion(el, (env) => ticker(el, env, 46)));
  createMotion(document.body, (env) => magnetic(document.body, env, 0.22), { when: 'hover' });
}
