// About page: reveals, parallax, line CTA and the footer signature.
// It has its own script because main.js expects home-page elements.
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const MOBILE = 760;
// Hero video: hold on the first frame for reduced-motion users (same as the home page).
const heroVideo = $('#hv');
if (heroVideo && reducedMotion.matches) { heroVideo.removeAttribute('autoplay'); heroVideo.pause(); }
// Adds .in the first time an element is visible enough.
const once = threshold => new IntersectionObserver((entries, observer) => entries.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); observer.unobserve(e.target); }
}), { threshold });

// Line CTAs draw in when half visible (same as the home page).
const lineObserver = once(.5);
$$('.lines').forEach(el => lineObserver.observe(el));

// Photos and paragraphs rise in; quote marks and quotes fade in, staggered.
const revealObserver = once(.12);
$$('.abg>:not(.abq):not(.cta)').forEach(el => {
  el.classList.add('rv');
  revealObserver.observe(el);
});
$$('.abq').forEach(quote => quote.querySelectorAll('.qm,blockquote').forEach((el, i) => {
  el.classList.add('qf');
  el.style.transitionDelay = i * .2 + 's';
  revealObserver.observe(el);
}));

// Parallax. Each data-par element drifts by its speed, measured against its section
// so the movement never feeds back into the measurement.
const drifting = $$('[data-par]').map(el => [el.parentElement, el, +el.dataset.par]);
const bleeds = $$('.sunf').map(frame => [frame, frame.firstElementChild]);
const hero = $('.abh'), heroMedia = $('.abh-m');

function parallax() {
  const h = innerHeight, still = reducedMotion.matches, small = innerWidth <= MOBILE;
  // Read every rectangle first, then write.
  const heroTop = hero.getBoundingClientRect().top;
  const bleedRects = bleeds.map(([frame]) => frame.getBoundingClientRect());
  const sectionRects = drifting.map(([section]) => section.getBoundingClientRect());
  const photoRects = drifting.map(([, el]) => el.getBoundingClientRect());

  // The hero photo moves at a third of the scroll speed.
  heroMedia.style.transform = still ? '' : `translate3d(0, ${Math.max(0, -heroTop) * .33}px, 0)`;
  // Full-bleed photos slide inside their frames (same curve as the home page's garden).
  bleeds.forEach(([, media], i) => {
    const r = bleedRects[i];
    const t = still ? .5 : Math.max(0, Math.min(1, (h - r.top) / (h + r.height)));
    media.style.transform = `translateY(${-(12 + 12 * t)}%)`;
  });
  const off = small || still;
  const shifts = drifting.map(([, , speed], i) => {
    const r = sectionRects[i];
    return off ? 0 : Math.max(-600, Math.min(600, h / 2 - (r.top + r.height / 2))) * speed;
  });
  if (!off) keepApart(photoRects, shifts);
  drifting.forEach(([, el], i) => {
    el.style.translate = off ? '' : `0 ${shifts[i]}px`;
    applied[i] = off ? 0 : shifts[i];
  });
}

// Photos in different sections drift at different speeds, so two photos stacked in the same column could slide
// into each other. Where that would happen, nudge the pair apart so a gap (at most MIN_GAP) always remains.
const MIN_GAP = 12;
const applied = drifting.map(() => 0); // the shift each photo had when its rectangle was last read
function keepApart(rects, shifts) {
  const rest = rects.map((r, i) => ({ top: r.top - applied[i], bottom: r.bottom - applied[i], left: r.left, right: r.right }));
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < rest.length; i++) for (let j = i + 1; j < rest.length; j++) {
      const a = rest[i], b = rest[j];
      if (Math.min(a.right, b.right) - Math.max(a.left, b.left) <= 0) continue; // not in the same column
      const [up, low] = a.top <= b.top ? [i, j] : [j, i];
      const restGap = rest[low].top - rest[up].bottom;
      if (restGap < 0) continue;
      const gap = restGap + shifts[low] - shifts[up], want = Math.min(MIN_GAP, restGap);
      if (gap < want) {
        const fix = (want - gap) / 2;
        shifts[low] += fix;
        shifts[up] -= fix;
      }
    }
  }
}

// Scroll events only request work; one frame drives all scroll effects.
let frame = 0;
function requestUpdate() {
  if (!frame) frame = requestAnimationFrame(() => { frame = 0; parallax(); });
}
addEventListener('scroll', requestUpdate, { passive: true });
addEventListener('resize', requestUpdate);
requestUpdate();

function sg(){const s=$('.sign'),fs=parseFloat(getComputedStyle(s).fontSize),m=document.createElement('canvas').getContext('2d');m.font='300 '+fs+'px "Valley Sans"';const t=m.measureText('ISAMU NOGUCHI'),A=t.fontBoundingBoxAscent,D=t.fontBoundingBoxDescent;if(A)s.style.marginBottom=-((fs-(A+D))/2+D)+'px'}
document.fonts.ready.then(sg);addEventListener('resize',sg);
