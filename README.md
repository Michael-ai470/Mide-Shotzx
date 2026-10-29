# Mide Shotzx

Website for Mide Shotzx, a photography and film studio in Akure, Nigeria. Static HTML, CSS and JavaScript modules, no build step. Deployed on Vercel: https://mide-shotzx.vercel.app/

## Structure

| Path | What it is |
|---|---|
| `index.html`, `portfolio.html`, `gallery.html` (Films), `services.html`, `about-us.html`, `contact-us.html` | The pages. Header and footer are repeated in each; change them in all six. |
| `styles.css` | The design system: tokens at the top (colours, type scale, spacing), then one numbered section per component. |
| `js/site.js` | Shared: navbar, mobile menu, smooth scroll, heading and block reveals, magnetic buttons, ticker, the footer wordmark that types itself. |
| `js/hero-reel.js` | The home hero: four photographs edge to edge, written to the motion kit's recipe rules. |
| `js/home.js`, `js/page.js`, `js/portfolio.js`, `js/films-page.js`, `js/films.js`, `js/services.js`, `js/about.js`, `js/contact.js` | One module per page. Each runs its hero intro first, then `initSite()`. |
| `motion-kit/` | The Web Motion Kit (GSAP + Lenis recipes). Read `motion-kit/README.md`, `CATALOG.md` and `ENGINE.md` before changing motion. |
| `images/work/` | Portfolio photos. `work-NN.jpg` is the untouched original. Photos 01–33 (960×1280) have a `-480.webp` thumbnail; photos 34–56 (2160×2880 exports) have `-640.webp` and `-1280.webp`. Each `<img>` lists them in `srcset`, so browsers fetch only the size they need. |
| `images/team/` | The founder's portrait (original JPEG plus a 480 px WebP). |
| `videos/*.mp4` | Full films, remuxed with `faststart` so playback starts before the download finishes. |
| `videos/posters/`, `videos/previews/` | Native-size poster frames and 6-second muted preview loops (0.4–2 MB, loaded only on hover or in view) used on the film cards and the Films hero. |

`images/img (N).jpg` are the original uploads, kept as source files; the pages use the copies in `images/work/`.

## How images stay sharp and fast

- **Never larger than the source.** Older photos are 960×1280, the newer exports 2160×2880, and films 352p–720p, so no layout may draw them bigger than that. Full-screen areas use several photos side by side (the home hero) or a half-width panel (the split heroes), each at native scale. Film cards share a row height that keeps every film at or under its own resolution.
- Large photos are the original JPEGs, byte for byte; only thumbnails are re-encoded (WebP, quality 88).
- Every `<img>` has a `srcset`, exact `width` and `height` (no layout shift), `loading="lazy"` below the fold, and a 20 px blurred placeholder painted underneath until it arrives.
- Film posters are native-size frames; previews are 6-second native-resolution loops that only load on hover (or in view on touch screens).

Sharper sources make the whole site sharper with no code changes: export photos at 2000 px+ on the long side and films at 1080p, then replace the files.

## Adding a photo

1. Put the original JPEG (2000 px+ on the long side) in `images/work/` as `work-NN.jpg`, with 640 and 1280 px wide WebP copies beside it (`work-NN-640.webp`, `work-NN-1280.webp`, quality ~88).
2. Copy an existing `<figure class="tile">` in `portfolio.html` and update the paths, `width`/`height`, `alt`, `data-cat` and the placeholder.

## Motion rules (short version)

- Content is visible without JavaScript and under reduced motion. Never hide content with a CSS class in the markup.
- Hero text carries `data-motion-hide`; the gate in `<head>` shows it after 2.5 s if GSAP never loads.
- All motion goes through `createMotion()` from `motion-kit/core/core.js`.

## Run locally

Modules do not run from `file://`. Serve the folder:

```
python -m http.server 8080
```

then open http://localhost:8080.

For any animation or scroll work, use the Web Motion Kit in motion-kit/: read motion-kit/README.md, CATALOG.md and ENGINE.md first and follow them.
