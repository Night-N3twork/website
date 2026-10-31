import gsap from 'gsap';

const LINKS = 'a, button, [role=tab]';

export function trackCursor(): void {
  const el = document.querySelector<HTMLElement>('.cursor');
  if (!el) return;
  const toX = gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3' });
  const toY = gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3' });
  let placed = false;
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    if (!placed) {
      toX(e.clientX, e.clientX);
      toY(e.clientY, e.clientY);
      placed = true;
    }
    toX(e.clientX);
    toY(e.clientY);
    el.classList.add('is-on');
    document.body.dataset.cursor = (e.target as Element | null)?.closest?.(LINKS) ? 'link' : '';
  }, { passive: true });
  addEventListener('pointerdown', () => el.classList.add('is-down'));
  addEventListener('pointerup', () => el.classList.remove('is-down'));
  document.documentElement.addEventListener('pointerleave', () => el.classList.remove('is-on'));
}
