// recipes/valuation.js (Web Motion Kit)
// The El-Business valuation tool. Not motion: valuationTool() wires the form so it works
// for everyone, reduced motion included. It turns the inputs into an indicative range with
// a simple multiples model (sector EV/EBITDA, adjusted for stage, growth, margin and
// region), then writes the three result cards.
//
// When motion is allowed the run is staged: a scan line crosses the results while a status
// line reports the steps, then the figures count up and the confidence bar fills.
// valuationIntro() (inside createMotion) counts the example figures up the first time the
// results come into view.
//
// Markup: form[data-val] with named fields (sector, stage, revenue, ebitda, growth,
// margin, region), [data-val-status], and in the results [data-val-out="range|multiple|
// confidence"], [data-val-note="range|multiple|confidence"], [data-val-bar],
// [data-val-pct], [data-val-scan].

import { gsap, ScrollTrigger, MOTION } from '../core/core.js';

// Sector base EV/EBITDA multiples (indicative mid-market medians).
const SECTOR = {
  'Technology & SaaS': 12.5,
  'Healthcare & Pharma': 11.5,
  'Financial Services': 9.5,
  'Energy & Infrastructure': 7.5,
  'Consumer & Retail': 8.5,
  'Industrial & Manufacturing': 7.5,
  'Real Estate & Hospitality': 10,
  'Media & Telecommunications': 8,
};
const STAGE = {
  'Early-Stage / Growth': 1,
  'Established / Mature': 0,
  'Turnaround / Distressed': -2.5,
  'Pre-IPO': 1.5,
};
const REGION = {
  'Middle East & North Africa': 0,
  Europe: 0,
  'North America': 0.8,
  'Asia-Pacific': 0.3,
  'Latin America': -0.8,
  'Sub-Saharan Africa': -1.2,
  'Global / Multi-Region': 0.5,
};

const clamp = (min, max, v) => Math.min(max, Math.max(min, v));
const num = (value) => {
  const cleaned = String(value || '').replace(/[^0-9.\-]/g, '');
  return cleaned === '' || cleaned === '-' ? NaN : Number(cleaned);
};
const signed = (v) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(1)}x`;

/** $48.2M, $1.24B, $850K */
export function money(v) {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  return `$${Math.round(v / 1e3).toLocaleString('en-US')}K`;
}

/** Indicative valuation from the form values. Returns an error string when it can't. */
export function value(input) {
  const base = SECTOR[input.sector];
  if (base === undefined) return { error: 'Choose an industry sector to run the valuation.', field: 'sector' };
  let { revenue, ebitda, margin } = input;
  // Fill whichever of EBITDA and margin is missing from the other and revenue.
  if (!(ebitda > 0) && revenue > 0 && margin > 0) ebitda = (revenue * margin) / 100;
  if (!(margin > 0) && revenue > 0 && ebitda > 0) margin = (ebitda / revenue) * 100;
  if (!(ebitda > 0)) {
    return { error: 'Add EBITDA, or revenue with an EBITDA margin, to run the valuation.', field: 'ebitda' };
  }

  const stage = STAGE[input.stage] ?? 0;
  const region = REGION[input.region] ?? 0;
  const growth = Number.isFinite(input.growth) ? clamp(-2, 2.5, (input.growth - 10) * 0.06) : 0;
  const quality = margin > 0 ? clamp(-1, 1.2, (margin - 20) * 0.04) : 0;
  const mid = Math.max(2, base + stage + region + growth + quality);
  const spread = input.stage === 'Turnaround / Distressed' ? 1.4 : 0.9;
  const low = Math.max(1.5, mid - spread);
  const high = mid + spread;

  // Confidence: how complete the picture is, less for the riskier stages.
  const given = ['sector', 'stage', 'revenue', 'ebitda', 'growth', 'margin', 'region'].filter((k) => {
    const v = input[k];
    return typeof v === 'string' ? v !== '' : Number.isFinite(v);
  }).length;
  let confidence = 52 + given * 6;
  if (input.stage === 'Turnaround / Distressed') confidence -= 10;
  if (input.stage === 'Early-Stage / Growth') confidence -= 4;
  confidence = clamp(40, 94, Math.round(confidence));

  return {
    low: low * ebitda,
    high: high * ebitda,
    multipleLow: low,
    multipleHigh: high,
    confidence,
    notes: {
      range: `Indicative, from ${input.sector} sector multiples applied to EBITDA of ${money(ebitda)}${input.region ? `, ${input.region}` : ''}.`,
      multiple: `Sector base ${base.toFixed(1)}x. Growth ${signed(growth)}, margin quality ${signed(quality)}, stage ${signed(stage)}, region ${signed(region)}.`,
      confidence:
        confidence >= 80
          ? 'High confidence. The inputs are complete and the sector multiples are stable.'
          : confidence >= 65
            ? 'Moderate confidence. Add the missing inputs to tighten the estimate.'
            : 'Low confidence. Treat this as a first indication only.',
    },
  };
}

const format = {
  range: (r) => `${money(r.low)} — ${money(r.high)}`,
  multiple: (r) => `${r.multipleLow.toFixed(1)}x — ${r.multipleHigh.toFixed(1)}x`,
  confidence: (r) => `${Math.round(r.confidence)}%`,
};

const reduced = () => window.matchMedia(MOTION.query.reduce).matches;
const motionOn = () => !!gsap && window.__motionReady !== false && !reduced();

/**
 * Wires the form. Safe to call once per page.
 * @param {Element} scope  the valuation section
 */
export function valuationTool(scope) {
  const form = scope.querySelector('form[data-val]');
  if (!form) return;
  const q = (sel) => scope.querySelector(sel);
  const out = {
    range: q('[data-val-out="range"]'),
    multiple: q('[data-val-out="multiple"]'),
    confidence: q('[data-val-out="confidence"]'),
  };
  const notes = {
    range: q('[data-val-note="range"]'),
    multiple: q('[data-val-note="multiple"]'),
    confidence: q('[data-val-note="confidence"]'),
  };
  const bar = q('[data-val-bar]');
  const pct = q('[data-val-pct]');
  const scan = q('[data-val-scan]');
  const status = q('[data-val-status]');
  const panel = q('.er-val-results-panel');
  const button = form.querySelector('button[type="submit"]');
  let running = null;

  // Money fields read back with thousands separators.
  form.querySelectorAll('[data-val-money]').forEach((input) => {
    input.addEventListener('blur', () => {
      const v = num(input.value);
      if (Number.isFinite(v)) input.value = Math.round(v).toLocaleString('en-US');
    });
  });
  form.addEventListener('input', (e) => e.target.removeAttribute?.('aria-invalid'));

  const say = (text, error = false) => {
    if (!status) return;
    status.textContent = text;
    status.classList.toggle('is-error', error);
  };

  const write = (r, shown = r) => {
    for (const key of Object.keys(out)) if (out[key]) out[key].textContent = format[key](shown);
    if (pct) pct.textContent = `${Math.round(shown.confidence)} / 100`;
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const input = {
      sector: String(data.get('sector') || ''),
      stage: String(data.get('stage') || ''),
      region: String(data.get('region') || ''),
      revenue: num(data.get('revenue')),
      ebitda: num(data.get('ebitda')),
      growth: num(data.get('growth')),
      margin: num(data.get('margin')),
    };
    const r = value(input);
    if (r.error) {
      say(r.error, true);
      const field = form.elements.namedItem(r.field);
      if (field) {
        field.setAttribute('aria-invalid', 'true');
        field.focus();
      }
      return;
    }

    running?.kill();
    scope.setAttribute('data-val-ran', ''); // stops the example count-up (valuationIntro)
    const finish = () => {
      write(r);
      for (const key of Object.keys(notes)) if (notes[key]) notes[key].textContent = r.notes[key];
      if (bar) bar.style.width = `${r.confidence}%`;
      panel?.classList.remove('is-busy');
      if (button) button.disabled = false;
      say(`Indicative valuation ready: ${format.range(r)}.`);
    };

    if (!motionOn()) {
      finish();
      return;
    }

    // Staged run: scan, status steps, then the figures count up from where they are.
    if (button) button.disabled = true;
    panel?.classList.add('is-busy');
    const to = { low: r.low, high: r.high, multipleLow: r.multipleLow, multipleHigh: r.multipleHigh, confidence: r.confidence };
    // Count up from half way, so the figures climb into place rather than from nothing.
    const from = Object.fromEntries(Object.entries(to).map(([k, v]) => [k, v * 0.5]));
    const shown = { ...from };
    const steps = ['Matching sector multiples…', 'Adjusting for growth and margin…', 'Weighting stage and region…'];
    running = gsap.timeline({ onComplete: () => (running = null) });
    steps.forEach((text, i) => running.call(() => say(text), [], i * 0.45));
    if (scan) {
      running.fromTo(
        scan,
        { autoAlpha: 1, y: -120 },
        { y: () => (panel?.offsetHeight || 400), duration: 1.3, ease: 'power1.inOut' },
        0,
      );
      running.to(scan, { autoAlpha: 0, duration: 0.25 }, 1.15);
    }
    running.call(() => {
      panel?.classList.remove('is-busy');
      for (const key of Object.keys(notes)) if (notes[key]) notes[key].textContent = r.notes[key];
      if (bar) bar.style.width = `${r.confidence}%`;
    }, [], 1.35);
    running.fromTo(
      shown,
      from,
      // immediateRender false: the old figures stay (dimmed) until the scan has passed.
      { ...to, duration: 1.4, ease: 'expo.out', immediateRender: false, onUpdate: () => write(r, shown) },
      1.35,
    );
    running.call(finish, [], '>');
  });
}

/**
 * Motion only: the example figures count up the first time the results come into view.
 * @param {Element} scope
 * @param {import('../core/core.js').MotionEnv} env
 */
export function valuationIntro(scope, env) {
  const values = Array.from(scope.querySelectorAll('[data-val-out]'));
  const bar = scope.querySelector('[data-val-bar]');
  const panel = scope.querySelector('.er-val-results-panel');
  if (!values.length || !panel) return;
  const originals = values.map((el) => el.textContent);
  const ran = () => scope.hasAttribute('data-val-ran');
  const width = bar?.style.width || '';
  const tweens = [];
  if (bar) bar.style.width = '0%';
  env.onCleanup(() => {
    tweens.forEach((tween) => tween.kill());
    if (ran()) return;
    if (bar) bar.style.width = width;
    values.forEach((el, n) => (el.textContent = originals[n]));
  });

  ScrollTrigger.create({
    trigger: panel,
    start: 'top 75%',
    once: true,
    onEnter: () => {
      if (ran()) return;
      if (bar) bar.style.width = width;
      values.forEach((el, n) => {
        const text = originals[n];
        // Count every number in the text up together, keeping its decimals.
        const parts = text.split(/(\d+(?:\.\d+)?)/);
        const targets = parts.map((p, i) => (i % 2 ? parseFloat(p) : null));
        const decimals = parts.map((p, i) => (i % 2 ? (p.split('.')[1] || '').length : 0));
        const state = { t: 0 };
        const tween = gsap.to(state, {
          t: 1,
          duration: 1.6,
          delay: n * 0.15,
          ease: 'expo.out',
          onUpdate: () => {
            if (ran()) return tween.kill(); // a real run has taken over these figures
            el.textContent = parts.map((p, i) => (i % 2 ? (targets[i] * state.t).toFixed(decimals[i]) : p)).join('');
          },
        });
        tweens.push(tween);
      });
    },
  });
}
