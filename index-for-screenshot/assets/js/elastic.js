/* Elastic line comps for contact.html: the hero panel's hand-drawn lines reveal from the right and bow toward the
   cursor on hover. This is the same code as the "Elastic lines" block at the end of main.js (index.html), kept
   separate because contact.html doesn't load main.js. It brings its own reveal observer and helpers. */
const still=matchMedia('(prefers-reduced-motion: reduce)');
const wavyIO=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');wavyIO.unobserve(e.target)}}),{threshold:.5});
document.querySelectorAll('.wavy').forEach(l=>wavyIO.observe(l));

/* Each hand-drawn path is sampled into points and redrawn every frame while hovered. The lines bow toward the cursor
   like pulled strings and settle back on leave. Per-element data attributes tune the feel:
   data-motion = per-line motion scale (0 = static), data-damp / data-stiff = spring, data-pull = how far lines follow. */
const ELASTIC={pull:.5,reach:16,stagger:.05,stiff:230,damp:6.5,pts:56};
document.querySelectorAll('.elastic').forEach(cta=>{
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
  cta.addEventListener('focusin',()=>{py=vb.y+vb.height/2;pu=.5;enter()});
  cta.addEventListener('focusout',leave);
});
