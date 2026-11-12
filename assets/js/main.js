const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
/* Edit exhibition details here: [title, location, year] — one per image, in order */
const EX=[['Landscapes of Time','Chicago, IL','2023'],['Exhibition title','Location','Year'],['Exhibition title','Location','Year'],['Exhibition title','Location','Year']];
const sn=$('#sent'),nv=$('#nav');function stk(){nv.classList.toggle('stuck',sn.getBoundingClientRect().top<-.5)}stk();
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.5});
$$('.lines').forEach(l=>io.observe(l));
const sec = $('#ex'), trk = $('#trk'), its = [...trk.children];
const n = its.length, inf = $('#info');
let cur = 0, progress = null, frame = 0, lastTime = 0, infoTimer;
let dimensions;
let snappedPhoto = null;
// Cross 60% of a step to leave a detent; reverse below 40% to return.
const DETENT_THRESHOLD = .6;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

function setI(index) {
  cur = index;
  clearTimeout(infoTimer);
  const showCaption = () => {
    ['it', 'il', 'iy'].forEach((id, column) => {
      $('#' + id).textContent = EX[index][column];
    });
    inf.classList.remove('is-changing');
  };
  if (reducedMotion.matches) {
    showCaption();
    return;
  }
  // Swap the text only after the old caption has faded away.
  inf.classList.add('is-changing');
  infoTimer = setTimeout(showCaption, 400);
}

// Measure only on initialization or resize, rather than during every animation.
function measureExhibition() {
  const width = innerWidth, small = width <= 760;
  const margin = (small ? .05 : .029) * width;
  const gap = (small ? .03 : .015) * width;
  const column = (width - 2 * margin - 11 * gap) / 12;
  const large = small ? width - 2 * margin : 6 * column + 5 * gap;
  const thumb = small ? .4 * width : 2 * column + gap;
  dimensions = {
    gap, large, thumb,
    largeHeight: large / 1.42,
    thumbHeight: thumb * 1.35,
    distance: Math.max(1, sec.offsetHeight - innerHeight)
  };
  trk.parentNode.style.height = dimensions.largeHeight + 'px';
}

function lay(time, sectionTop) {
  const { gap, large, thumb, largeHeight, thumbHeight, distance } = dimensions;
  const raw = Math.min(n - 1, Math.max(0, -sectionTop / distance * (n - 1)));
  if (snappedPhoto === null) snappedPhoto = Math.round(raw);
  // Separate forward/backward thresholds prevent jitter near the midpoint.
  // Loops also handle fast scrolling or jumping several photos at once.
  while (snappedPhoto < n - 1 && raw >= snappedPhoto + DETENT_THRESHOLD) snappedPhoto++;
  while (snappedPhoto > 0 && raw <= snappedPhoto - DETENT_THRESHOLD) snappedPhoto--;
  const target = snappedPhoto;
  const elapsed = lastTime ? Math.min(64, time - lastTime) : 16;
  lastTime = time;
  if (progress === null || reducedMotion.matches) progress = target;
  else progress += (target - progress) * (1 - Math.exp(-elapsed / 140));
  const moving = Math.abs(target - progress) > .0001;
  if (!moving) progress = target;

  const index = Math.min(n - 2, Math.floor(progress));
  const fraction = progress - index;
  const widths = its.map((_, i) => {
    const active = Math.max(0, 1 - Math.abs(progress - i));
    return { width: thumb + active * (large - thumb),
             height: thumbHeight + active * (largeHeight - thumbHeight) };
  });
  // Follow the actual left edge, including every preceding photo and gap.
  const offset = widths.slice(0, index).reduce((sum, item) => sum + item.width + gap, 0)
    + fraction * (widths[index].width + gap);
  its.forEach((item, i) => {
    item.style.width = widths[i].width + 'px';
    item.style.height = widths[i].height + 'px';
  });
  trk.style.transform = `translate3d(${-offset}px, 0, 0)`;
  // Start fading as soon as a new photo detent is selected.
  if (target !== cur) setI(target);
  return moving;
}

const gal=$('.gal'),duo=$('.duo'),pi=[[gal,'.w',-.05],[gal,'.a',.07],[gal,'.s',.1],[gal,'.f',-.06],[gal,'.m',-.08],[gal,'.t',.03],[duo,'.p2',.03],[duo,'.por',-.05]].map(([c,q,s])=>[c,c.querySelector(q),s]);
const sf=$('.sunf'),si=sf.firstElementChild;
function par(){const sm=innerWidth<760;{const r=sf.getBoundingClientRect(),t=Math.max(0,Math.min(1,(innerHeight-r.top)/(innerHeight+r.height)));si.style.transform='translateY('+(-(12+12*t))+'%)'}pi.forEach(([c,el,s])=>{const r=c.getBoundingClientRect(),d=Math.max(-600,Math.min(600,innerHeight/2-(r.top+r.height/2)));el.style.translate=sm?'':'0 '+d*s+'px'})}
const io2=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io2.unobserve(e.target)}}),{threshold:.12});
$$('.gal>img,.gal>.t,.por,.p2').forEach(el=>{el.classList.add('rv');io2.observe(el)});
$$('.qm,blockquote').forEach((el,i)=>{el.classList.add('qf');el.style.transitionDelay=i*.2+'s';io2.observe(el)});
// Scroll events only request work; one frame drives all scroll effects.
function requestUpdate() {
  if (!frame) frame = requestAnimationFrame(update);
}
function update(time) {
  frame = 0;
  const sectionTop = sec.getBoundingClientRect().top;
  // Read surrounding page geometry before changing exhibition dimensions.
  par();
  stk();
  if (lay(time, sectionTop)) requestUpdate();
  else lastTime = 0;
}
addEventListener('scroll', requestUpdate, { passive: true });
addEventListener('resize', () => {
  measureExhibition();
  requestUpdate();
});
measureExhibition();
requestUpdate();
function sg(){const s=$('.sign'),fs=parseFloat(getComputedStyle(s).fontSize),m=document.createElement('canvas').getContext('2d');m.font='300 '+fs+'px "Valley Sans"';const t=m.measureText('ISAMU NOGUCHI'),A=t.fontBoundingBoxAscent,D=t.fontBoundingBoxDescent;if(A)s.style.marginBottom=-((fs-(A+D))/2+D)+'px'}
document.fonts.ready.then(sg);addEventListener('resize',sg);
