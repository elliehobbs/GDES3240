// Contact page: hero video, staggered reveals and the footer signature.
// It has its own script because main.js expects home-page elements.
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

// Hero video: hold on the first frame for reduced-motion users (same as the home page).
const heroVideo = $('#hv');
if (heroVideo && reducedMotion.matches) { heroVideo.removeAttribute('autoplay'); heroVideo.pause(); }

// The title and each contact column rise in, one after another.
const revealObserver = new IntersectionObserver((entries, observer) => entries.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); observer.unobserve(e.target); }
}), { threshold: .12 });
$$('.cs>*').forEach((el, i) => {
  el.classList.add('rv');
  el.style.transitionDelay = (i ? (i - 1) * .12 + .15 : 0) + 's';
  revealObserver.observe(el);
});

function sg(){const s=$('.sign'),fs=parseFloat(getComputedStyle(s).fontSize),m=document.createElement('canvas').getContext('2d');m.font='300 '+fs+'px "Valley Sans"';const t=m.measureText('ISAMU NOGUCHI'),A=t.fontBoundingBoxAscent,D=t.fontBoundingBoxDescent;if(A)s.style.marginBottom=-((fs-(A+D))/2+D)+'px'}
document.fonts.ready.then(sg);addEventListener('resize',sg);
