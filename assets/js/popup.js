// Work pop-ups, shared by the home and works pages.
// Any element with data-work="name" opens the <dialog id="wm-name">. The X,
// Escape and a click on the backdrop all close it.
document.querySelectorAll('[data-work]').forEach(trigger => {
  const dlg = document.getElementById('wm-' + trigger.dataset.work);
  if (!dlg) return;
  const open = () => { dlg.showModal(); dlg.scrollTop = 0; };
  trigger.addEventListener('click', open);
  // Non-button triggers (the home page image) need keyboard support too.
  if (trigger.tagName !== 'BUTTON') trigger.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
  });
  dlg.querySelector('[data-close]').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
});
