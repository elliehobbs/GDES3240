const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
/* Edit exhibition details here: [title, location, year] — one per image, in order */
const EX=[['Landscapes of Time','Williamstown, MA','2025'],['Isamu Noguchi: I am not a designer','Atlanta, GA','2026'],['In Situ','Hong Kong','2024'],['Isamu Noguchi: A New Nature','London','2022']];
const sn=$('#sent'),nv=$('#nav');function stk(){nv.classList.toggle('stuck',sn.getBoundingClientRect().top<-.5)}stk();
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.5});
$$('.lines,.wavy').forEach(l=>io.observe(l));
const view = $('.exv'), trk = $('#trk');
const src = [...trk.children], n = src.length, inf = $('#info');
// Three copies of the set give the loop enough cards to fill both sides.
const POOL = 3 * n;
for (let copy = 1; copy < 3; copy++) src.forEach(item => {
  const clone = item.cloneNode(true);
  clone.setAttribute('aria-hidden', 'true');
  clone.querySelector('img').alt = '';
  trk.appendChild(clone);
});
const its = [...trk.children];
// Each slot holds one card; slots run from -LEFT to POOL-LEFT-1 around the active card.
const LEFT = 2;
let cur = 0, target = 0, progress = 0, frame = 0, lastTime = 0, infoTimer;
let dimensions, drag = null, wheelSum = 0, wheelLock = 0;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
// Hero video: hold on the first frame for reduced-motion users.
const heroVideo = $('#hv');
if (heroVideo && reducedMotion.matches) { heroVideo.removeAttribute('autoplay'); heroVideo.pause(); }
const mod = (a, b) => ((a % b) + b) % b;

function setI(index) {
  cur = index;
  clearTimeout(infoTimer);
  $('#exc').textContent = String(index + 1).padStart(2, '0');
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
    margin, gap, large, thumb,
    largeHeight: large / 1.42,
    thumbHeight: thumb * 1.35,
    // Dragging this far moves one card.
    step: (large + thumb) / 2 + gap
  };
  view.style.height = dimensions.largeHeight + 'px';
}

// Move the carousel by whole cards; the loop has no ends.
function go(delta) {
  target = Math.round(target) + delta;
  requestUpdate();
}

function lay(time) {
  const { margin, gap, large, thumb, largeHeight, thumbHeight } = dimensions;
  const elapsed = lastTime ? Math.min(64, time - lastTime) : 16;
  lastTime = time;
  if (drag || reducedMotion.matches) progress = target;
  else progress += (target - progress) * (1 - Math.exp(-elapsed / 140));
  const moving = !drag && Math.abs(target - progress) > .0001;
  if (!moving && !drag) progress = target;

  const base = Math.floor(progress), fraction = progress - base;
  const size = slot => {
    const active = Math.max(0, 1 - Math.abs(slot - fraction));
    return { active, width: thumb + active * (large - thumb),
             height: thumbHeight + active * (largeHeight - thumbHeight) };
  };
  // Lay slots outward from the card at `base`, following each real width.
  const lefts = {}, sizes = {};
  for (let slot = -LEFT; slot < POOL - LEFT; slot++) sizes[slot] = size(slot);
  lefts[0] = margin - fraction * (sizes[0].width + gap);
  for (let slot = 1; slot < POOL - LEFT; slot++) lefts[slot] = lefts[slot - 1] + sizes[slot - 1].width + gap;
  for (let slot = -1; slot >= -LEFT; slot--) lefts[slot] = lefts[slot + 1] - sizes[slot].width - gap;
  for (let slot = -LEFT; slot < POOL - LEFT; slot++) {
    const item = its[mod(base + slot, POOL)], { active, width, height } = sizes[slot];
    item.style.width = width + 'px';
    item.style.height = height + 'px';
    item.style.transform = `translate3d(${lefts[slot]}px, 0, 0)`;
    // Thumbnails sit slightly zoomed and dimmed, then settle as they grow.
    item.style.setProperty('--a', active.toFixed(4));
    item.classList.toggle('on', slot - fraction === 0);
  }
  const index = mod(Math.round(drag ? progress : target), n);
  if (index !== cur) setI(index);
  return moving;
}

// Pointer drag: follows the finger, then snaps with a little flick bias.
view.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  drag = { x: e.clientX, y: e.clientY, start: progress, last: e.clientX, time: e.timeStamp, v: 0, moved: false, id: e.pointerId };
  target = progress;
});
view.addEventListener('pointermove', e => {
  if (!drag || e.pointerId !== drag.id) return;
  const dx = e.clientX - drag.x;
  if (!drag.moved) {
    // Let vertical swipes keep scrolling the page.
    if (Math.abs(e.clientY - drag.y) > Math.abs(dx) && Math.abs(e.clientY - drag.y) > 6) { drag = null; go(0); return; }
    if (Math.abs(dx) < 6) return;
    drag.moved = true;
    try { view.setPointerCapture(e.pointerId); } catch (err) {}
    view.classList.add('dragging');
  }
  const dt = Math.max(1, e.timeStamp - drag.time);
  drag.v = (e.clientX - drag.last) / dt;
  drag.last = e.clientX; drag.time = e.timeStamp;
  target = drag.start - dx / dimensions.step;
  requestUpdate();
});
function endDrag(e) {
  if (!drag || (e && e.pointerId !== drag.id)) return;
  const { moved, start, v } = drag;
  drag = null;
  view.classList.remove('dragging');
  if (!moved) {
    // A tap on a neighbouring card brings it forward.
    const hit = e && e.target.closest && e.target.closest('.it');
    if (hit && !hit.classList.contains('on')) {
      const slot = its.indexOf(hit), here = mod(Math.round(progress), POOL);
      let delta = mod(slot - here, POOL);
      if (delta > POOL / 2) delta -= POOL;
      go(delta);
    } else go(0);
    return;
  }
  // A quick flick advances even if the drag was short.
  let next = Math.round(target);
  if (next === Math.round(start) && (Math.abs(target - start) > .12 || Math.abs(v) > .3)) next += target > start ? 1 : -1;
  target = next;
  requestUpdate();
}
view.addEventListener('pointerup', endDrag);
view.addEventListener('pointercancel', endDrag);
view.addEventListener('dragstart', e => e.preventDefault());
// Trackpad side swipes: one card per gesture.
view.addEventListener('wheel', e => {
  if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
  e.preventDefault();
  if (e.timeStamp < wheelLock) return;
  wheelSum += e.deltaX;
  if (Math.abs(wheelSum) > 40) {
    go(Math.sign(wheelSum));
    wheelSum = 0;
    wheelLock = e.timeStamp + 450;
  }
}, { passive: false });
view.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
});
$('#exn').addEventListener('click', () => go(1));
$('#exp').addEventListener('click', () => go(-1));
$('#ext').textContent = String(n).padStart(2, '0');

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
  // Read surrounding page geometry before changing exhibition dimensions.
  par();
  stk();
  if (lay(time)) requestUpdate();
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

/* ---- Elastic lines (hero panel and the two line CTAs) ----
   Each hand-drawn path is sampled into points and redrawn every frame while hovered. The lines bow toward the cursor
   like pulled strings and settle back on leave. Per-element data attributes tune the feel:
   data-motion = per-line motion scale (0 = static), data-damp / data-stiff = spring, data-pull = how far lines follow. */
const ELASTIC={pull:.5,reach:16,stagger:.05,stiff:230,damp:6.5,pts:56};
$$('.elastic').forEach(cta=>{
  const svg=cta.querySelector('.ln'),paths=[...cta.querySelectorAll('.ln path')];
  paths.forEach((p,i)=>p.style.setProperty('--i',i));
  const vb=svg.viewBox.baseVal;
  const base=paths.map(p=>{
    const L=p.getTotalLength(),a=[];
    for(let k=0;k<=ELASTIC.pts;k++){const q=p.getPointAtLength(L*k/ELASTIC.pts);a.push([q.x,q.y])}
    return a;
  });
  const ym=base.map((pts,i)=>pts.reduce((s,q)=>s+q[1],0)/pts.length+parseFloat(paths[i].dataset.dy||0)); // data-dy: lines nudged by a transform in the markup
  const motion=(cta.dataset.motion||'').split(',').map(parseFloat);
  const mf=i=>Number.isFinite(motion[i])?motion[i]:1;
  const damp=parseFloat(cta.dataset.damp)||ELASTIC.damp,stiff=parseFloat(cta.dataset.stiff)||ELASTIC.stiff,pull=parseFloat(cta.dataset.pull)||ELASTIC.pull;
  const orig=paths.map(p=>p.getAttribute('d'));
  const S=paths.map(()=>({s:0,vs:0,b:0,vb:0}));
  let hover=false,py=vb.y+vb.height/2,pu=.5,raf=0,last=0,t0=0;
  const draw=()=>{
    let rest=!hover;
    paths.forEach((p,i)=>{
      const st=S[i];
      if(Math.abs(st.s)>.002||Math.abs(st.b)>.01||Math.abs(st.vs)>.002||Math.abs(st.vb)>.01)rest=false;
      const o=base[i].map(([x,y],k)=>{
        const u=k/ELASTIC.pts;
        return [x,y+st.b*Math.sin(Math.PI*u)*Math.exp(-(((u-pu)/.5)**2))*1.6];
      });
      let d='M'+o[0][0].toFixed(2)+','+o[0][1].toFixed(2);
      for(let k=1;k<o.length-1;k++)d+='Q'+o[k][0].toFixed(2)+','+o[k][1].toFixed(2)+' '+((o[k][0]+o[k+1][0])/2).toFixed(2)+','+((o[k][1]+o[k+1][1])/2).toFixed(2);
      const e=o[o.length-1];p.setAttribute('d',d+'L'+e[0].toFixed(2)+','+e[1].toFixed(2));
    });
    return rest;
  };
  const tick=now=>{
    const dt=Math.min(.033,(now-last)/1000||0);last=now;
    const el=(now-t0)/1000;
    S.forEach((st,i)=>{
      const live=hover&&el>=i*ELASTIC.stagger;
      const near=Math.exp(-(((py-ym[i])/ELASTIC.reach)**2));
      const sT=live?1:0,bT=live?(py-ym[i])*pull*near*mf(i):0;
      st.vs+=((sT-st.s)*stiff-st.vs*damp)*dt;st.s+=st.vs*dt;
      st.vb+=((bT-st.b)*stiff*.7-st.vb*damp)*dt;st.b+=st.vb*dt;
    });
    if(draw()){paths.forEach((p,i)=>p.setAttribute('d',orig[i]));S.forEach(s=>{s.s=s.vs=s.b=s.vb=0});raf=0}
    else raf=requestAnimationFrame(tick);
  };
  const wake=()=>{if(!raf){last=performance.now();raf=requestAnimationFrame(tick)}};
  const move=e=>{
    const r=svg.getBoundingClientRect();
    py=vb.y+(e.clientY-r.top)/r.height*vb.height;
    pu=Math.min(1,Math.max(0,(e.clientX-r.left)/r.width));
  };
  const enter=e=>{
    if(reducedMotion.matches||!cta.classList.contains('in'))return;
    if(e&&e.clientX!=null)move(e);
    hover=true;t0=performance.now();wake();
  };
  const leave=()=>{hover=false;wake()};
  if(matchMedia('(hover:hover)').matches){
    cta.addEventListener('pointerenter',enter);
    cta.addEventListener('pointermove',e=>{if(hover)move(e)});
    cta.addEventListener('pointerleave',leave);
  }
  cta.addEventListener('focus',()=>{py=vb.y+vb.height/2;pu=.5;enter()});
  cta.addEventListener('blur',leave);
});
