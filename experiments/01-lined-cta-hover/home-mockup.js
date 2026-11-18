/* Experiment 01 home mockup: reveal + elastic behaviour for Variant F. Loaded after main.js. */
const wio=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');wio.unobserve(e.target)}}),{threshold:.5});
document.querySelectorAll('.wavy').forEach(l=>wio.observe(l));

/* ---- Variant B: elastic lines ----
   Rubber-band feel, no traveling wave. On hover each line (staggered) stretches leftward from
   its pinned right end and bows toward the cursor like a pulled string. On leave the springs are
   underdamped, so everything overshoots and snaps back to the drawn shape.
   Tweak these to change the feel: */
const ELASTIC={
  stretch:0,     // horizontal reach (fraction of line length); 0 = lines stay put horizontally
  pull:.5,       // how much the nearest lines bow toward the cursor (0-1 of the distance)
  reach:16,      // how far (svg units) from the cursor a line still feels the pull
  stagger:.05,   // delay between lines starting to stretch (seconds)
  stiff:230,     // spring stiffness (higher = snappier)
  damp:6.5,      // spring damping (lower = more elastic wobble)
  pts:56
};
document.querySelectorAll('.elastic').forEach(cta=>{
  const svg=cta.querySelector('.wl'),paths=[...cta.querySelectorAll('.wl path')];
  paths.forEach((p,i)=>p.style.setProperty('--i',i));
  const vb=svg.viewBox.baseVal;
  const base=paths.map(p=>{
    const L=p.getTotalLength(),a=[];
    for(let k=0;k<=ELASTIC.pts;k++){const q=p.getPointAtLength(L*k/ELASTIC.pts);a.push([q.x,q.y])}
    return a;
  });
  const xr=Math.max(...base.flat().map(q=>q[0]));          // shared right edge, stays pinned
  const dys=paths.map(p=>parseFloat(p.dataset.dy||0));      // lines nudged down by the markup (variant C)
  const ym=base.map((pts,i)=>pts.reduce((s,q)=>s+q[1],0)/pts.length+dys[i]);
  const motion=(cta.dataset.motion||'').split(',').map(parseFloat); // per-line motion scale, default 1
  const mf=i=>Number.isFinite(motion[i])?motion[i]:1;
  const damp=parseFloat(cta.dataset.damp)||ELASTIC.damp;     // per-CTA override: higher = less bouncy
  const stiff=parseFloat(cta.dataset.stiff)||ELASTIC.stiff;
  const pull=parseFloat(cta.dataset.pull)||ELASTIC.pull;     // per-CTA override: how far lines follow the cursor
  const orig=paths.map(p=>p.getAttribute('d'));
  const still=matchMedia('(prefers-reduced-motion:reduce)');
  const S=paths.map(()=>({s:0,vs:0,b:0,vb:0,on:0}));       // per-line stretch + bow springs
  let hover=false,py=vb.y+vb.height/2,pu=.5,raf=0,last=0,t0=0;
  const draw=()=>{
    let rest=!hover;
    paths.forEach((p,i)=>{
      const st=S[i];
      if(Math.abs(st.s)>.002||Math.abs(st.b)>.01||Math.abs(st.vs)>.002||Math.abs(st.vb)>.01)rest=false;
      const o=base[i].map(([x,y],k)=>{
        const u=k/ELASTIC.pts;
        const bump=Math.sin(Math.PI*u)*Math.exp(-(((u-pu)/.5)**2)); // bow peaks near the cursor
        return [xr-(xr-x)*(1+ELASTIC.stretch*st.s), y+st.b*bump*1.6];
      });
      let d='M'+o[0][0].toFixed(2)+','+o[0][1].toFixed(2);
      for(let k=1;k<o.length-1;k++){
        const mx=(o[k][0]+o[k+1][0])/2,my=(o[k][1]+o[k+1][1])/2;
        d+='Q'+o[k][0].toFixed(2)+','+o[k][1].toFixed(2)+' '+mx.toFixed(2)+','+my.toFixed(2);
      }
      const e=o[o.length-1];d+='L'+e[0].toFixed(2)+','+e[1].toFixed(2);
      p.setAttribute('d',d);
    });
    return rest;
  };
  const tick=now=>{
    const dt=Math.min(.033,(now-last)/1000||0);last=now;
    const el=(now-t0)/1000;
    S.forEach((st,i)=>{
      const live=hover&&el>=i*ELASTIC.stagger;
      const near=Math.exp(-(((py-ym[i])/ELASTIC.reach)**2));
      const sT=live?1:0, bT=live?(py-ym[i])*pull*near*mf(i):0;
      st.vs+=((sT-st.s)*stiff-st.vs*damp)*dt;st.s+=st.vs*dt;
      st.vb+=((bT-st.b)*stiff*.7-st.vb*damp)*dt;st.b+=st.vb*dt;
    });
    const rest=draw();
    if(rest){paths.forEach((p,i)=>p.setAttribute('d',orig[i]));S.forEach(s=>{s.s=s.vs=s.b=s.vb=0});raf=0}
    else raf=requestAnimationFrame(tick);
  };
  const wake=()=>{if(!raf){last=performance.now();raf=requestAnimationFrame(tick)}};
  const move=e=>{
    const r=svg.getBoundingClientRect();
    py=vb.y+(e.clientY-r.top)/r.height*vb.height;
    pu=Math.min(1,Math.max(0,(e.clientX-r.left)/r.width));
  };
  const enter=e=>{
    if(still.matches||!cta.classList.contains('in'))return;
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
