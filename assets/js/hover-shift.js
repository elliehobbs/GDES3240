// Works and exhibitions pages: an image drifts a few pixels toward the mouse as it moves over it.
// Sets --mx/--my (-1 to 1, from the image's centre) on the image; the CSS turns them into a small shift.
// Delegated from the document so it keeps working when the masonry rebuilds the grid.
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !matchMedia('(hover: hover)').matches) return;
  let current = null;
  const reset = img => { img.style.removeProperty('--mx'); img.style.removeProperty('--my'); };
  document.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    const img = e.target.closest && e.target.closest('.wk') ? e.target.closest('.wk').querySelector('img') : null;
    if (current && current !== img) reset(current);
    current = img;
    if (!img) return;
    const r = img.getBoundingClientRect();
    img.style.setProperty('--mx', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
    img.style.setProperty('--my', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
  });
  document.addEventListener('pointerleave', () => { if (current) { reset(current); current = null; } });
})();
