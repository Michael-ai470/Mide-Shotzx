// recipes/card-deck.js (Web Motion Kit)
// A fanned deck of cards that opens one card at a time while the section is pinned.
// The cards start as tall strips fanned out from a common point below them. Each scroll
// step lifts the top card upright, opens it from a strip to its full width and brings its
// text in; then it flies off and the deck turns to put the next card on top. A side index
// tracks the open card and jumps to any card when clicked, and so do links elsewhere on the
// page that point at a card's id (the hero pills).
//
// Markup hooks:
//   [data-deck]         the track. The recipe makes it taller while it runs.
//   [data-deck-pin]     what stays on screen (the index and the stack). Sticky.
//   [data-deck-card]    each card, first one on top. Only its transform and opacity move.
//   [data-deck-face]    inside each card: the visible face. Only its clip-path moves.
//   [data-deck-copy]    inside each face: the text. Only its opacity and y move.
//   [data-deck-go="i"]  index links; [data-deck-bar] the index progress line.
//
// Wide screens only (run it with a `when` query): phones get the CSS swipe row, and with
// reduced motion or scripts off the cards are a plain grid.

import { gsap } from '../core/core.js';
import { getLenis } from '../core/smooth-scroll.js';

const CLOSED = 'inset(0% 41% 0% 41% round 14px)';
const OPEN = 'inset(0% 0% 0% 0% round 14px)';

/**
 * @param {Element} scope  the [data-deck] track
 * @param {import('../core/core.js').MotionEnv} env
 * @param {{ step?: number, angle?: number }} [options]
 *   step: scroll per card, in svh. Default 70. angle: fan angle between cards. Default 5.
 */
export function cardDeck(scope, env, options = {}) {
  const track = /** @type {HTMLElement} */ (scope);
  const pin = track.querySelector('[data-deck-pin]');
  const cards = Array.from(track.querySelectorAll('[data-deck-card]'));
  if (!pin || cards.length < 2) return;
  const faces = cards.map((card) => card.querySelector('[data-deck-face]'));
  const copies = cards.map((card) => card.querySelector('[data-deck-copy]'));
  const goLinks = Array.from(track.querySelectorAll('[data-deck-go]'));
  const items = goLinks.map((a) => a.closest('li'));
  const bar = track.querySelector('[data-deck-bar]');
  const n = cards.length;
  const step = options.step ?? 70;
  const angle = options.angle ?? 5;

  // 1. Running layout. CSS keys off .is-deck; the height lives in an inline style.
  track.classList.add('is-deck');
  const measure = () => {
    track.style.setProperty('--deck-pin-h', `${pin.offsetHeight}px`);
    track.style.height = `calc(${pin.offsetHeight}px + ${n * step}svh)`;
  };
  measure();
  // The core re-measures every trigger when the page height changes, so this only resizes.
  const observer = new ResizeObserver(measure);
  observer.observe(pin);
  cards.forEach((card, i) => (card.style.zIndex = String(n - i)));
  env.onCleanup(() => {
    observer.disconnect();
    track.classList.remove('is-deck');
    track.style.height = '';
    track.style.removeProperty('--deck-pin-h');
    cards.forEach((card) => {
      card.style.zIndex = '';
      card.inert = false;
    });
    items.forEach((li) => li?.classList.remove('is-active'));
  });

  // 2. The fan: card j sits `j` steps round from the top, a little smaller.
  const fan = (k) => ({ rotation: k * angle, scale: 1 - k * 0.035 });
  cards.forEach((card, j) => gsap.set(card, { ...fan(j), transformOrigin: '50% 135%' }));
  gsap.set(faces, { clipPath: CLOSED });
  gsap.set(copies, { autoAlpha: 0, y: 28 });

  // 3. One scrubbed timeline, one unit per card. Card i opens at i, leaves at i + 0.72.
  let active = -1;
  const setActive = (i) => {
    if (i === active) return;
    active = i;
    items.forEach((li, k) => li?.classList.toggle('is-active', k === i));
    cards.forEach((card, k) => (card.inert = k !== i));
  };
  const stickyTop = () => parseFloat(getComputedStyle(pin).top) || 0;
  const timeline = gsap.timeline({
    defaults: { ease: 'none' },
    onUpdate() {
      setActive(Math.min(n - 1, Math.floor(this.time() + 0.15)));
    },
    scrollTrigger: {
      trigger: track,
      start: () => `top ${stickyTop()}px`,
      end: () => `bottom ${stickyTop() + pin.offsetHeight}px`,
      scrub: 0.6,
      invalidateOnRefresh: true,
    },
  });
  timeline.to({}, { duration: n }, 0);
  if (bar) timeline.fromTo(bar, { scaleY: 0 }, { scaleY: 1, duration: n, immediateRender: false }, 0);
  for (let i = 0; i < n; i++) {
    if (faces[i]) timeline.to(faces[i], { clipPath: OPEN, duration: 0.42, ease: 'power2.inOut' }, i);
    if (copies[i]) timeline.to(copies[i], { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out' }, i + 0.24);
    if (i === n - 1) break;
    // Card i flies off up and to the left...
    timeline.to(cards[i], { yPercent: -118, xPercent: -6, rotation: -9, autoAlpha: 0, duration: 0.28, ease: 'power2.in' }, i + 0.72);
    // ...and the deck turns one step, bringing card i + 1 upright on top.
    for (let j = i + 1; j < n; j++) {
      timeline.fromTo(cards[j], fan(j - i), { ...fan(j - i - 1), duration: 0.28, ease: 'power2.inOut', immediateRender: false }, i + 0.72);
    }
  }
  setActive(0);

  // 4. Jumping to a card: the index, and any link on the page to a card's id.
  const jump = (i) => {
    const st = timeline.scrollTrigger;
    if (!st) return;
    const t = Math.min(n - 0.4, i + 0.5);
    const y = st.start + (st.end - st.start) * (t / timeline.duration());
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(y, { duration: 1.2 });
    else window.scrollTo({ top: y, behavior: 'smooth' });
  };
  const targets = [];
  goLinks.forEach((a) => targets.push([a, Number(a.dataset.deckGo)]));
  cards.forEach((card, i) => {
    if (!card.id) return;
    document.querySelectorAll(`a[href="#${CSS.escape(card.id)}"]`).forEach((a) => {
      if (!a.hasAttribute('data-deck-go')) targets.push([a, i]);
    });
  });
  const handlers = targets.map(([a, i]) => {
    const onClick = (event) => {
      event.preventDefault();
      event.stopPropagation(); // Lenis's own anchor handler would scroll to the stacked card
      jump(i);
    };
    a.addEventListener('click', onClick);
    return () => a.removeEventListener('click', onClick);
  });
  env.onCleanup(() => handlers.forEach((off) => off()));
}

