import gsap from 'gsap';

const TILT = { max: 8, follow: 0.16, settle: 0.06, glare: 0.32, rest: 0.005 };

function tiltCard(wrap: HTMLElement, card: HTMLElement, signal: AbortSignal): void {
  const setX = gsap.quickSetter(card, 'rotationX', 'deg') as (value: number) => void;
  const setY = gsap.quickSetter(card, 'rotationY', 'deg') as (value: number) => void;
  const s = { tx: 0, ty: 0, x: 0, y: 0, k: TILT.follow };
  gsap.set(card, { transformPerspective: 1000 });
  wrap.addEventListener('pointermove', (e) => {
    const r = wrap.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    Object.assign(s, { tx: (0.5 - py) * 2 * TILT.max, ty: (px - 0.5) * 2 * TILT.max, k: TILT.follow });
    card.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`);
    card.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
    card.style.setProperty('--go', String(TILT.glare));
  }, { signal });
  wrap.addEventListener('pointerleave', () => {
    Object.assign(s, { tx: 0, ty: 0, k: TILT.settle });
    card.style.setProperty('--go', '0');
  }, { signal });
  const follow = (): void => {
    if (Math.abs(s.tx - s.x) + Math.abs(s.ty - s.y) < TILT.rest) return;
    s.x += (s.tx - s.x) * s.k;
    s.y += (s.ty - s.y) * s.k;
    setX(s.x);
    setY(s.y);
  };
  gsap.ticker.add(follow);
  signal.addEventListener('abort', () => gsap.ticker.remove(follow), { once: true });
}

export function tilt(main: HTMLElement, signal: AbortSignal): void {
  main.querySelectorAll<HTMLElement>('.tilt').forEach((wrap) => {
    const card = wrap.querySelector<HTMLElement>('.tilt-card');
    if (card) tiltCard(wrap, card, signal);
  });
}
