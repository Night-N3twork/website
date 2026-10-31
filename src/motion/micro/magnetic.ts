import gsap from 'gsap';

const MAGNET = { pull: 0.22, max: 8 };
const clamp = gsap.utils.clamp(-MAGNET.max, MAGNET.max);

const percent = (offset: number, size: number): string => `${((offset / size) * 100).toFixed(1)}%`;

export function magnetic(main: HTMLElement, signal: AbortSignal): void {
  main.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    const pos = { x: 0, y: 0 };
    const apply = (): void => void (el.style.translate = `${pos.x.toFixed(2)}px ${pos.y.toFixed(2)}px`);
    const toX = gsap.quickTo(pos, 'x', { duration: 0.5, ease: 'power3', onUpdate: apply });
    const toY = gsap.quickTo(pos, 'y', { duration: 0.5, ease: 'power3', onUpdate: apply });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      toX(clamp((e.clientX - r.left - r.width / 2) * MAGNET.pull));
      toY(clamp((e.clientY - r.top - r.height / 2) * MAGNET.pull));
      el.style.setProperty('--mx', percent(e.clientX - r.left, r.width));
      el.style.setProperty('--my', percent(e.clientY - r.top, r.height));
    }, { signal });
    el.addEventListener('pointerleave', () => {
      toX(0);
      toY(0);
    }, { signal });
  });
}
