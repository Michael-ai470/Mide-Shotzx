// js/contact.js
// The booking form, adapted from motion-kit/recipes/enquiry-form.js. Not motion: it runs
// for everyone. Errors show under their own field; submitting really posts to Formspree
// and waits. A failure keeps everything typed and offers a ready-written email instead,
// so an enquiry is never lost. With scripts off the form posts the ordinary way.
import './page.js';
import { gsap } from '../motion-kit/core/core.js';
import { getLenis } from '../motion-kit/core/smooth-scroll.js';

const TIMEOUT = 15000;
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const form = document.querySelector('form[data-enquiry]');
const sent = document.querySelector('[data-sent]');
const status = form?.querySelector('[data-status]');
const button = form?.querySelector('[type="submit"]');
const label = button?.innerHTML || '';
const fallback = form?.dataset.fallback || '';

if (form) {
  form.noValidate = true;

  // A service picked from the address (?service=couples), e.g. from a services page link.
  const wanted = new URLSearchParams(location.search).get('service');
  if (wanted) {
    const radio = form.querySelector(`input[name="service"][value="${CSS.escape(wanted)}"]`);
    if (radio) radio.checked = true;
  }

  const area = form.querySelector('textarea');
  const count = form.querySelector('[data-char-count]');
  const grow = () => {
    area.style.height = 'auto';
    area.style.height = `${Math.max(140, area.scrollHeight + 2)}px`;
    if (count) count.textContent = `${area.value.length} / ${area.maxLength}`;
  };
  area.addEventListener('input', grow);
  grow();

  const fields = Array.from(form.querySelectorAll('input[name]:not([type="radio"]), textarea[name]'));
  const message = (field) => {
    const v = field.validity;
    if (v.valueMissing) return { name: 'Please add your name.', email: 'Please add your email address.', message: 'Tell us a little about the shoot.' }[field.name] || 'Please fill this in.';
    if (v.typeMismatch) return 'That email address looks incomplete.';
    if (v.tooLong) return 'That is a little too long.';
    return field.validationMessage;
  };
  const check = (field) => {
    const ok = field.checkValidity();
    if (ok) field.removeAttribute('aria-invalid');
    else field.setAttribute('aria-invalid', 'true');
    const box = form.querySelector(`[data-error-for="${field.name}"]`);
    if (box) box.textContent = ok ? '' : message(field);
    return ok;
  };
  fields.forEach((field) => field.addEventListener('input', () => field.hasAttribute('aria-invalid') && check(field)));

  const mailto = () => {
    const data = new FormData(form);
    const service = form.querySelector('input[name="service"]:checked')?.value || 'General';
    const body = [
      `Name: ${data.get('name') || ''}`,
      `Email: ${data.get('email') || ''}`,
      data.get('phone') ? `Phone: ${data.get('phone')}` : '',
      data.get('date') ? `Date: ${data.get('date')}` : '',
      `Shoot: ${service}`,
      '',
      String(data.get('message') || ''),
    ].filter((line, i, all) => line !== '' || i === all.length - 2).join('\n');
    return `mailto:${fallback}?subject=${encodeURIComponent(`Booking enquiry: ${service}`)}&body=${encodeURIComponent(body)}`;
  };

  const showSent = () => {
    const name = String(new FormData(form).get('name') || '').trim().split(/\s+/)[0];
    sent.querySelector('[data-sent-name]').textContent = name ? `, ${name}` : '';
    form.hidden = true;
    sent.hidden = false;
    const heading = sent.querySelector('h3');
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
    const box = sent.getBoundingClientRect();
    if (box.top < 90 || box.bottom > window.innerHeight) {
      const y = window.scrollY + box.top - 120;
      const lenis = getLenis();
      lenis ? lenis.scrollTo(y, { duration: reduced() ? 0 : 0.9 }) : window.scrollTo({ top: y });
    }
    if (gsap && !reduced()) {
      // Opacity, not autoAlpha: the heading must be focusable from the first frame.
      gsap.fromTo(sent, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' });
      sent.querySelectorAll('svg path, svg circle').forEach((el) => {
        const len = el.getTotalLength?.() || 0;
        if (len) gsap.fromTo(el, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.9, delay: 0.2, ease: 'power2.inOut' });
      });
    }
  };

  sent.querySelector('[data-sent-again]').addEventListener('click', () => {
    form.reset();
    grow();
    sent.hidden = true;
    form.hidden = false;
    form.querySelector('input')?.focus();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.hidden = true;
    const bad = fields.filter((field) => !check(field));
    if (bad.length) {
      bad[0].focus();
      return;
    }
    button.disabled = true;
    button.classList.add('is-sending');
    button.textContent = 'Sending…';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);
    let ok = false;
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      ok = response.ok;
    } catch {
      ok = false; // offline, blocked or too slow
    }
    clearTimeout(timer);
    button.disabled = false;
    button.classList.remove('is-sending');
    button.innerHTML = label;
    if (ok) return showSent();
    status.textContent = 'We couldn’t send your message just now. Everything you typed is still here. ';
    const link = document.createElement('a');
    link.href = mailto();
    link.textContent = `Email it to ${fallback} instead`;
    status.append(link, ' — we’ve written it out for you.');
    status.hidden = false;
    status.focus();
  });
}

// Copy buttons for the direct lines.
document.querySelectorAll('[data-copy]').forEach((el) => {
  const text = el.getAttribute('data-copy');
  if (!text || !navigator.clipboard) return;
  const copy = document.createElement('button');
  copy.type = 'button';
  copy.className = 'copy-btn';
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
