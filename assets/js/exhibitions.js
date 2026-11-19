// Exhibitions page: masonry layout, continent filter, year sort, chips and search.
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const canHover = matchMedia('(hover: hover)');
const MOBILE = 760;

const wg = $('#wg'), chipsEl = $('#wchips'), search = $('#ws'), empty = $('#wempty');
const works = $$('#wg .wk');

/* ---------- Layout ----------
   A masonry on the 10 inner columns of the 12-column grid (columns 2–11; mobile uses all 12). Works start on `step` column boundaries and
   take one of the widths listed for their orientation (P = portrait, L =
   landscape). The listed order is the preferred rhythm; a work only departs from
   it when another width fills a low spot better, so no column is left behind.
   Every vertical and horizontal gap equals the gutter. */
const SPANS = {
  desktop: { cols: 10, step: 2, P: [4, 2, 4, 4, 2, 4], L: [6, 4, 6] },
  mobile: { cols: 12, step: 6, P: [6], L: [12] }
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

let lastWidth = 0;
function layout() {
  const visible = sorted().filter(fig => !fig.hidden);
  const cfg = innerWidth <= MOBILE ? SPANS.mobile : SPANS.desktop;
  const field = document.createElement('div');
  field.className = 'wl';
  wg.replaceChildren(field);
  const W = field.clientWidth, g = parseFloat(getComputedStyle(field).columnGap) || 0;
  lastWidth = innerWidth;
  const colW = (W - (cfg.cols - 1) * g) / cfg.cols;
  const heights = new Array(cfg.cols).fill(0); // bottom edge of each column
  const used = { P: 0, L: 0 };
  const GAP_WEIGHT = 2, OFF_RHYTHM = W * 0.12; // how strongly to avoid holes / leaving the preferred width

  visible.forEach(fig => {
    field.append(fig);
    const cap = fig.querySelector('figcaption');
    const o = ratio(fig) >= 1 ? 'L' : 'P';
    const preferred = cfg[o][used[o]++ % cfg[o].length];
    // Score every width and start column: lowest top edge, with a penalty for
    // the empty space left beneath the work and for leaving the preferred width.
    let best = null;
    [...new Set(cfg[o])].forEach(sp => {
      fig.className = 'wk s' + sp; // measure the caption at this width
      const w = sp * colW + (sp - 1) * g, h = w / ratio(fig) + cap.offsetHeight;
      for (let c = 0; c + sp <= cfg.cols; c += cfg.step) {
        const run = heights.slice(c, c + sp), top = Math.max(...run);
        const gap = top - run.reduce((n, v) => n + v, 0) / sp;
        const score = top + GAP_WEIGHT * gap + (sp === preferred ? 0 : OFF_RHYTHM);
        if (!best || score < best.score - 0.5) best = { score, span: sp, c, top, h };
      }
    });
    const { span, c: bestc, top: bestTop, h } = best;
    fig.className = 'wk rv s' + span + (fig.classList.contains('in') ? ' in' : '');
    fig.style.left = bestc * (colW + g) + 'px';
    fig.style.top = bestTop + 'px';
    for (let c = bestc; c < bestc + span; c++) heights[c] = bestTop + h + g;
    field.append(fig);
  });
  field.style.height = Math.max(0, Math.max(...heights) - g) + 'px';

  // Hidden works stay in the DOM so they can come back.
  const parked = document.createElement('div');
  parked.hidden = true;
  works.filter(fig => fig.hidden).forEach(fig => parked.append(fig));
  wg.append(parked);
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

// "Year" is a sort, not a filter: one choice at a time, oldest-to-newest or the reverse.
// Exhibitions with no year yet always go last.
function sorted() {
  const pick = selected.find(s => s.group === 'year');
  if (!pick) return works;
  const dir = pick.value === 'Oldest to newest' ? 1 : -1;
  const year = fig => parseInt(fig.dataset.year, 10);
  return works.slice().sort((a, b) => {
    const ya = year(a), yb = year(b);
    if (isNaN(ya) || isNaN(yb)) return isNaN(ya) - isNaN(yb); // blank years last, original order kept
    return (ya - yb) * dir;
  });
}

function matches(fig) {
  const q = search.value.trim().toLowerCase();
  const d = fig.dataset;
  if (q && ![d.title, d.location, d.continent, d.year].join(' ').toLowerCase().includes(q)) return false;
  // OR within a group, AND across groups.
  for (const group of ['continent']) {
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
    const label = document.createElement('span');
    label.className = 'chip-l';
    const text = group === 'year' ? 'Year: ' + value : value;
    label.textContent = text;
    const x = document.createElement('span');
    x.className = 'chip-x';
    x.setAttribute('aria-hidden', 'true');
    x.textContent = '\u00d7';
    b.append(label, x);
    b.setAttribute('aria-label', 'Remove ' + (group === 'year' ? 'sort' : 'filter') + ': ' + text);
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
  if (i > -1) selected.splice(i, 1);
  else {
    if (group === 'year') for (let j = selected.length - 1; j >= 0; j--) if (selected[j].group === 'year') selected.splice(j, 1);
    selected.push({ group, value });
  }
  sync();
}

search.addEventListener('input', applyFilters);

/* ---------- Menus ----------
   Hovering the arrow or the filter title opens a menu; leaving the menu closes
   it. Tapping either, or pressing the arrow, toggles it on touch screens and keyboards. */
const menus = $$('.wf');
function setOpen(menu, open) {
  menu.classList.toggle('open', open);
  menu.querySelector('.wf-b').setAttribute('aria-expanded', open);
}
menus.forEach(menu => {
  const btn = menu.querySelector('.wf-b'), label = menu.querySelector('.wf-l');
  // The arrow and the filter title both open the menu.
  [btn, label].forEach(el => {
    el.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') setOpen(menu, true); });
    el.addEventListener('click', () => {
      const open = canHover.matches && menu.matches(':hover') ? true : !menu.classList.contains('open');
      menus.forEach(m => m !== menu && setOpen(m, false));
      setOpen(menu, open);
    });
  });
  menu.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') setOpen(menu, false); });
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
let resizeFrame;
addEventListener('resize', () => {
  if (innerWidth === lastWidth) return;
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(layout);
});
layout();

// Same as main.js: tuck the footer signature against the footer.
function sg(){const s=$('.sign'),fs=parseFloat(getComputedStyle(s).fontSize),m=document.createElement('canvas').getContext('2d');m.font='300 '+fs+'px "Valley Sans"';const t=m.measureText('ISAMU NOGUCHI'),A=t.fontBoundingBoxAscent,D=t.fontBoundingBoxDescent;if(A)s.style.marginBottom=-((fs-(A+D))/2+D)+'px'}
document.fonts.ready.then(sg);addEventListener('resize',sg);
