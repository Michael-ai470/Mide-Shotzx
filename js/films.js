// js/films.js
// Film cards and the player. Each card shows a poster; a 6-second muted preview loop
// (about 150 KB) plays on hover, or while the card is in view on touch screens. The full
// film only downloads when someone presses play. Not motion: it runs for everyone, but
// previews stay off under reduced motion and data saver.

import { getLenis } from '../motion-kit/core/smooth-scroll.js';

const CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>';

let player = null;

function getPlayer() {
  if (player) return player;
  const dialog = document.createElement('dialog');
  dialog.className = 'viewer';
  dialog.setAttribute('aria-label', 'Film player');
  dialog.innerHTML = `
    <div class="viewer-bar"><p><b data-player-title></b> <span data-player-meta></span></p>
      <button class="icon-btn" type="button" data-player-close aria-label="Close player">${CLOSE}</button></div>
    <div class="viewer-stage"><video controls playsinline preload="metadata"></video></div>
    <p class="viewer-caption">Sound on. Press Esc to close.</p>`;
  document.body.appendChild(dialog);
  const video = dialog.querySelector('video');
  const close = () => dialog.close();
  dialog.querySelector('[data-player-close]').addEventListener('click', close);
  dialog.addEventListener('click', (e) => e.target === dialog && close());
  dialog.addEventListener('close', () => {
    video.pause();
    video.removeAttribute('src');
    video.load();
    getLenis()?.start();
  });
  player = { dialog, video };
  return player;
}

function play(card) {
  const { dialog, video } = getPlayer();
  dialog.querySelector('[data-player-title]').textContent = card.querySelector('.film-title')?.textContent || '';
  dialog.querySelector('[data-player-meta]').textContent = card.querySelector('.film-meta')?.textContent || '';
  video.poster = card.querySelector('img')?.currentSrc || '';
  // Never larger than a quarter past the film's own resolution: beyond that it only blurs.
  video.style.maxWidth = `min(100%, ${Math.round(Number(card.dataset.w) * 1.25)}px)`;
  video.src = card.dataset.full;
  getLenis()?.stop();
  dialog.showModal();
  video.play().catch(() => {});
}

export function filmCards(scope = document) {
  // Hero loops autoplay muted; people who asked for less motion get the still poster.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    scope.querySelectorAll('video[autoplay]').forEach((v) => {
      v.removeAttribute('autoplay');
      v.pause();
    });
  }
  const cards = Array.from(scope.querySelectorAll('[data-film]'));
  if (!cards.length) return;

  cards.forEach((card) => card.querySelector('.film-btn')?.addEventListener('click', () => play(card)));

  const quiet = window.matchMedia('(prefers-reduced-motion: reduce)').matches || navigator.connection?.saveData;
  if (quiet) return;

  const start = (card) => {
    const v = card.querySelector('video');
    if (!v) return;
    if (!v.getAttribute('src')) v.src = v.dataset.src;
    v.play().then(() => card.classList.add('is-playing')).catch(() => {});
  };
  const stop = (card) => {
    card.querySelector('video')?.pause();
    card.classList.remove('is-playing');
  };

  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    cards.forEach((card) => {
      card.addEventListener('pointerenter', () => start(card));
      card.addEventListener('pointerleave', () => stop(card));
      card.addEventListener('focusin', () => start(card));
      card.addEventListener('focusout', () => stop(card));
    });
  } else {
    const seen = new IntersectionObserver(
      (entries) => entries.forEach((e) => (e.isIntersecting ? start(e.target) : stop(e.target))),
      { threshold: 0.65 },
    );
    cards.forEach((card) => seen.observe(card));
  }
}
