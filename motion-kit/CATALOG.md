# Web Motion Kit: Catalog

Every effect in the kit: what it looks like, the markup it needs, where its CSS is, how to wire it, and what it does on phones, with motion turned off, and with scripts off. Setup and the core are in [README.md](README.md); the rules are in [ENGINE.md](ENGINE.md).

**How every recipe works.** A recipe is a function in `recipes/`. It takes a scope element (the section), finds its `data-*` hooks inside it, and returns early if they are missing. You call it inside `createMotion`, which skips it under reduced motion, cleans it up when a `when` query stops matching, and reverts it if it throws:

```js
import { createMotion } from '../motion-kit/core/core.js';
import { someRecipe } from '../motion-kit/recipes/some-recipe.js';

const section = document.querySelector('.my-section');
createMotion(section, (env) => someRecipe(section, env, { /* options */ }), { when: '(min-width: 900px)' });
```

**How to read an entry.**
- **Driver:** *load* (plays once on page load), *once* (plays the first time it scrolls into view), *scrub* (tied to the scroll position, reverses on the way back), *sticky* (the section holds on screen while you scroll; CSS `position: sticky`, never a GSAP pin unless stated), *pointer* (follows the mouse; hover screens only), *time* (a loop).
- **CSS:** the file in `css/reference/` and the section heading inside it. The classes there carry El-Global prefixes; rename them, keep the rules. Rules marked *required* make the effect work; the rest is styling.
- **Needs:** extra scripts beyond gsap + ScrollTrigger + CustomEase (always required). *SplitText* = load `vendor/SplitText.min.js`. *Lenis* = call `startSmoothScroll()` (the recipe uses `getLenis()` to scroll smoothly, and falls back to native scrolling without it).
- **Gated:** the markup elements that must carry `data-motion-hide` (hero intros only).
- **Fallback:** what a visitor sees with reduced motion, scripts off, or on a phone.

---

## Index

| Effect | File | Driver | What it is | Phones |
|---|---|---|---|---|
| **Text and small effects** |||||
| [textReveal](#textreveal) | text.js | once | Heading lines rise out of a mask | same |
| [batchReveal](#batchreveal) | text.js | once | Blocks fade up in sequence | same |
| [wordLight](#wordlight) | text.js | scrub | Words light up as you read down | same |
| [wordGather](#wordgather) | text.js | scrub | Words close in from the edges | same |
| [rollNumbers](#rollnumbers) | text.js | once | Digits roll into place like a counter | same |
| [sweepIn / sweepOnEnter](#sweepin--sweeponenter) | gold-sweep.js | load / once | A gold-leaf light sweep reveals text | same |
| [highlight](#highlight) | frost.js | scrub | A highlighter stroke draws under a phrase | same |
| [magnetic](#magnetic) | magnetic.js | pointer | A button leans toward the cursor | off |
| [ticker](#ticker) | ticker.js | time | Seamless marquee, faster with scroll speed | same |
| [ledgerType](#ledgertype) | ledger-type.js | once | A line types itself out, then ticks | same |
| [flipCount](#flipcount) | stand-up.js | once | A number flips 0→N like a departure board | same |
| **Heroes (full-screen openers)** |||||
| [scrollSequence](#scrollsequence) | scroll-sequence.js | scrub, sticky | A filmed camera move played by the scroll (canvas frames) | lighter frames |
| [heroIntro](#herointro) | hero-intro.js | load, scrub | Lines rise, parts fade, copy lifts away on scroll | same |
| [heroFrame](#heroframe) | hero-frame.js | load, scrub | Photo opens from a postcard; words flip up in 3D | same |
| [markIntro](#markintro) | mark-intro.js | load | A logo drawn as the page loader, then glides into the hero | same |
| [mergeHero](#mergehero) | merge-hero.js | load, scrub | Photo halves slide together on a gold seam; lines meet | same |
| [mosaicHero](#mosaichero) | mosaic-hero.js | load, time, scrub | Photo as a tile grid flipping through several images | same |
| [maskZoom](#maskzoom) | mask-zoom.js | load, scrub | Fly through giant text cut out of black | same |
| [typeHero](#typehero) | type-hero.js | load, scrub | Heading types itself out; a pen stroke underlines a word | same |
| **Image and block reveals** |||||
| [imageOpen](#imageopen) | image-open.js | scrub | A picture opens from a narrow slit | same |
| [shutters](#shutters) | shutters.js | scrub | A photo opens like window shutters | same |
| [unfrost](#unfrost) | frost.js | scrub | A photo comes out of frosted glass | same |
| [standUp](#standup) | stand-up.js | scrub | A photo stands up from lying flat | same |
| [develop](#develop) | develop.js | scrub | A portrait develops like a darkroom print | same |
| [redact](#redact) | redact.js | scrub | Redaction bars draw back off each line | same |
| [blockWipe](#blockwipe) | block-wipe.js | once | A coloured block sweeps across and reveals a card | same |
| [cardReveal](#cardreveal) | card-reveal.js | once | Picture cards open from the bottom edge | same |
| **Sticky and pinned storytelling sections** |||||
| [foldStack](#foldstack) | fold-stack.js | scrub, sticky | Images peel off like paper (WebGL page curl) | same |
| [sideRail](#siderail) | side-rail.js | scrub, sticky | A row of panels slides sideways | same |
| [partOpen](#partopen) | part-open.js | scrub, sticky | A heading parts while a picture opens between its words | stacks vertically |
| [indexList / indexFigures](#indexlist--indexfigures) | index-list.js | scroll position, sticky | Numbered list beside a picture that wipes to the active row | each row's own picture |
| [dotPipe](#dotpipe) | dot-pipe.js | scrub, sticky | A dot field redraws itself as each step's symbol | same |
| [windowPortal](#windowportal) | window-portal.js | scrub, sticky | Scroll through an aircraft window into the next scene | same |
| [cardDeck](#carddeck) | card-deck.js | scrub, sticky | A fanned deck: each card opens, then flies off | swipe row |
| [diptych](#diptych) | diptych.js | scrub, sticky | Two full-screen panels; a diagonal wipe swaps them | two cards |
| [stack / stepsRise / closingStamp](#stack--stepsrise--closingstamp) | stack.js | scrub, sticky | Steps stack like papers; a progress meter; a stamp lands | steps rise |
| [mintCoin](#mintcoin) | mint-coin.js | scrub, sticky / tap | A 3D coin turns through eight faces | arrows, tap, swipe |
| **Lists, cards and grids** |||||
| [spotList](#spotlist) | spot-list.js | scroll position | The item in the middle of the screen is lit and open | same |
| [strips](#strips) | strips.js | scroll position, pointer | Expanding vertical strips, one open at a time | cards |
| [assemble / spotlight](#assemble--spotlight) | assemble.js | scrub, pointer | Cards settle from a scatter; a light follows the cursor | no light |
| [dealCards / dealTilt](#dealcards--dealtilt) | deal-cards.js | once, pointer | Cards are dealt upright; titles decode; tilt on hover | no tilt |
| [coinFlip / coinsMotion / coinsHover](#coinflip--coinsmotion--coinshover) | coins.js | once, pointer, click | Two-faced cards spin in and turn over | tap to turn |
| [doors](#doors) | doors.js | scrub | Each step sits behind a door that swings open | same |
| [rings](#rings) | rings.js | scrub | A ring closes round each step's number | same |
| [flightPath](#flightpath) | flight-path.js | scrub | A line draws through steps with a plane on its tip | vertical |
| [oneInHundred](#oneinhundred) | one-in-hundred.js | scrub, once | 100 dots grow; 99 dim, one glows | same |
| [marketBoard / marketPeek](#marketboard--marketpeek) | market-board.js | once, pointer | Board rows draw in; a photo follows the cursor | photos in rows |
| [typeSlide](#typeslide) | type-slide.js | scrub | Big-type names slide in from alternating sides | same |
| [dragRail](#dragrail) | drag-rail.js | pointer, once | A row you grab and throw; it glides and snaps | native swipe |
| [orbit](#orbit) | orbit.js | time, pointer | Cards orbit a centre; pointing pauses and shows one | plain cards |
| [checker / checkerLight](#checker--checkerlight) | checker.js | once, pointer | A chessboard turns over in a wave; tiles light | no light |
| **Data and diagrams** |||||
| [routeMap](#routemap) | route-map.js | once, time | A dotted world map draws routes and drops pins | same |
| [chainMine / chainPulse](#chainmine--chainpulse) | chain-mine.js | once, time | Blocks are mined one by one; a light runs the chain | no light |
| [keyhole / keyholeFollow](#keyhole--keyholefollow) | keyhole.js | scrub, pointer | A circle of vivid photo opens over a dark copy | opens fully |
| [fraction / fractionMotion](#fraction--fractionmotion) | fraction.js | input, once | A slider lights cells of a photo grid | same |
| **Interactive tools (work without motion)** |||||
| [valuationTool / valuationIntro](#valuationtool--valuationintro) | valuation.js | submit, once | A form computes a range; scan + count-up | same |
| [enquiryForm](#enquiryform) | enquiry-form.js | submit | Honest form: real POST, inline errors, fallback email | same |
| [formChain](#formchain) | form-chain.js | input | A progress chain lights a node per valid field | same |
| [clocks](#clocks) | clocks.js | time | Live local time and office hours per city | same |
| **Page furniture** |||||
| [overlayNav / preloaderLifted](#overlaynav--preloaderlifted) | core/chrome.js | scroll | Transparent navbar over a hero; wait for a loader | same |

---

## Lessons (read before building)

These cost real debugging time on El-Global. Each is a rule now.

1. **A layout that changes the page height belongs in CSS, not in a class a script adds.** The browser restores a reload's scroll position before scripts run; if a script then makes a section taller (a sticky stack, an orbit), scroll anchoring jumps the page by the difference. Put such layouts behind `@media (min-width: …) and (prefers-reduced-motion: no-preference) { html.js … }`. *stack*, *mintCoin* and *orbit* do this.
2. **ScrollTrigger measures sticky elements where they are stuck.** Trigger on a non-sticky marker in the flow (stack.js inserts `.er-stack-mark` elements for this).
3. **`offsetLeft` counts from the nearest positioned ancestor, and `scrollWidth` counts transforms.** Measure a moving row from its cards' layout boxes (drag-rail.js).
4. **SplitText line masks clip descenders** (g, y) at tight line heights: revert the split once the reveal ends (`textReveal` does).
5. **When SplitText reverts, it restores the HTML as it was when split** — including any start state you had set on a child (type-hero redraws its underline after the revert).
6. **Stroke drawing:** `pathLength="1"` with a dash of 1 rounds to whole pixels and jumps. Use the real `getTotalLength()` (rings.js, type-hero.js). `vector-effect: non-scaling-stroke` breaks dashes.
7. **GSAP will not interpolate clip-path polygons with round values (100%).** Drive the shape from one CSS variable instead (`--wipe-top` in diptych).
8. **No CSS `transition` on any property GSAP animates** on that element. Where a card has a hover lift, animate an inner layer or a wrapper.
9. **An invisible element (`visibility: hidden`) cannot take focus.** Fade a panel you must focus with `opacity`, not `autoAlpha`.
10. **A canvas that draws images from another domain** needs `crossorigin="anonymous"` on them, or reading its pixels throws.
11. **Old site scripts can collide with hook names.** On El-Global, `main.js` faked form success on `form[data-ajax]` and counted up every `[data-count]`. Check for global handlers before choosing a hook name.
12. **Phones never pin.** Sticky layouts and pinned rails run behind a `when` query; below it, give a plain layout (cards, a native swipe row).
13. **Test at laptop heights (1366×657, 1280×600), not just 1440×900.** A tall hero block slid under the navbar there and went unnoticed.

---

## Text and small effects

### textReveal

**Looks like:** a heading's lines rise up out of an invisible mask, one after another, the first time it scrolls into view. Afterwards the heading goes back to plain text (so descenders are never clipped and it reflows on resize).
**File:** `recipes/text.js` · `textReveal(scope, env)` · **Needs:** SplitText · **Driver:** once (`top 88%`)

```html
<h2 data-reveal-text>Each residence is chosen for what cannot be built again.</h2>
```

```js
import { textReveal } from '../motion-kit/recipes/text.js';
createMotion(main, (env) => textReveal(main, env));   // one call covers every [data-reveal-text] inside main
```

**CSS:** none. **Fallback:** the heading as it is. **Tip:** El-Global tags every section `h2` automatically: `main.querySelectorAll('section h2').forEach(h => h.setAttribute('data-reveal-text', ''))` before calling it, skipping headings marked `data-own-motion`.

### batchReveal

**Looks like:** blocks (cards, list items) fade and rise 36 px into place, in sequence, as each group scrolls in.
**File:** `recipes/text.js` · `batchReveal(scope)` · **Driver:** once (`top 90%`, ScrollTrigger.batch)

```html
<div class="grid"><article data-reveal>…</article><article data-reveal>…</article></div>
```

```js
createMotion(section, () => batchReveal(section));
```

**CSS:** none (keep CSS transitions off `[data-reveal]` elements). **Fallback:** visible.

### wordLight

**Looks like:** a quote or lead paragraph starts dim (16% opacity) and its words light up one after another as it crosses the screen. Scrubbed: scrolling back dims them.
**File:** `recipes/text.js` · `wordLight(scope, env)` · **Needs:** SplitText · **Driver:** scrub (`top 82%` → `bottom 58%`)

```html
<p data-word-light>Never settle. Every detail reflects our commitment to the exceptional.</p>
```

```js
createMotion(section, (env) => wordLight(section, env));
```

### wordGather

**Looks like:** a paragraph's words start pushed outwards from the centre of their line (and faded) and close up into place as it rises. Feels like the sentence assembling.
**File:** `recipes/text.js` · `wordGather(scope, env)` · **Needs:** SplitText · **Driver:** scrub (`top 95%` → `top 50%`)

```html
<section class="motion-clip-x"><p data-word-gather="0.6">Bridging innovation and impact…</p></section>
```

`data-word-gather` value = spread (default 0.6). **CSS:** put `.motion-clip-x` (in motion-base.css) on the section so the spread words never widen the page.

### rollNumbers

**Looks like:** each digit of a number rolls up through a full turn 0–9 and lands on its value, like a mechanical counter; symbols ($, %, +, K) fade in around them. The real text stays in `aria-label`.
**File:** `recipes/text.js` · `rollNumbers(scope, env)` · **Driver:** once (`top 92%`)

```html
<span class="stat" data-roll>$1K</span>  <span class="stat" data-roll>24/7</span>  <span class="stat" data-roll>100%</span>
```

```js
createMotion(section, (env) => rollNumbers(section, env));
```

**CSS (required):** section 3 of `css/motion-base.css` (`.roll`, `.roll-col`, `.roll-strip`). Give the number a flat colour: gradient text cannot show the rolling columns.

### sweepIn / sweepOnEnter

**Looks like:** text revealed left to right by a soft-edged mask, as if a sheet of gold light were drawn across it.
**File:** `recipes/gold-sweep.js` · `sweepIn(el, gsapVars)` returns a tween (for intros/timelines) · `sweepOnEnter(scope)` plays every `[data-sweep-enter]` once (`top 85%`).

```html
<h1 data-sweep>Exclusive Investments</h1>                         <!-- played by your intro: sweepIn(h1) -->
<h2 data-sweep data-sweep-enter>Join the 1%</h2>                   <!-- plays when scrolled to -->
```

```js
import { sweepIn, sweepOnEnter } from '../motion-kit/recipes/gold-sweep.js';
createMotion(cta, () => sweepOnEnter(cta));
// in an intro timeline: tl.add(sweepIn(heading, { duration: 1.4 }), 0.3);
```

**CSS (required),** from `css/reference/op.css` → section "Hero":

```css
[data-sweep] {
  -webkit-mask-image: linear-gradient(90deg, #000 calc(var(--sweep, 1) * 130% - 30%), transparent calc(var(--sweep, 1) * 130%));
  mask-image: linear-gradient(90deg, #000 calc(var(--sweep, 1) * 130% - 30%), transparent calc(var(--sweep, 1) * 130%));
}
```

`--sweep` defaults to 1, so the text is whole without scripts. If a page heading is also given `textReveal` by a site-wide call, mark it `data-own-motion` and skip it there.

### highlight

**Looks like:** a translucent gold highlighter band draws itself under a phrase from left to right as you read down. Wraps across lines.
**File:** `recipes/frost.js` · `highlight(scope)` · **Driver:** scrub (`top 82%` → `top 58%`)

```html
<p>We give clients access <span class="hl" data-highlight>beyond traditional portfolios</span>.</p>
```

**CSS (required),** from `css/reference/op.css` → `.op-hl` (section "The Division"):

```css
.hl {
  background: linear-gradient(transparent 48%, rgba(201,168,76,.32) 48%, rgba(201,168,76,.32) 96%, transparent 96%) no-repeat 0 0 / 100% 100%;
  padding: 0 .12em; margin: 0 -.12em;
  -webkit-box-decoration-break: clone; box-decoration-break: clone;
}
```

Only `background-size` moves (0% → 100%); without scripts the band is whole.

### magnetic

**Looks like:** a button leans toward the cursor while it is over it, and springs back when it leaves (engine 6.6).
**File:** `recipes/magnetic.js` · `magnetic(scope, env, strength = 0.35)` · **Driver:** pointer

```html
<span class="magnet" data-magnetic><a class="btn" href="/contact">Book a consultation</a></span>
```

```js
createMotion(cta, (env) => magnetic(cta, env, 0.18), { when: 'hover' });   // never on touch
```

**CSS:** `.magnet { display: inline-block; }`. Put `data-magnetic` on a **wrapper**, so the button keeps its own hover transitions (one job per element). 0.18 felt premium on El-Global; 0.35 is playful.

### ticker

**Looks like:** a seamless strip of words drifting sideways (a market ticker); runs only while on screen and speeds up briefly with scroll velocity (engine 6.5).
**File:** `recipes/ticker.js` · `ticker(scope, env, speed = 60)` (px per second) · **Driver:** time

```html
<div class="ticker" data-marquee aria-hidden="true">
  <div class="ticker-row">
    <div class="ticker-track" data-marquee-track>
      <span class="ticker-item">Sell-Side Advisory</span>
      <span class="ticker-item">Buy-Side Advisory</span>
      <span class="ticker-item">Due Diligence</span>
    </div>
  </div>
</div>
```

```js
createMotion(band, (env) => ticker(band, env, 26));   // 26 = slow and quiet
```

**CSS (required),** `css/reference/elrock.css` → "Services ticker under the hero": the row and track wrap and centre by default; `.is-ticking` (added by the recipe) switches them to one `nowrap` line. Spacing goes on the items (`padding-right`), never a flex `gap`, so the cloned copy lines up seamlessly. **Fallback:** the words wrap and sit still.

### ledgerType

**Looks like:** a short record line (e.g. `verified on-chain · 0x4b1d…f83a`) is cleared and typed out character by character with a blinking block caret when its card scrolls in; then the caret goes and a check mark pops in.
**File:** `recipes/ledger-type.js` · `ledgerType(scope, env)` · **Driver:** once (`top 80%`, cards stagger 0.25 s)

```html
<article data-type-card>
  …
  <div class="ledger"><span class="ledger-line" data-type>verified on-chain · 0x4b1d…f83a</span>
    <svg class="ledger-check" data-type-check viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor"/></svg></div>
</article>
```

**CSS:** `css/reference/token.css` → "Trust: ledger lines" (`.te-ledger`, `.is-typing::after` caret with `@keyframes teCaret`). The typed text keeps an `aria-label` with the full line while typing.

### flipCount

**Looks like:** a number flips through every digit from 0 up to its value (each digit tips over on its X axis), landing with a small bounce — a departure board.
**File:** `recipes/stand-up.js` · `flipCount(scope, env)` · **Driver:** once (`top 85%`)

```html
<div class="figure" data-flip>5</div>   <!-- integers; reads its own text as the target -->
```

**CSS:** `css/reference/about.css` → `.ab-flap` (inline-block, transform-origin) and `.has-flap` (flat colour while flipping: a 3D-turning child cannot keep `background-clip: text` gradients).

---

## Heroes (full-screen openers)

All heroes share a shape. The section is `100svh` tall (`min-height` ~600px), its copy sits low in the frame (`justify-content: flex-end` with `padding-bottom: clamp(32px, 7svh, 80px)`), and the navbar floats over it with `overlayNav(hero)`. Every text part of the intro carries `data-motion-hide` (the gate hides it until GSAP has its start state). Intros that should not play behind a loader take `{ ready: preloaderLifted() }`; they also wait for `document.fonts.ready`, never longer than about 3 s. On scroll, the copy lifts away (a wrapper animates, never the parts the intro animated: one job per element).

**Keep a hero light:** a two-line heading, one line of description, one action or a slim chapter row. Measure the heading's top against the navbar at 1366×657 and 1280×600.

```js
import { overlayNav, preloaderLifted } from '../motion-kit/core/chrome.js';
const hero = document.querySelector('.hero');
overlayNav(hero);                                    // transparent navbar while over the hero
createMotion(hero, (env) => heroXxx(hero, env, { ready: preloaderLifted() }));
// This createMotion must run BEFORE any other createMotion whose scope contains the hero.
```

### scrollSequence

**Looks like:** a filmed (or rendered) camera move played by the scroll: the section holds on screen while you scroll and a canvas draws frame N of the clip; an opening block fades out early and a closing headline arrives over the last frames. El-Global: the jet on the apron, up the stairs, into the cabin, "Welcome to the 1%".
**File:** `recipes/scroll-sequence.js` · `scrollSequence(scope, env, options)` · **Driver:** scrub, sticky (CSS) · **Needs:** a frame set (WebP stills)

This is ENGINE.md recipe 6.9, ported to plain JS. **Read ENGINE.md 6.9 in full**: frame preparation with ffmpeg, the markup, the poster rule (the poster must be frame 1 exactly), sizes (120 desktop frames ≈ 4.3 MB, 61 phone frames ≈ 1.6 MB). Kit additions over 6.9: `ready` (the opening intro waits for this promise, e.g. the preloader lifting) and frame loading waits for the window `load` event.

```js
const frame = (dir) => (i) => `img/hero/${dir}/jet_${String(i).padStart(4, '0')}.webp`;
createMotion(hero, (env) => scrollSequence(hero, env, {
  src: frame('desktop'), count: 120,
  small: { src: frame('phone'), count: 61 },      // phones (≤767px) get the lighter set
  focus: [0.43, 0.5],                              // horizontal crop focus at first/last frame
  length: 350,                                     // section height in svh while running (250-450)
  framesEnd: 0.85,                                 // share of the scroll the frames take
  dim: 0.5,                                        // scrim opacity behind the closing text
  ready: preloaderLifted(),
}));
```

**CSS:** `css/reference/inline-homepage.css` → "HERO — Jet scroll sequence" (`.seq-hero`, `.seq-stage` sticky, `.seq-copy` grid, `.seq-out`, `.seq-title`, and the opening-block styles `.seq-statement`, `.seq-value`, `.seq-cta`). **Fallback:** scripts off, reduced motion or data saver → the poster as a still hero, one screen tall, both text blocks stacked.

### heroIntro

**Looks like:** the copy arrives in order — small parts (eyebrow, pills) fade up, the heading and subheading rise out of a mask line by line — then the whole copy block lifts and fades as you scroll away. Works over a photo or a looping background video.
**File:** `recipes/hero-intro.js` · `heroIntro(scope, env, { ready })` · **Needs:** SplitText · **Driver:** load, scrub

```html
<section class="hero">
  <div class="hero-bg"><video autoplay muted loop playsinline poster="poster.webp"><source src="hero.mp4" type="video/mp4"></video></div>
  <div class="hero-content container" data-hero-copy>
    <div class="eyebrow" data-hero-fade data-motion-hide>Jet-El</div>
    <h1 data-hero-lines data-motion-hide>Private Aviation<br><em>Portfolio</em></h1>
    <p data-hero-lines data-motion-hide>Strategic aviation asset advisory…</p>
    <div class="pills" data-hero-fade data-motion-hide><a href="#charter">Charter</a>…</div>
  </div>
</section>
```

**CSS:** `css/reference/inline-jet-el.css` (`.jetel-hero*`). **Video tip:** compress to 1080p H.264 (El-Global: 3.5 MB), `preload="metadata"`, poster = the video's first frame.

### heroFrame

**Looks like:** the photo starts as a framed postcard in the middle of a dark screen and opens out to full bleed; the heading's words flip up in 3D one after another, the subheading comes into focus line by line (blur → sharp), small parts pop in. On scroll the copy parts in depth (each block drifts up at its own speed).
**File:** `recipes/hero-frame.js` · `heroFrame(scope, env, { ready })` · **Needs:** SplitText · **Driver:** load, scrub

```html
<section class="hero">
  <div class="hero-bg"><img data-hero-frame src="pool.webp" alt="…"></div>
  <div class="hero-content container">
    <div data-hero-depth="0.55">
      <div class="eyebrow" data-hero-part="fade" data-motion-hide>H&amp;L</div>
      <h1 data-hero-part="words" data-motion-hide>Hotels &amp; Luxury <em>Real Estate</em></h1>
    </div>
    <div data-hero-depth="0.3"><p data-hero-part="focus" data-motion-hide>Portfolio-grade hotel acquisitions…</p></div>
    <div data-hero-depth="0.15"><div data-hero-part="pop" data-motion-hide><a>Hotels</a><a>Real Estate</a></div></div>
  </div>
</section>
```

`data-hero-part`: `fade` | `words` (3D flip) | `focus` (lines blur in) | `pop` (children scale in). `data-hero-depth` = how far that block drifts, as a share of the screen height. **CSS:** `css/reference/hl.css` → "Hero".

### markIntro

**Looks like:** the page loader is the brand mark itself: "The 1%" is drawn in gold line letter by letter, fills in, then the curtain lifts off the photo while the mark glides down into the hero (where the same lettering sits as the eyebrow). Then the heading is revealed by a gold-leaf sweep, the description written on line by line, the pills rise. A click, scroll or key skips to the handover. On scroll the photo dollies in and the copy recedes.
**File:** `recipes/mark-intro.js` · `markIntro(scope, env)` · **Needs:** SplitText; `gold-sweep.js` · **Driver:** load, scrub

**Visit modes** (picked before first paint by an inline `<head>` script, stored as `html[data-mark]`): `full` on a first visit and on reload, `quick` (a short glide) when the page is reached again in the same visit, `none` on Back/Forward and with reduced motion.

```html
<script>
  (function (d) {
    var mode = 'full';
    try {
      var nav = performance.getEntriesByType('navigation')[0];
      var type = nav ? nav.type : 'navigate';
      if (type === 'back_forward') mode = 'none';
      else if (type !== 'reload' && sessionStorage.getItem('op-mark') === '1') mode = 'quick';
    } catch (e) {}
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) mode = 'none';
    d.setAttribute('data-mark', mode);
  })(document.documentElement);
</script>
```

Markup (inside the hero): `[data-mark-overlay]` (fixed curtain: `.op-mark-curtain`, `.op-mark-ink` holding the SVG, `.op-mark-skip`), `[data-hero-photo]`, `[data-hero-copy]` holding `[data-mark-target]` (the same SVG + an `.sr-only` text), `h1[data-sweep]`, `p[data-ink-lines]`, `[data-rise]` (pills); all four copy parts carry `data-motion-hide`. The SVG letters are `.mark-glyph` paths with `pathLength="1"`; **generate them for any word and font with `tools/text_to_svg_paths.py`** (see its docstring). The recipe swaps `pathLength` for real stroke lengths before drawing (Lessons 6). The session key `op-mark` is set when the mark has played; rename it per site.

**CSS:** `css/reference/op.css` → "The mark" (overlay shown only for `html.js[data-mark="full"|"quick"]`, plus a CSS failsafe that fades the curtain after 2.2 s if the script never runs) and "Hero". Hide the site's own preloader on this page.

### mergeHero

**Looks like:** the photo is cut down the middle and the two halves slide together until they close on a gold seam that flares and fades; the heading's lines come in from opposite sides and meet; the description follows; a slim chapter row along the bottom draws its rule and its items rise. M&A, partnerships, "two become one".
**File:** `recipes/merge-hero.js` · `mergeHero(scope, env, { ready })` · **Driver:** load, scrub · The intro also waits for the photo to decode.

```html
<section class="hero">
  <div class="hero-bg">
    <div class="half half-l" data-merge-half="-1"><img src="towers.webp" alt="…"></div>
    <div class="half half-r" data-merge-half="1" aria-hidden="true"><img src="towers.webp" alt=""></div>
    <div class="seam" data-merge-seam aria-hidden="true"></div>
  </div>
  <div class="hero-copy container" data-merge-copy>
    <h1 data-merge-part="lines" data-motion-hide>
      <span class="line" data-merge-from="-1">Mergers &amp;</span>
      <span class="line" data-merge-from="1"><em>Acquisitions</em></span>
    </h1>
    <p data-merge-part="desc" data-motion-hide>M&amp;A advisory for high-value transactions…</p>
  </div>
  <nav class="index container" data-merge-index aria-label="On this page">
    <div class="index-rule" data-merge-rule data-motion-hide></div>
    <ol data-motion-hide><li data-merge-item><a href="#services">01 Advisory</a></li>…</ol>
  </nav>
</section>
```

`data-merge-from`: `-1` left, `1` right, `0` rises from below. **CSS:** `css/reference/elrock.css` → "Hero" (halves are `clip-path: inset(0 50% 0 0)` / `inset(0 0 0 50%)`, so without scripts they form one photo). **Do not** part the halves on scroll: a gap reads as a broken photo.

### mosaicHero

**Looks like:** the full-screen photo is drawn as a grid of tiles with hairline seams, one tile per "token". Every few seconds the tiles flip in a diagonal wave (with a gold glint mid-turn) to the next image in the set; the first image is "minted" out of black on load; the heading's letters arrive in random order. A row of tabs along the bottom names the images, fills a progress bar while each holds, and on hover screens pointing at a tab turns the mosaic to it. On scroll the picture fractures: gaps open and tiles shrink back.
**File:** `recipes/mosaic-hero.js` · `mosaicHero(scope, env, { ready })` · **Needs:** SplitText · **Driver:** load, time, pointer, scrub. Pauses off screen and in a hidden tab; respects data saver.

```html
<section class="hero">
  <div class="hero-bg">
    <img class="poster" data-mosaic-poster data-motion-hide crossorigin="anonymous" src="jet.webp" alt="…">
    <canvas data-mosaic-canvas aria-hidden="true"></canvas>
  </div>
  <div class="hero-copy container" data-mosaic-copy>
    <h1 data-mosaic-title data-motion-hide>The Future of <em>Asset Tokenization</em></h1>
    <p data-mosaic-part data-motion-hide>Fractional ownership of…</p>
  </div>
  <nav class="tabs container" data-mosaic-index>
    <ol data-motion-hide>
      <li><a href="#jets" data-mosaic-tab data-src="jet.webp" data-focus="50 62"><span data-mosaic-bar></span>01 Private Jets</a></li>
      <li><a href="#yachts" data-mosaic-tab data-src="yacht.webp" data-focus="50 55"><span data-mosaic-bar></span>02 Superyachts</a></li>
    </ol>
  </nav>
</section>
```

The first tab's image must be the poster. `data-focus="x y"` = crop focus in percent. Images on another domain need `crossorigin="anonymous"` (Lessons 10). Tunables at the top of the file: `HOLD` (5.2 s), `TURN` (1.5 s), `SPREAD`, tile size (112 px desktop, 78 px phone). **CSS:** `css/reference/token.css` → "Hero: the asset mosaic".

### maskZoom

**Looks like:** the page opens black with a giant word cut out of it (El-Global: "1%"), the photo showing through the letters, a fine gold outline round them; the camera then dives through the first letter — the cut-out scales up until it is wider than the screen — the photo eases back from a zoom, and the heading lands.
**File:** `recipes/mask-zoom.js` · `maskZoom(scope, env, { ready })` · **Driver:** load, scrub

```html
<svg class="mask" data-mask aria-hidden="true">
  <defs><mask id="hole" maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
    <rect width="100%" height="100%" fill="#fff"/>
    <g data-mask-type><text x="50%" y="52%" text-anchor="middle" dominant-baseline="central" fill="#000">1%</text></g>
  </mask></defs>
  <rect width="100%" height="100%" fill="#050505" mask="url(#hole)"/>
  <g class="mask-outline" data-mask-line><text x="50%" y="52%" text-anchor="middle" dominant-baseline="central">1%</text></g>
</svg>
<!-- the photo: <img data-mask-photo>; copy: [data-mask-copy] with h1 lines [data-mask-line-rise], [data-mask-part]s, and [data-mask-index] -->
```

The dive point is the centre of the first character (measured with `getExtentOfChar(0)`), and the zoom distance is computed from its stem width. **CSS (required):** `css/reference/about.css` → "Hero" — `.ab-mask` shows only under `html.js`, hides under reduced motion, and fades itself after 2.8 s if the script never runs; the text size is `min(78svh, 64vw)`, weight 800.

### typeHero

**Looks like:** the heading types itself out letter by letter with a gold caret leading it (a beat longer between words), like a message being written; the caret blinks twice and goes; then a gold pen stroke draws under the key word. Description and chapter row follow.
**File:** `recipes/type-hero.js` · `typeHero(scope, env, { ready })` · **Needs:** SplitText · **Driver:** load, scrub

```html
<h1 data-type-title data-motion-hide>
  <span class="line">Let's Start a</span>
  <span class="line"><span class="mark"><em>Conversation</em><svg class="underline" viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden="true"><path data-type-stroke d="M4 13 C 60 6, 120 4, 180 8 S 270 15, 296 7"/></svg></span></span>
</h1>
<!-- wrapper [data-type-copy]; parts [data-type-part data-motion-hide]; chapter row [data-type-index] -->
```

**CSS:** `css/reference/contact.css` → "Hero" (`.ct-mark` relative, `.ct-underline` absolute under the word, shown only under `html.js`; `.ct-caret` with its blink keyframes). The recipe re-draws the underline after SplitText reverts (Lessons 5).

---

## Image and block reveals

All scrubbed ones reverse on the way back up. Each animates only one layer (the image, a wrapper or a pseudo-element), so the element's own hover transitions keep working.

### imageOpen

**Looks like:** a picture opens out of a narrow vertical slit to its full width as it scrolls into view, and settles from a slight zoom while it crosses the screen.
**File:** `recipes/image-open.js` · `imageOpen(scope)` · **Driver:** scrub

```html
<figure data-open><div class="win" data-open-win><img src="jet.webp" alt="…"></div></figure>
```

Only the window's `clip-path` and the image's `scale` move. **CSS:** `css/reference/jetel.css` → "The Division" (`.win { overflow: hidden }`, image cover).

### shutters

**Looks like:** a photo opens like window shutters: horizontal slats, each showing its band of the photo, swing down from closed one after another.
**File:** `recipes/shutters.js` · `shutters(scope, env, { slats = 7 })` · **Driver:** scrub

```html
<figure class="photo" data-shutters><img src="hotel.webp" alt="…"></figure>
```

The recipe lays aria-hidden slat copies over the image (fetched once) and hides the original while they are there; the original keeps the alt. Adds `.is-shutters`. **CSS:** `css/reference/hl.css` → "The Division: the photo opens like window shutters".

### unfrost

**Looks like:** a photo starts behind frosted glass (blurred 18 px, dimmed, slightly enlarged) and comes clear as it scrolls into view.
**File:** `recipes/frost.js` · `unfrost(scope)` · **Driver:** scrub (`top 90%` → `center 64%`)

```html
<figure data-frost><img src="marina.webp" alt="…"></figure>
```

Only the image's `filter` and `scale` move (one large layer, so the filter cost is fine). Pairs with `highlight` from the same file. **CSS:** `css/reference/op.css` → "The Division".

### standUp

**Looks like:** a photo starts lying back on its bottom edge (tipped 32° in 3D) and stands up as it scrolls in.
**File:** `recipes/stand-up.js` · `standUp(scope)` · **Driver:** scrub (`top 95%` → `top 40%`)

```html
<div class="story-image"><div class="frame" data-stand><img src="tower.webp" alt="…"></div></div>
```

Animate a frame around the image (the image may keep a hover zoom). **CSS:** `.frame { transform-origin: 50% 100%; }` (`css/reference/about.css` → "Our Story").

### develop

**Looks like:** a portrait develops like a darkroom print: it starts washed out, warm and soft (bright, sepia, blurred) and comes up to full clarity; a gold rule under the name draws across.
**File:** `recipes/develop.js` · `develop(scope)` · **Driver:** scrub

```html
<div class="portrait" data-develop><img src="founder.png" alt="…"></div>
<div class="rule" data-develop-rule></div>    <!-- optional; transform-origin: 0 50% -->
```

The filter goes on the frame, not the photo. **CSS:** `css/reference/about.css` → "The Founder".

### redact

**Looks like:** a paragraph starts as a redacted document — every line covered by a solid bar — and the bars draw back one after another as you scroll, revealing the words. Optional photo that opens from its top edge.
**File:** `recipes/redact.js` · `redact(scope, env)` · **Needs:** SplitText · **Driver:** scrub

```html
<p data-redact>El&amp;Rock is El-Global's mergers and acquisitions advisory division…</p>
<div class="photo" data-redact-photo><img src="boardroom.webp" alt="…"></div>
```

**CSS (required):** `css/reference/elrock.css` → "The Division: the copy is declassified":

```css
.er-redact-line { position: relative; width: fit-content; max-width: 100%; }   /* SplitText's linesClass */
.er-redact-line::after {
  content: ''; position: absolute; left: -3px; right: -3px; top: 12%; bottom: 8%;
  background: #d8d2c3; transform: scaleX(var(--redact, 1)); transform-origin: 100% 50%; pointer-events: none;
}
```

Only `--redact` (1 covered → 0 open) moves per line. Without scripts there is no split and no bar.

### blockWipe

**Looks like:** a block of colour (gold gradient) sweeps across each card from the left, the picture and words appear behind it, and the block leaves to the right. Cards entering together go one after another.
**File:** `recipes/block-wipe.js` · `blockWipe(scope, env)` · **Driver:** once (`top 85%`, batch)

```html
<div class="office-card" data-wipe>
  <div class="bg"><img src="london.webp" alt="…"></div><div class="overlay"></div><div class="content">…</div>
</div>
```

The block is created by the recipe. **CSS:** `css/reference/contact.css` → "Offices" (`.ct-block`: absolute, `z-index` above, `transform: scaleX(0)`; the card needs `position: relative; overflow: hidden`).

### cardReveal

**Looks like:** picture cards open from the bottom edge as they scroll in, a few at a time, with their text rising after the picture.
**File:** `recipes/card-reveal.js` · `cardReveal(scope)` · **Driver:** once

```html
<div class="city-card" data-city><div class="city-card-bg"><img …></div><div class="city-card-content">…</div></div>
```

Animates `.city-card-bg` and `.city-card-content` (class names are part of the hook), never the card, which keeps its hover transition. **CSS:** `css/reference/presence.css` → "City cards".

---

## Sticky and pinned storytelling sections

These hold the screen while you scroll and play a sequence. **Use at most one or two per page**, never side by side. Each makes its section taller at run time (or in CSS, see Lessons 1) and sits in a sticky stage. Phones: either the same effect (when it reads well small) or a plain layout via `when`.

### foldStack

**Looks like:** a stack of images peels away one after another like sheets of paper curling off (WebGL page curl), the next image underneath; captions cross-fade; an "01 / 05" counter. Without WebGL (or a cross-origin image), each sheet wipes away diagonally instead.
**File:** `recipes/fold-stack.js` · `foldStack(scope, env, { step = 80 })` (svh of scroll per image) · **Driver:** scrub, sticky

```html
<div class="fold-track" data-fold>
  <div class="fold-pin" data-fold-pin>
    <span data-fold-idx>01 / 05</span>
    <div class="fold-stack" data-fold-stack>
      <figure class="fold-item" data-fold-item><div class="fold-win"><img src="jet.webp" alt="…"></div><figcaption data-fold-cap>Jet-El</figcaption></figure>
      <!-- first item on top -->
    </div>
  </div>
</div>
```

**CSS:** `css/reference/fold-stack.css` (whole file; "Running" section applies while active). **Fallback:** the first item as a still.

### sideRail

**Looks like:** a row of panels slides in from the right while the section holds; inside each panel the image drifts against the movement and a large outline numeral lags behind (layers, not a flat strip). Counter, caption and progress line update.
**File:** `recipes/side-rail.js` · `sideRail(scope, env, { step = 75, hold = 0.08 })` · **Driver:** scrub, sticky · runs on every screen size

```html
<section class="rail" data-rail>
  <div class="rail-stage" data-rail-stage>
    <b data-rail-idx>01</b>
    <div class="rail-track" data-rail-track>
      <article class="rail-panel" data-rail-panel data-rail-label="Jet brokerage and charter">
        <span class="rail-num">01</span><div class="rail-fig"><img src="jet.webp" alt="…"></div>…
      </article>
    </div>
    <span data-rail-caption></span><i data-rail-bar></i>
  </div>
</section>
```

**Hook clash:** `dragRail` also uses `data-rail` (on its card row). Both are scoped, so they can share a page; never call both on the same scope. **CSS:** `css/reference/side-rail.css`. **Fallback:** a swipe row.

### partOpen

**Looks like:** a heading splits apart while a picture opens in the gap between its words, from a small window to the full screen; the halves are pushed to the edges; a lead paragraph arrives over the open picture. Narrow screens stack the halves and part them up and down.
**File:** `recipes/part-open.js` · `partOpen(scope, env, { length = 140 })` (svh) · **Driver:** scrub, sticky

```html
<div class="part" data-part>
  <div class="part-stage" data-part-stage>
    <figure class="part-media" data-part-media><img src="tower.webp" alt="…"><span data-part-shade></span></figure>
    <div class="eyebrow" data-part-eyebrow>Why El-Global</div>
    <h2 class="part-title" data-part-title><span data-part-a>What Sets Us</span><span data-part-b>Apart</span></h2>
    <p data-part-lead>…</p>
  </div>
</div>
```

The title's `flex-direction` (row/column, set by CSS per breakpoint) decides left-right vs up-down. **CSS:** `css/reference/why.css` → "1. Opener" (static + running).

### indexList / indexFigures

**Looks like:** a numbered list beside a sticky picture frame; the row crossing the middle of the screen becomes active (bright, a hairline draws across it) and its picture wipes up over the last. Narrow screens: each row shows its own picture, which opens as it scrolls in.
**File:** `recipes/index-list.js` · `indexList(scope, env)` (wide) · `indexFigures(scope)` (narrow) · **Driver:** scroll position, sticky

```html
<div class="index container" data-index>
  <div class="frame"><img data-index-img src="a.webp" alt=""><img data-index-img src="b.webp" alt=""><b data-index-idx>01</b></div>
  <ol>
    <li data-index-row><i data-index-line></i><h3>Discretion</h3>…<figure data-index-fig><img src="a.webp" alt="…"></figure></li>
  </ol>
</div>
```

```js
createMotion(index, (env) => indexList(index, env), { when: '(min-width: 900px)' });
createMotion(index, () => indexFigures(index), { when: '(max-width: 899px)' });
```

**CSS:** `css/reference/why.css` → "2. Index" (static/narrow + wide screens).

### dotPipe

**Looks like:** a field of dots on a canvas gathers into a symbol for the first step; while the section holds, scrolling moves through the steps, the active step opens in the list and the dots flow from one symbol into the next (each symbol holds a moment so it can be read).
**File:** `recipes/dot-pipe.js` · `dotPipe(scope, env, { step = 70 })` · **Driver:** scrub, sticky

```html
<section data-pipe>
  <div class="stage" data-pipe-stage>
    <ol><li data-pipe-step data-glyph="excellence">…</li><li data-pipe-step data-glyph="discretion">…</li></ol>
    <canvas data-pipe-canvas></canvas>         <!-- dot colour = the canvas's CSS color -->
    <span data-pipe-big>I</span><i data-pipe-bar></i>
  </div>
</section>
```

Symbols live in the `GLYPHS` map at the top of the file (24×24 SVG path strings: `excellence` diamond, `discretion` lock, `integrity` pillars, `innovation` bulb). Add your own icon paths there and name them in `data-glyph`. **CSS:** `css/reference/values.css`. **Fallback:** the list with every step open, no dots.

### windowPortal

**Looks like:** a small aircraft window in the middle of a dark stage; scrolling widens it until the picture behind fills the screen, the window's bezel sweeps past, and the heading rises over the view.
**File:** `recipes/window-portal.js` · `windowPortal(scope, env, { length = 130 })` · **Driver:** scrub, sticky

```html
<div class="portal" data-portal>
  <div class="portal-stage" data-portal-stage>
    <figure class="portal-media" data-portal-media><img src="city.webp" alt="…"></figure>
    <span data-portal-bezel></span><p data-portal-hint>Scroll to look outside</p>
    <div class="portal-copy container" data-portal-copy><h2>Where We Operate</h2></div>
  </div>
</div>
```

**CSS:** `css/reference/presence.css` → "Portal, static" and "Portal, running".

### cardDeck

**Looks like:** cards fanned out like a hand of tall strips from a point below; each scroll step lifts the top card upright, opens it from a strip to full width with its text, then it flies off and the deck turns to put the next card on top. A side index tracks and jumps to any card; links to a card's id elsewhere on the page jump too.
**File:** `recipes/card-deck.js` · `cardDeck(scope, env, { step = 70, angle = 5 })` · **Needs:** Lenis (for jumps) · **Driver:** scrub, sticky · **wide screens only**

```html
<div class="deck" data-deck>
  <div class="deck-pin" data-deck-pin>
    <nav><a data-deck-go="0" href="#charter">Charter</a>… <i data-deck-bar></i></nav>
    <div class="stack">
      <article id="charter" data-deck-card><div class="face" data-deck-face><img …><div data-deck-copy>…</div></div></article>
    </div>
  </div>
</div>
```

```js
createMotion(deck, (env) => cardDeck(deck, env), { when: '(min-width: 900px)' });
```

**CSS:** `css/reference/jetel.css` → "What Jet-El Offers" (includes the phone swipe row). **Fallback:** a grid of cards.

### diptych

**Looks like:** two full-screen panels; as you scroll a diagonal edge with a gold rim sweeps across and brings the second panel in over the first; the first picture pushes in and its copy slides away, the second settles and its copy arrives. "01 / 02" counter; links to either panel's id scroll to that half.
**File:** `recipes/diptych.js` · `diptych(scope, env, { length = 170 })` · **Needs:** Lenis · **Driver:** scrub, sticky · **wide screens only**

Hooks: `[data-diptych]` track › `[data-diptych-stage]` › two `[data-diptych-panel]` (each with `[data-diptych-photo]` and `[data-diptych-copy]`), `[data-diptych-edge]`, `[data-diptych-count] b`. The diagonal is one CSS variable, `--wipe-top`, on the track (Lessons 7). **CSS:** `css/reference/hl.css` → "What H&L Offers". **Fallback:** two cards.

### stack / stepsRise / closingStamp

**Looks like (wide):** a header holds on the left with a "Step 01 / 04" deal-progress meter; on the right the steps are sticky papers, each new one sliding up over the last, which settles back (smaller, shaded). A "Closed" stamp slams onto the final step. **Narrow:** the steps rise in turn and the stamp still lands.
**File:** `recipes/stack.js` · `stack(scope, env)` · `stepsRise(scope)` · `closingStamp(scope)` · **Driver:** scrub, sticky (CSS)

```html
<section class="process">
  <div class="layout">
    <div class="process-header">… <span>Step <b data-stack-count>01</b> / 04</span><div class="track"><div data-stack-fill></div></div></div>
    <div class="process-grid" data-stack-grid>
      <div class="step" data-stack-step>…<span class="step-shade" aria-hidden="true"></span></div>
      <div class="step" data-stack-step>…<span class="stamp" data-stamp aria-hidden="true">Closed</span></div>
    </div>
  </div>
</section>
```

```js
createMotion(process, (env) => { stack(process, env); closingStamp(process); }, { when: '(min-width: 1025px)' });
createMotion(process, () => { stepsRise(process); closingStamp(process); }, { when: '(max-width: 1024px)' });
```

**The sticky layout is CSS** under `@media (min-width: 1025px) and (prefers-reduced-motion: no-preference) { html.js … }` (Lessons 1), and triggers are measured on flow markers the recipe inserts (Lessons 2). **CSS:** `css/reference/elrock.css` → "Process".

### mintCoin

**Looks like:** a gold 3D coin with real thickness (stacked edge layers), a ridged rim and lettering round the edge, turning through eight faces: for each asset, its engraved imprint, then "your fraction" (the asset's photo under a fine grid, one cell glowing, a "1 token · 1/1,000" tag). Wide screens: the section holds and the scroll turns the coin, resting on each face; the list beside it jumps to a face; the coin leans toward the cursor. Elsewhere: arrows, tap or swipe.
**File:** `recipes/mint-coin.js` · `mintCoin(scope)` returns an API · `mintScrub(api, env)` · `mintTilt(scope, env)` · `mintIntro(scope)` · **Needs:** Lenis (for jumps) · **Driver:** scrub, sticky (CSS) / click, swipe

```js
const mint = document.querySelector('[data-mint]');
const coin = mintCoin(mint);                        // not motion: works for everyone
createMotion(mint, () => mintIntro(mint));
createMotion(mint, (env) => mintScrub(coin, env), { when: '(min-width: 1025px)' });
createMotion(mint, (env) => mintTilt(mint, env), { when: 'hover' });
```

Markup hooks: `[data-mint]` › `[data-mint-visual]` › `[data-mint-tilt]` › `[data-mint-coin]` (front face with four `[data-mint-front="i"]` variants, six `.te-token-edge` layers, back face with four `[data-mint-back="i"]`); `[data-mint-item="i"]` buttons, `[data-mint-side]` caption, `[data-mint-prev]`, `[data-mint-next]`. The hidden face swaps to the next asset while turned away, so two physical faces show eight. **CSS:** `css/reference/token.css` → "One asset, a thousand tokens: the coin" (tall section + sticky stage in a media query; coin metal, knurled rim via `repeating-conic-gradient`, the soft-light shine driven by `--shine`). Imprints are line-art SVGs; draw your own in a 200×200 viewBox.

---

## Lists, cards and grids

### spotList

**Looks like:** a vertical list where the item crossing the middle of the screen is lit and opens its text; the others dim to their titles. Clicking (or Enter on) an item scrolls it to the middle. GSAP animates nothing here: the recipe moves classes and CSS eases them.
**File:** `recipes/spot-list.js` · `spotList(scope, env, { line = 0.55 })` (the reading line, as a share of the screen height) · **Needs:** Lenis · **Driver:** scroll position

```html
<ol data-spot><li data-spot-item><h3>Global reach</h3><div class="spot-body"><p>…</p></div></li>…</ol>
```

**CSS (required):** `css/reference/jetel.css` → "The Jet-El Advantage" (`.is-spot` states, the `.spot-body` open/close transition).

### strips

**Looks like:** a row of tall vertical panels, one open at a time: the open strip is wide with its photo and copy, the others show their names upright. Which is open follows the scroll, then the pointer while over the row; a click (or focus) opens a strip, a click on the open one follows its link; page links to a strip's id scroll to it and open it.
**File:** `recipes/strips.js` · `strips(scope, env)` · **Needs:** Lenis · **Driver:** scroll position, pointer · **wide screens only**

```html
<div class="strips" data-strips>
  <a class="strip" id="marinas" href="marinas.html" data-strip><img …><span class="strip-title">Marinas</span><div class="strip-copy">…</div></a>
</div>
```

```js
createMotion(row, (env) => strips(row, env), { when: '(min-width: 900px)' });
```

**CSS (required):** `css/reference/op.css` → "What The 1% Offers: expanding strips" (`.is-strips` flex-grow layout; disable any shared card hover lift inside it). **Fallback:** a plain grid of cards.

### assemble / spotlight

**Looks like:** grid cards start scattered (offset, turned, smaller, faded) and settle into place as the grid scrolls in (each card has its own fixed scatter). `spotlight`: a soft gold light follows the cursor across the cards.
**File:** `recipes/assemble.js` · `assemble(scope)` · `spotlight(scope, env)` · **Driver:** scrub, pointer

```html
<div class="grid" data-assemble><article data-assemble-card>…</article>…</div>
```

```js
createMotion(why, () => assemble(why));
createMotion(why, (env) => spotlight(why, env), { when: 'hover' });
```

**CSS:** `css/reference/hl.css` → "The H&L Advantage" (the light is a `::before` layer reading `--lx`/`--ly`, shown with `.is-lit`).

### dealCards / dealTilt

**Looks like:** cards are dealt onto the table: each starts lying flat (tipped back 72°) and stands up as it enters, row by row; as it lands, its title decodes like a trading terminal (characters cycling until they settle on the word). `dealTilt`: the card leans toward the cursor and a glare follows it.
**File:** `recipes/deal-cards.js` · `dealCards(scope, env)` · `dealTilt(scope, env, max = 7)` (degrees) · **Driver:** once, pointer

```html
<div class="deal" data-deal>
  <div class="card er-service-card"><span class="glare" aria-hidden="true"></span><h4 data-decode>Sell-Side Advisory</h4><p>…</p></div>
</div>
```

The wrapper is dealt; the card tilts (the tilt looks for `[data-deal] .er-service-card`: keep that class, or change the selector in `dealTilt`). Decoding keeps an `aria-label` with the real title. **CSS:** `css/reference/elrock.css` → "Services" (`.er-deal { perspective }`, `.er-glare` reading `--gx`/`--gy`); the card's transition must exclude `transform`.

### coinFlip / coinsMotion / coinsHover

**Looks like:** two-faced cards: the front names the item, the back gives its terms. They spin in from edge-on as they arrive; they turn over under the pointer, on tap or click, or with Enter/Space.
**File:** `recipes/coins.js` · `coinFlip(scope)` (not motion, returns an API) · `coinsMotion(scope, flip, env)` · `coinsHover(flip, env)` · **Driver:** once, pointer, click

```html
<div class="coin" id="asset-jets" data-coin tabindex="0">
  <div class="coin-inner" data-coin-inner>
    <div class="card te-coin-front">…<span class="hint">Turn over for terms</span></div>
    <div class="card te-coin-back">$10,000 minimum entry · 8–12% target yield <a href="#register">Register interest</a></div>
  </div>
</div>
```

```js
const flip = coinFlip(assets);                                    // works without motion (instant swap)
createMotion(assets, (env) => coinsMotion(assets, flip, env));
createMotion(assets, (env) => coinsHover(flip, env), { when: 'hover' });
```

**CSS (required):** `css/reference/token.css` → "Assets: two-faced tokens" (`.is-coins` puts both faces in one grid cell with `backface-visibility: hidden`; the back is pre-rotated 180°). **Fallback:** the back's terms sit under the front.

### doors

**Looks like:** each step sits behind a numbered door that swings open on its left hinge as the step scrolls in, fading as it passes square to the page; doors in one row open one after another.
**File:** `recipes/doors.js` · `doors(scope, env)` · **Driver:** scrub

```html
<div class="grid" data-doors><div class="step" data-door-card>…<div class="door" aria-hidden="true">01</div></div>…</div>
```

Rebuild per grid layout so "one after another" follows the row: call it under three `when` queries (≥1025, 769–1024, ≤768). **CSS:** `css/reference/hl.css` → "Our Process: doors" (doors shown only while `.is-doors` is on).

### rings

**Looks like:** a gold ring draws itself round each step's number as the step scrolls in; the step lights up when its ring closes. Rings in a row close one after another.
**File:** `recipes/rings.js` · `rings(scope, env)` · **Driver:** scrub

```html
<div class="grid" data-rings>
  <div class="step" data-ring-step>
    <div class="ring"><svg viewBox="0 0 100 100"><circle class="ring-track" cx="50" cy="50" r="46"/><circle class="op-ring-fill" cx="50" cy="50" r="46" pathLength="1"/></svg><span>01</span></div>…
  </div>
</div>
```

`pathLength="1"` lets CSS draw the ring whole without scripts; the recipe swaps it for the real circumference (Lessons 6). `.is-done` lights the step. Wire under three `when` queries like *doors*. **CSS:** `css/reference/op.css` → "Our Process: progress rings".

### flightPath

**Looks like:** a line draws itself through a row of steps with a small plane riding its tip; each step lights up as the plane reaches it. Vertical on narrow screens.
**File:** `recipes/flight-path.js` · `flightPath(scope, env, { axis: 'x' | 'y' })` · **Driver:** scrub

```html
<div class="steps" data-flight>
  <div class="rail" data-flight-rail><i data-flight-line></i><span data-flight-jet>✈</span></div>
  <div class="step" data-flight-step>…</div>…
</div>
```

```js
createMotion(flight, (env) => flightPath(flight, env, { axis: 'x' }), { when: '(min-width: 900px)' });
createMotion(flight, (env) => flightPath(flight, env, { axis: 'y' }), { when: '(max-width: 899px)' });
```

**CSS:** `css/reference/jetel.css` → "Our Process" (`.is-flight`, `.is-vertical`, `.is-lit`).

### oneInHundred

**Looks like:** a 10×10 field of dots grows out from its centre; then 99 dim and one swells and glows gold ("1 in a hundred"). Beside it, each reason draws its gold rule and rises in.
**File:** `recipes/one-in-hundred.js` · `oneInHundred(scope, env, { pick = 44 })` (index of the glowing dot) · **Driver:** scrub (dots), once (reasons)

```html
<div class="dots" data-dots aria-hidden="true"></div>   <!-- empty: dots are made -->
<ul><li data-dots-item><span class="why-op-rule"></span>…</li>…</ul>
```

**CSS:** `css/reference/op.css` → "The 1% Advantage" (`.is-dots`: the field sticks beside the list at ≥900 px).

### marketBoard / marketPeek

**Looks like:** a destination board: large place-name rows arrive in sequence, each drawing its rule from the left. `marketPeek`: on hover screens, a photo of the row under the cursor floats beside it, following with a little lag and lean, changing from row to row.
**File:** `recipes/market-board.js` · `marketBoard(scope, env)` · `marketPeek(scope, env)` · **Driver:** once, pointer

```html
<ul data-board>
  <li data-market data-img="img/london.webp">London <span>United Kingdom</span></li>
  <li data-market data-code="NG">Nigeria …</li>      <!-- letters instead of a photo -->
</ul>
```

**CSS:** `css/reference/hl.css` → "Where We Operate: a destination board" (touch screens show a small photo in each row instead).

### typeSlide

**Looks like:** big-type names (one per row) slide in from the side as they rise, rows alternating left and right; each row's numeral travels the other way and its text comes into focus (blur → sharp).
**File:** `recipes/type-slide.js` · `typeSlide(scope)` · **Driver:** scrub

```html
<div class="row" data-slide-row><div><div class="num" data-slide-num>I</div><h3 data-slide-name>Excellence</h3></div><p data-slide-text>…</p></div>
```

**CSS:** the section needs `overflow: hidden` (`css/reference/about.css` → "What We Stand For").

### dragRail

**Looks like:** a row of cards you grab and throw: drag it, let go and it glides on with the momentum, then settles on the nearest card; the cards lean with the drag speed. Arrow buttons, Tab focus and a progress bar too. It slides in once when first seen. Phones get a native swipe row (CSS only).
**File:** `recipes/drag-rail.js` · `dragRail(scope, env)` · **Driver:** pointer, once · **≥769 px**

```html
<div class="rail-view" data-rail-view>
  <div class="cards" data-rail><article class="card" tabindex="0">…</article>…</div>
</div>
<div class="rail-bar">
  <button data-rail-prev aria-label="Previous">←</button>
  <div class="track"><div class="fill" data-rail-fill></div></div>
  <button data-rail-next aria-label="Next">→</button><span>Drag to explore</span>
</div>
```

```js
createMotion(section, (env) => dragRail(section, env), { when: '(min-width: 769px)' });
```

**CSS:** `css/reference/about.css` → "Core Activities: a rail you can drag" (`.is-rail` flex row with `touch-action: pan-y`; `.is-rail-on` shows the bar; phone swipe row with `scroll-snap`). The rail is measured from its cards' layout boxes (Lessons 3). **Hook clash:** see sideRail.

### orbit

**Looks like:** cards ride a dashed ring round a central emblem and the ring turns slowly (faster while you scroll); pointing at or focusing a card pauses the orbit, rings it in gold and shows its title and description in the centre. The cards drift out to their places on first view.
**File:** `recipes/orbit.js` · `orbit(scope, env)` · **Driver:** time, pointer · **≥1025 px**

```html
<div class="grid" data-orbit>
  <div class="ab-orbit-core" aria-hidden="true"><img src="logo.webp" alt=""><span data-orbit-name>El-Global</span><span data-orbit-sub>Five divisions</span><span data-orbit-desc>Point at a division…</span></div>
  <a class="eco-card" href="jet-el/"><div class="eco-card-image"><img …></div><h4>Jet-El</h4><span class="eco-card-sub">Private Aviation</span><p>…</p></a>
</div>
```

```js
createMotion(eco, (env) => orbit(eco, env), { when: '(min-width: 1025px)' });
createMotion(eco, () => batchReveal(eco), { when: '(max-width: 1024px)' });   // narrower: plain cards rising
```

**Class names are hooks here:** the recipe reads `.eco-card` (each card), `.eco-card-image`, `h4`, `.eco-card-sub` and `p` inside it, and `.ab-orbit-core` (keep them, or rename them in the recipe too). **The orbit layout is CSS** (Lessons 1): under `@media (min-width: 1025px) and (prefers-reduced-motion: no-preference) { html.js … }` the grid sets `--orbit: on` (the recipe checks it), `--r` (radius), height `calc(var(--r) * 2 + 250px)`, and each card is placed with `transform: rotate(calc(var(--a) + var(--spin))) translateY(calc(var(--r) * -1)) rotate(…inverse…)`, `--a` per card by `:nth-of-type` (0°, 72°, 144°…). The recipe only moves `--spin`. `css/reference/about.css` → "The Ecosystem".

### checker / checkerLight

**Looks like:** a faint chessboard behind a call to action turns over tile by tile in a diagonal wave when the section comes into view; on hover screens the tile under the cursor lights and fades.
**File:** `recipes/checker.js` · `checker(scope, env)` · `checkerLight(scope, env)` · **Driver:** once, pointer

```html
<section class="cta"><div class="board" data-board aria-hidden="true"></div><div class="container">…</div></section>
```

Tiles (~88 px) are created by the recipe. **CSS:** `css/reference/elrock.css` → "Call to action: a chessboard wave" (grid board with a radial `mask-image` fade; tile colours via `.is-dark`, `.is-lit` with a background-color transition).

---

## Data and diagrams

### routeMap

**Looks like:** a dotted world map: the dots sweep in from the west, the offices light up, routes draw out to partner cities one after another and each city pin lands as its route arrives; then a soft light keeps travelling the routes while the map is on screen.
**File:** `recipes/route-map.js` · `routeMap(scope, env)` · **Driver:** once, time · **Asset:** `assets/world-dots.svg`

```html
<div class="map" data-map>
  <img data-map-dots src="assets/world-dots.svg" alt="">
  <svg viewBox="0 0 1065 703">                 <!-- same size as world-dots.svg -->
    <path data-map-route d="M120 199.2Q394.8 37.0 700 129.9"/>…
    <g data-map-pin class="is-hq"><circle cx="120" cy="199" r="5"/><text x="132" y="195">Casper</text></g>
    <g data-map-pin><circle cx="700" cy="130" r="4"/><text x="712" y="126">London</text></g>
  </svg>
</div>
```

Routes draw in DOM order; `.is-hq` pins (and their `<text>` labels) land first. Plot coordinates in the dot image's own 1065×703 space (equirectangular). **CSS:** `css/reference/presence.css` → "Route map".

### chainMine / chainPulse

**Looks like:** a row of blockchain blocks is mined one after another: each hash churns through random hex, locks on its real value and the block lights; the link to the next block draws. Then a light runs along the built chain every few seconds while it is on screen.
**File:** `recipes/chain-mine.js` · `chainMine(scope, env)` · `chainPulse(scope, env)` · **Driver:** once, time

```html
<div class="chain" data-chain>
  <div class="block" data-block><span>Block #001</span><div class="hash" data-hash>0x7a3f...e92c</div></div>
  <div class="link" data-link></div>
  <div class="block" data-block>…</div>
</div>
```

```js
createMotion(chain, (env) => chainMine(chain, env));
createMotion(chain, (env) => chainPulse(chain, env), { when: '(min-width: 900px)' });   // needs one row
```

**CSS:** `css/reference/token.css` → "The chain" (`.is-mined` colours ease in CSS; `.te-chain-light`). Hashes keep a `0x` prefix and the ellipsis while churning.

### keyhole / keyholeFollow

**Looks like:** a band shows a darkened copy of a photo; a circle of the vivid photo opens in the middle as the band scrolls in, with a gold ring. Hover screens: the circle follows the cursor. Touch screens: it keeps opening to the full photo.
**File:** `recipes/keyhole.js` · `keyhole(scope, env, { full })` · `keyholeFollow(scope, env)` · **Driver:** scrub, pointer

```html
<div class="band" data-keyhole>
  <img src="villa.webp" alt="…">
  <div class="keyhole-view" aria-hidden="true"><img src="villa.webp" alt=""></div>
  <span class="keyhole-ring" aria-hidden="true"></span>
</div>
```

```js
createMotion(band, (env) => {
  const steer = window.matchMedia(MOTION.query.hover).matches;
  keyhole(band, env, { full: !steer });
  if (steer) keyholeFollow(band, env);
});
```

**CSS:** `css/reference/hl.css` → "Off-Market: a keyhole" (`.keyhole-view` clipped by `circle(var(--kr) at var(--kx) var(--ky))`).

### fraction / fractionMotion

**Looks like:** a property photo cut into a 10×10 grid (each cell 1%); a slider sets your stake and the cells it buys light gold from the top left (the last one partly, by height); the readout shows tokens, share and yearly yield. With motion, new cells pop in and the stake sweeps up to its starting value on first view.
**File:** `recipes/fraction.js` · `fraction(scope)` (not motion, returns an API) · `fractionMotion(api, env)` · **Driver:** input, once

```html
<div data-fraction data-price="1000000" data-token="1000" data-yield="6 10">
  <div class="photo"><img src="villa.webp" alt="…"><div data-fraction-grid aria-hidden="true"></div></div>
  <label for="stake">Your stake</label><output data-fraction-amount>$50,000</output>
  <input type="range" id="stake" min="1000" max="250000" step="1000" value="50000" data-fraction-input>
  <dl aria-live="polite"><dt>Tokens</dt><dd data-fraction-tokens>50</dd><dt>Share</dt><dd data-fraction-share>5.0%</dd><dt>Yield</dt><dd data-fraction-yield>$3,000 – $5,000</dd></dl>
</div>
```

Write the starting figures into the HTML (scripts-off readers see them). **CSS:** `css/reference/token.css` → "The Vision: own a fraction" (cells fill via `--fill` on a `::after`; the range is shown only with `.is-live`).

---

## Interactive tools (not motion; they work for everyone)

Call these directly (not inside `createMotion`): they must work with reduced motion and when GSAP is blocked. Their motion, where they have any, is a separate function you call inside `createMotion`.

### valuationTool / valuationIntro

**Looks like:** a valuation form that actually computes: sector EV/EBITDA multiples adjusted for stage, growth, margin and region give an indicative range, multiple and confidence. With motion, a scan line crosses the results while a status line reports steps, then the figures count up; the example figures count up on first view. Inline errors focus the missing field.
**File:** `recipes/valuation.js` · `valuationTool(scope)` · `valuationIntro(scope, env)` · helpers `value(input)`, `money(v)`

Markup: `form[data-val]` with named fields `sector, stage, revenue, ebitda, growth, margin, region`, `[data-val-status]`; results `[data-val-out="range|multiple|confidence"]`, `[data-val-note="…"]`, `[data-val-bar]`, `[data-val-pct]`, `[data-val-scan]`. The model tables (`SECTOR`, `STAGE`, `REGION`) sit at the top of the file: retune them. **CSS:** `css/reference/inline-el-rock.css` (`.er-val-*` base) + `css/reference/elrock.css` → "AI valuation". **Be honest in the copy** about what the model is (a multiples formula, not AI).

### enquiryForm

**Looks like:** an enquiry form that tells the truth: it really POSTs (fetch to the form's own action), shows a "Message sent, Name." panel on a 2xx (focused and scrolled into view), and on any failure (no handler, offline, 15 s timeout) says so, keeps the details, and offers a ready-written email with every field. Also: errors under their fields, `?division=` preselects a radio card, a growing textarea with a character count, Copy buttons on email addresses.
**File:** `recipes/enquiry-form.js` · `enquiryForm(scope)`

Markup: `form[data-enquiry][data-fallback="info@example.com"]` with `[data-error-for="name"]` slots (give them ids), `textarea[maxlength]` + `[data-char-count]`, `[data-status][role=alert][tabindex=-1][hidden]`; a sibling `[data-sent][hidden]` with `[data-sent-name]` and `[data-sent-again]`; any element `[data-copy="address"]` gets a Copy button. **Do not** put `data-ajax` on it if an old script fakes success on that hook (Lessons 11). Handler options: a PHP mail script, Formspree/Web3Forms (set the form `action` to their endpoint), or none (the fallback email still works). **CSS:** `css/reference/contact.css` → "The form" (note `.contact-form[hidden] { display: none }` if your form is `display: flex`).

### formChain

**Looks like:** a chain of small nodes above a form's submit button, one per field; a node (and the link to it) lights gold when its field holds a valid answer; "3 of 7 details".
**File:** `recipes/form-chain.js` · `formChain(scope)`

```html
<form data-form-chain>… <div class="form-chain" aria-hidden="true"><span data-chain-nodes></span><span data-chain-count></span></div> …</form>
```

Every input/select/textarea with a `name` counts. **CSS:** `css/reference/token.css` → "Register: a progress chain".

### clocks

**Looks like:** each office card shows that city's live local time (the colon ticking), the weekday, and "Office hours" (gold dot) or "After hours" (Mon–Fri 9:00–18:00 local).
**File:** `recipes/clocks.js` · `clocks(scope)`

```html
<div class="office" data-clock="Europe/London"><h4>London</h4>…</div>   <!-- any IANA time zone -->
```

**CSS (required):** `css/reference/clocks.css` (hidden until `.is-live`, so scripts-off readers never see an empty clock).

---

## Page furniture

### overlayNav / preloaderLifted

**File:** `core/chrome.js` (not motion; call directly).
- `overlayNav(hero)`: needs `<nav id="navbar" class="navbar">` and `<body class="has-overlay-nav">`. The bar is transparent (with a soft top shade) while the hero is under it, then gets `.is-solid` and your normal bar styles. CSS: `css/motion-base.css` section 4.
- `preloaderLifted()`: a promise for a `#preloader` element gaining `.loaded`; resolves at once if there is no preloader. Pass it as `{ ready }` to a hero intro so the intro does not play hidden behind the loader. El-Global lifts its loader 800 ms after `DOMContentLoaded` (never waiting for `load`).

```js
import { overlayNav, preloaderLifted } from '../motion-kit/core/chrome.js';
overlayNav(document.querySelector('.hero'));
```

