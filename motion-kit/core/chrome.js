// core/chrome.js (Web Motion Kit)
// Page furniture shared by the homepage and the inner pages that use a full-screen hero.
// Not motion, so it runs with reduced motion too.

/**
 * Navbar over a full-screen hero: transparent while the hero is under it
 * (css/nav-overlay.css, with .has-overlay-nav on <body>), the glass bar once the hero has
 * scrolled past. Adds .is-solid to #navbar at that point.
 * @param {Element | null} hero
 */
export function overlayNav(hero) {
  const navbar = document.getElementById('navbar');
  if (!navbar || !hero) return;
  let solid = null;
  let queued = false;
  const update = () => {
    queued = false;
    const next = hero.getBoundingClientRect().bottom <= navbar.offsetHeight;
    if (next !== solid) navbar.classList.toggle('is-solid', (solid = next));
  };
  const schedule = () => {
    if (!queued) requestAnimationFrame(update);
    queued = true;
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  update();
}

/**
 * The preloader from components.js covers the page until main.js lifts it.
 * Resolves when it starts to fade, or at once if there is none.
 * @returns {Promise<void>}
 */
export const preloaderLifted = () =>
  new Promise((resolve) => {
    const preloader = document.getElementById('preloader');
    if (!preloader || preloader.classList.contains('loaded')) return resolve();
    const observer = new MutationObserver(() => {
      if (!preloader.classList.contains('loaded')) return;
      observer.disconnect();
      resolve();
    });
    observer.observe(preloader, { attributes: true, attributeFilter: ['class'] });
  });
