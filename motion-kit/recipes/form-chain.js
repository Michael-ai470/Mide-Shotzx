// recipes/form-chain.js (Web Motion Kit)
// A progress chain for a form: one node per field, linked like blocks. A node lights when its
// field holds a valid answer, and the link to it lights with it; the caption counts them
// ("3 of 7 details"). Not motion: it is feedback, so it runs for everyone. The colours ease
// in CSS (css/token.css); nothing here is animated by GSAP.
//
// Markup: form[data-form-chain] with [data-chain-nodes] (empty; nodes are made here) and
// [data-chain-count]. Every input, select and textarea with a name counts.

/** @param {Element} scope */
export function formChain(scope) {
  const form = /** @type {HTMLFormElement | null} */ (scope.matches('form[data-form-chain]') ? scope : scope.querySelector('form[data-form-chain]'));
  const holder = form?.querySelector('[data-chain-nodes]');
  if (!form || !holder) return;
  const count = form.querySelector('[data-chain-count]');
  const fields = /** @type {HTMLInputElement[]} */ (Array.from(form.querySelectorAll('input[name], select[name], textarea[name]')));
  if (!fields.length) return;

  holder.replaceChildren(
    ...fields.map(() => {
      const node = document.createElement('span');
      node.className = 'te-chain-node';
      return node;
    }),
  );
  const nodes = Array.from(holder.children);
  form.classList.add('has-chain');

  const done = (field) => field.value.trim() !== '' && field.checkValidity();
  const update = () => {
    let n = 0;
    fields.forEach((field, i) => {
      const ok = done(field);
      nodes[i].classList.toggle('is-done', ok);
      if (ok) n += 1;
    });
    if (count) count.textContent = `${n} of ${fields.length} details`;
  };
  form.addEventListener('input', update);
  form.addEventListener('change', update);
  // main.js resets the form after it "sends"; follow it.
  form.addEventListener('reset', () => setTimeout(update, 0));
  update();
}
