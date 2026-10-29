// recipes/enquiry-form.js (Web Motion Kit)
// The enquiry form, honest. Not motion: it runs for everyone.
//   - A division can arrive picked from the address (?division=jet-el).
//   - Errors are checked on submit and shown under their own field; the first one is focused.
//   - The message box grows with its text and counts characters against its maxlength.
//   - Submitting really posts the form (fetch, the form's own action and method) and waits:
//     a 2xx shows the sent panel in place of the form; anything else (no handler, offline,
//     a timeout) says so plainly and offers a ready-written email with everything typed, so
//     an enquiry is never lost. The form keeps its contents on failure.
//   - Email addresses marked [data-copy] get a Copy button.
// With scripts off the form posts the ordinary way.
//
// Markup: form[data-enquiry] (no data-ajax: js/main.js would fake a success), with
// [data-error-for="field"] slots, [data-char-count] (for the textarea), [data-status] (the
// failure note), a sibling [data-sent] panel ([data-sent-name], [data-sent-again]); and
// [data-copy] elements holding an address. data-fallback on the form: the address to email.

import { gsap } from '../core/core.js';
import { getLenis } from '../core/smooth-scroll.js';

const TIMEOUT = 15000;
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** @param {Element} scope */
export function enquiryForm(scope) {
  const form = /** @type {HTMLFormElement | null} */ (scope.querySelector('form[data-enquiry]'));
  if (!form) return;
  const status = /** @type {HTMLElement | null} */ (form.querySelector('[data-status]'));
  const sent = /** @type {HTMLElement | null} */ (scope.querySelector('[data-sent]'));
  const button = /** @type {HTMLButtonElement | null} */ (form.querySelector('[type="submit"]'));
  const label = button?.textContent || '';
  const fallback = form.dataset.fallback || '';
  form.classList.add('is-live');
  form.noValidate = true; // the messages below replace the browser's bubbles

  // A division picked from the address.
  const wanted = new URLSearchParams(window.location.search).get('division');
  if (wanted) {
    const radio = /** @type {HTMLInputElement | null} */ (form.querySelector(`input[name="division"][value="${CSS.escape(wanted)}"]`));
    if (radio) radio.checked = true;
  }

  // The message box: grows with its text, counts against maxlength.
  const area = /** @type {HTMLTextAreaElement | null} */ (form.querySelector('textarea'));
  // [data-char-count], not [data-count]: js/main.js counts up every [data-count] number.
  const count = form.querySelector('[data-char-count]');
  const grow = () => {
    if (!area) return;
    area.style.height = 'auto';
    area.style.height = `${Math.max(140, area.scrollHeight + 2)}px`;
    if (count) count.textContent = `${area.value.length.toLocaleString('en-US')} / ${(area.maxLength > 0 ? area.maxLength : 2000).toLocaleString('en-US')}`;
  };
  area?.addEventListener('input', grow);
  grow();

  // Errors, under their own field.
  const fields = /** @type {(HTMLInputElement | HTMLTextAreaElement)[]} */ (Array.from(form.querySelectorAll('input[name], textarea[name], select[name]')));
  const slot = (field) => form.querySelector(`[data-error-for="${field.name}"]`);
  const message = (field) => {
    const v = field.validity;
    if (v.valueMissing) return field.type === 'email' ? 'Please add your email address.' : field.name === 'message' ? 'Please tell us a little about your enquiry.' : field.name === 'name' ? 'Please add your name.' : 'Please fill this in.';
    if (v.typeMismatch && field.type === 'email') return 'That email address looks incomplete.';
    if (v.tooLong) return 'That is a little too long.';
    return field.validationMessage;
  };
  const check = (field) => {
    if (field.type === 'radio') return true;
    const ok = field.checkValidity();
    field.toggleAttribute('aria-invalid', !ok);
    if (!ok) field.setAttribute('aria-invalid', 'true');
    const box = slot(field);
    if (box) box.textContent = ok ? '' : message(field);
    if (box?.id) field.setAttribute('aria-describedby', box.id);
    return ok;
  };
  fields.forEach((field) =>
    field.addEventListener(field.tagName === 'SELECT' ? 'change' : 'input', () => {
      if (field.hasAttribute('aria-invalid')) check(field);
    }),
  );

  const mailto = () => {
    const data = new FormData(form);
    const division = form.querySelector('input[name="division"]:checked')?.closest('label')?.querySelector('b')?.textContent || 'General';
    const body = [
      `Name: ${data.get('name') || ''}`,
      `Email: ${data.get('email') || ''}`,
      data.get('phone') ? `Phone: ${data.get('phone')}` : '',
      `Division: ${division}`,
      '',
      String(data.get('message') || ''),
    ].filter((line, i) => line !== '' || i === 4).join('\n');
    return `mailto:${fallback}?subject=${encodeURIComponent(`Enquiry: ${division}`)}&body=${encodeURIComponent(body)}`;
  };

  const showSent = () => {
    const name = String(new FormData(form).get('name') || '').trim().split(/\s+/)[0];
    const who = sent?.querySelector('[data-sent-name]');
    if (who) who.textContent = name ? `, ${name}` : '';
    form.hidden = true;
    if (!sent) return;
    sent.hidden = false;
    const heading = sent.querySelector('h3');
    heading?.setAttribute('tabindex', '-1');
    heading?.focus({ preventScroll: true });
    // The form was taller than the panel: the page just got shorter. Bring the panel into view.
    const box = sent.getBoundingClientRect();
    if (box.top < 90 || box.bottom > window.innerHeight) {
      const y = window.scrollY + box.top - 120;
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(y, { duration: reduced() ? 0 : 0.9 });
      else window.scrollTo({ top: y, behavior: reduced() ? 'auto' : 'smooth' });
    }
    if (gsap && !reduced()) {
      // Opacity, not autoAlpha: the heading must be focusable from the first frame.
      gsap.fromTo(sent, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' });
      const tick = sent.querySelectorAll('svg path, svg circle');
      tick.forEach((el) => {
        const len = /** @type {SVGGeometryElement} */ (el).getTotalLength?.() || 0;
        if (len) gsap.fromTo(el, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.9, delay: 0.2, ease: 'power2.inOut' });
      });
    }
  };

  sent?.querySelector('[data-sent-again]')?.addEventListener('click', () => {
    form.reset();
    grow();
    sent.hidden = true;
    form.hidden = false;
    form.querySelector('input')?.focus();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (status) status.hidden = true;
    const bad = fields.filter((field) => !check(field));
    if (bad.length) {
      bad[0].focus();
      return;
    }
    if (button) {
      button.disabled = true;
      button.classList.add('is-sending');
      button.textContent = 'Sending…';
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);
    let ok = false;
    try {
      const response = await fetch(form.action, {
        method: (form.method || 'POST').toUpperCase(),
        body: new FormData(form),
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      ok = response.ok;
    } catch {
      ok = false; // offline, blocked, no such handler, or too slow
    }
    clearTimeout(timer);
    if (button) {
      button.disabled = false;
      button.classList.remove('is-sending');
      button.textContent = label;
    }
    if (ok) return showSent();
    if (status) {
      status.innerHTML = '';
      status.append(
        'We couldn’t send your message just now. Your details are still here. ',
      );
      if (fallback) {
        const link = document.createElement('a');
        link.href = mailto();
        link.textContent = `Email it to ${fallback} instead`;
        status.append(link, ' — we’ve written it out for you.');
      }
      status.hidden = false;
      status.focus?.();
    }
  });

  // Copy buttons for the addresses.
  document.querySelectorAll('[data-copy]').forEach((el) => {
    const text = el.getAttribute('data-copy') || el.textContent?.trim() || '';
    if (!text || !navigator.clipboard) return;
    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'ct-copy';
    copy.textContent = 'Copy';
    copy.setAttribute('aria-label', `Copy ${text}`);
    copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(text);
        copy.textContent = 'Copied';
        copy.classList.add('is-done');
      } catch {
        copy.textContent = 'Press Ctrl+C';
      }
      setTimeout(() => {
        copy.textContent = 'Copy';
        copy.classList.remove('is-done');
      }, 2200);
    });
    el.after(copy);
  });
}
