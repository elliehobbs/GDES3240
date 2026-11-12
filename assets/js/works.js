// Works page: masonry layout, filter menus, chips and search.
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const canHover = matchMedia('(hover: hover)');
const MOBILE = 760;

const wg = $('#wg'), chipsEl = $('#wchips'), search = $('#ws'), empty = $('#wempty');
const works = $$('#wg .wk');

/* ---------- Layout ----------
   The composition is a repeating template of slots. Each slot has a width in
   grid columns and an orientation (P = portrait, L = landscape). Works fill the
   first open slot that matches their own proportions, in reading order, so the
   gaps stay equal to the gutter no matter what aspect ratio an image has.
   Slots left empty are dropped. A new copy of the template starts when needed. */
const DESKTOP_TEMPLATE = {
  // Left lane: stacked, right-aligned to the end of column 5.
  left: [[4, 'P'], [2, 'P'], [3, 'P'], [2, 'P'], [4, 'L'], [2, 'P']],
  // Right lane: rows starting at column 6.
  right: [[[3, 'P'], [3, 'L']], [[4, 'P'], [2, 'P']], [[3, 'P'], [3, 'L']], [[5, 'L']]],
  // Fill order, top to bottom across both lanes: [lane, index, slotInRow]
  order: [['left', 0], ['right', 0, 0], ['right', 0, 1], ['right', 1, 0], ['right', 1, 1],
          ['left', 1], ['left', 2], ['right', 2, 0], ['right', 2, 1], ['left', 3],
          ['right', 3, 0], ['left', 4], ['left', 5]]
};
const MOBILE_TEMPLATE = {
  left: [],
  right: [[[6, 'P'], [6, 'P']], [[12, 'L']], [[7, 'P'], [5, 'P']], [[10, 'L']]],
  order: [['right', 0, 0], ['right', 0, 1], ['right', 1, 0], ['right', 2, 0], ['right', 2, 1], ['right', 3, 0]]
};

function ratio(fig) {
  const img = fig.querySelector('img');
  if (img) {
    const w = +img.getAttribute('width') || img.naturalWidth, h = +img.getAttribute('height') || img.naturalHeight;
    return w && h ? w / h : 0.75;
  }
  const ph = fig.querySelector('.ph');
  return ph.dataset.w / ph.dataset.h;
}

// Placeholders take their shape from data-w/data-h; real images size themselves.
works.forEach(fig => {
  const ph = fig.querySelector('.ph');
  if (ph) fig.style.setProperty('--ar', ph.dataset.w + '/' + ph.dataset.h);
  const img = fig.querySelector('img');
  if (img && !img.complete) img.addEventListener('load', () => layout(), { once: true });
});

let lastMode = null;
function layout() {
  const visible = works.filter(fig => !fig.hidden);
  const tpl = innerWidth <= MOBILE ? MOBILE_TEMPLATE : DESKTOP_TEMPLATE;
  lastMode = tpl;
  const copies = [];
  const newCopy = () => {
    const copy = {
      left: tpl.left.map(s => ({ span: s[0], o: s[1], fig: null })),
      right: tpl.right.map(row => row.map(s => ({ span: s[0], o: s[1], fig: null })))
    };
    copy.seq = tpl.order.map(([lane, i, j]) => lane === 'left' ? copy.left[i] : copy.right[i][j]);
    copies.push(copy);
    return copy;
  };
  newCopy();
  visible.forEach(fig => {
    const o = ratio(fig) >= 1 ? 'L' : 'P';
    let slot = null;
    for (const copy of copies) { slot = copy.seq.find(s => !s.fig && s.o === o); if (slot) break; }
    if (!slot) slot = newCopy().seq.find(s => s.o === o);
    slot.fig = fig;
  });

  const laneL = document.createElement('div'), laneR = document.createElement('div');
  laneL.className = 'wl-l';
  laneR.className = 'wl-r';
  const place = slot => {
    slot.fig.className = 'wk rv s' + slot.span + (slot.fig.classList.contains('in') ? ' in' : '');
    return slot.fig;
  };
  copies.forEach(copy => {
    copy.left.filter(s => s.fig).forEach(s => laneL.append(place(s)));
    copy.right.forEach(row => {
      const filled = row.filter(s => s.fig);
      if (!filled.length) return;
      const r = document.createElement('div');
      r.className = 'wr';
      filled.forEach(s => r.append(place(s)));
      laneR.append(r);
    });
  });
  // Hidden works stay in the DOM so they can come back.
  const parked = document.createElement('div');
  parked.hidden = true;
  works.filter(fig => fig.hidden).forEach(fig => parked.append(fig));
  wg.replaceChildren(laneL, laneR, parked);
  wg.classList.add('laid');
  empty.hidden = visible.length > 0;
  works.forEach(fig => { if (!fig.classList.contains('in')) reveal.observe(fig); });
}

const reveal = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); }
}), { threshold: .12 });
works.forEach(fig => fig.classList.add('rv'));

/* ---------- Filtering ---------- */
const selected = []; // [{ group, value }] in the order they were picked
let fadeTimer;

function matches(fig) {
  const q = search.value.trim().toLowerCase();
  const d = fig.dataset;
  if (q && ![d.title, d.medium, d.category, d.period].join(' ').toLowerCase().includes(q)) return false;
  // OR within a group, AND across groups.
  for (const group of ['medium', 'category', 'period']) {
    const picks = selected.filter(s => s.group === group).map(s => s.value);
    if (picks.length && !picks.includes(d[group])) return false;
  }
  return true;
}

function applyFilters() {
  const run = () => {
    works.forEach(fig => { fig.hidden = !matches(fig); });
    layout();
    wg.classList.remove('is-changing');
  };
  clearTimeout(fadeTimer);
  if (reducedMotion.matches) { run(); return; }
  // Fade the grid out, re-slot the works, then fade back in.
  wg.classList.add('is-changing');
  fadeTimer = setTimeout(run, 300);
}

function renderChips() {
  chipsEl.replaceChildren(...selected.map(({ group, value }) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = value;
    b.setAttribute('aria-label', 'Remove filter: ' + value);
    b.addEventListener('click', () => toggle(group, value));
    return b;
  }));
  if (selected.length) {
    const clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'wclear';
    clear.textContent = 'Clear all';
    clear.addEventListener('click', () => {
      selected.length = 0;
      sync();
    });
    chipsEl.append(clear);
  }
}

function sync() {
  $$('.wf').forEach(menu => {
    const group = menu.dataset.group;
    menu.querySelectorAll('.wf-ls button').forEach(btn => {
      const on = selected.some(s => s.group === group && s.value === btn.textContent);
      btn.classList.toggle('on', on);
      btn.setAttribute('aria-pressed', on);
    });
  });
  renderChips();
  applyFilters();
}

function toggle(group, value) {
  const i = selected.findIndex(s => s.group === group && s.value === value);
  if (i > -1) selected.splice(i, 1); else selected.push({ group, value });
  sync();
}

search.addEventListener('input', applyFilters);

/* ---------- Menus ----------
   Hovering the arrow opens a menu; leaving the menu closes it. Tapping or
   pressing the arrow toggles it on touch screens and keyboards. */
const menus = $$('.wf');
function setOpen(menu, open) {
  menu.classList.toggle('open', open);
  menu.querySelector('.wf-b').setAttribute('aria-expanded', open);
}
menus.forEach(menu => {
  const btn = menu.querySelector('.wf-b');
  btn.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') setOpen(menu, true); });
  menu.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') setOpen(menu, false); });
  btn.addEventListener('click', () => {
    const open = canHover.matches && menu.matches(':hover') ? true : !menu.classList.contains('open');
    menus.forEach(m => m !== menu && setOpen(m, false));
    setOpen(menu, open);
  });
  menu.addEventListener('focusout', e => { if (!menu.contains(e.relatedTarget)) setOpen(menu, false); });
  menu.addEventListener('keydown', e => {
    if (e.key === 'Escape') { setOpen(menu, false); btn.focus(); }
  });
  menu.querySelectorAll('.wf-ls button').forEach(item => {
    item.setAttribute('aria-pressed', false);
    item.addEventListener('click', () => toggle(menu.dataset.group, item.textContent));
  });
});
document.addEventListener('click', e => {
  menus.forEach(m => { if (!m.contains(e.target)) setOpen(m, false); });
});

/* ---------- Resize + footer ---------- */
addEventListener('resize', () => {
  const tpl = innerWidth <= MOBILE ? MOBILE_TEMPLATE : DESKTOP_TEMPLATE;
  if (tpl !== lastMode) layout();
});
layout();

// Same as main.js: tuck the footer signature against the footer.
function sg(){const s=$('.sign'),fs=parseFloat(getComputedStyle(s).fontSize),m=document.createElement('canvas').getContext('2d');m.font='300 '+fs+'px "Valley Sans"';const t=m.measureText('ISAMU NOGUCHI'),A=t.fontBoundingBoxAscent,D=t.fontBoundingBoxDescent;if(A)s.style.marginBottom=-((fs-(A+D))/2+D)+'px'}
document.fonts.ready.then(sg);addEventListener('resize',sg);
