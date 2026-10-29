# Web Motion Engine

Version 2.1, 8 October 2026. Sections 5 and 6.1 to 6.8 are unchanged from 2.0, which was verified on 6 October 2026 against gsap 3.15.0, lenis 1.3.26, React 19.3, Next.js 16.4 and Tailwind CSS 4.3. Recipe 6.9 is new in 2.1 and was verified on 8 October 2026 against gsap 3.15.0, lenis 1.3.26, React 19.3 and Tailwind CSS 4.3.

A portable instruction set for AI coding agents that add scroll and interaction motion to a web project. It is plain Markdown with no tool-specific syntax, so any agent that can read a file can use it.

## 0. Read this first

You are adding motion to an existing project. Two goals, in this order:

1. **The page keeps working.** Content is readable with scripts off, with scripts failed, on a phone, and for people who asked their system for less motion.
2. **The motion feels deliberate and expensive.** Slow confident eases, small staggers, one clear moment per screen.

When the two conflict, the first wins.

How this file is laid out:

- Sections 1 to 4: how to work, what good looks like, the rules that keep it from breaking, and which recipe to pick.
- Section 5: the core. Install it once per project.
- Section 6: recipes. Copy the one that fits and adapt it.
- Section 7: checks to run before you report back.
- Section 8: symptoms and causes, for when something looks wrong.

The code in sections 5 and 6 was run in a real browser before it was written down (section 9 lists what was covered). Treat it as the reference. Change values and markup freely. If you change structure, re-read section 3 first.

## 1. How to work

**Inspect before you ask.** Read `package.json` and the lockfile, the framework config, the root layout or entry file, and the global stylesheet. Search the source for motion that already exists (`gsap`, `lenis`, `motion`, `framer-motion`, `locomotive`, `aos`, `@keyframes`). The repo answers most questions: framework, router, package manager, Tailwind version, whether smooth scroll is already set up.

**Ask only what the repo cannot tell you and what would change the build.**

- A small, scoped request (a hover effect, an easing change, one reveal): do not ask. Build it with the defaults below and say what you assumed.
- A new section or page-level motion: ask at most three questions, in one message. Usually the feel or a reference, what drives the motion, and what should happen on phones.
- No answer, or "just do it": carry on with the defaults and list your assumptions in the report.

**Then:**

1. Say the plan in a few lines: which recipe, what drives it, what happens on phones, what happens under reduced motion.
2. Install the core (section 5) if the project does not have it. Reuse it if it does.
3. Build from a recipe (section 6).
4. Run the checks in section 7. If you cannot run the project, say so and list what is unverified.
5. Report what you added, the files you touched, your assumptions, and anything you could not verify.

### Defaults

| Decision | Default |
|---|---|
| Engine | GSAP with ScrollTrigger, plus Lenis for smooth scroll. If the project already uses another motion library, stay with it unless asked. Never add a second one without saying so. |
| Versions | gsap 3.13 or newer. From 3.13 every plugin (SplitText, CustomEase, Flip, MorphSVG and the rest) ships in the main `gsap` package and is free, commercial use included. lenis 1.3 or newer. Check the installed versions rather than assuming. |
| Feel | Slow and confident. The tokens in `MOTION` (5.3) are the starting point. Tune them there, in one place. |
| Driver | Above the fold: plays on load. Below it: reveals once when it enters the viewport. Scrub only where scroll position is the point of the effect. |
| Phones and touch | Keep the reveals. No pinning and no pointer effects. Horizontal rails become native swipe. |
| Reduced motion | Nothing moves. Content sits in its final state and scrolling is native. |
| Styling | Examples use Tailwind classes. In a project without Tailwind, write the equivalent CSS. |

## 2. What good looks like

| Avoid | Do instead |
|---|---|
| One default ease on everything (`power1.out`, `ease-in-out`), or CSS `transition: all` | Reveals: `MOTION.ease.reveal`, `expo.out` or `power4.out`. Scrubbed tweens: `none`, because the scroll already supplies the easing. |
| Fading a block of text in as one lump | Reveal it by line with SplitText and `mask: 'lines'` (6.2). The mask is built for you, so no hand-written `overflow: hidden` wrappers. |
| Animating `width`, `height`, `top`, `left`, `margin`, `padding` | Transforms and `autoAlpha`. `clip-path` and `filter` are fine when they are the effect, but they repaint: keep them to one or two large layers at a time. |
| Hard-coded pixel travel on large moves | `xPercent` and `yPercent`, so distance scales with the element. Small fixed offsets (`y: 24`) are fine for reveals. |
| Two animations driving the same property of one element | One job per element. Add a wrapper and animate that (the hero in 6.1 shows how). |
| A CSS `transition` on an element GSAP animates | Remove it from that element, or limit it to properties GSAP does not touch. |
| `will-change` added by hand | Leave it out. GSAP promotes layers while it animates. Add it only if a profile shows the need, and remove it afterwards. |
| Everything on the page moving | One signature moment per screen. Everything else gets a quiet reveal. |

Typical ranges: micro-interactions 0.2 to 0.4 s, reveals 0.8 to 1.4 s, hero moves 1.2 to 2 s, staggers 0.02 to 0.1 s, scrub smoothing 0.5 to 1.

## 3. Rules that keep it from breaking

1. **Content is visible without scripts.** Start states are set by GSAP at run time, never by classes in the markup. The one exception is purely decorative elements (`aria-hidden`), which may start `invisible`.
2. **Above-the-fold intro elements, and only those, carry `data-motion-hide`.** The gate (5.2) hides them until GSAP has set their start state, and shows them anyway if that never happens. Every such element must sit inside a scope passed to `createMotion`.
3. **All motion runs inside `createMotion` (or `useMotion`).** It scopes selectors, cleans up on unmount, skips everything under reduced motion, and contains errors. Do not call `gsap.context()` or `gsap.matchMedia()` directly, and do not use `ScrollTrigger.matchMedia()`, which has been deprecated since 3.11.
4. **Anything GSAP does not track is registered with `env.onCleanup`.** DOM listeners, cloned nodes, observers, timers.
5. **Tweens that must hold their start state from the first frame take `lazy: false`.** That means `from()` and `fromTo()` in intros and reveals. Without it GSAP can drop the start state when a ScrollTrigger refreshes in the same tick, and the content shows for a moment before it animates.
6. **Layout-dependent values are functions, with `invalidateOnRefresh: true`.** For example `x: () => -distance()` and ``end: () => `+=${distance()}` ``.
7. **Pin an inner element.** Never the root element of a component, and never an element whose children the framework adds or removes.
8. **The framework must not re-render text inside a split element.** Keep the text static, or put a `key` on the element that changes with the text so it is replaced whole.
9. **Breakpoint and pointer conditions use the `when` option,** not `window.innerWidth` checks. Only that block is rebuilt when the query flips.
10. **Intros check `env.intro`.** It is false on re-runs and when the gate's failsafe has already shown the content.
11. **Plugins are registered once, in `core.ts`.** Add a plugin there when a recipe needs it, and import only what is used.
12. **Nothing touches `window` or `document` at import time.** In React Server Component frameworks, any file that calls the hooks starts with `'use client'`.
13. **Full-height sections use `svh` units** (`h-svh`, `h-[200svh]`), so mobile browser bars do not resize them mid-scroll.

## 4. Picking a recipe

| You want | Recipe | Driven by | Touch and small screens |
|---|---|---|---|
| A hero that settles in, then compresses into a card as you scroll | 6.1 Hero | Load, then scrub | Same |
| Headings and statements that rise line by line | 6.2 Text reveal | Entering the viewport, once | Same |
| Cards, list items or grids appearing in sequence | 6.3 Batch reveal | Entering the viewport, once | Same |
| A row of panels that moves sideways while the page is pinned | 6.4 Horizontal rail | Scrub and pin | Native swipe, no pin |
| A looping strip of words or logos | 6.5 Marquee | Time, faster while scrolling | Same |
| A button that leans toward the cursor | 6.6 Magnetic | Pointer | Off |
| Images that trail the cursor across an area | 6.7 Image trail | Pointer | Off |
| A cover that wipes between pages | 6.8 Page transition | Navigation | Same |
| A camera move from a clip, played by the scroll | 6.9 Scroll sequence | Scrub | Same, with a lighter frame set |

If nothing fits, write a new recipe with the same shape: a function that takes the scope element (and `env` if it needs it), returns early when its elements are missing, and follows section 3.

## 5. The core

Install with the project's package manager: `gsap` and `lenis`. Then add these files. Paths are a suggestion; follow the project's structure.

```text
motion/core.ts           tokens, registration, the gate, createMotion
motion/smooth-scroll.ts  one Lenis instance, driven by GSAP's ticker
motion/react.tsx         React and Next.js adapter (skip for other frameworks)
recipes/*.ts             one file per recipe the project actually uses
```

### 5.1 How the pieces fit

- `createMotion(scope, setup, options)` is the only entry point for animation. It returns a cleanup function.
- `setup` receives `env`: `env.intro` says whether load-in animations should play, and `env.onCleanup(fn)` registers teardown.
- `options.when` limits a block to a media query (`'desktop'`, `'hover'`, or any query string). `options.reduced` is an optional gentler variant for reduced motion.
- `startSmoothScroll()` starts Lenis once for the page and returns a stop function.

### 5.2 The gate

Server-rendered pages paint before scripts run. Without help, intro text shows, vanishes when GSAP sets its start state, then animates in. The gate hides intro elements until GSAP has them, and a failsafe shows them anyway after 2.5 seconds if motion never arrives.

Put this in `<head>`, as early as possible:

```html
<script>
  (function (d, w) {
    d.classList.add('motion-pending');
    w.__motionFailsafe = setTimeout(function () {
      w.__motionShown = new WeakSet(document.querySelectorAll('[data-motion-hide]'));
      d.classList.remove('motion-pending');
    }, 2500);
  })(document.documentElement, window);
</script>
```

And this in the global stylesheet:

```css
.motion-pending [data-motion-hide] { visibility: hidden; }
@media (prefers-reduced-motion: reduce) {
  .motion-pending [data-motion-hide] { visibility: visible; }
}
```

`createMotion` opens the gate as soon as it has set up a scope that contains gated elements. If the failsafe fires first, those elements are remembered and their intro is skipped (`env.intro` is false), so content that is already on screen never disappears again. Content mounted later, for example after client-side navigation, still gets its intro.

### 5.3 `motion/core.ts`

```ts
// motion/core.ts
// Tokens, one-time plugin registration, the visibility gate, and createMotion().
// Framework-agnostic: every adapter and recipe goes through this file.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { CustomEase } from 'gsap/CustomEase';

declare global {
  interface Window {
    __motionReady?: boolean;
    __motionFailsafe?: number;
    __motionShown?: WeakSet<Element>;
  }
}

export const MOTION = {
  ease: { reveal: 'luxe', inOut: 'luxeInOut', soft: 'expo.out', scrub: 'none' },
  duration: { micro: 0.3, base: 0.9, reveal: 1.2, hero: 1.6 },
  stagger: { tight: 0.02, base: 0.06, loose: 0.1 },
  query: {
    reduce: '(prefers-reduced-motion: reduce)',
    motion: '(prefers-reduced-motion: no-preference)',
    desktop: '(min-width: 1024px)',
    hover: '(hover: hover) and (pointer: fine)',
  },
} as const;

/** Registers plugins and global behaviour once. Returns false on the server or on failure. */
export function registerMotion(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.__motionReady !== undefined) return window.__motionReady;
  try {
    gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
    // Cubic-bezier values. x1 and x2 must stay inside 0..1 or time runs backwards.
    CustomEase.create('luxe', '0.16, 1, 0.3, 1');
    CustomEase.create('luxeInOut', '0.76, 0, 0.24, 1');
    ScrollTrigger.config({ ignoreMobileResize: true });

    // Triggers must be measured top to bottom, or a pin higher up shifts everything
    // below it. Creation order is not reliable (lazy components, breakpoint rebuilds).
    ScrollTrigger.addEventListener('refreshInit', () => ScrollTrigger.sort());

    // Trigger positions go stale when fonts, lazy images or late content change the
    // page height. Re-measure when that happens, and only then.
    let measured = 0;
    let timer = 0;
    const height = () => document.documentElement.scrollHeight;
    const check = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (Math.abs(height() - measured) > 1) ScrollTrigger.refresh();
      }, 200);
    };
    ScrollTrigger.addEventListener('refresh', () => {
      measured = height();
    });
    document.fonts?.ready.then(check).catch(() => {});
    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(check);
      for (const el of [document.documentElement, document.body]) if (el) observer.observe(el);
    }
    window.__motionReady = true;
  } catch (error) {
    console.warn('[motion] could not start, the page stays static.', error);
    window.__motionReady = false;
  }
  return window.__motionReady;
}

const GATED = '[data-motion-hide]';
const gatedIn = (scope: Element): Element[] => [
  ...(scope.matches(GATED) ? [scope] : []),
  ...Array.from(scope.querySelectorAll(GATED)),
];

/** True when the failsafe has already shown this scope's gated elements to the user. */
function shownByFailsafe(scope: Element): boolean {
  const shown = window.__motionShown;
  return !!shown && gatedIn(scope).some((el) => shown.has(el));
}

/** Hands gated elements over to GSAP. Safe to call more than once. */
export function releaseGate(): void {
  if (typeof document === 'undefined') return;
  window.clearTimeout(window.__motionFailsafe);
  document.documentElement.classList.remove('motion-pending');
}

export type MotionEnv = {
  /**
   * Play load-in animations? True only on the first run, and only if the failsafe
   * has not already shown these elements. When false, leave content as it is.
   */
  intro: boolean;
  /** Register teardown for anything GSAP does not track: DOM listeners, clones, timers. */
  onCleanup(fn: () => void): void;
};
export type MotionSetup = (env: MotionEnv) => void;
export type MotionOptions = {
  /**
   * Only run while this also matches, and revert when it stops matching.
   * A key of MOTION.query, or any media query string.
   */
  when?: 'desktop' | 'hover' | (string & {});
  /** Optional opacity-only variant for people who asked for reduced motion. */
  reduced?: MotionSetup;
};

/**
 * Runs `setup` against `scope` and returns a cleanup function (call it on unmount).
 * - Reduced motion: `setup` is skipped, so content stays in its natural, visible state.
 * - Any error in `setup`: everything it created is reverted and content stays visible.
 * - Selector strings passed to GSAP inside `setup` are scoped to `scope`.
 */
export function createMotion(
  scope: Element | null | undefined,
  setup: MotionSetup,
  options: MotionOptions = {},
): () => void {
  if (!scope) return () => {};
  if (!registerMotion()) {
    releaseGate(); // motion is unavailable, so nothing may stay hidden
    return () => {};
  }
  const gated = gatedIn(scope).length > 0;
  const late = shownByFailsafe(scope);
  const mm = gsap.matchMedia(scope);
  let first = true;

  const guard = (run: MotionSetup) => (ctx: gsap.Context) => {
    const cleanups: Array<() => void> = [];
    const teardown = () => {
      for (const fn of cleanups.splice(0)) {
        try {
          fn();
        } catch {
          /* a failing cleanup must not block the others */
        }
      }
    };
    // The try/catch must live inside this callback. An error that escapes it
    // leaves GSAP's internal context pointer set, and later tweens leak into it.
    try {
      run({ intro: first && !late, onCleanup: (fn) => cleanups.push(fn) });
    } catch (error) {
      console.warn('[motion] setup failed, showing static content instead.', error);
      teardown();
      ctx.revert();
    }
    first = false;
    return teardown;
  };

  const { motion, reduce } = MOTION.query;
  const extra = options.when ? ((MOTION.query as Record<string, string>)[options.when] ?? options.when) : '';
  mm.add(extra ? `${motion} and ${extra}` : motion, guard(setup));
  if (options.reduced) mm.add(reduce, guard(options.reduced));

  if (gated) releaseGate();
  return () => mm.revert();
}
```

### 5.4 `motion/smooth-scroll.ts`

```ts
// motion/smooth-scroll.ts
// One Lenis instance for the page, driven by GSAP's ticker.
// Also add `import 'lenis/dist/lenis.css'` once in the app's global entry.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis, { type LenisOptions } from 'lenis';
import { MOTION, registerMotion } from './core';

let lenis: Lenis | null = null;
let media: gsap.MatchMedia | null = null;
let users = 0;

/** The live instance, or null (server, reduced motion, or not started). */
export const getLenis = (): Lenis | null => lenis;

/** Starts smooth scrolling. Returns a stop function. Safe to call from several places. */
export function startSmoothScroll(options: LenisOptions = {}): () => void {
  if (!registerMotion()) return () => {};
  users += 1;

  if (!media) {
    media = gsap.matchMedia();
    // Only smooth when the user has not asked for reduced motion. matchMedia tears
    // this down and rebuilds it if that setting changes while the page is open.
    media.add(MOTION.query.motion, () => {
      const instance = new Lenis({ lerp: 0.1, smoothWheel: true, anchors: true, ...options, autoRaf: false });
      const onScroll = () => ScrollTrigger.update();
      // Keep a reference: the function added to the ticker is the one that must be removed.
      const raf = (time: number) => instance.raf(time * 1000);

      instance.on('scroll', onScroll);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
      lenis = instance;

      return () => {
        gsap.ticker.remove(raf);
        gsap.ticker.lagSmoothing(500, 33); // GSAP's default
        instance.off('scroll', onScroll);
        instance.destroy();
        if (lenis === instance) lenis = null;
      };
    });
  }

  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    users -= 1;
    if (users === 0 && media) {
      media.revert();
      media = null;
    }
  };
}
```

### 5.5 React and Next.js

```tsx
// motion/react.tsx
// Thin React / Next.js adapter. All behaviour lives in core.ts and smooth-scroll.ts.
'use client';

import { useEffect, useLayoutEffect, type DependencyList, type ReactNode, type RefObject } from 'react';
import type { LenisOptions } from 'lenis';
import { createMotion, type MotionOptions, type MotionSetup } from './core';
import { startSmoothScroll } from './smooth-scroll';

// useLayoutEffect warns during server rendering, so fall back to useEffect there.
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** Mount once near the root (for example in app/layout.tsx). */
export function SmoothScroll({ children, options }: { children: ReactNode; options?: LenisOptions }) {
  // Options are read once on mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => startSmoothScroll(options), []);
  return <>{children}</>;
}

/**
 * Runs a motion setup against a ref and cleans it up on unmount.
 * List every reactive value the setup reads in `deps`.
 */
export function useMotion(
  scope: RefObject<HTMLElement | null>,
  setup: MotionSetup,
  deps: DependencyList = [],
  options?: MotionOptions,
): void {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useIsoLayoutEffect(() => createMotion(scope.current, setup, options), deps);
}
```

Root layout for the Next.js App Router. The same idea applies to any server-rendered React setup: the gate script goes in `<head>`, `SmoothScroll` wraps the page once.

```tsx
import type { ReactNode } from 'react';
import { SmoothScroll } from '../motion/react';
import 'lenis/dist/lenis.css';
import './globals.css'; // includes the two gate rules from 5.2

// The gate from 5.2, inlined so it runs before first paint.
const gate = `(function(d,w){d.classList.add('motion-pending');w.__motionFailsafe=setTimeout(function(){w.__motionShown=new WeakSet(document.querySelectorAll('[data-motion-hide]'));d.classList.remove('motion-pending')},2500)})(document.documentElement,window)`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // The gate adds a class to <html> before hydration. Without this attribute
    // React reports a hydration mismatch in development.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: gate }} />
      </head>
      <body className="bg-neutral-950 text-white">
        <SmoothScroll>{children}</SmoothScroll>
        {/* Only needed for the page transition recipe (6.8). */}
        <div data-page-overlay aria-hidden="true" className="pointer-events-none invisible fixed inset-0 z-50 bg-neutral-900" />
      </body>
    </html>
  );
}
```

A reduced-motion variant, when a section should not simply sit still:

```tsx
useMotion(ref, (env) => marquee(ref.current!, env), [], {
  // People who asked for less motion get one short fade and nothing else.
  reduced: () => {
    gsap.from(ref.current, { autoAlpha: 0, duration: 0.4, lazy: false });
  },
});
```

### 5.6 Other frameworks

The contract is the same everywhere: call `createMotion(rootElement, setup)` once the element is in the DOM, and call the function it returns before the element is removed.

```ts
import { createMotion } from './motion/core';
import { startSmoothScroll } from './motion/smooth-scroll';
import { hero } from './recipes/hero';
import { horizontalScroll } from './recipes/horizontal-scroll';

const stopScroll = startSmoothScroll();

const heroEl = document.querySelector('[data-hero]');
const rail = document.querySelector('[data-hscroll]');
const stops = [
  createMotion(heroEl, (env) => hero(heroEl!, env)),
  createMotion(rail, () => horizontalScroll(rail!), { when: 'desktop' }),
];

// Call these if the page is torn down without a full reload (client-side routers).
export const destroy = () => [...stops, stopScroll].forEach((stop) => stop());
```

| Framework | Start | Stop |
|---|---|---|
| Plain JS, multi-page site | A deferred script, as above | Not needed, the page reload clears everything |
| Astro with client-side routing | On `astro:page-load` | On `astro:before-swap` |
| Vue 3, Nuxt | `onMounted` | `onBeforeUnmount`, while the DOM still exists |
| Svelte | `onMount(() => createMotion(el, setup))` | The function `onMount` returns |

The plain-JS wiring and the React adapter were run in a browser. The Astro, Vue and Svelte rows follow the same contract but were not, so check them on first use.

## 6. Recipes

Each recipe is a function that takes the scope element. Markup hooks are `data-*` attributes, so class names stay free for styling.

### 6.1 Hero: settle in, then compress into a card

On load the image eases down from a slight zoom while the headline rises line by line. On scroll the frame insets and rounds, the image drifts for depth, and the copy lifts away.

```html
<header data-hero class="relative h-[200svh] w-full bg-neutral-950">
  <!-- CSS sticky does the pinning. No pin spacer, nothing to clean up. -->
  <div class="sticky top-0 flex h-svh w-full items-center justify-center overflow-hidden">
    <div data-hero-frame class="absolute inset-0">
      <div data-hero-zoom class="h-full w-full">
        <img data-hero-img src="./hero.svg" alt="Waterfront residence at dusk" class="h-full w-full object-cover" />
      </div>
      <div class="absolute inset-0 bg-black/30"></div>
    </div>
    <div data-hero-content class="relative z-10 px-6 text-center text-white">
      <h1 data-hero-title data-motion-hide class="font-serif text-6xl tracking-tight md:text-8xl">
        Coastal living, perfected.
      </h1>
      <p data-hero-sub data-motion-hide class="mt-4 text-lg font-light md:text-xl">
        A privately curated portfolio of Florida's rarest waterfront residences.
      </p>
    </div>
  </div>
</header>
```

```ts
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { MOTION, type MotionEnv } from '../motion/core';

export function hero(scope: Element, env: MotionEnv): void {
  const q = (name: string) => scope.querySelector<HTMLElement>(`[data-hero-${name}]`);
  const frame = q('frame');
  const zoom = q('zoom');
  const content = q('content');
  if (!frame || !zoom || !content) return;
  const img = q('img');
  const title = q('title');
  const sub = q('sub');

  // 1. Intro, once on load. env.intro is false on re-runs and after the failsafe.
  if (env.intro) {
    // lazy: false on every tween that must hold its start state from the first frame.
    // GSAP queues a from() start state by default, and a ScrollTrigger refresh in the
    // same tick can flush that queue as a revert, which shows the text for a moment.
    if (img) gsap.from(img, { scale: 1.12, duration: MOTION.duration.hero, ease: MOTION.ease.reveal, lazy: false });
    if (title) {
      SplitText.create(title, {
        type: 'lines',
        mask: 'lines', // SplitText adds the overflow-clip wrapper per line
        autoSplit: true, // re-splits when fonts load or the width changes
        // Returning the tween lets SplitText carry its progress across a re-split.
        onSplit: (self) =>
          gsap.from(self.lines, {
            yPercent: 110,
            duration: MOTION.duration.reveal,
            ease: MOTION.ease.reveal,
            stagger: MOTION.stagger.loose,
            delay: 0.1,
            lazy: false,
          }),
      });
    }
    if (sub) {
      gsap.from(sub, {
        autoAlpha: 0,
        y: 24,
        duration: MOTION.duration.reveal,
        ease: MOTION.ease.reveal,
        delay: 0.35,
        lazy: false,
      });
    }
  }

  // 2. Scroll-driven compression. Different elements from the intro, so the two
  //    never fight over the same property.
  gsap
    .timeline({
      defaults: { ease: MOTION.ease.scrub },
      scrollTrigger: { trigger: scope, start: 'top top', end: 'bottom bottom', scrub: 0.8, invalidateOnRefresh: true },
    })
    .fromTo(frame, { clipPath: 'inset(0% round 0px)' }, { clipPath: 'inset(4% round 32px)' }, 0)
    // Scale never drops below 1.1, so the 4% parallax shift cannot expose an edge.
    .fromTo(zoom, { scale: 1.25, yPercent: -4 }, { scale: 1.1, yPercent: 4 }, 0)
    .to(content, { yPercent: -40, autoAlpha: 0 }, 0);
}
```

As a Next.js client component:

```tsx
'use client';
import { useRef } from 'react';
import { useMotion } from '../motion/react';
import { hero } from '../recipes/hero';

export function Hero({ title, sub }: { title: string; sub: string }) {
  const ref = useRef<HTMLElement>(null);
  useMotion(ref, (env) => hero(ref.current!, env));
  return (
    <header ref={ref} data-hero className="relative h-[200svh] w-full bg-neutral-950">
      <div className="sticky top-0 flex h-svh w-full items-center justify-center overflow-hidden">
        <div data-hero-frame className="absolute inset-0">
          <div data-hero-zoom className="h-full w-full">
            <img data-hero-img src="/hero.svg" alt="Waterfront residence at dusk" className="h-full w-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-black/30" />
        </div>
        <div data-hero-content className="relative z-10 px-6 text-center text-white">
          <h1 data-hero-title data-motion-hide className="font-serif text-6xl tracking-tight md:text-8xl">{title}</h1>
          <p data-hero-sub data-motion-hide className="mt-4 text-lg font-light md:text-xl">{sub}</p>
        </div>
      </div>
    </header>
  );
}
```

Notes:

- The media has three nested layers with one job each: the frame clips, the zoom wrapper does the scroll parallax, the image does the load-in. That is what keeps the intro and the scrub from fighting.
- For a parallax shift of `p` percent, keep the scale at `1 + 2p` or more (a 4% shift needs at least 1.08), or an edge will show.
- On Tailwind older than 3.4, write `h-[100svh]` and `h-[200svh]` instead of `h-svh`.

### 6.2 Text reveal

Lines rise out of a mask the first time the element enters the viewport.

```html
<h2 data-reveal-text class="text-4xl md:text-6xl">
  Each residence is chosen for what cannot be built again.
</h2>
```

```ts
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { MOTION } from '../motion/core';

export function textReveal(scope: Element): void {
  scope.querySelectorAll<HTMLElement>('[data-reveal-text]').forEach((el) => {
    let tween: gsap.core.Tween | undefined;
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      onSplit: (self) =>
        (tween = gsap.from(self.lines, {
          yPercent: 110,
          duration: MOTION.duration.reveal,
          ease: MOTION.ease.reveal,
          stagger: MOTION.stagger.base,
          paused: true,
          lazy: false, // hold the masked start state until the trigger fires
        })),
    });
    // The trigger lives outside onSplit so a re-split never replays the reveal.
    ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: () => tween?.play() });
  });
}
```

```ts
createMotion(el, () => textReveal(el)); // vanilla
useMotion(ref, () => textReveal(ref.current!)); // React
```

Notes:

- SplitText puts the full sentence in an `aria-label` on the element and hides the pieces from assistive tech, so screen readers still get one sentence.
- Use it on headings and short statements. Long body copy does not need it.
- In React, if the text comes from state or props, key the element on it: `<h2 key={text} data-reveal-text>{text}</h2>`.

### 6.3 Batch reveal

Items fade and rise in sequence as they scroll into view.

```html
<ul class="grid grid-cols-1 gap-6 md:grid-cols-3">
  <li data-reveal class="rounded-2xl bg-neutral-900 p-8">Harbour House</li>
  <li data-reveal class="rounded-2xl bg-neutral-900 p-8">The Mangrove Estate</li>
  <li data-reveal class="rounded-2xl bg-neutral-900 p-8">Point Lookout</li>
</ul>
```

```ts
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MOTION } from '../motion/core';

export function batchReveal(scope: Element): void {
  const items = Array.from(scope.querySelectorAll<HTMLElement>('[data-reveal]'));
  if (!items.length) return;
  gsap.set(items, { autoAlpha: 0, y: 32 });
  // One observer pass for the whole set instead of one ScrollTrigger timeline each.
  ScrollTrigger.batch(items, {
    start: 'top 88%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        autoAlpha: 1,
        y: 0,
        duration: MOTION.duration.base,
        ease: MOTION.ease.reveal,
        stagger: MOTION.stagger.base,
        overwrite: true,
      }),
  });
}
```

```ts
createMotion(el, () => batchReveal(el)); // vanilla
useMotion(ref, () => batchReveal(ref.current!)); // React
```

### 6.4 Horizontal rail

The section pins and the track moves sideways by exactly its overflow. Below the desktop breakpoint nothing is pinned and the row scrolls natively.

```html
<section data-hscroll class="bg-neutral-900">
  <!-- Pin an inner element, never the component root that the framework owns. -->
  <div data-h-pin class="h-svh overflow-x-auto lg:overflow-hidden">
    <div data-h-track class="flex h-full w-max items-center gap-8 px-8">
      <article class="h-[60svh] w-[80vw] shrink-0 rounded-3xl bg-neutral-800 lg:w-[40vw]">One</article>
      <article class="h-[60svh] w-[80vw] shrink-0 rounded-3xl bg-neutral-800 lg:w-[40vw]">Two</article>
      <article class="h-[60svh] w-[80vw] shrink-0 rounded-3xl bg-neutral-800 lg:w-[40vw]">Three</article>
      <article class="h-[60svh] w-[80vw] shrink-0 rounded-3xl bg-neutral-800 lg:w-[40vw]">Four</article>
    </div>
  </div>
</section>
```

```ts
import gsap from 'gsap';
import { MOTION } from '../motion/core';

// Run with { when: 'desktop' }. Below that the track stays a native, swipeable row.
export function horizontalScroll(scope: Element): void {
  const pin = scope.querySelector<HTMLElement>('[data-h-pin]');
  const track = scope.querySelector<HTMLElement>('[data-h-track]');
  if (!pin || !track) return;
  const distance = () => Math.max(0, track.scrollWidth - pin.clientWidth);
  if (!distance()) return;

  gsap.to(track, {
    x: () => -distance(), // function values are re-read on every refresh
    ease: MOTION.ease.scrub,
    scrollTrigger: {
      trigger: pin,
      start: 'top top',
      end: () => `+=${distance()}`,
      pin: true,
      scrub: 0.6,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });
}
```

```ts
createMotion(el, () => horizontalScroll(el), { when: 'desktop' }); // vanilla
useMotion(ref, () => horizontalScroll(ref.current!), [], { when: 'desktop' }); // React
```

### 6.5 Marquee

A seamless loop that only runs while it is on screen and speeds up with scroll velocity.

```html
<div data-marquee class="flex overflow-hidden whitespace-nowrap">
  <!-- Spacing goes on the items (pr-12), not a flex gap, so both copies are identical. -->
  <div data-marquee-track class="flex min-w-full shrink-0 justify-around">
    <span class="pr-12 text-5xl">Miami</span>
    <span class="pr-12 text-5xl">Naples</span>
    <span class="pr-12 text-5xl">Palm Beach</span>
    <span class="pr-12 text-5xl">Key Largo</span>
  </div>
</div>
```

```ts
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { MotionEnv } from '../motion/core';

export function marquee(scope: Element, env: MotionEnv, speed = 80 /* px per second */): void {
  scope.querySelectorAll<HTMLElement>('[data-marquee]').forEach((el) => {
    const track = el.querySelector<HTMLElement>('[data-marquee-track]');
    if (!track || !track.offsetWidth) return;

    // A second copy makes the loop seamless. Hidden from assistive tech.
    const clone = track.cloneNode(true) as HTMLElement;
    clone.setAttribute('aria-hidden', 'true');
    clone.removeAttribute('data-marquee-track');
    el.appendChild(clone);
    env.onCleanup(() => clone.remove());

    const loop = gsap.to([track, clone], {
      xPercent: -100,
      duration: track.offsetWidth / speed,
      ease: 'none',
      repeat: -1,
      paused: true,
    });
    const sync = (self: ScrollTrigger) => (self.isActive ? loop.play() : loop.pause());

    ScrollTrigger.create({
      trigger: el,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: sync, // only animate while on screen
      onRefresh: sync,
      onUpdate: (self) => {
        // Speed up with scroll velocity, then settle back.
        const boost = gsap.utils.clamp(1, 4, 1 + Math.abs(self.getVelocity()) / 800);
        gsap.to(loop, { timeScale: boost, duration: 0.2, overwrite: true });
        gsap.to(loop, { timeScale: 1, duration: 0.8, delay: 0.2 });
      },
    });
    env.onCleanup(() => gsap.killTweensOf(loop));
  });
}
```

```ts
createMotion(el, (env) => marquee(el, env)); // vanilla
useMotion(ref, (env) => marquee(ref.current!, env)); // React
```

### 6.6 Magnetic button

```html
<a data-magnetic href="#contact" class="inline-block rounded-full border border-white/40 px-10 py-5">
  Request a private viewing
</a>
```

```ts
import gsap from 'gsap';
import type { MotionEnv } from '../motion/core';

// Run with { when: 'hover' }. The effect is pointless and jittery on touch.
export function magnetic(scope: Element, env: MotionEnv, strength = 0.35): void {
  scope.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    // quickTo reuses one tween per axis instead of creating one per pointer event.
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
    let rect = el.getBoundingClientRect();

    const enter = () => {
      rect = el.getBoundingClientRect(); // measure at rest, not mid-offset
    };
    const move = (e: PointerEvent) => {
      xTo((e.clientX - (rect.left + rect.width / 2)) * strength);
      yTo((e.clientY - (rect.top + rect.height / 2)) * strength);
    };
    const leave = () => {
      xTo(0);
      yTo(0);
    };

    el.addEventListener('pointerenter', enter);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    env.onCleanup(() => {
      el.removeEventListener('pointerenter', enter);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    });
  });
}
```

```ts
createMotion(el, (env) => magnetic(el, env), { when: 'hover' }); // vanilla
useMotion(ref, (env) => magnetic(ref.current!, env), [], { when: 'hover' }); // React
```

### 6.7 Image trail

```html
<div data-trail class="relative mt-20 h-[70svh] overflow-hidden">
  <!-- Decorative only, so starting hidden in CSS costs nothing if scripts fail. -->
  <img data-trail-img src="./t1.svg" alt="" aria-hidden="true" class="pointer-events-none invisible absolute left-0 top-0 w-48" />
  <img data-trail-img src="./t2.svg" alt="" aria-hidden="true" class="pointer-events-none invisible absolute left-0 top-0 w-48" />
  <img data-trail-img src="./t3.svg" alt="" aria-hidden="true" class="pointer-events-none invisible absolute left-0 top-0 w-48" />
</div>
```

```ts
import gsap from 'gsap';
import { MOTION, type MotionEnv } from '../motion/core';

// Run with { when: 'hover' }.
export function imageTrail(scope: Element, env: MotionEnv, gap = 80 /* px between spawns */): void {
  const area = scope.querySelector<HTMLElement>('[data-trail]');
  const imgs = area ? Array.from(area.querySelectorAll<HTMLElement>('[data-trail-img]')) : [];
  if (!area || !imgs.length) return;

  gsap.set(imgs, { xPercent: -50, yPercent: -50 });
  let index = 0;
  let layer = 1;
  let last = { x: 0, y: 0 };

  const move = (e: PointerEvent) => {
    if (Math.hypot(e.clientX - last.x, e.clientY - last.y) < gap) return;
    last = { x: e.clientX, y: e.clientY };
    const box = area.getBoundingClientRect();
    const img = imgs[index++ % imgs.length];
    if (!img) return;
    gsap.killTweensOf(img);
    gsap
      .timeline()
      .set(img, { x: e.clientX - box.left, y: e.clientY - box.top, zIndex: layer++, autoAlpha: 1, scale: 0.8 })
      .to(img, { scale: 1, duration: 0.5, ease: MOTION.ease.reveal })
      .to(img, { autoAlpha: 0, scale: 0.9, duration: 0.4, ease: 'power2.in' }, '+=0.3');
  };

  area.addEventListener('pointermove', move);
  env.onCleanup(() => {
    area.removeEventListener('pointermove', move);
    gsap.killTweensOf(imgs);
    gsap.set(imgs, { clearProps: 'all' });
  });
}
```

```ts
createMotion(el, (env) => imageTrail(el, env), { when: 'hover' }); // vanilla
useMotion(ref, (env) => imageTrail(ref.current!, env), [], { when: 'hover' }); // React
```

### 6.8 Page transition

A cover wipes up, the navigation happens underneath, the cover wipes away. The overlay sits once in the root layout.

```html
<div data-page-overlay aria-hidden="true" class="pointer-events-none invisible fixed inset-0 z-50 bg-neutral-900"></div>
```

```ts
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MOTION, registerMotion } from '../motion/core';
import { getLenis } from '../motion/smooth-scroll';

/** Covers the page, runs `navigate`, then uncovers. The cover always lifts, even on error. */
export async function pageTransition(navigate: () => void | Promise<void>): Promise<void> {
  const overlay = typeof document === 'undefined' ? null : document.querySelector<HTMLElement>('[data-page-overlay]');
  if (!overlay || !registerMotion() || window.matchMedia(MOTION.query.reduce).matches) {
    await navigate();
    return;
  }
  try {
    await gsap.fromTo(
      overlay,
      { autoAlpha: 1, scaleY: 0, transformOrigin: '50% 100%' },
      { scaleY: 1, duration: 0.6, ease: MOTION.ease.inOut },
    );
    await navigate();
    getLenis()?.scrollTo(0, { immediate: true, force: true });
    ScrollTrigger.refresh();
  } finally {
    gsap.to(overlay, {
      scaleY: 0,
      transformOrigin: '50% 0%',
      duration: 0.6,
      ease: MOTION.ease.inOut,
      overwrite: true,
      onComplete: () => gsap.set(overlay, { autoAlpha: 0 }),
    });
  }
}
```

On a plain multi-page site:

```ts
const go = (href: string) => pageTransition(() => window.location.assign(href)); // plain multi-page site
```

In the Next.js App Router:

```tsx
'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ComponentProps, MouseEvent } from 'react';
import { pageTransition } from '../recipes/page-transition';

export function TransitionLink({ href, onClick, ...rest }: ComponentProps<typeof Link> & { href: string }) {
  const router = useRouter();
  const go = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    // New-tab and modified clicks stay with the browser.
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    void pageTransition(() => router.push(href));
  };
  return <Link href={href} onClick={go} {...rest} />;
}
```

Notes:

- `router.push` returns at once, so the cover lifts on its own timing and not when the new route has finished rendering. With prefetched or static routes that is fine. For slow routes, lengthen the cover or lift it from the new page instead.
- If the framework has native view transitions (Astro, or the browser View Transitions API), prefer those and keep this recipe for projects without them.

### 6.9 Scroll sequence: a camera move played by the scroll

A short clip (filmed, rendered or generated) is cut into still frames, and the scroll position picks which frame is drawn on a canvas. Text hands over on top: an opening line fades out early and the headline arrives over the last frames. With scripts off, with reduced motion, or with data saver on, the section is an ordinary still hero.

Prepare the frames before writing any code. The clip decides how good this looks.

```text
public/hero/poster-desktop.jpg                   frame 1 as a JPEG, 1600 wide. This is what loads before scripts.
public/hero/poster-phone.jpg                     frame 1, 1280 wide
public/hero/desktop/jet_0001.webp ... 0120.webp  1600 x 900
public/hero/phone/jet_0001.webp ... 0061.webp    1280 x 720, every second frame
```

```bash
ffmpeg -i clip.mp4 -vf "fps=15,scale=1600:-2" -c:v libwebp -quality 72 public/hero/desktop/jet_%04d.webp
```

- Go through the clip frame by frame first. Generated clips often carry a smeared patch, garbled lettering or a warped edge for a second or two. Crop or reframe it out before extracting.
- Aim for 100 to 150 frames on desktop and half that on phones, and keep the totals under about 6 MB and 2 MB. The set this recipe was tested with is 120 frames at 4.3 MB and 61 frames at 1.6 MB.
- The poster must be frame 1 exactly, so the swap from image to canvas cannot be seen.
- If the clip moves unevenly (a slow start, then a rush), do not sample evenly in time. Pick frames by how much the picture changes between them, measured with optical flow, blended half and half with even time. The scroll then feels even.

```html
<header data-seq class="relative h-svh w-full bg-neutral-950">
  <!-- CSS sticky does the pinning. The recipe makes the section taller at run time. -->
  <div data-seq-stage class="sticky top-0 h-svh w-full overflow-hidden">
    <picture>
      <source media="(max-width: 767px)" srcset="/hero/poster-phone.jpg" />
      <img data-seq-poster src="/hero/poster-desktop.jpg" width="1600" height="900" fetchpriority="high"
        alt="A private jet on the apron at dusk, cabin door open and steps lit"
        class="absolute inset-0 h-full w-full object-cover object-[43%_50%]" />
    </picture>
    <!-- Decorative, so it may start hidden: the poster is the content. -->
    <canvas data-seq-canvas aria-hidden="true" class="invisible absolute inset-0 h-full w-full"></canvas>
    <div data-seq-scrim class="absolute inset-0 bg-black opacity-30"></div>
    <div class="relative z-10 grid h-full place-items-center px-6 text-center">
      <!-- Low in the frame, so the opening line does not sit on the open door. -->
      <div data-seq-out class="self-end pb-[12svh]">
        <p data-seq-intro data-motion-hide class="text-xs uppercase tracking-[0.3em] text-white/80">El-Global Business</p>
        <p data-seq-intro data-motion-hide class="mt-4 max-w-xl font-serif text-2xl md:text-4xl">
          Transforming capital into sustainable global assets.
        </p>
      </div>
      <h1 data-seq-in data-motion-hide class="font-serif text-5xl tracking-tight md:text-8xl">Welcome to the 1%</h1>
    </div>
  </div>
</header>
```

```ts
import gsap from 'gsap';
import { MOTION, type MotionEnv } from '../motion/core';

export type SequenceSet = {
  /** URL of frame `i`. Frames are numbered from 1. */
  src: (i: number) => string;
  /** How many frames the set has. */
  count: number;
};

export type SequenceOptions = SequenceSet & {
  /** A lighter set for narrow screens. Chosen once, at setup. */
  small?: SequenceSet;
  /** Section height in svh while the sequence runs. Taller means slower. Default 350. */
  length?: number;
  /** Share of the scroll the frames take. The rest holds the last frame for the closing text. Default 0.85. */
  framesEnd?: number;
  /** Horizontal focus of the cover crop at the first and last frame. 0 is the left edge, 1 the right. */
  focus?: [number, number];
  /** Opacity the scrim deepens to behind the closing text. Default 0.5. */
  dim?: number;
};

const SMALL = '(max-width: 767px)';
const PARALLEL = 6;

export function scrollSequence(scope: Element, env: MotionEnv, options: SequenceOptions): void {
  const root = scope as HTMLElement;
  const stage = root.querySelector<HTMLElement>('[data-seq-stage]');
  const canvas = root.querySelector<HTMLCanvasElement>('[data-seq-canvas]');
  const ctx = canvas?.getContext('2d');
  if (!stage || !canvas || !ctx) return;

  // People who asked their browser to save data keep the still image.
  if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return;

  const { src, count } = options.small && window.matchMedia(SMALL).matches ? options.small : options;
  if (count < 2) return;
  const { length = 350, framesEnd = 0.85, focus = [0.5, 0.5], dim = 0.5 } = options;

  const out = root.querySelector<HTMLElement>('[data-seq-out]');
  const into = root.querySelector<HTMLElement>('[data-seq-in]');
  const scrim = root.querySelector<HTMLElement>('[data-seq-scrim]');
  const intro = Array.from(root.querySelectorAll<HTMLElement>('[data-seq-intro]'));

  // 1. Layout that only exists while the sequence runs. With scripts off or reduced
  //    motion the section keeps its normal height and both text blocks sit in the flow.
  const style = (el: HTMLElement, prop: string, value: string) => {
    const before = el.style.getPropertyValue(prop);
    el.style.setProperty(prop, value);
    env.onCleanup(() => (before ? el.style.setProperty(prop, before) : el.style.removeProperty(prop)));
  };
  style(root, 'height', `${length}svh`);
  for (const el of [out, into]) if (el) style(el, 'grid-area', '1 / 1'); // stack them in one cell

  // 2. Frames. Decoded images are kept by index; a missing one falls back to its nearest neighbour.
  const frames: Array<HTMLImageElement | undefined> = new Array(count);
  const loading = new Set<HTMLImageElement>();
  const state = { frame: 0 };
  let alive = true;
  let wanted = 0;
  let drawn = -1;

  const nearest = (i: number) => {
    for (let d = 0; d < count; d++) {
      if (frames[i - d]) return i - d;
      if (frames[i + d]) return i + d;
    }
    return -1;
  };

  const draw = (force = false) => {
    const i = nearest(wanted);
    if (i < 0 || (i === drawn && !force)) return;
    const img = frames[i]!;
    const scale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    const x = focus[0] + (focus[1] - focus[0]) * (wanted / (count - 1));
    ctx.drawImage(img, (canvas.width - w) * x, (canvas.height - h) / 2, w, h);
    if (drawn < 0) style(canvas, 'visibility', 'visible'); // the poster stays underneath until now
    drawn = i;
  };

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(stage.clientWidth * ratio);
    const h = Math.round(stage.clientHeight * ratio);
    if (!w || !h || (canvas.width === w && canvas.height === h)) return;
    canvas.width = w; // resizing a canvas clears it
    canvas.height = h;
    draw(true);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(stage);
  resize();

  // 3. Loading. A coarse pass first (every 16th frame, then 8th, 4th...), so the whole
  //    scroll has something to show within a few requests and sharpens as the rest arrives.
  const order: number[] = [];
  const queued = new Set<number>();
  const queue = (i: number) => {
    if (i >= 0 && i < count && !queued.has(i)) {
      queued.add(i);
      order.push(i);
    }
  };
  queue(0);
  queue(count - 1);
  for (let step = 16; step >= 1; step /= 2) for (let i = 0; i < count; i += step) queue(i);

  const requested = new Set<number>();
  const load = (i: number) =>
    new Promise<void>((done) => {
      if (requested.has(i)) return done();
      requested.add(i);
      const img = new Image();
      const finish = (ok: boolean) => {
        loading.delete(img);
        if (alive && ok) {
          frames[i] = img;
          draw();
        }
        done();
      };
      img.decoding = 'async';
      // onload, not img.decode(): Chromium rejects decode() when many are in flight at once.
      img.onload = () => finish(true);
      img.onerror = () => finish(false); // a failed frame is skipped, its neighbour stands in
      loading.add(img);
      img.src = src(i + 1);
    });

  let cursor = 0;
  const worker = async () => {
    while (alive && cursor < order.length) await load(order[cursor++]!);
  };
  env.onCleanup(() => {
    alive = false;
    observer.disconnect();
    for (const img of loading) img.src = '';
    loading.clear();
    frames.length = 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });

  // 4. Opening text, once on load. These are children of the block the scroll fades out,
  //    so the two animations never touch the same element.
  if (env.intro && intro.length) {
    gsap.from(intro, {
      autoAlpha: 0,
      y: 24,
      duration: MOTION.duration.reveal,
      ease: MOTION.ease.reveal,
      stagger: MOTION.stagger.loose,
      delay: 0.1,
      lazy: false,
    });
  }

  // 5. One scrubbed timeline. The empty tween makes it exactly one unit long, so every
  //    position and duration below reads as a share of the scroll.
  const timeline = gsap.timeline({
    defaults: { ease: MOTION.ease.scrub },
    scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true },
  });
  timeline.to({}, { duration: 1 }, 0);
  timeline.to(
    state,
    {
      frame: count - 1,
      duration: framesEnd,
      onUpdate: () => {
        wanted = Math.round(state.frame);
        draw();
      },
    },
    0,
  );
  if (out) timeline.to(out, { autoAlpha: 0, yPercent: -30, duration: 0.14 }, 0.02);
  if (scrim) timeline.to(scrim, { opacity: dim, duration: 0.16 }, framesEnd - 0.1);
  // If the gate's failsafe already put the closing text on screen, leave it there.
  if (into && !window.__motionShown?.has(into)) {
    timeline.fromTo(into, { autoAlpha: 0, y: 32 }, { autoAlpha: 1, y: 0, duration: 0.12, lazy: false }, framesEnd - 0.04);
  }

  // 6. Start loading a beat later, so the poster and the rest of the first paint go out
  //    first. If the page opened part-way down, fetch the frame under the reader first.
  gsap.delayedCall(0.1, () => {
    const at = Math.min(1, (timeline.scrollTrigger?.progress ?? 0) / framesEnd);
    void load(Math.round(at * (count - 1)));
    for (let n = 0; n < PARALLEL; n++) void worker();
  });
}
```

```ts
import { createMotion } from './motion/core';
import { scrollSequence } from './recipes/scroll-sequence';

const frame = (dir: string) => (i: number) => `/hero/${dir}/jet_${String(i).padStart(4, '0')}.webp`;
const hero = document.querySelector('[data-seq]');

createMotion(hero, (env) =>
  scrollSequence(hero!, env, {
    src: frame('desktop'),
    count: 120,
    small: { src: frame('phone'), count: 61 },
    focus: [0.43, 0.5], // keep the door in view on narrow screens at the start, centre by the end
  }),
);
```

As a Next.js or React client component:

```tsx
'use client';
import { useRef } from 'react';
import { useMotion } from '../motion/react';
import { scrollSequence } from '../recipes/scroll-sequence';

const frame = (dir: string) => (i: number) => `/hero/${dir}/jet_${String(i).padStart(4, '0')}.webp`;

export function SequenceHero({ lead, title }: { lead: string; title: string }) {
  const ref = useRef<HTMLElement>(null);
  useMotion(ref, (env) =>
    scrollSequence(ref.current!, env, {
      src: frame('desktop'),
      count: 120,
      small: { src: frame('phone'), count: 61 },
      focus: [0.43, 0.5],
    }),
  );
  return (
    <header ref={ref} data-seq className="relative h-svh w-full bg-neutral-950">
      <div data-seq-stage className="sticky top-0 h-svh w-full overflow-hidden">
        <picture>
          <source media="(max-width: 767px)" srcSet="/hero/poster-phone.jpg" />
          <img data-seq-poster src="/hero/poster-desktop.jpg" width={1600} height={900} fetchPriority="high"
            alt="A private jet on the apron at dusk, cabin door open and steps lit"
            className="absolute inset-0 h-full w-full object-cover object-[43%_50%]" />
        </picture>
        <canvas data-seq-canvas aria-hidden="true" className="invisible absolute inset-0 h-full w-full" />
        <div data-seq-scrim className="absolute inset-0 bg-black opacity-30" />
        <div className="relative z-10 grid h-full place-items-center px-6 text-center">
          <div data-seq-out className="self-end pb-[12svh]">
            <p data-seq-intro data-motion-hide className="mt-4 max-w-xl font-serif text-2xl md:text-4xl">{lead}</p>
          </div>
          <h1 data-seq-in data-motion-hide className="font-serif text-5xl tracking-tight md:text-8xl">{title}</h1>
        </div>
      </div>
    </header>
  );
}
```

Notes:

- The section is `h-svh` in the markup and the recipe makes it taller at run time. That is what lets it fall back to a still hero. Do not move the tall height into a class.
- The two text blocks share one grid cell only while the sequence runs. Without it they sit one above the other, so look at that layout as well (scripts off, or reduced motion).
- `[data-seq-intro]` elements are children of `[data-seq-out]`. The load intro and the scroll fade then act on different elements and never fight.
- The frame set is chosen once, at setup, and not through the `when` option. Swapping sixty images because a window was resized costs more than it gives. This is the one place the recipe steps around rule 9, on purpose.
- `focus` matters on portrait phones, where a 16:9 frame is cropped to a narrow strip. Set the poster's `object-position` to the same value as `focus[0]`. For a phone result that is more than a crop, make a second, vertical clip and pass it as `small`.
- `length` sets the pace. 350 suits a clip of 6 to 8 seconds. Below 250 the move feels rushed; above 450 people start to wonder whether the page is stuck.
- Frames load with `onload`. Do not switch to `img.decode()` in bulk: Chromium rejects it when many decodes are in flight.
- The canvas is drawn at up to twice the CSS size and no more. The frames do not hold more detail than that.
- One per page. This is the page's signature moment, so the sections after it should be quiet.

## 7. Checks before you report

Where a check needs a browser and you cannot open one, say that it is unverified.

- [ ] The build and the typecheck pass.
- [ ] The console is clean on load, on a full scroll down and back up, and on resize. No GSAP "target not found" warnings, no hydration or `removeChild` errors.
- [ ] Scripts disabled: all content is visible.
- [ ] Motion bundle blocked (block the script in dev tools and reload): gated content appears within about 2.5 seconds.
- [ ] Reduced motion on (dev tools, rendering panel): nothing moves, everything is visible, scrolling is native.
- [ ] 390 px wide with touch emulation: no sideways page scroll, no pinned sections, no pointer effects.
- [ ] First paint: intro text is never visible in its final position before it animates.
- [ ] Navigate away and back, or unmount and remount: `ScrollTrigger.getAll().length` returns to the same number and no `.pin-spacer` is left behind.
- [ ] Resize across the desktop breakpoint: intros do not replay, pinned rails appear and disappear cleanly.
- [ ] No `transition` utility or rule on any element GSAP animates.
- [ ] Every `data-motion-hide` element sits inside a scope passed to `createMotion`.
- [ ] Split text is static or keyed.
- [ ] Images in animated sections have explicit dimensions, so loading them does not shift the layout.
- [ ] Scroll sequence (6.9): the poster is frame 1, the frame count passed to the recipe matches the files, and the total weight of each frame set is in your report.

## 8. When something looks wrong

| Symptom | Likely cause | Fix |
|---|---|---|
| Intro text is visible for a moment, then jumps to its start and animates | A `from()` without `lazy: false`, or the element is missing `data-motion-hide` | Rules 5 and 2 |
| Text stays hidden for about 2.5 s, then appears with no animation | Its scope never reached `createMotion`: wrong ref, component not mounted, or the bundle failed | Check the scope (rule 2) |
| Triggers below a pinned section fire early or late | Positions were measured before late content arrived | The core re-measures and sorts by itself. Give images explicit dimensions, and never call `ScrollTrigger.refresh()` from a scroll or resize handler |
| Scrolling gets faster or jittery after route changes | A ticker callback or a second Lenis instance was left running | Start Lenis only through `startSmoothScroll`. A function added to `gsap.ticker` must be removed by the same reference |
| Text shows the old words after a state change | The framework re-rendered inside a split element | Rule 8 |
| `removeChild` or "not a child of this node" on unmount | A pinned element is a component root, or is being re-rendered | Rule 7 |
| Motion feels doubled or rubbery | A CSS `transition` on the same element | Remove it |
| Background showing at the edge of a parallax image | Scale too low for the shift | Scale of at least `1 + 2p` for a shift of `p` |
| Sections jump when the mobile address bar hides | `vh` units | `svh` units |
| Hydration warning about `<html>` attributes | The gate adds a class before hydration | `suppressHydrationWarning` on `<html>` |
| Elements overshoot wildly on an ease | An invalid CustomEase path | Cubic-bezier strings with both x values inside 0 to 1 |
| Everything replays when the window crosses a breakpoint | Breakpoint logic inside the main setup | Rule 9 |
| Scroll sequence: the poster never gives way to the moving picture | The frame URLs are wrong. Frames are numbered from 1 and the padding must match the file names | Open one frame URL in the browser, then fix `src` and `count` |
| Scroll sequence: the picture jumps when the canvas first appears | The poster is not the same picture as frame 1, or its `object-position` does not match `focus[0]` | Export the poster from frame 1 and match the two values |
| Scroll sequence: scrolling stutters | Frames larger than 1600 px wide, or too many of them | Re-export at the sizes in 6.9 |
| Scroll sequence: both text blocks show at once, one on top of the other | They are not direct children of the same grid container, so they cannot share a cell | Use the markup in 6.9 |

## 9. What was verified

Run for this version on 6 October 2026:

- 44 automated checks in Chromium against the plain-JS wiring and a React 19 StrictMode app. They cover every recipe, cleanup and repeated remounts, reduced motion including toggling it while the page is open, a 390 px touch viewport, scripts disabled, the bundle blocked, the bundle arriving after the failsafe, a setup that throws, a late layout shift, and crossing the desktop breakpoint.
- A Next.js 16.4 App Router app, as a production build and on the dev server: first paint, client-side navigation in both directions, the page transition, and a clean console.
- Importing every module on the server with no DOM.
- Strict TypeScript on all code in this file.

Added for 2.1 on 8 October 2026, for recipe 6.9 only:

- 79 automated checks in Chromium: 69 against the plain-JS wiring and 10 against a React 19 StrictMode app, using a real 120-frame set. They cover which frame is on the canvas at seven scroll positions, the text hand-off, wheel input through Lenis, cleanup and repeated remounts, destroying the section while frames are still loading, reduced motion including toggling it while the page is open, scripts disabled, the bundle blocked, the bundle arriving after the failsafe, a 390 px touch viewport, frames that fail to load, data saver, a reload part-way down the page, and resizing.
- The poster and the first canvas frame were compared at three screen shapes (1440 x 900, 1920 x 800 and a portrait phone) and line up to the pixel.
- Strict TypeScript on the recipe and the React component.
- The checks from 2.0 were not re-run, because sections 5 and 6.1 to 6.8 did not change.

Not run: the Astro, Vue and Svelte wiring, Safari and Firefox, and physical touch devices. Recipe 6.9 was also not run inside Next.js. Check those on first use, and re-run section 7 after upgrading gsap or lenis by a minor version or more.

One thing the 2.1 run turned up in the core, which also applies to 6.1: if someone has reduced motion on, opens the page, then turns reduced motion off while it is open, the load intro plays at that moment, because that is the first time the motion setup runs. Nothing ends up hidden. It is left as it is.

## 10. Loading this file (for the person, not the agent)

This file is tool-neutral. Two ways to use it with any agent:

- Keep it in the repo, for example at `docs/web-motion-engine.md`, and add one line to the agent's project instruction file (`CLAUDE.md`, `AGENTS.md`, `.cursor/rules` and so on): "For any animation or scroll work, read docs/web-motion-engine.md first and follow it."
- Or attach it at the start of a session and say "use this for the motion work".

When you update it, change the version line at the top and keep sections 5 and 6 in step with the code you actually ship.
