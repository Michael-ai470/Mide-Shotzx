// recipes/strips.js (Web Motion Kit)
// Expanding strips: a row of tall panels, one open at a time. The open strip is wide and
// shows its photo and copy; the others show their names upright. Which one is open follows
// the scroll while the row crosses the screen, follows the pointer while it is over the
// row, and a click (or focus) opens a strip; a click on the open strip follows its link.
// Links elsewhere on the page to a strip's id scroll to it and open it.
// Nothing is pinned and GSAP animates nothing here: the recipe moves the .is-open class and
// CSS eases the widths and the copy (css/op.css, .is-strips).
//
// Markup hooks: [data-strips] the row, [data-strip] each strip (a link). Wide screens only;
// run it with a `when` query. Without it the strips are a plain grid of cards.

import { ScrollTrigger } from '../core/core.js';
import { getLenis } from '../core/smooth-scroll.js';

/** @param {Element} scope  the [data-strips] row  @param {import('../core/core.js').MotionEnv} env */
export function strips(scope, env) {
  const row = /** @type {HTMLElement} */ (scope);
  const items = Array.from(row.querySelectorAll('[data-strip]'));
  const n = items.length;
  if (n < 2) return;
  row.classList.add('is-strips');

  let open = -1;
  let hovering = false;
  const set = (i) => {
    if (i === open) return;
    open = i;
    items.forEach((item, k) => item.classList.toggle('is-open', k === i));
  };
  set(0);

  const st = ScrollTrigger.create({
    trigger: row,
    start: 'top 70%',
    end: 'bottom 35%',
    onUpdate: (self) => {
      if (!hovering) set(Math.min(n - 1, Math.floor(self.progress * n)));
    },
  });

  const offs = [];
  const on = (el, type, fn, opts) => {
    el.addEventListener(type, fn, opts);
    offs.push(() => el.removeEventListener(type, fn, opts));
  };
  items.forEach((item, k) => {
    on(item, 'mouseenter', () => {
      hovering = true;
      set(k);
    });
    on(item, 'focus', () => set(k));
    on(item, 'click', (event) => {
      if (k !== open) {
        event.preventDefault();
        set(k);
      }
    });
  });
  on(row, 'mouseleave', () => {
    hovering = false;
  });

  // Links to a strip: scroll to where the scroll would open it, and open it now.
  items.forEach((item, k) => {
    if (!item.id) return;
    document.querySelectorAll(`a[href="#${CSS.escape(item.id)}"]`).forEach((a) => {
      on(a, 'click', (event) => {
        event.preventDefault();
        event.stopPropagation(); // Lenis's own anchor handler would scroll to the strip's top
        const y = st.start + (st.end - st.start) * ((k + 0.5) / n);
        const lenis = getLenis();
        if (lenis) lenis.scrollTo(y, { duration: 1.2 });
        else window.scrollTo({ top: y, behavior: 'smooth' });
        set(k);
      });
    });
  });

  env.onCleanup(() => {
    offs.forEach((off) => off());
    row.classList.remove('is-strips');
    items.forEach((item) => item.classList.remove('is-open'));
  });
}
