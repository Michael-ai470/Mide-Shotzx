// recipes/fold-stack.js (Web Motion Kit)
// A stack of images that peel away one after another while the section is pinned.
// Scroll drives it: each image curls off like a sheet of paper (WebGL), the next one is
// underneath, and the captions cross-fade. Without WebGL, or if an image cannot be used
// as a texture, the sheet wipes away diagonally instead.
//
// Markup hooks:
//   [data-fold]        the track. The recipe makes it taller while it runs.
//   [data-fold-pin]    what stays on screen. Sticky while the images change.
//   [data-fold-stack]  the stack; [data-fold-item] children, first one on top.
//   .fold-win          the image window inside each item (holds the <img>).
//   [data-fold-cap]    the caption inside each item.
//   [data-fold-idx]    optional "01 / 05" counter.
//
// Without scripts or with reduced motion, CSS shows the first item only, as a still.

import { gsap, ScrollTrigger } from '../core/core.js';

const pad = (n) => String(n).padStart(2, '0');
const clamp = (min, max, v) => (v < min ? min : v > max ? max : v);

/**
 * @param {Element} scope  the [data-fold] track
 * @param {import('../core/core.js').MotionEnv} env
 * @param {{ step?: number }} [options]  step: scroll per image, in svh. Default 80.
 */
export function foldStack(scope, env, options = {}) {
  const track = /** @type {HTMLElement} */ (scope);
  const pin = track.querySelector('[data-fold-pin]');
  const stack = track.querySelector('[data-fold-stack]');
  const items = Array.from(track.querySelectorAll('[data-fold-item]'));
  if (!pin || !stack || items.length < 2) return;
  const wins = items.map((item) => item.querySelector('.fold-win'));
  const imgs = items.map((item) => item.querySelector('img'));
  const caps = items.map((item) => item.querySelector('[data-fold-cap]'));
  const idx = track.querySelector('[data-fold-idx]');
  const n = items.length;
  const step = options.step ?? 80;

  // 1. Running layout. CSS keys off .is-folding; the height lives in an inline style.
  track.classList.add('is-folding');
  items.forEach((item, i) => (item.style.zIndex = String(n - i)));
  const measure = () => {
    track.style.setProperty('--fold-pin-h', `${pin.offsetHeight}px`);
    track.style.height = `calc(${pin.offsetHeight}px + ${(n - 1) * step}svh)`;
    placeCanvas();
  };

  // 2. The sheet. A canvas over the top window, drawn only while a fold is in progress.
  const canvas = document.createElement('canvas');
  canvas.className = 'fold-gl';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.zIndex = String(n + 1);
  stack.appendChild(canvas);
  const gl = createFold(canvas, n);
  const ready = [];
  const upload = (i) => {
    if (!gl || ready[i] !== undefined) return ready[i] === true;
    const img = imgs[i];
    if (!img || !img.complete || !img.naturalWidth) return false;
    ready[i] = gl.upload(i, img); // false if the browser refuses the image (CORS)
    return ready[i];
  };
  const onLoads = imgs.map((img, i) => {
    const fn = () => upload(i);
    img?.addEventListener('load', fn);
    return fn;
  });

  function placeCanvas() {
    const win = wins[0];
    if (!win) return;
    canvas.style.left = `${win.offsetLeft}px`;
    canvas.style.top = `${win.offsetTop}px`;
    canvas.style.width = `${win.offsetWidth}px`;
    canvas.style.height = `${win.offsetHeight}px`;
  }

  // 3. Render from progress. c runs 0 .. n-1; the integer part is the image on top.
  let last = { cur: -1, p: -1, shown: -1, active: -1 };
  let drawn = false;
  const radius = () => parseFloat(getComputedStyle(wins[0]).borderTopLeftRadius) || 0;

  const render = (progress) => {
    const c = clamp(0, 1, progress) * (n - 1);
    const cur = Math.min(n - 2, Math.floor(c));
    const p = clamp(0, 1, c - cur);
    if (cur === last.cur && p === last.p) return;
    const folding = p > 0 && p < 1;
    const useGl = folding && !!gl && upload(cur);

    items.forEach((item, i) => {
      item.classList.toggle('is-gone', i < cur || (i === cur && p >= 1));
      item.classList.toggle('is-fold', i === cur && useGl);
      const win = wins[i];
      if (!win) return;
      if (i === cur && folding && !useGl) {
        // Fallback: a soft diagonal wipe from the bottom-right corner.
        const a = (p * 112 - 12).toFixed(2);
        const mask = `linear-gradient(to top left, transparent ${a}%, #000 ${(+a + 12).toFixed(2)}%)`;
        win.style.webkitMaskImage = mask;
        win.style.maskImage = mask;
      } else if (win.style.maskImage) {
        win.style.webkitMaskImage = '';
        win.style.maskImage = '';
      }
    });

    caps.forEach((cap, i) => {
      if (!cap) return;
      const d = clamp(-1, 1, c - i);
      const o = 1 - clamp(0, 1, (Math.abs(d) - 0.1) / 0.35);
      cap.style.opacity = o.toFixed(3);
      cap.style.transform = `translateY(${(-14 * d).toFixed(1)}px)`;
    });

    const active = Math.round(c);
    if (active !== last.active) {
      items.forEach((item, i) => (item.inert = i !== active));
      if (idx) idx.textContent = `${pad(active + 1)} / ${pad(n)}`;
    }

    if (useGl) {
      gl.draw(cur, p, radius());
      drawn = true;
    } else if (drawn) {
      gl.clear();
      drawn = false;
    }
    last = { cur, p, active };
  };

  // 4. Scroll. The pin sticks at its CSS `top`; progress runs while it is stuck.
  const stickyTop = () => parseFloat(getComputedStyle(pin).top) || 0;
  measure();
  const observer = new ResizeObserver(() => {
    measure();
    ScrollTrigger.refresh();
  });
  observer.observe(pin);

  ScrollTrigger.create({
    trigger: track,
    start: () => `top ${stickyTop()}px`,
    end: () => `bottom ${stickyTop() + pin.offsetHeight}px`,
    onUpdate: (self) => render(self.progress),
    onRefresh: (self) => {
      last.cur = -1;
      render(self.progress);
    },
  });
  imgs.forEach((_, i) => upload(i));
  render(0);

  env.onCleanup(() => {
    observer.disconnect();
    imgs.forEach((img, i) => img?.removeEventListener('load', onLoads[i]));
    gl?.dispose();
    canvas.remove();
    track.classList.remove('is-folding');
    track.style.height = '';
    track.style.removeProperty('--fold-pin-h');
    items.forEach((item, i) => {
      item.classList.remove('is-gone', 'is-fold');
      item.style.zIndex = '';
      item.inert = false;
      const win = wins[i];
      if (win) {
        win.style.webkitMaskImage = '';
        win.style.maskImage = '';
      }
      if (caps[i]) {
        caps[i].style.opacity = '';
        caps[i].style.transform = '';
      }
    });
    if (idx) idx.textContent = `01 / ${pad(n)}`;
  });
}

// ─── The page curl ──────────────────────────────────────────────────────────
// A grid mesh over the window. Everything on the far side of a moving fold line wraps
// round a cylinder and comes back flat over the sheet, so the image peels from the
// bottom-right corner toward the top left. The back of the sheet is dimmed and
// desaturated, the curl is shaded, and the sheet keeps the window's corner radius.

const VERT = `
attribute vec2 aUv;
uniform vec2 uSize;
uniform vec2 uOrigin;
uniform vec2 uDir;
uniform float uLine;
uniform float uR;
varying vec2 vUv;
varying float vBack;
varying float vCurl;
varying float vPast;
void main() {
  vec2 p = aUv * uSize;
  float u = dot(p - uOrigin, uDir);
  float s = uLine - u;
  float back = 0.0;
  float curl = 0.0;
  float z = 0.0;
  vec2 q = p;
  if (s > 0.0) {
    float arc = 3.14159265 * uR;
    float along;
    if (s < arc) {
      float th = s / uR;
      along = uLine - uR * sin(th);
      z = uR * (1.0 - cos(th));
      back = smoothstep(1.45, 1.7, th);
      curl = sin(th);
    } else {
      along = uLine + (s - arc);
      z = 2.0 * uR;
      back = 1.0;
    }
    q = p + uDir * (along - u);
  }
  vec2 c = uSize * 0.5;
  q = c + (q - c) * (1.0 + z * 0.0006);
  gl_Position = vec4(q.x / uSize.x * 2.0 - 1.0, 1.0 - q.y / uSize.y * 2.0, 0.0, 1.0);
  vUv = aUv;
  vBack = back;
  vCurl = curl;
  vPast = s;
}`;

const FRAG = `
precision mediump float;
uniform sampler2D uTex;
uniform vec2 uFragSize; /* separate from the vertex uniforms: precisions differ */
uniform vec2 uCover;
uniform float uRadius;
uniform float uFragR;
uniform float uShadow;
varying vec2 vUv;
varying float vBack;
varying float vCurl;
varying float vPast;
float roundRect(vec2 p, vec2 c, vec2 h, float r) {
  vec2 q = abs(p - c) - (h - vec2(r));
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
void main() {
  vec2 px = vUv * uFragSize;
  float mask = 1.0 - smoothstep(-0.75, 0.75, roundRect(px, uFragSize * 0.5, uFragSize * 0.5, uRadius));
  vec3 col = texture2D(uTex, (vUv - 0.5) * uCover + 0.5).rgb;
  float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
  vec3 backside = mix(col, vec3(lum), 0.7) * 0.42;
  col = mix(col, backside, vBack);
  col *= 1.0 - 0.28 * vCurl * (1.0 - vBack);
  col += vec3(0.07) * vCurl * vBack;
  float shadow = vPast < 0.0 ? exp(vPast / (uFragR * 0.7)) * 0.38 * uShadow : 0.0;
  col *= 1.0 - shadow;
  gl_FragColor = vec4(col * mask, mask);
}`;

const COLS = 64;
const ROWS = 80;
const DIR = (() => {
  const x = -1;
  const y = -0.55;
  const l = Math.hypot(x, y);
  return [x / l, y / l];
})();

function createFold(canvas, count) {
  let gl;
  try {
    gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true, depth: false });
  } catch {
    return null;
  }
  if (!gl) return null;
  const shader = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (gl.getShaderParameter(s, gl.COMPILE_STATUS)) return s;
    console.warn('[fold] shader:', gl.getShaderInfoLog(s));
    return null;
  };
  const vs = shader(gl.VERTEX_SHADER, VERT);
  const fs = shader(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn('[fold] link:', gl.getProgramInfoLog(prog));
    return null;
  }
  gl.useProgram(prog);

  const verts = new Float32Array((COLS + 1) * (ROWS + 1) * 2);
  let k = 0;
  for (let y = 0; y <= ROWS; y++) for (let x = 0; x <= COLS; x++) {
    verts[k++] = x / COLS;
    verts[k++] = y / ROWS;
  }
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
  const aUv = gl.getAttribLocation(prog, 'aUv');
  gl.enableVertexAttribArray(aUv);
  gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);
  const ibo = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  let indexCount = 0;
  let sortedFor = '';
  // Painter's order: the sheet that stays flat first, then the curl, then the flap on top.
  // Cells further along the fold direction are drawn first.
  const sortIndices = (w, h) => {
    const key = `${w}x${h}`;
    if (key === sortedFor) return;
    sortedFor = key;
    const cells = [];
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const px = ((x + 0.5) / COLS) * w - w;
      const py = ((y + 0.5) / ROWS) * h - h;
      cells.push({ x, y, u: px * DIR[0] + py * DIR[1] });
    }
    cells.sort((a, b) => b.u - a.u);
    const idx = new Uint16Array(cells.length * 6);
    let j = 0;
    for (const { x, y } of cells) {
      const a = y * (COLS + 1) + x;
      const b = a + COLS + 1;
      idx[j++] = a; idx[j++] = b; idx[j++] = a + 1;
      idx[j++] = a + 1; idx[j++] = b; idx[j++] = b + 1;
    }
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
    indexCount = idx.length;
  };

  const u = (name) => gl.getUniformLocation(prog, name);
  const loc = { size: u('uSize'), origin: u('uOrigin'), dir: u('uDir'), line: u('uLine'), r: u('uR'), cover: u('uCover'), radius: u('uRadius'), shadow: u('uShadow'), fsize: u('uFragSize'), fr: u('uFragR') };
  gl.uniform1i(u('uTex'), 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  const textures = [];
  const aspects = [];
  for (let i = 0; i < count; i++) {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    textures.push(t);
  }

  return {
    upload(i, img) {
      try {
        for (let k = 0; k < 8 && gl.getError() !== gl.NO_ERROR; k++); // clear stale flags
        gl.bindTexture(gl.TEXTURE_2D, textures[i]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        aspects[i] = img.naturalWidth / img.naturalHeight;
        const err = gl.getError();
        if (err !== gl.NO_ERROR) console.warn('[fold] texture upload failed', err);
        return err === gl.NO_ERROR;
      } catch (error) {
        console.warn('[fold] this image cannot be used as a texture, so it wipes instead.', error);
        return false;
      }
    },
    draw(i, p, radius) {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const bw = Math.round(w * ratio);
      const bh = Math.round(h * ratio);
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
        gl.viewport(0, 0, bw, bh);
      }
      sortIndices(w, h);
      // object-fit: cover, centred
      const win = w / h;
      const img = aspects[i] || win;
      const cover = img > win ? [win / img, 1] : [1, img / win];
      const r = Math.max(28, 0.07 * (w + h));
      const far = w * -DIR[0] + h * -DIR[1]; // distance from the start corner to the far one
      const line = -2 + p * (far + Math.PI * r + r + 2);
      gl.bindTexture(gl.TEXTURE_2D, textures[i]);
      gl.uniform2f(loc.size, w, h);
      gl.uniform2f(loc.origin, w, h);
      gl.uniform2f(loc.dir, DIR[0], DIR[1]);
      gl.uniform1f(loc.line, line);
      gl.uniform1f(loc.r, r);
      gl.uniform2f(loc.fsize, w, h);
      gl.uniform1f(loc.fr, r);
      gl.uniform2f(loc.cover, cover[0], cover[1]);
      gl.uniform1f(loc.radius, radius);
      // the cast shadow fades in as the curl lifts and out as the sheet leaves
      gl.uniform1f(loc.shadow, Math.min(1, p * 8) * Math.min(1, (1 - p) * 8));
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);
    },
    clear() {
      gl.clear(gl.COLOR_BUFFER_BIT);
    },
    dispose() {
      textures.forEach((t) => gl.deleteTexture(t));
      gl.deleteBuffer(vbo);
      gl.deleteBuffer(ibo);
      gl.deleteProgram(prog);
    },
  };
}
