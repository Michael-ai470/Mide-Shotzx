# Web Motion Kit

A plug-and-play library of 53 recipe files (78 exported functions: scroll effects, heroes, hover effects and a few interactive tools), built and tested on the El-Global Business website (October 2026) by Michael Ajibola. Plain JavaScript modules on top of GSAP and Lenis: no build step, no framework, drop the folder into any site.

**Read in this order:** this README (setup) → [CATALOG.md](CATALOG.md) (every effect, with copy-paste code) → [ENGINE.md](ENGINE.md) (the rules every recipe follows, and the React/Next.js adapter).

---

## For an AI assistant picking this up

You are integrating motion into a new project with this kit. Do this:

1. Read this README, then CATALOG.md. Read ENGINE.md sections 0–3 and 7 before writing any motion code; they are the rules (content visible without scripts, the gate, `createMotion`, no CSS transition on an animated element, one job per element, phones never pin, reduced motion shows everything).
2. Copy the kit into the project (below) and wire the `<head>` exactly as in **Setup**.
3. For each effect you use: copy its markup hooks and CSS from the catalog entry, then wire it in a page module with the snippet given. Every recipe is `fn(scope, env, options)` and returns early when its markup is missing.
4. Rename the El-Global class names in the reference CSS (`er-`, `te-`, `ab-`, `ct-`, `op-`, `hl-` prefixes) to the project's own, and swap colours for the project's tokens. The recipes key on `data-*` attributes, not classes, except where a catalog entry names a class.
5. Run the checks in **Testing** before reporting back.

To make a project always use the kit, add this line to its `CLAUDE.md` (or `AGENTS.md`):

```
For any animation or scroll work, use the Web Motion Kit in motion-kit/: read motion-kit/README.md, CATALOG.md and ENGINE.md first and follow them.
```

---

## What is in the folder

```
web-motion-kit/
  README.md            this file
  CATALOG.md           every effect: what it looks like, markup, CSS, wiring, options
  ENGINE.md            the rules (web-motion-engine 2.1) and the framework adapters
  core/
    core.js            tokens (MOTION), plugin registration, the gate, createMotion()
    smooth-scroll.js   startSmoothScroll(), getLenis()  (Lenis driven by GSAP's ticker)
    chrome.js          overlayNav(hero), preloaderLifted()  (navbar + loader helpers)
  recipes/             53 recipe modules (78 exported functions)
  css/
    motion-base.css    gate, Lenis, rolling numbers, overlay navbar  (always link it)
    reference/         the stylesheets holding each recipe's styles, verbatim from El-Global
                       (inline-*.css = a page's own <style> block)
  assets/
    world-dots.svg     the dotted world map routeMap draws on
  vendor/              gsap 3.15.0, ScrollTrigger, CustomEase, SplitText, lenis 1.3.26 (+ lenis.css)
  tools/
    stamp_versions.py  cache-busting: ?v=<fingerprint> on every .js/.css link and import
  examples/
    starter.html       a working page wired with the kit; copy it to start a project
    starter.js         its page module
```

---

## Setup (three steps)

### 1. Copy the kit into the project

Copy the whole `web-motion-kit` folder into the site's root and name it `motion-kit` (any name works; the paths below assume `motion-kit/`). Pages in subfolders use `../motion-kit/…`.

### 2. Add this to every page's `<head>`

```html
<!-- 1. Before anything else: mark scripts as on, and the motion gate (ENGINE.md 5.2). -->
<script>document.documentElement.classList.add('js');</script>
<script>
  (function (d, w) {
    d.classList.add('motion-pending');
    w.__motionFailsafe = setTimeout(function () {
      w.__motionShown = new WeakSet(document.querySelectorAll('[data-motion-hide]'));
      d.classList.remove('motion-pending');
    }, 2500);
  })(document.documentElement, window);
</script>

<!-- 2. Your stylesheet, then the kit's base, then any recipe styles you copied. -->
<link rel="stylesheet" href="css/site.css">
<link rel="stylesheet" href="motion-kit/css/motion-base.css">

<!-- 3. The libraries, deferred (they become globals the core reads). -->
<script defer src="motion-kit/vendor/gsap.min.js"></script>
<script defer src="motion-kit/vendor/ScrollTrigger.min.js"></script>
<script defer src="motion-kit/vendor/CustomEase.min.js"></script>
<script defer src="motion-kit/vendor/SplitText.min.js"></script>   <!-- only if a recipe needs it (catalog says) -->
<script defer src="motion-kit/vendor/lenis.min.js"></script>        <!-- only for smooth scrolling -->

<!-- 4. Your page module, last. Modules run after deferred scripts, in order. -->
<script type="module" src="js/page.js"></script>
```

Prefer a CDN to the vendored files? Swap step 3 for these (same versions, checked 16 October 2026):

```html
<script defer src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/CustomEase.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/SplitText.min.js"></script>
<script defer src="https://unpkg.com/lenis@1.3.26/dist/lenis.min.js"></script>
```

### 3. Write the page module

```js
// js/page.js
import { createMotion } from '../motion-kit/core/core.js';
import { startSmoothScroll } from '../motion-kit/core/smooth-scroll.js';
import { textReveal, batchReveal } from '../motion-kit/recipes/text.js';
import { magnetic } from '../motion-kit/recipes/magnetic.js';

startSmoothScroll({ anchors: { offset: -84 } });   // offset = your fixed navbar's height

const main = document.querySelector('main');
createMotion(main, (env) => {
  textReveal(main, env);   // every [data-reveal-text] heading rises line by line
  batchReveal(main);       // every [data-reveal] block fades up with its neighbours
});

const cta = document.querySelector('.cta');
createMotion(cta, (env) => magnetic(cta, env, 0.3), { when: 'hover' });  // pointer effects: hover screens only
```

That is the whole pattern. Every effect in the catalog is wired the same way: pick a scope element, call `createMotion(scope, (env) => recipe(scope, env, options), { when })`.

---

## The core in one screen

| Export | From | What it does |
|---|---|---|
| `createMotion(scope, setup, { when, reduced })` | core.js | The only way to start motion. Skips everything under reduced motion, reverts on error (content stays visible), cleans up on breakpoint change, opens the gate. `when`: `'desktop'` (≥1024px), `'hover'` (mouse), or any media query string. Returns a stop function. |
| `env.intro` | setup argument | `true` only on the first run and only if the gate's failsafe has not already shown the content. Intros check it. |
| `env.onCleanup(fn)` | setup argument | Register teardown for listeners, created elements, timers (GSAP tweens clean themselves). |
| `MOTION` | core.js | Tokens: eases `reveal` (`luxe`, cubic-bezier 0.16,1,0.3,1), `inOut` (`luxeInOut`), durations `micro .3 / base .9 / reveal 1.2 / hero 1.6`, staggers `.02 / .06 / .1`, queries. Tune feel here, in one place. |
| `gsap`, `ScrollTrigger`, `CustomEase`, `getSplitText()` | core.js | The libraries, read from the deferred globals. |
| `registerMotion()`, `releaseGate()` | core.js | Called for you by `createMotion`. |
| `startSmoothScroll(options)` / `getLenis()` | smooth-scroll.js | One Lenis instance on GSAP's ticker; off under reduced motion. `anchors: { offset }` makes `#links` clear a fixed navbar. |
| `overlayNav(hero)` | chrome.js | Transparent navbar over a full-screen hero, solid once past it. Needs `#navbar` and `body.has-overlay-nav`. Not motion: call it directly. |
| `preloaderLifted()` | chrome.js | A promise that resolves when `#preloader` gets `.loaded` (or at once if there is none). Hero intros take it as `{ ready: preloaderLifted() }` so they do not play behind a loader. |

**Load order rule (important):** a page module that animates hero text must run its `createMotion(hero, …)` **before** any other `createMotion` whose scope contains the hero (for example a site-wide one on `<main>`), because creating a scope that holds gated elements opens the gate. On El-Global the page module loads before the shared `site.js` for this reason.

---

## Sources and licences

| Library | Version here | Site and docs | Package / CDN | Licence |
|---|---|---|---|---|
| GSAP (core) | 3.15.0 | [gsap.com/docs/v3](https://gsap.com/docs/v3/) | [npm: gsap](https://www.npmjs.com/package/gsap) · [jsDelivr](https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js) | Free, commercial use included, since 3.13 ([GSAP Standard License](https://gsap.com/standard-license/)) |
| ScrollTrigger | 3.15.0 | [docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) | in the `gsap` package | same |
| CustomEase | 3.15.0 | [docs](https://gsap.com/docs/v3/Eases/CustomEase/) | in the `gsap` package | same |
| SplitText | 3.15.0 | [docs](https://gsap.com/docs/v3/Plugins/SplitText/) | in the `gsap` package | same (free since 3.13) |
| Lenis | 1.3.26 | [github.com/darkroomengineering/lenis](https://github.com/darkroomengineering/lenis) | [npm: lenis](https://www.npmjs.com/package/lenis) · [unpkg](https://unpkg.com/lenis@1.3.26/dist/lenis.min.js) · [lenis.css](https://unpkg.com/lenis@1.3.26/dist/lenis.css) | MIT |

The recipes themselves are original work for El-Global. Several are inspired by effects seen on award sites (noted in their headers: Lenval, Velmax, Paragon, Morpho, The Design Society); none copies their code.

**With npm instead of `<script>` tags** (Vite, Next.js, any bundler): `npm install gsap lenis`, then replace the first line of `core/core.js`:

```js
// was: export const { gsap, ScrollTrigger, CustomEase } = window;
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomEase } from 'gsap/CustomEase';
import { SplitText } from 'gsap/SplitText';
export { gsap, ScrollTrigger, CustomEase };
if (typeof window !== 'undefined') window.SplitText = SplitText;   // getSplitText() reads it
```

and in `core/smooth-scroll.js` use `import Lenis from 'lenis'` with `new Lenis(...)` in place of `new window.Lenis(...)`, plus `import 'lenis/dist/lenis.css'` once. React components call recipes through the `useMotion` hook in ENGINE.md 5.5.

---

## Testing (before you report back)

From ENGINE.md section 7, the checks that caught real bugs on El-Global:

- Console clean on load, a full scroll down and up, and a resize.
- Scripts disabled: every word visible. Reduced motion on (DevTools → Rendering): nothing moves, everything visible.
- GSAP blocked (DevTools → block `gsap.min.js`): gated text appears within about 2.5 s.
- 390 px wide with touch emulation: no sideways scroll, no pinning, no pointer effects.
- Laptop heights (1366×657, 1280×600): hero text clear of the navbar.
- Reload part-way down a page with a sticky or pinned section: it comes back in place (layouts that change page height must be CSS, not a class a script adds; see CATALOG "Lessons").
- No CSS `transition` on an element GSAP animates.

Serve the site over HTTP to test (modules do not run from `file://`): `python -m http.server 8080` in the site folder.

## Cache busting

`python motion-kit/tools/stamp_versions.py <site folder>` puts `?v=<fingerprint>` on every local `.js` and `.css` link and on every module import, so browsers never mix a cached old module with new ones. Run it after any JS/CSS change; `--check` before upload must say "all versions up to date".

Always name the site folder. With no folder it stamps the current one, and it has no `--help`: run it from the kit folder by mistake and it stamps the kit's own files (keep the kit unstamped; it is a source to copy from).

## Text outlines for drawn logos

`python motion-kit/tools/text_to_svg_paths.py "Your Word" path/to/font.woff2 --weight 600` prints an `<svg>` with one `.mark-glyph` path per letter, from the font's real outlines, for the markIntro loader or any stroke-drawn word. Needs `pip install fonttools brotli` (brotli only for `.woff2`).
