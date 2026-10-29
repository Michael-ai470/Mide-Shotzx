// js/portfolio.js
// The portfolio: category filters (shareable as #portraits, #couples, …) and a full-screen
// viewer with keyboard, swipe and neighbour preloading. Not motion: it runs for everyone.
import './page.js';
import { getLenis } from '../motion-kit/core/smooth-scroll.js';
import { gsap, ScrollTrigger } from '../motion-kit/core/core.js';

const grid = document.querySelector('[data-grid]');
const tiles = Array.from(grid.querySelectorAll('.tile'));
const chips = Array.from(document.querySelectorAll('[data-filter]'));
const pad = (n) => String(n).padStart(2, '0');

// ─── Filters ───────────────────────────────────────────────────
function applyFilter(cat, push) {
  const known = chips.some((c) => c.dataset.filter === cat);
  if (!known) cat = 'all';
  chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.filter === cat)));
  tiles.forEach((t) => {
    t.hidden = cat !== 'all' && t.dataset.cat !== cat;
    // Feature tiles only make sense in the full mix.
    t.classList.toggle('is-wide', cat === 'all' && t.hasAttribute('data-wide'));
    // Filtered tiles skip the entrance: they are wanted now.
    if (cat !== 'all' && !t.hidden) gsap?.set(t, { autoAlpha: 1, y: 0 });
  });
  if (push) history.replaceState(null, '', cat === 'all' ? location.pathname : `#${cat}`);
  ScrollTrigger?.refresh();
}
chips.forEach((chip) => chip.addEventListener('click', () => applyFilter(chip.dataset.filter, true)));
applyFilter(location.hash.slice(1), false);

// ─── Viewer ────────────────────────────────────────────────────
const dialog = document.getElementById('viewer');
const img = dialog.querySelector('[data-viewer-img]');
const caption = dialog.querySelector('[data-viewer-caption]');
const index = dialog.querySelector('[data-viewer-index]');
const total = dialog.querySelector('[data-viewer-total]');
let set = [];
let at = 0;

const visible = () => tiles.filter((t) => !t.hidden).map((t) => t.querySelector('.tile-btn'));
const preload = (btn) => btn && (new Image().src = btn.dataset.full);

function show(i) {
  at = (i + set.length) % set.length;
  const btn = set[at];
  const thumb = btn.querySelector('img');
  dialog.classList.add('is-loading');
  img.style.backgroundImage = `url("${thumb.currentSrc || thumb.src}")`;
  img.width = Number(thumb.getAttribute('width'));
  img.height = Number(thumb.getAttribute('height'));
  img.alt = thumb.alt;
  img.src = btn.dataset.full;
  caption.textContent = `${btn.dataset.cat} — ${thumb.alt}`;
  index.textContent = pad(at + 1);
  total.textContent = pad(set.length);
  preload(set[(at + 1) % set.length]);
  preload(set[(at - 1 + set.length) % set.length]);
}
img.addEventListener('load', () => dialog.classList.remove('is-loading'));

function open(btn) {
  set = visible();
  getLenis()?.stop();
  dialog.showModal();
  show(set.indexOf(btn));
}
dialog.addEventListener('close', () => {
  getLenis()?.start();
  set[at]?.focus({ preventScroll: true });
});

grid.addEventListener('click', (e) => {
  const btn = e.target.closest('.tile-btn');
  if (btn) open(btn);
});
dialog.querySelector('[data-viewer-close]').addEventListener('click', () => dialog.close());
dialog.querySelector('[data-viewer-prev]').addEventListener('click', () => show(at - 1));
dialog.querySelector('[data-viewer-next]').addEventListener('click', () => show(at + 1));
dialog.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') show(at + 1);
  if (e.key === 'ArrowLeft') show(at - 1);
});
dialog.addEventListener('click', (e) => {
  if (e.target === dialog || e.target.classList.contains('viewer-stage')) dialog.close();
});

// Swipe on touch screens.
let x0 = null;
dialog.addEventListener('pointerdown', (e) => (x0 = e.pointerType === 'mouse' ? null : e.clientX));
dialog.addEventListener('pointerup', (e) => {
  if (x0 === null) return;
  const dx = e.clientX - x0;
  if (Math.abs(dx) > 50) show(dx < 0 ? at + 1 : at - 1);
  x0 = null;
});
