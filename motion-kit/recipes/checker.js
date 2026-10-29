// recipes/checker.js (Web Motion Kit)
// "Your next move": a faint chessboard behind the call to action (El&Rock, the rook). The
// tiles are made here, so with scripts off there is no board. When the section comes into
// view they turn over in a diagonal wave from the top-left corner, like a board being set.
// checkerLight (hover screens): the tile under the cursor lights and fades as it leaves.
//
// Markup: [data-board] inside the section, aria-hidden. Tile colours are CSS classes
// (.is-dark, .is-lit); the recipe only moves the tiles' transform and opacity.

import { gsap, ScrollTrigger } from '../core/core.js';

const SIZE = 88; // px per tile, roughly

/**
 * @param {Element} scope  the section
 * @param {import('../core/core.js').MotionEnv} env
 */
export function checker(scope, env) {
  const board = /** @type {HTMLElement | null} */ (scope.querySelector('[data-board]'));
  if (!board) return;
  const cols = Math.max(6, Math.round(scope.clientWidth / SIZE));
  const rows = Math.max(4, Math.round(scope.clientHeight / SIZE));
  board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  board.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  const frag = document.createDocumentFragment();
  const tiles = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tile = document.createElement('span');
      tile.className = (r + c) % 2 ? 'er-tile' : 'er-tile is-dark';
      frag.appendChild(tile);
      tiles.push(tile);
    }
  }
  board.appendChild(frag);
  board.dataset.cols = String(cols);
  board.dataset.rows = String(rows);
  env.onCleanup(() => {
    board.replaceChildren();
    board.style.removeProperty('grid-template-columns');
    board.style.removeProperty('grid-template-rows');
  });

  gsap.set(tiles, { autoAlpha: 0, rotationY: -90, transformPerspective: 600, lazy: false });
  ScrollTrigger.create({
    trigger: scope,
    start: 'top 70%',
    once: true,
    onEnter: () =>
      gsap.to(tiles, {
        autoAlpha: 1,
        rotationY: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: { grid: [rows, cols], from: 'start', axis: null, amount: 1.3 },
      }),
  });
}

/**
 * Run with { when: 'hover' }, after checker() has built the board.
 * @param {Element} scope
 * @param {import('../core/core.js').MotionEnv} env
 */
export function checkerLight(scope, env) {
  const board = /** @type {HTMLElement | null} */ (scope.querySelector('[data-board]'));
  if (!board) return;
  let lit = null;
  const move = (e) => {
    const cols = Number(board.dataset.cols);
    const rows = Number(board.dataset.rows);
    if (!cols || !rows) return;
    const box = board.getBoundingClientRect();
    const c = Math.floor(((e.clientX - box.left) / box.width) * cols);
    const r = Math.floor(((e.clientY - box.top) / box.height) * rows);
    const tile = board.children[r * cols + c] || null;
    if (tile === lit) return;
    lit?.classList.remove('is-lit');
    tile?.classList.add('is-lit');
    lit = tile;
  };
  const leave = () => {
    lit?.classList.remove('is-lit');
    lit = null;
  };
  scope.addEventListener('pointermove', move);
  scope.addEventListener('pointerleave', leave);
  env.onCleanup(() => {
    scope.removeEventListener('pointermove', move);
    scope.removeEventListener('pointerleave', leave);
    leave();
  });
}
