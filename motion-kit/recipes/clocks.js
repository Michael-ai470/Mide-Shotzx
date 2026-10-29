// recipes/clocks.js (Web Motion Kit)
// Office cards with their local time. Every [data-clock="Area/City"] gets the time there
// (hours and minutes, the colon ticking), the weekday, and whether it is business hours
// (Monday to Friday, 9:00 to 18:00 local). Not motion: it is information, so it runs for
// everyone, and it updates once a second. Adds .is-live to the scope, which shows the clocks
// (css/about.css); with scripts off they stay hidden.

/** @param {Element} scope */
export function clocks(scope) {
  const cards = Array.from(scope.querySelectorAll('[data-clock]'));
  if (!cards.length || typeof Intl === 'undefined') return;
  const parts = (zone) => {
    const f = new Intl.DateTimeFormat('en-GB', { timeZone: zone, hour: '2-digit', minute: '2-digit', weekday: 'short', hourCycle: 'h23' });
    return () => Object.fromEntries(f.formatToParts(new Date()).map((p) => [p.type, p.value]));
  };
  const items = cards.map((card) => {
    const zone = card.getAttribute('data-clock') || 'UTC';
    let read;
    try {
      read = parts(zone);
    } catch {
      return null; // an unknown zone: leave that card without a clock
    }
    const box = document.createElement('div');
    box.className = 'ab-clock';
    box.innerHTML = '<span class="ab-clock-time"></span><span class="ab-clock-day"></span><span class="ab-clock-state"></span>';
    card.appendChild(box);
    return { read, time: box.children[0], day: box.children[1], state: box.children[2] };
  }).filter(Boolean);

  const tick = () => {
    for (const it of items) {
      const p = it.read();
      const h = Number(p.hour);
      const open = !['Sat', 'Sun'].includes(p.weekday) && h >= 9 && h < 18;
      it.time.innerHTML = `${p.hour}<i>:</i>${p.minute}`;
      it.day.textContent = `${p.weekday}, local time`;
      it.state.textContent = open ? 'Office hours' : 'After hours';
      it.state.classList.toggle('is-open', open);
    }
  };
  tick();
  setInterval(tick, 1000);
  scope.classList.add('is-live');
}
